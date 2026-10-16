import "server-only";
import { getPlatformSession, platformEnabled } from "@/lib/platform/server";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import { openSession, SESSION_COOKIE } from "./security";

export const getInvestorUser = cache(async () => {
  // Session expiry and provider timeouts are request-time work, including when
  // Cache Components probes a route without a cookie during development.
  await connection();
  if (platformEnabled()) {
    const session = await getPlatformSession();
    if (!session?.user?.walletAddress) return null;
    return { id: session.user.id, name: session.user.name || "reID investor", wallet: session.user.walletAddress, kycStatus: session.user.kycStatus };
  }
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  return openSession(cookie, process.env.SESSION_SECRET);
});
