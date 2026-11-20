import { MultichainWithdraw as InvestorWithdraw } from "@/components/invest/MultichainWallet";
export default function Page() { return <InvestorWithdraw />; }

// Validate the backend session at request time on every protected navigation.
export const instant = false;
