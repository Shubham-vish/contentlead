---
name: news-article-scene
description: The 3D newspaper / news-article scene — Vox / Johnny Harris editorial look with marker annotations and a camera that reads the page
tags: news, article, newspaper, editorial, vox, johnny-harris, broadsheet, tabloid, clipping, paper, annotation, marker, highlight, 3d, camera, documentary
---

# News Article Scene

`NewsArticleScene` renders a **real DOM article on aged paper**, tilts it on a 3D
plane, and flies a slow documentary camera across it while hand-drawn marker
highlights sweep over the lines you name.

This is the Vox / Johnny Harris / Nitish Rajput "here's the receipt" shot.

```json
{ "type": "scene.addLibraryScene", "params": {
  "sceneId": "NewsArticleScene",
  "props": {
    "kicker": "INVESTIGATION",
    "headline": "The story nobody wanted to print",
    "byline": "By A. Reporter",
    "body": ["First paragraph sets it up.", "Second one lands the point."],
    "annotations": [ { "matchText": "nobody wanted", "kind": "highlight" } ]
  }
} }
```

Everything below is optional. The scene ships with a full working default.

## Why it is not ImageHighlight

`ImageHighlight` marks up a **picture** of text, so a region is `x/y/w/h`
percentages you have to find. `NewsArticleScene` renders the text itself, so
annotations are placed **inline, inside the words**. Alignment is automatic at
any zoom — no coordinates, no OCR, no measurement.

That is the whole point: **you can highlight the exact phrase being narrated**,
straight from caption word timings, with `matchText`.

Use `ImageHighlight` for a screenshot you were handed. Use this when you control
the words.

## Content

Two ways in. The shorthand:

| Prop | Notes |
|---|---|
| `headline`, `kicker`, `subheadline`, `byline` | plain strings |
| `body` | a string, or `string[]` for multiple paragraphs |

Or `blocks[]` for full control of order, type and — importantly — **ids that
annotations can target**:

```json
"blocks": [
  { "id": "lede", "type": "paragraph", "text": "The first paragraph." },
  { "type": "quote", "text": "A pulled quote.", "align": "center" },
  { "type": "paragraph", "text": "Another.", "columnBreak": true }
]
```

Block `type`: `kicker` · `heading` · `subheading` · `byline` · `paragraph` ·
`quote` · `caption` · `divider`. Each also takes `fontSize`, `align`,
`columnBreak`. `blocks` **overrides** the shorthand — don't pass both.

`images[]` embeds photos or video in the flow: `{ src, placement, isVideo?,
startFrom?, endAt?, caption? }`, where `placement` is `hero` · `inline` ·
`float-left` · `float-right` · `sidebar`.

## Page

| Prop | Values | Default |
|---|---|---|
| `layout` | `web-article` · `broadsheet` · `tabloid` · `clipping` | `web-article` |
| `columns` | `1`–`4` | per layout |
| `masthead`, `mastheadSubline` | e.g. `"THE TELEGRAPH"` | — |
| `dateBadge`, `sourceBadge` | string shorthand or `{text, color}` | — |
| `backdrop` | dark surround behind the sheet | `true` |

`paper` controls the stock: `{ tone, color, inkColor, grain, vignette, torn,
tornRoughness, shadow, foldCrease, widthPct }`. `tone` is `white` · `cream` ·
`aged` · `newsprint` · `sepia` (default `aged`).

For the "torn clipping stuck on a wall" look: `layout: "clipping"` with
`paper: { torn: true, tone: "newsprint" }`.

## Annotations

The reason the scene exists. Each entry targets text and draws a marker over it.

```json
"annotations": [
  { "matchText": "nobody wanted", "kind": "highlight", "emphasis": "reveal" },
  { "targetId": "lede", "kind": "underline", "color": "#C62B1C" },
  { "targetIndex": 2, "kind": "circle", "roughness": 0.8 }
]
```

**Targeting** — `matchText` (first case-insensitive substring match, the one you
usually want), or `targetId`, or `targetIndex`. `matchText` marks just that
phrase; the others mark the whole block.

