/** Pure BFF boundary, separately tested without Next runtime or server credentials. */
export type ProxyConfig = { base: string; origin: string; approvalOrigin: string };
const COOKIES = new Set(["resystem_session", "resystem_csrf", "resystem_oauth"]);
const MAX_BODY = 64 * 1024;
const MAX_RESPONSE = 2 * 1024 * 1024;
const MAX_ATTACHMENT = 3 * 1024 * 1024;
const SAFE = new Set(["GET", "HEAD"]);
const ROUTES: [RegExp, string[]][] = [
  [/^auth\/session$/, ["GET"]], [/^auth\/logout$/, ["POST"]], [/^auth\/reid\/(start|callback)$/, ["GET"]],
  [/^projects(?:\/[a-zA-Z0-9_-]+(?:\/(?:quote|chain|revenue|rewards))?)?$/, ["GET"]],
  [/^(?:wallet(?:\/(?:deposits|send-quote|cashflow))?|portfolio|earnings|activity|marketplace(?:\/(?:proceeds|[0-9]+(?:\/quote)?))?)$/, ["GET"]],
  [/^transactions$/, ["GET", "POST"]], [/^transactions\/[a-zA-Z0-9_-]+$/, ["GET"]],
  [/^transactions\/[a-zA-Z0-9_-]+\/submit$/, ["POST"]],
  [/^support$/, ["GET", "POST"]], [/^support\/[a-zA-Z0-9_-]+$/, ["GET"]], [/^support\/[a-zA-Z0-9_-]+\/messages$/, ["POST"]],
  [/^support\/[a-zA-Z0-9_-]+\/attachments$/, ["GET"]],
  [/^support\/[a-zA-Z0-9_-]+\/messages\/[a-zA-Z0-9_-]+\/attachments$/, ["POST"]],
  [/^support\/[a-zA-Z0-9_-]+\/attachments\/[a-zA-Z0-9_-]+$/, ["DELETE"]],
  [/^support\/[a-zA-Z0-9_-]+\/attachments\/[a-zA-Z0-9_-]+\/content$/, ["GET"]],
  [/^notifications$/, ["GET"]], [/^notifications\/read-all$/, ["PATCH"]], [/^notifications\/[a-zA-Z0-9_-]+\/read$/, ["PATCH"]],
  [/^notification-preferences$/, ["GET", "PATCH"]],
  // Confirmation (verification/confirm, verify) is a backend-hosted page reached from the email link, never proxied.
  [/^email-notifications$/, ["GET", "PATCH", "DELETE"]], [/^email-notifications\/verification$/, ["POST"]],
];
export function proxyConfig(env: Record<string, string | undefined>): ProxyConfig {
  if (!env.PLATFORM_API_BASE) throw new Error("Platform backend is not configured");
  const base = new URL(env.PLATFORM_API_BASE);
  const origin = new URL(env.PLATFORM_APP_ORIGIN || env.REID_REDIRECT_URI || "");
  const approval = new URL(env.REID_APP_URL || "https://app.reidentity.net");
  for (const value of [base, origin, approval]) {
    if (value.username || value.password || !["http:", "https:"].includes(value.protocol)) throw new Error("Invalid platform configuration");
    if (value.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(value.hostname)) throw new Error("HTTPS required");
  }
  if (base.search || base.hash || !["", "/", "/v1", "/v1/"].includes(base.pathname)) throw new Error("Invalid API base");
  return { base: `${base.origin}/v1/`, origin: origin.origin, approvalOrigin: approval.origin };
}
export function platformCookies(cookie: string | null): string {
  return (cookie || "").split(";").map(x => x.trim()).filter(x => COOKIES.has(x.split("=", 1)[0] || "")).join("; ");
}
async function boundedBody(stream: ReadableStream<Uint8Array> | null, limit: number): Promise<Uint8Array> {
  if (!stream) return new Uint8Array();
  const reader = stream.getReader(); const chunks: Uint8Array[] = []; let length = 0;
  while (true) { const part = await reader.read(); if (part.done) break; length += part.value.length; if (length > limit) { await reader.cancel(); throw new Error("Body limit exceeded"); } chunks.push(part.value); }
  const bytes = new Uint8Array(length); let offset = 0; for (const part of chunks) { bytes.set(part, offset); offset += part.length; } return bytes;
}
const failure = (message: string, status: number) => Response.json({ error: { message } }, { status, headers: { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer" } });
export async function proxyPlatform(request: Request, segments: string[], config: ProxyConfig, fetcher: typeof fetch = fetch): Promise<Response> {
  const method = request.method.toUpperCase();
  if (!SAFE.has(method) && request.headers.get("origin") !== config.origin) return failure("Request origin rejected.", 403);
  if (segments.some(x => !/^[a-zA-Z0-9_-]+$/.test(x))) return failure("Route unavailable.", 404);
  const path = segments.join("/");
  const attachmentUpload = /^support\/[a-zA-Z0-9_-]+\/messages\/[a-zA-Z0-9_-]+\/attachments$/.test(path);
  const attachmentContent = /^support\/[a-zA-Z0-9_-]+\/attachments\/[a-zA-Z0-9_-]+\/content$/.test(path);
  if (!ROUTES.some(([pattern, methods]) => pattern.test(path) && methods.includes(method))) return failure("Route unavailable.", 404);
  if ((request.headers.get("cookie") || "").length > 16384) return failure("Request headers too large.", 431);
  const query = new URL(request.url).search; if (query.length > 4096) return failure("Query too large.", 414);
  const headers = new Headers({ Accept: "application/json", Origin: config.origin });
  const cookie = platformCookies(request.headers.get("cookie")); if (cookie) headers.set("Cookie", cookie);
  for (const name of ["x-csrf-token", "idempotency-key"]) { const value = request.headers.get(name); if (value && value.length <= 128) headers.set(name, value); }
  let body: Uint8Array | undefined;
  if (!SAFE.has(method)) {
    if (!headers.has("x-csrf-token")) return failure("Refresh your session before making a change.", 403);
    const limit = attachmentUpload ? MAX_ATTACHMENT + 1024 * 1024 : MAX_BODY;
    const contentType = request.headers.get("content-type") || "";
    if (Number(request.headers.get("content-length") || 0) > limit) return failure("Request body too large.", 413);
    if (attachmentUpload && (!/^multipart\/form-data;\s*boundary=.{1,200}$/i.test(contentType) || !/^[a-zA-Z0-9_-]{16,100}$/.test(headers.get("idempotency-key") || ""))) return failure("A private image and retry key are required.", 415);
    if (!attachmentUpload && request.body && !contentType.startsWith("application/json")) return failure("JSON body required.", 415);
    try { body = await boundedBody(request.body, limit); } catch { return failure("Request body too large.", 413); }
    if (body.length) headers.set("Content-Type", attachmentUpload ? contentType : "application/json");
  }
  let upstream: Response;
  try { upstream = await fetcher(`${config.base}${path}${query}`, { method, headers, ...(body?.length ? { body: body as BodyInit } : {}), cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(attachmentUpload ? 45000 : 20000) }); }
  catch { return failure("The platform service is unavailable. Please retry shortly.", 503); }
  const outgoing = new Headers({ "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" });
  for (const value of upstream.headers.getSetCookie()) {
    const name = value.split("=", 1)[0] || "";
    if (COOKIES.has(name)) outgoing.append("Set-Cookie", value.replace(/;\s*Domain=[^;]*/gi, "").replace(/;\s*Path=[^;]*/gi, "") + "; Path=/" + (config.origin.startsWith("https:") && !/;\s*Secure(?:;|$)/i.test(value) ? "; Secure" : ""));
  }
  const location = upstream.headers.get("location");
  if (location) {
    if (attachmentContent || attachmentUpload) return failure("Private image redirects are not permitted.", 502);
    let url: URL; try { url = new URL(location, config.origin); } catch { return failure("Invalid sign-in redirect.", 502); }
    if (url.username || url.password || ![config.origin, config.approvalOrigin].includes(url.origin)) return failure("Untrusted sign-in redirect.", 502);
    outgoing.set("Location", url.href); return new Response(null, { status: upstream.status, headers: outgoing });
  }
  if (attachmentContent && upstream.ok) {
    if (upstream.headers.get("content-type")?.split(";", 1)[0].toLowerCase() !== "image/webp") return failure("The private image response could not be verified.", 502);
    outgoing.set("Content-Type", "image/webp");
    outgoing.set("Content-Disposition", 'attachment; filename="support-image.webp"');
    outgoing.set("Content-Security-Policy", "default-src 'none'; sandbox");
    try { return new Response(await boundedBody(upstream.body, MAX_ATTACHMENT) as BodyInit, { status: 200, headers: outgoing }); }
    catch { return failure("The private image response could not be read.", 502); }
  }
  outgoing.set("Content-Type", "application/json; charset=utf-8");
  try { const bytes = await boundedBody(upstream.body, MAX_RESPONSE); return new Response([204, 304].includes(upstream.status) ? null : bytes as BodyInit, { status: upstream.status, headers: outgoing }); }
  catch { return failure("The platform response could not be read.", 502); }
}
