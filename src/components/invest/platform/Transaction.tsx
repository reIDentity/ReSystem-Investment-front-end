"use client";
import { useActionError, useFeedbackMessage, useActionFeedback } from "../../ActionFeedback";
import { useEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import type { CommandDto, TransactionResponse } from "@/lib/platform/api.generated";
import { isSettled, transactionIssue, transactionPollInterval, transactionGuidance } from "@/lib/platform/transaction";
import { api } from "@/lib/platform/client";
import { assetLabel, explorer, safeApproval, units } from "@/lib/platform/money";
import { usePlatform, useResource } from "../PlatformProvider";
import { Modal, Tag } from "../InvestorUI";
import { ReidApprovalQr } from "./ReidMobile";
export type InvestorCommand = CommandDto | { type: "CLAIM_BATCH"; projectIds: string[]; asset: "REAED" | "USDT" };
const LABELS: Record<string, string> = { CREATED: "Ready for your review", SUBMITTING: "Submitting approval request", AWAITING_APPROVAL: "Awaiting your reID approval", AWAITING_SECOND_APPROVAL: "Awaiting second approval", BROADCAST: "Broadcast to INFRA", CONFIRMED: "Confirmed on INFRA · indexing pending", INDEXED: "Confirmed and indexed", REJECTED: "Approval rejected", FAILED: "Transaction failed", EXPIRED: "Approval expired", RECONCILIATION_REQUIRED: "Approval status requires reconciliation" };
export function TransactionReview({ command, onClose }: { command: InvestorCommand; onClose: () => void }) {
  const [prepared, setPrepared] = useState<TransactionResponse | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useActionError();
  const key = useRef<string | null>(null);
  const { notify } = useActionFeedback();
  async function prepare() { setBusy(true); setError(""); key.current ??= crypto.randomUUID(); try { setPrepared(await api<TransactionResponse>("transactions", { method: "POST", body: command, idempotencyKey: key.current })); notify("Transaction prepared. Review the exact values before requesting approval.", { kind: "info" }); } catch (e) { setError(e instanceof Error ? e.message : "Preparation failed."); } finally { setBusy(false); } }
  return prepared ? <IntentReview initial={prepared} onClose={onClose} /> : <Modal title="Review your action" onClose={onClose}><p>Prepare an exact quote, wallet balance and gas check before requesting your signature.</p><CommandSummary command={command} /><p className="iv-muted">No assets move until you approve a transaction in reID and INFRA confirms it. Check the recipient carefully; confirmed transfers are irreversible.</p>{error ? <p className="iv-form-error">{error}</p> : null}<button className="iv-button iv-primary iv-full" disabled={busy} onClick={() => void prepare()}>{busy ? "Checking quote and wallet…" : "Prepare transaction"}</button></Modal>;
}
function CommandSummary({ command }: { command: InvestorCommand | Record<string, unknown> }) {
  const summary = command as Record<string, unknown>;
  const projectId = typeof summary.projectId === "string" ? summary.projectId : null;
  const project = useResource<{title:string}>(projectId ? `projects/${projectId}` : null, 0);
  const projectLabel = project.data?.title || (project.error ? "Project details unavailable" : "Loading project…");
  return <dl className="iv-exact-summary">{[ ["Action", String(summary.type).replaceAll("_", " ")], ["Asset", summary.asset ? assetLabel(String(summary.asset)) : null], ["Whole fractions", summary.quantity], ["Amount", typeof summary.amountAtomic === "string" && ["REAED", "USDT"].includes(String(summary.asset)) ? `${units(summary.amountAtomic, summary.asset === "USDT" ? 6 : 18)} ${assetLabel(String(summary.asset))}` : summary.amountAtomic], ["Unit price", typeof summary.unitPriceAtomic === "string" && ["REAED", "USDT"].includes(String(summary.asset)) ? `${units(summary.unitPriceAtomic, summary.asset === "USDT" ? 6 : 18)} ${assetLabel(String(summary.asset))}` : summary.unitPriceAtomic], ["Recipient", summary.recipient], ["Project", projectId ? projectLabel : null], ["Listing", summary.listingId], ["Projects", Array.isArray(summary.projectIds) ? summary.projectIds.length : null] ].filter(([, v]) => v != null).map(([label, value]) => <div key={String(label)}><dt>{String(label)}</dt><dd>{String(value)}</dd></div>)}</dl>;
}
export function IntentReview({ initial, id, onClose }: { initial?: TransactionResponse; id?: string; onClose: () => void }) {
  const { user, approvalOrigin } = usePlatform(); const { mutate } = useSWRConfig();
  const request = useResource<TransactionResponse>(`transactions/${initial?.id || id}`, current => transactionPollInterval(current || initial));
  const [submitted, setSubmitted] = useState<TransactionResponse | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useActionError();
  const { notify } = useActionFeedback(); const priorStatus = useRef<string | null>(null);
  const refreshed = useRef(""); const intent = request.data || submitted || initial;
  const [expiryTick, setExpiryTick] = useState(0); const status = intent?.status, expiresAt = intent?.expiresAt;
  useEffect(() => {
    if (!status || !["CREATED", "SUBMITTING", "AWAITING_APPROVAL"].includes(status) || !expiresAt) return;
    const remaining = Date.parse(expiresAt) - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) return;
    const timer = setTimeout(() => setExpiryTick(tick => tick + 1), Math.min(remaining + 1, 2147483647));
    return () => clearTimeout(timer);
  }, [status, expiresAt, expiryTick]);
  useEffect(() => { if (intent && isSettled(intent) && refreshed.current !== intent.status) { refreshed.current = intent.status; void mutate(key => Array.isArray(key) && key[0] === user.id && !String(key[1]).startsWith("transactions/")); } }, [intent, mutate, user.id]);
  async function submit() { if (!intent || request.error || busy || transactionIssue(intent, user.wallet)) return; setBusy(true); setError(""); try { const result = await api<TransactionResponse>(`transactions/${intent.id}/submit`, { method: "POST" }); setSubmitted(result); await request.mutate(result, { revalidate: false }); } catch (e) { setError(e instanceof Error ? e.message : "Approval could not be requested. Check the existing intent before retrying."); await request.mutate().catch(() => undefined); } finally { setBusy(false); } }
  const issue = intent ? transactionIssue(intent, user.wallet) : null;
  useFeedbackMessage(request.error ? "Status is unavailable. Do not approve this transaction. Refresh this same intent before preparing any replacement; an unavailable status does not mean it failed." : issue);
  useEffect(() => {
    if (!intent || request.error || issue) return;
    const previous = priorStatus.current;
    priorStatus.current = intent.status;
    if (!previous || previous === intent.status) return;
    if (intent.status === "INDEXED") notify("Transaction confirmed and recorded in Activity.", { kind: "success" });
    else if (intent.status === "CONFIRMED") notify("Transaction confirmed on INFRA. Your balances and activity are updating.", { kind: "info" });
    else if (intent.status === "AWAITING_APPROVAL") notify("Approval requested. Review and approve this transaction in the reID mobile app.", { kind: "info" });
    else if (["FAILED", "REJECTED", "EXPIRED", "RECONCILIATION_REQUIRED"].includes(intent.status)) notify(transactionGuidance(intent), { kind: "error" });
  }, [intent, issue, request.error, notify]);
  const trustedUrl = intent ? safeApproval(intent.approvalUrl, approvalOrigin) : null; const url = !issue && !request.error ? trustedUrl : null; const tx = intent?.transaction; const chainUrl = explorer(intent?.txHash || null);
  return <Modal title="Transaction progress" onClose={onClose}>{!intent ? <p role="status">Loading your transaction…</p> : <><div role="status" aria-live="polite" aria-atomic="true"><Tag tone={["FAILED", "REJECTED", "EXPIRED"].includes(intent.status) ? "amber" : "blue"}>{issue ? "Requires verification" : LABELS[intent.status] || intent.status}</Tag><p className="iv-muted iv-transaction-guidance">{issue || request.error ? "Verify this request before continuing. Its status may be incomplete." : transactionGuidance(intent)}</p></div><CommandSummary command={intent.command} />{intent.review ? <dl className="iv-exact-summary">{intent.review.asset && intent.review.amountAtomic ? <div><dt>Exact prepared amount</dt><dd>{units(intent.review.amountAtomic, intent.review.asset === "USDT" ? 6 : 18)} {assetLabel(intent.review.asset)}</dd></div> : null}{intent.review.recipient ? <div><dt>Recipient</dt><dd>{intent.review.recipient}</dd></div> : null}{intent.review.spender ? <div><dt>Approval spender</dt><dd>{intent.review.spender}</dd></div> : null}</dl> : null}<dl className="iv-exact-summary"><div><dt>Signing wallet</dt><dd>{intent.walletAddress}</dd></div><div><dt>Network</dt><dd>INFRA testnet · 15324</dd></div>{tx ? <><div><dt>Contract or destination</dt><dd>{tx.to}</dd></div><div><dt>Native value</dt><dd>{units(tx.valueWei, 18)} reAED</dd></div><div><dt>Estimated network fee</dt><dd>{units(tx.estimatedFeeWei, 18)} reAED</dd></div><div><dt>Gas estimate</dt><dd>{tx.gasEstimate}</dd></div></> : null}</dl>{issue ? <p className="iv-form-error">{issue}</p> : null}{intent.status === "CREATED" && !issue ? <button className="iv-button iv-primary iv-full" disabled={busy || Boolean(request.error)} onClick={() => void submit()}>{busy ? "Requesting approval…" : "Request reID approval"}</button> : null}{url && ["AWAITING_APPROVAL", "SUBMITTING"].includes(intent.status) ? <><ReidApprovalQr url={url} /><a href={url} onClick={event => { const problem = request.error ? "Status is unavailable. Do not approve this transaction. Refresh this same intent before preparing any replacement." : transactionIssue(intent, user.wallet); if (problem) { event.preventDefault(); setError(problem); } }} target="_blank" rel="noopener noreferrer" className="iv-button iv-primary iv-full">Open reID mobile app to review and approve ↗</a></> : null}{intent.approvalUrl && !trustedUrl ? <p className="iv-form-error">Approval link is not trusted. Reconnect with reID.</p> : null}{chainUrl ? <a className="iv-text-link" href={chainUrl} target="_blank" rel="noopener noreferrer">View actual transaction on INFRA ↗</a> : null}<p className="iv-muted">You can close this window and follow this request in Activity.</p></>}{error || request.error ? <p className="iv-form-error">{request.error ? "Status is unavailable. Do not approve this transaction. Refresh this same intent before preparing any replacement; an unavailable status does not mean it failed." : error}</p> : null}<button className="iv-button iv-full" onClick={() => void request.mutate().catch(() => undefined)}>Refresh status</button></Modal>;
}
