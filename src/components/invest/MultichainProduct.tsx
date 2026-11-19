"use client";
import { useEffect, useRef, useState } from "react";
import type {
  ChainsResponse,
  MultichainPortfolioResponse,
  MultichainQuoteResponse,
  ProjectSupplyResponse,
  TransactionResponse,
} from "@/lib/platform/api.generated";
import type { Project, ProjectState, RewardView } from "@/lib/platform/types";
import { api } from "@/lib/platform/client";
import { percentage, safeApproval, units, validWhole } from "@/lib/platform/money";
import { publicIpfsUrl } from "@/lib/platform/media";
import { useActionError, useActionFeedback } from "../ActionFeedback";
import { usePlatform, useResource } from "./PlatformProvider";
import { Asset as AssetIcon, DataState, InvestorShell, Modal, Panel, Tag } from "./InvestorUI";
import { ReidApprovalQr } from "./platform/ReidMobile";
import { ProjectOverview, SupplyTiles, type ProjectNetwork } from "./ProjectOverview";
import { isOpen, phasedView } from "@/lib/platform/multichain-view";
import { ShareAllocation } from "./ShareAllocation";
import "./MultichainProduct.css";
import styles from "./ProjectPageDesign.module.css";

type Chain = ChainsResponse["chains"][number];
type Asset = "USDT" | "NATIVE";
type Command = {
  type: "BUY" | "APPROVE_USDT" | "CLAIM";
  projectId: string;
  chainId: number;
  asset?: Asset;
  quantity?: string;
  amountAtomic?: string;
};

const STATUS: Record<string, string> = {
  CREATED: "Ready for your review",
  SUBMITTING: "Sending to reID",
  AWAITING_APPROVAL: "Waiting for your approval in reID",
  BROADCAST: "Sent to the network",
  CONFIRMED: "Confirmed",
  INDEXED: "Confirmed and recorded",
  REJECTED: "Rejected in reID",
  FAILED: "Failed",
  EXPIRED: "Expired",
  RECONCILIATION_REQUIRED: "Being checked",
};
const FINAL = ["CONFIRMED", "INDEXED", "REJECTED", "FAILED", "EXPIRED"];
const validAtomic = (v: string | null | undefined): v is string => typeof v === "string" && /^[0-9]+$/.test(v);
const count = (v: string | null | undefined) => (validAtomic(v) ? units(v, 0) : "—");
const NO_REVENUE = { data: undefined as RewardView | undefined, isLoading: false, error: undefined, mutate: () => undefined };
function usdtSix(atomic: string | null, places: number) {
  if (!validAtomic(atomic)) return 0n;
  return places >= 6 ? BigInt(atomic) / 10n ** BigInt(places - 6) : BigInt(atomic) * 10n ** BigInt(6 - places);
}

