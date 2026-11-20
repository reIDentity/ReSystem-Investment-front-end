import { MultichainEarnings as InvestorEarnings } from "@/components/invest/MultichainWallet";
export default function Page() { return <InvestorEarnings />; }

// Validate the backend session at request time on every protected navigation.
export const instant = false;
