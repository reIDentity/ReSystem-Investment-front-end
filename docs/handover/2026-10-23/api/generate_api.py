"""Generate reviewed handover collections from the canonical OpenAPI snapshot.

Run with Python 3 and PyYAML. Input: openapi.json beside this script.
The initial collection was inspected using `postman spec generate collection`.
This deterministic pass fixes cookie auth, unsafe samples and pagination defaults.
No request is executed and no cloud workspace is modified.
"""
import csv
import json
import re
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parent
SPEC = json.loads((ROOT / 'openapi.json').read_text())
DEST = ROOT / 'postman/collections/reSystem Platform API'
ENV = {
    'baseUrl': 'https://admin.resystem.org',
    'origin': 'https://admin.resystem.org',
    'allow_operation': '', 'allow_mutations': 'false',
    'csrfToken': '', 'username': '', 'password': '', 'totp': '',
    'idempotencyKey': '', 'projectId': '', 'intentId': '',
    'ticketId': '', 'userId': '', 'roleId': '', 'notificationId': '',
    'messageId': '', 'attachmentId': '', 'membershipId': '',
    'listingId': '', 'quantity': '1', 'asset': 'REAED',
    'page': '1', 'pageSize': '10', 'filter': 'all',
    'snapshotBlock': '', 'cursor': '', 'challengeToken': '',
    'enrollmentToken': '', 'reviewKey': '', 'recipient': '',
}
SECRET = {'csrfToken', 'password', 'totp', 'challengeToken', 'enrollmentToken', 'reviewKey'}
SAFE = {('get', '/health'), ('get', '/ready'), ('get', '/v1/projects')}

def dump(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(obj, sort_keys=False, allow_unicode=True))

def placeholder(key):
    ENV.setdefault(key, '')
    return '{{' + key + '}}'

def resolve(schema):
    if '$ref' in schema:
        return SPEC['components']['schemas'][schema['$ref'].split('/')[-1]]
    return schema

def sample(schema, key='value', depth=0):
    schema = resolve(schema)
    if depth > 8: return None
    if schema.get('type') == 'object' or 'properties' in schema:
        return {k: sample(schema.get('properties', {}).get(k, {}), k, depth+1)
                for k in schema.get('required', [])}
    if schema.get('type') == 'array': return []
    if schema.get('enum'): return schema['enum'][0]
    if schema.get('type') in ('integer', 'number'): return schema.get('minimum', 0)
    if schema.get('type') == 'boolean': return False
    return placeholder(key)

def guard(opid, write, safe):
    parts = [
        '// Manual-use guard. No secrets are saved or logged by this script.',
        "const target = pm.variables.get('baseUrl');",
        r"if (!/^https:\/\/[^/?#@]+(?::[0-9]+)?$/.test(target || '')) {",
        "  pm.execution.skipRequest(); throw new Error('Use an HTTPS origin without a path or credentials.');",
        '}',
    ]
    if not safe:
        parts += [f"if (pm.variables.get('allow_operation') !== {json.dumps(opid)}) {{",
                  "  pm.execution.skipRequest();", '}',]
    if write:
        parts += ["if (pm.variables.get('allow_mutations') !== 'true') {",
                  "  pm.execution.skipRequest();", '}',]
    return '\n'.join(parts)

def path_key(path, key):
    if key != 'id': return key
    for part, var in [('projects','projectId'),('transactions','intentId'),
                      ('support','ticketId'),('staff','userId'),('roles','roleId'),
                      ('notifications','notificationId'),('marketplace','listingId')]:
        if '/' + part + '/{id}' in path: return var
    return key

