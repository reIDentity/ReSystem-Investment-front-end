import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getInvestorUser } from "@/lib/auth/session";
import { PlatformProvider } from "@/components/invest/PlatformProvider";
import { approvalOrigin, getPlatformSession, platformEnabled } from "@/lib/platform/server";

export const instant = false;

async function AuthenticatedInvestor({ children }: { children: ReactNode }) {
  const user = await getInvestorUser();
  if (!user) redirect("/invest");
  const session = platformEnabled() ? await getPlatformSession() : null;
  return <PlatformProvider initialSession={session} user={user} key={user.id} live={platformEnabled()} approvalOrigin={approvalOrigin()}>{children}</PlatformProvider>;
}

export default function Layout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="investor-app iv-auth-loading" role="status">Opening your investor dashboard…</div>}><AuthenticatedInvestor>{children}</AuthenticatedInvestor></Suspense>;
}
