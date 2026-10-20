"use client";

import { useEffect } from "react";

/**
 * One delegated pointer listener for every [data-spotlight], [data-tilt] and [data-magnetic]
 * element, so server components get cursor effects without becoming client components.
 * Mouse only; every effect leaves the element at its designed rest position when the cursor leaves.
 */
export function MotionEffects() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let spot: HTMLElement | null = null;
    let tilt: HTMLElement | null = null;
    let magnet: HTMLElement | null = null;
    let x = 0;
    let y = 0;

    const paint = () => {
      raf = 0;
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--sx", `${x - r.left}px`);
        spot.style.setProperty("--sy", `${y - r.top}px`);
      }
      if (tilt) {
        // Up to ±6° of tilt, towards the cursor, around the card's centre.
        const r = tilt.getBoundingClientRect();
        const px = (x - r.left) / r.width - 0.5;
        const py = (y - r.top) / r.height - 0.5;
        tilt.style.setProperty("--rx", `${(-py * 12).toFixed(2)}deg`);
        tilt.style.setProperty("--ry", `${(px * 12).toFixed(2)}deg`);
      }
      if (magnet) {
        // The button leans a quarter of the way towards the cursor.
        const r = magnet.getBoundingClientRect();
        const dx = x - (r.left + r.width / 2);
        const dy = y - (r.top + r.height / 2);
        magnet.style.translate = `${(dx * 0.25).toFixed(1)}px ${(dy * 0.3).toFixed(1)}px`;
      }
    };

    const release = (el: HTMLElement | null, kind: "tilt" | "magnet") => {
      if (!el) return;
      if (kind === "tilt") {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
        el.removeAttribute("data-tilt-active");
      } else {
        el.style.translate = "0px 0px";
        el.removeAttribute("data-magnet-active");
      }
    };

    const onMove = (e: PointerEvent) => {
      const target = e.target as Element | null;
      x = e.clientX;
      y = e.clientY;
      spot = target?.closest?.<HTMLElement>("[data-spotlight]") ?? null;

      const nextTilt = target?.closest?.<HTMLElement>("[data-tilt]") ?? null;
      if (nextTilt !== tilt) {
        release(tilt, "tilt");
        tilt = nextTilt;
        tilt?.setAttribute("data-tilt-active", "");
      }
      const nextMagnet = target?.closest?.<HTMLElement>("[data-magnetic]") ?? null;
      if (nextMagnet !== magnet) {
        release(magnet, "magnet");
        magnet = nextMagnet;
        magnet?.setAttribute("data-magnet-active", "");
      }
      if (!spot && !tilt && !magnet) return;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      release(tilt, "tilt");
      release(magnet, "magnet");
      tilt = null;
      magnet = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      if (raf) cancelAnimationFrame(raf);
      onLeave();
    };
  }, []);

  return null;
}
