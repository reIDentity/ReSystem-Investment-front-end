import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React from 'react';
import { clientRenderer } from './client-renderer.mjs';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url:'https://investor.example.invalid' });
for (const [key,value] of Object.entries({window:dom.window,self:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement})) Object.defineProperty(globalThis,key,{value,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {cleanup,fireEvent,render}=await import('@testing-library/react');
afterEach(cleanup);
function fixture(status,extra={}) {
 const changes=[];
 const {EmailPreferences}=clientRenderer({'./InvestorUI':{Tag:({children})=>React.createElement('span',null,children)},'./platform/Transaction':{}},{'src/components/invest/ActivitySupport.tsx':['EmailPreferences']}).load('src/components/invest/ActivitySupport.tsx');
 return {changes,view:render(React.createElement(EmailPreferences,{status,inApp:{transactionUpdates:true,supportUpdates:true},chosen:{transactionEmails:true,supportEmails:true},change:value=>changes.push(JSON.parse(JSON.stringify(value))),...extra}))};
}
test('connected provider email renders only masked address and delivery preferences, with no second confirmation step',()=>{
 const {view,changes}=fixture({verifiedEmail:'h•••••@example.org'});
 assert.ok(view.getByText('Connected'));assert.ok(view.getByText('h•••••@example.org'));assert.equal(view.queryByRole('form'),null);assert.equal(view.queryByRole('button'),null);
 fireEvent.click(view.getByLabelText('Transaction emails'));assert.deepEqual(changes,[{transactionEmails:false,supportEmails:true}]);
});
test('missing and legacy pending emails explain how to update reID without exposing another email entry or resend flow',()=>{
 for (const status of [{verifiedEmail:null},{verifiedEmail:null,pendingEmail:'h•••••@example.org',pendingSource:'REID_PROFILE'},{verifiedEmail:null,pendingEmail:'h•••••@example.org',pendingSource:'INVESTOR_ENTERED',verificationExpiresAt:'2026-01-01T00:00:00Z'}]) {
  const {view,changes}=fixture(status);assert.ok(view.getByText(/Add an email address to your reID account/));assert.equal(view.queryByRole('textbox'),null);assert.equal(view.queryByRole('button'),null);assert.deepEqual(changes,[]);view.unmount();
 }
});
test('an unavailable preferences source disables both email controls and cannot change cached settings',()=>{
 const {view,changes}=fixture({verifiedEmail:'h•••••@example.org'},{unavailable:true});
 for (const input of view.getAllByRole('checkbox')) {assert.equal(input.disabled,true);fireEvent.click(input);}
 assert.deepEqual(changes,[]);
});
test('in-app category opt-outs keep the corresponding email controls disabled',()=>{
 const {view}=fixture({verifiedEmail:'h•••••@example.org'},{inApp:{transactionUpdates:false,supportUpdates:true}});
 assert.equal(view.getByLabelText('Transaction emails').disabled,true);assert.equal(view.getByLabelText('Support reply emails').disabled,false);
});
