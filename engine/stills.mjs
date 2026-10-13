// engine/stills.mjs — render frames straight from seek(t), no video needed.
// This is how Claude LOOKS at its work before committing to a full render.
//
//   npm run stills -- <slug>                       one frame per beat (or every 0.5s) → contact sheet
//   npm run stills -- <slug> --at 0,1.5,4.2        specific timestamps
//   npm run stills -- <slug> --every 0.25 --from 4 --to 6   dense strip around a fast action
//   npm run stills -- <slug> --format 1x1          check another aspect ratio
//   npm run stills -- <slug> --poster 3.2          export out/<slug>/poster_<fmt>.png at full res
//
// Writes out/<slug>/stills/<fmt>/*.png and out/<slug>/contact_<fmt>.png (+ phone_<fmt>.png at 360px wide).
import {mkdirSync, readFileSync, existsSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {startServer, args, ROOT} from './serve.mjs';
import {launchBrowser, openProject} from './render.mjs';

const a = args();
const slug = a._[0];
if (!slug) (console.error('usage: npm run stills -- <slug> [--at t1,t2] [--every s] [--from s --to s] [--format 9x16] [--poster t]'), process.exit(1));
const format = a.format ?? '9x16';
const outDir = join(ROOT, 'out', slug);
const dir = join(outDir, 'stills', format);
rmSync(dir, {recursive: true, force: true});
mkdirSync(dir, {recursive: true});

const {server, port} = await startServer();
const browser = await launchBrowser();
try {
  const {page, meta, errors, w, h} = await openProject(browser, port, slug, format, a.poster ? 1 : Number(a.scale ?? 0.5));

  if (a.poster) {
    await page.evaluate((t) => window.seek(t), Number(a.poster));
    const p = join(outDir, `poster_${format}.png`);
    await page.screenshot({path: p, clip: {x: 0, y: 0, width: w, height: h}});
    console.log('poster →', p);
  } else {
    let times;
    if (a.at) times = String(a.at).split(',').map(Number);
    else {
      const from = Number(a.from ?? 0), to = Number(a.to ?? meta.duration);
      const beatsPath = join(ROOT, 'projects', slug, 'beats.json');
      if (!a.every && existsSync(beatsPath)) {
        const b = JSON.parse(readFileSync(beatsPath, 'utf8'));
        times = b.beats.filter((t) => t >= from && t < to).map((t) => t + 0.12); // just after the hit
      } else {
        const step = Number(a.every ?? 0.5);
        times = [];
        for (let t = from; t < to; t += step) times.push(+t.toFixed(3));
      }
    }
    times = times.filter((t) => t < meta.duration);
    let i = 0;
    for (const t of times) {
      await page.evaluate((tt) => window.seek(tt), t);
      await page.screenshot({path: join(dir, `${String(i++).padStart(4, '0')}_${t.toFixed(2)}s.png`), clip: {x: 0, y: 0, width: w, height: h}});
    }
    const cols = Number(a.cols ?? (w < h ? 8 : 5));
    const rows = Math.ceil(times.length / cols);
    const tileW = w < h ? 220 : 340;
    const label = `drawtext=text='%{metadata\\:lavf.image2dec.source_basename}':fontcolor=white:fontsize=14:box=1:boxcolor=black@0.6:x=4:y=4`;
    const sheet = join(outDir, `contact_${format}.png`);
    const phone = join(outDir, `phone_${format}.png`);
    const run = (vf, out) =>
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', join(dir, '*.png'), '-vf', vf, '-frames:v', '1', out]);
    try {
      run(`scale=${tileW}:-1,${label},tile=${cols}x${rows}:padding=4:color=0x222222`, sheet);
    } catch {
      run(`scale=${tileW}:-1,tile=${cols}x${rows}:padding=4:color=0x222222`, sheet); // ffmpeg without drawtext
    }
    run(`scale=360:-1,tile=${Math.min(5, times.length)}x${Math.ceil(times.length / 5)}:padding=6:color=0x222222`, phone);
    console.log(`${times.length} stills → ${dir}`);
    console.log(`contact sheet → ${sheet}`);
    console.log(`phone test (360px) → ${phone}`);
  }
  if (errors.length) console.warn('page errors:\n  ' + errors.slice(0, 10).join('\n  '));
} finally {
  await browser.close();
  server.close();
}
