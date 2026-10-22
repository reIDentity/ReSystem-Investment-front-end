# Investor performance —22October2026

## Measured baseline

The owner reports Activity paging and general investor sluggishness. One live CUA uncached page transition took531ms from click to the matching rendered range; Home navigation to its heading took736ms. Tool timing includes browser-control overhead and is not a universal latency guarantee. Three existing-account Activity reads inside FP took17/8/7ms for pages1/2/3,10 rows each out of61. This is a small live read benchmark, not a load/capacity test. Public FP/API and Vercel-BFF reads were approximately0.5–0.8s including client TLS/network time.

Live computed styles also confirmed a200ms delay plus500ms fade for recommendation rows. Table rows had200–400ms stagger plus500ms fade; page/card arrivals could wait an additional120–400ms. These artificial delays compound the network wait. Background Activity revalidation disabled every page control, while a cold key cleared all rows/metadata and collapsed the table.

## Changes

- Activity preloads up to two next pages and the previous page at the exact server-confirmed snapshot. Hover/focus can warm a specific page/filter. The first response seeds its equivalent anchored first-page key, avoiding a duplicate fetch when returning with Previous.
- Real existing rows and their original range stay visible and gently dim during an uncached same-filter page request. Data from a different filter is never shown as the new filter. Errors still hide stale rows/totals. Background refreshes do not disable navigation; only a pending uncached request does.
- Shared investor link hover/focus warms a bounded read-only plan for Home, Explore, earnings, Wallet, Activity, Support, Notifications, Deposit and product details. Normal Next route prefetch is enabled on the six primary navigation links. No quotes, transaction creation/submission, auth action or external link is speculative.
- Each signed-in provider owns its own preloader and SWR store. Two global-to-that-provider warm workers and at most eight queued/in-flight warm paths bound background work. Identical intents are deduplicated. The first mounted request can join a pending prefetch; an explicit subsequent refresh always makes a fresh read. A newer read prevents a late prefetch overwriting its data. No completed-result or error cache is added to the loader.
- Server-validated session JSON seeds hydration, reusing the existing React per-request session read. This removes the immediate duplicate browser session request. Backend authorization, per-request server checks,60s/focus session refresh, mutation CSRF preflight and401 invalidation remain. Both investor ID and wallet must match. Invalidating a session discards late speculative/normal results and its queued work. Private data is not shared across users, persisted to browser storage or stored in a public HTTP cache.
- Closed Transaction approvals history keeps its initial count but stops the10s periodic poll. Expanding refreshes it and resumes that interval; closing stops the interval. The active approval dialog's reconciliation/polling remains unchanged.
- Confirmed list/table rows appear immediately without replayed entrance fades. Page/card arrivals use160ms without stagger. Static Figma geometry, typography, colours, images and the hover/press/chart/reduced-motion treatments are preserved. Financial amounts are never tweened or invented.

## Verification and release

Local142 application tests, TypeScript, lint, production build and diff checks pass. Real-SWR tests cover pending row retention, background controls, correct filter boundaries, server session hydration, same-wallet/different-user invalidation and late responses against the actual scoped cache. Transport/loader tests cover concurrency, queue bounds, deduplication, forced-refresh freshness, errors and session isolation. The test harness now uses the same SWR module context as the production components, and asserts private cache presence before testing its deletion.

Source publication, CI, Vercel and live desktop/phone measurements remain separate milestones. Final source/runtime and before/after observations will be recorded here and in the private RSI-120 task. No backend/schema/signer change, FP restart, QA gate pause, signature, wallet approval or financial action is required for this frontend release. Ongoing QA stays enabled.
