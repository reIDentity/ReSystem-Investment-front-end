import type { ProjectResponse, ProjectChainResponse } from "./api.generated";
import { percentage } from "./money";
import { readRevenueSeries, revenueMoney } from "./revenue-values";

const uint = (value: unknown): value is string => typeof value === "string" && /^(0|[1-9][0-9]{0,77})$/.test(value) && BigInt(value) < 2n ** 256n;
const address = (value: unknown) => typeof value === "string" && /^0x[0-9a-f]{40}$/i.test(value) && !/^0x0{40}$/i.test(value);

/** Keep the designed statistic slot compact without converting atomic amounts to floating point. */
function compactMoney(full: string) {
  const match = /^\$([\d,]+)\.(\d{2})$/.exec(full);
  if (!match) return full;
  const whole = match[1].replaceAll(",", "");
  if (whole.length <= 3) return full;
  if (whole.length > 15) return `$${whole[0]}.${whole.slice(1, 3)}e${whole.length - 1}`;
  for (const [power, suffix] of [[12, "T"], [9, "B"], [6, "M"], [3, "k"]] as const) {
    if (whole.length > power) return `$${whole.slice(0, -power)}.${whole.slice(-power, -power + 2)}${suffix}`;
  }
  return full;
}

/** An explicit project ID binds a landing product; titles are never identifiers. */
export function publishedLandingProject(id: string | undefined, value: unknown): ProjectResponse | null {
  if (!id || !value || typeof value !== "object") return null;
  const p = value as ProjectResponse;
  if (p.id !== id || p.status !== "PUBLISHED" || !address(p.contractAddress) || !uint(p.publicationBlock) || p.publicationBlock === "0" || typeof p.publicationTxHash !== "string" || !/^0x[0-9a-f]{64}$/i.test(p.publicationTxHash) || typeof p.title !== "string" || !p.title.trim() || typeof p.description !== "string" || !uint(p.maxFractions) || p.maxFractions === "0" || !uint(p.totalValueUsdtAtomic) || p.totalValueUsdtAtomic === "0" || !uint(p.unitPriceUsdtAtomic) || !uint(p.unitPriceReaedAtomic)) return null;
  return p;
}

export function landingProjectStats(project: ProjectResponse | null, chain: unknown, revenue: unknown, timestamp?: number) {
  const result = { revenue: "—", sold: "—", yieldPace: "—", sale: null as "Open" | "Closed" | null, revenueTitle: "Verified monthly revenue is unavailable.", yieldTitle: "Verified yield pace is unavailable.", soldTitle: "Verified fractions sold are unavailable." };
  if (!project) return result;
  // Public reads arrive after hydration; static empty cards do not read request-time APIs.
  const now = timestamp ?? Date.now();
  const c = chain && typeof chain === "object" ? chain as ProjectChainResponse : null;
  if (c && c.chainId === 15324 && c.source === "INFRA RPC" && uint(c.headBlock) && BigInt(c.headBlock) >= BigInt(project.publicationBlock!) && uint(c.totalSupply) && uint(c.remainingSupply) && c.maxFractions === project.maxFractions && c.totalValueUSDT === project.totalValueUsdtAtomic && c.unitPriceUSDT === project.unitPriceUsdtAtomic && BigInt(c.totalSupply) + BigInt(c.remainingSupply) === BigInt(project.maxFractions) && typeof c.saleOpen === "boolean" && typeof c.purchasePaused === "boolean") {
    result.sold = percentage(c.totalSupply, project.maxFractions);
    result.soldTitle = `${c.totalSupply} of ${project.maxFractions} fractions issued · INFRA block ${c.headBlock}`;
    result.sale = c.saleOpen && !c.purchasePaused && c.remainingSupply !== "0" ? "Open" : "Closed";
    const bps = String(c.indicativeYieldBps);
    if (uint(bps) && BigInt(bps) <= 4294967295n && uint(c.yieldEffectiveAt) && BigInt(c.yieldEffectiveAt) > 0n && BigInt(c.yieldEffectiveAt) <= BigInt(Math.floor(now / 1000)) && /^0x[0-9a-f]{64}$/i.test(c.yieldPeriod) && !/^0x0{64}$/i.test(c.yieldPeriod)) {
      result.yieldPace = `${BigInt(bps) / 100n}.${(BigInt(bps) % 100n).toString().padStart(2, "0")}%`;
      result.yieldTitle = `Owner-published indicative yield; not guaranteed. Period reference ${c.yieldPeriod}.`;
    }
  }
  const series = readRevenueSeries(revenue && typeof revenue === "object" && "series" in revenue ? revenue.series : null);
  if (series && BigInt(series.confirmedBlock) >= BigInt(project.publicationBlock!) && Date.parse(series.asOf) <= now + 5000 && now - Date.parse(series.asOf) <= 5 * 60000) {
    const money = revenueMoney(series.totals.month);
    result.revenue = compactMoney(money);
    result.revenueTitle = `${money} confirmed revenue this UTC calendar month · USDT equivalent at 1 USDT = 3.6 reAED · block ${series.confirmedBlock}`;
  }
  return result;
}
