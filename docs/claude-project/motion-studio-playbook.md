# Motion Studio — playbook & reference

Knowledge base for the Motion Studio Planner. Mirrors the repo at github.com/Suharshit/motion-studio. The repo runs inside **Claude Code**; the planner (this project) only plans.

---

## 1. How the studio works (one paragraph)
Claude Code writes each video as a program — `projects/<slug>/index.html` with `window.seek(t)` painting the exact frame for time t. Playwright calls it for every frame, ffmpeg encodes the MP4. Because nothing depends on a timer, renders are identical every run and a fix is a one-line edit + re-render. Motion uses closed-form springs; timing comes from a beat grid (`beats.json`) and from voice timing (`vo/timing.json`). Claude renders stills, **looks at them**, scores them and fixes the worst problems until every score is ≥ 8. Voice and word-timed captions come from **Fish Audio**. Every new look is saved to the **style vault** for future projects.

## 2. One-time setup (on the user's machine)
```bash
git clone https://github.com/Suharshit/motion-studio.git && cd motion-studio
npm install
npx playwright install chromium        # or set MOTION_BROWSER in .env to any Chrome binary
pip install -r requirements.txt        # numpy, librosa, soundfile — only to measure supplied tracks
cp .env.example .env                   # FISH_API_KEY=…  (optional FISH_VOICE_ID, FISH_TTS_MODEL)
npm run doctor                         # checks node 22+, ffmpeg filters, chromium, librosa, Fish key
claude --model claude-opus-5-5         # start Claude Code in the repo; set effort per job
```
Effort: **medium** = fixes/re-renders · **xhigh** = new films · **max** = launch-critical first 3 seconds, long-form, music videos, narrative shorts.

## 3. Slash commands in Claude Code
| Command | What it does | When |
|---|---|---|
| `/new-video <full brief>` | Routes, asks missing inputs once, scaffolds, plans, builds, first contact sheet + scores | Start of every project |
| `/motion-reel <url\|showreel> [20s] [vertical] [ref path] [voice]` | Fast one-line product/showreel flow | Quick product reels |
| `/voiceover <slug> [tone]` | Fish voice search + audition → voiced script → captions | Add/redo narration |
| `/critique <slug> [format] [t]` | One harsh critique round, fixes 3 worst problems | Until all scores ≥ 8 |
| `/save-style <slug>` | Uniqueness check + save to vault | Usually run by /deliver |
| `/deliver <slug>` | Final renders (all formats, motion blur), SFX, mix −14 LUFS, QA, poster, vault decision, delivery folder | End |

Skills that load automatically: `motion-studio`, `critique-loop`, `fish-voiceover`, `style-vault`.

## 4. The pipeline (every project)
1. **Route** — `npm run route -- "<brief>"` → type, playbook, engine, effort, passes, matching vault styles.
2. **Intake** — answers go in `projects/<slug>/brief.md` (missing answers become written assumptions).
3. **Scaffold** — `npm run new -- <slug> --type <type> --style <vault-id> --client "Name" --duration N`.
4. **Inputs** — assets (`capture`), reference (`ref`), beat grid (`music` or `beats`), voice (`voices`, `vo`, `captions`).
5. **Plan gate** — `docs/style_guide.md` + `docs/shotlist.md` (+ mascot bible / state list). Shown for approval when > 20s or a new style.
6. **Build** — `index.html` scenes. Live preview: `npm run preview -- <slug>`.
7. **Critique gate** — contact sheet + phone sheet → scores 1–10 on hook, readability at phone size, motion, variety, composition, brand accuracy, sound sync → fix 3 worst → repeat until all ≥ 8 (≥ 3 rounds for client work). Logged in `docs/review_log.md`.
8. **Finish** — render all formats with motion blur, synthesize SFX, mix, QA (loudness, loop seam, determinism), poster.
9. **Vault + deliver** — similarity check → save/update/skip → `signature.md` → delivery folder. Delivery is blocked until the vault decision is made.

