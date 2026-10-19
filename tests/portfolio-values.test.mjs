import test from 'node:test';
import assert from 'node:assert/strict';
import { holdingCostBasis, portfolioCostBasis } from '../src/lib/platform/portfolio-values.ts';
import { formatRationalUsdEquivalent } from '../src/lib/platform/valuation.ts';

const holding = () => ({ quantity: '3', costBasis: { status: 'known', method: 'weighted_average', quantity: '3', remaining: [{ asset: 'REAED', decimals: 18, numerator: '3600000000000000000', denominator: '3' }, { asset: 'USDT', decimals: 6, numerator: '2000000', denominator: '3' }] } });
const snapshot = items => ({ items, complete: true, nextCursor: null, chainId: 15324, headBlock: '7337161', blockHash: `0x${'4'.repeat(64)}` });
test('remaining basis sums rational acquisition costs across a complete same-anchor portfolio without becoming a market valuation', () => {
  assert.equal(formatRationalUsdEquivalent(holdingCostBasis(holding())), '$1.00');
  assert.equal(formatRationalUsdEquivalent(portfolioCostBasis(snapshot([holding(), holding()]))), '$2.00');
  assert.equal(formatRationalUsdEquivalent(portfolioCostBasis(snapshot([]))), '$0.00');
  for (const change of [{ complete: false }, { blockHash: undefined }, { chainId: 1 }, { nextCursor: 'partial' }]) assert.equal(portfolioCostBasis({ ...snapshot([holding()]), ...change }), null);
});
test('unknown gift provenance, mismatched quantity and malformed or unbounded fractions cannot be displayed as known acquisition cost', () => {
  for (const change of [{ status: 'unknown', remaining: null }, { quantity: '2' }, { method: 'market_price' }]) assert.equal(holdingCostBasis({ ...holding(), costBasis: { ...holding().costBasis, ...change } }), null);
  for (const change of [{ denominator: '0' }, { numerator: '-1' }, { numerator: (2n ** 4096n).toString() }, { denominator: '1e4' }, { decimals: 6 }]) {
    const h = holding(); Object.assign(h.costBasis.remaining[0], change);
    assert.equal(holdingCostBasis(h), null);
  }
  const duplicate = holding(); duplicate.costBasis.remaining[1] = duplicate.costBasis.remaining[0];
  assert.equal(holdingCostBasis(duplicate), null);
  assert.equal(portfolioCostBasis(snapshot([holding(), { quantity: '1', costBasis: null }])), null);
  const exited = holding(); exited.quantity = '0'; exited.costBasis.quantity = '0';
  assert.equal(holdingCostBasis(exited), null);
  for (const amount of exited.costBasis.remaining) amount.numerator = '0';
  assert.equal(formatRationalUsdEquivalent(holdingCostBasis(exited)), '$0.00');
});
