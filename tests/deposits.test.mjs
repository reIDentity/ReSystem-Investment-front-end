import test from 'node:test';
import assert from 'node:assert/strict';
import {formatUnits,normalizeDeposits,loadDeposits,INFRA_USDT} from '../src/lib/deposits.ts';
const wallet='0x1111111111111111111111111111111111111111';
const sender='0x2222222222222222222222222222222222222222';
const hash=n=>'0x'+n.toString(16).padStart(64,'0');
const base={from:{hash:sender},to:{hash:wallet},timestamp:'2026-10-16T06:00:00Z',block_number:100};
const native=(n=1,extra={})=>({...base,hash:hash(n),status:'ok',result:'success',value:'10000000000000000000',...extra});
const token=(n=2,extra={})=>({...base,transaction_hash:hash(n),log_index:1,total:{value:'1234567'},token:{address:INFRA_USDT,type:'ERC-20',decimals:'6'},...extra});
test('deposit amounts preserve native and USDT precision without floats',()=>{
 assert.equal(formatUnits('10000000000000000000',18),'10');
 assert.equal(formatUnits('1',18),'0.000000000000000001');
 assert.equal(formatUnits('1234567',6),'1.234567');
 assert.equal(formatUnits('999999999999999999999999999999',6),'999999999999999999999999.999999');
 assert.throws(()=>formatUnits('-1',18));
});
test('only confirmed incoming funds in the real supported assets are deposits',()=>{
 const result=normalizeDeposits(wallet,[native(),native(3,{status:'error',result:'execution reverted'}),native(4,{from:{hash:wallet}}),native(5,{to:{hash:sender}}),native(6,{value:'0'}),native(7,{block_number:null}),native(8,{timestamp:null})],[token(),token(9,{token:{address:sender,symbol:'USDT',type:'ERC-20',decimals:'6'}}),token(10,{token:{address:INFRA_USDT,type:'ERC-20',decimals:'18'}}),token(11,{from:{hash:wallet}})],[]);
 assert.deepEqual(result.map(d=>[d.asset,d.amount]),[['reAED','10'],['USDT','1.234567']]);
});
test('internal credits and multiple USDT logs are retained without duplicating a top-level transfer',()=>{
 const internal={...base,transaction_hash:hash(1),index:0,success:true,value:'10000000000000000000'};
 const result=normalizeDeposits(wallet,[native()],[token(),token(),token(2,{log_index:2,total:{value:'2000000'}})],[internal,{...internal,transaction_hash:hash(3),index:1},{...internal,transaction_hash:hash(4),index:2,success:false}]);
 assert.equal(result.length,4);assert.equal(result.filter(d=>d.asset==='USDT').length,2);assert.ok(result.some(d=>d.id==='internal:'+hash(3)+':1'));
});
test('history is sorted newest first and bounded to recent deposits',()=>{
 const result=normalizeDeposits(wallet,Array.from({length:12},(_,i)=>native(i+1,{block_number:100+i})),[],[]);
 assert.equal(result.length,8);assert.equal(result[0].blockNumber,111);assert.equal(result.at(-1).blockNumber,104);
});
test('partial explorer errors are disclosed without fabricating empty history or blocks',async()=>{
 const called=[];
 const response=await loadDeposits(wallet,async url=>{called.push(url);if(url.includes('token-transfers'))return new Response('unavailable',{status:503});if(url.endsWith('/stats'))return Response.json({total_blocks:'7280000'});return Response.json({items:url.includes('/transactions?')?[native()]:[],next_page_params:null});});
 assert.equal(response.deposits.length,1);assert.deepEqual(response.warnings,['USDT transfer history could not be loaded.']);assert.equal(response.indexedBlock,7280000);assert.equal(response.wallet,wallet);assert.ok(called.find(url=>url.includes('token='+INFRA_USDT)));
 await assert.rejects(loadDeposits(wallet,async()=>new Response('',{status:503})),/unavailable/);
 await assert.rejects(loadDeposits('not-a-wallet',async()=>{throw new Error('must not fetch')}),/Invalid wallet/);
});
