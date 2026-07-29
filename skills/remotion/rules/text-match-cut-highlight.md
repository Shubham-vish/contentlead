# Text match cut — highlighter variant

The sibling of [text-match-cut.md](text-match-cut.md). Same idea — one thing stays
nailed to the frame while the page behind it is replaced ten times a second — but
the anchor is a **yellow highlighter box**, the pages are **web articles** rather
than newspapers, and everything except the box is **defocused with chromatic
aberration**.

Source: `SkillTown/scripts/community-scenes/text-match-cut-highlight.tsx`.
Published to the Community library as **"Text Match Cut (Highlighter)"**.

## Why this is a different scene, not a config flag

In the newspaper version the *glyphs* are the anchor, so the keyword's typeface is
held constant and everything else varies. Here the **box** is the anchor: the
phrase inside it changes typeface from page to page and the illusion still holds,
because the eye is locked to the rectangle. That inverts the central constraint,
so it could not be folded into the other scene's config.

## Changing the word

`CONFIG.keyword` at the top of the file. Every sentence in `PAGES` is templated on
`{kw}`, so one edit rewrites all eight articles. Community scenes have **no props
panel** — use the in-app code editor (unlock 🔓, or *Fork as Custom Scene*), edit
`CONFIG`, re-add.

The box width adapts: a short phrase like `"AI"` shrinks the box to that phrase's
natural width instead of stretching two letters across 79% of the frame.

| `CONFIG` key | What it does |
|---|---|
| `keyword` | The phrase inside the highlighter. **The one line most people change.** |
| `anchor` | Where the box sits, as fractions of the frame. |
| `holdFrames` | Frames per page. **3 at 30fps = 10 cuts/sec.** |
| `boxWidthScale` | Box width vs page width. `0.79` is measured from the reference. |
| `boxHeightScale` | Box height vs `pageScale`. **Never derive this from font size.** |
| `blurScale` / `aberrationScale` | How far out of focus the page behind is. |
| `highlight` / `ink` / `paper` | `#F2E64B` / `#221B0F` / `#E1E5DD`, measured. |

## Four things that make it work

1. **The box never moves — not by one pixel.** Verified at 0px drift on all four
   edges.
2. **The box is the only sharp thing in frame.** Build it as a fully blurred page
   with the phrase and box composited sharp on top, *not* as a page with a sharp
   region cut into it. Text immediately outside the box is blurred mid-word.
3. **10 cuts/second, and it never rests.** Measured off the reference: 6-frame
   gaps at 60fps, sustained across the full five seconds.
4. **Real article furniture** — breadcrumb nav, masthead, byline, body paragraphs.
   Grey placeholder bars read as a wireframe instantly.

## Traps this scene cost time on

### `AbsoluteFill` + a negative `inset` silently *moves* the element

`AbsoluteFill` carries `width:100%; height:100%`, which **beats the `right` and
`bottom` edges** of a negative inset. So `<AbsoluteFill style={{inset: -bleed}}>`
does not grow the element — it shifts it left and up by `bleed` and keeps its
original size, dropping its right edge *inside* the frame. Under a blur it left a
bright warm stripe at `width - bleed`.

Proven by setting `bleed = 200` and watching the stripe land at exactly x=879
(`-200 + 1080`). **Use an explicit `position/left/top/width/height` div whenever
you need to bleed past the frame.**

### Blur needs bleed, or the edges fringe

`feGaussianBlur` pulls transparency in for ~3σ *before* the channel offsets run.
Content must extend past the frame by `3*blur + aberration + margin` or one edge
comes out warm and the opposite edge cyan.

### Anchor geometry must be frame-derived, never type-derived

`boxH = fontSize * 1.34` made the box breathe 12–14px vertically as the typeface
changed between pages. The box *is* the lock, so nothing about it may depend on
which page is showing. Use `pageScale * boxHeightScale`.

And `pageScale = min(width, height * 0.9)` — sizing off width alone made the box
24% of frame height in landscape.

### Guessed font advances were out by up to 12%

Estimated per-face glyph advances pushed the phrase clean out of its box (Gill
Sans was 12% under). Measured all faces in Chromium with `canvas.measureText`
instead. Belt-and-braces, the phrase renders as SVG
`<text textLength={innerW} lengthAdjust="spacingAndGlyphs">`, so it fits exactly
for **any** word and **any** face and overflow is structurally impossible.

## Verifying

`SkillTown-Desktop/tests/visual/highlight-cut-check.py` — box lock (≤2px drift),
sharpness confinement, page turnover (≥25%).

Two of its metrics were wrong before the scene was, so be suspicious of a failure:

- The yellow detector keyed on brightness and caught warm *paper*, reporting the
  box as full frame height. Now discriminates on **G−B > 60** (highlighter ≈155,
  paper ≈8).
- A containment test looking for "ink in the gutter" failed on a legitimately
  wrapped headline sitting under the box. Replaced with an **edge-acutance** test,
  which measures the real claim — the phrase is the only sharp thing — and reports
  `outside = 0.0000` on every frame.

Verified: portrait and landscape both pass, `"AI"` and `"Artificial Intelligence"`
both pass, and a negative control with 14px of injected jitter correctly fails.
