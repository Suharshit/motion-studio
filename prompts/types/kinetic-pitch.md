# Kinetic pitch — notes, quotes and announcements as moving type

**Use for:** pitch videos from notes, product updates, hiring posts, manifestos, quote cards, "turn this thread into a video".
**Engine:** route A (HyperFrames if the client prefers HTML/GSAP) · **Effort:** high → xhigh · **Length:** 15–60s · **Formats:** 9:16, 1:1.

Type is the picture. The job is rhythm: what goes huge, what sits small, what holds, what cuts.

## Inputs to collect
- The source text (notes, thread, script) · the single sentence the viewer must remember
- Voiced (Fish Audio) or silent-with-captions · brand/vault style · music · formats

## Prompt
```
Turn [./notes.md | the text below] into a [45]-second kinetic-type pitch video.
1. Edit the text down to on-screen lines: ≤ 7 words per card, the key sentence gets its own beat and holds for 2 beats.
2. [Voiced: write vo/script.json from the same lines, npm run vo, npm run captions; picture follows the VO word timing.]
   [Silent: the type IS the narration; one line per 1–2 beats on the beat grid.]
3. Type system: display face for the 1–3 power words per card (huge, tight tracking), UI face for the rest.
   Reveals vary: mask-up, scale-pop, typewriter for code/quotes, line-by-line wipe. Never everything fading in.
4. Composition changes every card (left-aligned stack, giant single word, split top/bottom, word grid, full-bleed number).
5. Synthesized music at [110] BPM; a tick or pop on each new word group.
Shot list on the beat grid → stills → critique → render.
```

## Rules of thumb
- 2.5 words/sec max on screen for silent pieces; 1 card per VO line for voiced ones.
- Emphasis = scale + color + hold, not more animation.
- Leave the caption band empty in voiced versions (captions live there).

## Critique focus
Readable at 360px in one glance, no orphaned single words on a line (except deliberate), every card a different composition.
