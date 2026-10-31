"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type FeedbackKind = "success" | "error" | "info";
export type FeedbackOptions = { kind?: FeedbackKind; title?: string };
type Notice = { message: string; kind: FeedbackKind; version: number; scope: string; title?: string };
type Feedback = {
  available: boolean;
  notice: Notice;
  notify: (message: string, options?: FeedbackOptions) => void;
  clear: (message: string) => void;
  registerDialog: (dialog: HTMLDialogElement) => () => void;
};
const emptyNotice: Notice = { message: "", kind: "info", version: 0, scope: "" };
const noop = () => {};
const Context = createContext<Feedback>({ available: false, notice: emptyNotice, notify: noop, clear: noop, registerDialog: () => noop });
const subscribe = () => noop;
const browserBody = () => document.body;
const serverBody = () => null;

/** One session-scoped notice; never store private action feedback in browser storage. */
export function ActionFeedbackProvider({ children, scope = "" }: { children: ReactNode; scope?: string }) {
  const [storedNotice, setNotice] = useState(emptyNotice);
  const notice = storedNotice.scope === scope ? storedNotice : emptyNotice;
  if (storedNotice.scope !== scope) setNotice({ ...emptyNotice, scope });
  const [dialogs, setDialogs] = useState<HTMLDialogElement[]>([]);
  const [paused, setPaused] = useState(false);
  const body = useSyncExternalStore(subscribe, browserBody, serverBody);
  const notify = useCallback((message: string, options?: FeedbackOptions) => {
    setPaused(false);
    setNotice(current => ({ message, kind: options?.kind ?? "error", version: current.version + 1, scope, title: options?.title }));
  }, [scope]);
  const clear = useCallback((message: string) => {
    setNotice(current => current.scope === scope && current.message === message ? { ...current, message: "" } : current);
  }, [scope]);
  const registerDialog = useCallback((dialog: HTMLDialogElement) => {
    setDialogs(current => [...current.filter(item => item !== dialog), dialog]);
    return () => setDialogs(current => current.filter(item => item !== dialog));
  }, []);
  useEffect(() => {
    if (!notice.message || notice.kind !== "success" || paused) return;
    const timer = setTimeout(() => setNotice(current => current.version === notice.version ? { ...current, message: "" } : current), 8000);
    return () => clearTimeout(timer);
  }, [notice, paused]);
  const context = useMemo(() => ({ available: true, notice, notify, clear, registerDialog }), [notice, notify, clear, registerDialog]);
  // A native modal makes the rest of the page inert. Render inside the top
  // active dialog so the toast stays visible and its dismiss button works.
  const target = dialogs.at(-1) ?? body;
  return <Context.Provider value={context}>{children}{target && notice.message ? createPortal(
    <div className={`action-toast action-toast-${notice.kind}`} key={notice.version}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}>
      <span className="action-toast-icon" aria-hidden="true">{notice.kind === "success" ? "✓" : notice.kind === "error" ? "!" : "i"}</span>
      <div role={notice.kind === "error" ? "alert" : "status"} aria-atomic="true"><strong>{notice.title || (notice.kind === "success" ? "Success" : notice.kind === "error" ? "Please check" : "Update")}</strong><p>{notice.message}</p></div>
      <button type="button" aria-label="Dismiss notification" onClick={() => { notify(""); setPaused(false); }}>×</button>
    </div>, target) : null}</Context.Provider>;
}

export function useActionFeedback() { return useContext(Context); }

/** Use in action handlers so a repeated identical failure is announced again. */
export function useActionMessage(kind: FeedbackKind) {
  const [message, setMessage] = useState("");
  const last = useRef("");
  const { notify, clear } = useActionFeedback();
  const report = useCallback((value: string) => {
    setMessage(value);
    if (value) notify(value, { kind });
    else if (last.current) clear(last.current);
    last.current = value;
  }, [notify, clear, kind]);
  return [message, report] as const;
}
export function useActionError() { return useActionMessage("error"); }

/** Data/polling feedback is announced once per outcome, not on every refresh. */
export function useFeedbackMessage(message: string | null | undefined, kind: FeedbackKind = "error", title?: string) {
  const { notify, clear } = useActionFeedback();
  const previous = useRef({ key: "", message: "" });
  useEffect(() => {
    const key = message ? `${kind}:${title || ""}:${message.replace(/Support reference:.*$/, "")}` : "";
    if (key && key !== previous.current.key) notify(message!, { kind, title });
    else if (!key && previous.current.message) clear(previous.current.message);
    previous.current = { key, message: message || "" };
  }, [message, kind, title, notify, clear]);
}
