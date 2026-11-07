import { publishedLandingProject, landingProjectStats } from "./landing-project";
import type { Project, ProjectState } from "./types";
import type { SalePhasesResponse } from "./api.generated";

export const publicProjectPath = (id: string) => `/projects/${encodeURIComponent(id)}`;
export const projectContributionPath = (id: string) => `/invest?next=${encodeURIComponent(`/invest/products/${id}#invest`)}`;
export const validProjectId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export class PublicProjectError extends Error {
  constructor(public status: number) {
    super(status === 404 ? "This project is not published or is no longer available." : "Project information is temporarily unavailable. Please try again.");
  }
}

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const uint = (v: unknown): v is string => typeof v === "string" && /^(0|[1-9][0-9]{0,77})$/.test(v) && BigInt(v) < 2n ** 256n;
function validPublicResponse(section: string, data: unknown) {
  if (!record(data)) return false;
  if (section === "details") return data.media === undefined || (Array.isArray(data.media) && data.media.every(m => record(m) && typeof m.cid === "string" && typeof m.filename === "string" && typeof m.mimeType === "string"));
  if (section === "chain") return uint(data.totalSupply) && uint(data.remainingSupply) && uint(data.maxFractions) && typeof data.saleOpen === "boolean" && typeof data.purchasePaused === "boolean";
  if (section === "revenue") return Array.isArray(data.assets) && data.assets.every(a => record(a) && ["REAED", "USDT"].includes(String(a.asset)) && a.decimals === (a.asset === "REAED" ? 18 : 6) && [a.fundedAtomic, a.claimedTotalAtomic, a.reserveAtomic].every(uint))
    && record(data.history) && ["available", "unavailable"].includes(String(data.history.status)) && (data.history.items === null || (Array.isArray(data.history.items) && data.history.items.every(h => record(h) && typeof h.tx_hash === "string" && /^0x[0-9a-f]{64}$/i.test(h.tx_hash) && record(h.args_json))));
  if (["legacy", "excluded"].includes(String(data.mode))) return true;
  const phase = (p: unknown) => record(p) && typeof p.id === "string" && typeof p.name === "string" && [p.blocks, p.sold, p.remaining, p.unitPriceAtomic].every(uint) && typeof p.open === "boolean" && typeof p.whitelist === "boolean";
  return data.mode === "phased" && [data.totalBlocks, data.reservedBlocks, data.unallocatedBlocks, data.whitelistBlocks, data.publicBlocks].every(uint)
    && (data.current === null || phase(data.current)) && Array.isArray(data.phases) && data.phases.every(phase);
}

/** Anonymous reads only. Never forward a session or accept an arbitrary API path. */
export async function readPublicProject<T>(id: string, section: "details" | "chain" | "revenue" | "phases" = "details", page = 1): Promise<T> {
  if (!validProjectId(id) || !["details", "chain", "revenue", "phases"].includes(section) || !Number.isSafeInteger(page) || page < 1 || page > 100000) throw new PublicProjectError(404);
  const suffix = section === "details" ? "" : `/${section}${section === "phases" ? `?page=${page}` : ""}`;
  try {
    const response = await fetch(`/api/platform/projects/${id}${suffix}`, { method: "GET", credentials: "omit", cache: "no-store", redirect: "error", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) { await response.body?.cancel(); throw new PublicProjectError(response.status); }
    const reader = response.body?.getReader();
    if (!reader) throw new PublicProjectError(502);
    const parts: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const next = await reader.read(); if (next.done) break;
        size += next.value.byteLength;
        if (size > 2 * 1024 * 1024) throw new PublicProjectError(502);
        parts.push(next.value);
      }
    } finally { await reader.cancel(); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (section === "details" && !publishedLandingProject(id, data)) throw new PublicProjectError(404);
    if (!validPublicResponse(section, data)) throw new PublicProjectError(502);
    return data as T;
  } catch (error) { throw error instanceof PublicProjectError ? error : new PublicProjectError(502); }
}

/** Use a public phase's capacity, never infer a guest's whitelist status or balance. */
export function publicSale(project: Project | undefined, chain: ProjectState | undefined, phases?: SalePhasesResponse) {
  const verified = project && chain && landingProjectStats(project, chain, null).sold !== "—";
  const supply = verified ? chain : undefined;
  const view = phases?.mode === "phased" && phases.totalBlocks === supply?.maxFractions ? phases : undefined;
  const current = view?.current;
  const integer = (v: unknown): v is string => typeof v === "string" && /^[0-9]+$/.test(v);
  const limit = !supply ? null : !supply.saleOpen || supply.purchasePaused ? 0n
    : !project?.businessOpportunity ? BigInt(supply.remainingSupply)
    : !view ? null : !current?.open ? 0n
    : integer(current.remaining) && BigInt(current.remaining) <= BigInt(supply.remainingSupply) ? BigInt(current.remaining) : null;
  const usdtPrice = project?.businessOpportunity ? current?.open && integer(current.unitPriceAtomic) ? current.unitPriceAtomic : undefined : project?.unitPriceUsdtAtomic;
  const nativePrice = project?.businessOpportunity ? usdtPrice ? String(BigInt(usdtPrice) * 3600000000000n) : undefined : project?.unitPriceReaedAtomic;
  return { supply, view, limit, usdtPrice, nativePrice };
}
