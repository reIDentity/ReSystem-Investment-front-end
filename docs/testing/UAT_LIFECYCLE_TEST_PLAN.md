# INFRA UAT project and lifecycle — details approved for preparation

Status: **DETAILS APPROVED FOR PREPARATION / NOT EXECUTED**. The user approved the fixture details on 16 October 2026: 10,000 fractions, 10 USDT total, 0.001 USDT / 0.0036 reAED per fraction, the existing authorized deployer as owner/treasury, and at most 25 reAED plus 2 USDT including gas/top-ups. The earlier PROPOSED status is superseded only for preparation.

The coordinator saved an actual **DRAFT, version 1** through the canonical admin UI and verified the name/economics/owner/treasury, clearly labelled UAT fiction and absent indicative yield. No project publication, project contract creation, transaction signing or funds movement has occurred. The internal draft UUID/link and private proof are recorded only in the private Notion status record, outside general Git documentation.

Approved public imagery, metadata pinning, independent review and the authorized signer remain pending. Backend `REID_TRANSACTION_SUBMIT_ENABLED=false` remains unchanged. These approved details authorize preparation, not automatic execution of the steps below. Each exact reID wallet transaction still needs human approval; this record does not accept consent or a signature for the user.

Read-only UAT preflight at INFRA block 7294942 verified all four base runtime hashes, registry/implementation bindings and ownership; registered project count remained zero. The owner’s native/USDT balances met the approved preparation thresholds; exact balances are private and are not copied here. Intent preparation may proceed while submission is disabled, but public imagery/IPFS metadata, independent reviewer and a session-bound authorized wallet are still required. No approval, signing or broadcast occurred.

## Project configuration

| Field | Approved preparation value |
| --- | --- |
| Name | reSystem UAT Lifecycle Test |
| Description | Clearly labelled test project for ownership, payments, transfers, resale and reward-allocation acceptance on INFRA testnet. No real property or business backing is claimed. |
| Network | INFRA testnet, chain 15324 only |
| Maximum whole fractions | 10,000 |
| Total primary-sale value | 10 USDT |
| Price per fraction | 0.001 USDT / 0.0036 reAED |
| USDT unit price, atomic | 1,000 (6 decimals) |
| reAED unit price, atomic | 3,600,000,000,000,000 (18 decimals) |
| Owner and treasury | Existing authorized UAT factory deployer, `0xCFc93FB43F17F99EaCa411be595B727501987E95` |
| Investor A | The user's existing connected reID UAT wallet; exact address checked in each transaction review and excluded from general documents |
| Investor B | A separate disposable UAT test wallet, generated and recorded only in the private development credential register before use |
| Indicative yield | Not set; actual rewards come only from the deposits below |
| Primary sale | Not published/opened; publication metadata, independent review and authorized signer are still required |
| Transaction limits | At most 25 reAED and 2 USDT total test funding/top-ups, including gas reserves; stop and seek revised limits before exceeding either cap |

The two prices follow the approved fixed rate of 1 USDT = 3.6 reAED. They are test inputs, not published production project data. All token balances and available gas must be read before preparing transfers. No token minting, unrelated wallet balance or production network is assumed.

## Ordered acceptance checks — all unexecuted

1. **Preflight and publication.** Verify chain, factory/implementation/marketplace/router hashes and binding, provider approval safety, creator authority and the disabled submission gate. Upload clearly labelled public test metadata, prepare the exact project creation intent and review it. Publish only after its actual contract address, receipt and canonical confirmation are reconciled. The listing must appear in Explore; drafts must remain hidden.
2. **Native purchase.** Investor A purchases 1,000 fractions for exactly 3.6 reAED, plus the separately reviewed network fee. Verify ERC-1155 ID 1 balance 1,000, total issued supply 1,000, remaining supply 9,000, project entitlement 10% and current revenue participation 100%.
3. **First revenue deposit.** Owner funds exactly 3.6 reAED. Only the 1,000 issued investor fractions participate; A's allocated reward is 3.6 reAED. Unsold inventory earns nothing.
4. **Partial transfer.** A transfers exactly 10 fractions to B. Verify A = 990 and B = 10, while A keeps the previously allocated 3.6 reAED and B receives none of that historical allocation.
5. **Second revenue deposit.** Owner funds another 3.6 reAED. Verify new allocation A = 3.564 reAED, B = 0.036 reAED. A's cumulative native claimable amount is 7.164 reAED before claiming.
6. **USDT rebuy and funding.** A buys another 100 fractions for exactly 0.1 USDT through the exact allowance/approval flow. Verify A = 1,090, B = 10, issued = 1,100 and remaining = 8,900. Owner funds 1.1 USDT. Verify A = 1.09 USDT and B = 0.01 USDT allocated. Project entitlement remains based on 10,000 maximum fractions; revenue participation uses 1,100 issued fractions.
7. **Partial resale and cancellation.** A grants the exact required ERC-1155 operator approval and lists 1,000 fractions for 0.001 USDT each. B fills exactly 10 for 0.01 USDT; verify A = 1,080, B = 20, listing remaining = 990 and A's separate seller proceeds = 0.01 USDT. Cancel the remaining listing; no tokens should have been escrowed or burned.
8. **Native resale.** A lists 20 fractions at 0.0036 reAED each. B fills 5 for 0.018 reAED; verify A = 1,075, B = 25 and A's separate native seller proceeds = 0.018 reAED. Cancel the remainder. Confirm approval revocation, expiry and a direct token transfer cannot allow unavailable quantities to be bought.
9. **Full exit and retained claims.** A transfers the remaining 1,075 fractions to B. Verify A = 0 and B = 1,100, while A can still claim the previously allocated 7.164 reAED and 1.09 USDT. Owner then funds 0.396 reAED: B receives the entire new allocation and A receives none. B's cumulative native allocation is 0.432 reAED.
10. **Claims and proceeds.** Review and execute individual/both-asset claims and the batch router with actual receipts. Collect A's native/USDT seller proceeds separately. Verify no duplicate claim, reward-reserve/sale-proceeds mixing, principal redemption or platform fee. Remaining dust must follow contract accounting rather than an invented zero-balance assumption.
11. **Recovery and read models.** Verify rejected/expired/reverted approvals, insufficient balance, wrong network, invalid recipient and stale-price/quantity requests never appear completed. Reload the investor and admin apps; check canonical/indexed event rows, exact quotes, receipts, notification links and non-duplicating pagination. Confirm unrelated staff roles and wallets cannot access another user's private records.

No script may automatically accept the human's reID consent, wallet signature or final financial approval. Prepared actions must name the exact wallet, contract, asset, amount, recipient and gas estimate. A timeout is reconciled against the existing transaction before any retry. Screenshots, identity data and wallet credentials stay outside Git and ordinary Notion documents.

## Completion evidence

No financial acceptance step below has been performed by this document update. The saved off-chain DRAFT is preparation evidence only. See the [screen coverage matrix](INVESTOR_SCREEN_COVERAGE.md) and [current continuation status](../planning/IMPLEMENTATION_STATUS.md) for completed read-only identity/UI evidence; neither is funded lifecycle acceptance.

For every corresponding Notion task, attach the actual source commit, contract transaction/receipt evidence (where public), observed API/indexer values and browser result. Mark Done only when that task's acceptance criteria pass. Keep production audit, governance/rotation, complete historical coverage and unrelated unfinished tasks separate from this test-project result.
