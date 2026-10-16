#!/usr/bin/env python3
"""Independent CI security gates. Never print raw scanner/audit output or environment."""
import argparse
import datetime as dt
import hashlib
import importlib.metadata
import io
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys
import tarfile
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / '.github/ci/evidence'
VERSION = '8.30.1'
ARCHIVES = {
    ('Linux', 'x86_64'): ('linux_x64', '551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb'),
    ('Darwin', 'arm64'): ('darwin_arm64', 'b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5'),
}
OZ_PIN = 'acd4ff74de833399287ed6b31b4debf6b2b35527'
OZ_ADVISORY = 'GHSA-9rcw-c2f9-2j55'
PRODUCTION = ('ProjectFactory', 'ProjectFractions', 'FractionMarketplace', 'ClaimRouter')


def run(args, **kwargs):
    return subprocess.run(args, cwd=ROOT, capture_output=True, text=True, timeout=180, **kwargs)


def output(name, value):
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    (EVIDENCE / (name + '.json')).write_text(json.dumps(value, indent=2, sort_keys=True) + '\n')


def safe_finding(finding):
    return {k: finding[k] for k in ('RuleID', 'File', 'StartLine', 'Fingerprint') if k in finding}


def fetch_json(url, data=None):
    request = urllib.request.Request(url, data=None if data is None else json.dumps(data).encode(),
                                     headers={'Content-Type': 'application/json', 'User-Agent': 'resystem-ci-security/1'})
    with urllib.request.urlopen(request, timeout=45) as response:
        raw = response.read(8 * 1024 * 1024 + 1)
    if len(raw) > 8 * 1024 * 1024:
        raise ValueError('advisory response exceeded bound')
    return json.loads(raw)


def secrets():
    if run(['git', 'rev-parse', '--is-shallow-repository']).stdout.strip() != 'false':
        raise ValueError('full Git history is required')
    archive, digest = ARCHIVES[(platform.system(), platform.machine())]
    url = f'https://github.com/gitleaks/gitleaks/releases/download/v{VERSION}/gitleaks_{VERSION}_{archive}.tar.gz'
    with tempfile.TemporaryDirectory(prefix='resystem-secret-scan-') as directory:
        directory = Path(directory)
        with urllib.request.urlopen(url, timeout=45) as response:
            payload = response.read(40 * 1024 * 1024 + 1)
        if len(payload) > 40 * 1024 * 1024 or hashlib.sha256(payload).hexdigest() != digest:
            raise ValueError('pinned scanner checksum mismatch')
        with tarfile.open(fileobj=io.BytesIO(payload), mode='r:gz') as bundle:
            member = bundle.getmember('gitleaks')
            if not member.isfile() or member.size > 100 * 1024 * 1024:
                raise ValueError('invalid scanner archive')
            binary = directory / 'gitleaks'
            binary.write_bytes(bundle.extractfile(member).read())
        binary.chmod(0o700)
        if run([str(binary), 'version']).stdout.strip() != VERSION:
            raise ValueError('scanner version mismatch')
        report = directory / 'redacted.json'
        env = dict(os.environ, GOMEMLIMIT='256MiB', GOMAXPROCS='2')
        result = run([str(binary), 'git', '--no-banner', '--no-color', '--redact=100', '--timeout=120',
                      '--max-decode-depth=2', '--log-opts=--all', '--ignore-gitleaks-allow',
                      '--config=.github/ci/gitleaks.toml', '--gitleaks-ignore-path=.github/ci/gitleaksignore',
                      '--report-format=json', '--report-path=' + str(report), '.'], env=env)
        findings = json.loads(report.read_text()) if report.exists() else None
        if not isinstance(findings, list):
            raise ValueError('scanner did not produce a valid redacted report')
        output('secrets', {'scanner': 'gitleaks', 'version': VERSION, 'archiveSha256': digest,
                          'scope': 'all Git history', 'redaction': '100%',
                          'status': 'passed' if result.returncode == 0 and not findings else 'failed',
                          'findings': [safe_finding(f) for f in findings]})
        if result.returncode != 0 or findings:
            raise ValueError('secret scan failed; inspect sanitized finding locations')


def terminal_advisories(name, vulnerabilities, seen=None):
    seen = set() if seen is None else set(seen)
    if name in seen or name not in vulnerabilities:
        raise ValueError('invalid audit dependency graph')
    seen.add(name)
    node = vulnerabilities[name]
    via = node.get('via')
    if not isinstance(via, list) or not via:
        raise ValueError('invalid audit advisory list')
    result = []
    for entry in via:
        if isinstance(entry, str):
            result.extend(terminal_advisories(entry, vulnerabilities, seen))
        elif isinstance(entry, dict) and isinstance(entry.get('url'), str):
            result.append((name, entry['url'].rsplit('/', 1)[-1]))
        else:
            raise ValueError('invalid audit advisory')
    return result


