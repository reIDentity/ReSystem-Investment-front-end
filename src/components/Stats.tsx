import { Container } from "./Container";
import { CountUp } from "./CountUp";
import { Reveal } from "./Reveal";

const stats = [
  { value: <CountUp to={12} />, label: "Products open to investors" },
  { value: <CountUp to={96.4} prefix="$" suffix="k" decimals={1} />, label: "Revenue paid in last month" },
  { value: <CountUp to={51} suffix="%" />, label: "Of all shares already sold" },
  { value: <CountUp to={2000} prefix="$" />, label: "Minimum investment" },
  { value: <span>0 days</span>, label: "Lock period" },
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
