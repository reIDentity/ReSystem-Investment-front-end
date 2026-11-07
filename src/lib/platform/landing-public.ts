import { LANDING_MAX_AGE_MS, verifiedLandingProject, type LandingSnapshot } from "./landing-data";
import { publishedLandingProject } from "./landing-project";
import { validProjectId, validPublicResponse } from "./public-project";
import type { Project } from "./types";

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export type PublicLandingSnapshot = { items: { project: Project; chain: unknown; revenue: unknown }[]; fetchedAt: number };

/** Recheck raw public facts at decode time, without extending their freshness. */
export function decodeLandingSnapshot(value: unknown, now = Date.now()): LandingSnapshot {
  if (!object(value) || !Array.isArray(value.items) || value.items.length > 500 || !Number.isSafeInteger(value.fetchedAt) || Number(value.fetchedAt) <= 0 || Number(value.fetchedAt) > now + 5000 || now - Number(value.fetchedAt) >= LANDING_MAX_AGE_MS) throw new Error("Published catalogue unavailable");
  const ids = new Set<string>();
  const projects = value.items.map(row => {
    if (!object(row) || !object(row.project) || typeof row.project.id !== "string" || !validProjectId(row.project.id) || !validPublicResponse("details", row.project)) throw new Error("Invalid published record");
    const project = publishedLandingProject(row.project.id, row.project);
    if (!project || ids.has(project.id)) throw new Error("Invalid published record");
    ids.add(project.id);
    return verifiedLandingProject(project as Project, row.chain, row.revenue, now);
  });
  return { projects, fetchedAt: Number(value.fetchedAt) };
}

/** One shared public snapshot replaces one browser fan-out per visitor. */
export async function fetchLanding(): Promise<LandingSnapshot> {
  const response = await fetch("/api/public/catalogue", { method: "GET", credentials: "omit", cache: "no-store", redirect: "error", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
  if (!response.ok) { await response.body?.cancel(); throw new Error("Public project data unavailable"); }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Unreadable public project data");
  const parts: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const next = await reader.read(); if (next.done) break;
      size += next.value.byteLength;
      if (size > 8 * 1024 * 1024) throw new Error("Public response exceeds limit");
      parts.push(next.value);
    }
  } finally { await reader.cancel(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return decodeLandingSnapshot(JSON.parse(new TextDecoder().decode(bytes)));
}
