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







