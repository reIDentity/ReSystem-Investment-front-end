import { NextRequest, NextResponse } from "next/server";
import { openSession, safeInvestorPath, SESSION_COOKIE } from "@/lib/auth/security";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/invest") return NextResponse.next();
  const user = await openSession(request.cookies.get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET);
  if (user) return NextResponse.next();
  const url = new URL("/invest", request.url);
  url.searchParams.set("next", safeInvestorPath(`${request.nextUrl.pathname}${request.nextUrl.search}`));
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = { matcher: ["/invest/:path*"] };
