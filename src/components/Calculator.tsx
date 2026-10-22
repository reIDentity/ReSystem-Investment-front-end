"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { RollingNumber } from "./RollingNumber";
import { useInView } from "@/hooks/motion";
import { useLanding } from "./LandingData";
import { calculatorQuote, displayMoney } from "@/lib/platform/landing-data";
import { revenueChart } from "@/lib/platform/revenue-values";

export function Calculator() {
  const { projects } = useLanding();
  const investable = projects?.filter(p => p.stats.sale === "Open") ?? [];
  const [productId, setProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const product = investable.find(p => p.project.id === productId) ?? investable[0] ?? null;
  const max = product ? Number(BigInt(product.chain!.remainingSupply) > BigInt(Number.MAX_SAFE_INTEGER) ? BigInt(Number.MAX_SAFE_INTEGER) : BigInt(product.chain!.remainingSupply)) : 1;
  const amount = Math.min(Math.max(quantity, 1), max);
  const result = calculatorQuote(product, amount);
  const presetQuantities = [1, ...[0.1, 0.25, 0.5].map(v => Math.max(1, Math.floor(max * v)))];
  const fill = max > 1 ? (amount - 1) / (max - 1) * 100 : 0;
  const chart = product?.series ? revenueChart(product.series).points.slice(-12) : [];
  const [ref, shown] = useInView<HTMLDivElement>({ threshold: 0.25 });

  /** Bumps once the inputs settle (not on every slider step), so the results pulse and the bars ripple. */
  const [settled, setSettled] = useState(0);
  const inputs = `${productId}:${amount}`;
  const initial = useRef(inputs);
  useEffect(() => {
    if (inputs === initial.current) return;
    const timer = setTimeout(() => setSettled((n) => n + 1), 140);
    return () => clearTimeout(timer);
  }, [inputs]);

  return (
    <section id="how-much" className="mt-20 scroll-mt-24">
      <Container>
        <Reveal>
        <div ref={ref} className="calculator-panel grid gap-8 rounded-[20px] border border-line bg-[#efefef] p-4 sm:p-5 lg:grid-cols-[1fr_0.95fr]">
          <div className="calculator-inputs flex flex-col p-2 sm:p-4">
            <h2 className="text-[30px] font-semibold tracking-tight text-ink sm:text-[34px]">How much should you invest?</h2>
            <p className="mt-4 max-w-[430px] text-[19px] leading-snug text-ink-soft" aria-describedby="calculator-data-note">
              Pick a published product and whole fractions to see its current price, ownership share and confirmed revenue history.
            </p>

            <div className="calculator-products mt-10 rounded-2xl bg-white p-5">
              <p className="font-display text-[13px] font-bold text-ink">Product</p>
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Product">
                {investable.map(({ project: p }) => (
                  <button
                    key={p.id}
                    role="radio"
                    aria-checked={p.id === product?.project.id}
                    onClick={() => { setProductId(p.id); setQuantity(1); }}
                    title={p.title}
                    className={`max-w-full truncate rounded-full px-3.5 py-1.5 font-display text-[13px] font-medium transition-[background-color,color,box-shadow,transform] duration-500 ease-[var(--ease-spring)] active:scale-95 ${
                      p.id === product?.project.id ? "bg-brand text-white" : "bg-[#eef0f4] text-ink-soft hover:bg-[#e3e6ec]"
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="calculator-amount mt-4 rounded-2xl bg-white p-5">
              <div className="flex items-baseline justify-between">
                <label htmlFor="amount" className="font-display text-[13px] font-bold text-ink">
                  Fractions
                </label>
                <output htmlFor="amount" className="font-display text-[15px] font-bold text-brand">
                  <RollingNumber value={result?.cost ?? "—"} />
                </output>
              </div>
              <input
                id="amount"
                type="range"
                min={1}
                max={max}
                step={1}
                value={amount}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={!product}
                aria-valuetext={result ? `${result.quantity} fractions for ${result.cost} USDT` : "Unavailable"}
                style={{ ["--fill" as string]: `${fill}%` }}
                className="range-lime mt-4 w-full"
              />
              <div className="mt-2 flex justify-between text-[11px] text-muted">
                <span>{calculatorQuote(product, 1)?.cost ?? "—"}</span>
                <span>{calculatorQuote(product, max)?.cost ?? "—"}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {presetQuantities.map((v, index) => (
                  <button
                    key={index}
                    aria-pressed={amount === v}
                    onClick={() => setQuantity(v)}
                    disabled={!product}
                    className={`rounded-full py-2.5 font-display text-[13px] font-semibold transition-[background-color,color,box-shadow,transform] duration-300 active:scale-95 ${
                      amount === v ? "bg-brand text-white" : "bg-[#eef0f4] text-ink-soft hover:bg-[#e3e6ec]"
                    }`}
                  >
                    {calculatorQuote(product, v)?.cost ?? "—"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="calculator-results flex flex-col rounded-2xl bg-[#1f1b19] p-4 text-white sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="You get" pulse={settled}>
                <RollingNumber value={result ? Number(result.quantity).toLocaleString("en-US") : "—"} ready={shown} /> shares
              </Stat>
              <Stat label="Your share of the project" pulse={settled}>
                <RollingNumber value={result?.ownership ?? "—"} ready={shown} />
              </Stat>
              <Stat label="Project revenue · 30d" accent pulse={settled}>
                <RollingNumber value={displayMoney(product?.last30 ?? null)} ready={shown} />
              </Stat>
              <Stat label="Project funded · all time" accent pulse={settled}>
                <RollingNumber value={displayMoney(product?.funded ?? null)} ready={shown} />
              </Stat>
            </div>

            <div className="calculator-chart mt-3 flex flex-1 flex-col rounded-2xl bg-white p-4 text-ink">
              <div className="flex items-center justify-between">
                <p className="font-display text-[12px] font-bold">Confirmed revenue · 12 days</p>
                <p className="text-[11px] text-muted">
                  {product?.stats.yieldPace ?? "—"} indicative yield
                </p>
              </div>
              <div className="calculator-bars mt-3 flex min-h-[170px] flex-1 items-end gap-1.5" role="img" aria-label={chart.length ? "Confirmed daily project revenue; USDT equivalent" : "Confirmed revenue history unavailable"} aria-describedby="calculator-data-note">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={settled ? `${i}-${settled}` : i}
                    data-wave={settled ? "" : undefined}
                    className="calc-bar flex-1 origin-bottom rounded-t-md transition-[height,filter] duration-700 ease-[var(--ease-spring)] hover:brightness-90"
                    style={{
                      "--i": i,
                      height: shown ? chart[i]?.height ?? "0%" : "0%",
                      transitionDelay: `${i * 25}ms`,
                      background: i === 11 ? "linear-gradient(#0091ff,#91d0ff)" : "rgba(0,145,255,0.37)",
                    } as CSSProperties}
                    title={chart[i] ? `${chart[i].date}: ${chart[i].display}` : "Revenue unavailable"}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted">
                <span>{chart[0]?.date ?? "—"}</span>
                <span>{chart.at(-1)?.date ?? "—"}</span>
              </div>
            </div>

            <a
              href={result?.href ?? "/invest/explore"}
              title="Review the current exact quote in the investor app before approving a purchase."
              aria-describedby="calculator-data-note"
              data-magnetic
              className="calculator-invest truncate btn btn-shine mt-3 block rounded-full bg-lime py-3.5 text-center font-display text-[14px] font-bold text-ink hover:shadow-[0_10px_24px_-10px_rgba(0,145,255,0.9)]"
            >
              {result ? `Invest ${result.cost} in ${product!.project.title}` : "Explore published projects"}
            </a>
            <p id="calculator-data-note" className="calculator-disclaimer mt-3 text-[11px] leading-snug text-white/70">
              Prices are in USDT, excluding network fees. Revenue is historical project funding, not your future earnings. New fractions earn only from future allocations. No returns are guaranteed.
            </p>
          </div>
        </div>
        </Reveal>
      </Container>
    </section>
  );
}

function Stat({ label, children, accent = false, pulse = 0 }: { label: string; children: ReactNode; accent?: boolean; pulse?: number }) {
  return (
    <div className={`calculator-stat relative rounded-2xl px-4 py-3 ${accent ? "bg-mint text-forest" : "bg-white text-ink"}`}>
      {pulse > 0 && <span key={pulse} className="stat-pulse" aria-hidden />}
      <p className={`text-[12px] ${accent ? "text-forest/80" : "text-muted"}`}>{label}</p>
      <p className="mt-0.5 font-display text-[22px] leading-tight font-extrabold tabular-nums">{children}</p>
    </div>
  );
}
