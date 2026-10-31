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


/** Validate the dated cumulative series against the already verified asset totals. */
export function readWalletHistory(value: unknown): {month: string; purchases: bigint; rewards: bigint}[] {
  if (!object(value) || typeof value.wallet !== "string") return [];
  const flow = readWalletCashflow(value, value.wallet);
  if (!flow || !Array.isArray(value.series) || value.series.length !== 12) return [];
  const asOf = new Date(flow.asOf);
  const previous = { REAED: { purchases: 0n, rewards: 0n }, USDT: { purchases: 0n, rewards: 0n } };
  const rows = [];
  for (let i = 0; i < 12; i++) {
    const row = value.series[i];
    const month = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - 11 + i, 1)).toISOString().slice(0, 7);
    if (!object(row) || row.month !== month || !Array.isArray(row.assets) || row.assets.length !== 2) return [];
    for (const asset of ["REAED", "USDT"] as const) {
      const matches = row.assets.filter(a => object(a) && a.asset === asset);
      if (matches.length !== 1 || !uint(matches[0].purchasesAtomic) || !uint(matches[0].rewardsAtomic)) return [];
      const purchases = BigInt(matches[0].purchasesAtomic), rewards = BigInt(matches[0].rewardsAtomic);
      if (purchases < previous[asset].purchases || rewards < previous[asset].rewards || purchases > flow.amounts.purchases[asset] || rewards > flow.amounts.payouts[asset]) return [];
      previous[asset] = { purchases, rewards };
    }
    rows.push({ month, purchases: previous.REAED.purchases * 5n + previous.USDT.purchases * 18n * 10n ** 12n, rewards: previous.REAED.rewards * 5n + previous.USDT.rewards * 18n * 10n ** 12n });
  }
  for (const asset of ["REAED", "USDT"] as const) if (previous[asset].purchases !== flow.amounts.purchases[asset]) return [];
  return rows;
}
