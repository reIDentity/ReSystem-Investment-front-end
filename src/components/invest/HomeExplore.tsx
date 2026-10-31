"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ProjectPage, WalletResponse, WalletCashflowResponse } from "@/lib/platform/api.generated";
import type { Holding, Portfolio, Project, ProjectState } from "@/lib/platform/types";
import { assetLabel, percentage, units, type PaymentAsset } from "@/lib/platform/money";
import { projectArtworkUrl } from "@/lib/platform/media";
import { holdingCostBasis, portfolioCostBasis, portfolioAcquisitionOutlay } from "@/lib/platform/portfolio-values";
import { formatRationalUsdEquivalent, formatSignedUsdEquivalent } from "@/lib/platform/valuation";
import { readWalletCashflow, cashflowWidths } from "@/lib/platform/cashflow-values";
import { usePlatform, useResource } from "./PlatformProvider";
import { Asset, DataState, InvestorShell, Modal, Panel, Tag } from "./InvestorUI";
import { PortfolioHistory } from "./platform/PortfolioHistory";
import { ProjectIcon } from "./platform/ProjectIcon";
import { TransactionReview, type InvestorCommand } from "./platform/Transaction";
import "./HomeExplore.css";
import "./Explore.css";
export function HoldingCard({ holding }: { holding: Holding }) {
  return <article className="iv-holding-card"><div className="iv-holding-title"><ProjectIcon id={holding.projectId} title={holding.title} /><div><h3>{holding.title}</h3><small>{BigInt(holding.quantity) === 0n ? "Historical rewards retained" : "Issued fractions"}</small></div></div><dl><div><dt>Fractions</dt><dd>{units(holding.quantity, 0)}</dd></div><div><dt>Project entitlement · h/N</dt><dd>{percentage(holding.ownership.numerator, holding.ownership.denominator)}</dd></div><div><dt>Next allocation participation · h/S</dt><dd>{percentage(holding.revenueParticipation.numerator, holding.revenueParticipation.denominator)}</dd></div>{holding.claimable.map(a => <div key={a.asset}><dt>Claimable {assetLabel(a.asset)}</dt><dd>{units(a.amountAtomic, a.decimals)}</dd></div>)}</dl><div className="iv-two-buttons"><Link className="iv-button iv-blue" href="/invest/earnings">Rewards</Link><Link className="iv-button iv-primary" href={`/invest/products/${holding.projectId}`}>Manage fractions</Link></div></article>;
}
type HomeAmounts = Record<PaymentAsset, bigint>;
const HOME_ASSETS = ["REAED", "USDT"] as const;
const QUOTE_SCALE = 18n * 10n ** 18n;
const isAtomic = (value: string) => /^[0-9]+$/.test(value);

function holdingAmounts(holding: Holding, field: "claimable" | "claimed"): HomeAmounts | null {
  const values = holding[field];
  if (!values) return null;
  const native = values.find(value => value.asset === "REAED" && value.decimals === 18);
  const usdt = values.find(value => value.asset === "USDT" && value.decimals === 6);
  if (!native || !usdt || !isAtomic(native.amountAtomic) || !isAtomic(usdt.amountAtomic)) return null;
  return { REAED: BigInt(native.amountAtomic), USDT: BigInt(usdt.amountAtomic) };
}

function portfolioAmounts(portfolio: Portfolio | undefined, field: "claimable" | "claimed"): HomeAmounts | null {
  if (!portfolio) return null;
  const total: HomeAmounts = { REAED: 0n, USDT: 0n };
  for (const holding of portfolio.items) {
    const amounts = holdingAmounts(holding, field);
    if (!amounts) return null;
    for (const asset of HOME_ASSETS) total[asset] += amounts[asset];
  }
  return total;
}

// Keep the fixed 1 USDT = 3.6 reAED rate as a rational until the display boundary.
function quoteNumerator(amounts: HomeAmounts): bigint {
  return amounts.REAED * 5n + amounts.USDT * 18n * 10n ** 12n;
}

function homeCurrency(amounts: HomeAmounts | null): string {
  if (!amounts) return "—";
  const numerator = quoteNumerator(amounts);
  const cents = numerator * 100n / QUOTE_SCALE;
  if (numerator > 0n && cents === 0n) return "< $0.01";
  return `$${units((cents / 100n).toString(), 0)}.${(cents % 100n).toString().padStart(2, "0")}`;
}

