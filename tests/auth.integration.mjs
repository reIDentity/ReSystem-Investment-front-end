// HTTPS development server must be running: npm run test:auth
import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sealSession,SESSION_COOKIE} from '../src/lib/auth/security.ts';
const platform=Boolean(process.env.PLATFORM_API_BASE);
const origin='https://localhost:3002',ca=readFileSync('certificates/localhost.pem');
function request(path,{headers={},method='GET',body}={}){return new Promise((resolve,reject)=>{const req=https.request(new URL(path,origin),{ca,headers,method,timeout:15000},res=>{let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));});req.on('timeout',()=>req.destroy(new Error('Local authentication test timed out')));req.on('error',reject);req.end(body);});}
test('protected routes reject missing and forged sessions',async()=>{for(const headers of [{},{Cookie:SESSION_COOKIE+'=forged'}]){const r=await request('/invest/wallet',{headers});if(platform){assert.equal(r.status,200);assert.match(r.body,/NEXT_REDIRECT/);assert.doesNotMatch(r.body,/Your wallet|Wallet balances/);}else{assert.equal(r.status,307);assert.equal(new URL(r.headers.location,origin).pathname,'/invest');}}});
test('sign-in uses UAT, exact callback, S256 PKCE and secure cookies',{skip:platform},async()=>{
 const r=await request('/api/auth/reid/start?next=%2Finvest%2Fwallet'),target=new URL(r.headers.location);
 assert.equal(r.status,307);assert.equal(target.origin,'https://app.reidentity.net');assert.equal(target.pathname,'/connect');assert.equal(target.searchParams.get('client_id'),process.env.REID_CLIENT_ID);assert.equal(target.searchParams.get('redirect_uri'),origin+'/api/auth/reid/callback');assert.equal(target.searchParams.get('code_challenge_method'),'S256');assert.equal(target.searchParams.get('scope').includes('wallet:export'),false);
 const cookies=r.headers['set-cookie'];for(const c of cookies){assert.match(c,/HttpOnly/);assert.match(c,/Secure/);assert.match(c,/SameSite=lax/);assert.match(c,/Path=\/api\/auth\/reid/);}
 const verifier=cookies.find(c=>c.startsWith('resystem_reid_verifier=')).split(';')[0].split('=')[1];assert.equal(createHash('sha256').update(verifier).digest('base64url'),target.searchParams.get('code_challenge'));
 const headers={Cookie:cookies.map(c=>c.split(';')[0]).join('; ')};
 const bad=await request('/api/auth/reid/callback?code=invalid&state=wrong',{headers});assert.match(bad.headers.location,/reidError=expired_request/);
 const cancel=await request('/api/auth/reid/callback?error=access_denied&state='+target.searchParams.get('state'),{headers});assert.match(cancel.headers.location,/reidError=access_denied/);assert.equal(cancel.headers['set-cookie'].every(c=>c.includes('Max-Age=0')),true);
});
test('encrypted fixture session renders identity and signs out safely',{skip:platform},async()=>{
 assert.ok(process.env.SESSION_SECRET,'Load .env.local before the test');
 const token=await sealSession({id:'local-test-fixture',name:'Integration Tester',wallet:'0x1234567890123456789012345678901234567890',kycStatus:'incomplete'},process.env.SESSION_SECRET),headers={Cookie:SESSION_COOKIE+'='+token};
 const home=await request('/invest/home',{headers});assert.equal(home.status,200);assert.match(home.body,/Integration Tester/);assert.match(home.body,/Connected with reID/);
 const denied=await request('/api/auth/reid/logout',{headers:{...headers,Origin:'https://evil.example'},method:'POST'});assert.equal(denied.status,403);
 const logout=await request('/api/auth/reid/logout',{headers:{...headers,Origin:origin},method:'POST'});assert.equal(logout.status,303);assert.equal(logout.headers.location,origin+'/invest');assert.ok(logout.headers['set-cookie'].some(c=>c.startsWith(SESSION_COOKIE+'=')&&c.includes('Max-Age=0')));
});
test('deposit API requires a verified session and ignores a supplied wallet',{skip:platform},async()=>{
 for(const headers of [{},{Cookie:SESSION_COOKIE+'=forged'}]){
  const denied=await request('/api/invest/deposits',{headers});
  assert.equal(denied.status,401);
  assert.match(denied.headers['cache-control'],/private.*no-store/);
  assert.equal(JSON.parse(denied.body).wallet,undefined);
 }
 const wallet='0x1234567890123456789012345678901234567890';
 const token=await sealSession({id:'deposit-test-fixture',name:'Deposit Tester',wallet,kycStatus:'incomplete'},process.env.SESSION_SECRET);
 const response=await request('/api/invest/deposits?wallet=0x0000000000000000000000000000000000000001',{headers:{Cookie:SESSION_COOKIE+'='+token}});
 assert.ok([200,502].includes(response.status));
 assert.match(response.headers['cache-control'],/private.*no-store/);
 assert.match(response.headers.vary,/Cookie/);
 const body=JSON.parse(response.body);
 assert.equal(body.wallet,wallet);
 assert.match(body.qr,/^data:image\/png;base64,/);
 if(response.status===200){assert.equal(body.chainId,15324);assert.ok(Array.isArray(body.deposits));}
 else assert.equal(typeof body.error,'string');
});

// This live-mode suite never creates a backend identity or reuses a staff fixture.
test('live BFF session is anonymous and private without a backend cookie',{skip:!platform},async()=>{
 const r=await request('/api/platform/auth/session');assert.equal(r.status,200);assert.equal(JSON.parse(r.body).authenticated,false);assert.match(r.headers['cache-control'],/private.*no-store/);assert.equal(JSON.parse(r.body).user,null);
 const csrf=r.headers['set-cookie'].find(c=>c.startsWith('resystem_csrf='));assert.ok(csrf);assert.match(csrf,/HttpOnly/);assert.match(csrf,/Secure/);assert.match(csrf,/Path=\//);
});
test('live backend identity cannot be replaced by a valid legacy frontend session',{skip:!platform},async()=>{
 const token=await sealSession({id:'isolated-legacy-check',name:'Legacy identity must not render',wallet:'0x1234567890123456789012345678901234567890',kycStatus:'incomplete'},process.env.SESSION_SECRET);
 const headers={Cookie:SESSION_COOKIE+'='+token};
 const r=await request('/api/platform/auth/session',{headers});assert.equal(JSON.parse(r.body).authenticated,false);
 const page=await request('/invest/wallet',{headers});assert.match(page.body,/NEXT_REDIRECT/);assert.doesNotMatch(page.body,/Legacy identity must not render|Wallet balances/);
});
test('live BFF rejects hostile mutation origins and private admin paths',{skip:!platform},async()=>{
 for(const Origin of ['https://attacker.example','null']){const r=await request('/api/platform/transactions',{method:'POST',headers:{Origin,'Content-Type':'application/json','X-CSRF-Token':'fake'},body:'{}'});assert.equal(r.status,403);}
 for(const path of ['/api/platform/admin/projects','/api/platform/auth/staff/login'])assert.equal((await request(path)).status,404);
});
test('live private reads ignore user-supplied identity without authentication',{skip:!platform},async()=>{
 for(const path of ['/api/platform/wallet','/api/platform/wallet/deposits?wallet=0x1234567890123456789012345678901234567890','/api/platform/support/other-account']){
 const r=await request(path);assert.equal(r.status,401);assert.match(r.headers['cache-control'],/private.*no-store/);assert.equal(JSON.parse(r.body).wallet,undefined);}
});
