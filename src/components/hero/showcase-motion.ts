export type ShowcaseMode = "desktop" | "mobile";
type Point = readonly [number, number];

/** Fixed reference coordinates, scaled by the presentation layer rather than the timeline. */
export const SHOWCASE_LAYOUTS = {
  desktop: {
    W: 1920, H: 1080, cardWidth: 420, cardHeight: 544, cardTop: 600,
    cursorStart: [1800, 1100], swipe: [1180, 620], drag: 330,
    target: [1010, 640], ctaTarget: [1060, 735], rest: [1560, 940], fall: 1150,
  },
  mobile: {
    W: 1080, H: 1920, cardWidth: 640, cardHeight: 829, cardTop: 1080,
    cursorStart: [1000, 1960], swipe: [780, 1100], drag: 360,
    target: [580, 1120], ctaTarget: [565, 1385], rest: [880, 1700], fall: 2000,
  },
} as const;

export const SHOWCASE_START_DELAY_MS = 300;
export const SHOWCASE_CYCLE_MS = 15270;

// [distance, x, scale, rotateY, tint, opacity, blur]. These are the supplied reference keyframes.
const KEYFRAMES = {
  desktop: [[0, 0, 1, 0, 0, 1, 0], [1, 360, .8, 18, .55, .92, 1], [2, 640, .62, 30, .75, .55, 1], [2.5, 760, .55, 34, .8, 0, 1]],
  mobile: [[0, 0, 1, 0, 0, 1, 0], [1, 420, .78, 18, .55, .92, 1], [2, 620, .6, 30, .75, .5, 1], [2.5, 700, .55, 34, .8, 0, 1]],
} as const;

const finite = (value: number) => Number.isFinite(value) ? value : 0;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const clean = (value: number) => value === 0 || !Number.isFinite(value) ? 0 : value;
const ease = (value: number) => { const t = clamp(value); return t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2; };
const easeDerivative = (value: number) => { const t = clamp(value); return 12 * (t < .5 ? t ** 2 : (1 - t) ** 2); };

export type ShowcasePose = {
  x: number; y: number; z: number; scale: number; rotateY: number; rotateZ: number;
  tint: number; opacity: number; blur: number; zIndex: number;
};

/** Signed, already-wrapped carousel offset. Pass lift only for the selected card. */
export function showcasePose(offset: number, mode: ShowcaseMode, velocity = 0, lift = 0): ShowcasePose {
  const distance = Math.abs(finite(offset)), sign = Math.sign(finite(offset)), frames = KEYFRAMES[mode];
  let values: readonly number[] = frames[frames.length - 1];
  for (let index = 1; index < frames.length; index++) {
    if (distance <= frames[index][0]) {
      const left = frames[index - 1], right = frames[index], t = (distance - left[0]) / (right[0] - left[0]);
      values = left.map((value, column) => value + (right[column] - value) * t);
      break;
    }
  }
  const appliedLift = clamp(finite(lift));
  return {
    x: clean(values[1] * sign), y: clean(-14 * appliedLift), z: clean(-200 * Math.min(distance, 1)),
    scale: values[2] * (1 + .04 * appliedLift), rotateY: clean(-values[3] * sign), rotateZ: clean(finite(velocity) * -1.6),
    tint: values[4], opacity: values[5], blur: values[6], zIndex: 100 - Math.round(Math.min(distance, Number.MAX_SAFE_INTEGER / 20) * 20),
  };
}

export type ShowcaseFrame = {
  /** Unwrapped position: each complete reference cycle advances three projects. */
  position: number;
  /** Carousel positions per second, from the analytic derivative of the reference cubic easing. */
  velocity: number;
  lift: number;
  cursorX: number;
  cursorY: number;
  cursorPressed: boolean;
  phase: "swipe" | "hover" | "detail" | "ready";
  /** -1 only when count is empty/invalid. This identifies the nearest real card, not an investment. */
  pickedIndex: number;
  rippleProgress: number | null;
  rippleX: number | null;
  rippleY: number | null;
  celebrationProgress: number | null;
};

/** The reference cursor follows a quadratic Bézier whose progress is cubic-in-out eased. */
function moveCursor(from: Point, to: Point, elapsed: number, duration: number): Point {
  const t = ease(elapsed / duration), u = 1 - t;
  const mx = (from[0] + to[0]) / 2 + 60, my = Math.min(from[1], to[1]) - 80;
  return [u * u * from[0] + 2 * u * t * mx + t * t * to[0], u * u * from[1] + 2 * u * t * my + t * t * to[1]];
}

