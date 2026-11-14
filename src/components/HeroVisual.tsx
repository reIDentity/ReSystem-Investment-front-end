"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useInView, usePrefersReducedMotion } from "@/hooks/motion";
import { catalogueProjectPath } from "@/lib/platform/public-project";
import { projectArtworkUrl } from "@/lib/platform/media";
import type { LandingProject } from "@/lib/platform/landing-data";
import { orderedCatalogue, productForProject } from "@/data/products";
import { useLanding } from "./LandingData";
import "./HeroVisual.css";

function ProjectArtwork({ row }: { row: LandingProject }) {
  const [failed, setFailed] = useState<string | null>(null);
  const brand = productForProject(row.project.id);
  const media = row.project.media?.find(item => item.mimeType.startsWith("image/") && /^[a-zA-Z0-9]{32,120}$/.test(item.cid));
  const publicArtwork = media ? projectArtworkUrl(row.project.id, media.cid) : null;
  const artwork = publicArtwork && publicArtwork !== failed ? publicArtwork : brand?.image;
  return <div className="hero-showcase-cover" style={{ background: brand?.art || "#dceafa" }}>
    {artwork ? <Image src={artwork} alt="" fill sizes="(max-width: 600px) 72vw, 280px" unoptimized={artwork === publicArtwork} draggable={false} onError={publicArtwork ? () => setFailed(publicArtwork) : undefined} /> : <span className="hero-showcase-art-empty" aria-hidden="true">↗</span>}
    <span className="hero-showcase-category">{brand?.category || "Published project"}</span>
  </div>;
}

/** The supplied desktop/phone motion, driven by real published project records. */
export function HeroVisual() {
  const { projects, loading, error, retry } = useLanding();
  const [host, inView] = useInView<HTMLDivElement>({ threshold: 0.1, rootMargin: "0px", once: false });
  const reducedMotion = usePrefersReducedMotion();
  const items = useMemo(() => projects ? orderedCatalogue(projects).slice(0, 8) : [], [projects]);
  const catalogue = useMemo(() => projects?.map(row => row.project) || [], [projects]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const selectedIndex = items.findIndex(row => row.project.id === activeId);
  // Bind the first real selection, including an asynchronous first catalogue,
  // before commit so later refreshes cannot switch it just by reordering rows.
  if (items.length && selectedIndex < 0) setActiveId(items[0].project.id);
  const activeIndex = selectedIndex < 0 ? 0 : selectedIndex;
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [resumeRequested, setResumeRequested] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [announceSelection, setAnnounceSelection] = useState(false);
  const announcement = announceSelection && items.length ? `${items[activeIndex].project.title}, project ${activeIndex + 1} of ${items.length}.` : "";
  const titleId = useId();
  const swipe = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const suppressClickUntil = useRef(0);
  const canRotate = items.length > 1;
  const playing = canRotate && inView && pageVisible && !reducedMotion && !paused && !dragging && (resumeRequested || (!hovered && !focused));

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    update();
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      // Recheck at execution time: a visibility or OS preference event can precede React's render.
      if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setAnnounceSelection(false);
      setActiveId(items[(activeIndex + 1) % items.length].project.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [playing, activeIndex, items]);

  const select = (index: number) => {
    if (!items.length) return;
    const next = (index + items.length) % items.length;
    setActiveId(items[next].project.id);
    setAnnounceSelection(true);
  };
  const finishSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    if (!start || start.pointerId !== event.pointerId) return;
    swipe.current = null;
    setDragging(false);
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5 || !canRotate) return;
    suppressClickUntil.current = Date.now() + 500;
    select(activeIndex + (dx < 0 ? 1 : -1));
  };

  return <div ref={host} className="hero-artwork hero-showcase" role="region" aria-roledescription="carousel" aria-labelledby={titleId} data-motion={playing ? "playing" : "paused"}
    onMouseEnter={() => { setHovered(true); setResumeRequested(false); }} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => { setFocused(true); setResumeRequested(false); }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
    <div className="hero-showcase-heading"><h2 id={titleId}>Invest early. <span>Earn rewards.</span></h2><p>Explore published projects and their funded revenue.</p></div>
    <div className="hero-showcase-stage" onPointerDown={event => { if (event.pointerType === "touch" && event.isPrimary !== false && !swipe.current) { swipe.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }; setDragging(true); setResumeRequested(false); } }} onPointerUp={finishSwipe} onPointerCancel={event => { if (swipe.current?.pointerId === event.pointerId) { swipe.current = null; setDragging(false); } }}
      onClickCapture={event => { if (Date.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); suppressClickUntil.current = 0; } }}>
      {items.map((row, index) => {
        let offset = (index - activeIndex + items.length) % items.length;
        if (offset > items.length / 2) offset -= items.length;
        const distance = Math.abs(offset), current = offset === 0;
        const style = { "--slide-offset": offset, "--slide-depth": `${-distance * 115}px`, "--slide-angle": `${-offset * 16}deg`, "--slide-scale": 1 - Math.min(distance, 3) * .09, "--slide-opacity": distance > 2 ? 0 : current ? 1 : distance === 1 ? .62 : .28, "--slide-blur": `${Math.min(distance, 2) * .65}px`, zIndex: 10 - distance } as CSSProperties;
        return <div key={row.project.id} className="hero-showcase-slide" style={style} data-active={current} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${items.length}: ${row.project.title}`} aria-hidden={!current} inert={!current}>
          <a className="hero-showcase-card" href={catalogueProjectPath(row.project, catalogue)} tabIndex={current ? 0 : -1} aria-label={`View ${row.project.title} project details`} draggable={false}>
            <ProjectArtwork row={row} />
            <div className="hero-showcase-copy"><h3>{row.project.title}</h3><p>{row.project.description}</p><span>Explore project <ArrowRight size={14} aria-hidden="true" /></span></div>
          </a>
        </div>;
      })}
      {!items.length && <div className="hero-showcase-empty" role="status"><strong>{loading ? "Loading published projects…" : error ? "Projects are temporarily unavailable" : "New opportunities are on the way"}</strong><p>{loading ? "Preparing your project showcase." : error ? "Please try again shortly." : "Published projects will appear here."}</p>{error && <button type="button" onClick={retry}>Try again</button>}</div>}
    </div>
    {items.length > 0 && <div className="hero-showcase-controls">
      <div className="hero-showcase-direction"><button type="button" aria-label="Previous project" disabled={!canRotate} onClick={() => select(activeIndex - 1)}><ArrowLeft size={18} aria-hidden="true" /></button><button type="button" aria-label="Next project" disabled={!canRotate} onClick={() => select(activeIndex + 1)}><ArrowRight size={18} aria-hidden="true" /></button></div>
      <div className="hero-showcase-dots" role="group" aria-label="Choose a project">{items.map((row, index) => <button type="button" key={row.project.id} aria-label={`Show ${row.project.title}`} aria-current={index === activeIndex ? "true" : undefined} onClick={() => select(index)}><span /></button>)}</div>
      <span className="hero-showcase-position" aria-hidden="true">{activeIndex + 1} / {items.length}</span>
      {canRotate && !reducedMotion && <button type="button" className="hero-showcase-play" aria-label={paused ? "Play animation" : "Pause animation"} aria-pressed={paused} onClick={() => { setPaused(!paused); setResumeRequested(paused); }}>{paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}<span>{paused ? "Play" : "Pause"}</span></button>}
    </div>}
    <p className="hero-showcase-note">Choose a project to explore. Rewards depend on actual funded revenue.</p>
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
  </div>;
}
