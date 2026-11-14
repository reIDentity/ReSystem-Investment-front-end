import test from 'node:test';
import assert from 'node:assert/strict';
import { SHOWCASE_LAYOUTS, SHOWCASE_CYCLE_MS, SHOWCASE_START_DELAY_MS, showcasePose, showcaseFrame } from '../src/components/hero/showcase-motion.ts';

const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-9, message ?? `${actual} ≠ ${expected}`);
const at = (time, mode = 'desktop', count = 5) => showcaseFrame(SHOWCASE_START_DELAY_MS + time, mode, count);
const point = (frame, x, y) => { close(frame.cursorX, x); close(frame.cursorY, y); };

test('desktop and portrait geometry matches the supplied fixed-size stage and card keyframes', () => {
  assert.equal(SHOWCASE_START_DELAY_MS, 300); assert.equal(SHOWCASE_CYCLE_MS, 15270);
  assert.deepEqual([SHOWCASE_LAYOUTS.desktop.W, SHOWCASE_LAYOUTS.desktop.H, SHOWCASE_LAYOUTS.desktop.cardWidth, SHOWCASE_LAYOUTS.desktop.cardHeight, SHOWCASE_LAYOUTS.desktop.cardTop], [1920, 1080, 420, 544, 600]);
  assert.deepEqual([SHOWCASE_LAYOUTS.mobile.W, SHOWCASE_LAYOUTS.mobile.H, SHOWCASE_LAYOUTS.mobile.cardWidth, SHOWCASE_LAYOUTS.mobile.cardHeight, SHOWCASE_LAYOUTS.mobile.cardTop], [1080, 1920, 640, 829, 1080]);
  for (const [mode, widths] of [['desktop', [0, 360, 640, 760]], ['mobile', [0, 420, 620, 700]]]) {
    for (const [index, offset] of [0, 1, 2, 2.5].entries()) close(showcasePose(offset, mode).x, widths[index]);
    for (const target of ['swipe', 'target', 'ctaTarget', 'rest']) {
      const [x, y] = SHOWCASE_LAYOUTS[mode][target];
      assert.ok(x > 0 && x < SHOWCASE_LAYOUTS[mode].W);
      assert.ok(y > 0 && y < SHOWCASE_LAYOUTS[mode].H);
    }
  }
});

test('signed card interpolation preserves depth, tint, opacity, lift and velocity tilt', () => {
  assert.deepEqual(showcasePose(0, 'desktop'), { x: 0, y: 0, z: 0, scale: 1, rotateY: 0, rotateZ: 0, tint: 0, opacity: 1, blur: 0, zIndex: 100 });
  const half = showcasePose(.5, 'desktop', 2, .5), mirrored = showcasePose(-.5, 'desktop', -2, .5);
  close(half.x, 180); close(half.scale, .918); close(half.y, -7); close(half.z, -100);
  close(half.rotateY, -9); close(half.rotateZ, -3.2); close(half.tint, .275); close(half.opacity, .96); close(half.blur, .5); assert.equal(half.zIndex, 90);
  close(mirrored.x, -half.x); close(mirrored.rotateY, -half.rotateY); close(mirrored.rotateZ, -half.rotateZ);
  const middle = showcasePose(1.5, 'mobile');
  close(middle.x, 520); close(middle.scale, .69); close(middle.rotateY, -24); close(middle.tint, .65); close(middle.opacity, .71); close(middle.z, -200);
  const edge = showcasePose(2.25, 'desktop');
  close(edge.x, 700); close(edge.scale, .585); close(edge.rotateY, -32); close(edge.opacity, .275);
  assert.equal(showcasePose(8, 'desktop').opacity, 0); assert.equal(showcasePose(8, 'desktop').x, 760);
  close(showcasePose(0, 'mobile', 0, 1).scale, 1.04);
});

test('the 300ms initial delay is static, then the cursor follows the reference quadratic path', () => {
  for (const time of [-1, 0, 299]) {
    const frame = showcaseFrame(time, 'desktop', 5);
    assert.equal(frame.position, 0); assert.equal(frame.velocity, 0); assert.equal(frame.cursorPressed, false); point(frame, 1800, 1100);
  }
  point(at(0), 1800, 1100); point(at(550), 1520, 700); point(at(1100), 1180, 620);
  assert.equal(at(1100).cursorPressed, true);
  point(at(3140), 1045, 580); // Halfway through the second 600ms curved approach.
  point(at(8070), 960, 585); // Halfway from the last drag endpoint to the card.
});

test('all three swipes use continuous cubic motion, analytic velocity and the reference release threshold', () => {
  for (const [start, base] of [[1240, 0], [3580, 1], [5920, 2]]) {
    const from = at(start), middle = at(start + 625), end = at(start + 1250);
    close(from.position, base); close(from.velocity, 0);
    close(middle.position, base + .5); close(middle.velocity, 2.4); point(middle, 1015, 632);
    assert.equal(middle.cursorPressed, true);
    assert.equal(at(start + 900).cursorPressed, false);
    close(end.position, base + 1); close(end.velocity, 0); point(end, 850, 620);
  }
  close(at(2490).position, 1); close(at(2839).position, 1);
  close(at(4830).position, 2); close(at(5179).position, 2);
  close(at(7170).position, 3); close(at(7519).position, 3);
  point(at(1865, 'mobile'), 600, 1112);
});

