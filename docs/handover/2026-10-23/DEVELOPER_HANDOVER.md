# reSystem Investment | Developer handover

Version 1.0 | 23 October 2026 | CLIENT-UAT-2026-10-23

Audience: incoming developers and authorized platform operators. Internal engineering document. This guide contains no credentials. The companion API folder contains the canonical OpenAPI snapshot, a Postman collection, a blank environment template and a reproducible generator.

## 1. Start here

reSystem lets investors buy whole fractions of a project, receive ERC-1155 balances, transfer or resell those fractions, and claim rewards backed by actual revenue deposits. The admin application manages projects, reporting, support and authorized contract operations. Investor transactions are approved in reID. Staff transactions use one isolated AWS KMS-backed wallet, with individual staff authorization and fresh authenticator approval.

The deployed environment is **INFRA testnet/UAT, chain 15324**. The stable client candidate is not a production release or an independent security certification. V1 is deployed. V2 code and its local tests do not upgrade existing contracts.

First-day checklist:

1. Obtain access to the five private GitHub repositories, the private Notion project and the appropriate UAT accounts. Request only the permissions your work needs.
2. Read investor `START_HERE.md`, `AGENTS.md`, `docs/planning/RE_SYSTEM_IMPLEMENTATION_PLAN.md`, `tasks.json` and `notion-tracker.json`. Read each repository's own instructions. The root directory is not a monorepo.
3. Use the release table below to distinguish checked-out source from deployed images. Preserve the client candidate while QA is running.
4. Import the API collection and begin with public read requests. Do not run the whole collection against UAT.
5. Build and test in an isolated local environment before proposing a change. Real reID/INFRA testing is a separate, explicitly authorized workflow.
6. Record acceptance, the actual GitHub commit and deployment evidence in the private tracker. A source push alone does not prove a successful release.

## 2. Applications and repository map

| Repository under `workspaces/` | Responsibility | Main entry points |
| --- | --- | --- |
| ReSystem-Investment-front-end | Public landing pages, investor app, reID/BFF integration | `src/app`, `src/components`, `src/lib`, `artifacts/platform` |
| ReSystem-Investment-admin | Staff login, project workflow, reports, shared-wallet approval UI | `src/app`, `src/components`, `src/lib/generated` |
| ReSystem-Investment-backend | NestJS REST API, authentication, business commands, worker, isolated signer | `src/controllers.ts`, `src/auth.ts`, `src/commands.ts`, `src/platform-signer.ts`, `src/signer`, `prisma` |
| ReSystem-Investment-contracts | Solidity factory, project fractions/rewards, marketplace, claim router | `src`, `test`, `artifacts/v1`, deployment manifests |
| ReSystem-Investment-indexer | Canonical chain ingestion, projections, reorg/reconciliation and wallet history | `src`, `tests`, `artifacts/v1` |

All repositories are in the `reIDentity` GitHub organization, using the names above, and have independent histories and `dev` branches. The separate reID provider checkout is an upstream integration, not a sixth platform component to merge into these repositories. Preserve unrelated existing changes there.

| Entry | URL |
| --- | --- |
| Public site | https://re-system-investment-front-end.vercel.app |
| Investor sign-in | https://re-system-investment-front-end.vercel.app/invest |
| Admin | https://admin.resystem.org |
| REST API | https://admin.resystem.org/v1 |
| Public health | https://admin.resystem.org/health |
| INFRA explorer | https://uat.scan.infraworld.org |

`/health` and `/ready` are outside `/v1`. There is no deployed GraphQL API. Browser applications use their own server-side BFF routes to forward to the fixed API origin; the collection targets the backend directly.

## 3. Architecture and trust boundaries

```text
Investor browser -> Vercel Next.js BFF -> FP NestJS API
       |                                    |
       +-> reID approval -> INFRA chain      +-> PostgreSQL + Redis
                                            +-> worker / mail / monitoring
Admin browser -> FP Next.js BFF ------------>+
                                            +-> private Unix socket
                                                 -> isolated FP signer -> AWS KMS
                                                 -> reviewed transaction -> INFRA
INFRA canonical blocks/receipts -> FP indexer -> PostgreSQL read projections
Public project media -> IPFS pinning; private support files -> encrypted storage
```

