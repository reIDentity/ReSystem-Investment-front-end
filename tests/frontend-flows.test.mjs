import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React from 'react';
import {createRequire} from 'node:module';
import { clientRenderer } from './client-renderer.mjs';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://investor.example.invalid' });
for (const [key, value] of Object.entries({ window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, FormData: dom.window.FormData, File: dom.window.File })) Object.defineProperty(globalThis, key, { value, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { act, cleanup, fireEvent, render, waitFor } = await import('@testing-library/react');
const { SWRConfig, useSWRConfig } = createRequire(import.meta.url)('swr');
const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });
const children = ({ children }) => React.createElement(React.Fragment, null, children);
const ui = {
  InvestorShell: children, Panel: children, Modal: ({ title, children }) => React.createElement('section', { role: 'dialog', 'aria-label': title }, children),
  DataState: ({ error }) => error ? React.createElement('p', { role: 'alert' }, error.message) : null,
  Initials: ({ name }) => React.createElement('span', null, name), Tag: children, Provenance: () => null, notificationPath: () => '/invest/activity',
};
const wallet = `0x${'1'.repeat(40)}`;
const user = { id: 'synthetic-investor', wallet, name: 'Synthetic QA' };
const resource = data => ({ data, error: undefined, isLoading: false, mutate: async () => {} });
function supportFixture(transport, refreshFailure = false) {
  const tickets = ['alpha', 'beta'].map(id => ({ id, subject: `Case ${id}`, status: 'OPEN', updatedAt: '2026-10-01T00:00:00Z', messages: [] }));
  const calls = [], refreshed = [], notices = [];
  let finish;
  const { InvestorSupport } = clientRenderer({
    './PlatformProvider': { usePlatform: () => ({ user, live: true, notify: value => notices.push(value) }), useResource: endpoint => ({ ...resource(endpoint === 'support' ? { items: tickets, nextCursor: null } : tickets.find(t => endpoint === `support/${t.id}`)), mutate: async fresh => { refreshed.push(endpoint); if (fresh) await fresh; if (refreshFailure) throw new Error("Synthetic list refresh failed"); } }) },
    '@/lib/platform/client': { api: (endpoint, options) => { if (!options?.method) return Promise.resolve({ items: [], nextCursor: null }); calls.push({ endpoint, options }); if (transport) return transport(endpoint, options); return new Promise((resolve, reject) => { finish = { resolve, reject }; }); } },
    './InvestorUI': ui, './platform/Transaction': { IntentReview: () => null },
  }).load('src/components/invest/ActivitySupport.tsx');
  const view = render(React.createElement(SWRConfig, { value: { provider: () => new Map(), dedupingInterval: 0 } }, React.createElement(InvestorSupport)));
  return { view, calls, refreshed, notices, settle: async error => { await act(async () => error ? finish.reject(error) : finish.resolve({})); } };
}
test('ticket switching erases unsent cross-ticket text and a late reply cannot erase the new draft or show false success', async () => {
  const { view, calls, refreshed, notices, settle } = supportFixture();
  fireEvent.change(view.getByLabelText('Your reply'), { target: { value: 'Alpha draft' } });
  fireEvent.submit(view.getByLabelText('Your reply').closest('form'));
  fireEvent.submit(view.getByLabelText('Your reply').closest('form'));
  assert.equal(calls.length, 1);
  fireEvent.click(view.getByRole('button', { name: /Case beta/ }));
  assert.equal(view.getByLabelText('Your reply').value, '');
  fireEvent.change(view.getByLabelText('Your reply'), { target: { value: 'Beta private draft' } });
  await settle();
  assert.equal(view.getByLabelText('Your reply').value, 'Beta private draft');
  assert.equal(calls[0].endpoint, 'support/alpha/messages');
  assert.equal(calls[0].options.body.body, 'Alpha draft');
  assert.deepEqual(refreshed.sort(), ['support', 'support/alpha']);
  assert.deepEqual(notices, []);
});
test('a rejected reply never leaks its error into a different ticket', async () => {
  const { view, settle } = supportFixture();
  fireEvent.change(view.getByLabelText('Your reply'), { target: { value: 'Alpha draft' } });
  fireEvent.submit(view.getByLabelText('Your reply').closest('form'));
  fireEvent.click(view.getByRole('button', { name: /Case beta/ }));
  await settle(new Error('Alpha-only failure'));
  assert.equal(view.queryByText('Alpha-only failure'), null);
});
test('duplicate new-ticket submission creates only one durable request', async () => {
  const { view, calls, settle } = supportFixture();
  fireEvent.click(view.getByRole('button', { name: 'New ticket' }));
  fireEvent.change(view.getByLabelText('Subject'), { target: { value: 'Synthetic request' } });
  fireEvent.change(view.getByLabelText('How can we help?'), { target: { value: 'Synthetic question body' } });
  const form = view.getByLabelText('Subject').closest('form');
  fireEvent.submit(form); fireEvent.submit(form);
  assert.equal(calls.length, 1);
  await settle(new Error('Controlled failure'));
});
test('private image retry reuses its saved message and exact upload key without duplicating the reply', async () => {
  let uploads = 0;
  const { view, calls } = supportFixture(async endpoint => {
    if (endpoint.endsWith('/messages')) return { id: 'saved-alpha-message' };
    uploads++; if (uploads === 1) throw new Error('Controlled image upload failure');
    return { id: 'saved-image' };
  });
  fireEvent.change(view.getByLabelText('Your reply'), { target: { value: 'Image for support' } });
  const file = new File([new Uint8Array([1, 2, 3])], 'synthetic-private.png', { type: 'image/png' });
  fireEvent.change(view.getByLabelText('Choose private support image'), { target: { files: [file] } });
  fireEvent.submit(view.getByLabelText('Your reply').closest('form'));
  await view.findByText(/Your reply is saved. The private image upload could not be confirmed/);
  assert.equal(calls.length, 2);
  assert.equal(view.getByLabelText('Your reply').disabled, true);
  fireEvent.submit(view.getByLabelText('Your reply').closest('form'));
  await waitFor(() => assert.equal(calls.length, 3));
  await waitFor(() => assert.equal(view.getByLabelText('Your reply').value, ''));
  assert.equal(calls.filter(call => call.endpoint.endsWith('/messages')).length, 1);
  assert.equal(calls[1].endpoint, 'support/alpha/messages/saved-alpha-message/attachments');
  assert.equal(calls[2].endpoint, calls[1].endpoint);
  assert.equal(calls[2].options.idempotencyKey, calls[1].options.idempotencyKey);
  assert.equal(calls[2].options.body.get('file').name, file.name);
});




