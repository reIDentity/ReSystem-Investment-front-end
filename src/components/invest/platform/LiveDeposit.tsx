"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { ChainActivity, Page } from "@/lib/platform/types";
import { assetLabel, explorer, units, type PaymentAsset } from "@/lib/platform/money";
import { usePlatform, useResource } from "../PlatformProvider";
import { CopyButton, DataState, Initials, InvestorShell, Panel, Provenance, Tag } from "../InvestorUI";
import "./LiveDeposit.css";

type Deposits = Page<ChainActivity> & { wallet: string; address: string; qrDataUrl: string };

export function LiveDeposit() {
  const { user } = usePlatform();
  const [cursor, setCursor] = useState<string | null>(null);
  const [asset, setAsset] = useState<PaymentAsset>("REAED");
  const [amount, setAmount] = useState("");
  const [qr, setQr] = useState<{ wallet: string; url: string } | null>(null);
  const deposits = useResource<Deposits>(`wallet/deposits${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
  const data = deposits.data;
  const matches = data?.wallet.toLowerCase() === user.wallet.toLowerCase() && data?.address.toLowerCase() === user.wallet.toLowerCase();
  useEffect(() => {
    if (!matches) return;
    let active = true;
    void import("qrcode").then(module => module.toDataURL(user.wallet, { errorCorrectionLevel: "M", margin: 0, width: 124, color: { dark: "#0091ff", light: "#ffffff" } })).then(url => { if (active) setQr({ wallet: user.wallet, url }); }).catch(() => { /* The verified text address remains usable when QR generation fails. */ });
    return () => { active = false; };
  }, [matches, user.wallet]);
  return <InvestorShell page="deposit" title="Deposit" subtitle="Add reAED, USDT, a bank transfer or a card payment to your wallet" networkBlock={data?.provenance?.indexedBlock}>
    <div className="iv-main-sidebar iv-deposit-page">
      <Panel className="iv-deposit-form">
        <fieldset className="iv-deposit-options">
          <legend>How would you like to add funds?</legend>
          <div className="iv-deposit-methods">
            {(["REAED", "USDT"] as const).map(value => <label key={value} className={asset === value ? "iv-selected" : ""}><input type="radio" name="deposit-method" value={value} checked={asset === value} onChange={() => setAsset(value)} /><span><strong>{assetLabel(value)}</strong><small>Receive on INFRA</small></span></label>)}
            {["Bank transfer", "Card"].map(label => <label className="iv-method-coming" key={label}><span className="iv-method-coming-content" aria-hidden="true"><input type="radio" disabled tabIndex={-1} /><span><strong>{label}</strong><small>{label === "Card" ? "Debit or credit card" : "Bank account transfer"}</small></span></span><span className="iv-coming-soon">Coming soon</span><span className="sr-only">{label} — Coming soon, unavailable</span></label>)}
          </div>
        </fieldset>
        <div>
          <label className="iv-form-label" htmlFor="deposit-amount">Amount</label>
          <div className="iv-amount-field"><input id="deposit-amount" inputMode="decimal" placeholder="Enter amount" aria-describedby="deposit-amount-help" value={amount} onChange={event => setAmount(event.target.value)} /><span>{assetLabel(asset)}</span></div>
          <div className="iv-presets">{["1000", "5000", "10000", "25000"].map(value => <button key={value} aria-pressed={amount === value} onClick={() => setAmount(value)}>{units(value, 0)}</button>)}</div>
        </div>
        <div className="iv-deposit-address">
          <div className="iv-qr">{matches && qr?.wallet === user.wallet ? <Image src={qr.url} width={124} height={124} unoptimized alt="QR code for your connected reID wallet address" /> : <span className="iv-qr-placeholder">{deposits.isLoading ? "Loading wallet QR…" : "Use the address shown"}</span>}</div>
          <div><p>Send {assetLabel(asset)} on INFRA to</p><code data-deposit-wallet>{user.wallet}</code><div><CopyButton value={user.wallet} /><Tag tone="amber">INFRA network only</Tag></div><small className="sr-only" id="deposit-amount-help">The QR contains your connected wallet address. Choose INFRA and enter the amount in your sending wallet. Deposits appear after confirmation.</small></div>
        </div>
        <button className="iv-button iv-primary iv-full" disabled={deposits.isValidating} onClick={() => void deposits.mutate()}>{deposits.isValidating ? "Checking deposits…" : "Refresh deposits"}</button>
      </Panel>
      <Panel title="Recent deposits" className="iv-recent-deposits">
        <DataState loading={deposits.isLoading} error={deposits.error || (data && !matches ? new Error("The wallet changed. Reconnect with reID.") : null)} empty={Boolean(matches && data?.items.length === 0)} onRetry={() => void deposits.mutate()}>No confirmed deposits yet.</DataState>
        {matches && !deposits.error ? data?.items.map(row => <div className="iv-recent-row iv-real-deposit" key={`${row.tx_hash}:${row.activity_index}`}><Initials name="↓" /><div><strong>{assetLabel(row.asset || "")} received</strong><time dateTime={row.timestamp}>{new Date(row.timestamp).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</time>{explorer(row.tx_hash) ? <a className="iv-text-link" href={explorer(row.tx_hash)!} target="_blank" rel="noopener noreferrer">View transaction ↗</a> : null}</div><span><strong>+{units(row.amount_atomic, row.asset === "USDT" ? 6 : 18)} {assetLabel(row.asset || "")}</strong><Tag>Confirmed</Tag></span></div>) : null}
        <div className="iv-action-row">{cursor ? <button className="iv-button iv-small" onClick={() => setCursor(null)}>Latest</button> : null}{data?.nextCursor ? <button className="iv-button iv-small" onClick={() => setCursor(data.nextCursor)}>Older deposits</button> : null}</div>
        <Provenance source={data?.provenance?.source} block={data?.provenance?.indexedBlock} updated={data?.provenance?.updatedAt} coverage={data?.provenance?.historyCoverage} />
      </Panel>
    </div>
  </InvestorShell>;
}
