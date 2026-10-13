// engine/render.mjs — walk time, call window.seek(t), pipe frames into ffmpeg.
//
//   npm run render -- <slug> [--format 9x16|1x1|4x5|16x9|all] [--fps 60] [--sub 4]
//                            [--from 0 --to 5] [--scale 0.5] [--jpeg] [--out path.mp4]
//
//   --sub N    render N subframes per frame and blend them (motion blur). 1 = off (drafts).
//   --scale    0.5 → animatic at half resolution (layout scales, nothing crops)
//   --from/--to  render only a window (fast re-checks of the seconds you just fixed)
//   --jpeg     faster capture for drafts
//
// Output: out/<slug>/silent_<format>.mp4  (audio is added by `npm run mix`)
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer, projectUrl, args, FORMATS, ROOT} from './serve.mjs';

export async function launchBrowser() {
  const executablePath = process.env.MOTION_BROWSER || undefined;
  return chromium.launch({
    executablePath,
    args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars'],
  });
}

export async function openProject(browser, port, slug, format, scale = 1) {
  const [W, H] = FORMATS[format] ?? format.split('x').map(Number);
  const w = Math.round(W * scale), h = Math.round(H * scale);
  const page = await browser.newPage({viewport: {width: w, height: h}, deviceScaleFactor: 1});
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
  let fontWarned = false;
  page.on('requestfailed', (r) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) {
      if (!fontWarned) errors.push('Google Fonts unreachable — rendering with fallback fonts. Put font files in assets/fonts and set "src" in style.json for offline-identical renders.');
      fontWarned = true;
    } else errors.push(`request failed: ${r.url()}`);
  });
  const url = projectUrl(port, slug, `${w}x${h}`, '&render=1');
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, {timeout: 60000}).catch(() => {
    throw new Error(`Project did not become ready. Errors:\n${errors.join('\n') || '(none — check studio() is called)'}`);
  });
  const meta = await page.evaluate(() => window.__studio);
  return {page, meta, errors, w, h};
}

async function renderFormat(browser, port, slug, format, o) {
  const scale = Number(o.scale ?? 1);
  const {page, meta, errors, w, h} = await openProject(browser, port, slug, format, scale);
  const FPS = Number(o.fps ?? meta.fps ?? 60);
  const SUB = Math.max(1, Number(o.sub ?? 1));
  const from = Number(o.from ?? 0);
  const to = Math.min(Number(o.to ?? meta.duration), meta.duration);
  const outDir = join(ROOT, 'out', slug);
  mkdirSync(outDir, {recursive: true});
  const suffix = o.from || o.to ? `_${from}-${to}s` : '';
  const out = o.out ?? join(outDir, `silent_${format}${scale !== 1 ? '_draft' : ''}${suffix}.mp4`);

  const vf = SUB > 1 ? `tmix=frames=${SUB}:weights=${'1 '.repeat(SUB).trim()},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/${FPS}/TB` : `setpts=N/${FPS}/TB`;
  const ff = spawn(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS * SUB), '-i', '-', '-vf', vf, '-r', String(FPS),
      '-c:v', 'libx264', '-preset', scale !== 1 ? 'veryfast' : 'slow', '-crf', String(o.crf ?? 16), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    {stdio: ['pipe', 'inherit', 'inherit']},
  );
  const ffDone = new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg exited ' + c)))));

  const total = Math.round((to - from) * FPS * SUB);
  const type = o.jpeg ? 'jpeg' : 'png';
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const t = from + i / (FPS * SUB);
    await page.evaluate((tt) => window.seek(tt), t);
    const buf = await page.screenshot({type, quality: type === 'jpeg' ? 92 : undefined, clip: {x: 0, y: 0, width: w, height: h}});
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % (FPS * SUB) === 0) process.stdout.write(`\r[${format}] ${(t - from).toFixed(0)}s / ${(to - from).toFixed(0)}s`);
  }
  ff.stdin.end();
  await ffDone;
  await page.close();
  if (errors.length) console.warn(`\n[${format}] page errors:\n  ` + errors.slice(0, 10).join('\n  '));
  console.log(`\r[${format}] done in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${out}`);
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = args();
  const slug = a._[0];
  if (!slug) {
    console.error('usage: npm run render -- <slug> [--format 9x16|1x1|16x9|all] [--sub 4] [--fps 60] [--scale 0.5] [--from s --to s]');
    process.exit(1);
  }
  const formats = (a.format ?? '9x16') === 'all' ? ['9x16', '1x1', '16x9'] : String(a.format ?? '9x16').split(',');
  const {server, port} = await startServer();
  const browser = await launchBrowser();
  try {
    for (const f of formats) await renderFormat(browser, port, slug, f, a);
  } finally {
    await browser.close();
    server.close();
  }
}
