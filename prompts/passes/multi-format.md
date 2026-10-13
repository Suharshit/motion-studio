# Multi-format — every format from one timeline

Scenes are written against `ctx.L` (layout), never fixed pixels: `L.px()`, `L.safe`, `L.pick({portrait, square, landscape})`, `L.cell()`, `L.captionBand`.

Render: `npm run render -- <slug> --format all --sub 4` (9x16, 1x1, 16x9) or `--format 9x16,4x5`.

Reframe, don't crop:
- 9:16: stack vertically, bigger type (≈1.3×), UI crops zoomed to one region, captions in the lower-middle band clear of platform UI (top 8%, bottom 18%).
- 1:1: 2-column becomes 1 column with tighter crops.
- 16:9: side-by-side compositions, more air, type ≈ 0.85×.

Check each with `npm run stills -- <slug> --format <fmt>` before rendering. If a shot only works in one format, give the others an alternate shot (branch on `L.portrait`) rather than a squeezed one.
