# Narrative short — an original character, a plot, a hand-made look

**Use for:** animated shorts, brand fables, hand-painted / watercolor / paper / pixel films, character pieces.
**Engine:** route A (canvas painter you write) or `engines/hand-drawn.md` · **Effort:** max, expect many iterations — a 45s painted short can take ~160 model calls and hours. Iteration is the method.

## Guardrails
- Characters are **original** (or the client's own). Never a known character, mascot, or a "slightly changed" version of one.
- Style references teach technique (wash, paper grain, line weight), not someone's characters or compositions.

## Inputs to collect
- Logline + the feeling at the end · character(s): description or client art · medium (watercolor, ink, paper cut, pixel, clay-ish)
- Length · dialogue? (Fish Audio, multi-speaker supported on S2 models) · music/SFX · formats

## Workflow
1. `docs/style_guide.md` — the medium as rules: palette (hex), paper texture, edge behaviour, line weight, how light is painted.
2. **Character bible** — proportions in head-units, palette sampled into hex, 6 expressions, a turnaround (front/¾/side), an identity lock: the 5 features that must survive every shot.
3. Beat sheet with timestamps, a payoff every 3–5s, hook in 2s, ending that echoes the opening.
4. Build a *painter*, not frames: functions like `wash(g, path, color, seed, t)`, `inkLine(g, pts, weight, wobbleSeed)`, `paper(g)` — seeded, so every frame is reproducible and boil (line wobble) is deliberate: change the seed every 2 frames for a hand-drawn boil.
5. Stills per shot → animatic → full → polish → sound → render.

## Prompt
```
Make a [45]-second hand-painted animated short in code. Story: [LOGLINE]. Ending feeling: [FEELING].
Medium: [watercolor on cold-press paper]. Characters: [original description].
First write docs/style_guide.md (medium as rules) and docs/character_bible.md (proportions, palette, expressions, identity lock), and a beat sheet. Show me all three.
Then build a seeded painter library (washes, ink lines with boil, paper texture) and draw every shot with it — no image assets.
[Dialogue via Fish Audio: vo/script.json, multi-speaker tags if two characters talk.]
Sound: synthesized foley and a sparse score (npm run music -- <slug> --mood piano), every sound placed on the timeline in cues.json.
Gates: stills → animatic → full → polish → sound → render. At least 3 critique rounds; log them in docs/review_log.md.
```

## Critique focus
Character identity across shots, readability of the story without sound, the medium staying consistent (no flat vector shots sneaking in), emotional beat at the end.
