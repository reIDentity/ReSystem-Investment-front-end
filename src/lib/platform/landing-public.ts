import { loadLanding } from "./landing-data";

/** Only public GETs, without sessions or credentials; a single deadline bounds the entire fan-out. */
export async function fetchLanding() {
  const controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]);
  try {
    return await loadLanding(async path => {
      signal.throwIfAborted();
      const response = await fetch(`/api/platform/${path}`, { method: "GET", credentials: "omit", cache: "no-store", redirect: "error", headers: { Accept: "application/json" }, signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]) });
      if (!response.ok) { await response.body?.cancel(); throw new Error("Public project data unavailable"); }
      // Bound individual public responses; JSON is parsed only after the streaming byte limit passes.
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Unreadable public project data");
      const parts: Uint8Array[] = []; let size = 0;
      try {
        while (true) {
          const next = await reader.read(); if (next.done) break;
          size += next.value.byteLength;
          if (size > 2 * 1024 * 1024) throw new Error("Public response exceeds limit");
          parts.push(next.value);
        }
      } finally { await reader.cancel(); }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
      return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    });
  } finally { controller.abort(); }
}
