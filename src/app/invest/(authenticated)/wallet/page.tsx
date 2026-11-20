import { MultichainWallet as InvestorWallet } from "@/components/invest/MultichainWallet";
export default function Page() { return <InvestorWallet />; }

// Validate the backend session at request time on every protected navigation.
export const instant = false;
