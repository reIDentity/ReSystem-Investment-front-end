import { notFound } from "next/navigation";
import { products } from "@/data/products";
import { InvestorProduct } from "@/components/invest/ProductDetail";

export function generateStaticParams() { return products.map(p => ({ slug: p.id })); }

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!products.some(p => p.id === slug)) notFound();
  return <InvestorProduct key={slug} id={slug} />;
}
