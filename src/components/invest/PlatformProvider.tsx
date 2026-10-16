"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import useSWR, { SWRConfig } from "swr";
import type { InvestorUser } from "@/lib/auth/security";
import type { SessionResponse } from "@/lib/platform/api.generated";
import { api } from "@/lib/platform/client";
type PlatformContextValue = { user: InvestorUser; live: boolean; approvalOrigin: string; session: SessionResponse | null; notice: string; notify: (message: string) => void };
const Context = createContext<PlatformContextValue | null>(null);
function SessionScope({ children, user, live, approvalOrigin }: { children: ReactNode; user: InvestorUser; live: boolean; approvalOrigin: string }) {
  const [notice, setNotice] = useState("");
  const notify = useCallback((message: string) => setNotice(message), []);
  const { data: session } = useSWR<SessionResponse>(live ? "platform-session" : null, () => api("auth/session"), { refreshInterval: 60000, shouldRetryOnError: false });
  const value = useMemo(() => ({ user, live, approvalOrigin, session: session ?? null, notice, notify }), [user, live, approvalOrigin, session, notice, notify]);
  return <Context.Provider value={value}>{session && (!session.authenticated || session.kind !== "investor" || session.user?.walletAddress?.toLowerCase() !== user.wallet.toLowerCase()) ? <div className="investor-app iv-auth-loading"><h1>Your session has ended</h1><p>Connect with reID again to continue.</p><a className="iv-button iv-primary" href="/invest">Connect with reID</a></div> : children}</Context.Provider>;
}
export function PlatformProvider(props: { children: ReactNode; user: InvestorUser; live: boolean; approvalOrigin: string }) {
  return <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false, revalidateOnFocus: true }}><SessionScope {...props} /></SWRConfig>;
}
export function usePlatform() { const value = useContext(Context); if (!value) throw new Error("Investor session provider is missing"); return value; }
export function useResource<T>(path: string | null, refreshInterval = 30000) {
  const { user, live } = usePlatform();
  return useSWR<T>(live && path ? [user.id, path] : null, ([, endpoint]: [string, string]) => api<T>(endpoint), { refreshInterval, shouldRetryOnError: false });
}
