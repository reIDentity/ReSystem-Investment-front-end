"use client";
import type { SessionResponse } from "./api.generated";
import { platformErrorMessage } from "./errors";
export const SESSION_EXPIRED_EVENT = "resystem:investor-session-expired";
function expireSession() { if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT)); }
export class PlatformError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status; } }
async function read<T>(path: string, options: RequestInit = {}): Promise<T> {
  const mutation = options.method && options.method !== "GET";
  const uncertain = path.startsWith("transactions")
    ? "The response was interrupted. Your request may have reached the platform. Check this transaction in Activity before starting another; do not repeat an uncertain approval."
    : "The response was interrupted. Your change may already be saved. Refresh this page to check before repeating it.";
  let response: Response;
  try { response = await fetch(`/api/platform/${path}`, { ...options, credentials: "same-origin", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(typeof FormData !== "undefined" && options.body instanceof FormData ? 50000 : 25000) }); }
  catch { throw new PlatformError(mutation ? uncertain : "The platform service could not be reached. Please check your connection and try again.", 503); }
  if (response.status === 401) expireSession();
  if (response.ok && response.status === 204) return undefined as T;
  let body; try { body = await response.json(); } catch { throw new PlatformError(mutation ? uncertain : "The platform returned an unreadable response. Please refresh and try again.", response.status); }
  if (!response.ok) {
    const message = platformErrorMessage(body, response.status);
    // A gateway/server failure can happen after a mutation committed. Preserve
    // known, actionable refusals, but do not turn an unknown outcome into a retry.
    throw new PlatformError(mutation && response.status >= 500 && message === platformErrorMessage({}, response.status) ? uncertain : message, response.status);
  }
  return body as T;
}
export async function api<T>(path: string, options: { method?: "POST" | "PATCH" | "DELETE"; body?: unknown; idempotencyKey?: string } = {}): Promise<T> {
  if (!options.method) return read<T>(path);
  const session = await read<SessionResponse>("auth/session");
  if (!session.authenticated || session.kind !== "investor") { expireSession(); throw new PlatformError("Connect with reID again before making a change.", 401); }
  const multipart = typeof FormData !== "undefined" && options.body instanceof FormData;
  return read<T>(path, { method: options.method, headers: { ...(!multipart ? { "Content-Type": "application/json" } : {}), "X-CSRF-Token": session.csrfToken, ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}) }, body: multipart ? options.body as FormData : JSON.stringify(options.body ?? {}) });
}
