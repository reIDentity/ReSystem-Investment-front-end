"use client";
import { useLanding } from "../LandingData";
import { products } from "@/data/products";
import { displayMoney } from "@/lib/platform/landing-data";
import { percentage, units } from "@/lib/platform/money";

/** Artwork remains the approved brand composition. Only an explicit published record may supply its finance. */
export function useHeroProject(slug: string) {
  const { projects } = useLanding();
  const id = products.find(p => p.id === slug)?.projectId;
  const row = id ? projects?.find(p => p.project.id === id) ?? null : null;
  const project = row?.project, chain = row?.chain;
  const count = (value: string | undefined) => value ? BigInt(value).toLocaleString("en-US") : "—";
  const max = project?.maxFractions;
  const issued = chain?.totalSupply, remaining = chain?.remainingSupply;
  const price = (value: string | undefined, decimals: number) => value && chain ? units(value, decimals) : "—";
  const cells = 100;
  return {
    href: project ? `/invest/products/${project.id}` : "/invest/explore",
    status: project ? row!.stats.sale === "Open" ? "Sale open" : row!.stats.sale === "Closed" ? "Sale closed" : "Unavailable" : "Not listed",
    maximum: count(max), issued: count(issued), remaining: count(remaining),
    sold: issued && max ? percentage(issued, max) : "—",
    priceNative: price(project?.unitPriceReaedAtomic, 18), priceUsdt: price(project?.unitPriceUsdtAtomic, 6),
    // Cells are equal shares of maximum supply, not imaginary investor allocations.
    cell: (index: number) => ({ backgroundColor: issued && max && BigInt(index + 1) * BigInt(max) <= BigInt(issued) * BigInt(cells) ? "#0091ff" : "#475569" }),
    rows: [
      { label: "Issued fractions", ratio: issued && max ? percentage(issued, max) : "—", value: count(issued), unit: "fractions" },
      { label: "Available fractions", ratio: remaining && max ? percentage(remaining, max) : "—", value: count(remaining), unit: "fractions" },
      { label: "Total project value", ratio: "", value: project ? units(project.totalValueUsdtAtomic, 6) : "—", unit: "USDT" },
      { label: "Price per fraction", ratio: "", value: price(project?.unitPriceUsdtAtomic, 6), unit: "USDT" },
      { label: "Revenue funded", ratio: "", value: displayMoney(row?.funded ?? null), unit: "USD eq." },
      { label: "Rewards claimed", ratio: "", value: displayMoney(row?.claimed ?? null), unit: "USD eq." },
    ],
  };
}
