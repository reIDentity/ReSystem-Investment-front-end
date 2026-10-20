import type { CSSProperties } from "react";
import Image from "next/image";
import { cacheLife } from "next/cache";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { Reveal } from "./Reveal";

const columns = [
  { title: "Products", links: ["ReSuit", "RePatner", "ReProduct"] },
  { title: "Organisation", links: ["Resystem", "Members", "News & Press"] },
];

const legal = [
  { label: "Privacy Policy", href: "https://resystem.org/privacy-policy" },
  { label: "Terms", href: "https://resystem.org/terms-condition" },
  { label: "Cookies", href: "https://resystem.org/cookie-policy" },
];

async function CopyrightYear() {
  "use cache";
  cacheLife("hours");
  return new Date().getFullYear();
}

function Social({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <a href="#" aria-label={label} className="grid h-5 w-5 place-items-center rounded-[5px] border border-white/60 text-white/80 transition-[transform,color,border-color] duration-500 ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:border-[#7cc8ff] hover:text-[#7cc8ff]">
      {children}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="mt-4 pb-6">
      <Container>
        <Reveal variant="fade">
        <div className="footer-panel rounded-[20px] bg-panel p-6 text-white sm:p-8">
          <div className="footer-columns grid gap-8 md:grid-cols-[1.6fr_0.7fr_0.7fr_1.1fr]">
            <div data-cascade="up" style={{ "--i": 0 } as CSSProperties}>
              <Logo tone="light" className="text-[23.25px]" />
              <p className="mt-6 max-w-[290px] text-[11px] leading-snug text-white/80">
                Desert Tech Cloud Services LLC, Dubai, UAE. Investing in product shares carries risk, including loss of the
                amount invested. Past or current revenue does not guarantee future earnings. Yield figures are estimates based
                on recent revenue and shares sold. [REGULATORY LICENCE AND DISCLOSURE TEXT]
              </p>
            </div>
            {columns.map((c, i) => (
              <div key={c.title} data-cascade="up" style={{ "--i": i + 1 } as CSSProperties}>
                <p className="font-display text-[12px] text-white/50">{c.title}</p>
                <ul className="mt-2 space-y-1">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a href={c.title === "Products" ? "https://resystem.org/ecosystem" : l === "Resystem" ? "https://resystem.org/" : "#"} className="inline-block text-[13px] text-white/90 transition-colors duration-300 hover:text-[#7cc8ff]">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div data-cascade="up" style={{ "--i": columns.length + 1 } as CSSProperties}>
              <a href="https://resystem.org/ecosystem" className="footer-ecosystem-logo">
                <Image src="/reECOSYSTEM_logo.svg" alt="reEcosystem" width={161} height={22} />
              </a>
              <p className="mt-3 text-[12px] leading-snug text-white/80">
                A suite of modular apps that work together i.e identity, payments, credentials, and more—built for the new
                internet of AI and blockchain.
              </p>
            </div>
          </div>
          <div data-cascade="up" style={{ "--i": columns.length + 2 } as CSSProperties} className="footer-bottom mt-8 flex flex-col items-start justify-between gap-4 border-t border-white/15 pt-5 text-[12px] sm:flex-row sm:items-center">
            <p className="text-white/90">© <CopyrightYear /> Resystem.org</p>
            <ul className="flex flex-wrap gap-x-8 gap-y-2">
              {legal.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-white/90 hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Social label="LinkedIn"><Image src="/images/figma/25-10762-e5fda.svg" alt="" width={16.862} height={16.862} /></Social>
              <Social label="Facebook"><Image src="/images/figma/25-10762-765ec.svg" alt="" width={16.862} height={16.862} /></Social>
              <Social label="Instagram"><Image src="/images/figma/25-10762-5cc50.svg" alt="" width={16.862} height={16.862} /></Social>
            </div>
          </div>
        </div>
        </Reveal>
      </Container>
    </footer>
  );
}
