---
name: masking-and-reveal
description: Control structured masks and animated Reveal presets on image, video, and text timeline items. Use for rect/ellipse/path/text masks, multi-shape combinations, track mattes, feather/invert geometry, or animated reveal/hide effects.
---

# Masks and Animated Reveals

These commands use the same `details.mask` model, renderer, keyframe store, and Reveal preset engine as the editor UI. Do not approximate a Reveal with opacity keyframes.

Targets accept `itemId`, `itemIds`, or default to the current selection. Supported item types are `image`, `video`, and `text`.

## Discover Reveal presets

```json
{"type":"reveal.listPresets","params":{}}
```

Returns six built-in presets with `id`, default duration, and easing.

## Apply or clear a Reveal

```json
{"type":"reveal.apply","params":{
  "presetId":"reveal-from-left",
  "itemIds":["video-1","text-1"],
  "mode":"reveal",
  "durationSec":0.8,
  "staggerFrames":6,
  "easing":"easeInOut"
}}
```

- `mode`: `reveal` or `hide`
- `durationSec`: positive seconds, clamped to each item's visible duration
- `staggerFrames`: delay between selected items
- Reveal starts at each item's timeline in-point

Clear:

```json
{"type":"reveal.clear","params":{"itemIds":["video-1"]}}
```

## Read, set, and clear masks

```json
{"type":"mask.get","params":{"itemIds":["video-1"]}}
```

```json
{"type":"mask.set","params":{
  "itemId":"video-1",
  "mask":{
    "shape":"ellipse",
    "x":50,
    "y":50,
    "width":70,
    "height":85,
    "rotation":0,
    "feather":24,
    "invert":false
  }
}}
```

`mask.set` is a patch: omitted fields preserve existing values. Numeric geometry is normalized by the shared mask codec.

Supported shapes:
- `rect` — optional `cornerRadius`
- `ellipse`
- `path` — provide SVG `path` in object-bounding-box coordinates
- `text` — provide `text: {content,fontFamily,fontSize,fontWeight?}`

Professional composition fields:
- `extraShapes[]` — each has geometry and `blend: add|subtract|intersect`
- `trackMatte: {sourceItemId, mode}` — mode is `alpha`, `luma`, `alpha-inverted`, or `luma-inverted`

Clear:

```json
{"type":"mask.clear","params":{"itemId":"video-1"}}
```

## Rules

- Call `mask.get` before patching an existing complex mask.
- Use `reveal.apply` for preset animation; use `mask.set` for static/manual geometry.
- Do not set raw `details.mask` through `editor.editItem` unless recovering old data—the semantic commands validate targets and normalize geometry.
- After mutations, seek into the item and inspect `editorHealth`.
