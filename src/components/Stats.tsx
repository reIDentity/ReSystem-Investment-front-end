"use client";
import { useLanding } from "./LandingData";
import { displayMoney } from "@/lib/platform/landing-data";
import { Container } from "./Container";
import { Reveal } from "./Reveal";

export function Stats() {
  const { totals } = useLanding();
  const stats = [
    { value: totals.open ?? "—", label: "Products open to investors" },
    { value: displayMoney(totals.last30), label: "Revenue funded in last 30 days" },
    { value: totals.sold, label: "Of all fractions already issued" },
    { value: totals.minimum, label: "Minimum investment · USDT" },
    { value: "0 days", label: "Fraction transfer lock period" },
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
