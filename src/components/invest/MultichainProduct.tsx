"use client";
import { useEffect, useRef, useState } from "react";
import type {
  ChainsResponse,
  MultichainPortfolioResponse,
  MultichainQuoteResponse,
  MultichainWalletResponse,
  ProjectSupplyResponse,
  TransactionResponse,
} from "@/lib/platform/api.generated";
import type { Project, ProjectState, RewardView } from "@/lib/platform/types";
import Link from "next/link";
import { api, PlatformError } from "@/lib/platform/client";
import { percentage, safeApproval, units, validWhole } from "@/lib/platform/money";
import { publicIpfsUrl } from "@/lib/platform/media";
import { useActionFeedback } from "../ActionFeedback";
import { usePlatform, useResource } from "./PlatformProvider";
import { Asset as AssetIcon, DataState, InvestorShell, Modal, Panel } from "./InvestorUI";
import { ReidApprovalQr } from "./platform/ReidMobile";
import { ProjectOverview, SupplyTiles, type ProjectNetwork } from "./ProjectOverview";
import { isOpen, phasedView } from "@/lib/platform/multichain-view";
import { ShareAllocation } from "./ShareAllocation";
import "./MultichainProduct.css";
import styles from "./ProjectPageDesign.module.css";

type Chain = ChainsResponse["chains"][number];
type PayOption = { key: string; chainId: number; asset: "USDT" | "NATIVE"; label: string; network: string; balance: string; enough: boolean | null; noFee: boolean; coin: string };
const PLAIN: Record<string, string> = { "bsc-testnet": "BNB Smart Chain", sepolia: "Ethereum", "tron-nile": "TRON" };
const plainNetwork = (key: string, name: string) => PLAIN[key] ?? name;
type Asset = "USDT" | "NATIVE";
export type Command = {
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
  const wallet = useResource<MultichainWalletResponse>("multichain/wallet", 30000);
  const [payKey, setPayKey] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");
  const current0 = supply.data?.phases.find((ph) => ph.status === "ACTIVE");
  const costMicros = current0 && validWhole(quantity) ? BigInt(current0.priceUsdtMicros) * BigInt(quantity) : null;
  const options: PayOption[] = live
    .filter((c) => deployments.find((d) => d.chainId === c.chainId)?.saleOpen)
    .flatMap((c) => {
      const n = wallet.error ? undefined : wallet.data?.networks.find((x) => x.chainId === c.chainId && x.status === "ok");
      const usdt = n ? usdtSix(n.usdt.balanceAtomic, n.usdt.decimals) : null;
      const coin = n && validAtomic(n.native.balanceAtomic) ? BigInt(n.native.balanceAtomic) : null;
      const where = plainNetwork(c.network, c.name);
      return [
        { key: `${c.chainId}:USDT`, chainId: c.chainId, asset: "USDT" as Asset, label: `USDT on ${where}`, network: c.network, balance: n ? `You have ${units(usdt!.toString(), 6, 2)} USDT` : "Balance unavailable", enough: costMicros === null || usdt === null || !n ? null : usdt >= costMicros, noFee: coin === 0n, coin: c.nativeSymbol },
        { key: `${c.chainId}:NATIVE`, chainId: c.chainId, asset: "NATIVE" as Asset, label: `${c.nativeSymbol} on ${where}`, network: c.network, balance: n && coin !== null ? `You have ${units(coin.toString(), n.native.decimals, 4)} ${c.nativeSymbol}` : "Balance unavailable", enough: coin === null ? null : coin > 0n ? null : false, noFee: false, coin: c.nativeSymbol },
      ];
    });
  const pay = options.find((o) => o.key === payKey) ?? options.find((o) => o.asset === "USDT" && o.enough) ?? options.find((o) => o.asset === "USDT") ?? options[0];
  const chain: Chain | undefined = live.find((c) => c.chainId === pay?.chainId) ?? live[0];
  const deployment = deployments.find((d) => d.chainId === chain?.chainId);
  const asset: Asset = pay?.asset ?? "USDT";
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
  const canBuy = Boolean(chain && allowed && q && pay && pay.enough !== false && !(pay.asset === "USDT" && pay.noFee));
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
                <p className="iv-eyebrow">PAY WITH</p>
                {options.length ? (
                  <div className="iv-pay-options" role="radiogroup" aria-label="Pay with">
                    {options.map((o) => (
                      <label key={o.key} className={pay?.key === o.key ? "is-selected" : ""}>
                        <input type="radio" name="pay-with" checked={pay?.key === o.key} onChange={() => setPayKey(o.key)} />
                        <span><strong>{o.label}</strong><small>{o.balance}</small></span>
                        {o.enough === false ? <Link href={`/invest/deposit?network=${o.network}${o.asset === "NATIVE" ? "&asset=fee" : ""}`} className="iv-pay-add">Add money</Link> : null}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="iv-muted">{wallet.isLoading ? "Checking your balances…" : "No network is selling this project right now."}</p>
                )}
                {pay?.asset === "USDT" && pay.noFee ? <p className="iv-pay-note">You also need a little {pay.coin} for the network fee. <Link href={`/invest/deposit?network=${pay.network}&asset=fee`}>Add {pay.coin}</Link></p> : null}
                <dl>
                  <div><dt>Shares</dt><dd>{valid ? count(quantity) : "—"}</dd></div>
                  <div><dt>Price per share</dt><dd>{current ? `${units(current.priceUsdtMicros, 6)} USDT` : "—"}</dd></div>
                </dl>
                <div className="iv-order-total">
                  <span>TOTAL</span>
                  <div>
                    <strong aria-live="polite" aria-busy={quote.isLoading}>{q ? `${q.costDisplay} ${q.symbol}` : quote.isLoading ? "Loading…" : "—"}</strong>
                    <small>{q ? (q.symbol === "USDT" ? `Plus a small network fee in ${chain?.nativeSymbol}` : `${units(q.usdMicros, 6)} USDT at today's rate · plus a small network fee`) : saleLimit === 0n ? "Not on sale right now" : "Choose how many shares"}</small>
                  </div>
                </div>
                <DataState error={quote.error} onRetry={() => void quote.mutate()} />
                <button className="iv-button iv-primary iv-full" disabled={!canBuy} onClick={() => chain && q && setCommand({ type: "BUY", projectId: id, chainId: chain.chainId, asset, quantity, amountAtomic: q.costAtomic })}>{q && valid ? `Buy ${count(quantity)} ${quantity === "1" ? "share" : "shares"} · ${q.costDisplay} ${q.symbol}` : "Buy shares"}</button>
                <p className="iv-muted">{saleLimit === 0n ? (current && !anyOpen ? "Sales haven't opened yet." : "There are no shares on sale now.") : "You'll approve the payment in your reID app. The first USDT payment on a network asks you to approve twice."}</p>
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

type Step = { command: Command; intent: TransactionResponse | null; error: string };
const DONE = ["CONFIRMED", "INDEXED"];

function stepLabel(command: Command) {
  if (command.type === "APPROVE_USDT") return "Allow payment (first time only)";
  if (command.type === "CLAIM") return "Claim your revenue";
  return `Buy ${command.quantity} ${command.quantity === "1" ? "share" : "shares"}`;
}

export function MultichainReview({ command, network, onClose }: { command: Command; network: string; onClose: () => void }) {
  const { approvalOrigin } = usePlatform();
  const { notify } = useActionFeedback();
  const [steps, setSteps] = useState<Step[]>([{ command, intent: null, error: "" }]);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const keys = useRef(new Map<string, string>());
  const started = useRef(false);
  const step = steps[index];
  const id = step?.intent?.id;
  const status = step?.intent?.status;
  const finished = steps.every((s) => s.intent && DONE.includes(s.intent.status));

  function update(i: number, patch: Partial<Step>) {
    setSteps((current) => current.map((s, n) => (n === i ? { ...s, ...patch } : s)));
  }

  async function start(i: number, list: Step[], retry = false) {
    const item = list[i];
    const name = `${i}:${item.command.type}`;
    if (retry || !keys.current.has(name)) keys.current.set(name, crypto.randomUUID());
    setBusy(true);
    update(i, { error: "" });
    try {
      const prepared = await api<TransactionResponse>("multichain/transactions", { method: "POST", body: item.command, idempotencyKey: keys.current.get(name)! });
      update(i, { intent: prepared });
      const sent = prepared.status === "CREATED" ? await api<TransactionResponse>(`multichain/transactions/${prepared.id}/submit`, { method: "POST" }) : prepared;
      update(i, { intent: sent });
    } catch (e) {
      if (e instanceof PlatformError && e.code === "MC_APPROVE_USDT" && item.command.type === "BUY" && item.command.amountAtomic && !list.some((s) => s.command.type === "APPROVE_USDT")) {
        const allow: Step = { command: { type: "APPROVE_USDT", projectId: item.command.projectId, chainId: item.command.chainId, amountAtomic: item.command.amountAtomic }, intent: null, error: "" };
        const next = [...list.slice(0, i), allow, ...list.slice(i)];
        setSteps(next);
        setIndex(i);
        setBusy(false);
        await start(i, next);
        return;
      }
      update(i, { error: e instanceof Error ? e.message : "This couldn't be started. Try again." });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start(0, steps);
  });

  useEffect(() => {
    if (!id || !status || FINAL.includes(status) || status === "CREATED") return;
    const timer = window.setInterval(async () => {
      try {
        const next = await api<TransactionResponse>(`multichain/transactions/${id}`);
        update(index, { intent: next });
        if (next.status === status || !FINAL.includes(next.status)) return;
        if (DONE.includes(next.status)) {
          if (index + 1 < steps.length) {
            setIndex(index + 1);
            void start(index + 1, steps);
          } else notify(steps[index].command.type === "CLAIM" ? "Revenue claimed." : "Done. Your shares are in your wallet.", { kind: "success" });
        } else update(index, { error: STATUS[next.status] ?? "This didn't go through." });
      } catch {
        return;
      }
    }, 4000);
    return () => window.clearInterval(timer);
  });

  const title = command.type === "BUY" ? `Buy ${command.quantity} ${command.quantity === "1" ? "share" : "shares"}` : command.type === "APPROVE_USDT" ? "Allow USDT" : "Claim revenue";
  const url = step?.intent ? safeApproval(step.intent.approvalUrl, approvalOrigin) : null;
  return (
    <Modal title={title} onClose={onClose}>
      <ol className="iv-flow-steps">
        {steps.map((s, n) => {
          const state = s.intent && DONE.includes(s.intent.status) ? "done" : s.error ? "failed" : n === index ? "active" : "waiting";
          return (
            <li key={`${n}:${s.command.type}`} className={`is-${state}`}>
              <span aria-hidden="true">{state === "done" ? "✓" : n + 1}</span>
              <div><strong>{stepLabel(s.command)}</strong>{state === "done" ? <small>Done</small> : state === "active" ? <small>{s.intent ? STATUS[s.intent.status] ?? s.intent.status : "Getting ready…"}</small> : null}</div>
            </li>
          );
        })}
      </ol>
      {finished ? (
        <div className="iv-flow-done" role="status">
          <strong>{command.type === "CLAIM" ? "Your revenue is on its way to your wallet." : `All done. Your shares are in your reID wallet on ${network}.`}</strong>
          <button type="button" className="iv-button iv-primary" onClick={onClose}>Close</button>
        </div>
      ) : step?.error ? (
        <div className="iv-flow-error" role="alert">
          <p>{step.error}</p>
          <button type="button" className="iv-button iv-primary" disabled={busy} onClick={() => void start(index, steps, true)}>Try again</button>
        </div>
      ) : status === "AWAITING_APPROVAL" && url ? (
        <div className="iv-flow-approve">
          <p><strong>Approve in your reID app.</strong> We sent the request to your phone. You can also scan this code.</p>
          <ReidApprovalQr url={url} />
          <a className="iv-button iv-primary" href={url} target="_blank" rel="noreferrer">Open reID</a>
        </div>
      ) : status === "BROADCAST" || status === "SUBMITTING" ? (
        <p className="iv-muted" role="status">Processing. This usually takes under a minute.</p>
      ) : (
        <p className="iv-muted" role="status">Getting things ready…</p>
      )}
      {step?.intent?.explorerUrl ? <p><a href={step.intent.explorerUrl} target="_blank" rel="noreferrer">View on the network explorer</a></p> : null}
    </Modal>
  );
}
