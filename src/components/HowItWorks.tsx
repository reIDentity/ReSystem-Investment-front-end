import Image from "next/image";
import { Container } from "./Container";
import { Reveal } from "./Reveal";

const steps = [
  {
    n: "01",
    title: "Sign in with reID",
    body: "Scan the code with the reID app and approve. No passwords, and you're verified once for every product.",
  },
  {
    n: "02",
    title: "Deposit reAED or USDT",
    body: "Send stablecoins to your wallet address on INFRA. Funds are ready to invest within seconds.",
  },
  {
    n: "03",
    title: "Buy product shares",
    body: "Pick products, choose how many shares, and confirm with reID. Shares land in your wallet and start earning straight away.",
  },
  {
    n: "04",
    title: "Claim or withdraw",
    body: "Watch earnings grow as revenue comes in. Claim to your wallet, buy more, or withdraw to any INFRA address.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mt-12 scroll-mt-24">
      <Container>
        <Reveal>
        <div
          className="how-panel relative overflow-hidden rounded-[20px] p-6 text-white sm:p-10"
        >
          <Image src="/images/figma/32-11494-1af7f.png" alt="" fill sizes="(max-width:1352px) 100vw, 1352px" className="how-background object-fill" />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent to-black/85" />
          <Reveal variant="blur" delay={80}>
            <h2 className="relative text-[34px] font-normal tracking-tight sm:text-[44px]">How it works</h2>
          </Reveal>
          <ol className="relative mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.n} delay={150 + i * 130} className="group relative">
                <span className="inline-block rounded-md bg-white px-2.5 py-1 font-display text-[11px] font-bold text-ink transition-colors duration-300 group-hover:bg-brand/15">
                  STEP {s.n}
                </span>
                <h3 className="mt-5 font-display text-[19px] font-bold">{s.title}</h3>
                <p className="mt-2 max-w-[290px] text-[14px] leading-snug text-white/80">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
        </Reveal>
      </Container>
    </section>
  );
}
