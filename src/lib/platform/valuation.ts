import type { PaymentAsset } from "./money";

export type AssetTotals = Record<PaymentAsset, bigint>;

/** Display-only USDT equivalent at the approved fixed 1 USDT = 3.6 reAED rate. */
export function formatUsdEquivalent(amounts: AssetTotals | null | undefined): string {
  if (!amounts || amounts.REAED < 0n || amounts.USDT < 0n) return "—";
  const numerator = amounts.REAED * 5n + amounts.USDT * 18n * 10n ** 12n;
  const cents = numerator * 100n / (18n * 10n ** 18n);
  if (numerator > 0n && cents === 0n) return "< $0.01";
  const whole = (cents / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${whole}.${(cents % 100n).toString().padStart(2, "0")}`;
}

export function walletAssetTotals(assets: readonly { symbol: string; decimals: number; balanceAtomic: string }[] | null | undefined): AssetTotals | null {
  if (!assets) return null;
  const native = assets.filter(asset => asset.symbol === "REAED");
  const usdt = assets.filter(asset => asset.symbol === "USDT");
  if (native.length !== 1 || usdt.length !== 1 || native[0].decimals !== 18 || usdt[0].decimals !== 6 || !/^\d+$/.test(native[0].balanceAtomic) || !/^\d+$/.test(usdt[0].balanceAtomic)) return null;
  return { REAED: BigInt(native[0].balanceAtomic), USDT: BigInt(usdt[0].balanceAtomic) };
}

type Rewards = readonly { asset: string; decimals: number; amountAtomic: string }[];
export function sumRewardTotals(holdings: readonly { claimable: Rewards; claimed?: Rewards }[] | null | undefined, field: "claimable" | "claimed" = "claimable"): AssetTotals | null {
  if (!holdings) return null;
  const total: AssetTotals = { REAED: 0n, USDT: 0n };
  for (const holding of holdings) {
    const amounts = holding[field];
    if (!amounts) return null;
    const assets = walletAssetTotals(amounts.map(amount => ({ symbol: amount.asset, decimals: amount.decimals, balanceAtomic: amount.amountAtomic })));
    if (!assets) return null;
    total.REAED += assets.REAED;
    total.USDT += assets.USDT;
  }
  return total;
}
