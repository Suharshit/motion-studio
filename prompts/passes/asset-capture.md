# Asset capture — real screenshots, real logo, real colors

```
npm run capture -- <slug> https://product.com [--pages /pricing,/features] [--mobile]
```
Writes to `projects/<slug>/assets/capture/`: full-page + viewport screenshots (2x), logo candidates (img/svg with "logo" in name/alt/class, favicons, apple-touch-icon), and `site.json` with the computed colors and font families most used on the page.

Then, before animating:
1. List what you found (filenames + what each is) in `brief.md` → **Assets**.
2. Pick the logo; if it's raster and small, ask the client for an SVG.
3. Seed `style.json` colors/typography from `site.json` (exact hex, real font names), then layer motion + texture from a vault style.
4. Crop the UI regions you'll animate into separate PNGs (one per feature) — never redraw product UI from imagination.

Pages behind a login: ask the client for screenshots. Never enter credentials.