test('a protected 401 immediately removes private children and clears their cache; a late old response cannot repopulate it', async () => {
  const runtime = clientRenderer();
  const { PlatformProvider, useResource } = runtime.load('src/components/invest/PlatformProvider.tsx');
  const { api } = runtime.load('src/lib/platform/client.ts');
  let capturedCache, late;
  globalThis.fetch = async url => {
    if (String(url).endsWith('/auth/session')) return Response.json({ authenticated: true, kind: 'investor', user: { id: user.id, walletAddress: wallet }, csrfToken: 'synthetic' });
    if (String(url).endsWith('/slow')) return new Promise(resolve => { late = resolve; });
    if (String(url).endsWith('/wallet')) return Response.json({}, { status: 401 });
    return Response.json({ label: 'Private synthetic holding' });
  };
  function Private() {
    capturedCache = useSWRConfig().cache;
    const data = useResource('portfolio', 0); useResource('slow', 0);
    return React.createElement('p', null, data.data?.label || 'Loading private');
  }
  const view = render(React.createElement(PlatformProvider, { user, live: true, approvalOrigin: 'https://app.reidentity.net' }, React.createElement(Private)));
  await view.findByText('Private synthetic holding');
  assert.ok([...capturedCache.values()].some(value => value.data?.label === 'Private synthetic holding'));
  await act(async () => { await assert.rejects(api('wallet')); });
  await view.findByRole('heading', { name: 'Your session has ended' });
  assert.equal(view.queryByText('Private synthetic holding'), null);
  await act(async () => { late(Response.json({ label: 'Late private record' })); });
  await waitFor(() => assert.equal([...capturedCache.values()].some(value => value.data?.label), false));
});
test('a temporary service outage does not falsely expire an authenticated investor', async () => {
  const runtime = clientRenderer();
  const { PlatformProvider } = runtime.load('src/components/invest/PlatformProvider.tsx');
  const { api } = runtime.load('src/lib/platform/client.ts');
  globalThis.fetch = async url => String(url).endsWith('/auth/session') ? Response.json({ authenticated: true, kind: 'investor', user: { id: user.id, walletAddress: wallet }, csrfToken: 'synthetic' }) : Response.json({}, { status: 503 });
  const view = render(React.createElement(PlatformProvider, { user, live: true, approvalOrigin: 'https://app.reidentity.net' }, React.createElement('p', null, 'Private workspace')));
  await act(async () => { await assert.rejects(api('wallet')); });
  assert.ok(view.getByText('Private workspace'));
  assert.equal(view.queryByRole('heading', { name: 'Your session has ended' }), null);
});

