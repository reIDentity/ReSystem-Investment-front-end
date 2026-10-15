"use client";

import { useInView, useTween } from "@/hooks/motion";

interface CountUpProps {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

/** Counts from 0 to `to` once scrolled into view. */
export function CountUp({ to, prefix = "", suffix = "", decimals = 0, duration = 1400, className }: CountUpProps) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.5 });
  const value = useTween(inView ? to : 0, duration);
  const text = value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`} aria-label={`${prefix}${to.toLocaleString("en-US")}${suffix}`}>
      <span aria-hidden>
        {prefix}
        {text}
        {suffix}
      </span>
    </span>
  );
}
