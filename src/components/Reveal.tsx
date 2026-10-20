"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { useInView } from "@/hooks/motion";

type Variant = "up" | "blur" | "fade" | "scale" | "left" | "right" | "wipe";

interface RevealProps {
  children: ReactNode;
  variant?: Variant;
  /** Delay in ms, handy for staggering siblings. */
  delay?: number;
  as?: ElementType;
  className?: string;
  "aria-hidden"?: boolean;
}

/** Fades content in the first time it scrolls into view. See [data-reveal] in globals.css. */
export function Reveal({ children, variant = "up", delay = 0, as: Tag = "div", className = "", ...rest }: RevealProps) {
  const [ref, inView] = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      {...rest}
      data-reveal={variant}
      data-in={inView}
      className={className}
      style={{ "--d": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