function notificationsFixture(emailStatus, { failEmailSave = false } = {}) {
  const calls = [], notices = [], cacheWrites = [];
  const data = { notifications: { items: [], nextCursor: null }, 'notification-preferences': { userId: 'synthetic-investor', transactionUpdates: true, supportUpdates: true }, 'email-notifications': emailStatus };
  const { InvestorNotifications } = clientRenderer({
    './PlatformProvider': { usePlatform: () => ({ user, live: true, notify: value => notices.push(value) }), useResource: endpoint => emailStatus instanceof Error && endpoint === 'email-notifications' ? { data: undefined, error: emailStatus, isLoading: false, mutate: async () => {} } : { ...resource(data[endpoint]), mutate: async (saved, options) => { if (!saved) throw new Error('Synthetic follow-up GET failed'); cacheWrites.push({ endpoint, saved, options }); data[endpoint] = saved; } } },
    '@/lib/platform/client': { api: async (endpoint, options) => { calls.push({ endpoint, method: options?.method, body: JSON.parse(JSON.stringify(options?.body ?? {})) }); if (failEmailSave && endpoint === 'email-notifications') throw new Error('Email preferences could not be saved.'); return { ...data[endpoint], ...options?.body }; } },
    './InvestorUI': ui, './platform/Transaction': { IntentReview: () => null },
  }).load('src/components/invest/ActivitySupport.tsx');
  return { view: render(React.createElement(InvestorNotifications)), calls, notices, cacheWrites };
}
const emailStatus = (fields = {}) => ({ deliveryEnabled: true, verifiedEmail: null, verifiedAt: null, pendingEmail: null, pendingSource: null, verificationExpiresAt: null, transactionEmails: true, supportEmails: true, ...fields });
test('saving preferences sends only the editable fields, never the userId the backend rejects', async () => {
  const { view, calls } = notificationsFixture(emailStatus({ deliveryEnabled: false }));
  fireEvent.click(view.getByLabelText('Support replies'));
  await act(async () => { fireEvent.click(view.getByRole('button', { name: 'Save preferences' })); });
  assert.deepEqual(calls, [{ endpoint: 'notification-preferences', method: 'PATCH', body: { transactionUpdates: true, supportUpdates: false } }]);
});
test('the email block stays hidden while delivery is off or its status cannot be read', () => {
  for (const status of [emailStatus({ deliveryEnabled: false, verifiedEmail: 'h•••••@example.org' }), new Error('Route unavailable.')]) {
    const { view } = notificationsFixture(status);
    assert.equal(view.queryByText('Email'), null);
    assert.equal(view.queryByLabelText('Email address'), null);
    cleanup();
  }
});
test('email from reID never presents duplicate confirmation, resend, removal or a typed-address form', () => {
  for (const status of [emailStatus(),emailStatus({ pendingEmail:'h•••••@example.org',pendingSource:'REID_PROFILE' }),emailStatus({pendingEmail:'h•••••@example.org',pendingSource:'INVESTOR_ENTERED',verificationExpiresAt:new Date().toISOString()}),emailStatus({verifiedEmail:'h•••••@example.org'})]) {
    const {view,calls}=notificationsFixture(status);
    assert.equal(view.queryByRole('button',{name:/confirmation|Resend|Remove/}),null);
    assert.equal(view.queryByLabelText('Email address'),null);
    assert.deepEqual(calls,[]);view.unmount();
  }
});
test('confirmed email toggles save through the existing button and follow the in-app category', async () => {
  const { view, calls, notices, cacheWrites } = notificationsFixture(emailStatus({ verifiedEmail: 'h•••••@example.org', verifiedAt: '2026-10-20T00:00:00Z' }));
  assert.equal(view.getByRole('button', { name: 'Save preferences' }).disabled, true);
  fireEvent.click(view.getByLabelText('Transaction emails'));
  fireEvent.click(view.getByLabelText('Support replies'));
  assert.equal(view.getByLabelText('Support reply emails').disabled, true);
  await act(async () => { fireEvent.click(view.getByRole('button', { name: 'Save preferences' })); });
  assert.deepEqual(calls, [{ endpoint: 'notification-preferences', method: 'PATCH', body: { transactionUpdates: true, supportUpdates: false } }, { endpoint: 'email-notifications', method: 'PATCH', body: { transactionEmails: false, supportEmails: true } }]);
  assert.deepEqual(cacheWrites.map(write => [write.endpoint, write.options.revalidate]), [['notification-preferences', false], ['email-notifications', false]]);
  assert.equal(view.getByLabelText('Transaction emails').checked, false);
  assert.equal(view.getByLabelText('Support replies').checked, false);
  assert.deepEqual(notices, ['Notification preferences saved.']);
  assert.equal(view.getByRole('button', { name: 'Save preferences' }).disabled, true);
});
test('partial preference saving preserves the remaining edit and does not repeat the successful update', async () => {
  const { view, calls, notices, cacheWrites } = notificationsFixture(emailStatus({ verifiedEmail: 'h•••••@example.org' }), { failEmailSave: true });
  fireEvent.click(view.getByLabelText('Transaction emails'));
  fireEvent.click(view.getByLabelText('Support replies'));
  await act(async () => { fireEvent.click(view.getByRole('button', { name: 'Save preferences' })); });
  assert.equal(view.getByLabelText('Transaction emails').checked, false);
  assert.equal(view.getByLabelText('Support replies').checked, false);
  assert.equal(cacheWrites.length, 1);
  assert.equal(notices.at(-1), 'Some preferences were saved. Email preferences could not be saved.');
  await act(async () => { fireEvent.click(view.getByRole('button', { name: 'Save preferences' })); });
  assert.deepEqual(calls.map(call => call.endpoint), ['notification-preferences', 'email-notifications', 'email-notifications']);
});

