export function cashflowFixture() {
  return { status: 'available', reason: null, chainId: 15324, wallet: `0x${'1'.repeat(40)}`, source: 'confirmed canonical INFRA indexer', confirmedBlock: '7337161', blockHash: `0x${'4'.repeat(64)}`, asOf: '2026-10-19T12:00:00Z', includesNetworkFees: false, assets: [
    { asset: 'REAED', decimals: 18, depositsAtomic: '36000000000000000000', purchasesAtomic: '3600000000000000000', payoutsAtomic: '7200000000000000000', withdrawalsAtomic: '1800000000000000000', incomingAtomic: '43200000000000000000', outgoingAtomic: '5400000000000000000', netAtomic: '37800000000000000000' },
    { asset: 'USDT', decimals: 6, depositsAtomic: '10000000', purchasesAtomic: '20000000', payoutsAtomic: '3000000', withdrawalsAtomic: '4000000', incomingAtomic: '13000000', outgoingAtomic: '24000000', netAtomic: '-11000000' },
  ] };
}
