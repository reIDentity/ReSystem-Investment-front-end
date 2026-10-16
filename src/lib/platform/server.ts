import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { proxyConfig, platformCookies } from "./proxy";
import type { SessionResponse } from "./api.generated";
export const platformEnabled = () => Boolean(process.env.PLATFORM_API_BASE);
export const getPlatformSession = cache(async (): Promise<SessionResponse | null> => {
  if (!platformEnabled()) return null;
  try {
    const config = proxyConfig(process.env);
    const response = await fetch(`${config.base}auth/session`, { headers: { Cookie: platformCookies((await cookies()).toString()), Origin: config.origin }, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    const session = await response.json() as SessionResponse;
    return session.authenticated && session.kind === "investor" && session.user?.walletAddress && /^0x[0-9a-f]{40}$/i.test(session.user.walletAddress) ? session : null;
  } catch { return null; }
});
export function approvalOrigin() { try { return proxyConfig(process.env).approvalOrigin; } catch { return "https://app.reidentity.net"; } }
