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

const listing = () => ({ id: '7', seller: `0x${'2'.repeat(40)}`, project: `0x${'3'.repeat(40)}`, asset: 'USDT', unitPriceAtomic: '9007199254740993123456', remaining: '10', availableQuantity: '10', expiry: String(Math.floor(Date.now() / 1000) + 3600), cancelled: false, source: 'SYNTHETIC' });
test('cached marketplace/proceeds failures cannot leave collection or purchase actions enabled', () => {
  const l = listing(), unavailable = new Error('Controlled unavailable');
  const { InvestorMarketplace } = clientRenderer({
    './PlatformProvider': { usePlatform: () => ({ user }), useResource: path => ({ ...resource(path === 'marketplace' ? { items: [l], nextCursor: 'old-cursor' } : { assets: [{ asset: 'USDT', decimals: 6, amountAtomic: '1' }] }), error: unavailable }) },
    './InvestorUI': ui, './platform/Transaction': { TransactionReview: () => null },
  }).load('src/components/invest/Marketplace.tsx');
  const view = render(React.createElement(InvestorMarketplace));
  assert.equal(view.queryByRole('button', { name: 'Review collection' }), null);
  assert.equal(view.queryByRole('button', { name: 'Buy a partial quantity' }), null);
  assert.equal(view.queryByRole('button', { name: 'More listings' }), null);
});
test('fill review uses only the fresh exact quote and disables stale, changed-quantity or mismatched quotes', () => {
  const l = listing();
  let state = resource({ ...l, quantity: '1', amountAtomic: l.unitPriceAtomic });
  const reviews = [];
  const { FillListing } = clientRenderer({
    './PlatformProvider': { usePlatform: () => ({ user }), useResource: () => state }, './InvestorUI': ui, './platform/Transaction': { TransactionReview: () => null },
  }, { 'src/components/invest/Marketplace.tsx': ['FillListing'] }).load('src/components/invest/Marketplace.tsx');
  const props = { listing: l, onClose() {}, onReview: value => reviews.push(value) };
  const view = render(React.createElement(FillListing, props));
  fireEvent.click(view.getByRole('button', { name: 'Review exact USDT approval if needed' }));
  assert.equal(reviews[0].amountAtomic, l.unitPriceAtomic);
  state = { ...state, error: new Error('Controlled quote refresh failure') };
  view.rerender(React.createElement(FillListing, props));
  assert.equal(view.getByRole('button', { name: 'Review partial purchase' }).disabled, true);
  assert.equal(view.queryByRole('button', { name: 'Review exact USDT approval if needed' }), null);
  state = resource({ ...l, quantity: '1', amountAtomic: l.unitPriceAtomic });
  fireEvent.change(view.getByLabelText('Whole fraction quantity'), { target: { value: '2' } });
  assert.equal(view.getByRole('button', { name: 'Review partial purchase' }).disabled, true);
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

const sendTarget = `0x${'7'.repeat(40)}`;
function maxFixture(readQuote) {
  const reads = [], commands = [];
  const native = '90071992547409931234567890', token = '9007199254740993123456', fee = '3000000000000000000';
  const quote = (asset = 'REAED', recipient = sendTarget) => { const now = Date.now(); return { chainId: 15324, wallet, recipient, asset, decimals: asset === 'USDT' ? 6 : 18, maximumAtomic: asset === 'USDT' ? token : (BigInt(native) - BigInt(fee)).toString(), nativeBalanceAtomic: native, tokenBalanceAtomic: asset === 'USDT' ? token : null, estimatedFeeWei: fee, gasEstimate: '21000', canSend: true, quotedAt: new Date(now).toISOString(), expiresAt: new Date(now + 60000).toISOString(), source: 'INFRA pending RPC and verified UAT fee source' }; };
  const { InvestorWithdraw } = clientRenderer({
    './PlatformProvider': { usePlatform: () => ({ user }), useResource: () => resource({ assets: [{ symbol: 'REAED', decimals: 18, balanceAtomic: native }, { symbol: 'USDT', decimals: 6, balanceAtomic: token }] }) },
    '@/lib/platform/client': { api: async path => { reads.push(path); return readQuote ? readQuote(path, quote) : quote(); } },
    './InvestorUI': { ...ui, CopyButton: () => null }, './platform/Transaction': { TransactionReview: ({ command }) => { commands.push(command); return React.createElement('p', { role: 'status' }, 'Prepared review only'); } },
  }).load('src/components/invest/WalletFlows.tsx');
  const view = render(React.createElement(InvestorWithdraw));
  return { view, reads, commands, quote };
}
test('original Max goes through Destination, fills the exact recipient-bound gas-reserved amount, then opens only the existing review', async () => {
  const { view, reads, commands, quote } = maxFixture();
  fireEvent.click(view.getByRole('button', { name: 'Continue' }));
  fireEvent.click(view.getByRole('button', { name: 'Max' }));
  assert.equal(reads.length, 0);
  assert.ok(view.getByRole('heading', { name: 'Where should we send it?' }));
  fireEvent.change(view.getByLabelText('Recipient INFRA address'), { target: { value: sendTarget } });
  fireEvent.click(view.getByRole('button', { name: 'Continue' }));
  await view.findByRole('heading', { name: 'Review your withdrawal' });
  assert.equal(new URL(`https://fixture.invalid/${reads[0]}`).searchParams.get('recipient'), sendTarget);
  assert.equal(reads.length, 1);
  assert.equal(commands.length, 0);
  fireEvent.click(view.getByRole('button', { name: 'Review transfer' }));
  await view.findByText('Prepared review only');
  assert.equal(commands[0].amountAtomic, quote().maximumAtomic);
  assert.equal(commands[0].recipient, sendTarget);
  assert.equal(commands[0].type, 'SEND');
});
test('Back/manual amount abandons deferred Max and a late quote cannot overwrite a changed destination', async () => {
  let resolve;
  const { view, reads, quote } = maxFixture(() => new Promise(done => { resolve = done; }));
  fireEvent.click(view.getByRole('button', { name: 'Continue' }));
  fireEvent.click(view.getByRole('button', { name: 'Max' }));
  fireEvent.change(view.getByLabelText('Recipient INFRA address'), { target: { value: sendTarget } });
  fireEvent.click(view.getByRole('button', { name: 'Continue' }));
  fireEvent.change(view.getByLabelText('Recipient INFRA address'), { target: { value: `0x${'8'.repeat(40)}` } });
  await act(async () => resolve(quote()));
  assert.equal(view.queryByRole('heading', { name: 'Review your withdrawal' }), null);
  fireEvent.click(view.getByRole('button', { name: 'Back' }));
  fireEvent.change(view.getByLabelText('Amount in reAED'), { target: { value: '1' } });
  fireEvent.click(view.getByRole('button', { name: 'Continue' }));
  fireEvent.click(view.getByRole('button', { name: 'Continue' }));
  await view.findByRole('heading', { name: 'Review your withdrawal' });
  assert.equal(reads.length, 1);
});


test('revenue-allocation activity displays only this wallet’s exact allocation and never substitutes the project pool amount', () => {
  const allocation = { chain_id: 15324, tx_hash: `0x${'a'.repeat(64)}`, activity_index: 'allocation-1', block_number: '7337161', timestamp: '2026-10-19T12:00:00Z', type: 'revenue_allocation', event_name: 'RevenueAllocation', asset: 'USDT', amount_atomic: '1', args: { project: `0x${'2'.repeat(40)}`, projectAmountAtomic: '900719925474099312345678', amount: '900719925474099312345678', asset: '1' }, direction: null, status: 'confirmed' };
  const rows = [allocation, { ...allocation, activity_index: 'allocation-2', amount_atomic: null }];
  const { InvestorActivity } = clientRenderer({ './PlatformProvider': { usePlatform: () => ({ user }), useResource: path => resource({ items: path.startsWith('activity?') && new URLSearchParams(path.split('?')[1]).get('filter') === 'all' ? rows : [], nextCursor: null }) }, './InvestorUI': ui, './platform/Transaction': { IntentReview: () => null } }).load('src/components/invest/ActivitySupport.tsx');
  const view = render(React.createElement(InvestorActivity));
  assert.equal(view.getAllByText('Revenue allocation').length, 2);
  assert.ok(view.getByText('0.000001 USDT'));
  assert.doesNotMatch(view.container.textContent, /900,719,925|900719925/);
  const allocationRows = [...view.container.querySelectorAll('tbody tr')];
  assert.equal(allocationRows[1].querySelectorAll('td')[5].textContent, '—');
  fireEvent.click(view.getByRole('button', { name: 'Payouts', exact: true }));
  assert.equal(view.queryByText('Revenue allocation'), null);
});
test('activity names link to the authoritative project while older or unattributed rows retain honest fallbacks', () => {
  const contract = `0x${'2'.repeat(40)}`;
  const base = { chain_id: 15324, tx_hash: `0x${'a'.repeat(64)}`, block_number: '100', timestamp: '2026-10-22T06:00:00Z', type: 'event', event_name: 'TransferSingle', asset: null, amount_atomic: null, direction: null, status: 'confirmed' };
  const rows = [
    { ...base, activity_index: 'named', args: { value: '1' }, project: { id: 'published-project', title: 'Actual project', contractAddress: contract } },
    { ...base, activity_index: 'legacy', args: { value: '2', project: contract } },
    { ...base, activity_index: 'unattributed', args: { value: '3' }, project: null },
    { ...base, activity_index: 'wallet', type: 'wallet_transfer', direction: 'incoming', asset: 'USDT', amount_atomic: '1', project: null },
  ];
  const { InvestorActivity } = clientRenderer({ './PlatformProvider': { usePlatform: () => ({ user }), useResource: path => resource({ items: path.startsWith('activity?') ? rows : [], nextCursor: null }) }, './InvestorUI': ui, './platform/Transaction': { IntentReview: () => null } }).load('src/components/invest/ActivitySupport.tsx');
  const view = render(React.createElement(InvestorActivity));
  assert.equal(view.getByRole('link', { name: 'Actual project' }).getAttribute('href'), '/invest/products/published-project');
  const renderedRows = [...view.container.querySelectorAll('tbody tr')];
  assert.equal(renderedRows[0].querySelectorAll('td')[5].textContent, '1 fraction');
  assert.equal(renderedRows[1].querySelectorAll('td')[1].textContent, '0x2222…2222');
  assert.equal(renderedRows[1].querySelectorAll('td')[5].textContent, '2 fractions');
  assert.equal(renderedRows[2].querySelectorAll('td')[1].textContent, '—');
  assert.equal(renderedRows[3].querySelectorAll('td')[1].textContent, 'Wallet');
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

function depositFixture({ count = 9, walletMatches = true, error } = {}) {
  const items = Array.from({ length: count }, (_, index) => ({ tx_hash: `0x${(100 - index).toString(16).padStart(64, '0')}`, activity_index: String(index), timestamp: `2026-10-${String(22 - index).padStart(2, '0')}T06:00:00Z`, amount_atomic: String((100 - index) * 1e6), asset: 'USDT' }));
  const calls = [];
  const { LiveDeposit } = clientRenderer({
    'next/image': ({ alt }) => React.createElement('span', null, alt),
    qrcode: { toDataURL: () => new Promise(() => {}) },
    '../PlatformProvider': { usePlatform: () => ({ user }), useResource: path => { calls.push(path); return { ...resource({ wallet: walletMatches ? wallet : `0x${'2'.repeat(40)}`, address: wallet, items, nextCursor: 'older-deposits' }), error }; } },
    '../InvestorUI': { ...ui, CopyButton: () => null },
  }).load('src/components/invest/platform/LiveDeposit.tsx');
  return { view: render(React.createElement(LiveDeposit)), calls };
}
test('recent deposits shows only the newest five records and See more links to filtered Activity', () => {
  const { view, calls } = depositFixture();
  assert.equal(view.container.querySelectorAll('.iv-real-deposit').length, 5);
  assert.deepEqual([...view.container.querySelectorAll('.iv-real-deposit time')].map(row => row.dateTime), ['22', '21', '20', '19', '18'].map(day => `2026-10-${day}T06:00:00Z`));
  assert.equal(view.getByRole('link', { name: 'See more' }).getAttribute('href'), '/invest/activity?filter=deposits');
  assert.equal(view.queryByRole('button', { name: 'Older deposits' }), null);
  assert.deepEqual(calls, ['wallet/deposits']);
});
test('short and empty recent histories do not create placeholder deposits', () => {
  for (const count of [0, 3, 5]) {
    const { view } = depositFixture({ count });
    assert.equal(view.container.querySelectorAll('.iv-real-deposit').length, count);
    view.unmount();
  }
});
test('recent deposits still hide records on wallet mismatch or load failure', () => {
  for (const options of [{ walletMatches: false }, { error: new Error('Deposit history unavailable') }]) {
    const { view } = depositFixture(options);
    assert.equal(view.container.querySelectorAll('.iv-real-deposit').length, 0);
    assert.ok(view.getByRole('alert'));
    view.unmount();
  }
});
test('See more arrival selects Deposits, requests numbered server pages and resets page/snapshot on another filter', async () => {
  const calls = [];
  const incoming = { tx_hash: `0x${'a'.repeat(64)}`, activity_index: 'incoming', timestamp: '2026-10-22T06:00:00Z', type: 'wallet_transfer', direction: 'incoming', asset: 'USDT', amount_atomic: '1000000', status: 'confirmed', block_number: '100' };
  const { InvestorActivity } = clientRenderer({
    './PlatformProvider': { usePlatform: () => ({ user }), useResource: path => {
      calls.push(path);
      if (!path.startsWith('activity?')) return resource({ items: [], nextCursor: null });
      const params = new URLSearchParams(path.split('?')[1]), page = Number(params.get('page'));
      return resource({ items: Array.from({ length: page === 3 ? 3 : 10 }, (_, index) => ({ ...incoming, activity_index: `${page}:${index}` })), nextCursor: null, pagination: { page, pageSize: 10, total: 23, totalPages: 3, filter: params.get('filter'), snapshotBlock: '100' } });
    } },
    './InvestorUI': ui, './platform/Transaction': { IntentReview: () => null },
  }).load('src/components/invest/ActivitySupport.tsx');
  const page = clientRenderer({ '@/components/invest/ActivitySupport': { InvestorActivity } }).load('src/app/invest/(authenticated)/activity/page.tsx').default;
  const view = render(await page({ searchParams: Promise.resolve({ filter: 'deposits' }) }));
  assert.equal(view.getByRole('button', { name: 'Deposits', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(view.container.querySelectorAll('tbody tr').length, 10);
  assert.ok(view.getByText('Showing 1–10 of 23 transactions'));
  assert.equal(view.getByRole('button', { name: 'Previous', exact: true }).disabled, true);
  fireEvent.click(view.getByRole('button', { name: 'Page 3', exact: true }));
  assert.ok(calls.includes('activity?page=3&pageSize=10&filter=deposits&snapshotBlock=100'));
  assert.ok(view.getByText('Showing 21–23 of 23 transactions'));
  assert.equal(view.container.querySelectorAll('tbody tr').length, 3);
  assert.equal(view.getByRole('button', { name: 'Next', exact: true }).disabled, true);
  fireEvent.click(view.getByRole('button', { name: 'Previous', exact: true }));
  assert.ok(calls.includes('activity?page=2&pageSize=10&filter=deposits&snapshotBlock=100'));
  fireEvent.click(view.getByRole('button', { name: 'Withdrawals', exact: true }));
  assert.ok(calls.includes('activity?page=1&pageSize=10&filter=withdrawals'));
});
test('unknown and repeated Activity filter parameters safely open All without losing intent links', async () => {
  const Page = clientRenderer({ '@/components/invest/ActivitySupport': { InvestorActivity: props => React.createElement('div', { 'data-filter': props.initialFilter, 'data-intent': props.initialIntent }) } }).load('src/app/invest/(authenticated)/activity/page.tsx').default;
  const { InvestorActivity } = clientRenderer({ './PlatformProvider': { usePlatform: () => ({ user }), useResource: () => resource({ items: [], nextCursor: null }) }, './InvestorUI': ui, './platform/Transaction': { IntentReview: () => null } }).load('src/components/invest/ActivitySupport.tsx');
  for (const filter of ['unsupported', ['deposits', 'buys'], undefined]) {
    const page = await Page({ searchParams: Promise.resolve({ filter, intent: 'retained-intent' }) });
    assert.equal(page.props.initialIntent, 'retained-intent');
    const view = render(React.createElement(InvestorActivity, { initialFilter: page.props.initialFilter }));
    assert.equal(view.getByRole('button', { name: 'All', exact: true }).getAttribute('aria-pressed'), 'true');
    view.unmount();
  }
});

test('numbered pagination handles zero results, one page, loading and bounded page-number gaps accessibly', () => {
  const { ActivityPagination } = clientRenderer().load('src/components/invest/platform/ActivityPagination.tsx');
  const base = {page:1,pageSize:10,total:0,totalPages:0,filter:'all',snapshotBlock:'100'};
  let view = render(React.createElement(ActivityPagination, { pagination: base, busy:false,onPage:()=>assert.fail('empty pages must not navigate') }));
  assert.ok(view.getByRole('status').textContent.includes('Showing 0–0 of 0 transactions'));
  assert.ok([...view.container.querySelectorAll('button')].every(button=>button.disabled));view.unmount();
  const calls=[];
  view=render(React.createElement(ActivityPagination,{pagination:{...base,page:50,total:1000,totalPages:100},busy:false,onPage:value=>calls.push(value)}));
  assert.equal(view.getByRole('button',{name:'Page 50',exact:true}).getAttribute('aria-current'),'page');
  assert.equal(view.getAllByRole('button').length,7);
  fireEvent.click(view.getByRole('button',{name:'Page 100',exact:true}));assert.deepEqual(calls,[100]);view.unmount();
  view=render(React.createElement(ActivityPagination,{pagination:{...base,total:2,totalPages:1},busy:true,onPage:()=>assert.fail('busy pages must not navigate')}));
  assert.ok([...view.container.querySelectorAll('button')].every(button=>button.disabled));
});

test('project icons use validated public project art, preserve identity and recover from broken or missing images', () => {
  const reads=[],cid='bafy'+'a'.repeat(50);
  const {ProjectIcon}=clientRenderer({
    'next/image': props=>React.createElement('img',props),
    '../PlatformProvider':{useResource:path=>{reads.push(path);return resource({media:[{cid,mimeType:'image/png'}]});}},'../InvestorUI':ui,
  }).load('src/components/invest/platform/ProjectIcon.tsx');
  let view=render(React.createElement(ProjectIcon,{id:'project-a',title:'Actual project',media:[{cid,mimeType:'image/png'}]}));
  assert.equal(view.container.querySelector('img').getAttribute('src'),`https://ipfs.filebase.io/ipfs/${cid}`);
  assert.equal(reads[0],null);fireEvent.error(view.container.querySelector('img'));assert.ok(view.getByText('AC'));view.unmount();
  view=render(React.createElement(ProjectIcon,{id:'project-b',title:'Another project'}));
  assert.ok(reads.includes('projects/project-b'));assert.ok(view.container.querySelector('img'));view.unmount();
  view=render(React.createElement(ProjectIcon,{id:'project-c',title:'Missing project',media:[{cid:'https://private.invalid',mimeType:'image/png'}]}));
  assert.equal(view.container.querySelector('img'),null);assert.ok(view.getByText('MI'));
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

test('share totals update immediately in exact units while stale or loading quotes cannot enable a purchase', () => {
  const projectId='project-a';let ready=false;
  const {InvestorProduct}=clientRenderer({
    'next/image': props=>React.createElement('img',props),
    './PlatformProvider':{useResource:path=>{
      if (path===`projects/${projectId}`) return resource({id:projectId,title:'Actual project',description:'Public data',maxFractions:'10000',unitPriceReaedAtomic:'3600000000000000',unitPriceUsdtAtomic:'1000',media:[]});
      if (path===`projects/${projectId}/chain`) return resource({totalSupply:'0',remainingSupply:'10000',saleOpen:true,purchasePaused:false});
      if (path==='portfolio') return resource({items:[]});
      if (path==='wallet') return resource({assets:[]});
      if (path?.includes('/quote?')) {
        const p=new URLSearchParams(path.split('?')[1]),asset=p.get('asset'),quantity=p.get('quantity');
        return {...resource(ready?{projectId,asset,quantity,chainId:15324,decimals:asset==='USDT'?6:18,amountAtomic:(BigInt(quantity)*(asset==='USDT'?1000n:3600000000000000n)).toString()}:undefined),isLoading:!ready};
      }
      return resource(undefined);
    }},'./InvestorUI':{...ui,Asset:()=>null,CopyButton:()=>null,DataState:({loading,error})=>loading?React.createElement('p',null,'Quote loading layout marker'):error?React.createElement('p',null,error.message):null},'./platform/Transaction':{TransactionReview:()=>null},'./platform/AssetSelect':{AssetSelect:()=>null},
  }).load('src/components/invest/ProductDetail.tsx');
  const view=render(React.createElement(InvestorProduct,{id:projectId}));
  const total=()=>view.container.querySelector('.iv-order-total strong').textContent;
  assert.equal(total(),'0.0036 reAED');assert.equal(view.getByRole('button',{name:'Review purchase',exact:true}).disabled,true);
  fireEvent.click(view.getByRole('button',{name:'50',exact:true}));assert.equal(total(),'0.18 reAED');
  fireEvent.change(view.getByLabelText('Share quantity'),{target:{value:'51'}});assert.equal(total(),'0.1836 reAED');assert.doesNotMatch(total(),/Unavailable/);assert.equal(view.queryByText('Quote loading layout marker'),null);
  fireEvent.click(view.getByRole('radio',{name:/USDT/}));assert.equal(total(),'0.051 USDT');assert.equal(view.getByRole('button',{name:'Review purchase',exact:true}).disabled,true);
  ready=true;view.rerender(React.createElement(InvestorProduct,{id:projectId}));assert.equal(view.getByRole('button',{name:'Review purchase',exact:true}).disabled,false);
  fireEvent.change(view.getByLabelText('Share quantity'),{target:{value:'0'}});assert.equal(total(),'—');assert.equal(view.getByRole('button',{name:'Review purchase',exact:true}).disabled,true);
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
