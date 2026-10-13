# Critique pass — make Opus watch its own frames

This one habit separates the clips that ship from the ones posted with "it's a bit mid". Run it before every full render and after every fix.

## Get frames
```
npm run stills -- <slug>                      # one frame per beat → out/<slug>/contact_<fmt>.png + phone_<fmt>.png
npm run stills -- <slug> --every 0.083 --from 4.0 --to 5.0   # 12 frames around a fast action
npm run stills -- <slug> --format 1x1         # each delivery format
# after a render:
npm run qa -- <slug> --format 9x16 --strip 4.2 --determinism
```

## The prompt (to yourself)
```
Open the contact sheet, the phone sheet and any strips with the Read tool and LOOK at them properly.
Be a harsh motion director, not a proud author.

Score 1–10:
  hook in the first 2s · readability at phone size (360px) · motion quality (springs, no dead frames)
  · variety (something new every 2–4s) · composition · brand accuracy · sound sync

List the 3 biggest problems with timestamps. Hunt specifically for:
  text overlapping during swaps · anything sliding instead of easing · corner labels and frame borders
  · centered-on-gradient shots · blurry scaled text · a dead beat with nothing happening
  · a stutter at the loop seam · anything cropped in another format · captions covering the subject

Fix them. Re-check only the affected seconds (stills --from/--to, or render --from/--to).
Log the round in projects/<slug>/docs/review_log.md: date, scores, 3 problems, fixes.
Repeat until every score is ≥ 8. Minimum 3 rounds for client work.
```

Show the client the contact sheet + scores with the first draft. Iteration is the method, not a failure.