def npm_exception(name, vulnerabilities, lock, policy, today):
    node = vulnerabilities[name]
    nodes = node.get('nodes', [])
    if not nodes or not all(lock.get('packages', {}).get(p, {}).get('dev') is True for p in nodes):
        return False
    for leaf, advisory in terminal_advisories(name, vulnerabilities):
        matches = [e for e in policy.get('npmDevExceptions', []) if e['advisory'] == advisory and e['package'] == leaf]
        if len(matches) != 1:
            return False
        exception = matches[0]
        if today > dt.date.fromisoformat(exception['expires']):
            return False
        paths = vulnerabilities[leaf].get('nodes', [])
        if not paths or not all(lock['packages'].get(p, {}).get('dev') is True and
                                lock['packages'][p].get('version') == exception['version'] for p in paths):
            return False
    return True


def audit_npm(production):
    result = run(['npm', 'audit', *(['--omit=dev'] if production else []), '--json'])
    value = json.loads(result.stdout)
    if result.returncode not in (0, 1) or value.get('error') or value.get('auditReportVersion') != 2:
        raise ValueError('npm audit unavailable or returned an invalid report')
    if not isinstance(value.get('vulnerabilities'), dict) or not isinstance(value.get('metadata', {}).get('vulnerabilities', {}).get('total'), int):
        raise ValueError('npm audit omitted vulnerability totals')
    return value


def npm():
    prod = audit_npm(True)
    if prod['metadata']['vulnerabilities']['total'] != 0 or prod['vulnerabilities']:
        output('dependencies', {'status': 'failed', 'production': prod['metadata']['vulnerabilities'], 'reason': 'production findings cannot be excepted'})
        raise ValueError('production dependency vulnerability gate failed')
    full = audit_npm(False)
    lock = json.loads((ROOT / 'package-lock.json').read_text())
    policy = json.loads((ROOT / '.github/ci/policy.json').read_text())
    findings = []
    failed = False
    for name, node in full['vulnerabilities'].items():
        if node.get('severity') not in ('info', 'low', 'moderate', 'high', 'critical'):
            raise ValueError('unknown audit severity')
        accepted = npm_exception(name, full['vulnerabilities'], lock, policy, dt.date.today())
        denied = node.get('severity') in ('moderate', 'high', 'critical') and not accepted
        failed |= denied
        findings.append({'package': name, 'severity': node.get('severity'), 'developmentException': accepted,
                         'advisories': sorted({a for _, a in terminal_advisories(name, full['vulnerabilities'])})})
    output('dependencies', {'status': 'failed' if failed else 'passed', 'production': prod['metadata']['vulnerabilities'],
                            'developmentGate': 'moderate and above; exact expiring exceptions only',
                            'findings': findings, 'exceptions': policy.get('npmDevExceptions', [])})
    if failed:
        raise ValueError('development dependency vulnerability gate failed')


def metadata(name):
    value = json.loads((ROOT / f'out/{name}.sol/{name}.json').read_text())
    data = value['metadata']
    return json.loads(data) if isinstance(data, str) else data


def unaffected_oz(advisory, pin, sources):
    return (advisory == OZ_ADVISORY and pin == OZ_PIN and len(sources) == 4 and
            all(s and not any(p.endswith('/Bytes.sol') or p == 'Bytes.sol' for p in s) for s in sources))


