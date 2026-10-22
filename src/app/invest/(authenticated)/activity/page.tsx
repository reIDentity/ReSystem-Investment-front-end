import { InvestorActivity } from "@/components/invest/ActivitySupport";
export default async function Page({ searchParams }: { searchParams: Promise<{ intent?: string; filter?: string | string[] }> }) { const { intent, filter } = await searchParams; const selected = intent && /^[a-zA-Z0-9_-]{1,100}$/.test(intent) ? intent : undefined; return <InvestorActivity key={`${selected || "default"}:${typeof filter === "string" ? filter : "all"}`} initialIntent={selected} initialFilter={typeof filter === "string" ? filter : undefined} />; }

// Validate the backend session at request time on every protected navigation.
export const instant = false;