## 5. Router — which video type
| The client wants to… | Type | Typical length · formats | Suggested vault style |
|---|---|---|---|
| show craft, not a product (agency/studio reel, "introduce yourself") | `showreel` | 10–60s · 16:9, 9:16 | ink-and-signal, neon-night-pop |
| sell a real product with a URL (launch, promo, ad, feature drop) | `product-launch` | 15–45s · 9:16 → 1:1 → 16:9 | ink-and-signal, warm-paper-ui |
| a voiced character/narrator explains something | `mascot-explainer` | 30–90s · 9:16, 16:9 | warm-paper-ui, soft-watercolor |
| one UI element morphing through states, looping | `ui-morph-loop` | 12–24s · 1:1, 9:16, 16:9 | warm-paper-ui |
| a story told inside an interface (editor, chat, OS) | `ui-film-set` | 20–60s · 16:9, 9:16 | warm-paper-ui |
| notes / pitch / announcement / quote as moving type | `kinetic-pitch` | 15–60s · 9:16, 1:1 | swiss-grid-mono, ink-and-signal |
| numbers are the hero (metrics, results, reports) | `data-story` | 15–60s · 16:9, 9:16 | swiss-grid-mono |
| 3–8s logo reveal, intro/outro, end card | `logo-sting` | 3–8s · 16:9, 9:16, 1:1 | ink-and-signal, neon-night-pop |
| something over time (history, origin, timeline, biography) | `story-history` | 45s–3min · 16:9, 9:16 | swiss-grid-mono, soft-watercolor |
| picture cut to a supplied track | `music-video` | 30s–4min · 16:9, 9:16 | neon-night-pop |
| an animated short with an original character and a plot | `narrative-short` | 30s–3min · 16:9, 9:16 | soft-watercolor |

**Tie-breakers:** URL + narrator → `mascot-explainer` · URL + "UI states/morph/loop" → `ui-morph-loop` · a company's history → `story-history` (+ asset capture) · "make something cool", no subject → `showreel`, then ask what it's for.

**Modifiers (stack on any type):** reference video/frame/"in the style of" → reference extraction · narration/voice → Fish voiceover pass · several aspect ratios → multi-format · > 60s or "work overnight" → director's brief + subagents · supplied track → measure beats · "Remotion/series/batch" → Remotion engine · "HyperFrames/GSAP" → HyperFrames engine · sketch/pen/whiteboard → hand-drawn.

## 6. Per-type cheat sheet

### showreel
Inputs: who it's for, duration/format, one accent or vault style, music file or synthesize, banned looks.
Key prompt idea: a persona ("a niche branding studio for startup founders"), one accent, every shot a different technique, best shot first, original synthesized score synced to cuts.
Watch: reels look alike unless given a point of view; no technique twice; loop seam.

### product-launch
Inputs: product + URL (public pages), problem in ≤ 5 words, 3 features, one proof metric, CTA, brand colors/fonts, formats, music.
Story: hook (≤ 5 huge words) → UI assembles → 3 features each as a cursor action → proof number → logo + CTA.
Commands: `npm run capture -- <slug> <url>` before animating. One Claude Code session per brand (second video is faster).
Watch: screenshots illegible at 9:16 (crop to one region and zoom), brand color seeded from beat 1, CTA readable ≥ 1.5s.

### mascot-explainer
Inputs: brand/product (+ URL if any), audience, single takeaway, mascot (client art or an ORIGINAL design), voice tone + language, captions on/off, formats, music.
Flow: script first (~2.4 words/sec, hook ≤ 8 words) → `npm run voices` + audition → `npm run music` (if lines start on bars/beats) → `npm run vo` → `npm run captions` → mascot bible (proportions, palette, 6 expressions, 4 mouth shapes, identity lock) → shot per VO line, visual change on the stressed word → lip-sync from word timing → kinetic captions in the caption band.
Watch: lip-sync drift, captions over the mascot's face, mascot identity drifting between shots, VO pace too fast for vertical reading (split lines, never speed voice > 1.1).

### ui-morph-loop
Inputs: product + URL, 8–12 UI states with real data, brand colors/fonts/one accent, ~120 BPM track or synthesize, formats.
Spec: one container never cuts; each state changes size/radius/fill; content swaps behind a short blur; cursor drives every change; last frame = first frame. State list on the beat grid before code.
Watch: content popping mid-morph, each state readable ≥ 0.75s, loop SSIM ≥ 0.98.

