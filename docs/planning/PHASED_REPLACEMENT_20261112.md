# Phased product replacement — 12 November 2026

This is an implementation checkpoint, not a completed live replacement or QA acceptance report.

## Requirements and observed catalogue

The owner supplied the original three-page **Business Opportunity – Share Blocks & Sale Phases** PDF again. Its SHA-256 is `dd7c503c77e3e7df6895652451c6b7a1b64ae120a739a9fc40306cf418818f2f`.

Each replacement uses the approved defaults: 10,000 blocks, 250,000 USDT reference value, 25 USDT / 90 reAED per block, 3,000 locked reserved blocks, 3,000 whitelist pre-launch blocks and 4,000 public blocks. Phase prices, capacities, eligibility, dates and visibility remain administrator-controlled. Future expansion reserves 30% of the new total and leaves added saleable capacity unallocated until assigned. IDOS remains excluded from this replacement.

Six legacy published projects remain live. Their supply does not contain the new reserve/phase structure. Their observed 138 issued blocks must remain bound to the original contracts; neither the graphic nor a database edit can convert their economic terms.

Six corresponding phased drafts already exist with pinned metadata. Reuse them rather than creating duplicates:

| Product | Replacement draft ID |
|---|---|
| INFRA Global | `6187dbab-0604-43c4-b51e-6b10269d155b` |
| INFRA reAED | `0caa794e-1160-40be-97a4-96e3fb1049dd` |
| reID | `fc1c930c-df85-4b48-9905-1259c734a16e` |
| reMARKETPLACE | `d034a3ee-6439-46e6-83d9-90d6da94034e` |
| UAT Publication Acceptance 2026-10-20 | `8c044287-ae74-41c8-87b4-b8ac522f1e17` |
| reSystem UAT Lifecycle Test | `d67a97a7-fefc-4dce-adb2-8c8c233c799c` |

## Confirmed V3 activation

The owner approved the exact fresh activation using the saved deployer key. It is canonically confirmed at block **724,699**:

- Transaction: `0x1c2b5856d7d9aa0dac851284d215cecf86c1141cad1a725600647649728fc4d7`.
- Factory: `0x2dbd7500cc9899c9a5bba6c96f09c086502c5661`.
- Version 3 implementation: `0xE7919Cf6D8846260e5fDca70B04D7BaC6845a884`.
- Runtime hash: `0xb1f927cfb0f7fda8d2d9e134d361b2b642521ef2f5eb5a0953df5fb535fe0efb`.
- Reviewed source: `d4ff2ecb193c57bdf7e7d66811470cbdbfdf52a0`.
- Activation fee: 2 reAED; the three-step deployment/proposal/activation release spent 6 of its approved 7.5 reAED ceiling. That authorization does not authorize replacement publication, funding or investor transactions.

## Local frontend correction

The investment opportunity graphic keeps its 100 block tiles. Exact counts and percentages distinguish issued blocks, available-now blocks, future capacity and locked reserve. Phased products also show the allocation purpose, current/visible phase prices and sale progress. Issued blocks are already included in their purpose allocations and are not counted twice. Unknown or inconsistent responses show an honest unavailable state.

Legacy projects retain their real legacy allocation until replaced. Branded project links select only their registered published phased successor after a verified archive/404; historical UUIDs and holdings retain their original identity. Landing/hero prices use the current phase price rather than the initial reference price.

The release candidate is isolated on `local/project-allocation-stable`, based on the actual restored production source `ddfcade0de8acbbe11366a5d0239d58cf96d527f`. It does not include the full-width changes or the separate landing refinements in draft PR18. The original local review branch is retained. These new changes are not pushed or deployed at this checkpoint.

All 236 frontend tests, lint, TypeScript and the production build passed on the isolated stable candidate. The actual desktop preview keeps 100 tiles, the original capped page width and no horizontal overflow. A repeated phone-viewport override did not take effect, so it is not counted as a new phone acceptance check. Earlier desktop/390px/320px allocation checks found no overflow, and an explicitly labelled synthetic phased fixture verified the 30/30/40 display. Synthetic evidence is not a published project.

## Pending live rollout and financial work

API/worker `788145a1` and the current indexer already support V3. The isolated signer still uses older `e950fd91`; its image/config/policy must be updated before publication. The proposed compatible image is the existing reviewed backend `788145a1`, with unchanged KMS identity, journal, treasury, resource limits and isolation. Proposed V3 phase actions and a global daily limit of 40 require owner approval. The existing per-project/action limit of 5 and approval rate of 10/hour remain.

A local owned-drain verifier and guarded rollout procedure are prepared. They preserve the exact operator-owned drain and prior lock state; no temporary undrain, journal reset, new root permission or unrelated service change is permitted. The QA request gate must be restored after an approved brief maintenance window.

The proposed remaining plan is 31 transactions: one 75 reAED gas funding transfer and, per product, publication, sale opening, QA wallet whitelist membership, pre-launch activation and old primary-sale closure. Proposed gross ceiling: 160 reAED including internal funding and fees, no USDT, fee ceiling 2.5 reAED per transaction. The owner approved this bounded plan on 12 November; each transaction still requires a fresh exact human approval. No individual replacement transaction is approved by that plan alone.

Archive an original listing only after its successor is published, indexed, open and quotable, and the original primary sale is confirmed closed. Existing archived-project API/portfolio paths retain old balances, transfers, rewards and claim destinations; local compiled-source checks cover these guarantees. Do not delete, rewrite or migrate holder history.

No replacement has been published or original archived by this checkpoint. QA readiness requires actual canonical receipts, indexed allocations, visible current prices, functioning eligibility, preserved holder claims and final live browser acceptance.

Private document archive: [Phased replacement checkpoint](https://app.notion.com/p/4163b21ac92581d78cbbea90fd2c3470).
