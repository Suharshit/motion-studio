---
name: fish-voiceover
description: Voiceover, narration, dialogue and word-timed captions with the Fish Audio API (not ElevenLabs). Use when a motion project needs a narrator, a talking mascot, dialogue, voiced captions, a voice audition, or caption files (.srt).
---

# Fish Audio voiceover

The key is `FISH_API_KEY` in `.env` (default voice `FISH_VOICE_ID`, TTS model `FISH_TTS_MODEL`, STT model `FISH_STT_MODEL`). Never print or paste the key.

1. **Pick a voice:** `npm run voices -- --search "<tone>" [--language en]` → audition 2–3 with `npm run voices -- --sample <id>` → `out/voice-samples/<id>.mp3`. Offer the user the options; record the choice in `brief.md`.
2. **Script** `projects/<slug>/vo/script.json` (full format in `prompts/passes/voiceover-pass.md`):
   - ~2.4 words/sec, one idea per line, hook ≤ 8 words.
   - `start`: seconds | `"beat:N"` | `"bar:N"` | `null` (chain after previous + gap).
   - Brand names that get mispronounced → `pronunciations` (CMU Arpabet for English).
   - `drama-3-preview` model for directed reads: `[whispering]`, `[excited]` inline. Dialogue: S2 models with `"voice": ["idA","idB"]` and `<|speaker:0|>…<|speaker:1|>…` in the text.
3. `npm run vo -- <slug>` → mp3 per line + `vo/timing.json`. Unchanged lines are reused (no credit spent). `--only id1,id2` / `--force` to regenerate.
4. `npm run captions -- <slug>` → Fish speech-to-text word timestamps → `vo/captions.json` + `out/<slug>/captions.srt`. `--words 3` for punchier vertical captions. `--estimate` if offline.
5. In `index.html`: scene timing from `ctx.vo.lines`, kinetic captions with `captions(g, t, ctx.captions, {L, style})` (draw.js), lip-sync/emphasis from word start times.
6. `npm run mix -- <slug>` places each line and ducks the music under the voice.

Errors: 401 → bad key · 402 → out of credit (suggest `s2.1-pro-free` model) · 429/5xx → the client retries with backoff automatically.
