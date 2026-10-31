import assert from 'node:assert/strict';
import test from 'node:test';
import { createHomeRenderer, scenarios, sourceHashes } from './previews/home/render.mjs';

const text = html => html.replace(/<[^>]*>/g, '').replaceAll('&lt;', '<').replaceAll('&amp;', '&').replaceAll('&#x27;', "'");
const claimButton = html => [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].find(match => text(match[2]) === 'Claim all');
function disabled(html) { const match = claimButton(html); assert.ok(match, 'rendered Claim all button exists'); return /\bdisabled(?:="")?/.test(match[1]); }
function kpi(html, title) {
  const section = [...html.matchAll(/<section\b[^>]*class="[^"]*\biv-kpi\b[^"]*"[^>]*>([\s\S]*?)<\/section>/g)].find(match => match[1].startsWith(`<span>${title}</span>`));
  assert.ok(section, `rendered ${title} card exists`);
  return text(section[1].match(/<strong>([\s\S]*?)<\/strong>/)[1]);
}
function render(name) { const renderer = createHomeRenderer(); const html = renderer.render(name); assert.equal(renderer.stats.blockedApiCalls, 0); assert.equal(renderer.stats.blockedTransactionCalls, 0); return html; }

test('verified empty complete portfolio has zero remaining basis and verified zero balances', () => {
  const html = render('empty');
  for (const title of ['Available to claim', 'Total paid out', 'Wallet balance']) assert.equal(kpi(html, title), '$0.00');
  assert.equal(kpi(html, 'Total invested'), '$0.00'); assert.equal(disabled(html), true);
  assert.match(text(html), /Your first investment starts here/);
});
test('missing/loading data cannot be represented as zero or a claimable balance', () => {
  const html = render('loading');
  for (const title of ['Available to claim', 'Total paid out', 'Wallet balance']) assert.equal(kpi(html, title), '—');
  assert.equal(disabled(html), true); assert.match(text(html), /Loading your holdings…/); assert.match(html, /aria-busy="true"/);
  assert.doesNotMatch(text(html), /Your first investment starts here/);
});
test('indexing wait uses existing loading state without inventing an empty portfolio', () => {
  const html = render('indexing-delay');
  assert.equal(kpi(html, 'Available to claim'), '—'); assert.equal(disabled(html), true);
  assert.match(text(html), /Loading your holdings…/); assert.doesNotMatch(text(html), /Your first investment starts here/);
});
test('indexer-shaped service failure is unavailable with recovery controls, not verified zero', () => {
  const html = render('indexer-error');
  assert.equal(kpi(html, 'Available to claim'), '—'); assert.equal(disabled(html), true);
  assert.match(text(html), /Your holdings are unavailable/); assert.match(text(html), /Try again/);
  assert.doesNotMatch(text(html), /Synthetic fixture service failure|Your first investment starts here/);
});
test('resource errors do not fabricate holdings, rewards or account balances', () => {
  const html = render('error');
  for (const title of ['Available to claim', 'Total paid out', 'Wallet balance']) assert.equal(kpi(html, title), '—');
  assert.equal(disabled(html), true); assert.doesNotMatch(text(html), /Fixture project — not a live investment/);
  assert.match(text(html), /Recommendations unavailable/); assert.match(text(html), /Balance unavailable.*Retry/);
});
test('failed refresh hides stale funded portfolio and wallet values and disables claims', () => {
  const html = render('stale-error');
  for (const title of ['Available to claim', 'Total paid out', 'Wallet balance']) assert.equal(kpi(html, title), '—');
  assert.equal(disabled(html), true); assert.doesNotMatch(text(html), /Fixture project — not a live investment|\$3\.08|\$2\.00/);
});
test('wallet failure does not invalidate separately verified portfolio rewards', () => {
  const html = render('wallet-stale-error');
  assert.equal(kpi(html, 'Wallet balance'), '—'); assert.equal(kpi(html, 'Available to claim'), '$3.08');
  assert.equal(disabled(html), false); assert.match(text(html), /Balance unavailable.*Retry/);
});
test('a missing reward asset remains unknown and cannot enable aggregate claims', () => {
  const html = render('partial-ledger');
  assert.equal(kpi(html, 'Available to claim'), '—'); assert.equal(kpi(html, 'Total paid out'), '—'); assert.equal(disabled(html), true);
});
test('populated API-shaped resources render exact display amounts without invented investment cost', () => {
  const html = render('populated');
  assert.equal(kpi(html, 'Available to claim'), '$3.08'); assert.equal(kpi(html, 'Wallet balance'), '$2.00');
  assert.equal(kpi(html, 'Total paid out'), '$0.00'); assert.equal(kpi(html, 'Total invested'), '—');
  assert.equal(disabled(html), false); assert.match(text(html), /1,176 shares in 1 project/);
  assert.match(text(html), /Confirmed history is not available yet/);
});
test('error then recovered resources produce correct separate renders without claiming a browser retry click', () => {
  const renderer = createHomeRenderer(); const before = renderer.render('stale-error'), after = renderer.render('recovered');
  assert.equal(disabled(before), true); assert.equal(disabled(after), false); assert.equal(kpi(after, 'Available to claim'), '$3.08');
  assert.match(text(before), /Your holdings are unavailable/); assert.doesNotMatch(text(after), /Your holdings are unavailable/);
  assert.equal(renderer.stats.blockedApiCalls, 0); assert.equal(renderer.stats.blockedTransactionCalls, 0);
});
test('a previous holder retains allocated positive rewards after zero-share exit', () => {
  const html = render('previous-holder'); assert.match(text(html), /Previous holding/);
  assert.equal(kpi(html, 'Available to claim'), '$3.08'); assert.equal(disabled(html), false);
});
test('positive rewards below one display cent are not rounded into a zero-reward disabled state', () => {
  const html = render('tiny-claim'); assert.equal(kpi(html, 'Available to claim'), '< $0.01'); assert.equal(disabled(html), false);
});
test('disabled service shows the unchanged unavailable banner and no financial data', () => {
  const html = render('offline'); assert.equal(disabled(html), true); assert.equal(kpi(html, 'Available to claim'), '—');
  assert.match(text(html), /Financial data and actions are unavailable/);
});
test('every scenario renders current production source using real React, Link and Image without changing source', () => {
  const before = sourceHashes(); const renderer = createHomeRenderer();
  for (const name of Object.keys(scenarios)) assert.match(renderer.render(name), /aria-label="Investment summary"/);
  assert.deepEqual(sourceHashes(), before); assert.ok(renderer.loadedSourcePaths().includes('src/components/invest/HomeExplore.tsx'));
  assert.equal(renderer.stats.blockedApiCalls, 0); assert.equal(renderer.stats.blockedTransactionCalls, 0);
});


