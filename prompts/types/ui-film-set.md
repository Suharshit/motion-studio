# UI as a film set — a story told inside an interface

**Use for:** "watch an AI edit a video inside an editor it built", a chat that tells a story, an OS desktop narrative, a dashboard that reveals a plot.
**Engine:** route A · **Effort:** xhigh · **Length:** 20–60s · **Formats:** 16:9 (most UIs), 9:16 for phone UIs.

A fake UI is a set where every element has a known state at every time. That makes it the easiest place to tell a story deterministically: the timeline scrubs, a waveform appears, a button is pressed, a window opens — and each of those is just a value of t.

## Inputs to collect
- The story in one line · which interface is the set (draw it from scratch — don't clone a real app's trademarked UI unless it's the client's own product)
- The "actor" (cursor, an original avatar, a typing hand) · beats of the plot · tone · sound

## Prompt
```
Make a [40]-second film that happens entirely inside a [cartoon video editor | chat app | desktop OS | analytics dashboard]
you design from scratch. Story: [LOGLINE].
The actor is [an original small avatar | the cursor | a typing caret].

Spec the set first in docs/shotlist.md:
- every UI element with its states (closed/open, empty/filled, idle/hover/pressed) and the time each changes
- the camera: which region is framed on each beat (pushes into panels, pulls out to the full window)
- the plot beats, one visible payoff every 3–5 seconds, a hook in the first 2

Build: one studio() canvas, every element's state is a function of t (track() for positions, swapAlpha for content swaps).
Sound: UI clicks, typing, whooshes on camera moves, a light score (npm run music).
Show me the set spec and stills before the full render.
```

## Camera on a UI
`camera = track2(t, [[0, [cx, cy]], [2.1, [panelX, panelY]], ...], 140, 24)`; `zoom = track(t, [[0, 1], [2.1, 1.8], ...], 120, 22)`. Apply `g.translate/scale` once per frame before drawing the UI; draw text at final size (no blurry scaled bitmaps — redraw, don't zoom screenshots).

## Critique focus
Is the plot readable without sound? Does each payoff land on a beat? Any element in an impossible state (e.g. a button pressed while its window is closed)?
