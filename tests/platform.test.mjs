import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { transactionIssue, isSettled } from '../src/lib/platform/transaction.ts';
import assert from 'node:assert/strict';
import { proxyConfig, proxyPlatform } from '../src/lib/platform/proxy.ts';
import { atomic, units, contractAsset, decimals, assetLabel, whole, validWhole, percentage, safeAddress, safeApproval } from '../src/lib/platform/money.ts';
import { publicIpfsUrl } from '../src/lib/platform/media.ts';
const config=proxyConfig({PLATFORM_API_BASE:'http://127.0.0.1:3005/v1',PLATFORM_APP_ORIGIN:'https://localhost:3002'});
const request=(path='transactions',options={})=>new Request('https://localhost:3002/api/platform/'+path,options);
test('fixed upstream URL rejects credentials, remote HTTP and path injection',()=>{
 assert.equal(config.base,'http://127.0.0.1:3005/v1/');
 for(const base of ['http://remote.example/v1','https://user:pass@example.test','https://example.test/evil','https://example.test/v1?x=1'])assert.throws(()=>proxyConfig({PLATFORM_API_BASE:base,PLATFORM_APP_ORIGIN:config.origin}));
});
test('untrusted or missing browser Origin is rejected before any backend request',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw Error('must not fetch')};
 for(const origin of [null,'https://attacker.example','null']){
  const res=await proxyPlatform(request('transactions',{method:'POST',headers:{...(origin?{Origin:origin}:{}),'X-CSRF-Token':'csrf','Content-Type':'application/json'},body:'{}'}),['transactions'],config,fetcher);assert.equal(res.status,403);
 }assert.equal(calls,0);
});
test('same-origin mutation forwards only platform cookies, CSRF/idempotency and configured origin',async()=>{
 let seen;const fetcher=async(url,init)=>{seen={url,init};return Response.json({id:'actual-intent'});};
 const res=await proxyPlatform(request('transactions',{method:'POST',headers:{Origin:config.origin,Cookie:'unrelated=private; resystem_session=session; resystem_csrf=csrf; resystem_oauth=oauth',Authorization:'Bearer must-not-forward','X-CSRF-Token':'csrf','Idempotency-Key':'canonical-test-key','Content-Type':'application/json','X-Forwarded-Host':'attacker.example'},body:'{"type":"BUY"}'}),['transactions'],config,fetcher);
 assert.equal(res.status,200);assert.equal(seen.url,'http://127.0.0.1:3005/v1/transactions');
 assert.equal(seen.init.redirect,'manual');assert.equal(seen.init.cache,'no-store');assert.equal(seen.init.headers.get('Origin'),config.origin);assert.equal(seen.init.headers.get('Authorization'),null);assert.equal(seen.init.headers.get('X-Forwarded-Host'),null);assert.equal(seen.init.headers.get('Cookie'),'resystem_session=session; resystem_csrf=csrf; resystem_oauth=oauth');assert.equal(seen.init.headers.get('X-CSRF-Token'),'csrf');assert.equal(seen.init.headers.get('Idempotency-Key'),'canonical-test-key');
 assert.match(res.headers.get('cache-control'),/no-store/);
});
test('safe session reads retain every allowed Set-Cookie and remove foreign domains',async()=>{
 const headers=new Headers();headers.append('Set-Cookie','resystem_csrf=new; Domain=backend.example; HttpOnly; Path=/v1; SameSite=Lax');headers.append('Set-Cookie','resystem_session=session; HttpOnly; Path=/');headers.append('Set-Cookie','foreign=never');
 const res=await proxyPlatform(request('auth/session'),['auth','session'],config,async()=>new Response('{"authenticated":true}',{headers}));
 const cookies=res.headers.getSetCookie();assert.equal(cookies.length,2);assert.ok(cookies.every(c=>!c.includes('Domain=')&&c.includes('Path=/')&&c.includes('Secure')));
});
test('path traversal, admin routes, missing CSRF and oversized bodies cannot reach backend',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return Response.json({});};
 for(const segments of [['..','admin'],['admin','staff'],['http:','attacker']])assert.equal((await proxyPlatform(request(),segments,config,fetcher)).status,404);
 assert.equal((await proxyPlatform(request('transactions',{method:'POST',headers:{Origin:config.origin,'Content-Type':'application/json'},body:'{}'}),['transactions'],config,fetcher)).status,403);
 const huge=await proxyPlatform(request('transactions',{method:'POST',headers:{Origin:config.origin,'X-CSRF-Token':'csrf','Content-Type':'application/json'},body:'x'.repeat(65537)}),['transactions'],config,fetcher);assert.equal(huge.status,413);assert.equal(calls,0);
});
test('email notification routes allow only investor status, toggles, removal and confirmation requests',async()=>{
 const seen=[];const fetcher=async(url,init)=>{seen.push(`${init.method} ${url}`);return Response.json({});};
 const change=(method,body)=>({method,headers:{Origin:config.origin,'X-CSRF-Token':'csrf','Content-Type':'application/json'},...(body?{body}:{})});
 for(const [method,path,body] of [['GET','email-notifications'],['PATCH','email-notifications','{"transactionEmails":true,"supportEmails":false}'],['DELETE','email-notifications'],['POST','email-notifications/verification','{}']])
  assert.equal((await proxyPlatform(request(path,method==='GET'?{}:change(method,body)),path.split('/'),config,fetcher)).status,200);
 assert.deepEqual(seen,['GET http://127.0.0.1:3005/v1/email-notifications','PATCH http://127.0.0.1:3005/v1/email-notifications','DELETE http://127.0.0.1:3005/v1/email-notifications','POST http://127.0.0.1:3005/v1/email-notifications/verification']);
 for(const [method,path] of [['POST','email-notifications'],['POST','email-notifications/verification/confirm'],['GET','email-notifications/verify'],['GET','email-notifications/verification']])
  assert.equal((await proxyPlatform(request(path,method==='GET'?{}:change(method,'{}')),path.split('/'),config,fetcher)).status,404);
 assert.equal(seen.length,4);
});
test('OAuth uses manual trusted redirects; hostile Location never escapes to browser',async()=>{
 for(const [location,status] of [['https://app.reidentity.net/oauth/authorize',302],['https://localhost:3002/invest/home',302],['https://attacker.example/steal',502]]){
  const res=await proxyPlatform(request('auth/reid/start'),['auth','reid','start'],config,async()=>new Response(null,{status:302,headers:{Location:location}}));assert.equal(res.status,status);if(status===502)assert.equal(res.headers.get('Location'),null);
 }
});
test('upstream outage returns honest 503 without fabricating financial data',async()=>{
 const res=await proxyPlatform(request('portfolio'),['portfolio'],config,async()=>{throw Error('private upstream detail')});assert.equal(res.status,503);const text=await res.text();assert.ok(!text.includes('private upstream'));assert.ok(!text.includes('balanceAtomic'));
});
test('exact atomic arithmetic preserves minimum units and values above Number safe precision',()=>{
 assert.equal(atomic('0.000001',6),'1');assert.equal(atomic('0.000000000000000001',18),'1');assert.equal(atomic('9007199254740993.123456',6),'9007199254740993123456');assert.equal(units('9007199254740993123456',6),'9,007,199,254,740,993.123456');
 assert.equal(percentage('1000','10000'),'10.00%');assert.equal(percentage('1000','2000'),'50.00%');assert.equal(whole('1000'),'1000');
 for(const value of ['0','-1','1e6','0.0000001','1.2345678','NaN','01'])assert.throws(()=>atomic(value,6));
 for(const value of ['0','1.5','-1','1e2','1000000000000000001']){assert.throws(()=>whole(value));assert.equal(validWhole(value),false);}
 assert.equal(validWhole('1000000000000000000'),true);assert.equal(validWhole('9'.repeat(10000)),false);
});
test('addresses and external approval URLs are constrained without any receiving allowlist',()=>{
 assert.equal(safeAddress('0x'+'a'.repeat(40)),'0x'+'a'.repeat(40));assert.throws(()=>safeAddress('0x'+'0'.repeat(40)));
 assert.equal(safeApproval('https://app.reidentity.net/tx-approve',config.approvalOrigin),'https://app.reidentity.net/tx-approve');
 for(const url of ['javascript:alert(1)','https://app.reidentity.net.attacker.test/','https://user:pass@app.reidentity.net/','http://app.reidentity.net/'])assert.equal(safeApproval(url,config.approvalOrigin),null);
});

