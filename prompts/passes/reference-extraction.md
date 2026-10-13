# Reference extraction — name a look, feed a frame

Without a reference the model falls back to its defaults (centered text, gradient, everything fading in). Naming a style beats describing it; a reference frame or video beats both.

Three kinds of reference:
- **A frame** — a screenshot of a video you love. Say what to take (palette, type, grain) and what *not* to take (subject).
- **A video** — extract frames and describe the pacing shot by shot before writing code.
- **A library** — a folder of the client's own images or past work. Write a style guide from it first. Nobody else can copy this one.

## Steps
```
npm run ref -- <slug> ./refs/launch.mp4          # one frame / 0.5s → refs/frames/*.png + refs/contact.png
```
Then:
```
1. Study refs/contact.png and the individual frames.
2. Write docs/style_guide.md: palette (hex), type (family, weight, tracking, case), shot lengths, transition types,
   camera moves, texture/grain, how text enters and exits, how many things move at once.
3. Write docs/shotlist.md for a [DURATION]s video about [SUBJECT] in THAT style.
   Take the grammar of the reference — never its content, logos, characters or copy.
4. Show me both files. Wait for OK before any code.
```
Also translate the style guide into `projects/<slug>/style.json` (same schema as the vault) so the engine and the vault both understand it.

When a reference is given, specify the look and the constraints — let the model choose the technique (it may write its own paper renderer instead of reaching for a library).
