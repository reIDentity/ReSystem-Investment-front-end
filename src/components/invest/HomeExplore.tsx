"use client";

import Link from "next/link";
import { useState } from "react";
import { categories, products } from "@/data/products";
import { useDemo } from "./DemoProvider";
import { Asset, BarChart, Initials, InvestorShell, Panel, Tag, usd } from "./InvestorUI";

export const productInitials = ["GL", "RE", "ID", "MA", "IN", "FR", "CE", "DO", "TT", "PH", "HO", "OS"];
export const remainingShares = [31600, 8750, 7200, 12700, 24400, 6900, 15200, 7400, 3800, 13900, 10700, 30000];

export function InvestorHome() {
  const demo = useDemo();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("claimable");
  const invested = demo.holdings.reduce((sum, h) => sum + h.invested, 0);
  const claimable = demo.holdings.reduce((sum, h) => sum + h.claimable, 0);
  const payouts = demo.transactions.filter(t => t.kind === "Payouts").reduce((s, t) => s + t.amount, 0);
  const wallet = demo.balances.reAED / 3.6725 + demo.balances.USDT;
  const holdings = demo.holdings.filter(h => products.find(p => p.id === h.id)?.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "invested" ? b.invested - a.invested : sort === "name" ? a.id.localeCompare(b.id) : b.claimable - a.claimable);
  const cash = [
    ["Payouts in", payouts, 1, "#0091ff"],
    ["Deposits in", demo.transactions.filter(t => t.kind === "Deposits").reduce((s, t) => s + t.amount, 0), 59, "#b9dfff"],
    ["Blocks bought", -demo.transactions.filter(t => t.kind === "Buys").reduce((s, t) => s + t.amount, 0), 100, "#0091ff"],
    ["Withdrawals", -demo.transactions.filter(t => t.kind === "Withdrawals").reduce((s, t) => s + t.amount, 0), 2, "#9edaff"],
  ] as const;
  return <InvestorShell page="home" title={`Welcome back, ${demo.user.name.split(/\s+/)[0]}`} subtitle="Here is how your sample investments are doing today">
    <div className="iv-kpis">{[
      ["Total invested", usd(invested, 0), "↑ 6.7% yield", `${demo.holdings.reduce((s,h) => s+h.shares,0)} shares in ${demo.holdings.length} products`, "078eb"],
      ["Available to claim", usd(claimable), "• Live", "Paid in reAED when you claim", "6d55c"],
      ["Total paid out", usd(payouts), "↑ 12.4%", "Since your first purchase in May", "fea92"],
      ["Wallet balance", usd(wallet), "Ready to invest", `${demo.balances.reAED.toLocaleString()} reAED and ${demo.balances.USDT.toLocaleString()} USDT`, "dfe8a"],
    ].map(([label, value, badge, note, icon], i) => <section className={`iv-kpi ${i === 0 ? "iv-kpi-primary" : ""}`} key={label}><span>{label}</span><div className="iv-kpi-icon"><Asset name={icon} width={20} /></div><div className="iv-kpi-value"><strong>{value}</strong><Tag tone={i === 1 ? "green" : "neutral"}>{badge}</Tag></div><p>{note}</p></section>)}</div>
    <Panel className="iv-cashflow"><div className="iv-cash-heading"><div><span className="iv-eyebrow">CASH FLOW · ALL TIME</span><h2>Inflow vs outflow</h2></div><div><small>IN</small><strong>{usd(payouts + Number(cash[1][1]))}</strong></div><div><small>OUT</small><strong>{usd(Number(cash[2][1]) + Number(cash[3][1]))}</strong></div><div><small>NET</small><strong>{usd(payouts + Number(cash[1][1]) - Number(cash[2][1]) - Number(cash[3][1]))}</strong></div></div><div className="iv-cash-bars">{cash.map(([label, value, width, color]) => <div key={label}><span><i style={{background:color}} />{label}</span><div><i style={{width:`${width}%`,background:color}} /></div><strong>{usd(value)}</strong></div>)}</div></Panel>
    <div className="iv-home-middle"><Panel title="Portfolio performance" subtitle="Value and earnings by month. Nov and Dec are projected." className="iv-portfolio-chart"><div className="iv-chart-legend"><span><i />Value</span><span><i />Projected</span></div><BarChart values={[5400,8700,9300,8200,9400,8674,10000,10600]} labels={["May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]} /></Panel>
      <Panel title="Recommended for you" subtitle="Products you don’t own yet, highest yield first." className="iv-recommended"><div>{[products[0], products[3], products[6], products[4]].map((p, i) => <Link href={`/invest/products/${p.id}`} key={p.id} onClick={() => demo.selectProduct(p.id)}><Initials name={["GL","MA","CE","IN"][i]} tone={i > 1 ? "orange" : "blue"} /><span><strong>{p.name}</strong><small>{["One network, every major currency.","Prebuilt white-label apps.","Blockchain-powered real estate.","Private wealth excellence."][i]}</small></span><b>{p.yieldPace?.toFixed(1)}%</b></Link>)}</div><Link className="iv-button iv-primary iv-full" href="/invest/explore">Explore all 12 products</Link><div className="iv-mini-stats"><div><small>Monthly revenue</small><strong>$96.4k <Tag tone="amber">+8.2%</Tag></strong></div><div><small>Live products</small><strong>5 of 12 <Tag tone="dark">+1</Tag></strong></div></div></Panel></div>
    <Panel className="iv-holdings"><div className="iv-panel-toolbar"><h2>Your holdings</h2><label className="iv-search"><Asset name="44e06" width={16} /><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Search holdings" /></label><label className="iv-sort"><Asset name="734ad" width={16} /><span className="sr-only">Sort holdings</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="claimable">Sort: claimable</option><option value="invested">Sort: invested</option><option value="name">Sort: name</option></select></label></div><div className="iv-holding-grid">{holdings.map(h => {
      const p = products.find(p => p.id === h.id)!;
      return <article key={h.id} className="iv-holding-card"><div className="iv-holding-title"><Initials name={productInitials[products.indexOf(p)]} tone={p.id === "fractionaire" ? "orange" : p.id === "reid" ? "purple" : "blue"} /><div><h3>{p.name}</h3><small>{p.category}</small></div><Tag>Earning</Tag></div><dl><div><dt>Shares</dt><dd>{h.shares}</dd></div><div><dt>Invested</dt><dd>{usd(h.invested,0)}</dd></div><div><dt>To claim</dt><dd className="iv-green">{usd(h.claimable)}</dd></div></dl><div className="iv-two-buttons"><Link href="/invest/earnings" onClick={() => demo.selectProduct(p.id)} className="iv-button iv-blue">My earnings</Link><Link href={`/invest/products/${p.id}#invest`} onClick={() => demo.selectProduct(p.id)} className="iv-button iv-primary">Buy more</Link></div></article>;
    })}{holdings.length === 0 && <p className="iv-empty">No holdings match your search.</p>}</div><div className="iv-claim-all"><span>Unclaimed earnings across all products: {usd(claimable)}</span><button className="iv-button iv-dark" disabled={claimable <= 0} onClick={() => demo.claim()}>Claim all</button></div></Panel>
  </InvestorShell>;
}

