// engine/lib/draw.js — canvas helpers that read the project's style tokens.
// All take (g, ...) and are pure: same inputs → same pixels.

import {clamp, spring, sp, hash01, lerp} from './motion.js';

// ---------------------------------------------------------------- type
export const fontFor = (style, role = 'display', size = 64, weightOverride) => {
  const t = style?.typography?.[role] ?? {family: 'Inter', weight: 600};
  return `${weightOverride ?? t.weight ?? 400} ${size}px "${t.family}", ui-sans-serif, system-ui, sans-serif`;
};
export const caseText = (s, c) =>
  c === 'upper' ? s.toUpperCase() : c === 'lower' ? s.toLowerCase() : c === 'title' ? s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1)) : s;

/** Apply a typography role to the context (font, tracking). Returns the cased text. */
export function setType(g, style, role, size, text = '') {
  const t = style?.typography?.[role] ?? {};
  g.font = fontFor(style, role, size);
  g.letterSpacing = `${(t.letterSpacing ?? 0) * size}px`;
  return caseText(text, t.case);
}

/** Greedy word-wrap. Returns lines. */
export function wrap(g, text, maxW) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Kinetic words: each word springs up from a mask, staggered.
 * reveal: 'mask-up' | 'scale-pop' | 'blur-in' | 'slide'
 */
export function kineticText(g, t, text, {x, y, size, maxW = Infinity, role = 'display', style, color, align = 'center', stagger = 0.06, feel = 'default', reveal = 'mask-up', lineGap = 1.05, exitAt = Infinity, exitDur = 0.25}) {
  const cased = setType(g, style, role, size, text);
  const lines = wrap(g, cased, maxW);
  g.textBaseline = 'alphabetic';
  g.fillStyle = color ?? style?.colors?.text ?? '#fff';
  let wi = 0;
  const lh = size * lineGap;
  const top = y - ((lines.length - 1) * lh) / 2;
  for (let li = 0; li < lines.length; li++) {
    const words = lines[li].split(' ');
    const space = g.measureText(' ').width;
    const widths = words.map((w) => g.measureText(w).width);
    const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    const ly = top + li * lh;
    for (let i = 0; i < words.length; i++, wi++) {
      const p = sp(t - wi * stagger, feel);
      const out = clamp((t - exitAt - wi * stagger * 0.5) / exitDur);
      const vis = p * (1 - out);
      g.save();
      if (reveal === 'mask-up') {
        g.beginPath();
        g.rect(cx - size * 0.1, ly - size * 1.0, widths[i] + size * 0.2, size * 1.3);
        g.clip();
        g.translate(0, (1 - p) * size * 1.1 - out * size * 1.1);
      } else if (reveal === 'scale-pop') {
        g.translate(cx + widths[i] / 2, ly - size * 0.35);
        g.scale(lerp(0.4, 1, vis), lerp(0.4, 1, vis));
        g.translate(-(cx + widths[i] / 2), -(ly - size * 0.35));
        g.globalAlpha *= clamp(vis * 2);
      } else if (reveal === 'blur-in') {
        g.filter = `blur(${(1 - vis) * size * 0.15}px)`;
        g.globalAlpha *= clamp(vis * 1.5);
      } else if (reveal === 'slide') {
        g.translate((1 - p) * size * 0.6, 0);
        g.globalAlpha *= clamp(vis * 2);
      }
      g.fillText(words[i], cx, ly);
      g.restore();
      cx += widths[i] + space;
    }
  }
  return {lines: lines.length, height: lines.length * lh};
}

/** Typewriter with a blinking-free caret (caret blink is time-based, so still deterministic). */
export function typewriter(g, t, text, {x, y, size, style, role = 'mono', cps = 22, color, caret = true}) {
  const n = Math.floor(clamp(t * cps, 0, text.length));
  const shown = setType(g, style, role, size, text).slice(0, n);
  g.fillStyle = color ?? style?.colors?.text ?? '#fff';
  g.textAlign = 'left';
  g.fillText(shown, x, y);
  if (caret && Math.floor(t * 2) % 2 === 0) {
    const w = g.measureText(shown).width;
    g.fillRect(x + w + size * 0.08, y - size * 0.8, size * 0.08, size * 0.95);
  }
}

/** Animated counter: rolls to `value` with a spring. */
export function counter(g, t, value, {x, y, size, style, role = 'display', prefix = '', suffix = '', decimals = 0, feel = 'heavy', color, align = 'center'}) {
  const v = value * sp(t, feel);
  setType(g, style, role, size);
  g.fillStyle = color ?? style?.colors?.text ?? '#fff';
  g.textAlign = align;
  g.fillText(prefix + v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals}) + suffix, x, y);
}

