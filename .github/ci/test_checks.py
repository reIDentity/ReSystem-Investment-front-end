import sys
import datetime as dt
import importlib.util
from pathlib import Path
from contextlib import nullcontext
sys.path.insert(0, str(Path(__file__).parent))
import json
import subprocess
from unittest.mock import patch
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('checks', Path(__file__).with_name('checks.py'))
checks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checks)


class SecurityGates(unittest.TestCase):
    def setUp(self):
        self.vulns = {
            'braces': {'severity': 'high', 'nodes': ['node_modules/braces'], 'via': [{'url': 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm'}]},
            'parent': {'severity': 'high', 'nodes': ['node_modules/parent'], 'via': ['braces']},
        }
        self.lock = {'packages': {'node_modules/braces': {'version': '3.0.3', 'dev': True}, 'node_modules/parent': {'version': '1', 'dev': True}}}
        self.policy = {'npmDevExceptions': [{'advisory': 'GHSA-vfj7-8cjw-p6xm', 'package': 'braces', 'version': '3.0.3', 'expires': '2026-10-30'}]}
        self.today = dt.date(2026, 10, 16)

    def accepted(self):
        return checks.npm_exception('parent', self.vulns, self.lock, self.policy, self.today)

    def test_exact_propagated_dev_exception(self):
        self.assertTrue(self.accepted())

    def test_production_dependency_cannot_use_exception(self):
        self.lock['packages']['node_modules/parent']['dev'] = False
        self.assertFalse(self.accepted())

    def test_unrelated_advisory_cannot_inherit_exception(self):
        self.vulns['braces']['via'].append({'url': 'https://github.com/advisories/GHSA-new-new-new'})
        self.assertFalse(self.accepted())

    def test_exception_expiry_is_enforced(self):
        self.today = dt.date(2026, 10, 31)
        self.assertFalse(self.accepted())

    def test_changed_dependency_version_is_not_excepted(self):
        self.lock['packages']['node_modules/braces']['version'] = '3.0.4'
        self.assertFalse(self.accepted())

    def test_missing_dev_proof_is_not_excepted(self):
        del self.lock['packages']['node_modules/braces']['dev']
        self.assertFalse(self.accepted())

    def test_cycle_fails_closed(self):
        self.vulns['braces']['via'] = ['parent']
        with self.assertRaises(ValueError):
            self.accepted()

    def test_sanitizer_drops_sensitive_fields(self):
        raw = {'RuleID': 'test', 'File': 'x', 'StartLine': 1, 'Fingerprint': 'commit:x:test:1', 'Secret': 'private-value', 'Match': 'private-value', 'Author': 'private-person'}
        result = checks.safe_finding(raw)
        self.assertEqual(set(result), {'RuleID', 'File', 'StartLine', 'Fingerprint'})
        self.assertNotIn('private', str(result))

    def test_source_commit_must_match_checkout(self):
        with self.assertRaises(ValueError):
            checks.source_commit('a' * 40, 'b' * 40)

    def test_artifact_outside_root_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'outside'
            path.write_text('not an artifact')
            with self.assertRaises(ValueError):
                checks.file_hash(path)

    def test_audit_retry_keeps_full_findings_and_bounded_network_options(self):
        report = {'auditReportVersion': 2, 'vulnerabilities': self.vulns,
                  'metadata': {'vulnerabilities': {'total': 2}}}
        success = subprocess.CompletedProcess([], 1, json.dumps(report), '')
        with patch.object(checks, 'audit_registry_transport', return_value=nullcontext('http://127.0.0.1:34567/')), patch.object(checks, 'run', side_effect=[subprocess.TimeoutExpired([], 90), success]) as command:
            self.assertEqual(checks.audit_npm(True), report)
            self.assertEqual(command.call_count, 2)
            for call in command.call_args_list:
                self.assertIn('--omit=dev', call.args[0])
                self.assertIn('--fetch-timeout=20000', call.args[0])
                self.assertIn('--fetch-retries=1', call.args[0])
                self.assertEqual(call.kwargs['timeout'], 90)

    def test_exhausted_or_invalid_audit_never_passes(self):
        with patch.object(checks, 'audit_registry_transport', return_value=nullcontext('http://127.0.0.1:34567/')), patch.object(checks, 'run', side_effect=subprocess.TimeoutExpired([], 90)) as command:
            with self.assertRaises(subprocess.TimeoutExpired):
                checks.audit_npm(False)
            self.assertEqual(command.call_count, 2)
        for report in [{'error': {'code': 'ECONNRESET'}}, {'auditReportVersion': 2},
                       {'auditReportVersion': 2, 'vulnerabilities': {}, 'metadata': {}}]:
            with patch.object(checks, 'audit_registry_transport', return_value=nullcontext('http://127.0.0.1:34567/')), patch.object(checks, 'run', return_value=subprocess.CompletedProcess([], 1, json.dumps(report), '')):
                with self.assertRaises(ValueError):
                    checks.audit_npm(False)

    def test_valid_findings_never_trigger_a_transport_retry(self):
        report = {'auditReportVersion': 2, 'vulnerabilities': self.vulns,
                  'metadata': {'vulnerabilities': {'total': 2}}}
        with patch.object(checks, 'run', return_value=subprocess.CompletedProcess([], 1, json.dumps(report), '')) as command, patch.object(checks, 'audit_registry_transport') as adapter:
            self.assertEqual(checks.audit_npm(True), report)
            self.assertEqual(command.call_count, 1)
            adapter.assert_not_called()

    def test_unavailable_registry_report_is_retried_without_printing_upstream_content(self):
        unavailable = subprocess.CompletedProcess([], 1, json.dumps({'error': {'code': 'E503', 'summary': 'private upstream content'}}), '')
        report = {'auditReportVersion': 2, 'vulnerabilities': {}, 'metadata': {'vulnerabilities': {'total': 0}}}
        success = subprocess.CompletedProcess([], 0, json.dumps(report), '')
        with patch.object(checks, 'audit_registry_transport', return_value=nullcontext('http://127.0.0.1:34567/')), patch.object(checks, 'run', side_effect=[unavailable, success]) as command, patch('builtins.print') as messages:
            self.assertEqual(checks.audit_npm(True), report)
            self.assertEqual(command.call_count, 2)
            self.assertNotIn('private upstream', str(messages.call_args_list))
            self.assertIn('E503', str(messages.call_args_list))
            self.assertIn('--registry=http://127.0.0.1:34567/', command.call_args.args[0])

    def test_full_audit_still_checks_development_and_run_default_deadline_is_unchanged(self):
        report = {'auditReportVersion': 2, 'vulnerabilities': {}, 'metadata': {'vulnerabilities': {'total': 0}}}
        with patch.object(checks, 'run', return_value=subprocess.CompletedProcess([], 0, json.dumps(report), '')) as command:
            checks.audit_npm(False)
            self.assertNotIn('--omit=dev', command.call_args.args[0])
        with patch.object(checks.subprocess, 'run') as command:
            checks.run(['test'])
            self.assertEqual(command.call_args.kwargs['timeout'], 180)

    def test_oz_exception_requires_exact_advisory_pin_and_four_absence_proofs(self):
        sources = [{'src/Production.sol': {}} for _ in range(4)]
        self.assertTrue(checks.unaffected_oz(checks.OZ_ADVISORY, checks.OZ_PIN, sources))
        sources[0]['lib/openzeppelin-contracts/contracts/utils/Bytes.sol'] = {}
        self.assertFalse(checks.unaffected_oz(checks.OZ_ADVISORY, checks.OZ_PIN, sources))
        self.assertFalse(checks.unaffected_oz('GHSA-new-new-new', checks.OZ_PIN, sources))
        self.assertFalse(checks.unaffected_oz(checks.OZ_ADVISORY, 'changed', sources))


if __name__ == '__main__':
    unittest.main()
