// engine/lib/layout.js — write scenes against a layout, never fixed pixels.
// The same scene code reframes for 9:16, 1:1, 4:5 and 16:9 instead of cropping.

export function layout(W, H, style = {}) {
  const aspect = W / H;
  const portrait = aspect < 0.9;
  const landscape = aspect > 1.1;
  const square = !portrait && !landscape;
  const u = Math.min(W, H) / 1080; // 1 unit = 1px on a 1080-wide short side
  const m = (style?.layout?.safeMargin ?? 96) * u;
  const safe = {x: m, y: portrait ? m * 1.6 : m, w: W - 2 * m, h: H - (portrait ? 3.2 : 2) * m};
  return {
    W,
    H,
    aspect,
    portrait,
    landscape,
    square,
    u,
    cx: W / 2,
    cy: H / 2,
    safe,
    /** px at 1080 short-side → px in this format */
    px: (v) => v * u,
    /** pick a value per orientation: L.pick({portrait: 140, square: 120, landscape: 110}) */
    pick: (o) => (portrait ? o.portrait : square ? (o.square ?? o.portrait) : (o.landscape ?? o.square ?? o.portrait)),
    /** grid cell rect inside the safe area: cols x rows, cell (c, r), optional span */
    cell(cols, rows, c, r, cs = 1, rs = 1, gap = 24 * u) {
      const cw = (safe.w - gap * (cols - 1)) / cols, ch = (safe.h - gap * (rows - 1)) / rows;
      return {x: safe.x + c * (cw + gap), y: safe.y + r * (ch + gap), w: cw * cs + gap * (cs - 1), h: ch * rs + gap * (rs - 1)};
    },
    /** caption band: where subtitles/kinetic captions live without covering the subject */
    captionBand: portrait ? {y: H * 0.68, h: H * 0.14} : {y: H * 0.78, h: H * 0.14},
  };
}

export const FORMATS = {
  '9x16': [1080, 1920],
  '1x1': [1080, 1080],
  '4x5': [1080, 1350],
  '16x9': [1920, 1080],
  '4k': [3840, 2160],
};
