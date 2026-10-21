# First four landing projects — 21 October 2026

The owner requested creation of INFRA Global, INFRA reAED, reID and reMARKETPLACE as platform projects, with live landing-card integration. Sample economics were explicitly authorized. Track this work as RSI-112 in the private Notion project; it remains In progress until publication, sale opening and deployed readback are complete.

## Records and sample economics

| Landing card | Platform project ID | Total value | Fractions | Price per fraction |
| --- | --- | --- | --- | --- |
| INFRA Global | `3995355b-8601-49cb-84bf-06bea42db23e` | 10 USDT | 10,000 | 0.001 USDT / 0.0036 reAED |
| INFRA reAED | `b6604ab7-7557-48f4-a7ca-9c83abe02347` | 10 USDT | 10,000 | 0.001 USDT / 0.0036 reAED |
| reID | `4fe22a83-2b4e-44ee-9bbb-c43168baf465` | 10 USDT | 10,000 | 0.001 USDT / 0.0036 reAED |
| reMARKETPLACE | `1a0b121f-198f-43ab-af16-681559c61dcd` | 10 USDT | 10,000 | 0.001 USDT / 0.0036 reAED |

All four drafts were saved through the authenticated admin under the current staff account. Owner is the shared AWS KMS wallet `0xc1ddc45cbc5f61793ab1eb1999136c4e27347531`; treasury is the existing approved cold wallet `0xcfc93fb43f17f99eaca411be595b727501987e95`. Location identifies **INFRA UAT · Sample valuation**. No production valuation, fabricated revenue, yield, purchase, mint or financial event was created.

## Public artwork and metadata

Original Figma assets remain unchanged in Git. Three files with `.png` names actually contain JPEG bytes; public upload correctly refused the mismatched MIME type. Private upload copies use the correct `.jpg` extension with byte-for-byte identical content. The PNG source uses `.png`. The existing backend sanitizes these originals to WebP and pins them through the durable media workflow; validation was not relaxed.

Project images are the first four original landing assets: `20-10175-3ed60.png`, `20-10176-b2e5d.png`, `20-10177-0c6b9.png`, `20-10178-01dc6.png`. Public metadata includes name, description, UAT location, exact atomic economics, 3.6 conversion, project ID, revision and image CID.

The reID NFT metadata description uses “Digital identity and merchant access for the ecosystem.” The original landing/project description remains unchanged (“merchant passport”); that wording triggers the existing conservative private-document filter when pinning metadata. No privacy filter was disabled or bypassed.

## Pinned public references

| Project | Public image CID | NFT metadata URI |
| --- | --- | --- |
| INFRA Global | `QmNbGXdGao3Xr8GGn3mpSPAcqfjpefWtJhqnYb2SqQc6L5` | `ipfs://QmQ4d2ocWVYMc49BYsM3Ws1AFoHn9cqfTnT7VdhYVPHXUm` |
| INFRA reAED | `QmQRmJYPbpD2v2G3fq3NxBoujbJFJiRRThEX8ZLEk8Rr5y` | `ipfs://QmS4qFGhn5ez73CzNqLXewJ9PQc8bZCXMY9543NLLw2U66` |
| reID | `QmREkE1m9aPnewjpVQ4N9bBnyQqheQ3qYgrN9eGtnVVwfy` | `ipfs://QmQp2d5sUQanPymifBqyL5jSU9QqLMc9hMnfkLRNZRg4Yx` |
| reMARKETPLACE | `QmdWi9UJg4Dmv4A2AJkPRbGqxPXPjz6HRY6Bde5mKv5opQ` | `ipfs://Qmeze189zxNibbk51eTEzg2XLs7jyiaLLjPFqn7VyJGhvA` |

## Frontend behavior

The first four product definitions have explicit platform project IDs. No title-based lookup, first-row guess or draft-list endpoint is used. Only existing public GET `/v1/projects/:id`, `/chain` and `/revenue` are read through the existing allowlisted same-origin BFF. No API contract or backend deployment is needed.

- Published project title, description and confirmed-revision image bind to the original card slots.
- Sold uses actual contract supply/max fractions after network/source/economics/consistency validation.
- Yield pace uses an effective owner-published indicative yield and period; default/unset/future values remain unavailable. It is not guaranteed or derived from sample revenue.
- Revenue/mo is the complete confirmed current UTC calendar-month revenue, displayed as USDT equivalent at the approved fixed 3.6 rate. A stale/incomplete/unavailable series remains a dash. Larger figures stay compact in the designed slot, with the full amount in its title.
- Public project detail links replace calculator anchors only for the four mapped cards. A draft/unavailable record leads to Explore until it becomes publicly published; no draft data is exposed.
- Public reads refresh every minute and on focus. Independent errors immediately suppress stale financial values. The remaining eight authored marketing cards and calculator illustration are unchanged.

All 25 existing class expressions match the previous Products component exactly. No CSS, spacing, typography, colour, image geometry, card hierarchy, category control or other investor screen was changed. Original artwork and descriptions remain in place during unavailable states.

## Verification and remaining actions

Source tests cover explicit project identity, publication eligibility, inconsistent/wrong-network supply, pause/sold-out availability, manually published/future/unset yield, canonical revenue, zero values, stale reads, compact large amounts and real React card rendering/error removal. Initial full suite: 107 passed; lint, TypeScript and production build passed. A first prerender check found an eager clock read in the empty state; it was corrected so static empty cards never read request-time APIs.

Local browser preview at actual desktop 2560 × 1172 and phone 390 × 844 loaded all four original images; phone card width 343 pixels with no horizontal document overflow. All authored classes/CSS were independently compared. These are local unavailable-state checks, not on-chain publication or live financial assertions.

Publication and opening each sale are separate exact staff-MFA transactions, estimated eight transactions total at the currently observed 3 reAED fee (24 reAED). The human must review and approve each action using the shared-wallet UI. Creating/pinning drafts does not authorize an agent to sign, submit, top up or spend. No such transaction has been submitted by this task. Fresh receipts and indexer/public-read acceptance remain pending.

Keep ongoing investor reID QA enabled until the owner asks to close it. Do not close QA to force a server deployment. The frontend-only integration uses the existing Vercel dev deployment path; this account has no direct Vercel access, so actual public deployment is verified separately from the Git push. Existing FP services and signing policies are unchanged.
