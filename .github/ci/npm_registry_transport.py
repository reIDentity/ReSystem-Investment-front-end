"""Ephemeral loopback transport for public npm audits, never a registry/security waiver.

Only public advisory POSTs and package-metadata GETs may leave this adapter.
The upstream is fixed HTTPS with normal certificate validation. curl HTTP/1.1
provides bounded, length-delimited requests when npm's streamed request hangs.
No client authorization, cookies, config files or upstream raw errors are passed.
"""
import contextlib
import http.server
import json
from pathlib import Path
import re
import socket
import subprocess
import tempfile
import threading
import zlib

UPSTREAM = 'https://registry.npmjs.org'
BULK = '/-/npm/v1/security/advisories/bulk'
MAX_REQUEST = 1024 * 1024
MAX_RESPONSE = 32 * 1024 * 1024
PACKAGE = re.compile(r'^/(?:@[a-z0-9._~-]+(?:/|%2[fF]))?[a-z0-9._~-]+$')


def decompress_bounded(body, limit):
    if body.startswith(b'\x1f\x8b'):
        decoder = zlib.decompressobj(16 + zlib.MAX_WBITS)
        body = decoder.decompress(body, limit + 1)
        if len(body) > limit or not decoder.eof or decoder.unconsumed_tail or decoder.unused_data:
            raise ValueError('Invalid or oversized compressed registry data')
    if len(body) > limit:
        raise ValueError('Registry data exceeds bound')
    return body


def public_path(method, path):
    return method == 'POST' and path == BULK or method == 'GET' and bool(PACKAGE.fullmatch(path)) and '..' not in path


def read_request(stream, headers):
    encoding = headers.get('Transfer-Encoding', '').lower()
    if encoding:
        if encoding != 'chunked' or headers.get('Content-Length') is not None:
            raise ValueError('Unsupported request framing')
        chunks, size = [], 0
        for _ in range(10000):
            line = stream.readline(128)
            if not re.fullmatch(rb'[0-9a-fA-F]{1,8}\r\n', line):
                raise ValueError('Invalid chunk framing')
            length = int(line[:-2], 16)
            if length == 0:
                if stream.readline(3) != b'\r\n':
                    raise ValueError('Trailers are unsupported')
                return b''.join(chunks)
            size += length
            if size > MAX_REQUEST:
                raise ValueError('Request exceeds bound')
            chunk = stream.read(length)
            if len(chunk) != length or stream.read(2) != b'\r\n':
                raise ValueError('Incomplete request')
            chunks.append(chunk)
        raise ValueError('Excessive request chunks')
    length = headers.get('Content-Length', '')
    if not re.fullmatch(r'[0-9]{1,8}', length) or int(length) > MAX_REQUEST:
        raise ValueError('Invalid request length')
    body = stream.read(int(length))
    if len(body) != int(length):
        raise ValueError('Incomplete request')
    return body


def upstream_read(method, path, body=b''):
    if not public_path(method, path):
        raise ValueError('Public registry route rejected')
    # No shell; URL paths are validated and curl config files/redirects disabled.
    with tempfile.TemporaryDirectory(prefix='resystem-audit-http-') as tmp:
        request = Path(tmp) / 'request'
        response_headers = Path(tmp) / 'response.headers'
        request.write_bytes(body)
        args = ['curl', '--disable', '--http1.1', '--proto', '=https', '--proto-redir', '=https',
                '--max-redirs', '0', '--connect-timeout', '5', '--max-time', '15',
                '--silent', '--show-error', '--request', method,
                '--header', 'Accept: application/json', '--header', 'Accept-Encoding: identity',
                '--dump-header', str(response_headers)]
        if method == 'POST':
            args += ['--header', 'Content-Type: application/json', '--data-binary', '@' + str(request)]
        args.append(UPSTREAM + path)
        with tempfile.TemporaryFile() as errors:
            process = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=errors)
            try:
                data = process.stdout.read(MAX_RESPONSE + 1)
                if len(data) > MAX_RESPONSE:
                    raise ValueError('Registry response exceeds bound')
                code = process.wait(timeout=20)
            finally:
                if process.poll() is None:
                    process.kill()
                process.wait()
                process.stdout.close()
        headers = response_headers.read_text(errors='replace') if response_headers.exists() else ''
        statuses = re.findall(r'^HTTP/\S+ ([0-9]{3})', headers, re.M)
        if code != 0 or not statuses or statuses[-1] != '200':
            raise ValueError('Verified HTTPS registry read unavailable')
        data = decompress_bounded(data, MAX_RESPONSE)
        if not isinstance(json.loads(data), dict):
            raise ValueError('Invalid registry response')
        return data


class PublicAuditHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # Registry bodies, request values and raw upstream errors never enter logs.

    def handle_read(self):
        self.connection.settimeout(20)
        try:
            if not public_path(self.command, self.path):
                self.send_error(404)
                return
            body = read_request(self.rfile, self.headers) if self.command == 'POST' else b''
            if self.command == 'POST':
                body = decompress_bounded(body, MAX_REQUEST)
                payload = json.loads(body)
                if not isinstance(payload, dict) or not all(isinstance(k, str) and isinstance(v, list) and all(isinstance(version, str) for version in v) for k, v in payload.items()):
                    raise ValueError('Invalid public dependency inventory')
            data = upstream_read(self.command, self.path, body)
            status = 200
        except (OSError, ValueError, RecursionError, subprocess.SubprocessError, zlib.error):
            data, status = b'{"error":"Verified public registry read unavailable"}', 502
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Connection', 'close')
        self.end_headers()
        self.close_connection = True
        try:
            self.wfile.write(data)
        except (OSError, socket.timeout):
            pass

    do_GET = handle_read
    do_POST = handle_read


@contextlib.contextmanager
def audit_registry_transport():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), PublicAuditHandler)
    server.daemon_threads = True
    worker = threading.Thread(target=server.serve_forever, daemon=True)
    worker.start()
    try:
        yield f'http://127.0.0.1:{server.server_address[1]}/'
    finally:
        server.shutdown()
        server.server_close()
        worker.join(timeout=5)
