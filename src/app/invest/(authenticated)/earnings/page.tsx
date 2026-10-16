import { InvestorEarnings } from "@/components/invest/Earnings";
export default function Page() { return <InvestorEarnings />; }

// Validate the backend session at request time on every protected navigation.
export const instant = false;
