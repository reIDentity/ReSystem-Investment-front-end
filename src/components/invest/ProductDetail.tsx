"use client";
import type { SalePhasesResponse } from "@/lib/platform/api.generated";
import { useActionError, useFeedbackMessage } from "../ActionFeedback";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { WalletResponse } from "@/lib/platform/api.generated";
import type { Portfolio, Project, ProjectState, Quote, RewardView } from "@/lib/platform/types";
import { assetLabel, atomic, contractAsset, decimals, expiryTimestamp, percentage, safeAddress, units, whole, validWhole, type PaymentAsset } from "@/lib/platform/money";
import { formatUsdEquivalent, type AssetTotals } from "@/lib/platform/valuation";
import { publicIpfsUrl, projectArtworkUrl } from "@/lib/platform/media";
import { useResource } from "./PlatformProvider";
import { Asset, CopyButton, DataState, InvestorShell, Panel, Tag } from "./InvestorUI";
import { AssetSelect } from "./platform/AssetSelect";
import { TransactionReview, type InvestorCommand } from "./platform/Transaction";
import { ShareAllocation } from "./ShareAllocation";
import "./ProductDetail.css";

const validAtomic = (value: string | null | undefined): value is string => typeof value === "string" && /^[0-9]+$/.test(value);
const amount = (value: string | null | undefined, places: number) => validAtomic(value) ? units(value, places) : "—";

function revenueAmounts(revenue: RewardView | undefined, field: "fundedAtomic" | "claimedTotalAtomic" | "reserveAtomic"): AssetTotals | null {
  const native = revenue?.assets.find(item => item.asset === "REAED" && item.decimals === 18);
  const usdt = revenue?.assets.find(item => item.asset === "USDT" && item.decimals === 6);
  return validAtomic(native?.[field]) && validAtomic(usdt?.[field]) ? { REAED: BigInt(native![field]), USDT: BigInt(usdt![field]) } : null;
}

