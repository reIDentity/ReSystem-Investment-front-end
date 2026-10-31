"use client";
import Image from "next/image";
import { useActionFeedback, useFeedbackMessage } from "../ActionFeedback";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { usePlatform, useResource } from "./PlatformProvider";
import { routeResources } from "@/lib/platform/read-ahead";
import { api } from "@/lib/platform/client";
import type { NotificationPage } from "@/lib/platform/api.generated";
import type { HistoryCoverage } from "@/lib/platform/types";
export function Asset({ name, width, height = width, className = "", alt = "", responsive = false }: { name: string; width: number; height?: number; className?: string; alt?: string; responsive?: boolean }) {
  return <Image src={`/images/invest/${name}.svg`} width={width} height={height} alt={alt} className={className} style={responsive ? { height: "auto" } : undefined} />;
}
export function InvestorLogo({ light = false }: { light?: boolean }) { return <Logo tone={light ? "light" : "dark"} className="iv-logo" />; }
export function notificationPath(href: string) {
  const transaction = href.match(/^\/transactions\/([a-zA-Z0-9_-]+)$/); if (transaction) return `/invest/activity?intent=${transaction[1]}`;
  const support = href.match(/^\/support\/([a-zA-Z0-9_-]+)$/); if (support) return `/invest/support?ticket=${support[1]}`;
  const project = href.match(/^\/projects\/([a-zA-Z0-9_-]+)$/); if (project) return `/invest/products/${project[1]}`;
  return "/invest/activity";
}
export function InvestorShell({ title, subtitle, children, page = "", networkBlock }: { title: string; subtitle: string; children: ReactNode; page?: string; liveData?: boolean; networkBlock?: number | string | null }) {
  const path = usePathname(); const router = useRouter(); const platform = usePlatform();
  const [account, setAccount] = useState(false); const [notifications, setNotifications] = useState(false);
  const updates = useResource<NotificationPage>("notifications", 60000);
  const accountArea = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!account && !notifications) return;
    const dismissOutside = (event: PointerEvent) => { if (!accountArea.current?.contains(event.target as Node)) { setAccount(false); setNotifications(false); } };
    const dismissWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setAccount(false); setNotifications(false);
      accountArea.current?.querySelector<HTMLButtonElement>(notifications ? ".iv-notification" : ".iv-account")?.focus();
    };
    document.addEventListener("pointerdown", dismissOutside); document.addEventListener("keydown", dismissWithEscape);
    return () => { document.removeEventListener("pointerdown", dismissOutside); document.removeEventListener("keydown", dismissWithEscape); };
  }, [account, notifications]);
  function warmLink(target: EventTarget | null) {
    const anchor = (target as Element | null)?.closest?.("a[href]");
    if (!anchor) return;
    try {
      const url = new URL(anchor.getAttribute("href") || "", window.location.href);
      if (url.origin === window.location.origin) platform.prefetch?.(routeResources(url.pathname + url.search));
    } catch { /* A malformed link cannot interrupt navigation or the current view. */ }
  }
  const initials = platform.user.name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();
  const nav = [["Home", "home"], ["Explore", "explore"], ["My earnings", "earnings"], ["Wallet", "wallet"], ["Activity", "activity"], ["Support", "support"]];
  const active = path.includes("/products/") ? "explore" : ["deposit", "withdraw", "marketplace"].includes(page) ? "wallet" : page;
  async function logout() { try { if (platform.live) { await api("auth/logout", { method: "POST" }); router.replace("/invest"); router.refresh(); } else { const form = document.createElement("form"); form.method = "post"; form.action = "/api/auth/reid/logout"; document.body.append(form); form.submit(); } } catch { platform.notify("Sign out could not be confirmed. Please retry."); } }
  return <div className={`investor-app iv-${page}`} onPointerOver={event => warmLink(event.target)} onFocusCapture={event => warmLink(event.target)}><div className="iv-frame">
    <header className="iv-header"><Link href="/invest/home" aria-label="reSystem Investment dashboard"><InvestorLogo /></Link><nav aria-label="Investor navigation">{nav.map(([label, slug]) => <Link key={slug} href={`/invest/${slug}`} prefetch={true} aria-current={active === slug ? "page" : undefined}>{label}</Link>)}</nav><div className="iv-account-area" ref={accountArea}>
      <button className="iv-notification" aria-label="Notifications" aria-expanded={notifications} onClick={() => { setNotifications(!notifications); setAccount(false); }}><Asset name="5bcd1" width={18} />{updates.data?.items.some(n => !n.readAt) ? <i /> : null}</button>
      <button className="iv-account" aria-expanded={account} onClick={() => { setAccount(!account); setNotifications(false); }}><span className="iv-avatar">{initials}</span><span><strong>{platform.user.name}</strong><small><Asset name="4489b" width={12} />Connected with reID</small></span><Asset name="6b211" width={14} /></button>
      {account ? <div className="iv-popover"><strong>{platform.user.name}</strong><p>INFRA testnet/UAT</p><p className="iv-connected-wallet">{platform.user.wallet}</p><p>Verification: {platform.user.kycStatus === "not_requested" ? "Not requested" : platform.user.kycStatus}</p><Link href="/invest/marketplace" onClick={() => setAccount(false)}>Resale marketplace</Link><button className="iv-button iv-primary iv-full" onClick={() => void logout()}>Sign out</button><Link href="/">Back to website</Link></div> : null}
      {notifications ? <div className="iv-popover"><strong>Notifications</strong>{updates.error ? <p>Notifications are unavailable.</p> : !updates.data ? <p>{platform.live ? "Loading updates…" : "Platform service is not configured."}</p> : updates.data.items.length === 0 ? <p>No updates yet.</p> : updates.data.items.slice(0, 5).map(n => <div className="iv-notice-row" key={n.id}><Link href={notificationPath(n.href)} onClick={() => setNotifications(false)}>{n.title}</Link><small>{n.body}</small>{!n.readAt ? <button className="iv-text-link" onClick={async () => { try { await api(`notifications/${n.id}/read`, { method: "PATCH" }); platform.notify("Notification marked as read.", { kind: "success" }); await updates.mutate(api<NonNullable<typeof updates.data>>("notifications"), { revalidate: false, throwOnError: true }).catch(() => platform.notify("The notification was marked as read. Refresh to see its updated status.")); } catch { platform.notify("Could not mark the notification as read."); } }}>Mark read</button> : null}</div>)}<Link href="/invest/notifications" onClick={() => setNotifications(false)}>View all notifications →</Link></div> : null}
    </div></header>
    <div className="iv-page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="iv-heading-actions"><span className={`iv-network ${!networkBlock ? "iv-network-unavailable" : ""}`}><i />{networkBlock ? `INFRA block ${typeof networkBlock === "number" ? networkBlock.toLocaleString("en-US") : networkBlock.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` : "INFRA · Chain 15324"}</span><Link className="iv-button" href="/invest/deposit"><Asset name="4b50f" width={16} />Deposit</Link><Link className="iv-button iv-primary" href="/invest/explore"><Asset name="cf794" width={16} />Buy shares</Link></div></div>
    {!platform.live ? <div className="iv-service-banner" role="status">Read-only reID connection. The platform backend is not configured. Financial data and actions are unavailable; the deposit page still reads actual INFRA history.</div> : null}
    <main className="iv-content">{children}</main>
  </div></div>;
}
export function Panel({ children, className = "", title, subtitle }: { children: ReactNode; className?: string; title?: string; subtitle?: string }) { return <section className={`iv-panel ${className}`}>{title ? <h2>{title}</h2> : null}{subtitle ? <p className="iv-muted iv-panel-subtitle">{subtitle}</p> : null}{children}</section>; }
export function Tag({ children, tone = "green" }: { children: ReactNode; tone?: string }) { return <span className={`iv-tag iv-tag-${tone}`}>{children}</span>; }
export function Initials({ name, tone = "blue" }: { name: string; tone?: string }) { return <span className={`iv-initials iv-initials-${tone}`}>{name}</span>; }
export function CopyButton({ value, children = "Copy address" }: { value: string; children?: ReactNode }) {
  const [copied, setCopied] = useState<string | null>(null); const { notify } = usePlatform();
  const pending = useRef(false);
  useEffect(() => { if (!copied) return; const timer = setTimeout(() => setCopied(null), 2500); return () => clearTimeout(timer); }, [copied]);
  return <button type="button" className="iv-button iv-small" aria-live="polite" onClick={async () => {
    if (pending.current) return;
    pending.current = true;
    try { await window.navigator.clipboard.writeText(value); setCopied(value); notify("Address copied to clipboard.", { kind: "success" }); }
    catch { setCopied(null); notify("Clipboard access is unavailable. Select and copy the address shown."); }
    finally { pending.current = false; }
  }}>{copied === value ? "Copied ✓" : children}</button>;
}
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null); const id = useId(); const { registerDialog } = useActionFeedback();
  useEffect(() => { const dialog = ref.current; if (!dialog) return; dialog.showModal(); const release = registerDialog(dialog); return () => { release(); dialog.close(); }; }, [registerDialog]);
  return <dialog ref={ref} className="iv-modal" onCancel={onClose} aria-labelledby={id} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="iv-modal-heading"><h2 id={id}>{title}</h2><button onClick={onClose} aria-label="Close dialog">×</button></div>{children}</dialog>;
}
export function DataState({ loading, error, empty, onRetry, children }: { loading?: boolean; error?: unknown; empty?: boolean; onRetry?: () => void; children?: ReactNode }) {
  const { live } = usePlatform();
  const { available: feedbackAvailable } = useActionFeedback();
  useFeedbackMessage(live && error ? error instanceof Error ? error.message : "Data is temporarily unavailable." : "");
  if (!live) return <p className="iv-empty">Connect the platform service to load verified financial data.</p>;
  if (error) return <div className="iv-form-error" role={feedbackAvailable ? undefined : "alert"}><p>{error instanceof Error ? error.message : "Data is temporarily unavailable."}</p><div className="iv-action-row">{onRetry ? <button className="iv-button iv-small" onClick={onRetry}>Retry</button> : null}<Link href="/api/auth/reid/start">Reconnect with reID</Link></div></div>;
  if (loading) return <div className="iv-loading-state" role="status"><span className="iv-skeleton" />Loading verified data…</div>;
  if (empty) return <p className="iv-empty">{children || "No records yet."}</p>;
  return null;
}
export function Provenance({ source, block, updated, coverage }: { source?: string; block?: string; updated?: string; coverage?: HistoryCoverage }) { return <div className="iv-provenance"><p>{source || (block ? "Confirmed INFRA data" : "Awaiting data provenance")}{block ? ` · Block ${block}` : ""}{updated ? ` · Updated ${new Date(updated).toLocaleString()}` : ""}</p>{coverage && coverage.status !== "complete" ? <p role="status">{coverage.status === "pending" ? "History is still being indexed. Earlier activity may not be visible yet." : "History coverage is partial. Some earlier activity may not be visible yet."}</p> : null}</div>; }
