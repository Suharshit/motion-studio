// scripts/fish-captions.mjs — word-level caption timing for every voiced line.
//
//   npm run captions -- <slug> [--words 4] [--pause 0.35] [--estimate] [--language en]
//
// Sends each vo/<id>.mp3 to Fish Audio speech-to-text (transcribe-1-pro, timestamps on),
// offsets word times by the line's start, and groups words into caption lines.
// --estimate skips the API and spreads words by character length (offline / no credit).
//
// Writes projects/<slug>/vo/captions.json  {words:[{text,start,end,line}], lines:[{start,end,words:[i]}]}
//        out/<slug>/captions.srt           (delivered alongside the MP4)
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {stt, ROOT} from './lib/fish.mjs';

const argv = process.argv.slice(2);
const slug = argv.find((a) => !a.startsWith('--'));
const opt = (k, d) => {
  const i = argv.indexOf('--' + k);
  return i < 0 ? d : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
};
if (!slug) (console.error('usage: npm run captions -- <slug> [--words 4] [--estimate]'), process.exit(1));
const P = join(ROOT, 'projects', slug);
const timingPath = join(P, 'vo', 'timing.json');
if (!existsSync(timingPath)) (console.error(`no vo/timing.json — run npm run vo -- ${slug} first`), process.exit(1));
const timing = JSON.parse(readFileSync(timingPath, 'utf8'));
const MAXW = Number(opt('words', 4));
const PAUSE = Number(opt('pause', 0.35));

// Script words keep their punctuation and casing; STT words give the timing.
const scriptWords = (text) => text.replace(/\[[^\]]*\]/g, '').replace(/<\|[^|]*\|>/g, '').split(/\s+/).filter(Boolean);
const norm = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

function estimate(line) {
  const ws = scriptWords(line.text);
  const weights = ws.map((w) => Math.max(2, w.length) + (/[.,!?;:]$/.test(w) ? 3 : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  let t = line.start;
  return ws.map((w, i) => {
    const d = (line.duration * weights[i]) / total;
    const o = {text: w, start: +t.toFixed(3), end: +(t + d * 0.92).toFixed(3)};
    t += d;
    return o;
  });
}

function align(line, segs) {
  // Map STT segments onto script words by normalized match, walking forward.
  const ws = scriptWords(line.text);
  const out = [];
  let j = 0;
  for (const w of ws) {
    const n = norm(w);
    let k = j;
    while (k < segs.length && k < j + 4 && norm(segs[k].text) !== n) k++;
    if (k < segs.length && norm(segs[k].text) === n) {
      out.push({text: w, start: line.start + segs[k].start, end: line.start + segs[k].end});
      j = k + 1;
    } else out.push({text: w, start: null, end: null});
  }
  // fill gaps by interpolation between known neighbours
  for (let i = 0; i < out.length; i++) {
    if (out[i].start !== null) continue;
    const a = out.slice(0, i).reverse().find((x) => x.start !== null);
    const bIdx = out.findIndex((x, ii) => ii > i && x.start !== null);
    const t0 = a ? a.end : line.start, t1 = bIdx > 0 ? out[bIdx].start : line.end;
    const missing = (bIdx > 0 ? bIdx : out.length) - i;
    const d = (t1 - t0) / Math.max(1, missing);
    for (let m = 0; m < missing; m++) out[i + m] = {text: out[i + m].text, start: t0 + d * m, end: t0 + d * (m + 0.9)};
  }
  return out.map((w) => ({text: w.text, start: +w.start.toFixed(3), end: +w.end.toFixed(3)}));
}

const words = [];
const useApi = !opt('estimate');
for (const line of timing.lines) {
  const f = join(P, 'vo', line.file);
  if (!existsSync(f)) continue;
  let ws;
  if (useApi) {
    try {
      process.stdout.write(`timing ${line.id}… `);
      const r = await stt(readFileSync(f), {filename: line.file, language: opt('language')});
      ws = r.segments?.length ? align(line, r.segments) : estimate(line);
      console.log(r.segments?.length ? `${r.segments.length} words` : 'no timestamps, estimated');
    } catch (e) {
      console.log(`failed (${e.message.slice(0, 80)}), estimating`);
      ws = estimate(line);
    }
  } else ws = estimate(line);
  for (const w of ws) words.push({...w, line: line.id});
}

// Group into caption lines: max N words, break on pauses, sentence ends and VO line changes.
const lines = [];
let cur = [];
const flush = () => {
  if (!cur.length) return;
  lines.push({start: words[cur[0]].start, end: words[cur.at(-1)].end, words: cur});
  cur = [];
};
words.forEach((w, i) => {
  const prev = words[i - 1];
  const full = cur.length >= MAXW && !(cur.length === MAXW && /[.!?]$/.test(w.text)); // don't orphan a sentence's last word
  if (cur.length && (full || w.start - prev.end > PAUSE || prev.line !== w.line || /[.!?]$/.test(prev.text))) flush();
  cur.push(i);
});
flush();

writeFileSync(join(P, 'vo', 'captions.json'), JSON.stringify({words, lines}, null, 1));
const srtTime = (t) => {
  const ms = Math.round(t * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0'), m = String(Math.floor(ms / 60000) % 60).padStart(2, '0');
  const s = String(Math.floor(ms / 1000) % 60).padStart(2, '0'), r = String(ms % 1000).padStart(3, '0');
  return `${h}:${m}:${s},${r}`;
};
mkdirSync(join(ROOT, 'out', slug), {recursive: true});
writeFileSync(
  join(ROOT, 'out', slug, 'captions.srt'),
  lines.map((l, i) => `${i + 1}\n${srtTime(l.start)} --> ${srtTime(l.end)}\n${l.words.map((k) => words[k].text).join(' ')}\n`).join('\n'),
);
console.log(`${words.length} words in ${lines.length} caption lines → vo/captions.json + out/${slug}/captions.srt`);
