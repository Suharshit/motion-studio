# Product launch — point the reel at a real product

**Use for:** launch films, product promos, feature drops, ads, Product Hunt / App Store videos.
**Engine:** route A · **Effort:** xhigh (max if the first 3 seconds carry the launch) · **Length:** 15–45s · **Formats:** 9:16 → 1:1 → 16:9 from one timeline.

The three lines that turn a reel into a launch video: the product **URL**, "use the **actual** product screenshots, logo and assets", and "**must have music**". One session per brand — the renderer, synth and export pipeline already exist on the second video, so it's faster.

## Inputs to collect
- Product name + URL (and login-free pages worth showing) · the client's permission to use their assets
- The one problem it solves (≤ 5 words) · 3 features · one proof metric (users, time saved, revenue, rating)
- CTA (URL, "Try free", App Store) · brand colors/fonts if not on the site · formats · music: file or "synthesize"
- Optional: a reference (→ `passes/reference-extraction.md`), a narrator (→ `passes/voiceover-pass.md`)

## Prompt
```
Make a dynamic [20]-second motion graphics video for [PRODUCT] ([URL]) with the energy of a motion designer's showreel. Go all out.

Assets
- Run `npm run capture -- [slug] [URL]` (real screenshots, logo candidates, colors, fonts) and list what you found before animating.
- Never redraw the product UI from imagination. Crop, mask and animate the real screenshots.

Story — one beat each, 2–4 seconds, on the beat grid
1. Hook: the problem in ≤ 5 words of huge kinetic type.
2. The product appears; its UI assembles itself piece by piece.
3. Three features, each a UI moment with a cursor doing a real action (click, type, drag).
4. One number that proves it works: [METRIC], as a counter slam.
5. Logo lockup + [CTA].

Sound: original music at [120] BPM synthesized in code (`npm run music`), UI clicks and whooshes on measured hits (`cues.json` → `npm run sfx`).
Formats: 1080x1920 first, then 1:1 and 16:9 from the same timeline — reframe, never crop.
Before the full render, show me a contact sheet of one frame per beat and your critique scores.
```

## Build notes
- Screenshots go in `projects/<slug>/assets/` and load through `images:` in `studio({...})`; draw with `drawCover` inside rounded device frames you draw yourself (no third-party device mockups).
- Fake depth: 2–3 screenshot layers at different parallax speeds, subtle shadow, slight perspective via scale on a spring.
- Cursor: `track2()` for its path, `ripple()` on each click, the UI responds on the *next* frame after the click.
- Type: the hook uses the display face huge; feature labels use the UI face small. One accent.

## Gotchas
- Screenshots shrink to illegible on 9:16 — crop to the one UI region that matters, zoom it, label it.
- Don't let the logo lockup be the first time the brand color appears; seed it from beat 1.
- Retina screenshots: capture at deviceScaleFactor 2 so zooms stay sharp.

## Critique focus
Brand accuracy (colors/fonts/logo exact), readability at phone size, every feature shows an *action*, CTA legible for ≥ 1.5s.

## Optional upgrades
Voice + mascot → `mascot-explainer`. Same assets as a UI morph loop → `ui-morph-loop`. A 6s cutdown for paid ads → render `--from/--to` of the hook + CTA beats.
