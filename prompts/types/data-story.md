# Data story — numbers as the hero

**Use for:** results, metrics, investor updates, year-in-review / "wrapped", reports, market recaps.
**Engine:** route A for one-offs; route B Remotion for a recurring, data-fed series · **Effort:** xhigh · **Length:** 15–60s.

## Inputs to collect
- The data (CSV/JSON/table) and its **source** — every number shown must trace to it
- The 3–5 numbers that matter, and the one sentence they prove · comparison baseline · units/currency
- Voice or not · style · formats

## Prompt
```
Make a [30]-second data story from [./data.csv]. The point: [ONE SENTENCE].
1. Pick the 3–5 numbers that prove it. Write each with its source row in docs/shotlist.md. Never round in a misleading way; never invent a value.
2. One chart idea per beat, each the simplest form that shows the point: counter slam, bar race, line that draws itself, stacked share, before/after split.
3. Charts draw themselves (strokeProgress on a spring), axes are minimal, labels sit on the data (no legends if avoidable).
4. Counters use counter() with the heavy spring; the final value holds ≥ 1 beat.
5. [Voice: npm run vo with the numbers spelled the way they should be said — add a pronunciation entry if needed.]
6. Music at [100] BPM, a soft impact on each big number.
Stills + critique before the full render. In the critique, re-check every on-screen number against the data.
```

## Gotchas
- Truncated y-axes exaggerate change — start bars at zero.
- Number formatting per locale (1,000 vs 1.000; ₹ vs $) — ask.
- A counter that overshoots its final value is lying for a frame — use the `heavy` spring (no overshoot) for numbers.
