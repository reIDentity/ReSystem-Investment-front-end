import type { LandingProject } from "@/lib/platform/landing-data";

export type Category = "Finance" | "Real-world assets" | "Identity" | "Services" | "Infrastructure";

export interface Product {
  id: string;
  /** Explicit platform record, independent of the marketing slug or project title. */
  projectId: string;
  replacementProjectId: string;
  name: string;
  category: Category;
  description: string;
  status?: "Live" | "Coming";
  /** CSS gradient behind the artwork; also the fallback for products without a photo. */
  art: string;
  /** Photo exported from Figma, served from /public/images. */
  image?: string;
}

export const categories: Array<"All" | Category> = [
  "All",
  "Finance",
  "Real-world assets",
  "Identity",
  "Services",
  "Infrastructure",
];

export const products: Product[] = [
  {
    id: "infra-global",
    projectId: "d306fba1-1194-4791-9c96-73dc1ecac5b1",
    replacementProjectId: "6187dbab-0604-43c4-b51e-6b10269d155b",
    name: "INFRA Global",
    category: "Finance",
    description: "Multi-currency stablecoins pegged to USD, EUR, GBP and more.",
    art: "linear-gradient(160deg,#d9d3c7 0%,#a79f93 45%,#5a5a64 100%)",
    image: "/images/figma/20-10175-3ed60.png",
  },
  {
    id: "infra-reaed",
    projectId: "662ee2b5-3fc1-4d48-8125-aa2e47925c13",
    replacementProjectId: "0caa794e-1160-40be-97a4-96e3fb1049dd",
    name: "INFRA reAED",
    category: "Finance",
    description: "UAE Dirham stablecoin, live for real-world payments.",
    status: "Live",
    art: "linear-gradient(160deg,#f0c98a 0%,#c98f4a 50%,#6d4a2a 100%)",
    image: "/images/figma/20-10176-b2e5d.png",
  },
  {
    id: "reid",
    projectId: "f0e5fac9-540a-4efd-b85a-3b877785389d",
    replacementProjectId: "fc1c930c-df85-4b48-9905-1259c734a16e",
    name: "reID",
    category: "Identity",
    description: "Digital identity and merchant passport for the ecosystem.",
    status: "Live",
    art: "linear-gradient(160deg,#f6efe4 0%,#e0a066 55%,#a15a2c 100%)",
    image: "/images/figma/20-10177-0c6b9.png",
  },
  {
    id: "remarketplace",
    projectId: "e0e0ef54-206b-4bd4-bc83-609bcb43a193",
    replacementProjectId: "d034a3ee-6439-46e6-83d9-90d6da94034e",
    name: "reMARKETPLACE",
    category: "Services",
    description: "White-label marketplace, ready to launch in weeks.",
    art: "linear-gradient(160deg,#8aa7c4 0%,#2b4766 55%,#0f1d2e 100%)",
    image: "/images/figma/20-10178-01dc6.png",
  },
];

export function productForProject(id: string) {
  return products.find(product => product.projectId === id || product.replacementProjectId === id);
}

/** The original remains featured until retirement. Only a published catalogue record can replace it. */
export function featuredProject(product: Product | undefined, rows: readonly LandingProject[] | null) {
  if (!product || !rows) return null;
  const published = (id: string) => rows.find(row => row.project.id === id && row.project.status === "PUBLISHED");
  const original = published(product.projectId);
  if (original) return original;
  const replacement = published(product.replacementProjectId);
  return replacement?.project.businessOpportunity === true && replacement.project.replacesProjectId === product.projectId ? replacement : null;
}

export function orderedCatalogue(rows: readonly LandingProject[]) {
  const featured = products.flatMap(product => {
    const row = featuredProject(product, rows);
    return row ? [row] : [];
  });
  return [...featured, ...rows.filter(row => row.project.status === "PUBLISHED" && !productForProject(row.project.id))];
}

export function projectCategory(row: LandingProject): Category | null {
  const value = row.project.category;
  return value && (categories as readonly string[]).includes(value) ? (value as Category) : (productForProject(row.project.id)?.category ?? null);
}
