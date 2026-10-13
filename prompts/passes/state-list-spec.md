# State-list spec — write states, not vibes

For UI morphs, film-set stories, and any piece where one element changes many times.

1. List every state (8–12 for a 16s loop) with its **real** data.
2. Put each on the beat grid: `t = beats[i]`. Big changes on downbeats.
3. For the persistent element, write its keys: width, height, radius, fill, x, y — as `[[t, value], ...]` arrays.
   These become `track(t, keys)` calls verbatim. One spring per change, never restarted.
4. For content inside it: tIn/tOut per state → `swapAlpha(t, tIn, tOut)`.
5. For the cursor: a key per action `[[t, [x, y]], ...]` → `track2`, plus click times → `ripple`, `pressed`.
6. Loop: the last key of every track equals the first, and the cursor is at rest (velocity 0) at both ends.

Table format (docs/shotlist.md):

| # | Beat | t | State | W×H | R | Fill | Content in/out | Cursor | SFX |
|---|---|---|---|---|---|---|---|---|---|
