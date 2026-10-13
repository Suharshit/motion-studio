# Showreel — show craft, not a product

**Use for:** studio/agency reels, "introduce yourself" pieces, capability demos, and as the first smoke test of a fresh setup.
**Engine:** route A · **Effort:** xhigh (max for a flagship) · **Length:** 10–60s · **Formats:** 16:9 first, 9:16 second.

## Why the one-liner works (and where it stops)
A "showreel for a résumé" is a genre with known rules: fast cuts, a new technique every shot, best work first. Making the *model* the subject means it demonstrates techniques instead of explaining something it can get wrong. A short duration fits one pass. "Go all out" stacks on top of high effort.
The weakness: hundreds of people used the same sentence, so the reels rhyme with each other. Use the one-liner to test the engine; for clients, give it a point of view (persona, story, one accent) — the variants below.

## Inputs to collect
- Who the reel is *for* (yourself, a studio persona, a client's in-house team)
- Duration + format · one accent color (or a vault style) · music: supplied file or "synthesize"
- Anything banned (their competitors' look, colors they hate)

## Prompt — smoke test (one line)
```
Make a dynamic [15]-second motion graphics video that shows what an incredible motion designer you are,
like it's your showreel for a résumé. Go all out. Follow CLAUDE.md.
```

## Prompt — client-grade (persona + guardrails)
```
Make a [30]-second showreel as if you were [a niche branding studio for startup founders].
Every graphic is made from scratch in code. One accent color: [#hex or vault style <id>].
Every shot is a different technique (kinetic type, UI build, line-draw, 3D-ish parallax, data, morph, mask wipe, typographic grid…).
Best shot first. Something new every 2–4 seconds. Last frame sets up the first.
S-tier sound: original score synthesized in code at [120] BPM (`npm run music`), cuts and hits on the beat grid. No generic synth pads.
Avoid frames and text in the corners and centered-title-on-gradient shots — the usual giveaways of AI video.
Before the full render: shot list on the beat grid, then stills + contact sheet + critique until every score ≥ 8.
```

## Variants that work
- **Long reel with a score:** 60s 16:9, an original piano score composed in code (`npm run music -- <slug> --mood piano`), every cut synced to it.
- **Self-intro, anti-slop:** 10s "who you are" piece; explicitly ban corner text and frame borders.
- **Story, not techniques:** keep the showreel energy but tell a story (route to `story-history` if the story is the point).
- **Agency persona:** pick a niche (fintech, climate, gaming) — the persona drives palette, type and pacing.

## Shot grammar (pick 6–8 for 15s)
kinetic headline with mask-up words · grid of tiles on a spring stagger · UI assembling itself · line-draw logo/diagram · number counter slam · split-screen type collision · camera push through layers · morphing shape · typographic poster frame · end lockup that loops.

## Critique focus
Variety (no technique twice), hook in 2s, nothing centered-on-gradient, the loop seam.

## Vault
Reels are where new house styles are born. If the persona produced a distinct look, vault it with `bestFor: ["showreel", ...]`.
