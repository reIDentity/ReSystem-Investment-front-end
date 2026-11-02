import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { allocationPercentage, shareAllocationSegments } from '../src/lib/platform/share-allocation.ts';
import { clientRenderer } from './client-renderer.mjs';

const legacy = { total: '10000', issued: '54', remaining: '9946', phased: false, saleLimit: 9946n };
const allocation = { totalBlocks: '10000', reservedBlocks: '3000', whitelistBlocks: '3000', publicBlocks: '4000', unallocatedBlocks: '0' };
const phased = { ...legacy, phased: true, saleLimit: 2946n, allocation };
const { ShareAllocation } = clientRenderer().load('src/components/invest/ShareAllocation.tsx');
const render = overrides => renderToStaticMarkup(React.createElement(ShareAllocation, {
  ...legacy, walletLimit: 25n, asset: 'REAED', saleOpen: true, paused: false, noGas: false, phasedLoading: false, ...overrides,
}));
const visible = html => html.replace(/<[^>]*>/g, '').replaceAll('&#x27;', "'");

test('a legacy project partitions actual issued, available and unavailable supply without inventing phased reserves', () => {
  const parts = shareAllocationSegments(legacy);
  assert.deepEqual(parts.map(({ key, count }) => ({ key, count })), [
    { key: 'issued', count: '54' }, { key: 'sale', count: '9946' }, { key: 'future', count: '0' },
  ]);
  assert.equal(parts.reduce((sum, part) => sum + BigInt(part.count), 0n), 10000n);
  assert.equal(parts.reduce((sum, part) => sum + part.size, 0), 10000);
  assert.equal(parts[0].percentage, '0.54%');
});

test('phased allocation counts issued shares within their phases rather than adding them twice', () => {
  const parts = shareAllocationSegments(phased);
  assert.deepEqual(parts.map(part => part.percentage), ['30.00%', '30.00%', '40.00%', '0.00%']);
  assert.equal(parts.some(part => part.key === 'issued'), false);
  assert.equal(parts.reduce((sum, part) => sum + BigInt(part.count), 0n), 10000n);
  // These aggregate counts do not require every phase from a paged phase list.
  assert.deepEqual(shareAllocationSegments({ ...phased, allocation: { ...allocation, phases: [] } }), parts);
});

test('closed and paused sale availability does not label unissued legacy shares as purchasable', () => {
  const parts = shareAllocationSegments({ ...legacy, saleLimit: 0n });
  assert.equal(parts.find(part => part.key === 'sale').count, '0');
  assert.equal(parts.find(part => part.key === 'future').count, '9946');
  assert.deepEqual(shareAllocationSegments({ ...phased, saleLimit: 0n }), shareAllocationSegments(phased));
});

test('huge and uneven counts retain exact values and a complete 10000-point chart', () => {
  const total = '1000000000000000000';
  const parts = shareAllocationSegments({ total, issued: '9007199254740993', remaining: '990992800745259007', phased: false, saleLimit: 990992800745259006n });
  assert.equal(parts[0].count, '9007199254740993');
  assert.equal(parts[2].count, '1');
  assert.equal(parts[2].percentage, '<0.01%');
  assert.equal(parts.reduce((sum, part) => sum + part.size, 0), 10000);
  assert.equal(parts.reduce((sum, part) => sum + BigInt(part.count), 0n).toString(), total);
  assert.equal(allocationPercentage('1', '0'), '—');
  assert.equal(allocationPercentage('10001', '10000'), '—');
});

test('missing, inconsistent or mismatched observations never produce a fabricated allocation', () => {
  for (const overrides of [
    { total: undefined }, { total: '0' }, { total: 'broken' }, { issued: '10001' },
    { remaining: '9945' }, { remaining: undefined }, { saleLimit: null }, { saleLimit: 9947n }, { saleLimit: -1n },
  ]) assert.equal(shareAllocationSegments({ ...legacy, ...overrides }), null);
  for (const overrides of [
    { allocation: undefined }, { allocation: { ...allocation, totalBlocks: '10001' } },
    { allocation: { ...allocation, publicBlocks: undefined } },
    { allocation: { ...allocation, unallocatedBlocks: '1' } }, { issued: '7001' },
  ]) assert.equal(shareAllocationSegments({ ...phased, ...overrides }), null);
});

test('the real component exposes a labelled chart and exact counts, keeping selection outside its partition', () => {
  const html = render({ selected: '10' });
  assert.match(html, /role="img" aria-label="Share allocation: Issued shares, 54 shares, 0.54%/);
  assert.match(visible(html), /On sale now9,946 sharesAvailable to you25 shares/);
  assert.match(visible(html), /10 selected0.10% of total · included in the sale allocation/);
  assert.match(visible(html), /one public sale with no early-access whitelist/);
  assert.doesNotMatch(html, /iv-pd-supply-tiles|2% PER TILE/);
});

test('private phase access and balance limitations stay visible beside the chart', () => {
  const view = { ...allocation, current: { name: 'Pre-launch', unitPriceAtomic: '25000000', remaining: '2946', whitelist: true, open: true }, walletApproved: false };
  const html = render({ ...phased, view, walletLimit: 0n });
  assert.match(visible(html), /54 issued · 0.54% of totalIncluded in the phase allocations above/);
  assert.match(visible(html), /On sale now2,946 sharesAvailable to you0 shares/);
  assert.match(visible(html), /Your wallet is not on this phase’s whitelist/);
  assert.match(html, /href="\/invest\/support"/);
  assert.doesNotMatch(html, /iv-share-ring-issued/);
});

test('loading and unavailable states do not draw guessed allocation segments', () => {
  const loading = render({ phased: true, view: undefined, saleLimit: null, walletLimit: null, phasedLoading: true });
  assert.match(visible(loading), /Checking share allocation/);
  assert.doesNotMatch(loading, /role="img"|30.00%|40.00%/);
  assert.doesNotMatch(visible(loading), /Included in the phase allocations above/);
  const paused = render({ saleLimit: 0n, walletLimit: 0n, paused: true });
  assert.match(visible(paused), /Purchases are paused/);
  assert.match(visible(render({ saleLimit: 0n, walletLimit: 0n, saleOpen: false })), /The primary sale is closed/);
  assert.match(visible(render({ noGas: true, walletLimit: 0n })), /Your wallet needs reAED to pay the network fee/);
});
