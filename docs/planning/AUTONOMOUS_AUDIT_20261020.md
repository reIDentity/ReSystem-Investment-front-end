# Autonomous platform audit — 20 October 2026

The owner requested an autonomous code, logic and admin UX audit, with questions and human-only actions deferred. RSI-108 tracks admin information; RSI-109 tracks shared correctness and history protections. This is a bounded engineering audit, not independent security certification or a promise of no remaining defects.

## What changed

| Area | Reproduced problem | Corrected behavior |
| --- | --- | --- |
| Admin information | Audit, support, role scopes and financial reports rely on unexplained IDs/addresses. | Authorized read models attach bounded project and account summaries. The admin shows names, readable action labels, full timestamps, contextual detail and copyable exact references. Restricted, deleted or ambiguous identities remain unavailable. |
| Read privacy | The same staff account can change project scope while its flattened permission names stay identical. Old cached/selected records can survive. | A non-secret membership fingerprint separates read caches. Reports and interactive workspace state reset across scope changes; late old-scope data cannot replace the current result. Existing backend authorization still decides every read/write. |
| Dashboard | Expired unused CREATED intents count as pending; confirmed-but-unindexed records are omitted. | Counts distinguish outstanding approvals/settlement/indexing from unused expired reviews without mutating transaction history. |
| Reports/aggregates | Reused cursors, cursor cycles, repeated records and unbounded parallel project requests can yield false totals or excessive requests. | Cursor/record cycles fail visibly; summaries retain explicit page bounds and partial status. Independent project requests use bounded concurrency. Search/export includes authorized context and preserves exact atomic strings and CSV protections. |
| Staff-role retries | Repeated or simultaneous assignment of an already held role returns 409 even though the existing SQL unique index prevents duplicates. | Return the exact existing grant only after fresh session, delegation and scope checks under the role lock; six concurrent retries return one grant and one audit event. No migration or cleanup. |
| Mutations | A committed role/preference change followed by a failed reread can look like a failed write. Support unassignment and cancelled attachment retries can be misleading. | Mutation success remains distinct from refresh failure; unassignment sends explicit null; cancelled attachment retry cannot silently create another reply. |
| Approval lifecycle | An awaited status/provider read can continue after the staff review closes or its approval context changes. | The continuation checks the current mounted staff/session/wallet/scope before the final approval request. Acknowledgments clear on authority change. An already returned broadcast hash remains eligible for durable reconciliation. |
| Portfolio | Standard zero-value and empty-batch ERC-1155 transfers can create false holder requirements or exhaust candidate bounds. | Only provably never-participated, zero-only records are omitted before the limit. Positive transfers, genuine exited holders, fractional accruals and incomplete history remain candidates; valid empty batches do not invent holdings. No token-standard restriction or contract change. |
| Indexer history | Malformed candidate rows can be discarded and then reported as completed history. Log data can be accepted without exact successful receipt membership. | Malformed pages preserve their cursor/completion checkpoint. Current and historical log facts require exact cached canonical receipt proof. Previously completed queues are not silently reset or repaired. Repeated block-wide log indices fail before applying facts. |
| Accessibility | Dialog title IDs collide; some field errors are not associated with native controls. | Unique dialog title/description relationships and native control error/hint associations. Non-submit buttons default to button semantics. |

Admin context contains display names/usernames and exact references, never private reID profiles, contact records, credentials or signing keys. Verified wallet bindings are required for wallet-to-name attribution; ambiguous bindings are not guessed. Shared public/investor serializers retain their existing shapes except the additive, non-secret session cache field. Names never replace frozen signing values or permit a transaction.

The three repositories consume the same generated OpenAPI schema. The internal artifact manifest now calls its public SHA-256 `schemaSha256`; all known consumers still verify the complete schema bytes against that digest. No secret-scanner rule or exclusion is changed.

## Verification ledger

Source, CI, image provenance and actual runtime are separate evidence. Final published commit links and deployment results are appended after they exist.

