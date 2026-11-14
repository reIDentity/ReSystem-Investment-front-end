import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { supplyAvailabilitySegments } from '../src/lib/platform/share-allocation.ts';
import { clientRenderer } from './client-renderer.mjs';

const legacy = { total: '10000', issued: '22', remaining: '9978', reserved: '0', saleLimit: 9978n };
const phased = { total: '10000', issued: '54', remaining: '6946', reserved: '3000', saleLimit: 2946n };
const current = {
  id: '1', revision: '1', name: 'Pre-launch', blocks: '3000', sold: '54', remaining: '2946',
  unitPriceAtomic: '25000000', scheduledPriceAtomic: null, scheduledAt: null,
  startsAt: '0', endsAt: '0', whitelist: true, visible: true, open: true, status: 'Active',
  nativeRaised: '0', usdtRaised: '1350000000',
};
const phaseView = {
  mode: 'phased', totalBlocks: '10000', reservedBlocks: '3000', whitelistBlocks: '3000',
  publicBlocks: '4000', unallocatedBlocks: '0', phaseCount: 3,
  current, phases: [current], page: 1, nextPage: null, block: '1000',
};
const counts = parts => Object.fromEntries(parts.map(part => [part.key, part.count]));
const percentages = parts => Object.fromEntries(parts.map(part => [part.key, part.percentage]));
function assertPartition(parts, total) {
  assert.notEqual(parts, null);
  assert.equal(parts.reduce((sum, part) => sum + BigInt(part.count), 0n), BigInt(total));
  assert.equal(parts.reduce((sum, part) => sum + part.size, 0), 10000);
  assert.equal(parts[0].start, 0);
  for (let i = 0; i < parts.length; i++) {
    assert.ok(parts[i].size >= 0);
    if (i) assert.equal(parts[i].start, parts[i - 1].start + parts[i - 1].size);
  }
  assert.equal(parts.at(-1).start + parts.at(-1).size, 10000);
}

test('the reported legacy project accounts for all 10000 blocks without inventing a locked allocation', () => {
  const parts = supplyAvailabilitySegments(legacy);
  assert.deepEqual(counts(parts), { issued: '22', sale: '9978', future: '0', reserved: '0' });
  assert.deepEqual(percentages(parts), { issued: '0.22%', sale: '99.78%', future: '0.00%', reserved: '0.00%' });
  assertPartition(parts, legacy.total);
});

test('phased availability separates issued, currently buyable, future and reserved blocks exactly once', () => {
  const parts = supplyAvailabilitySegments(phased);
  assert.deepEqual(counts(parts), { issued: '54', sale: '2946', future: '4000', reserved: '3000' });
  assert.deepEqual(percentages(parts), { issued: '0.54%', sale: '29.46%', future: '40.00%', reserved: '30.00%' });
  assertPartition(parts, phased.total);
});

test('closing or pausing a sale keeps unsold blocks visible but unavailable', () => {
  for (const observed of [legacy, phased]) {
    const parts = supplyAvailabilitySegments({ ...observed, saleLimit: 0n });
    assert.equal(counts(parts).sale, '0');
    assert.equal(counts(parts).future, observed.remaining);
    assert.equal(counts(parts).issued, observed.issued);
    assert.equal(counts(parts).reserved, observed.reserved);
    assertPartition(parts, observed.total);
  }
});

test('unknown, malformed and inconsistent observations never become a plausible block allocation', () => {
  for (const overrides of [
    { total: undefined }, { issued: undefined }, { remaining: undefined }, { reserved: undefined },
    { total: '0' }, { total: 'broken' }, { issued: '-1' }, { issued: '1.5' },
    { remaining: '-1' }, { reserved: '-1' }, { reserved: 'one' },
    { total: '10001' }, { issued: '10001' }, { remaining: '9977' }, { reserved: '1' },
    { saleLimit: null }, { saleLimit: -1n }, { saleLimit: 9979n },
  ]) assert.equal(supplyAvailabilitySegments({ ...legacy, ...overrides }), null, JSON.stringify(overrides, (_, v) => typeof v === 'bigint' ? String(v) : v));
  assert.equal(supplyAvailabilitySegments({ ...phased, reserved: '3001' }), null);
});

test('uneven and very large supplies retain exact counts and a complete proportional partition', () => {
  for (const total of [1n, 7n, 20001n, 1000000000000000000n]) {
    const issued = total / 7n, reserved = total / 5n, remaining = total - issued - reserved;
    const saleLimit = remaining > 0n ? remaining - 1n : 0n;
    const parts = supplyAvailabilitySegments({ total: String(total), issued: String(issued), remaining: String(remaining), reserved: String(reserved), saleLimit });
    assertPartition(parts, String(total));
    assert.deepEqual(counts(parts), { issued: String(issued), sale: String(saleLimit), future: String(remaining - saleLimit), reserved: String(reserved) });
    if (total === 1000000000000000000n) assert.equal(percentages(parts).future, '<0.01%');
  }
});

