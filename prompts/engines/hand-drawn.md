# Hand-drawn look — rigs, pens, paper

Two options:

1. **In-repo (route A):** write a seeded painter in the project (`ink(g, pts, {weight, wobbleSeed})`, `wash(g, path, color, seed)`, `paper(g, seed)`). Line boil = change the wobble seed every 2 frames (`Math.floor(t * 12)`). Everything stays a pure function of t.
2. **Plugin:** a community Claude Code plugin provides Node-canvas rigs, pens and synthesized sound:
```
claude plugin marketplace add buildwithhanif/claude-animation-skill
claude plugin install claude-animation@claude-animation-skill
```
Render its output to `out/<slug>/silent_<fmt>.mp4`, then mix/QA/vault from the repo root as usual.

Review any third-party plugin's files before installing it.
