// engine/lib/runtime.js — the render contract.
//
// A project's index.html calls studio({...}). The runtime:
//   • sizes the stage from ?w=&h= (so one timeline renders 9:16, 1:1 and 16:9)
//   • loads style.json, beats.json, vo/timing.json, vo/captions.json, fonts and images
//   • exposes window.seek(t) — paints the exact frame for time t, nothing else
//   • exposes window.__studio = {duration, fps, ready} for the renderer
//   • in a normal browser (not headless render) runs a live preview with scrub controls
//
// Rules this file enforces for you: no timers or rAF in render mode, no state between frames.

import {layout} from './layout.js';

const q = new URLSearchParams(location.search);
const RENDER = navigator.webdriver || q.has('render');

async function loadJSON(path, fallback = null) {
  try {
    const r = await fetch(path, {cache: 'no-store'});
    if (!r.ok) return fallback;
    return await r.json();
  } catch {
    return fallback;
  }
}

function loadImage(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => {
      console.warn('[studio] image failed:', src);
      res(null);
    };
    img.src = src;
  });
}

async function loadFonts(style) {
  const faces = [style?.typography?.display, style?.typography?.body, style?.typography?.mono].filter(Boolean);
  const jobs = [];
  for (const f of faces) {
    if (f.src) {
      // Local font file (preferred: renders identically offline, forever)
      const face = new FontFace(f.family, `url(${f.src})`, {weight: String(f.weight ?? 400)});
      jobs.push(face.load().then((ff) => document.fonts.add(ff)).catch((e) => console.warn('[studio] font', f.family, e)));
    } else {
      // Google Fonts fallback
      const fam = encodeURIComponent(f.family).replace(/%20/g, '+');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fam}:wght@${f.weight ?? 400}&display=block`;
      document.head.appendChild(link);
      jobs.push(
        new Promise((r) => {
          link.onload = r;
          link.onerror = r;
          setTimeout(r, 4000);
        }).then(() => document.fonts.load(`${f.weight ?? 400} 32px "${f.family}"`)),
      );
    }
  }
  await Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 8000))]);
  await document.fonts.ready;
}

/**
 * @param {object} cfg
 * @param {number} cfg.duration       seconds
 * @param {number} [cfg.fps=60]
 * @param {'canvas'|'dom'} [cfg.mode='canvas']
 * @param {Record<string,string>} [cfg.images]  name → path, loaded before first frame
 * @param {(ctx) => Array<{from:number,to:number,draw:(t:number, ctx)=>void}>} cfg.scenes
 * @param {(t:number, ctx) => void} [cfg.background]  painted under every scene
 * @param {(t:number, ctx) => void} [cfg.overlay]     painted over every scene (grain, captions)
 * @param {(ctx) => void|Promise<void>} [cfg.setup]   one-time setup (precompute paths, DOM nodes)
 */
export async function studio(cfg) {
  const W = Number(q.get('w') ?? cfg.width ?? 1080);
  const H = Number(q.get('h') ?? cfg.height ?? 1920);
  const fps = Number(q.get('fps') ?? cfg.fps ?? 60);

  document.documentElement.style.cssText = `margin:0;background:#000`;
  document.body.style.cssText = `margin:0;overflow:hidden;background:#000`;

  const [style, beats, vo, captions] = await Promise.all([
    loadJSON('style.json', {}),
    loadJSON('beats.json', null),
    loadJSON('vo/timing.json', null),
    loadJSON('vo/captions.json', null),
  ]);
  await loadFonts(style);

  const images = {};
  await Promise.all(Object.entries(cfg.images ?? {}).map(async ([k, src]) => (images[k] = await loadImage(src))));

  const stage = document.createElement(cfg.mode === 'dom' ? 'div' : 'canvas');
  stage.id = 'stage';
  if (cfg.mode === 'dom') {
    stage.style.cssText = `position:relative;width:${W}px;height:${H}px;overflow:hidden;contain:strict`;
  } else {
    stage.width = W;
    stage.height = H;
    stage.style.cssText = `display:block;width:${W}px;height:${H}px`;
  }
  document.body.appendChild(stage);

  const ctx = {
    W,
    H,
    fps,
    duration: cfg.duration,
    stage,
    g: cfg.mode === 'dom' ? null : stage.getContext('2d'),
    root: cfg.mode === 'dom' ? stage : null,
    L: layout(W, H, style),
    style,
    c: style.colors ?? {},
    beats,
    vo,
    captions,
    images,
    t: 0,
  };

  if (cfg.setup) await cfg.setup(ctx);
  const scenes = cfg.scenes(ctx);

  const paint = (t) => {
    ctx.t = t;
    const g = ctx.g;
    if (g) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.fillStyle = ctx.c.bg ?? '#111';
      g.fillRect(0, 0, W, H);
    }
    cfg.background?.(t, ctx);
    for (const s of scenes) {
      if (t >= s.from && t < s.to) {
        if (g) g.save();
        s.draw(t - s.from, ctx, t);
        if (g) g.restore();
      }
    }
    cfg.overlay?.(t, ctx);
  };

  window.seek = (t) => {
    paint(Math.max(0, Math.min(t, cfg.duration - 1e-6)));
    return true;
  };
  window.__studio = {duration: cfg.duration, fps, width: W, height: H, scenes: scenes.map(({from, to, name}) => ({from, to, name}))};
  window.__ready = true;

  if (!RENDER) preview(ctx, cfg, paint);
  else paint(0);
}

// ---------------------------------------------------------------- live preview (never runs in render mode)
function preview(ctx, cfg, paint) {
  const {W, H} = ctx;
  const fit = () => {
    const s = Math.min(innerWidth / W, (innerHeight - 44) / H);
    ctx.stage.style.transformOrigin = '0 0';
    ctx.stage.style.transform = `scale(${s})`;
    document.body.style.height = '100vh';
  };
  fit();
  addEventListener('resize', fit);

  const bar = document.createElement('div');
  bar.style.cssText =
    'position:fixed;left:0;right:0;bottom:0;height:44px;display:flex;gap:10px;align-items:center;padding:0 12px;background:#111;color:#ddd;font:12px ui-monospace,monospace;z-index:9';
  bar.innerHTML = `<button id="pp" style="width:64px">pause</button><input id="sc" type="range" min="0" max="${cfg.duration}" step="0.001" style="flex:1"><span id="tc"></span><span style="opacity:.6">space play · ←/→ frame · shift ←/→ 1s</span>`;
  document.body.appendChild(bar);
  const pp = bar.querySelector('#pp'), sc = bar.querySelector('#sc'), tc = bar.querySelector('#tc');

  let playing = true, t = 0, last = performance.now();
  const show = () => {
    paint(t);
    sc.value = t;
    tc.textContent = `${t.toFixed(2)}s · f${Math.round(t * ctx.fps)}`;
  };
  const loop = (now) => {
    if (playing) t = (t + (now - last) / 1000) % cfg.duration;
    last = now;
    show();
    requestAnimationFrame(loop);
  };
  pp.onclick = () => ((playing = !playing), (pp.textContent = playing ? 'pause' : 'play'));
  sc.oninput = () => ((t = Number(sc.value)), (playing = false), (pp.textContent = 'play'));
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') pp.onclick();
    const step = e.shiftKey ? 1 : 1 / ctx.fps;
    if (e.code === 'ArrowRight') ((t = Math.min(cfg.duration - 1e-6, t + step)), (playing = false));
    if (e.code === 'ArrowLeft') ((t = Math.max(0, t - step)), (playing = false));
  });
  requestAnimationFrame(loop);
}
