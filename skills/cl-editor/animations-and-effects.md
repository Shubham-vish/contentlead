---
name: animations-and-effects
description: Enter/exit/loop animations, keyframes, visual effects, and canonical Effect Span commands
tags: animation, effect, effect-span, fx-lane, keyframe, fadeIn, fadeOut, slide, scale, blur, brightness, contrast, grayscale, sepia, camera, reveal, loop, pulse, glitch, spin
---

# Animations and Effects

Use animations for entrance, exit, and looping motion. Use keyframes for fine-grained property animation. Use effects for visual treatment.

## ⚠️ CRITICAL: Animation Caveats

### Animations work in-session but DON'T persist
Animations applied via `setAnimation` work correctly during the current editing session. However, they are **NOT saved** through the save/restore cycle. After loading a project, all animations reset to `none`. You must re-apply animations after every restore.

### In + Out must be set separately (dispatch race condition)
Setting both `animationIn` and `animationOut` in one call causes a race condition where `out` overwrites `in`. The handler dispatches them separately with a 40ms delay. If applying manually, always set one at a time with a gap.

### Supported presets with actual property compositions
The rewritten handler maps presets to keyframe compositions:

| Preset | Properties Animated | Notes |
|---|---|---|
| `fadeIn`/`fadeOut` | opacity | Simple opacity 0→1 / 1→0 |
| `scaleIn`/`scaleOut` | scale + opacity | Scale 0→1 with fade |
| `slideInRight`/`slideInLeft` | x + opacity | Slides from ±canvas width |
| `slideInUp`/`slideInDown` | y + opacity | Slides from ±canvas height |
| `slideOutRight`/`slideOutLeft` | x + opacity | Slides to ±canvas width |
| `zoomIn`/`zoomOut` | scale + opacity | Scale 0.3→1 / 1→0.3 |

## `editor.setAnimation`

Assign one animation preset to an item for `in`, `out`, or `loop` behavior.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | required | Target timeline item |
| `animationIn` | `string` | — | Enter animation preset name (e.g., `fadeIn`, `slideInLeft`) |
| `animationOut` | `string` | — | Exit animation preset name (e.g., `fadeOut`, `scaleOut`) |
| `duration` | `number` | `500` | Animation duration in milliseconds |

> **Legacy format also accepted:** `{itemId, animationType: "in", type: "fadeIn"}` — but prefer the new format above.

Example:

```json
{
  "type": "editor.setAnimation",
  "params": {
    "itemId": "text_hero",
    "animationIn": "fadeIn",
    "duration": 500
  }
}
```

### Enter presets

`fadeIn`, `scaleIn`, `rotateIn`, `flipIn`, `slideInRight`, `slideInLeft`, `slideInTop`, `slideInBottom`, `typeWriterIn`, `animatedTextIn`, `shakeHorizontalIn`, `shakeVerticalIn`, `sunnyMorningsAnimationIn`, `dominoDreamsIn`, `greatThinkersAnimationIn`, `beautifulQuestionsAnimationIn`, `madeWithLoveAnimationIn`, `realityIsBrokenAnimationIn`, `descompressAnimationIn`, `dropAnimationIn`, `countDownAnimationIn`, `soundWaveIn`

### Exit presets

`fadeOut`, `scaleOut`, `slideOutRight`, `slideOutLeft`, `slideOutTop`, `slideOutBottom`, `typeWriterOut`, `animatedTextOut`, `shakeHorizontalOut`, `shakeVerticalOut`, `sunnyMorningsAnimationOut`, `dominoDreamsAnimationOut`, `greatThinkersAnimationOut`, `beautifulQuestionsAnimationOut`, `madeWithLoveAnimationOut`, `realityIsBrokenAnimationOut`, `descompressAnimationOut`, `dropAnimationOut`

### Loop presets

`heartbeatAnimationLoop`, `pulseAnimationLoop`, `spinAnimationLoop`, `waveAnimationLoop`, `rotate3dAnimationLoop`, `glitchAnimationLoop`, `vogueAnimationLoop`, `dragonFlyAnimationLoop`, `billboardAnimationLoop`, `shakeTextAnimationLoop`, `shakyLettersTextAnimationLoop`, `vintageAnimationLoop`, `textFontChangeAnimationLoop`

## `editor.removeAnimation`

Remove one animation type from an item.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | required | Target timeline item |
| `animationType` | `string` | omit to remove all | `in`, `out`, or omit to remove both |

