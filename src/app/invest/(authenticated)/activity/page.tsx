import { MultichainActivity } from "@/components/invest/MultichainWallet";
export default function Page() {
  return <MultichainActivity />;
}

// Validate the backend session at request time on every protected navigation.
export const instant = false;
