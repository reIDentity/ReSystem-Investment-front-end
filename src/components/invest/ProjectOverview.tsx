import Image from "next/image";
import Link from "next/link";
import { ArrowDownToLine, ArrowRight, ArrowUpRight, CalendarDays, ChartNoAxesCombined, Check, ChevronLeft, CircleHelp, Coins, Grid2X2, LockKeyhole, PieChart, ShieldCheck, Users, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import type { SalePhasesResponse } from "@/lib/platform/api.generated";
import type { Project, ProjectState, RewardView } from "@/lib/platform/types";
import { assetLabel, contractAsset, decimals, units } from "@/lib/platform/money";
import { formatUsdEquivalent, type AssetTotals } from "@/lib/platform/valuation";
import { projectArtworkUrl } from "@/lib/platform/media";
import { projectContributionPath } from "@/lib/platform/public-project";
import { readRevenueSeries, revenueChart, revenueMoney } from "@/lib/platform/revenue-values";
import { CopyButton, DataState } from "./InvestorUI";
import { ProjectAllocation } from "./ProjectAllocation";
import styles from "./ProjectOverviewDesign.module.css";
export { SupplyTiles } from "./SupplyTiles";

export type ProjectOverviewResource<T> = { data?: T; error?: unknown; isLoading?: boolean; mutate: () => unknown };
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
  allocationLoading?: boolean;
};
const validAtomic = (value: string | null | undefined): value is string => typeof value === "string" && /^[0-9]+$/.test(value);
const amount = (value: string | null | undefined, places: number) => validAtomic(value) ? units(value, places) : "—";
function revenueAmounts(revenue: RewardView | undefined, field: "fundedAtomic" | "claimedTotalAtomic"): AssetTotals | null {
  const native = revenue?.assets.filter(item => item.asset === "REAED");
  const usdt = revenue?.assets.filter(item => item.asset === "USDT");
  if (native?.length !== 1 || usdt?.length !== 1 || native[0].decimals !== 18 || usdt[0].decimals !== 6) return null;
  return validAtomic(native[0][field]) && validAtomic(usdt[0][field]) ? { REAED: BigInt(native[0][field]), USDT: BigInt(usdt[0][field]) } : null;
}
function barHeight(value: string | undefined, total: string | undefined): string {
  if (!validAtomic(value) || !validAtomic(total) || BigInt(total) === 0n || BigInt(value) > BigInt(total)) return "0%";
  const hundredths = BigInt(value) * 10000n / BigInt(total);
  return `${hundredths / 100n}.${String(hundredths % 100n).padStart(2, "0")}%`;
}
function IconBox({ children, className = "" }: { children: ReactNode; className?: string }) { return <span className={`${styles.icon} ${className}`}>{children}</span>; }
function Confirmed({ available }: { available: boolean }) { return available ? <span className={styles.confirmed}><i />Confirmed on INFRA</span> : null; }
function RevenueHistory({ revenue }: { revenue: RewardView | undefined }) {
  const series = readRevenueSeries(revenue?.series);
  if (!series) return <div className={styles.revenueEmpty}><span><IconBox><ChartNoAxesCombined size={17} aria-hidden="true" /></IconBox>No revenue trend is available yet.</span></div>;
  const chart = revenueChart(series);
  return <figure className={styles.revenueHistory}>
    <div className={styles.dailyBars} aria-label="Confirmed daily project revenue in USDT equivalent" role="img">{chart.points.map(point => <div key={point.date}><div><i style={{ height: point.height }} /></div><small>{point.label}</small></div>)}</div>
    <figcaption>Last 14 days · UTC · Confirmed through block {series.confirmedBlock}</figcaption>
    <details><summary>View daily revenue records</summary><table><caption>Confirmed revenue in USDT equivalent</caption><thead><tr><th scope="col">Date (UTC)</th><th scope="col">Revenue</th></tr></thead><tbody>{series.days.map(day => <tr key={day.date}><th scope="row">{day.date}</th><td>{revenueMoney(day.revenue)}</td></tr>)}</tbody></table></details>
  </figure>;
}

