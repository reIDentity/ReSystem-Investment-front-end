import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React from 'react';
import { clientRenderer } from './client-renderer.mjs';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://investor.example.invalid' });
for (const [key, value] of Object.entries({ window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, FormData: dom.window.FormData, File: dom.window.File })) Object.defineProperty(globalThis, key, { value, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { act, cleanup, fireEvent, render, waitFor } = await import('@testing-library/react');
afterEach(cleanup);

const prefs = { transactionUpdates: true, supportUpdates: true };
const email = { transactionEmails: false, supportEmails: false };
function fixture(status, transport = async () => ({}), extra = {}) {
  const calls = [], notices = [];
  const { EmailPreferences } = clientRenderer({
    './PlatformProvider': { usePlatform: () => ({ notify: text => notices.push(text) }) },
    '@/lib/platform/client': { api: (path, options) => { calls.push({ path, options }); return transport(path, options); } },
    './InvestorUI': { Tag: ({ children }) => React.createElement('span', null, children) },
    './platform/Transaction': {},
  }, { 'src/components/invest/ActivitySupport.tsx': ['EmailPreferences'] }).load('src/components/invest/ActivitySupport.tsx');
  return { calls, notices, view: render(React.createElement(EmailPreferences, { status, inApp: prefs, chosen: email, change() {}, refresh: async () => {}, ...extra })) };
}

test('duplicate confirmation requests have one in-flight mutation and report a request rather than delivery', async () => {
  let resolve;
  const { view, calls, notices } = fixture({ deliveryEnabled: true, pendingEmail: 'l***@example.invalid' }, () => new Promise(done => { resolve = done; }));
  const form = view.getByRole('button', { name: 'Send confirmation email' }).closest('form');
  fireEvent.submit(form); fireEvent.submit(form);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, 'email-notifications/verification');
  await act(async () => resolve({ queued: true }));
  assert.deepEqual(notices, ['Confirmation email requested.']);
});

test('a pending email changes to expired without requiring the page to be remounted', async () => {
  const { view } = fixture({ deliveryEnabled: true, pendingEmail: 'l***@example.invalid', verificationExpiresAt: new Date(Date.now() + 150).toISOString() });
  assert.match(view.container.textContent, /Open the link we sent/);
  await waitFor(() => assert.match(view.container.textContent, /has expired/));
});

test('cached settings cannot trigger email mutations while their source is unavailable', () => {
  const { view, calls } = fixture({ deliveryEnabled: true, verifiedEmail: 'l***@example.invalid' }, undefined, { unavailable: true });
  assert.equal(view.getByRole('checkbox', { name: 'Transaction emails' }).disabled, true);
  assert.equal(view.getByRole('checkbox', { name: 'Support reply emails' }).disabled, true);
  const remove = view.getByRole('button', { name: 'Remove email' });
  assert.equal(remove.disabled, true);
  fireEvent.click(remove);
  assert.equal(calls.length, 0);
});

test('a failed request retains the address and shows no successful request notice', async () => {
  const { view, calls, notices } = fixture({ deliveryEnabled: true, pendingEmail: null }, async () => { throw Error('Controlled unavailable'); });
  fireEvent.change(view.getByRole('textbox', { name: 'Email address' }), { target: { value: 'local@example.invalid' } });
  fireEvent.submit(view.getByRole('button', { name: 'Send confirmation email' }).closest('form'));
  await waitFor(() => assert.deepEqual(notices, ['Controlled unavailable']));
  assert.equal(calls.length, 1);
  assert.equal(view.getByRole('textbox', { name: 'Email address' }).value, 'local@example.invalid');
});