function HomeHoldingCard({ holding, media }: { holding: Holding; media?: Project["media"] }) {
  const claimable = holdingAmounts(holding, "claimable");
  const hasRewards = claimable && (claimable.REAED > 0n || claimable.USDT > 0n);
  return <article className="iv-holding-card iv-home-holding-card">
    <div className="iv-holding-title"><ProjectIcon id={holding.projectId} title={holding.title} media={media} /><div><h3>{holding.title}</h3><small>{holding.quantity === "0" ? "Previous holding" : "Project shares"}</small></div><Tag tone={hasRewards ? "green" : "neutral"}>{hasRewards ? "To claim" : holding.quantity === "0" ? "Previous" : "Holding"}</Tag></div>
    <dl><div><dt>Shares</dt><dd>{isAtomic(holding.quantity) ? units(holding.quantity, 0) : "—"}</dd></div><div><dt>Invested</dt><dd>{formatRationalUsdEquivalent(holdingCostBasis(holding))}</dd></div><div><dt>To claim</dt><dd className="iv-home-claim-amount">{homeCurrency(claimable)}</dd></div></dl>
    <div className="iv-two-buttons"><Link className="iv-button iv-blue" href="/invest/earnings">My earnings</Link><Link className="iv-button iv-primary" href={`/invest/products/${holding.projectId}`}>Buy more</Link></div>
  </article>;
}

