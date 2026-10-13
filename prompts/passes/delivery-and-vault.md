# Delivery and vault — finish like a studio, and remember the look

## Deliver
```
npm run render -- <slug> --format all --sub 4
npm run mix -- <slug>
npm run qa -- <slug> --format 9x16 --determinism      (and each other format)
npm run stills -- <slug> --poster <t>                  (the best frame)
npm run vault -- similar <slug>                        (is this style new?)
npm run vault -- save <slug> ...   OR   npm run vault -- skip <slug> --reason "..."
npm run deliver -- <slug>
```
`deliver` refuses to package until a vault decision is recorded in `project.json`. It writes `out/<slug>/delivery/` with every `final_<fmt>.mp4`, posters, captions.srt, the contact sheet and a `HANDOFF.md`.

Tell the client in 3–5 lines: what was made, the formats, what you'd improve next.

## Vault the style (the studio's memory)
A project is **unique** when `vault similar` reports no style ≥ 0.80 similar, *or* the client approved a look that clearly differs (new type pairing, new motion language, new texture). Then:
```
npm run vault -- save <slug> --id <kebab-name> --name "Readable Name" --tags "a,b,c" --mood "x,y" --best-for "product-launch,kinetic-pitch"
```
This copies `style.json`, the project's `docs/style_guide.md` → `guide.md`, the poster and contact sheet as thumbnails, and writes `signature.md` — which **you must fill in**: the 3–5 signature moves that made this look (with the code snippets from index.html that produce them), what the critique loop taught you, and what not to do with this style.
If it's a near-duplicate, either `--update <existing-id>` (to refine the existing style with what this project learned) or `skip` with a reason. Never silently skip.
Strip client-confidential content (product names in copy, unreleased screenshots) from guide/signature — the vault keeps the *look*, not the client's material.
