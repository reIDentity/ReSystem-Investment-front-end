# Investor integration — API 0.1.0

Implementation evidence for RSI-078–093. This is source and local verification evidence, not a claim that live investor UAT is complete. Task tracker updates and GitHub commit links are reconciled by the platform coordinator under the repository's Notion workflow. No task is marked Done by this document.

## Runtime boundary

Set server-only `PLATFORM_API_BASE` to the approved backend (the local QA target is `http://127.0.0.1:3005/v1`) and `PLATFORM_APP_ORIGIN` to the exact browser origin (`https://localhost:3002` locally). `REID_APP_URL` identifies the trusted approval origin. Runtime credentials belong in protected environment injection. Do not add a `NEXT_PUBLIC_` API credential or put reID tokens in the browser.

When the API base is configured, the backend owns OAuth exchange, investor sessions, CSRF, authorization, wallet verification, canonical calldata and transaction state. The existing `/api/auth/reid/start` and callback delegate to it. Start canonicalizes the browser host before setting OAuth cookies. The Next proxy leaves live authorization to the server session read and authenticated layout; a legacy frontend cookie grants no live access. Client session refresh also blocks expired, changed-wallet and staff sessions. The previous encrypted-cookie login remains a clearly labelled read-only fallback only when the platform API is unconfigured. The original actual-chain deposit fallback remains available in that mode.

`/api/platform/[...path]` is a fixed upstream BFF. It rejects unsafe requests from any other Origin before setting the configured upstream Origin. Only investor route/method pairs, platform cookies, CSRF and idempotency headers cross the boundary. There is no arbitrary destination URL, staff/admin passthrough or Authorization-header forwarding. Request query/body/cookie and response sizes are bounded; upstream calls time out. Redirects are manual and restricted to the configured app and reID origins. Backend cookies retain HttpOnly/SameSite, lose foreign Domain attributes, use Path=/ and gain Secure on HTTPS. Responses and fetches are private/no-store. Next 16 Cache Components route handlers use request APIs and the default Node runtime, without incompatible legacy route configuration.

## Versioned API

The independent backend's generated OpenAPI/types are vendored, without cross-repository runtime imports:

- `artifacts/platform/openapi.json`
- `artifacts/platform/api-manifest.json`
- `src/lib/platform/api.generated.ts`

API version: `0.1.0`. The exact schema digest is in the committed `artifacts/platform/api-manifest.json`; the pin test verifies schema bytes, manifest and generated-client header agree. The current generated snapshot comes from backend source `b48eadf` (dev), which adds the investor email-notification endpoints (`email-notifications`, `email-notifications/verification`); the change is purely additive. Investor session and transaction response contracts remain compatible. The BFF allows only `GET`/`PATCH`/`DELETE email-notifications` and `POST email-notifications/verification`; the emailed confirmation link opens the backend-hosted page and is never proxied. The frontend uses generated session, command, wallet, transaction and durable support/notification types. Read shapes not yet described by the backend generator are explicitly typed locally.

## Financial state and privacy

Payment input, atomic conversions, balances, costs, quantities and formatted output use decimal strings and BigInt. Native reAED has 18 decimals; verified USDT has 6. The backend transaction-submit gate remains disabled until the upstream provider approval-race and subject-isolation fixes are deployed and verified. Canonical preparation does not imply submission is enabled. The backend checks live balance, gas reserve, allowance, registration and contract state before preparing immutable canonical calldata. The transaction dialog shows the frozen prepared asset amount, recipient/spender, native value and estimated fee, and requires a separate button to request reID approval. USDT spending cannot become approvable without the frozen exact review amount. Only the backend-returned, origin-validated approval URL is opened.

Preparation retains a cryptographic idempotency key when retried. Rejected, expired, failed, broadcast and reconciliation-required intents remain distinct from successful settlement. Confirmation requires a successful receipt whose transaction hash matches the intent. Displayed holdings and money are refreshed from real reads after confirmation; there is no optimistic balance mutation. Closing a dialog preserves the backend intent, accessible from Activity. There is no automatic replacement transaction after an uncertain provider response.

