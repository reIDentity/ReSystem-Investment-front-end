import test,{afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React from 'react';
import {createRequire} from 'node:module';
const {useSWRConfig}=createRequire(import.meta.url)('swr');
import {clientRenderer} from './client-renderer.mjs';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://investor.example.invalid'});
for(const [key,value]of Object.entries({window:dom.window,self:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement}))Object.defineProperty(globalThis,key,{value,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {act,cleanup,fireEvent,render,waitFor}=await import('@testing-library/react');
const originalFetch=globalThis.fetch;afterEach(()=>{cleanup();globalThis.fetch=originalFetch;});
const wallet='0x'+'1'.repeat(40),user={id:'performance-investor',name:'Synthetic QA',wallet};
const session={authenticated:true,kind:'investor',user:{id:user.id,walletAddress:wallet},csrfToken:'synthetic'};
const children=({children})=>React.createElement(React.Fragment,null,children);
const ui={InvestorShell:children,Panel:children,Initials:children,Tag:children,Provenance:()=>null,DataState:({error})=>error?React.createElement('p',{role:'alert'},error.message):null};
const row={tx_hash:'0x'+'a'.repeat(64),timestamp:'2026-10-22T00:00:00Z',type:'wallet_transfer',direction:'incoming',asset:'USDT',amount_atomic:'1000000',status:'CONFIRMED',block_number:'100'};
const payload=(page=1,filter='all')=>({items:Array.from({length:10},(_,i)=>({...row,activity_index:`${page}:${i}`})),nextCursor:null,pagination:{page,pageSize:10,total:30,totalPages:3,filter,snapshotBlock:'100'}});
function fixture(fetcher){
 globalThis.fetch=fetcher;
 const runtime=clientRenderer({'./InvestorUI':ui,'./platform/Transaction':{IntentReview:()=>null}});
 const {PlatformProvider}=runtime.load('src/components/invest/PlatformProvider.tsx');
 const {InvestorActivity}=runtime.load('src/components/invest/ActivitySupport.tsx');
 return{runtime,view:render(React.createElement(PlatformProvider,{user,live:true,approvalOrigin:'https://app.reidentity.net',initialSession:session},React.createElement(InvestorActivity)))};
}
test('server-validated session seeds hydration; pending next page keeps actual rows/range and shares one in-flight GET',async()=>{
 const calls=[];let finishPage;
 const {view}=fixture(async url=>{
  const path=String(url);calls.push(path);
  if(path.includes('/transactions'))return Response.json({items:[],nextCursor:null});
  const q=new URL(path,'https://investor.invalid').searchParams,page=Number(q.get('page'));
  if(page===2)return new Promise(resolve=>{finishPage=()=>resolve(Response.json(payload(2)));});
  return Response.json(payload(page||1,q.get('filter')||'all'));
 });
 await view.findByText('Showing 1–10 of 30 transactions');await waitFor(()=>assert.equal(typeof finishPage,'function'));
 assert.equal(calls.filter(x=>x.endsWith('/auth/session')).length,0);
 fireEvent.click(view.getByRole('button',{name:'Page 2',exact:true}));
 assert.equal(view.container.querySelectorAll('tbody tr').length,10);assert.ok(view.getByText('Showing 1–10 of 30 transactions'));
 assert.equal(view.container.querySelector('table').getAttribute('aria-busy'),'true');
 await act(async()=>finishPage());await view.findByText('Showing 11–20 of 30 transactions');
 assert.equal(calls.filter(x=>new URL(x,'https://investor.invalid').searchParams.get('page')==='2').length,1);
 assert.equal(view.container.querySelector('table').getAttribute('aria-busy'),'false');
});
test('background revalidation leaves pagination enabled; cached data from a different filter cannot masquerade as selected results',()=>{
 let selected='all';const {InvestorActivity}=clientRenderer({'./PlatformProvider':{usePlatform:()=>({user}),useResource:path=>path.startsWith('activity?')?{data:payload(1,selected),isLoading:false,isValidating:true,error:null,mutate:async()=>{}}:{data:{items:[],nextCursor:null},mutate:async()=>{}}},'./InvestorUI':ui,'./platform/Transaction':{IntentReview:()=>null}}).load('src/components/invest/ActivitySupport.tsx');
 const view=render(React.createElement(InvestorActivity));assert.equal(view.getByRole('button',{name:'Page 2',exact:true}).disabled,false);
 fireEvent.click(view.getByRole('button',{name:'Withdrawals',exact:true}));assert.equal(view.container.querySelectorAll('tbody tr').length,0);assert.equal(view.queryByText('Showing 1–10 of 30 transactions'),null);
});
test('a late prefetched response after protected 401 cannot repopulate session cache or private children',async()=>{
 let complete;const calls=[];
 globalThis.fetch=async url=>{calls.push(String(url));if(String(url).endsWith('/slow'))return new Promise(resolve=>{complete=resolve;});return Response.json({}, {status:401});};
 const runtime=clientRenderer();const {PlatformProvider,usePlatform}=runtime.load('src/components/invest/PlatformProvider.tsx');const {api}=runtime.load('src/lib/platform/client.ts');let cache;
 function Screen(){cache=useSWRConfig().cache;const {prefetch}=usePlatform();return React.createElement('button',{onClick:()=>prefetch(['slow'])},'Warm next page');}
 const view=render(React.createElement(PlatformProvider,{user,live:true,approvalOrigin:'https://app.reidentity.net',initialSession:session},React.createElement(Screen)));
 fireEvent.click(view.getByRole('button',{name:'Warm next page'}));await waitFor(()=>assert.equal(typeof complete,'function'));
 await act(async()=>{await assert.rejects(api('wallet'));});await view.findByRole('heading',{name:'Your session has ended'});
 await act(async()=>{complete(Response.json({private:'late'}));});assert.equal([...cache.values()].some(v=>v.data?.private),false);
});

test('an authenticated response for another user with the same wallet still clears the previous private scope',async()=>{
 globalThis.fetch=async()=>Response.json({private:'previous-user'});
 const runtime=clientRenderer();const {PlatformProvider,useResource}=runtime.load('src/components/invest/PlatformProvider.tsx');let update,cache;
 function Screen(){const state=useSWRConfig();update=state.mutate;cache=state.cache;const data=useResource('portfolio',0);return React.createElement('p',null,data.data?.private||'Loading');}
 const view=render(React.createElement(PlatformProvider,{user,live:true,approvalOrigin:'https://app.reidentity.net',initialSession:session},React.createElement(Screen)));
 await view.findByText('previous-user');await act(async()=>{await update('platform-session',{...session,user:{...session.user,id:'another-user'}},{revalidate:false});});await view.findByRole('heading',{name:'Your session has ended'});assert.equal(view.queryByText('previous-user'),null);await waitFor(()=>assert.equal([...cache.values()].some(v=>v.data?.private),false));
});

test('hidden approval history stops periodic polling, refreshes on expansion and restores its interval only while visible',async()=>{
 const intervals=[],refreshes=[];const {InvestorActivity}=clientRenderer({'./PlatformProvider':{usePlatform:()=>({user}),useResource:(path,interval)=>{if(path==='transactions'){intervals.push(interval);return{data:{items:[],nextCursor:null},mutate:async()=>{refreshes.push(path);}};}return{data:payload(),isLoading:false,error:null,mutate:async()=>{}};}},'./InvestorUI':ui,'./platform/Transaction':{IntentReview:()=>null}}).load('src/components/invest/ActivitySupport.tsx');
 const view=render(React.createElement(InvestorActivity));assert.equal(intervals.at(-1),0);const details=view.container.querySelector('details');
 await act(async()=>{details.open=true;fireEvent(details,new dom.window.Event('toggle'));});assert.equal(intervals.at(-1),10000);assert.ok(refreshes.length>0);
 await act(async()=>{details.open=false;fireEvent(details,new dom.window.Event('toggle'));});assert.equal(intervals.at(-1),0);
});
