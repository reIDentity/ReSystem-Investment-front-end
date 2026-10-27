export type DeviceSignIn = { status: "pending"; userCode: string; verificationUrl: string; qrDataUrl: string; interval: number; expiresAt: string };
export type DeviceSignInStatus = { status: "pending"; interval: number } | { status: "approved" | "denied" | "expired" };

/** Public DTO only. device_code, OAuth tokens and client secrets stay on the API. */
export async function deviceRequest<T>(method: "GET" | "POST" | "DELETE", path: string, csrfToken?: string): Promise<T> {
  const response = await fetch(`/api/platform/${path}`, { method, credentials: "include", cache: "no-store", redirect: "error",
    headers: { Accept: "application/json", ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}) }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(response.status === 429 ? "Too many sign-in attempts. Please wait a minute and try again." : "Mobile reID sign-in is temporarily unavailable. Please try again shortly.");
  return response.json();
}
export function validDeviceSignIn(value: DeviceSignIn, origin: string): boolean {
  try {
    const url = new URL(value.verificationUrl);
    return value.status === "pending" && /^[A-Z0-9-]{4,32}$/.test(value.userCode) &&
      url.protocol === "https:" && url.origin === origin && !url.username && !url.password && !url.hash &&
      url.pathname === "/connect/device" && url.searchParams.get("user_code") === value.userCode &&
      Array.from(url.searchParams.keys()).length === 1 &&
      /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value.qrDataUrl) && value.qrDataUrl.length <= 65536 &&
      Number.isSafeInteger(value.interval) && value.interval >= 5 && value.interval <= 300 &&
      Date.parse(value.expiresAt) > Date.now() && Date.parse(value.expiresAt) <= Date.now() + 3600000;
  } catch { return false; }
}
