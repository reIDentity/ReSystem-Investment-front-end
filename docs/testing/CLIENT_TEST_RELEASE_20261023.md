# Client test release — 23 October 2026

**Superseded for current runtime and contract addresses by QA-UAT-2026-10-29.** Read `START_HERE.md` and backend `docs/UAT_RESTORATION_20261029.md`. The October23 checks below remain historical evidence; its old-chain registry and deployment snapshot are not the current test target.

Release ID: **CLIENT-UAT-2026-10-23**. This is the stable INFRA UAT candidate for client testing. It supersedes the operating instructions in the 21 October handover. Production approval and the client's acceptance result remain separate.

## Open the applications

- Investor: https://re-system-investment-front-end.vercel.app/invest
- Admin: https://admin.resystem.org
- Public catalogue: https://re-system-investment-front-end.vercel.app
- Explorer: https://uat.scan.infraworld.org

Investors use their own reID UAT account. Staff use their individual username, password and authenticator. Credentials are supplied privately; they are not included in this document. An admin never connects a personal wallet: authorized actions use the shared AWS KMS wallet, with a fresh authenticator approval of the exact transaction.

The QA investor request window remains enabled. Staff permissions, shared-wallet signing policies and current funding limits are unchanged. A test case is not permission for an agent to spend funds or broadcast transactions.

## Exact application versions

| Component | Source revision / identity |
| --- | --- |
| Investor application | `6274452876a44d3a13e40a502401f066ebd911fb` plus documentation-only release commits |
| API and worker | `8924944716f4e5bb960c9303b0b8362ee1e601ce` |
| Admin | `f954ad0e8f78f0c31e02205d6dca69c5558aa7bc` |
| Indexer | `6f3596836086b9177fb1c7e21a3e5052a51d80c0` |
| Isolated shared signer | Existing `e950fd91f403b84ba7e68e7957b57a96843d3a41`, unchanged |
| Deployed V1 contract artifact source | `1eee1442c83ee037ee1564d0d3da64d36c370e76`; no contract replacement |

API/worker image: `sha256:19bd6de624855524d25c3baab6d3dab7ee0cafbdc2ff95adb6a020493508d814`.
Admin image: `sha256:65726c9c771d86bb6b1878036d2e2c51a1b2381f05a8e979e751946e4744a792`.

The [audit report](PLATFORM_AUDIT_20261023.md) contains source CI, hosted build, guarded release and live browser evidence. The server's controller was read again during this handover: these API/admin/indexer revisions remain deployed, API/indexer are healthy and the investor gate is open. Documentation and local test-runner fixes do not constitute another FP rollout.

