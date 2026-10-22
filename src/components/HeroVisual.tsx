"use client";

import { useEffect, useState } from "react";
import { useInView, usePrefersReducedMotion } from "@/hooks/motion";
import { FigmaFractionaire } from "./hero/FigmaFractionaire";
import { FigmaInfra } from "./hero/FigmaInfra";
import { FigmaReid } from "./hero/FigmaReid";
import "./HeroVisual.css";
import { useLanding } from "./LandingData";
import { displayMoney } from "@/lib/platform/landing-data";

/** The illustration uses the original artwork and native Figma card layers. */
export function HeroVisual() {
  const { totals } = useLanding();
  const [host, inView] = useInView<HTMLDivElement>({ threshold: 0.05, rootMargin: "0px", once: false });
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const [width, setWidth] = useState(1348);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [host]);

  /**
   * Depth. The cursor position (eased) and the scroll position drive --mx/--my/--sp on the artwork;
   * HeroVisual.css moves each card and chip by its own depth. Both rest at 0, so the still image
   * is exactly the Figma composition.
   */
  useEffect(() => {
    const element = host.current;
    if (!element || reducedMotion || paused) return;
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let scroll = 0;

    const frame = () => {
      raf = 0;
      x += (targetX - x) * 0.1;
      y += (targetY - y) * 0.1;
      element.style.setProperty("--mx", x.toFixed(3));
      element.style.setProperty("--my", y.toFixed(3));
      element.style.setProperty("--sp", scroll.toFixed(3));
      if (Math.abs(targetX - x) > 0.002 || Math.abs(targetY - y) > 0.002) raf = requestAnimationFrame(frame);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      schedule();
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      schedule();
    };
    const onScroll = () => {
      scroll = Math.min(window.scrollY / 800, 1);
      schedule();
    };

    if (pointer) {
      element.addEventListener("pointermove", onMove, { passive: true });
      element.addEventListener("pointerleave", onLeave);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      element.style.removeProperty("--mx");
      element.style.removeProperty("--my");
      element.style.removeProperty("--sp");
    };
  }, [host, reducedMotion, paused]);

  const compact = width < 760;
  const canvas = compact ? { width: 470, height: 600 } : { width: 1348, height: 633 };
  const scale = width / canvas.width;

  return (
    <div ref={host} className="hero-artwork" data-motion={inView && !paused ? "playing" : "paused"} style={{ height: canvas.height * scale }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Content.png" alt="" className="hero-background" draggable={false} />
      <div className="hero-canvas" style={{ width: canvas.width, height: canvas.height, transform: `scale(${scale})` }}>
        {!compact && (
          <>
            <div className="hero-art-card hero-fractionaire-card" style={{ left: 208.027, top: 146.585, transform: "rotate(-10deg)" }}><div className="hero-card-depth"><div className="hero-card-float"><FigmaFractionaire /></div></div></div>
            <div className="hero-art-card hero-infra-card" style={{ left: 715.424, top: 65.414, transform: "rotate(10deg)" }}><div className="hero-card-depth"><div className="hero-card-float"><FigmaInfra /></div></div></div>
          </>
        )}
        <div className="hero-art-card hero-reid-card" style={{ left: compact ? 22 : 432.899, top: compact ? 92 : 57.574 }}><div className="hero-card-depth"><div className="hero-card-float"><FigmaReid /></div></div></div>
        <div className="hero-revenue-chip" style={{ left: compact ? 18 : 223.045, top: compact ? 18 : 20.707 }}>
          <p><span />Projects · revenue today</p>
          <strong>{displayMoney(totals.today)}</strong>
        </div>
        {!compact && <div className="hero-claim-chip"><p>Rewards claimed · all projects</p><strong>{displayMoney(totals.claimed)}</strong></div>}
      </div>
      {!reducedMotion && (
        <button
          type="button"
          className="hero-motion-toggle"
          aria-label={paused ? "Play animation" : "Pause animation"}
          onClick={() => setPaused((value) => !value)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM14 5h4v14h-4z" />}
          </svg>
        </button>
      )}
    </div>
  );
}
