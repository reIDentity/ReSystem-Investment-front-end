import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { JSDOM } from 'jsdom';
import { clientRenderer } from './client-renderer.mjs';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://investor.example.invalid' });
for (const [key, value] of Object.entries({ window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, FormData: dom.window.FormData, File: dom.window.File })) Object.defineProperty(globalThis, key, { value, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { render, fireEvent, cleanup, waitFor } = await import('@testing-library/react');
const { SWRConfig } = await import('swr');
const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });
const wallet = `0x${'1'.repeat(40)}`, hash = `0x${'4'.repeat(64)}`;
function intent(status = 'CREATED', expiresAt = new Date(Date.now() + 60000).toISOString()) {
  return { id: 'synthetic-existing-intent', status, command: { type: 'SEND', asset: 'REAED', amountAtomic: '1', recipient: `0x${'2'.repeat(40)}` }, walletAddress: wallet, chainId: 15324, expiresAt, approvalUrl: 'https://app.reidentity.net/tx-approve?intent_id=synthetic-provider-intent', txHash: null, receipt: null, errorCode: null, transaction: { chainId: 15324, to: `0x${'2'.repeat(40)}`, data: '0x', valueWei: '1', gasEstimate: '21000', estimatedFeeWei: '1' } };
}
function fixture(record, requestError, qrCalls = []) {
  const calls = [], paths = []; let refreshes = 0;
  const resource = { data: record, error: requestError, isLoading: false, mutate: async result => { if (result) { resource.data = result; resource.error = undefined; } else refreshes++; return resource.data; } };
  const { IntentReview } = clientRenderer({ qrcode: { toDataURL: async url => { qrCalls.push(url); return 'data:image/png;base64,AAAA'; } }, '../PlatformProvider': { usePlatform: () => ({ user: { id: 'synthetic-investor', wallet }, approvalOrigin: 'https://app.reidentity.net' }), useResource: path => { paths.push(path); return resource; } }, '../InvestorUI': { Modal: ({ children, title }) => React.createElement('section', { role: 'dialog', 'aria-label': title }, children), Tag: ({ children }) => React.createElement('span', null, children) }, '@/lib/platform/client': { api: async (path, options) => { calls.push({ path, options }); return { ...record, status: 'SUBMITTING' }; } } }).load('src/components/invest/platform/Transaction.tsx');
  const tree = () => React.createElement(SWRConfig, { value: { provider: () => new Map() } }, React.createElement(IntentReview, { initial: record, onClose() {} }));
  const view = render(tree());
  return { view, resource, calls, paths, refreshes: () => refreshes, rerender: () => view.rerender(tree()) };
}
test('expired pending approvals and malformed deadlines remove the provider link and warn to refresh the same durable intent', () => {
  for (const status of ['CREATED', 'SUBMITTING', 'AWAITING_APPROVAL']) for (const deadline of ['invalid', new Date(Date.now() - 1000).toISOString()]) {
    const f = fixture(intent(status, deadline));
    assert.equal(f.view.queryByRole('link', { name: /Open reID/ }), null);
    assert.equal(f.view.queryByRole('button', { name: 'Request reID approval' }), null);
    assert.match(f.view.getByRole('alert').textContent, /Do not approve.*Refresh this same intent before preparing any replacement/);
    assert.equal(f.view.queryByText('Approval link is not trusted. Reconnect with reID.'), null);
    fireEvent.click(f.view.getByRole('button', { name: 'Refresh status' }));
    assert.equal(f.refreshes(), 1); assert.equal(f.calls.length, 0);
    assert.ok(f.paths.every(path => path === 'transactions/synthetic-existing-intent'));
    cleanup();
  }
});
test('a failed status refresh blocks cached submit and provider approval controls while preserving refresh and actual chain evidence', async () => {
  for (const status of ['CREATED', 'SUBMITTING', 'AWAITING_APPROVAL']) {
    const f = fixture(intent(status), new Error('Synthetic unavailable'));
    assert.equal(f.view.queryByRole('link', { name: /Open reID/ }), null);
    const submit = f.view.queryByRole('button', { name: 'Request reID approval' });
    if (submit) { assert.equal(submit.disabled, true); fireEvent.click(submit); }
    assert.match(f.view.getByRole('alert').textContent, /Do not approve.*Refresh this same intent/);
    assert.equal(f.view.queryByText('Approval link is not trusted. Reconnect with reID.'), null);
    fireEvent.click(f.view.getByRole('button', { name: 'Refresh status' }));
    assert.equal(f.refreshes(), 1); assert.equal(f.calls.length, 0);
    if (status === 'CREATED') {
      f.resource.error = undefined; f.rerender();
      fireEvent.click(f.view.getByRole('button', { name: 'Request reID approval' }));
      await waitFor(() => assert.equal(f.calls.length, 1));
      assert.equal(f.calls[0].path, 'transactions/synthetic-existing-intent/submit');
      assert.equal(f.calls[0].options.method, 'POST');
    }
    cleanup();
  }
  const f = fixture({ ...intent('BROADCAST', 'invalid'), txHash: hash }, new Error('Synthetic unavailable'));
  assert.equal(f.view.getByRole('link', { name: 'View actual transaction on INFRA ↗' }).getAttribute('href'), `https://uat.scan.infraworld.org/tx/${hash}`);
  assert.ok(f.view.getByRole('button', { name: 'Refresh status' }));
  assert.equal(f.calls.length, 0);
});
test('a stale open provider link rechecks the exact intent deadline at click time', () => {
  const record = intent('AWAITING_APPROVAL'), f = fixture(record);
  const link = f.view.getByRole('link', { name: /Open reID/ });
  record.expiresAt = new Date(Date.now() - 1).toISOString();
  const event = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  fireEvent(link, event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(f.calls.length, 0);
});


test('the open approval expires locally at its deadline even if no status poll completes', async () => {
  const f = fixture(intent('AWAITING_APPROVAL', new Date(Date.now() + 2000).toISOString()));
  assert.ok(f.view.getByRole('link', { name: /Open reID/ }));
  await waitFor(() => assert.equal(Boolean(f.view.queryByRole('link', { name: /Open reID/ })), false), { timeout: 3500 });
  assert.match(f.view.getByRole('alert').textContent, /Do not approve.*Refresh this same intent/);
  assert.equal(f.refreshes(), 0); assert.equal(f.calls.length, 0);
});
test('a platform-signed intent awaiting its second approval stays pending with no investor approval action', () => {
  const f = fixture({ ...intent('AWAITING_SECOND_APPROVAL'), signerMode: 'PLATFORM', approvalUrl: null });
  assert.ok(f.view.getByText('Awaiting second approval'));
  assert.equal(f.view.queryByRole('link', { name: /Open reID/ }), null);
  assert.equal(f.view.queryByRole('button', { name: 'Request reID approval' }), null);
  assert.equal(f.view.queryByText(/Confirmed/), null);
  assert.equal(f.refreshes(), 0); assert.equal(f.calls.length, 0);
});

test('a real preparation rejection explains the gas shortage and retries only the same unsubmitted command', async () => {
  const calls = [];
  globalThis.fetch = async (path, options) => {
    if (String(path).endsWith('/auth/session')) return Response.json({ authenticated: true, kind: 'investor', csrfToken: 'synthetic-csrf' });
    calls.push({ path, options });
    return Response.json({ error: { code: 'HTTP_400', message: { message: 'Insufficient native balance including gas reserve', error: 'Bad Request', statusCode: 400 } } }, { status: 400 });
  };
  const { TransactionReview } = clientRenderer({ '../InvestorUI': { Modal: ({ title, children }) => React.createElement('section', { role: 'dialog', 'aria-label': title }, children) } }).load('src/components/invest/platform/Transaction.tsx');
  const command = { type: 'BUY', projectId: 'synthetic-project', asset: 'REAED', quantity: '10' };
  const view = render(React.createElement(TransactionReview, { command, onClose() {} }));
  fireEvent.click(view.getByRole('button', { name: 'Prepare transaction' }));
  await view.findByRole('alert');
  assert.match(view.getByRole('alert').textContent, /Not enough reAED.*Add reAED/);
  assert.doesNotMatch(view.getByRole('alert').textContent, /Reuse this review|Refresh and try again|HTTP_400/);
  assert.equal(view.queryByRole('button', { name: 'Request reID approval' }), null);
  assert.equal(view.queryByRole('link', { name: /Open reID/ }), null);
  fireEvent.click(view.getByRole('button', { name: 'Prepare transaction' }));
  await waitFor(() => assert.equal(calls.length, 2));
  await view.findByRole('alert');
  assert.equal(calls[0].options.headers['Idempotency-Key'], calls[1].options.headers['Idempotency-Key']);
  assert.deepEqual(JSON.parse(calls[1].options.body), command);
  assert.ok(calls.every(call => call.path === '/api/platform/transactions' && call.options.method === 'POST'));
});


test('mobile approval QR contains this exact provider intent and disappears with an expired or unavailable review', async () => {
  const calls = [], record = intent('AWAITING_APPROVAL');
  const f = fixture(record, undefined, calls);
  await waitFor(() => assert.ok(f.view.getByRole('img', { name: /Scan to review this exact transaction/ })));
  assert.deepEqual(calls, [record.approvalUrl]);
  assert.equal(f.calls.length, 0, 'rendering a QR does not submit or sign');
  f.resource.error = new Error('Synthetic unavailable'); f.rerender();
  assert.equal(f.view.queryByRole('img'), null);
  f.resource.error = undefined; record.expiresAt = new Date(0).toISOString(); f.rerender();
  assert.equal(f.view.queryByRole('img'), null);
});
