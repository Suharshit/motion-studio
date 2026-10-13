# Shot list on the beat grid

1. Get the grid: `npm run beats -- projects/<slug>/audio/track.wav` (supplied track) or `npm run music -- <slug> --bpm N --bars N` (synthesized). Both write `projects/<slug>/beats.json`.
2. Length = bars × 4 × 60/BPM. 120 BPM: 1 bar = 2s, 8 bars = 16s.
3. Every shot starts on a beat; big moments on downbeats; nothing lasts > 2 bars without a new event; hook in the first 2s.
4. Write `docs/shotlist.md`:

| # | t in–out | Beat/bar | What we see | Technique | Text on screen | Camera | SFX | Spring |
|---|---|---|---|---|---|---|---|---|

5. Write `cues.json` from the SFX column at the same times (`npm run sfx`).
6. In code, read times from `ctx.beats` (`beatAt`, `barAt`) — never hard-code seconds that should be beats, so a tempo change re-times the whole film.
