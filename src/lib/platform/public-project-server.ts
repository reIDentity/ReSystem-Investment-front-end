import "server-only";
import { cache } from "react";
import { cacheLife } from "next/cache";
import { proxyConfig } from "./proxy";
import { publishedLandingProject } from "./landing-project";
import { catalogueProjectPath, projectIdFromSlug, publicProjectAliasId, publicProjectReplacementId, publicProjectPath, PublicProjectError, validProjectId, validPublicResponse } from "./public-project";
import type { Project } from "./types";

/** Fixed public endpoints, without user cookies, credentials or arbitrary destinations. */
export async function readPublicApi(path: string, signal?: AbortSignal): Promise<unknown> {
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
  if (!new RegExp(`^projects(?:\\?cursor=${uuid}|/${uuid}(?:/(?:chain|revenue))?)?$`, "i").test(path)) throw new PublicProjectError(404);
  const config = proxyConfig(process.env);
  try {
    const response = await fetch(`${config.base}${path}`, { headers: { Accept: "application/json", Origin: config.origin }, credentials: "omit", cache: "no-store", redirect: "error", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000) });
    if (!response.ok) { await response.body?.cancel(); throw new PublicProjectError(response.status); }
    const reader = response.body?.getReader(); if (!reader) throw new PublicProjectError(502);
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 2 * 1024 * 1024) throw new PublicProjectError(502); chunks.push(part.value); }
    } finally { await reader.cancel(); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const part of chunks) { bytes.set(part, offset); offset += part.byteLength; }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) { throw error instanceof PublicProjectError ? error : new PublicProjectError(502); }
}

export async function getPublicCatalogue(): Promise<Project[]> {
  "use cache";
  cacheLife({ stale: 0, revalidate: 30, expire: 60 });
  const signal = AbortSignal.timeout(15000), projects: Project[] = [], seen = new Set<string>();
  let cursor: string | null = null;
  for (let page = 0; page < 10; page++) {
    const body = await readPublicApi(`projects${cursor ? `?cursor=${cursor}` : ""}`, signal) as { items?: unknown[]; nextCursor?: unknown } | null;
    if (!body || !Array.isArray(body.items) || body.items.length > 50) throw new PublicProjectError(502);
    for (const item of body.items) {
      const id = item && typeof item === "object" && "id" in item ? String(item.id) : "";
      const project = validProjectId(id) ? publishedLandingProject(id, item) : null;
      if (!project || !validPublicResponse("details", item) || seen.has(id)) throw new PublicProjectError(502);
      seen.add(id); projects.push(project as Project);
    }
    if (body.nextCursor === null) return projects;
    if (body.items.length !== 50 || body.nextCursor !== projects.at(-1)?.id || body.nextCursor === cursor) throw new PublicProjectError(502);
    cursor = String(body.nextCursor);
  }
  throw new PublicProjectError(502);
}

function verifiedArchivedProject(id: string, body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const archived = body as Record<string, unknown>;
  if (archived.id !== id || archived.status !== "ARCHIVED") return false;
  // Validate the retained publication identity without changing or serving its archived status.
  return publishedLandingProject(id, { ...archived, status: "PUBLISHED" }) !== null && validPublicResponse("details", body);
}

export const getPublicProject = cache(async (slug: string): Promise<{ project: Project; canonical: string } | null> => {
  if (slug.length > 140 || !/^[a-zA-Z0-9-]+$/.test(slug)) return null;
  const aliasId = publicProjectAliasId(slug);
  let id = aliasId;
  let catalogue: Project[] | undefined;
  if (!id && validProjectId(slug)) id = slug.toLowerCase();
  if (!id && !/-([0-9a-f]{12}|[0-9a-f]{32})$/i.test(slug)) return null;
  if (!id) { catalogue = await getPublicCatalogue(); id = projectIdFromSlug(slug, catalogue) ?? undefined; }
  if (!id) return null;
  if (!aliasId && !catalogue) catalogue = await getPublicCatalogue();
  let body: unknown;
  let missing = false;
  let replacementFor: string | undefined;
  try { body = await readPublicApi(`projects/${id}`); } catch (error) {
    if (!(error instanceof PublicProjectError && error.status === 404)) throw error;
    missing = true;
  }
  if (aliasId && (missing || verifiedArchivedProject(aliasId, body))) {
    const replacementId = publicProjectReplacementId(aliasId);
    // UUID and ID-suffixed requests retain their own identity, including after archival.
    if (!replacementId) return null;
    replacementFor = aliasId;
    id = replacementId;
    try { body = await readPublicApi(`projects/${id}`); } catch (error) {
      if (error instanceof PublicProjectError && error.status === 404) return null;
      throw error;
    }
  } else if (missing) return null;
  const project = publishedLandingProject(id, body) as Project | null;
  if (!project) return null;
  if (replacementFor && (project.businessOpportunity !== true || project.replacesProjectId !== replacementFor)) return null;
  if (!validPublicResponse("details", body)) throw new PublicProjectError(502);
  if (replacementFor) catalogue = await getPublicCatalogue();
  return { project, canonical: catalogue ? catalogueProjectPath(project, catalogue) : publicProjectPath(id, project.title) };
});

export const publicSiteOrigin = () => proxyConfig(process.env).origin;
