"use client";
import type { SessionResponse } from "./api.generated";
export class PlatformError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status; } }
async function read<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(`/api/platform/${path}`, { ...options, credentials: "same-origin", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(25000) }); }
  catch { throw new PlatformError("The platform service could not be reached. Your balances have not been changed by this screen.", 503); }
  let body; try { body = await response.json(); } catch { throw new PlatformError("The platform returned an unreadable response.", response.status); }
  if (!response.ok) throw new PlatformError(response.status >= 500 ? "The platform service is temporarily unavailable. Please retry shortly." : typeof body?.error?.message === "string" ? body.error.message : response.status === 401 ? "Your session expired. Connect with reID again." : "The request could not be completed. Refresh and try again.", response.status);
  return body as T;
}
export async function api<T>(path: string, options: { method?: "POST" | "PATCH"; body?: unknown; idempotencyKey?: string } = {}): Promise<T> {
  if (!options.method) return read<T>(path);
  const session = await read<SessionResponse>("auth/session");
  if (!session.authenticated || session.kind !== "investor") throw new PlatformError("Connect with reID again before making a change.", 401);
  return read<T>(path, { method: options.method, headers: { "Content-Type": "application/json", "X-CSRF-Token": session.csrfToken, ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}) }, body: JSON.stringify(options.body ?? {}) });
}
