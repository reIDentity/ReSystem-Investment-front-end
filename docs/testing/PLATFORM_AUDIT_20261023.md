# Platform security, performance and usability audit — 23 October 2026

Status: verified fixes published and deployed; signed-in desktop acceptance complete. This is a focused engineering audit of the five existing repositories and deployed UAT environment; it is not an independent security certification or production capacity approval.

## Verified defects and corrections

| Area | Evidence | Correction / release state |
| --- | --- | --- |
| Authentication throttling | Concurrent first/expired requests bypassed a read-then-upsert limiter: 20 of 20 admitted despite limits of 5 API requests / 10 staff lookups. | Atomic PostgreSQL conflict update; regression tests prove the existing limit under concurrency. Backend `91dbfa7` regression checks pass; published and deployed as part of `8924944`. |
| Proxy redirects | Admin accepted arbitrary HTTPS upstream redirects; 307/308 could replay POST bodies. Investor redirect rules were broader than its OAuth flow. | Confine admin to validated same-origin API redirects and investor redirects to known OAuth GET routes. No exploitation or disclosure is claimed. |
| Multipart resource use | Public project media was buffered before process/account admission. | Pre-Multer bounded concurrency and receive deadline; retain processing lease until completion, release on error/abort. |
| Investor outcomes | Successful writes followed by failed refresh could appear failed; transport errors could assert balances unchanged. | Separate saved outcomes from refresh failures and show explicit uncertainty instead of implying a safe duplicate. |
| Investor flow | Missing next-step guidance, persistent copy state and no deposit refresh outcome. | State-specific transaction guidance, clipboard/refresh feedback, onboarding FAQs and supported-assets wording. |
| Investor interactions | Additional animation requested within fixed approved layout. | Brief 140–160 ms press/hover/dialog/toast feedback with reduced-motion handling; no stagger or animated financial values. |
| Activity context | Live purchase/transfer rows showed no project because their event args lack project address. | Add bounded published-only project context, using canonical emitter or marketplace project address; frontend consumes readable project names. |
| Admin information | Truncated financial reads could appear complete; cached health could appear current after failure; overview eagerly fetched detailed histories. | Complete-data validation, honest health states, scoped queues, named requests, exact indexed proceeds/reward reserves and on-demand detailed charts. |
| Public headers | Investor landing pages lacked basic frame and content-type protections. | Route-wide no-framing, nosniff and referrer policy; existing authenticated CSP retained. |

## Independent root verification

- Contracts: `forge test --offline`, 101 passing tests across 8 suites, including fuzz/invariant campaigns. No contract or economic changes.
- Indexer: 109 passing tests, TypeScript and pinned artifact verification passed.
- Isolated PostgreSQL indexer integration: 10 passing tests with fresh loopback-only disposable database; helper stopped and removed its database afterward. The 2,000-event / 1,500-position local fixture measured commit median 4.03 ms, rewind 77.66 ms and page median 0.129 ms. These are bounded local fixture measurements, not FP capacity promises.
- Four Node applications: `npm audit --omit=dev` reported zero known production dependency vulnerabilities at the check time.
- FP read-only inspection: API, worker, admin, indexer, PostgreSQL, Redis and signer running; zero OOM kills/restarts. App resource limits and unprivileged/read-only settings present. App ports bind loopback; DB/cache have no public host ports. No service was changed during these checks.
- Public read checks: backend health 200; anonymous portfolio/notifications 401 with no-store. Admin TLS validates. Session endpoint 200 is its expected anonymous session response.
- Signed-in live baseline: Home, Activity page/filter changes, Deposit five-row list and See more deep link, and Earnings load with actual data. No wallet request, signature, email, support message or permission change was submitted.

Protected local evidence is under `.runtime/platform-audit-20261023/`. Source, passing hosted CI, actual running images and browser acceptance are separate proof.

## Release and acceptance

