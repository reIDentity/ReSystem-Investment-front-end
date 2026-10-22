import type { ProjectChainResponse } from "./api.generated";
import type { Project } from "./types";
import { publishedLandingProject, landingProjectStats } from "./landing-project";
import { readRevenueSeries, type VerifiedRevenueSeries } from "./revenue-values";
import { units, percentage } from "./money";
import { formatUsdEquivalent, type AssetTotals } from "./valuation";

export const LANDING_REFRESH_MS = 60000;
export const LANDING_MAX_AGE_MS = 120000;
const MAX_UINT = 2n ** 256n;
export const uint = (v: unknown): v is string => typeof v === "string" && /^(0|[1-9][0-9]{0,77})$/.test(v) && BigInt(v) < MAX_UINT;
const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const zero = (): AssetTotals => ({ REAED: 0n, USDT: 0n });
export const add = (a: AssetTotals, b: AssetTotals): AssetTotals => ({ REAED: a.REAED + b.REAED, USDT: a.USDT + b.USDT });
export const valuation = (a: AssetTotals) => a.REAED * 5n + a.USDT * 18n * 10n ** 12n;
export const publicExplorer = "https://uat.scan.infraworld.org";
export type LandingPayment = { id: string; projectId: string; name: string; hash: string; block: string; asset: "REAED" | "USDT"; amount: string; display: string };
export type LandingProject = {
  project: Project; chain: ProjectChainResponse | null; series: VerifiedRevenueSeries | null;
  stats: ReturnType<typeof landingProjectStats>;
  funded: AssetTotals | null; claimed: AssetTotals | null; reserve: AssetTotals | null; last30: AssetTotals | null;
  payments: LandingPayment[] | null;
};
export type LandingSnapshot = { projects: LandingProject[]; fetchedAt: number };

