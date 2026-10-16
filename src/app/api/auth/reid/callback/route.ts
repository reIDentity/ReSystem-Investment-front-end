import { platformEnabled } from "@/lib/platform/server";
import { proxyConfig, proxyPlatform } from "@/lib/platform/proxy";
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "fpreid-connect-sdk";
import { getReidConfig, OAUTH_COOKIES, OAUTH_NEXT, OAUTH_PATH, OAUTH_STATE, OAUTH_VERIFIER } from "@/lib/reid/config";
import { parseInvestorUser, safeInvestorPath, sealSession, SESSION_COOKIE, SESSION_SECONDS, statesMatch } from "@/lib/auth/security";

export async function GET(request: NextRequest) {
  if (platformEnabled()) {
    try { return await proxyPlatform(request, ["auth", "reid", "callback"], proxyConfig(process.env)); }
    catch { return NextResponse.json({ error: "The platform sign-in service is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
  }
  let config;
  try { config = getReidConfig(); }
  catch { return NextResponse.redirect(new URL("/invest?reidError=not_configured", request.url)); }
  const origin = new URL(config.redirectUri).origin;
  function finish(path: string) {
    const response = NextResponse.redirect(new URL(path, origin));
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    for (const name of OAUTH_COOKIES) response.cookies.set(name, "", { path: OAUTH_PATH, maxAge: 0, secure: true, httpOnly: true, sameSite: "lax" });
    return response;
  }
  const fail = (reason: string) => finish(`/invest?reidError=${reason}`);
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get(OAUTH_STATE)?.value;
  const verifier = request.cookies.get(OAUTH_VERIFIER)?.value;
  if (!state || state.length > 256 || !expected || !verifier || !statesMatch(state, expected)) return fail("expired_request");
  const error = request.nextUrl.searchParams.get("error");
  if (error) return fail(error === "access_denied" ? "access_denied" : "sign_in_failed");
  const code = request.nextUrl.searchParams.get("code");
  if (!code || code.length > 2048) return fail("expired_request");
  try {
    const token = await exchangeCodeForToken(config, { code, codeVerifier: verifier });
    if (!token.scope.split(/\s+/).includes("wallet:read")) return fail("wallet_permission");
    const profile = token.profile as typeof token.profile & { kyc_status?: string };
    if (!profile.wallet?.wallet_address) return fail("no_wallet");
    const user = parseInvestorUser({ id: token.user_id, name: (profile.name || profile.username || "reID investor").slice(0, 120), wallet: profile.wallet.wallet_address, kycStatus: token.scope.split(/\s+/).includes("kyc:read") ? profile.kyc_status : "incomplete" });
    if (!user) return fail("invalid_profile");
    // Login only: tokens are used on the server and discarded. They are not
    // placed in cookies, browser storage, rendered props, or application logs.
    const session = await sealSession(user, process.env.SESSION_SECRET!);
    const response = finish(safeInvestorPath(request.cookies.get(OAUTH_NEXT)?.value));
    response.cookies.set(SESSION_COOKIE, session, { path: "/", maxAge: SESSION_SECONDS, httpOnly: true, secure: true, sameSite: "lax" });
    return response;
  } catch {
    // OAuth errors can contain token responses; never print them.
    return fail("sign_in_failed");
  }
}
