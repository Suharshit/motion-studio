---
name: style-vault
description: The studio's personal styling vault. Use at the START of a project to pick or remix a saved style, and at the END of every project to decide whether its look is unique and, if so, save its design tokens, guide, poster and signature moves for future use. Also use when the user asks about saved styles, house styles, or "use the look from <project>".
---

# Style vault

## At the start
```
npm run vault -- suggest <type> "<brief keywords>"
npm run vault -- show <id>
npm run new -- <slug> --type <type> --style <id>        # or: npm run vault -- apply <id> <slug>
```
Read the chosen style's `signature.md` — reuse its signature moves, avoid its "don't" list. Client brand colors/fonts override the vault palette; keep the vault's motion + texture unless the brief says otherwise.

## At the end (mandatory before delivery)
```
npm run vault -- similar <slug>
```
- **UNIQUE (closest < 0.80)** → save it:
```
npm run vault -- save <slug> --id <kebab-name> --name "Readable Name" \
  --tags "dark,editorial,…" --mood "confident,…" --best-for "<type>,<other types it would suit>" \
  --lesson "one sentence the next project should know"
```
  Then **open `style-vault/styles/<id>/signature.md` and fill every TODO**: the look in one line, 3–5 signature moves *with the code snippets from index.html that produce them*, composition rules, what the critique loop taught you, the don'ts, pairing (music mood, voice direction).
- **NEAR-DUPLICATE (≥ 0.80)** → if this project improved that style: `npm run vault -- save <slug> --update <id> --lesson "…"` (old version kept as style.vN.json). Otherwise: `npm run vault -- skip <slug> --reason "…"`.
- Name styles by what they look like ("Ink & Signal"), never after a client, another studio or an artist.
- Strip client-confidential material (unreleased UI, copy, data) from guide.md / signature.md — the vault keeps the look, not the content.

Tell the user in one line which way it went ("Saved as `ink-and-signal-v2`" / "Near-duplicate of X, refined it").
