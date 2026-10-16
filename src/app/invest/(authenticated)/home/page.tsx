import { InvestorHome } from "@/components/invest/HomeExplore";
export default function Page() { return <InvestorHome />; }

// Validate the backend session at request time on every protected navigation.
export const instant = false;
