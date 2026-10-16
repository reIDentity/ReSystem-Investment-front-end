import { platformEnabled } from "@/lib/platform/server";
import { proxyConfig, proxyPlatform } from "@/lib/platform/proxy";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/security";
import { getReidConfig, OAUTH_COOKIES, OAUTH_PATH } from "@/lib/reid/config";

export async function POST(request: NextRequest) {
  if (platformEnabled()) {
    try { return await proxyPlatform(request, ["auth", "logout"], proxyConfig(process.env)); }
    catch { return NextResponse.json({ error: "The platform sign-in service is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
  }
  const origin = new URL(getReidConfig().redirectUri).origin;
  if (request.headers.get("origin") !== origin) return new NextResponse("Invalid request origin", { status: 403 });
  const response = NextResponse.redirect(new URL("/invest", origin), 303);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, secure: true, sameSite: "lax" });
  for (const name of OAUTH_COOKIES) response.cookies.set(name, "", { path: OAUTH_PATH, maxAge: 0, secure: true });
  return response;
}
