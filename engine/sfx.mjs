// engine/sfx.mjs — synthesize UI/transition sound effects from a cue list.
//
//   npm run sfx -- <slug>                  reads projects/<slug>/cues.json → projects/<slug>/audio/sfx.wav
//   node engine/sfx.mjs cues.json out.wav
//
// cues.json: [{"t": 0.5, "type": "click", "gain": 1, "pan": 0}, ...]
// types: click tick pop type success error whoosh swipe riser impact shimmer thump kick snare clap hat openhat
// Tip: put cues on beats.json → hits/beats; risers should END on the downbeat (t = downbeat - 1.5).
import {readFileSync, mkdirSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {SR, writeWav, place, voices, makeNoise} from './lib/audio.mjs';
import {ROOT} from './serve.mjs';

let [input, output] = process.argv.slice(2);
if (!input) (console.error('usage: npm run sfx -- <slug>  |  node engine/sfx.mjs cues.json out.wav'), process.exit(1));
if (!input.endsWith('.json')) {
  const slug = input;
  input = join(ROOT, 'projects', slug, 'cues.json');
  output = join(ROOT, 'projects', slug, 'audio', 'sfx.wav');
}
if (!existsSync(input)) (console.error('no cues file at', input), process.exit(1));
const cues = JSON.parse(readFileSync(input, 'utf8'));
const V = voices(makeNoise(42));
const end = Math.max(0, ...cues.map((c) => c.t + (V[c.type]?.[0] ?? 1))) + 0.5;
const L = new Float32Array(Math.ceil(end * SR)), R = new Float32Array(L.length);
let unknown = new Set();
for (const c of cues) {
  const v = V[c.type];
  if (!v) {
    unknown.add(c.type);
    continue;
  }
  place(L, R, c.t, v[0], v[1], c.gain ?? 1, c.pan ?? 0);
}
mkdirSync(dirname(output), {recursive: true});
writeWav(output, L, R);
if (unknown.size) console.warn('unknown cue types skipped:', [...unknown].join(', '));
console.log(`${cues.length} cues → ${output}`);
