import assert from 'node:assert/strict';
import test from 'node:test';
import { createReadAhead, routeResources, activityPath } from '../src/lib/platform/read-ahead.ts';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}

test('read-ahead is bounded across repeated intents and skips cached paths without background fan-out',async()=>{
 const calls=[],jobs=[],published=[];let active=0,peak=0;
 const reader=createReadAhead(path=>{calls.push(path);active++;peak=Math.max(peak,active);const d=deferred();jobs.push(d);return d.promise.finally(()=>active--);});
 const warm=paths=>reader.warm(paths,path=>path==='cached',async(path,value)=>{published.push({path,value});});
 warm(['cached','a','b','c']);warm(['a','b','d','e']);warm(['f','g','h','i']);
 await tick();assert.equal(calls.length,2);
 for(let n=0;n<10&&jobs.length;n++){const batch=jobs.splice(0);batch.forEach(job=>job.resolve({actual:true}));await tick();}
 assert.ok(peak<=2);assert.ok(calls.length<=8);assert.equal(calls.length,new Set(calls).size);assert.ok(!calls.includes('cached'));assert.equal(published.length,calls.length);
});
test('first mounted read joins pending speculation; a forced refresh does not join or publish older pre-mutation data',async()=>{
 const calls=[],jobs=[],published=[];const reader=createReadAhead(path=>{calls.push(path);const d=deferred();jobs.push(d);return d.promise;});
 reader.warm(['wallet'],()=>false,async(path,value)=>{published.push(value);});await tick();
 const mounted=reader.read('wallet');const forced=reader.read('wallet');await tick();assert.equal(calls.length,2);
 jobs[0].resolve({balance:'old'});assert.equal((await mounted).balance,'old');await tick();assert.deepEqual(published,[]);
 jobs[1].resolve({balance:'fresh'});assert.equal((await forced).balance,'fresh');
 const again=reader.read('wallet');await tick();assert.equal(calls.length,3);jobs[2].resolve({balance:'newest'});await again;
});
test('session invalidation discards late normal/speculative reads and queued work; another instance shares no private state',async()=>{
 const jobs=[],published=[],calls=[];const reader=createReadAhead(path=>{calls.push(path);const d=deferred();jobs.push(d);return d.promise;});
 reader.warm(['a','b','queued'],()=>false,async(path,value)=>published.push(value));const normal=reader.read('normal');const rejected=assert.rejects(normal,/session has ended/);await tick();reader.invalidate();jobs.forEach(job=>job.resolve({private:'old-session'}));await rejected;await tick();assert.deepEqual(published,[]);assert.ok(!calls.includes('queued'));
 const other=createReadAhead(async()=>({private:'other-session'}));assert.equal((await other.read('a')).private,'other-session');
});
test('speculative failure is not cached or published and a later real read retries normally',async()=>{
 let calls=0;const published=[];const reader=createReadAhead(async()=>{if(++calls===1)throw Error('Unavailable');return{ok:true};});reader.warm(['portfolio'],()=>false,async(_,value)=>published.push(value));await tick();assert.deepEqual(published,[]);assert.equal((await reader.read('portfolio')).ok,true);assert.equal(calls,2);
});
test('route hints contain only bounded GETs and canonical Activity filters/boundaries; never a transaction/quote/auth action',()=>{
 for(const href of ['/invest/home','/invest/explore','/invest/earnings','/invest/wallet','/invest/support','/invest/notifications','/invest/deposit','/invest/products/actual-public-id']){
  const paths=routeResources(href);assert.ok(paths.length<=4);for(const path of paths)assert.doesNotMatch(path,/transactions|quote|submit|auth|send/);
 }
 assert.deepEqual(routeResources('/invest/activity?filter=deposits'),['activity?page=1&pageSize=10&filter=deposits']);
 assert.deepEqual(routeResources('https://attacker.invalid/invest/home'),[]);assert.deepEqual(routeResources('/api/auth/logout'),[]);
 assert.equal(activityPath(3,'all','100'),'activity?page=3&pageSize=10&filter=all&snapshotBlock=100');
});