def contracts():
    deps = [('lib/openzeppelin-contracts', OZ_PIN), ('lib/forge-std', '77041d2ce690e692d6e03cc812b57d1ddaa4d505')]
    queries, labels = [], []
    for directory, pin in deps:
        if run(['git', '-C', directory, 'rev-parse', 'HEAD']).stdout.strip() != pin:
            raise ValueError('Solidity dependency source pin changed')
        queries.append({'commit': pin})
        labels.append({'package': directory, 'version': pin})
    queries.append({'package': {'ecosystem': 'npm', 'name': '@openzeppelin/contracts'}, 'version': '5.2.0'})
    labels.append({'package': '@openzeppelin/contracts', 'version': '5.2.0'})
    # Run under the isolated Slither environment: only public package names/versions leave CI.
    inventory = sorted({(d.metadata['Name'], d.version) for d in importlib.metadata.distributions()})
    for name, version in inventory:
        queries.append({'package': {'ecosystem': 'PyPI', 'name': name}, 'version': version})
        labels.append({'package': name, 'version': version})
    response = fetch_json('https://api.osv.dev/v1/querybatch', {'queries': queries})
    results = response.get('results')
    if not isinstance(results, list) or len(results) != len(queries):
        raise ValueError('OSV response incomplete')
    sources = [metadata(name)['sources'] for name in PRODUCTION]
    if not unaffected_oz(OZ_ADVISORY, OZ_PIN, sources):
        raise ValueError('Bytes.sol absence proof failed for a production contract')
    findings, denied = [], False
    for label, result in zip(labels, results):
        if not isinstance(result, dict) or result.get('next_page_token') or result.get('error'):
            raise ValueError('OSV response incomplete')
        for vulnerability in result.get('vulns', []):
            advisory = vulnerability.get('id')
            if not isinstance(advisory, str):
                raise ValueError('invalid OSV advisory')
            excluded = label['package'] == '@openzeppelin/contracts' and unaffected_oz(advisory, OZ_PIN, sources)
            denied |= not excluded
            findings.append(dict(label, advisory=advisory, knownUnaffected=excluded))
    output('dependencies', {'status': 'failed' if denied else 'passed', 'database': 'OSV',
                            'scannedDependencies': labels, 'findings': findings,
                            'scopeProof': {name: {'Bytes.sol': 'absent', 'compiledSourceCount': len(source)}
                                           for name, source in zip(PRODUCTION, sources)},
                            'knownAdvisoryPatchedVersion': '5.4.0'})
    if denied:
        raise ValueError('Solidity/toolchain dependency vulnerability gate failed')


def source_commit(actual, expected):
    if not re.fullmatch('[0-9a-f]{40}', actual) or (expected and actual != expected):
        raise ValueError('checked-out source differs from CI commit')
    return actual


def file_hash(path):
    if path.is_symlink() or not path.resolve().is_relative_to(ROOT.resolve()):
        raise ValueError('artifact symlink/outside root rejected')
    return {'path': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size,
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def provenance(status):
    sha = source_commit(run(['git', 'rev-parse', 'HEAD']).stdout.strip(), os.environ.get('GITHUB_SHA'))
    versions = {'python': platform.python_version(), 'git': run(['git', '--version']).stdout.strip()}
    files = [ROOT / p for p in ('package.json', 'package-lock.json', 'foundry.toml') if (ROOT / p).is_file()]
    if (ROOT / 'package.json').exists():
        for command in ('node', 'npm'):
            versions[command] = run([command, '--version']).stdout.strip()
        for name in ('next', 'typescript', 'prisma'):
            path = ROOT / 'node_modules' / name / 'package.json'
            if path.exists():
                versions[name] = json.loads(path.read_text())['version']
    else:
        versions['forge'] = run(['forge', '--version']).stdout.strip()
        versions['slither-analyzer'] = importlib.metadata.version('slither-analyzer')
        versions['solidity'] = {name: {k: metadata(name).get(k) for k in ('compiler', 'settings')} for name in PRODUCTION}
        files += [ROOT / f'out/{name}.sol/{name}.json' for name in PRODUCTION]
    for directory in ('artifacts', 'dist', '.next/server', '.next/static'):
        base = ROOT / directory
        if base.exists():
            files += [p for p in base.rglob('*') if p.is_file()]
    next_dir = ROOT / '.next'
    if next_dir.exists():
        files += [p for p in next_dir.iterdir() if p.is_file() and (p.suffix == '.json' or p.name == 'BUILD_ID')]
    files = sorted(set(files))
    if len(files) > 10000 or sum(p.stat().st_size for p in files) > 512 * 1024 * 1024:
        raise ValueError('artifact inventory exceeds bound')
    output('provenance', {'sourceCommit': sha, 'verificationStatus': status, 'toolchains': versions,
                          'artifacts': [file_hash(p) for p in files],
                          'scope': 'nonsecret release output hashes only; no environment or credential material'})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=('secrets', 'npm', 'contracts', 'provenance'))
    parser.add_argument('--status', default='local verification')
    args = parser.parse_args()
    try:
        if args.mode == 'provenance':
            provenance(args.status)
        else:
            globals()[args.mode]()
        print(args.mode + ': passed (sanitized evidence recorded)')
    except Exception as error:
        # Exception strings from network/process tools can contain response bodies: never print them.
        print(args.mode + ': failed (' + type(error).__name__ + '); no raw tool output emitted', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
