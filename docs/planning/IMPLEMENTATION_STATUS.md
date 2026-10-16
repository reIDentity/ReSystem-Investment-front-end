# Implementation and recovery status — 16 October 2026

This is the continuation record for the approved platform. Source publication, runtime readiness and full financial acceptance are separate. Read the live private Notion board and current user request before acting; preserve concurrent work and existing services.

## Published source

| Repository | Reviewed published commit | Evidence |
| --- | --- | --- |
| Investor | [0ebcef1](https://github.com/reIDentity/ReSystem-Investment-front-end/commit/0ebcef150c8eeb43a04972178dd98fb72abcc326) (real integration 3d4a706) | 22 integration/unit tests, typecheck; prior full lint/build and five anonymous HTTPS boundary checks; requested Figma strip/text correction passed scoped lint/typecheck and desktop/390 px visual checks |
| Admin | [9eba445](https://github.com/reIDentity/ReSystem-Investment-admin/commit/9eba445b099b23a24c36c2ff5412f0dd3fb1c21c) | 29 tests, typecheck, lint, production build and 390 px accessibility; bounded single-worker build; real FP HTTPS password/MFA dashboard verified |
| Backend | [fb92bb4](https://github.com/reIDentity/ReSystem-Investment-backend/commit/fb92bb44cdd088578c3e7532e15096034ceb45fb), runtime source bc98f7f | 7 unit and 16 PostgreSQL/Redis integration tests; hosted backend-checks #9 passed; frozen review; reID submit remains disabled; measured runtime/builder package |
| Indexer | [8bd7acb](https://github.com/reIDentity/ReSystem-Investment-indexer/commit/8bd7acb0f8c279a3c90f462a7a0ee3a4be2e91f8) | 43 unit and 4 PostgreSQL tests; prior receipt-adapter indexer-checks #3 passed; all four deployed hashes/factory binding checked; canonical-receipt-backed INFRA creation trace adapter |
| Contracts | [41513e5](https://github.com/reIDentity/ReSystem-Investment-contracts/commit/41513e5), core source 1eee144 | 39 tests, exact reference-model invariants/fuzzing, extended 512x256 runs, Slither zero High, versioned artifact checks and actual UAT receipt/hash verification |

API v0.1.0 SHA256: `484aa0635357fea37de78b6c32607c0b680c5c355b5d06fa0216e925204e36c2`. Both frontends pin generated snapshots. Do not take a moving branch or import a sibling service at runtime.

## Actual INFRA UAT deployment

Chain ID 15324; native reAED (18 decimals); verified USDT (6 decimals) at `0x576bb1a9fcb1115c3df5f66ac8d12245fd7dadcf`. Actual public manifest and deployment record are in the contracts repository: `artifacts/v1/deployment.15324.json`, `docs/DEPLOYMENT_UAT.md`.

- Factory: `0x2dbd7500cc9899c9a5bba6c96f09c086502c5661`, block 7287836.
- Project implementation: `0x67dce4b528ebce9cccda642de68d0d2e8fef901e`.
- Marketplace: `0xa17fad71e866c2bab2b327aeb4288f741ced90a1`, block 7287970.
- Claim router: `0x49741524e3e35f9aae1bccaa4132300ef95a91a8`, block 7287974.
- Initial factory/market owner: authorized UAT deployer `0xCFc93FB43F17F99EaCa411be595B727501987E95`. No staff login automatically has on-chain authority.

At head 7288598 all three creation receipts were successful, canonical block hashes/runtime hashes matched, and confirmation counts 763/629/625 exceeded the configured depth 12. Factory/implementation linkage and all four hashes were independently verified. Source verification, complete project lifecycle and production governance remain open.

No project, investor purchase, principal or revenue deposit was created. The first Foundry transaction actually mined despite a receipt-waiter failure; remaining base deployments reconciled nonces and recorded hashes before broadcast. Do not rerun base deployment or blindly retry a broadcast. Protected local deployment journals exist under the main container's `.runtime`, outside Git.

## FP hosting — observed deployment and recovery

Exact node: `footprint.frontend`; permitted SSH login `resystem`, verified sudo path. The user-selected canonical hostname is now `admin.resystem.org` (DNS A 172.93.109.145 verified). Its TLS/origin migration is underway. The following completed checks initially used the temporary `resyste.isuru.dev` hostname. The scoped Nginx TLS vhost is installed, configuration-tested and reloaded without replacing other sites. Strict public HTTPS `/sign-in` returns 200 with HSTS, noindex, CSP frame-ancestors none and X-Frame-Options DENY. ACME certificate expires 14 January 2027.

All new source/runtime files are under `/home/resystem/reSystem`:

- `workspaces/`: four committed-source checkouts with approved remotes; no runtime secrets in source bundles.
- `ops/deploy/fp/`: final resource-bounded package, latest source pin fb92bb4. Older preliminary `ops/fp` exists and must not be used.
- `runtime/`: protected 0700 directory,0600 env/log/recovery files, verified public deployment manifest 0644. Actual credential values are excluded here.
- `runtime/admin-bounded-build.log` and `runtime/indexer-build-e3c6d42.log`: protected build evidence; do not expose raw logs or expanded Compose environment.

FP became SSH/HTTP-unresponsive during the initial admin build. After the user reported recovery, measured uptime indicated a reboot; this coordinator did not reboot the server. Cause remains unverified and no OOM claim is made. Recovered capacity:12 CPU,47040 MiB RAM, about43 GiB available,317GiBdisk free. Existing explorer, Fractionaire, host Node/Mongo/Redis and other Nginx sites were preserved.

Actual isolated runtime is Compose project `resystem-investment`: admin 9eba445 at 127.0.0.1:3304; API/worker bc98f7f at 127.0.0.1:3305; private PostgreSQL 16/Redis 7 with no host ports; indexer e3c6d42 on container-private 4101. Images are built from exact Git archives with revision labels, not dirty working directories. Indexer was rebuilt and started only after fixing two observed issues: an empty optional fallback URL parser crash, then INFRA's UNKNOWN root-creation trace. Canonical receipt, transaction/block identity, sender/value and created-address proof remain mandatory. Malformed, nested UNKNOWN or inconsistent traces still reject; no blocks or cursor history were skipped/reset. After starting e3c6d42, liveness was healthy but readiness still returned503 INGESTION_FAILED and platform cursor/blocks/events remained empty at observed head 7290814. The sanitized read-only diagnostic identified a second nested explicit-zero UNKNOWN leaf. Published 8bd7acb now allows only successful-receipt-proved valid-identity explicit-zero leaves with no children/error, emits no transfer and infers no opcode; positive/unknown value, missing proof/value/identity or UNKNOWN subtrees still reject. All43 unit and 4 PostgreSQL regressions passed. New image rollout/cursor evidence remains pending; no Vercel platform activation or financial readiness claim is authorized by process liveness.

The dedicated `resystem-bounded` Buildx docker-container builder was configured with 4 GiB RAM, equal swap limit,512 PIDs and one BuildKit worker. Admin build used 3 CPU with a 1 GiB Node heap and single Next worker. The indexer rebuild used 0.5 CPU to fit alongside the live runtime and measured OS reserve; builder was stopped after the build. Runtime service budgets reserve 32768 MiB/6 CPU for the host: PostgreSQL 1 CPU/1024 MiB, Redis 0.25 CPU/256 MiB, API/worker/admin/indexer each 0.75 CPU/768 MiB, jobs 0.5 CPU/512 MiB each; app PID cap 256. Every service has equal memory/swap limits. The indexer actual kernel caps were verified 0.75 CPU/768 MiB/no swap/PIDs256. BuildKit moves its PID into a nested scope/init with unlimited leaf values; the enclosing Docker scope was verified to enforce4 GiB/no swap/0.5 CPU/PIDs512, OOM counter 0. Remaining service checks and workload bounds still require operating acceptance.

Explicit backend/indexer migrations and grants completed with AUTO_MIGRATE=false. Target privilege checks verified: application roles cannot CREATE; backend cannot update audit or chain facts; indexer cannot read private User; indexer projection update and backup-reader SELECT are allowed. API process health returns 200. Its readiness response remains a separate multi-dependency financial gate, including indexer lag and explicitly disabled reID transaction submission.

Initial staff activation succeeded only after confirming the user table was empty. The real HTTPS password/TOTP login reached the dashboard with actual empty projects/intents and live INFRA head; no signer was connected. Bootstrap username/password/TOTP values were archived privately before activation, then removed from the one-shot bootstrap input. Do not regenerate or overwrite the active account. Keep screenshots containing internal staff UUIDs outside Git/general documents.

Encrypted backup `investment-20261016T105351Z.dump.age` (57054 bytes) streamed from the read-only backup role directly into age. It restored successfully into NEW disposable database `restore_uat_20261016_105352`; User, Role, Membership, AuditEntry, Project, TransactionIntent, indexer_schema_migrations and indexer_cursors row counts matched. Live investment was preserved; no plaintext dump touched disk. This proves one rehearsal, not a scheduled/off-host recovery service. Scheduled retention, external recovery-key custody, full constraint/privilege restoration and controlled restart durability still require explicit evidence. The protected recovery identity has verified private archives; review duplicates before cleanup, never delete the only copy.

## GitHub Actions correction

All seven old backend runs failed before checkout because the PostgreSQL health command used single-quote grouping; the Actions service parser passed `-U` to Docker. Commit [80aafe8](https://github.com/reIDentity/ReSystem-Investment-backend/commit/80aafe89d22cb1a0a4faacac0b681d41969493bd) changes only that command's quoting. No tests, audit or database checks were disabled. Actual [run #8](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/38888547917) and latest package [run #9](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/38891541494) passed. The receipt adapter's [indexer run #3](https://github.com/reIDentity/ReSystem-Investment-indexer/actions/runs/38890730158) also passed. Historical failed runs remain historical evidence.

## reID provider safety gate

Existing UAT client `reid_451935944a76413bbcbd2a4283098350` remains approved/active; existing localhost:3002 and Vercel callbacks/secret are preserved. The initial temporary admin callback was replaced at 11:17:50 UTC with exact `https://admin.resystem.org/api/platform/auth/reid/callback`; conditional update matched 1/modified 1 and changed redirect_uris only, with client-secret digest, status and scopes preserved. `wallet:tx` remains allowed; no user consent grant or wallet action was performed. Client-secret authentication passed an intentionally invalid-code check without issuing a token.

Provider review found duplicate approval and same-client cross-user status issues. The narrow fix is published in the verified private provider repository on `fix/resystem-uat-approval-safety`, commit [384ae548](https://github.com/reIDentity/backend_Re-ID/commit/384ae548abffde524d16f81c0ca102f1dd92f2ba). Local full suite 115 passed, including six isolated-Mongo race/isolation regressions. Linux 115 tests passed, including isolated Mongo CAS/isolation regressions. At10:38:19 UTC the exact clean 384ae548 source/binary replaced only PM2 gato ID2 after zero-in-flight guards; rollback binary/ref were preserved. Env hash was unchanged. Actual /proc executable SHA256 is 3f5568e3d873dc3909e77897c7e9c4475e32ae448249b143a8ef5ded1ded9c6d. Health/JWKS/discovery/status boundaries, callbacks and preserved client authentication were verified afterward. Provider deployment evidence is b306d85a62c43ab24c1dc33e9eb9a4e439030573; callback-only migration evidence is [81b1976](https://github.com/reIDentity/backend_Re-ID/commit/81b197618df832ba308d718c25b9eb26df07be7e). Read that repository's `docs/OAUTH_TRANSACTION_HARDENING.md` and current evidence before relying on it. This narrow UAT provider deployment is observed; it does not establish consent or a completed financial workflow.

Backend `REID_TRANSACTION_SUBMIT_ENABLED=false` rejects before provider-token access or intent mutation. Keep it off until the provider replacement is verified and explicit user consent/UAT approval is ready. Login, read access and externally approved MetaMask broadcast are separate capabilities. Pending/uncertain intents must never be reopened or blindly rebroadcast.

## Investor Vercel account — operator action remains

The connected Vercel account does not own the existing investor project. Do not configure another project/account. After the remaining FP readiness check, the user should set these server-only values in the correct investor Vercel project and redeploy reviewed `dev`:

```dotenv
PLATFORM_API_BASE=https://admin.resystem.org/v1
PLATFORM_APP_ORIGIN=https://re-system-investment-front-end.vercel.app
REID_APP_URL=https://app.reidentity.net
```

Do not prefix them or any credential with NEXT_PUBLIC_. The backend owns OAuth secrets/tokens. Preserve the registered investor callback `https://re-system-investment-front-end.vercel.app/api/auth/reid/callback`. Do not enable the new BFF against an unverified/offline FP target. Real investor sign-in, fresh wallet:tx consent and each exact transaction approval require the user's browser/wallet interaction.

## Remaining acceptance and continuation

Full multi-wallet buy/rebuy/10-of-1,000 transfer/resale/two-asset funding/historical claim lifecycle is unperformed. Protected support attachments and safe send-Max remain explicitly unavailable. Internal history block 7121280 cannot currently be traced (-32603), so that source is honestly partial; direct native and fixed-USDT history remain independently verified/retriable. Independent audit, actual alerts, operating bounds and production approval/rotation remain open.

Private Notion is authoritative for working task status and actual completion evidence. The original tasks.json is a stable planning snapshot. Versioned repository documents and provider evidence are archived with verified attachment hashes in five grouped records; mapping is `implementation-document-archive.json`. The dedicated security page tracks controls and open findings. Main plan/handoff/security revisions must also be archived and linked after this update. Do not mark code publication or a written runbook as successful runtime/financial acceptance.

## Landing page correction — user request

Published investor commit 0ebcef150c8eeb43a04972178dd98fb72abcc326 restores Figma node 20:10105: 12 / $96.4k /51% /$2,000 /0 days and the original labels. The desktop panel was measured 1352x100 px, background #424242, radius 16 px,28 px IBM Plex Sans values and 14 px labels. Existing count-up/reveal and blue hover treatment remain;390 px testing showed a readable two-column layout with no horizontal overflow. The user-requested illustration paragraph above the ecosystem was removed and its absence checked in the rendered DOM. Scoped ESLint, TypeScript and diff checks passed. These are authored landing visuals; this change does not alter API-driven investor balances or transaction workflows.
