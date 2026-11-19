"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Pause, Play } from "lucide-react";
import { useInView, usePrefersReducedMotion } from "@/hooks/motion";
import { catalogueProjectPath } from "@/lib/platform/public-project";
import { projectArtworkUrl } from "@/lib/platform/media";
import type { LandingProject } from "@/lib/platform/landing-data";
import { orderedCatalogue, productForProject } from "@/data/products";
import { SHOWCASE_LAYOUTS, showcaseFrame, showcasePose, type ShowcaseMode } from "./hero/showcase-motion";
import { useLanding } from "./LandingData";
import "./HeroVisual.css";

function ProjectArtwork({ row }: { row: LandingProject }) {
  const [failed, setFailed] = useState<string | null>(null);
  const brand = productForProject(row.project.id);
  const media = row.project.media?.find(item => item.mimeType.startsWith("image/") && /^[a-zA-Z0-9]{32,120}$/.test(item.cid));
  const publicArtwork = media ? projectArtworkUrl(row.project.id, media.cid) : null;
  const artwork = publicArtwork && publicArtwork !== failed ? publicArtwork : brand?.image;
  return <div className="hero-showcase-cover" style={{ background: brand?.art || "#dceafa" }}>
    {artwork ? <Image src={artwork} alt="" fill sizes="(max-width: 600px) 65vw, 320px" unoptimized={artwork === publicArtwork} draggable={false} onError={publicArtwork ? () => setFailed(publicArtwork) : undefined} /> : <span className="hero-showcase-art-empty" aria-hidden="true">↗</span>}
    <span className="hero-showcase-category">{brand?.category || "Published project"}</span>
  </div>;
}

const wrap = (value: number, length: number) => ((value % length) + length) % length;

