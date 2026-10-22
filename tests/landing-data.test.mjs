import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { clientRenderer } from './client-renderer.mjs';
import { revenueSeries } from './revenue-fixtures.mjs';

const { loadLanding, verifiedLandingProject, landingTotals, calculatorQuote } = clientRenderer().load('src/lib/platform/landing-data.ts');
const id = '4fe22a83-2b4e-44ee-9bbb-c43168baf465';
const project = (n = id) => ({ id: n, title: 'reID', description: 'Published project', status: 'PUBLISHED', contractAddress: `0x${'3'.repeat(40)}`, publicationBlock: '100', publicationTxHash: `0x${'4'.repeat(64)}`, maxFractions: '10000', totalValueUsdtAtomic: '10000000', unitPriceUsdtAtomic: '1000', unitPriceReaedAtomic: '3600000000000000' });
const chain = changes => ({ chainId: 15324, source: 'INFRA RPC', headBlock: '7337162', totalSupply: '1000', remainingSupply: '9000', maxFractions: '10000', totalValueUSDT: '10000000', unitPriceUSDT: '1000', saleOpen: true, purchasePaused: false, indicativeYieldBps: 0, yieldEffectiveAt: '0', yieldPeriod: `0x${'0'.repeat(64)}`, ...changes });
function revenue(zero = false) {
  const series = revenueSeries(zero);
  for (const row of series.assets) row.last30DaysAtomic = row.thisMonthAtomic;
  return { series, assets: series.assets.map(a => ({ asset: a.asset, decimals: a.decimals, fundedAtomic: a.thisMonthAtomic, claimedTotalAtomic: '0', reserveAtomic: a.thisMonthAtomic })), history: { status: 'available', items: zero ? [] : [{ tx_hash: `0x${'8'.repeat(64)}`, block_number: '500', args_json: { asset: 1, amount: '105000000' } }] } };
}
const now = Date.parse(revenue().series.asOf);
const row = (p = project(), c = chain(), r = revenue(), at = now) => verifiedLandingProject(p, c, r, at);