folders = {}
rows = []
for path, methods in SPEC['paths'].items():
    for method, op in methods.items():
        if method not in ('get','post','put','patch','delete','head','options'): continue
        opid = op['operationId']; tag = op.get('tags', ['Other'])[0]
        write = method not in ('get','head','options')
        public = not op.get('security', SPEC.get('security', []))
        # Public bootstrap endpoints can retain ApiCookieAuth in the schema.
        special = ''
        if path in ('/v1/auth/reid/start','/v1/auth/reid/callback'):
            special = 'Browser navigation only; do not follow OAuth redirects in a collection run.'
        if path.startswith('/v1/auth/wallet'):
            special = 'Legacy/policy-dependent route. Personal staff signing is permanently disabled; use the shared admin flow.'
        if path.startswith('/v1/email-notifications') and (method=='delete' or 'verification' in path):
            special = 'Historical compatibility operation. Current investor UI uses reID profile email without duplicate confirmation/removal.'
        codes = ', '.join(c for c in op.get('responses', {}) if c.startswith('2') or c=='302')
        desc = (f"Operation ID: {opid}\n\n{op.get('description','')}\n\n"
                f"Canonical contract: openapi.json -> {method.upper()} {path}. Success: {codes}. "
                'Bodies are editable contract examples, not captured live requests. Exact per-action validation also applies. '
                'Use the cookie jar, not an API-key header. Do not export populated environments or saved auth responses.\n\n'
                + ('Public read enabled by default.' if (method,path) in SAFE else f'Set allow_operation to {opid} for this one manual request.')
                + (' Mutates state: also requires allow_mutations=true and applicable human authorization. Never run mutations in Collection Runner.' if write else '')
                + ('\n\n'+special if special else ''))
        url = '{{baseUrl}}' + re.sub(r'\{([^}]+)\}', lambda m: ':'+m[1], path)
        variables = [{'key': k, 'value': placeholder(path_key(path,k)), 'description':'Use the authorized resource ID from a read response.'}
                     for k in re.findall(r'\{([^}]+)\}', path)]
        headers = [{'key':'Accept','value':'application/json'}]
        if write:
            headers += [{'key':'Origin','value':'{{origin}}'}, {'key':'X-CSRF-Token','value':'{{csrfToken}}'}]
        for p in op.get('parameters', []):
            if p['in']=='header' and p['name'].lower()=='idempotency-key':
                headers.append({'key':'Idempotency-Key','value':'{{idempotencyKey}}','description':'Generate once per business attempt; reuse unchanged on safe retry.'})
        query = []
        for p in op.get('parameters', []):
            if p['in']!='query': continue
            k=p['name']; disabled=True
            if path=='/v1/activity' and k in ('page','pageSize','filter'): disabled=False
            if path.endswith('/quote') or path.endswith('/send-quote'):
                disabled=not p.get('required',False)
            if k=='signer': disabled=True
            query.append({'key':k,'value':placeholder(k), 'disabled':disabled,
                          'description':p.get('description','Enable only when required for this operation. See canonical schema and runtime validation.')})
        body = None; vbody = None
        content = op.get('requestBody',{}).get('content',{})
        if 'application/json' in content:
            value = sample(content['application/json']['schema'])
            if opid=='AccountController_create':
                value={'type':'BUY','projectId':'{{projectId}}','asset':'{{asset}}','quantity':'{{quantity}}'}
            if opid=='AuthController_login': value={'username':'{{username}}','password':'{{password}}'}
            raw=json.dumps(value,indent=2)
            body={'type':'json','content':raw}; vbody={'mode':'raw','raw':raw,'options':{'raw':{'language':'json'}}}
            headers.append({'key':'Content-Type','value':'application/json'})
        elif 'multipart/form-data' in content:
            body={'type':'formdata','content':[{'key':'file','type':'file','src':[]}]}
            vbody={'mode':'formdata','formdata':[{'key':'file','type':'file','src':[]}]}
            headers=[h for h in headers if h['key']!='Content-Type']
        if path.endswith('/content'): headers=[{'key':'Accept','value':'image/webp'}]
        code=guard(opid,write,(method,path) in SAFE)
        req={'$kind':'http-request','name':f'{method.upper()} {path}', 'description':desc,
             'url':url,'method':method.upper(),'headers':headers,'auth':{'type':'noauth'},
             'settings':{'strictSSL':True,'followRedirects':False},
             'scripts':[{'type':'beforeRequest','code':code,'language':'text/javascript'}],
             'order':(len(rows)+1)*1000}
        if query:
            req['queryParams']=query
            enabled_query=[q for q in query if not q['disabled']]
            if enabled_query: req['url']+='?'+'&'.join(q['key']+'='+q['value'] for q in enabled_query)
        if variables: req['pathVariables']=variables
        if body: req['body']=body
        dump(DEST/tag/(opid+'.request.yaml'),req)
        vurl={'raw':url,'host':['{{baseUrl}}'],'path':url.split('}}',1)[1].strip('/').split('/')}
        if variables: vurl['variable']=variables
        if query:
            vurl['query']=query
            enabled=[q for q in query if not q['disabled']]
            if enabled: vurl['raw']+='?'+'&'.join(q['key']+'='+q['value'] for q in enabled)
        vreq={'method':method.upper(),'header':headers,'url':vurl,'description':desc,'auth':{'type':'noauth'}}
        if vbody: vreq['body']=vbody
        item={'name':f'{method.upper()} {path}', 'request':vreq,
              'protocolProfileBehavior':{'followRedirects':False,'strictSSL':True},
              'event':[{'listen':'prerequest','script':{'type':'text/javascript','exec':code.splitlines()}}]}
        # Clearly synthetic examples validate the envelope without exposing actual records.
        if path in ('/health','/v1/activity') and method=='get':
            error={'error':{'code':'EXAMPLE_ONLY','message':'Illustrative error; inspect the actual response.'},'statusCode':400}
            item['response']=[{'name':'Synthetic 400 envelope - not a captured response', 'originalRequest':vreq,
                              'status':'Bad Request','code':400,
                              'header':[{'key':'Content-Type','value':'application/json'}], 'body':json.dumps(error,indent=2)}]
            ex=DEST/tag/'.resources'/(opid+'.resources')/'examples'/'synthetic-error.example.yaml'
            dump(ex,{'$kind':'http-example','name':'Synthetic 400 envelope - not a captured response',
                     'request':{'method':'GET','url':url},
                     'response':{'statusCode':400,'statusText':'Bad Request','headers':[{'key':'Content-Type','value':'application/json'}],
                                 'body':{'type':'json','content':json.dumps(error,indent=2)}}})
            req['examples']='./.resources/'+opid+'.resources/examples';dump(DEST/tag/(opid+'.request.yaml'),req)
        folders.setdefault(tag,[]).append(item)
        rows.append([method.upper(),path,opid,tag,'public/schema' if public else 'cookie/session; verify role',codes])