test('wrong wallet/network or malformed prepared intent never becomes an approvable or settled action',()=>{
 const wallet='0x'+'a'.repeat(40),tx={to:'0x'+'b'.repeat(40),valueWei:'0',data:'0x',chainId:15324,gasEstimate:'21000',estimatedFeeWei:'100'};
 const intent={id:'real-intent',status:'CREATED',command:{type:'SEND'},walletAddress:wallet,chainId:15324,transaction:tx,approvalUrl:null,txHash:null,receipt:null,errorCode:null,expiresAt:new Date(Date.now()+120000).toISOString()};
 assert.equal(transactionIssue(intent,wallet),null);assert.equal(isSettled(intent),false);
 assert.ok(transactionIssue({...intent,chainId:1},wallet));assert.ok(transactionIssue(intent,'0x'+'c'.repeat(40)));assert.ok(transactionIssue({...intent,transaction:{...tx,valueWei:'1.2'}},wallet));
 for(const status of ['REJECTED','FAILED','EXPIRED','BROADCAST','AWAITING_APPROVAL','AWAITING_SECOND_APPROVAL','RECONCILIATION_REQUIRED'])assert.equal(isSettled({...intent,status}),false);
 assert.ok(transactionIssue({...intent,status:'CONFIRMED'},wallet));
 assert.equal(isSettled({...intent,status:'CONFIRMED',receipt:{status:'reverted',transactionHash:'0x'+'1'.repeat(64)},txHash:'0x'+'1'.repeat(64)}),false);
 assert.equal(isSettled({...intent,status:'CONFIRMED',receipt:{status:'success',transactionHash:'0x'+'2'.repeat(64)},txHash:'0x'+'1'.repeat(64)}),false);
 assert.equal(isSettled({...intent,status:'CONFIRMED',receipt:{status:'success',transactionHash:'0x'+'1'.repeat(64)},txHash:'0x'+'1'.repeat(64)}),true);
});