test('Mark all as read sends one scoped request, refreshes after success and never reports a failed operation as done', async () => {
  for (const outcome of ['success', 'write-failure', 'refresh-failure']) {
    const fail = outcome === 'write-failure';
    const calls=[],notices=[],refreshes=[];let finish;
    const {InvestorNotifications}=clientRenderer({
      './PlatformProvider':{usePlatform:()=>({user,notify:message=>notices.push(message)}),useResource:path=>({...resource(path==='notifications'?{items:[{id:'one',title:'Actual update',body:'Body',createdAt:'2026-10-22T00:00:00Z',href:'/invest/activity',readAt:null}],nextCursor:'older'}:path==='notification-preferences'?{transactionUpdates:true,supportUpdates:true}:emailStatus({deliveryEnabled:false})),mutate:async fresh=>{refreshes.push(path);if(fresh)await fresh;if(outcome==='refresh-failure')throw new Error('Synthetic refresh failure');}})},
      '@/lib/platform/client':{api:async(endpoint,options)=>{if(!options?.method)return {items:[],nextCursor:null};calls.push({endpoint,options});return new Promise((resolve,reject)=>{finish={resolve,reject};});}},'./InvestorUI':ui,'./platform/Transaction':{IntentReview:()=>null},
    }).load('src/components/invest/ActivitySupport.tsx');
    const view=render(React.createElement(InvestorNotifications));
    fireEvent.click(view.getByRole('button',{name:'Mark all as read'}));fireEvent.click(view.getByRole('button',{name:'Marking as read…'}));
    assert.equal(calls.length,1);assert.equal(calls[0].endpoint,'notifications/read-all');assert.equal(calls[0].options.method,'PATCH');assert.equal(calls[0].options.body,undefined);
    await act(async()=>fail?finish.reject(new Error('unavailable')):finish.resolve({updated:70}));
    assert.equal(notices.length,1);assert.match(notices[0],fail?/unavailable/:outcome==='refresh-failure'?/were marked as read, but the list could not refresh/:/All notifications marked/);assert.deepEqual(refreshes,fail?[]:['notifications']);view.unmount();
  }
});




