# Route B — Remotion (React)

Best for series and templates (same layout, new data each week), data-driven or personalised batches, and clients whose team already writes React. If you want a framework, say so explicitly — otherwise Opus picks route A.

## Set up inside the project folder
```
cd projects/<slug>
npx create-video@latest remotion --blank      # scaffolds a Remotion app in projects/<slug>/remotion
cd remotion && npx skills add remotion-dev/skills   # official Remotion agent skills (best practices)
npx remotion studio                            # timeline preview
npx remotion render Main ../../../out/<slug>/silent_9x16.mp4
```
Then `npm run mix -- <slug>` and `npm run qa -- <slug>` from the repo root work exactly as with route A (they only need `out/<slug>/silent_<fmt>.mp4`).

## Keep the studio's conventions
- Import `projects/<slug>/style.json` and map tokens to props/CSS variables — the vault schema stays the single source of style.
- Read `beats.json`, `vo/timing.json`, `vo/captions.json` with `staticFile()` / imports; convert seconds → frames with `Math.round(t * fps)`.
- Use Remotion's `spring()` with configs from the style's motion pace, or port `engine/lib/motion.js` (it's framework-free).
- Fish Audio stays the voice: `npm run vo` writes mp3s you place with `<Audio src={staticFile('vo/hook.mp3')} />` (copy `vo/` into `remotion/public/`).
- One `<Composition>` per format (1080x1920, 1080x1080, 1920x1080) driven by the same scenes + a layout helper.
