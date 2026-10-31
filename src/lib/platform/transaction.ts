import type { TransactionResponse } from "./api.generated";
export function transactionIssue(intent: TransactionResponse, wallet: string, now = Date.now()): string | null {
  if (!intent || intent.chainId !== 15324 || typeof intent.walletAddress !== "string" || typeof wallet !== "string" || !/^0x[0-9a-f]{40}$/i.test(wallet) || /^0x0{40}$/i.test(wallet) || intent.walletAddress.toLowerCase() !== wallet.toLowerCase()) return "The signing wallet or network changed. Reconnect before approving this transaction.";
  if (!intent.command || typeof intent.command.type !== "string") return "The prepared action could not be verified. Please refresh its status.";
  if (["CREATED", "SUBMITTING", "AWAITING_APPROVAL"].includes(intent.status) && (typeof intent.expiresAt !== "string" || !Number.isFinite(Date.parse(intent.expiresAt)) || Date.parse(intent.expiresAt) <= now)) return "This prepared transaction has expired or its deadline cannot be verified. Do not approve it. Refresh this same intent before preparing any replacement.";
  if (intent.command.asset === "USDT" && ["BUY", "FILL_LISTING", "SEND", "APPROVE_USDT"].includes(String(intent.command.type)) && (!intent.review || intent.review.asset !== "USDT" || !intent.review.amountAtomic || !/^[0-9]+$/.test(intent.review.amountAtomic))) return "The prepared USDT amount is unavailable. No approval will be requested.";
  const tx = intent.transaction;
  if (!tx && ["CREATED", "SUBMITTING", "AWAITING_APPROVAL"].includes(intent.status)) return "The prepared transaction is unavailable. No approval link will be opened.";
  if (tx && (tx.chainId !== 15324 || !/^0x[0-9a-f]{40}$/i.test(tx.to) || !/^0x(?:[0-9a-f]{2})*$/i.test(tx.data) || [tx.valueWei, tx.gasEstimate, tx.estimatedFeeWei].some(x => !/^[0-9]+$/.test(x)))) return "The prepared transaction could not be verified. Please refresh its status.";
  if (["CONFIRMED", "INDEXED"].includes(intent.status) && (!intent.receipt || intent.receipt.status !== "success" || !intent.txHash || !/^0x[0-9a-f]{64}$/i.test(intent.txHash) || intent.receipt.transactionHash !== intent.txHash)) return "Confirmation evidence is unavailable. The service must reconcile this transaction.";
  return null;
}
export function isSettled(intent: TransactionResponse): boolean { return ["CONFIRMED", "INDEXED"].includes(intent.status) && !transactionIssue(intent, intent.walletAddress); }

/** Stop automatic polls only after a durable terminal state. Confirmation still needs indexing. */
export function transactionPollInterval(intent?: TransactionResponse): number {
  return intent && ["INDEXED", "FAILED", "REJECTED", "EXPIRED"].includes(intent.status) ? 0 : 4000;
}

/** Explain the next step without exposing provider diagnostics or claiming uncertain outcomes. */
export function transactionGuidance(intent: TransactionResponse): string {
  if(intent.command?.type === "APPROVE_USDT") {
    if(intent.status === "INDEXED") return "Your limited USDT allowance is confirmed. It has not bought shares. Return to the project to review and approve the separate purchase; a second network fee applies.";
    if(intent.status === "CREATED") return "Step 1: approve only the exact USDT allowance. Step 2: separately review and approve the purchase. Each transaction uses reAED for its network fee.";
  }
  switch (intent.status) {
    case "CREATED": return "Review the amount, destination and network fee, then request approval. Nothing is sent until you approve in reID.";
    case "SUBMITTING": return "Your approval request is being sent to reID. Keep this request while its status updates; do not create another one.";
    case "AWAITING_APPROVAL": return "Open the reID mobile app or scan the approval code to review this exact request. Return here to follow confirmation.";
    case "BROADCAST": return "Your transaction was sent to INFRA and is waiting for confirmation. Do not send it again.";
    case "CONFIRMED": return "INFRA confirmed your transaction. Your balances and activity will update when indexing finishes.";
    case "INDEXED": return "Your transaction is confirmed and recorded. View your latest balances in Wallet and the transaction details in Activity.";
    case "REJECTED": return "The approval was rejected. Check Activity before preparing a new request if you want to try again.";
    case "EXPIRED": return "This review expired. Do not approve its old link. Check Activity before preparing a new review.";
    case "FAILED": return intent.errorCode === "CHAIN_REVERT" ? "INFRA rejected this transaction. Its changes were not applied, but a network fee may still have been charged. Check the receipt before trying again." : "This request could not be completed. Check its transaction receipt or contact Support before trying again.";
    case "RECONCILIATION_REQUIRED": return "The service is checking whether the approval request reached reID. Keep this intent; do not submit a replacement transaction.";
    default: return "Check this request in Activity for its latest status.";
  }
}