export function InvestorHome() {
  const { user, live } = usePlatform();
  const portfolio = useResource<Portfolio>("portfolio");
  const wallet = useResource<WalletResponse>("wallet");
  const projects = useResource<ProjectPage>("projects");
  const cashflow = useResource<WalletCashflowResponse>("wallet/cashflow");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("claimable");
  const [claimOpen, setClaimOpen] = useState(false);
  const [command, setCommand] = useState<InvestorCommand | null>(null);
  const verifiedPortfolio = portfolio.error || !live ? undefined : portfolio.data;
  const available = portfolioAmounts(verifiedPortfolio, "claimable");
  const paid = portfolioAmounts(verifiedPortfolio, "claimed");
  const verifiedFlow = readWalletCashflow(cashflow.error || !live ? undefined : cashflow.data, user.wallet);
  const acquisitionOutlay = portfolioAcquisitionOutlay(verifiedPortfolio);
  const flow = verifiedFlow && acquisitionOutlay && verifiedPortfolio?.headBlock === verifiedFlow.confirmedBlock && verifiedPortfolio.blockHash.toLowerCase() === verifiedFlow.blockHash.toLowerCase() && HOME_ASSETS.some(asset => acquisitionOutlay[asset] !== verifiedFlow.amounts.purchases[asset]) ? null : verifiedFlow;
  const widths = flow ? cashflowWidths(flow) : null;
  const flowContext = flow ? `Gross cash flows exclude network fees. Confirmed through ${flow.asOf} · block ${flow.confirmedBlock}` : "Complete cash-flow history is unavailable. Network fees are excluded.";
  const nativeBalance = wallet.data?.assets.find(asset => asset.symbol === "REAED" && asset.decimals === 18);
  const usdtBalance = wallet.data?.assets.find(asset => asset.symbol === "USDT" && asset.decimals === 6);
  const balances = !wallet.error && nativeBalance && usdtBalance && isAtomic(nativeBalance.balanceAtomic) && isAtomic(usdtBalance.balanceAtomic)
    ? { REAED: BigInt(nativeBalance.balanceAtomic), USDT: BigInt(usdtBalance.balanceAtomic) } : null;
  const allHoldings = verifiedPortfolio?.items || [];
  const holdings = allHoldings.filter(holding => holding.title.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => {
    if (sort === "name") return a.title.localeCompare(b.title);
    const left = sort === "shares" ? (isAtomic(a.quantity) ? BigInt(a.quantity) : 0n) : quoteNumerator(holdingAmounts(a, "claimable") || { REAED: 0n, USDT: 0n });
    const right = sort === "shares" ? (isAtomic(b.quantity) ? BigInt(b.quantity) : 0n) : quoteNumerator(holdingAmounts(b, "claimable") || { REAED: 0n, USDT: 0n });
    return left === right ? a.title.localeCompare(b.title) : left > right ? -1 : 1;
  });
  const ownedIds = new Set(allHoldings.filter(holding => isAtomic(holding.quantity) && BigInt(holding.quantity) > 0n).map(holding => holding.projectId));
  const recommendations = verifiedPortfolio && !projects.error ? projects.data?.items.filter(project => project.status === "PUBLISHED" && !ownedIds.has(project.id)).slice(0, 4) || [] : [];
  const claimable = Boolean(available && (available.REAED > 0n || available.USDT > 0n));
  const shares = verifiedPortfolio && allHoldings.every(holding => isAtomic(holding.quantity)) ? units(allHoldings.reduce((total, holding) => total + BigInt(holding.quantity), 0n).toString(), 0) : null;
  const cards = [
    { title: "Total invested", value: formatRationalUsdEquivalent(portfolioCostBasis(verifiedPortfolio)), icon: "078eb", badge: null, note: shares ? `${shares} shares in ${ownedIds.size} ${ownedIds.size === 1 ? "project" : "projects"}` : "Your investment overview" },
    { title: "Available to claim", value: homeCurrency(available), icon: "6d55c", badge: available ? "Live" : null, note: "Claim in reAED or USDT" },
    { title: "Total paid out", value: homeCurrency(paid), icon: "fea92", badge: null, note: "Earnings you have already claimed" },
    { title: "Wallet balance", value: homeCurrency(balances), icon: "dfe8a", badge: balances ? "Ready to invest" : null, note: wallet.error ? "Balance unavailable" : "Your reAED and USDT balance" },
  ];
  const cashRows = [
    { label: "Payouts in", value: homeCurrency(flow?.amounts.payouts || null), color: "#0091ff" },
    { label: "Deposits in", value: homeCurrency(flow?.amounts.deposits || null), color: "#dff1ff" },
    { label: "Shares bought", value: homeCurrency(flow?.amounts.purchases || acquisitionOutlay), color: "#0091ff" },
    { label: "Withdrawals", value: homeCurrency(flow?.amounts.withdrawals || null), color: "#96d2ff" },
  ];
  function reviewClaims(asset: PaymentAsset) {
    const ids = allHoldings.filter(holding => (holdingAmounts(holding, "claimable")?.[asset] || 0n) > 0n).slice(0, 20).map(holding => holding.projectId);
    if (!ids.length) return;
    setClaimOpen(false);
    setCommand({ type: "CLAIM_BATCH", asset, projectIds: ids });
  }
  return <InvestorShell page="home" title={`Welcome back, ${user.name.split(/\s+/)[0]}`} subtitle="Here is how your investments are doing today" networkBlock={verifiedPortfolio?.headBlock}>
    <div className="iv-home-content">
      <div className="iv-kpis iv-home-summary" aria-label="Investment summary">
        {cards.map((card, index) => <section className={`iv-kpi ${index === 0 ? "iv-kpi-primary" : ""}`} key={card.title} aria-busy={index === 3 ? wallet.isLoading : portfolio.isLoading}>
          <span>{card.title}</span><div className="iv-kpi-icon"><Asset name={card.icon} width={20} /></div>
          <div className="iv-kpi-value" title="USDT equivalent at 1 USDT = 3.6 reAED"><strong>{card.value}</strong>{card.badge ? <Tag tone={index === 1 ? "green" : "neutral"}>{index === 1 ? <i className="iv-live" /> : null}{card.badge}</Tag> : null}</div>
          <p>{card.note}{index === 3 && wallet.error ? <> · <button className="iv-home-retry" onClick={() => void wallet.mutate()}>Retry</button></> : null}</p>
        </section>)}
      </div>

      <Panel className="iv-cashflow iv-home-cashflow">
        <div className="iv-cash-heading" title={flowContext}><div><span className="iv-eyebrow">CASH FLOW · ALL TIME</span><h2>Inflow vs outflow</h2></div>{[{ label: "IN", value: homeCurrency(flow?.amounts.incoming || null) }, { label: "OUT", value: homeCurrency(flow?.amounts.outgoing || null) }, { label: "NET", value: formatSignedUsdEquivalent(flow?.amounts.net) }].map(item => <div key={item.label}><small>{item.label}</small><strong>{item.value}</strong></div>)}</div>
        <div className="iv-cash-bars">{cashRows.map((row, index) => <div key={row.label}><span><i style={{ background: row.color }} />{row.label}</span><div aria-hidden="true">{widths ? <i style={{ width: widths[index], background: row.color, minWidth: widths[index] === "0.00%" ? 0 : undefined }} /> : null}</div><strong title={flowContext}>{row.value}</strong></div>)}</div>
        <p className="iv-home-caption">{!flow ? "Complete cash-flow totals are not available yet. " : null}<Link href="/invest/activity">View activity →</Link></p>
      </Panel>

      <div className="iv-home-middle iv-home-middle">
        <Panel title="Portfolio performance" subtitle="Confirmed purchase cost and claimed rewards, not market value." className="iv-portfolio-chart iv-home-performance">
          <div className="iv-chart-legend"><span><i style={{background:"#0095ff"}} />Purchase cost</span><span><i style={{background:"#00965e"}} />Rewards claimed</span></div>
          <PortfolioHistory data={flow ? cashflow.data : undefined} />
        </Panel>
        <Panel title="Recommended for you" subtitle="Discover published projects you don’t own yet." className="iv-recommended iv-home-recommended">
          <div className="iv-home-recommendation-list">
            {recommendations.map(project => <Link href={`/invest/products/${project.id}`} key={project.id}><ProjectIcon id={project.id} title={project.title} media={project.media} /><span><strong>{project.title}</strong><small>{project.location || project.description}</small></span></Link>)}
            {!recommendations.length ? <div className="iv-home-recommendation-empty" role="status"><strong>{projects.isLoading || portfolio.isLoading ? "Finding opportunities…" : projects.error || portfolio.error || !live ? "Recommendations unavailable" : "New opportunities start here"}</strong><p>{projects.error || portfolio.error ? "Please try again in a moment." : "Published projects will appear here."}</p>{projects.error || portfolio.error ? <button className="iv-home-retry" onClick={() => { void projects.mutate(); void portfolio.mutate(); }}>Try again</button> : null}</div> : null}
          </div>
          <Link className="iv-button iv-primary iv-full" href="/invest/explore">Explore all projects</Link>
          <div className="iv-mini-stats"><div><small>Monthly revenue</small><strong>—</strong></div><div><small>Live projects</small><strong>{projects.data && !projects.error ? `${projects.data.items.length}${projects.data.nextCursor ? "+" : ""}` : "—"}</strong></div></div>
        </Panel>
      </div>

      <Panel className="iv-holdings iv-home-holdings">
        <div className="iv-panel-toolbar"><h2>Your holdings</h2><label className="iv-search"><Asset name="44e06" width={16} /><input value={query} onChange={event => setQuery(event.target.value)} aria-label="Search holdings" placeholder="Search holdings" /></label><label className="iv-sort"><Asset name="734ad" width={16} /><span className="sr-only">Sort holdings</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="claimable">Sort: claimable</option><option value="shares">Sort: shares</option><option value="name">Sort: name</option></select></label></div>
        {holdings.length ? <div className="iv-holding-grid">{holdings.map(holding => <HomeHoldingCard key={holding.projectId} holding={holding} media={projects.error ? undefined : projects.data?.items.find(project => project.id === holding.projectId)?.media} />)}</div> : <div className="iv-home-holdings-empty" role="status" aria-busy={portfolio.isLoading}>
          <strong>{portfolio.isLoading ? "Loading your holdings…" : portfolio.error || !live ? "Your holdings are unavailable" : query.trim() ? "No holdings match your search" : "Your first investment starts here"}</strong>
          <p>{portfolio.error || !live ? "Please try again in a moment." : query.trim() ? "Try another name or clear your search." : "Explore projects and build your portfolio at your own pace."}</p>
          {portfolio.error ? <button className="iv-button" onClick={() => void portfolio.mutate()}>Try again</button> : query.trim() ? <button className="iv-button" onClick={() => setQuery("")}>Clear search</button> : <Link className="iv-button" href="/invest/explore">Explore projects →</Link>}
        </div>}
        <div className="iv-claim-all"><span>Unclaimed earnings across all projects: <strong>{homeCurrency(available)}</strong></span><button className="iv-button iv-dark" disabled={!claimable} onClick={() => setClaimOpen(true)}>Claim all</button></div>
      </Panel>
    </div>
    {claimOpen ? <Modal title="Claim your earnings" onClose={() => setClaimOpen(false)}><p className="iv-muted">Choose the asset to claim. You’ll review the transaction before approving it.</p><div className="iv-home-claim-choices">{HOME_ASSETS.map(asset => { const eligible = allHoldings.filter(holding => (holdingAmounts(holding, "claimable")?.[asset] || 0n) > 0n); const batch = eligible.slice(0, 20); const amount = batch.reduce((total, holding) => total + (holdingAmounts(holding, "claimable")?.[asset] || 0n), 0n); return <div key={asset}><span>{assetLabel(asset)}<strong>{units(amount.toString(), asset === "USDT" ? 6 : 18)}</strong><small>{eligible.length > 20 ? "First 20 projects in this claim" : `${batch.length} ${batch.length === 1 ? "project" : "projects"}`}</small></span><button className="iv-button iv-primary" disabled={amount === 0n} onClick={() => reviewClaims(asset)}>Review claim</button></div>; })}</div></Modal> : null}
    {command ? <TransactionReview command={command} onClose={() => setCommand(null)} /> : null}
  </InvestorShell>;
}
export function ProjectCard({ project, ownedQuantity }: { project: Project; ownedQuantity?: string }) {
  const chain = useResource<ProjectState>(`projects/${project.id}/chain`, 60000);
  const image = project.media?.find(m => m.mimeType.startsWith("image/") && /^[a-zA-Z0-9]{32,120}$/.test(m.cid));
  const supply = chain.error ? undefined : chain.data;
  const issued = supply ? percentage(supply.totalSupply, project.maxFractions) : "—";
  const owned = ownedQuantity && /^[0-9]+$/.test(ownedQuantity) && BigInt(ownedQuantity) > 0n;
  return <Link className="iv-product-card iv-explore-card" href={`/invest/products/${project.id}`}>
    <div className="iv-product-placeholder iv-explore-image">{image ? <Image src={projectArtworkUrl(project.id, image.cid)} alt={project.title} width={640} height={360} unoptimized /> : <span className="sr-only">Project image not supplied</span>}{owned ? <Tag tone="dark">You own {units(ownedQuantity, 0)}</Tag> : <Tag tone="neutral">Published</Tag>}<span className="iv-explore-project-mark" aria-hidden="true" /></div>
    <h2>{project.title}</h2><small>{project.location || "INFRA project"}</small><p>{project.description}</p>
    <div className="iv-product-supply"><span>{issued === "—" ? chain.isLoading ? "Loading supply…" : "Supply unavailable" : `${issued} issued`}</span><span>{supply ? `${units(supply.remainingSupply, 0)} left` : "—"}</span></div>
    <div className="iv-progress" aria-hidden="true">{issued !== "—" ? <span style={{ width: issued }} /> : null}</div>
    <div className="iv-product-revenue"><span>Price per share</span><strong>{units(project.unitPriceUsdtAtomic, 6)} USDT</strong></div>
  </Link>;
}
export function InvestorExplore() {
  const [cursor, setCursor] = useState<string | null>(null);
  const projects = useResource<ProjectPage>(`projects${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
  const portfolio = useResource<Portfolio>("portfolio");
  const holdings = new Map((portfolio.error ? [] : portfolio.data?.items || []).map(holding => [holding.projectId, holding.quantity]));
  const items = projects.error ? [] : projects.data?.items || [];
  const categories = ["All", "Finance", "Real-world assets", "Identity", "Services", "Infrastructure"];
  return <InvestorShell page="explore" title="Explore products" subtitle="Pick a product to see what it does, how it earns and what you could get">
    <div className="iv-explore-page">
      <div className="iv-tabs iv-categories" role="tablist" aria-label="Product category">{categories.map(category => <button key={category} role="tab" aria-selected={category === "All"} disabled={category !== "All"} aria-describedby={category !== "All" ? "iv-explore-category-note" : undefined} title={category !== "All" ? "Category filtering is unavailable because project categories have not been published." : undefined}>{category}</button>)}</div>
      <p id="iv-explore-category-note" className="sr-only">Project categories have not been published. All published projects are shown; category filtering is unavailable.</p>
      <DataState loading={projects.isLoading} error={projects.error} onRetry={() => void projects.mutate()} />
      {projects.data && !projects.error && items.length === 0 ? <section className="iv-explore-empty"><h2>Discover your next investment</h2><p>Published projects will appear here when they’re ready.</p></section> : null}
      <div className="iv-products iv-explore-grid">{items.map(project => <ProjectCard key={project.id} project={project} ownedQuantity={holdings.get(project.id)} />)}</div>
      {projects.data && !projects.error && (cursor || projects.data.nextCursor) ? <div className="iv-explore-pagination"><div>{cursor ? <button className="iv-button" onClick={() => setCursor(null)}>First page</button> : null}{projects.data.nextCursor ? <button className="iv-button iv-primary" onClick={() => setCursor(projects.data!.nextCursor)}>Next projects →</button> : null}</div></div> : null}
    </div>
  </InvestorShell>;
}
