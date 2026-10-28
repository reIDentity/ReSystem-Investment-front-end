export type DeviceSignIn = { status: "pending"; userCode: string; verificationUrl: string; qrDataUrl: string; interval: number; expiresAt: string };
export type DeviceSignInStatus = { status: "pending"; interval: number } | { status: "approved" | "denied" | "expired" };

/** Public DTO only. device_code, OAuth tokens and client secrets stay on the API. */
export async function deviceRequest<T>(method: "GET" | "POST" | "DELETE", path: string, csrfToken?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/platform/${path}`, { method, credentials: "include", cache: "no-store", redirect: "error",
      headers: { Accept: "application/json", ...(method !== "GET" ? { "Content-Type": "application/json" } : {}), ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}) },
      body: method !== "GET" ? JSON.stringify({}) : undefined, signal: AbortSignal.timeout(15000) });
  } catch {
    throw new Error("We couldn’t reach sign-in. Check your connection and try again.");
  }
  if (!response.ok) {
    // Use known statuses, never upstream bodies: provider errors can contain
    // internal details. A missing endpoint means a rollout mismatch, not denial.
    const message = response.status === 404 || response.status === 405
      ? "Mobile reID sign-in is being updated. Please try again after the update is complete."
      : response.status === 401 || response.status === 403
        ? "Your sign-in session needs refreshing. Refresh this page and try again."
        : response.status === 415
          ? "Refresh this page to update sign-in, then try again."
          : response.status === 429
            ? "Too many sign-in attempts. Please wait a minute and try again."
            : "We couldn’t connect to reID. Please try again shortly.";
    throw new Error(message);
  }
  try { return await response.json(); }
  catch { throw new Error("We couldn’t verify the sign-in response. Please try again."); }
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
