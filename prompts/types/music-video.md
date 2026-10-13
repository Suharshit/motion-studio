# Music video / visualizer — picture cut to a track

**Use for:** music videos, lyric-free visualizers, beat-synced brand films, event openers.
**Engine:** route A · **Effort:** max, multi-session (this is the "talk for 5 minutes, let it work for hours" format) · **Length:** 30s–4min.

## Guardrails
- The track must be **supplied by the client** and theirs to use (they own it or licensed it). Note the license in `brief.md`.
- On-screen lyrics only if the client supplies them *as the rights-holder* in `brief.md`; never transcribe a song's lyrics yourself.
- Reference videos give **grammar** (pacing, transitions, palette), never content, characters or logos.

## Inputs to collect
- `audio/track.wav` (rights confirmed) · the song's idea in one line · references (frames/video/image library)
- Character(s) if any: the client's own or original designs · deliverables (16:9, 9:16 cutdown, loop)

## Workflow (use the director's brief — `passes/director-brief.md`)
1. `npm run beats -- projects/<slug>/audio/track.wav` → `beats.json` (bpm, beats, downbeats, hits, sections).
2. Map song sections to acts. Big moments on downbeats; state changes on beats; micro-accents on hits.
3. Style guide + shot list with timestamps from `beats.json` → show and wait (or continue after 10 minutes if unattended).
4. Stills per shot → animatic at `--scale 0.5 --sub 1` → full pass → polish → render. Don't skip gates.
5. Parallelize by section with subagents once `docs/ANIMATION_GUIDE.md` exists so they code in one style.

## Prompt (short form — expand with the director's brief template)
```
You are the director, animator and render engineer for a [DURATION] music video made in code. Multi-session production — don't rush to a final render.
The film in one line: [LOGLINE]. Track: ./audio/track.wav (client-owned; use unchanged). Measure it with npm run beats first.
References: ./refs/ — take the grammar, never the content.
Look: [3–5 lines]. Banned: centered title on gradient, everything fading in, generic particle bursts.
Every downbeat is a visual event; every section change is a new world. Hook in the first 2 seconds. The last frame sets up the first.
Follow the gates in prompts/passes/director-brief.md and log every critique round in docs/review_log.md.
```

## Audio-reactive (optional)
For visualizers, precompute an energy envelope once (`python3 -c` with librosa RMS → `energy.json`, ~100 values/sec) and read it by index in `seek(t)` — still a pure function of t.

## Critique focus
Sync (cuts within ±1 frame of beats), section contrast, readability of any on-screen text, the loop/poster frame.
