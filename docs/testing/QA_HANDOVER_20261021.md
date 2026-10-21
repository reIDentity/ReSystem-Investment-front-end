# reSystem Investment QA handover 21 October 2026

This is the INFRA testnet QA candidate. Use the investor and admin applications below, preserve the approved Figma layouts, and report findings against the exact deployed revision. Production release, independent contract review and privileged custody handover are separate milestones.

## Entry points and access

| Service | URL or network | Access |
| --- | --- | --- |
| Investor | https://re-system-investment-front-end.vercel.app/invest | Personal reID UAT account and its verified wallet |
| Admin | https://admin.resystem.org | Individually approved staff account, password and authenticator |
| API | https://admin.resystem.org/v1 | Application session; restricted operations remain authenticated |
| Explorer | https://uat.scan.infraworld.org | Public read-only |
| Chain | INFRA UAT 15324 | Native reAED; verified USDT has 6 decimals |

Never share the super-admin password, authenticator enrollment key, wallet key or another tester's session. Request separately approved accounts and the required project-scoped role. The private Notion project contains credential references, restricted evidence and the Services register; it is not a public QA credential export.

The owner will provide QA/client staff names, email addresses and roles later. No additional staff account or permission was created for this handover. Investor testers may connect their own reID UAT accounts. Staff invitations, test-recipient approval and any new financial test window remain explicit follow-ups.

## Candidate state

The stable server candidate has completed successful automatic hosted builds, guarded releases and artifact cleanup. Source identity was checked in build inputs, root release receipts and actual containers; a workflow controller SHA alone is not the application version.