test('successful ticket creation remains successful when the follow-up list refresh fails', async () => {
 const {view,calls,notices}=supportFixture(async()=>({id:'created-ticket'}),true);
 fireEvent.click(view.getByRole('button',{name:'New ticket'}));
 fireEvent.change(view.getByLabelText('Subject'),{target:{value:'Synthetic request'}});
 fireEvent.change(view.getByLabelText('How can we help?'),{target:{value:'Synthetic question body'}});
 fireEvent.submit(view.getByLabelText('Subject').closest('form'));
 await waitFor(()=>assert.ok(notices.some(value=>/was saved.*could not refresh.*do not create it again/.test(value))));
 assert.equal(calls.length,1);assert.equal(view.queryByRole('dialog',{name:'New ticket'}),null);
 assert.equal(view.queryByText('Synthetic list refresh failed'),null);
});





function multichainFixture(resources, extra = {}) {
  const claims = [];
  const mod = clientRenderer({
    './PlatformProvider': { usePlatform: () => ({ user, live: true, approvalOrigin: 'https://app.reidentity.example' }), useResource: path => resource(resources[path]) },
    './InvestorUI': { ...ui, CopyButton: () => React.createElement('button', null, 'Copy address') },
    './MultichainProduct': { MultichainReview: props => { claims.push(props); return React.createElement('div', { role: 'dialog', 'aria-label': 'Claim revenue' }, props.network); } },
    '@/lib/platform/client': { api: async () => ({ items: [], nextCursor: null }) },
    'next/image': props => React.createElement('img', { alt: props.alt }),
    'next/navigation': { useSearchParams: () => new URLSearchParams(extra.search || '') },
    'swr/infinite': () => ({ data: [], error: undefined, isLoading: false, isValidating: false, size: 1, setSize: async () => {}, mutate: async () => {} }),
  }).load('src/components/invest/MultichainWallet.tsx');
  return { mod, claims };
}
const networkRow = (network, name, status, usdt, decimals, native, symbol, address = wallet) => ({ chainId: { 'bsc-testnet': 97, sepolia: 11155111, 'tron-nile': 3448148188 }[network], network, name, address, explorerUrl: `https://explorer.example/${network}`, status, native: { symbol, decimals: symbol === 'TRX' ? 6 : 18, balanceAtomic: native }, usdt: { address: '0xusdt', decimals, balanceAtomic: usdt } });
const multichainWallet = { wallet, tronWallet: 'TSyntheticTron', readAt: '2026-11-20T00:00:00Z', usdtTotalAtomic: '5500000', usdtTotalDecimals: 6, complete: false, networks: [
  networkRow('bsc-testnet', 'BNB Smart Chain Testnet', 'ok', '2000000000000000000', 18, '1000000000000000000', 'BNB'),
  networkRow('sepolia', 'Ethereum Sepolia', 'unavailable', null, 6, null, 'ETH'),
  networkRow('tron-nile', 'TRON Nile', 'ok', '3500000', 6, '5000000', 'TRX', 'TSyntheticTron'),
], comingSoon: [] };
const multichainPortfolio = { wallet, tronWallet: 'TSyntheticTron', items: [{ projectId: 'p1', title: 'INFRA Global', totalShares: '3', chains: [
  { chainId: 97, network: 'bsc-testnet', contract: '0xc', shares: '2', claimableAtomic: '1500000000000000000', claimedAtomic: '0', usdtDecimals: 18 },
  { chainId: 3448148188, network: 'tron-nile', contract: 'Tc', shares: '1', claimableAtomic: '0', claimedAtomic: '250000', usdtDecimals: 6 },
] }] };

