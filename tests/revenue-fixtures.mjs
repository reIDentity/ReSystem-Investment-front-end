const SCALE = 10n ** 27n;
const dayAssets = value => [{ asset: 'REAED', decimals: 18, revenueAtomic: '0', perShareScaled: '0' }, { asset: 'USDT', decimals: 6, revenueAtomic: value.toString(), perShareScaled: (value * SCALE / 1000n).toString() }];
export function revenueSeries(zero = false) {
  const days = Array.from({ length: 14 }, (_, index) => ({ date: `2026-10-${String(index + 6).padStart(2, '0')}`, assets: dayAssets(zero ? 0n : BigInt(index + 1) * 1000000n) }));
  const total = zero ? 0n : 105000000n, today = zero ? 0n : 14000000n;
  return { status: 'available', reason: null, chainId: 15324, source: 'confirmed canonical INFRA indexer', confirmedBlock: '7337161', blockHash: `0x${'4'.repeat(64)}`, timezone: 'UTC', asOf: '2026-10-19T12:00:00Z', scale: SCALE.toString(), days, assets: [
    { asset: 'REAED', decimals: 18, todayAtomic: '0', thisMonthAtomic: '0', todayPerShareScaled: '0', monthPerShareScaled: '0', cumulativePerShareScaled: '0' },
    { asset: 'USDT', decimals: 6, todayAtomic: today.toString(), thisMonthAtomic: total.toString(), todayPerShareScaled: (today * SCALE / 1000n).toString(), monthPerShareScaled: (total * SCALE / 1000n).toString(), cumulativePerShareScaled: (total * SCALE / 1000n).toString() },
  ] };
}
