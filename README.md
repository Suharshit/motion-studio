# Motion Studio

A client-ready motion graphics studio for **Claude Code**. You describe a video; Claude routes it to the right playbook, writes it as a program that paints frames (`window.seek(t)`), renders it deterministically, scores and fixes its own frames, voices it with **Fish Audio**, masters the sound, packages the deliverables — and saves every new look to a **style vault** so the next project starts ahead.

Built on the workflow from Movez's *How to build a motion design studio with Opus 5.5*: the prompt is 10% of the video, the harness is the other 90%.

## Quick start

```bash
# 1. Runtime: Node 22+, ffmpeg, Python (only for measuring supplied tracks)
brew install node ffmpeg python            # macOS — or apt install on Linux
npm install
npx playwright install chromium
pip install -r requirements.txt

# 2. Keys
cp .env.example .env                       # paste FISH_API_KEY (and optionally FISH_VOICE_ID)
npm run doctor                             # checks ffmpeg filters, chromium, librosa, Fish key

# 3. Open Claude Code here on Opus 5.5 (xhigh effort for new films)
claude --model claude-opus-5-5
> /new-video 20s vertical launch film for https://yourproduct.com, warm narrator, captions
```

## Slash commands

| Command | Does |
|---|---|
| `/new-video <brief>` | Routes the brief, asks for missing inputs once, scaffolds, plans, first contact sheet + scores |
| `/motion-reel <url\|showreel> [20s] [vertical] [ref ./refs/x.png] [voice]` | The one-liner product/showreel flow |
| `/voiceover <slug> [tone]` | Fish Audio voice search + audition → voiced script → word-timed captions |
| `/critique <slug>` | One harsh critique round: stills → read → score → fix the 3 worst |
| `/save-style <slug>` | Uniqueness check and save to the style vault |
| `/deliver <slug>` | Final renders, mix, QA, vault decision, delivery folder |

Skills in `.claude/skills/` (`motion-studio`, `critique-loop`, `fish-voiceover`, `style-vault`) load automatically when a request matches.

## Every video type in the course → a playbook

`prompts/ROUTER.md` decides; `npm run route -- "<brief>"` gives a fast first pass (type, engine, effort, passes, matching vault styles).

| Type | Playbook |
|---|---|
| Showreel (the one-liner, persona and story variants) | `prompts/types/showreel.md` |
| Product launch from a URL with real assets | `prompts/types/product-launch.md` |
| Mascot / narrated explainer (Fish Audio + lip-sync + captions) | `prompts/types/mascot-explainer.md` |
| UI morph loop (one shape, state list, seamless) | `prompts/types/ui-morph-loop.md` |
| UI as a film set (story inside an interface) | `prompts/types/ui-film-set.md` |
| Kinetic-type pitch / announcement | `prompts/types/kinetic-pitch.md` |
| Data story | `prompts/types/data-story.md` |
| Logo sting / intro / outro | `prompts/types/logo-sting.md` |
| Story / history / timeline | `prompts/types/story-history.md` |
| Music video / visualizer (client-supplied track) | `prompts/types/music-video.md` |
| Narrative short (hand-painted, original characters) | `prompts/types/narrative-short.md` |

Reusable passes (`prompts/passes/`): client intake, director's brief, reference extraction, asset capture, state-list spec, shot list on the beat grid, springs refactor, sound pass, voiceover pass, critique pass, multi-format, delivery + vault.
Engines (`prompts/engines/`): route A seek(t) (default), Remotion, HyperFrames, hand-drawn.

## The engine (route A)

