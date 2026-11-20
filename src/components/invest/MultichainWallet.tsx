"use client";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWRInfinite from "swr/infinite";
import type { MultichainActivityResponse, MultichainPortfolioResponse, MultichainWalletResponse } from "@/lib/platform/api.generated";
import { api } from "@/lib/platform/client";
import { units } from "@/lib/platform/money";
import { CopyButton, DataState, InvestorShell, Panel, Tag } from "./InvestorUI";
import { MultichainReview, type Command } from "./MultichainProduct";
import { usePlatform, useResource } from "./PlatformProvider";
import "./MultichainWallet.css";

type Network = MultichainWalletResponse["networks"][number];
type Activity = MultichainActivityResponse["items"][number];
type Holding = MultichainPortfolioResponse["items"][number];

const NETWORKS = [
  { key: "bsc-testnet", name: "BNB Smart Chain Testnet", short: "BNB Smart Chain", usdt: "USDT (BEP-20)" },
  { key: "sepolia", name: "Ethereum Sepolia", short: "Ethereum", usdt: "USDT (ERC-20)" },
  { key: "tron-nile", name: "TRON Nile", short: "TRON", usdt: "USDT (TRC-20)" },
] as const;
const TYPES: Record<string, string> = {
  BUY: "Bought shares",
  APPROVE_USDT: "Allowed USDT",
  CLAIM: "Claimed revenue",
  TRANSFER_IN: "Shares received",
  TRANSFER_OUT: "Shares sent",
};
const STATUS_TONE: Record<string, string> = { confirmed: "green", pending: "blue", failed: "amber" };
const atomic = (value: string | null | undefined): value is string => typeof value === "string" && /^[0-9]+$/.test(value);
const networkName = (key: string) => NETWORKS.find((n) => n.key === key)?.name ?? key;
const amount = (value: string | null | undefined, decimals: number, symbol: string) => (atomic(value) ? `${units(value, decimals, Math.min(decimals, 6))} ${symbol}` : "—");
const usdtSix = (value: string | null | undefined, decimals: number) => {
  if (!atomic(value)) return null;
  return decimals >= 6 ? BigInt(value) / 10n ** BigInt(decimals - 6) : BigInt(value) * 10n ** BigInt(6 - decimals);
};

function ComingSoonRow({ what }: { what: string }) {
  return (
    <div className="iv-mcw-soon">
      <strong>INFRA</strong>
      <span>{what}</span>
      <Tag tone="neutral">Coming soon</Tag>
    </div>
  );
}

function AddressQr({ value, label }: { value: string; label: string }) {
  const [qr, setQr] = useState<{ value: string; data: string } | null>(null);
  useEffect(() => {
    let current = true;
    void import("qrcode")
      .then(({ toDataURL }) => toDataURL(value, { width: 240, margin: 2, errorCorrectionLevel: "M" }))
      .then((data) => {
        if (current) setQr({ value, data });
      })
      .catch(() => {
        if (current) setQr(null);
      });
    return () => {
      current = false;
    };
  }, [value]);
  return qr?.value === value ? (
    <Image className="iv-mcw-qr" src={qr.data} width={180} height={180} alt={label} unoptimized />
  ) : (
    <p role="status" className="iv-muted">Preparing QR code…</p>
  );
}

function useWallet() {
  return useResource<MultichainWalletResponse>("multichain/wallet", 30000);
}

function NetworkCard({ network }: { network: Network }) {
  const meta = NETWORKS.find((n) => n.key === network.network);
  return (
    <article className="iv-mcw-network">
      <header>
        <h3>{network.name}</h3>
        {network.status === "ok" ? <Tag tone="green">Live</Tag> : <Tag tone="amber">Unavailable</Tag>}
      </header>
      <dl>
        <div>
          <dt>USDT</dt>
          <dd>{amount(network.usdt.balanceAtomic, network.usdt.decimals, "USDT")}</dd>
        </div>
        <div>
          <dt>{network.native.symbol}</dt>
          <dd>{amount(network.native.balanceAtomic, network.native.decimals, network.native.symbol)}</dd>
        </div>
      </dl>
      <p className="iv-mcw-address mono">{network.address}</p>
      <div className="iv-action-row">
        <CopyButton value={network.address} />
        <a className="iv-button iv-small" href={network.explorerUrl} target="_blank" rel="noopener noreferrer">
          Explorer ↗
        </a>
        <Link className="iv-button iv-small iv-primary" href={`/invest/deposit?network=${network.network}`}>
          Deposit
        </Link>
      </div>
      {network.status !== "ok" ? <p className="iv-muted">reID could not read this network right now. {meta ? `Your ${meta.short} balance` : "This balance"} is not included in the total.</p> : null}
    </article>
  );
}

