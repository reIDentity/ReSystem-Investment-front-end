"use client";

import Link from "next/link";
import { useState } from "react";
import { products } from "@/data/products";
import { useDemo } from "./DemoProvider";
import { Asset, CopyButton, Initials, InvestorShell, Modal, Panel, Tag, usd } from "./InvestorUI";

const demoAddress = "0x4e58b3727b290d24e0a1e037431fd5ddca3a80a6";

export function InvestorWallet() {
  const demo = useDemo();
  const claimable = demo.holdings.reduce((sum,h) => sum+h.claimable,0);
  const wallet = demo.balances.reAED / 3.6725 + demo.balances.USDT;
  return <InvestorShell page="wallet" title="Wallet" subtitle="Balances and share tokens held on INFRA">
    <div className="iv-wallet-top"><Panel className="iv-total-balance"><p>Total balance</p><strong>{usd(wallet)}</strong><div><span>0x7a3E…c91F</span><CopyButton value={demoAddress} /></div></Panel><Panel title="Quick actions" className="iv-quick-actions"><Link href="/invest/deposit"><Initials name="↓" />Deposit funds</Link><Link href={`/invest/products/${demo.selectedProduct}#invest`}><Initials name="+" />Buy shares</Link><button onClick={() => demo.claim()} disabled={claimable<=0}><Initials name="$" tone="dark" />Claim {usd(claimable)}</button><Link href="/invest/withdraw"><Initials name="↑" tone="neutral" />Withdraw</Link></Panel></div>
    <Panel title="Assets"><div className="iv-table-scroll"><table className="iv-table iv-assets-table"><thead><tr><th>Asset</th><th>Type</th><th>Balance</th><th>Value</th></tr></thead><tbody><tr><td><Initials name="AE" />reAED</td><td>Stablecoin</td><td>{demo.balances.reAED.toLocaleString(undefined,{maximumFractionDigits:2})}</td><td>{usd(demo.balances.reAED / 3.6725)}</td></tr><tr><td><Initials name="US" tone="green" />USDT</td><td>Stablecoin</td><td>{demo.balances.USDT.toLocaleString(undefined,{minimumFractionDigits:2})}</td><td>{usd(demo.balances.USDT)}</td></tr>{demo.holdings.map(h => <tr key={h.id}><td><Initials name={h.id === "fractionaire" ? "FR" : h.id === "reid" ? "ID" : "RE"} tone={h.id === "fractionaire" ? "orange" : h.id === "reid" ? "purple" : "blue"} />{products.find(p=>p.id===h.id)?.name} shares</td><td>Product shares</td><td>{h.shares}</td><td>{usd(h.invested)}</td></tr>)}</tbody></table></div></Panel>
  </InvestorShell>;
}

