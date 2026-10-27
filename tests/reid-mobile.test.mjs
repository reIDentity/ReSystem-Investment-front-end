import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { JSDOM } from 'jsdom';
import { clientRenderer } from './client-renderer.mjs';
import { validDeviceSignIn } from '../src/lib/reid/device.ts';
import { reidLinkOrigin } from '../src/lib/reid/links.ts';
import { proxyConfig, proxyPlatform } from '../src/lib/platform/proxy.ts';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://investor.invalid' });
for (const [key, value] of Object.entries({ window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, FormData: dom.window.FormData, File: dom.window.File })) Object.defineProperty(globalThis, key, { value, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { render, fireEvent, cleanup, waitFor, act } = await import('@testing-library/react');
const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });
const origin = 'https://app.reidentity.net';
const data = () => ({ status: 'pending', userCode: 'BCDF-GHJK', verificationUrl: origin + '/connect/device?user_code=BCDF-GHJK', qrDataUrl: 'data:image/png;base64,AAAA', interval: 5, expiresAt: new Date(Date.now() + 60000).toISOString() });
test('device QR DTO rejects untrusted destinations, credentials, mismatched codes, expired or unbounded data', () => {
  const valid = data(); assert.ok(validDeviceSignIn(valid, origin));
  for (const change of [{ verificationUrl: 'https://attacker.invalid/connect/device?user_code=BCDF-GHJK' }, { verificationUrl: origin + '/tx-approve' }, { userCode: 'WRNG-CODE' }, { qrDataUrl: 'https://external.invalid/qr' }, { interval: 0 }, { interval: 301 }, { expiresAt: new Date(0).toISOString() }, { verificationUrl: origin + '/connect/device?user_code=BCDF-GHJK&redirect=elsewhere' }]) assert.equal(validDeviceSignIn({ ...valid, ...change }, origin), false);
  assert.equal(reidLinkOrigin('https://app.reidentity.net'), origin);
});
function screen({ phone = false, status = 'pending' } = {}) {
  let now = Date.now(), nextTimer = 0; const timers = new Map(), calls = [], navigations = [];
  class Clock extends Date { static now() { return now; } }
  const clock = { Date: Clock, window: { matchMedia: () => ({ matches: phone }), location: { assign: value => navigations.push(value) } }, setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, due: now + delay }); return id; }, clearTimeout(id) { timers.delete(id); } };
  globalThis.fetch = async (path, options) => {
    calls.push({ path: String(path), options });
    if (String(path).endsWith('/auth/session')) return Response.json({ csrfToken: 'synthetic-csrf' });
    if (String(path).endsWith('/device/poll')) return Response.json(status === 'pending' ? { status: 'pending', interval: 10 } : { status });
    if (options.method === 'DELETE') return Response.json({ status: 'cancelled' });
    return Response.json(data());
  };
  const ui = { InvestorLogo: () => React.createElement('span', null, 'Logo'), Modal: ({ children, title, onClose }) => React.createElement('section', { role: 'dialog', 'aria-label': title }, React.createElement('button', { onClick: onClose }, 'Close mobile sign-in'), children) };
  const { InvestorSignIn } = clientRenderer({ './InvestorUI': ui, 'next/link': ({ children, ...props }) => React.createElement('a', props, children) }, {}, clock).load('src/components/invest/SignIn.tsx');
  const view = render(React.createElement(InvestorSignIn, { mobileConnect: true, linkOrigin: origin, next: '/invest/wallet' }));
  async function advance(ms) { await act(async () => { now += ms; const due = [...timers].filter(([, task]) => task.due <= now); for (const [id, task] of due) { timers.delete(id); task.callback(); } }); }
  return { view, calls, navigations, timers, advance };
}
test('desktop starts only on click, shows own QR, sends CSRF and honours server slow-down before navigating after approval', async () => {
  const f = screen(); assert.equal(f.calls.length, 0);
  fireEvent.submit(f.view.getByRole('button', { name: 'Continue with reID' }).closest('form'));
  await waitFor(() => assert.ok(f.view.getByRole('dialog')));
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1].options.headers['X-CSRF-Token'], 'synthetic-csrf');
  assert.equal(f.calls[1].options.cache, 'no-store'); assert.equal(f.calls[1].options.redirect, 'error');
  assert.ok(f.view.getByRole('img', { name: /Scan with the reID app scanner/ }));
  assert.ok(f.view.getByText('BCDF-GHJK'));
  assert.equal(f.view.queryByRole('link', { name: /Open reID on this phone/ }), null);
  await f.advance(5000); assert.equal(f.calls.length, 3);
  await f.advance(5000); assert.equal(f.calls.length, 3);
  globalThis.fetch = async (path, options) => { f.calls.push({ path, options }); return Response.json({ status: 'approved' }); };
  await f.advance(5000); assert.deepEqual(f.navigations, ['/invest/wallet']);
});
test('closing the desktop handoff cancels its browser attempt and stops polling', async () => {
  const f = screen(); fireEvent.submit(f.view.getByRole('button', { name: 'Continue with reID' }).closest('form'));
  await waitFor(() => assert.ok(f.view.getByRole('dialog')));
  fireEvent.click(f.view.getByRole('button', { name: 'Close mobile sign-in' }));
  await waitFor(() => assert.equal(f.calls.at(-1).options.method, 'DELETE'));
  assert.equal(f.view.queryByRole('dialog'), null);
  const count = f.calls.length; await f.advance(60000); assert.equal(f.calls.length, count); assert.equal(f.navigations.length, 0);
});
test('phone continues with the existing PKCE navigation rather than starting a desktop device grant', () => {
  const f = screen({ phone: true }); const form = f.view.getByRole('button', { name: 'Continue with reID' }).closest('form');
  const event = new window.Event('submit', { bubbles: true, cancelable: true }); fireEvent(form, event);
  assert.equal(event.defaultPrevented, false); assert.equal(form.getAttribute('action'), '/api/auth/reid/start'); assert.equal(f.calls.length, 0);
});
test('denied desktop login removes its QR and cannot create a session by further polling', async () => {
  const f = screen({ status: 'denied' }); fireEvent.submit(f.view.getByRole('button', { name: 'Continue with reID' }).closest('form'));
  await waitFor(() => assert.ok(f.view.getByRole('dialog'))); await f.advance(5000);
  assert.match(f.view.getByRole('status').textContent, /declined/); assert.equal(f.view.queryByRole('img'), null);
  const count = f.calls.length; await f.advance(5000); assert.equal(f.calls.length, count); assert.equal(f.navigations.length, 0);
});
test('BFF device endpoints preserve browser binding, exact origin, CSRF and no-store without permitting GET polling', async () => {
  const config = proxyConfig({ PLATFORM_API_BASE: 'https://api.invalid/v1', PLATFORM_APP_ORIGIN: 'https://investor.invalid', REID_APP_URL: 'https://app.reidentity.net' });
  assert.equal(config.approvalOrigin, origin);
  let calls = 0;
  const fetcher = async (_url, options) => { calls++; assert.equal(options.headers.get('Cookie'), 'resystem_reid_device=synthetic'); return Response.json({ status: 'pending', interval: 5 }); };
  const path = ['auth', 'reid', 'device', 'poll'];
  const request = headers => new Request('https://investor.invalid/api/platform/auth/reid/device/poll', { method: 'POST', headers });
  for (const headers of [{ Origin: 'https://attacker.invalid', 'X-CSRF-Token': 'synthetic' }, { Origin: config.origin }]) assert.equal((await proxyPlatform(request(headers), path, config, fetcher)).status, 403);
  const good = await proxyPlatform(request({ Origin: config.origin, 'X-CSRF-Token': 'synthetic', Cookie: 'resystem_reid_device=synthetic; foreign=secret' }), path, config, fetcher);
  assert.equal(good.status, 200); assert.match(good.headers.get('Cache-Control'), /no-store/); assert.equal(calls, 1);
  assert.equal((await proxyPlatform(new Request('https://investor.invalid/api/platform/auth/reid/device/poll'), path, config, fetcher)).status, 404);
});