test('existing invested slots display only same-anchor remaining acquisition basis and preserve the approved card structure', () => {
  const html = render('known-basis');
  assert.equal(kpi(html, 'Total invested'), '$1.00');
  assert.match(html, /<dt>Invested<\/dt><dd>\$1\.00<\/dd>/);
  assert.match(html, /iv-home-performance/);
  assert.match(text(html), /Confirmed history is not available yet/);
  assert.equal((html.match(/class="iv-kpi /g) || []).length, 4);
  for (const name of ['gift-basis', 'malformed-basis']) {
    const unknown = render(name);
    assert.equal(kpi(unknown, 'Total invested'), '—');
    assert.match(unknown, /<dt>Invested<\/dt><dd>—<\/dd>/);
    assert.equal(kpi(unknown, 'Available to claim'), '$3.08');
  }
});


test('existing cash-flow slots and original bars use full verified gross flows, signed exact net and known purchase-only fallback', () => {
  const html = render('cashflow');
  assert.match(html, /<small>IN<\/small><strong>\$25\.00<\/strong>/);
  assert.match(html, /<small>OUT<\/small><strong>\$25\.50<\/strong>/);
  assert.match(html, /<small>NET<\/small><strong>-\$0\.50<\/strong>/);
  assert.match(text(html), /Payouts in\$5\.00Deposits in\$20\.00Shares bought\$21\.00Withdrawals\$4\.50/);
  assert.match(html, /Gross cash flows exclude network fees/);
  assert.doesNotMatch(text(html), /Complete cash-flow totals are not available yet/);
  const stale = render('cashflow-stale');
  assert.match(stale, /<small>IN<\/small><strong>—<\/strong>/);
  assert.match(text(stale), /Complete cash-flow totals are not available yet/);
  const partial = text(render('gift-basis'));
  assert.match(partial, /Shares bought\$3\.00/);
});


test('verified dated history renders an accessible chart and table without presenting cost as market value',()=>{
 const html=render('cashflow-history');
 assert.match(html,/Cumulative confirmed purchase cost and claimed rewards/);
 assert.match(text(html),/Purchase cost \$21.*Rewards claimed \$5/);
 assert.match(text(html),/Monthly values/);
 assert.doesNotMatch(text(html),/Confirmed history is not available yet/);
});
