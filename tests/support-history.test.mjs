import test,{afterEach} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { JSDOM } from 'jsdom';
import {clientRenderer} from './client-renderer.mjs';
const dom=new JSDOM('<html><body></body></html>',{url:'https://investor.invalid'});
for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement}))Object.defineProperty(globalThis,key,{value,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {render,cleanup,fireEvent,act}=await import('@testing-library/react');
afterEach(cleanup);
const {useSupportHistory}=clientRenderer().load('src/lib/use-support-history.ts');
const m=(id)=>({id,createdAt:'2026-10-31T00:00:00Z',body:id});
function View({scope,page,read}){const h=useSupportHistory(scope,page,read);return React.createElement('div',null,h.messages.map(x=>React.createElement('p',{key:x.id},x.body)),h.hasOlder?React.createElement('button',{onClick:h.loadOlder,disabled:h.busy},'Older'):null,h.error);}
test('conversation opens at latest, merges older pages once and discards delayed responses after switching tickets',async()=>{
 let finish;const read=()=>new Promise(resolve=>{finish=resolve;});
 const view=render(React.createElement(View,{scope:'userA:ticketA',page:{messages:[m('03')],nextMessageCursor:'next'},read}));
 fireEvent.click(view.getByText('Older'));await act(async()=>finish({messages:[m('01'),m('02')],nextMessageCursor:null}));
 assert.deepEqual([...view.container.querySelectorAll('p')].map(p=>p.textContent),['01','02','03']);
 view.rerender(React.createElement(View,{scope:'userA:ticketA',page:{messages:[m('04')],nextMessageCursor:'new'},read}));
 fireEvent.click(view.getByText('Older'));
 view.rerender(React.createElement(View,{scope:'userB:ticketB',page:{messages:[m('private-B')],nextMessageCursor:null},read}));
 await act(async()=>finish({messages:[m('private-A')],nextMessageCursor:null}));
 assert.equal(view.queryByText('private-A'),null);assert.ok(view.getByText('private-B'));
});