Example:

```json
{
  "type": "editor.removeAnimation",
  "params": {
    "itemId": "text_hero",
    "animationType": "in"
  }
}
```

## `editor.addKeyframe`

Animate a specific property at a frame.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | required | Target timeline item |
| `property` | `string` | required | `opacity`, `x`, `y`, or `scale` |
| `value` | `number` | required | Property value at that frame |
| `frame` | `number` | required | Absolute composition frame |
| `easing` | `string` | `"linear"` | `linear`, `easeIn`, `easeOut`, `easeInOut` |

Example:

```json
{
  "type": "editor.addKeyframe",
  "params": {
    "itemId": "image_01",
    "property": "opacity",
    "value": 0.35,
    "frame": 12,
    "easing": "easeOut"
  }
}
```

## `editor.removeKeyframe`

Remove a keyframe by id, or resolve it from an exact frame.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | required | Target timeline item |
| `property` | `string` | required | `opacity`, `x`, `y`, or `scale` |
| `keyframeId` | `string` | optional | Exact keyframe id |
| `frame` | `number` | optional | Exact frame to resolve when `keyframeId` is omitted |

Example:

```json
{
  "type": "editor.removeKeyframe",
  "params": {
    "itemId": "image_01",
    "property": "opacity",
    "frame": 12
  }
}
```

## `editor.addEffect`

Apply a visual effect to an item.

| Param | Type | Default | Description |
|---|---|---|---|
| `trackItemId` / `itemId` | `string` | required | Target timeline item |
| `type` | `string` | required | Effect type from the editor effect library |
| `startFrame` | `number` | `0` | Item-relative frame where the effect starts |
| `endFrame` | `number` | `-1` | Item-relative end frame; `-1` means clip end |
| `parameters` | `object` | type defaults | Effect-specific controls |
| `fadeInFrames` / `fadeOutFrames` | `number` | `0` | Effect intensity ramps |

Example:

```json
{
  "type": "editor.addEffect",
  "params": {
    "itemId": "video_broll",
    "type": "grayscale"
  }
}
```

### True zoom motion blur

`zoom-motion-blur` uses one decoded image/video source and multi-sample canvas
compositing. It does not clone video or audio elements. Balanced quality is six
samples; increase samples only when the extra render cost is justified.

```json
{
  "type": "editor.addEffect",
  "params": {
    "itemId": "video_broll",
    "type": "zoom-motion-blur",
    "startFrame": 0,
    "endFrame": 18,
    "parameters": {
      "motionBlurDirection": "in",
      "motionBlurAmount": 0.28,
      "motionBlurDurationFrames": 18,
      "shutterAngle": 220,
      "samples": 6,
      "focusX": 0.5,
      "focusY": 0.5
    }
  }
}
```

Use `motionBlurDirection: "out"` for Zoom Out Motion Blur. Parameters are
validated and clamped: amount `0.01-1`, motion duration `1-120` frames,
shutter `0-360`, samples `2-16`, focus coordinates `0-1`. In the UI, select an image/video and open
**Effects → Zoom In Motion Blur** or **Zoom Out Motion Blur**.

The old `blur-motion` preset remains available as **Speed Blur** for backwards
compatibility. It is Gaussian blur, not radial zoom motion blur.

## `editor.removeEffect`

Remove one effect from an item.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | required | Target timeline item |
| `effect_type` | `string` | required | Effect to remove |

Example:

```json
{
  "type": "editor.removeEffect",
  "params": {
    "itemId": "video_broll",
    "type": "grayscale"
  }
}
```

## Effect Spans: one timeline view over every effect system

Effect Spans are a **projected canonical view**, not another persisted effect
store. They resolve the editor's existing effect sources into bars with stable
IDs and absolute project-frame ranges:

| `sourceRef.source` | Native owner | Properties inspector | Range editing |
|---|---|---|---|
| `effects-store` | Visual Effects store | Exact effect expanded in **Effects** | Move + trim |
| `clip-fx` | Legacy fade fields and `details.fx` envelopes | **AnimationSection**, focused through `activeFxEffect` | Edge trim; no move. Legacy continuous zoom cannot be trimmed; two-edge zoom can |
| `camera-rig` | Item camera-effect store | **3D Camera** controls | No move/trim |
| `camera-focus` | Camera focus point | **Zoom to Spot** controls | Move + trim |
| `reveal-mask` | `details.mask` plus mask keyframe tracks | **Reveal** controls | Query/select only; range mutation is not yet supported |

