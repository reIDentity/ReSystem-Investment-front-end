import datetime as dt
import importlib.util
from pathlib import Path
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

    def test_oz_exception_requires_exact_advisory_pin_and_four_absence_proofs(self):
        sources = [{'src/Production.sol': {}} for _ in range(4)]
        self.assertTrue(checks.unaffected_oz(checks.OZ_ADVISORY, checks.OZ_PIN, sources))
        sources[0]['lib/openzeppelin-contracts/contracts/utils/Bytes.sol'] = {}
        self.assertFalse(checks.unaffected_oz(checks.OZ_ADVISORY, checks.OZ_PIN, sources))
        self.assertFalse(checks.unaffected_oz('GHSA-new-new-new', checks.OZ_PIN, sources))
        self.assertFalse(checks.unaffected_oz(checks.OZ_ADVISORY, 'changed', sources))


if __name__ == '__main__':
    unittest.main()
