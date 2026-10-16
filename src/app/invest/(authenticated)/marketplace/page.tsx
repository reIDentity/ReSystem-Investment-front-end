import { InvestorMarketplace } from "@/components/invest/Marketplace";
export default function Page() { return <InvestorMarketplace />; }

// Validate the backend session at request time on every protected navigation.
export const instant = false;
