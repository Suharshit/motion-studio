// engine/lib/motion.js — pure functions of time. No state, no timers, no Math.random.
// Everything here is safe to call for any t in any order, so seek(t) stays deterministic.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const invLerp = (a, b, v) => clamp((v - a) / (b - a));
export const remap = (v, a, b, c, d) => lerp(c, d, invLerp(a, b, v));
export const loopT = (t, dur) => ((t % dur) + dur) % dur;

// ---------------------------------------------------------------- springs
// Closed-form damped spring from 0 → 1 (unit step response). k = stiffness, d = damping, m = mass.
export function spring(t, k = 170, d = 26, m = 1) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k / m);
  const z = d / (2 * Math.sqrt(k * m));
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  if (z === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  // overdamped
  const r1 = -w0 * (z - Math.sqrt(z * z - 1));
  const r2 = -w0 * (z + Math.sqrt(z * z - 1));
  const c2 = r1 / (r2 - r1);
  const c1 = -1 - c2;
  return 1 + c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
}

// Named feels. Use these names in style.json → motion.springs, never ad-hoc numbers in scenes.
export const SPRINGS = {
  snappy: {k: 320, d: 30}, // buttons, toggles, leading edges — tiny overshoot
  default: {k: 170, d: 26}, // cards, containers, camera
  heavy: {k: 90, d: 20}, // big type, 3D, logo lockups — no visible overshoot
  playful: {k: 220, d: 14}, // mascots, stickers — visible overshoot
};
export const sp = (t, name = 'default') => {
  const s = SPRINGS[name] ?? SPRINGS.default;
  return spring(t, s.k, s.d);
};

// A value that changes target many times: sum one spring per change, each starting at its own time.
// keys: [[time, value], ...] sorted by time. Continuous motion, and frame 812 needs no history.
export function track(t, keys, k = 170, d = 26) {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], k, d);
  return v;
}
// Same for [x, y] points (cursor paths, camera targets).
export function track2(t, keys, k = 170, d = 26) {
  return [0, 1].map((j) => track(t, keys.map(([tt, p]) => [tt, p[j]]), k, d));
}
// Tab/selection indicator that stretches: leading edge stiffer than trailing edge.
export function indicator(t, stops, width = 120) {
  const lead = track(t, stops, 320, 30);
  const trail = track(t, stops, 140, 22);
  return {left: Math.min(lead, trail), right: Math.max(lead, trail) + width};
}
// Content inside a morphing container: enters just after the morph starts, leaves before the next one.
export function swapAlpha(t, tIn, tOut, fadeIn = 0.12, fadeOut = 0.1) {
  return Math.min(clamp((t - tIn - 0.08) / fadeIn), clamp((tOut - 0.1 - t) / fadeOut));
}

// ---------------------------------------------------------------- easing (only where a spring is wrong)
export const bezier = (x1, y1, x2, y2) => (x) => {
  // Newton-Raphson solve for t in cubic-bezier(x1,y1,x2,y2)
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  let t = x;
  for (let i = 0; i < 8; i++) {
    const dx = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(dx) < 1e-6) break;
    t -= (sx(t) - x) / dx;
  }
  return sy(clamp(t));
};
export const ease = {
  out: bezier(0.16, 1, 0.3, 1),
  inOut: bezier(0.65, 0, 0.35, 1),
  in: bezier(0.7, 0, 0.84, 0),
  linear: (x) => x,
};
// Tween helper: progress of [start, start+dur] through an easing.
export const tween = (t, start, dur, fn = ease.out) => fn(clamp((t - start) / dur));

// ---------------------------------------------------------------- determinism
// Seeded PRNG (mulberry32). Same seed → same sequence, every render.
export function rng(seed = 1) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
// Stable hash → [0,1) for per-item jitter without carrying a generator around.
export const hash01 = (n) => {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};
// Smooth 1D value noise, deterministic.
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const a = hash01(i * 374761393 + seed * 668265263), b = hash01((i + 1) * 374761393 + seed * 668265263);
  const u = f * f * (3 - 2 * f);
  return lerp(a, b, u) * 2 - 1;
}

// ---------------------------------------------------------------- timeline
// Scenes: [{from, to, draw(localT, ctx)}]. Returns the active scenes for t (overlaps allowed for transitions).
export const active = (scenes, t) => scenes.filter((s) => t >= s.from && t < s.to);

// Beat grid helpers. beats = beats.json ({bpm, beats, downbeats, hits}).
export const beatAt = (beats, i) => beats.beats[Math.min(i, beats.beats.length - 1)] ?? i * (60 / beats.bpm);
export const barAt = (beats, i) => beats.downbeats[Math.min(i, beats.downbeats.length - 1)] ?? i * 4 * (60 / beats.bpm);
// Pulse 1 → 0 decaying after every beat (for subtle beat-reactive scale/brightness).
export function pulse(t, beats, decay = 8) {
  const list = beats.beats;
  let last = -Infinity;
  for (const b of list) if (b <= t) last = b; else break;
  return Math.exp(-(t - last) * decay);
}