Every span has:

- `id`: `esv:<source>:<parentItemId>:<nativeKey>`
- `parentItemId`, `kind`, `category`, `stage`, `label`, `enabled`
- `startFrame` inclusive and `endFrame` exclusive
- `sourceRef`, source-specific `parameters`, and advisory `capabilities`

### Absolute-frame contract

`editor.addEffect.startFrame/endFrame` are item-relative. Effect Span
`startFrame/endFrame` are always **absolute project frames**. Query first, then
send absolute frames back to `editor.updateEffectSpan`. Do not convert them to
milliseconds or subtract the parent clip start.

At 30 fps, a clip from 2–6 seconds occupies project frames `[60, 180)`. A span
from frame 75 through 104 is represented as:

```json
{"startFrame":75,"endFrame":105}
```

### `query.getEffectSpans`

Returns `{spans, count}`. All filters are optional.

| Param | Type | Description |
|---|---|---|
| `itemId` | string | Only spans owned by this timeline item (`trackItemId` alias accepted) |
| `source` | string | `effects-store`, `clip-fx`, `camera-rig`, `camera-focus`, or `reveal-mask` |
| `spanId` | string | One exact canonical span ID |

Verified examples:

```json
{"type":"query.getEffectSpans","params":{"itemId":"video_broll"}}
```

```json
{"type":"query.getEffectSpans","params":{"itemId":"video_broll","source":"camera-focus"}}
```

Always use the returned `span.id`; do not invent native effect or focus-point
IDs.

### `editor.updateEffectSpan`

Moves or trims a supported span using an absolute, end-exclusive range:

```json
{
  "type": "editor.updateEffectSpan",
  "params": {
    "spanId": "esv:effects-store:video_broll:eff_ab12",
    "range": {"startFrame": 75, "endFrame": 105}
  }
}
```

The verified flat form is also accepted:

```json
{
  "type": "editor.updateEffectSpan",
  "params": {
    "spanId": "esv:camera-focus:video_broll:focus_1",
    "startFrame": 90,
    "endFrame": 126
  }
}
```

The handler uses the project's current FPS. Do not pass `fps` unless replaying
a range against a deliberately different frame basis. The range must have
positive duration and is clamped to the owning clip. Unsupported range edits
return `status: "failed"` with `result.code: "UNSUPPORTED"`.

### `editor.toggleEffectSpan`

```json
{
  "type": "editor.toggleEffectSpan",
  "params": {
    "spanId": "esv:clip-fx:video_broll:blur",
    "enabled": false
  }
}
```

Toggle is supported for all five sources. Clip-FX and reveal values are retained
under the source-owned disabled payload and reappear on enable; this is not a
destructive delete. Camera focus toggles its disabled flag, and camera-rig
toggles the rig gate. `enabled` must be a JSON boolean.

### `editor.deleteEffectSpan`

```json
{
  "type": "editor.deleteEffectSpan",
  "params": {
    "spanId": "esv:reveal-mask:image_hero:mask",
    "itemId": "image_hero"
  }
}
```

Delete is supported for all five sources:

- effects-store removes the native effect;
- clip-FX removes both active and retained-disabled envelopes;
- camera-focus removes that focus point;
- reveal removes `details.mask`, retained disabled mask data, and mask
  keyframe tracks;
- camera-rig clears the item's entire camera-effect record, including its focus
  points. Use camera-rig delete only when that broader removal is intended.

`itemId` is optional but recommended as a guard against targeting a stale ID.

### `editor.duplicateEffectSpan`

```json
{
  "type": "editor.duplicateEffectSpan",
  "params": {
    "spanId": "esv:effects-store:video_broll:eff_ab12"
  }
}
```

Duplicate is supported only for `effects-store` spans. It returns
`{changed, newSpanId, sourceSpanId}`. A bounded effect is placed immediately
after its source only when the duplicate fits inside the parent item. A
full-clip effect (`endFrame: -1`) receives a fresh native ID while retaining
the same full-clip range. One-instance sources return
`{changed:false, unsupported:true, reason}` rather than creating ambiguous
duplicates.

### Mutation result and error rules

- Missing/unknown span: `status: "failed"` with a descriptive error.
- Invalid range: `result.code: "INVALID_RANGE"`.
- Unsupported lossless operation: `result.code: "UNSUPPORTED"`.
- Duplicate may succeed at the command level with `changed:false` and an
  `unsupported` reason; inspect the result, not only `status`.