/** A proportional overview, never a map of individually reserved token IDs. */
function SupplyTiles({ issued, maximum, selected = "0", reserved = "0", onSale, cells = 50, className = "" }: { issued?: string; maximum?: string; selected?: string; reserved?: string; onSale?: string; cells?: 50 | 100; className?: string }) {
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

function PhaseAvailability({ id, initial }: { id: string; initial: SalePhasesResponse }) {
  const [page, setPage] = useState(1);
  const source = useResource<SalePhasesResponse>(
    page > 1 ? `portfolio/projects/${id}/phases?page=${page}` : null,
    15000,
  );
  const view = page === 1 ? initial : source.data;
  if (source.error || !view)
    return (
      <DataState
        loading={!source.data && !source.error}
        error={source.error}
        onRetry={() => void source.mutate()}
      />
    );
  if (view.mode !== "phased") return null;
  const progress = view.current && BigInt(view.current.blocks) > 0n
    ? Number((BigInt(view.current.sold) * 10000n) / BigInt(view.current.blocks))
    : 0;
  return (
    <section className="iv-live-form">
      <h3>Sale phases</h3>
      <p>
        {amount(view.totalBlocks, 0)} total blocks ·{" "}
        {amount(view.reservedBlocks, 0)} Reserved
      </p>
      {view.current ? (
        <>
          <strong>
            {view.current.name} · {amount(view.current.unitPriceAtomic, 6)} USDT
            per block
          </strong>
          <p>
            {amount(view.current.remaining, 0)} blocks remaining ·{" "}
            {view.current.whitelist
              ? "Approved investors only"
              : "Open to all investors"}
            {!view.current.open ? " · Outside the purchase window" : ""}
          </p>
          <progress
            aria-label="Blocks sold in current phase"
            max="10000"
            value={progress}
          />
        </>
      ) : (
        <p>No active sale phase.</p>
      )}
      {view.phases
        .filter((p) => p.id !== view.current?.id && p.status !== "Closed")
        .map((p) => (
          <p key={p.id}>
            {p.name} · {p.status} · {amount(p.blocks, 0)} shares · {p.whitelist ? "Approved investors" : "Public"} · {amount(p.unitPriceAtomic, 6)} USDT per
            block
            {p.startsAt !== "0"
              ? ` · Starts ${new Date(Number(p.startsAt) * 1000).toLocaleString()}`
              : ""}
          </p>
        ))}
      {(page > 1 || view.nextPage) && (
        <div className="iv-two-buttons">
          <button
            className="iv-button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous phases
          </button>
          <button
            className="iv-button"
            disabled={!view.nextPage}
            onClick={() => setPage(page + 1)}
          >
            Next phases
          </button>
        </div>
      )}
    </section>
  );
}

export function InvestorProduct({ id }: { id: string }) {
  const project = useResource<Project>(`projects/${id}`), state = useResource<ProjectState>(`projects/${id}/chain`), revenue = useResource<RewardView>(`projects/${id}/revenue`);
  const portfolio = useResource<Portfolio>("portfolio"), wallet = useResource<WalletResponse>("wallet");
  const p = project.error ? undefined : project.data, supply = state.error ? undefined : state.data, funding = revenue.error ? undefined : revenue.data;
  const h = portfolio.error ? undefined : portfolio.data?.items.find(item => item.projectId === id);
  const [quantity, setQuantity] = useState("1"), [asset, setAsset] = useState<PaymentAsset>("REAED"), [command, setCommand] = useState<InvestorCommand | null>(null), [, setError] = useActionError();
  const [recipient, setRecipient] = useState(""), [transferQuantity, setTransferQuantity] = useState("1");
  const [listingQuantity, setListingQuantity] = useState("1"), [listingPrice, setListingPrice] = useState(""), [listingAsset, setListingAsset] = useState<PaymentAsset>("USDT"), [expiry, setExpiry] = useState("");
  const validQuantity = validWhole(quantity);
  useFeedbackMessage(validQuantity ? "" : "Enter a whole share quantity greater than zero.");
  const phases = useResource<SalePhasesResponse>(p?.businessOpportunity ? `portfolio/projects/${id}/phases?page=1` : null, 15000);
  const view = !phases.error && phases.data?.mode === "phased" ? phases.data : undefined;
  const phase = view?.current;
  const supplyTotal = p ? supply?.maxFractions ?? p.maxFractions : undefined;
  const saleLimit = !p || !supply || !validAtomic(supply.remainingSupply) ? null
    : !supply.saleOpen || supply.purchasePaused ? 0n
    : !p.businessOpportunity ? BigInt(supply.remainingSupply)
    : !view || view.totalBlocks !== supplyTotal ? null
    : !phase?.open ? 0n : validAtomic(phase.remaining) && BigInt(phase.remaining) <= BigInt(supply.remainingSupply) ? BigInt(phase.remaining) : null;
  const accessLimit = phase?.whitelist && phase.open && saleLimit !== 0n
    ? view?.walletApproved === true ? saleLimit : view?.walletApproved === false ? 0n : null : saleLimit;
  const usdtPrice = p?.businessOpportunity ? phase?.open ? phase.unitPriceAtomic : undefined : p?.unitPriceUsdtAtomic;
  const nativePrice = p?.businessOpportunity ? validAtomic(usdtPrice) ? String(BigInt(usdtPrice)*3600000000000n) : null : p?.unitPriceReaedAtomic;
  const publishedUnitPrice = asset === "USDT" ? usdtPrice : nativePrice;
  const balance = !wallet.error ? wallet.data?.assets.find(item => item.symbol === asset && item.decimals === decimals(asset)) : undefined;
  const nativeBalance = !wallet.error ? wallet.data?.assets.find(item => item.symbol === "REAED" && item.decimals === 18)?.balanceAtomic : undefined;
  const noGas = validAtomic(nativeBalance) && BigInt(nativeBalance) === 0n;
  const affordable = noGas ? 0n : validAtomic(balance?.balanceAtomic) && validAtomic(publishedUnitPrice) && BigInt(publishedUnitPrice) > 0n ? BigInt(balance.balanceAtomic) / BigInt(publishedUnitPrice) : null;
  const walletLimit = accessLimit === 0n ? 0n : affordable === null || accessLimit === null ? null : affordable < accessLimit ? affordable : accessLimit;
  const pickerLimit = walletLimit ?? accessLimit;
  const quantityAllowed = validQuantity && pickerLimit !== null && BigInt(quantity) <= pickerLimit;
  const quote = useResource<Quote>(p && quantityAllowed ? `projects/${id}/quote?quantity=${quantity}&asset=${asset}` : null, 15000);
  const currentQuote = !quote.error && quote.data?.projectId === id && quote.data.quantity === quantity && quote.data.asset === asset && quote.data.chainId === 15324 && quote.data.decimals === decimals(asset) && validAtomic(quote.data.amountAtomic) ? quote.data : null;
  const previewTotal = (!p?.businessOpportunity || phase?.open) && validQuantity && validAtomic(publishedUnitPrice) && BigInt(publishedUnitPrice) > 0n && validAtomic(p?.maxFractions) && BigInt(quantity) <= BigInt(p.maxFractions) ? (BigInt(publishedUnitPrice) * BigInt(quantity)).toString() : null;
  const displayedTotal = currentQuote?.amountAtomic ?? previewTotal;
  const issuedPercent = p && supply ? percentage(supply.totalSupply, p.maxFractions) : "—";
  const funded = revenueAmounts(funding, "fundedAtomic"), paid = revenueAmounts(funding, "claimedTotalAtomic");
  const images = p?.media?.filter(media => media.mimeType.startsWith("image/") && /^[a-zA-Z0-9]{32,120}$/.test(media.cid)) || [];
  const documents = p?.media?.filter(media => media.mimeType === "application/pdf" && /^[a-zA-Z0-9]{32,120}$/.test(media.cid)) || [];
  const deposits = funding?.history.status === "available" ? funding.history.items || [] : null;
  const ownsShares = h && validAtomic(h.quantity) && BigInt(h.quantity) > 0n;
  const saleAvailable = saleLimit !== null && saleLimit > 0n;
  const termsChanged = Boolean(p?.businessOpportunity && currentQuote && phase && (currentQuote.phaseId !== phase.id || currentQuote.amountAtomic !== previewTotal));
  const canBuy = Boolean(quantityAllowed && currentQuote && !termsChanged && (!p?.businessOpportunity || (phase && currentQuote.phaseId === phase.id && currentQuote.phaseRevision)));
  const indicativeYield = p?.indicativeYieldBps != null && Number.isSafeInteger(p.indicativeYieldBps) && p.indicativeYieldBps >= 0 ? `${units(String(p.indicativeYieldBps), 2)}%` : "—";
  const nativeClaim = h?.claimable.find(item => item.asset === "REAED" && item.decimals === 18), usdtClaim = h?.claimable.find(item => item.asset === "USDT" && item.decimals === 6);
  const claimTotals: AssetTotals | null = validAtomic(nativeClaim?.amountAtomic) && validAtomic(usdtClaim?.amountAtomic) ? { REAED: BigInt(nativeClaim.amountAtomic), USDT: BigInt(usdtClaim.amountAtomic) } : !portfolio.error && portfolio.data && !h ? { REAED: 0n, USDT: 0n } : null;
  const yourShares = h ? amount(h.quantity, 0) : portfolio.data && !portfolio.error ? "0" : "—";
  function review(c: InvestorCommand) { setError(""); setCommand(c); }
  function reviewedTerms() {
    return currentQuote?.phaseId ? {phaseId:currentQuote.phaseId,phaseName:currentQuote.phaseName,phaseRevision:currentQuote.phaseRevision,amountAtomic:currentQuote.amountAtomic} : {};
  }
  function adjustQuantity(change: bigint) { const next = (validQuantity ? BigInt(quantity) : 0n) + change; if (next > 0n && (change < 0n || (pickerLimit !== null && next <= pickerLimit)) && next <= 10n ** 18n) setQuantity(next.toString()); }
  function handleTransferSubmit(event: FormEvent) { event.preventDefault(); try { const q = whole(transferQuantity); if (!h || BigInt(q) > BigInt(h.quantity)) throw new Error("Quantity exceeds your current holding."); review({ type: "TRANSFER", projectId: id, recipient: safeAddress(recipient), quantity: q }); } catch (cause) { setError((cause as Error).message); } }
  function handleListingSubmit(event: FormEvent) { event.preventDefault(); try { const q = whole(listingQuantity); if (!h || BigInt(q) > BigInt(h.quantity)) throw new Error("Quantity exceeds your current holding."); const until = expiryTimestamp(expiry); review({ type: "CREATE_LISTING", projectId: id, quantity: q, asset: listingAsset, unitPriceAtomic: atomic(listingPrice, decimals(listingAsset)), expiry: until }); } catch (cause) { setError((cause as Error).message); } }

  return <InvestorShell page="product" title={p?.title || "Project details"} subtitle="Explore the project. Own a share of what comes next." networkBlock={supply?.headBlock}>
    <DataState loading={project.isLoading} error={project.error} onRetry={() => void project.mutate()} />
    <div className="iv-product-detail iv-pd-page">
      <section className="iv-product-hero"><div><Link className="iv-button iv-small" href="/invest/explore"><Asset name="6f807" width={16} />All products</Link><div className="iv-product-badges"><Tag tone={saleAvailable ? "green" : "neutral"}>{p ? saleAvailable ? "Open for investment" : saleLimit === null ? "Availability unverified" : "Purchases closed" : "Project unavailable"}</Tag>{ownsShares ? <Tag tone="dark">You own {yourShares} shares</Tag> : null}</div><h2>{p?.title || "Project details"}</h2><p>{p?.description || "Project information is temporarily unavailable. Please try again shortly."}</p><div className="iv-product-features"><span>FRACTIONAL OWNERSHIP</span><span>INFRA NETWORK</span><span>WALLET APPROVAL</span></div></div><div className="iv-product-poster"><div>{images[0] ? <Image src={projectArtworkUrl(p!.id, images[0].cid)} alt={p?.title || "Project image"} width={500} height={888} unoptimized /> : <span className="iv-pd-image-empty">Project image not supplied</span>}</div><span><i />{saleLimit !== null ? `${amount(saleLimit.toString(), 0)} SHARES ON SALE` : "AVAILABILITY UNAVAILABLE"}</span></div></section>

      <Panel className="iv-product-moneyflow"><div className="iv-mono-heading"><span>MONEY FLOW · {p?.title.toUpperCase() || "PROJECT"}</span>{funding ? <b><i />Confirmed on INFRA</b> : null}</div><div className="iv-flow-columns">
        <div className="iv-flow-feed"><span>REVENUE DEPOSITS</span>{deposits?.length ? deposits.slice(0, 6).map(row => { const paymentAsset = contractAsset(row.args_json.asset); return <a className="iv-pd-deposit" href={`https://uat.scan.infraworld.org/tx/${row.tx_hash}`} target="_blank" rel="noopener noreferrer" key={`${row.tx_hash}:${row.args_json.fundingReference}`}><i /><code>{row.tx_hash.slice(0, 8)}…{row.tx_hash.slice(-4)}</code><b>{paymentAsset && validAtomic(row.args_json.amount) ? `+${amount(row.args_json.amount, decimals(paymentAsset))} ${assetLabel(paymentAsset)}` : "Amount unavailable"}</b></a>; }) : <div className="iv-pd-empty">{revenue.isLoading ? "Loading revenue…" : deposits ? "No revenue deposits yet." : "Revenue history unavailable."}</div>}</div>
        <div className="iv-flow-pool"><div><span>REVENUE FUNDED</span><strong>{formatUsdEquivalent(funded)}</strong></div><div className="iv-pd-pool-empty"><strong>Revenue reaches shareholders</strong><p>Confirmed project deposits fund the earnings you can claim.</p></div><footer><b>FUNDED ON INFRA</b><span>USDT EQUIVALENT</span></footer></div>
        <div className="iv-holder-blocks"><div><span>HOLDER DISTRIBUTION</span></div><div className="iv-pd-holder-empty"><span>Holder distribution is not available yet.</span></div></div>
      </div><div className="iv-flow-totals">{[["TOTAL FUNDED", formatUsdEquivalent(funded)], ["ISSUED SHARES", amount(supply?.totalSupply, 0)], ["PAID CLAIMS", formatUsdEquivalent(paid)], ["YOUR SHARES", yourShares]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><DataState loading={revenue.isLoading} error={revenue.error} onRetry={() => void revenue.mutate()} /></Panel>


      <Panel className="iv-launch"><div><p className="iv-eyebrow">PRICE PER SHARE</p><div className="iv-launch-prices"><div><small>Pay with reAED</small><strong>{amount(nativePrice, 18)} <em>reAED</em></strong></div><div><small>Or pay with USDT</small><strong>{amount(usdtPrice, 6)} <em>USDT</em></strong></div></div><div className="iv-launch-progress" aria-hidden="true">{issuedPercent !== "—" ? <span style={{ width: issuedPercent }} /> : null}</div><p className="iv-pd-small">Fixed exchange rate · 1 USDT = 3.6 reAED</p></div><div className="iv-launch-stats">{[[amount(p?.maxFractions, 0), "Maximum shares"], [amount(supply?.totalSupply, 0), "Issued shares"], [amount(saleLimit?.toString(), 0), "Still available"], [yourShares, "Your shares"]].map(([value, label]) => <div key={label}><strong>{value}</strong><small>{label}</small></div>)}</div></Panel>

      <div className="iv-bento-halves"><Panel className="iv-why-invest"><p className="iv-eyebrow">WHY INVEST</p>{[["Real revenue", "Earnings depend on revenue the project actually funds."], ["Your ownership", "Whole shares are held in your INFRA wallet."], ["Your decision", "Review project information and every wallet approval."]].map(([title, text]) => <div key={title}><h3>{title}</h3><p>{text}</p></div>)}</Panel><Panel className="iv-core-features"><p className="iv-eyebrow">CORE FEATURES</p>{[["Fractional ownership", "Choose a whole number of project shares."], ["Wallet approvals", "Review purchases and transfers before signing."], ["On-chain earnings", "Claim funded rewards in reAED or USDT."]].map(([title, text]) => <div key={title}><h3>{title}</h3><p>{text}</p></div>)}</Panel></div>

      <div className="iv-bento-thirds"><Panel className="iv-price-growth"><p className="iv-eyebrow">SHARE PRICING</p><div className="iv-pd-price-reference"><strong>{amount(usdtPrice, 6)}</strong><span>USDT per share</span></div>{[["Clear pricing", "See the exact quote before you buy."], ["Whole shares", "Choose a quantity that fits your investment."], ["Future returns", "Project value and indicative yield do not guarantee a return."]].map(([title, text]) => <div key={title}><h3>{title}</h3><p>{text}</p></div>)}</Panel><Panel className="iv-allocation"><div className="iv-mono-heading"><span>INVESTMENT OPPORTUNITY</span><small>Supply overview · 1% per tile</small></div><div className="iv-allocation-content"><SupplyTiles issued={saleLimit === null ? undefined : supply?.totalSupply} maximum={supplyTotal} reserved={view?.reservedBlocks} onSale={saleLimit?.toString()} cells={100} className="iv-pd-allocation-tiles" /><dl>{[["Maximum shares", amount(p?.maxFractions, 0)], ["Issued shares", amount(supply?.totalSupply, 0)], ["Available shares", amount(saleLimit?.toString(), 0)], ["Issued", issuedPercent]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div><DataState error={state.error} onRetry={() => void state.mutate()} /></Panel></div>

      <div className="iv-bento-thirds iv-bento-reverse"><Panel className="iv-revenue-so-far"><div className="iv-mono-heading"><span>REVENUE SO FAR</span>{funding ? <b><i />Confirmed on INFRA</b> : null}</div><div className="iv-revenue-summary">{[["Last month", "—"], ["Indicative yield", indicativeYield], ["Issued", issuedPercent], ["Investors", "—"]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="iv-pd-revenue-empty">No revenue trend is available yet.</div><p className="iv-pd-small">Indicative yield is entered by the project owner. Actual earnings depend on funded revenue.</p></Panel><Panel className="iv-how-earn"><p className="iv-eyebrow">HOW YOU EARN</p><p>Project revenue is allocated to shareholders. Your funded earnings remain yours after a transfer or sale.</p><div><small>Your available earnings</small><strong>{formatUsdEquivalent(claimTotals)}</strong><small>Claim in the original asset</small></div><Link className="iv-text-link" href="/invest/earnings">View your earnings →</Link><small>No monthly payout or resale buyer is guaranteed.</small></Panel></div>

      <div className="iv-bento-halves"><Panel className="iv-roadmap"><p className="iv-eyebrow">ROADMAP</p><div><i /><span><strong>Project milestones</strong><small>No roadmap has been published for this project yet.</small></span></div></Panel><Panel className="iv-product-wallet"><p className="iv-eyebrow">PROJECT CONTRACT ON INFRA</p><code>{p?.contractAddress || "Unavailable"}</code><p>Verify the project’s ownership and revenue transactions on the INFRA explorer.</p>{p?.contractAddress ? <><CopyButton value={p.contractAddress} /><a className="iv-text-link iv-pd-contract-link" href={`https://uat.scan.infraworld.org/address/${p.contractAddress}`} target="_blank" rel="noopener noreferrer">View contract ↗</a></> : null}</Panel></div>

      <Panel className="iv-invest-panel"><div id="invest" className="iv-invest-anchor" /><div className="iv-panel-toolbar"><div><p className="iv-eyebrow">INVEST / {p?.title.toUpperCase() || "PROJECT"}</p><h2>Choose your shares</h2></div><div className="iv-document-links">{documents.length ? documents.map(document => <a className="iv-button iv-document" href={publicIpfsUrl(document.cid)} target="_blank" rel="noopener noreferrer" key={document.cid}><Asset name="92135" width={16} />{document.filename} ↗</a>) : <span className="iv-pd-document-empty"><Asset name="92135" width={16} />No documents published</span>}</div></div>
        <div className="iv-order-layout"><div className="iv-block-selector"><ShareAllocation total={supplyTotal} issued={supply?.totalSupply} remaining={supply?.remainingSupply} phased={!!p?.businessOpportunity} view={view} saleLimit={saleLimit} walletLimit={walletLimit} asset={asset} saleOpen={supply?.saleOpen} paused={supply?.purchasePaused} noGas={noGas} phasedLoading={phases.isLoading}/>
          {p?.businessOpportunity && <DataState error={phases.error} onRetry={() => void phases.mutate()}/>}
          <div className="iv-block-legend"><span><i className="iv-pd-issued-key" />ISSUED</span><span><i className="iv-legend-available" />ON SALE</span>{(p?.businessOpportunity || saleLimit === 0n) && <span><i className="iv-pd-later-key" />NOT ON SALE</span>}{p?.businessOpportunity && <span><i className="iv-pd-reserved-key" />RESERVED</span>}<span><i className="iv-legend-selected" />SELECTED</span><span>SUPPLY OVERVIEW · 2% PER TILE</span></div><div className="iv-block-progress" aria-hidden="true">{issuedPercent !== "—" ? <span style={{ width: issuedPercent }} /> : null}</div><div className="iv-block-grid-wrap"><SupplyTiles issued={saleLimit === null ? undefined : supply?.totalSupply} maximum={supplyTotal} selected={quantityAllowed ? quantity : "0"} reserved={view?.reservedBlocks} onSale={saleLimit?.toString()} /></div><div className="iv-block-controls"><div><button type="button" aria-label="Decrease share quantity" disabled={!validQuantity || BigInt(quantity) <= 1n} onClick={() => adjustQuantity(-1n)}>−</button><input id="buy-quantity" type="text" inputMode="numeric" aria-label="Share quantity" value={quantity} onChange={event => setQuantity(event.target.value)} /><button type="button" aria-label="Increase share quantity" disabled={!validQuantity || pickerLimit === null || BigInt(quantity) >= pickerLimit} onClick={() => adjustQuantity(1n)}>+</button></div><span>SHARES</span>{["1", "10", "50"].map(value => <button type="button" aria-pressed={quantity === value} disabled={pickerLimit === null || BigInt(value) > pickerLimit} key={value} onClick={() => setQuantity(value)}>{value}</button>)}</div>{!validQuantity ? <p className="iv-form-error" role="alert">Enter a whole share quantity greater than zero.</p> : pickerLimit !== null && pickerLimit > 0n && !quantityAllowed ? <p className="iv-form-error">Choose up to {units(String(pickerLimit), 0)} shares.</p> : null}{view && <PhaseAvailability id={id} initial={view}/>}</div>
          <div className="iv-order-summary"><p className="iv-eyebrow">ORDER SUMMARY</p><dl><div><dt>Shares</dt><dd>{validQuantity ? amount(quantity, 0) : "—"}</dd></div><div><dt>Price per share</dt><dd>{amount(currentQuote ? String(BigInt(currentQuote.amountAtomic)/BigInt(quantity)) : publishedUnitPrice, decimals(asset))} {assetLabel(asset)}</dd></div><div><dt>Selected project share</dt><dd>{p && validQuantity ? percentage(quantity, p.maxFractions) : "—"}</dd></div><div><dt>Monthly earnings estimate</dt><dd>—</dd></div></dl><fieldset className="iv-order-assets"><legend className="sr-only">Payment asset</legend>{(["REAED", "USDT"] as const).map(value => { const balance = wallet.error ? undefined : wallet.data?.assets.find(item => item.symbol === value && item.decimals === decimals(value)); return <label className={asset === value ? "iv-asset-selected" : ""} key={value}><input type="radio" name="payment-asset" value={value} checked={asset === value} onChange={() => setAsset(value)} /><strong>{assetLabel(value)}</strong><span>{balance ? amount(balance.balanceAtomic, decimals(value)) : "Balance unavailable"}</span></label>; })}</fieldset><div className="iv-order-total"><span>TOTAL</span><div><strong aria-live="polite" aria-busy={quote.isLoading}>{displayedTotal ? `${amount(displayedTotal, decimals(asset))} ${assetLabel(asset)}` : project.isLoading ? "Loading…" : "—"}</strong><small>Network gas is paid separately in reAED</small></div></div><DataState error={quote.error} onRetry={() => void quote.mutate()} />{termsChanged && <p role="status">The phase or price has changed. <button type="button" className="iv-text-link" onClick={() => { void phases.mutate(); void quote.mutate(); }}>Refresh the terms before reviewing</button></p>}{asset === "USDT" ? <button className="iv-button iv-full iv-pd-allowance" disabled={!canBuy} onClick={() => canBuy && currentQuote && review({ type: "APPROVE_USDT", projectId: id, quantity: whole(quantity), asset: "USDT", amountAtomic: currentQuote.amountAtomic, ...reviewedTerms() })}>Review exact USDT allowance</button> : null}<button className="iv-button iv-primary iv-full" disabled={!canBuy} onClick={() => review({ type: "BUY", projectId: id, asset, quantity: whole(quantity), ...reviewedTerms() })}>Review purchase</button><p className="iv-muted">{saleLimit === 0n ? "There are no shares on sale now." : "Approve with reID. Shares arrive in your INFRA wallet after confirmation."}</p><small>Returns depend on future revenue. Review the exact transaction before signing.</small></div>
        </div>
      </Panel>

      {h && p && ownsShares ? <details className="iv-pd-manage"><summary>Transfer or sell your shares</summary><div className="iv-live-columns"><form className="iv-live-form" onSubmit={handleTransferSubmit}><h3>Transfer shares</h3><label htmlFor="transfer-recipient">Recipient wallet</label><input id="transfer-recipient" className="iv-input" value={recipient} onChange={event => setRecipient(event.target.value)} placeholder="0x…" required autoComplete="off" /><label htmlFor="transfer-quantity">Whole quantity</label><input id="transfer-quantity" className="iv-input" inputMode="numeric" value={transferQuantity} onChange={event => setTransferQuantity(event.target.value)} required /><button className="iv-button iv-primary" disabled={h.quantity === "0"}>Review transfer</button></form><form className="iv-live-form" onSubmit={handleListingSubmit}><h3>Offer shares for resale</h3><label htmlFor="listing-quantity">Whole quantity</label><input id="listing-quantity" className="iv-input" inputMode="numeric" value={listingQuantity} onChange={event => setListingQuantity(event.target.value)} /><AssetSelect asset={listingAsset} setAsset={setListingAsset} id="listing-asset" /><label htmlFor="listing-price">Price per share ({assetLabel(listingAsset)})</label><input id="listing-price" className="iv-input" inputMode="decimal" value={listingPrice} onChange={event => setListingPrice(event.target.value)} required /><label htmlFor="listing-expiry">Expiry</label><input id="listing-expiry" className="iv-input" type="datetime-local" value={expiry} onChange={event => setExpiry(event.target.value)} required /><button type="button" className="iv-button" onClick={() => review({ type: "APPROVE_MARKETPLACE", projectId: id })}>Review marketplace approval</button><button className="iv-button iv-primary" disabled={h.quantity === "0"}>Review listing</button><small>Operator approval allows marketplace transfers during fills. Shares remain in your wallet until a buyer fills the listing. No buyer or buyback is guaranteed.</small></form></div></details> : null}
    </div>
    {command ? <TransactionReview command={command} onClose={() => { setCommand(null); if(p?.businessOpportunity) void quote.mutate(); }} /> : null}
  </InvestorShell>;
}
