"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import useSWR from "swr";
import { fetchLanding } from "@/lib/platform/landing-public";
import { LANDING_MAX_AGE_MS, LANDING_REFRESH_MS, landingTotals, verifiedLandingProject, type LandingProject, type LandingSnapshot } from "@/lib/platform/landing-data";
import { publishedLandingProject } from "@/lib/platform/landing-project";
import type { Project } from "@/lib/platform/types";

type LandingContext = { projects: LandingProject[] | null; loading: boolean; error: boolean; retry: () => void; totals: ReturnType<typeof landingTotals> };
const Context = createContext<LandingContext>({ projects: null, loading: true, error: false, retry() {}, totals: landingTotals(null) });
export type InitialLandingCatalogue = { projects: Project[]; fetchedAt: number };
export function LandingData({ children, initialCatalogue }: { children: ReactNode; initialCatalogue?: InitialLandingCatalogue }) {
  // Published content can render before chain/revenue reads. Empty finance slots
  // remain unknown; the seed cannot enable a purchase or invent a return.
  const initial = useMemo<LandingSnapshot | undefined>(() => {
    if (!initialCatalogue || !Number.isSafeInteger(initialCatalogue.fetchedAt) || !initialCatalogue.projects.every(p => publishedLandingProject(p.id, p))) return undefined;
    return { projects: initialCatalogue.projects.map(p => verifiedLandingProject(p, null, null, initialCatalogue.fetchedAt)), fetchedAt: initialCatalogue.fetchedAt };
  }, [initialCatalogue]);
  const snapshot = useSWR("public-landing-catalogue", fetchLanding, { refreshInterval: LANDING_REFRESH_MS, revalidateOnFocus: true, shouldRetryOnError: false, dedupingInterval: 15000 });
  // A completed refresh, including an empty catalogue, always supersedes the
  // initial records. Failed later refreshes never resurrect old initial cards.
  const active = snapshot.error ? snapshot.data ? undefined : initial : snapshot.data ?? initial;
  const [expiredAt, setExpiredAt] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const fetchedAt = active.fetchedAt;
    const timer = setTimeout(() => setExpiredAt(fetchedAt), Math.max(0, fetchedAt + LANDING_MAX_AGE_MS - Date.now()));
    return () => clearTimeout(timer);
  }, [active]);
  const projects = expiredAt === active?.fetchedAt ? null : active?.projects ?? null;
  const totals = useMemo(() => landingTotals(projects), [projects]);
  return <Context.Provider value={{ projects, totals, loading: projects === null && snapshot.isLoading, error: !!snapshot.error || (projects === null && !snapshot.isLoading), retry: () => { void snapshot.mutate(); } }}>{children}</Context.Provider>;
}
export const useLanding = () => useContext(Context);