test('phase boundaries, card lift and two exact click windows follow the reference timings', () => {
  const phases = [[7519, 'swipe'], [7520, 'hover'], [9359, 'hover'], [9360, 'detail'], [11669, 'detail'], [11670, 'ready'], [14869, 'ready'], [14870, 'swipe']];
  for (const [time, phase] of phases) assert.equal(at(time).phase, phase, `cycle time ${time}`);
  close(at(8620).lift, 0); close(at(8845).lift, .5); close(at(9070).lift, 1);
  close(at(14870).lift, 1); close(at(15070).lift, .5);
  for (const [time, pressed] of [[9069, false], [9070, true], [9209, true], [9210, false], [11409, false], [11410, true], [11549, true], [11550, false]]) assert.equal(at(time).cursorPressed, pressed, `cycle time ${time}`);
  for (const time of [7520, 9360, 11670, 14870]) assert.equal(at(time).pickedIndex, 3);
});

test('CTA and rest cursor curves use fixed popup geometry; ripple stays at the click origin', () => {
  point(at(10260), 1010, 640); point(at(10710), 1065, 623.75); point(at(11160), ...SHOWCASE_LAYOUTS.desktop.ctaTarget);
  point(at(12270), 1340, 746.25); point(at(12870), ...SHOWCASE_LAYOUTS.desktop.rest);
  close(at(9070).rippleProgress, 0); close(at(9370).rippleProgress, .5); assert.equal(at(9670).rippleProgress, null);
  point({ cursorX: at(9370).rippleX, cursorY: at(9370).rippleY }, ...SHOWCASE_LAYOUTS.desktop.target);
  close(at(11410).rippleProgress, 0); close(at(11710).rippleProgress, .5);
  point({ cursorX: at(11710).rippleX, cursorY: at(11710).rippleY }, ...SHOWCASE_LAYOUTS.desktop.ctaTarget);
  assert.notEqual(at(11710).cursorX, at(11710).rippleX, 'the cursor moves away while the second ripple remains fixed');
  assert.equal(at(12010).rippleProgress, null);
  assert.equal(at(11669).celebrationProgress, null); close(at(11670).celebrationProgress, 0); close(at(13270).celebrationProgress, .5); assert.equal(at(14870).celebrationProgress, null);
});

test('loop wrapping retains continuous global position and begins later cycles from the prior rest point', () => {
  const before = at(15270 - .001), boundary = at(15270), later = at(15270 + 1865);
  close(before.position, 3); close(boundary.position, 3); close(boundary.lift, 0); point(boundary, ...SHOWCASE_LAYOUTS.desktop.rest);
  close(later.position, 3.5); assert.equal(later.pickedIndex, 4);
  close(at(2 * SHOWCASE_CYCLE_MS).position, 6); assert.equal(at(2 * SHOWCASE_CYCLE_MS).pickedIndex, 1);
  close(at(10 * SHOWCASE_CYCLE_MS + 7170).position, 33); assert.equal(at(10 * SHOWCASE_CYCLE_MS + 7170).pickedIndex, 3);
  assert.equal(at(10 * SHOWCASE_CYCLE_MS + 7170, 'desktop', 1).pickedIndex, 0);
});

test('an injected measured CTA target moves only the second click path and its fixed ripple', () => {
  const measured = [1120, 780];
  const measuredAt = time => showcaseFrame(SHOWCASE_START_DELAY_MS + time, 'desktop', 5, measured);
  assert.deepEqual(measuredAt(9360), at(9360), 'the initial card click and popup entrance remain unchanged');
  point(measuredAt(11160), ...measured);
  const click = measuredAt(11410);
  assert.equal(click.cursorPressed, true); assert.equal(click.rippleProgress, 0);
  assert.equal(click.rippleX, measured[0]); assert.equal(click.rippleY, measured[1]);
  point(measuredAt(11670), ...measured);
  point(measuredAt(12870), ...SHOWCASE_LAYOUTS.desktop.rest);
  for (const invalid of [[NaN, 5], [5, Infinity], []]) assert.deepEqual(showcaseFrame(SHOWCASE_START_DELAY_MS + 11410, 'desktop', 5, invalid), at(11410));
});

test('empty and malformed inputs remain deterministic finite presentation data', () => {
  for (const count of [0, -1, 1.5, NaN, Infinity]) {
    const frame = showcaseFrame(99999, 'mobile', count);
    assert.equal(frame.pickedIndex, -1); assert.equal(frame.position, 0); assert.equal(frame.phase, 'swipe');
    assert.equal(frame.rippleProgress, null); assert.equal(frame.celebrationProgress, null);
  }
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.deepEqual(showcaseFrame(value, 'desktop', 5), showcaseFrame(0, 'desktop', 5));
    assert.deepEqual(showcasePose(value, 'desktop', value, value), showcasePose(0, 'desktop'));
  }
  for (const mode of ['desktop', 'mobile']) for (let time = 0; time <= 3 * SHOWCASE_CYCLE_MS; time += 31) {
    const frame = at(time, mode), pose = showcasePose(.75, mode, frame.velocity, frame.lift);
    for (const value of [...Object.values(frame), ...Object.values(pose)]) if (typeof value === 'number') assert.ok(Number.isFinite(value));
    for (const value of [frame.rippleProgress, frame.celebrationProgress]) if (value !== null) assert.ok(value >= 0 && value <= 1);
    assert.ok(frame.pickedIndex >= 0 && frame.pickedIndex < 5);
    assert.deepEqual(at(time, mode), frame);
  }
});
