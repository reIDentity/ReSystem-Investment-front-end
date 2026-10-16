import { Container } from "./Container";
import { Reveal } from "./Reveal";

const stats = [
  { value: <span>INFRA</span>, label: "On-chain settlement" },
  { value: <span>reID</span>, label: "Separate wallet approval" },
  { value: <span>Two assets</span>, label: "Native reAED and USDT" },
  { value: <span>Whole units</span>, label: "Transferable project fractions" },
  { value: <span>Funded</span>, label: "Rewards from actual deposits" },
];

export function Stats() {
  return (
    <section className="stats-section mt-8">
      <Container>
        <Reveal variant="scale">
          <dl
            data-spotlight
            className="stats-panel relative grid grid-cols-2 gap-x-6 gap-y-6 overflow-hidden rounded-2xl bg-panel px-6 py-8 text-white [--spot-size:520px] [--spot:rgba(0,145,255,0.18)] sm:px-10 md:grid-cols-5"
          >
            {stats.map((s, i) => (
              <Reveal key={s.label} variant="blur" delay={150 + i * 70} className="group">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <p className="font-sans text-[28px] font-bold tracking-tight transition-colors duration-500">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[14px] text-[#e0e0e0]">{s.label}</p>
                </dd>
              </Reveal>
            ))}
          </dl>
        </Reveal>
      </Container>
    </section>
  );
}