description='reSystem UAT API handover. Derived from canonical OpenAPI; 104 operations. Cookie jar authentication. Three public read requests work by default; unlock exactly one other operation manually. Mutations also require allow_mutations=true. No credentials, automatic token capture, messages or financial requests are sent by generation. See DEVELOPER_HANDOVER.md section 10.'
dump(DEST/'.resources/definition.yaml',{'$kind':'collection','name':'reSystem Platform API','description':description,
     'auth':{'type':'noauth'},'variables':[{'key':'baseUrl','value':ENV['baseUrl']},{'key':'allow_operation','value':''},{'key':'allow_mutations','value':'false'}]})
for tag in folders: dump(DEST/tag/'.resources/definition.yaml',{'$kind':'collection','name':tag})
collection={'info':{'name':'reSystem Platform API | UAT handover','description':description,
                   'schema':'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'},
            'auth':{'type':'noauth'},'variable':[{'key':'baseUrl','value':ENV['baseUrl']},{'key':'allow_operation','value':''},{'key':'allow_mutations','value':'false'}],
            'item':[{'name':tag,'item':items} for tag,items in folders.items()]}
(ROOT/'resystem-platform.postman_collection.json').write_text(json.dumps(collection,indent=2)+'\n')
values=[{'key':k,'value':v,'enabled':True,'type':'secret' if k in SECRET or any(s in k.lower() for s in ['password','token','secret','totp']) else 'default'} for k,v in ENV.items()]
environment={'name':'reSystem UAT - blank secrets','values':values,'_postman_variable_scope':'environment'}
(ROOT/'resystem-uat.postman_environment.json').write_text(json.dumps(environment,indent=2)+'\n')
dump(ROOT/'postman/environments/reSystem UAT.environment.yaml',{'name':environment['name'],'values':values})
with (ROOT/'operations.csv').open('w') as f:
    writer=csv.writer(f, lineterminator='\n');writer.writerow(['method','path','operationId','group','auth','successCodes']);writer.writerows(rows)
print(f'Generated {len(rows)} operations in v2.1 and v3. No API calls made.')
