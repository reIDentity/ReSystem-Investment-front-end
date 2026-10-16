"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { RollingNumber } from "./RollingNumber";
import { useInView } from "@/hooks/motion";
import { MIN_SHARES, products, SHARE_PRICE, TOTAL_SHARES } from "@/data/products";

const investable = products.filter((p) => p.revenue !== null);
const MIN_AMOUNT = 2000;
const MAX_AMOUNT = 100000;
const presets = [2000, 10000, 25000, 50000];

const usd = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });

export function Calculator() {
  const [productId, setProductId] = useState("fractionaire");
  const [amount, setAmount] = useState(10000);

  const product = investable.find((p) => p.id === productId) ?? investable[0];

  const result = useMemo(() => {
    const shares = Math.max(Math.floor(amount / SHARE_PRICE), MIN_SHARES);
    const soldShares = (TOTAL_SHARES * product.sold) / 100;
    const poolShare = shares / soldShares;
    const monthly = (product.revenue ?? 0) * poolShare;
    const yearly = monthly * 12;
    return { shares, poolShare, monthly, yearly, pace: (yearly / (shares * SHARE_PRICE)) * 100 };
  }, [amount, product]);

  const fill = ((amount - MIN_AMOUNT) / (MAX_AMOUNT - MIN_AMOUNT)) * 100;
  const [ref, shown] = useInView<HTMLDivElement>({ threshold: 0.25 });

  return (
    <section id="how-much" className="mt-20 scroll-mt-24">
      <Container>
        <Reveal>
        <div ref={ref} className="calculator-panel grid gap-8 rounded-[20px] border border-line bg-[#efefef] p-4 sm:p-5 lg:grid-cols-[1fr_0.95fr]">
          <div className="calculator-inputs flex flex-col p-2 sm:p-4">
            <h2 className="text-[30px] font-semibold tracking-tight text-ink sm:text-[34px]">Illustrative allocation calculator</h2>
            <p className="mt-4 max-w-[430px] text-[19px] leading-snug text-ink-soft">
              Explore a hypothetical allocation using example figures. This illustration assumes $100 per fraction and 20 minimum fractions;
              these are not current project prices, revenue records or an investment offer.
            </p>

            <div className="calculator-products mt-10 rounded-2xl bg-white p-5">
              <p className="font-display text-[13px] font-bold text-ink">Product</p>
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Product">
                {investable.map((p) => (
                  <button
                    key={p.id}
                    role="radio"
                    aria-checked={p.id === productId}
                    onClick={() => setProductId(p.id)}
                    className={`rounded-full px-3.5 py-1.5 font-display text-[13px] font-medium transition-[background-color,color,box-shadow,transform] duration-500 ease-[var(--ease-spring)] active:scale-95 ${
                      p.id === productId ? "bg-brand text-white" : "bg-[#eef0f4] text-ink-soft hover:bg-[#e3e6ec]"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="calculator-amount mt-4 rounded-2xl bg-white p-5">
              <div className="flex items-baseline justify-between">
                <label htmlFor="amount" className="font-display text-[13px] font-bold text-ink">
                  Amount
                </label>
                <output htmlFor="amount" className="font-display text-[15px] font-bold text-brand">
                  <RollingNumber value={usd(amount)} />
                </output>
              </div>
              <input
                id="amount"
                type="range"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step={SHARE_PRICE}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                style={{ ["--fill" as string]: `${fill}%` }}
                className="range-lime mt-4 w-full"
              />
              <div className="mt-2 flex justify-between text-[11px] text-muted">
                <span>{usd(MIN_AMOUNT)}</span>
                <span>{usd(MAX_AMOUNT)}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {presets.map((v) => (
                  <button
                    key={v}
                    aria-pressed={amount === v}
                    onClick={() => setAmount(v)}
                    className={`rounded-full py-2.5 font-display text-[13px] font-semibold transition-[background-color,color,box-shadow,transform] duration-300 active:scale-95 ${
                      amount === v ? "bg-brand text-white" : "bg-[#eef0f4] text-ink-soft hover:bg-[#e3e6ec]"
                    }`}
                  >
                    {usd(v)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="calculator-results flex flex-col rounded-2xl bg-[#1f1b19] p-4 text-white sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="You get">
                <RollingNumber value={result.shares.toLocaleString("en-US")} ready={shown} /> shares
              </Stat>
              <Stat label="Illustrative pool share">
                <RollingNumber value={`${(result.poolShare * 100).toFixed(3)}%`} ready={shown} />
              </Stat>
              <Stat label="Est. per month" accent>
                <RollingNumber value={usd(result.monthly, 2)} ready={shown} />
              </Stat>
              <Stat label="Est. per year" accent>
                <RollingNumber value={usd(result.yearly, 2)} ready={shown} />
              </Stat>
            </div>

            <div className="calculator-chart mt-3 flex flex-1 flex-col rounded-2xl bg-white p-4 text-ink">
              <div className="flex items-center justify-between">
                <p className="font-display text-[12px] font-bold">Hypothetical earnings over 12 months</p>
                <p className="text-[11px] text-muted">
                  <RollingNumber value={`${result.pace.toFixed(1)}%`} ready={shown} /> yearly in this example
                </p>
              </div>
              <div className="calculator-bars mt-3 flex min-h-[170px] flex-1 items-end gap-1.5" role="img" aria-label="Projected earnings, growing each month">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    className="flex-1 origin-bottom rounded-t-md transition-[height,filter] duration-700 ease-[var(--ease-spring)] hover:brightness-90"
                    style={{
                      height: shown ? `${[10,19,29,39,48,58,68,77,87,97,106,116][i]}px` : "0%",
                      transitionDelay: `${i * 25}ms`,
                      background: i === 11 ? "linear-gradient(#0091ff,#91d0ff)" : "rgba(0,145,255,0.37)",
                    }}
                    title={`Month ${i + 1}: ${usd(result.monthly * (i + 1), 2)} cumulative`}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted">
                <span>Month 1</span>
                <span>Month 12</span>
              </div>
            </div>

            <a
              href="/invest"
              className="calculator-invest btn btn-shine mt-3 block rounded-full bg-lime py-3.5 text-center font-display text-[14px] font-bold text-ink hover:shadow-[0_10px_24px_-10px_rgba(0,145,255,0.9)]"
            >
              View actual project prices
            </a>
            <p className="calculator-disclaimer mt-3 text-[11px] leading-snug text-white/70">
              Example values are illustrative and do not represent actual project revenue, ownership or yield. Published project economics and
              real funded allocations are shown in the investor app. No future return or liquidity is guaranteed.
            </p>
          </div>
        </div>
        </Reveal>
      </Container>
    </section>
  );
}

function Stat({ label, children, accent = false }: { label: string; children: ReactNode; accent?: boolean }) {
  return (
    <div className={`calculator-stat rounded-2xl px-4 py-3 ${accent ? "bg-mint text-forest" : "bg-white text-ink"}`}>
      <p className={`text-[12px] ${accent ? "text-forest/80" : "text-muted"}`}>{label}</p>
      <p className="mt-0.5 font-display text-[22px] leading-tight font-extrabold tabular-nums">{children}</p>
    </div>
  );
}
