# Mascot / narrated explainer — a voice that explains the product

**Use for:** explainer videos, faceless YouTube segments, onboarding videos, "a character explains our product", tutorials.
**Engine:** route A · **Voice:** Fish Audio (never ElevenLabs) · **Effort:** xhigh · **Length:** 30–90s · **Formats:** 9:16 and 16:9.

Voice + an original mascot is what turns a product reel into a sellable service. The audio drives the picture: write the script, voice it, *then* time the animation to the measured VO.

## Inputs to collect
- Product + URL (→ asset capture) · audience · the single takeaway
- Mascot: the client's own character (supply art) **or** an original one designed here. Never a known character, brand mascot you don't own, or a celebrity likeness.
- Voice: tone (warm, deadpan, energetic), language, gender/age if they care → pick with `npm run voices -- --search "<tone>"` and audition with `--sample`
- Captions: on (default for social) / off · formats · music: file or "synthesize"

## Workflow
1. **Script first.** 2.3–2.6 words per second of VO. Hook line ≤ 8 words. One idea per line. Write `vo/script.json` (see `passes/voiceover-pass.md`).
2. `npm run vo -- <slug>` → every line voiced + measured in `vo/timing.json`.
3. `npm run captions -- <slug>` → word-level timing in `vo/captions.json`.
4. Music last, ducked under the voice automatically by `npm run mix`.
5. Shot list: each VO line = one shot; the visual changes on the *stressed word*, not the line start.

## Prompt
```
Make a [45]-second narrated explainer for [PRODUCT] ([URL]) starring an original mascot: [description — or "design one that fits the brand"].
The voice is Fish Audio (FISH_API_KEY is in .env; voice id [ID or "find a [tone] voice with npm run voices and show me 3 options"]).

1. Write vo/script.json: hook (≤ 8 words) → problem → how it works (3 steps, each a UI action) → proof → CTA. ~2.4 words/sec.
2. Show me the script. After OK: npm run vo, npm run captions.
3. Mascot bible in docs/style_guide.md: proportions, palette (hex), 6 expressions, mouth shapes (closed, open, wide, O) and an identity lock that never changes between shots.
4. Lip-sync: drive the mouth from VO word timing (open on word start, close at word end, wide on stressed vowels). Blink every 2–4s via seeded noise.
5. Kinetic captions from vo/captions.json in the caption band, spoken word in the accent color.
6. Real product screenshots only for UI moments.
Music at [100] BPM, ducked under VO. Contact sheet + critique before the full render.
```

## Mascot rig (route A, pure function of time)
- Build from primitives (circles, rounded rects, bezier limbs) so it re-skins with the style tokens.
- Idle: breathing scale `1 + 0.015*sin(t*2.2)`, eye blink from `noise1`, head tilt on stressed words.
- Gestures are springs between poses keyed to timing: `track(t, [[t0, poseA], [t1, poseB]])`.
- Squash & stretch on landings with the `playful` spring; nothing else uses overshoot.

## Gotchas
- Captions over the mascot's face — keep the mascot out of the caption band.
- VO pacing too fast for 9:16 reading — split lines, don't speed the voice above 1.1.
- Re-voicing costs credit: edit `script.json`, the TTS script only regenerates changed lines.

## Critique focus
Lip-sync drift (check `qa_strip` around a long word), caption readability at 360px, mascot identity consistent across shots, VO intelligible over music (mix ducks it — verify).
