# First four landing projects — 21 October 2026

The owner requested creation of INFRA Global, INFRA reAED, reID and reMARKETPLACE as platform projects, with live landing-card integration. Sample economics were explicitly authorized. Track this work as RSI-112 in the private Notion project; publication, sale opening and deployed readback are now complete.

## Completed publication and deployed acceptance — 21 October 2026

**RSI-112 is complete.** All four projects are Published, registered in the approved factory and open for primary purchases on INFRA UAT **15324**. The owner personally approved all eight exact publication/sale-opening reviews with fresh authenticator codes; the agent did not approve these actions. Independent read-only RPC checks verify successful canonical receipts beyond the configured 12-block confirmation boundary, exact signer/target/value/calldata, ERC-1155 support, approved implementation, shared owner, unchanged cold treasury and exact metadata/economics.

| Project | Confirmed contract | Publication receipt / block | Open-sale receipt / block |
| --- | --- | --- | --- |
| INFRA Global | `0xaaaafe8a634210f5bd1be51cd6e35b01de5798e0` | [Publication](https://uat.scan.infraworld.org/tx/0xad8c9104200644e0f7168424506d65adc9e5e4ce29f001eb30a52928f593e10d) · 7511706 | [Open sale](https://uat.scan.infraworld.org/tx/0x2a5cf2eb0c30d7577d4a75180447f2ccbb6fcf32344f1f0e65044fb63b715424) · 7511840 |
| INFRA reAED | `0xbd2c466de091ad0368a68007908823fd362f7887` | [Publication](https://uat.scan.infraworld.org/tx/0x1f31285d6d27192f0222796e467a537f252fcea34a62b58bbddcdc928e076694) · 7511997 | [Open sale](https://uat.scan.infraworld.org/tx/0x3eec95988490cf9ee99c8b2c89acfeadda87ee14dd02e499b6769515e405da89) · 7512076 |
| reID | `0x6648e9bd925f41b9491824a5e57cf97e17ffc771` | [Publication](https://uat.scan.infraworld.org/tx/0x7d643d7602cf1a30134d91a7412a05c2ef1305b92c08daff0feac6589d65f62e) · 7512136 | [Open sale](https://uat.scan.infraworld.org/tx/0x631b5e0f1c101c8ac3e0c2e4588de0ca9d5bdc5cc45568fbb3a6c85d89439c4e) · 7512268 |
| reMARKETPLACE | `0x8f0dd8f70fb984fe0594c42e4a3cee7ccb8b7a23` | [Publication](https://uat.scan.infraworld.org/tx/0x0b5c3803215f27550d0a2427278a5650253770737fef061b329fb2f3683dc48f) · 7512300 | [Open sale](https://uat.scan.infraworld.org/tx/0x28a96a2cba8cc508e42542f533c21886b7cdf23384cd59cf4f02cab0bd13eba7) · 7512433 |

Factory: `0x2dbd7500cc9899c9a5bba6c96f09c086502c5661`; approved version-1 implementation: `0x67dce4b528ebce9cccda642de68d0d2e8fef901e`. Each project's `uri(1)` matches its pinned metadata below. Publishing and opening a sale do not mint investor fractions: at acceptance, all four have **0 issued / 10,000 available**, **$0.00 confirmed revenue this UTC calendar month**, and **no owner-published yield**. These are observed values, not seeded fixtures.

At **14:33:24 UTC**, anonymous public project, chain, complete revenue and exact native/USDT quote reads succeeded for all four projects. One fraction quotes exactly **1,000 USDT atomic units** or **3,600,000,000,000,000 reAED wei**. Private staff/admin fields are absent. All four metadata documents and WebP artwork returned HTTP 200 with the reviewed identities/CIDs. The earlier INFRA Global gateway timeout recovered without changing the CID or weakening validation.

The actual [deployed landing page](https://re-system-investment-front-end.vercel.app/#where) loads all four public images, correct project-specific links and real statistics. Desktop 2560 × 1172 and phone 390 × 844 were checked after publication; phone cards are 343 pixels wide, document width 375, with no horizontal overflow. The admin project portfolio independently shows all four Published with their names, sample valuations and issued supply. Existing card classes/CSS are unchanged. Implementation [ec20272](https://github.com/reIDentity/ReSystem-Investment-front-end/commit/ec2027234a2d56ca2e45d2257711989f057fe3d9) has [successful CI](https://github.com/reIDentity/ReSystem-Investment-front-end/actions/runs/39614120989), **107 tests**, lint, TypeScript, production build and full-history secret scanning passed. No backend API contract or server deployment was required.

The reID published metadata uses “merchant access”; the approved original artwork and authored fallback description (“merchant passport”) remain in source. The live card uses the published public description. The conservative metadata privacy validator remains enabled.

### Exact gas funding and remaining authority

The eight human-approved admin actions used **24 reAED** in observed fees. Following the owner's specific “use deployer wallet for funds” response to the exact 9 reAED proposal, the agent submitted **one** native top-up of **9 reAED**, plus **3 reAED** fee, from the existing deployer to the shared admin wallet: [confirmed top-up](https://uat.scan.infraworld.org/tx/0xda8c14d7735641d3beb899512cbdac983a4dd1d478669cadc23a81aee4eeec34), block **7511911**, nonce **243**. A receipt-wait helper failed after broadcast; the same hash was reconciled independently and never rebroadcast. The separate 12 reAED gross top-up allowance is consumed. Shared-wallet balance after the final action was **6 reAED**. Raw signed data and keys remain only in protected local/runtime storage, outside Git and this document.

No additional agent spending, investor transaction, revenue deposit, mint or V2 deployment is authorized by this completion. Keep the owner's ongoing investor QA request window enabled until explicitly asked to close it; each investor still approves their own transaction. AWS holds only the key; FP continues to host all services. The external explorer's image-gateway configuration remains its operator's responsibility, as previously requested; this task verifies correct on-chain metadata and publicly available artwork, not an explorer-operator change.

Local preview server 3082 was stopped with no listener retained. Read-only acceptance reports and screenshots are retained locally in the protected `.runtime/landing-projects-20261021/` folder; they are separate from public source and contain no authentication factors or private keys.

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

The reID NFT metadata description uses “Digital identity and merchant access for the ecosystem.” The authored fallback description remains unchanged (“merchant passport”); the live published card uses “merchant access”. that wording triggers the existing conservative private-document filter when pinning metadata. No privacy filter was disabled or bypassed.

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

## Historical preparation checkpoint — before publication

Source tests cover explicit project identity, publication eligibility, inconsistent/wrong-network supply, pause/sold-out availability, manually published/future/unset yield, canonical revenue, zero values, stale reads, compact large amounts and real React card rendering/error removal. Initial full suite: 107 passed; lint, TypeScript and production build passed. A first prerender check found an eager clock read in the empty state; it was corrected so static empty cards never read request-time APIs.

Local browser preview at actual desktop 2560 × 1172 and phone 390 × 844 loaded all four original images; phone card width 343 pixels with no horizontal document overflow. All authored classes/CSS were independently compared. These are local unavailable-state checks, not on-chain publication or live financial assertions.

Publication and opening each sale are separate exact staff-MFA transactions, estimated eight transactions total at the currently observed 3 reAED fee (24 reAED). The human must review and approve each action using the shared-wallet UI. Creating/pinning drafts does not authorize an agent to sign, submit, top up or spend. No such transaction has been submitted by this task. Fresh receipts and indexer/public-read acceptance remain pending.

Keep ongoing investor reID QA enabled until the owner asks to close it. Do not close QA to force a server deployment. The frontend-only integration uses the existing Vercel dev deployment path; this account has no direct Vercel access, so actual public deployment is verified separately from the Git push. Existing FP services and signing policies are unchanged.
