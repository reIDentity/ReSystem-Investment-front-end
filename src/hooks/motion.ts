"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

const query = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True once the element has scrolled into view (stays true unless `once` is false). */
export function useInView<T extends Element>(
  options: { threshold?: number; rootMargin?: string; once?: boolean } = {},
): [RefObject<T | null>, boolean] {
  const { threshold = 0, rootMargin = "0px 0px -10% 0px", once = true } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/** Tweens toward `target` whenever it changes. Jumps straight there under reduced motion. */
export function useTween(target: number, duration = 700, enabled = true): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(enabled ? 0 : target);
  const current = useRef(value);

  useEffect(() => {
    if (!enabled || reduced) return;
    const from = current.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const next = from + (target - from) * easeOutQuart(t);
      current.current = next;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled, reduced]);

  return enabled && !reduced ? value : target;
}