// ---------------------------------------------------------------- shapes
export function roundRect(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}
export function drawCover(g, img, x, y, w, h, {radius = 0, focusX = 0.5, focusY = 0.5} = {}) {
  if (!img) return;
  const s = Math.max(w / img.width, h / img.height);
  const iw = img.width * s, ih = img.height * s;
  g.save();
  roundRect(g, x, y, w, h, radius);
  g.clip();
  g.drawImage(img, x - (iw - w) * focusX, y - (ih - h) * focusY, iw, ih);
  g.restore();
}
export function drawContain(g, img, x, y, w, h) {
  if (!img) return;
  const s = Math.min(w / img.width, h / img.height);
  g.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
}
/** Draws a path progressively (line-draw reveal). pts: [[x,y],...] */
export function strokeProgress(g, pts, p) {
  if (pts.length < 2 || p <= 0) return;
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(d);
    total += d;
  }
  let left = total * clamp(p);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const f = Math.min(1, left / segs[i - 1]);
    g.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f));
    left -= segs[i - 1];
  }
  g.stroke();
}

// ---------------------------------------------------------------- cursor (drives UI changes with "real" clicks)
export function cursor(g, x, y, {scale = 1, pressed = 0, color = '#111', outline = '#fff'} = {}) {
  g.save();
  g.translate(x, y);
  g.scale(scale * (1 - pressed * 0.12), scale * (1 - pressed * 0.12));
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(0, 34);
  g.lineTo(9, 26);
  g.lineTo(15, 40);
  g.lineTo(21, 37);
  g.lineTo(15, 24);
  g.lineTo(26, 24);
  g.closePath();
  g.lineWidth = 3;
  g.strokeStyle = outline;
  g.stroke();
  g.fillStyle = color;
  g.fill();
  g.restore();
}
/** Click ripple, t = seconds since click. */
export function ripple(g, x, y, t, color = 'rgba(255,255,255,0.5)', r = 40) {
  if (t < 0 || t > 0.5) return;
  const p = clamp(t / 0.5);
  g.save();
  g.globalAlpha = 1 - p;
  g.strokeStyle = color;
  g.lineWidth = 3;
  g.beginPath();
  g.arc(x, y, r * spring(t, 260, 26), 0, Math.PI * 2);
  g.stroke();
  g.restore();
}

// ---------------------------------------------------------------- texture
let grainCanvas = null;
function grainTile(size = 256) {
  if (grainCanvas) return grainCanvas;
  grainCanvas = document.createElement('canvas');
  grainCanvas.width = grainCanvas.height = size;
  const gg = grainCanvas.getContext('2d');
  const img = gg.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = Math.floor(hash01(i * 2654435761) * 255);
    img.data.set([v, v, v, 255], i * 4);
  }
  gg.putImageData(img, 0, 0);
  return grainCanvas;
}
/** Film grain that changes every frame but deterministically (offset from frame index). */
export function grain(g, t, W, H, amount = 0.06, fps = 24) {
  if (amount <= 0) return;
  const tile = grainTile();
  const f = Math.floor(t * fps);
  g.save();
  g.globalAlpha = amount;
  g.globalCompositeOperation = 'overlay';
  const ox = -Math.floor(hash01(f) * 256), oy = -Math.floor(hash01(f + 999) * 256);
  for (let x = ox; x < W; x += 256) for (let y = oy; y < H; y += 256) g.drawImage(tile, x, y);
  g.restore();
}
export function vignette(g, W, H, amount = 0.35) {
  if (amount <= 0) return;
  const r = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6);
  r.addColorStop(0, 'rgba(0,0,0,0)');
  r.addColorStop(1, `rgba(0,0,0,${amount})`);
  g.fillStyle = r;
  g.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- captions (from Fish Audio word timestamps)
/**
 * Word-level kinetic captions. captions = vo/captions.json:
 * {words: [{text, start, end}], lines: [{start, end, words:[i...]}]}
 * Shows the current line; the spoken word pops in the accent color.
 */
