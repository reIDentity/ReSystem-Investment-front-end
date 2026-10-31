import test, {afterEach} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {JSDOM} from 'jsdom';
import {clientRenderer} from './client-renderer.mjs';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://investor.example.invalid'});
for(const [key,value]of Object.entries({window:dom.window,self:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement}))Object.defineProperty(globalThis,key,{value,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {act,cleanup,fireEvent,render}=await import('@testing-library/react');
afterEach(cleanup);
function fixture(){
 let now=0,id=0,feedback,report;const timers=new Map();
 const runtime=clientRenderer({}, {}, {setTimeout:(cb,delay)=>{timers.set(++id,{cb,at:now+delay});return id;},clearTimeout:id=>timers.delete(id)});
 const {ActionFeedbackProvider,useActionFeedback,useActionError,useFeedbackMessage}=runtime.load('src/components/ActionFeedback.tsx');
 function Probe({message=''}){feedback=useActionFeedback();[,report]=useActionError();useFeedbackMessage(message);return React.createElement('input',{'aria-label':'Keep focus'});}
 const tree=(scope='one',message='')=>React.createElement(ActionFeedbackProvider,{scope},React.createElement(Probe,{message}));
 const view=render(tree());
 return {view,tree,timers,feedback:()=>feedback,report:value=>act(()=>report(value)),notify:(value,kind)=>act(()=>feedback.notify(value,{kind})),advance:async value=>{now+=value;await act(async()=>{for(const [key,timer]of [...timers])if(timer.at<=now){timers.delete(key);timer.cb();}});}};
}
test('action errors are visible alerts, persist, dismiss, and announce identical retries without moving focus',async()=>{
 const f=fixture(),input=f.view.getByLabelText('Keep focus');input.focus();
 f.report('Choose an expiry within the next year.');
 const first=f.view.getByRole('alert');assert.match(first.textContent,/Choose an expiry/);assert.equal(document.activeElement,input);
 await f.advance(60000);assert.equal(f.view.getByRole('alert'),first);
 fireEvent.click(f.view.getByRole('button',{name:'Dismiss notification'}));assert.equal(f.view.queryByRole('alert'),null);
 f.report('Choose an expiry within the next year.');assert.notEqual(f.view.getByRole('alert'),first);
 f.report('');assert.equal(f.view.queryByRole('alert'),null);
});
test('success feedback pauses for hover and keyboard focus and cannot dismiss a later error',async()=>{
 const f=fixture();f.notify('Preferences saved.','success');
 const toast=f.view.getByRole('status').closest('.action-toast');
 await f.advance(7000);fireEvent.mouseEnter(toast);await f.advance(60000);assert.ok(f.view.getByRole('status'));
 fireEvent.mouseLeave(toast);await f.advance(7000);fireEvent.focus(f.view.getByRole('button',{name:'Dismiss notification'}));await f.advance(60000);assert.ok(f.view.getByRole('status'));
 fireEvent.blur(f.view.getByRole('button',{name:'Dismiss notification'}),{relatedTarget:f.view.getByLabelText('Keep focus')});
 await f.advance(8000);assert.equal(f.view.queryByRole('status'),null);
 f.notify('Saved.','success');const timer=[...f.timers.values()][0];f.report('Submission outcome is uncertain. Check Activity.');
 await act(async()=>timer.cb());assert.match(f.view.getByRole('alert').textContent,/uncertain/);
});
test('polling errors do not reappear after dismissal unless recovered or changed; account changes erase feedback',()=>{
 const f=fixture();f.view.rerender(f.tree('one','Unavailable. Support reference: first'));
 fireEvent.click(f.view.getByRole('button',{name:'Dismiss notification'}));
 f.view.rerender(f.tree('one','Unavailable. Support reference: second'));assert.equal(f.view.queryByRole('alert'),null);
 f.view.rerender(f.tree('one',''));f.view.rerender(f.tree('one','Unavailable. Support reference: third'));assert.ok(f.view.getByRole('alert'));
 f.view.rerender(f.tree('two'));assert.equal(f.view.queryByRole('alert'),null);
 f.view.rerender(f.tree('one'));assert.equal(f.view.queryByRole('alert'),null);
});
test('toast moves into the active native dialog, remains dismissible and returns to the page on close',()=>{
 const f=fixture(),dialog=document.createElement('dialog');document.body.append(dialog);dialog.open=true;let release;
 f.report('Review failed.');act(()=>{release=f.feedback().registerDialog(dialog);});
 assert.ok(dialog.contains(f.view.getByRole('alert')));fireEvent.click(f.view.getByRole('button',{name:'Dismiss notification'}));assert.equal(dialog.querySelector('.action-toast'),null);
 f.notify('Saved.','success');act(()=>release());assert.equal(dialog.querySelector('.action-toast'),null);assert.ok(document.body.contains(f.view.getByRole('status')));dialog.remove();
});
test('actual product listing validation uses a toast and never opens transaction review for an expired listing',()=>{
 const fragment=({children})=>React.createElement(React.Fragment,null,children);let reviews=0;
 const resources={
  'projects/synthetic':{id:'synthetic',title:'Synthetic project',description:'Test only',maxFractions:'10000',media:[]},
  'projects/synthetic/chain':{totalSupply:'10',remainingSupply:'9990',saleOpen:true,purchasePaused:false},
  portfolio:{items:[{projectId:'synthetic',quantity:'10',claimable:[],claimed:[]}]},wallet:{assets:[]},
 };
 const runtime=clientRenderer({
  'next/image':()=>null,
  './PlatformProvider':{useResource:path=>({data:resources[path],isLoading:false})},
  './InvestorUI':{InvestorShell:fragment,Panel:fragment,Tag:fragment,Asset:()=>null,CopyButton:()=>null,DataState:()=>null},
  './platform/Transaction':{TransactionReview:()=>{reviews++;return null;}},'./platform/AssetSelect':{AssetSelect:()=>null},
 });
 const {ActionFeedbackProvider}=runtime.load('src/components/ActionFeedback.tsx');
 const {InvestorProduct}=runtime.load('src/components/invest/ProductDetail.tsx');
 const view=render(React.createElement(ActionFeedbackProvider,null,React.createElement(InvestorProduct,{id:'synthetic'})));
 view.container.querySelector('details').open=true;
 fireEvent.change(view.getByLabelText('Price per share (USDT)'),{target:{value:'0.001'}});
 fireEvent.change(view.getByLabelText('Expiry'),{target:{value:'2020-01-01T00:00'}});
 const form=view.getByRole('button',{name:'Review listing'}).closest('form');fireEvent.submit(form);
 assert.match(view.getByRole('alert').textContent,/Choose an expiry within the next year/);assert.equal(reviews,0);
 assert.equal(view.container.querySelector('.iv-form-error'),null);
 fireEvent.click(view.getByRole('button',{name:'Dismiss notification'}));fireEvent.submit(form);assert.ok(view.getByRole('alert'));assert.equal(reviews,0);
});
