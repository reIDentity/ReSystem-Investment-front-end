"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import useSWR from "swr";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { useInView } from "@/hooks/motion";
import { categories, products, type Product } from "@/data/products";
import { api } from "@/lib/platform/client";
import type { Project, RewardView } from "@/lib/platform/types";
import type { ProjectChainResponse } from "@/lib/platform/api.generated";
import { landingProjectStats, publishedLandingProject } from "@/lib/platform/landing-project";
import { publicIpfsUrl } from "@/lib/platform/media";

const publicOptions = { refreshInterval: 60000, shouldRetryOnError: false, revalidateOnFocus: true };

function ProductCard({ product }: { product: Product }) {
  const [failedArtwork, setFailedArtwork] = useState<string | null>(null);
  const record = useSWR<Project>(product.projectId ? `projects/${product.projectId}` : null, api, publicOptions);
  const project = record.error ? null : publishedLandingProject(product.projectId, record.data);
  const chain = useSWR<ProjectChainResponse>(project ? `projects/${project.id}/chain` : null, api, publicOptions);
  const revenue = useSWR<RewardView>(project ? `projects/${project.id}/revenue` : null, api, publicOptions);
  const stats = landingProjectStats(project, chain.error ? null : chain.data, revenue.error ? null : revenue.data);
  const image = record.data?.media?.find(m => project && m.mimeType.startsWith("image/") && /^[a-zA-Z0-9]{32,120}$/.test(m.cid));
  const publicArtwork = image ? publicIpfsUrl(image.cid) : null;
  const artwork = publicArtwork && publicArtwork !== failedArtwork ? publicArtwork : product.image;
  const badge = project ? stats.sale === "Open" ? "Live" : "Published" : product.status === "Coming" ? "Coming soon" : "—";
  return (
    <article
      data-spotlight
      data-tilt
      className="product-card group relative flex h-full flex-col rounded-[22px] bg-white p-2.5 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
    >
      <div className="product-cover relative h-[150px] overflow-hidden rounded-2xl">
        <div
          className="absolute inset-0 transition-transform duration-[1200ms] ease-[var(--ease-smooth)] group-hover:scale-[1.06] group-focus-within:scale-[1.06]"
          style={{ background: product.art }}
        >
          {artwork && (
            <Image
              src={artwork}
              unoptimized={artwork === publicArtwork}
              onError={publicArtwork ? () => setFailedArtwork(publicArtwork) : undefined}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
          )}
        </div>
        {product.status && (
          <span
            className="product-badge absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-display text-[11px] font-semibold text-forest"
            title={project ? stats.sale === "Open" ? "Primary sale is open on INFRA." : "Published project; review current purchase availability." : product.status === "Coming" ? undefined : "Published investment status is unavailable."}
            aria-label={badge === "—" ? "Published investment status unavailable" : badge}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="product-content flex flex-1 flex-col px-2 pt-3 pb-2">
        <h3 className="font-display text-[20px] leading-tight font-extrabold text-ink">{project?.title || product.name}</h3>
        <p className="product-category mt-0.5 text-[14px] text-muted">{product.category}</p>
        <p className="product-description mt-3 min-h-[68px] text-[17px] leading-snug text-ink-soft">{project?.description || product.description}</p>
        <dl className="product-stats mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-[#f1f4f9] px-3 py-3">
          <div>
            <dt className="text-[11px] whitespace-nowrap text-muted">Revenue/mo</dt>
            <dd className="font-display text-[15px] font-bold text-ink" title={stats.revenueTitle} aria-label={stats.revenue === "—" ? "Unavailable" : undefined}>{stats.revenue}</dd>
          </div>
          <div>
            <dt className="text-[11px] whitespace-nowrap text-muted">Yield pace</dt>
            <dd className="font-display text-[15px] font-bold text-forest" title={stats.yieldTitle} aria-label={stats.yieldPace === "—" ? "Unavailable" : undefined}>{stats.yieldPace}</dd>
          </div>
          <div>
            <dt className="text-[11px] whitespace-nowrap text-muted">Sold</dt>
            <dd className="font-display text-[15px] font-bold text-ink" title={stats.soldTitle} aria-label={stats.sold === "—" ? "Unavailable" : undefined}>{stats.sold}</dd>
          </div>
        </dl>
        <a
          href={project ? `/invest/products/${project.id}` : product.projectId ? "/invest/explore" : "#how-much"}
          className="product-link mt-5 flex items-center justify-between font-display text-[14px] font-bold text-brand underline-offset-4 hover:underline"
        >
          See where, why and how much{" "}
          <span aria-hidden="true" className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:translate-x-1.5 group-focus-within:translate-x-1.5">→</span>
        </a>
      </div>
    </article>
  );
}

/** Lime pill that slides under the active tab instead of each tab repainting on its own. */
function useTabPill(active: string) {
  const list = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => {
      const btn = el.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!btn) return;
      setPill({
        width: btn.offsetWidth,
        height: btn.offsetHeight,
        transform: `translate3d(${btn.offsetLeft}px, ${btn.offsetTop}px, 0)`,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [active]);

  return [list, pill] as const;
}

export function Products() {
  const [active, setActive] = useState<(typeof categories)[number]>("All");
  const visible = active === "All" ? products : products.filter((p) => p.category === active);
  const [list, pill] = useTabPill(active);
  const [grid, gridIn] = useInView<HTMLDivElement>();

  /** Cards that stay glide to their new slots, the rest fade through (View Transitions where supported). */
  const choose = (c: (typeof categories)[number]) => {
    if (c === active) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) return setActive(c);
    // A skipped transition (hidden tab, rapid clicks) still applies the update; it just rejects `ready`.
    document.startViewTransition(() => flushSync(() => setActive(c))).ready.catch(() => {});
  };

  return (
    <section id="where" className="mt-24 scroll-mt-24">
      <Container>
        <Reveal variant="blur">
          <h2 className="text-[34px] font-semibold tracking-tight text-ink sm:text-[40px]">Where you can invest</h2>
        </Reveal>
        <Reveal variant="blur" delay={80}>
          <p className="section-description mt-4 max-w-[820px] text-[21px] leading-snug text-ink-soft">
            Twelve products across finance, real-world assets, identity and services. Review published projects on INFRA to
            see their confirmed revenue before you buy.
          </p>
        </Reveal>

        <Reveal delay={140}>
          <div
            ref={list}
            role="tablist"
            aria-label="Product category"
            className="product-tabs relative mt-8 flex w-full flex-wrap gap-1 rounded-full bg-white p-1.5 sm:w-fit"
          >
            {pill && (
              <span
                aria-hidden
                className="product-tab-indicator absolute top-0 left-0 rounded-full bg-lime shadow-[0_6px_14px_-8px_rgba(120,170,0,0.9)] transition-[transform,width,height] duration-500 ease-[var(--ease-spring)]"
                style={pill}
              />
            )}
            {categories.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={active === c}
                onClick={() => choose(c)}
                className={`relative rounded-full px-5 py-2.5 font-display text-[14px] font-semibold transition-[color,background-color,transform] duration-300 active:scale-95 ${
                  active === c ? "text-white" : "text-ink-soft hover:bg-ink/5"
                } ${!pill && active === c ? "bg-lime" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        </Reveal>

        <div ref={grid} className="product-grid mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p, i) => (
            <div
              key={p.id}
              data-reveal="up"
              data-in={gridIn}
              style={
                {
                  "--d": `${Math.min(i, 7) * 60}ms`,
                  viewTransitionName: `product-${p.id}`,
                  viewTransitionClass: "product-card",
                } as CSSProperties
              }
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
