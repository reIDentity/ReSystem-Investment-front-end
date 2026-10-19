import test from 'node:test';
import assert from 'node:assert/strict';
import { clientRenderer } from './client-renderer.mjs';
const { readRevenueSeries, revenueChart, revenueMoney } = clientRenderer().load('src/lib/platform/revenue-values.ts');
import { revenueSeries } from './revenue-fixtures.mjs';

test('canonical UTC revenue and actual accumulator deltas populate exact daily/monthly/per-share values and 14 real bars', () => {
  const series = readRevenueSeries(revenueSeries()); assert.ok(series);
  assert.equal(revenueMoney(series.totals.today), '$14.00');
  assert.equal(revenueMoney(series.totals.month), '$105.00');
  assert.equal(revenueMoney(series.totals.monthPerShare, true), '$0.1050');
  const chart = revenueChart(series);
  assert.equal(chart.points.length, 14); assert.equal(chart.points[13].label, 'Today');
  assert.equal(chart.points[13].height, '90.90%');
  assert.equal(revenueChart(series, true).points[13].display, '$0.0140');
});
test('missing, stale or inconsistent canonical series never become a fabricated zero chart', () => {
  for (const change of [{ status: 'unavailable' }, { chainId: 1 }, { blockHash: null }, { source: 'unverified' }, { timezone: 'local' }, { scale: '1' }, { asOf: 'invalid' }, { days: [] }]) assert.equal(readRevenueSeries({ ...revenueSeries(), ...change }), null);
  for (const mutate of [s => { s.days[0].date = '2026-10-05'; }, s => { s.assets[1].todayAtomic = '1'; }, s => { s.assets[1].monthPerShareScaled = '0'; }, s => { s.days[0].assets[0] = s.days[0].assets[1]; }, s => { s.days[0].assets[1].revenueAtomic = '1e6'; }, s => { s.days[0].assets[1].revenueAtomic = '9'.repeat(83); }]) { const raw = revenueSeries(); mutate(raw); assert.equal(readRevenueSeries(raw), null); }
  assert.equal(readRevenueSeries(undefined), null);
});
test('a verified zero series has only zero-height bars while huge exact revenue stays finite and precisely labelled', () => {
  const zero = readRevenueSeries(revenueSeries(true)); assert.ok(zero);
  assert.ok(revenueChart(zero).points.every(point => point.height === '0.00%' && !point.positive));
  const raw = revenueSeries(true), huge = '900719925474099312345678';
  raw.days[13].assets[1].revenueAtomic = huge; raw.assets[1].todayAtomic = huge; raw.assets[1].thisMonthAtomic = huge;
  const series = readRevenueSeries(raw); assert.ok(series);
  const chart = revenueChart(series);
  assert.equal(chart.points[13].display, '$900,719,925,474,099,312.34');
  assert.equal(chart.points[13].height, '90.90%'); assert.ok(chart.axis[0].label.length < 15);
  assert.equal(revenueMoney({ REAED: 1n, USDT: 0n }, true), '< $0.0001');
});
