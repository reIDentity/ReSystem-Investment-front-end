import Image from "next/image";
import Link from "next/link";
import type { SalePhasesResponse } from "@/lib/platform/api.generated";
import type { Project, ProjectState, RewardView } from "@/lib/platform/types";
import { assetLabel, contractAsset, decimals, units } from "@/lib/platform/money";
import { formatUsdEquivalent, type AssetTotals } from "@/lib/platform/valuation";
import { projectArtworkUrl } from "@/lib/platform/media";
import { projectContributionPath } from "@/lib/platform/public-project";
import { Asset, CopyButton, DataState, Panel, Tag } from "./InvestorUI";

export type ProjectOverviewResource<T> = {
  data?: T;
  error?: unknown;
  isLoading?: boolean;
  mutate: () => unknown;
};
export type ProjectOverviewProps = {
  project: ProjectOverviewResource<Project>;
  state: ProjectOverviewResource<ProjectState>;
  revenue: ProjectOverviewResource<RewardView>;
  saleLimit: bigint | null;
  supplyTotal?: string;
  nativePrice?: string | null;
  usdtPrice?: string;
  issuedPercent: string;
  view?: Extract<SalePhasesResponse, { mode: "phased" }>;
  yourShares?: string;
  claimTotals?: AssetTotals | null;
  ownsShares?: boolean;
  publicView?: boolean;
};

const validAtomic = (value: string | null | undefined): value is string => typeof value === "string" && /^[0-9]+$/.test(value);
const amount = (value: string | null | undefined, places: number) => validAtomic(value) ? units(value, places) : "—";

function revenueAmounts(revenue: RewardView | undefined, field: "fundedAtomic" | "claimedTotalAtomic" | "reserveAtomic"): AssetTotals | null {
  const native = revenue?.assets.find(item => item.asset === "REAED" && item.decimals === 18);
  const usdt = revenue?.assets.find(item => item.asset === "USDT" && item.decimals === 6);
  return validAtomic(native?.[field]) && validAtomic(usdt?.[field]) ? { REAED: BigInt(native![field]), USDT: BigInt(usdt![field]) } : null;
}

/** A proportional overview, never a map of individually reserved token IDs. */
export function SupplyTiles({ issued, maximum, selected = "0", reserved = "0", onSale, cells = 50, className = "" }: { issued?: string; maximum?: string; selected?: string; reserved?: string; onSale?: string; cells?: 50 | 100; className?: string }) {
  const known = validAtomic(issued) && validAtomic(maximum) && BigInt(maximum) > 0n && BigInt(issued) <= BigInt(maximum);
  const total = known ? BigInt(maximum) : 1n, minted = known ? BigInt(issued) : 0n;
  const locked = known && validAtomic(reserved) ? BigInt(reserved) : 0n;
  const available = onSale === undefined ? total - minted - locked : validAtomic(onSale) ? BigInt(onSale) : 0n;
  const consistent = known && available >= 0n && minted + available + locked <= total;
  const chosen = consistent && validAtomic(selected) && BigInt(selected) <= available ? BigInt(selected) : 0n;
  const fill = (value: bigint) => { const clamped = value < 0n ? 0n : value > total ? total : value; const bps = clamped * 10000n / total; return `${bps / 100n}.${(bps % 100n).toString().padStart(2, "0")}%`; };
  return <div className={`iv-pd-supply-tiles ${className}`} aria-hidden="true">{Array.from({ length: cells }, (_, index) => {
    const start = BigInt(index) * total, issuedFill = fill(minted * BigInt(cells) - start), selectedFill = fill((minted + chosen) * BigInt(cells) - start);
    const availableFill = fill((minted + available) * BigInt(cells) - start), reserveStart = fill((total - locked) * BigInt(cells) - start);
    return <i key={index} style={consistent ? { background: `linear-gradient(to right,#d7dde7 0% ${issuedFill},#0091ff ${issuedFill} ${selectedFill},#fff ${selectedFill} ${availableFill},#e7edf5 ${availableFill} ${reserveStart},#8998ad ${reserveStart} 100%)` } : undefined} />;
  })}</div>;
}