Additional local acceptance on 23 October passed five publication groups, 27 financial lifecycle transactions, eight staff/security groups and 27 isolation-policy tests. A controlled restart preserved all 29 indexed publication/sale/financial receipts and project state. The cold staff test-runner assumption was corrected; both disposable stacks were stopped and all their service ports closed. See the backend [isolated acceptance record](https://github.com/reIDentity/ReSystem-Investment-backend/blob/ae614a832411becaaa7e0e0c347d6965e80c9b0a/docs/LOCAL_SYNTHETIC_ACCEPTANCE.md) for exact scope and separate remaining checks. These tests used synthetic identities/provider/mail and local Anvil; they spent no real UAT funds.

Source verification: backend [CI39918501108](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/39918501108) and investor [CI39918921938](https://github.com/reIDentity/ReSystem-Investment-front-end/actions/runs/39918921938) passed; Vercel completed the documentation-only guide release. The unnecessary automatic image-build run39919676267 for the backend test/document change was canceled before its FP release job. This was an intentional candidate-preservation action, not a failed source check or a new deployment.

## Investor test route

| Step | Check | Expected result |
| --- | --- | --- |
| 1 | Sign in with reID; open Home | Your own wallet and holdings, project artwork and readable names; no invented revenue |
| 2 | Explore the four published landing projects | INFRA Global, INFRA reAED, reID and reMARKETPLACE open their real project pages; UAT sample valuations remain clearly identified |
| 3 | Change the share count and payment asset | Total updates immediately; review waits for a matching fresh quote; insufficient gas or funds has actionable guidance |
| 4 | Review a purchase, reject it or let it expire | No successful purchase is reported; an expired unsigned review needs a fresh review |
| 5 | Personally approve an authorized purchase | Track approval, broadcast, confirmation and indexing in Activity; do not repeat an uncertain request |
| 6 | Wallet and Deposit | Correct wallet, asset and network; only five recent deposits; See more opens the Deposits filter |
| 7 | Activity filters and page numbers | Correct totals/ranges and named projects; previous rows remain usable during refresh; deposits/withdrawals are not mixed by client filtering |
| 8 | Earnings, transfers and marketplace | Exact held quantities and funded entitlements; each financial action has its own fresh review and user approval |
| 9 | Notifications | Mark all as read works across pages; reID email appears connected without another confirmation email; category preferences remain effective |
| 10 | Support | Getting-started instructions, private conversations and permitted attachments; failures distinguish an unsent message from a saved message awaiting refresh |
| 11 | Logout and sign in as another investor | Private cached balances, tickets and notifications from the first investor never appear for the second |
| 12 | Keyboard, phone and reduced motion | Visible focus, usable controls, readable errors and no unintended document overflow; report device and viewport |

A confirmed chain transaction can precede the indexer's updated holdings. The UI must describe that delay rather than invent a completed balance. Depositing to a wallet does not itself buy shares. An ERC-1155 partial transfer changes balances of the same project token ID; it does not create a different NFT collection.

## Admin test route

| Step | Check | Expected result |
| --- | --- | --- |
| 1 | Password and MFA login | Individual staff identity and current permissions; no privileged access before MFA |
| 2 | Overview and Refresh | Current health, queues, named requests, published supply/price/sale state, indexed primary proceeds and reward reserves |
| 3 | Expand detailed charts | Histories load on demand; missing or incomplete data is explicitly unavailable, not zero |
| 4 | Open a project and its draft | Shared owner is read-only, cold treasury policy is separate; published and draft records are distinguishable |
| 5 | Prepare revenue funding | Funding reference is automatic; optional report fingerprint is computed locally; no manual bytes32 input |
| 6 | Review an authorized administrative transaction | Correct shared wallet, chain, destination, value, fee and expiry; fresh authenticator approval; no third-party wallet connection |
| 7 | Reports, support and scoped staff | Readable names, exact IDs available when needed, authorized data only; private attachments never become public catalogue assets |
| 8 | Refresh failure or expired session | An honest retry/sign-in state; cached success or health does not hide the failure |

Overview request history is account-scoped. It is not a global investor ledger or global TVL total. Those aggregates are not exposed authoritatively by the existing endpoints, so the interface does not manufacture them.

## Known limits and release boundaries

- External explorer/MetaMask artwork remains an operator gateway/cache issue under RSI-124. Project metadata and artwork are intact and app images load. The owner elected to contact the explorer operator. V1 collections also lack optional collection-level `name()`/`symbol()` methods; no remint or contract replacement is part of this release.
- Fresh full phone/Figma/accessibility acceptance remains a QA case. Earlier 390-pixel route checks and 22 October targeted phone checks are recorded, but today's browser viewport override did not take effect. Desktop evidence is not relabelled as phone evidence.
- Existing bounded scale tests and real UAT receipt/latency observations are evidence for their measured workloads, not an unlimited capacity guarantee. Indexer retained-history growth needs a separate capacity decision before production scale.
- Independent contract/security review, production network/custody acceptance and client sign-off remain open. V2 is tested locally only; no V2 deployment to INFRA is approved here.
- Off-host backups are owner-deferred. The same-host watchdog cannot detect complete FP host loss, and the previous hypervisor outage cause is unproven without provider evidence.

## Keep this candidate stable

Record this release ID with every finding. Do not merge or roll out unrelated changes during the client's test round. Server deployment workflows defer while QA is open; they must not silently close it. The investor Vercel project follows its `dev` branch, so any subsequent investor push must be treated as a candidate change even if it contains only documentation. A hotfix gets a new recorded revision and a focused recheck before QA resumes against it.

For a bug, capture the route, browser/device, role, time, expected/actual result and redacted reproduction steps. Include a public transaction hash only when relevant. Never include cookies, passwords, authenticator codes, wallet keys or private attachment contents in a public issue. Report any uncertain financial outcome before retrying it.

Client acceptance should record pass/fail for the routes above and its own approver/date. Engineering verification does not fill in the client's sign-off.
