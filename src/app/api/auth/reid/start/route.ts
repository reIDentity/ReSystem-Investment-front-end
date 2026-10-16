import { platformEnabled } from "@/lib/platform/server";
import { proxyConfig, proxyPlatform } from "@/lib/platform/proxy";
import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl, generatePkcePair, generateState } from "fpreid-connect-sdk";
import { getReidConfig, oauthCookieOptions, OAUTH_NEXT, OAUTH_STATE, OAUTH_VERIFIER, REID_SCOPES } from "@/lib/reid/config";
import { safeInvestorPath } from "@/lib/auth/security";

export async function GET(request: NextRequest) {
  if (platformEnabled()) {
    try {
      const config = proxyConfig(process.env);
      const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
      const protocol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
      if (new URL(`${protocol}://${host}`).origin !== config.origin) return NextResponse.redirect(new URL("/api/auth/reid/start", config.origin));
      return await proxyPlatform(request, ["auth", "reid", "start"], config);
    }
    catch { return NextResponse.json({ error: "The platform sign-in service is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
  }
  let config;
  try { config = getReidConfig(); }
  catch { return NextResponse.redirect(new URL("/invest?reidError=not_configured", request.url)); }
  const origin = new URL(config.redirectUri).origin;
  // Next's request URL may name the listen address (0.0.0.0). Match the
  // browser's host instead; redirects always use the configured origin.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  let incomingOrigin: string;
  try { incomingOrigin = new URL(`${protocol}://${host}`).origin; }
  catch { incomingOrigin = ""; }
  // Set host-scoped OAuth cookies on the registered callback host, including
  // when the website was opened through the Wi-Fi address or a preview URL.
  if (incomingOrigin !== origin) {
    const canonical = new URL("/api/auth/reid/start", origin);
    canonical.searchParams.set("next", safeInvestorPath(request.nextUrl.searchParams.get("next")));
    return NextResponse.redirect(canonical);
  }
  const { verifier, challenge } = await generatePkcePair();
  const state = await generateState();
  const response = NextResponse.redirect(buildAuthorizeUrl(config, { codeChallenge: challenge, state, scope: REID_SCOPES }));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.set(OAUTH_VERIFIER, verifier, oauthCookieOptions());
  response.cookies.set(OAUTH_STATE, state, oauthCookieOptions());
  response.cookies.set(OAUTH_NEXT, safeInvestorPath(request.nextUrl.searchParams.get("next")), oauthCookieOptions());
  return response;
}
