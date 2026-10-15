"use client";

import { useState } from "react";
import { products } from "@/data/products";
import { useDemo } from "./DemoProvider";
import { Asset, BarChart, CopyButton, Initials, InvestorShell, Panel, Tag, usd } from "./InvestorUI";

const wallet = "0xcaa62d28c74db2a33bb936b71cde214d649e4c";
const holders = [
  ["1B","0x1b98…facc","5,197",15.70,906.10], ["1C","0x1c98…4d3f","3,807",11.50,663.75],
  ["1D","0x1d98…57c6","2,416",7.30,421.23], ["1E","0x1e99…6231","1,490",4.50,259.78],
  ["1F","0x1f99…23a8","894",2.70,155.87],
] as const;

export function InvestorEarnings() {
  const demo = useDemo();
  const [chartMode, setChartMode] = useState("Revenue");
  const product = products.find(p => p.id === demo.selectedProduct) ?? products[5];
  const holding = demo.holdings.find(h => h.id === product.id);
  const daily = product.revenue ? product.revenue / 30 : 0;
  const today = product.id === "fractionaire" ? 353.06 : daily * .53;
  const monthPool = product.id === "fractionaire" ? 5771 : (product.revenue ?? 0) * .29;
  const sharesSold = product.id === "fractionaire" ? 33100 : Math.round(40000 * product.sold / 100);
  return <InvestorShell page="earnings" title="My earnings" subtitle="Live revenue from the products you own and your share of it">
    <div className="iv-product-tabs" role="tablist" aria-label="Earnings product">{products.map(p => <button key={p.id} role="tab" aria-selected={p.id === product.id} onClick={() => demo.selectProduct(p.id)}><i className={demo.holdings.some(h => h.id === p.id) ? "iv-live" : ""} />{p.name}</button>)}</div>
    <div className="iv-kpis iv-earnings-kpis">{[
      ["Revenue today",usd(today),"• Live",`Yesterday: ${usd(daily)}`],
      ["Revenue this month",usd(monthPool),"↑ 9.4%",`Last month: ${usd(product.revenue ?? 0,0)}`],
      ["Shares sold",sharesSold.toLocaleString(),`${product.sold}%`,"Of 40,000 total"],
      ["Earned per share",usd(monthPool / Math.max(1, sharesSold),4),"Live","This month so far"],
    ].map(([label,value,badge,note],i) => <section key={label} className={`iv-kpi ${i===0 ? "iv-kpi-primary" : ""}`}><span>{label}</span><Tag tone={i===0 || i===3 ? "green" : "neutral"}>{badge}</Tag><strong>{value}</strong><p>{note}</p></section>)}</div>
    <div className="iv-earnings-upper"><Panel className="iv-daily-chart" title="Daily revenue" subtitle={`Paid into the ${product.name} wallet, last 14 days`}><div className="iv-tabs iv-chart-tabs" role="tablist" aria-label="Revenue chart unit">{["Revenue","Per share"].map(mode => <button key={mode} role="tab" aria-selected={mode === chartMode} onClick={() => setChartMode(mode)}>{mode}</button>)}</div><BarChart active={13} money precision={chartMode==="Revenue"?2:4} values={[.69,.87,.90,.82,.8,.96,.92,.86,.9,.94,1.02,.95,.99,.6].map((v,i)=>{const revenue=i===13?today:v*daily;return chartMode==="Revenue"?revenue:revenue/Math.max(1,sharesSold);})} labels={["26","27","28","29","30","1","2","3","4","5","6","7","8","Today"]} /></Panel>
      <Panel className="iv-share-supply" title="Share supply"><Tag>Earning</Tag><div className="iv-supply-overview"><div className="iv-supply-ring"><Asset name="ce39e" width={170} /><span><strong>{product.sold}%</strong><small>sold</small></span></div><dl><div><dt><i />Sold</dt><dd>{sharesSold.toLocaleString()}</dd></div><div><dt><i />Available</dt><dd>{(40000-sharesSold).toLocaleString()}</dd></div><div><dt><i />Yours</dt><dd>{holding?.shares ?? 0}</dd></div></dl></div><div className="iv-wallet-address"><span>Product revenue wallet</span><div><code>0xcaa62d28c7…4d649e4c</code><CopyButton value={wallet}>Copy</CopyButton></div><button className="iv-text-link" onClick={() => demo.notify("This demo shows the Figma sample wallet. Live explorer details will be available with the INFRA connection.")}>View on INFRA explorer</button></div></Panel></div>
    <div className="iv-earnings-lower"><Panel title="Shareholder pool" subtitle={`Every dollar paid into the wallet is shared by holders in proportion to their shares. This month’s pool is ${usd(monthPool)}, or ${usd(monthPool / 33100,4)} per share.`}><div className="iv-table-scroll"><table className="iv-table iv-pool-table"><thead><tr><th>Holder</th><th>Shares</th><th>Share of pool</th><th>Earned this month</th></tr></thead><tbody>{holders.map(([initial,address,shares,percent,earned],i) => <tr key={address}><td><Initials name={initial} tone={["blue","orange","purple","cyan","red"][i]} />{address}</td><td>{shares}</td><td><span className="iv-pool-meter"><i style={{width:`${percent * 5}%`}} /></span>{percent.toFixed(2)}%</td><td>{usd(earned)}</td></tr>)}<tr className="iv-you-row"><td><Initials name="MK" />You, 0x7a3E…c91F</td><td>{holding?.shares ?? 0}</td><td><span className="iv-pool-meter"><i style={{width:"2%"}} /></span>{((holding?.shares ?? 0)/33100*100).toFixed(2)}%</td><td>{usd(holding?.claimable ?? 0)}</td></tr><tr><td><Initials name="+" tone="neutral" />551 other holders</td><td>19,271</td><td><span className="iv-pool-meter"><i style={{width:"90%"}} /></span>58.22%</td><td>$3,358.91</td></tr></tbody></table></div></Panel>
      <div className="iv-earnings-side"><Panel className="iv-claim-card"><span>Your share of {product.name}</span><strong>{usd(holding?.claimable ?? 0,4)}</strong><p>{holding?.shares ?? 0} shares. Claimed this month: $0.00</p><button className="iv-button iv-primary iv-full" disabled={!holding?.claimable} onClick={() => demo.claim(product.id)}>Claim to wallet</button></Panel><Panel title="Incoming payments" className="iv-incoming"><Tag>• Live</Tag><p className="iv-muted">Waiting for the next payment into the wallet.</p></Panel></div>
    </div>
  </InvestorShell>;
}