**FP hosts** the admin, API, worker, PostgreSQL, Redis, indexer and isolated signer. **Vercel hosts** the investor frontend and its BFF. The owner manages that Vercel account; do not assume a saved unrelated account has access. **AWS hosts key custody and access-control resources only**, in `eu-west-1`; there is no AWS-hosted application, database or API in this design.

The backend owns identity, permissions, drafts, messages, approvals and transaction intents. Contracts own settlement, token balances and on-chain liabilities. The indexer builds queryable views of confirmed chain facts. Neither the frontend nor a database edit may manufacture a confirmed purchase, balance or reward.

## 4. Stable release identities

Recorded candidate: `CLIENT-UAT-2026-10-23`; investor release tag: `client-uat-2026-10-23`.

| Component | Verified deployed application source |
| --- | --- |
| Investor application | `6274452876a44d3a13e40a502401f066ebd911fb` plus documentation-only release commits |
| API and worker | `8924944716f4e5bb960c9303b0b8362ee1e601ce` |
| Admin | `f954ad0e8f78f0c31e02205d6dca69c5558aa7bc` |
| Indexer | `6f3596836086b9177fb1c7e21a3e5052a51d80c0` |
| Isolated signer | `e950fd91f403b84ba7e68e7957b57a96843d3a41` |
| Deployed V1 artifact source | `1eee1442c83ee037ee1564d0d3da64d36c370e76` |

The later backend source `ae614a832411becaaa7e0e0c347d6965e80c9b0a` changes the local acceptance driver/documentation, not the deployed API. Indexer and contract repository HEADs also differ from deployed source. Always read the runtime receipt and public manifest before operating. Exact image digests and CI links are in `docs/testing/CLIENT_TEST_RELEASE_20261023.md` and `PLATFORM_AUDIT_20261023.md`.

The documentation package is maintained on a separate documentation branch. It does not change the running client candidate.

## 5. Identity, authorization and sessions

### Investor path

The investor signs in through the registered reID flow. The integration validates state/browser binding, PKCE and the returned wallet scope. Provider credentials remain server-side and encrypted where persisted. The session chooses the investor and wallet; callers cannot choose another account by supplying its ID in a request body.

Backend authentication uses the opaque `resystem_session` cookie. Session tokens are stored hashed. `GET /v1/auth/session` returns the current capability view and a `csrfToken`, and sets `resystem_csrf`. Mutations require both that cookie and matching `X-CSRF-Token`, plus an exact configured `Origin`. CSRF is required even for the unauthenticated staff-login bootstrap. Cookies, provider grants and token responses must never enter shared collections or logs.

The frontend has a separate reID/BFF session boundary. Do not treat an investor browser cookie from the Vercel hostname as a portable API credential. Use the actual browser sign-in flow for end-to-end investor testing or a designated isolated fixture for direct API tests.

### Staff path

Staff use individual usernames/passwords and MFA. First login can require enrollment: the human scans the displayed QR and enters a fresh authenticator code. Until MFA succeeds there is no ordinary privileged staff session. Password provisioning currently requires 16-256 characters. Passwords are Argon2id-hashed; enrolled factors are encrypted.

Roles contain permissions; memberships apply globally or to an exact project. Names such as “admin” do not grant authority. Current memberships, active user/session state and MFA are checked server-side. Reserved GLOBAL wildcard authority allows direct off-chain publication without an independent draft reviewer. Ordinary publishers still need an approved draft and an independent reviewer. The exception does not waive metadata, economic, chain, signer or transaction checks.

Relevant records: `User`, `Session`, `OAuthAttempt`, `ReidConnection`, `Role`, `Membership`, `StaffHandoff`, `StaffContact`. Staff invitation/recovery does not itself grant a signed-in session or new permissions. Use `docs/STAFF_HANDOFF.md` for operator recovery; do not reset factors with ad hoc SQL.

## 6. Shared admin wallet and AWS KMS

Shared UAT wallet: `0xc1ddc45cbc5f61793ab1eb1999136c4e27347531`. The approved cold treasury is a separate address; operational signing and receipt of primary proceeds are different responsibilities.

KMS uses an asymmetric `ECC_SECG_P256K1` signing key. The wallet private key is nonexportable. The isolated signer on FP authenticates through IAM Roles Anywhere using temporary credentials. Its local machine-identity key is not the blockchain wallet key. The pinned runtime role may call `kms:GetPublicKey` and `kms:Sign` only on the commissioned key. The API, worker and CI have no KMS credentials.

