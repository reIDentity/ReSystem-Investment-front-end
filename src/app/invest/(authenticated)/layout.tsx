import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getInvestorUser } from "@/lib/auth/session";
import { DemoProvider } from "@/components/invest/DemoProvider";

async function AuthenticatedInvestor({ children }: { children: ReactNode }) {
  const user = await getInvestorUser();
  if (!user) redirect("/invest");
  return <DemoProvider user={user} key={user.id}>{children}</DemoProvider>;
}

export default function Layout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="investor-app iv-auth-loading" role="status">Opening your investor dashboard…</div>}><AuthenticatedInvestor>{children}</AuthenticatedInvestor></Suspense>;
}
