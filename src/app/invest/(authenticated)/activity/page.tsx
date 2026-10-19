import { InvestorActivity } from "@/components/invest/ActivitySupport";
export default async function Page({ searchParams }: { searchParams: Promise<{ intent?: string }> }) { const { intent } = await searchParams; const selected = intent && /^[a-zA-Z0-9_-]{1,100}$/.test(intent) ? intent : undefined; return <InvestorActivity key={selected || "default"} initialIntent={selected} />; }

// Validate the backend session at request time on every protected navigation.
export const instant = false;