- Mutations participate in supplemental undo/redo and update the native source;
  never persist or edit the projected span object directly.

### Inspector routing

Selecting an FX bar selects its parent clip in the normal editor selection,
keeps that clip in `activeIds`, opens Properties, then selects the span. This is
why clip-FX controls continue to target the correct clip. If the native source
is deleted or otherwise disappears, span selection clears and the normal clip
inspector returns. The Effect Span header shows the parent breadcrumb, source
color/category, enabled state, absolute range and duration, plus only the
actions supported by the mutation adapter.

### Split, clone, trim, move, and delete persistence

Effect Spans are re-projected after timeline lifecycle operations:

- **Split:** effects crossing the cut are partitioned; the right clip receives
  fresh effects-store IDs. Absolute keyframe tracks are clipped with boundary
  samples. Camera focus/keyframes are clipped and rebased. Clip-FX details are
  copied and their in/out ramps are clamped to half of each new clip.
- **Clone/paste:** effects-store entries receive fresh IDs; absolute keyframes
  shift by the clone's display offset; camera state is deep-cloned. Item-owned
  clip-FX and reveal details clone with the item.
- **Trim:** out-of-range effects/keyframes/focus points are clipped or removed.
  Item-relative camera/effect timing is rebased; clip-FX ramps are clamped.
- **Move:** item-relative effects/camera timing stays relative to the clip;
  absolute generic keyframes shift with the clip.
- **Delete item:** effects-store, keyframe, and camera supplemental entries are
  removed with the item. Supplemental snapshots keep undo/redo in sync with
  timeline state.

### Export behavior

Fast browser export supports only simple single-layer effect-map filters:
`grayscale`, `sepia`, `invert`, `hue-rotate`, `saturate`, `contrast`, `blur`,
and `brightness`. Active clip-FX/fades, reveal masks, camera effects,
transitions, zoom motion blur, film grain, glow, motion effects, and other
unsupported surfaces make the project ineligible for fast export. Export then
falls back automatically to the standard local/cloud renderer; it must never
silently omit an effect.

### Current limitations

- The span model is projected from legacy/native owners; it is not a standalone
  persisted track type.
- `camera-rig` has no range edit. `reveal-mask` range updates are not yet
  implemented even though its keyframe-derived bar is visible.
- Clip-FX cannot move independently. Edge envelopes and two-edge zoom can trim;
  legacy continuous zoom cannot. Because a clip-FX envelope affects its whole
  owner, its queried bar remains whole-clip; a range update maps the requested
  inset to `inMs`/`outMs` rather than persisting a separate span range.
- Disabling an otherwise-empty camera rig can make it non-meaningful and remove
  it from the projection. The inspector then falls back to the parent clip;
  recreate/re-enable the rig through the camera controls, not a stale span ID.
- Keyframe sub-rows visualize and seek to camera/reveal keyframes; they do not
  provide direct diamond dragging/editing.
- Track locks block FX drag, resize, and timeline-key deletion.
- Span IDs may change on split/clone because new native effect IDs are allocated;
  query again after structural timeline edits.

## Common Patterns / Recipes

### Common combinations

- **Fade in/out:** `fadeIn` + `fadeOut`
- **Slide through:** `slideInLeft` + `slideOutRight`
- **Pop in/out:** `scaleIn` + `scaleOut`
- **Attention-grab:** `scaleIn` + `pulseAnimationLoop`
- **Stylized title:** `typeWriterIn` + `glitchAnimationLoop`
- **Retro overlay:** `fadeIn` + `sepia`

### Recipes

### Fade in + fade out

```json
[
  {
    "type": "editor.setAnimation",
    "params": {
      "itemId": "text_hero",
      "type": "in",
      "preset": "fadeIn"
    }
  },
  {
    "type": "editor.setAnimation",
    "params": {
      "itemId": "text_hero",
      "type": "out",
      "preset": "fadeOut"
    }
  }
]
```

### Slide through

```json
[
  {
    "type": "editor.setAnimation",
    "params": {
      "itemId": "text_hero",
      "type": "in",
      "preset": "slideInLeft"
    }
  },
  {
    "type": "editor.setAnimation",
    "params": {
      "itemId": "text_hero",
      "type": "out",
      "preset": "slideOutRight"
    }
  }
]
```

### Pop in/out

