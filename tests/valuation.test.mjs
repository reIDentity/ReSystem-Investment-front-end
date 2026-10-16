import test from 'node:test';
import assert from 'node:assert/strict';
import { formatUsdEquivalent, walletAssetTotals, sumRewardTotals } from '../src/lib/platform/valuation.ts';

test('fixed-rate display combines both assets without floating-point loss', () => {
  assert.equal(formatUsdEquivalent({ REAED: 3600000000000000000n, USDT: 1000000n }), '$2.00');
  assert.equal(formatUsdEquivalent({ REAED: 0n, USDT: 900719925474099312345678n }), '$900,719,925,474,099,312.34');
  assert.equal(formatUsdEquivalent({ REAED: 1n, USDT: 0n }), '< $0.01');
});

test('unavailable and invalid balances never become a zero-dollar quote', () => {
  assert.equal(formatUsdEquivalent(null), '—');
  assert.equal(formatUsdEquivalent({ REAED: -1n, USDT: 0n }), '—');
  assert.equal(walletAssetTotals(undefined), null);
  assert.equal(walletAssetTotals([{ symbol: 'REAED', decimals: 18, balanceAtomic: '0' }]), null);
  assert.equal(walletAssetTotals([{ symbol: 'REAED', decimals: 18, balanceAtomic: '0' }, { symbol: 'USDT', decimals: 18, balanceAtomic: '0' }]), null);
});

test('verified zero balances remain distinguishable from missing or duplicate asset data', () => {
  const assets = [{ symbol: 'REAED', decimals: 18, balanceAtomic: '0' }, { symbol: 'USDT', decimals: 6, balanceAtomic: '0' }];
  assert.equal(formatUsdEquivalent(walletAssetTotals(assets)), '$0.00');
  assert.equal(walletAssetTotals([...assets, assets[0]]), null);
  assert.equal(walletAssetTotals([assets[0], { ...assets[1], balanceAtomic: '1e6' }]), null);
});

test('historical reward totals require complete ledgers and retain exact asset amounts', () => {
  const claimable = [{ asset: 'REAED', decimals: 18, amountAtomic: '1' }, { asset: 'USDT', decimals: 6, amountAtomic: '9007199254740993' }];
  assert.deepEqual(sumRewardTotals([{ claimable }, { claimable }]), { REAED: 2n, USDT: 18014398509481986n });
  assert.equal(sumRewardTotals([{ claimable }], 'claimed'), null);
  assert.equal(sumRewardTotals([{ claimable: [] }]), null);
  assert.deepEqual(sumRewardTotals([]), { REAED: 0n, USDT: 0n });
  assert.equal(sumRewardTotals(undefined), null);
});