The signer independently decodes allowed calls, verifies targets/registered project implementations, current ownership, treasury policy, chain, amounts, fee limits and caps. It serializes nonce use and maintains a durable hash-chained journal. KMS signatures are normalized/recovered against the configured Ethereum address before use. An uncertain signature or broadcast requires reconciliation, not another blind signing attempt.

The current action allowlist is: publish project, open/close sale, set yield, update/freeze metadata, withdraw primary treasury, approve limited USDT allowance, fund revenue, accept project ownership and return project ownership. This is not arbitrary transaction signing. Existing UAT limits include 10 reAED or 1 USDT per funding/withdrawal call, plus daily/rate limits; inspect the installed policy before relying on any limit.

Staff need `signer.platform.use` and the current action/project permission. Each action requires an exact frozen review and fresh TOTP. A configured cosign policy can require a different approver. Enabling signing uses the two-step request/confirmation flow with distinct fresh codes. Personal staff MetaMask/reID signing is permanently disabled, including old bindings and legacy flags.

KMS protects key material; it does not understand application roles or amounts. Compromise of the authorized FP signing identity remains consequential. V1 has no forced cold-wallet recovery after malicious ownership changes. Do not present the KMS design as eliminating host compromise risk.

## 7. Contracts, money and NFT semantics

| Network item | UAT value |
| --- | --- |
| Chain ID | 15324 |
| Native currency | reAED, 18 decimals |
| USDT | `0x576bb1a9fcb1115c3df5f66ac8d12245fd7dadcf`, 6 decimals |
| Factory | `0x2dbd7500cc9899c9a5bba6c96f09c086502c5661` |
| Marketplace | `0xa17fad71e866c2bab2b327aeb4288f741ced90a1` |
| Claim router | `0x49741524e3e35f9aae1bccaa4132300ef95a91a8` |
| V1 implementation | `0x67dce4b528ebce9cccda642de68d0d2e8fef901e` |

The canonical deployment manifest also pins bytecode hashes, original source, deployment block and finality settings. Validate these through `artifacts/v1/deployment.15324.json` in the indexer and the backend's protected deployment manifest; a filename or matching chain ID is insufficient.

Let `N` be maximum fractions and `T` total project value in USDT atomic units. Whole-fraction price is exactly `T / N`; non-divisible values are rejected. Convert USDT atomic price to reAED atomic price with the fixed multiplier `3,600,000,000,000`. Use integer arithmetic/BigInt and decimal strings in APIs, never floating point for settlement. The platform conversion is 1 USDT = 3.6 reAED; this is not a promise about external redemption or exchange markets.

Example: 10 USDT = 10,000,000 USDT atomic units. For 10,000 fractions, one fraction costs 1,000 atomic USDT = 0.001 USDT = 0.0036 reAED. Ten fractions cost 0.01 USDT or 0.036 reAED, before network fees. These are the four landing projects' approved UAT sample valuations, not live commercial valuations.

Each project is an ERC-1155 collection with token ID 1. Buying 100 fractions mints quantity 100 of that ID. Transferring 20 moves the same ID's quantity: A has 80 and B has 20. It does not create a new collection or a unique token ID for B. A wallet may display one NFT card with a quantity.

Ownership share `held / N` differs from reward participation `held / issued supply`. Actual funded revenue is allocated to holders at deposit time, using the issued-supply denominator. Transfer corrections preserve already-earned claims after partial/full exit; later revenue belongs to then-current holders. Zero-holder funding is rejected. Primary proceeds, funded reward liabilities and marketplace seller proceeds have separate accounting. Treasury withdrawals must not drain reward reserves. Resale requires a buyer; listings do not guarantee liquidity.

## 8. Transaction lifecycle and safe retries

```text
Quote -> CREATED frozen intent -> approval request / fresh TOTP
      -> AWAITING_APPROVAL or AWAITING_SECOND_APPROVAL (where applicable)
      -> SUBMITTING -> BROADCAST -> CONFIRMED -> INDEXED
Alternative states: REJECTED, EXPIRED, FAILED, RECONCILIATION_REQUIRED
```

The state diagram summarizes both signer modes; some states are skipped on a particular path. Read the recorded intent rather than assuming an exact sequence of UI events.

`POST /v1/transactions` validates a typed command, session, current permissions, exact amount, balance/allowance, network bindings, simulation and fee reserve. A stable `Idempotency-Key` identifies the business attempt. Reusing the key with changed content is a conflict. Reviews expire; an expired unsigned review needs a fresh intent. Do not create a new intent merely because the response to submission was lost.

