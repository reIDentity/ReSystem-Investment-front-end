import type { AssetTotals } from "./valuation";
const FIELDS = ["deposits", "purchases", "payouts", "withdrawals", "incoming", "outgoing", "net"] as const;
export type VerifiedCashflow = { confirmedBlock: string; blockHash: string; asOf: string; amounts: Record<typeof FIELDS[number], AssetTotals> };
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const uint = (value: unknown): value is string => typeof value === "string" && /^(0|[1-9][0-9]{0,81})$/.test(value);
const signed = (value: unknown): value is string => typeof value === "string" && /^(0|-?[1-9][0-9]{0,81})$/.test(value);

export function readWalletCashflow(value: unknown, wallet: string): VerifiedCashflow | null {
  if (typeof wallet !== "string" || !/^0x[0-9a-f]{40}$/i.test(wallet) || /^0x0{40}$/i.test(wallet) || !object(value) || value.status !== "available" || value.chainId !== 15324 || value.source !== "confirmed canonical INFRA indexer" || typeof value.wallet !== "string" || value.wallet.toLowerCase() !== wallet.toLowerCase() || value.includesNetworkFees !== false || !uint(value.confirmedBlock) || typeof value.blockHash !== "string" || !/^0x[0-9a-f]{64}$/i.test(value.blockHash) || typeof value.asOf !== "string" || value.asOf.length > 40 || !Number.isFinite(Date.parse(value.asOf)) || !Array.isArray(value.assets) || value.assets.length !== 2) return null;
  const amounts = Object.fromEntries(FIELDS.map(field => [field, { REAED: 0n, USDT: 0n }])) as VerifiedCashflow["amounts"];
  for (const asset of ["REAED", "USDT"] as const) {
    const matching = value.assets.filter(row => object(row) && row.asset === asset);
    if (matching.length !== 1 || !object(matching[0]) || matching[0].decimals !== (asset === "USDT" ? 6 : 18)) return null;
    const row = matching[0];
    for (const field of FIELDS) {
      const raw = row[`${field}Atomic`];
      if (!(field === "net" ? signed(raw) : uint(raw))) return null;
      amounts[field][asset] = BigInt(raw as string);
    }
    if (amounts.incoming[asset] !== amounts.deposits[asset] + amounts.payouts[asset] || amounts.outgoing[asset] !== amounts.purchases[asset] + amounts.withdrawals[asset] || amounts.net[asset] !== amounts.incoming[asset] - amounts.outgoing[asset]) return null;
  }
  return { confirmedBlock: value.confirmedBlock, blockHash: value.blockHash, asOf: value.asOf, amounts };
}
export function cashflowWidths(cashflow: VerifiedCashflow): string[] {
  const values = ["payouts", "deposits", "purchases", "withdrawals"].map(field => { const a = cashflow.amounts[field as keyof VerifiedCashflow["amounts"]]; return a.REAED * 5n + a.USDT * 18n * 10n ** 12n; });
  const maximum = values.reduce((max, n) => n > max ? n : max, 0n);
  return values.map(value => { const ratio = maximum ? value * 10000n / maximum : 0n; return `${ratio / 100n}.${(ratio % 100n).toString().padStart(2, "0")}%`; });
}
