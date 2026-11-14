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

function showcase({ projects = [alpha, beta, gamma], loading = false, error = false, inView = true, reduced = false, hidden = false } = {}) {
  const env = { projects, loading, error, inView, reduced, hidden, retries: 0 };
  let now = 1_000_000, sequence = 0;
  const timers = new Map();
  class Clock extends Date { static now() { return now; } }
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => env.hidden });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => env.hidden ? 'hidden' : 'visible' });
  const testWindow = { matchMedia: () => ({ matches: env.reduced }) };
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
  const active = () => view.container.querySelector('.hero-showcase-slide[data-active="true"]');
  const activeTitle = () => active()?.querySelector('h3').textContent ?? null;
  const refresh = changes => { Object.assign(env, changes); view.rerender(element()); };
  const advance = milliseconds => {
    const until = now + milliseconds;
    for (;;) {
      const due = [...timers].filter(([, task]) => task.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      now = due[1].at; timers.delete(due[0]); act(() => due[1].callback());
    }
    now = until;
  };
  const visibility = value => act(() => { env.hidden = value; document.dispatchEvent(new window.Event('visibilitychange')); });
  const pointer = (type, { x, y, id = 1, pointerType = 'touch', primary = true }) => {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    for (const [key, value] of Object.entries({ clientX: x, clientY: y, pointerId: id, pointerType, isPrimary: primary })) Object.defineProperty(event, key, { value });
    fireEvent(view.container.querySelector('.hero-showcase-stage'), event);
  };
  return { env, timers, view, active, activeTitle, refresh, advance, visibility, pointer };
}

