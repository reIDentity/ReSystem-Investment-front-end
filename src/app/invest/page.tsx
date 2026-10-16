import { InvestorSignIn } from "@/components/invest/SignIn";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getInvestorUser } from "@/lib/auth/session";
import { safeInvestorPath } from "@/lib/auth/security";

export const instant = false;

async function SignIn({ searchParams }: { searchParams: Promise<{ reidError?: string; next?: string }> }) {
  const [user, params] = await Promise.all([getInvestorUser(), searchParams]);
  if (user && !params.reidError) redirect(safeInvestorPath(params.next));
  return <InvestorSignIn error={params.reidError} next={safeInvestorPath(params.next)} />;
}

export default function Page({ searchParams }: { searchParams: Promise<{ reidError?: string; next?: string }> }) {
  return <Suspense fallback={<div className="investor-app iv-auth-loading" role="status">Loading reID sign-in…</div>}><SignIn searchParams={searchParams} /></Suspense>;
}
