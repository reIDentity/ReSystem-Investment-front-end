import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { JSDOM } from 'jsdom';
import { clientRenderer } from './client-renderer.mjs';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://investor.example.invalid' });
for (const [key, value] of Object.entries({ window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement })) Object.defineProperty(globalThis, key, { value, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { render, fireEvent, cleanup, act } = await import('@testing-library/react');
afterEach(cleanup);
const { verifiedLandingProject, landingTotals } = clientRenderer().load('src/lib/platform/landing-data.ts');
const make = (suffix, title, overrides = {}) => verifiedLandingProject({
  id: `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`, title, description: `${title} published description`,
  status: 'PUBLISHED', contractAddress: `0x${'3'.repeat(40)}`, publicationBlock: '100', publicationTxHash: `0x${'4'.repeat(64)}`,
  maxFractions: '10000', totalValueUsdtAtomic: '10000000', unitPriceUsdtAtomic: '1000', unitPriceReaedAtomic: '3600000000000000',
  media: [{ cid: 'Qm' + 'a'.repeat(44), mimeType: 'image/png', filename: 'public-artwork.png' }], ...overrides,
}, { chainId: 15324, source: 'INFRA RPC', headBlock: '200', totalSupply: '22', remainingSupply: '9978', maxFractions: '10000', totalValueUSDT: '10000000', unitPriceUSDT: '1000', saleOpen: true, purchasePaused: false }, null, Date.now());
const alpha = make(1, 'Alpha project'), beta = make(2, 'Beta project'), gamma = make(3, 'Gamma project');
const href = (row, suffixLength = 32) => `/projects/${row.project.title.toLowerCase().replaceAll(' ', '-')}-${row.project.id.replaceAll('-', '').slice(0, suffixLength)}`;

function showcase({ projects = [alpha, beta, gamma], loading = false, error = false, inView = true, reduced = false, hidden = false, width = 1200, height = 800 } = {}) {
  const env = { projects, loading, error, inView, reduced, hidden, retries: 0 };
  let now = 1_000_000, sequence = 0;
  const frames = new Map(), timers = new Map(), listeners = new Map(), observers = new Set();
  class Clock extends Date { static now() { return now; } }
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => env.hidden });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => env.hidden ? 'hidden' : 'visible' });
  class ResizeObserver {
    constructor(callback) { this.callback = callback; this.connected = true; observers.add(this); }
    observe(element) { this.element = element; }
    disconnect() { this.connected = false; observers.delete(this); }
  }
  const testWindow = {
    innerWidth: width, innerHeight: height,
    matchMedia: () => ({ matches: env.reduced }), ResizeObserver,
    performance: { now: () => now },
    requestAnimationFrame(callback) { const id = ++sequence; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    addEventListener(name, callback) { const values = listeners.get(name) || new Set(); values.add(callback); listeners.set(name, values); },
    removeEventListener(name, callback) { listeners.get(name)?.delete(callback); },
  };
  const clock = {
    Date: Clock, window: testWindow,
    setTimeout(callback, delay) { const id = ++sequence; timers.set(id, { callback, at: now + Number(delay) }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  const motion = { useInView: () => [React.useRef(null), env.inView], usePrefersReducedMotion: () => env.reduced };
  const context = { useLanding: () => ({ projects: env.projects, loading: env.loading, error: env.error, retry() { env.retries++; }, totals: landingTotals(env.projects) }) };
  const image = props => { const forwarded = { ...props }; delete forwarded.fill; delete forwarded.unoptimized; return React.createElement('img', forwarded); };
  const { HeroVisual } = clientRenderer({ '@/hooks/motion': motion, './LandingData': context, 'next/image': { __esModule: true, default: image } }, {}, clock).load('src/components/HeroVisual.tsx');
  const element = () => React.createElement(HeroVisual);
  const view = render(element());
  const slides = () => [...view.container.querySelectorAll('.hero-showcase-slide')];
  const stage = () => view.container.querySelector('.hero-showcase-stage');
  const selectedIndex = () => Number(view.container.querySelector('.hero-showcase-controls > span')?.textContent.split('/')[0] || 1) - 1;
  const activeTitle = () => slides()[selectedIndex()]?.querySelector('h3').textContent ?? null;
  const refresh = changes => { Object.assign(env, changes); view.rerender(element()); };
  const frame = (milliseconds = 16) => {
    now += milliseconds;
    const due = [...frames.values()]; frames.clear();
    act(() => {
      for (const callback of due) callback(now);
      for (const [id, task] of [...timers]) if (task.at <= now) { timers.delete(id); task.callback(); }
    });
  };
  const advance = milliseconds => { let left = milliseconds; while (left > 0) { const step = Math.min(16, left); frame(step); left -= step; } };
  const untilPhase = (phase, maximum = 20000) => {
    for (let elapsed = 0; elapsed <= maximum; elapsed += 16) {
      if (stage()?.dataset.phase === phase) return;
      frame();
    }
    assert.fail(`The real animation did not reach ${phase} within ${maximum}ms`);
  };
  const visibility = value => act(() => { env.hidden = value; document.dispatchEvent(new window.Event('visibilitychange')); });
  const resize = (w, h) => act(() => { testWindow.innerWidth = w; testWindow.innerHeight = h; for (const callback of listeners.get('resize') || []) callback(); });
  const pointer = (type, { x, y, id = 1, pointerType = 'touch', primary = true, target }) => {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    for (const [key, value] of Object.entries({ clientX: x, clientY: y, pointerId: id, pointerType, isPrimary: primary })) Object.defineProperty(event, key, { value });
    fireEvent(target || view.container.querySelector('.hero-showcase-track'), event);
  };
  return { env, frames, timers, listeners, observers, view, slides, stage, selectedIndex, activeTitle, refresh, frame, advance, untilPhase, visibility, resize, pointer };
}

function assertCurrentLink(f) {
  const selected = f.slides().filter(slide => slide.getAttribute('data-active') === 'true');
  assert.equal(selected.length, 1);
  for (const slide of f.slides()) {
    const active = slide === selected[0];
    assert.equal(slide.getAttribute('aria-hidden'), String(!active));
    assert.equal(slide.querySelector('a').getAttribute('tabindex'), active ? '0' : '-1');
    assert.equal(slide.hasAttribute('inert'), !active);
  }
}

test('the illustration uses real published project content, safe artwork and native public links without financial actions', () => {
  const draft = make(4, 'Unpublished private draft', { status: 'DRAFT' });
  const f = showcase({ projects: [alpha, beta, gamma, draft] });
  assert.equal(f.view.getByRole('region').getAttribute('aria-roledescription'), 'carousel');
  assert.equal(f.slides().length, 3);
  assert.equal(f.activeTitle(), alpha.project.title);
  assert.deepEqual([...f.view.container.querySelectorAll('.hero-showcase-card')].map(link => link.getAttribute('href')), [alpha, beta, gamma].map(row => href(row)));
  assert.match(f.view.container.querySelector('img').getAttribute('src'), /^\/api\/artwork\/00000000-0000-4000-8000-000000000001\/Qm/);
  assert.doesNotMatch(f.view.container.textContent, /Unpublished private draft|You're in|You’re in|rewards unlocked|Thanks for investing|Reward tokens|Growth share|Early-bird perks|Guaranteed/i);
  assert.match(f.view.container.textContent, /illustration/i);
  assertCurrentLink(f);
  for (const link of f.view.container.querySelectorAll('a')) {
    assert.match(link.getAttribute('href'), /^\/projects\/[a-z0-9-]+$/);
    assert.doesNotMatch(link.getAttribute('href'), /oauth|token|wallet|transactions|approve/);
  }
});

test('previous and next wrap, announce manual navigation and remain paused until explicit Play', () => {
  const f = showcase();
  fireEvent.click(f.view.getByRole('button', { name: 'Previous project' }));
  assert.equal(f.activeTitle(), gamma.project.title);
  assert.equal(f.frames.size, 0);
  assert.match(f.view.getByRole('status').textContent, /Gamma project, project 3 of 3/);
  f.advance(20000); assert.equal(f.activeTitle(), gamma.project.title);
  fireEvent.click(f.view.getByRole('button', { name: 'Next project' }));
  assert.equal(f.activeTitle(), alpha.project.title);
  assert.equal(f.stage().dataset.phase, 'swipe');
  assertCurrentLink(f);
  fireEvent.click(f.view.getByRole('button', { name: 'Play animation' }));
  assert.equal(f.frames.size, 1);
  f.advance(2400); assert.notEqual(f.activeTitle(), alpha.project.title);
});

test('continuous fractional drag paints intermediate 3D poses before changing the active project', () => {
  const f = showcase();
  f.advance(1600);
  const before = f.slides()[0].style.transform;
  f.advance(80);
  const after = f.slides()[0].style.transform;
  assert.notEqual(before, after);
  assert.match(after, /translateX\(.+px\).*translateZ\(.+px\).*rotateY\(.+deg\).*rotateZ\(.+deg\).*scale\(/);
  assert.notEqual(f.slides()[0].style.getPropertyValue('--showcase-tint'), '0');
  assert.ok(Number(f.slides()[0].style.opacity) > 0);
  assert.equal(f.frames.size, 1, 'only one animation loop may be active');
});

test('a delayed visible RAF advances the full wall-clock interval without slowing the reference timeline', () => {
  const { showcaseFrame, showcasePose } = clientRenderer().load('src/components/hero/showcase-motion.ts');
  const f = showcase();
  f.frame(); // Establish the initial RAF clock anchor without consuming animation time.
  f.advance(1600);
  const before = f.slides()[0].style.transform;
  f.frame(200); // A visible frame arrives 200ms late, for example on a slower device.
  const frame = showcaseFrame(1800, 'desktop', 3);
  let offset = ((-frame.position % 3) + 3) % 3;
  if (offset > 1.5) offset -= 3;
  const active = ((Math.round(frame.position) % 3) + 3) % 3;
  const pose = showcasePose(offset, 'desktop', frame.velocity, active === 0 ? frame.lift : 0);
  const actual = f.slides()[0].style.transform;
  assert.notEqual(actual, before);
  assert.ok(actual.includes(`translateX(${pose.x}px)`), 'the pose must match all 200ms of visible elapsed time, not a capped 50ms');
  assert.ok(actual.includes(`rotateZ(${pose.rotateZ}deg)`));
  assert.equal(f.frames.size, 1, 'a delayed callback must still schedule only one successor RAF');
});

test('the autonomous preview and bounded celebratory illustration never assert a completed investment', () => {
  const f = showcase();
  f.untilPhase('detail');
  const preview = f.view.getByRole('region', { name: 'Illustrated investment walkthrough' });
  assert.equal(preview.hasAttribute('inert'), false);
  assert.equal(f.slides().filter(slide => slide.getAttribute('data-active') === 'true').length, 0);
  assert.ok(f.slides().every(slide => slide.hasAttribute('inert')));
  assert.match(preview.textContent, /no investment has been made/);
  assert.equal(preview.querySelector('a').getAttribute('href'), href([alpha, beta, gamma][f.selectedIndex()]));
  f.untilPhase('ready');
  assert.match(preview.textContent, /Review and approve/);
  assert.match(preview.textContent, /only after confirmation on INFRA/);
  assert.doesNotMatch(preview.textContent, /You're in|You’re in|unlocked|Thanks for investing|Guaranteed/i);
  assert.equal(f.view.container.querySelectorAll('.hero-showcase-confetti > i').length, 48);
  assert.equal(f.view.container.querySelectorAll('.hero-showcase-cursor').length, 1);
  assert.equal(f.view.container.querySelectorAll('.hero-showcase-ripple').length, 1);
  assert.equal(f.view.container.querySelector('.hero-showcase-confetti').getAttribute('aria-hidden'), 'true');
  f.advance(4000);
  assert.equal(f.view.container.querySelectorAll('.hero-showcase-confetti > i').length, 0);
  assertCurrentLink(f);
  f.untilPhase('ready');
  assert.equal(f.view.container.querySelectorAll('.hero-showcase-confetti > i').length, 48, 'successive cycles replace, rather than accumulate, particles');
});

test('hidden tabs, offscreen content and hover freeze poses without a wall-clock catch-up on resume', () => {
  for (const condition of ['hidden', 'offscreen', 'hover']) {
    const f = showcase(); f.advance(1700);
    const pause = condition === 'hidden' ? () => f.visibility(true) : condition === 'offscreen' ? () => f.refresh({ inView: false }) : () => fireEvent.mouseEnter(f.view.getByRole('region', { name: /Invest early/ }));
    const resume = condition === 'hidden' ? () => f.visibility(false) : condition === 'offscreen' ? () => f.refresh({ inView: true }) : () => fireEvent.mouseLeave(f.view.getByRole('region', { name: /Invest early/ }));
    pause();
    const pose = f.slides()[0].style.transform, phase = f.stage().dataset.phase;
    assert.equal(f.frames.size, 0);
    f.advance(60000);
    assert.equal(f.slides()[0].style.transform, pose);
    assert.equal(f.stage().dataset.phase, phase);
    resume(); assert.equal(f.frames.size, 1);
    f.frame(); assert.equal(f.slides()[0].style.transform, pose, 'the first resumed frame only reanchors the clock');
    f.advance(64); assert.notEqual(f.slides()[0].style.transform, pose);
    f.view.unmount();
  }
});

test('keyboard focus freezes the active link or preview and a new interaction pauses explicit Play', () => {
  const f = showcase(); f.advance(1700);
  const link = f.slides().find(slide => slide.dataset.active === 'true').querySelector('a');
  fireEvent.focus(link);
  const pose = f.slides()[0].style.transform;
  assert.equal(f.frames.size, 0);
  f.advance(6000); assert.equal(f.slides()[0].style.transform, pose);
  assert.equal(link.closest('[aria-hidden]').getAttribute('aria-hidden'), 'false');
  fireEvent.blur(link, { relatedTarget: document.body });
  f.untilPhase('detail');
  const previewLink = f.view.getByRole('link', { name: /View this project/ });
  fireEvent.focus(previewLink); f.advance(6000);
  assert.equal(f.stage().dataset.phase, 'detail');
  assert.equal(previewLink.closest('section').hasAttribute('inert'), false);
  fireEvent.click(f.view.getByRole('button', { name: 'Pause animation' }));
  const play = f.view.getByRole('button', { name: 'Play animation' });
  fireEvent.focus(play); fireEvent.click(play);
  assert.equal(f.frames.size, 1);
  fireEvent.focus(f.view.getByRole('button', { name: 'Next project' }));
  assert.equal(f.frames.size, 0);
});

test('manual pause persists across hover, visibility and offscreen changes; unmount cleans RAF and observers', () => {
  const f = showcase(); f.advance(1700);
  fireEvent.click(f.view.getByRole('button', { name: 'Pause animation' }));
  const pose = f.slides()[0].style.transform;
  f.visibility(true); f.visibility(false);
  f.refresh({ inView: false }); f.refresh({ inView: true });
  fireEvent.mouseEnter(f.view.getByRole('region', { name: /Invest early/ })); fireEvent.mouseLeave(f.view.getByRole('region', { name: /Invest early/ }));
  f.advance(20000); assert.equal(f.slides()[0].style.transform, pose);
  assert.equal(f.frames.size, 0);
  fireEvent.click(f.view.getByRole('button', { name: 'Play animation' })); assert.equal(f.frames.size, 1);
  assert.equal(f.observers.size, 1); assert.equal(f.listeners.get('resize').size, 1);
  f.view.unmount();
  assert.equal(f.frames.size, 0); assert.equal(f.timers.size, 0); assert.equal(f.observers.size, 0); assert.equal(f.listeners.get('resize').size, 0);
  f.advance(30000); assert.equal(f.frames.size, 0);
});

test('reduced motion starts as a static current project, never schedules a loop and retains manual navigation', () => {
  const f = showcase({ reduced: true });
  assert.equal(f.frames.size, 0);
  assert.equal(f.view.getByRole('region', { name: /Invest early/ }).dataset.reduced, 'true');
  assert.equal(f.view.queryByRole('button', { name: 'Pause animation' }), null);
  f.advance(30000); assert.equal(f.activeTitle(), alpha.project.title);
  assert.equal(f.stage().dataset.phase, 'swipe');
  assert.equal(f.view.queryByRole('region', { name: 'Illustrated investment walkthrough' }), null);
  fireEvent.click(f.view.getByRole('button', { name: 'Next project' }));
  assert.equal(f.activeTitle(), beta.project.title); assertCurrentLink(f);
  assert.equal(f.frames.size, 0);
});

test('a visibility or OS preference change immediately before a due RAF prevents stale motion', () => {
  for (const guard of ['hidden', 'reduced']) {
    const f = showcase(); f.advance(1700);
    const pose = f.slides()[0].style.transform;
    f.env[guard] = true; // Deliberately no event/render: exercise admission in the real tick.
    f.frame(); assert.equal(f.slides()[0].style.transform, pose); assert.equal(f.frames.size, 0);
    f.view.unmount();
  }
});

test('changing to reduced motion during the walkthrough closes its animated overlay and removes particles', () => {
  const f = showcase(); f.untilPhase('ready');
  assert.equal(f.view.container.querySelectorAll('.hero-showcase-confetti > i').length, 48);
  f.refresh({ reduced: true });
  assert.equal(f.frames.size, 0);
  assert.equal(f.stage().dataset.phase, 'swipe');
  assert.equal(f.view.container.querySelectorAll('.hero-showcase-confetti > i').length, 0);
  assert.equal(f.view.queryByRole('region', { name: 'Illustrated investment walkthrough' }), null);
  assertCurrentLink(f);
  const pose = f.slides()[0].style.transform;
  f.advance(20000); assert.equal(f.slides()[0].style.transform, pose);
});

test('resuming the autonomous timeline does not repeatedly announce a stale manual project selection', () => {
  const f = showcase();
  fireEvent.click(f.view.getByRole('button', { name: 'Next project' }));
  assert.match(f.view.getByRole('status').textContent, /Beta project/);
  fireEvent.click(f.view.getByRole('button', { name: 'Play animation' }));
  f.advance(4000);
  assert.equal(f.view.getByRole('status').textContent, '');
});

test('catalogue reordering keeps selection bound to a present real record and removal cannot retain stale preview identity', () => {
  const f = showcase();
  fireEvent.click(f.view.getByRole('button', { name: 'Next project' }));
  assert.equal(f.activeTitle(), beta.project.title);
  f.refresh({ projects: [gamma, beta, alpha] }); assert.equal(f.activeTitle(), beta.project.title);
  f.refresh({ projects: [gamma, alpha] });
  assert.notEqual(f.activeTitle(), beta.project.title);
  assert.ok([alpha.project.title, gamma.project.title].includes(f.activeTitle()));
  assert.doesNotMatch(f.view.container.textContent, /Beta project/);
  assertCurrentLink(f);
  f.view.unmount();
  const g = showcase(); g.untilPhase('detail');
  const removed = [alpha, beta, gamma][g.selectedIndex()];
  g.refresh({ projects: [alpha, beta, gamma].filter(row => row !== removed) });
  assert.equal(g.stage().dataset.phase, 'swipe');
  assert.doesNotMatch(g.view.container.textContent, new RegExp(removed.project.title));
  assertCurrentLink(g);
});

test('empty, loading, failed and single-project catalogues do not start or retain an autonomous loop', () => {
  const f = showcase({ projects: null, loading: true });
  assert.match(f.view.container.textContent, /Loading published projects/); assert.equal(f.frames.size, 0);
  f.refresh({ projects: [], loading: false }); assert.match(f.view.container.textContent, /Published projects will appear/);
  f.refresh({ projects: null, error: true }); fireEvent.click(f.view.getByRole('button', { name: 'Try again' })); assert.equal(f.env.retries, 1);
  f.refresh({ projects: [beta], error: false }); assert.equal(f.activeTitle(), beta.project.title);
  assert.equal(f.view.getByRole('button', { name: 'Next project' }).disabled, true);
  assert.equal(f.view.queryByRole('button', { name: 'Pause animation' }), null);
  assert.equal(f.frames.size, 0); f.advance(30000); assert.equal(f.activeTitle(), beta.project.title);
  f.refresh({ projects: [alpha, beta, gamma] }); assert.equal(f.frames.size, 1);
  f.untilPhase('detail'); f.refresh({ projects: [] });
  assert.equal(f.frames.size, 0); assert.equal(f.slides().length, 0);
  assert.equal(f.view.queryByRole('region', { name: 'Illustrated investment walkthrough' }), null);
});

test('portrait and landscape layout follow orientation, resizing without duplicating observers or loops', () => {
  const f = showcase({ width: 1200, height: 800 });
  assert.equal(f.view.getByRole('region', { name: /Invest early/ }).dataset.layout, 'desktop');
  f.resize(900, 1200);
  assert.equal(f.view.getByRole('region', { name: /Invest early/ }).dataset.layout, 'mobile');
  assert.equal(f.view.getByRole('region', { name: /Invest early/ }).style.aspectRatio, '1080 / 1920');
  assert.equal(f.observers.size, 1); assert.equal(f.frames.size, 1);
  f.resize(1200, 900);
  assert.equal(f.view.getByRole('region', { name: /Invest early/ }).dataset.layout, 'desktop');
  assert.equal(f.frames.size, 1);
});

test('changing orientation during Ready resets the walkthrough without leaving a stale overlay or particles', () => {
  const f = showcase(); f.untilPhase('ready');
  const selected = f.activeTitle();
  assert.equal(f.view.container.querySelectorAll('.hero-showcase-confetti > i').length, 48);
  f.resize(900, 1200);
  assert.equal(f.view.getByRole('region', { name: /Invest early/ }).dataset.layout, 'mobile');
  assert.equal(f.stage().dataset.phase, 'swipe');
  assert.equal(f.activeTitle(), selected);
  assert.equal(f.view.container.querySelectorAll('.hero-showcase-confetti > i').length, 0);
  assert.equal(f.view.queryByRole('region', { name: 'Illustrated investment walkthrough' }), null);
  assertCurrentLink(f); assert.equal(f.frames.size, 1);
  f.frame(); assert.equal(f.stage().dataset.phase, 'swipe');
});

test('empty and failed catalogue refreshes during Ready clear all overlay effects before any recovery', () => {
  for (const failed of [false, true]) {
    const f = showcase(); f.untilPhase('ready');
    assert.equal(f.view.container.querySelectorAll('.hero-showcase-confetti > i').length, 48);
    f.refresh({ projects: failed ? null : [], error: failed });
    assert.equal(f.stage().dataset.phase, 'swipe');
    assert.equal(f.view.container.querySelectorAll('.hero-showcase-confetti > i').length, 0);
    assert.equal(f.view.queryByRole('region', { name: 'Illustrated investment walkthrough' }), null);
    assert.equal(f.slides().length, 0); assert.equal(f.frames.size, 0);
    assert.match(f.view.container.textContent, failed ? /Projects are temporarily unavailable/ : /Published projects will appear/);
    f.advance(30000); assert.equal(f.frames.size, 0);
    f.refresh({ projects: [alpha, beta, gamma], error: false });
    assert.equal(f.stage().dataset.phase, 'swipe');
    assert.equal(f.view.container.querySelectorAll('.hero-showcase-confetti > i').length, 0);
    assertCurrentLink(f); assert.equal(f.frames.size, 1);
    f.view.unmount();
  }
});

test('touch swipes require a horizontal threshold; vertical, cancelled, secondary, foreign-pointer and mouse gestures cannot navigate', () => {
  const f = showcase({ reduced: true });
  const drag = (from, to) => { f.pointer('pointerdown', from); f.pointer('pointerup', to); };
  drag({ x: 180, y: 50 }, { x: 100, y: 55 }); assert.equal(f.activeTitle(), beta.project.title);
  drag({ x: 80, y: 50 }, { x: 165, y: 55 }); assert.equal(f.activeTitle(), alpha.project.title);
  drag({ x: 180, y: 50 }, { x: 150, y: 50 }); assert.equal(f.activeTitle(), alpha.project.title);
  drag({ x: 180, y: 50 }, { x: 100, y: 150 }); assert.equal(f.activeTitle(), alpha.project.title);
  f.pointer('pointerdown', { x: 180, y: 50 }); f.pointer('pointercancel', { x: 180, y: 50 }); f.pointer('pointerup', { x: 60, y: 50 }); assert.equal(f.activeTitle(), alpha.project.title);
  f.pointer('pointerdown', { x: 180, y: 50, id: 1 });
  f.pointer('pointerdown', { x: 300, y: 50, id: 2, primary: false });
  f.pointer('pointerup', { x: 60, y: 50, id: 2, primary: false });
  f.pointer('pointercancel', { x: 60, y: 50, id: 2, primary: false });
  assert.equal(f.activeTitle(), alpha.project.title);
  f.pointer('pointercancel', { x: 180, y: 50, id: 1 });
  drag({ x: 180, y: 50, id: 3, pointerType: 'mouse' }, { x: 60, y: 50, id: 3, pointerType: 'mouse' }); assert.equal(f.activeTitle(), alpha.project.title);
});

test('an active touch gesture pauses RAF; cancellation resumes exactly one loop and successful swipe waits for Play', () => {
  const f = showcase(); f.advance(1700);
  f.pointer('pointerdown', { x: 180, y: 50, id: 7 }); assert.equal(f.frames.size, 0);
  f.pointer('pointercancel', { x: 180, y: 50, id: 8 }); assert.equal(f.frames.size, 0);
  f.advance(6000); f.pointer('pointercancel', { x: 180, y: 50, id: 7 }); assert.equal(f.frames.size, 1);
  f.pointer('pointerdown', { x: 180, y: 50 }); f.pointer('pointerup', { x: 60, y: 50 });
  assert.equal(f.frames.size, 0); f.advance(20000); assert.equal(f.stage().dataset.phase, 'swipe');
});

test('touch captures its original card child, preserving stationary native link taps and matching lost-capture cleanup', () => {
  const f = showcase();
  const link = f.slides()[0].querySelector('a'), child = link.querySelector('img');
  const track = f.view.container.querySelector('.hero-showcase-track');
  const captures = [];
  child.setPointerCapture = id => captures.push(['child', id]);
  track.setPointerCapture = id => captures.push(['track', id]);
  f.pointer('pointerdown', { x: 120, y: 150, id: 41, target: child });
  assert.deepEqual(captures, [['child', 41]]);
  assert.equal(f.frames.size, 0);
  f.pointer('pointerup', { x: 120, y: 150, id: 41, target: child });
  assert.equal(f.frames.size, 1);
  let followed = 0;
  link.addEventListener('click', event => { followed++; event.preventDefault(); });
  fireEvent.click(child);
  assert.equal(followed, 1, 'a stationary touch must leave the card native link reachable');
  assert.equal(f.activeTitle(), alpha.project.title);
  f.pointer('pointerdown', { x: 120, y: 150, id: 42, target: child });
  assert.equal(f.frames.size, 0);
  f.pointer('lostpointercapture', { x: 120, y: 150, id: 99, target: child });
  assert.equal(f.frames.size, 0, 'another pointer cannot release this gesture');
  f.pointer('lostpointercapture', { x: 120, y: 150, id: 42, target: child });
  assert.equal(f.frames.size, 1);
  f.pointer('lostpointercapture', { x: 120, y: 150, id: 42, target: child });
  assert.equal(f.frames.size, 1, 'a stale lost-capture event cannot create a second animation loop');
  assert.deepEqual(captures, [['child', 41], ['child', 42]]);
});

test('failed public artwork falls back without a request loop and refreshed content/CID updates the same project', () => {
  const f = showcase({ projects: [alpha] });
  const first = f.slides()[0].querySelector('img'); fireEvent.error(first);
  assert.equal(f.slides()[0].querySelector('img'), null);
  assert.ok(f.slides()[0].querySelector('.hero-showcase-art-empty'));
  const changed = { ...alpha, project: { ...alpha.project, title: 'Updated real title', description: 'Updated public description', media: [{ ...alpha.project.media[0], cid: 'Qm' + 'b'.repeat(44) }] } };
  f.refresh({ projects: [changed] });
  assert.equal(f.activeTitle(), changed.project.title);
  assert.match(f.slides()[0].textContent, /Updated public description/);
  assert.match(f.slides()[0].querySelector('img').getAttribute('src'), /Qmb{44}/);
  assert.equal(f.slides()[0].querySelector('a').getAttribute('href'), href(changed, 12));
});

test('the synthetic click following a successful swipe is blocked while a later native project click remains allowed', () => {
  const f = showcase({ reduced: true });
  f.pointer('pointerdown', { x: 180, y: 50 }); f.pointer('pointerup', { x: 60, y: 50 });
  const link = f.slides().find(slide => slide.dataset.active === 'true').querySelector('a'); let followed = 0;
  link.addEventListener('click', event => { followed++; event.preventDefault(); });
  const click = new window.MouseEvent('click', { bubbles: true, cancelable: true }); fireEvent(link, click);
  assert.equal(click.defaultPrevented, true); assert.equal(followed, 0);
  f.advance(501); fireEvent.click(link); assert.equal(followed, 1);
});