test('the carousel renders real published project content, artwork and public detail links only', () => {
  const draft = make(4, 'Unpublished private draft', { status: 'DRAFT' });
  const f = showcase({ projects: [alpha, beta, gamma, draft] });
  assert.equal(f.view.getByRole('region').getAttribute('aria-roledescription'), 'carousel');
  assert.equal(f.view.container.querySelectorAll('.hero-showcase-slide').length, 3);
  assert.equal(f.activeTitle(), alpha.project.title);
  assert.deepEqual([...f.view.container.querySelectorAll('.hero-showcase-card')].map(link => link.getAttribute('href')), [
    '/projects/alpha-project-00000000000040008000000000000001',
    '/projects/beta-project-00000000000040008000000000000002',
    '/projects/gamma-project-00000000000040008000000000000003',
  ]);
  assert.match(f.view.container.querySelector('img').getAttribute('src'), /^\/api\/artwork\/00000000-0000-4000-8000-000000000001\/Qm/);
  assert.doesNotMatch(f.view.container.textContent, /Unpublished private draft|You're in|You’re in|\$353|Guaranteed/i);
  for (const slide of f.view.container.querySelectorAll('.hero-showcase-slide')) {
    const active = slide.getAttribute('data-active') === 'true';
    assert.equal(slide.getAttribute('aria-hidden'), String(!active));
    assert.equal(slide.querySelector('a').getAttribute('tabindex'), active ? '0' : '-1');
    assert.equal(slide.hasAttribute('inert'), !active);
  }
});

test('previous, next and project dots wrap and announce manual selection', () => {
  const f = showcase();
  fireEvent.click(f.view.getByRole('button', { name: 'Previous project' }));
  assert.equal(f.activeTitle(), gamma.project.title);
  fireEvent.click(f.view.getByRole('button', { name: 'Next project' }));
  assert.equal(f.activeTitle(), alpha.project.title);
  fireEvent.click(f.view.getByRole('button', { name: 'Show Beta project' }));
  assert.equal(f.activeTitle(), beta.project.title);
  assert.equal(f.view.getByRole('button', { name: 'Show Beta project' }).getAttribute('aria-current'), 'true');
  assert.match(f.view.getByRole('status').textContent, /Beta project, project 2 of 3/);
});

test('the selected real project survives catalogue reordering, then removal falls back to a present record', () => {
  const f = showcase();
  f.refresh({ projects: [gamma, beta, alpha] });
  assert.equal(f.activeTitle(), alpha.project.title, 'the first displayed record must be bound before any manual or automatic rotation');
  fireEvent.click(f.view.getByRole('button', { name: 'Show Beta project' }));
  f.refresh({ projects: [beta, alpha, gamma] });
  assert.equal(f.activeTitle(), beta.project.title);
  f.refresh({ projects: [gamma, alpha] });
  assert.equal(f.activeTitle(), gamma.project.title);
  assert.equal(f.view.container.querySelectorAll('.hero-showcase-slide[data-active="true"]').length, 1);
  assert.doesNotMatch(f.view.container.textContent, /Beta project/);
});

test('empty, loading, failed and single-project catalogues remain useful without an autoplay timer', () => {
  const f = showcase({ projects: null, loading: true });
  assert.match(f.view.container.textContent, /Loading published projects/);
  assert.equal(f.timers.size, 0);
  assert.equal(f.view.queryByRole('button', { name: 'Next project' }), null);
  f.refresh({ projects: [], loading: false });
  assert.match(f.view.container.textContent, /Published projects will appear/);
  f.refresh({ projects: null, error: true });
  fireEvent.click(f.view.getByRole('button', { name: 'Try again' }));
  assert.equal(f.env.retries, 1);
  f.refresh({ projects: [beta], error: false });
  assert.equal(f.activeTitle(), beta.project.title);
  assert.equal(f.view.getByRole('button', { name: 'Next project' }).disabled, true);
  assert.equal(f.view.getByRole('button', { name: 'Previous project' }).disabled, true);
  assert.equal(f.view.queryByRole('button', { name: 'Pause animation' }), null);
  assert.equal(f.timers.size, 0);
  f.advance(30000); assert.equal(f.activeTitle(), beta.project.title);
});

test('autoplay waits three seconds and respects explicit pause until played again', () => {
  const f = showcase();
  assert.equal(f.view.getByRole('region').getAttribute('data-motion'), 'playing');
  f.advance(2999); assert.equal(f.activeTitle(), alpha.project.title);
  f.advance(1); assert.equal(f.activeTitle(), beta.project.title);
  fireEvent.click(f.view.getByRole('button', { name: 'Pause animation' }));
  f.advance(12000); assert.equal(f.activeTitle(), beta.project.title);
  assert.equal(f.timers.size, 0);
  fireEvent.click(f.view.getByRole('button', { name: 'Play animation' }));
  f.advance(3000); assert.equal(f.activeTitle(), gamma.project.title);
  f.view.unmount(); assert.equal(f.timers.size, 0, 'unmount must cancel rotation');
});

test('hover and keyboard focus pause rotation without hiding the currently focused project', () => {
  const f = showcase(), region = f.view.getByRole('region');
  fireEvent.mouseEnter(region); f.advance(6000); assert.equal(f.activeTitle(), alpha.project.title);
  fireEvent.mouseLeave(region); f.advance(3000); assert.equal(f.activeTitle(), beta.project.title);
  const currentLink = f.active().querySelector('a');
  fireEvent.focus(currentLink); f.advance(6000); assert.equal(f.activeTitle(), beta.project.title);
  fireEvent.blur(currentLink, { relatedTarget: document.body }); f.advance(3000); assert.equal(f.activeTitle(), gamma.project.title);
});

test('explicit Play resumes from hovered keyboard focus, but a new focus or hover interaction pauses it again', () => {
  const f = showcase(), region = f.view.getByRole('region');
  fireEvent.mouseEnter(region);
  fireEvent.click(f.view.getByRole('button', { name: 'Pause animation' }));
  const play = f.view.getByRole('button', { name: 'Play animation' });
  fireEvent.focus(play); fireEvent.click(play);
  assert.equal(f.timers.size, 1, 'explicit resume starts only one rotation deadline');
  f.advance(3000); assert.equal(f.activeTitle(), beta.project.title);
  assert.equal(f.timers.size, 1);
  const next = f.view.getByRole('button', { name: 'Next project' });
  fireEvent.focus(next);
  assert.equal(f.timers.size, 0);
  f.advance(6000); assert.equal(f.activeTitle(), beta.project.title);
  fireEvent.blur(next, { relatedTarget: document.body });
  fireEvent.mouseLeave(region);
  assert.equal(f.timers.size, 1);
  fireEvent.mouseEnter(region);
  assert.equal(f.timers.size, 0);
  f.advance(6000); assert.equal(f.activeTitle(), beta.project.title);
  fireEvent.mouseLeave(region);
  assert.equal(f.timers.size, 1);
  f.advance(3000); assert.equal(f.activeTitle(), gamma.project.title);
});

test('hidden tabs, offscreen content and reduced-motion preference suspend autoplay', () => {
  const f = showcase();
  f.visibility(true); f.advance(6000); assert.equal(f.activeTitle(), alpha.project.title);
  f.visibility(false); f.advance(3000); assert.equal(f.activeTitle(), beta.project.title);
  f.refresh({ inView: false }); f.advance(6000); assert.equal(f.activeTitle(), beta.project.title);
  f.refresh({ inView: true }); f.advance(3000); assert.equal(f.activeTitle(), gamma.project.title);
  f.refresh({ reduced: true }); f.advance(6000); assert.equal(f.activeTitle(), gamma.project.title);
  assert.equal(f.view.queryByRole('button', { name: 'Pause animation' }), null);
  assert.equal(f.timers.size, 0);
  fireEvent.click(f.view.getByRole('button', { name: 'Next project' }));
  assert.equal(f.activeTitle(), alpha.project.title, 'reduced motion keeps manual navigation available');
});

test('a visibility or OS preference change immediately before a due callback prevents a stale automatic rotation', () => {
  for (const guard of ['hidden', 'reduced']) {
    const f = showcase();
    f.env[guard] = true; // Deliberately no event/rerender: exercise the callback admission guard.
    f.advance(3000); assert.equal(f.activeTitle(), alpha.project.title);
    f.view.unmount();
  }
});

test('touch swipes require a horizontal threshold; vertical, cancelled, foreign-pointer and mouse drags do not rotate', () => {
  const f = showcase({ reduced: true });
  const drag = (from, to) => { f.pointer('pointerdown', from); f.pointer('pointerup', to); };
  drag({ x: 180, y: 50 }, { x: 100, y: 55 }); assert.equal(f.activeTitle(), beta.project.title);
  drag({ x: 80, y: 50 }, { x: 165, y: 55 }); assert.equal(f.activeTitle(), alpha.project.title);
  drag({ x: 180, y: 50 }, { x: 150, y: 50 }); assert.equal(f.activeTitle(), alpha.project.title);
  drag({ x: 180, y: 50 }, { x: 100, y: 150 }); assert.equal(f.activeTitle(), alpha.project.title);
  f.pointer('pointerdown', { x: 180, y: 50 }); f.pointer('pointercancel', { x: 180, y: 50 }); f.pointer('pointerup', { x: 60, y: 50 }); assert.equal(f.activeTitle(), alpha.project.title);
  drag({ x: 180, y: 50, id: 1 }, { x: 60, y: 50, id: 2 }); assert.equal(f.activeTitle(), alpha.project.title);
  f.pointer('pointercancel', { x: 180, y: 50, id: 1 });
  drag({ x: 180, y: 50, id: 3, pointerType: 'mouse' }, { x: 60, y: 50, id: 3, pointerType: 'mouse' }); assert.equal(f.activeTitle(), alpha.project.title);
});

test('an active touch gesture suspends rotation and cancellation resumes one fresh timer', () => {
  const f = showcase();
  f.pointer('pointerdown', { x: 180, y: 50 });
  assert.equal(f.timers.size, 0);
  f.advance(6000); assert.equal(f.activeTitle(), alpha.project.title);
  f.pointer('pointercancel', { x: 180, y: 50 });
  assert.equal(f.timers.size, 1);
  f.advance(3000); assert.equal(f.activeTitle(), beta.project.title);
});

test('secondary touches and foreign pointer endings cannot replace or release the active swipe', () => {
  const f = showcase();
  f.pointer('pointerdown', { x: 180, y: 50, id: 1 });
  f.pointer('pointerup', { x: 60, y: 50, id: 2, primary: false });
  assert.equal(f.timers.size, 0, 'a foreign pointer release must not unpause the primary touch');
  f.pointer('pointercancel', { x: 60, y: 50, id: 2, primary: false });
  assert.equal(f.timers.size, 0);
  f.pointer('pointerdown', { x: 300, y: 50, id: 2, primary: false });
  f.pointer('pointerup', { x: 100, y: 50, id: 2, primary: false });
  f.advance(6000); assert.equal(f.activeTitle(), alpha.project.title);
  f.pointer('pointerup', { x: 60, y: 50, id: 1 });
  assert.equal(f.activeTitle(), beta.project.title, 'the original gesture remains the only swipe source');
  assert.equal(f.timers.size, 1);
  f.pointer('pointerdown', { x: 180, y: 50, id: 7 });
  f.pointer('pointercancel', { x: 60, y: 50, id: 8, primary: false });
  assert.equal(f.timers.size, 0);
  f.pointer('pointercancel', { x: 180, y: 50, id: 7 });
  assert.equal(f.timers.size, 1, 'only cancellation of the active pointer resumes rotation');
});

test('failed public artwork falls back without an endless image and a refreshed CID can recover', () => {
  const f = showcase({ projects: [alpha] });
  fireEvent.error(f.view.container.querySelector('img'));
  assert.equal(f.view.container.querySelector('img'), null);
  assert.ok(f.view.container.querySelector('.hero-showcase-art-empty'));
  const changed = { ...alpha, project: { ...alpha.project, media: [{ ...alpha.project.media[0], cid: 'Qm' + 'b'.repeat(44) }] } };
  f.refresh({ projects: [changed] });
  assert.match(f.view.container.querySelector('img').getAttribute('src'), /Qmb{44}/);
});

test('the synthetic click following a successful swipe is blocked, while a later intentional project click is allowed', () => {
  const f = showcase({ reduced: true });
  f.pointer('pointerdown', { x: 180, y: 50 }); f.pointer('pointerup', { x: 60, y: 50 });
  assert.equal(f.activeTitle(), beta.project.title);
  const link = f.active().querySelector('a'); let followed = 0;
  link.addEventListener('click', event => { followed++; event.preventDefault(); });
  const click = new window.MouseEvent('click', { bubbles: true, cancelable: true }); fireEvent(link, click);
  assert.equal(click.defaultPrevented, true); assert.equal(followed, 0);
  f.advance(501); fireEvent.click(link); assert.equal(followed, 1);
});
