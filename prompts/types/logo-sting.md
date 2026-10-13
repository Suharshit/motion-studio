# Logo sting — reveal, intro, outro, end card

**Use for:** channel idents, intro/outro bumpers, end cards, logo reveals for launches.
**Engine:** route A · **Effort:** high · **Length:** 3–8s · **Formats:** 16:9, 9:16, 1:1 (and a transparent version on request).

## Inputs to collect
- The client's own logo as SVG (best) or high-res PNG — use the real mark, never a redraw · brand colors
- Personality in three words · where it plays (YouTube intro, ad end card) · sound: synthesized sting or supplied

## Prompt
```
Make a [5]-second logo sting for [BRAND] using ./assets/logo.svg exactly as supplied.
Personality: [precise, warm, playful]. Concept options — show me 3 one-line concepts first, then build the chosen one:
  (a) built from its own geometry (strokes draw, fills land on a heavy spring)
  (b) assembled from UI fragments of the product
  (c) a typographic set-up line that resolves into the wordmark
Timing: 0–0.4s anticipation, 0.4–2.5s build, hero hold ≥ 1.5s, optional tagline, clean last frame (poster).
Sound: one synthesized sting (riser into impact + shimmer) aligned to the moment the mark completes.
Deliver 16:9, 9:16 and 1:1, plus out/<slug>/poster_<fmt>.png of the final frame.
```

## Build notes
- SVG paths: parse into point lists once in `setup`, reveal with `strokeProgress`.
- The mark lands with `heavy` (no overshoot); secondary elements may use `snappy`.
- Transparent version: render frames as PNG and encode with `-c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le` (ask before — big files).

## Critique focus
Logo proportions untouched, colors exact, hold long enough to read, the sting hit lands on the visual completion frame (±1 frame).
