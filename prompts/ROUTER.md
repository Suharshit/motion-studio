# Prompt router — which playbook for which video

Read this before writing a single line of animation code. Run `npm run route -- "<brief>"` for a fast first pass, then confirm here.

## Step 1 — What is the video *about*?

| The client wants to… | Type | Playbook |
|---|---|---|
| show craft, not a product ("show what you can do", agency/studio reel, test the setup) | `showreel` | [types/showreel.md](types/showreel.md) |
| sell a real product that has a URL (launch, promo, ad, feature drop) | `product-launch` | [types/product-launch.md](types/product-launch.md) |
| have a voiced character or narrator explain something | `mascot-explainer` | [types/mascot-explainer.md](types/mascot-explainer.md) |
| show a product's UI as one shape morphing through states, looping | `ui-morph-loop` | [types/ui-morph-loop.md](types/ui-morph-loop.md) |
| tell a story *inside* an interface (editor, chat, OS, dashboard) | `ui-film-set` | [types/ui-film-set.md](types/ui-film-set.md) |
| turn notes / a pitch / an announcement / a quote into type-led video | `kinetic-pitch` | [types/kinetic-pitch.md](types/kinetic-pitch.md) |
| make numbers the hero (metrics, results, report, charts) | `data-story` | [types/data-story.md](types/data-story.md) |
| a 3–8s logo reveal, intro/outro, end card | `logo-sting` | [types/logo-sting.md](types/logo-sting.md) |
| tell something over time (history, origin, timeline, biography) | `story-history` | [types/story-history.md](types/story-history.md) |
| cut picture to a supplied track | `music-video` | [types/music-video.md](types/music-video.md) |
| an animated short with an original character and a plot | `narrative-short` | [types/narrative-short.md](types/narrative-short.md) |

Tie-breakers:
- Has a product URL **and** a narrator → `mascot-explainer` (it already includes asset capture).
- Has a product URL **and** asks for "UI states", "morph" or "loop" → `ui-morph-loop`.
- A history *of a company* with its product → `story-history`, borrow the asset-capture pass.
- Just "make something cool" with no subject → `showreel`, then ask what it should be *for* before the second one.

## Step 2 — Add modifiers (any type)

| Signal in the brief | Add | File |
|---|---|---|
| a reference video, frame, folder, "in the style of", "like this" | reference match | [passes/reference-extraction.md](passes/reference-extraction.md) |
| narration, voiceover, "talking", a mascot that speaks | Fish Audio voice + captions | [passes/voiceover-pass.md](passes/voiceover-pass.md) |
| a URL, "real screenshots", "our logo" | asset capture | [passes/asset-capture.md](passes/asset-capture.md) |
| several aspect ratios, "Reels/TikTok/Shorts/LinkedIn" | multi-format | [passes/multi-format.md](passes/multi-format.md) |
| > 60s, multiple chapters, "work overnight", long brief | director's brief + subagents | [passes/director-brief.md](passes/director-brief.md) |
| a supplied track | beat grid from the track (`npm run beats`) | [passes/sound-pass.md](passes/sound-pass.md) |

## Step 3 — Pick the engine

| Engine | Use when | File |
|---|---|---|
| **Route A — seek(t)** (default) | almost always: one-offs, launches, reels, shorts | [engines/route-a-seek.md](engines/route-a-seek.md) |
| Route B — Remotion | a series/template, data-driven or personalised batches, React-native client | [engines/route-b-remotion.md](engines/route-b-remotion.md) |
| Route B — HyperFrames | client thinks in web pages / wants GSAP, HTML-first edits | [engines/route-b-hyperframes.md](engines/route-b-hyperframes.md) |
| Hand-drawn rig | sketch / pen / whiteboard / paper looks | [engines/hand-drawn.md](engines/hand-drawn.md) |

Say the engine choice explicitly in the shot list. Opus defaults to route A when not told otherwise.

## Step 4 — Pick the style

1. `npm run vault -- suggest <type> "<brief keywords>"` — reuse or remix a vault style if one fits.
2. If the client supplied brand colors/fonts, those win; the vault style supplies motion + texture.
3. If nothing fits, design a new one (the project will likely end up in the vault — see delivery).

## Step 5 — Effort

| Work | Effort |
|---|---|
| tweak, re-time, fix 3 problems, re-render | medium |
| new film, new style | xhigh |
| flagship launch, the first 3 seconds carry everything, long-form | max |

## Always, every type

House rules in `CLAUDE.md` → shot list on the beat grid → stills + contact sheet → [critique-pass](passes/critique-pass.md) until every score ≥ 8 → full render → mix → QA → [delivery-and-vault](passes/delivery-and-vault.md).
