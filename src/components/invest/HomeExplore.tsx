"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { MultichainPortfolioResponse, ProjectPage, ProjectSupplyResponse } from "@/lib/platform/api.generated";
import { multichainSaleLimit, multichainState, saleStage, SALE_STAGE_LABELS } from "@/lib/platform/multichain-view";
import type { Project } from "@/lib/platform/types";
import { percentage, units } from "@/lib/platform/money";
import { projectArtworkUrl } from "@/lib/platform/media";
import { useResource } from "./PlatformProvider";
import { DataState, InvestorShell, Tag } from "./InvestorUI";
import "./HomeExplore.css";
import "./Explore.css";

const CATEGORIES = ["All", "Finance", "Real-world assets", "Identity", "Services", "Infrastructure"] as const;

export function ProjectCard({ project, ownedQuantity }: { project: Project; ownedQuantity?: string }) {
  const multichain = project.deploymentMode === "MULTICHAIN";
  const shared = useResource<ProjectSupplyResponse>(multichain ? `projects/${project.id}/supply` : null, 60000);
  const [now] = useState(() => Date.now());
  const image = project.media?.find(m => m.mimeType.startsWith("image/") && /^[a-zA-Z0-9]{32,120}$/.test(m.cid));
  const sharedSupply = shared.error ? undefined : shared.data;
  const supply = sharedSupply ? multichainState(sharedSupply) : undefined;
  const current = sharedSupply ? multichainSaleLimit(sharedSupply, now).current : undefined;
  const issued = supply ? percentage(supply.totalSupply, project.maxFractions) : "—";
  const price = current?.priceUsdtMicros ?? null;
  const owned = ownedQuantity && /^[0-9]+$/.test(ownedQuantity) && BigInt(ownedQuantity) > 0n;
  const stage = sharedSupply ? saleStage(sharedSupply, now) : null;
  const stageLabel = !multichain ? "INFRA · coming soon" : stage ? SALE_STAGE_LABELS[stage] : shared.isLoading ? "Checking sales…" : "Sales status unavailable";
  const stageTone = stage === "presale" || stage === "public" ? "green" : "neutral";
  return <Link className="iv-product-card iv-explore-card" href={`/invest/products/${project.id}`}>
    <div className="iv-product-placeholder iv-explore-image">{image ? <Image src={projectArtworkUrl(project.id, image.cid)} alt={project.title} width={640} height={360} unoptimized /> : <span className="sr-only">Project image not supplied</span>}<span className="iv-explore-tags"><Tag tone={stageTone}>{stageLabel}</Tag>{owned ? <Tag tone="dark">You own {units(ownedQuantity, 0)}</Tag> : null}</span><span className="iv-explore-project-mark" aria-hidden="true" /></div>
    <h2>{project.title}</h2><small>{project.location || "BNB · Ethereum · TRON"}</small><p>{project.description}</p>
    {multichain ? <>
      <div className="iv-product-supply"><span>{issued === "—" ? shared.isLoading ? "Loading supply…" : "Supply unavailable" : `${issued} issued`}</span><span>{supply?.remainingSupply != null ? `${units(supply.remainingSupply, 0)} left` : "—"}</span></div>
      <div className="iv-progress" aria-hidden="true">{issued !== "—" ? <span style={{ width: issued }} /> : null}</div>
      {sharedSupply && <p>{current?.name ?? "No active phase"} · {units(sharedSupply.reservedBlocks, 0)} Reserved · {units(current?.available ?? "0", 0)} blocks remaining</p>}
      <div className="iv-product-revenue"><span>Price per share</span><strong>{price != null ? `${units(price, 6)} USDT` : "—"}</strong></div>
    </> : null}
  </Link>;
}

export function InvestorExplore() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const projects = useResource<ProjectPage>(`projects${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
  const portfolio = useResource<MultichainPortfolioResponse>("multichain/portfolio");
  const holdings = new Map((portfolio.error ? [] : portfolio.data?.items || []).map(holding => [holding.projectId, holding.totalShares]));
  const items = (projects.error ? [] : projects.data?.items || []) as Project[];
  const shown = category === "All" ? items : items.filter(project => project.category === category);
  return <InvestorShell page="explore" title="Explore products" subtitle="Pick a product to see what it does, how it earns and what you could get">
    <div className="iv-explore-page">
      <div className="iv-tabs iv-categories" role="tablist" aria-label="Product category">{CATEGORIES.map(name => <button key={name} role="tab" aria-selected={category === name} onClick={() => setCategory(name)}>{name}</button>)}</div>
      <DataState loading={projects.isLoading} error={projects.error} onRetry={() => void projects.mutate()} />
      {projects.data && !projects.error && shown.length === 0 ? <section className="iv-explore-empty"><h2>{items.length ? "Nothing in this category yet" : "Discover your next investment"}</h2><p>{items.length ? "Try another category, or see all products." : "Published projects will appear here when they’re ready."}</p></section> : null}
      <div className="iv-products iv-explore-grid">{shown.map(project => <ProjectCard key={project.id} project={project} ownedQuantity={holdings.get(project.id)} />)}</div>
      {projects.data && !projects.error && (cursor || projects.data.nextCursor) ? <div className="iv-explore-pagination"><div>{cursor ? <button className="iv-button" onClick={() => setCursor(null)}>First page</button> : null}{projects.data.nextCursor ? <button className="iv-button iv-primary" onClick={() => setCursor(projects.data!.nextCursor)}>Next projects →</button> : null}</div></div> : null}
    </div>
  </InvestorShell>;
}
