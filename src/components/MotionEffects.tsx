"use client";

import { useEffect } from "react";

/**
 * One delegated pointer listener for every [data-spotlight] element, so server components
 * get the cursor glow without becoming client components. Mouse only.
 */
export function MotionEffects() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let target: HTMLElement | null = null;
    let x = 0;
    let y = 0;

    const paint = () => {
      raf = 0;
      if (!target) return;
      const r = target.getBoundingClientRect();
      target.style.setProperty("--sx", `${x - r.left}px`);
      target.style.setProperty("--sy", `${y - r.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-spotlight]");
      if (!el) return;
      target = el;
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