/**
 * Pure reference choreography, without timers, random particles or application state.
 * The final 400ms returns to `swipe` while the preview closes and the card lowers.
 * Detail/ready describe illustration stages, never a submitted or successful transaction.
 */
export function showcaseFrame(elapsedMs: number, mode: ShowcaseMode, count: number, ctaTarget?: Point): ShowcaseFrame {
  const cfg = SHOWCASE_LAYOUTS[mode];
  const cta = ctaTarget?.length === 2 && ctaTarget.every(Number.isFinite) ? ctaTarget : cfg.ctaTarget;
  const empty: ShowcaseFrame = { position: 0, velocity: 0, lift: 0, cursorX: cfg.cursorStart[0], cursorY: cfg.cursorStart[1], cursorPressed: false,
    phase: "swipe", pickedIndex: -1, rippleProgress: null, rippleX: null, rippleY: null, celebrationProgress: null };
  if (!Number.isSafeInteger(count) || count < 1) return empty;
  const elapsed = Math.max(0, finite(elapsedMs));
  if (elapsed < SHOWCASE_START_DELAY_MS) return { ...empty, pickedIndex: 0 };
  const started = elapsed - SHOWCASE_START_DELAY_MS;
  const cycle = Math.floor(started / SHOWCASE_CYCLE_MS), time = started % SHOWCASE_CYCLE_MS;
  let position = cycle * 3, velocity = 0, lift = 0, cursor: Point = cycle ? cfg.rest : cfg.cursorStart;
  let cursorPressed = false, phase: ShowcaseFrame["phase"] = "swipe";
  const dragged: Point = [cfg.swipe[0] - cfg.drag, cfg.swipe[1]];

  // Approach + 140ms press + 1250ms continuous drag + 350ms settling, three times.
  for (const [index, start, approach] of [[0, 0, 1100], [1, 2840, 600], [2, 5180, 600]]) {
    if (time < start) break;
    const local = time - start;
    const from = index ? dragged : cycle ? cfg.rest : cfg.cursorStart;
    if (local < approach) { cursor = moveCursor(from, cfg.swipe, local, approach); break; }
    if (local < approach + 140) { cursor = cfg.swipe; cursorPressed = true; break; }
    if (local < approach + 1390) {
      const progress = (local - approach - 140) / 1250, eased = ease(progress);
      position = cycle * 3 + index + eased;
      velocity = easeDerivative(progress) / 1.25;
      cursor = [cfg.swipe[0] - cfg.drag * eased, cfg.swipe[1] + 12 * Math.sin(eased * Math.PI)];
      cursorPressed = eased <= .62;
      break;
    }
    position = cycle * 3 + index + 1;
    cursor = dragged;
  }

  if (time >= 7520) {
    position = cycle * 3 + 3;
    if (time < 9360) {
      phase = "hover";
      cursor = time < 8620 ? moveCursor(dragged, cfg.target, time - 7520, 1100) : cfg.target;
      lift = ease((time - 8620) / 450);
      cursorPressed = time >= 9070 && time < 9210;
    } else if (time < 11670) {
      phase = "detail";
      cursor = time < 10260 ? cfg.target : moveCursor(cfg.target, cta, time - 10260, 900);
      lift = 1;
      cursorPressed = time >= 11410 && time < 11550;
    } else if (time < 14870) {
      phase = "ready";
      cursor = moveCursor(cta, cfg.rest, time - 11670, 1200);
      lift = 1;
    } else {
      cursor = cfg.rest;
      lift = 1 - ease((time - 14870) / 400);
    }
  }

  const click = time >= 9070 && time < 9670 ? { at: 9070, point: cfg.target } : time >= 11410 && time < 12010 ? { at: 11410, point: cta } : null;
  return {
    position, velocity, lift, cursorX: cursor[0], cursorY: cursor[1], cursorPressed, phase,
    pickedIndex: ((Math.round(position) % count) + count) % count,
    rippleProgress: click ? (time - click.at) / 600 : null, rippleX: click?.point[0] ?? null, rippleY: click?.point[1] ?? null,
    celebrationProgress: phase === "ready" ? (time - 11670) / 3200 : null,
  };
}