For investors, `/submit` requests a reID approval; the human approves or rejects in reID. For staff, `/platform-review` provides frozen details and `/platform-approve` consumes the human's fresh factor and acknowledged review; `/platform-cosign` applies only when required. Those endpoints can cause signing/broadcast. `/broadcast` is not a backdoor to personal staff signing.

The worker reconciles provider status, actual transaction/receipt identity and confirmed chain events. A confirmed receipt can precede indexed UI data. `RECONCILIATION_REQUIRED` preserves an uncertain or context-mismatched outcome for investigation. Resolve the existing hash/provider request first. Never clear a journal, fabricate an indexed state or rebroadcast an uncertain action automatically.

INFRA currently has a custom fixed fee, observed at 3 reAED per transaction. The signed gas limit does not cryptographically cap that custom charge. The HTTP fee source and fee-policy limitation remain documented in `docs/UAT_FEES.md`; read the fresh review and reserve sufficient native funds even for USDT actions.

## 9. Indexer and database ownership

The indexer reads canonical headers, receipts, contract events and supported wallet transfers from the pinned network. It advances durable checkpoints after atomic application and enforces the configured confirmation boundary (12 blocks in current UAT). Event identity and canonical hashes prevent duplicate/replayed application. Reorganizations and reconciliation failures must be handled against actual canonical evidence, not by skipping checkpoints.

PostgreSQL contains separate application and chain-projection responsibilities. Backend runtime grants permit intended application DML, not schema creation or rewriting canonical chain/audit history. Indexer grants do not expose private users. Migrations run with dedicated roles; backups use a read role. Redis holds bounded transient/session/challenge/job state; committed intents, outbox and media jobs remain durable in PostgreSQL.

Key application records: `Project` and immutable `ProjectRevision`; `Media`/`MediaJob`; `TransactionIntent`/`PlatformApproval`/`PlatformSignerSwitch`; `Ticket`/`TicketMessage`/`SupportAttachment`; notification/preferences/contact/outbox records; `AuditEntry`, `OperationalCheck`, `AuthThrottle` and canonical notification cursors.

A new indexer database must replay its required history. Incomplete coverage is disclosed. Do not equate an absent projection with zero assets. Read `ReSystem-Investment-indexer/docs/READ_MODEL_INDEX.md` and `PERFORMANCE_LIMITS.md` before a replay, schema change or capacity claim. Retained-history growth remains a production sizing decision.

## 10. API collection and contracts

The API is REST with OpenAPI generated from NestJS controllers and explicit response models. The attached snapshot has **104 operations**. The source of truth is backend `artifacts/openapi.json`; the Postman files are derived documentation, not another API definition. After a backend interface change, run `npm run openapi`, review the manifest/client diff, synchronize each frontend's pinned generated artifacts and run contract tests.

Package files under `api/`:

- `openapi.json`: canonical snapshot including request and response schemas.
- `resystem-platform.postman_collection.json`: portable Postman v2.1 import.
- `resystem-uat.postman_environment.json`: blank-secret environment template.
- `postman/collections/reSystem Platform API/`: equivalent Git-native v3 collection.
- `operations.csv`: route, operation ID, authentication category and success-code inventory.
- `generate_api.py` and `verify_api.py`: generation and local structural checks.

### Import and use

1. Import the collection and environment into Postman. `baseUrl` is `https://admin.resystem.org` with **no `/v1` suffix**, because paths already contain it. `origin` is the configured admin origin for direct staff API use.
2. Public health/readiness/catalogue reads are available without unlocking an operation. All other requests require setting `allow_operation` to the exact operation ID in that request's description. Mutations additionally require `allow_mutations=true`. Both default to closed. These are client-side accident-prevention controls, not server authorization.
3. Use the cookie jar. The generated import's misleading API-key header has been removed: this API expects cookies, not a `resystem_session` HTTP header. Start with `/v1/auth/session`; retain its CSRF cookie and set the returned token only in a private local Postman variable named `csrfToken`.
4. For authorized staff testing, manually enter username/password in private variables, perform the login and the indicated MFA challenge/enrollment step yourself, then refresh the session/CSRF value. Do not save live factors or token responses as examples or export a populated environment.
5. Select IDs from authorized read responses and fill the request-specific variables. IDs are internal UUIDs, except where a route explicitly uses an on-chain listing ID. A project UUID is not its contract address. Optional query fields are disabled until needed.
6. For a financial mutation, use the actual application review flow for acceptance. The collection is not permission to sign, create roles, send messages, upload data or fund a project. Never use Collection Runner for mutations. Clear operation/mutation switches after manual use.

