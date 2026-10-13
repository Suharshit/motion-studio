# Route A — the seek(t) engine (default)

Opus writes a program, not a video. The program paints the exact frame for any moment: `window.seek(t)`. A headless browser calls it for every frame, screenshots it, and ffmpeg stitches the frames. Nothing depends on a timer, so the render is identical every run and a fix is a one-line edit plus a re-render. Opus picks this route on its own when not told otherwise; in this repo it's wired up for you.

## Files
- `engine/lib/runtime.js` — `studio({...})`: sizing per format, loads style/beats/vo/captions/fonts/images, exposes `window.seek`, live preview with scrubber.
- `engine/lib/motion.js` — `spring`, `sp(t, 'snappy'|'default'|'heavy'|'playful')`, `track`, `track2`, `indicator`, `swapAlpha`, `tween`, `ease`, `rng` (mulberry32), `hash01`, `noise1`, `pulse`, `beatAt`, `barAt`, `loopT`.
- `engine/lib/draw.js` — `kineticText`, `typewriter`, `counter`, `captions`, `cursor`, `ripple`, `roundRect`, `drawCover`, `strokeProgress`, `background`, `finish` (grain + vignette), `setType`.
- `engine/lib/layout.js` — `ctx.L`: `px`, `safe`, `pick`, `cell`, `captionBand`.
- `engine/render.mjs` — Playwright → ffmpeg; `--sub 4` motion blur, `--format all`, `--scale 0.5` animatic, `--from/--to`.

## Project skeleton (templates/project/index.html)
```js
import {studio} from '../../engine/lib/runtime.js';
import {sp, track, swapAlpha, beatAt} from '../../engine/lib/motion.js';
import {kineticText, background, finish} from '../../engine/lib/draw.js';

studio({
  duration: 16,
  images: {logo: 'assets/logo.png'},
  background: (t, ctx) => background(ctx.g, t, ctx),
  scenes: (ctx) => [
    {name: 'hook', from: 0, to: beatAt(ctx.beats, 4), draw(t, ctx) { /* … */ }},
  ],
  overlay: (t, ctx) => finish(ctx.g, t, ctx),
});
```

## Render contract (also in CLAUDE.md)
- Pure function of time. No CSS transitions, `setTimeout`, `requestAnimationFrame` (except the runtime's preview), no state carried between frames.
- Seeded randomness only (`rng`, `hash01`, `noise1`), never `Math.random`.
- Precompute in `setup` (paths, layouts) — fine, because it doesn't depend on t.
- DOM mode (`mode: 'dom'`) is allowed for HTML-heavy pieces; set every style property from t in `draw`, never toggle classes with transitions.
- Draw text at its final size (scale containers, not text bitmaps) — no blurry type.

## Commands
```
npm run preview -- <slug> [--format 1x1]     # http://127.0.0.1:4321/... live, scrubbable
npm run stills  -- <slug>                    # look before rendering
npm run render  -- <slug> --scale 0.5 --sub 1 --jpeg     # fast animatic
npm run render  -- <slug> --format all --sub 4           # final
```
