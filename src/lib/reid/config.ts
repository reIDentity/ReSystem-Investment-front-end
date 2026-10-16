import "server-only";
import type { ReidConnectConfig, ReidScope } from "fpreid-connect-sdk";

export const REID_SCOPES: ReidScope[] = ["profile", "wallet:read", "kyc:read" as ReidScope];
export const OAUTH_PATH = "/api/auth/reid";
export const OAUTH_STATE = "resystem_reid_state";
export const OAUTH_VERIFIER = "resystem_reid_verifier";
export const OAUTH_NEXT = "resystem_reid_next";
export const OAUTH_COOKIES = [OAUTH_STATE, OAUTH_VERIFIER, OAUTH_NEXT];

export function getReidConfig(): ReidConnectConfig {
  const clientId = process.env.REID_CLIENT_ID;
  const clientSecret = process.env.REID_CLIENT_SECRET;
  const redirectUri = process.env.REID_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri || (process.env.SESSION_SECRET?.length ?? 0) < 32) throw new Error("reID is not configured");
  const callback = new URL(redirectUri);
  if (callback.protocol !== "https:" || callback.pathname !== `${OAUTH_PATH}/callback` || callback.search || callback.hash || callback.username || callback.password) throw new Error("Invalid reID callback URL");
  return { clientId, clientSecret, redirectUri, baseUrl: process.env.REID_BASE_URL || "https://uat-wallet.reidentity.net", appUrl: process.env.REID_APP_URL || "https://app.reidentity.net" };
}

export function oauthCookieOptions() {
  return { httpOnly: true, secure: true, sameSite: "lax" as const, path: OAUTH_PATH, maxAge: 600 };
}
