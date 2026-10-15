export type Category = "Finance" | "Real-world assets" | "Identity" | "Services" | "Infrastructure";

export interface Product {
  id: string;
  name: string;
  category: Category;
  description: string;
  /** Last month's revenue in USD, null when the product has not launched. */
  revenue: number | null;
  /** Yearly pace as a percentage, null when not launched. */
  yieldPace: number | null;
  /** Share of all shares sold, 0-100. */
  sold: number;
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
    name: "INFRA Global",
    category: "Finance",
    description: "Multi-currency stablecoins pegged to USD, EUR, GBP and more.",
    revenue: 11200,
    yieldPace: 7.3,
    sold: 37,
    art: "linear-gradient(160deg,#d9d3c7 0%,#a79f93 45%,#5a5a64 100%)",
    image: "/images/figma/20-10175-3ed60.png",
  },
  {
    id: "infra-reaed",
    name: "INFRA reAED",
    category: "Finance",
    description: "UAE Dirham stablecoin, live for real-world payments.",
    revenue: 22400,
    yieldPace: 6.5,
    sold: 83,
    status: "Live",
    art: "linear-gradient(160deg,#f0c98a 0%,#c98f4a 50%,#6d4a2a 100%)",
    image: "/images/figma/20-10176-b2e5d.png",
  },
  {
    id: "reid",
    name: "reID",
    category: "Identity",
    description: "Digital identity and merchant passport for the ecosystem.",
    revenue: 12300,
    yieldPace: 6.5,
    sold: 76,
    status: "Live",
    art: "linear-gradient(160deg,#f6efe4 0%,#e0a066 55%,#a15a2c 100%)",
    image: "/images/figma/20-10177-0c6b9.png",
  },
  {
    id: "remarketplace",
    name: "reMARKETPLACE",
    category: "Services",
    description: "White-label marketplace, ready to launch in weeks.",
    revenue: 4200,
    yieldPace: 6.9,
    sold: 37,
    art: "linear-gradient(160deg,#8aa7c4 0%,#2b4766 55%,#0f1d2e 100%)",
    image: "/images/figma/20-10178-01dc6.png",
  },
  {
    id: "reinvest",
    name: "reINVEST",
    category: "Real-world assets",
    description: "Fractional, tokenized real-world assets, fully on-chain.",
    revenue: 7800,
    yieldPace: 6.0,
    sold: 39,
    art: "linear-gradient(160deg,#d9a35c 0%,#9a6a3a 50%,#3e5a78 100%)",
    image: "/images/figma/20-10179-49ef6.png",
  },
  {
    id: "fractionaire",
    name: "Fractionaire",
    category: "Real-world assets",
    description: "Fractional ownership of real estate and other real assets.",
    revenue: 19900,
    yieldPace: 7.2,
    sold: 83,
    status: "Live",
    art: "linear-gradient(160deg,#c9d7e6 0%,#7a8794 55%,#2c2c30 100%)",
    image: "/images/figma/20-10180-e449b.png",
  },
  {
    id: "cet",
    name: "CET",
    category: "Real-world assets",
    description: "Sell real estate in crypto with escrow and payouts built in.",
    revenue: 5500,
    yieldPace: 6.7,
    sold: 39,
    art: "linear-gradient(170deg,#4b6a9b 0%,#e4975a 55%,#2a2a3a 100%)",
    image: "/images/figma/20-10181-8b2ed.png",
  },
  {
    id: "redomain",
    name: "reDOMAIN",
    category: "Infrastructure",
    description: "Our own hosting, servers and domains.",
    revenue: 5000,
    yieldPace: 4.8,
    sold: 63,
    art: "linear-gradient(160deg,#0b1220 0%,#0b1220 100%)",
  },
  {
    id: "tunetailor",
    name: "TuneTailor",
    category: "Services",
    description: "Custom AI songs for personal and business moments.",
    revenue: 3800,
    yieldPace: 4.1,
    sold: 75,
    status: "Live",
    art: "linear-gradient(160deg,#0b1220 0%,#0b1220 100%)",
  },
  {
    id: "prohandover",
    name: "Prohandover",
    category: "Services",
    description: "Owners, tenants and managers on one property platform.",
    revenue: 2600,
    yieldPace: 5.1,
    sold: 31,
    art: "linear-gradient(160deg,#d9dee5 0%,#d9dee5 100%)",
  },
  {
    id: "hostick",
    name: "Hostick",
    category: "Services",
    description: "Event check-ins, guest lists and CRM in one place.",
    revenue: 1700,
    yieldPace: 4.7,
    sold: 29,
    art: "linear-gradient(160deg,#d9dee5 0%,#d9dee5 100%)",
  },
  {
    id: "idos",
    name: "IDOS",
    category: "Identity",
    description: "Operating system for digital identity.",
    revenue: null,
    yieldPace: null,
    sold: 0,
    status: "Coming",
    art: "linear-gradient(160deg,#0b1220 0%,#0b1220 100%)",
  },
];

/** Total shares issued per product; used by the earnings calculator. */
export const TOTAL_SHARES = 40000;
export const SHARE_PRICE = 100;
export const MIN_SHARES = 20;

export function formatCompactUsd(value: number | null): string {
  if (value === null) return "Soon";
  return `$${(value / 1000).toFixed(1)}k`;
}