```json
[
  {
    "type": "editor.setAnimation",
    "params": {
      "itemId": "cta_button",
      "type": "in",
      "preset": "scaleIn"
    }
  },
  {
    "type": "editor.setAnimation",
    "params": {
      "itemId": "cta_button",
      "type": "out",
      "preset": "scaleOut"
    }
  }
]
```

### Attention-grab loop

```json
[
  {
    "type": "editor.setAnimation",
    "params": {
      "itemId": "cta_button",
      "type": "in",
      "preset": "scaleIn"
    }
  },
  {
    "type": "editor.setAnimation",
    "params": {
      "itemId": "cta_button",
      "type": "loop",
      "preset": "heartbeatAnimationLoop"
    }
  }
]
```

### Black-and-white treatment

```json
[
  {
    "type": "editor.addEffect",
    "params": {
      "itemId": "video_broll",
      "effect_type": "grayscale"
    }
  },
  {
    "type": "editor.addEffect",
    "params": {
      "itemId": "video_broll",
      "type": "contrast"
    }
  }
]
```

### Keyframed fade-up

```json
[
  {
    "type": "editor.addKeyframe",
    "params": {
      "itemId": "logo_01",
      "property": "opacity",
      "value": 0,
      "frame": 0,
      "easing": "linear"
    }
  },
  {
    "type": "editor.addKeyframe",
    "params": {
      "itemId": "logo_01",
      "property": "opacity",
      "value": 1,
      "frame": 18,
      "easing": "easeOut"
    }
  }
]
```

## ⚠️ Code-Level Safety: getAnimations() & BoxAnim

The `@designcombo/animations` library's `BoxAnim` and `MaskAnim` components crash if passed `undefined` entries in animation arrays or `undefined` for `item.display`. All player renderers now:

1. **Never use `animations!`** — always check `animations ?` before calling `getAnimations()`
2. **Sanitize animation arrays** — `.filter(Boolean)` removes any `undefined` entries from `getSlideAnimation()` edge cases
3. **Wrap MaskAnim item prop** — `item={item.display ? item : { ...item, display: { from: 0, to: 1000 } }}`

If modifying ANY player renderer, always follow this pattern:
```tsx
const _sanitize = (a: any) => Array.isArray(a) ? a.filter(Boolean) : a;
const _rawAnims = animations ? getAnimations(animations, item, frame, fps)
  : { animationIn: null, animationOut: null, animationTimed: null };
const animationIn = _sanitize(_rawAnims.animationIn);
```

---

## Scene Effect Recipes (Bundled Scene Templates)

These are proven, tested recipes for `scene.addBundledScene`. Each includes the exact JSX pattern, when to use it, and which SFX pairs best.

### Recipe 1: Ken Burns + Vignette
**When:** Opening shot, establishing scene, cinematic mood
**SFX pair:** `whoosh` or `air_hit` at scene start
**Key code:**
```jsx
const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.25], { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
const panX = interpolate(frame, [0, durationInFrames], [2, -2], { extrapolateRight: 'clamp' });
const shakeX = noise2D('sx', frame * 0.03, 0) * 0.8;
// Wrap video in div with transform: scale(zoom) translate(panX + shakeX, shakeY)
// Add radial-gradient vignette overlay
```

### Recipe 2: Bordered Crop with Glow
**When:** Highlighting a specific piece of content, framing
**SFX pair:** `camera_shutter` or `digital_shutter`
**Key code:**
```jsx
// Container: width 85%, height 80%, centered, dark background
// Border: 3px solid rgba(255, 200, 50, borderGlow) with animated opacity
// boxShadow: glow effect matching border color
// borderRadius: 24px, overflow: hidden
// Scale-in entrance: interpolate(frame, [0, 20], [0.85, 1.0])
```

### Recipe 3: Picture-in-Picture (PiP)
**When:** Showing two related pieces of content, comparison, reaction
**SFX pair:** `notification` or `double_click` when PiP appears
**Key code:**
```jsx
// Main video: full screen with slow zoom (1.0 → 1.08)
// PiP: bottom-right, 420x280px, borderRadius 16, spring animation entrance
// PiP border: 3px solid cyan/blue with box-shadow
// spring({ frame, fps, config: { damping: 15, stiffness: 80 } }) for bounce-in
```

