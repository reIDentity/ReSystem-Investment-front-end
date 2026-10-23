"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Paperclip } from "lucide-react";
import type { TicketPage, TicketResponse, TransactionPage, TransactionResponse, NotificationPage, PreferenceDto, EmailNotificationsResponse, EmailPreferenceDto, ActivityPage } from "@/lib/platform/api.generated";
import type { ChainActivity, Page } from "@/lib/platform/types";
import { activityPath } from "@/lib/platform/read-ahead";
import { api } from "@/lib/platform/client";
import { messageId, privateAttachmentPath, readPrivateAttachments, validatePrivateImage, type PendingAttachment } from "@/lib/platform/support-attachments";
import { assetLabel, explorer, units } from "@/lib/platform/money";
import { usePlatform, useResource } from "./PlatformProvider";
import { DataState, Initials, InvestorShell, Modal, notificationPath, Panel, Provenance, Tag } from "./InvestorUI";
import { ActivityPagination } from "./platform/ActivityPagination";
import { IntentReview } from "./platform/Transaction";
import Link from "next/link";
import "./ActivitySupport.css";
function cursorPath(path: string, cursor: string | null) { return `${path}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`; }
function PageButtons({ cursor, next, change }: { cursor: string | null; next?: string | null; change: (cursor: string | null) => void }) { return <div className="iv-action-row">{cursor ? <button className="iv-button" onClick={() => change(null)}>First page</button> : null}{next ? <button className="iv-button iv-primary" onClick={() => change(next)}>Next page</button> : null}</div>; }
function activityAmount(row: ChainActivity) {
  if (row.type === "revenue_allocation" || row.event_name === "RevenueAllocation") return typeof row.amount_atomic === "string" && /^(0|[1-9][0-9]{0,81})$/.test(row.amount_atomic) && ["REAED", "reAED", "USDT"].includes(row.asset || "") ? `${units(row.amount_atomic, row.asset === "USDT" ? 6 : 18)} ${assetLabel(row.asset!)}` : "—";
  if (row.amount_atomic && row.asset) return `${units(row.amount_atomic, row.asset === "USDT" ? 6 : 18)} ${assetLabel(row.asset)}`;
  const value = row.args?.amount; const asset = String(row.args?.asset);
  if (typeof value === "string" && ["0", "1"].includes(asset)) return `${units(value, asset === "1" ? 6 : 18)} ${asset === "1" ? "USDT" : "reAED"}`;
  if (["TransferSingle", "Purchased", "ListingFilled"].includes(row.event_name || "")) { const quantity = row.args?.quantity || row.args?.value; if (typeof quantity === "string") return `${units(quantity, 0)} ${quantity === "1" ? "fraction" : "fractions"}`; }
  return "—";
}
const activityFilters = [["all", "All"], ["payouts", "Payouts"], ["buys", "Buys"], ["deposits", "Deposits"], ["withdrawals", "Withdrawals"]] as const;
function activityDescription(row: ChainActivity): { label: string; icon: string; tone: string } {
  if (row.type === "revenue_allocation" || row.event_name === "RevenueAllocation") return { label: "Revenue allocation", icon: "$", tone: "green" };
  if (row.type === "wallet_transfer") return row.direction === "incoming" ? { label: "Deposit received", icon: "↓", tone: "blue" } : { label: "Withdrawal to INFRA wallet", icon: "↑", tone: "orange" };
  if (row.event_name === "RewardClaimed") return { label: "Earnings claimed", icon: "$", tone: "green" };
  if (row.event_name === "Purchased") return { label: "Shares purchased", icon: "+", tone: "blue" };
  if (row.event_name === "ListingFilled") return { label: "Resale trade", icon: "↔", tone: "blue" };
  if (row.event_name === "TransferSingle") return { label: "Shares transferred", icon: "↔", tone: "purple" };
  if (row.event_name === "ProceedsWithdrawn") return { label: "Resale proceeds claimed", icon: "$", tone: "green" };
  return { label: (row.event_name || "Chain activity").replace(/([a-z])([A-Z])/g, "$1 $2"), icon: "·", tone: "neutral" };
}
export function InvestorActivity({ initialIntent, initialFilter = "all" }: { initialIntent?: string; initialFilter?: string }) {
  const { user, prefetch } = usePlatform();
  const { mutate: cachePage } = useSWRConfig();
  const [approvalsOpen, setApprovalsOpen] = useState(false);
  const [page, setPage] = useState<{ number: number; snapshotBlock?: string }>({ number: 1 });
  const [txCursor, setTxCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState(activityFilters.some(([value]) => value === initialFilter) ? initialFilter : "all");
  const [intent, setIntent] = useState<TransactionResponse | string | null>(initialIntent || null);
  const history = useResource<Page<ChainActivity> & Pick<ActivityPage, "pagination">>(activityPath(page.number, filter, page.snapshotBlock), 30000, { keepPreviousData: true });
  const transactions = useResource<TransactionPage>(cursorPath("transactions", txCursor), approvalsOpen ? 10000 : 0);
  const displayed = history.data?.pagination && history.data.pagination.filter !== filter ? undefined : history.data;
  const items = history.error ? [] : displayed?.items || [];
  const pagination = displayed?.pagination;
  const pagePending = Boolean(history.isLoading && (!pagination || pagination.page !== page.number || (page.snapshotBlock && pagination.snapshotBlock !== page.snapshotBlock)));
  const warmPage = (number: number) => { if (pagination) prefetch?.([activityPath(number, filter, pagination.snapshotBlock)]); };
  const currentPage = pagination?.page, totalPages = pagination?.totalPages, snapshotBlock = pagination?.snapshotBlock;
  useEffect(() => {
    // The first response already proves this exact confirmed boundary. Reuse
    // its equivalent anchored key so Previous does not fetch page one twice.
    if (displayed && pagination && !history.error && !page.snapshotBlock) {
      void cachePage([user.id, activityPath(pagination.page, filter, pagination.snapshotBlock)], displayed, { revalidate: false });
    }
  }, [cachePage, displayed, pagination, history.error, page.snapshotBlock, user.id, filter]);
  useEffect(() => {
    if (!currentPage || !totalPages || !snapshotBlock || history.error || pagePending) return;
    const adjacent = [currentPage + 1, currentPage - 1, currentPage + 2].filter(number => number >= 1 && number <= totalPages);
    prefetch?.(adjacent.map(number => activityPath(number, filter, snapshotBlock)));
  }, [prefetch, filter, currentPage, totalPages, snapshotBlock, history.error, pagePending]);
  return <InvestorShell page="activity" title="Activity" subtitle="Every purchase, payout, deposit and withdrawal, recorded on INFRA" networkBlock={history.data?.provenance?.indexedBlock}>
    <Panel className="iv-transactions iv-activity-restored">
      <div className="iv-panel-toolbar"><h2>Transactions</h2><div className="iv-tabs" role="group" aria-label="Filter activity">{activityFilters.map(([value, label]) => <button key={value} aria-pressed={filter === value} onPointerEnter={() => prefetch?.([activityPath(1, value)])} onFocus={() => prefetch?.([activityPath(1, value)])} onClick={() => { setFilter(value); setPage({ number: 1 }); }}>{label}</button>)}</div></div>
      <DataState loading={pagePending && !displayed} error={history.error} empty={Boolean(displayed && items.length === 0 && !pagePending)} onRetry={() => void history.mutate()}>No matching transactions yet.</DataState>
      <div className="iv-table-scroll"><table className="iv-table iv-activity-table" aria-busy={pagePending}><thead><tr><th>Activity</th><th>Product</th><th>Date</th><th>Transaction</th><th>Status</th><th>Amount</th><th><span className="sr-only">Help</span></th></tr></thead><tbody>{items.map(row => {
        const action = activityDescription(row);
        const project = row.project?.contractAddress || (typeof row.args?.project === "string" ? row.args.project : null);
        const projectTitle = typeof row.project?.title === "string" ? row.project.title.trim() : null;
        const projectLink = typeof row.project?.id === "string" && /^[a-zA-Z0-9_-]+$/.test(row.project.id) ? `/invest/products/${row.project.id}` : null;
        return <tr key={`${row.tx_hash}:${row.activity_index}`}><td><div className="iv-activity-label"><Initials name={action.icon} tone={action.tone} /><span>{action.label}<small>Block {row.block_number}</small></span></div></td><td>{row.type === "wallet_transfer" ? "Wallet" : projectTitle ? projectLink ? <Link className="iv-text-link" href={projectLink} title={project || undefined}>{projectTitle}</Link> : projectTitle : project ? <span title={project}>{project.slice(0, 6)}…{project.slice(-4)}</span> : "—"}</td><td><time dateTime={row.timestamp}>{new Date(row.timestamp).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</time></td><td>{explorer(row.tx_hash) ? <a className="iv-text-link" href={explorer(row.tx_hash)!} target="_blank" rel="noopener noreferrer">{row.tx_hash.slice(0, 6)}…{row.tx_hash.slice(-4)} ↗</a> : "Unavailable"}</td><td><Tag tone={["confirmed", "indexed", "completed"].includes(row.status.toLowerCase()) ? "green" : "neutral"}>{row.status.replaceAll("_", " ")}</Tag></td><td>{activityAmount(row)}</td><td><Link className="iv-button iv-small" href="/invest/support">Get help</Link></td></tr>;
      })}</tbody></table></div>
      {pagination && !history.error ? <ActivityPagination pagination={pagination} busy={pagePending} onIntent={warmPage} onPage={number => setPage({ number, snapshotBlock: pagination.snapshotBlock })} /> : null}
      <Provenance source={history.data?.provenance?.source} block={history.data?.provenance?.indexedBlock} updated={history.data?.provenance?.updatedAt} coverage={history.data?.provenance?.historyCoverage} />
    </Panel>
    <Panel className="iv-approval-history"><details onToggle={event => { const open = event.currentTarget.open; setApprovalsOpen(open); if (open) void transactions.mutate(); }}><summary>Transaction approvals {transactions.data ? `(${transactions.data.items.length}${transactions.data.nextCursor ? "+" : ""})` : ""}</summary><DataState loading={transactions.isLoading} error={transactions.error} empty={Boolean(transactions.data && transactions.data.items.length === 0)} onRetry={() => void transactions.mutate()}>No transaction requests yet.</DataState>{transactions.data?.items.map(tx => <div className="iv-record iv-record-with-action" key={tx.id}><div><strong>{String(tx.command.type).replaceAll("_", " ")}</strong><Tag tone={["FAILED", "REJECTED", "EXPIRED"].includes(tx.status) ? "amber" : "blue"}>{tx.status.replaceAll("_", " ")}</Tag></div><button className="iv-button iv-small" onClick={() => setIntent(tx)}>View progress</button></div>)}<PageButtons cursor={txCursor} next={transactions.data?.nextCursor} change={setTxCursor} /></details></Panel>
    {intent ? <IntentReview initial={typeof intent === "string" ? undefined : intent} id={typeof intent === "string" ? intent : undefined} onClose={() => setIntent(null)} /> : null}
  </InvestorShell>;
}
export function InvestorSupport({ initialTicket }: { initialTicket?: string }) {
  const { user, live, notify } = usePlatform(); const [cursor, setCursor] = useState<string | null>(null); const tickets = useResource<TicketPage>(cursorPath("support", cursor)); const [selected, setSelected] = useState(initialTicket || ""); const ticketId = selected || tickets.data?.items[0]?.id;
  const activeTicket = useRef<string | undefined>(ticketId); const requestPending = useRef(false);
  useEffect(() => { activeTicket.current = ticketId; return () => { activeTicket.current = undefined; }; }, [ticketId]);
  const attachments = useSWR(live && ticketId ? [user.id, `support/${ticketId}/attachments:all`] : null, () => readPrivateAttachments(ticketId!, api), { refreshInterval: 15000, shouldRetryOnError: false });
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null); const fileInput = useRef<HTMLInputElement>(null);
  const ticket = useResource<TicketResponse>(ticketId ? `support/${ticketId}` : null, 15000); const [create, setCreate] = useState(false); const [subject, setSubject] = useState(""); const [body, setBody] = useState(""); const [reply, setReply] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function newTicket(e: FormEvent) { e.preventDefault(); if (requestPending.current || subject.trim().length < 3 || body.trim().length < 5) return; requestPending.current = true; setBusy(true); setError(""); try { const result = await api<TicketResponse>("support", { method: "POST", body: { subject: subject.trim(), body: body.trim() } }); setSelected(result.id); setReply(""); setAttachment(null); setCreate(false); setSubject(""); setBody(""); notify("Support request saved.", { kind: "success" }); await tickets.mutate(api<TicketPage>(cursorPath("support", cursor)), { revalidate: false, throwOnError: true }).catch(() => { notify("Your support request was saved, but the ticket list could not refresh. Refresh the page to see it; do not create it again."); }); } catch (e) { setError((e as Error).message); } finally { requestPending.current = false; setBusy(false); } }
  async function respond(e: FormEvent) {
    e.preventDefault();
    if (!ticketId || (!reply.trim() && !attachment?.messageId) || requestPending.current) return;
    const submittedTicket = ticketId, selectedImage = attachment;
    let savedMessage = selectedImage?.messageId;
    requestPending.current = true; setBusy(true); setError("");
    try {
      if (!savedMessage) {
        const saved = await api(`support/${submittedTicket}/messages`, { method: "POST", body: { body: reply.trim() } });
        if (selectedImage) { savedMessage = messageId(saved); if (activeTicket.current === submittedTicket) setAttachment({ ...selectedImage, messageId: savedMessage }); }
      }
      if (selectedImage && savedMessage) {
        const form = new FormData(); form.append("file", selectedImage.file);
        await api(`${privateAttachmentPath(submittedTicket)}/messages/${savedMessage}/attachments`, { method: "POST", body: form, idempotencyKey: selectedImage.key });
      }
      if (activeTicket.current === submittedTicket) { setReply(""); setAttachment(null); notify("Your reply was saved.", { kind: "success" }); }
      // Explicit reads propagate failures; ordinary SWR revalidation may resolve
      // stale data even when its GET failed. Never turn a refresh into a retry of the write.
      const refreshed = await Promise.allSettled([
        ticket.mutate(api<TicketResponse>(`support/${submittedTicket}`), { revalidate: false, throwOnError: true }),
        tickets.mutate(api<TicketPage>(cursorPath("support", cursor)), { revalidate: false, throwOnError: true }),
        attachments.mutate(readPrivateAttachments(submittedTicket, api), { revalidate: false, throwOnError: true }),
      ]);
      if (activeTicket.current === submittedTicket && refreshed.some(result => result.status === "rejected")) {
        notify("Your reply was saved, but the conversation could not fully refresh. Refresh to see the latest messages and images; do not send the reply again.");
      }
    } catch (e) {
      if (activeTicket.current === submittedTicket) setError(savedMessage && selectedImage ? "Your reply is saved. The private image upload could not be confirmed. Retry Send with the same image to check or finish its upload without sending another reply." : (e as Error).message);
    } finally { requestPending.current = false; setBusy(false); }
  }
  const initials = user.name.split(/\s+/).filter(Boolean).slice(0, 2).map(name => name[0]).join("").toUpperCase();
  const answers = [
    ["How do I start investing?", "Add reAED or USDT to your connected wallet on INFRA, choose a published project in Explore, select whole shares and review the exact cost. Approve the request in reID, then follow confirmation in Activity. A wallet deposit alone does not buy shares."],
    ["Why do I need reAED when paying with USDT?", "INFRA network fees are paid separately in reAED. A USDT purchase may need an exact token allowance first, followed by a separate purchase approval. Review each request in reID."],
    ["How are my earnings calculated?", "Each project revenue deposit is shared across investor-held fractions at that time. Rewards already allocated to you stay yours after a transfer or sale."],
    ["Is there a lock period?", "Your fractions are transferable. Reselling requires a buyer on the marketplace; there is no automatic buyback."],
    ["How long do withdrawals take?", "A wallet transfer is sent after you approve it and appears after INFRA confirms it. Network fees are paid in reAED."],
  ];
  return <InvestorShell page="support" title="Support" subtitle="Tickets, answers and help from the reSystem team">
    <div className="iv-support-layout iv-support-restored"><aside>
      <Panel className="iv-ticket-list"><div className="iv-panel-toolbar"><h2>Your tickets</h2><button className="iv-button iv-dark iv-small" disabled={!live} onClick={() => { setCreate(true); setError(""); }}>New ticket</button></div><DataState loading={tickets.isLoading} error={tickets.error} empty={Boolean(tickets.data && tickets.data.items.length === 0)} onRetry={() => void tickets.mutate()}>No tickets yet. Start a conversation when you need a hand.</DataState>{!tickets.error ? tickets.data?.items.map(t => <button className={`iv-ticket ${t.id === ticketId ? "iv-ticket-active" : ""}`} key={t.id} aria-pressed={t.id === ticketId} onClick={() => { activeTicket.current = t.id; setSelected(t.id); setReply(""); setAttachment(null); setError(""); }}><span><time dateTime={t.updatedAt}>{new Date(t.updatedAt).toLocaleDateString()}</time><Tag tone={t.status === "CLOSED" || t.status === "RESOLVED" ? "neutral" : "blue"}>{t.status.replaceAll("_", " ")}</Tag></span><strong>{t.subject}</strong>{t.messages?.at(-1) ? <p>{t.messages.at(-1)!.body}</p> : null}</button>) : null}<PageButtons cursor={cursor} next={tickets.data?.nextCursor} change={setCursor} /></Panel>
      <Panel className="iv-popular-answers"><h2>Popular answers</h2>{answers.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</Panel>
    </aside>
    <Panel className="iv-conversation"><div className="iv-conversation-heading"><div><p>{ticket.data ? "Your support ticket" : "We’re here to help"}</p><h2>{ticket.data?.subject || "Your conversation"}</h2></div>{ticket.data ? <Tag tone={["RESOLVED", "CLOSED"].includes(ticket.data.status) ? "neutral" : "blue"}>{ticket.data.status.replaceAll("_", " ")}</Tag> : null}</div><DataState loading={ticket.isLoading} error={ticket.error} onRetry={() => void ticket.mutate()} />
      <div className="iv-messages">{!ticket.error && ticket.data?.messages?.length ? ticket.data.messages.map(message => <article className={`iv-message ${message.authorId === user.id ? "iv-message-you" : ""}`} key={message.id}><Initials name={message.authorId === user.id ? initials : "RS"} /><div><p>{message.body}</p>{!attachments.error ? attachments.data?.filter(file => file.messageId === message.id).map(file => <div key={file.id}>{file.deletedAt ? <span>Image removed</span> : <a className="iv-text-link" style={{ color: "inherit", textDecoration: "underline", overflowWrap: "anywhere" }} href={`/api/platform/${privateAttachmentPath(ticketId!)}/attachments/${file.id}/content`} download rel="nofollow">{file.filename || "Private image.webp"}</a>}</div>) : null}<small>{message.authorId === user.id ? "You" : "reSystem Support"} · <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time></small></div></article>) : !ticket.isLoading && !ticket.error ? <div className="iv-support-empty"><strong>{ticketId ? "Start the conversation" : "How can we help?"}</strong><p>{ticketId ? "Send a message below to continue this ticket." : "Choose a ticket or create a new one to talk to the team."}</p>{!ticketId ? <button className="iv-button iv-primary" disabled={!live} onClick={() => { setCreate(true); setError(""); }}>New ticket</button> : null}</div> : null}</div>
      {ticket.data && !ticket.error ? <form className="iv-message-composer" onSubmit={respond}><label className="sr-only" htmlFor="support-reply">{["RESOLVED", "CLOSED"].includes(ticket.data.status) ? "Reply to reopen this ticket" : "Your reply"}</label><textarea id="support-reply" disabled={busy || Boolean(attachment?.messageId)} rows={2} placeholder="Write your reply…" maxLength={5000} minLength={1} value={reply} onChange={e => setReply(e.target.value)} required /><input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden aria-label="Choose private support image" onChange={event => { const selectedFile = event.target.files?.[0]; event.target.value = ""; if (!selectedFile) return; try { validatePrivateImage(selectedFile); setAttachment({ file: selectedFile, key: crypto.randomUUID(), messageId: attachment?.messageId }); setError(""); } catch (cause) { setError((cause as Error).message); } }} /><button className="iv-button iv-small" type="button" aria-label={attachment ? `Private image selected: ${attachment.file.name}` : "Attach private image"} title={attachment ? `${attachment.file.name} · private to this ticket` : "Attach a private PNG, JPEG or WebP image, up to 3 MiB"} aria-pressed={Boolean(attachment)} disabled={busy} onClick={() => fileInput.current?.click()}><Paperclip size={16} aria-hidden="true" /></button><button className="iv-button iv-primary" disabled={busy || !reply.trim()}>{busy ? "Saving…" : "Send"}</button></form> : null}
      <p className="iv-support-privacy">Keep passwords, recovery phrases and private keys out of messages. Images stay private to this ticket.</p>
    </Panel></div>
    {error || attachments.error ? <p className="iv-form-error" role="alert">{error || "Private images could not be loaded. Refresh this conversation."}</p> : null}
    {create ? <Modal title="New ticket" onClose={() => setCreate(false)}><form className="iv-live-form" onSubmit={newTicket}><label htmlFor="ticket-subject">Subject</label><input className="iv-input" id="ticket-subject" maxLength={200} minLength={3} value={subject} onChange={e => setSubject(e.target.value)} required /><label htmlFor="ticket-body">How can we help?</label><textarea className="iv-input" id="ticket-body" rows={6} maxLength={5000} minLength={5} value={body} onChange={e => setBody(e.target.value)} required />{error ? <p className="iv-form-error" role="alert">{error}</p> : null}<button className="iv-button iv-primary" disabled={busy || subject.trim().length < 3 || body.trim().length < 5}>{busy ? "Saving…" : "Create ticket"}</button></form></Modal> : null}
  </InvestorShell>;
}
// reID owns email verification; the app only exposes delivery preferences.
function EmailPreferences({ status, inApp, chosen, change, unavailable = false }: { status: EmailNotificationsResponse; inApp: PreferenceDto; chosen: EmailPreferenceDto; change: (value: EmailPreferenceDto) => void; unavailable?: boolean }) {
  if (!status.verifiedEmail) return <div className="iv-email"><div className="iv-email-head"><h3>Email</h3><Tag tone="neutral">Not provided</Tag></div><p className="iv-muted">Add an email address to your reID account, then reconnect with reID to receive email notifications.</p></div>;
  return <div className="iv-email"><div className="iv-email-head"><h3>Email</h3><Tag tone="green">Connected</Tag></div><p>{status.verifiedEmail}</p><label className={`iv-checkbox${inApp.transactionUpdates ? "" : " iv-email-off"}`}><input type="checkbox" checked={chosen.transactionEmails} disabled={unavailable || !inApp.transactionUpdates} onChange={e => { if (!unavailable && inApp.transactionUpdates) change({ ...chosen, transactionEmails: e.target.checked }); }} /> Transaction emails</label><label className={`iv-checkbox${inApp.supportUpdates ? "" : " iv-email-off"}`}><input type="checkbox" checked={chosen.supportEmails} disabled={unavailable || !inApp.supportUpdates} onChange={e => { if (!unavailable && inApp.supportUpdates) change({ ...chosen, supportEmails: e.target.checked }); }} /> Support reply emails</label></div>;
}
export function InvestorNotifications() {
  const { notify, user } = usePlatform(); const { mutate } = useSWRConfig(); const [markingAll, setMarkingAll] = useState(false); const readPending = useRef(false); const [cursor, setCursor] = useState<string | null>(null); const updates = useResource<NotificationPage>(cursorPath("notifications", cursor)); const preferences = useResource<PreferenceDto>("notification-preferences"); const [draft, setDraft] = useState<PreferenceDto | null>(null); const [busy, setBusy] = useState(false); const chosen = draft || preferences.data;
  const email = useResource<EmailNotificationsResponse>("email-notifications"); const [emailDraft, setEmailDraft] = useState<EmailPreferenceDto | null>(null); const emailStatus = email.data?.deliveryEnabled ? email.data : null; const emailChosen = emailDraft || (emailStatus ? { transactionEmails: emailStatus.transactionEmails, supportEmails: emailStatus.supportEmails } : null); const preferencesUnavailable = Boolean(preferences.error || email.error);
  async function refreshNotifications() {
    const results = await Promise.allSettled([
      updates.mutate(api<NotificationPage>(cursorPath("notifications", cursor)), { revalidate: false, throwOnError: true }),
      mutate(key => Array.isArray(key) && key[0] === user.id && typeof key[1] === "string" && key[1].startsWith("notifications") && key[1] !== cursorPath("notifications", cursor)),
    ]);
    return results.every(result => result.status === "fulfilled");
  }
  async function readAll() {
    if (readPending.current) return;
    readPending.current = true; setMarkingAll(true);
    try { await api("notifications/read-all", { method: "PATCH" }); const refreshed = await refreshNotifications(); notify(refreshed ? "All notifications marked as read." : "Notifications were marked as read, but the list could not refresh. Refresh to see the updated status.", refreshed ? { kind: "success" } : undefined); }
    catch (e) { notify(e instanceof Error ? e.message : "Could not mark all notifications as read. Please try again."); }
    finally { readPending.current = false; setMarkingAll(false); }
  }
  // The GET response also carries userId; the backend rejects any field outside PreferenceDto.
  const saving = useRef(false);
  async function save() {
    if (!chosen || saving.current || preferencesUnavailable) return;
    saving.current = true; setBusy(true); let savedAny = false;
    try {
      if (draft) {
        const saved = await api<PreferenceDto>("notification-preferences", { method: "PATCH", body: { transactionUpdates: chosen.transactionUpdates, supportUpdates: chosen.supportUpdates } });
        savedAny = true; await preferences.mutate(saved, { revalidate: false }); setDraft(null);
      }
      if (emailDraft) {
        const saved = await api<EmailNotificationsResponse>("email-notifications", { method: "PATCH", body: emailDraft });
        savedAny = true; await email.mutate(saved, { revalidate: false }); setEmailDraft(null);
      }
      notify("Notification preferences saved.", { kind: "success" });
    } catch (e) { notify(`${savedAny ? "Some preferences were saved. " : ""}${(e as Error).message}`); }
    finally { saving.current = false; setBusy(false); }
  }
  return <InvestorShell page="notifications" title="Notifications" subtitle="Actual transaction and support updates"><Panel><div className="iv-panel-toolbar"><h2>Updates</h2><button className="iv-button iv-small" disabled={markingAll || updates.isLoading || Boolean(updates.error) || !updates.data?.items.length} onClick={() => void readAll()}>{markingAll ? "Marking as read…" : "Mark all as read"}</button></div><DataState loading={updates.isLoading} error={updates.error} empty={Boolean(updates.data && updates.data.items.length === 0)} onRetry={() => void updates.mutate()}>No notifications yet.</DataState>{updates.data?.items.map(n => <div className="iv-record iv-record-with-action" key={n.id}><div><strong>{n.title}</strong><p>{n.body}</p><time dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleString()}</time><Link className="iv-text-link" href={notificationPath(n.href)}>Open relevant activity →</Link></div>{!n.readAt ? <button className="iv-button iv-small" onClick={async () => { try { await api(`notifications/${n.id}/read`, { method: "PATCH" }); const refreshed = await refreshNotifications(); notify(refreshed ? "Notification marked as read." : "The notification was marked as read. Refresh to see its updated status.", refreshed ? { kind: "success" } : undefined); } catch (e) { notify(e instanceof Error ? e.message : "This notification could not be marked as read."); } }}>Mark read</button> : <Tag tone="neutral">Read</Tag>}</div>)}<PageButtons cursor={cursor} next={updates.data?.nextCursor} change={setCursor} /></Panel><Panel title="Preferences"><DataState error={email.error} onRetry={() => void email.mutate()} /><DataState loading={preferences.isLoading} error={preferences.error} onRetry={() => void preferences.mutate()} />{chosen ? <><label className="iv-checkbox"><input type="checkbox" checked={chosen.transactionUpdates} disabled={busy || preferencesUnavailable} onChange={e => setDraft({ ...chosen, transactionUpdates: e.target.checked })} /> Transaction updates</label><label className="iv-checkbox"><input type="checkbox" checked={chosen.supportUpdates} disabled={busy || preferencesUnavailable} onChange={e => setDraft({ ...chosen, supportUpdates: e.target.checked })} /> Support replies</label>{emailStatus && emailChosen ? <EmailPreferences status={emailStatus} inApp={chosen} chosen={emailChosen} unavailable={preferencesUnavailable || busy} change={setEmailDraft} /> : null}<button className="iv-button iv-primary" disabled={!(draft || emailDraft) || busy || preferencesUnavailable} onClick={() => void save()}>{busy ? "Saving…" : "Save preferences"}</button></> : null}</Panel></InvestorShell>;
}
