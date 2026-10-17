# UAT execution — 17 October 2026

This record supersedes older preparation-only statements for the steps actually
verified below. It is a partial execution record, not full lifecycle acceptance
or a production release. Preserve the approved investor UI.

## Current checkpoint — 10:21 UTC

Ten human-approved transactions have been independently reconciled. Eight are
INDEXED; two allowance-only transactions are canonical CONFIRMED while a known
indexer source-event gap is being corrected. They must not be labelled INDEXED
until the actual emitted Approval facts have been ingested.

The investor holds 1,090 fractions and disposable wallet B holds 10, out of
1,100 issued / 10,000 maximum. Claimable rewards are **7.164 reAED + 1.09 USDT**
for the investor and **0.036 reAED + 0.01 USDT** for B. No rewards have been
claimed. Both exact USDT allowances have been consumed by their separately
approved purchase/funding actions; their current allowances are zero.

| Human-approved action | Canonical block | Verified result |
| --- | ---: | --- |
| Project publication | 7,330,261 | INDEXED; exact approved fixture |
| Open primary sale | 7,330,442 | INDEXED; sale open |
| Buy 1,000 fractions with 3.6 reAED | 7,330,918 | INDEXED; ERC1155 ID 1 quantity 1,000 |
| Fund 3.6 reAED revenue | 7,331,162 | INDEXED; investor initially allocated all 3.6 |
| Transfer 10 fractions to B | 7,331,407 | INDEXED; existing 3.6 allocation retained by sender |
| Fund another 3.6 reAED revenue | 7,331,642 | INDEXED; 3.564 / 0.036 new allocation |
| Investor exact 0.1 USDT allowance | 7,331,801 | Canonical CONFIRMED; source-indexing gap |
| Buy another 100 fractions with 0.1 USDT | 7,331,996 | INDEXED; investor 1,090 / B 10; old rewards unchanged |
| Owner exact 1.1 USDT allowance | 7,332,331 | Canonical CONFIRMED; source-indexing gap |
| Fund 1.1 USDT revenue | 7,332,428 | INDEXED; 1.09 / 0.01 USDT allocation |

Actual aggregate spend is **40.8 reAED + 1.2 USDT**. The approved budget has
**109.2 reAED + 0.8 USDT** remaining, including future fees/top-ups. The protected
ledger deduplicates by actual transaction hash. Resale, full exit, claims and
negative journey acceptance remain open. Source changes to address the Approval
gap are not proof of a runtime rollout. No investor application UI was changed.

## Verified project creation