export function InvestorExplore() {
  const [category, setCategory] = useState("All");
  const demo = useDemo();
  return <InvestorShell page="explore" title="Explore products" subtitle="Pick a product to see what it does, how it earns and what you could get">
    <div className="iv-tabs iv-categories" role="tablist" aria-label="Product category">{categories.map(c => <button key={c} role="tab" aria-selected={c === category} onClick={() => setCategory(c)}>{c}</button>)}</div>
    <div className="iv-products">{products.filter(p => category === "All" || p.category === category).map(p => {
      const index = products.indexOf(p), owned = demo.holdings.find(h => h.id === p.id)?.shares;
      return <Link className={`iv-product-card ${p.id === demo.selectedProduct ? "iv-product-selected" : ""}`} key={p.id} href={`/invest/products/${p.id}`} onClick={() => demo.selectProduct(p.id)}><div className={`iv-product-placeholder ${["redomain","tunetailor","idos"].includes(p.id) ? "iv-placeholder-dark" : ""}`} aria-hidden="true">{owned ? <Tag tone="dark">You own {owned}</Tag> : p.status && <Tag tone={p.status === "Coming" ? "neutral" : "green"}>{p.status === "Coming" ? "Soon" : "Live"}</Tag>}<span /></div><h2>{p.name}</h2><small>{p.category}</small><p>{p.description}</p><div className="iv-product-supply"><span>{p.sold}% sold</span><span>{remainingShares[index].toLocaleString()} left</span></div><div className="iv-progress"><span style={{width:`${p.sold}%`}} /></div><div className="iv-product-revenue"><span>Revenue last month</span><strong>{p.revenue === null ? "Not launched" : usd(p.revenue,0)}</strong></div></Link>;
    })}</div>
  </InvestorShell>;
}
