import test from 'node:test';
import assert from 'node:assert/strict';
import { proxyArtwork } from '../src/lib/platform/artwork-proxy.ts';
import { publicApiError } from '../src/lib/public-api-errors.ts';
const cid='a'.repeat(46),base='https://api.example.invalid/v1/';
test('public artwork forwards no authentication, rejects arbitrary routes and caches only valid bounded images',async()=>{
 let calls=0;
 const fetcher=async(url,options)=>{calls++;assert.equal(url,`${base}projects/project-a/artwork/${cid}?size=icon`);assert.equal(options.redirect,'error');assert.deepEqual(Object.keys(options.headers),['Accept']);return new Response(new Uint8Array([1,2]),{headers:{'content-type':'image/webp'}});};
 const request=new Request('https://investor.invalid/api/artwork',{headers:{cookie:'private-session',authorization:'private-token'}});
 const result=await proxyArtwork(request,'project-a',cid,base,fetcher);assert.equal(result.status,200);assert.match(result.headers.get('cache-control'),/public/);
 assert.equal((await proxyArtwork(request,'../private',cid,base,fetcher)).status,400);assert.equal(calls,1);
 const failed=await proxyArtwork(request,'project-a',cid,base,async()=>Response.json({private:'not image'}));assert.equal(failed.status,503);assert.equal(failed.headers.get('cache-control'),'no-store');
 const large=await proxyArtwork(request,'project-a',cid,base,async()=>new Response(new Uint8Array(512*1024+1),{headers:{'content-type':'image/webp'}}));assert.equal(large.status,502);
});
test('only known error reasons and UUID references can reach user-facing copy',()=>{
 assert.equal(publicApiError({error:{reason:'arbitrary-secret',requestId:'secret-token'}}).message,undefined);
 assert.equal(publicApiError({error:{reason:'INSUFFICIENT_GAS',requestId:'secret-token'}}).reference,undefined);
 assert.match(publicApiError({error:{reason:'INSUFFICIENT_GAS'}}).message,/reAED/);
});
