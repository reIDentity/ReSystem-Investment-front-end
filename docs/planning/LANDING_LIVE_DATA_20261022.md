# Landing page: published data instead of sample finance

Date: 22 October 2026. Task: RSI-079. Investor repository only.

The owner requested removal of all dummy data from the public landing page. Its approved Figma composition, branding, artwork, typography, spacing and CSS remain the presentation contract. This is a data/action correction, not a redesign. Earlier dated implementation documents remain historical evidence.

## Data and behavior

One shared public snapshot drives the page. It loads every page of the published catalogue (up to 10 pages of 50), then reads each project's existing public `chain` and `revenue` endpoints with three workers/six simultaneous requests. Reads use the investor application's existing platform proxy, omit cookies, follow no redirects and carry no staff/investor credentials. The whole operation has a 30-second deadline; individual reads have 10 seconds and a streamed 2 MiB response cap. No backend, contract, indexer, AWS or FP configuration change is required.

SWR refreshes every 60 seconds and on focus. A failed catalogue refresh hides previous figures; a two-minute expiry also hides them if refresh stops. A failed project read suppresses its dependent values independently. Missing data is shown as a dash or an honest empty/error state, never a sample or fabricated zero. The public catalogue includes real UAT projects and their approved on-chain sample valuations; these are actual deployed records, not frontend fixtures.

| Existing section | New source / action |
| --- | --- |
| Hero perks, CTA and comparison minimum | Cheapest one-fraction USDT price among verified open published projects |
| Hero finance and allocation tiles | Explicit registered project ID, confirmed publication identity and matching live supply/prices; equal 1%-of-maximum cells |
| Hero revenue / claim chips | Confirmed aggregate revenue today / actual total holder claims; no personal investor names or invented claim activity |
| Main statistics | Open project count, funded revenue over trailing 30 days, issued / maximum fractions, minimum current price |
| Product cards and categories | Entire published catalogue; actual title, description, content-addressed artwork and corresponding detail link; only known exact-ID brand mappings supply artwork/category fallbacks |
| Money-flow feed | Complete verified public revenue funding records, actual amounts/assets and real transaction/block links; no timer-generated events or relative times |
| Pool and payout chart | Actual funded, claimed and unclaimed ledgers, checked independently for both reAED and USDT |
| Revenue breakdown and small charts | Actual per-project funding totals and canonical daily revenue series |
| Calculator | Open published projects, exact whole-fraction quantity, current unit price, remaining primary supply and quantity / maximum-supply ownership |
| Calculator revenue slots / bars | Historical project funding over 30 days and all time, plus 12 actual daily bars; never future earnings assigned to a new buyer |
| FAQ / explanatory copy | One-fraction minimum, funded allocation rules, retained historical rewards and resale requiring a willing buyer |
| Footer | Removed regulatory placeholder, retained supplied legal/ecosystem URLs; unspecified social destinations are visibly unchanged icons with disabled/labelled behavior rather than fake links |

Unknown project categories are labelled “Project”, not guessed from titles. The four registered branded projects retain their original order; later published projects are also discoverable. Long published descriptions and calculator titles stay within their original slots, with full text available by title/detail link. Fractionaire artwork retains its approved original green brand, but finance remains unavailable and its status is “Not listed” because no matching project is published. It never borrows another project's numbers.

## Verification rules

- Published record requires exact ID, PUBLISHED state, nonzero contract, publication transaction/block and valid atomic economics.
- Supply requires INFRA 15324/RPC provenance, head at/after publication, matching maximum/value/unit price and issued + remaining = maximum.
- Revenue series requires the identified confirmed canonical block/hash, UTC, complete consecutive 14-day data and exact accumulator totals. Stale (>5 minutes), future or previous-UTC-day anchors are unavailable.
- Both reward ledgers require funded = claimed + reserve and correct decimals. Calendar revenue cannot exceed total funding.
- Funding-record counts/latest links require bounded valid records whose per-asset sums equal funded totals. A truncated or corrupt history cannot invent completeness/counts.
- Aggregate finance requires complete dependent project reads. Independent known project values can remain visible when another project is unavailable.
- Monetary arithmetic stays in atomic-unit BigInt until formatting; fixed conversion is the approved 1 USDT = 3.6 reAED. USDT prices retain their exact fractional precision. Display-only combined amounts are USDT/USD equivalents, not a swap quote.
- Owner-entered indicative yield is shown only with an effective on-chain period, clearly labelled and never calculated into a guaranteed projection.

## Local evidence

Initial live read: six public published projects, all sales open. Aggregate supply 1,227 / 60,000 (2.04% displayed); minimum 0.001 USDT; 7.596 reAED + 1.1 USDT funded and claimed (3.21 equivalent displayed); reserve zero; four canonical funding records. Values can change during ongoing QA and are not hard-coded in source.

122 tests pass, including exact pricing/ownership, publication/pagination rejection, bounded read concurrency, stale/partial/empty data, truncated histories, streamed response limits, anonymous public transport, production React renders, calculator project/quantity/preset/supply changes, and failed/expired shared snapshots. Lint, TypeScript, production build, full-history secret and dependency checks are also required before publication.

The original Figma node classes and asset references are identical for all 233 Fractionaire, 230 INFRA and 233 reID nodes. Only data text, semantic links, inline financial cell fills and real chart values change. Original CSS/assets are unchanged. Phone/desktop browser verification and deployment evidence are recorded below after completion.

## Scope boundaries

No wallet transaction, top-up, signature, financial review, contract deployment, email send, new staff access or server restart was requested or performed. The ongoing QA reID request gate stays enabled. No Vercel credentials/account changes are needed. The external explorer's operator-owned IPFS gateway issue remains separate and unchanged.

## Publication and deployed acceptance

Pending final published commit, CI/Vercel status and final hosted browser verification. RSI-079 remains In progress until those checks complete.

### CI network resilience

The first GitHub run, 39738471946, and its retry stopped inside the dependency-audit command after 180 seconds. Application checks had already passed locally, and Vercel deployed the page successfully. A follow-up makes npm fetch timeouts explicit (20 seconds, one HTTP retry), retries a timed-out audit command once with a 90-second command deadline, and avoids npm ci's redundant install-time audit. The explicit production and full development audits still run, validate complete fresh reports and retain their original vulnerability thresholds, exact expiring exceptions and fail-closed behavior. No security policy or scanner exclusion changed. All 14 CI helper regressions and the complete local dependency gate pass. The funding-record mini-chart also uses actual cumulative record counts rather than monetary revenue bars under a count label.