The collection has strict TLS and redirect following disabled. OAuth endpoints are browser navigation, not ordinary JSON calls. Synthetic schema examples are clearly labelled and are not observed UAT responses. Deprecated/policy-disabled staff wallet and old email-confirmation endpoints remain in the canonical schema and collection for completeness; they are not current UI instructions.

### API groups and operating rules

| Group | Typical route | Caller and behavior |
| --- | --- | --- |
| Health | `/health`, `/ready` | Public liveness/readiness; not proof of a completed investment |
| Authentication | `/v1/auth/session`, `/staff/login` | Cookie/CSRF bootstrap, staff MFA, reID navigation |
| Projects | `/v1/projects`, `/{id}/quote` | Published catalogue and read-only exact quote |
| Administration | `/v1/admin/projects`, `/staff`, `/services` | Fresh staff permissions and scope; writes may alter privileged state |
| Accounts | `/v1/wallet`, `/portfolio`, `/activity` | Authenticated investor's own data |
| Transactions | `/v1/transactions` and per-intent routes | Durable exact intents; approval/signing actions are consequential |
| Support | `/v1/support` and `/v1/admin/support` | Private ticket ownership or authorized staff access |
| Notifications | `/v1/notifications`, `/email-notifications` | Account-scoped updates and preferences |

Activity numbered mode: `GET /v1/activity?page=1&pageSize=10&filter=deposits`. The response includes `pagination.page`, `pageSize`, `total`, `totalPages`, `filter`, `snapshotBlock`. Carry the first snapshot to later pages; reset it on filter change or fresh first-page load. Filters are all, payouts, buys, deposits and withdrawals. Page size is 1-50. Do not combine cursor and numbered mode. Counts refer to activity records, not unique transaction hashes. Canonical corrections/backfill can still change historic data; this is not an immutable export.

Other feeds use their documented opaque `nextCursor`. Do not decode, mix across endpoints or fabricate cursors. Quote endpoints are reads, but a displayed preview is not a reusable signing authorization.

| HTTP result | Caller response |
| --- | --- |
| 400 | Correct validation/input/network/quote issue; do not retry unchanged indefinitely |
| 401 | Re-authenticate; discard prior-user caches |
| 403 | Check CSRF/Origin/current permission; never bypass access controls |
| 404 / 410 | Resource inaccessible/missing or removed; do not infer another user's record |
| 409 | Resolve stale state or idempotency conflict before a new attempt |
| 413 / 429 | Respect file limits or throttling; bounded retry only where appropriate |
| 5xx / timeout | Distinguish unavailable read from uncertain mutation; inspect existing intent/hash before retry |

Read the returned vetted message and status. Do not expose raw provider/SMTP/SQL error text. JSON amounts are atomic decimal strings; display formatting must not change submission values.

## 11. Media, notifications and support

Public project images/documents are staff-reviewed public assets. Images are sanitized, metadata is pinned and publication binds the exact revision/CID. Public PDF processing uses bounded parsing/sanitization; it does not prove absence of sensitive visible content or constitute a malware scan. Human public-content acknowledgment is required.

Private support images use separate authenticated endpoints and encrypted storage. Supported inputs are PNG/JPEG/WebP up to 3 MiB and 16 million pixels; outputs are sanitized WebP. PDFs/SVG/GIF are not private support attachments. Server limits bound concurrency, account/ticket storage and history. Retrying an attachment reuses its saved message ID and idempotency key, rather than sending a duplicate message. Private files must never be routed into public IPFS.

Notifications follow actual intent/canonical/support events. Investor email uses the server-authenticated reID profile address under the owner's provider-trust decision; the SDK does not invent an `email_verified` claim. No second confirmation is required in the current investor UI. Existing opt-outs remain effective. Staff/operational delivery maintains its separate approved recipient policy.

MailOutbox encrypts recipient/template data and claims deliveries durably. Definite temporary pre-delivery failures may retry within bounds. An ambiguous SMTP acknowledgment becomes `UNKNOWN` and is not automatically resent. Successful SMTP acceptance and confirmed inbox receipt are different evidence. Branding templates preserve plaintext and trusted authentication links.