test('generated interface bundle is pinned to the exact OpenAPI schema and investor routes',()=>{
 const bytes=readFileSync(new URL('../artifacts/platform/openapi.json',import.meta.url)),manifest=JSON.parse(readFileSync(new URL('../artifacts/platform/api-manifest.json',import.meta.url),'utf8'));
 const hash=createHash('sha256').update(bytes).digest('hex');assert.equal(hash,manifest.schemaSha256);
 const client=readFileSync(new URL('../src/lib/platform/api.generated.ts',import.meta.url),'utf8');assert.ok(client.includes(hash));
 const api=JSON.parse(bytes);assert.equal(api.components.schemas.SupportAttachmentResponse.properties.sizeBytes.maximum,3*1024*1024);assert.equal(api.components.schemas.PortfolioHolding.properties.costBasis.$ref,'#/components/schemas/AcquisitionCostBasis');assert.equal(api.components.schemas.ProjectRevenueResponse.properties.series.$ref,'#/components/schemas/RevenueSeries');assert.deepEqual(api.components.schemas.WalletCashflowResponse.properties.includesNetworkFees.enum,[false]);for(const path of ['/v1/auth/session','/v1/wallet/cashflow','/v1/wallet/send-quote','/v1/projects/{id}/chain','/v1/projects/{id}/revenue','/v1/projects/{id}/rewards','/v1/transactions','/v1/marketplace/{id}/quote','/v1/marketplace/proceeds','/v1/support/{id}/messages'])assert.ok(api.paths[path],path);
});
test('USDT expense review requires the frozen canonical amount',()=>{
 const wallet='0x'+'a'.repeat(40),intent={id:'real',status:'CREATED',chainId:15324,walletAddress:wallet,command:{type:'BUY',asset:'USDT',quantity:'1'},transaction:{chainId:15324,to:'0x'+'b'.repeat(40),data:'0x',valueWei:'0',gasEstimate:'21000',estimatedFeeWei:'1'},approvalUrl:null,txHash:null,receipt:null,errorCode:null,expiresAt:new Date(Date.now()+120000).toISOString()};
 assert.ok(transactionIssue(intent,wallet));assert.equal(transactionIssue({...intent,review:{asset:'USDT',amountAtomic:'1000000',quantity:'1',recipient:wallet,spender:null}},wallet),null);
});

