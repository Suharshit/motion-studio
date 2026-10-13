---
name: motion-studio
description: Make a client-ready motion graphics video rendered from code — launch films, showreels, product reels, UI morph loops, narrated/mascot explainers, kinetic-type pitches, data stories, logo stings, history films, music videos, animated shorts. Use whenever the user asks for any video, animation, reel, ad, explainer or motion piece in this repo.
---

# Motion studio pipeline

Read `CLAUDE.md` (house rules) first. Then:

## 1. Route
```
npm run route -- "<the user's brief, verbatim>"
```
Open `prompts/ROUTER.md` and the playbook it points to in `prompts/types/`. Note the modifiers (reference, voice, multi-format, engine) and the passes chain. Skim `style-vault/LEARNINGS.md`.

## 2. Inputs to collect first
Use the playbook's "Inputs to collect" list + `prompts/passes/client-intake.md`. Ask once, in one message (AskUserQuestion when available). If unanswered, write assumptions at the top of `brief.md` and continue.

## 3. Scaffold
```
npm run new -- <slug> --type <type> --style <vault-id> --client "<Client>" --duration <s>
```

## 4. Run the playbook's passes, in order
| pass | file | commands |
|---|---|---|
| asset-capture | prompts/passes/asset-capture.md | `npm run capture -- <slug> <url>` |
| reference-extraction | prompts/passes/reference-extraction.md | `npm run ref -- <slug> <video>` |
| voiceover-pass | prompts/passes/voiceover-pass.md | `npm run voices`, `npm run vo`, `npm run captions` |
| shotlist-on-beat | prompts/passes/shotlist-on-beat.md | `npm run music` or `npm run beats` |
| state-list-spec | prompts/passes/state-list-spec.md | — |
| director-brief | prompts/passes/director-brief.md | long / unattended pieces |
| sound-pass | prompts/passes/sound-pass.md | `npm run sfx`, `npm run mix` |
| springs-refactor | prompts/passes/springs-refactor.md | — |
| multi-format | prompts/passes/multi-format.md | `npm run render -- <slug> --format all` |

Gate: show `docs/style_guide.md` + `docs/shotlist.md` before code for anything > 20s or a new style. Wait for OK unless the user said to proceed.

## 5. Build
Edit `projects/<slug>/index.html` (route A — `prompts/engines/route-a-seek.md`). Libraries: `engine/lib/motion.js`, `draw.js`, `layout.js`. Preview with `npm run preview -- <slug>`.

## 6. Critique loop — the critique-loop skill
Stills → contact sheet → read the images → score → fix 3 worst → repeat until all ≥ 8. Log rounds in `docs/review_log.md`. Send the user the contact sheet + scores with the first draft.

## 7. Finish
```
npm run render -- <slug> --format all --sub 4
npm run sfx -- <slug>          # if cues.json has cues
npm run mix -- <slug>
npm run qa -- <slug> --format 9x16 --determinism
npm run stills -- <slug> --poster <best t> --format 9x16
```
Then the **style-vault** skill (mandatory), then `npm run deliver -- <slug>`.

## Hard rules
- Real product UI only. Original or client-owned characters only. Client-owned or synthesized music only.
- No Math.random, timers or CSS transitions in scenes. Springs, not easing curves.
- Banned: corner labels, frame borders, centered title on gradient, everything fading in.
- Voice = Fish Audio. Keys stay in `.env`.
