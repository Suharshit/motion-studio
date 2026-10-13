# UI morph loop — one shape, never cut

**Use for:** product-film UI motion, micro-interaction reels, "our product in 15 seconds", landing-page hero loops.
**Engine:** route A · **Effort:** xhigh · **Length:** 12–24s (8 bars at 120 BPM = 16s) · **Formats:** 1:1, 9:16, 16:9.

The concept: a single container never cuts. Every state is the *same element* changing size, corner radius and fill while its content swaps behind a short blur. A cursor drives each change with a real click or keystroke. The last frame equals the first, so it loops forever.
This is a **spec**, not a vibe: write the state list first (see `passes/state-list-spec.md`).

## Inputs to collect
- Product + URL · 8–12 UI states that tell its story · the *real* data shown in each state (names, numbers, labels)
- Brand colors + fonts + one accent · a track near 120 BPM or "synthesize" · formats

## Prompt (structured spec)
```
<inputs>
Ask me for: product + URL, 8–12 UI states that tell its story, the real data in each state,
brand colors + fonts + one accent, a track near 120 BPM (or synthesize one), formats.
</inputs>

<direction>
Product-film UI motion. One container never cuts: every state is the same element changing size,
radius and fill while its content swaps behind a short blur. A cursor drives every change.
[Warm neutral | deep ink | paper white] canvas, one accent. Springs with at most a tiny overshoot.
Banned: bouncy easing, glows, gradients on UI chrome, particle bursts, dead time.
</direction>

<structure>
[120] BPM, [8] bars, something happens on every beat. Example chain:
logo → CTA button → email field (typed) → loader → success check → dashboard card
→ chart draws itself → tooltip on hover → command palette → toast → logo.
</structure>

<build>
1. projects/<slug>/index.html with studio({...}) — one canvas, window.seek(t). No CSS transitions, timers or carried state.
2. Container width/height/radius/fill = track() over the state keys — one spring per change, never restarted.
3. Content inside a morphing container enters after the morph starts and leaves before the next (swapAlpha).
4. Tab/selection indicators: leading and trailing edges on different springs so they stretch (indicator()).
5. Beat grid from the track (npm run beats) or the synth (npm run music). Start on a downbeat. UI sounds on measured hits.
6. Render at 60 fps with --sub 4 (motion blur).
</build>

<gotchas>
No will-change / scaled DOM text — draw text on canvas at final size, scale the container not the text.
The last frame must equal the first: container size, content, cursor position AND cursor velocity.
</gotchas>

<start>
Ask for the inputs, then show me the state list on the beat grid before writing code.
</start>
```

## State-list table (write this in docs/shotlist.md)
| Beat | t (s) | State | W × H | Radius | Fill | Content | Cursor action | SFX |
|---|---|---|---|---|---|---|---|---|

## Gotchas
- Content popping during a morph = the most common failure. Check `qa_strip` at every state change.
- Typed text: one character per 1/22 s, cursor caret blinks on a time-based square wave (deterministic).
- Run `npm run qa -- <slug> --determinism` and check the loop SSIM ≥ 0.98.

## Critique focus
Continuity (nothing cuts), readability of each state for ≥ 0.75s, beat sync, loop seam.
