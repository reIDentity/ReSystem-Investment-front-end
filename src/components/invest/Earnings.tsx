"use client";

import Link from "next/link";
import { useState } from "react";
import type { Holding, Portfolio, ProjectState, RewardView } from "@/lib/platform/types";
import { contractAsset, assetLabel, decimals, explorer, percentage, units, type PaymentAsset } from "@/lib/platform/money";
import { formatUsdEquivalent, sumRewardTotals, type AssetTotals } from "@/lib/platform/valuation";
import { usePlatform, useResource } from "./PlatformProvider";
import { Asset, CopyButton, DataState, Initials, InvestorShell, Modal, Panel, Provenance, Tag } from "./InvestorUI";
import { TransactionReview, type InvestorCommand } from "./platform/Transaction";
import "./Earnings.css";

const ASSETS = ["REAED", "USDT"] as const;
const isAtomic = (value: string | null | undefined): value is string => typeof value === "string" && /^[0-9]+$/.test(value);

function holdingAmounts(holding: Holding | undefined, field: "claimable" | "claimed" = "claimable") {
  return sumRewardTotals(holding ? [holding] : undefined, field);
}

function rewardTotals(revenue: RewardView | undefined, field: "fundedAtomic" | "claimedTotalAtomic" | "reserveAtomic"): AssetTotals | null {
  if (!revenue) return null;
  const result: AssetTotals = { REAED: 0n, USDT: 0n };
  for (const asset of ASSETS) {
    const matching = revenue.assets.filter(value => value.asset === asset);
    if (matching.length !== 1 || matching[0].decimals !== decimals(asset) || !isAtomic(matching[0][field])) return null;
    result[asset] = BigInt(matching[0][field]);
  }
  return result;
}

function exactAmount(amounts: AssetTotals | null, asset: PaymentAsset) {
  return amounts ? units(amounts[asset].toString(), decimals(asset)) : "—";
}

