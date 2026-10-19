import { formatRationalUsdEquivalent, type AssetTotals } from "./valuation";

const SCALE = 10n ** 27n;
const ASSETS = ["REAED", "USDT"] as const;
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const integer = (value: unknown): value is string => typeof value === "string" && /^(0|[1-9][0-9]{0,81})$/.test(value);
export type VerifiedRevenueSeries = {
  confirmedBlock: string;
  blockHash: string;
  asOf: string;
  totals: { today: AssetTotals; month: AssetTotals; todayPerShare: AssetTotals; monthPerShare: AssetTotals; cumulativePerShare: AssetTotals };
  days: { date: string; revenue: AssetTotals; perShare: AssetTotals }[];
};

function assets(rows: unknown, field: string): AssetTotals | null {
  if (!Array.isArray(rows) || rows.length !== 2) return null;
  const values: AssetTotals = { REAED: 0n, USDT: 0n };
  for (const asset of ASSETS) {
    const matching = rows.filter(row => object(row) && row.asset === asset);
    if (matching.length !== 1 || !object(matching[0]) || matching[0].decimals !== (asset === "USDT" ? 6 : 18) || !integer(matching[0][field])) return null;
    values[asset] = BigInt(matching[0][field] as string);
  }
  return values;
}

/** Only a complete UTC series at an identified canonical block can populate financial slots. */
export function readRevenueSeries(value: unknown): VerifiedRevenueSeries | null {
  if (!object(value) || value.status !== "available" || value.chainId !== 15324 || value.source !== "confirmed canonical INFRA indexer" || value.timezone !== "UTC" || value.scale !== SCALE.toString() || !integer(value.confirmedBlock) || typeof value.blockHash !== "string" || !/^0x[0-9a-f]{64}$/i.test(value.blockHash) || typeof value.asOf !== "string" || value.asOf.length > 40 || !Number.isFinite(Date.parse(value.asOf)) || !Array.isArray(value.days) || value.days.length !== 14) return null;
  const today = assets(value.assets, "todayAtomic"), month = assets(value.assets, "thisMonthAtomic"), todayPerShare = assets(value.assets, "todayPerShareScaled"), monthPerShare = assets(value.assets, "monthPerShareScaled"), cumulativePerShare = assets(value.assets, "cumulativePerShareScaled");
  if (!today || !month || !todayPerShare || !monthPerShare || !cumulativePerShare) return null;
  const anchorDate = new Date(value.asOf).toISOString().slice(0, 10), anchor = Date.parse(`${anchorDate}T00:00:00Z`);
  const days: VerifiedRevenueSeries["days"] = [];
  for (const [index, day] of value.days.entries()) {
    const date = new Date(anchor - (13 - index) * 86400000).toISOString().slice(0, 10);
    if (!object(day) || day.date !== date) return null;
    const revenue = assets(day.assets, "revenueAtomic"), perShare = assets(day.assets, "perShareScaled");
    if (!revenue || !perShare) return null;
    days.push({ date, revenue, perShare });
  }
  for (const asset of ASSETS) {
    if (days[13].revenue[asset] !== today[asset] || days[13].perShare[asset] !== todayPerShare[asset] || month[asset] < days.filter(day => day.date.slice(0, 7) === anchorDate.slice(0, 7)).reduce((sum, day) => sum + day.revenue[asset], 0n) || monthPerShare[asset] < days.filter(day => day.date.slice(0, 7) === anchorDate.slice(0, 7)).reduce((sum, day) => sum + day.perShare[asset], 0n) || cumulativePerShare[asset] < monthPerShare[asset]) return null;
  }
  return { confirmedBlock: value.confirmedBlock, blockHash: value.blockHash, asOf: value.asOf, totals: { today, month, todayPerShare, monthPerShare, cumulativePerShare }, days };
}

export function revenueMoney(amounts: AssetTotals, perShare = false): string {
  const denominator = perShare ? SCALE : 1n;
  return formatRationalUsdEquivalent({ REAED: { numerator: amounts.REAED, denominator }, USDT: { numerator: amounts.USDT, denominator } }, perShare ? 4 : 2);
}
const quoteNumerator = (amounts: AssetTotals) => amounts.REAED * 5n + amounts.USDT * 18n * 10n ** 12n;
function axisLabel(full: string): string {
  if (full.length < 12 || full.startsWith("<")) return full;
  const whole = full.slice(1).split(".")[0].replaceAll(",", "");
  const powers = [[12, "T"], [9, "B"], [6, "M"], [3, "K"]] as const;
  if (whole.length > 15) return `$${whole[0]}.${whole.slice(1, 3)}e${whole.length - 1}`;
  for (const [power, suffix] of powers) if (whole.length > power) return `$${whole.slice(0, -power)}.${whole.slice(-power, -power + 2)}${suffix}`;
  return full;
}
export function revenueChart(series: VerifiedRevenueSeries, perShare = false) {
  const values = series.days.map(day => quoteNumerator(perShare ? day.perShare : day.revenue));
  const peak = values.reduce((max, value) => value > max ? value : max, 0n), maximum = (peak * 11n + 9n) / 10n;
  const denominator = 18n * 10n ** 18n * (perShare ? SCALE : 1n);
  return {
    points: series.days.map((day, index) => {
      const hundredths = maximum ? values[index] * 10000n / maximum : 0n;
      return { ...day, label: index === 13 ? "Today" : day.date.slice(-2).replace(/^0/, ""), height: `${hundredths / 100n}.${(hundredths % 100n).toString().padStart(2, "0")}%`, positive: values[index] > 0n, display: revenueMoney(perShare ? day.perShare : day.revenue, perShare) };
    }),
    axis: [4n, 3n, 2n, 1n, 0n].map(tick => {
      const numerator = maximum * tick, divisor = denominator * 4n, scale = 10n ** BigInt(perShare ? 4 : 2), displayed = numerator * scale / divisor;
      const full = `$${(displayed / scale).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${(displayed % scale).toString().padStart(perShare ? 4 : 2, "0")}`;
      return { label: axisLabel(full), full };
    }),
  };
}
