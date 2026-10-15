"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDemo } from "./DemoProvider";

export function Asset({ name, width, height = width, className = "", alt = "", responsive = false }: { name: string; width: number; height?: number; className?: string; alt?: string; responsive?: boolean }) {
  return <Image src={`/images/invest/${name}.svg`} width={width} height={height} alt={alt} className={className} style={responsive ? { height: "auto" } : undefined} />;
}
export function InvestorLogo({ light = false, mark = "cf67d" }: { light?: boolean; mark?: string }) {
  return <span className={`iv-logo ${light ? "iv-logo-light" : ""}`}>
    <span className="iv-logo-symbol"><Asset name={light ? "7aff3" : mark} width={light ? 24.094 : 12.59} height={light ? 24.09 : 12.588} /></span>
    <span className="iv-wordmark"><Asset name={light ? "758cb" : "c31d0"} width={light ? 29.353 : 23.2358} height={light ? 19.57 : 15.4915} /><span>System Investment</span></span>
  </span>;
}
export function InvestorShell({ title, subtitle, children, page = "" }: { title: string; subtitle: string; children: ReactNode; page?: string }) {
  const path = usePathname();
  const demo = useDemo();
  const [account, setAccount] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const nav = [["Home", "home"], ["Explore", "explore"], ["My earnings", "earnings"], ["Wallet", "wallet"], ["Activity", "activity"], ["Support", "support"]];
  const active = path.includes("/products/") ? "explore" : ["deposit", "withdraw"].includes(page) ? "wallet" : page;
  const mark = page === "home" ? "fe9e8" : page === "activity" ? "22520" : page === "support" ? "0588a" : ["deposit", "withdraw"].includes(page) ? "d451c" : "cf67d";
  return <div className={`investor-app iv-${page}`}>
    <div className="iv-frame">
      <header className="iv-header">
        <Link href="/invest/home" aria-label="reSystem Investment dashboard"><InvestorLogo mark={mark} /></Link>
        <nav aria-label="Investor navigation">{nav.map(([label, slug]) => <Link key={slug} href={`/invest/${slug}`} aria-current={active === slug ? "page" : undefined}>{label}</Link>)}</nav>
        <div className="iv-account-area">
          <button className="iv-notification" aria-label="Notifications" aria-expanded={notifications} onClick={() => { setNotifications(!notifications); setAccount(false); }}><Asset name="5bcd1" width={18} /><i /></button>
          <button className="iv-account" aria-expanded={account} onClick={() => { setAccount(!account); setNotifications(false); }}><span className="iv-avatar">MK</span><span><strong>Manoj K.</strong><small><Asset name="4489b" width={12} /> Demo account</small></span><Asset name="6b211" width={14} /></button>
          {account && <div className="iv-popover"><strong>Manoj K. · Demo account</strong><p>Explore the investor app using sample data.</p><Link href="/invest">Back to sign in</Link><Link href="/">Back to website</Link></div>}
          {notifications && <div className="iv-popover"><strong>Notifications</strong><p>Your sample earnings are available to claim.</p><Link href="/invest/earnings" onClick={() => setNotifications(false)}>View my earnings →</Link></div>}
        </div>
      </header>
      <div className="iv-page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="iv-heading-actions"><span className="iv-network"><i />INFRA block 4,812,330</span><Link className="iv-button" href="/invest/deposit"><Asset name="4b50f" width={16} />Deposit</Link><Link className="iv-button iv-primary" onClick={page === "product" ? () => window.document.getElementById("invest")?.scrollIntoView({ block: "start", behavior: "instant" }) : undefined} href={`${page === "product" ? path : `/invest/products/${demo.selectedProduct}`}#invest`}><Asset name="cf794" width={16} />Buy shares</Link></div></div>
      <main className="iv-content">{children}</main>
      <p className="iv-demo-note">Demo preview · Sample balances and simulated transactions. No real funds or wallet connection.</p>
    </div>
    {demo.notice && <div className="iv-toast" role="status"><span>{demo.notice}</span><button aria-label="Dismiss notification" onClick={() => demo.notify("")}>×</button></div>}
  </div>;
}

export function Panel({ children, className = "", title, subtitle }: { children: ReactNode; className?: string; title?: string; subtitle?: string }) {
  return <section className={`iv-panel ${className}`}>{title && <h2>{title}</h2>}{subtitle && <p className="iv-muted iv-panel-subtitle">{subtitle}</p>}{children}</section>;
}
export function Tag({ children, tone = "green" }: { children: ReactNode; tone?: string }) { return <span className={`iv-tag iv-tag-${tone}`}>{children}</span>; }
export function Initials({ name, tone = "blue" }: { name: string; tone?: string }) { return <span className={`iv-initials iv-initials-${tone}`}>{name}</span>; }
export const usd = (n: number, digits = 2) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

export function CopyButton({ value, children = "Copy address" }: { value: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const { notify } = useDemo();
  return <button className="iv-button iv-small" onClick={async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const input = document.createElement("textarea"); input.value = value; input.style.position = "fixed"; input.style.opacity = "0"; document.body.append(input); input.select();
        const success = document.execCommand("copy"); input.remove(); if (!success) throw new Error("Clipboard unavailable");
      }
      setCopied(true);
    } catch { notify(`Copy this demo address: ${value}`); }
  }}>{copied ? "Copied ✓" : children}</button>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="iv-modal" onCancel={onClose} aria-labelledby="iv-dialog-title" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="iv-modal-heading"><h2 id="iv-dialog-title">{title}</h2><button onClick={onClose} aria-label="Close dialog">×</button></div>{children}</dialog>;
}

export function BarChart({ values, labels, active = 5, money = false, precision = 0 }: { values: number[]; labels: string[]; active?: number; money?: boolean; precision?: number }) {
  const [hover, setHover] = useState(active);
  const maximum = Math.max(...values) * 1.1;
  return <div className="iv-chart" role="img" aria-label={labels.map((label, i) => `${label}: ${money ? usd(values[i]) : values[i]}`).join(", ")}>
    <div className="iv-chart-axis">{[10, 8, 6, 4, 2, 0].map(v => <span key={v}>{money ? `${Math.round(maximum * v / 10).toLocaleString()}` : `${v}k`}</span>)}</div>
    <div className="iv-bars">{values.map((value, i) => <div className="iv-bar-column" key={labels[i]}><button type="button" className={`iv-bar ${i === active ? "iv-bar-current" : ""} ${i > active ? "iv-bar-projected" : ""}`} style={{ height: `${value / maximum * 100}%` }} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} aria-label={`${labels[i]}: ${usd(value, precision)}`}><span className="iv-bar-fill" />{i === hover && <span className="iv-chart-tooltip"><strong>{labels[i] === "Oct" ? "October 2026" : labels[i]}</strong><span>{money ? "Revenue" : "Value"} <b>{usd(value, precision)}</b></span>{!money && <span>Earnings <b>$13.79</b></span>}</span>}</button><span className="iv-bar-label">{labels[i]}</span></div>)}</div>
  </div>;
}
