export type Category = "Finance" | "Real-world assets" | "Identity" | "Services" | "Infrastructure";

export interface Product {
  id: string;
  /** Explicit platform record, independent of the marketing slug or project title. */
  projectId?: string;
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
    projectId: "3995355b-8601-49cb-84bf-06bea42db23e",
    name: "INFRA Global",
    category: "Finance",
    description: "Multi-currency stablecoins pegged to USD, EUR, GBP and more.",
    art: "linear-gradient(160deg,#d9d3c7 0%,#a79f93 45%,#5a5a64 100%)",
    image: "/images/figma/20-10175-3ed60.png",
  },
  {
    id: "infra-reaed",
    projectId: "b6604ab7-7557-48f4-a7ca-9c83abe02347",
    name: "INFRA reAED",
    category: "Finance",
    description: "UAE Dirham stablecoin, live for real-world payments.",
    status: "Live",
    art: "linear-gradient(160deg,#f0c98a 0%,#c98f4a 50%,#6d4a2a 100%)",
    image: "/images/figma/20-10176-b2e5d.png",
  },
  {
    id: "reid",
    projectId: "4fe22a83-2b4e-44ee-9bbb-c43168baf465",
    name: "reID",
    category: "Identity",
    description: "Digital identity and merchant passport for the ecosystem.",
    status: "Live",
    art: "linear-gradient(160deg,#f6efe4 0%,#e0a066 55%,#a15a2c 100%)",
    image: "/images/figma/20-10177-0c6b9.png",
  },
  {
    id: "remarketplace",
    projectId: "1a0b121f-198f-43ab-af16-681559c61dcd",
    name: "reMARKETPLACE",
    category: "Services",
    description: "White-label marketplace, ready to launch in weeks.",
    art: "linear-gradient(160deg,#8aa7c4 0%,#2b4766 55%,#0f1d2e 100%)",
    image: "/images/figma/20-10178-01dc6.png",
  },
];
