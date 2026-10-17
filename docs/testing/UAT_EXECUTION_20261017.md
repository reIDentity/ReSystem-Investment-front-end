# UAT execution — 17 October 2026

This record supersedes older preparation-only statements for the steps actually
verified below. It is a partial execution record, not full lifecycle acceptance
or a production release. Preserve the approved investor UI.

## Current checkpoint — 12:46 UTC admin deployed; unsigned review pending

The reviewed **admin-only rollout completed 12:42:32.633 UTC**. Filtered nonsecret
proof `uat-admin-wallet-actions-deployed-20261017.json`, observed 12:46:39 UTC,
records actual source **ba508f2cc4fb9f795fd3ed9a67d11aff466d10b4** and immutable
image **sha256:c97a281cb31209c1a4bb3748e4980378a2e3d75c3c479f3aeca23099a3629a14**.
Only admin was recreated. Other container identities, protected environment and
the existing gate true were preserved; API/worker 65393fc and indexer 2232e9a are
unchanged. Backend media 62b9f9c and its migration remain unapplied. Builder is
stopped. No signing, broadcast, financial or database mutation occurred in rollout.

Genuine image build started **12:33:15 UTC**, compiling 16 routes in 84 seconds.
An initial offline probe incorrectly demanded case-sensitive `Sign in`, while
the static Suspense fallback was `Loading sign in`. The narrow probe was fixed
against the **same already-built image**, without rebuilding; failed journal
and build log were retained. Bounded offline nonroot UID/GID 1001, 256 MiB,
0.25 CPU, 64 PIDs, network none probe returned HTTP 200. The no-build verification
journal ending `124155-1519140` reached build_complete;
actual rollout journal `admin-ba508-20261017T124226Z-1520445.json` reached complete.
Correcting this presentation-text assertion does not waive authorization,
admission, resource or runtime identity checks.

The coordinator observed the actual deployed new wallet-action form, B wallet
bound through MetaMask/chain 15324. Through that legitimate UI it prepared an
**APPROVE_USDT allowance for listing #1, quantity 10, exact 10,000 atomic units =
0.01 USDT**. The review was **CREATED, unsigned/unbroadcast**, expiry
**12:49:39 UTC**; human final acknowledgement and MetaMask approval were pending
at this snapshot. No private intent identifier or raw authenticated body is
copied here. An expired review cannot be reused; no signature is inferred from
preparation or wallet binding. This is not a fill or permission to spend.

The filtered proof's pending 0/indexed 15/unsigned-expired 2 counts describe the
**12:42 rollout admission**, before the later CREATED review. Do not present
pending 0 as the subsequent live state. Financial totals remain **17 real
successful transactions = 15 INDEXED app intents + 2 external indexed top-ups**,
with 2 unsigned EXPIRED historical intents excluded. Budget **86.16 reAED + 1.21 USDT
spent / 63.84 reAED + 0.79 USDT remaining**, 17/32 slots; an unsigned review is not
transaction count or spend. First fill/cancel/full claims, native listing #2
buyer consent, post-fix phone-image and controlled empty/delay/negative journey
acceptance remain open. Each further exact financial action needs human approval.

This final documentation change touches only the five Markdown checkpoints;
no investor UI/code/generated artifacts, financial action, gate or FP operation
is performed by it. Archive exact published snapshots and the filtered rollout proof on the existing
private records after publication; record native byte verification separately.

## Historical checkpoint — 12:30 UTC native listing verified; finance paused

One last independently observed investor action before the human confirmed
the financial pause created a new native-asset listing. Protected
`uat-additional-native-listing-independent-20261017.json` at **12:30:13.604 UTC**
passes **80/80 checks**: exact signed/stored chain15324, actual ListingCreated
receipt/source identity, project/seller/payload and unchanged accounting.