```
engine/lib/runtime.js   studio({...}) → window.seek(t), per-format sizing, loads style/beats/VO/captions/fonts/images, live scrub preview
engine/lib/motion.js    closed-form springs (snappy/default/heavy/playful), track() multi-target springs, indicator, swapAlpha, mulberry32, noise
engine/lib/draw.js      kinetic text, typewriter, counters, Fish-timed captions, cursor + ripple, covers, line-draw, backgrounds, grain, vignette
engine/lib/layout.js    write against a layout, not pixels → 9:16 / 1:1 / 4:5 / 16:9 from one timeline
engine/render.mjs       Playwright → ffmpeg, --sub N motion blur, --format all, --scale animatics, --from/--to windows
engine/stills.mjs       frames straight from seek(t): one per beat → contact sheet + 360px phone sheet, posters
engine/music.mjs        original, seeded score + beats.json (drive, bright, cinematic, lofi, minimal, piano)
engine/beats.py         measure a supplied track → bpm, beats, downbeats, hits, sections
engine/sfx.mjs          synthesized UI/transition/drum SFX from cues.json
engine/mix.mjs          VO placed by timing, music ducked under voice, -14 LUFS / -1 dBTP
engine/qa.mjs           contact, phone, strip, loop seam SSIM, loudness, determinism (render twice, compare hashes)
```

```bash
npm run new -- my-film --type product-launch --style ink-and-signal --duration 20
npm run music -- my-film --bpm 120 --bars 10 --mood drive
npm run preview -- my-film                    # live, scrubbable
npm run stills -- my-film                     # look before rendering
npm run render -- my-film --format all --sub 4
npm run sfx -- my-film && npm run mix -- my-film
npm run qa -- my-film --determinism
```

## Fish Audio

| Script | Does |
|---|---|
| `npm run voices -- --search "warm narrator"` / `--sample <id>` | Search the voice library, audition a voice |
| `npm run vo -- <slug>` | Voice every line in `vo/script.json` (`s2.1-pro` default; `drama-3-preview` for directed reads; multi-speaker on S2) → mp3s + `vo/timing.json`. Unchanged lines are reused, so edits don't burn credit |
| `npm run captions -- <slug>` | Fish speech-to-text word timestamps → `vo/captions.json` + `captions.srt` (`--estimate` offline) |

Line starts can be seconds, `"beat:N"`, `"bar:N"` or chained, so the voice lands on the music.

## Style vault

```
style-vault/INDEX.md          every saved look at a glance (auto-generated)
style-vault/LEARNINGS.md      one-line lessons from every project
style-vault/styles/<id>/      style.json · signature.md · guide.md · poster.png · contact.png · style.vN.json
```
Five original seed styles ship with it (Ink & Signal, Warm Paper UI, Swiss Grid Mono, Neon Night Pop, Soft Watercolor).

At the end of every project: `npm run vault -- similar <slug>` scores the project's look against the vault (palette, type, motion, texture). Below 0.80 it's unique → `npm run vault -- save` stores tokens, guide, poster and contact sheet, and Claude writes the signature moves with their code into `signature.md`. A near-duplicate refines the existing style (`--update`, old version kept) or is skipped with a reason. **`npm run deliver` refuses to package a project until that decision is recorded.**

## House rules

`CLAUDE.md` is read on every run: the render contract (pure function of t, seeded noise, springs), banned looks, sound rules, the critique loop, and hard rules on rights (real product UI only, original or client-owned characters, client-owned or synthesized music, references for grammar never content).

## Notes

- Fonts: Google Fonts load by family name; for offline-identical renders put font files in `projects/<slug>/assets/fonts/` and add `"src"` to the face in `style.json`.
- If Playwright can't download Chromium on your network, point `MOTION_BROWSER` in `.env` at any Chrome/Chromium binary.
- Route B: Remotion and HyperFrames set up inside a project folder; mix/QA/vault work the same once `out/<slug>/silent_<fmt>.mp4` exists.

### Further reading (from the course)
Remotion agent skills — remotion.dev/docs/ai/skills · HyperFrames — github.com/heygen-com/hyperframes · Claude animation skill — github.com/buildwithhanif/claude-animation-skill · ClaudeAnimationBase / PDoomVideo — github.com/JohnHeibel · awesome-ai-motion — github.com/guanmo-ai/awesome-ai-motion