export function MultichainProduct({ id }: { id: string }) {
  const project = useResource<Project>(`projects/${id}`);
  const supply = useResource<ProjectSupplyResponse>(`projects/${id}/supply`, 15000);
  const chains = useResource<ChainsResponse>("chains", 0);
  const portfolio = useResource<MultichainPortfolioResponse>("multichain/portfolio", 15000);
  const [now] = useState(() => Date.now());
  const deployments = supply.data?.chains.filter((d) => d.status === "DEPLOYED") ?? [];
  const live = (chains.data?.chains ?? []).filter((c) => deployments.some((d) => d.chainId === c.chainId));
  const [chainId, setChainId] = useState<number | null>(null);
  const chain: Chain | undefined = live.find((c) => c.chainId === chainId) ?? live.find((c) => deployments.find((d) => d.chainId === c.chainId)?.saleOpen) ?? live[0];
  const deployment = deployments.find((d) => d.chainId === chain?.chainId);
  const [asset, setAsset] = useState<Asset>("USDT");
  const [quantity, setQuantity] = useState("1");
  const [command, setCommand] = useState<Command | null>(null);
  const p = project.error ? undefined : project.data;
  const s = supply.error ? undefined : supply.data;
  const current = s?.phases.find((ph) => ph.status === "ACTIVE");
  const view = s ? phasedView(s, now) : undefined;
  const anyOpen = deployments.some((d) => d.saleOpen);
  const saleLimit = !s ? null : !current || !isOpen(current, now) || !deployment?.saleOpen ? 0n : BigInt(current.available);
  const valid = validWhole(quantity);
  const allowed = valid && saleLimit !== null && BigInt(quantity) <= saleLimit;
  const quote = useResource<MultichainQuoteResponse>(
    chain && allowed ? `projects/${id}/multichain-quote?chainId=${chain.chainId}&asset=${asset}&quantity=${quantity}` : null,
    15000,
  );
  const q = !quote.error && quote.data?.quantity === quantity && quote.data.asset === asset && quote.data.chainId === chain?.chainId ? quote.data : undefined;
  const holding = portfolio.error ? undefined : portfolio.data?.items.find((i) => i.projectId === id);
  const owned = holding && validAtomic(holding.totalShares) && BigInt(holding.totalShares) > 0n;
  const claimable = holding ? holding.chains.reduce((total, h) => total + usdtSix(h.claimableAtomic, h.usdtDecimals), 0n) : 0n;
  const state: ProjectState | undefined = s ? { totalSupply: s.sold, remainingSupply: s.available, maxFractions: s.maxFractions, saleOpen: anyOpen, purchasePaused: false, fundingPaused: false, headBlock: "", source: "multichain" } : undefined;
  const networks: ProjectNetwork[] = live.map((c) => {
    const d = deployments.find((item) => item.chainId === c.chainId);
    return { chainId: c.chainId, name: c.name, nativeSymbol: c.nativeSymbol, contract: d?.contract ?? null, explorerUrl: d?.explorerUrl ?? null };
  });
  const documents = p?.media?.filter((media) => media.mimeType === "application/pdf" && /^[a-zA-Z0-9]{32,120}$/.test(media.cid)) || [];
  const issuedPercent = s ? percentage(s.sold, s.maxFractions) : "—";
  const symbol = asset === "USDT" ? "USDT" : chain?.nativeSymbol ?? "";
  const canBuy = Boolean(chain && allowed && q);
  function adjust(change: bigint) {
    const next = (valid ? BigInt(quantity) : 0n) + change;
    if (next > 0n && (change < 0n || (saleLimit !== null && next <= saleLimit))) setQuantity(next.toString());
  }

  return (
    <InvestorShell page="product" title={p?.title || "Project details"} subtitle="One project, available on several networks. Shares bought on any network come from the same supply.">
      <DataState loading={project.isLoading || supply.isLoading} error={project.error || supply.error} onRetry={() => { void project.mutate(); void supply.mutate(); }} />
      <div className={`iv-product-detail iv-pd-page ${styles.content}`}>
        <ProjectOverview
          project={project}
          state={{ data: state, error: supply.error, isLoading: supply.isLoading, mutate: () => supply.mutate() }}
          revenue={NO_REVENUE}
          saleLimit={saleLimit}
          supplyTotal={s?.maxFractions}
          nativePrice={null}
          usdtPrice={current?.priceUsdtMicros}
          issuedPercent={issuedPercent}
          view={view}
          yourShares={holding ? count(holding.totalShares) : portfolio.data && !portfolio.error ? "0" : "—"}
          claimTotals={portfolio.data && !portfolio.error ? { REAED: 0n, USDT: claimable } : null}
          ownsShares={!!owned}
          allocationLoading={supply.isLoading}
          networks={networks}
        />

        <Panel className={`iv-invest-panel ${styles.choosePanel}`}>
          <div id="invest" className="iv-invest-anchor" />
          <div className={styles.chooseLayout}>
            <div className={styles.chooseSummary}>
              <div className="iv-panel-toolbar">
                <div><p className="iv-eyebrow">INVEST / {p?.title.toUpperCase() || "PROJECT"}</p><h2>Choose your shares</h2></div>
                <div className="iv-document-links">
                  {documents.length ? documents.map((document) => <a className="iv-button iv-document" href={publicIpfsUrl(document.cid)} target="_blank" rel="noopener noreferrer" key={document.cid}><AssetIcon name="92135" width={16} />{document.filename} ↗</a>) : <span className="iv-pd-document-empty"><AssetIcon name="92135" width={16} />No documents published</span>}
                </div>
              </div>
              <ShareAllocation total={s?.maxFractions} issued={s?.sold} remaining={s?.available} phased view={view} saleLimit={saleLimit} walletLimit={null} asset="USDT" saleOpen={anyOpen} paused={false} noGas={false} phasedLoading={supply.isLoading} selected={allowed ? quantity : undefined} />
            </div>
            <div className={styles.chooseActions}>
              <div className={styles.supplyPanel}>
                <div className="iv-block-legend"><span><i className="iv-pd-issued-key" />ISSUED</span><span><i className="iv-legend-available" />ON SALE</span><span><i className="iv-pd-later-key" />NOT ON SALE</span><span><i className="iv-pd-reserved-key" />RESERVED</span><span><i className="iv-legend-selected" />SELECTED</span><span>SUPPLY OVERVIEW · 2% PER TILE</span></div>
                <div className="iv-block-progress" aria-hidden="true">{issuedPercent !== "—" ? <span style={{ width: issuedPercent }} /> : null}</div>
                <div className="iv-block-grid-wrap"><SupplyTiles issued={s?.sold} maximum={s?.maxFractions} selected={allowed ? quantity : "0"} reserved={s?.reservedBlocks} onSale={saleLimit?.toString()} /></div>
                <div className="iv-block-controls">
                  <div>
                    <button type="button" aria-label="Decrease share quantity" disabled={!valid || BigInt(quantity) <= 1n} onClick={() => adjust(-1n)}>−</button>
                    <input id="buy-quantity" type="text" inputMode="numeric" aria-label="Share quantity" value={quantity} onChange={(event) => setQuantity(event.target.value.replace(/\D/g, ""))} />
                    <button type="button" aria-label="Increase share quantity" disabled={!valid || saleLimit === null || BigInt(quantity) >= saleLimit} onClick={() => adjust(1n)}>+</button>
                  </div>
                  <span>SHARES</span>
                  {["1", "10", "50"].map((value) => <button type="button" aria-pressed={quantity === value} disabled={saleLimit === null || BigInt(value) > saleLimit} key={value} onClick={() => setQuantity(value)}>{value}</button>)}
                </div>
                {!valid ? <p className="iv-form-error" role="alert">Enter a whole share quantity greater than zero.</p> : saleLimit !== null && saleLimit > 0n && !allowed ? <p className="iv-form-error">Choose up to {units(String(saleLimit), 0)} shares.</p> : null}
              </div>
              <div className={`iv-order-summary ${styles.orderSummary}`}>
                <p className="iv-eyebrow">ORDER SUMMARY</p>
                <div className="iv-mc-chips" role="radiogroup" aria-label="Network">
                  {live.map((c) => (
                    <button key={c.chainId} type="button" role="radio" aria-checked={chain?.chainId === c.chainId} className={`iv-mc-chip${chain?.chainId === c.chainId ? " is-active" : ""}`} onClick={() => setChainId(c.chainId)}>{c.name}</button>
                  ))}
                  {chains.data?.comingSoon.map((c) => <span key={c.chainId} className="iv-mc-chip is-soon" aria-disabled="true">{c.name} <Tag tone="amber">Coming soon</Tag></span>)}
                </div>
                <dl>
                  <div><dt>Shares</dt><dd>{valid ? count(quantity) : "—"}</dd></div>
                  <div><dt>Price per share</dt><dd>{current ? `${units(current.priceUsdtMicros, 6)} USDT` : "—"}</dd></div>
                  <div><dt>Selected project share</dt><dd>{s && valid ? percentage(quantity, s.maxFractions) : "—"}</dd></div>
                  <div><dt>Network</dt><dd>{chain?.name ?? "—"}</dd></div>
                </dl>
                <fieldset className="iv-order-assets">
                  <legend className="sr-only">Payment asset</legend>
                  {(["USDT", "NATIVE"] as Asset[]).map((value) => (
                    <label className={asset === value ? "iv-asset-selected" : ""} key={value}>
                      <input type="radio" name="payment-asset" value={value} checked={asset === value} onChange={() => setAsset(value)} />
                      <strong>{value === "USDT" ? "USDT" : chain?.nativeSymbol ?? "Coin"}</strong>
                      <span>{value === "USDT" ? "Fixed phase price" : "At the live rate"}</span>
                    </label>
                  ))}
                </fieldset>
                <div className="iv-order-total">
                  <span>TOTAL</span>
                  <div>
                    <strong aria-live="polite" aria-busy={quote.isLoading}>{q ? `${q.costDisplay} ${q.symbol}` : quote.isLoading ? "Loading…" : "—"}</strong>
                    <small>{q ? `${units(q.usdMicros, 6)} USDT · price held ${Math.round(q.validForSeconds / 60)} min · gas in ${chain?.nativeSymbol}` : `Network gas is paid separately in ${chain?.nativeSymbol ?? "the network coin"}`}</small>
                  </div>
                </div>
                <DataState error={quote.error} onRetry={() => void quote.mutate()} />
                {asset === "USDT" ? <button className="iv-button iv-full iv-pd-allowance" disabled={!canBuy} onClick={() => q && chain && setCommand({ type: "APPROVE_USDT", projectId: id, chainId: chain.chainId, amountAtomic: q.costAtomic })}>Review exact USDT allowance</button> : null}
                <button className="iv-button iv-primary iv-full" disabled={!canBuy} onClick={() => chain && setCommand({ type: "BUY", projectId: id, chainId: chain.chainId, asset, quantity })}>{asset === "USDT" ? "Review purchase" : `Review purchase with ${symbol}`}</button>
                <p className="iv-muted">{saleLimit === 0n ? (current && chain && !deployment?.saleOpen ? `Sales aren't open on ${chain.name} right now.` : "There are no shares on sale now.") : `Approve with reID. Shares arrive in your wallet on ${chain?.name ?? "the chosen network"} after confirmation.`}</p>
                <small>Returns depend on future revenue. Review the exact transaction before signing.</small>
              </div>
            </div>
          </div>
        </Panel>

        {owned && holding ? (
          <Panel title="Your shares on each network" subtitle={portfolio.data?.tronWallet ? `EVM ${portfolio.data.wallet} · TRON ${portfolio.data.tronWallet}` : undefined}>
            <table className="iv-mc-table">
              <thead><tr><th>Network</th><th>Shares</th><th>Revenue to claim</th><th /></tr></thead>
              <tbody>
                {holding.chains.map((h) => (
                  <tr key={h.chainId}>
                    <td>{chains.data?.chains.find((c) => c.chainId === h.chainId)?.name ?? h.network}</td>
                    <td>{count(h.shares)}</td>
                    <td>{validAtomic(h.claimableAtomic) ? `${units(h.claimableAtomic, h.usdtDecimals)} USDT` : "—"}</td>
                    <td>{validAtomic(h.claimableAtomic) && BigInt(h.claimableAtomic) > 0n ? <button type="button" className="iv-button" onClick={() => setCommand({ type: "CLAIM", projectId: id, chainId: h.chainId })}>Claim</button> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        ) : null}
      </div>
      {command ? (
        <MultichainReview
          command={command}
          network={live.find((c) => c.chainId === command.chainId)?.name ?? ""}
          onClose={() => {
            setCommand(null);
            void supply.mutate();
            void portfolio.mutate();
            void quote.mutate();
          }}
        />
      ) : null}
    </InvestorShell>
  );
}

function MultichainReview({ command, network, onClose }: { command: Command; network: string; onClose: () => void }) {
  const { approvalOrigin } = usePlatform();
  const { notify } = useActionFeedback();
  const [intent, setIntent] = useState<TransactionResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useActionError();
  const key = useRef<string | null>(null);
  const id = intent?.id;
  const status = intent?.status;

  useEffect(() => {
    if (!id || !status || FINAL.includes(status) || status === "CREATED") return;
    const timer = setInterval(async () => {
      try {
        const next = await api<TransactionResponse>(`multichain/transactions/${id}`);
        setIntent(next);
        if (next.status !== status && FINAL.includes(next.status))
          notify(next.status === "CONFIRMED" || next.status === "INDEXED" ? "Confirmed on the network." : STATUS[next.status] ?? next.status, { kind: next.status === "CONFIRMED" || next.status === "INDEXED" ? "success" : "error" });
      } catch {
        return;
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [id, status, notify]);

  async function prepare() {
    setBusy(true);
    setError("");
    key.current ??= crypto.randomUUID();
    try {
      setIntent(await api<TransactionResponse>("multichain/transactions", { method: "POST", body: command, idempotencyKey: key.current }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "This request could not be prepared.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!intent) return;
    setBusy(true);
    setError("");
    try {
      setIntent(await api<TransactionResponse>(`multichain/transactions/${intent.id}/submit`, { method: "POST" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "The approval request could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  const title = command.type === "BUY" ? `Buy ${command.quantity} ${command.quantity === "1" ? "share" : "shares"}` : command.type === "APPROVE_USDT" ? "Allow USDT" : "Claim revenue";
  const url = intent ? safeApproval(intent.approvalUrl, approvalOrigin) : null;
  return (
    <Modal title={title} onClose={onClose}>
      <p className="iv-muted">Network: {network}</p>
      {error ? <p role="alert" className="iv-mc-error">{error}</p> : null}
      {!intent ? (
        <>
          <p>We will reserve your shares, check your balance and the network fee, and prepare one transaction for you to approve in reID. Nothing moves until you approve it.</p>
          <button type="button" className="iv-button iv-primary" disabled={busy} onClick={() => void prepare()}>Prepare</button>
        </>
      ) : (
        <>
          <p role="status"><Tag tone={["FAILED", "REJECTED", "EXPIRED"].includes(intent.status) ? "amber" : "blue"}>{STATUS[intent.status] ?? intent.status}</Tag></p>
          {intent.status === "CREATED" ? (
            <>
              <p>Reserved until {new Date(intent.expiresAt).toLocaleTimeString()}. Approve before then.</p>
              <button type="button" className="iv-button iv-primary" disabled={busy} onClick={() => void submit()}>Request approval in reID</button>
            </>
          ) : null}
          {intent.status === "AWAITING_APPROVAL" && url ? (
            <>
              <p>Open the reID app on your phone, or scan this code, to approve.</p>
              <ReidApprovalQr url={url} />
              <a className="iv-button" href={url} target="_blank" rel="noreferrer">Open in reID</a>
            </>
          ) : null}
          {intent.explorerUrl ? (
            <p><a href={intent.explorerUrl} target="_blank" rel="noreferrer">View on the network explorer</a></p>
          ) : null}
        </>
      )}
    </Modal>
  );
}
