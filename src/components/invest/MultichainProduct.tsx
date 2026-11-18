"use client";
import { useEffect, useRef, useState } from "react";
import type {
  ChainsResponse,
  MultichainPortfolioResponse,
  MultichainQuoteResponse,
  ProjectSupplyResponse,
  TransactionResponse,
} from "@/lib/platform/api.generated";
import type { Project } from "@/lib/platform/types";
import { api } from "@/lib/platform/client";
import { safeApproval, units, validWhole } from "@/lib/platform/money";
import { useActionError, useActionFeedback } from "../ActionFeedback";
import { usePlatform, useResource } from "./PlatformProvider";
import { DataState, InvestorShell, Modal, Panel, Tag } from "./InvestorUI";
import { ReidApprovalQr } from "./platform/ReidMobile";
import "./MultichainProduct.css";

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

export function MultichainProduct({ id }: { id: string }) {
  const project = useResource<Project>(`projects/${id}`);
  const supply = useResource<ProjectSupplyResponse>(`projects/${id}/supply`, 15000);
  const chains = useResource<ChainsResponse>("chains", 0);
  const portfolio = useResource<MultichainPortfolioResponse>("multichain/portfolio", 15000);
  const live = (chains.data?.chains ?? []).filter((c) => supply.data?.chains.some((d) => d.chainId === c.chainId && d.status === "DEPLOYED"));
  const [chainId, setChainId] = useState<number | null>(null);
  const chain: Chain | undefined = live.find((c) => c.chainId === chainId) ?? live[0];
  const [asset, setAsset] = useState<Asset>("USDT");
  const [quantity, setQuantity] = useState("1");
  const [command, setCommand] = useState<Command | null>(null);
  const valid = validWhole(quantity);
  const quote = useResource<MultichainQuoteResponse>(
    chain && valid ? `projects/${id}/multichain-quote?chainId=${chain.chainId}&asset=${asset}&quantity=${quantity}` : null,
    15000,
  );
  const p = project.error ? undefined : project.data;
  const s = supply.error ? undefined : supply.data;
  const current = s?.phases.find((ph) => ph.status === "ACTIVE");
  const holding = portfolio.data?.items.find((i) => i.projectId === id);
  const q = quote.error ? undefined : quote.data;
  const symbol = asset === "USDT" ? "USDT" : chain?.nativeSymbol ?? "";

  return (
    <InvestorShell page="product" title={p?.title || "Project details"} subtitle="One project, available on several networks. Shares bought on any network come from the same supply.">
      <DataState loading={project.isLoading || supply.isLoading} error={project.error || supply.error} onRetry={() => { void project.mutate(); void supply.mutate(); }} />
      {p && s ? (
        <div className="iv-mc">
          <Panel title="About this project">
            <p className="iv-muted">{p.description}</p>
            <dl className="iv-mc-stats">
              <div><dt>Total shares</dt><dd>{count(s.maxFractions)}</dd></div>
              <div><dt>Sold</dt><dd>{count(s.sold)}</dd></div>
              <div><dt>Available now</dt><dd>{count(current ? current.available : "0")}</dd></div>
              <div><dt>Price per share</dt><dd>{current ? `${units(current.priceUsdtMicros, 6)} USDT` : "—"}</dd></div>
            </dl>
            {current ? (
              <p className="iv-muted">
                {current.name}
                {current.whitelist ? " · approved investors only" : " · open to everyone"}
                {current.endsAt ? ` · ends ${new Date(current.endsAt).toLocaleString()}` : ""}
              </p>
            ) : (
              <p className="iv-muted">No sale phase is open right now.</p>
            )}
          </Panel>

          <Panel title="Choose a network" subtitle="Pay on the network where you hold funds. Your reID wallet uses the same account on every network.">
            <div className="iv-mc-chips" role="radiogroup" aria-label="Network">
              {live.map((c) => (
                <button key={c.chainId} type="button" role="radio" aria-checked={chain?.chainId === c.chainId} className={`iv-mc-chip${chain?.chainId === c.chainId ? " is-active" : ""}`} onClick={() => setChainId(c.chainId)}>
                  {c.name}
                </button>
              ))}
              {chains.data?.comingSoon.map((c) => (
                <span key={c.chainId} className="iv-mc-chip is-soon" aria-disabled="true">
                  {c.name} <Tag tone="amber">Coming soon</Tag>
                </span>
              ))}
            </div>
            {chain ? (
              <div className="iv-live-form">
                <div className="iv-mc-chips" role="radiogroup" aria-label="Pay with">
                  {(["USDT", "NATIVE"] as Asset[]).map((a) => (
                    <button key={a} type="button" role="radio" aria-checked={asset === a} className={`iv-mc-chip${asset === a ? " is-active" : ""}`} onClick={() => setAsset(a)}>
                      {a === "USDT" ? "USDT" : chain.nativeSymbol}
                    </button>
                  ))}
                </div>
                <label htmlFor="mc-quantity">Shares</label>
                <input id="mc-quantity" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))} />
                {!valid ? <p className="iv-muted">Enter a whole number of shares.</p> : null}
                <DataState error={quote.error} onRetry={() => void quote.mutate()} />
                {q ? (
                  <dl className="iv-exact-summary">
                    <div><dt>You pay</dt><dd>{q.costDisplay} {q.symbol}</dd></div>
                    <div><dt>Value</dt><dd>{units(q.usdMicros, 6)} USDT</dd></div>
                    {asset === "NATIVE" ? <div><dt>Rate</dt><dd>{q.nativeUsdMicros ? `1 ${q.symbol} ≈ ${units(q.nativeUsdMicros, 6)} USDT` : "—"}</dd></div> : null}
                    <div><dt>Price held for</dt><dd>{Math.round(q.validForSeconds / 60)} minutes after you confirm</dd></div>
                  </dl>
                ) : null}
                <div className="iv-two-buttons">
                  {asset === "USDT" ? (
                    <button type="button" className="iv-button" disabled={!q} onClick={() => q && setCommand({ type: "APPROVE_USDT", projectId: id, chainId: chain.chainId, amountAtomic: q.costAtomic })}>
                      Step 1 · Allow USDT
                    </button>
                  ) : null}
                  <button type="button" className="iv-button iv-primary" disabled={!q} onClick={() => setCommand({ type: "BUY", projectId: id, chainId: chain.chainId, asset, quantity })}>
                    {asset === "USDT" ? "Step 2 · Buy shares" : `Buy with ${symbol}`}
                  </button>
                </div>
                <p className="iv-muted">Network fees are paid in {chain.nativeSymbol} from your wallet on {chain.name}.</p>
              </div>
            ) : (
              <p className="iv-muted">This project is not live on any network yet.</p>
            )}
          </Panel>

          <Panel title="Your shares" subtitle={portfolio.data?.tronWallet ? `EVM ${portfolio.data.wallet} · TRON ${portfolio.data.tronWallet}` : undefined}>
            <DataState loading={portfolio.isLoading} error={portfolio.error} onRetry={() => void portfolio.mutate()} />
            {holding ? (
              <>
                <p><strong>{count(holding.totalShares)}</strong> shares across all networks</p>
                <table className="iv-mc-table">
                  <thead><tr><th>Network</th><th>Shares</th><th>Revenue to claim</th><th /></tr></thead>
                  <tbody>
                    {holding.chains.map((h) => (
                      <tr key={h.chainId}>
                        <td>{chains.data?.chains.find((c) => c.chainId === h.chainId)?.name ?? h.network}</td>
                        <td>{count(h.shares)}</td>
                        <td>{validAtomic(h.claimableAtomic) ? `${units(h.claimableAtomic, h.usdtDecimals)} USDT` : "—"}</td>
                        <td>
                          {validAtomic(h.claimableAtomic) && BigInt(h.claimableAtomic) > 0n ? (
                            <button type="button" className="iv-button" onClick={() => setCommand({ type: "CLAIM", projectId: id, chainId: h.chainId })}>Claim</button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : !portfolio.isLoading && !portfolio.error ? (
              <p className="iv-muted">You don&apos;t hold shares in this project yet.</p>
            ) : null}
          </Panel>
        </div>
      ) : null}
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
