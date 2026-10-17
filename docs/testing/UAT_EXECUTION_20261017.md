# UAT execution — 17 October 2026

This record supersedes older preparation-only statements for the steps actually
verified below. It is a partial execution record, not full lifecycle acceptance
or a production release. Preserve the approved investor UI.

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
No source or public document contains its key or private identity. The planned
10-fraction partial transfer was prepared and personally approved in reID; its
canonical receipt and retained-reward checks are still being reconciled at this
checkpoint. Do not count that step as verified merely from the human's hash.

## Budget and fee observations

The approved aggregate UAT cap is150reAED plus2USDT, including gas/top-ups.
Publication and sale opening each cost3reAED, with zero native transaction
value. The native purchase and first revenue deposit each added3.6reAED principal and3reAED fee. The protected deduplicated ledger records four canonical/indexed
transactions, total19.2reAED spent and130.8reAED plus2USDT remaining at this checkpoint.
The earlier1000USDT transfer and sample NFTs belong to separate requests and are
not repeated or counted as new lifecycle execution.

Both receipts reported gasUsed1000000 and effectiveGasPrice3000000000000wei,
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
| Admin session/permission acceptance | [3dfd61b](https://github.com/reIDentity/ReSystem-Investment-admin/commit/3dfd61bc940db0b048f743fd2a104b28a23f666a) | [39021173180](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39021173180) |
| Indexer bounded retained-history tests | [4abc7e9](https://github.com/reIDentity/ReSystem-Investment-indexer/commit/4abc7e9e4e5ccf476b3b7b9dea09641e544165d4) | [39020817002](https://github.com/reIDentity/ReSystem-Investment-indexer/actions/runs/39020817002) |

Backend checks include27unit/105realPG-Redis integration tests, schema/types/lint/
build, unchanged OpenAPI/client contract,33deployment and11CI helper checks.
Admin has87normal tests and five separately run local realBFF/API/PG/Redis
checks. Hosted normal admin CI does not run that opt-in integration. Indexer
checks include56unit/sixPGtests plus its actual-contract lifecycle fixture.
All three passed redacted full-history secret scans without new exceptions.

Actual FP application images remain backend65393fc, admin543822b and indexer5227157.
The new media migration/worker is not deployed. Admin/indexer updates above
change only tests/docs. Do not claim a runtime rollout from a green source run.

## Remaining acceptance

Partial transfer reconciliation, second native funding,
USDT rebuy/funding, both-asset partial resale/cancellation, full exit, retained
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
