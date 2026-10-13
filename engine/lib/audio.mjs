// engine/lib/audio.mjs — deterministic audio building blocks (Node side).
import {writeFileSync} from 'node:fs';

export const SR = 48000;

export function makeNoise(seed = 42) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2147483648) - 1;
}

/** Write stereo (or mono) Float32 buffers as 16-bit PCM WAV. */
export function writeWav(path, L, R = L, sr = SR) {
  const n = L.length, ch = 2;
  const b = Buffer.alloc(44 + n * 2 * ch);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + n * 2 * ch, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(ch, 22);
  b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * 2 * ch, 28);
  b.writeUInt16LE(2 * ch, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(n * 2 * ch, 40);
  // soft clip so stacked voices never hard-clip
  const sc = (x) => Math.tanh(x * 1.1) / Math.tanh(1.1);
  for (let i = 0; i < n; i++) {
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sc(L[i]))) * 32767), 44 + i * 4);
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sc(R[i]))) * 32767), 46 + i * 4);
  }
  writeFileSync(path, b);
}

/** Add a voice function f(tLocal) → sample into buf at time t (seconds), with optional gain/pan. */
export function place(L, R, t, len, f, gain = 1, pan = 0) {
  const start = Math.floor(t * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  const n = Math.floor(len * SR);
  for (let i = 0; i < n; i++) {
    const j = start + i;
    if (j < 0 || j >= L.length) continue;
    const v = f(i / SR);
    L[j] += v * gl;
    R[j] += v * gr;
  }
}

export const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const TAU = Math.PI * 2;

/** SFX + drum voices. Each: [lengthSeconds, (t, noise) => sample]. */
export function voices(noise) {
  return {
    // UI
    click: [0.05, (t) => Math.sin(TAU * 1800 * t) * Math.exp(-t * 90) * 0.5],
    tick: [0.03, (t) => Math.sin(TAU * 3200 * t) * Math.exp(-t * 160) * 0.35],
    pop: [0.15, (t) => Math.sin(TAU * (600 + 900 * t) * t) * Math.exp(-t * 30) * 0.4],
    type: [0.04, (t) => noise() * Math.exp(-t * 120) * 0.25 + Math.sin(TAU * 2400 * t) * Math.exp(-t * 200) * 0.15],
    success: [0.5, (t) => (Math.sin(TAU * 880 * t) * Math.exp(-t * 8) + (t > 0.08 ? Math.sin(TAU * 1320 * (t - 0.08)) * Math.exp(-(t - 0.08) * 7) : 0)) * 0.25],
    error: [0.35, (t) => Math.sign(Math.sin(TAU * 180 * t)) * Math.exp(-t * 10) * 0.15],
    // transitions
    whoosh: [0.35, (t) => noise() * Math.sin(Math.PI * Math.min(1, t / 0.35)) * 0.25],
    swipe: [0.22, (t) => noise() * Math.pow(Math.sin(Math.PI * Math.min(1, t / 0.22)), 2) * 0.3],
    riser: [1.5, (t) => (noise() * 0.5 + Math.sin(TAU * (200 + 600 * t * t) * t) * 0.5) * Math.pow(t / 1.5, 2) * 0.3],
    impact: [1.2, (t) => (Math.sin(TAU * (60 - 30 * t) * t) * Math.exp(-t * 4) * 0.9 + noise() * Math.exp(-t * 25) * 0.4)],
    shimmer: [1.0, (t) => [1, 1.5, 2, 3].reduce((a, m) => a + Math.sin(TAU * 1046 * m * t), 0) * 0.06 * Math.exp(-t * 3) * Math.min(1, t * 40)],
    // drums
    thump: [0.5, (t) => Math.sin(TAU * (90 - 60 * t) * t) * Math.exp(-t * 9) * 0.9],
    kick: [0.4, (t) => Math.sin(TAU * (50 + 110 * Math.exp(-t * 30)) * t) * Math.exp(-t * 7) * 0.95],
    snare: [0.25, (t) => (noise() * 0.6 + Math.sin(TAU * 190 * t) * 0.4) * Math.exp(-t * 18) * 0.5],
    clap: [0.2, (t) => noise() * (Math.exp(-((t % 0.012) * 300)) * (t < 0.036 ? 1 : 0) + Math.exp(-t * 25) * 0.6) * 0.45],
    hat: [0.06, (t) => noise() * Math.exp(-t * 80) * 0.18],
    openhat: [0.3, (t) => noise() * Math.exp(-t * 12) * 0.12],
  };
}
