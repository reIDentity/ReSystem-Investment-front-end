import { MultichainHome as InvestorHome } from "@/components/invest/MultichainWallet";
export default function Page() { return <InvestorHome />; }

// Validate the backend session at request time on every protected navigation.
export const instant = false;
