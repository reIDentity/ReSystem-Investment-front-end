"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { WalletResponse } from "@/lib/platform/api.generated";
import type { Portfolio } from "@/lib/platform/types";
import { atomic, assetLabel, decimals, safeAddress, units, type PaymentAsset } from "@/lib/platform/money";
import { formatUsdEquivalent, sumRewardTotals, walletAssetTotals } from "@/lib/platform/valuation";
import { usePlatform, useResource } from "./PlatformProvider";
import { CopyButton, DataState, Initials, InvestorShell, Panel, Provenance } from "./InvestorUI";
import { TransactionReview, type InvestorCommand } from "./platform/Transaction";
import "./WalletFlows.css";

const ASSETS: PaymentAsset[] = ["REAED", "USDT"];
const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;
const assetEquivalent = (asset: PaymentAsset, amount: bigint | undefined) => amount === undefined ? "—" : formatUsdEquivalent({ REAED: asset === "REAED" ? amount : 0n, USDT: asset === "USDT" ? amount : 0n });

export function InvestorWallet() {
  const { user } = usePlatform();
  const wallet = useResource<WalletResponse>("wallet");
  const portfolio = useResource<Portfolio>("portfolio");
  const balances = walletAssetTotals(wallet.error ? undefined : wallet.data?.assets);
  const rewards = sumRewardTotals(portfolio.error ? undefined : portfolio.data?.items);
  const holdings = portfolio.error ? [] : portfolio.data?.items.filter(holding => /^\d+$/.test(holding.quantity) && BigInt(holding.quantity) > 0n) || [];
  return <InvestorShell page="wallet" title="Wallet" subtitle="Balances and share tokens held on INFRA" networkBlock={wallet.error ? undefined : wallet.data?.headBlock}>
    <div className="iv-wallet-top iv-wallet-restored">
      <Panel className="iv-total-balance"><p>Total balance</p><strong>{formatUsdEquivalent(balances)}</strong><div><span title={user.wallet}>{shortAddress(user.wallet)}</span><CopyButton value={user.wallet} /></div></Panel>
      <Panel title="Quick actions" className="iv-quick-actions">
        <Link href="/invest/deposit"><Initials name="↓" />Deposit funds</Link>
        <Link href="/invest/explore"><Initials name="+" />Buy shares</Link>
        <Link href="/invest/earnings"><Initials name="$" tone="dark" />{rewards ? `Claim ${formatUsdEquivalent(rewards)}` : "Claim earnings"}</Link>
        <Link href="/invest/withdraw"><Initials name="↑" tone="neutral" />Withdraw</Link>
      </Panel>
    </div>
    <DataState loading={wallet.isLoading} error={wallet.error} onRetry={() => void wallet.mutate()} />
    <Panel title="Assets" className="iv-wallet-assets"><div className="iv-table-scroll"><table className="iv-table iv-assets-table">
      <thead><tr><th>Asset</th><th>Type</th><th>Balance</th><th>Value</th></tr></thead><tbody>
        {balances ? ASSETS.map(asset => <tr key={asset}><td><Initials name={asset === "REAED" ? "AE" : "US"} tone={asset === "USDT" ? "green" : "blue"} />{assetLabel(asset)}</td><td>{asset === "REAED" ? "Native asset" : "Stablecoin"}</td><td>{units(balances[asset].toString(), decimals(asset))}</td><td>{assetEquivalent(asset, balances[asset])}</td></tr>) : null}
        {holdings.map(holding => <tr key={holding.projectId}><td><Initials name={holding.title.slice(0, 2).toUpperCase()} /><Link href={`/invest/products/${holding.projectId}`}>{holding.title} shares</Link></td><td>Product shares</td><td>{units(holding.quantity, 0)}</td><td><span title="A resale value is not guaranteed">—</span></td></tr>)}
      </tbody></table></div>
      <DataState loading={portfolio.isLoading} error={portfolio.error} empty={Boolean(portfolio.data && holdings.length === 0)} onRetry={() => void portfolio.mutate()}>No product shares held yet.</DataState>
      <p className="iv-wallet-value-note">Values use 1 USDT = 3.6 reAED. Share resale value depends on a buyer; unclaimed earnings are separate from wallet funds.</p>
      <Provenance source={wallet.data?.source} block={wallet.data?.headBlock} />
    </Panel>
  </InvestorShell>;
}
export function InvestorWithdraw() {
  const wallet = useResource<WalletResponse>("wallet");
  const balances = walletAssetTotals(wallet.error ? undefined : wallet.data?.assets);
  const [step, setStep] = useState(0);
  const [source, setSource] = useState<PaymentAsset | "RESALE">("REAED");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [command, setCommand] = useState<InvestorCommand | null>(null);
  const [error, setError] = useState("");
  const asset = source === "RESALE" ? "REAED" : source;
  const available = balances?.[asset];
  let enteredAmount: string | null = null;
  try { enteredAmount = atomic(amount, decimals(asset)); } catch { /* Incomplete input has no quoted amount. */ }
  function validatedAmount() {
    const value = atomic(amount, decimals(asset));
    if (available === undefined || BigInt(value) > available) throw new Error("Amount exceeds the verified available balance.");
    return value;
  }
  function next(event: FormEvent) {
    event.preventDefault(); setError("");
    if (source === "RESALE") return;
    try {
      if (step === 1) validatedAmount();
      if (step === 2) setRecipient(safeAddress(recipient.trim()));
      if (step === 3) { setCommand({ type: "SEND", asset, amountAtomic: validatedAmount(), recipient: safeAddress(recipient.trim()) }); return; }
      setStep(step + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Check the amount and destination."); }
  }
  return <InvestorShell page="withdraw" title="Withdraw" subtitle="Send wallet funds or offer your shares on the marketplace" networkBlock={wallet.error ? undefined : wallet.data?.headBlock}>
    <div className="iv-main-sidebar iv-withdraw-restored"><Panel className="iv-withdraw-form">
      <ol className="iv-stepper">{["Source", "Amount", "Destination", "Review"].map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
      <DataState loading={wallet.isLoading} error={wallet.error} onRetry={() => void wallet.mutate()} />
      <form onSubmit={next}>
        {step === 0 ? <><h2>What would you like to withdraw?</h2><fieldset className="iv-withdraw-sources"><legend className="sr-only">Withdrawal source</legend>
          {ASSETS.map(option => <label className={source === option ? "iv-selected-option" : ""} key={option}><input type="radio" name="withdraw-source" checked={source === option} onChange={() => { setSource(option); setAmount(""); setError(""); }} /><span><strong>{assetLabel(option)} balance</strong><small>{option === "REAED" ? "Includes claimed earnings; keep reAED for gas" : "Stablecoin held in your wallet"}</small></span><b>{assetEquivalent(option, balances?.[option])}</b></label>)}
          <label className={source === "RESALE" ? "iv-selected-option" : ""}><input type="radio" name="withdraw-source" checked={source === "RESALE"} onChange={() => { setSource("RESALE"); setError(""); }} /><span><strong>Sell shares</strong><small>Offer fractions to a buyer on the marketplace</small></span><b>Market price</b></label>
        </fieldset></> : null}
        {step === 1 ? <div className="iv-withdraw-step"><h2>How much would you like to withdraw?</h2><p className="iv-muted">Available: {units(available?.toString(), decimals(asset))} {assetLabel(asset)}</p><label className="iv-form-label" htmlFor="withdraw-amount">Amount in {assetLabel(asset)}</label><div className="iv-amount-field"><input id="withdraw-amount" inputMode="decimal" maxLength={80} value={amount} onChange={event => setAmount(event.target.value)} autoComplete="off" required /><span>{assetLabel(asset)}</span></div><p className="iv-muted">Keep enough reAED for the network fee. The balance and gas are checked again before approval.</p></div> : null}
        {step === 2 ? <div className="iv-withdraw-step"><h2>Where should we send it?</h2><p className="iv-muted">Enter the receiving wallet on INFRA testnet, chain 15324.</p><label className="iv-form-label" htmlFor="withdraw-recipient">Recipient INFRA address</label><input className="iv-input" id="withdraw-recipient" value={recipient} onChange={event => setRecipient(event.target.value)} maxLength={42} placeholder="0x…" autoComplete="off" required /><p className="iv-muted">Check the complete address. Confirmed transfers cannot be reversed by the platform.</p></div> : null}
        {step === 3 ? <div className="iv-withdraw-step"><h2>Review your withdrawal</h2><dl className="iv-exact-summary"><div><dt>Asset</dt><dd>{assetLabel(asset)}</dd></div><div><dt>Amount</dt><dd>{units(enteredAmount, decimals(asset))} {assetLabel(asset)}</dd></div><div><dt>Recipient</dt><dd>{recipient}</dd></div><div><dt>Network</dt><dd>INFRA testnet · 15324</dd></div></dl><p className="iv-muted">Review the exact amount, recipient and network fee before requesting approval. This screen does not move funds.</p></div> : null}
        {error ? <p className="iv-form-error" role="alert">{error}</p> : null}
        <div className="iv-form-actions">{step > 0 ? <button type="button" className="iv-button" onClick={() => { setStep(step - 1); setError(""); }}>Back</button> : null}{source === "RESALE" ? <Link className="iv-button iv-primary" href="/invest/marketplace">Go to marketplace</Link> : <button className="iv-button iv-primary" disabled={!balances}>{step === 3 ? "Review transfer" : "Continue"}</button>}</div>
      </form>
    </Panel><Panel title="Summary" className="iv-withdraw-summary"><dl>
      <div><dt>From</dt><dd>{source === "RESALE" ? "Share resale" : `${assetLabel(asset)} balance`}</dd></div>
      <div><dt>To</dt><dd>{source === "RESALE" ? "Marketplace buyer" : recipient ? shortAddress(recipient) : "Choose INFRA address"}</dd></div>
      <div><dt>Amount</dt><dd>{source === "RESALE" || !enteredAmount ? "—" : `${units(enteredAmount, decimals(asset))} ${assetLabel(asset)}`}</dd></div>
      <div><dt>Network fee</dt><dd>At transaction review</dd></div>
      <div className="iv-summary-total"><dt>Recipient receives</dt><dd>{source === "RESALE" ? "Buyer-dependent" : enteredAmount ? assetEquivalent(asset, BigInt(enteredAmount)) : "—"}</dd></div>
      <div><dt>Arrival</dt><dd>After confirmation</dd></div>
    </dl><p>{source === "RESALE" ? "Shares are offered to other investors. There is no automatic redemption or guaranteed buyer." : "The recipient receives the exact transfer amount. Network gas is paid separately in reAED; USD equivalents use 1 USDT = 3.6 reAED."}</p></Panel></div>
    {command ? <TransactionReview command={command} onClose={() => setCommand(null)} /> : null}
  </InvestorShell>;
}