/** Reference choreography, isolated from real investment state and wallet actions. */
export function HeroVisual() {
  const { projects, loading, error, retry } = useLanding();
  const [host, inView] = useInView<HTMLDivElement>({ threshold: 0.1, rootMargin: "0px", once: false });
  const reducedMotion = usePrefersReducedMotion();
  const rows = useMemo(() => projects ? orderedCatalogue(projects).slice(0, 8) : [], [projects]);
  const [order, setOrder] = useState<string[]>([]);
  const nextOrder = [...order.filter(id => rows.some(row => row.project.id === id)), ...rows.map(row => row.project.id).filter(id => !order.includes(id))];
  if (nextOrder.join("|") !== order.join("|")) setOrder(nextOrder);
  const items = nextOrder.flatMap(id => rows.find(row => row.project.id === id) || []);
  const catalogue = projects?.map(row => row.project) || [];
  const signature = nextOrder.join("|");
  const [layout, setLayout] = useState<{ mode: ShowcaseMode; scale: number }>({ mode: "desktop", scale: 0 });
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [resumeRequested, setResumeRequested] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [view, setView] = useState({ phase: "swipe", index: 0 });
  const [announceSelection, setAnnounceSelection] = useState(false);
  const [revision, setRevision] = useState(0);
  const titleId = useId(), noteId = useId();
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const cursor = useRef<SVGSVGElement>(null);
  const ripple = useRef<HTMLDivElement>(null);
  const previewLink = useRef<HTMLAnchorElement>(null);
  const previewTarget = useRef<readonly [number, number] | undefined>(undefined);
  const elapsed = useRef(0), base = useRef(0), position = useRef(0);
  const previousSignature = useRef(signature);
  const previousMode = useRef(layout.mode);
  const selectedId = useRef<string | null>(nextOrder[0] || null);
  const swipe = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const suppressClickUntil = useRef(0);
  const currentIndex = Math.min(view.index, Math.max(0, items.length - 1));
  const picked = items[currentIndex];
  const announcement = announceSelection && picked ? `${picked.project.title}, project ${currentIndex + 1} of ${items.length}.` : "";
  const canRotate = items.length > 1;
  const playing = canRotate && inView && pageVisible && !reducedMotion && !paused && !dragging && (resumeRequested || (!hovered && !focused));
  const cfg = SHOWCASE_LAYOUTS[layout.mode];

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    update();
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const fit = () => {
      const mode: ShowcaseMode = window.innerWidth < window.innerHeight ? "mobile" : "desktop";
      const config = SHOWCASE_LAYOUTS[mode];
      const width = el.getBoundingClientRect().width;
      setLayout(old => old.mode === mode && old.scale === width / config.W ? old : { mode, scale: width / config.W });
    };
    fit();
    const observer = window.ResizeObserver ? new window.ResizeObserver(fit) : null;
    observer?.observe(el);
    window.addEventListener("resize", fit);
    return () => { observer?.disconnect(); window.removeEventListener("resize", fit); };
  }, [host]);

  useEffect(() => {
    if (previousSignature.current !== signature || previousMode.current !== layout.mode) {
      base.current = Math.max(0, nextOrder.indexOf(selectedId.current || ""));
      elapsed.current = 0;
      previewTarget.current = undefined;
      previousSignature.current = signature;
      previousMode.current = layout.mode;
    }
    let raf = 0, last: number | null = null, alive = true;
    const paint = () => {
      if (!items.length) {
        if (stage.current) stage.current.dataset.phase = "swipe";
        setView(old => old.phase === "swipe" && old.index === 0 ? old : { phase: "swipe", index: 0 });
        return;
      }
      const frame = showcaseFrame(elapsed.current, layout.mode, items.length, previewTarget.current);
      const pos = reducedMotion ? Math.round(base.current + frame.position) : base.current + frame.position;
      const active = wrap(Math.round(pos), items.length);
      const phase = reducedMotion || !canRotate ? "swipe" : frame.phase;
      position.current = pos;
      selectedId.current = items[active].project.id;
      cards.current.forEach((card, index) => {
        if (!card || index >= items.length) return;
        let offset = wrap(index - pos, items.length);
        if (offset > items.length / 2) offset -= items.length;
        const pose = showcasePose(offset, layout.mode, reducedMotion ? 0 : frame.velocity, !reducedMotion && index === active ? frame.lift : 0);
        card.style.transform = `translateX(${pose.x}px) translateY(${pose.y}px) translateZ(${pose.z}px) rotateY(${pose.rotateY}deg) rotateZ(${pose.rotateZ}deg) scale(${pose.scale})`;
        card.style.opacity = String(pose.opacity);
        card.style.filter = pose.blur > .01 ? `blur(${pose.blur}px)` : "none";
        card.style.zIndex = String(pose.zIndex);
        card.style.setProperty("--showcase-tint", String(pose.tint));
      });
      if (cursor.current) {
        cursor.current.style.left = `${frame.cursorX}px`;
        cursor.current.style.top = `${frame.cursorY}px`;
        cursor.current.dataset.pressed = String(frame.cursorPressed);
      }
      if (ripple.current) {
        const p = frame.rippleProgress;
        ripple.current.style.left = `${(frame.rippleX ?? 0) + 4}px`;
        ripple.current.style.top = `${(frame.rippleY ?? 0) + 4}px`;
        ripple.current.style.opacity = p === null ? "0" : String(1 - p);
        ripple.current.style.transform = `translate(-50%,-50%) scale(${p === null ? 0 : .3 + p * 3.7})`;
      }
      if (stage.current) {
        stage.current.dataset.phase = phase;
        stage.current.dataset.lifted = String(phase === "hover" && frame.lift > 0);
        stage.current.dataset.pressing = String(phase === "detail" && frame.cursorPressed);
      }
      setView(old => old.phase === phase && old.index === active ? old : { phase, index: active });
    };
    const tick = (now: number) => {
      if (!alive || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (last !== null) elapsed.current += Math.max(0, now - last);
      last = now;
      paint();
      raf = window.requestAnimationFrame(tick);
    };
    paint();
    if (playing) {
      raf = window.requestAnimationFrame(tick);
    }
    return () => { alive = false; window.cancelAnimationFrame(raf); };
    // Refresh content without restarting a timeline bound to immutable catalogue IDs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, layout.mode, playing, reducedMotion, revision]);

  const select = (delta: number) => {
    if (!items.length) return;
    const index = wrap(Math.round(position.current) + delta, items.length);
    base.current = index;
    elapsed.current = 0;
    previewTarget.current = undefined;
    position.current = index;
    selectedId.current = items[index].project.id;
    setView({ phase: "swipe", index });
    setRevision(value => value + 1);
    setAnnounceSelection(true);
    setPaused(true);
    setResumeRequested(false);
  };
  const finishSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    if (!start || start.pointerId !== event.pointerId) return;
    swipe.current = null;
    setDragging(false);
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5 || !canRotate) return;
    suppressClickUntil.current = Date.now() + 500;
    select(dx < 0 ? 1 : -1);
  };
  const overlay = !!picked && (view.phase === "detail" || view.phase === "ready");
  const css = { "--showcase-width": `${cfg.W}px`, "--showcase-height": `${cfg.H}px`, "--showcase-scale": layout.scale, "--showcase-card-width": `${cfg.cardWidth}px`, "--showcase-card-height": `${cfg.cardHeight}px`, "--showcase-card-top": `${cfg.cardTop}px`, aspectRatio: `${cfg.W} / ${cfg.H}` } as CSSProperties;

  return <div ref={host} id="project-showcase" className="hero-artwork hero-showcase" role="region" aria-roledescription="carousel" aria-labelledby={titleId} aria-describedby={noteId} style={css} data-layout={layout.mode} data-count={items.length} data-reduced={reducedMotion} data-motion={playing ? "playing" : "paused"}
    onMouseEnter={() => { setHovered(true); setResumeRequested(false); }} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => { setFocused(true); setResumeRequested(false); }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
    <span className="hero-showcase-illustration" id={noteId}>How it works · illustration</span>
    {canRotate && !reducedMotion && <button type="button" className="hero-showcase-play" aria-label={paused ? "Play animation" : "Pause animation"} aria-pressed={paused} onClick={() => { if (paused) setAnnounceSelection(false); setPaused(!paused); setResumeRequested(paused); }}>{paused ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}</button>}
    <div ref={stage} className="hero-showcase-stage" data-phase={view.phase} aria-busy={loading}>
      <div className="hero-showcase-heading"><h2 id={titleId}><span>{["Invest", "early."].map((word, index) => <span key={word}><span style={{ "--word": index } as CSSProperties}>{word}</span>{" "}</span>)}</span>{" "}<span className="accent">{["Earn", "rewards."].map((word, index) => <span key={word}><span style={{ "--word": index + 2 } as CSSProperties}>{word}</span>{" "}</span>)}</span></h2><p>Explore published projects and their funded revenue.</p></div>
      <div className="hero-showcase-track" onPointerDown={event => { if (event.pointerType === "touch" && event.isPrimary !== false && !swipe.current) { swipe.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }; (event.target as Element).setPointerCapture?.(event.pointerId); setDragging(true); setResumeRequested(false); } }} onPointerUp={finishSwipe} onPointerCancel={event => { if (swipe.current?.pointerId === event.pointerId) { swipe.current = null; setDragging(false); } }} onLostPointerCapture={event => { if (swipe.current?.pointerId === event.pointerId) { swipe.current = null; setDragging(false); } }}
        onClickCapture={event => { if (Date.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); suppressClickUntil.current = 0; } }}>
        {items.map((row, index) => {
          const current = index === currentIndex && !overlay;
          return <div key={row.project.id} ref={el => { cards.current[index] = el; }} className="hero-showcase-slide" data-active={current} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${items.length}: ${row.project.title}`} aria-hidden={!current} inert={!current}>
            <a className="hero-showcase-card" href={catalogueProjectPath(row.project, catalogue)} tabIndex={current ? 0 : -1} aria-label={`View ${row.project.title} project details`} draggable={false}>
              <ProjectArtwork row={row} /><div className="hero-showcase-copy"><h3>{row.project.title}</h3><p>{row.project.description}</p></div>
            </a>
          </div>;
        })}
      </div>
      {!items.length && <div className="hero-showcase-empty" role="status"><strong>{loading ? "Loading published projects…" : error ? "Projects are temporarily unavailable" : "New opportunities are on the way"}</strong><p>{loading ? "Preparing your project showcase." : error ? "Please try again shortly." : "Published projects will appear here."}</p>{error && <button type="button" onClick={retry}>Try again</button>}</div>}
      <div className="hero-showcase-veil" aria-hidden="true" />
      {picked && <section className="hero-showcase-popup" aria-label="Illustrated investment walkthrough" aria-hidden={!overlay} inert={!overlay} onAnimationEnd={event => {
        if (event.target !== event.currentTarget || event.animationName !== "showcase-boing" || !previewLink.current || !stage.current || !layout.scale) return;
        const button = previewLink.current.getBoundingClientRect(), canvas = stage.current.getBoundingClientRect();
        previewTarget.current = [(button.left + button.width * .55 - canvas.left) / layout.scale, (button.top + button.height * .55 - canvas.top) / layout.scale];
      }}>
        {view.phase !== "ready" ? <div className="hero-showcase-detail"><div className="hero-showcase-thumb"><ProjectArtwork row={picked} /></div><div><span className="hero-showcase-tag">{productForProject(picked.project.id)?.category || "Published project"}</span><h3>{picked.project.title}</h3><p>Explore its allocation and prices. Connect with reID when you’re ready to invest.</p><a ref={previewLink} className="hero-showcase-preview-link" href={catalogueProjectPath(picked.project, catalogue)} tabIndex={overlay ? 0 : -1}>View this project <ArrowRight size={24} aria-hidden="true" /></a></div></div>
          : <div className="hero-showcase-ready"><div className="hero-showcase-trophy" aria-hidden="true">✦</div><h3>Your next step:<br /><span>Review and approve</span></h3><p>You choose the amount and approve in reID. An investment is complete only after confirmation on the network.</p><div className="hero-showcase-perks">{["Exact quote", "reID approval", "Chain confirmation"].map(text => <div key={text}><Check size={28} aria-hidden="true" />{text}</div>)}</div><a href={catalogueProjectPath(picked.project, catalogue)} className="hero-showcase-next">Explore {picked.project.title} →</a></div>}
        <small>Illustration only · no investment has been made.</small>
      </section>}
      {picked && view.phase === "ready" && <div className="hero-showcase-confetti" aria-hidden="true">{Array.from({ length: 48 }, (_, index) => <i key={index} style={{ "--x": `${(index * 137.5) % 100}%`, "--drift": `${((index * 47) % 300) - 150}px`, "--fall": `${cfg.H + 80}px`, "--spin": `${360 + (index * 97) % 720}deg`, "--delay": `${(index % 8) * 55}ms`, "--duration": `${2200 + (index % 7) * 150}ms`, background: ["#0091ff", "#21b8e6", "#ff7ab6", "#ffd23f", "#4ade80", "#a78bfa"][index % 6] } as CSSProperties} />)}</div>}
      <div className="hero-showcase-ripple" ref={ripple} aria-hidden="true" />
      <svg className="hero-showcase-cursor" ref={cursor} viewBox="0 0 24 24" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <circle key={index} className="hero-showcase-spark" cx="6" cy="10" r="2.4" fill={["#0091ff", "#21b8e6", "#ff7ab6", "#ffd23f"][index % 4]} style={{ "--spark-y": `${(index % 5 - 2) * 5}px`, "--spark-delay": `${index * 70}ms` } as CSSProperties} />)}<path d="M4 2l15 11.5-6.6.9 3.9 7.6-3 1.5-3.9-7.7L4 20.5z" fill="#0b2559" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" /></svg>
      <div className="hero-showcase-foot">Choose a project. Review every approval.</div>
    </div>
    {items.length > 0 && <div className="hero-showcase-controls"><button type="button" aria-label="Previous project" disabled={!canRotate} onClick={() => select(-1)}><ArrowLeft size={18} aria-hidden="true" /></button><span aria-hidden="true">{currentIndex + 1} / {items.length}</span><button type="button" aria-label="Next project" disabled={!canRotate} onClick={() => select(1)}><ArrowRight size={18} aria-hidden="true" /></button></div>}
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
  </div>;
}
