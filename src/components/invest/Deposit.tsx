"use client";

import Image from "next/image";
import { useFeedbackMessage, useActionFeedback } from "../ActionFeedback";
import { LiveDeposit } from "./platform/LiveDeposit";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { usePlatform } from "./PlatformProvider";
import { CopyButton, Initials, InvestorShell, Panel, Tag } from "./InvestorUI";
import { INFRA_EXPLORER, type DepositAsset, type DepositResponse } from "@/lib/deposits";

function displayAmount(amount: string) {
  const [whole, fraction] = amount.split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction ? `.${fraction}` : ""}`;
}

class DepositLoadError extends Error {
  qr?: string;
  signedOut = false;
}

async function fetchDeposits([url, wallet]: readonly [string, string]): Promise<DepositResponse> {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(16000) });
  const body = await response.json();
  if (!response.ok) {
    const error = new DepositLoadError(body.error || "Could not refresh deposits.");
    error.signedOut = response.status === 401;
    if (body.wallet?.toLowerCase() === wallet.toLowerCase() && typeof body.qr === "string") error.qr = body.qr;
    throw error;
  }
  if (typeof body.wallet !== "string" || body.wallet.toLowerCase() !== wallet.toLowerCase()) throw new DepositLoadError("The connected wallet changed. Please sign in again.");
  return body;
}

export function InvestorDeposit() { const { live } = usePlatform(); return live ? <LiveDeposit /> : <ReadOnlyDeposit />; }

function ReadOnlyDeposit() {
  const { user, notify } = usePlatform();
  const [asset, setAsset] = useState<DepositAsset>("reAED");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const { data, error, isLoading, isValidating, mutate } = useSWR<DepositResponse, DepositLoadError>(["/api/invest/deposits", user.wallet], fetchDeposits, { refreshInterval: 30000, dedupingInterval: 15000, shouldRetryOnError: false });
  const { available: feedbackAvailable } = useActionFeedback();
  useFeedbackMessage(error?.message);
  const loading = isLoading || isValidating;
  const qr = data?.qr || error?.qr;
  async function refresh() {
    setStatus("");
    try { const fresh = await mutate(undefined, { revalidate: true, throwOnError: true }); if (fresh) { setStatus("Deposit history refreshed from INFRA."); notify("Deposit history refreshed from INFRA.", { kind: "success" }); } }
    catch { notify("Could not refresh deposits. Please try again."); }
  }

  return <InvestorShell page="deposit" title="Deposit" subtitle="Receive reAED or USDT in your connected reID wallet on INFRA" liveData networkBlock={error ? null : data?.indexedBlock}>
    <div className="iv-main-sidebar">
      <Panel className="iv-deposit-form" title="How would you like to add funds?">
        <fieldset className="iv-deposit-methods"><legend className="sr-only">Deposit method</legend>
          {(["reAED", "USDT"] as const).map(value => <label className={asset === value ? "iv-selected-option" : ""} key={value}><input type="radio" name="deposit-method" value={value} checked={asset === value} onChange={() => setAsset(value)} /><span><strong>{value}</strong><small>Receive on INFRA</small></span></label>)}
          {["Bank transfer", "Card"].map(value => <label className="iv-method-coming" key={value}><span className="iv-method-coming-content" aria-hidden="true"><input type="radio" name="deposit-method" disabled tabIndex={-1} /><span><strong>{value}</strong><small>{value === "Card" ? "Debit or credit card" : "Bank account transfer"}</small></span></span><span className="iv-coming-soon">Coming soon</span><span className="sr-only">{value} — Coming soon, unavailable</span></label>)}
        </fieldset>
        <label className="iv-form-label" htmlFor="deposit-amount">Amount you plan to send <small>(optional)</small></label>
        <div className="iv-amount-field"><input id="deposit-amount" type="number" min="0" step="any" inputMode="decimal" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} /><span>{asset}</span></div>
        <div className="iv-presets">{[1000,5000,10000,25000].map(value => <button key={value} aria-pressed={amount === String(value)} onClick={() => setAmount(String(value))}>{value.toLocaleString()}</button>)}</div>
        <div className="iv-deposit-address">
          <div className="iv-qr">{qr ? <Image src={qr} alt="QR code for your connected reID wallet address" unoptimized width={148} height={148} /> : <span className="iv-qr-placeholder">{loading ? "Loading wallet QR…" : "Use the address shown"}</span>}</div>
          <div><p>Send {asset} on INFRA to your reID wallet</p><code data-deposit-wallet>{user.wallet}</code><div><CopyButton value={user.wallet} /><Tag tone="amber">INFRA · Chain 15324 only</Tag></div><small>The QR contains your wallet address. Choose INFRA and enter the amount in the sending wallet.</small><a className="iv-text-link" href={`${INFRA_EXPLORER}/address/${user.wallet}`} target="_blank" rel="noopener noreferrer">View wallet on INFRA ↗</a></div>
        </div>
        <p className="iv-deposit-help">Send funds from another wallet to this address. Deposits appear automatically after confirmation and explorer indexing.</p>
        <button className="iv-button iv-primary iv-full" disabled={loading} onClick={() => void refresh()}>{loading ? "Checking INFRA…" : "Refresh deposits"}</button>
        <p className="iv-deposit-status" role="status">{status}</p>
      </Panel>
      <Panel title="Recent deposits" className="iv-recent-deposits">
        <p className="iv-muted iv-deposit-history-note">Incoming reAED and USDT transfers to your connected wallet.</p>
        {error && <p className="iv-form-error" role={feedbackAvailable ? undefined : "alert"}>{error.message}{data && " Showing the last loaded records."}{error.signedOut && <> <Link href="/invest?next=%2Finvest%2Fdeposit">Connect with reID again</Link></>}</p>}
        {data?.warnings.map(warning => <p className="iv-form-error" role="status" key={warning}>{warning}</p>)}
        {loading && !data && <p className="iv-empty" role="status">Loading deposits from INFRA…</p>}
        {!loading && !error && data?.deposits.length === 0 && <p className="iv-empty">No reAED or USDT deposits found in recent indexed activity.</p>}
        {data?.deposits.map(deposit => <a className="iv-recent-row iv-real-deposit" href={`${INFRA_EXPLORER}/tx/${deposit.hash}`} target="_blank" rel="noopener noreferrer" key={deposit.id}><Initials name="↓" /><div><strong>{deposit.asset} received</strong><time dateTime={deposit.timestamp}>{new Date(deposit.timestamp).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time><small>{deposit.hash.slice(0, 8)}…{deposit.hash.slice(-6)} ↗</small></div><span><strong>+{displayAmount(deposit.amount)} {deposit.asset}</strong><Tag>Confirmed</Tag></span></a>)}
        {data && <small className="iv-deposit-updated">Last checked {new Date(data.updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}{loading && " · Refreshing…"}</small>}
        <a className="iv-text-link iv-deposit-all" href={`${INFRA_EXPLORER}/address/${user.wallet}`} target="_blank" rel="noopener noreferrer">View full wallet history ↗</a>
      </Panel>
    </div>
  </InvestorShell>;
}
