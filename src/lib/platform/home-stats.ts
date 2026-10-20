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

type PublishedProject = { id: string; unitPriceUsdtAtomic: string };
type ProjectDetail = PublishedProject & { open: boolean; supply: bigint; max: bigint; revenue: bigint | null };
const MAX_PAGES = 10;
const PAGE_SIZE = 50;
const DETAIL_CONCURRENCY = 4;
const READ_TIMEOUT_MS = 8000;
const TOTAL_TIMEOUT_MS = 15000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const integer = (value: unknown): value is string => typeof value === "string" && /^(0|[1-9][0-9]{0,77})$/.test(value);

async function read(base: string, path: string, signal: AbortSignal): Promise<unknown> {
  signal.throwIfAborted();
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(READ_TIMEOUT_MS)]);
  const response = await fetch(`${base}${path}`, { headers: { Accept: "application/json" }, redirect: "error", signal: requestSignal });
  if (!response.ok) throw new Error(`Platform read ${response.status}`);
  const body: unknown = await response.json();
  requestSignal.throwIfAborted();
  return body;
}

/** Published projects only; refuse duplicate or partial/corrupt pagination rather than inflate a total. */
async function publishedProjects(base: string, signal: AbortSignal) {
  const items: PublishedProject[] = [];
  const ids = new Set<string>(), cursors = new Set<string>();
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const body = await read(base, `projects${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, signal);
    if (!object(body) || !Array.isArray(body.items) || body.items.length > PAGE_SIZE) throw new Error("Malformed project list");
    for (const p of body.items) {
      if (!object(p) || p.status !== "PUBLISHED" || typeof p.id !== "string" || !UUID.test(p.id) || !integer(p.unitPriceUsdtAtomic) || BigInt(p.unitPriceUsdtAtomic) === 0n) throw new Error("Malformed project");
      const id = p.id.toLowerCase();
      if (ids.has(id)) throw new Error("Duplicate published project");
      ids.add(id);
      items.push({ id, unitPriceUsdtAtomic: p.unitPriceUsdtAtomic });
    }
    if (body.nextCursor === null) return items;
    if (typeof body.nextCursor !== "string" || !UUID.test(body.nextCursor) || body.items.length !== PAGE_SIZE) throw new Error("Malformed project cursor");
    const next = body.nextCursor.toLowerCase();
    if (next !== items.at(-1)?.id || cursors.has(next)) throw new Error("Repeated or inconsistent project cursor");
    cursors.add(next);
    cursor = next;
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

/** Four project workers keep at most eight public detail reads in flight. */
async function projectDetails(base: string, projects: PublishedProject[], signal: AbortSignal) {
  const details: ProjectDetail[] = new Array(projects.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < projects.length) {
      signal.throwIfAborted();
      const index = nextIndex++, p = projects[index];
      const [chain, revenue] = await Promise.all([
        read(base, `projects/${p.id}/chain`, signal),
        read(base, `projects/${p.id}/revenue`, signal).catch(error => {
          if (signal.aborted) throw error;
          return null;
        }),
      ]);
      if (!object(chain) || chain.chainId !== 15324 || typeof chain.saleOpen !== "boolean" || typeof chain.purchasePaused !== "boolean" || !integer(chain.totalSupply) || !integer(chain.maxFractions) || BigInt(chain.maxFractions) === 0n || BigInt(chain.totalSupply) > BigInt(chain.maxFractions)) throw new Error("Malformed chain read");
      const supply = BigInt(chain.totalSupply), max = BigInt(chain.maxFractions);
      details[index] = { ...p, open: chain.saleOpen && !chain.purchasePaused && supply < max, supply, max, revenue: revenueMicroUsd(revenue) };
    }
  }
  await Promise.all(Array.from({ length: Math.min(DETAIL_CONCURRENCY, projects.length) }, () => worker()));
  return details;
}

export async function getHomeStats(): Promise<HomeStats> {
  "use cache";
  cacheLife("minutes");
  const empty: HomeStats = { openProducts: null, revenueLast30DaysUsd: null, soldPercent: null, minimumInvestmentUsd: null };
  let base: string;
  try { base = proxyConfig(process.env).base; } catch { return empty; }
  const controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(TOTAL_TIMEOUT_MS)]);
  try {
    const projects = await publishedProjects(base, signal);
    const details = await projectDetails(base, projects, signal);
    signal.throwIfAborted();
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
  } finally {
    // Stop outstanding peers after failure, not only the request that failed.
    controller.abort();
  }
}
