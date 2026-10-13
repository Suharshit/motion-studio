// engine/qa.mjs — inspect a rendered video the way a harsh motion director would.
//
//   npm run qa -- <slug> [--format 9x16] [--strip 4.2] [--determinism]
//
// From out/<slug>/final_<fmt>.mp4 (or silent_<fmt>.mp4) writes:
//   qa_contact_<fmt>.png   2 frames/sec, tiled          → pacing, variety, dead beats
//   qa_phone_<fmt>.png     1 frame/sec at 360px wide    → readability on a phone
//   qa_strip_<fmt>.png     12 consecutive frames at --strip t → pops, overlaps, sliding
//   loop_check_<fmt>.mp4   the film twice back to back  → watch the seam
//   qa_audio_<fmt>.txt     integrated loudness + true peak
// --determinism renders the first 2s twice and compares hashes (must match).
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {args, ROOT} from './serve.mjs';

const a = args();
const slug = a._[0];
if (!slug) (console.error('usage: npm run qa -- <slug> [--format 9x16] [--strip 4.2] [--determinism]'), process.exit(1));
const fmt = a.format ?? '9x16';
const O = join(ROOT, 'out', slug);
const src = [join(O, `final_${fmt}.mp4`), join(O, `silent_${fmt}.mp4`)].find(existsSync);
if (!src) (console.error(`nothing to QA in out/${slug} for ${fmt}`), process.exit(1));

const ff = (...x) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...x]);
const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]).toString());
const portrait = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src]).toString().trim().split(',').map(Number);
const isPortrait = portrait[0] < portrait[1];

const n2 = Math.ceil(dur * 2), cols = isPortrait ? 8 : 6;
ff('-i', src, '-vf', `fps=2,scale=${isPortrait ? 200 : 300}:-1,tile=${cols}x${Math.ceil(n2 / cols)}:padding=4:color=0x222222`, '-frames:v', '1', join(O, `qa_contact_${fmt}.png`));
const n1 = Math.ceil(dur);
ff('-i', src, '-vf', `fps=1,scale=360:-1,tile=5x${Math.ceil(n1 / 5)}:padding=6:color=0x222222`, '-frames:v', '1', join(O, `qa_phone_${fmt}.png`));
const st = Number(a.strip ?? Math.min(dur / 3, 4.1));
ff('-ss', String(Math.max(0, st - 0.1)), '-i', src, '-vf', 'scale=320:-1,tile=12x1:padding=2', '-frames:v', '1', join(O, `qa_strip_${fmt}.png`));
ff('-stream_loop', '1', '-i', src, '-c', 'copy', join(O, `loop_check_${fmt}.mp4`));

// Loop seam: compare first and last frame
ff('-i', src, '-vf', 'select=eq(n\\,0)', '-frames:v', '1', join(O, '.first.png'));
ff('-sseof', '-0.05', '-i', src, '-frames:v', '1', join(O, '.last.png'));
const ssim = spawnSync('ffmpeg', ['-i', join(O, '.first.png'), '-i', join(O, '.last.png'), '-lavfi', 'ssim', '-f', 'null', '-'], {encoding: 'utf8'}).stderr.match(/All:([\d.]+)/)?.[1];

let audio = 'no audio stream';
const hasAudio = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', src]).toString().trim();
if (hasAudio) {
  const r = spawnSync('ffmpeg', ['-i', src, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
  const I = r.match(/I:\s+(-?[\d.]+) LUFS/g)?.at(-1), TP = r.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.at(-1);
  audio = `${I ?? '?'} · true ${TP ?? '?'} (target -14 LUFS, peak ≤ -1 dBTP)`;
}
writeFileSync(join(O, `qa_audio_${fmt}.txt`), audio + '\n');

console.log(`QA for ${src} (${dur.toFixed(2)}s)
  contact   → out/${slug}/qa_contact_${fmt}.png
  phone     → out/${slug}/qa_phone_${fmt}.png
  strip@${st}s → out/${slug}/qa_strip_${fmt}.png
  loop      → out/${slug}/loop_check_${fmt}.mp4   (first↔last frame SSIM ${ssim ?? '?'}; ≥0.98 = seamless)
  audio     → ${audio}`);

if (a.determinism) {
  const hash = () => {
    execFileSync('node', [join(ROOT, 'engine/render.mjs'), slug, '--format', fmt, '--from', '0', '--to', '2', '--fps', '30', '--scale', '0.5', '--out', join(O, '.det.mp4')], {stdio: 'ignore'});
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(O, '.det.mp4'), '-f', 'framemd5', join(O, '.det.md5')]);
    return createHash('md5').update(readFileSync(join(O, '.det.md5'))).digest('hex');
  };
  const h1 = hash(), h2 = hash();
  console.log(`  determinism → ${h1 === h2 ? 'PASS (identical frames)' : 'FAIL — something depends on wall-clock, Math.random or carried state'}`);
}
