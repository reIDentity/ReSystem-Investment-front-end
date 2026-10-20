"use client";

import { useState } from "react";
import Image from "next/image";
import { Container } from "./Container";
import { Reveal } from "./Reveal";

const faqs = [
  {
    q: "How are my earnings calculated?",
    a: "Authorized project operators deposit actual revenue on INFRA. Each new allocation is shared by the issued fractions held at funding time. For example, a funded pool of 1,000 USDT and 1% participation allocates 10 USDT before atomic-unit rounding. Historical allocations stay with their original holder after a transfer.",
  },
  {
    q: "What is the minimum and maximum?",
    a: "The minimum is $2,000 per product, which is 20 shares at $100 each. There is no fixed maximum, but a product's available shares are limited and may sell out.",
  },
  {
    q: "Can I take my money out?",
    a: "There is no lock period. You can claim earnings to your wallet at any time and withdraw to any INFRA address.",
  },
  {
    q: "How do I pay?",
    a: "Deposit reAED or USDT to your wallet address on INFRA, then confirm each purchase with reID.",
  },
  {
    q: "Are returns guaranteed?",
    a: "No. Earnings depend on what each product's customers pay. Revenue changes month to month, so actual earnings can be higher or lower than any estimate.",
  },
  {
    q: "Why do I need reID?",
    a: "reID verifies you once for every product, so you can sign in without passwords and confirm purchases from your phone.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mt-4 scroll-mt-24">
      <Container>
        <div className="faq-layout grid gap-3 lg:grid-cols-[0.9fr_1.5fr]">
          <Reveal variant="wipe" className="h-full [--wipe:0_100%_0_0] [--wipe-r:16px]">
            <div className="faq-art relative aspect-[612/687] w-full overflow-hidden rounded-[20px]">
              <Image
                src="/images/figma/32-11520-ce374.png"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 35vw"
                className="object-cover"
              />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent to-black/45" />
              <span className="faq-glass"><Image src="/images/figma/32-11520-1b5a8.svg" alt="" width={46.646} height={46.646} /></span>
              <h2>Questions investors ask</h2>
            </div>
          </Reveal>

          <Reveal variant="fade" className="h-full">
            <div className="faq-questions h-full rounded-[20px] border border-line bg-[#f7f7f8] p-4 sm:p-5">
              <ul>
                {faqs.map((f, i) => {
                  const isOpen = open === i;
                  return (
                    <Reveal as="li" key={f.q} delay={i * 50} className="border-b border-line last:border-0">
                      <h3>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={`faq-${i}`}
                          onClick={() => setOpen(isOpen ? null : i)}
                          className="group/q flex w-full items-center justify-between gap-4 py-4 text-left font-display text-[15px] font-bold text-ink"
                        >
                          <span className={`transition-colors duration-300 ${isOpen ? "text-ink" : "text-ink-soft group-hover/q:text-ink"}`}>{f.q}</span>
                          <span className="faq-icon shrink-0">
                            <Image src={isOpen ? "/images/figma/32-11520-98ea5.svg" : "/images/figma/32-11520-55040.svg"} alt="" width={45} height={45} />
                          </span>
                        </button>
                      </h3>
                      <div
                        id={`faq-${i}`}
                        role="region"
                        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-smooth)] ${
                          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p
                            className={`pr-12 pb-5 text-[13px] leading-relaxed text-ink-soft transition-[transform,filter] duration-500 ease-[var(--ease-smooth)] ${
                              isOpen ? "translate-y-0 blur-0" : "-translate-y-2 blur-[3px]"
                            }`}
                          >
                            {f.a}
                          </p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