function render(overrides = {}) {
  const { ProjectAllocation } = clientRenderer().load('src/components/invest/ProjectAllocation.tsx');
  const html = renderToStaticMarkup(React.createElement(ProjectAllocation, { ...legacy, phased: false, ...overrides }));
  const dom = new JSDOM(html);
  return { html, document: dom.window.document, text: dom.window.document.body.textContent };
}
const named = (document, label) => document.querySelector(`[aria-label="${label}"]`);

test('the overview exposes every block state with counts and percentages instead of an unexplained empty grid', () => {
  const { document, text } = render();
  const availability = named(document, 'Block availability');
  assert.ok(availability, 'the visual key also needs an accessible name');
  assert.match(availability.textContent, /22/);
  assert.match(availability.textContent, /9,978/);
  assert.match(availability.textContent, /0\.22%/);
  assert.match(availability.textContent, /99\.78%/);
  assert.match(availability.textContent, /Not on sale/);
  assert.match(availability.textContent, /Reserved/);
  assert.equal(document.querySelectorAll('[data-allocation-tile]').length, 100, 'the overview retains the requested 1%-per-tile block graphic');
  assert.equal(named(document, 'Allocation by purpose'), null, 'legacy projects must not receive fictional phases');
  assert.doesNotMatch(text, /30\.00%|40\.00%|Pre-launch/);
});

test('phased overview keeps authoritative purpose totals alongside only the visible phase observations', () => {
  const { document, text } = render({ ...phased, phased: true, view: phaseView });
  const availability = named(document, 'Block availability');
  assert.match(availability.textContent, /2,946/);
  assert.match(availability.textContent, /4,000/);
  assert.match(availability.textContent, /3,000/);
  const purposes = named(document, 'Allocation by purpose');
  assert.ok(purposes);
  assert.match(purposes.textContent, /Early-access/);
  assert.match(purposes.textContent, /Public/);
  assert.match(purposes.textContent, /30\.00%/);
  assert.match(purposes.textContent, /40\.00%/);
  assert.match(text, /Pre-launch/);
  assert.match(text, /54/);
  assert.match(text, /2,946/);
  // The API's aggregate phaseCount includes hidden/closed phases. A partial
  // visible list is not evidence that all other phase allocations were sold.
  assert.doesNotMatch(text, /4,000\s*(?:blocks\s*)?sold|7,000\s*(?:blocks\s*)?sold/);
});

test('a paginated visible phase list keeps total allocation complete and never invents its unseen rows', () => {
  // The API returns up to 50 visible phases per page. Fifty public allocations
  // of 80 blocks complete the 4000-block public bucket alongside the current
  // 3000-block early-access phase, with 3000 blocks reserved separately.
  const publicPhases = Array.from({ length: 49 }, (_, index) => ({
    ...current, id: String(index + 2), name: `Public phase ${index + 1}`,
    blocks: '80', sold: '0', remaining: '80', whitelist: false, open: false,
    status: 'Draft', usdtRaised: '0',
  }));
  const { document, text } = render({ ...phased, phased: true, view: {
    ...phaseView, phaseCount: 51, phases: [current, ...publicPhases], nextPage: 2,
  } });
  const purposes = named(document, 'Allocation by purpose');
  assert.match(purposes.textContent, /4,000/);
  assert.match(purposes.textContent, /40\.00%/);
  assert.equal([...document.querySelectorAll('h4')].filter(el => el.textContent === 'Pre-launch').length, 1, 'the current phase must not be counted twice');
  assert.match(text, /Public phase 49/);
  assert.doesNotMatch(text, /Public phase 50/);
  assert.match(text, /More visible phases|first page|additional phases/i);
});

test('missing phased observations stay unavailable rather than fabricating the PDF default percentages', () => {
  for (const overrides of [
    { issued: undefined, saleLimit: null },
    { phased: true, view: undefined, saleLimit: null },
    { ...phased, phased: true, view: { ...phaseView, totalBlocks: '10001' } },
  ]) {
    const { document, text } = render(overrides);
    assert.match(text, /unavailable|checking|cannot verify/i);
    assert.equal(named(document, 'Block availability'), null);
    assert.equal(named(document, 'Allocation by purpose'), null);
    assert.doesNotMatch(text, /30\.00%|40\.00%|99\.78%/);
  }
  assert.match(render({ phased: true, saleLimit: null, loading: true }).text, /Checking|Loading/i);
});

