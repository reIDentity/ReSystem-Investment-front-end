import test from 'node:test';
import assert from 'node:assert/strict';
import { currentListingQuote } from '../src/lib/platform/marketplace.ts';
import { transactionIssue, isSettled, transactionPollInterval, transactionGuidance } from '../src/lib/platform/transaction.ts';

const now = Date.parse('2026-10-19T12:00:00Z');
const wallet = `0x${'1'.repeat(40)}`;
const listing = { id: '7', seller: `0x${'2'.repeat(40)}`, project: `0x${'3'.repeat(40)}`, asset: 'USDT', unitPriceAtomic: '9007199254740993123456', remaining: '10', availableQuantity: '10', expiry: String(now / 1000 + 3600), cancelled: false, source: 'SYNTHETIC' };
const quote = { ...listing, quantity: '3', amountAtomic: (BigInt(listing.unitPriceAtomic) * 3n).toString() };
test('large exact marketplace quotes retain every atomic digit and reject stale or mismatched review inputs', () => {
  assert.equal(currentListingQuote(quote, listing, '3', now)?.amountAtomic, '27021597764222979370368');
  for (const change of [{ id: '8' }, { asset: 'REAED' }, { quantity: '2' }, { project: wallet }, { seller: wallet }, { amountAtomic: '1' }, { cancelled: true }, { availableQuantity: '2' }, { availableQuantity: '11' }, { expiry: String(now / 1000) }, { expiry: '-1' }, { remaining: 'broken' }, { unitPriceAtomic: '1' }]) assert.equal(currentListingQuote({ ...quote, ...change }, listing, '3', now), undefined);
  for (const bad of [undefined, null, [], {}, { ...quote, amountAtomic: '9'.repeat(10000) }]) assert.equal(currentListingQuote(bad, listing, '3', now), undefined);
});
test('unbroadcast expired or malformed intents fail closed without breaking valid post-broadcast reconciliation', () => {
  const intent = { id: 'synthetic', status: 'CREATED', command: { type: 'SEND', asset: 'REAED' }, walletAddress: wallet, chainId: 15324, expiresAt: new Date(now + 1000).toISOString(), transaction: { to: listing.project, data: '0x', valueWei: '1', gasEstimate: '21000', estimatedFeeWei: '1', chainId: 15324 } };
  assert.equal(transactionIssue(intent, wallet, now), null);
  for (const expiresAt of [undefined, null, '', 'invalid', new Date(now).toISOString(), new Date(now - 1000).toISOString()]) assert.match(transactionIssue({ ...intent, expiresAt }, wallet, now), /expired/);
  for (const walletAddress of [undefined, null, 42, {}, 'broken']) assert.ok(transactionIssue({ ...intent, walletAddress }, wallet, now));
  assert.ok(transactionIssue({ ...intent, command: null }, wallet, now));
  const hash = `0x${'4'.repeat(64)}`;
  const settled = { ...intent, status: 'CONFIRMED', expiresAt: '2020-01-01T00:00:00Z', txHash: hash, receipt: { status: 'success', transactionHash: hash } };
  assert.equal(transactionIssue(settled, wallet, now), null);
  assert.equal(isSettled(settled), true);
});


test('every pre-broadcast approval state rejects expired and malformed deadlines and directs recovery to the same intent', () => {
  const intent = { id: 'synthetic-pending', status: 'CREATED', command: { type: 'SEND', asset: 'REAED' }, walletAddress: wallet, chainId: 15324, expiresAt: new Date(now + 1000).toISOString(), transaction: { to: listing.project, data: '0x', valueWei: '1', gasEstimate: '21000', estimatedFeeWei: '1', chainId: 15324 } };
  for (const status of ['CREATED', 'SUBMITTING', 'AWAITING_APPROVAL']) {
    assert.equal(transactionIssue({ ...intent, status }, wallet, now), null);
    for (const expiresAt of [undefined, null, 42, {}, [], '', 'invalid', new Date(now).toISOString(), new Date(now - 1).toISOString()]) {
      const issue = transactionIssue({ ...intent, status, expiresAt }, wallet, now);
      assert.match(issue, /expired/);
      assert.match(issue, /Do not approve/);
      assert.match(issue, /Refresh this same intent before preparing any replacement/);
    }
  }
  const hash = `0x${'4'.repeat(64)}`;
  for (const status of ['BROADCAST', 'CONFIRMED', 'INDEXED', 'RECONCILIATION_REQUIRED']) {
    const reconciled = { ...intent, status, expiresAt: 'invalid', txHash: hash, receipt: { status: 'success', transactionHash: hash } };
    assert.equal(transactionIssue(reconciled, wallet, now), null);
  }
});


test('transaction polling stops at terminal states but continues through broadcast, confirmation and reconciliation',()=>{
 for(const status of ['INDEXED','FAILED','REJECTED','EXPIRED'])assert.equal(transactionPollInterval({status}),0);
 for(const status of ['CREATED','SUBMITTING','AWAITING_APPROVAL','BROADCAST','CONFIRMED','RECONCILIATION_REQUIRED'])assert.equal(transactionPollInterval({status}),4000);
 assert.equal(transactionPollInterval(),4000);
 assert.match(transactionGuidance({status:'CONFIRMED'}),/when indexing finishes/);
 assert.match(transactionGuidance({status:'BROADCAST'}),/Do not send it again/);
 assert.match(transactionGuidance({status:'FAILED',errorCode:'CHAIN_REVERT'}),/fee may still have been charged/);
 assert.doesNotMatch(transactionGuidance({status:'FAILED',errorCode:'private-diagnostic'}),/private-diagnostic/);
});
