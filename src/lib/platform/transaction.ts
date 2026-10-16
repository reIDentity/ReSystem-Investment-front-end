import type { TransactionResponse } from "./api.generated";
export function transactionIssue(intent: TransactionResponse, wallet: string): string | null {
  if (intent.chainId !== 15324 || intent.walletAddress.toLowerCase() !== wallet.toLowerCase()) return "The signing wallet or network changed. Reconnect before approving this transaction.";
  if (intent.command.asset === "USDT" && ["BUY", "FILL_LISTING", "SEND", "APPROVE_USDT"].includes(String(intent.command.type)) && (!intent.review || intent.review.asset !== "USDT" || !intent.review.amountAtomic || !/^[0-9]+$/.test(intent.review.amountAtomic))) return "The prepared USDT amount is unavailable. No approval will be requested.";
  const tx = intent.transaction;
  if (!tx && ["CREATED", "SUBMITTING", "AWAITING_APPROVAL"].includes(intent.status)) return "The prepared transaction is unavailable. No approval link will be opened.";
  if (tx && (tx.chainId !== 15324 || !/^0x[0-9a-f]{40}$/i.test(tx.to) || !/^0x(?:[0-9a-f]{2})*$/i.test(tx.data) || [tx.valueWei, tx.gasEstimate, tx.estimatedFeeWei].some(x => !/^[0-9]+$/.test(x)))) return "The prepared transaction could not be verified. Please refresh its status.";
  if (["CONFIRMED", "INDEXED"].includes(intent.status) && (!intent.receipt || intent.receipt.status !== "success" || !intent.txHash || !/^0x[0-9a-f]{64}$/i.test(intent.txHash) || intent.receipt.transactionHash !== intent.txHash)) return "Confirmation evidence is unavailable. The service must reconcile this transaction.";
  return null;
}
export function isSettled(intent: TransactionResponse): boolean { return ["CONFIRMED", "INDEXED"].includes(intent.status) && !transactionIssue(intent, intent.walletAddress); }
