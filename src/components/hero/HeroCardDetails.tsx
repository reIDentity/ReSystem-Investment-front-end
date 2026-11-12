import "./HeroCardDetails.css";

type HeroValues = {
  maximum: string;
  remaining: string;
  priceNative: string;
  priceUsdt: string;
};

/** Keep the artwork's panel size while allowing live values their own aligned line. */
export function HeroCardStats({ values }: { values: HeroValues }) {
  const stats = [
    { label: ["Total", "fractions"], value: values.maximum, unit: "fractions" },
    { label: ["Available", "fractions"], value: values.remaining, unit: "fractions" },
    { label: ["Price per", "fraction"], value: values.priceNative, unit: "reAED" },
    { label: ["Price per", "fraction"], value: values.priceUsdt, unit: "USDT" },
  ];

  return (
    <dl className="hero-card-stats">
      {stats.map(({ label, value, unit }) => (
        <div className="hero-card-stat" key={`${label.join(" ")}-${unit}`}>
          <dt><span>{label[0]}</span>{" "}<span>{label[1]}</span></dt>
          <dd>
            <strong title={value} style={value.length > 9 ? { fontSize: `${120 / value.length}px` } : undefined}>{value}</strong>{" "}
            <span>{unit}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

const headings = ["Why Invest", "Core Features", "How rewards work"];
const features = {
  reid: [
    [
      ["Recurring Revenue", "Identity subscriptions & enterprise licensing."],
      ["Enterprise Demand", "Growing need for secure digital identity."],
      ["Global Adoption", "Built for businesses across industries."],
    ],
    [
      ["Universal ID", "One identity for every app."],
      ["Privacy First", "Connect with reID; approve each transaction."],
      ["Rewards Network", "Earn from future funded allocations."],
    ],
    [
      ["More Users", "Only funded revenue is allocated."],
      ["Enterprise Clients", "Claims depend on allocated rewards."],
      ["Network Effects", "No future returns are guaranteed."],
    ],
  ],
  fractionaire: [
    [
      ["Growing RWA Market", "Demand for tokenised assets is growing."],
      ["Marketplace Revenue", "Earn from every asset trade and listing."],
      ["Global Expansion", "Built to scale across global markets."],
    ],
    [
      ["Fractional Ownership", "Own valuable assets from small investments."],
      ["Smart Contracts", "Secure, automated ownership and settlements."],
      ["Global Marketplace", "Secure, automated ownership and settlements."],
    ],
    [
      ["More Assets", "Every asset attracts more investors."],
      ["Higher Trading", "Every asset attracts more investors."],
      ["Network Growth", "Only funded revenue is allocated to holders."],
    ],
  ],
  infra: [
    [
      ["Real Demand", "Revenue is allocated only from funded deposits."],
      ["Enterprise Coins", "Companies launch stablecoins. INFRA captures fees."],
      ["Regulatory", "INFRA UAT blockchain network, chain ID 15324."],
    ],
    [
      ["Stable", "Pay with native reAED or USDT on INFRA."],
      ["Predictable", "Review the current network fee before approval."],
      ["Composable", "Custom stablecoins. Enterprise control."],
    ],
    [
      ["Volume", "Future revenue depends on actual project funding."],
      ["Network", "Rewards require actual funded deposits."],
      ["Liquidity", "Resale needs a willing buyer."],
    ],
  ],
} as const;

export function HeroCardFeatures({ project }: { project: keyof typeof features }) {
  return (
    <div className="hero-card-features">
      {features[project].map((items, column) => (
        <div className="hero-card-feature-column" key={headings[column]}>
          <p className="hero-card-feature-heading">{headings[column]}</p>
          {items.map(([title, description]) => (
            <div className="hero-card-feature" key={title}>
              <p className="hero-card-feature-title">{title}</p>
              <p className="hero-card-feature-description">{description}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
