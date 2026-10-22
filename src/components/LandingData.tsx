"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import useSWR from "swr";
import { fetchLanding } from "@/lib/platform/landing-public";
import { LANDING_MAX_AGE_MS, LANDING_REFRESH_MS, landingTotals, type LandingProject } from "@/lib/platform/landing-data";

type LandingContext = { projects: LandingProject[] | null; loading: boolean; error: boolean; retry: () => void; totals: ReturnType<typeof landingTotals> };
const Context = createContext<LandingContext>({ projects: null, loading: true, error: false, retry() {}, totals: landingTotals(null) });
export function LandingData({ children }: { children: ReactNode }) {
  const snapshot = useSWR("public-landing-catalogue", fetchLanding, { refreshInterval: LANDING_REFRESH_MS, revalidateOnFocus: true, shouldRetryOnError: false, dedupingInterval: 15000 });
  const [expiredAt, setExpiredAt] = useState<number | null>(null);
  useEffect(() => {
    if (!snapshot.data) return;
    const fetchedAt = snapshot.data.fetchedAt;
    const timer = setTimeout(() => setExpiredAt(fetchedAt), Math.max(0, fetchedAt + LANDING_MAX_AGE_MS - Date.now()));
    return () => clearTimeout(timer);
  }, [snapshot.data]);
  const projects = snapshot.error || expiredAt === snapshot.data?.fetchedAt ? null : snapshot.data?.projects ?? null;
  const totals = useMemo(() => landingTotals(projects), [projects]);
  return <Context.Provider value={{ projects, totals, loading: snapshot.isLoading, error: !!snapshot.error || (projects === null && !snapshot.isLoading), retry: () => { void snapshot.mutate(); } }}>{children}</Context.Provider>;
}
export const useLanding = () => useContext(Context);