export function InvestorDeposit() {
  const demo = useDemo();
  const [method, setMethod] = useState("reAED");
  const [amount, setAmount] = useState("1000");
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const asset = method === "USDT" ? "USDT" : "reAED";
  const valid = Number.isFinite(Number(amount)) && Number(amount)>0;
  return <InvestorShell page="deposit" title="Deposit" subtitle="Add reAED, USDT, a bank transfer or a card payment to your wallet">
    <div className="iv-main-sidebar"><Panel className="iv-deposit-form" title="How would you like to add funds?"><fieldset className="iv-deposit-methods"><legend className="sr-only">Deposit method</legend>{[["reAED","Instant on INFRA"],["USDT","Instant on INFRA"],["Bank transfer","AED, 1–2 business days"],["Card","Visa ending 4417"]].map(([label,note]) => <label className={method === label ? "iv-selected-option" : ""} key={label}><input type="radio" name="deposit-method" value={label} checked={method===label} onChange={()=>{setMethod(label);setDone(false);}} /><span><strong>{label}</strong><small>{note}</small></span></label>)}</fieldset>
      <label className="iv-form-label" htmlFor="deposit-amount">Amount</label><div className="iv-amount-field"><input id="deposit-amount" type="number" min="0.01" step="0.01" value={amount} onChange={e=>{setAmount(e.target.value);setDone(false);}} /><span>{asset}</span></div><div className="iv-presets">{[1000,5000,10000,25000].map(value=><button key={value} aria-pressed={Number(amount)===value} onClick={()=>{setAmount(String(value));setDone(false);}}>{value.toLocaleString()}</button>)}</div>
      {method === "reAED" || method === "USDT" ? <div className="iv-deposit-address"><div className="iv-qr"><Asset name="5e079" width={124} /></div><div><p>Send {asset} on INFRA to</p><code>{demoAddress}</code><div><CopyButton value={demoAddress} /><Tag tone="amber">INFRA network only</Tag></div><small>Reference QR and address · Demo only. Do not send funds.</small></div></div> : method === "Bank transfer" ? <div className="iv-deposit-details"><strong>Bank transfer details</strong><dl><div><dt>Beneficiary</dt><dd>reSystem Investment · Demo</dd></div><div><dt>Reference</dt><dd>RS-MK-2214</dd></div><div><dt>Currency</dt><dd>AED</dd></div></dl><p>This is a demo preview. Bank details will be supplied when live deposits are connected.</p></div> : <div className="iv-deposit-details"><strong>Card payment preview</strong><p>Visa •••• 4417 · Sample card</p><p>No card details or payments are collected in this demo.</p></div>}
      <button className="iv-button iv-primary iv-full" disabled={!valid || done} onClick={()=>setConfirm(true)}>{done ? "Demo deposit added ✓" : method === "Card" ? `Add ${Number(amount).toLocaleString()} ${asset}` : `I’ve sent ${Number(amount).toLocaleString()} ${asset}`}</button>
    </Panel><Panel title="Recent deposits" className="iv-recent-deposits">{demo.transactions.filter(t=>t.kind==="Deposits").slice(0,4).map(t=><div className="iv-recent-row" key={t.id}><Initials name="↓" /><div><strong>{t.title}</strong><small>{t.date}</small></div><span><strong>{usd(t.amount)}</strong><Tag>Completed</Tag></span></div>)}</Panel></div>
    {confirm && <Modal title="Simulate deposit" onClose={()=>setConfirm(false)}><p>Add {Number(amount).toLocaleString()} {asset} to your demo wallet? No payment will be made.</p><button className="iv-button iv-primary iv-full" onClick={()=>{demo.deposit(Number(amount),asset,method);setConfirm(false);setDone(true);}}>Simulate deposit</button></Modal>}
  </InvestorShell>;
}

