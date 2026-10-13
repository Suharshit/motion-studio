---
name: critique-loop
description: Look at rendered frames of a motion project and fix them like a harsh motion director — contact sheets, phone-size tests, strips around fast actions, loop and determinism checks, scored rounds until every score is 8+. Use after any build or fix, before any full render, and whenever the user says it looks mid, off, or asks for a review.
---

# Critique loop

```
npm run stills -- <slug>                                   # one frame per beat → out/<slug>/contact_<fmt>.png, phone_<fmt>.png
npm run stills -- <slug> --every 0.083 --from <t-0.5> --to <t+0.5>   # dense strip around a fast moment
npm run stills -- <slug> --format 1x1                      # every delivery format
npm run qa -- <slug> --format 9x16 --strip <t> --determinism         # after a render
```

1. **Read the images** with the Read tool — the contact sheet, the phone sheet, and any strip. Actually look.
2. **Score 1–10:** hook (first 2s) · readability at 360px · motion quality · variety (new thing every 2–4s) · composition · brand accuracy · sound sync.
3. **Hunt:** text overlapping during swaps · sliding instead of springing · corner labels / frame borders · centered-on-gradient · blurry scaled text · dead beats · loop-seam stutter · format crops · captions over the subject · numbers that don't match the source.
4. **Write the round** in `projects/<slug>/docs/review_log.md`:
```
## Round N — YYYY-MM-DD
hook: 7/10 · readability: 6/10 · motion: 8/10 · variety: 7/10 · composition: 8/10 · brand: 9/10 · sound sync: 7/10
Problems: (1) 3.1s — … (2) … (3) …
Fixes: …
```
   (`npm run deliver` looks for a round where every score is ≥ 8 — keep this exact `name: N/10` format.)
5. **Fix the 3 worst**, re-check only those seconds (`stills --from/--to` or `render --from/--to --scale 0.5`).
6. Repeat until every score ≥ 8. Minimum 3 rounds for client work. Be a harsh director, not a proud author.