test('multichain wallet shows the reID USDT total, each network, unavailable networks and INFRA as coming soon', () => {
  const { mod } = multichainFixture({ 'multichain/wallet': multichainWallet, 'multichain/portfolio': multichainPortfolio });
  const view = render(React.createElement(mod.MultichainWallet));
  assert.ok(view.getByText('5.5 USDT'));
  assert.ok(view.getByText(/may be incomplete/));
  assert.ok(view.getByText('2 USDT'));
  assert.ok(view.getByText('3.5 USDT'));
  assert.ok(view.getByText('TSyntheticTron'));
  assert.equal(view.getAllByText('Unavailable').length, 1);
  assert.ok(view.getByText(/reID could not read this network/));
  assert.ok(view.getByText(/INFRA wallet balances will appear here/));
  assert.equal(view.container.querySelectorAll('tbody tr').length, 2);
  assert.ok(view.getAllByRole('link', { name: 'Deposit' }).some(link => link.getAttribute('href') === '/invest/deposit?network=tron-nile'));
});

test('multichain earnings total claimable and claimed USDT and claim only networks with earnings', () => {
  const { mod, claims } = multichainFixture({ 'multichain/portfolio': multichainPortfolio });
  const view = render(React.createElement(mod.MultichainEarnings));
  assert.equal(view.getAllByText('1.5 USDT').length, 2);
  assert.equal(view.getAllByText('0.25 USDT').length, 2);
  const buttons = view.getAllByRole('button', { name: 'Claim' });
  assert.equal(buttons[0].disabled, false);
  assert.equal(buttons[1].disabled, true);
  fireEvent.click(buttons[0]);
  assert.equal(JSON.stringify(claims.at(-1).command), JSON.stringify({ type: 'CLAIM', projectId: 'p1', chainId: 97 }));
  assert.equal(claims.at(-1).network, 'BNB Smart Chain Testnet');
});

test('add money asks what and which network, then shows that network address with a plain warning', () => {
  const { mod } = multichainFixture({ 'multichain/wallet': multichainWallet }, { search: 'network=tron-nile' });
  const view = render(React.createElement(mod.MultichainDeposit));
  assert.equal(view.getByRole('radio', { name: /^TRON/ }).checked, true);
  assert.equal(view.getByRole('radio', { name: /^USDT/ }).checked, true);
  assert.ok(view.getAllByText('TSyntheticTron').length);
  assert.ok(view.getByText(/USDT \(TRC-20\) · Lowest fees/));
  assert.ok(view.getByText(/Money sent on another network can be lost/));
  fireEvent.click(view.getByRole('radio', { name: /^Ethereum/ }));
  assert.ok(view.getByText(/USDT \(ERC-20\) · Highest fees/));
  fireEvent.click(view.getByRole('radio', { name: /^Fee coin/ }));
  assert.equal(view.getByRole('radio', { name: /^Fee coin/ }).checked, true);
});