### ui-film-set
Inputs: story in one line, the interface (designed from scratch, unless it's the client's own product), the actor (cursor/original avatar), plot beats.
Watch: plot readable without sound, payoffs on beats, no element in an impossible state.

### kinetic-pitch
Inputs: source text, the one sentence to remember, voiced or silent, style, formats.
Rules: ≤ 7 words per card, key sentence holds 2 beats, composition changes every card, varied reveals (never everything fading).
Watch: readable at 360px in one glance, no orphan words.

### data-story
Inputs: the data + its source, 3–5 numbers that matter, the one sentence they prove, units/locale.
Rules: every number traced to a source row; bars start at zero; counters never overshoot.

### logo-sting
Inputs: client logo as SVG (real mark, never redrawn), personality in 3 words, where it plays, sound.
Flow: 3 one-line concepts → pick → build; hero hold ≥ 1.5s; sting hit lands on the completion frame.

### story-history
Inputs: topic, start/end, feeling at the end, narrated or not, sourced facts and dates.
Rules: real people stylized only, no invented quotes, no copyrighted characters/stills; > 60s → `docs/ANIMATION_GUIDE.md` + chapters (optionally subagents).

### music-video
Inputs: `audio/track.wav` the client owns/licensed, logline, references, deliverables.
Rules: lyrics on screen only if the client supplies them as rights-holder; references for grammar only; director's brief; gates stills → animatic → full → polish → render; multi-session, max effort.

### narrative-short
Inputs: logline, ending feeling, original characters (or client art), medium (watercolor, ink, paper, pixel…), dialogue?
Flow: style guide (medium as rules) + character bible + beat sheet → seeded painter library → stills → animatic → full → sound. Expect many iterations.

## 7. Command reference (`npm run …`)
| Command | Purpose |
|---|---|
| `doctor` | Environment check |
| `route -- "<brief>"` | Type, playbook, engine, effort, passes, matching styles |
| `new -- <slug> --type T [--style id] [--client "N"] [--duration N] [--format 9x16]` | Scaffold `projects/<slug>/` |
| `capture -- <slug> <url> [--pages /a,/b] [--mobile]` | Real screenshots, logo candidates, colors, fonts → `assets/capture/` |
| `ref -- <slug> <video> [--every 0.5]` | Reference frames, contact sheet, shot lengths → `refs/` |
| `music -- <slug> [--mood drive\|bright\|cinematic\|lofi\|minimal\|piano] [--bpm] [--bars] [--key] [--seed]` | Original score + `beats.json` |
| `beats -- projects/<slug>/audio/track.wav` | Measure a supplied track → `beats.json` |
| `voices -- --search "tone" [--language en]` · `voices -- --sample <id>` | Find/audition Fish voices |
| `vo -- <slug> [--only ids] [--force]` | Voice `vo/script.json` → mp3s + `vo/timing.json` |
| `captions -- <slug> [--words 3] [--estimate]` | Word timing → `vo/captions.json` + `captions.srt` |
| `preview -- <slug> [--format 1x1]` | Live scrubbable preview at http://127.0.0.1:4321 |
| `stills -- <slug> [--format F] [--at t1,t2] [--every s --from a --to b] [--poster t]` | Contact sheet, phone sheet, posters |
| `render -- <slug> [--format all] [--sub 4] [--scale 0.5] [--from a --to b] [--jpeg]` | Video (silent) |
| `sfx -- <slug>` | SFX from `cues.json` |
| `mix -- <slug>` | VO + ducked music + SFX, −14 LUFS / −1 dBTP → `final_<fmt>.mp4` |
| `qa -- <slug> [--format F] [--strip t] [--determinism]` | QA sheets, loop check, loudness, determinism |
| `vault -- list \| show id \| suggest type "kw" \| similar slug \| apply id slug \| save slug --id … \| save slug --update id \| skip slug --reason …` | Style vault |
| `deliver -- <slug>` | `out/<slug>/delivery/` with all formats, posters, captions, HANDOFF.md |