export function InvestorEarnings() {
  const { live } = usePlatform();
  const portfolio = useResource<Portfolio>("portfolio");
  const [selected, setSelected] = useState("");
  const [chartMode, setChartMode] = useState("Revenue");
  const [claimOpen, setClaimOpen] = useState(false);
  const [command, setCommand] = useState<InvestorCommand | null>(null);
  const verifiedPortfolio = portfolio.error || !live ? undefined : portfolio.data;
  const holdings = verifiedPortfolio?.items;
  const holding = holdings?.find(item => item.projectId === selected) || holdings?.[0];
  const projectId = holding?.projectId;
  const revenue = useResource<RewardView>(projectId ? `projects/${projectId}/revenue` : null);
  const chain = useResource<ProjectState>(projectId ? `projects/${projectId}/chain` : null);
  const verifiedRevenue = revenue.error ? undefined : revenue.data;
  const verifiedChain = chain.error ? undefined : chain.data;
  const claimable = holdingAmounts(holding);
  const claimed = holdingAmounts(holding, "claimed");
  const funded = rewardTotals(verifiedRevenue, "fundedAtomic");
  const reserve = rewardTotals(verifiedRevenue, "reserveAtomic");
  const paid = rewardTotals(verifiedRevenue, "claimedTotalAtomic");
  const canClaim = Boolean(claimable && ASSETS.some(asset => claimable[asset] > 0n));
  const sold = isAtomic(verifiedChain?.totalSupply) ? verifiedChain.totalSupply : null;
  const cap = isAtomic(verifiedChain?.maxFractions) ? verifiedChain.maxFractions : null;
  const remaining = isAtomic(verifiedChain?.remainingSupply) ? verifiedChain.remainingSupply : null;
  const soldPercent = sold !== null && cap !== null ? percentage(sold, cap) : "—";
  const contract = holding && /^0x[0-9a-fA-F]{40}$/.test(holding.contractAddress) ? holding.contractAddress : null;
  const history = verifiedRevenue?.history;

  function reviewProjectClaim(asset?: PaymentAsset) {
    if (!projectId || !claimable || (asset ? claimable[asset] === 0n : !canClaim)) return;
    setClaimOpen(false);
    setCommand(asset ? { type: "CLAIM", projectId, asset } : { type: "CLAIM_BOTH", projectId });
  }

  const summary = [
    { title: "Revenue today", value: "—", note: "Daily totals are not available yet", primary: true },
    { title: "Revenue this month", value: "—", note: "Monthly totals are not available yet" },
    { title: "Shares sold", value: sold === null ? "—" : units(sold, 0), note: cap === null ? "Select a project to view supply" : `of ${units(cap, 0)} total`, badge: soldPercent === "—" ? null : soldPercent },
    { title: "Earned per share", value: "—", note: "Historical per-share totals unavailable" },
  ];

  return <InvestorShell page="earnings" title="My earnings" subtitle="Live revenue from the products you own and your share of it" networkBlock={verifiedPortfolio?.headBlock}>
    <div className="eg-page">
      <div className="eg-projects" aria-label="Choose earnings project">
        {holdings?.length ? holdings.map(item => <button key={item.projectId} aria-pressed={item.projectId === projectId} onClick={() => setSelected(item.projectId)}><i className={isAtomic(item.quantity) && BigInt(item.quantity) > 0n ? "eg-project-owned" : ""} />{item.title}{item.quantity === "0" ? <span className="sr-only"> · previous holder</span> : null}</button>) : <span className="eg-project-placeholder">{portfolio.isLoading ? "Loading your projects…" : portfolio.error || !live ? "Projects unavailable" : "Your projects will appear here"}</span>}
      </div>
      <DataState loading={portfolio.isLoading} error={portfolio.error} onRetry={() => void portfolio.mutate()} />

      <div className="eg-summary" aria-label="Selected project earnings summary">
        {summary.map(card => <section className={`eg-kpi ${card.primary ? "eg-kpi-primary" : ""}`} key={card.title} aria-busy={card.title === "Shares sold" && chain.isLoading}>
          <div className="eg-kpi-heading"><span>{card.title}</span>{card.badge ? <Tag tone="neutral">{card.badge}</Tag> : null}</div><strong>{card.value}</strong><p>{card.note}</p>
        </section>)}
      </div>

      <div className="eg-upper">
        <Panel className="eg-daily">
          <div className="eg-panel-heading"><div><h2>Daily revenue</h2><p>{holding ? `Paid into ${holding.title} · last 14 days` : "Payments into the selected project"}</p></div><div className="eg-chart-switch" role="group" aria-label="Daily revenue view">{["Revenue", "Per share"].map(mode => <button key={mode} aria-pressed={mode === chartMode} onClick={() => setChartMode(mode)}>{mode}</button>)}</div></div>
          <div className="eg-chart-empty" role="status"><div><strong>{chartMode === "Revenue" ? "Daily revenue history is not available yet" : "Daily per-share history is not available yet"}</strong><p>Confirmed funding records appear below. A daily series will appear here when verified history is available.</p></div></div>
        </Panel>

        <Panel className="eg-supply">
          <div className="eg-panel-heading"><h2>Share supply</h2>{verifiedChain ? <Tag tone="green">On-chain</Tag> : null}</div>
          <div className="eg-supply-overview"><div className="eg-supply-ring"><Asset name="ce39e" width={170} /><span><strong>{soldPercent}</strong><small>sold</small></span></div><dl>{[["Sold", sold], ["Available", remaining], ["Yours", holding?.quantity]].map(([label, amount]) => <div key={label}><dt><i />{label}</dt><dd>{isAtomic(amount) ? units(amount, 0) : "—"}</dd></div>)}</dl></div>
          <DataState loading={chain.isLoading} error={chain.error} onRetry={() => void chain.mutate()} />
          <div className="eg-revenue-wallet"><span>Project revenue contract</span>{contract ? <><div><code>{contract.slice(0, 12)}…{contract.slice(-8)}</code><CopyButton value={contract}>Copy</CopyButton></div><a className="iv-text-link" href={`https://uat.scan.infraworld.org/address/${contract}`} target="_blank" rel="noopener noreferrer">View on INFRA explorer ↗</a></> : <p>Select a project to view its contract.</p>}</div>
        </Panel>
      </div>

      <div className="eg-lower">
        <Panel className="eg-pool" title="Shareholder pool" subtitle="Each funding deposit is allocated across the shares issued at that moment. Previously allocated rewards stay with you after a transfer.">
          <div className="eg-table-scroll"><table className="eg-pool-table"><caption className="sr-only">Your current share and previously allocated rewards</caption><thead><tr><th>Holder</th><th>Shares</th><th>Next allocation share</th><th>To claim</th></tr></thead><tbody>{holding ? <tr className="eg-you-row"><td><Initials name="You" />You{holding.quantity === "0" ? <small>Previous holder</small> : null}</td><td>{units(holding.quantity, 0)}</td><td>{percentage(holding.revenueParticipation.numerator, holding.revenueParticipation.denominator)}</td><td title="USDT equivalent · 1 USDT = 3.6 reAED · rounded down to cents">{formatUsdEquivalent(claimable)}</td></tr> : null}<tr><td colSpan={4}><div className="eg-holder-empty"><strong>{holdings?.length === 0 ? "Your first investment starts here" : "Holder distribution is not available"}</strong><p>{holdings?.length === 0 ? "Your shares and retained rewards will appear here after a confirmed investment." : "Only your verified holding is shown. Other holders’ details are not available in this view."}</p>{holdings?.length === 0 ? <Link href="/invest/explore" className="iv-button">Explore projects →</Link> : null}</div></td></tr></tbody></table></div>
          <details className="eg-funding-details"><summary>Funding details</summary><div className="eg-funding-totals"><h3>Funded project rewards</h3><div className="eg-asset-ledgers">{ASSETS.map(asset => <dl key={asset}><div><dt>{assetLabel(asset)} funded</dt><dd>{exactAmount(funded, asset)}</dd></div><div><dt>Claimed by all holders</dt><dd>{exactAmount(paid, asset)}</dd></div><div><dt>Reserved in contract</dt><dd>{exactAmount(reserve, asset)}</dd></div></dl>)}</div><p>Contract totals are all time, in the original asset. A reserve includes rewards owed to other holders and protected rounding dust.</p></div></details>
          <Provenance source={verifiedPortfolio?.source} block={verifiedPortfolio?.headBlock} />
          {holding ? <Link className="iv-text-link" href={`/invest/products/${holding.projectId}`}>View project and ownership details →</Link> : null}
        </Panel>

        <div className="eg-side">
          <Panel className="eg-claim-card"><span>{holding ? `Your share of ${holding.title}` : "Your project rewards"}</span><strong title="USDT equivalent · 1 USDT = 3.6 reAED · rounded down to cents">{formatUsdEquivalent(claimable)}</strong><p>{holding ? `${units(holding.quantity, 0)} shares${holding.quantity === "0" ? " · retained historical rewards" : ""}` : "Select a project to view your share"}</p><div className="eg-personal-assets">{ASSETS.map(asset => <div key={asset}><span>{assetLabel(asset)}</span><strong>{exactAmount(claimable, asset)}</strong></div>)}</div><button className="iv-button iv-full eg-claim-button" disabled={!canClaim} onClick={() => setClaimOpen(true)}>Claim to wallet</button><small>Previously claimed: {formatUsdEquivalent(claimed)}</small></Panel>
          <Panel className="eg-incoming"><div className="eg-panel-heading"><h2>Incoming payments</h2>{history?.status === "available" ? <Tag tone="green">Indexed</Tag> : null}</div><DataState loading={revenue.isLoading} error={revenue.error} onRetry={() => void revenue.mutate()} />{!projectId ? <p className="eg-payment-empty">Select a project to view actual revenue deposits.</p> : history?.status === "unavailable" ? <p className="eg-payment-empty">Funding history is unavailable. Current contract totals are shown separately.</p> : history?.status === "available" && history.items?.length === 0 ? <p className="eg-payment-empty">No confirmed funding deposits are indexed for this project yet.</p> : <div className="eg-payment-list">{history?.items?.map(row => { const asset = contractAsset(row.args_json.asset); const url = explorer(row.tx_hash); return <article key={`${row.tx_hash}:${row.args_json.fundingReference}`}><strong>{asset && isAtomic(row.args_json.amount) ? `${units(row.args_json.amount, decimals(asset))} ${assetLabel(asset)}` : "Amount unavailable"}</strong><small>Allocated across {units(row.args_json.issuedSupply, 0)} issued shares · block {row.block_number}</small><details><summary>Funding reference</summary><span>{row.args_json.fundingReference}</span></details>{url ? <a className="iv-text-link" href={url} target="_blank" rel="noopener noreferrer">View funding transaction ↗</a> : null}</article>; })}</div>}</Panel>
        </div>
      </div>

    </div>
    {claimOpen && holding ? <Modal title={`Claim rewards · ${holding.title}`} onClose={() => setClaimOpen(false)}><p className="iv-muted">Choose the funded asset to claim. You’ll review the exact transaction before requesting approval.</p><div className="eg-claim-choices">{ASSETS.map(asset => <div key={asset}><div><strong>{assetLabel(asset)}</strong><span>{exactAmount(claimable, asset)} available</span><small>{exactAmount(claimed, asset)} previously claimed</small></div><button className="iv-button iv-primary" disabled={!claimable || claimable[asset] === 0n} onClick={() => reviewProjectClaim(asset)}>Review {assetLabel(asset)} claim</button></div>)}</div><button className="iv-button iv-full" disabled={!canClaim} onClick={() => reviewProjectClaim()}>Review claim for both assets</button></Modal> : null}
    {command ? <TransactionReview command={command} onClose={() => setCommand(null)} /> : null}
  </InvestorShell>;
}
