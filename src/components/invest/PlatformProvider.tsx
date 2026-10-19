"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import useSWR, { SWRConfig, useSWRConfig } from "swr";
import type { InvestorUser } from "@/lib/auth/security";
import type { SessionResponse } from "@/lib/platform/api.generated";
import { api, SESSION_EXPIRED_EVENT } from "@/lib/platform/client";
type PlatformContextValue = { user: InvestorUser; live: boolean; approvalOrigin: string; session: SessionResponse | null; notice: string; notify: (message: string) => void };
const Context = createContext<PlatformContextValue | null>(null);
function SessionScope({ children, user, live, approvalOrigin }: { children: ReactNode; user: InvestorUser; live: boolean; approvalOrigin: string }) {
  const [notice, setNotice] = useState("");
  const [invalidated, setInvalidated] = useState(false);
  const { mutate } = useSWRConfig();
  const notify = useCallback((message: string) => setNotice(message), []);
  const { data: session } = useSWR<SessionResponse>(live ? "platform-session" : null, () => api("auth/session"), { refreshInterval: 60000, shouldRetryOnError: false });
  const sessionEnded = invalidated || Boolean(session && (!session.authenticated || session.kind !== "investor" || session.user?.walletAddress?.toLowerCase() !== user.wallet.toLowerCase()));
  useEffect(() => { const expire = () => setInvalidated(true); window.addEventListener(SESSION_EXPIRED_EVENT, expire); return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire); }, []);
  useEffect(() => { if (sessionEnded) void mutate(key => Array.isArray(key) && key[0] === user.id, undefined, { revalidate: false }); }, [sessionEnded, mutate, user.id]);
  const value = useMemo(() => ({ user, live, approvalOrigin, session: session ?? null, notice, notify }), [user, live, approvalOrigin, session, notice, notify]);
  return <Context.Provider value={value}>{sessionEnded ? <div className="investor-app iv-auth-loading"><h1>Your session has ended</h1><p>Connect with reID again to continue.</p><a className="iv-button iv-primary" href="/invest">Connect with reID</a></div> : children}</Context.Provider>;
}
export function PlatformProvider(props: { children: ReactNode; user: InvestorUser; live: boolean; approvalOrigin: string }) {
  return <SWRConfig key={`${props.user.id}:${props.user.wallet.toLowerCase()}`} value={{ provider: () => new Map(), shouldRetryOnError: false, revalidateOnFocus: true }}><SessionScope {...props} /></SWRConfig>;
}
export function usePlatform() { const value = useContext(Context); if (!value) throw new Error("Investor session provider is missing"); return value; }
export function useResource<T>(path: string | null, refreshInterval = 30000) {
  const { user, live } = usePlatform();
  return useSWR<T>(live && path ? [user.id, path] : null, ([, endpoint]: [string, string]) => api<T>(endpoint), { refreshInterval, shouldRetryOnError: false });
}
