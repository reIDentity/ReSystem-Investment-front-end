import { InvestorProduct } from "@/components/invest/ProductDetail";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <InvestorProduct key={slug} id={slug} />;
}

// Validate the backend session at request time on every protected navigation.
export const instant = false;