export function MultichainWallet() {
  const wallet = useWallet();
  const portfolio = useResource<MultichainPortfolioResponse>("multichain/portfolio", 30000);
  const w = wallet.error ? undefined : wallet.data;
  const holdings = portfolio.error ? [] : (portfolio.data?.items ?? []);
  return (
    <InvestorShell page="wallet" title="Wallet" subtitle="Your reID wallet on BNB Smart Chain, Ethereum and TRON">
      <DataState loading={wallet.isLoading} error={wallet.error} onRetry={() => void wallet.mutate()} />
      {w ? (
        <>
          <Panel className="iv-mcw-summary">
            <p className="iv-eyebrow">USDT across all networks</p>
            <strong>{amount(w.usdtTotalAtomic, w.usdtTotalDecimals, "USDT")}</strong>
            <p className="iv-muted">{w.complete ? "Balances read from reID just now." : "Some networks could not be read, so this total may be incomplete."} Network coins are shown on each network and are not converted.</p>
          </Panel>
          <div className="iv-mcw-grid">
            {w.networks.map((network) => (
              <NetworkCard key={network.chainId} network={network} />
            ))}
          </div>
          <ComingSoonRow what="INFRA wallet balances will appear here when INFRA launches." />
        </>
      ) : null}
      <Panel title="Your shares" subtitle="Shares you hold in each project, by network">
        <DataState loading={portfolio.isLoading} error={portfolio.error} empty={!portfolio.isLoading && !portfolio.error && holdings.length === 0} onRetry={() => void portfolio.mutate()}>
          You don’t hold any shares yet. <Link href="/invest/explore">Explore projects</Link>
        </DataState>
        {holdings.length ? (
          <div className="iv-table-scroll">
            <table className="iv-mcw-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Network</th>
                  <th>Shares</th>
                </tr>
              </thead>
              <tbody>
                {holdings.flatMap((h) =>
                  h.chains.map((c) => (
                    <tr key={`${h.projectId}-${c.chainId}`}>
                      <td>
                        <Link href={`/invest/products/${h.projectId}`}>{h.title}</Link>
                      </td>
                      <td>{networkName(c.network)}</td>
                      <td>{units(c.shares, 0)}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </Panel>
    </InvestorShell>
  );
}

export function MultichainDeposit() {
  const params = useSearchParams();
  const wallet = useWallet();
  const w = wallet.error ? undefined : wallet.data;
  const requested = params.get("network");
  const [choice, setChoice] = useState<string | null>(null);
  const selected = choice ?? (NETWORKS.some((n) => n.key === requested) ? requested : "bsc-testnet");
  const network = w?.networks.find((n) => n.network === selected);
  const meta = NETWORKS.find((n) => n.key === selected)!;
  return (
    <InvestorShell page="deposit" title="Deposit" subtitle="Add USDT or a network coin to your reID wallet">
      <DataState loading={wallet.isLoading} error={wallet.error} onRetry={() => void wallet.mutate()} />
      <Panel title="Choose a network">
        <div className="iv-mcw-picker" role="radiogroup" aria-label="Network">
          {NETWORKS.map((n) => (
            <button key={n.key} type="button" role="radio" aria-checked={selected === n.key} className={`iv-button ${selected === n.key ? "iv-primary" : ""}`} onClick={() => setChoice(n.key)}>
              {n.short}
            </button>
          ))}
          <span className="iv-mcw-picker-soon">
            INFRA <Tag tone="neutral">Coming soon</Tag>
          </span>
        </div>
      </Panel>
      {network ? (
        <Panel title={`Your ${meta.name} address`} subtitle="Send only on this network">
          <div className="iv-mcw-deposit">
            <AddressQr value={network.address} label={`QR code for your ${meta.name} address`} />
            <div>
              <p className="iv-mcw-address mono">{network.address}</p>
              <div className="iv-action-row">
                <CopyButton value={network.address} />
                <a className="iv-button iv-small" href={network.explorerUrl} target="_blank" rel="noopener noreferrer">
                  Explorer ↗
                </a>
              </div>
              <ul className="iv-mcw-rules">
                <li>
                  Send <strong>{meta.usdt}</strong> or <strong>{network.native.symbol}</strong> on <strong>{meta.name}</strong> only.
                </li>
                <li>Tokens sent on another network, or other tokens, may be lost.</li>
                <li>Keep some {network.native.symbol} for network fees, even if you pay with USDT.</li>
              </ul>
              <dl className="iv-mcw-balances">
                <div>
                  <dt>USDT balance</dt>
                  <dd>{amount(network.usdt.balanceAtomic, network.usdt.decimals, "USDT")}</dd>
                </div>
                <div>
                  <dt>{network.native.symbol} balance</dt>
                  <dd>{amount(network.native.balanceAtomic, network.native.decimals, network.native.symbol)}</dd>
                </div>
              </dl>
              <p className="iv-muted">Balances refresh every 30 seconds after the network confirms your transfer.</p>
            </div>
          </div>
        </Panel>
      ) : null}
    </InvestorShell>
  );
}

export function MultichainWithdraw() {
  const { approvalOrigin } = usePlatform();
  const wallet = useWallet();
  const w = wallet.error ? undefined : wallet.data;
  return (
    <InvestorShell page="withdraw" title="Withdraw" subtitle="Send funds from your reID wallet">
      <Panel title="Send from the reID app">
        <p>Your funds stay in your own reID wallet. To send USDT or a network coin to another address, open the reID app, choose the network and approve the transfer there.</p>
        <a className="iv-button iv-primary" href={approvalOrigin} target="_blank" rel="noopener noreferrer">
          Open reID ↗
        </a>
      </Panel>
      <DataState loading={wallet.isLoading} error={wallet.error} onRetry={() => void wallet.mutate()} />
      {w ? (
        <Panel title="Your addresses" subtitle="Balances you can send from reID">
          <div className="iv-mcw-grid">
            {w.networks.map((network) => (
              <NetworkCard key={network.chainId} network={network} />
            ))}
          </div>
        </Panel>
      ) : null}
      <ComingSoonRow what="Withdrawals on INFRA will be available when INFRA launches." />
    </InvestorShell>
  );
}

export function MultichainEarnings() {
  const portfolio = useResource<MultichainPortfolioResponse>("multichain/portfolio", 30000);
  const [claim, setClaim] = useState<{ command: Command; network: string } | null>(null);
  const items = portfolio.error ? [] : (portfolio.data?.items ?? []);
  const totals = (() => {
    let claimable = 0n,
      claimed = 0n,
      complete = true;
    for (const h of items)
      for (const c of h.chains) {
        const a = usdtSix(c.claimableAtomic, c.usdtDecimals),
          b = usdtSix(c.claimedAtomic, c.usdtDecimals);
        if (a === null || b === null) complete = false;
        claimable += a ?? 0n;
        claimed += b ?? 0n;
      }
    return { claimable, claimed, complete };
  })();
  return (
    <InvestorShell page="earnings" title="My earnings" subtitle="Revenue from the projects you own, paid in USDT on each network">
      <DataState loading={portfolio.isLoading} error={portfolio.error} onRetry={() => void portfolio.mutate()} />
      {portfolio.data && !portfolio.error ? (
        <div className="iv-mcw-kpis">
          <Panel>
            <p className="iv-eyebrow">Available to claim</p>
            <strong>{units(totals.claimable.toString(), 6)} USDT</strong>
          </Panel>
          <Panel>
            <p className="iv-eyebrow">Claimed so far</p>
            <strong>{units(totals.claimed.toString(), 6)} USDT</strong>
          </Panel>
          {!totals.complete ? <p className="iv-muted">Some amounts could not be read right now, so these totals may be incomplete.</p> : null}
        </div>
      ) : null}
      {portfolio.data && !portfolio.error && items.length === 0 ? (
        <p className="iv-empty">
          You don’t own any shares yet, so there is nothing to claim. <Link href="/invest/explore">Explore projects</Link>
        </p>
      ) : null}
      {items.map((h: Holding) => (
        <Panel key={h.projectId} title={h.title} subtitle={`${units(h.totalShares, 0)} shares across ${h.chains.length} ${h.chains.length === 1 ? "network" : "networks"}`}>
          <div className="iv-table-scroll">
            <table className="iv-mcw-table">
              <thead>
                <tr>
                  <th>Network</th>
                  <th>Shares</th>
                  <th>Claimable</th>
                  <th>Claimed so far</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {h.chains.map((c) => {
                  const claimable = atomic(c.claimableAtomic) ? BigInt(c.claimableAtomic) : 0n;
                  return (
                    <tr key={c.chainId}>
                      <td>{networkName(c.network)}</td>
                      <td>{units(c.shares, 0)}</td>
                      <td>{amount(c.claimableAtomic, c.usdtDecimals, "USDT")}</td>
                      <td>{amount(c.claimedAtomic, c.usdtDecimals, "USDT")}</td>
                      <td>
                        <button type="button" className="iv-button iv-small iv-primary" disabled={claimable === 0n} onClick={() => setClaim({ command: { type: "CLAIM", projectId: h.projectId, chainId: c.chainId }, network: networkName(c.network) })}>
                          Claim
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      ))}
      <ComingSoonRow what="Earnings from INFRA projects will appear here when INFRA launches." />
      {claim ? (
        <MultichainReview
          command={claim.command}
          network={claim.network}
          onClose={() => {
            setClaim(null);
            void portfolio.mutate();
          }}
        />
      ) : null}
    </InvestorShell>
  );
}

function ActivityRow({ item }: { item: Activity }) {
  const value = item.amountAtomic && item.decimals !== null && item.symbol ? amount(item.amountAtomic, item.decimals, item.symbol) : null;
  return (
    <li className="iv-mcw-activity-row">
      <div>
        <strong>{TYPES[item.type] ?? item.type}</strong>
        <span className="iv-muted">
          {item.projectTitle ?? "Project"} · {networkName(item.network)}
        </span>
      </div>
      <div>
        {item.quantity ? <span>{units(item.quantity, 0)} {item.quantity === "1" ? "share" : "shares"}</span> : null}
        {value ? <span>{value}</span> : null}
      </div>
      <div>
        <Tag tone={STATUS_TONE[item.status] ?? "neutral"}>{item.status === "confirmed" ? "Confirmed" : item.status === "pending" ? "Pending" : "Failed"}</Tag>
        <time dateTime={item.at}>{new Date(item.at).toLocaleString()}</time>
        {item.explorerUrl ? (
          <a href={item.explorerUrl} target="_blank" rel="noopener noreferrer">
            View ↗
          </a>
        ) : null}
      </div>
    </li>
  );
}

export function MultichainActivityFeed({ limit, network = "", type = "" }: { limit?: number; network?: string; type?: string }) {
  const { live } = usePlatform();
  const query = (cursor: string | null) => {
    const q = new URLSearchParams();
    if (network) q.set("network", network);
    if (type) q.set("type", type);
    if (cursor) q.set("cursor", cursor);
    const s = q.toString();
    return `multichain/activity${s ? `?${s}` : ""}`;
  };
  const pages = useSWRInfinite<MultichainActivityResponse>(
    (index, previous: MultichainActivityResponse | null) => (!live ? null : index === 0 ? query(null) : previous?.nextCursor ? query(previous.nextCursor) : null),
    (path: string) => api<MultichainActivityResponse>(path),
    { revalidateFirstPage: true, refreshInterval: 30000, shouldRetryOnError: false },
  );
  const items = (pages.data ?? []).flatMap((p) => p.items);
  const shown = limit ? items.slice(0, limit) : items;
  const more = !limit && pages.data?.at(-1)?.nextCursor;
  return (
    <>
      <DataState loading={pages.isLoading} error={pages.error} empty={!pages.isLoading && !pages.error && items.length === 0} onRetry={() => void pages.mutate()}>
        No activity yet.
      </DataState>
      {shown.length ? (
        <ul className="iv-mcw-activity">
          {shown.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ul>
      ) : null}
      {more ? (
        <button type="button" className="iv-button" disabled={pages.isValidating} onClick={() => void pages.setSize(pages.size + 1)}>
          Load more
        </button>
      ) : null}
    </>
  );
}

export function MultichainActivity() {
  const [network, setNetwork] = useState("");
  const [type, setType] = useState("");
  return (
    <InvestorShell page="activity" title="Activity" subtitle="Purchases, claims and share transfers on BNB Smart Chain, Ethereum and TRON">
      <Panel>
        <div className="iv-mcw-filters">
          <label>
            Network
            <select value={network} onChange={(e) => setNetwork(e.target.value)}>
              <option value="">All networks</option>
              {NETWORKS.map((n) => (
                <option key={n.key} value={n.key}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All activity</option>
              {Object.entries(TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <MultichainActivityFeed key={`${network}-${type}`} network={network} type={type} />
      </Panel>
      <ComingSoonRow what="INFRA activity will appear here when INFRA launches." />
    </InvestorShell>
  );
}

export function MultichainHome() {
  const { user } = usePlatform();
  const wallet = useWallet();
  const portfolio = useResource<MultichainPortfolioResponse>("multichain/portfolio", 30000);
  const w = wallet.error ? undefined : wallet.data;
  const items = portfolio.error ? undefined : portfolio.data?.items;
  const shares = items?.reduce((sum, h) => sum + (atomic(h.totalShares) ? BigInt(h.totalShares) : 0n), 0n);
  const claimable = items?.reduce((sum, h) => sum + h.chains.reduce((s, c) => s + (usdtSix(c.claimableAtomic, c.usdtDecimals) ?? 0n), 0n), 0n);
  const cards = [
    { title: "Wallet balance", value: w ? amount(w.usdtTotalAtomic, w.usdtTotalDecimals, "USDT") : "—", note: w && !w.complete ? "Some networks could not be read" : "USDT across all networks", href: "/invest/wallet" },
    { title: "Available to claim", value: claimable === undefined ? "—" : `${units(claimable.toString(), 6)} USDT`, note: "Claim on each network", href: "/invest/earnings" },
    { title: "Shares held", value: shares === undefined ? "—" : units(shares.toString(), 0), note: items ? `${items.length} ${items.length === 1 ? "project" : "projects"}` : "Across all projects", href: "/invest/wallet" },
  ];
  return (
    <InvestorShell page="home" title={`Welcome back, ${user.name.split(/\s+/)[0]}`} subtitle="Your reID wallet and shares on BNB Smart Chain, Ethereum and TRON">
      <div className="iv-mcw-kpis">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="iv-panel iv-mcw-kpi">
            <p className="iv-eyebrow">{card.title}</p>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </Link>
        ))}
      </div>
      <DataState loading={wallet.isLoading || portfolio.isLoading} error={wallet.error || portfolio.error} onRetry={() => { void wallet.mutate(); void portfolio.mutate(); }} />
      <Panel title="Recent activity">
        <MultichainActivityFeed limit={5} />
        <Link className="iv-button iv-small" href="/invest/activity">
          See all activity
        </Link>
      </Panel>
      <ComingSoonRow what="INFRA projects and balances will appear here when INFRA launches." />
    </InvestorShell>
  );
}

export function MarketplaceComingSoon() {
  return (
    <InvestorShell page="marketplace" title="Resale marketplace" subtitle="Buy and sell shares with other investors">
      <Panel className="iv-mcw-summary">
        <Tag tone="neutral">Coming soon</Tag>
        <p>Reselling shares on BNB Smart Chain, Ethereum and TRON is coming soon. Until then, your shares stay in your reID wallet and keep earning revenue.</p>
        <Link className="iv-button iv-primary" href="/invest/explore">
          Explore projects
        </Link>
      </Panel>
    </InvestorShell>
  );
}