The human reviewed and submitted publication through MetaMask. The successful
[publication transaction](https://uat.scan.infraworld.org/tx/0x279a1f68ca3bb6e342874b877b86c447bd2de41a8d99508948792cc42b3a79b2)
was mined at block7330261 at09:07:18UTC. At09:11:24UTC, independent RPC/ABI checks
confirmed canonical receipt, exact sender/factory/calldata/zero native value,
signed chain15324 and one matching ProjectCreated event. Its fresh intent was
INDEXED and mined before its09:12:03UTC expiry. The earlier unsigned publication
intent expired without a stored hash and was not reused.

The factory registered project
`0xfCd8506bd09Ed556bF44788bBDed47533cFA950C`. Its implementation version, pinned
factory/implementation runtime hashes, minimal-proxy binding, ERC1155 support,
owner/treasury, maximum10000fractions, total10000000USDT atomic units and exact
pinned metadata URI all matched the approved fixture. Database publication
address/hash/block agreed with the receipt. The unchanged canonical source
manifest remains authoritative; documentation/test-only repository HEADs do not
replace its production contract pin.

## Verified primary sale opening

The human separately reviewed and submitted
[open sale](https://uat.scan.infraworld.org/tx/0x728fa9a840db96ef73b7b810c3626ddcb24e48b71bd09f491909e9d2facb17c7).
It was mined at block7330442 at09:13:20UTC, before its09:17:30UTC intent expiry.
Independent checks at09:14:17UTC verified exact sender/project/calldata/zero value,
canonical success and SaleStateChanged(true). Intent status was INDEXED. Current
contract reads confirmed registered project, saleOpen=true,
purchasePaused=false, totalSupply=0 and the approved economics/owner/treasury.

The existing investor product page displayed the published project open for
investment, its actual public image and0.001USDT/0.0036reAED price per fraction.
Issued/owned/revenue values were honestly zero. An unsigned1000-fraction quote
showed3.6reAED value, separately estimated3reAED fee, the actual connected
investor as recipient and the verified project contract. This is presentation
and preparation evidence, not a completed purchase.

## Verified first native purchase

The human personally requested and approved the fresh transaction in reID.
[Purchase0x5895…7b04](https://uat.scan.infraworld.org/tx/0x5895982d6d905a0a3fceffcad75c5b6fc85772efea1953775d35b87ad3977b04)
was mined at block7330918 at09:29:12UTC, before both the app expiry and contract
deadline. Independent checks at09:32:37UTC matched the exact stored payload,
signed chain15324, investor sender/recipient, project target,3.6reAED native
value, one Purchased event and one ERC1155 TransferSingle mint from zero.
TokenID1 quantity1000 arrived in the investor's connected wallet. The durable
provider intent and canonical transaction hash were recorded; status was INDEXED.

Current contract reads showed totalSupply1000, remainingSupply9000 and the
investor's balance1000:10% of the10000maximum project fractions and100% of the
currently issued revenue-participating supply. Primary native sale proceeds and
project balance were3.6reAED; rewardReserve and both-asset claimable values were
zero before revenue funding. The indexer's project and holding rows independently
agreed on issued1000, holder1000, sale proceeds3.6reAED and no revenue/rewards.
The admin treasury also displayed actual3.6reAED proceeds and1000issued fractions.
Wallet/scanner presentation depends on ERC1155 support and metadata indexing;
the canonical ownership balance and metadata URI are verified, not merely a tile.

The receipt fee was3reAED, so this purchase consumed6.6reAED including principal.
The owner-funded3.6reAED revenue deposit has since been separately verified below.

## Verified first owner revenue deposit

The human submitted
[revenue0x124e…2808](https://uat.scan.infraworld.org/tx/0x124e3e87631eaaf94c9a730c4fb7412528045d517a3e7a1897c1c5d09c892808)
in MetaMask. It was mined at block7331162 at09:37:20UTC, before its09:41:23UTC
app expiry, and independently canonical/indexed at09:39:46UTC. Frozen payload,
owner sender, project recipient,3.6reAED value, unique funding reference,
zero optional report reference and one RevenueFunded event all matched.

The event reported issuedSupply1000 and the exact native accumulator delta.
Current investor claimable and rewardReserve each became3.6reAED. Primary sale
proceeds stayed3.6reAED; the owner held0fractions and had0claimable from unsold
inventory. Contract native balance7.2reAED reconciled reserve plus sale proceeds.
Indexer funded amount/issued supply/primary proceeds agreed. Native gas cost3reAED.

The human then explicitly approved generating disposable walletB. Its credential
was created using a cryptographic generator, stored locally with0600permissions
and saved/read back only in the existing private Development Credentials record.
No source or public document contains its key or private identity. Its public
wallet address, ERC1155 balances and rewards are verified independently below.

## Verified partial transfer and second native funding

The investor personally approved the
[10-fraction transfer](https://uat.scan.infraworld.org/tx/0x30fd528f8502e1e76e89e5d115b02d0d13891bb526a4be66d96a8f6a67fba23b)
in reID. It was mined at block 7,331,407 at 09:45:30 UTC, before its app expiry.
All 59 independent checks passed. One actual TransferSingle moved ID 1 quantity
10 from the investor to B, with no mint/burn and zero native value. Holdings
became 990 / 10 while issued supply stayed 1,000. The investor retained the full
previous 3.6 reAED allocation; B initially had zero rewards. The fee was 3 reAED.

The owner separately submitted
[the second native revenue deposit](https://uat.scan.infraworld.org/tx/0x13c2501186143564de1bf1dac2399a96aa1dc04a7b54800c176ebe3bcc51ce76)
in MetaMask. It was mined at block 7,331,642 at 09:53:20 UTC and independently
canonical/INDEXED at 09:54:25 UTC. Its exact 3.6 reAED value and unique reference
matched the frozen command and one RevenueFunded event with issued supply 1,000.
This deposit allocated 3.564 reAED to the investor and 0.036 to B. Cumulative
claimable became 7.164 / 0.036 reAED, with reserve 7.2 and primary proceeds 3.6
kept separate. The contract's 10.8 reAED balance reconciled both categories.

## Verified USDT rebuy and revenue allocation

The investor personally approved the
[exact 0.1 USDT allowance](https://uat.scan.infraworld.org/tx/0x3215ad6dacead339f6e3ce1c60d8b57ac42c8882f99e9dffa800cdbe9b5729f3)
for the project, followed by the separate
[100-fraction USDT purchase](https://uat.scan.infraworld.org/tx/0x2ad654120d8ed5ffa2dbd00f7299b84b5cec1d6b029d0ddc42f5825574918e3a).
The allowance was mined at block 7,331,801 at 09:58:38 UTC, the purchase at
7,331,996 at 10:05:08 UTC. Both matched their exact frozen commands and app
expiry; the purchase also met its contract deadline. The allowance granted
100,000 atomic units, never an unlimited value. Its successful canonical
receipt has one Approval and no token transfer. The later purchase transferred
exactly 100,000 USDT atomic units to the project, minted another ID 1 quantity
100 and consumed the allowance to zero. All 52 purchase checks passed and the
purchase was INDEXED.

Current holdings became investor 1,090 / B 10, issued 1,100 and remaining 8,900.
The investor owns 10.9% of maximum fractions and participates with 1,090/1,100
of the currently issued revenue supply. The purchase preserved already allocated
native rewards of 7.164 / 0.036 reAED. USDT primary proceeds became 0.1 USDT;
no USDT rewards existed before the separate funding below.

The owner submitted the
[exact 1.1 USDT allowance](https://uat.scan.infraworld.org/tx/0x00bb5e7c66b69329b2ba84be7af706de253af9f7f4d1f373d2e2aeaa8b6867e8)
in MetaMask at block 7,332,331 / 10:16:18 UTC. All 40 financial/canonical checks
passed at 10:17:39 UTC. It granted exactly 1,100,000 atomic units to this project
and moved no funds. The independently submitted
[1.1 USDT revenue deposit](https://uat.scan.infraworld.org/tx/0x65290e6612c603355629cec46942cc8f13b3c71f429592fd57e098c2a21cd854)
was mined at block 7,332,428 / 10:19:32 UTC, before its app expiry, and INDEXED
at verification 10:21:05 UTC. All 56 checks passed: exact sender/project/calldata,
zero native value, unique reference, successful canonical receipt, one actual
1.1 USDT transfer and one RevenueFunded event with eligible supply 1,100.

The deposit allocated exactly 1.09 USDT to the investor and 0.01 USDT to B. The
owner's unsold fractions and claimable remained zero. USDT reserve 1.1 and
primary proceeds 0.1 reconciled the project's 1.2 USDT balance. Native balances,
reserve, proceeds and both holders' old native rewards were unchanged. The
owner's limited allowance was fully consumed. Each approval, purchase and
funding transaction charged 3 reAED independently.

### Approval indexing gap

At this checkpoint the two allowance-only intents are canonical CONFIRMED, not
INDEXED: the running old indexer persists fixed-USDT Transfer events but ignores
Approval. This is a source-event tracking gap, not a failed approval, unspent
duplicate request or financial balance discrepancy. The normal backend already
allows a separately reviewed action after canonical confirmation. Its worker
continues reconciliation until the real source event appears.

An indexer-only correction has passed local source tests and independent review
is pending. It must persist the actual successful canonical Approval log as a
non-accounting fact; it must not invent a deposit, project allowance from events,
rewind a cursor or directly patch intent status. Forward ingestion alone cannot
discover the two earlier ignored logs behind the cursor. Any reviewed recovery
must preserve accounting and use a bounded canonical historical import with the
indexer stopped. No such runtime rollout/import has occurred at this checkpoint.

## Budget and fee observations

The approved aggregate UAT cap is 150 reAED plus 2 USDT, including gas/top-ups.
Ten successful transactions charged 30 reAED in fees. The native purchase and
two native revenue deposits contributed 10.8 reAED principal; the USDT purchase
and funding contributed 1.2 USDT. Allowance transactions moved no principal.
The deduplicated ledger therefore records 40.8 reAED + 1.2 USDT spent and
109.2 reAED + 0.8 USDT remaining at 10:21 UTC.
The earlier1000USDT transfer and sample NFTs belong to separate requests and are
not repeated or counted as new lifecycle execution.

Observed receipts reported gasUsed1000000 and effectiveGasPrice3000000000000wei,
producing exactly3reAED. INFRA can report charged gas above the prepared gas
limit. The4reAED application quote threshold is not a cryptographic chain fee
cap. The explicitly approved public HTTP fee source remains time/size bounded
and must have agreeing positive decimal/hex values; no guessed fallback or TLS
verification bypass is used.

## Human-approved reID UAT enablement

Provider binary/source safety had already been reviewed. At09:24UTC, read-only
verification of its actual UAT process confirmed the reviewed executable,
configured INFRA chain15324 and default2000gwei relay price. Its public RPC is
https://uat.infraworld.org/; direct chain and this exact successful sale receipt
matched. This HTTPS alias differs from the platform's explicit-IP RPC URL; a
string inequality was not treated as a different chain or silently ignored.
No provider configuration, binary, key, grant or approval was changed.

Fresh platform checks verified a current unsuspended investor session, matching
wallet/provider subject, profile/wallet-read/wallet-transaction consent, sealed
access/refresh credentials, fresh access expiry, no other unsettled approval,
exact1000-fraction buyWithReAED payload, value3.6reAED, fee3reAED, sufficient
balance, registered open/unpaused project and approved chain.

Automatic approval review initially rejected enabling the service-wide feature
because individual transaction approvals did not authorize that exact boundary
change. The human then explicitly approved `REID_TRANSACTION_SUBMIT_ENABLED=true`
for this UAT session and a restart of only API/worker using unchanged images.
At09:27:07UTC, that exact switch was verified live with source65393fc. Both
services retained nonroot/read-only roots and measured768MiB/0.75CPU/256PID
limits. All18other container identities, other protected environment files and
identity/role/project records were preserved. No provider intent or wallet
transaction was created by this operation.

This switch permits connected users to request approvals across the service;
it is not a per-wallet allowlist. Every transaction still requires that user's
own approval. Disable new requests again at the end of this UAT session, as
promised to the human. Disabling the switch does not cancel any already-created
provider approval: reconcile pending/uncertain intents and hashes first, never
blindly retry or assume a disabled gate prevents a late approval.

A fresh unsigned purchase was prepared at09:28UTC and independently checked
at09:29UTC; its expiry is09:33:10UTC. The human personally reviewed/requested/approved
it in reID; its verified receipt and balances are recorded above.
Do not reuse an expired review or infer a signature from this document.

## Published verification work and runtime separation

| Repository | Published source | Observed successful hosted run |
| --- | --- | --- |
| Backend durable media jobs | [62b9f9c](https://github.com/reIDentity/ReSystem-Investment-backend/commit/62b9f9c4af478a6d2ef4b8dc47b1c582bf1db9ac) | [39020931067](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/39020931067) |
| Backend bounded media rollout preparation | [4e88b23](https://github.com/reIDentity/ReSystem-Investment-backend/commit/4e88b23af12af828225afbcfa5d46b58aeff4cf0) | [39023131527](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/39023131527) |
| Investor earlier execution checkpoint, documents only | [cf4090b](https://github.com/reIDentity/ReSystem-Investment-front-end/commit/cf4090bbe9df22c990215ed99af084208d719a96) | [39023248475](https://github.com/reIDentity/ReSystem-Investment-front-end/actions/runs/39023248475) |
| Admin session/permission acceptance | [3dfd61b](https://github.com/reIDentity/ReSystem-Investment-admin/commit/3dfd61bc940db0b048f743fd2a104b28a23f666a) | [39021173180](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39021173180) |
| Indexer bounded retained-history tests | [4abc7e9](https://github.com/reIDentity/ReSystem-Investment-indexer/commit/4abc7e9e4e5ccf476b3b7b9dea09641e544165d4) | [39020817002](https://github.com/reIDentity/ReSystem-Investment-indexer/actions/runs/39020817002) |

Backend checks include27unit/105realPG-Redis integration tests, schema/types/lint/
build, unchanged OpenAPI/client contract,33deployment and11CI helper checks.
The later rollout package adds one deployment helper regression (34 total).
Admin has87normal tests and five separately run local realBFF/API/PG/Redis
checks. Hosted normal admin CI does not run that opt-in integration. Indexer
checks include56unit/sixPGtests plus its actual-contract lifecycle fixture.
All three passed redacted full-history secret scans without new exceptions.

Actual FP application images remain backend65393fc, admin543822b and indexer5227157.
The new media migration/worker is not deployed. Admin/indexer updates above
change only tests/docs. Do not claim a runtime rollout from a green source run.

## Remaining acceptance

Approval source-event recovery, both-asset partial resale/cancellation, full exit, retained
claims, seller proceeds, rejection/expiry/revocation variations and exact
balance/allocation/indexer reconciliation remain to be executed and verified.
Use [the lifecycle plan](UAT_LIFECYCLE_TEST_PLAN.md) for that sequence and the
protected ledger for deduplication and the remaining budget.

RSI096 remains In progress with its original acceptance criteria unchecked.
RSI015 needs reviewed FP migration and actual media restart/upload acceptance.
RSI097's local bounded measurements do not certify all-history growth or FP/INFRA
capacity. Independent audit/production readiness remains separate. The human
deferred off-host backup copies; do not start additional backup work from this
record. Existing verified local backup/timer remains in place.

Private exact intent/session details, proof screenshots, budget journal and
credentials stay out of Git and ordinary documentation. Original protected JSON
proofs and exact document snapshots are retained in the existing private Notion
project, preserving earlier history and access.