**`kind`** — `highlight` · `underline` · `strike` · `box` · `circle`.

**`emphasis`** — how hard the camera sells it. This sets zoom, dwell, draw speed
and spotlight together, so you can pace a sequence by picking one word per beat:

| `emphasis` | zoom | dwell | draw | dim |
|---|---|---|---|---|
| `glance` | 0.72× | 8f | 14f | 0 |
| `read` | 1.0× | 20f | 22f | 0.30 |
| `reveal` | 1.06× | 34f | 30f | 0.55 |

Also per-annotation: `color`, `opacity`, `roughness` (0–1, hand-drawn edge),
`startFrame`, `durationFrames`, `endFrame`, `animation`
(`sweep`/`fade`/`scale-x`/`none`), `overText`.

Scene-level defaults: `highlightColor` (`#FFE24D`) and **`markerInkColor`**
(`#C62B1C`). These are deliberately separate — a highlighter tint reads fine as a
wash, but drawn as a thin line on paper it disappears, so strokes default to red
pen. `highlightKind`, `highlightRoughness`, `annotationStartFrame`,
`annotationStagger` set the rest.

> Leave `annotationStagger` unset unless you mean it. Unset, the scene spaces
> annotations to fit the clip's duration; a fixed value overrides that and can
> run them past the end.

## Camera

`focusMode: "annotations"` (the default) makes the camera **travel to each
annotation in turn** — this is what produces the reading-along feel. Set
`focusMode: "none"` for a static drift instead.

`cameraMotion` picks the movement character: `locked` · `calm` · `documentary`
(default) · `dramatic`. These aren't guesses — subject speed, per-frame jerk,
cuts and stalls were sampled per frame from the real DOM, and `documentary` is
the configuration that produced **0 cuts, 0 stalls** and a ~26 px/frame peak on
the default layout. Prefer it before hand-tuning.

Tune the travel with `focusZoom` (1.75), `focusWideZoom` (0.8),
`focusTravelFrames` (32), `focusDwellFrames` (20), `focusCentering` (0.92).

Individual overrides — `cameraOrbit`, `cameraTilt`, `cameraIntensity`,
`cameraDrift`, `cameraCreep`, `cameraPullBack`, `verticalFollow` — each override
the matching preset value. There is also the full `PerspectiveZoom` surface
underneath: `cameraPreset` (18 presets), `zoom`/`panX`/`panY`/`rotateX/Y/Z`
ranges, `cameraEasing`, `shake`, `cameraKeyframes`, `effects`, `pip`.

## Recipes

**Narration-synced — highlight each phrase as it is spoken**
```json
{ "focusMode": "annotations", "cameraMotion": "documentary",
  "annotations": [
    { "matchText": "first claim",  "emphasis": "read" },
    { "matchText": "second claim", "emphasis": "reveal", "kind": "circle" }
  ] }
```

**Torn clipping, evidence-board feel**
```json
{ "layout": "clipping", "paper": { "torn": true, "tone": "newsprint", "foldCrease": true },
  "cameraMotion": "calm" }
```

**Front page**
```json
{ "layout": "broadsheet", "columns": 3, "masthead": "THE DAILY HERALD",
  "mastheadSubline": "LONDON · TUESDAY, AUGUST 29, 2024" }
```

## Gotchas

- `blocks` **replaces** the `headline`/`body` shorthand — passing both is a bug.
- `matchText` hits only the **first** occurrence, case-insensitively.
- Strokes (`underline`/`strike`/`box`/`circle`) use `markerInkColor`, not
  `highlightColor`. Setting only `highlightColor` will look like nothing changed.
- Leave `annotationStagger` unset so the scene can fit the annotations to the
  clip length.
- It composes `PerspectiveZoomScene` internally, so camera/effects/PIP props
  behave exactly as they do there.

> **Read the actual source** when in doubt — `scene.getSceneSource` with
> `sceneId: "NewsArticleScene"` returns the full component (~23 k chars).
> Full field list: `scene.getSceneProps`, or `_Agent/scene-props.json` offline
> (62 fields).
