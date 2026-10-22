import gzip
import http.client
import io
import json
from pathlib import Path
import socket
import zlib
import sys
import unittest
from unittest.mock import patch
from urllib.parse import urlsplit

sys.path.insert(0, str(Path(__file__).parent))
import npm_registry_transport as transport


class AuditTransport(unittest.TestCase):
    def test_only_public_advisories_and_metadata_paths_are_allowed(self):
        for path in ['/braces', '/@next/eslint-plugin-next', '/@next%2feslint-plugin-next']:
            self.assertTrue(transport.public_path('GET', path))
        self.assertTrue(transport.public_path('POST', transport.BULK))
        for method, path in [('POST', '/-/npm/v1/tokens'), ('GET', '/-/npm/v1/tokens'),
                             ('GET', '//other.example/'), ('GET', '/%2e%2e'),
                             ('GET', '/@scope/../token'), ('GET', '/braces?token=private'),
                             ('CONNECT', '/braces'), ('DELETE', '/braces')]:
            self.assertFalse(transport.public_path(method, path))

    def test_decoding_preserves_exact_payload_and_rejects_bombs_and_trailing_members(self):
        original = b'{"braces":[{"severity":"high"}]}'
        self.assertEqual(transport.decompress_bounded(gzip.compress(original), 1000), original)
        self.assertEqual(transport.decompress_bounded(original, 1000), original)
        for data in [gzip.compress(b'x' * 1001), gzip.compress(original)[:-2],
                     gzip.compress(original) + gzip.compress(original), b'x' * 1001]:
            with self.assertRaises((ValueError, zlib.error)):
                transport.decompress_bounded(data, 1000)

    def test_request_framing_is_complete_and_bounded(self):
        body = b'{"a":1}'
        self.assertEqual(transport.read_request(io.BytesIO(body), {'Content-Length': str(len(body))}), body)
        self.assertEqual(transport.read_request(io.BytesIO(b'3\r\nabc\r\n2\r\nde\r\n0\r\n\r\n'), {'Transfer-Encoding': 'chunked'}), b'abcde')
        for body, headers in [(b'', {'Content-Length': str(transport.MAX_REQUEST + 1)}),
                              (b'abc', {'Content-Length': '9'}),
                              (b'3\r\nabc\r\n0\r\nAuth: no\r\n\r\n', {'Transfer-Encoding': 'chunked'}),
                              (b'', {'Transfer-Encoding': 'chunked', 'Content-Length': '0'}),
                              (b'FFFFFF\r\n', {'Transfer-Encoding': 'chunked'})]:
            with self.assertRaises(ValueError):
                transport.read_request(io.BytesIO(body), headers)

    def test_loopback_server_passes_no_credentials_and_closes_on_exit(self):
        expected = b'{"braces":[{"severity":"high"}]}'
        with patch.object(transport, 'upstream_read', return_value=expected) as upstream:
            with transport.audit_registry_transport() as registry:
                parsed = urlsplit(registry)
                self.assertEqual(parsed.hostname, '127.0.0.1')
                connection = http.client.HTTPConnection(parsed.hostname, parsed.port, timeout=3)
                body = gzip.compress(b'{"braces":["3.0.3"]}')
                connection.request('POST', transport.BULK, body=body, headers={'Content-Encoding': 'gzip', 'Authorization': 'Bearer synthetic-private', 'Cookie': 'private=synthetic'})
                response = connection.getresponse()
                self.assertEqual(response.status, 200)
                self.assertEqual(response.read(), expected)
                self.assertEqual(upstream.call_args.args, ('POST', transport.BULK, b'{"braces":["3.0.3"]}'))
                connection.close()
            with self.assertRaises(OSError):
                socket.create_connection((parsed.hostname, parsed.port), timeout=1)

    def test_upstream_failure_never_becomes_an_empty_clean_report(self):
        with patch.object(transport, 'upstream_read', side_effect=ValueError('synthetic-private-upstream-error')):
            with transport.audit_registry_transport() as registry:
                parsed = urlsplit(registry)
                connection = http.client.HTTPConnection(parsed.hostname, parsed.port, timeout=3)
                connection.request('POST', transport.BULK, body=b'{}')
                response = connection.getresponse()
                self.assertEqual(response.status, 502)
                data = response.read()
                self.assertNotIn(b'synthetic-private', data)
                self.assertNotEqual(data, b'{}')
                connection.close()

    def test_curl_uses_fixed_verified_https_http1_and_no_redirect_or_user_config(self):
        data = b'{"braces":[{"severity":"high"}]}'
        class Process:
            stdout = io.BytesIO(data)
            def wait(self, **_): return 0
            def poll(self): return 0
        def start(args, **kwargs):
            self.assertEqual(args[:3], ['curl', '--disable', '--http1.1'])
            self.assertEqual(args[-1], transport.UPSTREAM + transport.BULK)
            self.assertNotIn('--insecure', args)
            self.assertNotIn('-k', args)
            self.assertIn('--max-redirs', args)
            self.assertNotIn('Authorization', str(args))
            headers = Path(args[args.index('--dump-header') + 1])
            headers.write_text('HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n')
            return Process()
        with patch.object(transport.subprocess, 'Popen', side_effect=start):
            self.assertEqual(transport.upstream_read('POST', transport.BULK, b'{}'), data)

    def test_non_successful_https_response_is_never_treated_as_clean(self):
        class Process:
            stdout = io.BytesIO(b'{}')
            def wait(self, **_): return 0
            def poll(self): return 0
        def start(args, **kwargs):
            Path(args[args.index('--dump-header') + 1]).write_text('HTTP/1.1 503 Service Unavailable\r\n')
            return Process()
        with patch.object(transport.subprocess, 'Popen', side_effect=start):
            with self.assertRaises(ValueError):
                transport.upstream_read('POST', transport.BULK, b'{}')


if __name__ == '__main__':
    unittest.main()
