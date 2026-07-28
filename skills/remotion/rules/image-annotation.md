---
name: image-annotation
description: Annotating images and screenshots — marker pen, highlight/underline/circle, dim styles and the travelling spotlight
tags: image, screenshot, highlight, underline, marker, pen, circle, annotation, spotlight, dim, focus, hand-drawn
---

# Image Annotation

Marking up a screenshot or photo — highlighting words, circling a detail, dimming
everything else. Use **`ImageHighlight`**; it covers all of it.

```json
{ "type": "scene.addLibraryScene", "params": {
  "sceneId": "ImageHighlight",
  "props": {
    "imageSrc": "https://…/screenshot.png",
    "regions": [
      { "label": "the claim", "x": 12, "y": 34, "w": 46, "h": 5 },
      { "label": "the number", "x": 61, "y": 52, "w": 18, "h": 6 }
    ]
  }
} }
```

`x/y/w/h` are **percentages of the image, 0–100** — not pixels. They are relative
to the image itself, so they stay correct when the item is resized or cropped in
the editor.

Regions animate **in sequence**, one every `framesPerRegion` (default 13), and
earlier marks stay on screen. Give a region an explicit `startFrame` to break out
of that sequence.

## Which scene

| Scene | Use when |
|---|---|
| **`ImageHighlight`** | Default. No built-in camera, so you compose it with whatever camera you want. |
| `ImageTextHighlight` | Legacy. Has a camera welded in. Only if you want its exact behaviour. |
| `EnhancedMarkerHighlight` | You specifically want the camera to *track* word-by-word like a reading eye. |

`ImageHighlight` has no camera on purpose — pair it with `SmartCamera` or
`PerspectiveZoomScene` so the movement stays yours to control.

## Three modes

| `mode` | Draws | Dims by default |
|---|---|---|
| `highlight` (default) | filled bar over the region | no |
| `underline` | line under the region | yes |
| `focus` | **nothing** | yes — the dim *is* the visual |

> **Do not set `dimOutsideRegions` unless you mean to.** Left unset it picks the
> right behaviour per mode. Setting it to `false` in `focus` mode produces an
> empty scene: focus draws no marks, so with the dim off there is nothing left.

## Two pens

`markerStyle` decides how a mark is drawn.

- **`flat`** (default) — clean CSS rectangles. Crisp, cheap, corporate.
- **`hand-drawn`** — each mark is pushed through its own turbulence/displacement
  filter for a wobbly marker-pen edge. This is what unlocks the `circle`, `box`
  and `strike` shapes.

With `hand-drawn` you get:

| Prop | Does | Default |
|---|---|---|
| `markerKind` | `highlight` \| `underline` \| `strike` \| `circle` \| `box` | follows mode |
| `roughness` | 0 = clean (filter removed entirely), 1 = heavily wobbly | 0.55 |
| `markerThickness` | stroke weight multiplier, independent of region size | 1 |
| `markerDrawFrames` | frames a mark takes to draw on; below ~8 it pops instead | 12 |

**Raise `markerThickness` — don't enlarge the region.** Stroke weight and mark
size are deliberately decoupled; growing the region to get a fatter line just
puts the mark in the wrong place.

## Dimming

`dimStyle` changes what "everything else" looks like. `dimAmount` (0–1, default
0.55) sets the strength.

| `dimStyle` | Effect |
|---|---|
| `dark` (default) | black overlay |
| `light` | white wash |
| `blur` | gaussian blur — depth of field |
| `grayscale` | desaturate the surroundings |
| `frost` | frosted glass (blur + white) |
| `spotlight` | soft elliptical pool of light that **travels** between regions and crossfades |

`spotlight` is the same reading light the news-article scene uses. It follows the
active region rather than sitting still, and `spotSpread` (default 1, clamped
0.3–3) scales the pool — below 1 hugs the mark, above 1 washes wider.

`circle` and `box` marks also **reshape the cutout**, so the revealed area is an
ellipse or rounded rect matching the mark. The bar-shaped kinds keep a rectangle.

## Per-region overrides

Any region can override the scene-level look, so one image can mix marks:

```json
"regions": [
  { "x": 10, "y": 20, "w": 40, "h": 5 },
  { "x": 55, "y": 61, "w": 22, "h": 9,
    "kind": "circle", "color": "#FF3B30", "thickness": 1.6, "roughness": 0.8 }
]
```

Overridable per region: `kind`, `roughness`, `thickness`, `color`, `opacity`,
`animation`, `borderRadius`, `startFrame`.

## Recipes

**Circle one detail in red, everything else dark**
```json
{ "markerStyle": "hand-drawn", "markerKind": "circle",
  "highlightColor": "#FF3B30", "markerThickness": 1.5,
  "dimOutsideRegions": true, "dimStyle": "dark" }
```

**Reading light travelling across a document**
```json
{ "mode": "underline", "markerStyle": "hand-drawn",
  "dimStyle": "spotlight", "spotSpread": 1 }
```

**Pull focus with no marks at all**
```json
{ "mode": "focus", "markerKind": "circle", "dimStyle": "blur" }
```

## Gotchas

- **Leave `dimOutsideRegions` unset** unless overriding on purpose — see above.
- `roughness: 0` removes the filter entirely; it does not mean "slightly rough".
- `markerStyle` defaults to `flat`, so `markerKind: "circle"` alone does nothing.
  Set the pen to `hand-drawn` as well.
- The `strike` and `circle`/`box` shapes exist **only** on the hand-drawn pen.
- `mode: "focus"` ignores `markerStyle`/`markerKind` for drawing, but still uses
  `markerKind` to choose the *cutout* shape.

> Full field list: `scene.getSceneProps` with `sceneId: "ImageHighlight"`, or
> `_Agent/scene-props.json` offline. Both come from the package's props registry —
> regenerate the offline copies with `npm run export-agent-catalogs` in
> `remotion-templates` after any scene change.
