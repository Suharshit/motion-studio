// engine/music.mjs — synthesize an original, deterministic score AND its beat grid in one step.
// Use when the client didn't supply a track. Same seed → same song, every time.
//
//   npm run music -- <slug> [--bpm 120] [--bars 8] [--mood drive|bright|cinematic|lofi|minimal|piano]
//                           [--key A] [--seed 7] [--intro 1] [--outro 1]
//
// Writes projects/<slug>/audio/music.wav and projects/<slug>/beats.json
// (same shape as beats.py output, so the animation code never cares where the grid came from).
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {SR, writeWav, place, voices, makeNoise, midi} from './lib/audio.mjs';
import {args, ROOT} from './serve.mjs';
import {rng} from './lib/motion.js';

const a = args();
const slug = a._[0];
if (!slug) (console.error('usage: npm run music -- <slug> [--bpm 120] [--bars 8] [--mood drive] [--key A] [--seed 7]'), process.exit(1));

const MOODS = {
  drive: {scale: 'minor', prog: [0, 5, 3, 4], drums: 'four', bass: 'eighths', pad: 0.12, lead: 'arp', bpm: 120},
  bright: {scale: 'major', prog: [0, 4, 5, 3], drums: 'four', bass: 'offbeat', pad: 0.1, lead: 'pluck', bpm: 124},
  cinematic: {scale: 'minor', prog: [0, 5, 2, 6], drums: 'sparse', bass: 'whole', pad: 0.2, lead: 'piano', bpm: 90},
  lofi: {scale: 'minor', prog: [0, 3, 6, 4], drums: 'boom', bass: 'whole', pad: 0.14, lead: 'piano', bpm: 84},
  minimal: {scale: 'minor', prog: [0, 0, 5, 5], drums: 'tick', bass: 'none', pad: 0.08, lead: 'pluck', bpm: 110},
  piano: {scale: 'major', prog: [0, 5, 3, 4], drums: 'none', bass: 'whole', pad: 0.06, lead: 'piano', bpm: 96},
};
const mood = MOODS[a.mood ?? 'drive'] ?? MOODS.drive;
const BPM = Number(a.bpm ?? mood.bpm);
const BARS = Number(a.bars ?? 8);
const INTRO = Number(a.intro ?? 0); // bars of drum-less intro
const OUTRO = Number(a.outro ?? 1); // tail bars that ring out
const KEYS = {C: 48, 'C#': 49, D: 50, 'D#': 51, E: 52, F: 53, 'F#': 54, G: 55, 'G#': 56, A: 45, 'A#': 46, B: 47};
const root = KEYS[a.key ?? 'A'] ?? 45;
const SCALES = {major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10]};
const sc = SCALES[mood.scale];
const R = rng(Number(a.seed ?? 7));
const noise = makeNoise(Number(a.seed ?? 7));
const V = voices(noise);

const beat = 60 / BPM, bar = beat * 4;
const total = (BARS + OUTRO) * bar + 1;
const L = new Float32Array(Math.ceil(total * SR)), Rr = new Float32Array(L.length);
const deg = (d, oct = 0) => root + sc[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);
const TAU = Math.PI * 2;

const env = (t, a, d) => Math.min(1, t / a) * Math.exp(-t * d);
const saw = (f, t) => 2 * ((f * t) % 1) - 1;
const tone = {
  pad: (f, len) => (t) => (saw(f, t) * 0.4 + saw(f * 1.006, t) * 0.4 + Math.sin(TAU * f * 0.5 * t) * 0.3) * Math.min(1, t / 0.4) * Math.min(1, (len - t) / 0.5) * 0.5,
  bass: (f) => (t) => (Math.sin(TAU * f * t) + Math.sin(TAU * f * 2 * t) * 0.25) * env(t, 0.005, 5),
  pluck: (f) => (t) => (Math.sin(TAU * f * t) + Math.sin(TAU * f * 2 * t) * 0.3 + Math.sin(TAU * f * 3 * t) * 0.1) * env(t, 0.002, 9),
  piano: (f) => (t) => [1, 2, 3, 4].reduce((s, h) => s + Math.sin(TAU * f * h * t) * Math.exp(-t * (2 + h * 1.5)) / h, 0) * Math.min(1, t / 0.003) * 0.7,
  arp: (f) => (t) => (Math.sign(Math.sin(TAU * f * t)) * 0.3 + Math.sin(TAU * f * t) * 0.5) * env(t, 0.002, 14),
};