test('only real open current-phase eligibility enables an investment link', () => {
  const props = { ...phased, phased: true, view: { ...phaseView, walletApproved: true }, contributionHref: '#invest' };
  const approved = render(props);
  assert.equal(approved.document.querySelector('a')?.getAttribute('href'), '#invest');
  assert.match(approved.text, /Your wallet is approved/);

  for (const walletApproved of [false, undefined]) {
    const denied = render({ ...props, view: { ...phaseView, walletApproved } });
    assert.equal(denied.document.querySelector('a'), null);
    assert.match(denied.text, walletApproved === false ? /not whitelisted/ : /access unverified/);
  }
  for (const status of ['Draft', 'Paused', 'Closed']) {
    const phase = { ...current, status, open: false };
    const closed = render({ ...props, saleLimit: 0n, view: { ...phaseView, walletApproved: true, current: phase, phases: [phase] } });
    assert.equal(closed.document.querySelector('a'), null);
    assert.match(named(closed.document, 'Block availability').textContent, /Available now0/);
  }
  assert.equal(render({ ...props, contributionHref: 'javascript:alert(1)' }).document.querySelector('a'), null);
  assert.equal(render({ ...props, contributionHref: '/\\external.example' }).document.querySelector('a'), null);
});

test('public visitors may connect to check eligibility without being called whitelisted or denied', () => {
  const guest = render({ ...phased, phased: true, view: phaseView, publicView: true, contributionHref: '/invest?project=example' });
  assert.equal(guest.document.querySelector('a')?.getAttribute('href'), '/invest?project=example');
  assert.match(guest.text, /Connect to check your access/);
  assert.doesNotMatch(guest.text, /Your wallet is approved|Your wallet is not whitelisted/);
  assert.match(guest.document.querySelector('[data-allocation-group="whitelist"] small').textContent, /Sign in to check/);
  assert.equal(guest.document.querySelectorAll('button').length, 0, 'design preview switches must never change real access');
});

test('a purpose containing both open and future phases is not presented as fully unlocked', () => {
  const active = { ...current, blocks: '1000', remaining: '946' };
  const future = { ...current, id: '2', name: 'Later early access', blocks: '2000', sold: '0', remaining: '2000', open: false, status: 'Draft' };
  const result = render({ ...phased, phased: true, saleLimit: 946n, contributionHref: '#invest', view: { ...phaseView, walletApproved: true, current: active, phases: [active, future] } });
  assert.match(result.document.querySelector('[data-allocation-group="whitelist"] small').textContent, /Includes locked phases/);
  assert.equal(result.document.querySelectorAll('a').length, 1, 'only the active eligible phase links to the purchase flow');
  assert.match(result.text, /Later early access/);
  assert.equal(result.document.querySelectorAll('[data-allocation-tile]').length, 100);
});

test('unknown hidden-phase sold counts stay unknown while known allocations still color all 100 tiles', () => {
  const { document, text } = render({ ...phased, phased: true, view: phaseView });
  assert.equal(document.querySelectorAll('[data-allocation-tile]').length, 100);
  assert.match(text, /complete sold, remaining and pricing breakdown.*not published/);
  assert.doesNotMatch(text, /4,000 of 4,000 left|Public.*0 sold/);
  assert.match(text, /Reserved and unissued/);
  assert.doesNotMatch(text, /Held by the holding company|Never for sale/);
});

test('expanded, huge and uneven live supplies keep exactly 100 proportional tiles and exact totals', () => {
  for (const total of [7n, 20001n, 1000000000000000000n]) {
    const reserved = total / 5n, whitelist = total / 3n, publicBlocks = total / 3n;
    const unallocated = total - reserved - whitelist - publicBlocks;
    const phase = { ...current, blocks: String(whitelist), sold: '1', remaining: String(whitelist - 1n) };
    const observed = {
      total: String(total), issued: '1', remaining: String(total - reserved - 1n), saleLimit: whitelist - 1n, phased: true,
      view: { ...phaseView, totalBlocks: String(total), reservedBlocks: String(reserved), whitelistBlocks: String(whitelist), publicBlocks: String(publicBlocks), unallocatedBlocks: String(unallocated), current: phase, phases: [phase] },
    };
    const { document } = render(observed);
    assert.equal(document.querySelectorAll('[data-allocation-tile]').length, 100);
    assert.match(named(document, 'Allocation by purpose').textContent, /Unallocated/);
    assert.equal([...named(document, 'Block availability').querySelectorAll('strong')].map(el => BigInt(el.textContent.replaceAll(',', ''))).reduce((sum, value) => sum + value, 0n), total);
  }
});

test('contradictory visible phase observations cannot expose an actionable allocation', () => {
  const tooLarge = { ...current, blocks: '3001', remaining: '2947' };
  const tooManySold = { ...current, sold: '55', remaining: '2945' };
  for (const phase of [tooLarge, tooManySold]) {
    const result = render({ ...phased, phased: true, contributionHref: '#invest', view: { ...phaseView, walletApproved: true, current: phase, phases: [phase] } });
    assert.match(result.text, /unavailable/);
    assert.equal(result.document.querySelector('a'), null);
    assert.equal(result.document.querySelectorAll('[data-allocation-tile]').length, 0);
  }
});