- Backend: 119 unit checks pass; one existing host-conditional check skips. 230 real isolated PostgreSQL/Redis integration checks pass, including authorized context/redaction, reassigned scope, genuine exited holdings, zero-transfer/empty-batch history and bounded reads. The prior time-step-sensitive authenticator CI failure is reproduced by injected-clock tests and fixed only in test fixtures; production MFA/replay checks are unchanged. The monitor suite also passes three independent repeats.
- Admin: 179 checks pass. TypeScript, lint and the 16-route production build pass. Focused UI tests use synthetic HTTP responses and real production components, not live wallet actions.
- Investor: 102 tests, lint, TypeScript and the 20-route production build pass. The audit changes only generated API artifacts/tests and documentation; approved investor components, styles and public assets remain unchanged.
- Indexer: 105 checks and nine isolated PostgreSQL integration checks pass. Types, formatting, contract artifact pins and lifecycle fixture checks pass.
- Real INFRA compatibility: read-only checks of three already-confirmed UAT transactions (blocks 7,468,396; 7,331,801; 7,330,261) validate six receipt logs with the new canonical proof. No transaction is prepared, signed or broadcast by this check.
- FP preflight: API/worker 5360051, admin 6acee06 and indexer 63ba31f were independently read back at 17:07 UTC; both reID request gates are false, platform signing is off, and no provider requests or transaction intents are pending. These are the pre-audit runtime versions, not evidence that the audit fixes are deployed.

## Tomorrow / acceptance still requiring the owner or independent evidence

1. Review the updated admin information and any desired additional operational fields. Some polymorphic audit targets still lack an authoritative record-type discriminator; retain their exact IDs rather than guessing a project/user name.
2. Complete investor notification removal/reconfirmation using the owner's inbox. No confirmation email is sent or approval link followed automatically tonight.
3. Any further financial test needs new applicable authorization: previous budgets/windows are exhausted and gates remain closed. Existing reviewed proofs are preserved; V2 deployment, custody/role handover and its activation delay remain separate gates.
4. Independent contract/security review, release/client acceptance and wider device/email-client checks remain distinct from this engineering audit. Bounded local capacity results do not certify an unspecified production SLA.
5. Off-host backup storage remains explicitly deferred by the owner. FP's automatic stop cause remains unproven without hosting-provider evidence; builds stay off FP and unrelated services are preserved.

## Operational boundaries

No new migration, credential, dependency, permission grant, financial gate or production contract deployment is required by these fixes. Use hosted builders and validated image archives for any FP rollout. Retain existing resource limits, private data, applied migration checksums and unrelated services. Stop only new task-owned local fixtures after testing.

## Published source so far

