import { InvestorDeposit } from "@/components/invest/Deposit";
export default function Page() { return <InvestorDeposit />; }

// Validate the backend session at request time on every protected navigation.
export const instant = false;
