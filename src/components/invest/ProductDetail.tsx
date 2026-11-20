"use client";
import Link from "next/link";
import type { Project } from "@/lib/platform/types";
import { useResource } from "./PlatformProvider";
import { DataState, InvestorShell, Panel } from "./InvestorUI";
import { MultichainProduct } from "./MultichainProduct";
import "./ProductDetail.css";

export function InvestorProduct({ id }: { id: string }) {
  const project = useResource<Project>(`projects/${id}`);
  if (project.data?.deploymentMode === "MULTICHAIN") return <MultichainProduct id={id} />;
  return <InvestorShell page="product" title="Project details" subtitle="Explore the project. Own a share of what comes next.">
    {!project.data && !project.error ? <DataState loading /> : project.error ? <DataState error={project.error} onRetry={() => void project.mutate()} /> : <Panel title={project.data!.title}><p>This project runs on INFRA, which is coming soon. Projects on BNB Smart Chain, Ethereum and TRON are open now.</p><Link className="iv-button iv-primary" href="/invest/explore">Explore live projects</Link></Panel>}
  </InvestorShell>;
}