// Raw ABI enum values are numeric in actual indexed RevenueFunded responses.
test('contract revenue enums retain the original asset and exact atomic decimals',()=>{
 const rows=[{asset:1,amount:'1100000',expected:'1.1 USDT'},{asset:0,amount:'3600000000000000000',expected:'3.6 reAED'},{asset:'1',amount:'1',expected:'0.000001 USDT'},{asset:'0',amount:'1',expected:'0.000000000000000001 reAED'},{asset:'USDT',amount:'9007199254740993123456',expected:'9,007,199,254,740,993.123456 USDT'},{asset:'REAED',amount:'3600000000000000000',expected:'3.6 reAED'}];
 for(const row of rows){const asset=contractAsset(row.asset);assert.ok(asset);assert.equal(`${units(row.amount,decimals(asset))} ${assetLabel(asset)}`,row.expected);}
 for(const value of [null,undefined,false,true,2,-1,'01','1.0','usdt',{},[]])assert.equal(contractAsset(value),null);
});

test('public project IPFS URLs preserve content identity on the public gateway and reject URL injection',()=>{
 const cid='QmZN1FFxB9dD8od2BoWQDR9b9cUnV63qCWsvhcthsTsDJz';
 const url=new URL(publicIpfsUrl(cid));
 assert.equal(url.origin,'https://ipfs.filebase.io');assert.equal(url.pathname,`/ipfs/${cid}`);
 assert.equal(url.search,'');assert.equal(url.hash,'');assert.equal(url.username,'');assert.equal(url.password,'');
 for(const value of [null,undefined,{},[],1,'','a'.repeat(31),'a'.repeat(121),`https://evil.invalid/${cid}`,`//evil.invalid/${cid}`,`../${cid}`,`${cid}?token=private`,`${cid}#fragment`,`${cid}/document`,`${cid}%2Fdocument`,`${cid} `,`${cid}\n`])assert.throws(()=>publicIpfsUrl(value),/Invalid public IPFS CID/);
});

test('only OAuth GET endpoints may return redirects, never replaying mutation bodies even to trusted origins',async()=>{
 for(const method of ['POST','PATCH','DELETE']) {
  const path=method==='POST'?'transactions':method==='PATCH'?'notification-preferences':'email-notifications';
  for(const status of [301,302,303,307,308]) for(const location of [config.origin+'/invest/home',config.approvalOrigin+'/oauth/authorize']) {
   const res=await proxyPlatform(request(path,{method,headers:{Origin:config.origin,'X-CSRF-Token':'synthetic','Content-Type':'application/json'},body:'{"private":"synthetic-only"}'}),path.split('/'),config,async()=>new Response(null,{status,headers:{Location:location,'Set-Cookie':'resystem_session=synthetic-rejected'}}));
   assert.equal(res.status,502);assert.equal(res.headers.get('Location'),null);assert.equal(res.headers.get('Set-Cookie'),null);
  }
 }
 for(const path of ['auth/session','portfolio','wallet']) {
  const res=await proxyPlatform(request(path),path.split('/'),config,async()=>new Response(null,{status:307,headers:{Location:config.origin+'/invest'}}));
  assert.equal(res.status,502);assert.equal(res.headers.get('Location'),null);
 }
});
test('OAuth callback preserves cookies and trusted redirect while malformed redirect responses fail closed',async()=>{
 const res=await proxyPlatform(request('auth/reid/callback'),['auth','reid','callback'],config,async()=>new Response(null,{status:303,headers:{Location:config.origin+'/invest/home','Set-Cookie':'resystem_session=synthetic; HttpOnly; SameSite=Lax'}}));
 assert.equal(res.status,303);assert.equal(res.headers.get('Location'),config.origin+'/invest/home');assert.match(res.headers.get('Set-Cookie'),/resystem_session=synthetic/);
 for(const response of [new Response(null,{status:307}),new Response('{}',{status:200,headers:{Location:config.origin+'/invest/home'}})]) {
  const result=await proxyPlatform(request('auth/reid/start'),['auth','reid','start'],config,async()=>response);assert.equal(result.status,502);assert.equal(result.headers.get('Location'),null);
 }
});