## 12. Local development and verification

Use Node 22 and locked npm dependencies for each JavaScript repository. Read the repository's bundled `node_modules/next/dist/docs/` before changing Next.js code. Contract toolchain: Foundry 1.5.1, Solidity 0.8.26, EVM Paris, optimizer 200/via IR, pinned OpenZeppelin and forge-std versions. Do not casually upgrade compiler/library versions while changing application behavior.

Run commands **inside the named repository**:

| Repository | Install/build/check commands |
| --- | --- |
| Investor | `npm ci`; `npm test`; `npm run lint`; `npx tsc --noEmit`; `npm run build` |
| Admin | `npm ci`; `npm test`; `npm run lint`; `npm run typecheck`; `npm run build` |
| Backend | `npm ci`; `npm run db:generate`; `npm run build`; `npm test`; `npm run test:integration`; `npm run lint`; `npm run typecheck` |
| Indexer | `npm ci`; `npm run build`; `npm test`; `npm run test:integration:local`; `npm run check`; `npm run verify:artifacts`; `npm run format:check` |
| Contracts | `forge build`; `forge test --offline`; `forge fmt --check` with pinned dependencies installed |

Integration tests require their documented disposable database/cache configuration. Never point a test suite or a migrator at FP by substituting its database URL.

### Isolated synthetic full platform

Build backend, indexer and contracts; have Docker on a local Unix socket, Anvil and the existing local certificate available. From the backend, choose a new protected runtime directory:

```sh
node scripts/local-platform.mjs up --project-version 2 --runtime /absolute/workspace/.runtime/new-isolated-run
```

Keep the launcher running. Read backend `docs/LOCAL_SYNTHETIC_ACCEPTANCE.md` for the staff/publication/financial drivers and controlled restart. Ports are fixed: Anvil 28545, RPC adapter 28546, API 23001, indexer 24101, provider 24443, PostgreSQL 25432, Redis 26379. The launcher rejects occupied ports and unsafe endpoints. Generated credentials remain in its protected directory. Stop the owned launcher to stop its own processes/containers; do not use broad kill/container-prune commands.

This runs real local contracts/API/indexer with synthetic reID, Pinata and mail. It is suitable for deterministic regression, not proof of external provider or real-chain acceptance. V2 here is local only.

### Local apps with real INFRA/reID

Backend `docs/LOCAL_REAL_TESTNET.md` describes the separate loopback stack and `scripts/local-testnet.mjs`. It uses real UAT identities and contracts, separate ports/database and protected identity injection. Investor is `https://localhost:3002`, admin `https://127.0.0.1:3004`, API loopback 23002. Distinct hostnames avoid cookie collisions. Do not bypass certificate validation. Default submission/signing is closed; new real transactions require applicable authorization and human approval. Historical authorization budgets are not reusable.

Some older runbooks describe former personal admin-wallet and duplicate email-confirmation behavior. The current shared-admin and reID-email rules in this guide supersede those historical user flows; do not reactivate them while following a local setup example.

## 13. Configuration and secrets

| Configuration family | Examples and ownership |
| --- | --- |
| Browser/BFF | `PLATFORM_API_BASE`, `PLATFORM_APP_ORIGIN`, `ADMIN_PUBLIC_ORIGIN`; fixed targets, exact origins |
| Data and encryption | `DATABASE_URL`, Redis connection and `ENCRYPTION_KEY`; protected runtime injection |
| Identity | reID client/redirect settings and cookie secrets; server-only, registered callbacks |
| Chain | RPC, verified deployment manifest, USDT/factory/marketplace/router pins and confirmation policy |
| Investor requests | `REID_TRANSACTION_SUBMIT_ENABLED`; currently true under ongoing QA authorization |
| Shared signing | `PLATFORM_SIGNER_*`, independent `SIGNER_*`, immutable KMS identity; API socket only |
| Media | Pinata credentials and bounded processing/storage settings |
| Mail/operations | `MAIL_*`, investor recipient policy, monitor thresholds; no secrets in client bundles |

Use each repository's example configuration and protected provisioner for exact required keys. Do not regenerate encryption/session/database secrets over an existing deployment. Never print `.env`, expanded Compose configuration, provider grants or AWS credential-process output. The private Development Credentials register is the authorized internal record; request access through the owner. Rotate development credentials before production.

