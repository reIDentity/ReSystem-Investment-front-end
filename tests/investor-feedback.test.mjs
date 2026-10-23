import test, {afterEach} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {JSDOM} from 'jsdom';
import {createRequire} from 'node:module';
import {clientRenderer} from './client-renderer.mjs';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://investor.example.invalid'});
for(const [key,value]of Object.entries({window:dom.window,self:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement}))Object.defineProperty(globalThis,key,{value,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {act,cleanup,fireEvent,render,waitFor}=await import('@testing-library/react');
const {default:useSWR,SWRConfig}=createRequire(import.meta.url)('swr');
const originalFetch=globalThis.fetch;
afterEach(()=>{cleanup();globalThis.fetch=originalFetch;});
const user={id:'synthetic-investor',name:'Synthetic QA',wallet:'0x'+'1'.repeat(40),kycStatus:'not_requested'};
const fragment=({children})=>React.createElement(React.Fragment,null,children);
function sharedUI(notices){
 return clientRenderer({
  'next/image':()=>null,'next/navigation':{usePathname:()=>'/invest/home',useRouter:()=>({})},
  '@/components/Logo':{Logo:()=>null},
  './PlatformProvider':{usePlatform:()=>({user,live:true,notify:message=>notices.push(message)}),useResource:()=>({data:{items:[]},mutate:async()=>{}})},
 }).load('src/components/invest/InvestorUI.tsx');
}
test('copy feedback follows the copied value and a rejected clipboard never reports success',async()=>{
 const notices=[],writes=[];let release;
 Object.defineProperty(window.navigator,'clipboard',{configurable:true,value:{writeText:async value=>{writes.push(value);await new Promise(resolve=>{release=resolve;});}}});
 const {CopyButton}=sharedUI(notices);const view=render(React.createElement(CopyButton,{value:user.wallet}));
 fireEvent.click(view.getByRole('button'));fireEvent.click(view.getByRole('button'));assert.equal(writes.length,1);
 await act(async()=>release());assert.ok(view.getByRole('button',{name:'Copied ✓'}));assert.equal(notices.at(-1),'Address copied to clipboard.');
 view.rerender(React.createElement(CopyButton,{value:'0x'+'2'.repeat(40)}));assert.ok(view.getByRole('button',{name:'Copy address'}));
 Object.defineProperty(window.navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Denied');}}});
 fireEvent.click(view.getByRole('button'));await waitFor(()=>assert.match(notices.at(-1),/Clipboard access is unavailable/));assert.ok(view.getByRole('button',{name:'Copy address'}));
});
test('account and notification popovers dismiss outside and Escape returns keyboard focus to the trigger',()=>{
 const {InvestorShell}=sharedUI([]);const view=render(React.createElement(InvestorShell,{page:'home',title:'Home',subtitle:'Synthetic only'},React.createElement('button',null,'Outside action')));
 const bell=view.getByRole('button',{name:'Notifications'});fireEvent.click(bell);assert.equal(bell.getAttribute('aria-expanded'),'true');
 fireEvent.keyDown(document,{key:'Escape'});assert.equal(bell.getAttribute('aria-expanded'),'false');assert.equal(document.activeElement,bell);
 const account=view.getByRole('button',{name:/Synthetic QA/});fireEvent.click(account);assert.equal(account.getAttribute('aria-expanded'),'true');
 fireEvent.pointerDown(view.getByRole('button',{name:'Outside action'}));assert.equal(account.getAttribute('aria-expanded'),'false');
});
test('confirmed deposit refresh gives feedback, while a failed refresh never announces success',async()=>{
 const notices=[];let fail=false;
 const data={wallet:user.wallet,address:user.wallet,items:[],provenance:{source:'synthetic'}};
 const resource={data,isValidating:false,isLoading:false,mutate:async fresh=>{if(fresh)await fresh;if(fail)throw new Error('Synthetic failure');return data;}};
 const {LiveDeposit}=clientRenderer({
  '@/lib/platform/client':{api:async()=>data},
  'next/image':()=>null,
  '../PlatformProvider':{usePlatform:()=>({user,notify:message=>notices.push(message)}),useResource:()=>resource},
  '../InvestorUI':{InvestorShell:fragment,Panel:fragment,Tag:fragment,Initials:fragment,CopyButton:()=>null,DataState:()=>null,Provenance:()=>null},
 }).load('src/components/invest/platform/LiveDeposit.tsx');
 const view=render(React.createElement(LiveDeposit));fireEvent.click(view.getByRole('button',{name:'Refresh deposits'}));
 await waitFor(()=>assert.match(notices.at(-1),/Deposit history refreshed/));
 await waitFor(()=>assert.equal(view.getByRole('button',{name:'Refresh deposits'}).disabled,false));
 fail=true;fireEvent.click(view.getByRole('button',{name:'Refresh deposits'}));await waitFor(()=>assert.match(notices.at(-1),/Could not refresh deposits/));
 assert.equal(notices.filter(value=>value.startsWith('Deposit history refreshed')).length,1);
});
test('mounted SWR never treats stale cached deposits as a successful refresh after an HTTP 503',async()=>{
 const notices=[];let fail=false;
 const data={wallet:user.wallet,address:user.wallet,items:[{tx_hash:'0x'+'a'.repeat(64),activity_index:'1',asset:'USDT',amount_atomic:'1000000',timestamp:'2026-10-23T06:00:00Z'}]};
 globalThis.fetch=async()=>fail?Response.json({error:{message:'Synthetic service failure'}},{status:503}):Response.json(data);
 const {api}=clientRenderer().load('src/lib/platform/client.ts');
 const {LiveDeposit}=clientRenderer({
  'next/image':()=>null,
  '../PlatformProvider':{usePlatform:()=>({user,notify:message=>notices.push(message)}),useResource:path=>useSWR([user.id,path],()=>api(path),{shouldRetryOnError:false,revalidateOnFocus:false,dedupingInterval:0})},
  '../InvestorUI':{InvestorShell:fragment,Panel:fragment,Tag:fragment,Initials:fragment,CopyButton:()=>null,DataState:({error})=>error?React.createElement('p',{role:'alert'},error.message):null,Provenance:()=>null},
 }).load('src/components/invest/platform/LiveDeposit.tsx');
 const view=render(React.createElement(SWRConfig,{value:{provider:()=>new Map()}},React.createElement(LiveDeposit)));
 await waitFor(()=>assert.equal(view.container.querySelectorAll('.iv-real-deposit').length,1));
 fail=true;fireEvent.click(view.getByRole('button',{name:'Refresh deposits'}));
 await waitFor(()=>assert.match(notices.at(-1),/Could not refresh deposits/));
 assert.match(view.getByRole('alert').textContent,/could not refresh/);
 assert.equal(view.container.querySelectorAll('.iv-real-deposit').length,0);
 assert.equal(notices.some(value=>value.startsWith('Deposit history refreshed')),false);
 fail=false;fireEvent.click(view.getByRole('button',{name:'Refresh deposits'}));
 await waitFor(()=>assert.match(notices.at(-1),/Deposit history refreshed/));
 assert.equal(view.queryByRole('alert'),null);assert.equal(view.container.querySelectorAll('.iv-real-deposit').length,1);
});
test('mounted SWR reports a completed read-all mutation separately from its failed list refresh',async()=>{
 const notices=[];let listReads=0,mutations=0;
 globalThis.fetch=async(path,options)=>{
  if(String(path).endsWith('/auth/session'))return Response.json({authenticated:true,kind:'investor',csrfToken:'synthetic'});
  if(options?.method==='PATCH'){mutations++;return Response.json({updated:1});}
  if(String(path).endsWith('/notifications')){listReads++;return listReads>1?Response.json({error:{message:'Synthetic unavailable'}},{status:503}):Response.json({items:[{id:'one',title:'Actual update',body:'Synthetic body',createdAt:'2026-10-23T06:00:00Z',href:'/invest/activity',readAt:null}],nextCursor:null});}
  if(String(path).endsWith('/notification-preferences'))return Response.json({transactionUpdates:true,supportUpdates:true});
  return Response.json({deliveryEnabled:false});
 };
 const {api}=clientRenderer().load('src/lib/platform/client.ts');
 const {InvestorNotifications}=clientRenderer({
  './PlatformProvider':{usePlatform:()=>({user,notify:message=>notices.push(message)}),useResource:path=>useSWR([user.id,path],()=>api(path),{shouldRetryOnError:false,revalidateOnFocus:false,dedupingInterval:0})},
  './InvestorUI':{InvestorShell:fragment,Panel:fragment,Tag:fragment,notificationPath:()=>'/invest/activity',DataState:()=>null},
  './platform/Transaction':{IntentReview:()=>null},
 }).load('src/components/invest/ActivitySupport.tsx');
 const view=render(React.createElement(SWRConfig,{value:{provider:()=>new Map()}},React.createElement(InvestorNotifications)));
 await waitFor(()=>assert.ok(view.getByText('Actual update')));
 fireEvent.click(view.getByRole('button',{name:'Mark all as read'}));
 await waitFor(()=>assert.match(notices.at(-1),/were marked as read, but the list could not refresh/));
 assert.equal(mutations,1);assert.equal(listReads,2);
});
