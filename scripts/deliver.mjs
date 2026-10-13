// scripts/deliver.mjs — package a finished project for the client.
//
//   npm run deliver -- <slug> [--force-no-vault]
//
// Refuses to run until the vault decision is recorded (npm run vault -- save|skip <slug>).
// Collects out/<slug>/delivery/: final_<fmt>.mp4, poster_<fmt>.png, captions.srt, contact sheet, HANDOFF.md.
import {existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug) (console.error('usage: npm run deliver -- <slug>'), process.exit(1));
const P = join(ROOT, 'projects', slug), O = join(ROOT, 'out', slug), D = join(O, 'delivery');
const pj = existsSync(join(P, 'project.json')) ? JSON.parse(readFileSync(join(P, 'project.json'), 'utf8')) : {};

if (!pj.vault && !process.argv.includes('--force-no-vault')) {
  console.error(`✋ No vault decision for ${slug}.
   Run: npm run vault -- similar ${slug}
   Then: npm run vault -- save ${slug} --id <kebab> --name "…" --tags "…" --mood "…" --best-for "…"
     or: npm run vault -- skip ${slug} --reason "…"`);
  process.exit(2);
}
const finals = existsSync(O) ? readdirSync(O).filter((f) => /^final_[^_]+\.mp4$/.test(f)) : [];
if (!finals.length) (console.error(`no out/${slug}/final_<fmt>.mp4 — run npm run render + npm run mix first`), process.exit(1));

// Critique gate: warn if the review log has no round with every score ≥ 8
const log = existsSync(join(P, 'docs/review_log.md')) ? readFileSync(join(P, 'docs/review_log.md'), 'utf8') : '';
const rounds = log.split(/^## /m).slice(1);
const passed = rounds.some((r) => {
  const scores = [...r.matchAll(/:\s*(\d+(?:\.\d+)?)\s*\/\s*10/g)].map((m) => Number(m[1]));
  return scores.length >= 5 && scores.every((s) => s >= 8);
});
if (!passed) console.warn(`⚠ docs/review_log.md has ${rounds.length} critique round(s) and none with every score ≥ 8. Deliver anyway only if the client accepts that.`);

mkdirSync(D, {recursive: true});
const probe = (f) =>
  execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:format=duration,size', '-of', 'json', f]).toString();
const name = (pj.client ? pj.client.replace(/[^a-z0-9]+/gi, '-') + '_' : '') + slug;
const lines = [];
for (const f of finals) {
  const fmt = f.slice(6, -4);
  const target = `${name}_${fmt}.mp4`;
  copyFileSync(join(O, f), join(D, target));
  const info = JSON.parse(probe(join(O, f)));
  const s = info.streams[0];
  const [n, d] = s.r_frame_rate.split('/').map(Number);
  lines.push(`| ${target} | ${s.width}×${s.height} | ${(n / d).toFixed(0)} fps | ${Number(info.format.duration).toFixed(2)}s | ${(Number(info.format.size) / 1e6).toFixed(1)} MB |`);
  const audioTxt = join(O, `qa_audio_${fmt}.txt`);
  lines[lines.length - 1] += ` ${existsSync(audioTxt) ? readFileSync(audioTxt, 'utf8').trim().replace(/\s+/g, ' ') : 'run npm run qa for loudness'} |`;
}
for (const f of readdirSync(O).filter((f) => /^poster_.*\.png$|^captions\.srt$|^qa_contact_.*\.png$/.test(f))) copyFileSync(join(O, f), join(D, f));

const handoff = `# ${pj.client ? pj.client + ' — ' : ''}${slug}

Type: ${pj.type ?? '—'} · Engine: ${pj.engine ?? 'route-a-seek'} · Style: ${pj.vault?.id ?? pj.style?.from ?? '—'}
Delivered: ${new Date().toISOString().slice(0, 10)}

| File | Size | FPS | Duration | Bytes | Audio |
|---|---|---|---|---|---|
${lines.join('\n')}

Also: poster frames, captions.srt (if voiced), contact sheet.
Audio mastered to -14 LUFS integrated, -1 dBTP. Video H.264 yuv420p, CRF 16, faststart.

Revisions: reply with timestamps + what to change. Source lives in projects/${slug}/ (index.html is the film; everything renders deterministically).
`;
writeFileSync(join(D, 'HANDOFF.md'), handoff);
pj.status = 'delivered';
pj.delivered = new Date().toISOString().slice(0, 10);
writeFileSync(join(P, 'project.json'), JSON.stringify(pj, null, 2));
console.log(`delivery → ${D}\n` + readdirSync(D).map((f) => '  ' + f).join('\n'));
