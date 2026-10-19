import type { AssetTotals, RationalAssetTotals } from "./valuation";

const ASSETS = ["REAED", "USDT"] as const;
const decimalInteger = (value: unknown): value is string => typeof value === "string" && /^(0|[1-9][0-9]{0,1233})$/.test(value) && BigInt(value) < 2n ** 4096n;
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
type CostedHolding = { quantity: string; costBasis: unknown };

/** A current basis is acquisition cost, never a market price or a promised resale value. */
export function holdingCostBasis(holding: CostedHolding): RationalAssetTotals | null {
  if (!object(holding)) return null;
  const basis = holding.costBasis;
  if (!decimalInteger(holding.quantity) || !object(basis) || basis.status !== "known" || basis.method !== "weighted_average" || basis.quantity !== holding.quantity || !Array.isArray(basis.remaining) || basis.remaining.length !== 2) return null;
  const result: RationalAssetTotals = { REAED: { numerator: 0n, denominator: 1n }, USDT: { numerator: 0n, denominator: 1n } };
  for (const asset of ASSETS) {
    const matching = basis.remaining.filter(value => object(value) && value.asset === asset);
    if (matching.length !== 1) return null;
    const amount = matching[0];
    if (!object(amount) || amount.decimals !== (asset === "USDT" ? 6 : 18) || !decimalInteger(amount.numerator) || !decimalInteger(amount.denominator) || amount.denominator === "0") return null;
    result[asset] = { numerator: BigInt(amount.numerator), denominator: BigInt(amount.denominator) };
  }
  if (holding.quantity === "0" && ASSETS.some(asset => result[asset].numerator !== 0n)) return null;
  return result;
}

function gcd(a: bigint, b: bigint): bigint {
  while (b) [a, b] = [b, a % b];
  return a;
}

export function portfolioCostBasis(portfolio: { items: CostedHolding[]; complete?: boolean; nextCursor: string | null; chainId: number; headBlock: string; blockHash?: string } | undefined): RationalAssetTotals | null {
  if (!portfolio || !Array.isArray(portfolio.items) || portfolio.items.length > 100 || portfolio.complete !== true || portfolio.nextCursor !== null || portfolio.chainId !== 15324 || !decimalInteger(portfolio.headBlock) || !/^0x[0-9a-f]{64}$/i.test(portfolio.blockHash || "") || portfolio.items.length > 100) return null;
  const total: RationalAssetTotals = { REAED: { numerator: 0n, denominator: 1n }, USDT: { numerator: 0n, denominator: 1n } };
  for (const holding of portfolio.items) {
    const amounts = holdingCostBasis(holding);
    if (!amounts) return null;
    for (const asset of ASSETS) {
      const previous = total[asset], amount = amounts[asset];
      const shared = gcd(previous.denominator, amount.denominator);
      const numerator = previous.numerator * (amount.denominator / shared) + amount.numerator * (previous.denominator / shared);
      const denominator = previous.denominator * (amount.denominator / shared);
      const divisor = gcd(numerator, denominator);
      total[asset] = { numerator: numerator / divisor, denominator: denominator / divisor };
    }
  }
  return total;
}


/** Self-paid lifetime acquisition spending remains distinct from remaining position basis. */
export function portfolioAcquisitionOutlay(portfolio: (NonNullable<Parameters<typeof portfolioCostBasis>[0]> & { cashActivity?: unknown }) | undefined): AssetTotals | null {
  if (!portfolio || !Array.isArray(portfolio.items) || portfolio.items.length > 100 || portfolio.complete !== true || portfolio.nextCursor !== null || portfolio.chainId !== 15324 || !decimalInteger(portfolio.headBlock) || !/^0x[0-9a-f]{64}$/i.test(portfolio.blockHash || "") || !object(portfolio.cashActivity) || portfolio.cashActivity.status !== "known" || !Array.isArray(portfolio.cashActivity.spent) || portfolio.cashActivity.spent.length !== 2) return null;
  const total: AssetTotals = { REAED: 0n, USDT: 0n };
  for (const asset of ASSETS) {
    const matching = portfolio.cashActivity.spent.filter(value => object(value) && value.asset === asset);
    if (matching.length !== 1 || !object(matching[0]) || matching[0].decimals !== (asset === "USDT" ? 6 : 18) || typeof matching[0].amountAtomic !== "string" || !/^(0|[1-9][0-9]{0,81})$/.test(matching[0].amountAtomic)) return null;
    total[asset] = BigInt(matching[0].amountAtomic);
  }
  return total;
}
