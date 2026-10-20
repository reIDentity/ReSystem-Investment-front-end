"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Container } from "./Container";
import { Logo } from "./Logo";

const links = [
  { label: "Where to invest", href: "#where" },
  { label: "Why", href: "#why" },
  { label: "How much", href: "#how-much" },
  { label: "Advantages", href: "#advantages" },
  { label: "Money flow", href: "#money-flow" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      setScrolled(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={`site-header sticky top-0 z-40 pt-4 pb-3 backdrop-blur-md transition-[background-color,box-shadow] duration-300 ${
        scrolled ? "bg-background/90 shadow-[0_8px_24px_-16px_rgba(31,27,25,0.35)]" : "bg-background/60"
      }`}
    >
      <div
        ref={bar}
        aria-hidden
        data-header-progress
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-lime-soft via-lime to-[#a3e635] will-change-transform"
      />
      <Container>
        <div className="header-row flex items-center justify-between gap-4">
          <a href="#" aria-label="reSystem Investment home" className="header-brand flex h-[47px] min-w-0 items-center rounded-2xl bg-white px-[13.8px]">
            <Logo className="text-[17px] min-[420px]:text-[20px] sm:text-[23.25px]" />
          </a>

          <div className="header-links hidden items-center gap-1 rounded-2xl bg-white p-2.5 pl-5 xl:flex">
            <nav className="header-nav flex items-center gap-7 pr-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="group relative font-display text-[15px] font-medium whitespace-nowrap text-ink-soft transition-colors duration-300 hover:text-ink"
                >
                  {l.label}
                  <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-right scale-x-0 rounded-full bg-lime transition-transform duration-500 ease-[var(--ease-smooth)] group-hover:origin-left group-hover:scale-x-100 group-focus-visible:origin-left group-focus-visible:scale-x-100" />
                </a>
              ))}
            </nav>
            <a
              href="/invest"
              data-magnetic
              className="header-invest btn btn-shine rounded-full bg-brand px-5 py-2.5 font-display text-[14px] font-semibold whitespace-nowrap text-white hover:shadow-[0_8px_18px_-8px_rgba(59,130,246,0.8)]"
            >
              Invest with reID
            </a>
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white transition-transform duration-200 active:scale-90 xl:hidden"
          >
            <Menu
              size={20}
              className={`absolute transition-[opacity,transform] duration-300 ease-[var(--ease-smooth)] ${open ? "scale-50 rotate-90 opacity-0" : "opacity-100"}`}
            />
            <X
              size={20}
              className={`absolute transition-[opacity,transform] duration-300 ease-[var(--ease-smooth)] ${open ? "opacity-100" : "scale-50 -rotate-90 opacity-0"}`}
            />
          </button>
        </div>

        <div
          data-open={open}
          inert={!open}
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-smooth)] xl:hidden ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mt-2 rounded-2xl bg-white p-4">
              <nav className="flex flex-col">
                {links.map((l, i) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    style={{ ["--i" as string]: i }}
                    className="menu-item border-b border-line py-3 font-display text-sm font-medium text-ink-soft last:border-0"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
              <div className="menu-item mt-4 flex gap-2" style={{ ["--i" as string]: links.length }}>
                <a href="/invest" className="header-invest btn flex-1 rounded-full bg-brand py-2.5 text-center font-display text-sm font-semibold text-white">
                  Invest with reID
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}
