import test from 'node:test';
import assert from 'node:assert/strict';
import { readWalletCashflow, cashflowWidths } from '../src/lib/platform/cashflow-values.ts';
import { portfolioAcquisitionOutlay } from '../src/lib/platform/portfolio-values.ts';
import { formatSignedUsdEquivalent, formatUsdEquivalent } from '../src/lib/platform/valuation.ts';
import { cashflowFixture } from './cashflow-fixtures.mjs';
import { proxyConfig, proxyPlatform } from '../src/lib/platform/proxy.ts';
const wallet = `0x${'1'.repeat(40)}`;
test('gross canonical cash flows retain exact assets, negative net and real bar proportions without network-fee estimates', () => {
  const flow = readWalletCashflow(cashflowFixture(), wallet); assert.ok(flow);
  assert.equal(formatUsdEquivalent(flow.amounts.incoming), '$25.00');
  assert.equal(formatUsdEquivalent(flow.amounts.outgoing), '$25.50');
  assert.equal(formatSignedUsdEquivalent(flow.amounts.net), '-$0.50');
  assert.deepEqual(cashflowWidths(flow), ['23.80%', '95.23%', '100.00%', '21.42%']);
  assert.equal(formatSignedUsdEquivalent({ REAED: 3600000000000000000n, USDT: -1000000n }), '$0.00');
  assert.equal(formatSignedUsdEquivalent({ REAED: -1n, USDT: 0n }), '> -$0.01');
  assert.equal(formatSignedUsdEquivalent({ REAED: 0n, USDT: -900719925474099312345678n }), '-$900,719,925,474,099,312.34');
});
test('partial coverage, wrong actor/network and inconsistent or malformed financial totals stay unavailable', () => {
  for (const change of [{ status: 'unavailable' }, { wallet: `0x${'2'.repeat(40)}` }, { chainId: 1 }, { includesNetworkFees: true }, { blockHash: null }, { confirmedBlock: null }, { source: 'unverified' }, { assets: null }]) assert.equal(readWalletCashflow({ ...cashflowFixture(), ...change }, wallet), null);
  for (const change of [{ netAtomic: '-0' }, { netAtomic: '1' }, { depositsAtomic: '1' }, { purchasesAtomic: '-1' }, { payoutsAtomic: '1e6' }, { incomingAtomic: '9'.repeat(83) }, { decimals: 6 }]) { const raw = cashflowFixture(); Object.assign(raw.assets[0], change); assert.equal(readWalletCashflow(raw, wallet), null); }
});
test('all-time self-paid outlay remains available independently of unknown gifted basis, but missing history is never zero', () => {
  const portfolio = { items: [{ quantity: '1', costBasis: null }], complete: true, chainId: 15324, nextCursor: null, headBlock: '7337161', blockHash: `0x${'4'.repeat(64)}`, cashActivity: { status: 'known', spent: [{ asset: 'REAED', decimals: 18, amountAtomic: '0' }, { asset: 'USDT', decimals: 6, amountAtomic: '900719925474099312345678' }] } };
  assert.equal(formatUsdEquivalent(portfolioAcquisitionOutlay(portfolio)), '$900,719,925,474,099,312.34');
  assert.equal(portfolioAcquisitionOutlay({ ...portfolio, cashActivity: { status: 'unknown', spent: null } }), null);
  assert.equal(portfolioAcquisitionOutlay({ ...portfolio, complete: false }), null);
});
test('cash-flow BFF is an exact read-only authenticated route and cannot expose arbitrary wallet or admin subpaths', async () => {
  const config = proxyConfig({ PLATFORM_API_BASE: 'http://127.0.0.1:3005/v1', PLATFORM_APP_ORIGIN: 'https://investor.example.invalid' });
  let calls = 0;
  const fetcher = async (url, init) => { calls++; assert.equal(url, 'http://127.0.0.1:3005/v1/wallet/cashflow'); assert.equal(init.headers.get('Cookie'), 'resystem_session=synthetic'); assert.equal(init.cache, 'no-store'); return Response.json(cashflowFixture()); };
  const make = (method = 'GET') => new Request(`${config.origin}/api/platform/wallet/cashflow`, { method, headers: { Cookie: 'resystem_session=synthetic', Origin: config.origin, 'X-CSRF-Token': 'synthetic' } });
  const result = await proxyPlatform(make(), ['wallet', 'cashflow'], config, fetcher);
  assert.equal(result.status, 200); assert.match(result.headers.get('cache-control'), /private.*no-store/);
  assert.equal((await proxyPlatform(make('POST'), ['wallet', 'cashflow'], config, fetcher)).status, 404);
  assert.equal((await proxyPlatform(make(), ['wallet', 'cashflow', wallet], config, fetcher)).status, 404);
  assert.equal(calls, 1);
});