export function captions(g, t, caps, {L, style, size, maxW, y, color, accent, role = 'display', bg = null}) {
  if (!caps?.lines?.length) return;
  const line = caps.lines.find((l) => t >= l.start && t < l.end + 0.15);
  if (!line) return;
  const words = line.words.map((i) => caps.words[i]);
  size = size ?? L.px(L.portrait ? 72 : 56);
  maxW = maxW ?? L.safe.w;
  y = y ?? L.captionBand.y + L.captionBand.h / 2;
  setType(g, style, role, size);
  g.textBaseline = 'middle';
  const space = g.measureText(' ').width;
  // wrap words into rows
  const rows = [[]];
  let rw = 0;
  for (const w of words) {
    const text = caseText(w.text, style?.typography?.[role]?.case);
    const ww = g.measureText(text).width;
    if (rw + ww > maxW && rows.at(-1).length) {
      rows.push([]);
      rw = 0;
    }
    rows.at(-1).push({...w, text, ww});
    rw += ww + space;
  }
  const lh = size * 1.15;
  rows.forEach((row, ri) => {
    const total = row.reduce((a, w) => a + w.ww, 0) + space * (row.length - 1);
    let x = L.cx - total / 2;
    const ry = y + (ri - (rows.length - 1) / 2) * lh;
    for (const w of row) {
      const on = t >= w.start;
      const p = sp(t - w.start, 'snappy');
      const speaking = t >= w.start && t < w.end + 0.05;
      g.save();
      g.translate(x + w.ww / 2, ry);
      const s = on ? lerp(0.85, 1, p) * (speaking ? 1.06 : 1) : 0.85;
      g.scale(s, s);
      if (bg && speaking) {
        g.fillStyle = bg;
        roundRect(g, -w.ww / 2 - size * 0.15, -size * 0.6, w.ww + size * 0.3, size * 1.2, size * 0.2);
        g.fill();
      }
      g.globalAlpha = on ? 1 : 0.35;
      g.fillStyle = speaking ? (accent ?? style?.colors?.accent ?? '#ff5') : (color ?? style?.colors?.text ?? '#fff');
      g.textAlign = 'center';
      g.fillText(w.text, 0, 0);
      g.restore();
      x += w.ww + space;
    }
  });
}

// ---------------------------------------------------------------- backgrounds from style.texture.background
export function background(g, t, ctx) {
  const {W, H, style, L} = ctx;
  const c = style?.colors ?? {};
  const kind = style?.texture?.background ?? 'solid';
  g.fillStyle = c.bg ?? '#111';
  g.fillRect(0, 0, W, H);
  if (kind === 'grid' || kind === 'dots') {
    const step = L.px(kind === 'dots' ? 48 : 96);
    g.save();
    g.globalAlpha = 0.12;
    g.strokeStyle = g.fillStyle = c.muted ?? '#888';
    g.lineWidth = Math.max(1, L.px(1.5));
    const off = (t * L.px(12)) % step;
    if (kind === 'grid') {
      g.beginPath();
      for (let x = -off; x < W; x += step) (g.moveTo(x, 0), g.lineTo(x, H));
      for (let y = -off; y < H; y += step) (g.moveTo(0, y), g.lineTo(W, y));
      g.stroke();
    } else {
      for (let x = -off; x < W; x += step) for (let y = -off; y < H; y += step) g.fillRect(x, y, L.px(3), L.px(3));
    }
    g.restore();
  } else if (kind === 'gradient' && c.gradient?.length) {
    const lg = g.createLinearGradient(0, 0, W, H);
    c.gradient.forEach((col, i) => lg.addColorStop(i / Math.max(1, c.gradient.length - 1), col));
    g.fillStyle = lg;
    g.fillRect(0, 0, W, H);
  } else if (kind === 'spotlight') {
    const r = g.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.35, Math.max(W, H) * 0.8);
    r.addColorStop(0, c.surface ?? '#222');
    r.addColorStop(1, c.bg ?? '#000');
    g.fillStyle = r;
    g.fillRect(0, 0, W, H);
  } else if (kind === 'mesh' && c.gradient?.length) {
    c.gradient.forEach((col, i) => {
      const a = t * 0.15 + i * 2.1;
      const x = W * (0.5 + 0.35 * Math.cos(a)), y = H * (0.5 + 0.35 * Math.sin(a * 1.3));
      const r = g.createRadialGradient(x, y, 0, x, y, Math.max(W, H) * 0.6);
      r.addColorStop(0, col);
      r.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 0.55;
      g.fillStyle = r;
      g.fillRect(0, 0, W, H);
    });
    g.globalAlpha = 1;
  }
}

/** Standard finishing overlay: grain + vignette from style.texture. */
export function finish(g, t, ctx) {
  const tex = ctx.style?.texture ?? {};
  vignette(g, ctx.W, ctx.H, tex.vignette ?? 0);
  grain(g, t, ctx.W, ctx.H, tex.grain ?? 0);
}
