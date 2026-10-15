import type { CSSProperties } from "react";
import Image from "next/image";
import { Container } from "./Container";
import { HeroVisual } from "./HeroVisual";
import { SplitWords } from "./SplitWords";

const perks = ["From $2,000", "No lock period", "Revenue visible on-chain"];

export function Hero() {
  return (
    <section className="hero-section pt-10 sm:pt-14">
      <Container>
        <h1 className="hero-heading max-w-[1000px] text-[40px] leading-[1.15] font-semibold tracking-[-0.02em] text-ink sm:text-[60px] sm:leading-[1.2]">
          <SplitWords text="Own a share of the products that" />{" "}
          <span className="text-[#9c9c9c]">
            <SplitWords text="earn real revenue." start={7} />
          </span>
        </h1>
        <p style={{ "--d": "220ms" } as CSSProperties} className="hero-description enter mt-6 max-w-[930px] text-lg leading-[1.45] text-ink-soft sm:text-[22px]">
          Buy shares in reSystem products like Fractionaire, reID and INFRA reAED. Every dollar each product earns goes
          to its shareholders, in proportion to the shares they hold. Watch it live on-chain and claim whenever you like.
        </p>
        <ul className="hero-perks mt-5 flex flex-wrap gap-x-8 gap-y-2 text-[15px] text-ink-soft">
          {perks.map((p, i) => (
            <li key={p} style={{ "--d": `${300 + i * 60}ms` } as CSSProperties} className="enter group flex items-center gap-2">
              <Image src={`/images/figma/32-11707-${["45310", "08df5", "84aaf"][i]}.svg`} alt="" width={16.839} height={12.623} />
              {p}
            </li>
          ))}
        </ul>

        <HeroVisual />

        <div style={{ "--d": "420ms" } as CSSProperties} className="hero-actions enter mt-8 flex flex-wrap gap-3">
          <a
            href="#where"
            className="hero-primary btn btn-shine group inline-flex items-center gap-2 rounded-full bg-lime px-7 py-3.5 font-display text-[17px] font-semibold text-ink hover:shadow-[0_12px_28px_-12px_rgba(0,145,255,0.75)]"
          >
            Explore products
          </a>
          <a
            href="#how-much"
            className="hero-secondary btn rounded-full border-[1.5px] border-ink bg-white px-7 py-3.5 font-display text-[17px] font-semibold text-ink hover:bg-ink hover:text-white"
          >
            Calculate your earnings
          </a>
        </div>
      </Container>
    </section>
  );
}
