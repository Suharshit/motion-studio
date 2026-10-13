# Voiceover pass — Fish Audio voice + word-level captions

Key: `FISH_API_KEY` in `.env` (never paste a real key into a prompt or a screenshot). Default voice: `FISH_VOICE_ID`.

1. **Find a voice:** `npm run voices -- --search "warm narrator" --language en` → audition `npm run voices -- --sample <id>`. Record the choice in `brief.md`.
2. **Script:** `projects/<slug>/vo/script.json`
```json
{
  "voice": "<id>", "model": "s2.1-pro", "speed": 1.0, "gap": 0.25, "leadIn": 0.4,
  "pronunciations": {"Acme": "AE1 K M IY0"},
  "lines": [
    {"id": "hook", "text": "Your videos are lying to you.", "start": "bar:0"},
    {"id": "how1", "text": "Drop in a link.", "start": null},
    {"id": "cta",  "text": "Try it free at acme dot com.", "start": "bar:7"}
  ]
}
```
   - ~2.4 words/sec; one idea per line; lines are the unit of re-voicing.
   - `start`: seconds, `"beat:N"`, `"bar:N"`, or `null` (after the previous line + gap).
   - Models: `s2.1-pro` (default), `s2.1-pro-free` (free dev tier), `drama-3-preview` (directed reads with `[whispering]`, `[excited]` cues). Two speakers: S2 models accept `<|speaker:0|>…<|speaker:1|>…` with `"voice": ["idA","idB"]`.
3. `npm run vo -- <slug>` → `vo/<id>.mp3` + `vo/timing.json` (start/end/duration per line). Only changed lines regenerate.
4. `npm run captions -- <slug>` → Fish speech-to-text word timestamps → `vo/captions.json` + `out/<slug>/captions.srt`. (`--estimate` works offline.)
5. In the scene code: `ctx.vo.lines` for shot timing, `captions(g, t, ctx.captions, {...})` from `engine/lib/draw.js` for kinetic captions, word start times for lip-sync / emphasis.
6. `npm run mix` places every line and ducks the music under it.

Picture follows voice: change the script → re-run vo + captions → the timeline re-times itself because scenes read `ctx.vo`.
