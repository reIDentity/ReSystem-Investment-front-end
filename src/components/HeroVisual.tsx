"use client";

import { useEffect, useState } from "react";
import { useInView, usePrefersReducedMotion } from "@/hooks/motion";
import { FigmaFractionaire } from "./hero/FigmaFractionaire";
import { FigmaInfra } from "./hero/FigmaInfra";
import { FigmaReid } from "./hero/FigmaReid";
import "./HeroVisual.css";

/** The illustration uses the original artwork and native Figma card layers. */
export function HeroVisual() {
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
            <div className="hero-art-card hero-fractionaire-card" style={{ left: 208.027, top: 146.585, transform: "rotate(-10deg)" }}><div className="hero-card-float"><FigmaFractionaire /></div></div>
            <div className="hero-art-card hero-infra-card" style={{ left: 715.424, top: 65.414, transform: "rotate(10deg)" }}><div className="hero-card-float"><FigmaInfra /></div></div>
          </>
        )}
        <div className="hero-art-card hero-reid-card" style={{ left: compact ? 22 : 432.899, top: compact ? 92 : 57.574 }}><div className="hero-card-float"><FigmaReid /></div></div>
        <div className="hero-revenue-chip" style={{ left: compact ? 18 : 223.045, top: compact ? 18 : 20.707 }}>
          <p><span />Fractionaire, revenue today</p>
          <strong>$353.06</strong>
        </div>
        {!compact && <div className="hero-claim-chip"><p>A holder with 25 shares just claimed</p><strong>$4.36</strong></div>}
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
