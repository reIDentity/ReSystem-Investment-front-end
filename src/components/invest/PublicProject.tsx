"use client";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import type { ChainsResponse, ProjectSupplyResponse, SalePhasesResponse } from "@/lib/platform/api.generated";
import type { Project, ProjectState, RewardView } from "@/lib/platform/types";
import { percentage } from "@/lib/platform/money";
import { publicIpfsUrl } from "@/lib/platform/media";
import { projectContributionPath, PublicProjectError, publicSale, readPublicChains, readPublicProject } from "@/lib/platform/public-project";
import { multichainNetworks, multichainSaleLimit, multichainState, phasedView } from "@/lib/platform/multichain-view";
import { ActionFeedbackProvider } from "../ActionFeedback";
import { Asset, DataState, InvestorLogo, Panel } from "./InvestorUI";
import { ProjectOverview, SupplyTiles } from "./ProjectOverview";
import { ShareAllocation } from "./ShareAllocation";
import "./ProductDetail.css";
import styles from "./ProjectPageDesign.module.css";

const readOptions = { shouldRetryOnError: false, refreshInterval: 30000 };
function ProjectPage({ id, initialProject }: { id: string; initialProject?: Project }) {
  const project = useSWR(["public-project", id], () => readPublicProject<Project>(id), { ...readOptions, ...(initialProject ? { fallbackData: initialProject, revalidateOnMount: false } : {}) });
  const p = project.error ? undefined : project.data;
  const multichain = p?.deploymentMode === "MULTICHAIN";
  const state = useSWR(p && !multichain ? ["public-project-chain", id] : null, () => readPublicProject<ProjectState>(id, "chain"), readOptions);
  const revenue = useSWR(p && !multichain ? ["public-project-revenue", id] : null, () => readPublicProject<RewardView>(id, "revenue"), readOptions);
  const phases = useSWR(p?.businessOpportunity && !multichain ? ["public-project-phases", id] : null, () => readPublicProject<SalePhasesResponse>(id, "phases"), readOptions);
  const shared = useSWR(multichain ? ["public-project-supply", id] : null, () => readPublicProject<ProjectSupplyResponse>(id, "supply"), readOptions);
  const chains = useSWR(multichain ? ["public-chains"] : null, () => readPublicChains<ChainsResponse>(), { ...readOptions, refreshInterval: 0 });
  const [now] = useState(() => Date.now());
  const sharedSupply = shared.error ? undefined : shared.data;
  const infra = publicSale(p, state.error ? undefined : state.data, phases.error ? undefined : phases.data);
  const multichainSale = sharedSupply ? multichainSaleLimit(sharedSupply, now) : null;
  const supply = multichain ? (sharedSupply ? multichainState(sharedSupply) : undefined) : infra.supply;
  const view = multichain ? (sharedSupply ? phasedView(sharedSupply, now) : undefined) : infra.view;
  const limit = multichain ? (multichainSale ? multichainSale.limit : null) : infra.limit;
  const usdtPrice = multichain ? multichainSale?.current?.priceUsdtMicros ?? undefined : infra.usdtPrice;
  const nativePrice = multichain ? null : infra.nativePrice;
  const networks = multichain && sharedSupply && chains.data && !chains.error ? multichainNetworks(sharedSupply, chains.data.chains) : undefined;
  const noRevenue = { data: undefined, isLoading: false, error: undefined, mutate: () => undefined };
  const supplyState = multichain ? { data: supply, error: shared.error, isLoading: shared.isLoading, mutate: () => shared.mutate() } : { ...state, data: supply };
  const total = supply?.maxFractions ?? p?.maxFractions;
  const signIn = projectContributionPath(id);
  const issued = supply && total ? percentage(supply.totalSupply, total) : "—";
  const documents = p?.media?.filter(m => m.mimeType === "application/pdf" && /^[a-zA-Z0-9]{32,120}$/.test(m.cid)) ?? [];
  const unavailable = project.error instanceof PublicProjectError && project.error.status === 404;
  return <div className={`investor-app iv-product iv-public-project ${styles.publicPage}`}><div className={`iv-frame ${styles.publicFrame}`}>
    <header className={`iv-header iv-public-header ${styles.publicHeader}`}><Link href="/" aria-label="reSystem Investment website"><InvestorLogo /></Link><nav aria-label="Project navigation"><Link href="/#where">All projects</Link></nav><Link className="iv-button iv-primary" href={signIn} prefetch={false}>Connect with reID</Link></header>
    <div className={`iv-page-heading iv-public-heading ${styles.publicHeading}`}><div><h1>{p?.title ?? (unavailable ? "Project unavailable" : "Project details")}</h1><p>Explore the project. Connect with reID when you’re ready to invest.</p></div>{p && <div className="iv-heading-actions"><Link className="iv-button iv-primary" href={signIn} prefetch={false}>Contribute</Link></div>}</div>
    <main className={`iv-content ${styles.publicMain}`}>
      <DataState publicView loading={project.isLoading} error={project.error} onRetry={() => void project.mutate()} />
      {p && <div className={`iv-product-detail iv-pd-page ${styles.content}`}>
        <ProjectOverview allocationLoading={multichain ? shared.isLoading : phases.isLoading} publicView project={{ ...project, data: p }} state={supplyState} revenue={multichain ? noRevenue : revenue} saleLimit={limit} supplyTotal={total} nativePrice={nativePrice} usdtPrice={usdtPrice} issuedPercent={issued} view={view} networks={networks} />
        <Panel className={`iv-invest-panel ${styles.choosePanel}`}>
          <div id="invest" className="iv-invest-anchor" />
          <div className={styles.chooseLayout}>
            <div className={styles.chooseSummary}>
              <div className="iv-panel-toolbar"><div><p className="iv-eyebrow">INVEST / {p.title.toUpperCase()}</p><h2>Choose your shares</h2></div><div className="iv-document-links">{documents.length ? documents.map(m => <a className="iv-button iv-document" href={publicIpfsUrl(m.cid)} target="_blank" rel="noopener noreferrer" key={m.cid}><Asset name="92135" width={16} />{m.filename} ↗</a>) : <span className="iv-pd-document-empty"><Asset name="92135" width={16} />No documents published</span>}</div></div>
              <ShareAllocation publicView total={total} issued={supply?.totalSupply} remaining={supply?.remainingSupply} phased={multichain || !!p.businessOpportunity} view={view} saleLimit={limit} walletLimit={null} asset={multichain ? "USDT" : "REAED"} saleOpen={supply?.saleOpen} paused={supply?.purchasePaused} noGas={false} phasedLoading={multichain ? shared.isLoading : state.isLoading || phases.isLoading} />
            <DataState publicView error={multichain ? shared.error : phases.error} onRetry={() => void (multichain ? shared.mutate() : phases.mutate())} />
            </div>
            <div className={styles.chooseActions}>
              <div className={styles.supplyPanel}><div className="iv-block-legend"><span><i className="iv-pd-issued-key" />ISSUED</span><span><i className="iv-legend-available" />ON SALE</span>{(multichain || p.businessOpportunity || limit === 0n) && <span><i className="iv-pd-later-key" />NOT ON SALE</span>}{(multichain || p.businessOpportunity) && <span><i className="iv-pd-reserved-key" />RESERVED</span>}<span>SUPPLY OVERVIEW · 2% PER TILE</span></div><div className="iv-block-grid-wrap"><SupplyTiles issued={limit === null ? undefined : supply?.totalSupply} maximum={total} reserved={view?.reservedBlocks} onSale={limit?.toString()} /></div></div>
              <p className={styles.approvalNote}>Connect with reID to check your balance and review an investment. No funds move until you approve.</p>
              <Link className={`iv-button iv-primary ${styles.publicInvest}`} href={signIn} prefetch={false}>Connect with reID to invest<span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </Panel>
      </div>}
    </main>
  </div></div>;
}

export function PublicProject({ id, initialProject }: { id: string; initialProject?: Project }) { return <ActionFeedbackProvider><ProjectPage id={id} initialProject={initialProject} /></ActionFeedbackProvider>; }