Wallet funds, h/N project entitlement, h/S participation in a new revenue allocation, already allocated rewards and resale proceeds are shown separately. Historical holders keep claim access. Revenue references and receipts are real indexer records. History indicates partial/pending backfill. Neither transfers nor resale offer principal redemption. Send Max is intentionally unavailable until the backend exposes a safe exact gas-reserve quote. Manual amounts are checked during preparation.

The authenticated app has no DemoProvider, localStorage/sessionStorage money or invented completed actions. Existing public-home concepts, the calculator and illustrative diagrams are labelled as illustrative; live counters and fabricated yield/revenue/sold claims were removed. Illustrative calculator arithmetic is not used for any transaction or portfolio value.

Session cookies and reID tokens are never exposed in rendered props. Only the minimal investor identity reaches its scoped in-memory SWR cache, which is recreated per user. The frontend does not log identity, support text, tokens or transaction approval responses. Development request logging excludes OAuth start/callback routes, and browser/server-function argument forwarding is disabled. Production ingress logging must apply the same callback-query redaction. Public images/PDFs are loaded only from CID-based public project media, with no arbitrary HTML rendering. On-chain wallet addresses, amounts and transaction activity, as well as IPFS project metadata/documents, are public. Do not put investor identity, credentials, support attachments or other private information in project metadata or public storage. Support attachments are unavailable pending a protected upload/download service; no public-storage workaround is offered.

## Task evidence and remaining acceptance work

| Task | Implemented behavior | Remaining acceptance evidence |
| --- | --- | --- |
| RSI-078 | Generated API pin; authoritative backend session; legacy-cookie rejection; scoped cache; loading, empty, error, reconnect states; DemoProvider removed. | Real investor reID login/refresh/logout after backend UAT client configuration. |
| RSI-079 | Published-only catalogue, actual CID media/prices, live remaining supply, page search/cursors and labelled owner-entered yield; public home concept labels. | Confirmed project discovery versus unpublished draft using actual publication/indexing. |
| RSI-080 | Actual project record, total value, N/S/remaining, dual-asset quote, contract, metadata/PDFs and funding references; h/N and h/S separated. | Reconcile a deployed published project's displayed economics, documents and funding to chain reads. |
| RSI-081 | Native/USDT buy/rebuy, exact approval, live quote, canonical preparation, explicit approval and truthful receipt/indexing/rejection states. | Approve both asset purchases and repeated buys with a real investor; reconcile charge, supply and retained historical rewards. |
| RSI-082 | Actual holdings, native/token balances, per-asset claimable totals, recent confirmed activity and provenance. Cost basis is explicitly unavailable, not an invented cash value. | Reconcile populated and empty portfolios on desktop/phone with live chain/indexer data. |
| RSI-083 | Whole-quantity unrestricted valid-wallet transfer, exact balance check and explicit irreversible action review; historical reward semantics. | Actual 10-of-1000 transfer showing 990/10 plus rejection/insufficient-balance UAT. |
| RSI-084 | Claimed/claimable per asset, previous-holder rows, real funding history, single/two-asset/up-to-20-project claim actions. | Real historical-holder claim after full transfer and duplicate/rejected/failed claim checks. |
| RSI-085 | Actual native/verified-USDT balances and ERC-1155 fractions with chain/address provenance; no spoof-token list. | Reconcile both assets and gas insufficiency against independent wallet/chain reads. |
| RSI-086 | Session-scoped deposit address, matching-wallet PNG QR and actual exact incoming rows/cursors; bank/card disabled Coming soon; refresh never credits money. | Independently decode QR for two real investor accounts and compare their isolated histories. |
| RSI-087 | Exact native/USDT sends, valid recipient, canonical gas-reserve/fee review and receipt tracking; distinct from claims/resale. | Actual approved sends/rejections; safe Max remains unavailable because no safe-Max API exists. |
| RSI-088 | Live availability/expiry/prices, cursors, partial-fill quote, exact USDT approval and durable fill status. | Real partial fill and competing fill/revoked/expired listing UAT. |
| RSI-089 | ERC-1155 operator approval, quantity/price/asset/expiry listing, cancellation, live remaining quantity and separate proceeds collection. | Real 1000-unit multipart fill/cancel/proceeds lifecycle; direct-transfer/revocation reconciliation. Activity exposes indexed fill history. |
| RSI-090 | Actual confirmed chain activity and durable intents, current-page filters/cursors, exact amounts/times and explorer links; partial history disclosed. | Live event replay/reload and populated transaction lifecycle browser checks. Replay deduplication is the backend/indexer boundary. |
| RSI-091 | Durable private tickets, staff replies/status, reply-to-reopen, validation and access-denied/retry states. | Two-investor ownership denial/persistence/staff-response UAT. Protected attachments are not implemented by the backend and remain explicitly unavailable. |
| RSI-092 | Paginated actual notifications, persisted read actions/preferences and constrained intent/ticket destinations; no sample earnings alerts. Preference saves send only `transactionUpdates`/`supportUpdates`, so the backend no longer rejects the request because it includes `userId`. When the operator enables email delivery, a double-opt-in Email block shows a masked address, confirmation requests and per-category email toggles. | Trigger real trade/claim/support notifications and verify reload/read/dedup behavior. |
| RSI-093 | Existing blue brand/assets/home and responsive layouts retained; labelled forms, native focus-trapping dialogs, keyboard close, polite status/errors, wrapping addresses/tables and reduced motion. Unsupported financial claims removed. | Complete authenticated desktop/phone browser audit for all designed flows after real investor sign-in; no full-flow visual completion claim yet. |

