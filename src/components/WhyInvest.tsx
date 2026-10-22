"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { usePrefersReducedMotion } from "@/hooks/motion";
import "./WhyInvest.css";

type Reason = {
  id: string;
  title: string;
  body: string;
  iconAsset: string;
  /** Painting from Figma; the gradient shows while it loads. */
  image: string;
  fallback: string;
};

const reasons: Reason[] = [
  {
    id: "real-revenue",
    title: "Earn from real revenue",
    body: "Rewards come from actual revenue funded into the project contract. Future deposits and returns are not guaranteed.",
    image: "/images/why-revenue.png",
    iconAsset: "/images/why-coin.svg",
    fallback: "radial-gradient(60% 90% at 70% 55%, #6b3a22 0%, #3a1f14 55%, #1d130e 100%)",
  },
  {
    id: "shared",
    iconAsset: "/images/figma/why-shared.svg",
    title: "Funded revenue shared with holders",
    body: "Authorized operators fund the project’s revenue pool. Each deposit is allocated in proportion to issued fractions held at that time.",
    image: "/images/why-2-shared.jpg",
    fallback: "radial-gradient(70% 80% at 45% 45%, #4a3626 0%, #2a1d14 55%, #120d0a 100%)",
  },
  {
    id: "on-chain",
    iconAsset: "/images/figma/why-onchain.svg",
    title: "Every dollar visible on-chain",
    body: "Each published project has a contract on INFRA. Check its confirmed revenue deposits and reward claims before and after you invest.",
    image: "/images/why-3-onchain.jpg",
    fallback: "radial-gradient(70% 80% at 35% 20%, #5a4328 0%, #2b2014 55%, #0f0b08 100%)",
  },
  {
    id: "no-lock",
    iconAsset: "/images/figma/why-no-lock.svg",
    title: "No lock, one identity",
    body: "Claim allocated earnings or transfer fractions. Resale needs a willing buyer. Connect with one reID across the ecosystem.",
    image: "/images/why-4-nolock.jpg",
    fallback: "radial-gradient(70% 80% at 60% 55%, #5c3a22 0%, #2a1a12 55%, #0f0a08 100%)",
  },
];

/** Card dimensions and type scale together with the image column. */
function ReasonCard({ reason, priority = false }: { reason: Reason; priority?: boolean }) {
  return (
    <div className="@container h-full w-full">
      <div className="why-reason-card" style={{ background: reason.fallback }}>
        <Image
          src={reason.image}
          alt=""
          fill
          sizes="(max-width: 767px) calc(100vw - 66px), (max-width: 1352px) 48vw, 641px"
          preload={priority}
          className="why-reason-image object-fill object-bottom"
        />
        <span aria-hidden className="absolute inset-0 bg-black/[0.37]" />
        <div className="relative">
          <Image src={reason.iconAsset} alt="" width={57} height={57} className="why-reason-icon" />
          <h3 className="why-reason-title">{reason.title}</h3>
        </div>
        <p className="why-reason-body">{reason.body}</p>
      </div>
    </div>
  );
}

export function WhyInvest() {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const selectReason = (index: number) => {
    const element = track.current;
    if (!element) return;
    const next = Math.max(0, Math.min(reasons.length - 1, index));
    element.scrollTo({ left: next * element.clientWidth, behavior: reducedMotion ? "instant" : "smooth" });
  };

  return (
    <section id="why" aria-labelledby="why-heading" className="mt-11 scroll-mt-24">
      <Container>
        <div className="why-scroll-frame">
          <Reveal>
            <div className="why-panel">
              <div className="why-intro">
                <h2 id="why-heading">Why invest in reSystem products</h2>
                <p>
                  You&apos;re not buying a token that hopes to go up. You&apos;re buying a share of what a working
                  product earns from its customers.
                </p>
              </div>
              <div
                className="why-carousel"
                role="region"
                aria-roledescription="carousel"
                aria-label="Reasons to invest"
                aria-describedby="why-swipe-hint"
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                    event.preventDefault();
                    const direction = event.key === "ArrowRight" ? 1 : -1;
                    selectReason(active + direction);
                  } else if (event.key === "Home" || event.key === "End") {
                    event.preventDefault();
                    selectReason(event.key === "Home" ? 0 : reasons.length - 1);
                  }
                }}
              >
                <div
                  ref={track}
                  id="why-reasons-track"
                  className="why-slides"
                  tabIndex={0}
                  aria-label="Swipe through reasons to invest"
                  onScroll={(event) => {
                    const element = event.currentTarget;
                    setActive(Math.max(0, Math.min(reasons.length - 1, Math.round(element.scrollLeft / element.clientWidth))));
                  }}
                >
                  {reasons.map((reason, i) => (
                    <div
                      key={reason.id}
                      id={`why-slide-${reason.id}`}
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`${i + 1} of ${reasons.length}`}
                      aria-hidden={i !== active}
                      className="why-slide"
                    >
                      <ReasonCard reason={reason} priority={i === 0} />
                    </div>
                  ))}
                </div>
                <div className="why-pagination">
                  <p className="why-count" aria-hidden="true">
                    <span>{String(active + 1).padStart(2, "0")}</span> / {String(reasons.length).padStart(2, "0")}
                  </p>
                  <div className="why-dots" aria-label="Choose a reason">
                    {reasons.map((reason, i) => (
                      <button
                        key={reason.id}
                        type="button"
                        aria-label={`Show “${reason.title}”`}
                        aria-controls={`why-slide-${reason.id}`}
                        aria-current={i === active || undefined}
                        onClick={() => selectReason(i)}
                        className="why-dot"
                      >
                        <span />
                      </button>
                    ))}
                  </div>
                  <div className="why-arrows">
                    <button type="button" className="why-arrow" aria-label="Previous reason" aria-controls="why-reasons-track" disabled={active === 0} onClick={() => selectReason(active - 1)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
                    </button>
                    <button type="button" className="why-arrow" aria-label="Next reason" aria-controls="why-reasons-track" disabled={active === reasons.length - 1} onClick={() => selectReason(active + 1)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
                    </button>
                  </div>
                  <p id="why-swipe-hint" className="why-swipe-hint">Swipe left or right to explore</p>
                </div>
                <p className="sr-only" aria-live="polite" aria-atomic="true">{active + 1} of {reasons.length}: {reasons[active].title}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
