"""Manual, local-only static fixture server. Never starts when imported."""
import argparse
import hashlib
import json
import os
from functools import partial
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


class PreviewHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, directory, manifest, **kwargs):
        self.directory = directory
        self.files = {item['path']: item for item in manifest['files']}
        super().__init__(*args, **kwargs)

    def log_message(self, *_args):
        pass

    def do_GET(self):
        self.serve_file(include_body=True)

    def do_HEAD(self):
        self.serve_file(include_body=False)

    def serve_file(self, include_body):
        if self.headers.get('Host') != f'127.0.0.1:{self.server.server_port}':
            self.send_error(421)
            return
        name = unquote(urlsplit(self.path).path).lstrip('/') or 'index.html'
        if name not in self.files:
            self.send_error(404)
            return
        entry = self.files[name]
        target = (self.directory / name).resolve()
        if not target.is_relative_to(self.directory) or not target.is_file():
            self.send_error(404)
            return
        body = target.read_bytes()
        if hashlib.sha256(body).hexdigest() != entry['sha256']:
            self.send_error(409, 'Regenerate the local fixture preview')
            return
        types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'}
        self.send_response(200)
        self.send_header('Content-Type', types[target.suffix])
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Content-Security-Policy', "default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'")
        self.end_headers()
        if include_body:
            self.wfile.write(body)

    def do_POST(self):
        self.send_error(405)

    do_PUT = do_POST
    do_PATCH = do_POST
    do_DELETE = do_POST


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', required=True, type=Path)
    parser.add_argument('--port', type=int, default=3352)
    options = parser.parse_args()
    directory = options.directory.resolve()
    manifest = json.loads((directory / 'manifest.json').read_text())
    if manifest['owner'] != 'RSI-082 local static fixture preview':
        raise SystemExit('This is not the task-owned fixture directory')
    pid_path = directory / 'preview.pid'
    if pid_path.exists():
        raise SystemExit('Existing preview PID marker: inspect ownership before starting; no process was killed')
    server = ThreadingHTTPServer(('127.0.0.1', options.port), partial(PreviewHandler, directory=directory, manifest=manifest))
    pid_path.write_text(str(os.getpid()) + '\n')
    pid_path.chmod(0o600)
    print(f'LOCAL SYNTHETIC FIXTURES ONLY: http://127.0.0.1:{options.port}/ — PID {os.getpid()}; Ctrl-C stops this owned server', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        if pid_path.exists() and pid_path.read_text().strip() == str(os.getpid()):
            pid_path.unlink()


if __name__ == '__main__':
    main()