## Checks performed

- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities reported.
- `npm run lint`: passed.
- `npx tsc --noEmit --incremental false`: passed.
- `npm test`: 22 passed (baseline auth/deposit plus BFF Origin/cookie/redirect/path/size/outage controls, exact amounts, quantity limits, approval URL checks, transaction evidence/state checks and generated-schema pin).
- `npm run build`: production compilation, TypeScript and prerendering passed with Next 16.4.1; BFF is dynamic, authenticated screens stream request-scoped content. A previous cached sandbox CSS-worker failure was resolved by moving the disposable `.next` build cache out before rebuilding; no application workaround was introduced.
- `npm run test:auth` against local HTTPS3002 and backend3005 in live mode: 5 passed, 3 legacy-only tests skipped. Checks cover missing/forged sessions, a valid legacy frontend cookie being unable to replace backend identity, secure anonymous CSRF cookie, hostile Origin, blocked admin paths and identity-query attempts on private wallet/deposit/support reads. No backend investor identity, staff cookie or wallet approval was fabricated for these checks.
- Runtime requests: anonymous session 200 with `authenticated:false`, wallet 401, hostile-origin mutation 403, admin passthrough 404; protected page streams the Next redirect and contains no private wallet UI; home and sign-in return 200. No assets were transferred and no contract was deployed by this frontend work.
- `.github/workflows/ci.yml` runs lint, unit/schema-pin tests, TypeScript and a production build without secrets or deployment. Its first hosted run remains pending publication.
- React best-practices review: independent reads run through deduplicated SWR, cache is scoped per user, hooks remain unconditional, minimal server session data is serialized, the shared asset selector avoids importing the whole project-detail module, explicit event handlers own mutations, and modal labels/focus/reduced-motion behavior are preserved.

Real reID transaction consent and funded testnet lifecycle checks require the user's explicit wallet approvals. These remain UAT gates, not software-test successes. Independent security review/audit and production operational readiness are outside this local verification.
