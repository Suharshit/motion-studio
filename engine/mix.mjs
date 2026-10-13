// engine/mix.mjs — lay audio under the picture and master to -14 LUFS.
//
//   npm run mix -- <slug> [--format 9x16|all] [--duck 0.25] [--music-gain 0.8] [--sfx-gain 1] [--vo-gain 1]
//
// Picks up, if present:
//   projects/<slug>/audio/track.(wav|mp3|m4a)   supplied music (wins over music.wav)
//   projects/<slug>/audio/music.wav             synthesized score (npm run music)
//   projects/<slug>/audio/sfx.wav               synthesized SFX (npm run sfx)
//   projects/<slug>/vo/timing.json              Fish Audio voice lines, placed at their start times
// Music is side-chain ducked under voice. Output: out/<slug>/final_<fmt>.mp4
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {args, ROOT} from './serve.mjs';

const a = args();
const slug = a._[0];
if (!slug) (console.error('usage: npm run mix -- <slug> [--format 9x16|all]'), process.exit(1));
const P = join(ROOT, 'projects', slug), O = join(ROOT, 'out', slug);

const find = (...c) => c.map((f) => join(P, f)).find(existsSync);
const music = find('audio/track.wav', 'audio/track.mp3', 'audio/track.m4a', 'audio/music.wav');
const sfx = find('audio/sfx.wav');
const timing = existsSync(join(P, 'vo/timing.json')) ? JSON.parse(readFileSync(join(P, 'vo/timing.json'), 'utf8')) : null;
const lines = (timing?.lines ?? []).filter((l) => existsSync(join(P, 'vo', l.file)));

const fmts = a.format && a.format !== 'all' ? String(a.format).split(',') : null;
const silents = existsSync(O) ? readdirSync(O).filter((f) => /^silent_[^_]+\.mp4$/.test(f) && (!fmts || fmts.includes(f.slice(7, -4)))) : [];
if (!silents.length) (console.error(`no out/${slug}/silent_<fmt>.mp4 found — run npm run render -- ${slug} first`), process.exit(1));

const probe = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

for (const s of silents) {
  const fmt = s.slice(7, -4);
  const video = join(O, s);
  const dur = probe(video);
  const inputs = ['-i', video];
  const chains = [];
  const buses = [];
  let idx = 1;

  let voBus = null;
  if (lines.length) {
    const labels = [];
    for (const l of lines) {
      inputs.push('-i', join(P, 'vo', l.file));
      const ms = Math.round(l.start * 1000);
      chains.push(`[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms},volume=${a['vo-gain'] ?? 1}[v${idx}]`);
      labels.push(`[v${idx}]`);
      idx++;
    }
    chains.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0,apad=whole_dur=${dur}[vo]`);
    voBus = '[vo]';
  }
  if (music) {
    inputs.push('-i', music);
    chains.push(`[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${a['music-gain'] ?? 0.8},apad=whole_dur=${dur}[mus]`);
    idx++;
    if (voBus) {
      chains.push(`[vo]asplit=2[vo1][vokey]`);
      chains.push(`[mus][vokey]sidechaincompress=threshold=0.03:ratio=${1 / Number(a.duck ?? 0.25)}:attack=20:release=350[musd]`);
      buses.push('[musd]', '[vo1]');
    } else buses.push('[mus]');
  } else if (voBus) buses.push('[vo]');
  if (sfx) {
    inputs.push('-i', sfx);
    chains.push(`[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${a['sfx-gain'] ?? 1},apad=whole_dur=${dur}[sfx]`);
    idx++;
    buses.push('[sfx]');
  }
  const out = join(O, `final_${fmt}.mp4`);
  if (!buses.length) {
    console.warn(`[${fmt}] no audio found (music/sfx/vo) — copying silent video`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-c', 'copy', out]);
    continue;
  }
  chains.push(`${buses.join('')}amix=inputs=${buses.length}:normalize=0,atrim=0:${dur},afade=t=out:st=${Math.max(0, dur - 0.4)}:d=0.4,loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.84:level=false:attack=1:release=50[aout]`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', chains.join(';'), '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out], {stdio: 'inherit'});
  console.log(`[${fmt}] ${[music && 'music', sfx && 'sfx', lines.length && `${lines.length} VO lines`].filter(Boolean).join(' + ')} → ${out} (-14 LUFS)`);
}
