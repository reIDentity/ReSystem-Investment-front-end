import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { JSDOM } from 'jsdom';
import { renderToStaticMarkup } from 'react-dom/server';
import { clientRenderer } from './client-renderer.mjs';
import { revenueSeries } from './revenue-fixtures.mjs';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://investor.example.invalid' });
for (const [key, value] of Object.entries({ window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement })) Object.defineProperty(globalThis, key, { value, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { render, cleanup } = await import('@testing-library/react');
afterEach(cleanup);
const id = '3995355b-8601-49cb-84bf-06bea42db23e';
const project = () => ({ id, title: 'INFRA Global', description: 'Actual published description', status: 'PUBLISHED', contractAddress: `0x${'3'.repeat(40)}`, publicationBlock: '100', publicationTxHash: `0x${'4'.repeat(64)}`, maxFractions: '10000', totalValueUsdtAtomic: '10000000', unitPriceUsdtAtomic: '1000', unitPriceReaedAtomic: '3600000000000000' });
const chain = () => ({ chainId: 15324, source: 'INFRA RPC', headBlock: '200', totalSupply: '50', remainingSupply: '9950', maxFractions: '10000', totalValueUSDT: '10000000', unitPriceUSDT: '1000', saleOpen: true, purchasePaused: false });
const { verifiedLandingProject } = clientRenderer().load('src/lib/platform/landing-data.ts');
const { decodeLandingSnapshot } = clientRenderer().load('src/lib/platform/landing-public.ts');

test('published cards are server-rendered before financial snapshot requests complete', () => {
  const renderer = clientRenderer({
    swr: { __esModule: true, default: () => ({ data: undefined, isLoading: true, mutate() {} }) },
    'react-dom': {},
    'next/image': { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) },
  });
  const { LandingData } = renderer.load('src/components/LandingData.tsx');
  const { Products } = renderer.load('src/components/Products.tsx');
  const html = renderToStaticMarkup(React.createElement(LandingData, { initialCatalogue: { projects: [project()], fetchedAt: Date.now() } }, React.createElement(Products)));
  assert.match(html, /Actual published description/);
  assert.match(html, /href="\/projects\/infra-global"/);
  assert.ok(!html.includes('Loading published projects'));
  assert.ok(!html.includes('0.50%')); // No issued count until chain facts arrive.
});

test('live results replace initial metadata, and an empty result never resurrects initial cards', () => {
  let snapshot = { data: undefined, isLoading: true, mutate() {} };
  const { LandingData, useLanding } = clientRenderer({ swr: { __esModule: true, default: () => snapshot } }).load('src/components/LandingData.tsx');
  function Read() { const { projects, totals, loading } = useLanding(); return React.createElement('p', null, `${projects?.length ?? 'unknown'}:${totals.sold}:${loading}`); }
  const initialCatalogue = { projects: [project()], fetchedAt: Date.now() };
  const element = () => React.createElement(LandingData, { initialCatalogue }, React.createElement(Read));
  const view = render(element()); assert.equal(view.container.textContent, '1:—:false');
  snapshot = { ...snapshot, isLoading: false, data: { projects: [verifiedLandingProject(project(), chain(), null, Date.now())], fetchedAt: Date.now() + 1 } };
  view.rerender(element()); assert.equal(view.container.textContent, '1:0.50%:false');
  snapshot = { ...snapshot, data: { projects: [], fetchedAt: Date.now() + 2 } };
  view.rerender(element()); assert.equal(view.container.textContent, '0:—:false');
  snapshot = { ...snapshot, error: new Error('Refresh failed') };
  view.rerender(element()); assert.equal(view.container.textContent, 'unknown:—:false');
});

test('cached raw facts are validated at current decode time and preserve original snapshot age', () => {
  const series = revenueSeries();
  const at = Date.parse(series.asOf);
  const wire = { items: [{ project: project(), chain: chain(), revenue: { series } }], fetchedAt: at - 1000 };
  const fresh = decodeLandingSnapshot(wire, at);
  assert.equal(fresh.fetchedAt, at - 1000); assert.equal(fresh.projects[0].stats.sold, '0.50%');
  assert.equal(fresh.projects[0].stats.revenue, '$105.00');
  const staleSeries = { ...wire, items: [{ ...wire.items[0], revenue: { series: { ...series, asOf: new Date(at - 300001).toISOString() } } }] };
  assert.equal(decodeLandingSnapshot(staleSeries, at).projects[0].stats.revenue, '—');
  for (const value of [{ ...wire, fetchedAt: at - 120000 }, { ...wire, fetchedAt: at + 5001 }, { ...wire, items: [...wire.items, ...wire.items] }, { ...wire, items: [{ ...wire.items[0], project: { ...project(), status: 'DRAFT' } }] }, { ...wire, items: [{ ...wire.items[0], project: { ...project(), id: 'not-a-uuid' } }] }, { ...wire, items: [{ ...wire.items[0], project: { ...project(), media: [null] } }] }]) assert.throws(() => decodeLandingSnapshot(value, at));
});

test('shared server snapshot reuses complete catalogue validation and never serializes calculated BigInts', async () => {
  const records = Array.from({ length: 51 }, (_, index) => ({ ...project(), id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}` }));
  const calls = [];
  let active = 0, peak = 0;
  const { getLandingPublicSnapshot } = clientRenderer({
    'server-only': {}, 'next/cache': { cacheLife() {} }, 'node:buffer': { Buffer },
    './public-project-server': { getPublicCatalogue: async () => records, readPublicApi: async (path, signal) => {
      assert.match(path, /^projects\/[0-9a-f-]{36}\/(chain|revenue)$/); assert.ok(signal instanceof AbortSignal);
      calls.push(path); active++; peak = Math.max(peak, active);
      await Promise.resolve(); active--;
      if (path.endsWith('/revenue')) throw new Error('Independent revenue unavailable');
      return chain();
    } },
  }).load('src/lib/platform/landing-server.ts');
  const snapshot = await getLandingPublicSnapshot();
  assert.equal(snapshot.items.length, 51); assert.equal(calls.length, 102); assert.ok(peak <= 6);
  assert.doesNotThrow(() => JSON.stringify(snapshot));
  assert.equal(snapshot.items[50].project.id, records[50].id);
  assert.equal(snapshot.items[0].revenue, null);
  const verified = decodeLandingSnapshot(snapshot);
  assert.equal(verified.projects[0].stats.sold, '0.50%'); assert.equal(verified.projects[0].funded, null);
});

test('shared server snapshot rejects aggregate response amplification instead of exposing a partial catalogue', async () => {
  const records = Array.from({ length: 4 }, (_, index) => ({ ...project(), id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}` }));
  const { getLandingPublicSnapshot } = clientRenderer({
    'server-only': {}, 'next/cache': { cacheLife() {} }, 'node:buffer': { Buffer },
    './public-project-server': { getPublicCatalogue: async () => records, readPublicApi: async () => ({ oversized: 'a'.repeat(2 * 1024 * 1024 - 100) }) },
  }).load('src/lib/platform/landing-server.ts');
  await assert.rejects(getLandingPublicSnapshot(), /exceeds limit/);
});