### Recipe 4: Split Screen
**When:** Comparison, before/after, two perspectives
**SFX pair:** `air_hit` or `impact` at reveal
**Key code:**
```jsx
// Flex row with gap, each panel: flex 1, borderRadius 16, overflow hidden
// Left: accent border (red/warm), Right: accent border (teal/cool)
// Slide-in entrance: interpolate(frame, [0, 15], [-100, 0]) for each side
// For vertical video in split: center with height: 100%, objectFit: cover
```

### Recipe 5: 3D Perspective Rotate
**When:** Dynamic showcase, tech demo, product reveal
**SFX pair:** `riser` at start, `digital_readout` during rotation
**Key code:**
```jsx
// Parent: perspective: 1200px
// Container: rotateY oscillation via interpolate with 4 keyframes [-12, 5, -5, 8]
// rotateX via noise2D for organic shake
// Scale breathing: [0.92, 1.0, 0.95]
// Purple/blue border glow with box-shadow
```

### Recipe 6: Camera Orbit
**When:** Finale, hero shot, grand reveal
**SFX pair:** `whoosh` sustained, `impact` at end
**Key code:**
```jsx
// 360° orbit: interpolate(frame, [0, durationInFrames], [0, 360])
// orbitX = sin(angle) * 3, rotY = sin(angle) * 8
// Scale breathing with easing
// Chromatic aberration overlay: linear-gradient with sin offset, mixBlendMode: screen
```

### Effect Pairing Guidelines

| Visual Effect | Best SFX | Energy Level |
|---|---|---|
| Ken Burns (slow zoom) | `whoosh`, `riser` | Low/medium |
| Bordered crop reveal | `camera_shutter`, `ding` | Medium |
| PiP entrance | `notification`, `double_click` | Medium |
| Split screen | `air_hit`, `impact` | High |
| 3D perspective | `digital_readout`, `riser` | Medium/high |
| Camera orbit | `whoosh`, `impact` | High |
| Text appearance | `digital_readout`, `keyboard` | Low |
| Image reveal | `camera_shutter`, `digital_shutter` | Medium |

---

## Camera Effects (3D Transforms)

Camera effects add 3D perspective transforms to video/image/scene items — zoom, pan, rotate, tilt. These are separate from enter/exit animations and work via the `useCameraEffectStore`.

### How Camera Effects Work
- Each item can have a `cameraEffect` with `enabled: true`
- The effect stores keyframes for `rotateX`, `rotateY`, `rotateZ`, `scale`, `translateX/Y`, `opacity`
- `computeCameraTransform(frame, effect, fps)` interpolates between keyframes
- The transform is applied as a CSS 3D transform with `perspective`

### Camera Effect vs Animation
| Feature | Enter/Exit Animation | Camera Effect |
|---|---|---|
| Scope | Item entrance/exit only | Throughout item duration |
| Control | Preset names | Per-keyframe values |
| 3D | No | Yes (perspective, rotateX/Y/Z) |
| Persistence | Lost on save/restore | Stored in camera effect store |
| Best for | Simple reveals | Cinematic motion, Ken Burns, orbits |

### Usage via Commands
```bash
# Camera effects are NOT directly available via simple editor commands yet.
# Use bundled scenes (scene.addBundledScene) for camera-like motion:
# - Ken Burns: interpolate scale + translate over time
# - Orbit: interpolate rotateY 0→360 with perspective
# - Dolly zoom: scale up while translating back
# These are implemented in the scene JSX, not as a separate effect layer.
```

## Transitions Between Items

### `editor.addTransition`
Add a transition between two specific adjacent items.
```json
{ "type": "editor.addTransition", "params": {
  "fromId": "vid_001",
  "toId": "vid_002",
  "kind": "crossfade",
  "duration": 500
}}
```

### `editor.addTransitionBetween`
Smart version — add a transition after an item (auto-finds the next clip on the same track).
```json
{ "type": "editor.addTransitionBetween", "params": {
  "itemId": "vid_001",
  "kind": "crossfade",
  "duration": 500
}}
```

### `editor.removeTransition`
```json
{ "type": "editor.removeTransition", "params": { "transitionId": "trans_abc" } }
// OR by item pair:
{ "type": "editor.removeTransition", "params": { "fromId": "vid_001", "toId": "vid_002" } }
```

## Preset Discovery

### `query.listAnimationPresets`
List all available animation presets (enter, exit, loop) with their names.
```json
{ "type": "query.listAnimationPresets", "params": {} }
```
**Returns:** `{ presets: { in: [...], out: [...], loop: [...] } }` — use these names in `editor.setAnimation`.
