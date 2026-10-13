# Story / history — tell something over time

**Use for:** "the history of X from A to today", company origin stories, timelines, mini-documentaries, biographical pieces.
**Engine:** route A; switch to Remotion past ~2 minutes or when chapters are split across subagents · **Effort:** xhigh → max · **Length:** 45s–3min.

Keep the showreel energy but give it a spine: chapters, a narrator (optional), and a visual payoff every 3–5 seconds.

## Inputs to collect
- Topic, start point, end point · the feeling at the end · narrated (Fish Audio) or type-only
- Facts and dates — sourced. Every date/name on screen gets a source line in `docs/shotlist.md`.
- Visual era language (period-appropriate palettes, type, textures) · formats · music

## Guardrails
- Real people are drawn **stylized** (silhouettes, simple vector figures, iconography) — no photoreal likenesses, no invented quotes. Quotes on screen must be real, attributed, and short.
- No copyrighted characters, logos or film stills; draw period-appropriate *generic* objects instead.

## Prompt
```
Use your showreel energy, but tell a story: the history of [TOPIC] from [START] to today. Surprise me with the storyboard.
[45] seconds, [vertical 9:16].

1. Research and write docs/shotlist.md: 5–8 chapters, each with years, the one image that sums it up, on-screen text (≤ 6 words), and a source for every fact.
2. [Narrated: vo/script.json at ~2.4 words/sec, npm run vo + captions; chapters cut on VO line starts.]
3. Era language: each chapter shifts palette/texture slightly while the type system and grid stay constant (continuity).
4. A transition device that carries through (a timeline rail, a camera push through layers, a morphing year counter).
5. Original score that evolves per chapter (npm run music with --bars per chapter, or one track with sections).
For > 60s: write docs/ANIMATION_GUIDE.md first (shared helpers, palette, type, transitions), then build chapters in src files ch01.js… (optionally one subagent per chapter), then assemble.
Stills per chapter + critique before the full render.
```

## Long-form structure tips
- Chapters as separate modules returning `{from, to, draw}` scenes; `index.html` concatenates them.
- A year counter or timeline rail is the cheapest continuity device and reads at phone size.

## Critique focus
Facts vs sources, every chapter has a payoff, continuity of type/grid across eras, pacing (no chapter > 15% longer than planned).