## 8. Fish Audio voice
- Key in `.env` as `FISH_API_KEY` (never in chat or code). Default voice `FISH_VOICE_ID`.
- Models: `s2.1-pro` (default), `s2.1-pro-free` (free dev tier), `drama-3-preview` (directed reads with inline cues like `[whispering]`). Two speakers: S2 models, `"voice": ["idA","idB"]`, text with `<|speaker:0|>…<|speaker:1|>…`.
- `vo/script.json` line `start`: seconds · `"beat:N"` · `"bar:N"` (needs `beats.json` first) · `null` (after previous line + gap).
- Brand names mispronounced → `"pronunciations": {"Name": "CMU phonemes"}`.
- Only changed lines regenerate (saves credit). Captions use Fish speech-to-text word timestamps.
- Errors: 401 bad key · 402 out of credit (switch to `s2.1-pro-free`) · 429/5xx auto-retried.

Script writing: ~2.4 words/sec (45s ≈ 95–105 words of VO), hook ≤ 8 words, one idea per line, end with a CTA line.

## 9. Style vault
- Seeds: **ink-and-signal** (dark, orange signal, grotesk — launches, reels), **warm-paper-ui** (warm neutral, cobalt, UI motion — morphs, explainers), **swiss-grid-mono** (off-white, black caps, red — data, kinetic, history), **neon-night-pop** (night, mesh gradient, lime — reels, music, stings), **soft-watercolor** (paper, pigment, serif — shorts, mascots, story).
- Start: `vault -- suggest <type> "keywords"`, then `new … --style <id>`. Client brand colors/fonts override the vault palette; motion + texture come from the vault style.
- End: `vault -- similar <slug>` → < 0.80 = unique → `save` (+ fill `signature.md` with signature moves and their code) · ≥ 0.80 = near-duplicate → `--update <id>` or `skip --reason`.
- Lessons append to `style-vault/LEARNINGS.md`. The vault keeps the look, never client-confidential content.

## 10. Project folder
```
projects/<slug>/
  brief.md  project.json  style.json  index.html  beats.json  cues.json
  docs/ style_guide.md  shotlist.md  review_log.md  (ANIMATION_GUIDE.md, character_bible.md)
  vo/ script.json  timing.json  captions.json  *.mp3
  assets/ (capture/, fonts/, logo…)   audio/ track.wav | music.wav  sfx.wav   refs/
out/<slug>/  contact_*.png  phone_*.png  silent_*.mp4  final_*.mp4  qa_*  poster_*.png  captions.srt  delivery/
```

## 11. House rules (non-negotiable)
- Pure function of time; seeded randomness; springs not easing; write against the layout (one timeline → every format).
- Banned looks: centered title on gradient, everything fading in, corner labels/frame borders, glow on UI chrome, generic particle bursts. One display face, one UI face, one accent. Something new every 2–4s; hook in 2s; last frame sets up the first.
- Rights: real product UI only · original or client-owned characters only · client-owned or synthesized music · references for grammar only · real people stylized, no invented quotes · numbers sourced · keys only in `.env`.

## 12. Troubleshooting
| Symptom | Fix |
|---|---|
| `npm run doctor` says chromium missing | `npx playwright install chromium`, or set `MOTION_BROWSER=/path/to/chrome` in `.env` |
| "Google Fonts unreachable" warning | Fonts fell back. Put `.woff2` files in `projects/<slug>/assets/fonts/` and add `"src"` to the face in `style.json` |
| `FISH_API_KEY missing` / 401 | Copy `.env.example` → `.env`, paste key, rerun `npm run doctor` |
| 402 from Fish | Out of credit → top up or `FISH_TTS_MODEL=s2.1-pro-free` |
| `"bar:N" needs beats.json` | Run `npm run music -- <slug>` (or `beats`) before `npm run vo` |
| Lines overlap warning after `vo` | A fixed `start` is earlier than the previous line's end — move it later or shorten the line |
| `mix` says no silent video | Run `npm run render -- <slug>` first (finals: no `--scale`) |
| `deliver` blocked "No vault decision" | `npm run vault -- similar <slug>` then `save` or `skip --reason` |
| `deliver` warns no round ≥ 8 | Run more `/critique <slug>` rounds; log scores as `name: N/10` |
| Determinism FAIL | Something uses `Math.random`, `Date.now`, timers or carried state — replace with `rng`/`hash01`, compute from t |
| Loop seam SSIM < 0.98 (looping pieces) | Make the last keys of every `track()` equal the first; cursor at rest at both ends |
| Text blurry | Text is being scaled as a bitmap — draw at final size, scale the container |
