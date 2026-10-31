"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import useSWR, { SWRConfig, useSWRConfig, unstable_serialize, type SWRConfiguration } from "swr";
import type { InvestorUser } from "@/lib/auth/security";
import type { SessionResponse } from "@/lib/platform/api.generated";
import { api, SESSION_EXPIRED_EVENT } from "@/lib/platform/client";
import { createReadAhead } from "@/lib/platform/read-ahead";
import { ActionFeedbackProvider, useActionFeedback, type FeedbackOptions } from "../ActionFeedback";
type NoticeOptions = FeedbackOptions;
type PlatformContextValue = { user: InvestorUser; live: boolean; approvalOrigin: string; session: SessionResponse | null; notice: string; notify: (message: string, options?: NoticeOptions) => void; prefetch: (paths: readonly string[]) => void; requestResource: (path: string) => Promise<unknown> };
const Context = createContext<PlatformContextValue | null>(null);
function SessionScope({ children, user, live, approvalOrigin, initialSession }: { children: ReactNode; user: InvestorUser; live: boolean; approvalOrigin: string; initialSession?: SessionResponse | null }) {
  const { notice, notify } = useActionFeedback();
  const [invalidated, setInvalidated] = useState(false);
  const { mutate, cache } = useSWRConfig();
  const reader = useMemo(() => createReadAhead(path => api(path)), []);
  const active = useRef(true);
  const prefetch = useCallback((paths: readonly string[]) => {
    if (!active.current || !live) return;
    reader.warm(paths, path => {
      const current = cache.get(unstable_serialize([user.id, path]));
      return current?.data !== undefined || Boolean(current?.error) || Boolean(current?.isValidating);
    }, async (path, value) => {
      if (active.current) await mutate([user.id, path], value, { revalidate: false });
    });
  }, [cache, live, mutate, reader, user.id]);
  const requestResource = useCallback((path: string) => reader.read(path), [reader]);
  const { data: session } = useSWR<SessionResponse>(live ? "platform-session" : null, () => api("auth/session"), { refreshInterval: 60000, shouldRetryOnError: false, ...(initialSession ? { fallbackData: initialSession, revalidateOnMount: false } : {}) });
  const sessionEnded = invalidated || Boolean(session && (!session.authenticated || session.kind !== "investor" || session.user?.id !== user.id || session.user?.walletAddress?.toLowerCase() !== user.wallet.toLowerCase()));
  useEffect(() => { const expire = () => { active.current = false; reader.invalidate(); notify(""); setInvalidated(true); }; window.addEventListener(SESSION_EXPIRED_EVENT, expire); return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire); }, [reader, notify]);
  useEffect(() => { if (sessionEnded) { notify(""); active.current = false; reader.invalidate(); void mutate(key => Array.isArray(key) && key[0] === user.id, undefined, { revalidate: false }); } }, [sessionEnded, mutate, reader, user.id, notify]);
  const value = useMemo(() => ({ user, live, approvalOrigin, session: session ?? null, notice: notice.message, notify, prefetch, requestResource }), [user, live, approvalOrigin, session, notice.message, notify, prefetch, requestResource]);
  return <Context.Provider value={value}>{sessionEnded ? <div className="investor-app iv-auth-loading"><h1>Your session has ended</h1><p>Connect with reID again to continue.</p><a className="iv-button iv-primary" href="/invest">Connect with reID</a></div> : children}</Context.Provider>;
}
export function PlatformProvider(props: { children: ReactNode; user: InvestorUser; live: boolean; approvalOrigin: string; initialSession?: SessionResponse | null }) {
  return <SWRConfig key={`${props.user.id}:${props.user.wallet.toLowerCase()}`} value={{ provider: () => new Map(), shouldRetryOnError: false, revalidateOnFocus: true }}><ActionFeedbackProvider><SessionScope {...props} /></ActionFeedbackProvider></SWRConfig>;
}
export function usePlatform() { const value = useContext(Context); if (!value) throw new Error("Investor session provider is missing"); return value; }
export function useResource<T>(path: string | null, refreshInterval: SWRConfiguration<T>["refreshInterval"] = 30000, options: Pick<SWRConfiguration<T>, "keepPreviousData"> = {}) {
  const { user, live, requestResource } = usePlatform();
  return useSWR<T>(live && path ? [user.id, path] : null, ([, endpoint]: [string, string]) => requestResource(endpoint) as Promise<T>, { refreshInterval: path && /^projects(?:\/[^/]+)?(?:\?.*)?$/.test(path) ? 0 : refreshInterval, shouldRetryOnError: false, ...options });
}
