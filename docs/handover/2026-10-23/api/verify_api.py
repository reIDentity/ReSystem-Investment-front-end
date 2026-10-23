"""Offline collection coverage/safe-default verification. Requires PyYAML."""
import json
import re
from pathlib import Path
import yaml

root=Path(__file__).resolve().parent
spec=json.loads((root/'openapi.json').read_text())
expected={(m.upper(),p):o['operationId'] for p,ops in spec['paths'].items() for m,o in ops.items() if m in ('get','post','put','patch','delete','head','options')}
coll=json.loads((root/'resystem-platform.postman_collection.json').read_text())
items=[i for folder in coll['item'] for i in folder['item']]
actual={}
for item in items:
    request=item['request'];path='/'+'/'.join(request['url']['path'])
    path=re.sub(r':([A-Za-z0-9_]+)',r'{\1}',path)
    key=(request['method'],path); assert key not in actual
    actual[key]=item
    assert request['auth']['type']=='noauth'
    assert item['protocolProfileBehavior']['strictSSL'] is True
    assert item['protocolProfileBehavior']['followRedirects'] is False
    script='\n'.join(item['event'][0]['script']['exec'])
    if key not in {('GET','/health'),('GET','/ready'),('GET','/v1/projects')}:
        assert expected[key] in script and 'skipRequest' in script
    if key[0] not in ('GET','HEAD','OPTIONS'):
        assert 'allow_mutations' in script
        assert {'Origin','X-CSRF-Token'} <= {h['key'] for h in request['header']}
    assert all(h['key'] not in ('Authorization','resystem_session','Cookie') for h in request['header'])
    if request.get('body',{}).get('mode')=='raw': json.loads(request['body']['raw'])
assert set(expected)==set(actual)
v3=list((root/'postman/collections').rglob('*.request.yaml'))
assert len(v3)==len(expected)
for file in v3: assert yaml.safe_load(file.read_text())['$kind']=='http-request'
env=json.loads((root/'resystem-uat.postman_environment.json').read_text())
variables={v['key']:v['value'] for v in env['values']}
assert variables['allow_operation']=='' and variables['allow_mutations']=='false'
for v in env['values']:
    if v['type']=='secret': assert v['value']==''
for item in items:
    for token in re.findall(r'\{\{([A-Za-z0-9_]+)\}\}',json.dumps(item)):
        assert token in variables, token
activity=actual[('GET','/v1/activity')]['request']['url']['query']
enabled={q['key'] for q in activity if not q['disabled']}
assert enabled=={'page','pageSize','filter'}
print(f'PASS: {len(expected)} exact operations; v2.1/v3 coverage, references, cookie auth, TLS, redirect and mutation guards, blank secrets, Activity query modes.')
