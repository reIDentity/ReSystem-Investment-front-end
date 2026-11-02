import { InvestorActivity } from "@/components/invest/ActivitySupport";
export default async function Page({ searchParams }: {
  searchParams: Promise<{ intent?: string; filter?: string | string[]; page?: string | string[]; snapshotBlock?: string | string[] }>;
}) {
  const params = await searchParams;
  const selected = typeof params.intent === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(params.intent) ? params.intent : undefined;
  const filter = typeof params.filter === "string" ? params.filter : undefined;
  const page = typeof params.page === "string" ? params.page : undefined;
  const snapshot = typeof params.snapshotBlock === "string" ? params.snapshotBlock : undefined;
  return <InvestorActivity key={JSON.stringify([selected, filter, page, snapshot])} initialIntent={selected} initialFilter={filter} initialPage={page} initialSnapshot={snapshot} />;
}

// Validate the backend session at request time on every protected navigation.
export const instant = false;