## 14. FP infrastructure and deployment

FP is Teleport node `footprint.frontend`, reached as `resystem` through `teleport.reidentity.net`. The canonical web host is `admin.resystem.org`. Nginx terminates HTTPS and forwards only fixed loopback upstreams. Admin binds 127.0.0.1:3304 and API 127.0.0.1:3305. PostgreSQL/Redis have no public host ports. The indexer is internal. Containers use nonroot identities, read-only roots, dropped capabilities, bounded temporary storage and measured CPU/memory/PID budgets.

Read-only access/status, after your own authorized Teleport login:

```sh
tsh login --proxy=teleport.reidentity.net --user=YOUR_APPROVED_USER
tsh ssh resystem@footprint.frontend 'sudo -n /usr/local/sbin/resystem-cd status'
```

Do not paste passwords/MFA into scripts. The command is status-only; it does not deploy or alter financial gates.

### CI/CD sequence

1. Work in the intended independent repository. Review/test the exact source; publish to the approved branch.
2. Source CI checks formatting, types/build, regressions and security gates. API artifact compatibility is checked across consumers.
3. Hosted builders build pinned Docker images off FP. Source/archive/image identities are verified before a release job reaches FP.
4. The repository's restricted runner invokes the sealed root release controller. The root policy validates immutable operations files, service identity, migration compatibility, resource/security settings and protected peers under a global lock.
5. The shared signer drains pending work using an owned durable token. The controlled release swaps only intended images and performs readiness/indexer/preservation checks, or verifies rollback. Resume only the drain owned by that operation.
6. Verify actual running source/image IDs, public readiness, authenticated read behavior and restored approved QA state. Archive the receipt and source links.

**Ongoing QA stays enabled.** Current GitHub server workflows defer before root release when investor requests are open; they do not silently disable them. A deployment requires the owner's coordinated brief pause and confirmation of no open wallet approvals, then immediate verified restoration. A completed build or deferred job is not a deployed release. Do not weaken the guard to make a workflow green.

The investor Vercel deployment follows `dev`. Any investor push can change the candidate, even a documentation-only push. Use a separate docs branch for these guides. The KMS signer, machine certificate, key policy, root controller and schema are deliberate operator changes, not automatic side effects of an application push.

For exact implementation, use backend `.github/workflows`, `.github/ci/fp_guarded_release.py`, `deploy/fp/CONTINUOUS_DEPLOYMENT.md`, `MANAGED_KMS_CD.md`, `RESOURCE_BOUNDS.md` and the installed root policy. Historic `deploy/fp/README.md` is preparation history, not current runtime evidence. Preserve unrelated FP services. Blockscout is external and must not be reinstalled on FP.

### Rollback and recovery

Keep the previous verified images and protected release receipt. Do not overwrite a concurrently changed environment just to force rollback. A failed or uncertain signer drain/resume remains paused for investigation; never delete its journal or steal another operation's token. A database restore cannot reverse finalized blockchain transactions. A schema change requires an explicit compatibility/backup/recovery plan; ordinary image rollback is not an automatic schema downgrade.

## 15. Monitoring, backups and incident handling

Use readiness and sanitized operations status together with canonical chain/indexer state. The backend worker monitors dependencies and deduplicates incidents/recovery messages. A separate restricted FP watchdog probes public health endpoints and emails approved operators; it has no database or wallet access. Same-host monitoring cannot detect complete loss of FP.

Encrypted local backups and their timer are installed. Off-host backup storage was explicitly deferred by the owner and remains a resilience gap. Keep decryption identity separately; use the documented disposable restore rehearsal, not a restore over the live database. Preserve identity/support/audit state as well as rebuildable chain projections.

| Symptom | First investigation |
| --- | --- |
| Cannot prepare purchase | Exact vetted error, spend amount plus native fee, sale/supply/allowance, session and chain freshness |
| Request submitted, no success shown | Existing intent/provider ID/hash and receipt; no duplicate submission |
| Confirmed but old holdings | Confirmed boundary, indexer lag/history coverage and canonical event application |
| Admin cannot sign | Current permission/scope, shared switch, signer readiness/drain, caps, owner/treasury and fresh factor |
| Mail UNKNOWN | Investigate provider outcome; do not reset it to pending blindly |
| Upload failed after message saved | Retry only attachment against the existing message/key |
| App unavailable | Nginx/public TLS, bounded service health, host resources and unrelated services; avoid blind rebuilds on FP |
| Explorer NFT placeholder | Compare on-chain URI/metadata and external gateway; never remint to solve a display issue |

