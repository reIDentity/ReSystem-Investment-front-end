// HTTPS development server must be running: npm run test:auth
import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sealSession,SESSION_COOKIE} from '../src/lib/auth/security.ts';
const origin='https://localhost:3002',ca=readFileSync('certificates/localhost.pem');
function request(path,{headers={},method='GET'}={}){return new Promise((resolve,reject)=>{const req=https.request(new URL(path,origin),{ca,headers,method,timeout:15000},res=>{let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));});req.on('timeout',()=>req.destroy(new Error('Local authentication test timed out')));req.on('error',reject);req.end();});}
test('protected routes reject missing and forged sessions',async()=>{for(const headers of [{},{Cookie:SESSION_COOKIE+'=forged'}]){const r=await request('/invest/wallet',{headers});assert.equal(r.status,307);assert.equal(new URL(r.headers.location,origin).pathname,'/invest');}});
test('sign-in uses UAT, exact callback, S256 PKCE and secure cookies',async()=>{
 const r=await request('/api/auth/reid/start?next=%2Finvest%2Fwallet'),target=new URL(r.headers.location);
 assert.equal(r.status,307);assert.equal(target.origin,'https://app.reidentity.net');assert.equal(target.pathname,'/connect');assert.equal(target.searchParams.get('client_id'),process.env.REID_CLIENT_ID);assert.equal(target.searchParams.get('redirect_uri'),origin+'/api/auth/reid/callback');assert.equal(target.searchParams.get('code_challenge_method'),'S256');assert.equal(target.searchParams.get('scope').includes('wallet:export'),false);
 const cookies=r.headers['set-cookie'];for(const c of cookies){assert.match(c,/HttpOnly/);assert.match(c,/Secure/);assert.match(c,/SameSite=lax/);assert.match(c,/Path=\/api\/auth\/reid/);}
 const verifier=cookies.find(c=>c.startsWith('resystem_reid_verifier=')).split(';')[0].split('=')[1];assert.equal(createHash('sha256').update(verifier).digest('base64url'),target.searchParams.get('code_challenge'));
 const headers={Cookie:cookies.map(c=>c.split(';')[0]).join('; ')};
 const bad=await request('/api/auth/reid/callback?code=invalid&state=wrong',{headers});assert.match(bad.headers.location,/reidError=expired_request/);
 const cancel=await request('/api/auth/reid/callback?error=access_denied&state='+target.searchParams.get('state'),{headers});assert.match(cancel.headers.location,/reidError=access_denied/);assert.equal(cancel.headers['set-cookie'].every(c=>c.includes('Max-Age=0')),true);
});
test('encrypted fixture session renders identity and signs out safely',async()=>{
 assert.ok(process.env.SESSION_SECRET,'Load .env.local before the test');
 const token=await sealSession({id:'local-test-fixture',name:'Integration Tester',wallet:'0x1234567890123456789012345678901234567890',kycStatus:'incomplete'},process.env.SESSION_SECRET),headers={Cookie:SESSION_COOKIE+'='+token};
 const home=await request('/invest/home',{headers});assert.equal(home.status,200);assert.match(home.body,/Integration Tester/);assert.match(home.body,/Connected with reID/);
 const denied=await request('/api/auth/reid/logout',{headers:{...headers,Origin:'https://evil.example'},method:'POST'});assert.equal(denied.status,403);
 const logout=await request('/api/auth/reid/logout',{headers:{...headers,Origin:origin},method:'POST'});assert.equal(logout.status,303);assert.equal(logout.headers.location,origin+'/invest');assert.ok(logout.headers['set-cookie'].some(c=>c.startsWith(SESSION_COOKIE+'=')&&c.includes('Max-Age=0')));
});
