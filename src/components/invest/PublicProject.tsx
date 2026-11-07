"use client";
import Link from "next/link";
import useSWR from "swr";
import type { SalePhasesResponse } from "@/lib/platform/api.generated";
import type { Project, ProjectState, RewardView } from "@/lib/platform/types";
import { percentage } from "@/lib/platform/money";
import { publicIpfsUrl } from "@/lib/platform/media";
import { projectContributionPath, PublicProjectError, publicSale, readPublicProject } from "@/lib/platform/public-project";
import { ActionFeedbackProvider } from "../ActionFeedback";
import { Asset, DataState, InvestorLogo, Panel } from "./InvestorUI";
import { ProjectOverview, SupplyTiles } from "./ProjectOverview";
import { ShareAllocation } from "./ShareAllocation";
import "./ProductDetail.css";
import "./PublicProject.css";

const readOptions = { shouldRetryOnError: false, refreshInterval: 30000 };
function ProjectPage({ id, initialProject }: { id: string; initialProject?: Project }) {
  const project = useSWR(["public-project", id], () => readPublicProject<Project>(id), { ...readOptions, ...(initialProject ? { fallbackData: initialProject, revalidateOnMount: false } : {}) });
  const p = project.error ? undefined : project.data;
  const state = useSWR(p ? ["public-project-chain", id] : null, () => readPublicProject<ProjectState>(id, "chain"), readOptions);
  const revenue = useSWR(p ? ["public-project-revenue", id] : null, () => readPublicProject<RewardView>(id, "revenue"), readOptions);
  const phases = useSWR(p?.businessOpportunity ? ["public-project-phases", id] : null, () => readPublicProject<SalePhasesResponse>(id, "phases"), readOptions);
  const { supply, view, limit, nativePrice, usdtPrice } = publicSale(p, state.error ? undefined : state.data, phases.error ? undefined : phases.data);
  const signIn = projectContributionPath(id);
  const total = supply?.maxFractions ?? p?.maxFractions;
  const issued = supply && total ? percentage(supply.totalSupply, total) : "—";
  const documents = p?.media?.filter(m => m.mimeType === "application/pdf" && /^[a-zA-Z0-9]{32,120}$/.test(m.cid)) ?? [];
  const unavailable = project.error instanceof PublicProjectError && project.error.status === 404;
  return <div className="investor-app iv-product iv-public-project"><div className="iv-frame">
    <header className="iv-header iv-public-header"><Link href="/" aria-label="reSystem Investment website"><InvestorLogo /></Link><nav aria-label="Project navigation"><Link href="/#where">All projects</Link></nav><Link className="iv-button iv-primary" href={signIn} prefetch={false}>Connect with reID</Link></header>
    <div className="iv-page-heading iv-public-heading"><div><h1>{p?.title ?? (unavailable ? "Project unavailable" : "Project details")}</h1><p>Explore the project. Connect with reID when you’re ready to invest.</p></div>{p && <div className="iv-heading-actions"><Link className="iv-button iv-primary" href={signIn} prefetch={false}>Contribute</Link></div>}</div>
    <main className="iv-content">
      <DataState publicView loading={project.isLoading} error={project.error} onRetry={() => void project.mutate()} />
      {p && <div className="iv-product-detail iv-pd-page">
        <ProjectOverview publicView project={{ ...project, data: p }} state={{ ...state, data: supply }} revenue={revenue} saleLimit={limit} supplyTotal={total} nativePrice={nativePrice} usdtPrice={usdtPrice} issuedPercent={issued} view={view} />
        <Panel className="iv-invest-panel"><div id="invest" className="iv-invest-anchor" /><div className="iv-panel-toolbar"><div><p className="iv-eyebrow">INVEST / {p.title.toUpperCase()}</p><h2>Choose your shares</h2></div><div className="iv-document-links">{documents.length ? documents.map(m => <a className="iv-button iv-document" href={publicIpfsUrl(m.cid)} target="_blank" rel="noopener noreferrer" key={m.cid}><Asset name="92135" width={16} />{m.filename} ↗</a>) : <span className="iv-pd-document-empty"><Asset name="92135" width={16} />No documents published</span>}</div></div>
          <div className="iv-block-selector"><ShareAllocation publicView total={total} issued={supply?.totalSupply} remaining={supply?.remainingSupply} phased={!!p.businessOpportunity} view={view} saleLimit={limit} walletLimit={null} asset="REAED" saleOpen={supply?.saleOpen} paused={supply?.purchasePaused} noGas={false} phasedLoading={state.isLoading || phases.isLoading} />
            <DataState publicView error={phases.error} onRetry={() => void phases.mutate()} />
            <div className="iv-block-legend"><span><i className="iv-pd-issued-key" />ISSUED</span><span><i className="iv-legend-available" />ON SALE</span>{(p.businessOpportunity || limit === 0n) && <span><i className="iv-pd-later-key" />NOT ON SALE</span>}{p.businessOpportunity && <span><i className="iv-pd-reserved-key" />RESERVED</span>}<span>SUPPLY OVERVIEW · 2% PER TILE</span></div><div className="iv-block-grid-wrap"><SupplyTiles issued={limit === null ? undefined : supply?.totalSupply} maximum={total} reserved={view?.reservedBlocks} onSale={limit?.toString()} /></div>
            <Link className="iv-button iv-primary" href={signIn} prefetch={false}>Connect with reID to invest</Link>
          </div>
        </Panel>
      </div>}
    </main>
  </div></div>;
}

export function PublicProject({ id, initialProject }: { id: string; initialProject?: Project }) { return <ActionFeedbackProvider><ProjectPage id={id} initialProject={initialProject} /></ActionFeedbackProvider>; }
