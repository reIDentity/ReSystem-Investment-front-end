# Shared admin wallet — 21 October 2026

This records the owner's revised admin requirement, the published/deployed application evidence and the remaining QA work. It grants no new agent-operated transaction or deployer funding allowance and is not a production release declaration. Earlier personal staff-wallet requirements are superseded; investor reID and the approved investor UI are unchanged.

## Permanent ownership and hosting model

- Staff sign in with their own username/password and enrolled authenticator. Roles and project assignments remain individual.
- Every admin contract transaction, including project publication, uses one configured shared wallet. Its Ethereum private key is nonexportable in AWS KMS. AWS hosts the key and its access controls only; the admin, API, worker, isolated signing service, indexer, PostgreSQL and Redis run on FP.
- Admin offers no MetaMask/reID connection, browser signature, provider approval link or browser broadcast. An old personal binding, missing capability or legacy flag cannot restore a fallback. Investor reID is a separate, unchanged investor flow.
- Staff permissions, action capability, enabled operational switch, signer identity/health/audit validity, current on-chain authority and financial limits are separate checks. Each permitted transaction has an exact frozen review and a fresh human-entered six-digit code. Configured second approvals require a different authorized person. The UAT exception allowing the same person to request/confirm the global switch with distinct fresh codes does not waive transaction cosigning.
- Machine authentication to KMS is separate from the wallet key. Its credentials, recovery evidence and protected runtime references stay private. No secret value belongs in this document or source.

Shared INFRA UAT wallet: `0xc1ddc45cbc5f61793ab1eb1999136c4e27347531`. Existing project cold treasury: `0xcfc93fb43f17f99eaca411be595b727501987e95`. Chain ID: **15324**.

## Project creation and operation

A new project starts as an off-chain draft. `GET /v1/admin/project-wallet-policy` supplies its configured shared owner and approved cold treasury choices to staff with `projects.write`; an existing draft editor supplies its exact `projectId` query scope. This read endpoint grants no write or signing authority and does not require signer-use permission or an enabled signer.

The owner is read-only in the wizard. Treasury is chosen separately from approved cold destinations; it cannot be the shared hot signing wallet. Policy is validated and re-read before save. Changed policy, expired session or a closed review blocks the delayed write. Ordinary edits preserve a legacy draft owner; an explicit migration acknowledgement is required to change an unpublished draft to the shared owner, invalidate review/metadata and return it to Draft. Published ownership is never rewritten as draft metadata.

Publication prepares a shared-wallet intent; saving a draft does not create a contract. Ordinary publishers still need independent project review. The authorized global super-admin exception permits direct publication without that review, while preserving all other checks. The platform signer independently decodes action, exact amounts, recipients, version and limits before any KMS Sign call.

The new source supports bounded discovery of registered project targets from the configured factory: chain/confirmed anchor, registration, reverse project ID, implementation version and clone code, factory authority, current/pending shared ownership and cold treasury are checked. It does not trust an API-supplied registration assertion or fall back to a stale static list after a failed proof. The current operator HTTP RPC remains a documented trust boundary; this is not independent block execution verification.

The admin displays current confirmed owner/pending owner with indexer source, block and freshness, only under existing finance-read permission. Recorded publication addresses remain labelled historical facts. Unavailable or partial data never substitutes the recorded owner for current authority. Historic `WALLET` intents are read-only; their actual status and receipts remain reconcilable without new personal approval/broadcast.

## Published source and deployed applications

Root release receipts and separate runtime readback verify the following register. Source commits, CI, actual application images and the separately pinned signer are distinct evidence.

