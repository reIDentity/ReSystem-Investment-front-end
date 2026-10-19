import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { clientRenderer } from './client-renderer.mjs';
import { revenueSeries } from './revenue-fixtures.mjs';
import React from 'react';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://investor.example.invalid' });
for (const [key, value] of Object.entries({ window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, FormData: dom.window.FormData, File: dom.window.File })) Object.defineProperty(globalThis, key, { value, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { render, fireEvent, cleanup } = await import('@testing-library/react');
afterEach(cleanup);
function fixture(mode = 'available') {
  const h = { projectId: 'synthetic-project', title: 'Synthetic project', quantity: '10', contractAddress: `0x${'2'.repeat(40)}`, revenueParticipation: { numerator: '10', denominator: '1000' }, claimable: [{ asset: 'REAED', decimals: 18, amountAtomic: '0' }, { asset: 'USDT', decimals: 6, amountAtomic: '1000000' }], claimed: [{ asset: 'REAED', decimals: 18, amountAtomic: '0' }, { asset: 'USDT', decimals: 6, amountAtomic: '0' }] };
  const raw = revenueSeries(mode === 'zero');
  if (mode === 'unavailable') raw.status = 'unavailable';
  const resource = data => ({ data, error: undefined, isLoading: false, mutate: async () => data });
  let apiCalls = 0;
  const { InvestorEarnings } = clientRenderer({ './PlatformProvider': { usePlatform: () => ({ live: true }), useResource: path => {
    if (path === 'portfolio') return resource({ items: [h] });
    if (path.endsWith('/chain')) return resource({ totalSupply: '1000', maxFractions: '10000', remainingSupply: '9000' });
    if (path.endsWith('/revenue')) return { ...resource({ series: raw, assets: [], history: { status: 'available', items: [] } }), error: mode === 'stale-error' ? new Error('Synthetic unavailable') : undefined };
    throw Error('Unexpected resource');
  } }, '@/lib/platform/client': { api() { apiCalls++; throw Error('No API transport'); } }, './platform/Transaction': { TransactionReview: () => { throw Error('No signing'); } }, './InvestorUI': { InvestorShell: ({ children }) => React.createElement('main', { className: 'iv-earnings' }, children), Panel: ({ children, title, className }) => React.createElement('section', { className }, title ? React.createElement('h2', null, title) : null, children), Tag: ({ children }) => React.createElement('span', null, children), Initials: () => null, Asset: () => null, CopyButton: () => null, Provenance: () => null, DataState: () => null, Modal: () => null } }).load('src/components/invest/Earnings.tsx');
  return { view: render(React.createElement(InvestorEarnings)), apiCalls: () => apiCalls };
}
test('existing earnings slots and original bar classes use verified project revenue, with an exact functional per-share switch', () => {
  const { view, apiCalls } = fixture();
  assert.match(view.container.querySelector('.eg-kpi-primary').textContent, /Revenue today\$14\.00Yesterday: \$13\.00/);
  assert.equal([...view.container.querySelectorAll('.eg-kpi')][1].querySelector('strong').textContent, '$105.00');
  assert.equal([...view.container.querySelectorAll('.eg-kpi')][3].querySelector('strong').textContent, '$0.1050');
  assert.ok(view.getByRole('group', { name: 'Daily project revenue chart · UTC' }));
  assert.equal(view.container.querySelectorAll('.iv-bar').length, 14);
  fireEvent.click(view.getByRole('button', { name: 'Per share', exact: true }));
  assert.ok(view.getByRole('button', { name: '2026-10-19: $0.0140', exact: true }));
  fireEvent.focus(view.getByRole('button', { name: '2026-10-06: $0.0010', exact: true }));
  assert.match(view.container.querySelector('.iv-chart-tooltip').textContent, /2026-10-06Revenue \$1\.00Per share \$0\.0010/);
  assert.equal(apiCalls(), 0);
});
test('unavailable or failed cached revenue preserves existing unavailable slots and never draws stale bars', () => {
  for (const mode of ['unavailable', 'stale-error']) {
    const { view, apiCalls } = fixture(mode);
    assert.equal(view.container.querySelector('.eg-kpi-primary strong').textContent, '—');
    assert.equal(view.container.querySelectorAll('.iv-bar').length, 0);
    assert.ok(view.getByText('Daily revenue history is not available yet'));
    assert.equal(apiCalls(), 0); cleanup();
  }
});
test('verified zero funding draws fourteen zero bars without introducing a positive visual minimum', () => {
  const { view } = fixture('zero');
  assert.equal(view.container.querySelector('.eg-kpi-primary strong').textContent, '$0.00');
  assert.ok([...view.container.querySelectorAll('.iv-bar')].every(button => button.style.height === '0%' && button.style.minHeight === '0'));
});
