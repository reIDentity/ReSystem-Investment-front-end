import type { PaymentAsset } from "./money";
import type { WalletSendQuoteResponse } from "./api.generated";
export type SendQuote = WalletSendQuoteResponse;
const uint = (value: unknown): value is string => typeof value === "string" && /^(0|[1-9][0-9]{0,77})$/.test(value) && BigInt(value) < 2n ** 256n;
export function readSendQuote(value: unknown, wallet: string, recipient: string, asset: PaymentAsset, now = Date.now()): SendQuote {
  const q = value as SendQuote | null;
  const invalid = () => new Error("The maximum amount could not be verified. Check the destination and retry Max.");
  if (!q || q.chainId !== 15324 || typeof q.wallet !== "string" || q.wallet.toLowerCase() !== wallet.toLowerCase() || typeof q.recipient !== "string" || q.recipient.toLowerCase() !== recipient.toLowerCase() || q.asset !== asset || q.decimals !== (asset === "USDT" ? 6 : 18) || q.source !== "INFRA pending RPC and verified UAT fee source") throw invalid();
  if (![q.maximumAtomic, q.nativeBalanceAtomic, q.estimatedFeeWei].every(uint) || (asset === "USDT" ? !uint(q.tokenBalanceAtomic) : q.tokenBalanceAtomic !== null)) throw invalid();
  const quotedAt = Date.parse(q.quotedAt), expiresAt = Date.parse(q.expiresAt);
  if (!Number.isFinite(quotedAt) || !Number.isFinite(expiresAt) || quotedAt > now + 5000 || expiresAt <= now || expiresAt - quotedAt > 60000 || expiresAt <= quotedAt) throw new Error("The maximum quote has expired. Go back and request Max again.");
  if (q.canSend === false && q.maximumAtomic === "0") throw new Error("No spendable balance remains after the required reAED network reserve.");
  if (q.canSend !== true || !uint(q.gasEstimate) || BigInt(q.gasEstimate) === 0n || BigInt(q.estimatedFeeWei) === 0n || BigInt(q.maximumAtomic) === 0n || BigInt(q.nativeBalanceAtomic) < BigInt(q.estimatedFeeWei)) throw invalid();
  if (asset === "REAED" ? BigInt(q.maximumAtomic) !== BigInt(q.nativeBalanceAtomic) - BigInt(q.estimatedFeeWei) : q.maximumAtomic !== q.tokenBalanceAtomic) throw invalid();
  return q;
}
export function inputAtomic(value: string, decimals: 6 | 18): string {
  if (!uint(value)) throw new Error("The maximum amount could not be verified.");
  const padded = value.padStart(decimals + 1, "0");
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return `${padded.slice(0, -decimals)}${fraction ? `.${fraction}` : ""}`;
}