const beats = [], downbeats = [], hits = [], sections = [];
for (let b = 0; b < BARS; b++) {
  const t0 = b * bar;
  const chord = mood.prog[b % mood.prog.length];
  const drumsOn = b >= INTRO && mood.drums !== 'none';
  downbeats.push(+t0.toFixed(3));
  if (b % 4 === 0) sections.push(+t0.toFixed(3));
  // pad: triad held the whole bar
  if (mood.pad) for (const d of [0, 2, 4]) place(L, Rr, t0, bar + 0.3, tone.pad(midi(deg(chord + d, 1)), bar + 0.3), mood.pad, d === 0 ? -0.3 : d === 2 ? 0.3 : 0);
  for (let q = 0; q < 4; q++) {
    const t = t0 + q * beat;
    beats.push(+t.toFixed(3));
    if (drumsOn) {
      if (mood.drums === 'four' || (mood.drums === 'boom' && (q === 0 || q === 2)) || (mood.drums === 'sparse' && q === 0)) {
        place(L, Rr, t, ...V.kick, 0.9);
        hits.push(+t.toFixed(3));
      }
      if ((mood.drums === 'four' || mood.drums === 'boom') && (q === 1 || q === 3)) place(L, Rr, t, ...(mood.drums === 'boom' ? V.snare : V.clap), 0.7);
      if (mood.drums === 'sparse' && q === 2 && b % 2 === 1) place(L, Rr, t, ...V.impact, 0.35);
      if (mood.drums !== 'sparse') {
        place(L, Rr, t + beat / 2, ...V.hat, 0.9, 0.25);
        if (mood.drums === 'four') place(L, Rr, t + beat / 4, ...V.hat, 0.35, -0.2);
      }
      if (mood.drums === 'tick') place(L, Rr, t, ...V.tick, 0.8, 0.2);
    }
    // bass
    const bf = midi(deg(chord, -1));
    if (mood.bass === 'eighths') for (const e of [0, 0.5]) place(L, Rr, t + e * beat, beat * 0.5, tone.bass(bf), 0.35);
    if (mood.bass === 'offbeat') place(L, Rr, t + beat / 2, beat * 0.5, tone.bass(bf), 0.4);
    if (mood.bass === 'whole' && q === 0) place(L, Rr, t, bar, tone.bass(bf), 0.4);
    // lead
    const steps = mood.lead === 'arp' ? 4 : mood.lead === 'pluck' ? 2 : 1;
    for (let s = 0; s < steps; s++) {
      if (mood.lead === 'piano' && q % 2 === 1 && R() < 0.5) continue;
      const pick = [0, 2, 4, 7][Math.floor(R() * 4)];
      const f = midi(deg(chord + pick, mood.lead === 'piano' ? 1 : 2));
      place(L, Rr, t + (s * beat) / steps, mood.lead === 'piano' ? 1.2 : 0.4, tone[mood.lead](f), mood.lead === 'arp' ? 0.1 : 0.16, (R() - 0.5) * 0.6);
    }
  }
}
// outro: final chord rings out
for (let o = 0; o < OUTRO; o++) {
  const t0 = (BARS + o) * bar;
  if (o === 0) {
    downbeats.push(+t0.toFixed(3));
    beats.push(+t0.toFixed(3));
    hits.push(+t0.toFixed(3));
    place(L, Rr, t0, ...V.kick, 0.9);
    for (const d of [0, 2, 4, 7]) place(L, Rr, t0, bar * 1.5, tone.piano(midi(deg(mood.prog[0] + d, 1))), 0.22);
  }
}
// gentle global fade at the end
const fadeN = Math.floor(0.6 * SR);
for (let i = 0; i < fadeN; i++) {
  const k = i / fadeN;
  L[L.length - fadeN + i] *= 1 - k;
  Rr[Rr.length - fadeN + i] *= 1 - k;
}

const dir = join(ROOT, 'projects', slug);
mkdirSync(join(dir, 'audio'), {recursive: true});
writeWav(join(dir, 'audio', 'music.wav'), L, Rr);
const grid = {bpm: BPM, beats, downbeats, hits, sections, duration: +(BARS * bar).toFixed(3), source: `synth:${a.mood ?? 'drive'}:${a.key ?? 'A'}:${a.seed ?? 7}`};
writeFileSync(join(dir, 'beats.json'), JSON.stringify(grid, null, 1));
console.log(`${BARS} bars @ ${BPM} BPM (${grid.duration}s, ${a.mood ?? 'drive'}) → ${join(dir, 'audio', 'music.wav')} + beats.json`);