/** Presentation shared by public and signed-in pages; personal values never enter anonymous reads. */
export function ProjectOverview({ project, state, revenue, saleLimit, supplyTotal, nativePrice, usdtPrice, view, yourShares: personalShares = "—", claimTotals = null, ownsShares = false, publicView = false, allocationLoading = false }: ProjectOverviewProps) {
  const p = project.error ? undefined : project.data;
  const supply = state.error ? undefined : state.data;
  const funding = revenue.error ? undefined : revenue.data;
  const yourShares = publicView ? "Sign in to view" : personalShares;
  const funded = revenueAmounts(funding, "fundedAtomic"), paid = revenueAmounts(funding, "claimedTotalAtomic");
  const images = p?.media?.filter(media => media.mimeType.startsWith("image/") && /^[a-zA-Z0-9]{32,120}$/.test(media.cid)) || [];
  const deposits = funding?.history.status === "available" ? funding.history.items || [] : null;
  const saleAvailable = saleLimit !== null && saleLimit > 0n;
  const total = supplyTotal || p?.maxFractions;
  const indicativeYield = p?.indicativeYieldBps != null && Number.isSafeInteger(p.indicativeYieldBps) && p.indicativeYieldBps >= 0 ? `${units(String(p.indicativeYieldBps), 2)}%` : "—";
  const signInHref = p ? projectContributionPath(p.id) : "/invest";
  const contributeHref = publicView ? signInHref : "#invest";
  const pricingFacts = [
    { Icon: Check, title: "Clear pricing", text: "See the exact quote before you buy." },
    { Icon: Grid2X2, title: "Whole shares", text: "Choose a quantity that fits your investment." },
    { Icon: ChartNoAxesCombined, title: "Future returns", text: "Project value and indicative yield do not guarantee a return." },
  ];
  return <div className={styles.overview}>
    <section className={styles.hero} aria-label="Project introduction">
      <div className={styles.heroCopy}>
        <Link className={styles.back} href={publicView ? "/#where" : "/invest/explore"}><ChevronLeft size={14} aria-hidden="true" />All products</Link>
        <div className={styles.badges}><span className={styles.availability}><i className={saleAvailable ? styles.liveDot : ""} />{p ? saleAvailable ? "Open for investment" : saleLimit === null ? "Availability unverified" : "Purchases closed" : "Project unavailable"}</span>{!publicView && ownsShares ? <span className={styles.availability}>You own {yourShares} shares</span> : null}</div>
        <h2>{p?.title || "Project details"}</h2>
        <p>{p?.description || "Project information is temporarily unavailable. Please try again shortly."}</p>
        <div className={styles.chips}><span>FRACTIONAL OWNERSHIP</span><span>INFRA NETWORK</span><span>WALLET APPROVAL</span></div>
      </div>
      <div className={styles.stage}><figure className={styles.shot}>{images[0] ? <Image src={projectArtworkUrl(p!.id, images[0].cid)} alt={p?.title || "Project image"} width={600} height={650} unoptimized loading="eager" /> : <div className={styles.imageEmpty}><Grid2X2 size={42} aria-hidden="true" /><span>Project image not supplied</span></div>}<figcaption><i />{saleLimit !== null ? `${amount(saleLimit.toString(), 0)} SHARES ON SALE` : "AVAILABILITY UNAVAILABLE"}</figcaption></figure></div>
    </section>

    <section className={`${styles.card} ${styles.moneyFlow}`} aria-label="Project money flow">
      <div className={styles.sectionHeading}><span className={styles.label}>Money flow · {p?.title || "Project"}</span><Confirmed available={!!funding} /></div>
      <div className={styles.pipeline}>
        <div className={styles.node}><IconBox><ArrowDownToLine size={19} aria-hidden="true" /></IconBox><h3 className={styles.label}>Revenue deposits</h3>{deposits?.length ? <div className={styles.depositList}>{deposits.slice(0, 4).map(row => { const paymentAsset = contractAsset(row.args_json.asset); return <a href={`https://uat.scan.infraworld.org/tx/${row.tx_hash}`} target="_blank" rel="noopener noreferrer" key={`${row.tx_hash}:${row.args_json.fundingReference}`}><code>{row.tx_hash.slice(0, 8)}…{row.tx_hash.slice(-4)}</code><b>{paymentAsset && validAtomic(row.args_json.amount) ? `+${amount(row.args_json.amount, decimals(paymentAsset))} ${assetLabel(paymentAsset)}` : "Amount unavailable"}</b><ArrowUpRight size={13} aria-hidden="true" /></a>; })}</div> : <p className={styles.empty}>{revenue.isLoading ? "Loading revenue…" : deposits ? "No revenue deposits yet." : "Revenue history unavailable."}</p>}</div>
        <div className={styles.lane} aria-hidden="true"><i /><i /><i /><i /></div>
        <div className={styles.hub}><span className={styles.label}>Revenue funded</span><strong>{formatUsdEquivalent(funded)}</strong><div><h3>Revenue reaches shareholders</h3><p>Confirmed project deposits fund the earnings you can claim.</p></div><footer><span>FUNDED ON INFRA</span><span>USDT EQUIVALENT</span></footer></div>
        <div className={`${styles.lane} ${styles.greenLane}`} aria-hidden="true"><i /><i /><i /><i /></div>
        <div className={styles.node}><IconBox><Users size={19} aria-hidden="true" /></IconBox><h3 className={styles.label}>Holder distribution</h3><p className={styles.empty}>Holder distribution is not available yet.</p></div>
      </div>
      <div className={styles.metrics}>{[["Total funded", formatUsdEquivalent(funded)], ["Issued shares", amount(supply?.totalSupply, 0)], ["Paid claims", formatUsdEquivalent(paid)]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}<Link href={publicView ? signInHref : "/invest"} prefetch={publicView ? false : null}><span><small>Your shares</small><strong>{yourShares}</strong></span><ArrowRight size={18} aria-hidden="true" /></Link></div>
      <DataState publicView={publicView} loading={revenue.isLoading} error={revenue.error} onRetry={() => void revenue.mutate()} />
    </section>

    <section className={`${styles.card} ${styles.showcase}`} aria-label="Share pricing">
      <div className={styles.pricingCopy}><span className={styles.label}>Share pricing</span><h2><em>{amount(usdtPrice, 6)}</em> USDT per share</h2><div className={styles.factList}>{pricingFacts.map(({ Icon, title, text }) => <div key={title}><IconBox><Icon size={18} aria-hidden="true" /></IconBox><p><strong>{title}</strong><span>{text}</span></p></div>)}</div></div>
      <div className={styles.pricingStage}>
        <div className={styles.pricingGlow} aria-hidden="true" />
        <div className={styles.availableFloat}><span className={styles.miniRing} aria-hidden="true" /><div><strong>{amount(saleLimit?.toString(), 0)}</strong><small>On sale now</small></div></div>
        <div className={styles.priceCard}><span className={styles.label}>Price per share</span><p className={styles.personal}>Your shares · <b>{yourShares}</b></p><div className={styles.prices}><div><small>Pay with reAED</small><strong>{amount(nativePrice, 18)}</strong><small>reAED</small></div><div><small>Or pay with USDT</small><strong>{amount(usdtPrice, 6)}</strong><small>USDT</small></div></div><div className={styles.chartBars}>{[[total, "Maximum shares"], [supply?.totalSupply, "Issued shares"], [saleLimit?.toString(), "On sale now"]].map(([value, label]) => <div key={label}><div className={styles.barTrack}><i style={{ height: barHeight(value, total) }} /></div><small>{label}</small><strong>{amount(value, 0)}</strong></div>)}</div></div>
        <div className={styles.rateCard}><strong>Fixed exchange rate</strong><svg viewBox="0 0 160 50" aria-hidden="true"><path d="M0 25 H160 V50 H0Z" fill="#eaf2ff" /><path d="M0 25 H160" stroke="#a6b8ff" strokeWidth="2" /><circle cx="110" cy="25" r="4" fill="white" stroke="#7b91ff" strokeWidth="2" /></svg><span>1 USDT = 3.6 reAED</span></div>
        <div className={styles.issuedFloat}><span aria-hidden="true"><Check size={18} /></span><div><small>Issued shares</small><strong>{amount(supply?.totalSupply, 0)} issued</strong></div></div>
      </div>
    </section>

    <section className={`${styles.card} ${styles.features}`} aria-label="Core features and reasons to invest">
      <span className={styles.label}>Core features</span><div className={styles.featureGrid}>
        <article className={styles.featureCard}><div className={styles.featureVisual}><div className={styles.ownershipMock}><div><span className={styles.label}>Whole shares</span><i className={styles.liveDot} /></div><Link href={publicView ? signInHref : "#invest"} prefetch={publicView ? false : null}><Grid2X2 size={20} aria-hidden="true" />Choose your shares<ArrowRight size={16} aria-hidden="true" /></Link><div className={styles.miniTiles} aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <i key={i} />)}</div></div></div><div className={styles.featureText}><h3>Fractional ownership</h3><p>Choose a whole number of project shares.</p></div></article>
        <article className={styles.featureCard}><div className={styles.featureVisual}><div className={styles.earningsMock}><div className={styles.mockMetrics}><div><small>Paid claims</small><strong>{formatUsdEquivalent(paid)}</strong></div><div><small>Total funded</small><strong>{formatUsdEquivalent(funded)}</strong></div></div><div className={styles.assetLabels}><span>reAED</span><span>USDT</span></div><div className={styles.chain} aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <i key={i} />)}</div></div></div><div className={styles.featureText}><h3>On-chain earnings</h3><p>Claim funded rewards in reAED or USDT.</p></div></article>
      </div><span className={styles.label}>Why invest</span><div className={styles.whyGrid}>{[
        { Icon: ChartNoAxesCombined, title: "Real revenue", text: "Earnings depend on revenue the project actually funds." },
        { Icon: Wallet, title: "Your ownership", text: "Whole shares are held in your INFRA wallet." },
        { Icon: ShieldCheck, title: "Your decision", text: "Review project information and every wallet approval." },
      ].map(({ Icon, title, text }) => <div key={title}><IconBox><Icon size={20} aria-hidden="true" /></IconBox><p><strong>{title}</strong><span>{text}</span></p></div>)}</div>
    </section>

    <section className={`${styles.card} ${styles.allocation}`} aria-label="Project share allocation"><ProjectAllocation total={supplyTotal} issued={supply?.totalSupply} remaining={supply?.remainingSupply} phased={!!p?.businessOpportunity} view={view} saleLimit={saleLimit} loading={state.isLoading || allocationLoading} publicView={publicView} contributionHref={contributeHref} /><DataState publicView={publicView} error={state.error} onRetry={() => void state.mutate()} /></section>

    <div className={styles.revenueGrid}>
      <section className={`${styles.card} ${styles.revenue}`} aria-label="Revenue so far"><div className={styles.sectionHeading}><span className={styles.label}>Revenue so far</span><Confirmed available={!!funding} /></div><div className={styles.revenueMetrics}>{[
        { Icon: CalendarDays, label: "Last month", value: "—" }, { Icon: ChartNoAxesCombined, label: "Indicative yield", value: indicativeYield }, { Icon: PieChart, label: "Issued shares", value: amount(supply?.totalSupply, 0) }, { Icon: Users, label: "Investors", value: "—" },
      ].map(({ Icon, label, value }) => <div key={label}><IconBox><Icon size={16} aria-hidden="true" /></IconBox><small>{label}</small><strong>{value}</strong></div>)}</div><RevenueHistory revenue={funding} /><p className={styles.disclaimer}><CircleHelp size={15} aria-hidden="true" />Indicative yield is entered by the project owner. Actual earnings depend on funded revenue.</p></section>
      <section className={`${styles.card} ${styles.earn}`} aria-label="How you earn"><span className={styles.label}>How you earn</span><p>Project revenue is allocated to shareholders. Your funded earnings remain yours after a transfer or sale.</p><ol><li><IconBox><ChartNoAxesCombined size={19} aria-hidden="true" /></IconBox><div><strong>Project revenue</strong><small>Confirmed on INFRA</small></div></li><li><IconBox><Users size={19} aria-hidden="true" /></IconBox><div><strong>Allocated to shareholders</strong><small>Remains yours after a transfer or sale</small></div></li><li><IconBox>{publicView ? <LockKeyhole size={19} aria-hidden="true" /> : <Coins size={19} aria-hidden="true" />}</IconBox><div><strong>Your available earnings</strong><small>{publicView ? "Sign in to view" : formatUsdEquivalent(claimTotals)} · Claim in the original asset</small><span className={styles.earnAssets}><em>reAED</em><em>USDT</em></span></div></li></ol><Link className={styles.earnButton} href={publicView ? signInHref : "/invest/earnings"} prefetch={publicView ? false : null}>{publicView ? "Sign in to view your earnings" : "View your earnings"}<ArrowRight size={17} aria-hidden="true" /></Link><p className={styles.disclaimer}><CircleHelp size={15} aria-hidden="true" />No monthly payout or resale buyer is guaranteed.</p></section>
    </div>

    <section className={`${styles.card} ${styles.contract}`} aria-label="Project contract on INFRA"><div className={styles.contractHeading}><IconBox><ShieldCheck size={23} aria-hidden="true" /></IconBox><div><span className={styles.label}>Project contract on INFRA</span><p>Verify the project’s ownership and revenue transactions on the INFRA explorer.</p></div></div><div className={styles.contractField}><span>INFRA</span><code>{p?.contractAddress || "Unavailable"}</code></div>{p?.contractAddress ? <div className={styles.contractActions}><CopyButton value={p.contractAddress} /><a href={`https://uat.scan.infraworld.org/address/${p.contractAddress}`} target="_blank" rel="noopener noreferrer">View contract<ArrowUpRight size={17} aria-hidden="true" /></a></div> : null}</section>
  </div>;
}
