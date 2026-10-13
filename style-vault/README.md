# Style vault — the studio's memory

Every unique project leaves its look behind here, so the next client gets a head start and the studio develops a recognisable range.

```
style-vault/
  INDEX.md            auto-generated table of every style (npm run vault -- index)
  LEARNINGS.md        one-line lessons from every project, read before starting a new one
  schema.json         the style.json contract (same file the engine reads)
  styles/<id>/
    style.json        tokens: colors, typography, motion, layout, texture, audio, dos/donts, history
    signature.md      the 3–5 signature moves + code snippets + what the critique loop taught us
    guide.md          the project's docs/style_guide.md at the time it was vaulted
    poster.png        best frame
    contact.png       contact sheet (the look at a glance)
    style.v1.json …   previous versions when a later project refined the style
```

## Lifecycle
1. **Start:** `npm run route -- "<brief>"` shows matching styles · `npm run new -- <slug> --type <t> --style <id>` copies one into the project.
2. **During:** the project edits its own `style.json` freely (client brand colors win; motion/texture from the seed).
3. **Finish:** `npm run vault -- similar <slug>`
   - **< 0.80 similar to everything → unique →** `npm run vault -- save <slug> --id … --name … --tags … --mood … --best-for …` and fill in `signature.md`.
   - **≥ 0.80 → near-duplicate →** `--update <id>` if the project improved that style, else `skip --reason`.
4. `npm run deliver` won't package a project until step 3 is recorded.

Similarity = palette (40%, role-matched + nearest-color) + display/body font + weight/case + motion pace + text reveal + transition + background + grain.

## Rules
- The vault stores the **look**, never client confidential content (unreleased screenshots, copy, data). Strip it from guide/signature.
- Styles are original or derived from a client's own brand with their OK; never named after or copied from another studio's or artist's signature work.
- Seeds (`source.project = "seed"`) are starting points; refine them with real projects.