| Component | Evidence at this checkpoint |
| --- | --- |
| Backend source / API and worker | [e950fd91](https://github.com/reIDentity/ReSystem-Investment-backend/commit/e950fd91f403b84ba7e68e7957b57a96843d3a41), source CI passed; actual root receipt `release-backend-e950fd91f403-f4fec6d285e9` |
| Actual backend image | `sha256:2f3a31f5738252efa088236b0127e9ea278588caa096081d96cb5776ee213afb` |
| Admin source / actual application | [de9dcd5f](https://github.com/reIDentity/ReSystem-Investment-admin/commit/de9dcd5ffd22004f33586d6ee6f6161dec870683); [guarded release 39598208165](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39598208165) succeeded |
| Actual admin image | `sha256:8f4af9b1d84b8810e1afa957f6d7b4cb0571f2432c51718df3535ef8bfbd0687` |
| Isolated KMS signer | Controlled upgrade verified to **e950fd91**, with the same backend image above; receipt `upgrade-c81fd76ff7bd4d918db633ddabb8d8a6` reports `verified_upgrade` |
| Automated checks | Backend **141 unit passes + 1 host-conditional skip / 241 integrations**; admin **183**; investor **102**. These are not full live QA/client acceptance. |

The source removes permanent staff provider paths and tests existing bindings, absent/disabled signer, scoped policy, cold treasury, explicit draft migration, frozen approvals, session expiry and historical receipt handling. Publication integrations exercise real shared preparation while stubbing only isolated signer status; fixture RPC rejects every `eth_send*`. No actual KMS Sign or extra transaction is inferred from those tests.

## Completed bounded commissioning history

All six individually approved migration actions were canonically verified: 30 reAED gas funding, factory creator grant, two ownership proposals and two acceptances. Both existing project owners became the shared wallet, pending owners zero, with cold treasuries unchanged.

Only the two human-approved ownership acceptances used KMS Sign: nonce **0/1**, exact `acceptOwnership()`, value **0**, actual fee **3 reAED each**, both INDEXED:

- [Publication Acceptance project](https://uat.scan.infraworld.org/tx/0xad0f639f3b26f51615bd1d440f216511d75ce04321f73aee19e0ad3fc7214c6d).
- [Lifecycle project](https://uat.scan.infraworld.org/tx/0xf793c2b6d9f0e87b1956f7a85165a0c0382d71bd0db54a3b8f3fd00876e28bb1).

At commissioning close, conservative gross use was **48/50 reAED**, **no USDT**, all **six slots consumed**, with **24 reAED** remaining wallet float. Signer and platform audit chains verified two Sign records, no additional signature. This is dated evidence, not a new balance query, replenished budget, seventh migration action or permission for automated testnet spending.

## Shared signer policy upgrade and ongoing QA activation verified

The isolated signer is now **e950fd91** on the same verified backend image as API/worker. Root upgrade `upgrade-c81fd76ff7bd4d918db633ddabb8d8a6` reports `verified_upgrade`; both policies enable all **11** admin actions, dynamic registered-factory discovery and required shared ownership. Funding/withdrawal ceilings are **10 reAED / 1 USDT per call**, with previous daily/per-key/rate limits preserved. Independent audit remains valid at **13 events**, exactly the same two old Sign records nonce **0/1**, zero pending work, enabled database switch and personal signing false. No new signature/broadcast occurred. All six migration slots remain consumed; operational caps grant no extra transaction budget or V2 authority.

Guarded backend no-op `release-backend-e950fd91f403-8426134786ff` passed source/image/identity/credential/journal/switch/store/schema/peer preservation under owned pause/resume. Four bounded registry checks and **24** private upgrader regression checks passed. The actual unsaved wizard shows a read-only shared owner and cold treasury dropdown; no draft was saved. Verified automatic CD modes and the separate defer-on-open workflow follow-up are described below; these do not alter the actual application-source register.

The verified action set is:

| Project lifecycle | Metadata / presentation | Funding / treasury | Ownership |
| --- | --- | --- | --- |
| `PUBLISH_PROJECT`, `OPEN_SALE`, `CLOSE_SALE` | `SET_YIELD`, `SET_METADATA`, `FREEZE_METADATA` | `APPROVE_USDT`, `FUND_REVENUE`, `WITHDRAW_TREASURY` | `ACCEPT_PROJECT_OWNERSHIP`, `RETURN_PROJECT_OWNERSHIP` |

The funding/withdrawal values above are runtime maximums, not a replenished UAT budget or instruction to spend. Cold treasury, fresh individual approval and all other checks remain mandatory. Four bounded registry checks passed at preflight and before/after the policy change; this does not certify every future project. The upgrader's twenty-four checks include the narrow health/log-observation volatility correction to compare-and-swap checks. The independently verified journal still contains only the same two old signatures.

The ongoing investor QA request window is **enabled and independently verified**. Root receipt `ongoing-qa-506c0363f3214b49863c46adecb9cc73` succeeded; separate readback shows API **and worker** `REID_TRANSACTION_SUBMIT_ENABLED=true`, personal staff signing false, actual source **e950fd91** and API readiness **200**. Shared database switch and KMS custody/policy were preserved. The final private activation helper passes **nine** checks and contains **no automatic closure**. A separate post-activation audit confirms all eleven actions, the same two Sign records nonce **0/1**, a valid **13-event** audit, zero pending work, investor requests enabled and personal staff signing disabled.

The owner's latest instruction to keep it enabled supersedes historical end-of-session closure directions for this ongoing QA window: **keep it true until the owner asks to close**. Availability does not grant an agent a new signature, broadcast, funding, contract deployment or spending allowance. All six migration slots remain consumed. Each investor approves their own exact transaction; admin approvals remain shared-wallet/authenticator-only.

QA should close an expired, unused purchase review and open a fresh purchase review. An old review/link does not renew its deadline. If a prior request may have been broadcast or has uncertain status, reconcile that same intent before preparing a replacement.

## Deployment workflows — final source CI, automatic defer and runtime preservation verified

All three deployment-workflow follow-ups are published to `dev`, with successful final source CI and automatic deployment jobs:

| Repository / published commit | Source CI | Automatic deployment | Deferred output time (UTC) |
| --- | --- | --- | --- |
| [Backend 0b7c457](https://github.com/reIDentity/ReSystem-Investment-backend/commit/0b7c457e94b0df23a3bc422f1380fc707186e5de) | [39601370526](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/39601370526) | [39602841317](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/39602841317) | 12:54:56 |
| [Admin 9df8b02](https://github.com/reIDentity/ReSystem-Investment-admin/commit/9df8b02ab6b94136db5bff6f794cba91be199a55) | [39601476694](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39601476694) | [39601878785](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39601878785) | 12:45:20 |
| [Indexer 6580a72](https://github.com/reIDentity/ReSystem-Investment-indexer/commit/6580a727ce29d9a37baa3617dedd1175810c5427) | [39601512106](https://github.com/reIDentity/ReSystem-Investment-indexer/actions/runs/39601512106) | [39601702099](https://github.com/reIDentity/ReSystem-Investment-indexer/actions/runs/39601702099) | 12:43:28 |

Every final deployment job succeeded with explicit **deferred**, **`deployed=false`** and **`gateChanged=false`** while ongoing QA was open. These are successful workflow/defer proofs, not newer image releases. Independent root readback at **12:56:46 UTC** confirms the candidate remains backend **e950fd91**, admin **de9dcd5f**, indexer **6f35968**, the investor request gate is open, and API/indexer are healthy. Backend operator regressions pass **111** checks with **one Linux-conditional skip**; wrapper helpers pass **43 / 43 / 40**. Earlier failed helper/format revisions were corrected before these final passing runs.

The wrappers defer **before any root release attempt** while ongoing QA is open, returning `deployed=false` and preserving the stable candidate. A refusal after an attempted root release still fails and requires verified recovery; the root closed-gate deployment policy is unchanged. All three `FP_CD_MODE` settings are independently restored and read back as **`auto`**. Source CI success, deferred deployment and a completed image release are different results: running applications remain **e950fd91 / de9dcd5f / 6f35968**.

## Remaining acceptance and handover

RSI-067 remains **In progress**. Shared-owner draft defaults and permanent provider removal are implemented/tested/deployed, and the eleven-action/dynamic-target shared signer upgrade is independently verified. Ongoing investor-QA request activation is verified. Broad live acceptance remains separate.

Still pending: broader deployed browser checks, multi-staff/project-scope/revocation/negative approval tests, lock/unavailable/rate/cosign cases, QA/client accounts and full independent client acceptance. Do not mark the platform Done from source, CI, two ownership acceptances or a healthy read path. QA testers may use their own wallets and personally approve their own UAT transactions. This checkpoint grants no additional agent-operated transaction or deployer funding allowance.

The investor UI contract remains fixed. NFT metadata/artwork are intact, but the external INFRA explorer's failing gateway remains operator-dependent; the owner asked to leave that explorer configuration unchanged. Off-host backups and production rotation/recovery/independent review remain separate outstanding milestones. Private task, service and evidence records belong in the existing Notion workspace; local documentation does not by itself prove Notion synchronization.
