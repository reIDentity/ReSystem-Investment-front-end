import "server-only";
import { cacheLife } from "next/cache";
import { proxyConfig } from "./proxy";

/** Live homepage figures; null means the confirmed value is unavailable and the slot shows a dash. */
export type HomeStats = {
  openProducts: number | null;
  revenueLast30DaysUsd: number | null;
  soldPercent: number | null;
  minimumInvestmentUsd: number | null;
};

const MAX_PAGES = 10;
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const integer = (value: unknown): value is string => typeof value === "string" && /^(0|[1-9][0-9]{0,77})$/.test(value);

async function read(base: string, path: string): Promise<unknown> {
  const response = await fetch(`${base}${path}`, { headers: { Accept: "application/json" }, redirect: "error", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Platform read ${response.status}`);
  return response.json();
}

/** Published projects only; the public list never includes drafts. */
async function publishedProjects(base: string) {
  const items: { id: string; unitPriceUsdtAtomic: string }[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const body: unknown = await read(base, `projects${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
    if (!object(body) || !Array.isArray(body.items)) throw new Error("Malformed project list");
    for (const p of body.items) {
      if (!object(p) || p.status !== "PUBLISHED" || typeof p.id !== "string" || !/^[0-9a-f-]{36}$/.test(p.id) || !integer(p.unitPriceUsdtAtomic)) throw new Error("Malformed project");
      items.push({ id: p.id, unitPriceUsdtAtomic: p.unitPriceUsdtAtomic });
    }
    cursor = typeof body.nextCursor === "string" ? body.nextCursor : null;
    if (!cursor) return items;
  }
  throw new Error("Project list exceeds the homepage bound");
}

/** Trailing 30-day funded revenue in micro-USD (1 USDT = 3.6 reAED), or null unless the confirmed series is complete. */
function revenueMicroUsd(revenue: unknown): bigint | null {
  if (!object(revenue) || !object(revenue.series)) return null;
  const series = revenue.series;
  if (series.status !== "available" || series.chainId !== 15324 || !Array.isArray(series.assets) || series.assets.length !== 2) return null;
  let total = 0n;
  for (const [asset, decimals] of [["REAED", 18], ["USDT", 6]] as const) {
    const rows = series.assets.filter(row => object(row) && row.asset === asset);
    if (rows.length !== 1 || !object(rows[0]) || rows[0].decimals !== decimals || !integer(rows[0].last30DaysAtomic)) return null;
    const atomic = BigInt(rows[0].last30DaysAtomic);
    total += asset === "USDT" ? atomic : (atomic * 10n) / (36n * 10n ** 12n);
  }
  return total;
}

export async function getHomeStats(): Promise<HomeStats> {
  "use cache";
  cacheLife("minutes");
  const empty: HomeStats = { openProducts: null, revenueLast30DaysUsd: null, soldPercent: null, minimumInvestmentUsd: null };
  let base: string;
  try { base = proxyConfig(process.env).base; } catch { return empty; }
  try {
    const projects = await publishedProjects(base);
    const details = await Promise.all(projects.map(async p => {
      const [chain, revenue] = await Promise.all([read(base, `projects/${p.id}/chain`), read(base, `projects/${p.id}/revenue`).catch(() => null)]);
      if (!object(chain) || chain.chainId !== 15324 || typeof chain.saleOpen !== "boolean" || typeof chain.purchasePaused !== "boolean" || !integer(chain.totalSupply) || !integer(chain.maxFractions) || BigInt(chain.maxFractions) === 0n) throw new Error("Malformed chain read");
      return { ...p, open: chain.saleOpen && !chain.purchasePaused, supply: BigInt(chain.totalSupply), max: BigInt(chain.maxFractions), revenue: revenueMicroUsd(revenue) };
    }));
    const open = details.filter(d => d.open);
    const supply = details.reduce((sum, d) => sum + d.supply, 0n), max = details.reduce((sum, d) => sum + d.max, 0n);
    const revenues = details.map(d => d.revenue);
    const minimum = open.reduce<bigint | null>((low, d) => { const price = BigInt(d.unitPriceUsdtAtomic); return low === null || price < low ? price : low; }, null);
    return {
      openProducts: open.length,
      revenueLast30DaysUsd: revenues.every(r => r !== null) ? Number(revenues.reduce<bigint>((sum, r) => sum + (r as bigint), 0n)) / 1e6 : null,
      soldPercent: max > 0n ? Number((supply * 10000n) / max) / 100 : null,
      minimumInvestmentUsd: minimum === null ? null : Number(minimum) / 1e6,
    };
  } catch {
    return empty;
  }
}