| Running service | Source commit | Successful source CI | Successful automatic deployment |
| --- | --- | --- | --- |
| API and worker | [4db55a7](https://github.com/reIDentity/ReSystem-Investment-backend/commit/4db55a731115cef62f36fac8251ccb85d86aea27) | [39560608916](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/39560608916) | [39561715382](https://github.com/reIDentity/ReSystem-Investment-backend/actions/runs/39561715382) |
| Admin | [768e487](https://github.com/reIDentity/ReSystem-Investment-admin/commit/768e4876ccc7898719e16c6cb2bd6945afdce535) | [39561450729](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39561450729) | [39561675635](https://github.com/reIDentity/ReSystem-Investment-admin/actions/runs/39561675635) |
| Indexer | [6f35968](https://github.com/reIDentity/ReSystem-Investment-indexer/commit/6f3596836086b9177fb1c7e21a3e5052a51d80c0) | [39561476480](https://github.com/reIDentity/ReSystem-Investment-indexer/actions/runs/39561476480) | [39561624620](https://github.com/reIDentity/ReSystem-Investment-indexer/actions/runs/39561624620) |

The investor asset repair [3df7fcf](https://github.com/reIDentity/ReSystem-Investment-front-end/commit/3df7fcf022ef64817932a8619a020ed032f909d4) passed [CI 39555892830](https://github.com/reIDentity/ReSystem-Investment-front-end/actions/runs/39555892830), reached the existing Vercel Production deployment and was verified in the signed-in catalogue with both images loaded. Its admin counterpart [fe58070](https://github.com/reIDentity/ReSystem-Investment-admin/commit/fe58070964e51ee493c983573b7f9dc7f790604f) is included in the running admin revision above. Subsequent investor documentation-only commits do not change the application layout or media implementation.

All four server apps retain read-only roots, nonroot users, dropped capabilities and their existing resource limits. Both transaction-request flags remain false and platform signing remains off. There was no new wallet action, schema migration, contract deployment or financial funding during this release.

The final independent read-only audit at 07:37 UTC passed 29 bounded checks, observing those exact sources/images, zero unresolved alerts, zero pending financial/provider requests and unchanged ten backend/four indexer migrations. Original PostgreSQL/Redis identities and application security/caps were directly compared with the initial snapshot. Historical full peer/environment preservation is attested by successful root guard receipts; the original independent snapshot did not retain every historical peer/environment hash. A separate complete snapshot comparison verified the final runner rebind preserved its contemporaneous peers/settings/monitor and backup units. Existing monitoring delivered recovery messages; no deliberate test email was sent today.

The existing investor layout, image geometry, icons and colours are unchanged. Only the public gateway used for a given immutable IPFS CID changes. Private support attachments never use that gateway.

## Deployment operation

`FP_CD_MODE=auto` is enabled in each server repository. A successful own-repository `dev` push CI triggers its hosted image build and repository-specific FP release. No personal Teleport login is required for normal compatible image releases. The three runner accounts have separate private homes and own-service permissions; the combined kernel envelope is 1.5 GiB, no extra swap, half a CPU and 256 tasks. Actual backend process membership was corrected and verified after the independent audit found an old listener outside that envelope.

Hosted preparation and the repository artifact verifier enforce source-CI and same-run artifact identity. The root controller enforces its service/UID, immutable operations and runtime-preservation boundaries; it does not independently authenticate GitHub build attestations. Repository maintainers, reviewed workflows and the FP machine remain trusted. See the [security register](../security/SECURITY_ARCHITECTURE.md).

One global lock serializes app changes. Unique transient units passed two simultaneous harmless own-identity no-op releases. Initial rehearsal failures exposed a backup-name collision, a checkout-name assumption in a test and a shared transient-unit collision; each was fixed before the final successful automatic runs above. Failed rehearsals were not reported as completed deployments.

Schema changes, root operations/policy updates, financial gates, signer activation and contract deployment remain deliberate operator procedures. A failed health/preservation check rolls back and verifies the old release or stops for operator review. Do not bypass a refusal, overwrite an older loaded rollback tag or blindly repeat an uncertain deployment. Stop unreviewed pushes while a client runs a fixed acceptance round, and record the exact version tested.

## Recovery and checks performed today

A transient RPC error had left a paired ingestion/reconciliation incident unresolved after indexing resumed. Protected portfolio and admin aggregate reads correctly stayed unavailable. The indexer repair only acknowledges an exact classified temporary incident after complete bounded reconciliation, fresh canonical proof and an atomic unchanged-incident check. Integrity, reorg, accounting and unclassified alerts remain fail-closed. After deployment, the two incident records resolved through that recovery path; no manual database clearing was used.

Independent read-only reconciliation at 07:26 UTC matched both stored projects, all three holding records, six listings and three proceeds records against canonical block 7,499,633. This does not certify exhaustive historical discovery of external wallets. The investor Home, Earnings and Wallet pages subsequently loaded without data errors; admin Overview displayed actual supply, sales, funded/claimed totals and charts instead of unavailable placeholders. The admin public asset link points to the working gateway. Catalogue images retain the original CIDs and bytes.

Seven strict-TLS anonymous checks confirmed that staff, support and transaction endpoints deny unauthenticated reads. Relevant source checks passed: 102 investor tests, 180 admin tests, and 109 indexer unit tests, ten PostgreSQL groups and two isolated V1/V2 contract lifecycle tests, with the corresponding types/build/lint or format checks. These automated and bounded browser checks support the candidate; the full matrix below still belongs to QA execution. Phone observations cover selected screens, not every device or every Figma frame.

## Test execution rules

- Read-only, navigation, accessibility and authorized account-management checks may proceed on the stable candidate. Use clearly labelled UAT records and avoid changing the client's intended content.
- Wallet transactions require a fresh approved test window, fee/funding bounds and the tester's own exact approval. Previous UAT broadcast allowances are exhausted. Do not enable a gate, deploy contracts, top up a wallet or reuse an expired review just to complete this checklist.
- Before approving, compare chain, signing wallet, receiving wallet, contract, token/asset, atomic amount, quantity, allowance, fee and deadline. Reject unlimited allowances or any discrepancy.
- A provider acknowledgment or transaction hash is not settlement. Require a successful canonical receipt and confirmed indexed state; retain pending/unknown states honestly and reconcile before retrying.
- Use independent accounts for isolation tests. Do not use a query parameter or another account's cookie to select the acting identity.

## Functional test matrix

These are QA test cases, not a claim that each has already passed on the final candidate. Existing automated and historical real-chain evidence is linked through the private task board. Record a result and exact version for each execution.

| Case | Exercise | Expected result |
| --- | --- | --- |
| QA-01 | Public home, investor screens and admin on desktop and phone | Approved layout and branding; no overflow, unreadable controls or broken images |
| QA-02 | Published catalogue versus draft/unpublished project | Only published records are discoverable; restricted draft remains unavailable publicly |
| QA-03 | Connect reID, cancel consent, logout and reconnect | Verified session wallet; honest cancellation; protected data unavailable after logout |
| QA-04 | Staff password, MFA, expired challenge and replay | No privileged session before MFA; expired/replayed codes fail |
| QA-05 | Ordinary publisher versus GLOBAL super-admin | Ordinary staff need independent review; authorized super-admin may publish directly with all other safeguards |
| QA-06 | Scoped staff roles, retry, revocation and concurrent sessions | Fresh permissions govern every action; one grant on safe retry; stale private caches clear |
| QA-07 | Project economics and metadata | Whole fractions, exact divisible pricing and fixed 1 USDT = 3.6 reAED; no floating-point changes |
| QA-08 | Buy and rebuy with native reAED | Exact payment and receipt; same project token ID 1 balance increases only after settlement |
| QA-09 | Limited USDT allowance and purchase | Exact token/spender/allowance; separate purchase approval; no fabricated mint |
| QA-10 | Reject/expire purchase or transfer approval | No success/holding change; old approval links cannot reopen an expired intent |
| QA-11 | Transfer part of a holding, then full exit | Sender decreases and recipient gains the same ERC-1155 token ID and quantity; total issuance unchanged |
| QA-12 | Fund revenue before and after transfer/late purchase | Only issued holdings at each deposit earn that allocation; prior allocated rewards stay with the prior holder |
| QA-13 | Claims per asset, both assets and batch | Only actual funded entitlement is paid to its holder, including after full exit; dust is not redirected |
| QA-14 | Manual indicative yield | Presentation changes do not invent revenue or claimable funds |
| QA-15 | Partial resale, expiry, cancellation and competing fills | Live balance, allowance, remaining quantity and price rechecked; no oversell |
| QA-16 | Revoked marketplace approval, stale indexer and offline RPC | Invalid trade cannot proceed; readable unavailable/retry state rather than invented availability |
| QA-17 | Seller proceeds and primary treasury withdrawals | Exact separate ledgers and authorized recipients; reward reserve cannot fund a primary withdrawal |
| QA-18 | Two investors' Wallet and Deposit pages | Correct session-derived address, decoded QR, asset decimals, real history and explorer links; no cross-account data |
| QA-19 | Deposit refresh and bank/card controls | Refresh never credits an entered amount; bank/card remain disabled with Coming soon |
| QA-20 | Outgoing wallet send, Max, low balance and fee changes | Recipient-specific exact review, gas reserve and stale-quote checks; human approval required |
| QA-21 | Support reply, private image and logout/reconnect | Durable correct conversation; anonymous/other investor image and ticket access denied |
| QA-22 | Notification confirmation, preference save, removal/reconfirmation | Recipient-bound double opt-in, persisted choices, invalid/expired token rejected |
| QA-23 | Admin reports and search/export | Authorized names first, copyable exact IDs, full dates, explicit page bounds and safe CSV |
| QA-24 | Errors, empty history, indexing delay and interrupted refresh | Honest states; committed write distinguished from failed refresh; no duplicate write on retry |
| QA-25 | Keyboard, focus, dialog labels and reduced motion | Usable native controls, visible focus and correctly associated errors without redesign |
| QA-26 | CI release and rollback rehearsal | Exact successful dev CI and verified hosted artifact; one-service update, preserved data/settings/peers, automatic rollback on failed postflight |

## NFT artwork and explorer limitation

The project NFT at `0xfCd8506bd09Ed556bF44788bBDed47533cFA950C`, ID `1`, returns metadata URI `ipfs://QmcUTsFRbyCAnLyCAfdMP536e21mPD9kEd1NQgudr6n1mw`. Its metadata retains the original image `ipfs://QmZN1FFxB9dD8od2BoWQDR9b9cUnV63qCWsvhcthsTsDJz`.

Both files were retrieved through the public Filebase IPFS gateway with their original hashes. The image is a 54,964-byte WebP with SHA-256 `97c1d351bb63de5b2fcbc7c7ebb57fc41a34a2d5ac1fbc87e5c10fb51b5c4500`; metadata SHA-256 is `2cae89c6717177a824df635b90384e03ef1206277d4344e4bfe0db13ce644e14`. Ownership and contract URI were not modified.

The external INFRA explorer currently rewrites that image to a Pinata gateway returning HTTP 403 and displays placeholder artwork. The owner will contact its operator and directed leaving the explorer configuration unchanged. Its operator should verify a working public IPFS gateway and refresh the token metadata/cache. This remains an external QA limitation until the actual explorer renders the artwork; working application images are not proof of explorer completion. Blockscout will not be reinstalled on FP.

## Bug reports and acceptance

For each finding provide case ID, app URL/route, deployed revision, browser/viewport, role, redacted reproduction steps, expected/actual result and timestamp. Include a public transaction hash only when relevant; never include authentication codes, cookies, credentials, raw signing payload secrets or private attachment contents in public GitHub issues.

Separate fund/accounting, authorization and privacy defects from cosmetic issues. Stop financial testing and reconcile any uncertain transaction before another attempt. Record unavailable upstream services and operator dependencies as limitations rather than silently bypassing checks.

QA handover requires an exact release register, appropriate individual access and this checklist with known limitations. Client acceptance, independent review, production rotation and privileged production handover remain separate approvals. Off-host backup storage is owner-deferred; the same-host watchdog does not prove complete-host-loss detection.
