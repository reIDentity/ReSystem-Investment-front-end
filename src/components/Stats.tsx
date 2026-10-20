import type { ReactNode } from "react";
import { getHomeStats } from "@/lib/platform/home-stats";
import { Container } from "./Container";
import { CountUp } from "./CountUp";
import { Reveal } from "./Reveal";

const unavailable = <span aria-label="Unavailable">—</span>;

/** Fewest decimals (max 6) that show the value exactly, e.g. 0.001 -> 3. */
function places(value: number) {
  for (let d = 0; d < 6; d++) if (Math.abs(Math.round(value * 10 ** d) - value * 10 ** d) < 1e-9) return d;
  return 6;
}

/** Thousands keep the authored "$96.4k" style; smaller amounts show cents, or the exact unit price. */
function money(value: number | null, exact = false): ReactNode {
  if (value === null) return unavailable;
  if (value >= 1000) return <CountUp to={value / 1000} prefix="$" suffix="k" decimals={1} />;
  return <CountUp to={value} prefix="$" decimals={exact ? places(value) : value % 1 === 0 ? 0 : 2} />;
}

export async function Stats() {
  const live = await getHomeStats();
  const stats = [
    { value: live.openProducts === null ? unavailable : <CountUp to={live.openProducts} />, label: "Products open to investors" },
    { value: money(live.revenueLast30DaysUsd), label: "Revenue paid in last month" },
    { value: live.soldPercent === null ? unavailable : <CountUp to={live.soldPercent >= 1 ? Math.round(live.soldPercent) : live.soldPercent} suffix="%" decimals={live.soldPercent >= 1 || live.soldPercent === 0 ? 0 : 2} />, label: "Of all shares already sold" },
    { value: money(live.minimumInvestmentUsd, true), label: "Minimum investment" },
    { value: <span>0 days</span>, label: "Lock period" },
  ];
  return (
    <section className="stats-section mt-8">
      <Container>
        <Reveal variant="scale">
          <dl
            data-spotlight
            className="stats-panel relative grid grid-cols-2 gap-x-6 gap-y-6 overflow-hidden rounded-2xl bg-panel px-6 py-6 text-white [--spot-size:520px] [--spot:rgba(0,145,255,0.18)] sm:px-10 md:grid-cols-3 lg:grid-cols-5 lg:gap-x-[53px] lg:px-[43px] lg:py-[19px]"
          >
            {stats.map((s, i) => (
              <Reveal key={s.label} variant="blur" delay={150 + i * 70} className="group lg:pl-2 lg:pt-1">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <p className="font-sans text-[28px] leading-9 font-bold tracking-[-0.56px] transition-colors duration-500">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[14px] leading-[18px] text-[#e0e0e0]">{s.label}</p>
                </dd>
              </Reveal>
            ))}
          </dl>
        </Reveal>
      </Container>
    </section>
  );
}
