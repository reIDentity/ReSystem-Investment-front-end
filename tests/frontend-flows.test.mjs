import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React from 'react';
import { clientRenderer } from './client-renderer.mjs';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://investor.example.invalid' });
for (const [key, value] of Object.entries({ window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, FormData: dom.window.FormData, File: dom.window.File })) Object.defineProperty(globalThis, key, { value, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { act, cleanup, fireEvent, render, waitFor } = await import('@testing-library/react');
const { SWRConfig } = await import('swr');
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
function supportFixture(transport) {
  const tickets = ['alpha', 'beta'].map(id => ({ id, subject: `Case ${id}`, status: 'OPEN', updatedAt: '2026-10-01T00:00:00Z', messages: [] }));
  const calls = [], refreshed = [], notices = [];
  let finish;
  const { InvestorSupport } = clientRenderer({
    './PlatformProvider': { usePlatform: () => ({ user, live: true, notify: value => notices.push(value) }), useResource: endpoint => ({ ...resource(endpoint === 'support' ? { items: tickets, nextCursor: null } : tickets.find(t => endpoint === `support/${t.id}`)), mutate: async () => { refreshed.push(endpoint); } }) },
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
  await view.findByText(/Your reply is saved. The private image was not uploaded/);
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
  const { useSWRConfig } = await import('swr');
  let capturedCache, late;
  globalThis.fetch = async url => {
    if (String(url).endsWith('/auth/session')) return Response.json({ authenticated: true, kind: 'investor', user: { walletAddress: wallet }, csrfToken: 'synthetic' });
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
  globalThis.fetch = async url => String(url).endsWith('/auth/session') ? Response.json({ authenticated: true, kind: 'investor', user: { walletAddress: wallet }, csrfToken: 'synthetic' }) : Response.json({}, { status: 503 });
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
  const { InvestorActivity } = clientRenderer({ './PlatformProvider': { usePlatform: () => ({ user }), useResource: path => resource({ items: path === 'activity' ? rows : [], nextCursor: null }) }, './InvestorUI': ui, './platform/Transaction': { IntentReview: () => null } }).load('src/components/invest/ActivitySupport.tsx');
  const view = render(React.createElement(InvestorActivity));
  assert.equal(view.getAllByText('Revenue allocation').length, 2);
  assert.ok(view.getByText('0.000001 USDT'));
  assert.doesNotMatch(view.container.textContent, /900,719,925|900719925/);
  const allocationRows = [...view.container.querySelectorAll('tbody tr')];
  assert.equal(allocationRows[1].querySelectorAll('td')[5].textContent, '—');
  fireEvent.click(view.getByRole('button', { name: 'Payouts', exact: true }));
  assert.equal(view.queryByText('Revenue allocation'), null);
});
