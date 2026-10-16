import { InvestorSupport } from "@/components/invest/ActivitySupport";
export default async function Page({ searchParams }: { searchParams: Promise<{ ticket?: string }> }) { const { ticket } = await searchParams; return <InvestorSupport initialTicket={ticket && /^[a-zA-Z0-9_-]{1,100}$/.test(ticket) ? ticket : undefined} />; }

// Validate the backend session at request time on every protected navigation.
export const instant = false;
