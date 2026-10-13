// scripts/ref-frames.mjs — study a reference video before writing code.
//
//   npm run ref -- <slug> ./path/to/reference.mp4 [--every 0.5]
//
// Copies the reference into projects/<slug>/refs/, extracts one frame every 0.5s into refs/frames/,
// tiles them into refs/contact.png, and writes refs/cuts.json (scene-change times → shot lengths).
// Then follow prompts/passes/reference-extraction.md: take the grammar, never the content.
import {mkdirSync, copyFileSync, writeFileSync, existsSync, rmSync, readdirSync} from 'node:fs';
import {join, basename, dirname, resolve} from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const [slug, src] = argv.filter((a) => !a.startsWith('--'));
const ei = argv.indexOf('--every');
const every = ei >= 0 ? Number(argv[ei + 1]) : 0.5;
if (!slug || !src || !existsSync(src)) (console.error('usage: npm run ref -- <slug> <video> [--every 0.5]'), process.exit(1));

const refs = join(ROOT, 'projects', slug, 'refs');
const frames = join(refs, 'frames');
rmSync(frames, {recursive: true, force: true});
mkdirSync(frames, {recursive: true});
const local = join(refs, basename(src));
if (resolve(src) !== resolve(local)) copyFileSync(src, local);

execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', local, '-vf', `fps=1/${every},scale=480:-1`, join(frames, '%04d.png')]);
const n = readdirSync(frames).length;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', join(frames, '*.png'), '-vf', `scale=240:-1,tile=8x${Math.ceil(n / 8)}:padding=4:color=0x222222`, '-frames:v', '1', join(refs, 'contact.png')]);

// Scene-cut detection → shot lengths (pacing)
const r = spawnSync('ffmpeg', ['-i', local, '-vf', "select='gt(scene,0.3)',showinfo", '-f', 'null', '-'], {encoding: 'utf8'});
const cuts = [...r.stderr.matchAll(/pts_time:([\d.]+)/g)].map((m) => +Number(m[1]).toFixed(3));
const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', local]).toString());
const bounds = [0, ...cuts, dur];
const shots = bounds.slice(1).map((b, i) => +(b - bounds[i]).toFixed(2));
const avg = shots.reduce((a, b) => a + b, 0) / shots.length;
writeFileSync(join(refs, 'cuts.json'), JSON.stringify({duration: dur, cuts, shotLengths: shots, averageShot: +avg.toFixed(2)}, null, 1));
console.log(`${n} frames (every ${every}s) → ${frames}`);
console.log(`contact sheet → ${join(refs, 'contact.png')}`);
console.log(`${shots.length} shots, average ${avg.toFixed(2)}s → refs/cuts.json`);
console.log('Next: read the contact sheet + frames, write docs/style_guide.md and style.json (prompts/passes/reference-extraction.md).');