[Native listing0x4f33…6a24](https://uat.scan.infraworld.org/tx/0x4f338f167cc901ae8f280ed3bf879a344ea959dbefe093eba273e666df5f6a24)
is canonical/INDEXED at **block 7,336,174**, mined **12:24:24 UTC**, before its
intent expiry 12:29:05.609 UTC. The actual emitted ID is **2**, quantity **2**,
price **5 reAED per fraction**, contract expiry epoch **1796905380**. Native
value is0, fee 3 reAED; no tokens were escrowed/moved, no proceeds or purchase
occurred. Listing #1 remains unchanged with 1,000 available at 0.001 USDT and its
original expiry. A/B stay **1,188/12**, issued 1,200; historical rewards,
reserves and primary proceeds3.96 reAED/0.1 USDT stay unchanged. A verifier's
post-expiry read does not invalidate a successful transaction mined before its
intent expiry; neither read invents a replacement signature or approval.

The exact ledger is **17 real successful transactions:15 INDEXED app intents
plus 2 external canonical/indexed top-ups**. The 2 unsigned EXPIRED historical
intents remain unspent history. New spend is only this **3 reAED fee**;
aggregate **86.16 reAED + 1.21 USDT consumed**, **63.84 reAED + 0.79 USDT remaining**,
**17/32 slots**. Independent17-row integer sums match the approved150 reAED/2 USDT
limits. Native proof 3,035 bytes/SHA256
`3d17a735ad74f7fe2f7877265384db732b5125c2e54878ade3f72fad18bd6cfb`
and exact budget 11,195 bytes/SHA256
`cdc7eb0f1869a058e5a5daf65bd8d988e7e419e8ba7c7b91834f2eca02671cdd`
were native-archived and downloaded byte-for-byte on existing private backend
Documents, **60→62 references**, all previous files/parent/access preserved.
The prior16-row budget remains the 12:19 snapshot, not current spend.

**The human has confirmed financial actions PAUSED/no new approvals.** This
new listing was observed independently before that confirmation; this verifier
made no provider request, signing, broadcast or state update. A genuine admin
image build started **12:30 UTC after the pause**, superseding the earlier refused
attempts. No running admin/app deployment is yet claimed: actual admin 543822b,
API/worker 65393fc, indexer 2232e9a and gate true are unchanged. Wait for actual
reviewed deployment evidence before committing/archiving these Markdown files.

### Replanning is conditional; the native offer is not buyer consent

If this actual native listing #2 replaces a future planned listing-creation
action, the conditional count is **17 actual + 15 remaining = 32**. Its quantity 2 and
price 5 reAED are different from the original 20-at 0.0036 reAED example. Do not
automatically substitute it, buy at that price, reuse the earlier 131.574 reAED
projection or claim a revised purchase is approved. Review the exact remaining
quantities/prices, total budget and transaction count with the human after
pause; any approval is still specific to its exact wallet/payload. No first
fill/cancel/full-exit/claims or negative/full-journey acceptance is complete.

## Historical checkpoint — 12:19 UTC additional human buy and transfer verified

The human independently used the live investor app while waiting, producing
two additional real transactions. Protected
`uat-additional-buy-transfer-independent-20261017.json` verified them at
**12:19:24 UTC**, with all receipt, exact-block state, canonical source-event,
current-head and cursor/projection checks passing. This documentation performed
no signing, provider request, broadcast or financial state change.

| Additional human action | Canonical receipt | Exact cost and result |
| --- | --- | --- |
| Native BUY 100 | [0xad54…bbda](https://uat.scan.infraworld.org/tx/0xad5415b9c149a7c590a142d82f68aa11c6256b3ec3115b41c33dc9361273bbda), block 7,335,763, mined 12:10:42 UTC |0.36 reAED value + 3 reAED fee; minted 100, A 1,090→1,190/B 10, supply 1,100→1,200 |
| Transfer 2 A→B | [0xa375…209b](https://uat.scan.infraworld.org/tx/0xa375fe9591636e861e2279bfdda3d6f464ec3ea04b56c623bd7983cbbeb8209b), block 7,335,782, mined 12:11:20 UTC |zero value + 3 reAED fee; A 1,190→1,188/B 10→12, supply unchanged 1,200 |

Both exact commands, chain 15324, sender/target/calldata, deadlines/expiry,
canonical membership, real Purchased/TransferSingle facts and INDEXED identities
match. At captured canonical head **7,336,023**, and separately at exact confirmed
cursor **7,336,009**, independent contract reads match projections: **A 1,188,
B 12, issued 1,200/max 10,000, remaining 8,800**. A's ownership is 1,188/10,000
(11.88%) and next allocation participation 1,188/1,200(99%); issued supply is 12%.
Native/USDT historical claimable remains **A 7.164 reAED + 1.09 USDT /
B 0.036 reAED + 0.01 USDT**. Native reserve 7.2 reAED and USDT reserve 1.1 USDT are
unchanged; primary proceeds are now **3.96 reAED + 0.1 USDT**. Contract native
balance 11.16 reAED reconciles proceeds + reserve. Listing #1 remains uncancelled,
1,000 available at 0.001 USDT and the original 18:00 Dubai expiry; no fill occurred.

The updated exact ledger contains **16 successful real transactions: 14 INDEXED
application intents + 2 external canonical/indexed top-ups**. The 2 historical
unsigned EXPIRED intents remain history/unspent. New cost is 0.36 + 3 + 3 = **6.36 reAED**;
aggregate **83.16 reAED + 1.21 USDT spent**, **66.84 reAED + 0.79 USDT remaining**,
**16/32 slots**. Integer ledger sums and limits were independently checked.

The former conservative whole-journey projection was 125.214 reAED/30 transactions.
Adding these unplanned 2 transactions gives **125.214 + 6.36 = 131.574 reAED** and
**30 + 2 = 32 transactions**, only if the former remaining action plan is unchanged.
This reaches the planned transaction-slot bound; it is not actual spend, a fee
guarantee or permission for more actions. **Recompute every remaining quantity,
quote, fee and transaction count before the next approval.** In particular,
the old 1,075-fraction full-exit example is stale after the extra buy/transfer;
using the originally planned 10 + 5 resale fills would leave A 1,173/B 27 before full
exit, and 1,200 total afterwards. Those fills/exits are not performed or approved
by this arithmetic. First fill/cancel/full claims and required negative journey
remain open.

### Admin preparation refusal — no image build or running-service change

Earlier 12:06 wording described a build attempt, not a completed admission or
actual image build. The initial root-profile mismatch was corrected; the guard
then correctly refused newly created live intents. **No real image build
started; builder is stopped and running services are unchanged.** Actual admin
remains 543822b, API/worker 65393fc, indexer 2232e9a and the existing gate true.
Published ba508f2, pin 8818506 and successful CI remain source evidence only.
Final financial approval remains private, human-owned and pending. Wait for the
coordinator's actual reviewed rollout evidence before claiming deployment or
archiving/committing this latest checkpoint.

## Historical checkpoint — 11:56 UTC B wallet proof; financial checkpoint11:49

**14 real successful canonical transactions** are verified: **12 INDEXED
application intents plus2 externally sent deployer top-ups independently found
in canonical indexed wallet activity**. This is not 14 application intents or
14 INDEXED status rows. Two historical EXPIRED unsigned intents count as neither
executed transactions nor spend. The current budget is **76.8 reAED + 1.21 USDT
consumed**, **73.2 reAED + 0.79 USDT remaining**, 14/32 transaction slots. The
coordinator's conservative whole-journey projection 125.214 reAED/30 transactions
is planning only, not actual spend, a fee guarantee or permission to sign.

### Actual USDT listing — no fill or escrow

The human-approved [listing0x4a8c…3f8a](https://uat.scan.infraworld.org/tx/0x4a8c45ea08b713de9d3f3ce404fc715bc5ef5b5878fc7ade35fe33bb612a3f8a)
is canonical/INDEXED at block **7,334,517**, mined **11:29:10 UTC**, verified
**11:31:14 UTC** with **53 passing checks**. Listing **#1** offers **1,000 whole
fractions at 0.001 USDT** each, expiry **17October14:00 UTC /18:00Asia-Dubai**.
Available quantity is 1,000; a10-fraction quote is 0.01 USDT. Exact seller/project/
marketplace/calldata/event/indexed identity match, and the3 reAED fee is separate.
No fractions were escrowed or moved. A/B remain 1,090/10, issued 1,100,
allocations/reserves unchanged, seller proceeds zero. **First fill and
cancellation have not occurred.**

### Exact bounded deployer top-ups authorized by the human

The human replied **“you have deployer private key do it”** to the exact request
to send **24 reAED + 0.01 USDT** from the existing deployer to wallet B. The
coordinator executed only those two specified sends; this does not authorize
other saved-key actions or future approvals.

| Actual top-up | Canonical block | Independent receipt result |
| --- | ---: | --- |
| [24 reAED](https://uat.scan.infraworld.org/tx/0x918b9391b4b715283f3b86beed5cd58688b805549df9c284d1a8abfefb221288) | 7,334,947 |16/16 checks; mined 11:43:30 UTC, verified 11:44:29 UTC |
| [0.01 USDT](https://uat.scan.infraworld.org/tx/0x9315b23d9a7f4097d6d026ad1dd2bdf2dd1c8511b698282df32f68b089bcd1d5) | 7,335,030 |17/17 checks; mined 11:46:16 UTC, verified 11:47:26 UTC |

Each charged **3 reAED**. Exact chain 15324, sender, recipient, calldata/value,
nonce, unique canonical receipt membership, finality and recipient increase
matched; the token transfer was exactly10,000six-decimal atomic units. At
**11:49:24 UTC**, independent indexer-v2 proof found both actual canonical
wallet-activity rows, native from receipt and USDT from receipt/log. They are
external sends, not platform TransactionIntent status rows. B has **24 reAED,
0.01 USDT and10 fractions**; its human wallet proof is now confirmed, and the actual admin wallet page showed B/MetaMask/chain 15324 at 11:56 UTC. That does not approve a financial action. No
impersonation, extra key use or automatic wallet approval is implied.

The deduplicated14-row budget includes the12 app fees, both top-up fees,
the24 reAED transfer and0.01 USDT transfer. Actual totals76.8 reAED/1.21 USDT
and remaining73.2 reAED/0.79 USDT were independently summed against the approved
150 reAED/2 USDT cap. New nonsecret native/USDT journals, listing proof, indexed
top-up-v2 proof and the exact budget snapshot were native-archived on existing
private backend Documents, **53→58 prior references preserved**; downloaded
contents/byte counts match originals and SHA-256 is recorded. No private key,
cookie/header, provider secret or raw authenticated body is attached.

### Current media/browser acceptance boundary

Published 6b33f50/CI 39028342754 now loads the exact project CID through the
existing Pinata gateway in actual **Explore and ProductDetail**. Natural image
dimensions **1600×1000 WebP** were verified during 11:29–11:42 UTC. Earlier
actual 1440×1000/390×844 Figma hierarchy/amount observations remain valid.
Post-fix attempts requested 1440/390 but DOM showed the **actual viewport 2560 px**.
The first failed attempt occurred while the Mac was locked. A later override
also measured 2560 px; its failure cause is unproven. The attempted files were
renamed to reflect the measured viewport. **Do not claim a post-fix phone-image pass** from
those captures. RSI-080 stays open for that remaining bounded confirmation;
RSI-082 controlled Home empty/indexing-delay checks remain pending. No full
visual/accessibility signoff or Vercel runtime SHA is inferred.

Runtime remains indexer 2232e9a/API/worker 65393fc/admin 543822b/gate true; backend
media 62b9f9c/migration are not deployed. The admin form passed local 109 tests/build and is now published as ba508f2
with coordinator-observed hosted CI 39030384470 SUCCESS; actual admin remains
543822b until the separately reviewed rollout. Source publication is not live acceptance.
RSI-047/096 retain their original open scope; no fill/cancel/full-exit/claims
or required human negative journey is claimed. Every next exact wallet action
still needs its own human approval.

### Published admin form and actual B binding — rollout still pending

At **11:56 UTC**, the coordinator observed the actual admin wallet page showing
the human-proved B wallet bound through **MetaMask, chain 15324**. This supersedes
the earlier pending B-proof statement; it grants no financial approval or new
role and moved no assets. The 14-transaction budget remains the 11:49 snapshot.

Admin [ba508f2cc4fb9f795fd3ed9a67d11aff466d10b4](https://github.com/reIDentity/ReSystem-Investment-admin/commit/ba508f2cc4fb9f795fd3ed9a67d11aff466d10b4)
is published. The coordinator observed exact [hosted CI 39030384470 SUCCESS](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39030384470).
Backend [88185069f4d96df4fb20e4211439357d45d7c4a6](https://github.com/reIDentity/ReSystem-Investment-backend/commit/88185069f4d96df4fb20e4211439357d45d7c4a6)
publishes only the admin source pin; the coordinator observed [hosted Run 27,
39030551534 SUCCESS](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/39030551534).
Source and CI do not establish deployment.
**Actual admin is still 543822b**, API/worker 65393fc, indexer 2232e9a and gate true.
The12:06 build-attempt report was later corrected: no actual image build
started. After the initial root-profile mismatch was corrected, the admission
guard correctly refused newly created live intents. Builder is stopped and no
running service changed. Actual rollout still needs its own measured completion
evidence; source/CI/dispatch are not deployment. Final financial
approval remains with the human and is pending. This documentation performs no
runtime or financial action and changes no task criterion/status.

## Historical checkpoint — 11:24 UTC marketplace approval verified

The investor personally approved [APPROVE_MARKETPLACE0x04e0…eef2](https://uat.scan.infraworld.org/tx/0x04e0703abc0a4b6c4cdc382be953707d437d7bc08fab2d669b4ec6fcf2fdeef2).
It is canonical/**INDEXED** at block **7,334,320**, mined **11:22:36UTC** before
expiry11:25:24.095UTC and independently verified **11:24:00UTC**,42 confirmations.
All **36 checks pass**: exact chain15324, investor A, registered project,
`setApprovalForAll`, exact marketplace operator
`0xa17fad71e866c2bab2b327aeb4288f741ced90a1`, true approval, one canonical
ApprovalForAll and its actual indexed source identity.

This is **approval only**. Native value0, fee **3reAED**, USDT spend0; no fraction
transfer, listing creation/fill, seller proceeds, cancellation or claim occurred.
A/B remain **1,090/10**, issued1,100/max10,000, native claimable7.164/0.036 and
USDT1.09/0.01; reserves7.2reAED/1.1USDT are unchanged. All **eleven existing
human-approved lifecycle receipts are now INDEXED**. The deduplicated first
eleven ledger rows independently total **43.8reAED+1.2USDT consumed**,
**106.2reAED+0.8USDT remaining**. This supersedes the ten-receipt budget below;
operator approval adds only its3reAED fee. Each later exact wallet action still
needs separate human approval. Listing preparation is not a completed listing.

Human import of wallet B is confirmed. The coordinator observed its native and
USDT balances were zero through read-only checks; no B funding or automatic
wallet action is inferred. This documentation accessed no wallet B private
file/credential. Exact independent proof
`uat-market-approval-confirmed-20261017.json`, **1,844bytes**, SHA-256
`9d2312f020bde207d025953d69088ce79490cf91b6c765d8744518b80d4916c9`,
is native-archived on existing private backend Documents and downloaded bytes
match the protected original. RSI-047/096 were appended with this checkpoint;
their original criteria/status/history/dependencies remain unchanged.

The image gateway successor is now published as [6b33f50](https://github.com/reIDentity/ReSystem-Investment-front-end/commit/6b33f50c3b6ccc99a00ff5c6aec21c0b3df835ce),
with coordinator-observed [CI39028342754 SUCCESS](https://github.com/reIDentity/ReSystem-Investment-front-end/actions/runs/39028342754).
Its strict helper/three URL bindings preserve other JSX hierarchy/attributes.
**Actual live image-load verification remains pending**, so RSI-080 stays open.
RSI-082 controlled empty/indexing-delay and RSI-047/096 full negative/journey
acceptance remain open. FP indexer2232e9a/API-worker65393fc/admin543822b and the
existing service-wide gate true remain unchanged; backend media62b9f9c/new
migration are not deployed. This update performs no source/runtime/financial action.

## Historical checkpoint — 11:01 UTC Approval recovery verified

At **11:01:05 UTC**, the coordinator verified the completed FP recovery:
**all ten individually human-approved lifecycle transactions are now INDEXED**.
The reviewed indexer [2232e9a](https://github.com/reIDentity/ReSystem-Investment-indexer/commit/2232e9a48dcd731042d67aa2e026208802a5aaeb)
is actually running. Exact one-block imports at **7,331,801** and **7,332,331**
each inserted one genuine successful canonical fixed-USDT Approval source fact.
The unchanged backend worker normally reconciled both exact intents from
CONFIRMED to INDEXED; **no direct database status write** occurred. Their
allowances had already been consumed by separately approved actions. This
recovery required no new financial transaction and changed no spend.

During stopped-indexer imports, the exact cursor/timestamp, all original facts,
accounting projections, wallet/backfill/queue/alert/migration state and core
identity/project record fingerprints were preserved. Only the two genuine new
source rows and normal worker intent/audit/notification reconciliation were
expected changes. Normal canonical progress resumed after restart. API
health/ready returned200; indexer ready200, head7,333,669/confirmed7,333,657,
lag12 and no current error were observed. Six complete, zero pending and zero
failed candidate queues establish bounded RPC-verified explorer-candidate
processing. Internal transfers remain unavailable; neither observation proves
exhaustive historical coverage.

API/worker remain **65393fc**, admin **543822b**. Other container identities,
protected environment and the existing explicitly human-approved service-wide
UAT submission gate **true** were preserved; builder is stopped. Media62b9f9c
and its new migration remain **not deployed/applied**. Disable new reID requests
at session end after reconciling pending/uncertain provider approvals.

Two earlier preflight refusals occurred before any service changes. Corrected
expectations matched the proven admin USER app and actual UID1001 nonroot
smoke; guards were not weakened. The successful journal retains transient
one-off-not-yet-present and early-health-poll `command_refused` diagnostics.
Its final complete phase and verified postflight do not mean every intermediate
command/poll succeeded. Exact protected evidence is
`approval-recovery-complete-20261017.json`,32,703 bytes, SHA-256
`182056ac20be887ee5e235b4f7393dfd171e0be65d970d9caf261ec6adb31efc`;
its native Notion attachment was downloaded and byte-verified. The original
FP journal is `approval-recovery-20261017T110028Z-1412060.json`.

Holdings remain **investor1,090 / B10**, issued1,100/max10,000, remaining8,900.
Claimable remains **7.164 reAED +1.09 USDT /0.036 reAED +0.01 USDT**, with zero
claimed. Reward reserves7.2reAED/1.1USDT remain distinct from primary sale
proceeds3.6reAED/0.1USDT. The protected deduplicated ledger remains
**40.8 reAED +1.2 USDT spent**, **109.2 reAED +0.8 USDT remaining**.

The coordinator also observed successful investor27d0dde CI and the actual
public ProductDetail refresh showing **+1.1USDT and two +3.6reAED** funding
rows, correcting the numeric-enum formatting defect described below. Source
AST comparison preserves all JSX hierarchy/attributes for the two bindings.
Bounded live ProductDetail/Earnings comparisons at1440×1000/390×844 now verify
the original hierarchy and exact amounts, as recorded below. A separate
unreachable-image defect still awaits its prepared gateway correction and
actual image-load check; this does not establish a Vercel runtime SHA or complete
visual acceptance. RSI-049/081 are Done only for
their original API/primary-buy criteria; RSI-047/080/082/096 remain open for
their precise remaining acceptance.

## Historical checkpoint — 10:21 UTC, before Approval recovery

The following snapshot records the then-current two-intent indexing gap. The
verified11:01 recovery above supersedes its pending-runtime statements without
erasing the receipt/allocation evidence.

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

### Historical Approval indexing gap — 10:21 UTC

At this checkpoint the two allowance-only intents are canonical CONFIRMED, not
INDEXED: the running old indexer persists fixed-USDT Transfer events but ignores
Approval. This is a source-event tracking gap, not a failed approval, unspent
duplicate request or financial balance discrepancy. The normal backend already
allows a separately reviewed action after canonical confirmation. Its worker
continues reconciliation until the real source event appears.

At10:21UTC, an indexer-only correction had passed local source tests and
independent review was pending. It had to persist the actual successful canonical Approval log as a
non-accounting fact; it must not invent a deposit, project allowance from events,
rewind a cursor or directly patch intent status. Forward ingestion alone cannot
discover the two earlier ignored logs behind the cursor. Any reviewed recovery
must preserve accounting and use a bounded canonical historical import with the
indexer stopped. No such runtime rollout/import had occurred at that checkpoint.
The actual11:01 recovery above subsequently verified both genuine source facts
and normal reconciliation; this historical gap is now resolved.

## Budget and fee observations

The approved aggregate UAT cap is 150 reAED plus 2 USDT, including gas/top-ups.
Ten successful transactions charged 30 reAED in fees. The native purchase and
two native revenue deposits contributed 10.8 reAED principal; the USDT purchase
and funding contributed 1.2 USDT. Allowance transactions moved no principal.
The deduplicated ledger therefore records 40.8 reAED + 1.2 USDT spent and
109.2 reAED + 0.8 USDT remaining at10:21UTC, unchanged by the11:01 recovery.
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
| Indexer genuine Approval ingestion/recovery | [2232e9a](https://github.com/reIDentity/ReSystem-Investment-indexer/commit/2232e9a48dcd731042d67aa2e026208802a5aaeb) | [39024923746](https://github.com/reIDentity/ReSystem-Investment-indexer/actions/runs/39024923746) |
| Backend bounded Approval rollout preparation | [0d39d5d](https://github.com/reIDentity/ReSystem-Investment-backend/commit/0d39d5d01194c337ea42daae02f87566a332a434) | [39025257934](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/39025257934) |
| Investor exact raw-event asset formatting | [27d0dde](https://github.com/reIDentity/ReSystem-Investment-front-end/commit/27d0ddebd59bed682a1adff814c0b8b15da9f686) | [39026343748](https://github.com/reIDentity/ReSystem-Investment-front-end/actions/runs/39026343748) |
| Investor strict existing-gateway project media | [6b33f50](https://github.com/reIDentity/ReSystem-Investment-front-end/commit/6b33f50c3b6ccc99a00ff5c6aec21c0b3df835ce) | [39028342754](https://github.com/reIDentity/ReSystem-Investment-front-end/actions/runs/39028342754) |

Earlier backend media checks include27unit/105realPG-Redis integration tests, schema/types/lint/
build, unchanged OpenAPI/client contract,33deployment and11CI helper checks.
The later rollout package adds one deployment helper regression (34 total).
Admin has87normal tests and five separately run local realBFF/API/PG/Redis
checks. Hosted normal admin CI does not run that opt-in integration. Earlier
indexer4abc7e9 checks include56unit/sixPGtests plus its actual-contract lifecycle
fixture;2232e9a adds strict source/import tests, with62unit/sevenPG/one actual
Anvil test. Investor27d0dde passed27tests, types/lint and20-route build.
These published packages passed redacted full-history secret scans without new
exceptions. Hosted success was observed by the coordinator in authenticated
Chrome; it does not substitute for actual runtime evidence.

At10:21UTC actual FP images were backend65393fc, admin543822b and indexer5227157.
The11:01 runtime proof above verifies only the indexer changed to2232e9a;
API/worker/admin remain65393fc/543822b. The new media migration/worker is not
deployed. Earlier admin3dfd61b/indexer4abc7e9 are test/doc revisions;2232e9a is
an actual source/runtime correction. Do not infer other rollout from green CI.

## Revenue-history amount formatting

### Historical source check — 10:48 UTC

The authenticated revenue response returned the three actual funding records,
7.2 reAED / 1.1 USDT funded, zero paid and matching reserves. Its raw ABI asset
enums are numeric 0/1. The deployed product history compared only string "1",
so the 1.1 USDT history row incorrectly displayed 0.0000000000011 reAED, while
combined funded/reward totals remained correct. Earnings incoming rows similarly
treated numeric enums as unavailable. A temporary request failure separately
recovered through the existing retry/refresh; it is not the formatting cause.

The source correction shares an exact numeric/string enum decoder across those
two raw-event bindings, keeps amounts as integer strings and leaves unknown
assets unavailable. It changes no API, source fact, contract, CSS, layout,
navigation or control. Independent TypeScript AST comparison with the published
baseline found identical JSX tags and full attributes: 430 nodes in ProductDetail
(Figma 7:1520), 253 in Earnings (Figma 8:968). All 27 tests, TypeScript, lint and
the 20-route production build passed. The initial sandboxed build stalled and
was stopped; a normal-permission build completed successfully. This records
source/markup preservation, not a new full visual/phone audit or verified Vercel
deployment at that checkpoint. Actual row verification was still required then.

### Published CI and observed public result

The coordinator observed [27d0dde hosted run39026343748 SUCCESS](https://github.com/reIDentity/ReSystem-Investment-front-end/actions/runs/39026343748).
After refreshing the actual public product page, all three funding rows showed
the correct original asset/amount: **+1.1USDT, +3.6reAED, +3.6reAED**. Current
ownership/supply/prices/contract references and the honest no-document state
were observed. This closes the specific raw-event formatting observation.
The subsequent bounded desktop/phone comparison below preserves a distinct
image-availability failure; RSI-080 remains open for that exact defect. No
Vercel runtime SHA or complete visual parity is inferred.

### Bounded live desktop and phone comparison

After the Mac was unlocked, the coordinator checked the actual public Earnings
and ProductDetail pages at **1440×1000 and390×844**. DOM inspection confirmed
the viewport sizes and document widths no greater than each viewport. The
original Figma **7:1520** and **8:968** section hierarchies were compared; no
redesign or broad visual/accessibility signoff is claimed. The live27d0dde
amount bindings showed the exact **1.1USDT /3.6reAED /3.6reAED** funding rows.
Investor quantity **1,090**, issued **1,100**, maximum **10,000**, and claimable
**7.164reAED +1.09USDT** matched the canonical/API checkpoint. Earnings showed
the **$3.08** fixed-rate equivalent; daily, all-holder and performance history
remained explicit unavailable states rather than fabricated series.

Home was also observed at both widths with **$3.08 available /$0 paid**, the
actual wallet KPI,1,090 shares and unavailable invested cost consistent with
null cost basis. Explore showed the published project at **0.001USDT** per
fraction, **11% issued /8,900 left**, and the investor's1,090 holding. These are
populated observations. Controlled Home empty-portfolio and indexing-delay
presentation remain unverified for RSI-082; they are not inferred from the
positive populated result. Full RSI-093 accessibility/state coverage is separate.

Protected screenshots remain outside Git/general document attachments:
`uat-earnings-1440-20261017.png`, `uat-earnings-390-20261017.png`,
`uat-product-1440-actual-20261017.png` and `uat-product-390-20261017.png`.
This documentation pass did not operate the browser or capture new images.

### Project-image gateway correction — images live, post-fix phone check pending

Before the correction, the coordinator observed ipfs.io unreachable with project-image
**naturalWidth0**. This is an actual failed image, not an offscreen lazy image
being counted as broken. The same CID is a valid **1600×1000WebP** through the
existing admin Pinata gateway; no replacement image/content was required.

A minimal **three URL bindings plus strict helper** correction was prepared.
The coordinator reports **28 tests, lint and the20-route production build**
passing, with all other JSX hierarchy/attributes preserved by AST comparison.
It is published as6b33f50 with successful hosted CI39028342754. Actual Explore
and ProductDetail subsequently loaded the exact-CID image at natural1600×1000,
verified11:29–11:42UTC. This supersedes the earlier source-only availability
gap. The post-fix attempted1440/390screenshots instead had measured2560px
viewports and were renamed. The initial failed attempt occurred while the Mac
was locked; the later override failure has no proven cause. Keep RSI-080 open pending bounded
post-fix phone-image confirmation; do not claim that unobserved pass. No broad
complete visual acceptance, Vercel runtime identity or completed RSI-082/093
is claimed.

## Original API and primary-buy acceptance

The live Notion review marked **[RSI-049 Done](https://app.notion.com/p/3fb3b21ac925814880d4d0d0a1c10ed0)** for its original two API
criteria: published contract19a8f8d funded yield-invariance regression and
backend65393fc canonical yield/reward reads, combined with the three actual
funding events, separate reserves/proceeds and current authenticated portfolio.
That portfolio was captured at10:54:46UTC and independently reconciled27/27 at
its exact reported canonical block7,333,480 at10:55:35UTC. Quantity1,090,
issued1,100/max10,000, claimable7.164reAED/1.09USDT, claimed0/0, ownership
1,090/10,000 and participation1,090/1,100 matched. Cost/yield remained null.
The independent proof only was privately archived; no raw authenticated body,
cookies, headers or credential was copied. Controlled historical-claimed API
coverage is not a nonzero human claim; no live yield edit was performed.

**[RSI-081 is Done](https://app.notion.com/p/3fb3b21ac92581e484bceb5ffbf8b2ef)** for its original exact both-asset purchase/rebuy and
historical-reward/no-fake-balance criteria. Real native BUY1,000 and USDT
rebuy100 passed41/52 receipt/state checks, with exact principal, separate fees,
actual mints and retained7.164/0.036 native allocation. Published8688528 and
successful CI39014058011 provide controlled rejection/failure/expiry/reverted/
hash-mismatch settlement guards and authoritative-only refresh with no
optimistic holding/money writes. This does not claim a human negative flow ran.
The formatting-only27d0dde is not needed for that settlement-source evidence.

## Remaining acceptance

Both-asset partial resale/cancellation, full exit, retained claims, seller
proceeds, rejection/expiry/revocation variations and remaining exact
balance/allocation/indexer reconciliation remain to be executed and verified.
Use [the lifecycle plan](UAT_LIFECYCLE_TEST_PLAN.md) for that sequence and the
protected ledger for deduplication and the remaining budget.

RSI-047 remains In progress: its original receipt/indexed-event criterion stays
checked, while the compound recoverable negative-flow criterion stays open.
RSI-080 remains open for bounded post-fix phone-image confirmation after actual
Explore/ProductDetail image loads and the earlier desktop/phone amount/hierarchy check.
RSI-082 remains open for controlled
empty/indexing-delay dashboard states. RSI-096 remains In progress with both original
full-journey acceptance criteria unchecked. These boundaries are not reopened
or completed by the narrower RSI-049/081 decisions.
RSI015 needs reviewed FP migration and actual media restart/upload acceptance.
RSI097's local bounded measurements do not certify all-history growth or FP/INFRA
capacity. Independent audit/production readiness remains separate. The human
deferred off-host backup copies; do not start additional backup work from this
record. Existing verified local backup/timer remains in place.

Private exact intent/session details, proof screenshots, budget journal and
credentials stay out of Git and ordinary documentation. Original protected JSON
proofs and exact document snapshots are retained in the existing private Notion
project, preserving earlier history and access.