- Backend deployed release `8924944` includes security commit `91dbfa7` and published Activity context. 144 unit tests pass with one existing Linux-only PDF-driver skip on macOS; 250 real PostgreSQL/Redis/API integrations pass without skips. Prisma validation, types, lint, build, dependency and full-history redacted secret scans pass. Hosted source CI 39911873722 and hosted runtime/migrator image build 39913044841 also passed. Loopback test services 50819/50820 are stopped with data retained.
- Admin deployed release `f954ad0e8f78f0c31e02205d6dca69c5558aa7bc` includes `0493a14` and independent-review correction `113fe28`. 199 local tests, lint, types, build and secret scan pass. Actual SWR regression verifies latest requests refresh and cached data does not mask a 503. Hosted initial CI 39910733236 and follow-up 39911341717 pass; final CI 39911535117 and hosted image build 39912364001 passed. Actual archive config/layers and exclusive source bundle were verified before staging/loading. Candidate runtime image `sha256:65726c9c771d86bb6b1878036d2e2c51a1b2381f05a8e979e751946e4744a792` has unchanged image environment, Node 22.23.4 and runtime shape; guarded rollout and signed-in acceptance passed.
- Investor API synchronization release `ea425312ce82990690f74bf6c928a7fcdeb4129a` includes e765732 interaction/security changes. 155 application tests, lint, types, build and secret scan pass; API synchronization also passes 27 focused flow tests and types/build. Hosted CI 39911523700 passed. Vercel's live public response has `frame-ancestors 'none'`, DENY, nosniff and no-referrer. Live signed-in Deposit refresh reports progress and successful confirmation without changing funds; popover has 140 ms entrance, Escape closes it and returns focus. Existing signed-in data and layout remain. After backend rollout, live Activity purchases/transfers resolve to INFRA reAED and reSystem UAT Lifecycle Test with working project links.
- Live Home retains both loaded holding images, aligned 40 px action rows and no desktop horizontal overflow. Support expands the new getting-started instructions without submitting a ticket or message.
- Investor follow-ups `17ef64a` and `6274452` expire only routine success notices after eight seconds, retain error/uncertainty guidance, and distinguish a saved reply from failures refreshing its conversation/list/attachments. 34 focused tests, lint, types and build pass; hosted CI 39913206043 passed all 157 tests and Vercel reports deployment completed. Live refresh success was visible, then disappeared automatically while the refresh button remained enabled. No live reply was sent.
- Generated OpenAPI artifact bytes are synchronized across backend, admin and investor. No new scanner exclusions were required.

### Verified FP rollout

The owner approved the brief request pause and confirmed no QA wallet approvals were open. Hosted images were built off FP, verified against exact archive config/layers and source bundles, then loaded without a server build.

| Service | Running source | Verified image ID |
| --- | --- | --- |
| API and worker | `8924944716f4e5bb960c9303b0b8362ee1e601ce` | `sha256:19bd6de624855524d25c3baab6d3dab7ee0cafbdc2ff95adb6a020493508d814` |
| Admin | `f954ad0e8f78f0c31e02205d6dca69c5558aa7bc` | `sha256:65726c9c771d86bb6b1878036d2e2c51a1b2381f05a8e979e751946e4744a792` |
| Indexer | `6f3596836086b9177fb1c7e21a3e5052a51d80c0` | Existing image preserved |
| Investor on Vercel | `6274452876a44d3a13e40a502401f066ebd911fb` | Vercel success plus live browser acceptance |

- Pause receipt: `close-1a6ac4778a7348a38ce3245d91d46f94`.
- Backend receipt: `release-backend-8924944716f4-bf9c595b17db`.
- Admin receipt: `release-admin-f954ad0e8f78-1e57c75d7f16`.
- QA restoration receipt: `open-8ecc9ca5eb044a098aa91a80b74da050`, outcome `verified_open`.
- Both release receipts report protected state preserved, indexer advancing, no migration, and shared AWS KMS signer resumed with its existing configuration. The gate helper verifies both API and worker request flags, unchanged signer credentials/policy, resource limits and unrelated services. No wallet action was submitted.
- Final controller status confirms the exact sources above, gate open, API/indexer healthy. Admin and worker have no Docker healthcheck field; application readiness is checked separately by the release controller and the browser, not inferred from that field.
- Actual admin refresh now shows the latest operational queues, named account-owned requests, project values and supply, indexed primary proceeds and reserved rewards, reachable API/chain and shared signer ready. The transient service restart produced an honest unavailable state; Refresh recovered it to “Overview updated.” Detailed charts loaded only on expansion and then showed confirmed revenue, purchases, project names and marketplace fills.
- Investor Activity now links actual project names on purchase/transfer rows. Existing deposits, pagination and authenticated sessions remain functional. Protected screenshots are `admin-overview-final.png`, `investor-activity-final.png` and `investor-deposit-final.png` in the audit evidence folder.

The ongoing QA investor request gate is restored to enabled and remains open under the owner’s standing instruction. The approved pause changed only the request flag temporarily. The signer wallet/policies, contracts, schema, credentials and financial allowances are unchanged.

## Remaining limits

- The external explorer/MetaMask NFT gateway issue remains RSI-124; the original metadata/artwork is intact. No external gateway setting or on-chain URI was changed.
- This audit does not replace independent release/client acceptance, human MFA checks or transaction approval. No new financial UAT allowance is implied.
- The browser viewport override did not take effect in this session; it was reset. Fresh phone-size visual acceptance is not claimed from a desktop screenshot.
- Off-host backup was explicitly deferred by the owner. FP hypervisor outage cause remains unproven without hosting-provider evidence.
- Existing admin data endpoints do not expose authoritative global investor/TVL aggregates. Recent request data stays account-scoped; unavailable or partial totals remain explicit.
