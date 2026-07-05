---
name: animations-and-effects
description: Enter/exit/loop animations, keyframe property animation, and visual effects
tags: animation, effect, keyframe, fadeIn, fadeOut, slide, scale, blur, brightness, contrast, grayscale, sepia, loop, pulse, glitch, spin
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
| `type` | `string` | required | `in`, `out`, or `loop` |

Example:

```json
{
  "type": "editor.removeAnimation",
  "params": {
    "itemId": "text_hero",
    "type": "loop"
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
| `frame` | `number` | required | Frame number relative to item start |
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

Remove a keyframe from a property at a frame.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | required | Target timeline item |
| `property` | `string` | required | `opacity`, `x`, `y`, or `scale` |
| `frame` | `number` | required | Frame number to remove |

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
| `itemId` | `string` | required | Target timeline item |
| `effect_type` | `string` | required | `blur`, `brightness`, `contrast`, `grayscale`, or `sepia` |

Example:

```json
{
  "type": "editor.addEffect",
  "params": {
    "itemId": "video_broll",
    "effect_type": "grayscale"
  }
}
```

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
    "effect_type": "grayscale"
  }
}
```

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
      "effect_type": "contrast"
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