- [Admin 53565bd](https://github.com/reIDentity/ReSystem-Investment-admin/commit/53565bd3fda3a708ea3268d17286c74739f162c3): 179 tests, types, lint and production build pass locally.
- [Indexer 4810988](https://github.com/reIDentity/ReSystem-Investment-indexer/commit/4810988937bd3789711d561000a3a458cc4ace5f): 105 unit/synthetic tests, nine PostgreSQL integration tests and both actual isolated V1/V2 lifecycle/reorg tests pass. GitHub CI 39463818680 passed; hosted image build is separate.
- [Investor 7041cdb](https://github.com/reIDentity/ReSystem-Investment-front-end/commit/7041cdbc827b44470c149f4f3affe6f7ae47e20e): generated contract sync only; application UI is unchanged.

The complete current Git history scans for these three commits have zero findings with the existing scanner policy. A synthetic credential canary is still detected. No exclusions or rules were modified.

- [Backend 0410008](https://github.com/reIDentity/ReSystem-Investment-backend/commit/0410008acb7b9fb3544b010e6a4d0aa232ded4ac): authorized read context, scope fingerprint, zero-transfer/empty-batch portfolio guards and deterministic signer test factors. 119 unit checks pass, one existing host-conditional check skips, all 230 integration checks pass; full-history scanner has zero findings.
- Admin CI 39463943411 and investor CI 39464120064 passed. Admin/indexer hosted image builds39464463978/39464275951 passed. Image provenance and actual rollout remain distinct checks.

- [Backend retry follow-up 6932349](https://github.com/reIDentity/ReSystem-Investment-backend/commit/6932349e6fb9b6cce6e1424a5b7ed96491f14fb3): four new real-PostgreSQL retry/concurrency/authorization groups and 20 existing authorization/context groups pass together (24/24). Build, typecheck and lint pass. The initial hypothesis of duplicate grants was disproved by the existing SQL unique index; the reproduced issue was a 409 on safe retries. Current CI/runtime acceptance is recorded separately below.

Final backend CI [39467443801](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/39467443801) passed on `6932349`: 119 unit passes, one expected host-conditional skip, all 234 isolated database integrations pass, dependency/security gates and production packaging checks pass. No scanner policy or exclusion changed. Hosted release-image build [39468980836](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/39468980836) is separate from CI and runtime.

Backend release build 39468980836 passed; its private runtime/migrator artifact is 535,445,066 bytes (artifact 12287200157). Both admin/indexer independent local archive proofs passed; the FP proof repeats the same content/run/tree checks before any Docker load. Application deployment and actual indexer advancement are still separate acceptance steps.

Documentation privacy: the existing 14-page client PDF text and metadata, plus 93 general Markdown documents, have zero findings with the unchanged secret-scanner configuration. Protected credential files were excluded. This is a pattern-based text check, not proof about raster-only content; the PDF itself is unchanged.

## Verified FP audit release — 17:54 UTC

The scoped image-only release completed at **17:54:27 UTC**; a separate fresh readback at **17:54:50 UTC** confirms API/worker `6932349`, admin `53565bd` and indexer `4810988`. Images respectively are `d0f1a08a…de62a`, `a4ea3145…a16fa` and `c33bf2b2…ae74`. Source CI, hosted build evidence, actual downloaded archive/config/layer/source-bundle proofs and running container evidence are distinct and all pass. Backend migrator/runtime pins are paired; no migration ran.

The new indexer advanced confirmed block **7,475,267 → 7,475,272**, with healthy canonical readiness. Both reID gates remain false, platform signing is off and pending intents/provider requests are zero. Exact protected environment hashes, app kernel/HostConfig resource/security policy, applied migration checksums, watchdog/backup units and all ten unrelated container identities/configuration/start evidence were preserved. The standalone email/watchdog package remains the previously verified branding package; it was not redeployed by this audit.

Actual Chrome desktop verification shows project names and the verified treasury account name, exact secondary references, and the correct treasury detail values. Audit actors display staff/investor names and action labels with full timestamps. Seven post-deployment strict-TLS HTTP checks verify the public sign-in shell and anonymous401 on protected direct/BFF routes. No wallet connection, transaction, permission grant, support message or confirmation email was performed by these checks. Owner-specific inbox/wallet and wider device/client acceptance remain separate.

## Admin-only follow-up — 18:12 UTC

[ad729b4](https://github.com/reIDentity/ReSystem-Investment-admin/commit/ad729b418dca0559fd1437d09bd3f4da88c508a6) corrects the live transaction table's unsupported creation-date binding: the API does not return `createdAt`. The table now labels and renders its actual recorded `expiresAt` as **Review expires**, rather than inventing a creation time. A focused component regression, types/lint, full [admin CI39471533877](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39471533877) and [hosted build39472017462](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39472017462) pass. Independent source/config/layer/archive proof passes. The admin-only release completed **18:12:33 UTC**, image `36b433ff…7c839`; API/worker6932349, indexer4810988 and all other container identities/configuration remain unchanged. Protected settings, gates, migrations and units remain unchanged, with no financial action. Existing financial and delivery histories are unchanged.

Actual Chrome shows **Review expires** with real local date/time and exact UTC title, alongside project/requester names. Searching the transaction report by the visible project name returns the matching records on its current page. Support displays the actual requester name. No ticket, message or permission was changed by this review.

## Positive isolated acceptance and test-tool corrections

The remaining isolated cold-start/restart/driver gap is now positively exercised. The final fresh protected fixture passes **5 publication checks, 8 separately recorded staff/security checks and 7 independent financial lifecycle checks**, with **27 exact-frozen, canonical, INDEXED synthetic transactions**. It covers both purchase assets, repeat/late mints, revenue funding, partial/full transfers, both-asset partial resale/cancellation/proceeds, retained exit rewards and claim-both/batch/single. Final permanent rounding liabilities are1 atomic unit in each asset. Proof files and their SHA-256 digests were re-read and matched; the summary digest is `a9c33aed9bb202267d1f3efed2a8bf392e7a467719dfc0e8fb326e148368f56d`.

The fixture exposed four test-tool defects, all corrected without changing production approval, reference, transport or MFA rules:

- [ad8a948](https://github.com/reIDentity/ReSystem-Investment-backend/commit/ad8a948c41c0c56574b28975cbf281fd58dd373e): refuse overlong Unix socket paths before starting containers; use fresh test HTTP connections after intentional API replacement, with no mutating POST retries.
- [66ecc0c](https://github.com/reIDentity/ReSystem-Investment-backend/commit/66ecc0c0e046598339e1b5c67c84a81ad7ea93d3): generate distinct deterministic nonzero bytes32 funding/report references, accepted by the real command parser. No free-text reference exception.
- [cba044d](https://github.com/reIDentity/ReSystem-Investment-backend/commit/cba044d5fa8b636947661448e0d1dd42367cef01): advance from the actual synthetic staff factor step already consumed by publication. No marker rewind or replay relaxation. An injected-clock regression proves the cross-driver case.

All **27 local-policy tests** pass. Earlier failed/partial fixtures are retained as evidence; a later standalone successful prepare is not presented as a complete driver pass. The final full journey used a fresh fixture after the corrections. These newer commits are **source-only test tooling**; deployed API/worker source remains6932349.

All eight fixed fixture ports are free, all newly owned fixture containers/signers/API/indexer/provider/SMTP processes are stopped, and pre-existing listeners/PostgreSQL were preserved. No real reID/INFRA, external email, browser wallet approval or FP operation was used by the isolated journey. Natural wall-clock staff expiry, real browser cosigning, human inbox and independent release/client acceptance remain separate.

## Backlog reconciliation

The native Notion board was read in two bounded pages: all109 unique tasks, with84 Done/22 In progress/3 To do at that snapshot. The public portable task JSON now contains those observed states and source references instead of the original105-To-do snapshot; detailed native task evidence is retained only in private Notion/protected local storage; original requirements/dependencies are preserved. This is not blanket independent recertification. The previously empty commit field on the already-Done deployment task was linked to the actual verified current admin revision, with the existing investor-hosting evidence and source/runtime distinction retained. The unchanged scanner rules still detect credential canaries and no new exclusion is used.

## Final bounded audit state — 18:23 UTC

RSI-108 and RSI-109 are Done for their recorded audit criteria. Final helper [CI39472498296](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/39472498296) passes on cba044d, including27 local-policy checks,119 unit passes/one host-conditional skip and234 integrations. All audited code is published; application runtime is separately verified at API/worker6932349, adminad729b4, indexer4810988. Source-only helper commits do not require an application redeploy.

The reconciled109-task board now has **85 Done, 21 In progress and 3 To do**. Other task states were copied from native Notion rather than inferred or blanket-closed. This is not a claim that the full platform is production-certified; remaining implementation/acceptance evidence is preserved in each task. The owner-only inbox/wallet/design/client decisions and independent release/security/hosting evidence stay for the next session. The previously documented broader capacity and operational acceptance gaps remain visible as well.

No new real approval request, wallet signature, funding, support message, external email or contract deployment was performed. The real request gates remain closed, signing remains off, and task-owned local fixture servers/containers are stopped with prior services preserved. The approved investor UI is unchanged. Current release and test evidence is archived in the private Notion audit/security/service records; this source report is the portable continuation copy.

Public-source boundary: the investor repository is public. The portable backlog exports requirements, states and commit links, with minimal audit summaries; raw account/financial/runtime task evidence stays in private Notion and protected local records. No detailed private-board export or screenshot is committed. Current public source scans are checked under unchanged rules before publication.