Previous FP automatic stops have no proven cause without hosting-provider evidence. Do not attribute them to application work or declare them resolved solely because the host restarted.

## 16. Performance and security maintenance

Read caching is per signed-in provider and is invalidated across session changes. Navigation warming is bounded and excludes quotes, authentication and mutations. Activity applies server filters before counts/pages and preloads nearby confirmed-snapshot pages. Detailed histories/charts and approval-history polling are demand-driven. Financial reviews always revalidate current values and authority; do not cache an authorization decision as a performance optimization.

Keep atomic authentication throttling, exact redirect/origin rules, private no-store responses, bounded upload admission, field allowlists, integer calculations, idempotency, encrypted outbox/files and append-only audit controls intact. A UI “hidden” button is not authorization. Verify negative and revoked-session cases as well as successful use.

The approved investor layout/branding is a fixed contract. Explicit owner-requested controls and small reduced-motion-aware feedback are permitted; unrelated redesign is not. Compare desktop/phone states and loading/error/empty cases when changing data integration.

## 17. What is verified and what remains

Recorded 23 October regression evidence: backend 144 unit passes plus one host-conditional skip and 250 integration checks; admin 199 tests; investor 157 tests; contracts 101 tests across 8 suites; indexer 109 unit and 10 PostgreSQL integration checks. Hosted Linux checks and source pipelines passed. Four production dependency audits reported no known findings at that check; this is time-bound evidence, not a guarantee of no vulnerabilities.

Isolated full-stack acceptance passed cold startup/publication, 27 financial transactions, eight staff/security groups, 27 boundary-policy tests and controlled restart preserving 29 indexed receipts. This used local V2 and synthetic providers, not a new real-chain deployment. Live UAT V1 journeys and their public transaction receipts are recorded separately in dated execution reports.

Remaining boundaries to carry into handover:

- External explorer gateway/cache returns 403 for artwork and V1 collection-level names can be absent; app media and token metadata are intact. Owner will coordinate the explorer operator. MetaMask display remains a separate external acceptance case.
- Full current phone/Figma/accessibility matrix, real multi-account browser/client sign-off and independent security/contract review remain separate acceptance.
- Positive configured two-person cosign fixture and natural wall-clock expiry checks remain distinct from existing negative/unit coverage.
- Production capacity/history-retention, off-host backup/outage monitoring, credential rotation, production custody/network and release approval remain open.
- V2 deployment is not authorized or performed on INFRA. No inherited document grants a new financial budget.

## 18. Source map and handover completion

This guide resolves historical runbook wording using the latest release evidence and current source. Maintain it when interfaces, operating policy or deployed versions change. The API generator must be rerun from the same reviewed backend schema; review generated examples before handing them to callers.

Primary references in the investor repository: `docs/testing/CLIENT_TEST_RELEASE_20261023.md`, `PLATFORM_AUDIT_20261023.md`, `docs/security/SECURITY_ARCHITECTURE.md`, `docs/planning/SHARED_ADMIN_WALLET_20261021.md`, current `tasks.json` and private Notion tracker.

Backend references: `artifacts/openapi.json`, `docs/REST_CONTRACT.md`, `AWS_ADMIN_WALLET.md`, `STAFF_HANDOFF.md`, `ACTIVITY_PAGINATION.md`, `INVESTOR_UX_FOLLOWUPS_20261022.md`, `PRIVATE_SUPPORT_ATTACHMENTS.md`, `PUBLIC_DOCUMENT_SANITIZATION.md`, `DURABLE_MEDIA_JOBS.md`, `OPERATIONS.md`, `INDEPENDENT_MONITORING.md`, `LOCAL_SYNTHETIC_ACCEPTANCE.md`, `READ_CAPACITY_LIMITS.md`, and `deploy/fp/BACKUP_OPERATIONS.md`.

The incoming developer should demonstrate: successful isolated startup; a read-only API request; locating a project from catalogue UUID to contract/receipt; explaining a retained reward after transfer; identifying the deployed image versus Git HEAD; a dry review of deployment/rollback; and reporting a bug without secrets. Owner acceptance of access, runbooks and operational responsibilities completes the human handover; document delivery alone does not constitute production sign-off.
