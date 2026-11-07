import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PublicProject } from "@/components/invest/PublicProject";
import { validProjectId } from "@/lib/platform/public-project";

export const metadata: Metadata = { title: "Project details — reSystem Investment", description: "Explore published project prices, share allocations and confirmed revenue before connecting with reID to invest." };

async function ProjectContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validProjectId(id)) notFound();
  return <PublicProject key={id} id={id} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<div className="investor-app iv-auth-loading" role="status">Opening project details…</div>}><ProjectContent params={params} /></Suspense>;
}
