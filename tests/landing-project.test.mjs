import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clientRenderer } from './client-renderer.mjs';
import { revenueSeries } from './revenue-fixtures.mjs';
import React from 'react';
import * as ReactDOM from 'react-dom';
import { renderToStaticMarkup } from 'react-dom/server';

const { publishedLandingProject, landingProjectStats } = clientRenderer().load('src/lib/platform/landing-project.ts');
const id = '3995355b-8601-49cb-84bf-06bea42db23e';
const project = () => ({ id, title: 'INFRA Global', description: 'Public description', status: 'PUBLISHED', contractAddress: `0x${'3'.repeat(40)}`, publicationBlock: '100', publicationTxHash: `0x${'4'.repeat(64)}`, maxFractions: '10000', totalValueUsdtAtomic: '10000000', unitPriceUsdtAtomic: '1000', unitPriceReaedAtomic: '3600000000000000' });
const chain = () => ({ chainId: 15324, source: 'INFRA RPC', headBlock: '200', totalSupply: '1234', remainingSupply: '8766', maxFractions: '10000', totalValueUSDT: '10000000', unitPriceUSDT: '1000', saleOpen: true, purchasePaused: false, indicativeYieldBps: 650, yieldEffectiveAt: '1', yieldPeriod: `0x${'5'.repeat(64)}` });

test('landing records bind only the explicit published project with a canonical publication identity', () => {
  assert.ok(publishedLandingProject(id, project()));
  for (const change of [{ id: 'another-record' }, { status: 'DRAFT' }, { status: 'ARCHIVED' }, { contractAddress: null }, { publicationTxHash: null }, { publicationBlock: '0' }, { maxFractions: '0' }, { maxFractions: '1e4' }, { totalValueUsdtAtomic: '-1' }]) assert.equal(publishedLandingProject(id, { ...project(), ...change }), null);
  assert.equal(publishedLandingProject(undefined, project()), null);
  const source = readFileSync(new URL('../src/data/products.ts', import.meta.url), 'utf8');
  const ids = [...source.matchAll(/projectId: "([a-f0-9-]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 4); assert.equal(new Set(ids).size, 4);
});

test('actual supply and owner-published yield populate existing slots without using marketing fixture totals', () => {
  const stats = landingProjectStats(project(), chain(), null);
  assert.equal(stats.sold, '12.34%'); assert.equal(stats.yieldPace, '6.50%'); assert.equal(stats.sale, 'Open');
  assert.match(stats.yieldTitle, /not guaranteed/); assert.equal(stats.revenue, '—');
  assert.equal(landingProjectStats(project(), { ...chain(), purchasePaused: true }, null).sale, 'Closed');
  assert.equal(landingProjectStats(project(), { ...chain(), totalSupply: '10000', remainingSupply: '0' }, null).sale, 'Closed');
  const future = { ...chain(), yieldEffectiveAt: '9999999999' };
  assert.equal(landingProjectStats(project(), future, null).yieldPace, '—');
  assert.equal(landingProjectStats(project(), { ...chain(), yieldPeriod: `0x${'0'.repeat(64)}` }, null).yieldPace, '—');
});

test('wrong chain, inconsistent supply/economics and a failed refresh fail closed independently', () => {
  for (const change of [{ chainId: 1 }, { source: 'mock' }, { headBlock: '99' }, { totalSupply: '10001' }, { totalSupply: '-1' }, { remainingSupply: '0' }, { maxFractions: '9999' }, { unitPriceUSDT: '999' }, { totalValueUSDT: '999' }]) {
    const stats = landingProjectStats(project(), { ...chain(), ...change }, null);
    assert.equal(stats.sold, '—'); assert.equal(stats.yieldPace, '—'); assert.equal(stats.sale, null);
  }
  assert.equal(landingProjectStats(project(), null, null).sold, '—');
  assert.equal(landingProjectStats(null, chain(), { series: revenueSeries() }).revenue, '—');
});

test('monthly revenue requires complete fresh canonical history, preserves verified zero and never invents yield', () => {
  const series = revenueSeries(); const now = Date.parse(series.asOf);
  const stats = landingProjectStats(project(), null, { series }, now);
  assert.equal(stats.revenue, '$105.00'); assert.equal(stats.sold, '—'); assert.equal(stats.yieldPace, '—');
  assert.match(stats.revenueTitle, /UTC calendar month/);
  const zero = revenueSeries(true);
  assert.equal(landingProjectStats(project(), null, { series: zero }, Date.parse(zero.asOf)).revenue, '$0.00');
  for (const change of [{ status: 'unavailable' }, { confirmedBlock: '99' }, { blockHash: null }, { chainId: 1 }]) assert.equal(landingProjectStats(project(), null, { series: { ...series, ...change } }, now).revenue, '—');
  assert.equal(landingProjectStats(project(), null, { series }, now + 300001).revenue, '—');
  assert.equal(landingProjectStats(project(), null, { series }, now - 5001).revenue, '—');
  const big = revenueSeries(true);
  big.assets[1].todayAtomic = big.assets[1].thisMonthAtomic = big.days[13].assets[1].revenueAtomic = '1234567890';
  const compact = landingProjectStats(project(), null, { series: big }, Date.parse(big.asOf));
  assert.equal(compact.revenue, '$1.23k'); assert.match(compact.revenueTitle, /\$1,234\.56/);
  big.assets[1].todayAtomic = big.assets[1].thisMonthAtomic = big.days[13].assets[1].revenueAtomic = '900719925474099312345678';
  assert.equal(landingProjectStats(project(), null, { series: big }, Date.parse(big.asOf)).revenue, '$9.00e17');
});

test('actual landing card links its published project and immediately removes stale financial values on read failure', () => {
  let failing = false;
  const keys = [];
  const renderer = clientRenderer({
    'react-dom': ReactDOM,
    'next/image': { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) },
    swr: { __esModule: true, default: key => {
      keys.push(key);
      const data = key?.endsWith('/chain') ? chain() : key?.endsWith('/revenue') ? { series: revenueSeries() } : project();
      return { data, error: failing ? new Error('Unavailable') : undefined };
    } },
    '@/lib/platform/client': { api() { throw Error('No real API calls in a synthetic render'); } },
  }, { 'src/components/Products.tsx': ['ProductCard'] });
  const { ProductCard } = renderer.load('src/components/Products.tsx');
  const product = { id: 'infra-global', projectId: id, name: 'INFRA Global', category: 'Finance', description: 'Marketing description', art: '#fff', image: '/images/original.png', revenue: 11200, yieldPace: 7.3, sold: 37 };
  const render = () => renderToStaticMarkup(React.createElement(ProductCard, { product }));
  const live = render();
  assert.ok(live.includes(`/invest/products/${id}`)); assert.ok(live.includes('12.34%')); assert.ok(live.includes('6.50%')); assert.ok(!live.includes('11.2k')); assert.ok(!live.includes('37%'));
  failing = true;
  const unavailable = render();
  assert.ok(unavailable.includes('/invest/explore')); assert.ok(!unavailable.includes('12.34%')); assert.ok(!unavailable.includes('6.50%')); assert.ok(!unavailable.includes('Public description'));
  assert.equal((unavailable.match(/aria-label="Unavailable"/g) || []).length, 3);
  assert.equal(keys.filter(Boolean).length, 4); // three live public reads, then only the failed record read
});
