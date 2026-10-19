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

export type RationalAssetTotals = Record<PaymentAsset, { numerator: bigint; denominator: bigint }>;

/** Retain weighted-average sub-atomic basis fractions until the final fixed-rate display. */
export function formatRationalUsdEquivalent(amounts: RationalAssetTotals | null | undefined, precision: 2 | 4 = 2): string {
  if (!amounts || [amounts.REAED, amounts.USDT].some(value => !value || typeof value.numerator !== "bigint" || typeof value.denominator !== "bigint" || value.numerator < 0n || value.denominator <= 0n)) return "—";
  const native = amounts.REAED, usdt = amounts.USDT;
  const numerator = native.numerator * 5n * usdt.denominator + usdt.numerator * 18n * 10n ** 12n * native.denominator;
  const denominator = 18n * 10n ** 18n * native.denominator * usdt.denominator;
  const scale = 10n ** BigInt(precision);
  const displayed = numerator * scale / denominator;
  if (numerator > 0n && displayed === 0n) return `< $0.${"0".repeat(precision - 1)}1`;
  const whole = (displayed / scale).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${whole}.${(displayed % scale).toString().padStart(precision, "0")}`;
}


/** Net cash flow can be negative; offset the original assets at the fixed rational rate first. */
export function formatSignedUsdEquivalent(amounts: AssetTotals | null | undefined): string {
  if (!amounts) return "—";
  const numerator = amounts.REAED * 5n + amounts.USDT * 18n * 10n ** 12n;
  const magnitude = formatRationalUsdEquivalent({ REAED: { numerator: numerator < 0n ? -numerator : numerator, denominator: 5n }, USDT: { numerator: 0n, denominator: 1n } });
  return numerator < 0n ? magnitude.startsWith("< ") ? `> -${magnitude.slice(2)}` : `-${magnitude}` : magnitude;
}
