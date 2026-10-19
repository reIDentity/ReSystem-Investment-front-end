# UAT execution — 17 October 2026

This record supersedes older preparation-only statements for the steps actually
verified below. It is a partial execution record, not full lifecycle acceptance
or a production release. Preserve the approved investor UI.

## 19 October 2026, 07:34 UTC — actual media acceptance and unchanged financial preflight

**Latest verified financial delta — 07:45:49 UTC:** the human’s [native listing #2 fill](https://uat.scan.infraworld.org/tx/0x5060ca4a10d9eac03bb7ba816469e3653d7522943ac619139731955f7f11876a) passed **165/165** canonical receipt, exact-block and indexed-source/projection checks. At block **7,413,991**, mined **07:38:18 UTC** before both review deadlines, B bought **1 fraction for 5 reAED + 3 reAED actual fee**. **A 1,173/B 27**, supply 1,200; listing #2 remaining **1**, native seller proceeds accrued **5 reAED**, old rewards/reserves/USDT unchanged. Gate false, no new reID window authorized; remaining financial tasks stay In progress.

Independent `media-independent-final-proof-20261019.json` at **07:34:46.182 UTC** reports **allObservedChecksPass true** for actual source **62b9f9c4af478a6d2ef4b8dc47b1c582bf1db9ac**, API/worker image **sha256:179ce9212d462b6c22cbe60ada7e1438cd44c1b1fbda3108a888219f0d231077**, same worker container across two stop/start cycles, admin 517/indexer 223 preserved and submission gate false. Six finished migrations/MediaJob remain present. Final durable state is **4 SUCCEEDED jobs, attempts 1 each; 2 media records; 2 PINNED revisions (1/2); 0 active jobs; all ciphertext and leases erased**. Exact audit counts are **4 media.job_queued / 2 project.media_uploaded / 2 project.metadata_pinned**.

### Actual submitted sequence and bounded failures

The extension-local-file blocker described below was resolved before actual submissions. The first normal upload attempt returned a generic network failure and created **0 jobs**; its cause is unproven. The later exact retry succeeded, yielding one media/job, followed by pinned metadata revision 1. Repeating identical completed metadata did not create an extra revision/job. While the same worker was stopped, a second approved upload persisted as **QUEUED/attempts 0/encrypted payload retained**, with one existing media record and no fake CID. The UI's timeout state was observed. After resuming the same worker it became SUCCEEDED and the second media record existed **before client retry**; retry did not duplicate it. Metadata revision 2 and subsequent settled retries resulted in the final four jobs/two revisions. A second stop/start of that same worker retained completed state, cleared payloads/leases and exact counts. No provider outage or forced client abort was induced.

The separate media fixture remains **off-chain DRAFT version 2**, no publication hash and no contract; the existing published investment fixture is unchanged. Both images are approved public WebP content (183,092 bytes each) with asset CID `QmY95eC3RjvpaAECTweHxSBmhRSkkeakZcnrtcyuH7tTkN`. Pinned metadata URIs are `ipfs://QmZ3vHD3MsGfogiQjeVpJd3Smm4kGAMYxcdm3PQQA6Zd1n` (revision 1) and `ipfs://QmeJa5vS7s7oH9VVKjkB6cENYZd6U6jt4WnsY2Ur82oSpR` (revision 2). Strict other-project/media/revision/full-intent/canonical-prefix fingerprints are stable; original wallet activity is retained, cursor/projection versions advance monotonically, and accounting data is unchanged. No new chain transaction or financial intent was created by media work.

| Protected actual proof | UTF-8 bytes | SHA-256 |
| --- | ---: | --- |
| `media-upload-success-proof-20261019.json` | 5,371 | `b9e74f6bfba38a27ef7a430386c0815cdc5e8586905754ea1434376a46ab5ee3` |
| `media-normal-settled-proof-20261019.json` | 5,995 | `5ae0e2ba68fd20aae7cdda4aa28b283a7bff12d9a3b718a20c7cc4ca5d362f44` |
| `media-queued-stopped-proof-20261019.json` | 6,341 | `a5885b00d165ec25a938d5b1c99e86c3aed29334bf2018c45cd8d12a0f98e69c` |
| `media-recovered-proof-20261019.json` | 6,674 | `e7f07c71ddb59285c6dced191ae450c958e614b62275ea0dd618f03d3e72ed23` |
| `media-retries-settled-proof-20261019.json` | 7,219 | `a958c19b9bde61e14ae28908a67ffcfffccbb99ae1a30ecd6b49d234bb4e70d0` |
| `media-independent-final-proof-20261019.json` | 16,292 | `37725fae0d3031301dc2e4775f927f85ffa324f631271fdf332209e967d7d370` |
| `uat-window-preflight-public-20261019.json` | 6,785 | `44ddd6a104fffb79edc47683d4e778462f8c1f1c6bfd1599b8fa0604f957ed61` |

Settled UI/DOM evidence uses `media-upload-success-ui`, `media-worker-timeout-ui`, `media-recovery-success-ui` and `media-revisions-success-ui` (20261019 JPG/JSON pairs). Stopped-uploading and ambiguous metadata1 intermediate images are excluded from final settled-state evidence. The stopped-worker timeout is labelled as failure/recovery evidence, not relabelled a settled success. Actual provider/worker observations complement the existing published local PG/Redis/loopback failure, lease-expiry and idempotency tests; they do **not** prove a live Pinata outage, forced client abort or waiting 24 hours for expiry/pruning. No production UI/source fix was made for the initial generic network error. **RSI-015 is Done after coordinator/backend concurrence on the two original criteria**, using actual worker/outbox/media observations and separately labelled published failure/recovery tests. Original wording, dependencies and history are preserved; no financial or full-platform completion is implied.

### Financial state updated after the verified native fill; fresh approval still required

The verified ledger is now **22 successful actual transactions = 18 INDEXED app intents + 4 external indexed transactions**, **A 1,173/B 27, issued 1,200/max 10,000**, **106.16 reAED + 1.22 USDT accounted / 43.84 reAED + 0.78 USDT remaining**, **10 of 32 action slots left**. New immutable 22-row ledger preserves the old 21-row original. The 07:34 preflight was before this fill; every next exact action must refresh canonical state, quote, budget and human approval. Gate remains false; no publication, claim, withdrawal or new reID submission window is implied.

The earlier, pre-fill `uat-window-preflight-public-20261019.json` at **07:34:54.428 UTC** verifies chain 15324, confirmed block 7,413,872, code pins/solvency/current state, expired USDT listing #1 unavailable and native listing #2 quantity 2/price 5 reAED available. A read-only fill simulation succeeds, but it is **not an intent, signature or approval**. Proposed 11 remaining actions would total 32 with projected 136.556 reAED within the 150 cap and 1.22 USDT within the 2 cap; future gas/receipt costs are not guaranteed and each review must refresh. Wallet B proof and this native fill are now verified; the remaining financial actions still require refreshed exact reviews and human approvals, with gate false. Earlier dated checkpoints below are preserved verbatim as history.

Exact fill proof `uat-b-native-fill-independent-20261019.json` has SHA-256 `28bb30982b92c2277c69385fce2fdd49d02cc7e19adff1cde0cf1ac3ec35bf7c`; new immutable `uat-lifecycle-budget-after-b-native-fill-20261019.json` has SHA-256 `84eee8e748c0c04b0b8bbb2fc94acf1e121d12ca58edc838c587d7f6a07ce833`. The receipt precedes frozen 07:42:41 and stored 07:42:42 UTC deadlines. Two exact canonical/indexed project/marketplace facts plus one native payment activity match the RPC reports. B native balance 18→10 accounts for 5 payment + 3 actual fee; A 1,174→1,173/B 26→27 and native marketplace/seller proceeds 0→5, without changing prior allocated rewards/reserves/USDT. Admin INDEXED UI supports the independent receipt checks; it is not their substitute. Cancellation/full exit/future funding/actual reward claims/proceeds withdrawal remain open.


## Historical 19 October 2026, 07:11 UTC — checkpoint — 21 real transactions; display criteria complete

At **06:24:08.485 UTC**, `uat-additional-external-transfer-independent-20261019.json` passed **58/58** checks for the [direct A→B transfer of 2](https://uat.scan.infraworld.org/tx/0xfd4ecf91328c774182b5749407ac51c94646688e4d8301b69aee8cdc29b8fbf7), block **7,347,821**, mined **17 October 18:52:38 UTC**. One canonical/indexed TransferSingle ID 1/quantity 2, zero application intents, exact pre/post state **A 1,176/B 24 → A 1,174/B 26**, supply 1,200/max 10,000/remaining 8,800. Native value 0, fee **3 reAED**. Allocated rewards remain **A 7.164 reAED + 1.09 USDT / B 0.036 reAED + 0.01 USDT**, zero claimed; reserves 7.2 reAED/1.1 USDT, primary proceeds 3.96 reAED/0.1 USDT and marketplace seller proceeds accrued 0.01 USDT are unchanged. This reconciles past user activity without an agent signature/provider request.

`uat-lifecycle-budget-20261019.json` records **21 real successful transactions = 17 INDEXED application intents + 4 external indexed transactions** (two bounded top-ups, two direct transfers). Two historical unsigned EXPIRED intents remain unspent. **98.16 reAED + 1.22 USDT accounted / 51.84 reAED + 0.78 USDT remaining**, 21/32 slots. The old 20-row EOD original is preserved. Listing #1's **17 October 14:00 UTC** expiry has passed; never reuse old review payloads. Native listing #2's **2-at-5-reAED** offer requires fresh specific buyer approval and independent remaining-sequence review.

| Protected read-only proof | UTF-8 bytes | SHA-256 |
| --- | ---: | --- |
| `uat-additional-external-transfer-independent-20261019.json` | 3,661 | `004306cd34f0ffa6a69098b4b7c36c152cd6dee06d09e58d9f57149965aabc26` |
| `uat-lifecycle-budget-20261019.json` | 14,666 | `b84375f31f1e36a9c532eb9c38bb5d618eb8164dc05a4f44bbe16a4046008e5a` |

### Actual admin and media runtime; real-job acceptance pending

The admin-only rollout completed **06:49:54.213 UTC**, independently observed **06:50:27.306 UTC** in `fp-admin-deployed-20261019.json` (875 bytes; SHA-256 `9340c5433975b0a45a7fa5e7c80dcd0ccfa466eb6c7752c3040607e3431d76ac`). Running source is [51788d0](https://github.com/reIDentity/ReSystem-Investment-admin/commit/51788d0fee976e8a823c9fb4a8e77003e4ee494d), immutable image `sha256:4e54e92408885f03cb5e23b7665714be1c1c17fe95ffe5fae0c62367f11ba0b5`. Its [CI39035276976](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39035276976) is separately successful. Only admin was recreated; all other containers/environment, API/worker **65393fc**, indexer **2232e9a**, **gate false**, 17 INDEXED / 2 unsigned EXPIRED / pending 0 were preserved. No signing/broadcast, financial or database mutation occurred. Builder stopped. `admin-indexed-detail-live-20261019.json` records the actual already-settled B fill detail showing INDEXED and its transaction hash; it does not test a new state transition.

The first durable-media deployment **safely rolled back before migration-marker authorization**. Independent `fp-media-refusal-observe-20261019.json` confirms old API/worker 653, admin 517 preserved, gate false, five migrations and MediaJob absent. A created-to-running inspection race was identified; reviewed helper 82b086 passed 21 focused startup and 16 header regressions and retries only the existing verified images. Failed journals remain preserved. A passing build/helper is not an applied migration or live media acceptance; actual retry result is still pending at that preparation checkpoint.

The second attempt **applied migration 004 successfully**, preserved prior records, then rolled API/worker back because the readiness checker expected an unwrapped 503 instead of the actual SafeErrors envelope. Independent `fp-media-startup-observe-20261019.json` at **07:05:07 UTC** confirms **six finished migrations/MediaJob present**, old 653 API/worker health 200/gate false and admin 517/indexer 223 unchanged. No uploads or media jobs have run. The next reviewed operation must parse the exact envelope and resume the applied schema with **no migration DML**; actual media runtime/recovery acceptance remains pending. The first attempt's five-migration observation above is dated history, not the current schema.

The reviewed resume journal `media-rollout19-20261019T071058Z-3898822.json` subsequently reached **rollout_complete** with actual API/worker source **62b9f9c**. Applied migration 004 was retained with **no migration DML in the resume**. The journal verifies health 200 and readiness 503 solely from the submission gate remaining false; 17 INDEXED + 2 historical unsigned EXPIRED app intents / 21 canonical transaction history, the 3-second scheduler, zero queued/retained/failed jobs, core/source-prefix preservation and other containers/environment unchanged. This supersedes the preceding old-653 rollback runtime, without erasing that attempt. Independent `fp-media-running-observe-20261019.json` at **07:11:45.966 UTC** confirms actual source **62b9f9c4af478a6d2ef4b8dc47b1c582bf1db9ac**, API/worker image **sha256:179ce9212d462b6c22cbe60ada7e1438cd44c1b1fbda3108a888219f0d231077**, both running with zero restarts/OOM/startup errors. Admin 517/indexer 223 are preserved. Health is 200; readiness is the expected SafeErrors-wrapped 503 solely because the submission gate remains false, with database/Redis/chain/indexer checks ready. Six migrations are finished and MediaJob exists. Exact proof: 1,778 UTF-8 bytes, SHA-256 `03ce41f08862ace48abc0d483f55e673bb25bb5ac1cd79f3b6f14fe0666853b3`. Actual normal/queued upload, worker restart/retry and metadata recovery remain unperformed: Chrome extension local file-URL access blocked selection before submission; no upload/job exists. **RSI-015 remains In progress**. Startup with zero jobs is not durable-job acceptance and the browser permission must not be bypassed.

### Native archives recovered and new proof preserved

All **11** pending EOD originals are recovered in existing private Notion records: five exact f729431 Markdown originals, partial fill/20-row ledger/gate/local cleanup/CI JSONs and consumed handoff. Complete native-download bytes match; Startup refs 10→12, Status 25→28, Security 14→15, Backend 67→72 retain all history/parents/access. `notion-end-of-day-archive-recovered-20261019.json` records exact IDs/hashes/readbacks; the pending manifest is resolved with original reason/list preserved. Short-lived upload-header configurations were protected/deleted. No raw authenticated body, token, factor or wallet key was uploaded.

New display evidence preserves Status **28→38**: nine exact text JSONs and one ZIP with **15 valid full-page JPGs plus the manifest**, including the stable Product 390 image/paired DOM. The older unstable Product capture is excluded. All nine text native downloads match source bytes; the ZIP's native signed download returned 200, exactly **1,408,364 bytes**, SHA-256 `2472caece3c5cad2815c7edb68ba60dcb80b81bc86b6094b8796b10d8f53135b`. New 21-row ledger/58-check proof preserve Backend **72→74**, likewise native byte/hash matched. Archived account/financial display evidence remains within the existing private project, not Git/public sharing.

### Original RSI-080/082 acceptance completed with distinct evidence layers

**RSI-080:** public project/supply/revenue/quantity-1 reAED+USDT quote endpoints returned 200. Actual Product desktop DOM (2560×689, 06:31:40 UTC), stable phone DOM (390×844/client 375, 06:43:42 UTC) and later stable full-page image match total 10 USDT, max 10,000/issued 1,200/remaining 8,800, price 0.001 USDT/0.0036 reAED, holding 1,174, exact contract/metadata/image CIDs and funding rows **1.1 USDT + 3.6 reAED + 3.6 reAED**. Loaded image is natural 1600×1000; no PDF published is explicit. Unknown history/forecasts remain unavailable. Earlier 390→488 capture geometry was inconclusive and excluded; no product UI correction was made.

**RSI-082:** actual live Home desktop and 390×844 phone shows **1,174 shares/$3.08 available/$0 paid/$1,037.86 wallet/unknown invested cost**. Claims reconcile as 7.164 reAED ÷ 3.6 + 1.09 USDT = 3.08 USDT; zero claimed remains distinct from missing cost/history. Displayed wallet follows 136.687655 reAED and 999.9 USDT with current exact/truncated display semantics. This is a dated display-to-record comparison, not a newly invented same-block audit of every wallet field.

Separately, the unchanged-source local fixture harness uses real React/Next Link/Image, current Home/InvestorShell/Logo/CSS and manifest-pinned local fonts with synthetic resources. Actual browser DOM measured **13 states at 390×844 and 1440×1000**, document widths 375/1425; six full-page states per width were reviewed. Missing/loading/indexer 503/stale errors stay unknown, not zero, and disable financial action; verified empty data may show zero. Static controls are inert and production auth/API/transaction modules are not loaded. Error→recovered pages are separate SSR renders, **not a hydrated Retry click, actual API/provider recovery or claim**.

**14 new rendered-output tests / 42 total local tests**, lint, Python syntax, source/font/34-asset pins and full-history redacted secret scan (0 findings) passed. The four test/preview files are published as [8812c2c](https://github.com/reIDentity/ReSystem-Investment-front-end/commit/8812c2cdea755926201562ef524310a71ad312b2); coordinator authenticated observation confirmed exact-head [CI39212295109 SUCCESS](https://github.com/reIDentity/ReSystem-Investment-front-end/actions/runs/39212295109). No production route/auth bypass/dependency/UI markup/copy/CSS/font changed. Parent-owned preview servers are stopped.

Both original RSI-080/082 criteria are checked and tasks Done in Notion with real source/CI links and preserved original requirements/dependencies/history. Existing implementation 3d4a706, baseline 8688528, funding-label 27d0dde and image-binding 6b33f50 remain published source evidence. This does not identify Vercel's runtime SHA or close full Figma/accessibility RSI-093, transaction negatives RSI-047 or financial lifecycle RSI-096. RSI-047/088/089/096 remain In progress. Keep gate false pending a separately authorized window and a fresh cap/32-action replan; cancellation/full exit/future funding/actual claims/proceeds/propagation/negative variants and actual media job/recovery acceptance remain open.

## Historical end-of-day checkpoint — 13:08:53 UTC; gate closed, local dev stopped

The user ended the day after the first USDT partial resale. The final protected
ledger has **20 successful real transactions = 17 INDEXED application intents +
3 external canonical/indexed transactions** (two specifically authorized top-ups
and one direct investor transfer). Two historical unsigned EXPIRED intents are
unspent history. Accounted spend is **95.16 reAED + 1.22 USDT**, leaving
**54.84 reAED + 0.78 USDT** under the approved 150 reAED + 2 USDT cap; 20/32
planned slots are used. The earlier 17/19-transaction checkpoints remain history.

### Final positive receipts and exact-block evidence

- **Direct external transfer:** [0x1619…524c](https://uat.scan.infraworld.org/tx/0x16195ac4690bfd3751cf20ebde492c36c4dca158fed92f776e08b591b9bd524c),
  block 7,336,490, mined 12:34:56 UTC, passed **58/58** independent checks at
  12:57:17.974 UTC. A/B moved 1,188/12 → 1,186/14 via one canonical/indexed
  TransferSingle ID 1/quantity 2; **zero app intents** exist for the hash. Fee
  3 reAED; supply/reserves/proceeds and old allocations unchanged.
- **B's exact marketplace allowance:** [0xb1f8…4485](https://uat.scan.infraworld.org/tx/0xb1f8e2abeb76abda9713a71dfac35dd0523e2e831f21bcdb5671b03fe9a34485),
  block 7,336,817, independently **72/72** verified at 12:53:15.141 UTC,
  INDEXED, 10,000 atomic units = 0.01 USDT to the registered marketplace only.
  Approval fee 3 reAED; no token/fraction movement at its exact receipt block.
  Preserve original v1 **68/70**: only stale HEAD assumptions `a1188`/`b12`
  failed after the separate direct transfer. V2 uses receipt-block-1→block
  unchanged-state invariants and separately records observed A 1,186/B 14.
- **First partial USDT fill:** [0xd7a7…4101](https://uat.scan.infraworld.org/tx/0xd7a7c7e71bb5acc1390ebf97143a1a1c909f3a5a962fb81e073b2b8ea69e4101),
  block **7,337,161**, mined **12:57:18 UTC**, independently **83/83** verified
  at **13:01:14.413 UTC**, INDEXED. B bought **10** from listing #1 at 0.001
  USDT each, exactly **0.01 USDT**, native value zero and fee **3 reAED**.
  Canonical receipt, two indexed contract facts and one indexed payment activity
  reconcile with exact receipt-block state.

After the fill, **A 1,176/B 24, supply 1,200/max 10,000/remaining 8,800**;
listing #1 remaining **990**, native listing #2 still quantity 2/price 5 reAED.
B USDT balance and allowance are **zero**, native balance **18 reAED**. Seller
USDT proceeds accrued **0.01 USDT** in the marketplace; no proceeds withdrawal
has occurred. Earlier allocated rewards remain **A 7.164 reAED + 1.09 USDT /
B 0.036 reAED + 0.01 USDT**, with zero claimed. Project reward reserves remain
7.2 reAED/1.1 USDT, separate from primary proceeds 3.96 reAED/0.1 USDT and
marketplace seller proceeds. Supply did not change in a resale.

### Verified shutdown boundary

At **13:08:53.778773 UTC**, protected proof
`uat-end-of-day-gate-closed-20261017.json` verifies **gate false** after normal
API/worker restart on the **same 65393fc images and unchanged limits**:
17 INDEXED app intents + 2 historical unsigned EXPIRED, **zero unsettled and
zero uncertain-provider actions**. Only API/worker were recreated; 18 other
container identities, other protected environment files and intent history were
preserved. API health 200, owned remote builder stopped. Closure itself made no
signature, broadcast or database write.

At **13:07:26.954606 UTC**, `local-server-end-of-day-inspection-20261017.json`
found **no reSystem investment local dev server**. No local process needed to be
stopped by that inspection; unrelated applications/services and an unproven-owner
pre-existing receiver were preserved. This is project-scoped cleanup evidence,
not a claim that all unrelated local services were stopped.

Running sources remain **admin ba508f2 / image c97a281c…3629a14**,
**API/worker 65393fc**, **indexer 2232e9a**. Admin refresh fix
[51788d0](https://github.com/reIDentity/ReSystem-Investment-admin/commit/51788d0fee976e8a823c9fb4a8e77003e4ee494d)
is published, with 113 local tests/lint/types/build/secret scan passed and
coordinator-observed [CI 39035276976 SUCCESS](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39035276976),
but **not deployed**. Earlier investor docs
[47422f3 CI 39034388942 SUCCESS](https://github.com/reIDentity/ReSystem-Investment-front-end/actions/runs/39034388942)
was separately observed through authenticated GitHub. That does not assert the
Vercel runtime SHA or the CI result of this later documentation revision.
Backend media 62b9f9c/migration remain unapplied. Investor UI is unchanged.

### Exact protected originals and remaining work

| Protected filename | UTF-8 bytes | SHA-256 |
| --- | ---: | --- |
| `uat-b-usdt-partial-fill-independent-20261017.json` | 6,546 | `acf67133a9c91ae1f71d013286f7af1de45db2a6a375fcedd811a80d581fb962` |
| `uat-lifecycle-budget-20261017.json` — final 20-row snapshot | 13,693 | `d197ae56f87531ea00ffe970962130da8862624dbe0d85381edbc588fe385fac` |
| `uat-end-of-day-gate-closed-20261017.json` | 716 | `207484f3a2859feb2ccea91c2fd140018f581250c815c48474325054812f55d0` |
| `local-server-end-of-day-inspection-20261017.json` | 3,784 | `505363353def0fd65288a17a154762756d939a79936dfc4762543e1bb362f735` |

Keep these originals and the prior 19-row/v1/v2/direct-transfer proofs on the
existing private Backend Documents record, using native byte verification and
preserving earlier attachments/parents/access. No private intent identifier,
credential, factor, wallet material, cookie or raw authenticated body is copied
into general Git docs. Original RSI-047/096 criteria stay open as appropriate;
positive partial-fill evidence is not a broad task-completion claim.

**Tomorrow:** resume only after fresh user direction and a canonical read of
balances, listings, allowances, intents, provider/chain state and remaining cap.
Replan the remaining actions within **32 total**; do not automatically reuse
older full-exit quantities or cost projections. Listing #1 expires **17 October
2026 at 14:00 UTC**; its payloads/reviews must not be reused after expiry.
Native listing #2 **2 fractions at 5 reAED each** needs fresh specific buyer
approval. Cancellation, full exit, future deposits, actual claims, proceeds
withdrawal, notification/history/support propagation and rejected/reverted/
delayed recoverability variants remain unfinished. Bounded post-fix phone-image,
controlled empty/indexing-delay and durable-media rollout acceptance remain
open. Keep the gate closed, do not sign/deploy/resume finance automatically, and
preserve the approved investor UI. Older checkpoints below remain dated history.

## Historical checkpoint — 12:46 UTC admin deployed; unsigned review pending

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

## 19 October 2026, 08:15 UTC — implementation first; financial testing paused

The user asked to finish the remaining functionality before one complete test and bug-fix round. No new wallet approvals are being requested. The temporary reID request window, opened under today's explicit authorization, was closed at **08:12:10 UTC** and independently checked at **08:13:11 UTC**: gate **false**, API/worker source **62b9f9c** and identical images/resource limits, other services and environment preserved. API liveness is 200; readiness is the expected 503 solely because submission is disabled. No database mutation, provider request or signing occurred during closure.

A cancellation already submitted through the bound reID flow was reconciled read-only: [listing #2 cancellation](https://uat.scan.infraworld.org/tx/0x33e7dff4ff153e1029dae6bbcbd2e3a9021e857b77832e791832b8d3a11d3a64), block **7,414,780**, success/indexed, native value **0**, actual fee **3 reAED**. Independent exact-block checks confirm cancelled=true, remaining=1, available=0; holdings **A 1,173/B 27**, supply **1,200**, allocated/claimed rewards, reserves and proceeds are unchanged. This was an already-submitted external action, not a new coordinator approval request after the priority change. The new immutable ledger contains **23 verified transactions**, **109.16 reAED + 1.22 USDT accounted / 40.84 reAED + 0.78 USDT remaining**, **9 of 32 slots left**; earlier ledgers are preserved. Full exit, future revenue, reward claims, proceeds withdrawal and the remaining negative/propagation checks are deferred to the later test round.

Genuine functionality gaps are now the priority: bounded complete portfolio reads and report pagination, private support attachments, safe recipient-specific send maximum, session/intent expiry handling and independent operational monitoring. Local implementation/checks are separate from publication, deployment and final acceptance. The investor UI remains fixed. The human explicitly approved **only** small paperclip buttons beside support message boxes and file links inside messages in both apps; support attachments stay private and never use public IPFS. Restoring the original Max control undoes an integration regression and must preserve its approved placement.

Protected evidence: `.runtime/uat-window-close-result-20261019.json`, `.runtime/uat-window-close-independent-20261019.json`, `.runtime/uat-native-cancel-canonical-20261019.json`, `.runtime/uat-lifecycle-budget-after-cancellation-20261019.json` (SHA-256 `0f701fa5cd8db3f379324a8c658bea7f1ef757b290017b7a3a1e1da2ae406e1a`). Gate-close journal: `/home/resystem/reSystem/runtime/reid-uat-close-indexed-cancel19-20261019T081210Z-3964891.json`. Exact 19 INDEXED + 2 historical unsigned EXPIRED intents were required before and after closure; there were no pending financial/media/mail actions. The cancellation proof passed every canonical/source/exact-block check and made no state changes. Credential material is excluded.


## 19 October 2026 — functionality candidate passed combined local checks

The implementation-first candidate now includes complete bounded portfolio reads, exact weighted-average acquisition costs, complete-source wallet cashflow, project revenue/per-share series, canonical counterparty/holder notifications and private revenue-allocation activity. Per-share revenue uses each funding event's issued supply and the contract's actual 10^27 scale; it is not multiplied by current holdings to invent historical personal income. Unknown gifts, missing history and unsupported market valuation stay unavailable. All new indexed-address lookups accept valid checksum capitalization.

Private support images remain authenticated and AES-GCM encrypted, never public IPFS: 3 MiB file limit, 4 MiB investor multipart envelope, per-account/global admission limits, a 30-second absolute receive deadline, replay-safe message-bound retries, and encrypted payload erasure on removal. The only new visible controls are the human-approved paperclip and file links. The original recipient-specific Max control is restored in its existing Amount slot. Existing layouts, stylesheets, imagery and brand tokens are unchanged. Expired or unverified pre-broadcast approvals and stale status responses cannot open a provider approval link; the same durable intent remains refreshable and already-broadcast receipts remain visible.

Local verification passed **66 backend unit + 163 backend integration tests**, **80 investor + 119 admin tests**, both frontend lint/TypeScript/production builds, **40 FP packaging + 11 CI-helper tests**, and standalone generated-client compilation. Synthetic desktop/390px checks show no horizontal overflow; they are labelled synthetic, not actual hosted acceptance. A first combined run found one non-isolated monitoring test contaminated by earlier fixtures; its private-schema isolation was repaired and the complete run passed. Protected final backend proof is `.runtime/feature_checks_20261019131909/checks.log`; frontend review manifest is `/private/tmp/resystem-frontend-final-review-20261019.json`.

The independently versioned API schema pin is **e92521873337e09f175216ea95d210c2460246d70f2b8286d3c1aa88524f4fb2** in all three consumers. Backend local feature commit **087fb5b** and admin local feature commit **f54392a** await exact public-value scan reconciliation, publication and hosted CI. Indexer [7e5068a](https://github.com/reIDentity/ReSystem-Investment-indexer/commit/7e5068a08cfdfb79699da8f0bebbc1984c75c0b1) is published and [CI39228979768 passed](https://github.com/reIDentity/ReSystem-Investment-indexer/actions/runs/39228979768); its new lookup-index migration is **not deployed**. Actual FP remains API/worker62b9f9c, admin51788d0 and indexer2232e9a until a separately verified rollout. New support005/account-notification006 and indexer004 migrations are additive and still pending. The independent watchdog's fixed proxy probes and standalone delivery/state checks are implemented; scheduled runtime and independent-host/server-loss coverage remain separate evidence.

Financial UAT stays paused with the submission gate **false**. The last verified ledger remains **23 transactions / 109.16 reAED + 1.22 USDT accounted / 40.84 reAED + 0.78 USDT and 9 slots remaining**. No new wallet approval, signing, transfer, allowance or financial submission occurred during implementation. Remaining lifecycle and negative acceptance tasks remain In progress, preserving original criteria. Continue source publication, bounded FP rollout and private Notion evidence before the later combined test round.

