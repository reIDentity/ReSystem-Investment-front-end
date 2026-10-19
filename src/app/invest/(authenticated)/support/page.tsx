import { InvestorSupport } from "@/components/invest/ActivitySupport";
export default async function Page({ searchParams }: { searchParams: Promise<{ ticket?: string }> }) { const { ticket } = await searchParams; const selected = ticket && /^[a-zA-Z0-9_-]{1,100}$/.test(ticket) ? ticket : undefined; return <InvestorSupport key={selected || "default"} initialTicket={selected} />; }

// Validate the backend session at request time on every protected navigation.
export const instant = false;
