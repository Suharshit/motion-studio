// scripts/fish-tts.mjs — voice every line of a project's script with Fish Audio and time it.
//
//   npm run vo -- <slug> [--only id1,id2] [--force] [--voice <id>] [--model s2.1-pro] [--speed 1.05]
//
// Reads  projects/<slug>/vo/script.json
// Writes projects/<slug>/vo/<id>.mp3 and projects/<slug>/vo/timing.json
//
// script.json:
// {
//   "voice": "",                 // Fish voice id (reference_id). Empty → FISH_VOICE_ID from .env
//   "model": "s2.1-pro",         // or s2.1-pro-free, drama-3-preview (directed reads: "[whispering] ...")
//   "speed": 1.0, "gap": 0.25, "leadIn": 0.4,
//   "pronunciations": {"Acme": "AE1 K M IY0"},   // optional CMU phonemes
//   "lines": [
//     {"id": "hook", "text": "Stop editing videos by hand.", "start": "bar:0"},
//     {"id": "f1",   "text": "...", "start": null},          // null → after previous line + gap
//     {"id": "cta",  "text": "...", "start": 14.2, "voice": "<other id>", "speed": 0.95}
//   ]
// }
// start can be: seconds · "beat:N" · "bar:N" (from beats.json) · null (chain after previous).
//
// Lines whose text/voice/model/speed didn't change are NOT regenerated (saves credit). --force regenerates.
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tts, ROOT} from './lib/fish.mjs';

const argv = process.argv.slice(2);
const slug = argv.find((a) => !a.startsWith('--'));
const opt = (k) => {
  const i = argv.indexOf('--' + k);
  return i < 0 ? undefined : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
};
if (!slug) (console.error('usage: npm run vo -- <slug> [--only id] [--force] [--voice id] [--model m] [--speed 1]'), process.exit(1));

const P = join(ROOT, 'projects', slug);
const scriptPath = join(P, 'vo', 'script.json');
if (!existsSync(scriptPath)) (console.error(`missing ${scriptPath}`), process.exit(1));
const script = JSON.parse(readFileSync(scriptPath, 'utf8'));
if (!script.lines?.length) (console.error(`vo/script.json has no lines yet — write the script first (prompts/passes/voiceover-pass.md)`), process.exit(1));
const beats = existsSync(join(P, 'beats.json')) ? JSON.parse(readFileSync(join(P, 'beats.json'), 'utf8')) : null;
const prev = existsSync(join(P, 'vo', 'timing.json')) ? JSON.parse(readFileSync(join(P, 'vo', 'timing.json'), 'utf8')) : {lines: []};
const only = opt('only') ? String(opt('only')).split(',') : null;
mkdirSync(join(P, 'vo'), {recursive: true});

const probe = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
const resolveStart = (s, cursor) => {
  if (s === null || s === undefined || s === '') return cursor;
  if (typeof s === 'number') return s;
  const m = String(s).match(/^(beat|bar):(\d+)$/);
  if (m && beats) return (m[1] === 'beat' ? beats.beats : beats.downbeats)[Number(m[2])] ?? cursor;
  if (m && !beats) console.warn(`"${s}" needs beats.json (npm run music / npm run beats) — chaining instead`);
  return Number(s) || cursor;
};

const out = [];
let cursor = script.leadIn ?? 0.4;
let generated = 0, reused = 0;
for (const line of script.lines) {
  const voice = opt('voice') ?? line.voice ?? script.voice ?? process.env.FISH_VOICE_ID ?? '';
  const model = opt('model') ?? line.model ?? script.model ?? process.env.FISH_TTS_MODEL ?? 's2.1-pro';
  const speed = Number(opt('speed') ?? line.speed ?? script.speed ?? 1);
  const hash = createHash('sha1').update(JSON.stringify([line.text, voice, model, speed, script.pronunciations ?? {}])).digest('hex').slice(0, 12);
  const file = `${line.id}.mp3`;
  const path = join(P, 'vo', file);
  const old = prev.lines.find((l) => l.id === line.id);
  const want = !only || only.includes(line.id);
  if (want && (opt('force') || !existsSync(path) || old?.hash !== hash)) {
    process.stdout.write(`voicing ${line.id}… `);
    const audio = await tts(line.text, {voice: voice || null, model, speed, pronunciations: script.pronunciations});
    writeFileSync(path, audio);
    generated++;
    console.log('ok');
  } else reused++;
  const duration = existsSync(path) ? probe(path) : 0;
  const start = resolveStart(line.start, cursor);
  out.push({id: line.id, text: line.text, file, start: +start.toFixed(3), end: +(start + duration).toFixed(3), duration: +duration.toFixed(3), voice, model, speed, hash});
  cursor = start + duration + (line.gapAfter ?? script.gap ?? 0.25);
}

// overlap check — two lines talking over each other is a bug unless it's deliberate dialogue
for (let i = 1; i < out.length; i++) {
  if (out[i].start < out[i - 1].end - 0.05) console.warn(`⚠ "${out[i].id}" starts at ${out[i].start}s but "${out[i - 1].id}" ends at ${out[i - 1].end}s`);
}
const timing = {lines: out, total: +Math.max(...out.map((l) => l.end)).toFixed(3)};
writeFileSync(join(P, 'vo', 'timing.json'), JSON.stringify(timing, null, 1));
console.log(`${generated} generated, ${reused} reused · VO ends at ${timing.total}s → vo/timing.json`);
console.log(`next: npm run captions -- ${slug}   (word-level timestamps for kinetic captions)`);