/** Whitelist only confirmed published records. A corrupt or incomplete page cannot stand in for the catalogue. */
export async function loadLanding(read: (path: string) => Promise<unknown>, now: () => number = Date.now): Promise<LandingSnapshot> {
  const projects: Project[] = [], ids = new Set<string>(), cursors = new Set<string>();
  let cursor: string | null = null, complete = false;
  for (let page = 0; page < 10; page++) {
    const body = await read(`projects${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
    if (!object(body) || !Array.isArray(body.items) || body.items.length > 50) throw new Error("Published catalogue unavailable");
    for (const item of body.items) {
      if (!object(item) || typeof item.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)) throw new Error("Invalid published record");
      const project = publishedLandingProject(item.id, item);
      if (!project || ids.has(project.id)) throw new Error("Invalid published record");
      ids.add(project.id); projects.push(project as Project);
    }
    if (body.nextCursor === null) { complete = true; break; }
    if (typeof body.nextCursor !== "string" || body.items.length !== 50 || body.nextCursor !== projects.at(-1)?.id || cursors.has(body.nextCursor)) throw new Error("Invalid catalogue pagination");
    cursors.add(body.nextCursor); cursor = body.nextCursor;
  }
  if (!complete) throw new Error("Incomplete published catalogue");
  const rows: LandingProject[] = new Array(projects.length);
  let index = 0;
  async function worker() {
    while (index < projects.length) {
      const i = index++, project = projects[i];
      const [chain, revenue] = await Promise.all([read(`projects/${project.id}/chain`).catch(() => null), read(`projects/${project.id}/revenue`).catch(() => null)]);
      rows[i] = verifiedLandingProject(project, chain, revenue, now());
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, projects.length) }, worker));
  return { projects: rows, fetchedAt: now() };
}

/** Never infer totals from a truncated history, an inconsistent ledger or an old canonical anchor. */
export function verifiedLandingProject(project: Project, chain: unknown, revenue: unknown, now: number): LandingProject {
  const stats = landingProjectStats(project, chain, revenue, now);
  const state = stats.sale !== null ? chain as ProjectChainResponse : null;
  let series = object(revenue) ? readRevenueSeries(revenue.series) : null;
  if (series && (series.asOf.slice(0, 10) !== new Date(now).toISOString().slice(0, 10) || BigInt(series.confirmedBlock) < BigInt(project.publicationBlock!) || Date.parse(series.asOf) > now + 5000 || now - Date.parse(series.asOf) > 300000)) series = null;
  let funded: AssetTotals | null = null, claimed: AssetTotals | null = null, reserve: AssetTotals | null = null, last30: AssetTotals | null = null;
  let payments: LandingPayment[] | null = null;
  if (series && object(revenue) && Array.isArray(revenue.assets) && revenue.assets.length === 2) {
    const f = zero(), c = zero(), r = zero(), trailing = zero();
    let valid = true, trailingValid = true;
    for (const asset of ["REAED", "USDT"] as const) {
      const matches = revenue.assets.filter(a => object(a) && a.asset === asset), a = matches[0];
      const source = object(revenue.series) && Array.isArray(revenue.series.assets) ? revenue.series.assets.find(a => object(a) && a.asset === asset) : null;
      if (matches.length !== 1 || !object(a) || a.decimals !== (asset === "REAED" ? 18 : 6) || !uint(a.fundedAtomic) || !uint(a.claimedTotalAtomic) || !uint(a.reserveAtomic) || BigInt(a.claimedTotalAtomic) + BigInt(a.reserveAtomic) !== BigInt(a.fundedAtomic) || series.totals.month[asset] > BigInt(a.fundedAtomic)) { valid = false; break; }
      f[asset] = BigInt(a.fundedAtomic); c[asset] = BigInt(a.claimedTotalAtomic); r[asset] = BigInt(a.reserveAtomic);
      if (!object(source) || !uint(source.last30DaysAtomic) || BigInt(source.last30DaysAtomic) < series.totals.month[asset] || BigInt(source.last30DaysAtomic) > f[asset]) trailingValid = false;
      else trailing[asset] = BigInt(source.last30DaysAtomic);
    }
    if (valid) {
      funded = f; claimed = c; reserve = r; last30 = trailingValid ? trailing : null;
      if (object(revenue.history) && revenue.history.status === "available" && Array.isArray(revenue.history.items) && revenue.history.items.length <= 100) {
        const result: LandingPayment[] = [], sum = zero(); let validHistory = true;
        for (const [i, row] of revenue.history.items.entries()) {
          if (!object(row) || typeof row.tx_hash !== "string" || !/^0x[0-9a-f]{64}$/i.test(row.tx_hash) || !uint(row.block_number) || BigInt(row.block_number) > BigInt(series.confirmedBlock) || BigInt(row.block_number) < BigInt(project.publicationBlock!) || !object(row.args_json) || !uint(row.args_json.amount) || ![0, 1, "0", "1"].includes(row.args_json.asset as number)) { validHistory = false; break; }
          const asset = String(row.args_json.asset) === "0" ? "REAED" : "USDT";
          sum[asset] += BigInt(row.args_json.amount);
          result.push({ id: `${project.id}-${row.tx_hash}-${i}`, projectId: project.id, name: project.title, hash: row.tx_hash, block: row.block_number, asset, amount: row.args_json.amount, display: `${units(row.args_json.amount, asset === "REAED" ? 18 : 6)} ${asset === "REAED" ? "reAED" : "USDT"}` });
        }
        if (validHistory && sum.REAED === f.REAED && sum.USDT === f.USDT) payments = result;
      }
    }
  }
  return { project, chain: state, series, stats, funded, claimed, reserve, last30, payments };
}

/** All-project figures require all project reads; individual cards may still show their independent verified values. */
export function landingTotals(rows: LandingProject[] | null) {
  const sum = (field: "funded" | "claimed" | "reserve" | "last30") => rows && rows.every(p => p[field] !== null) ? rows.reduce((a, p) => add(a, p[field]!), zero()) : null;
  const states = rows?.every(p => p.chain !== null) ? rows : null;
  const supply = states?.reduce((a, p) => a + BigInt(p.chain!.totalSupply), 0n), maximum = states?.reduce((a, p) => a + BigInt(p.project.maxFractions), 0n);
  const open = states?.filter(p => p.stats.sale === "Open") ?? null;
  const minimum = open?.reduce<bigint | null>((a, p) => a === null || BigInt(p.project.unitPriceUsdtAtomic) < a ? BigInt(p.project.unitPriceUsdtAtomic) : a, null) ?? null;
  // Calendar metrics can only combine series covering the same UTC day, with a fresh anchor in every project.
  const dates = rows?.map(p => p.series?.asOf.slice(0, 10));
  const seriesReady = rows !== null && rows.every(p => p.series !== null) && new Set(dates).size <= 1;
  const today = seriesReady ? rows.reduce((a, p) => add(a, p.series!.totals.today), zero()) : null;
  const days = seriesReady && rows.length ? rows[0].series!.days.map((d, i) => ({ date: d.date, revenue: rows.reduce((a, p) => add(a, p.series!.days[i].revenue), zero()) })) : [];
  const payments = rows && rows.every(p => p.payments !== null) ? rows.flatMap(p => p.payments!).sort((a, b) => BigInt(a.block) > BigInt(b.block) ? -1 : BigInt(a.block) < BigInt(b.block) ? 1 : a.id.localeCompare(b.id)) : null;
  const funded = sum("funded"), claimed = sum("claimed"), reserve = sum("reserve");
  return { funded, claimed, reserve, last30: seriesReady ? sum("last30") : null, today, days, payments,
    sold: supply !== undefined && maximum && maximum > 0n ? percentage(supply.toString(), maximum.toString()) : "—",
    open: open?.length ?? null, minimum: minimum === null ? "—" : `$${units(minimum.toString(), 6)}`,
    claimedPercent: funded && claimed && valuation(funded) > 0n ? Number(valuation(claimed) * 10000n / valuation(funded)) / 100 : null,
  };
}
export const displayMoney = (a: AssetTotals | null) => formatUsdEquivalent(a);
export function calculatorQuote(row: LandingProject | null, quantity: number) {
  if (!row?.chain || row.stats.sale !== "Open" || !Number.isSafeInteger(quantity) || quantity < 1 || BigInt(quantity) > BigInt(row.chain.remainingSupply)) return null;
  return { quantity: String(quantity), cost: `$${units((BigInt(row.project.unitPriceUsdtAtomic) * BigInt(quantity)).toString(), 6)}`, ownership: percentage(String(quantity), row.project.maxFractions) === "0.00%" ? "< 0.01%" : percentage(String(quantity), row.project.maxFractions), href: `/invest/products/${row.project.id}` };
}
