# Director's brief — for long pieces and unattended runs

Use for anything over ~60s, music videos, narrative shorts, or "work on this overnight". A good brief doesn't describe a video; it hires a crew. Write it to `projects/<slug>/brief.md`.

```
You are the director, animator, sound designer and render engineer for a [DURATION] film made in code.
Treat this as a multi-session production. Don't rush to a final render.

## The film in one line
[LOGLINE — and what the viewer should feel at the end. Every decision is checked against this.]

## References and inputs
- ./refs/ : [video / frames / image library]. Take the grammar, never the content.
- ./audio/track.wav : [client-owned; use unchanged; measure with npm run beats] — or "synthesize with npm run music".
- Engine: [route A seek(t) | Remotion | HyperFrames]. Skills: [remotion-best-practices | hyperframes | claude-animation].
- APIs in .env: FISH_API_KEY (voice, captions) [+ others]. Budget: [$X]. Be economical — VO regenerates only changed lines.

## Look
[3–5 lines: palette, type, texture, camera language. Banned looks. Or: "vault style <id>, remixed: …"]

## Character bible (if any)
[Proportions, palette sampled into hex, expressions, identity lock. Original or client-owned only.]

## Beat sheet
0:00–0:02  hook: [the single most striking image]
0:02–0:10  [act 1]
…          a new visual payoff every 3–5 seconds
[END]      the last frame sets up the first frame (loop)

## Text on screen
[When captions go huge vs sit like subtitles. Leave room in the composition for them.]

## Workflow, with gates
1. docs/style_guide.md + docs/shotlist.md (every shot: frames, camera, text, SFX). Show me the shot list,
   then continue without waiting if I don't answer in 10 minutes.
2. Stills for every shot → contact sheet → critique.
3. Animatic at --scale 0.5 --sub 1 with placeholder audio. Fix pacing before polish.
4. Full animation → polish pass → sound pass → final render.
5. For long films: write docs/ANIMATION_GUIDE.md first, then split chapters across subagents so they code in one style.
   After the first full pass, write docs/STORYBOARD.md from the actual frames.

## Critique loop (every shot, ≥ 3 rounds)
prompts/passes/critique-pass.md. Log scores + 3 biggest problems per round in docs/review_log.md. Until all ≥ 8.

## Deliverables
out/<slug>/final_<fmt>.mp4 · loop_check · poster · contact sheet · captions.srt · README in the project folder · vault decision.
```

Optional advanced move — **generate-then-trace:** when hand-coding a motion is hard (physics, a character dancing), a video model can render a rough base shot, and the code layer redraws it on top (trace positions → your own shapes), so the viewer only sees the code-drawn layer. Only with footage the client can use, and only as reference motion.