test('exact project price and maximum ownership replace invented fixed share price and sold-pool participation', () => {
  const quote = calculatorQuote(row(), 20);
  assert.equal(quote.cost, '$0.02'); assert.equal(quote.ownership, '0.20%');
  assert.equal(calculatorQuote(row(), 1).cost, '$0.001');
  for (const q of [0, -1, 1.5, 9001, Number.MAX_SAFE_INTEGER + 1]) assert.equal(calculatorQuote(row(), q), null);
  assert.equal(calculatorQuote(row(project(), chain({ purchasePaused: true })), 1), null);
});
test('funded, claimed and reserve require two exact asset ledgers and fresh canonical series', () => {
  assert.equal(row().funded.USDT, 105000000n); assert.equal(landingTotals([row()]).last30.USDT, 105000000n);
  assert.equal(landingTotals([row()]).minimum, '$0.001'); assert.equal(landingTotals([row()]).sold, '10.00%');
  for (const mutate of [r => r.assets.pop(), r => r.assets[1].reserveAtomic = '1', r => r.assets[1].fundedAtomic = '104999999', r => r.series.confirmedBlock = '99', r => r.series.asOf = '2026-10-19T12:01:00Z']) {
    const r = revenue(); mutate(r); assert.equal(row(project(), chain(), r).funded, null);
  }
  assert.equal(row(project(), chain(), revenue(), now + 300001).series, null);
  // A fresh block from yesterday must not be labelled today's revenue.
  assert.equal(row(project(), chain(), revenue(), Date.parse('2026-10-20T00:00:01Z')).series, null);
});
test('unknown totals stay unknown; known zero is a genuine zero and no-funded percentage is undefined', () => {
  const zero = row(project(), chain(), revenue(true));
  const empty = landingTotals([]), known = landingTotals([zero]), unknown = landingTotals(null);
  assert.equal(empty.open, 0); assert.equal(empty.minimum, '—'); assert.equal(empty.funded.USDT, 0n);
  assert.equal(known.funded.USDT, 0n); assert.deepEqual([...known.payments], []); assert.equal(known.claimedPercent, null);
  assert.equal(unknown.funded, null); assert.equal(unknown.open, null);
  assert.equal(landingTotals([row(), row(project('00000000-0000-4000-8000-000000000001'), null, null)]).funded, null);
});
test('truncated/malformed funding history cannot invent record counts or a fake latest payment', () => {
  assert.equal(row().payments[0].block, '500'); assert.equal(row().payments[0].display, '105 USDT');
  for (const mutate of [r => r.history.items = [], r => r.history.items[0].args_json.amount = '1', r => r.history.items[0].tx_hash = '0xfake', r => r.history.items[0].block_number = '99', r => r.history.items[0].block_number = '7337162', r => r.history.items[0].args_json.asset = 2]) {
    const r = revenue(); mutate(r); const p = row(project(), chain(), r);
    assert.equal(p.payments, null); assert.equal(p.funded.USDT, 105000000n);
  }
  const r = revenue(); r.series.assets[1].last30DaysAtomic = '104999999'; assert.equal(row(project(), chain(), r).last30, null);
});
test('catalogue reads every page, refuses drafts/duplicates/cursor cycles, isolates project endpoint failures', async () => {
  const keys = [];
  const reader = async path => { keys.push(path); return path === 'projects' ? { items: [project()], nextCursor: null } : path.endsWith('/chain') ? chain() : revenue(); };
  const result = await loadLanding(reader, () => now);
  assert.equal(result.projects.length, 1); assert.equal(result.projects[0].funded.USDT, 105000000n);
  assert.deepEqual(keys.sort(), ['projects', `projects/${id}/chain`, `projects/${id}/revenue`].sort());
  for (const items of [[project(), project()], [{ ...project(), status: 'DRAFT' }], [{ ...project(), publicationTxHash: null }]]) await assert.rejects(loadLanding(async () => ({ items, nextCursor: null })));
  await assert.rejects(loadLanding(async () => ({ items: [project()], nextCursor: id })));
  const failed = await loadLanding(async path => { if (path === 'projects') return { items: [project()], nextCursor: null }; throw Error('Dependency unavailable'); }, () => now);
  assert.equal(failed.projects.length, 1); assert.equal(failed.projects[0].chain, null); assert.equal(failed.projects[0].funded, null);
});
test('public fan-out is bounded to three project workers and never reads personal account resources', async () => {
  const p = Array.from({ length: 8 }, (_, i) => project(`00000000-0000-4000-8000-${String(i).padStart(12, '0')}`));
  let running = 0, peak = 0;
  await loadLanding(async path => {
    if (path === 'projects') return { items: p, nextCursor: null };
    assert.match(path, /^projects\/[0-9a-f-]{36}\/(chain|revenue)$/);
    running++; peak = Math.max(peak, running); await new Promise(resolve => setTimeout(resolve, 2)); running--;
    return path.endsWith('/chain') ? chain() : revenue();
  }, () => now);
  assert.ok(peak <= 6); assert.ok(peak > 2);
});
test('all landing modules render production markup from the same public snapshot; no fake feed, quotes or unpublished financial claims', () => {
  const projects = [row()], totals = landingTotals(projects);
  const context = { useLanding: () => ({ projects, totals, loading: false, error: false, retry() {} }) };
  const renderer = clientRenderer({
    './LandingData': context, '../LandingData': context,
    'react-dom': {},
    'next/image': { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) },
  });
  const text = [];
  for (const name of ['Products', 'Calculator', 'MoneyFlow', 'Hero', 'Stats', 'Compare', 'Faq', 'CtaBanner']) {
    const C = renderer.load(`src/components/${name}.tsx`)[name]; text.push(renderToStaticMarkup(React.createElement(C)));
  }
  const html = text.join('\n');
  assert.match(html, /0\.001/); assert.match(html, /105\.00/); assert.match(html, /uat.scan.infraworld.org\/tx\/0x8{64}/);
  assert.doesNotMatch(html.replace(/<[^>]+>/g, ""), /\$2,000|\$353\.06|25 shares just claimed|Pre-Launch Price|Post-Launch Price|0\.50|0\.75|Illustrative example|Twelve products/);
  assert.match(html, /Your share of the project/); assert.match(html, /New fractions earn only from future allocations/);
  assert.match(html, /\/invest\/products\/4fe22a83-2b4e-44ee-9bbb-c43168baf465/);
  const { FigmaFractionaire } = renderer.load('src/components/hero/FigmaFractionaire.tsx');
  const unlisted = renderToStaticMarkup(React.createElement(FigmaFractionaire));
  assert.doesNotMatch(unlisted, />1,000<|>500<|>20%<|>30%</); assert.match(unlisted, /\/invest\/explore/);
  assert.equal((unlisted.match(/background-color:#475569/g) || []).length, 100);
});

test('public transport omits cookies, has a shared deadline, rejects redirects/errors and caps streamed response bytes', async () => {
  const transport = clientRenderer({ './landing-data': { loadLanding: read => read('projects') } }).load('src/lib/platform/landing-public.ts');
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, '/api/platform/projects'); assert.equal(options.method, 'GET'); assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error'); assert.equal(options.cache, 'no-store'); assert.ok(options.signal instanceof AbortSignal); assert.deepEqual(Object.keys(options.headers), ['Accept']);
      return Response.json({ items: [], nextCursor: null });
    };
    assert.equal((await transport.fetchLanding()).nextCursor, null);
    globalThis.fetch = async () => Response.json({ error: 'private upstream content' }, { status: 500 });
    await assert.rejects(transport.fetchLanding(), /Public project data unavailable/);
    let cancelled = false;
    globalThis.fetch = async () => new Response(new ReadableStream({ start(c) { c.enqueue(new Uint8Array(2097153)); }, cancel() { cancelled = true; } }));
    await assert.rejects(transport.fetchLanding(), /exceeds limit/); assert.equal(cancelled, true);
  } finally { globalThis.fetch = original; }
});
