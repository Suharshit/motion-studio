# Route B — HyperFrames (HTML + GSAP)

Best when the client thinks in web pages, wants GSAP timelines, or will hand-edit HTML afterwards.

```
cd projects/<slug>
npx hyperframes init hf && cd hf
npx hyperframes skills update        # agent skills: /hyperframes router + GSAP skills
npx hyperframes preview
npx hyperframes render               # then copy/rename the MP4 to out/<slug>/silent_<fmt>.mp4
```
Prompt pattern: "Using /hyperframes, turn ./notes.md into a 45-second pitch video with kinetic captions."

Keep the studio's conventions: palette/type from `style.json`, VO from Fish Audio (`npm run vo`, `npm run captions`), mix + QA + vault from the repo root. GSAP timelines must be seekable (paused timeline, progress set from time) — no autoplay tweens in render.