export function InvestorWithdraw() {
  const demo = useDemo();
  const [step, setStep] = useState(0);
  const [source, setSource] = useState("reAED balance");
  const [amount, setAmount] = useState("250");
  const [destination, setDestination] = useState("reID wallet on INFRA");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const shareValue=demo.holdings.reduce((s,h)=>s+h.invested,0);
  const available=source==="Sell shares"?shareValue:source==="USDT balance"?demo.balances.USDT:demo.balances.reAED/3.6725;
  function next() {
    setError("");
    if(step===1 && (!Number.isFinite(Number(amount)) || Number(amount)<=.1 || Number(amount)>available || (source==="Sell shares" && !Number.isInteger(Number(amount)/100)))) return setError(source==="Sell shares"?"Choose a multiple of $100 within your share balance.":"Enter an amount above $0.10 and within your available balance.");
    if(step===2) {
      if(destination==="Another INFRA address" && !/^0x[0-9a-fA-F]{40}$/.test(address)) return setError("Enter a valid INFRA address: 0x followed by 40 hexadecimal characters.");
      return setConfirm(true);
    }
    setStep(step+1);
  }
  return <InvestorShell page="withdraw" title="Withdraw" subtitle="No lock period. Take out your balance or sell shares at any time."><div className="iv-main-sidebar"><Panel className="iv-withdraw-form"><ol className="iv-stepper">{["Source","Amount","Destination","Done"].map((label,i)=><li key={label} aria-current={step===i?"step":undefined}><span>{i+1}</span>{label}</li>)}</ol>
    {step===0 && <><h2>What would you like to withdraw?</h2><fieldset className="iv-withdraw-sources"><legend className="sr-only">Withdrawal source</legend>{[["reAED balance","Includes claimed earnings",demo.balances.reAED/3.6725],["USDT balance","Stablecoin held in your wallet",demo.balances.USDT],["Sell shares","Return shares to the pool at $100 each",shareValue]].map(([label,note,value])=><label className={source===label?"iv-selected-option":""} key={label}><input type="radio" name="withdraw-source" checked={source===label} onChange={()=>setSource(String(label))} /><span><strong>{label}</strong><small>{note}</small></span><b>{usd(Number(value))}</b></label>)}</fieldset></>}
    {step===1 && <><h2>How much would you like to withdraw?</h2><p className="iv-muted">Available: {usd(available)}</p><label className="iv-form-label" htmlFor="withdraw-amount">Amount in USD</label><div className="iv-amount-field"><input id="withdraw-amount" type="number" min="0.11" step={source==="Sell shares"?100:.01} value={amount} onChange={e=>setAmount(e.target.value)} /><button onClick={()=>setAmount(String(source==="Sell shares"?Math.floor(available/100)*100:Number(available.toFixed(2))))}>Max</button></div></>}
    {step===2 && <><h2>Where should we send it?</h2><fieldset className="iv-withdraw-sources"><legend className="sr-only">Destination</legend>{["reID wallet on INFRA","Another INFRA address"].map(value=><label key={value} className={destination===value?"iv-selected-option":""}><input type="radio" name="destination" checked={destination===value} onChange={()=>setDestination(value)} /><span>{value}</span></label>)}</fieldset>{destination==="Another INFRA address" && <label className="iv-form-label">INFRA address<input className="iv-input" value={address} onChange={e=>setAddress(e.target.value)} placeholder="0x…" /></label>}<p className="iv-muted">This is a simulated withdrawal. No funds leave the demo.</p></>}
    {step===3 && <div className="iv-done"><span>✓</span><h2>Demo withdrawal complete</h2><p>{usd(Number(amount)-.1)} simulated to {destination.toLowerCase()}.</p><Link className="iv-button iv-primary" href="/invest/wallet">Back to wallet</Link><Link className="iv-text-link" href="/invest/activity">View activity →</Link></div>}
    {error && <p className="iv-form-error" role="alert">{error}</p>}{step<3 && <div className="iv-form-actions">{step>0 && <button className="iv-button" onClick={()=>{setStep(step-1);setError("");}}>Back</button>}<button className="iv-button iv-primary" onClick={next}>{step===2?"Review withdrawal":"Continue"}</button></div>}
    </Panel><Panel title="Summary" className="iv-withdraw-summary"><dl><div><dt>From</dt><dd>{source}</dd></div><div><dt>To</dt><dd>{destination}</dd></div><div><dt>Amount</dt><dd>{usd(Number(amount)||0)}</dd></div><div><dt>Fee</dt><dd>$0.10</dd></div><div className="iv-summary-total"><dt>You receive</dt><dd>{usd(Math.max(0,(Number(amount)||0)-.1))}</dd></div><div><dt>Arrival</dt><dd>Within a few seconds</dd></div></dl><p>Selling shares returns them to the product’s pool at $100 each. Earnings you’ve already claimed stay in your wallet.</p></Panel></div>
    {confirm && <Modal title="Simulate withdrawal" onClose={()=>setConfirm(false)}><p>Preview withdrawing {usd(Number(amount))} from {source.toLowerCase()}. This only changes demo balances.</p><button className="iv-button iv-primary iv-full" onClick={()=>{if(demo.withdraw(Number(amount),source,destination==="Another INFRA address"?address:destination)){setStep(3);setConfirm(false);}else{setError("This withdrawal exceeds your current balance.");setConfirm(false);}}}>Simulate withdrawal</button></Modal>}
  </InvestorShell>;
}