test('Explore filters by the admin category and tags owned projects from the multichain portfolio', () => {
  const project = (id, title, category) => ({ id, title, category, deploymentMode: 'MULTICHAIN', maxFractions: '10000', description: `${title} project`, media: [] });
  const { InvestorExplore } = clientRenderer({
    'next/image': props => React.createElement('img', props),
    'next/link': ({ href, children, ...rest }) => React.createElement('a', { href, ...rest }, children),
    './PlatformProvider': { useResource(path) {
      if (path === 'projects') return resource({ items: [project('p-finance', 'INFRA Global', 'Finance'), project('p-identity', 'reID', 'Identity')], nextCursor: null });
      if (path === 'multichain/portfolio') return resource({ wallet, tronWallet: null, items: [{ projectId: 'p-identity', title: 'reID', totalShares: '12', chains: [] }] });
      return resource(undefined);
    } },
    './InvestorUI': ui,
  }).load('src/components/invest/HomeExplore.tsx');
  const view = render(React.createElement(InvestorExplore));
  assert.ok(view.getByText('INFRA Global'));
  assert.ok(view.getByText('You own 12'));
  fireEvent.click(view.getByRole('tab', { name: 'Identity' }));
  assert.equal(view.queryByText('INFRA Global'), null);
  assert.ok(view.getByText('reID'));
  fireEvent.click(view.getByRole('tab', { name: 'Services' }));
  assert.ok(view.getByText('Nothing in this category yet'));
});

test('buying with USDT adds the one-time allowance step by itself and goes straight to reID approval', async () => {
  class PlatformError extends Error { constructor(message, status, code) { super(message); this.status = status; this.code = code; } }
  const calls = [];
  const { MultichainReview } = clientRenderer({
    './PlatformProvider': { usePlatform: () => ({ user, live: true, approvalOrigin: 'https://app.reidentity.example' }), useResource: () => resource(undefined) },
    '../ActionFeedback': { useActionFeedback: () => ({ notify() {} }), useActionError: () => ['', () => {}] },
    './platform/ReidMobile': { ReidApprovalQr: ({ url }) => React.createElement('img', { alt: 'Approval QR', 'data-url': url }) },
    './InvestorUI': { ...ui, Modal: ({ title, children }) => React.createElement('section', { role: 'dialog', 'aria-label': title }, children) },
    './ProjectOverview': { ProjectOverview: () => null, SupplyTiles: () => null },
    './ShareAllocation': { ShareAllocation: () => null },
    'next/link': ({ href, children, ...rest }) => React.createElement('a', { href, ...rest }, children),
    '@/lib/platform/client': { PlatformError, api: async (path, options = {}) => {
      calls.push([path, options.body?.type ?? null]);
      if (path === 'multichain/transactions' && options.body.type === 'BUY') throw new PlatformError('Allow USDT first', 400, 'MC_APPROVE_USDT');
      if (path === 'multichain/transactions') return { id: 'allow-1', status: 'CREATED', approvalUrl: null, explorerUrl: null, expiresAt: new Date(Date.now() + 600000).toISOString() };
      if (path === 'multichain/transactions/allow-1/submit') return { id: 'allow-1', status: 'AWAITING_APPROVAL', approvalUrl: 'https://app.reidentity.example/approve/allow-1', explorerUrl: null, expiresAt: new Date(Date.now() + 600000).toISOString() };
      return { id: 'allow-1', status: 'AWAITING_APPROVAL', approvalUrl: 'https://app.reidentity.example/approve/allow-1' };
    } },
  }).load('src/components/invest/MultichainProduct.tsx');
  const view = render(React.createElement(MultichainReview, { command: { type: 'BUY', projectId: 'p1', chainId: 3448148188, asset: 'USDT', quantity: '1', amountAtomic: '25000000' }, network: 'TRON Nile', onClose() {} }));
  await waitFor(() => assert.ok(view.getByText(/Approve in your reID app/)));
  assert.ok(view.getByText('Allow payment (first time only)'));
  assert.ok(view.getByText('Buy 1 share'));
  assert.equal(view.queryByText('Prepare'), null);
  assert.deepEqual(calls.slice(0, 3), [['multichain/transactions', 'BUY'], ['multichain/transactions', 'APPROVE_USDT'], ['multichain/transactions/allow-1/submit', null]]);
});
