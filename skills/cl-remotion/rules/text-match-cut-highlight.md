# Text match cut — highlighter variants

Two scenes, both siblings of [text-match-cut.md](text-match-cut.md):

| Scene | Anchor | What is defocused |
|---|---|---|
| **Text Match Cut (Highlighter)** | yellow box | the whole page, evenly, plus chromatic aberration |
| **Text Match Cut (Focus Pull)** | yellow box | everything except the highlighted LINE, smearing vertically with distance |

They share the box-is-the-anchor principle, the measured font advances, the
`textLength` fit and the frame-derived geometry rule, so most of this page
applies to both. The Focus Pull differences are at the bottom.

## Highlighter

Same idea — one thing stays
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

---

# Focus Pull variant

Source: `SkillTown/scripts/community-scenes/text-match-cut-focus.tsx`.
Published as **"Text Match Cut (Focus Pull)"**.

Same yellow box, but instead of defocusing the page evenly it **pulls focus to
the highlighted line**. Text on and immediately around that line is razor sharp;
everything above and below smears away vertically, harder the further it goes.
The page is also zoomed much further in, so lines run off both edges of frame.

## Measured off the reference (1080x1920 @ 24fps)

| | |
|---|---|
| cut cadence | 2–3 frames @24fps = **8–12 cuts/sec** → `holdFrames: 3` @30fps |
| box | x[200:880] = **63% of frame width**, h 123px, dead constant |
| box centre | cx **0.500**, cy **0.380** — lower than the Highlighter's 0.26 |
| focus falloff | **pearson r = −0.721** between sharpness and distance from the highlight |
| | `\|dy\|` 7.27 at the line, ~1.0 beyond 600px — near text is **3.84× sharper** |
| smear axis | `\|dy\|/\|dx\|` 0.46–0.59 → the blur runs **vertically** |
| colours | highlighter [203,196,31], paper [209,210,194], ink [37,38,26] |

## Why it is built out of independent lines

A spatially varying blur is not something one SVG filter can express. So the
page is drawn as **one element per line**, each carrying its own filter chosen
from twelve pre-declared `feGaussianBlur` levels.

That is not a workaround — it is also exactly how the reference behaves. Whole
lines smear as a unit, because the thing being defocused is a line of type, not
a texture. `stdDeviation` takes separate x and y values, so the streak is made
vertical by keeping x small, matching the measured anisotropy.

## Two things that are easy to get wrong

**The sharp zone must be wider than one line.** At ±0.55 lines only the focus
line itself is crisp, and the measured near/far ratio came out at 1.86× against
the reference's 3.84× — the phrase read as a caption pasted onto a blur rather
than part of a sentence. At ±1.35 lines the neighbouring lines stay legible and
the ratio reaches 3.12×.

**The headline must be laid out defensively.** Deriving the number of body lines
above the highlight from the frame height put the headline at y = −56, so it
silently never rendered. `bodyAbove` now varies 0–2 by page (which is also what
the reference does, and stops consecutive cuts looking like one page with the
words swapped), and the headline and breadcrumb are simply **omitted when they
do not fit** rather than being allowed to compute a negative y.

## Verifying

`SkillTown-Desktop/tests/visual/focus-cut-check.py` — box lock, focus falloff
(both the correlation *and* the near/far ratio), and page turnover.

| variant | result |
|---|---|
| portrait 1080×1920 | PASS — drift 1.0px, r −0.795, ratio 3.12× |
| landscape 1920×1080 | PASS — drift 2.0px, r −0.758, ratio 4.98× |
| keyword `"AI"` | PASS — box shrinks to fit, ratio 2.70× |
| keyword `"Artificial Intelligence"` | PASS — drift 0.0px, ratio 3.53× |
| **negative** (`smearScale: 0`) | **FAIL, exit 1** — r flips to +0.235, ratio 0.90× |

**Checker trap, same family as the others on this page:** the near/far split was
first written as fixed 300px/700px cuts. In a 1080-tall landscape frame that
selects no bands at all on the far side, producing a `nan` ratio and failing a
scene that was behaving perfectly. The split is now a fraction of frame height
(0.156 / 0.365), with an explicit guard for an empty bin. Always sanity-check a
verifier at both orientations before trusting a failure.
