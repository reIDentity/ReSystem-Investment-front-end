import { InvestorWithdraw } from "@/components/invest/WalletFlows";
export default function Page() { return <InvestorWithdraw />; }

// Validate the backend session at request time on every protected navigation.
export const instant = false;
