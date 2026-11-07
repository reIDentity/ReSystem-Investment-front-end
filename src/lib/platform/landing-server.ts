import "server-only";
import { cacheLife } from "next/cache";
import { Buffer } from "node:buffer";
import { getPublicCatalogue, readPublicApi } from "./public-project-server";
import { loadLanding } from "./landing-data";
import type { PublicLandingSnapshot } from "./landing-public";

export async function getInitialLandingCatalogue() {
  const projects = await getPublicCatalogue();
  return { projects, fetchedAt: Date.now() };
}

/** Only anonymous published facts are shared; no request/session input is read. */
export async function getLandingPublicSnapshot(): Promise<PublicLandingSnapshot> {
  "use cache";
  cacheLife({ stale: 0, revalidate: 15, expire: 30 });
  const controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]);
  const facts = new Map<string, unknown>();
  let bytes = 0;
  try {
    const projects = await getPublicCatalogue();
    bytes = Buffer.byteLength(JSON.stringify(projects));
    if (bytes > 8 * 1024 * 1024) throw new Error("Public snapshot exceeds limit");
    const snapshot = await loadLanding(async path => {
      if (path === "projects" || path.startsWith("projects?cursor=")) {
        const cursor = new URLSearchParams(path.split("?", 2)[1]).get("cursor");
        const start = cursor ? projects.findIndex(p => p.id === cursor) + 1 : 0;
        if (cursor && start === 0) throw new Error("Invalid catalogue cursor");
        const items = projects.slice(start, start + 50);
        return { items, nextCursor: start + items.length < projects.length ? items.at(-1)!.id : null };
      }
      signal.throwIfAborted();
      const value = await readPublicApi(path, signal);
      bytes += Buffer.byteLength(JSON.stringify(value));
      if (bytes > 8 * 1024 * 1024) { controller.abort(); throw new Error("Public snapshot exceeds limit"); }
      facts.set(path, value);
      return value;
    });
    if (controller.signal.aborted) throw new Error("Public snapshot exceeds limit");
    const result = { fetchedAt: snapshot.fetchedAt, items: snapshot.projects.map(({ project }) => ({ project, chain: facts.get(`projects/${project.id}/chain`) ?? null, revenue: facts.get(`projects/${project.id}/revenue`) ?? null })) };
    if (Buffer.byteLength(JSON.stringify(result)) > 8 * 1024 * 1024) throw new Error("Public snapshot exceeds limit");
    return result;
  } finally { controller.abort(); }
}
