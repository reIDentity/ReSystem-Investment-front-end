# Approved UAT execution budget — 17 October 2026

**BUDGET APPROVED; FINANCIAL JOURNEY NOT EXECUTED.** On17October2026 the user explicitly approved150reAED+2USDT for this UAT journey. This supersedes the earlier25reAED+2USDT preparation cap; project configuration and per-transaction human approval requirements are unchanged. Each reID/MetaMask wallet approval remains the human's own action. No script may accept a consent screen, approve a signature or automatically rebroadcast an uncertain action.

The project configuration is unchanged: clearly labelled `reSystem UAT Lifecycle Test`,10,000 whole fractions,10USDT total value,0.001USDT/0.0036reAED per fraction, existing authorized UAT deployer as owner/treasury. The off-chain draft is not evidence of publication or investment. See [the approved preparation plan](UAT_LIFECYCLE_TEST_PLAN.md).

## Why the budget needs revision

The user confirmed the public UAT fee source `http://208.115.109.202/api/fee`. It currently reports3reAED per transaction. Independent canonical receipt and sender-balance checks reproduced this charge for three transactions. One receipt exceeded the signed transaction's normal gas limit/price envelope. The source is mutable public HTTP; a network-enforced maximum fee remains unproved. Do not describe a local estimate or signed gas limit as an enforced chain spending cap.

The full lifecycle requires roughly32 separately reviewed transactions including publication/sale opening, both payment assets and approvals, deposits, transfers, both resale currencies, cancellation/revocation, claims, proceeds and necessary bounded top-ups. At3reAED each,32transactions alone require about96reAED. The current25reAED cap cannot cover that journey. Negative and stale-request cases should be simulated or rejected before sending, rather than intentionally spending gas on avoidable reverts.

## Approved maximum and stop rules

| Item | Approved limit |
| --- | --- |
| Aggregate new native UAT test funding/top-ups, including consumed gas and economic deposits/purchases | **150reAED** |
| Aggregate new UAT USDT funding/top-ups | **2USDT** |
| Planned transaction allowance | Up to32successful approved transactions; additional attempts require reconciliation and budget review |
| Normal observed fixed fee |3reAED; read again before every approval |
| Per-action application quotation threshold |4reAED reserve; this is a stop policy, not a cryptographic network cap |
| Production use | Not authorized |

The economic native flows in the existing scenario total11.214reAED before gas:3.6primary purchase,7.596revenue deposits and0.018native resale. A conservative32×4reAED reserve plus these flows totals139.214reAED;150leaves10.786for measured gas/top-up variation within the same aggregate cap. This is a planning allowance, not a promise that every step will cost4reAED or that the protocol cannot charge more. Do not spend the unused allowance automatically.

Use the existing connected investor A only after verifying the exact session-bound address in each review. Use a separately recorded disposable UAT B wallet. Native and USDT top-ups must name their exact recipient/amount and reconcile prior transfers before retry. Existing unrelated wallet balances, NFT sample mints and the earlier independently requested USDT transfer do not expand this new lifecycle authorization.

## Ordered execution groups

1. Reverify exact deployed versions, fee policy, manifest/runtime bindings, current public metadata, authorized signer and project eligibility. Review and publish the project, then open primary sale. An eligible GLOBAL super-admin may waive independent draft review only; other authority and wallet controls remain.
2. Native purchase and first deposit; partial10-fraction transfer; second deposit. Verify the sender retains prior allocations and the recipient earns only subsequent deposits.
3. Exact USDT approvals,100-fraction rebuy and1.1USDT funding. Verify fixed3.6pricing, supply and holder accounting.
4. Exact operator approval, partial USDT resale/cancellation, partial native resale/cancellation and approval revocation. Negative stale/expiry/balance cases must not be reported successful or automatically resent.
5. Full exit, retained claims and final revenue deposit; claim both-asset rewards and exercise the batch router using actual entitlements. Withdraw seller proceeds and primary treasury proceeds separately; never mix reward reserves with sale proceeds.
6. Reconcile canonical receipts, contract state, indexer/API, private notifications and both browser apps. Record precise costs and remaining allowance; stop on inconsistent source data, fee increase, mismatched signer/amount/recipient, failed/uncertain outcome or a limit breach.

The execution budget is approved. Submission remains disabled until the reviewed source/runtime controls are verified and each exact wallet action receives its human approval. A timeout does not authorize another transaction. No production release, independent audit, governance handover, unrestricted recipient funding or live account recovery is authorized by this proposal.