/** Shared published-project presentation. Personal data is supplied only by the authenticated page. */
export function ProjectOverview({ project, state, revenue, saleLimit, supplyTotal, nativePrice, usdtPrice, issuedPercent, view, yourShares: personalShares = "—", claimTotals = null, ownsShares = false, publicView = false }: ProjectOverviewProps) {
  const p = project.error ? undefined : project.data;
  const supply = state.error ? undefined : state.data;
  const funding = revenue.error ? undefined : revenue.data;
  const yourShares = publicView ? "Sign in to view" : personalShares;
  const funded = revenueAmounts(funding, "fundedAtomic"), paid = revenueAmounts(funding, "claimedTotalAtomic");
  const images = p?.media?.filter(media => media.mimeType.startsWith("image/") && /^[a-zA-Z0-9]{32,120}$/.test(media.cid)) || [];
  const deposits = funding?.history.status === "available" ? funding.history.items || [] : null;
  const saleAvailable = saleLimit !== null && saleLimit > 0n;
  const indicativeYield = p?.indicativeYieldBps != null && Number.isSafeInteger(p.indicativeYieldBps) && p.indicativeYieldBps >= 0 ? `${units(String(p.indicativeYieldBps), 2)}%` : "—";
  const signInHref = p ? projectContributionPath(p.id) : "/invest";
  return <>
      <section className="iv-product-hero"><div><Link className="iv-button iv-small" href={publicView ? "/#where" : "/invest/explore"}><Asset name="6f807" width={16} />All products</Link><div className="iv-product-badges"><Tag tone={saleAvailable ? "green" : "neutral"}>{p ? saleAvailable ? "Open for investment" : saleLimit === null ? "Availability unverified" : "Purchases closed" : "Project unavailable"}</Tag>{!publicView && ownsShares ? <Tag tone="dark">You own {yourShares} shares</Tag> : null}</div><h2>{p?.title || "Project details"}</h2><p>{p?.description || "Project information is temporarily unavailable. Please try again shortly."}</p><div className="iv-product-features"><span>FRACTIONAL OWNERSHIP</span><span>INFRA NETWORK</span><span>WALLET APPROVAL</span></div></div><div className="iv-product-poster"><div>{images[0] ? <Image src={projectArtworkUrl(p!.id, images[0].cid)} alt={p?.title || "Project image"} width={500} height={888} unoptimized /> : <span className="iv-pd-image-empty">Project image not supplied</span>}</div><span><i />{saleLimit !== null ? `${amount(saleLimit.toString(), 0)} SHARES ON SALE` : "AVAILABILITY UNAVAILABLE"}</span></div></section>

      <Panel className="iv-product-moneyflow"><div className="iv-mono-heading"><span>MONEY FLOW · {p?.title.toUpperCase() || "PROJECT"}</span>{funding ? <b><i />Confirmed on INFRA</b> : null}</div><div className="iv-flow-columns">
        <div className="iv-flow-feed"><span>REVENUE DEPOSITS</span>{deposits?.length ? deposits.slice(0, 6).map(row => { const paymentAsset = contractAsset(row.args_json.asset); return <a className="iv-pd-deposit" href={`https://uat.scan.infraworld.org/tx/${row.tx_hash}`} target="_blank" rel="noopener noreferrer" key={`${row.tx_hash}:${row.args_json.fundingReference}`}><i /><code>{row.tx_hash.slice(0, 8)}…{row.tx_hash.slice(-4)}</code><b>{paymentAsset && validAtomic(row.args_json.amount) ? `+${amount(row.args_json.amount, decimals(paymentAsset))} ${assetLabel(paymentAsset)}` : "Amount unavailable"}</b></a>; }) : <div className="iv-pd-empty">{revenue.isLoading ? "Loading revenue…" : deposits ? "No revenue deposits yet." : "Revenue history unavailable."}</div>}</div>
        <div className="iv-flow-pool"><div><span>REVENUE FUNDED</span><strong>{formatUsdEquivalent(funded)}</strong></div><div className="iv-pd-pool-empty"><strong>Revenue reaches shareholders</strong><p>Confirmed project deposits fund the earnings you can claim.</p></div><footer><b>FUNDED ON INFRA</b><span>USDT EQUIVALENT</span></footer></div>
        <div className="iv-holder-blocks"><div><span>HOLDER DISTRIBUTION</span></div><div className="iv-pd-holder-empty"><span>Holder distribution is not available yet.</span></div></div>
      </div><div className="iv-flow-totals">{[["TOTAL FUNDED", formatUsdEquivalent(funded)], ["ISSUED SHARES", amount(supply?.totalSupply, 0)], ["PAID CLAIMS", formatUsdEquivalent(paid)], ["YOUR SHARES", yourShares]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><DataState publicView={publicView} loading={revenue.isLoading} error={revenue.error} onRetry={() => void revenue.mutate()} /></Panel>


      <Panel className="iv-launch"><div><p className="iv-eyebrow">PRICE PER SHARE</p><div className="iv-launch-prices"><div><small>Pay with reAED</small><strong>{amount(nativePrice, 18)} <em>reAED</em></strong></div><div><small>Or pay with USDT</small><strong>{amount(usdtPrice, 6)} <em>USDT</em></strong></div></div><div className="iv-launch-progress" aria-hidden="true">{issuedPercent !== "—" ? <span style={{ width: issuedPercent }} /> : null}</div><p className="iv-pd-small">Fixed exchange rate · 1 USDT = 3.6 reAED</p></div><div className="iv-launch-stats">{[[amount(p?.maxFractions, 0), "Maximum shares"], [amount(supply?.totalSupply, 0), "Issued shares"], [amount(saleLimit?.toString(), 0), "Still available"], [yourShares, "Your shares"]].map(([value, label]) => <div key={label}><strong>{value}</strong><small>{label}</small></div>)}</div></Panel>

      <div className="iv-bento-halves"><Panel className="iv-why-invest"><p className="iv-eyebrow">WHY INVEST</p>{[["Real revenue", "Earnings depend on revenue the project actually funds."], ["Your ownership", "Whole shares are held in your INFRA wallet."], ["Your decision", "Review project information and every wallet approval."]].map(([title, text]) => <div key={title}><h3>{title}</h3><p>{text}</p></div>)}</Panel><Panel className="iv-core-features"><p className="iv-eyebrow">CORE FEATURES</p>{[["Fractional ownership", "Choose a whole number of project shares."], ["Wallet approvals", "Review purchases and transfers before signing."], ["On-chain earnings", "Claim funded rewards in reAED or USDT."]].map(([title, text]) => <div key={title}><h3>{title}</h3><p>{text}</p></div>)}</Panel></div>

      <div className="iv-bento-thirds"><Panel className="iv-price-growth"><p className="iv-eyebrow">SHARE PRICING</p><div className="iv-pd-price-reference"><strong>{amount(usdtPrice, 6)}</strong><span>USDT per share</span></div>{[["Clear pricing", "See the exact quote before you buy."], ["Whole shares", "Choose a quantity that fits your investment."], ["Future returns", "Project value and indicative yield do not guarantee a return."]].map(([title, text]) => <div key={title}><h3>{title}</h3><p>{text}</p></div>)}</Panel><Panel className="iv-allocation"><div className="iv-mono-heading"><span>INVESTMENT OPPORTUNITY</span><small>Supply overview · 1% per tile</small></div><div className="iv-allocation-content"><SupplyTiles issued={saleLimit === null ? undefined : supply?.totalSupply} maximum={supplyTotal} reserved={view?.reservedBlocks} onSale={saleLimit?.toString()} cells={100} className="iv-pd-allocation-tiles" /><dl>{[["Maximum shares", amount(p?.maxFractions, 0)], ["Issued shares", amount(supply?.totalSupply, 0)], ["Available shares", amount(saleLimit?.toString(), 0)], ["Issued", issuedPercent]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div><DataState publicView={publicView} error={state.error} onRetry={() => void state.mutate()} /></Panel></div>

      <div className="iv-bento-thirds iv-bento-reverse"><Panel className="iv-revenue-so-far"><div className="iv-mono-heading"><span>REVENUE SO FAR</span>{funding ? <b><i />Confirmed on INFRA</b> : null}</div><div className="iv-revenue-summary">{[["Last month", "—"], ["Indicative yield", indicativeYield], ["Issued", issuedPercent], ["Investors", "—"]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="iv-pd-revenue-empty">No revenue trend is available yet.</div><p className="iv-pd-small">Indicative yield is entered by the project owner. Actual earnings depend on funded revenue.</p></Panel><Panel className="iv-how-earn"><p className="iv-eyebrow">HOW YOU EARN</p><p>Project revenue is allocated to shareholders. Your funded earnings remain yours after a transfer or sale.</p><div><small>Your available earnings</small><strong>{publicView ? "Sign in to view" : formatUsdEquivalent(claimTotals)}</strong><small>Claim in the original asset</small></div><Link className="iv-text-link" href={publicView ? signInHref : "/invest/earnings"} prefetch={publicView ? false : null}>{publicView ? "Sign in to view your earnings →" : "View your earnings →"}</Link><small>No monthly payout or resale buyer is guaranteed.</small></Panel></div>

      <div className="iv-bento-halves"><Panel className="iv-roadmap"><p className="iv-eyebrow">ROADMAP</p><div><i /><span><strong>Project milestones</strong><small>No roadmap has been published for this project yet.</small></span></div></Panel><Panel className="iv-product-wallet"><p className="iv-eyebrow">PROJECT CONTRACT ON INFRA</p><code>{p?.contractAddress || "Unavailable"}</code><p>Verify the project’s ownership and revenue transactions on the INFRA explorer.</p>{p?.contractAddress ? <><CopyButton value={p.contractAddress} /><a className="iv-text-link iv-pd-contract-link" href={`https://uat.scan.infraworld.org/address/${p.contractAddress}`} target="_blank" rel="noopener noreferrer">View contract ↗</a></> : null}</Panel></div>
  </>;
}
