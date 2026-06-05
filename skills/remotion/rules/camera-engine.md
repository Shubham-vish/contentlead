---
name: camera-engine
description: Perspective zoom and camera helper globals available in the sandbox
tags: camera, perspective, zoom, pan, shake, sandbox, presets, breathe
---

# Camera Engine

These helpers come from `src/scenes/perspective-zoom/camera-engine.ts`.

## Exact helpers
- `getCameraState(frame, durationInFrames, keyframes, intensity?)`
- `buildCameraTransform(state, perspective, shake?, poi?)`
- `computeShake(frame, durationInFrames, config, fps = 30)`
- `computePOI(frame, durationInFrames, poi)`
- `computeTransition(frame, durationInFrames, enter?, exit?, enterDuration = 20, exitDuration = 15)`
- `vignetteFromZoom(zoom, baseIntensity = 0.3, dynamic = true)`

Related globals:
- `resolveKeyframes(...)`
- `interpolateCameraProperty(...)`
- `dynamicOrigin(...)`
- `computeFocusCamera(...)`
- `shakeScaleForZ(...)`

## Understanding the Camera System — Core Logic

The camera system is built on **3 core concepts**. Understanding these lets you create ANY camera movement from scratch, not just use presets.

### Concept 1: Keyframe Interpolation with Holds

Every camera property (zoom, panX, panY, rotateY, rotateX) is a **timeline of values** interpolated with `Easing.inOut(Easing.cubic)`. Each keyframe has a `holdFrames` property — the camera stays at that value before transitioning to the next.

**How it works internally:**
```
Frame 0 ──► Keyframe 1 (zoom=1.0, hold 20 frames)
Frame 20 ──► transition starts (cubic ease-in-out)
Frame 40 ──► Keyframe 2 (zoom=1.5, hold 30 frames)
Frame 70 ──► transition starts
Frame 90 ──► Keyframe 3 (zoom=1.2)
```

**The math** (from `camera-utils.ts`):
```jsx
// Build flat arrays of [frame, value] pairs with hold plateaus
// Then use Remotion's interpolate() with cubic ease-in-out
const value = interpolate(frame, framePositions, valuePositions, {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  easing: Easing.inOut(Easing.cubic)
});
```

**Key insight**: `holdFrames` creates "plateaus" — the camera rests at a value before transitioning. Without holds, movement is continuous. With holds, you get the cinematic "arrive → pause → move" feel.

### Concept 2: CSS Transform Stack

The camera transform is a CSS string built from 5 layered operations applied in order:
```jsx
`perspective(${P}px) rotateY(${ry}deg) rotateX(${rx}deg) scale(${zoom}) translate(${panX}%, ${panY}%)`
```

**Why the order matters:**
1. `perspective()` — Creates 3D depth. Lower values (600-900px) = more dramatic 3D. Higher (1200+) = subtle.
2. `rotateY/rotateX` — Applied BEFORE scale, so tilt affects the scaling plane → creates parallax.
3. `scale` — Zoom applied after rotation → zoomed content still looks 3D.
4. `translate` — Pan applied last → moves the already-zoomed-and-tilted content.

**Creating your own from scratch** (no helpers needed):
```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  // Manual keyframe interpolation — you control everything
  const zoom = interpolate(frame, [0, durationInFrames * 0.4, durationInFrames], [1, 1.3, 1.1], {
    extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)
  });
  const panX = interpolate(frame, [0, durationInFrames], [5, -5], {
    extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)
  });
  const rotateY = interpolate(frame, [0, durationInFrames * 0.5, durationInFrames], [0, -8, -3], {
    extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)
  });
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: `perspective(900px) rotateY(${rotateY}deg) scale(${zoom}) translateX(${panX}%)`,
        transformOrigin: `${50 - panX * 0.3}% 50%`  // Dynamic origin — shifts opposite to pan
      }}>
        {/* Content */}
      </div>
    </AbsoluteFill>
  );
};
```

### Concept 3: Dynamic Transform Origin

`transformOrigin` should shift opposite to the pan direction to prevent content from sliding off-screen:
```jsx
// panX = -5 (panning left) → origin shifts right: 50 - (-5 * 0.3) = 51.5%
// panX = 10 (panning right) → origin shifts left: 50 - (10 * 0.3) = 47%
const origin = `${50 - panX * 0.3}% ${50 - panY * 0.3}%`;
```

This creates natural "looking toward the pan direction" instead of content flying off-frame.

### Concept 4: Camera Safety (Focus Regions)

When zooming into content (screenshots, code), you need to ensure the focus region stays visible. The logic:
1. Define a focus region as `{ x, y, w, h }` in source content percentages (0-100)
2. Project region corners through the camera transform to screen coordinates
3. If any corner goes off-screen, reduce zoom (binary search for max safe zoom)
4. Recalculate pan to center the focus on screen

```jsx
// Focus on a code block that's in the top-right 40% of the image
const focus = { x: 55, y: 10, w: 40, h: 30 };

// Dynamic target: content on LEFT edge → place on RIGHT side of screen (and vice versa)
// This prevents edge cropping and creates a natural "reading sweep"
const targetScreenX = interpolate(focus.x + focus.w/2, [0, 100], [65, 25], { extrapolateRight: 'clamp' });
```

### Concept 5: Vignette from Zoom

Vignette intensity should scale with zoom — zoomed content feels more "focused" with darker edges:
```jsx
const vignetteOpacity = interpolate(zoom, [1.0, 1.5], [0.03, 0.3], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
});
```

## 5 Camera Preset Configs (with the logic behind each)

These are production-tested camera configurations. The key parameters:
- `rotateY` — Fixed Y-axis tilt (degrees). Creates 3D perspective feel.
- `rotateXMax` — Max top-down tilt. Creates subtle "looking down" effect.
- `zoomRange` — `[min, max]` scale factors. How far the camera zooms.
- `panStrength` — How aggressively camera follows the focus region (0-1).
- `smoothing` — Spring damping for tracking (higher = smoother, slower to react).

| Preset | rotateY | zoomRange | panStrength | smoothing | Character |
|--------|---------|-----------|-------------|-----------|-----------|
| **one-side-perspective** | 12° | [1.0, 1.25] | 0.35 | 28 | 3D tilt, gentle. For articles |
| **zoom-track** | 0° | [1.0, 1.6] | 0.5 | 24 | Deep zoom, responsive. For code |
| **cinematic-pan** | 5° | [1.1, 1.3] | 0.6 | 32 | Smooth, slight tilt. Professional |
| **zoom-pulse** | 0° | [1.0, 2.0] | 0.7 | 20 | Dramatic zoom, fast. For reveals |
| **static** | 0° | [1.0, 1.0] | 0 | 30 | No motion. For dense content |

### How to invent your own preset

Combine the parameters based on your intent:
- **Want 3D depth?** → Increase `rotateY` (5-15°). Beyond 15° looks extreme.
- **Want dramatic zoom?** → Widen `zoomRange`. [1.0, 2.0] is max practical.
- **Want responsive tracking?** → Higher `panStrength` (0.5-0.8). But >0.8 feels jittery.
- **Want smooth/cinematic?** → Higher `smoothing` (28-35). Lower (15-20) = more reactive.
- **Want stability?** → Lower everything. `rotateY: 0`, zoom [1.0, 1.1], panStrength 0.2.

**Example — creating a "documentary interview" preset:**
```jsx
// Slow, barely perceptible drift. Feels like a real camera on a tripod with tiny movements.
const docInterview = {
  rotateY: 2,        // Barely noticeable tilt
  rotateXMax: 0.5,   // Almost no top-down
  zoomRange: [1.02, 1.08],  // Very subtle zoom — just enough to feel alive
  panStrength: 0.15, // Barely follows — camera stays mostly fixed
  smoothing: 35      // Very smooth — no sudden movements
};
```

### Copyable `resolveKeyframes` recipes

```jsx
// One-Side Perspective
const keyframes = resolveKeyframes({ zoom: [1, 1.04, 1.02], panX: [0, -3], panY: [0, 1], rotateY: [0, -3], cameraEasing: 'ease-in-out' });

// Zoom Track
const keyframes = resolveKeyframes({ zoom: [1, 1.25, 1.15], panX: [0, -10, -5], panY: [0, 5, 3], rotateY: [0, 0], cameraEasing: 'ease-in-out' });

// Cinematic Pan
const keyframes = resolveKeyframes({ zoom: [1, 1.08], panX: [5, -5], panY: [0, 0], rotateY: [0, 0], cameraEasing: 'ease-in-out' });

// Zoom Pulse (rhythmic — multiple values create oscillation)
const keyframes = resolveKeyframes({ zoom: [1, 1.06, 1.02, 1.05, 1], panX: [0, 0], panY: [0, 0], rotateY: [0, 0], cameraEasing: 'ease-in-out' });

// Static
const keyframes = resolveKeyframes({ zoom: [1], panX: [0], panY: [0], rotateY: [0], cameraEasing: 'linear' });
```

## Content-Type → Preset Mapping

| Content Type | Preset | Why |
|-------------|--------|-----|
| Article / text heavy | One-Side Perspective | `rotateY: 12°` adds depth without distracting from reading |
| Code / terminal | Zoom Track | Deep zoom (`zoomRange: [1, 1.6]`) lets you focus on specific lines |
| Code / diagram | Cinematic Pan | Horizontal `panX: [5, -5]` guides eye across code |
| Speaker / face | Zoom Pulse | Rhythmic zoom oscillation keeps talking heads visually alive |
| Photo / image | One-Side Perspective | Ken Burns-like parallax from perspective tilt |
| Complex diagram | Static | No motion — viewer needs to read dense content |

## 4-Phase Motion Pattern

Structure camera keyframes in 4 phases for natural motion:

1. **Establish** (0–15% of scene) — Wide shot, `ease-out` entry (fast start, gentle landing)
2. **Approach** (15–40%) — Zoom toward subject, `ease-in-out` (smooth)
3. **Focus** (40–80%) — Hold on key content + BREATHE micro-movements
4. **Exit** (80–100%) — Pull back, `ease-in` (accelerate out)

**Building this manually:**
```jsx
const progress = frame / durationInFrames;
const phase = progress < 0.15 ? 'establish' : progress < 0.4 ? 'approach' : progress < 0.8 ? 'focus' : 'exit';

// Each phase has its own easing curve
const zoom = progress < 0.15
  ? interpolate(frame, [0, durationInFrames * 0.15], [1, 1.05], { easing: Easing.out(Easing.cubic) })
  : progress < 0.4
  ? interpolate(frame, [durationInFrames * 0.15, durationInFrames * 0.4], [1.05, 1.25], { easing: Easing.inOut(Easing.cubic) })
  : progress < 0.8
  ? 1.25 + 0.01 * Math.sin(frame * 0.05)  // BREATHE during hold
  : interpolate(frame, [durationInFrames * 0.8, durationInFrames], [1.25, 1.1], { easing: Easing.in(Easing.cubic) });
```

## BREATHE Mechanism

For holds longer than 2 seconds (~60 frames at 30fps), add micro-movements to prevent static feeling. The math is simple sine waves:

```jsx
// breathe(frame, amplitude, frequency) — subtle zoom oscillation
const microZoom = 1 + amplitude * Math.sin(frame * frequency * Math.PI);
// Example: 1 + 0.008 * Math.sin(frame * 0.02 * Math.PI) → oscillates ±0.8% zoom

// drift(frame, amplitude, frequency) — gentle vertical sway
const microDrift = amplitude * Math.sin(frame * frequency * Math.PI);
// Example: 1.5 * Math.sin(frame * 0.015 * Math.PI) → sways ±1.5px vertically
```

**Why these specific values work:**
- Zoom amplitude 0.005-0.01 → imperceptible but prevents "frozen" feeling
- Drift amplitude 1-2px → viewer can't consciously see it but the scene feels alive
- Frequency 0.01-0.03 → one full cycle every 100-300 frames (3-10 seconds) → slow enough to feel organic

```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const keyframes = resolveKeyframes({ zoom: [1, 1.18, 1.08], panX: [0, -8], panY: [0, 4], rotateY: [0, -4], cameraEasing: 'ease-in-out' });
  const camera = getCameraState(frame, durationInFrames, keyframes);
  const transform = buildCameraTransform(camera, 1200);
  
  // BREATHE: subtle micro-movements during holds
  const microZoom = 1 + 0.008 * Math.sin(frame * 0.02 * Math.PI);
  const microDrift = 1.5 * Math.sin(frame * 0.015 * Math.PI);
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: `${transform} scale(${microZoom}) translateY(${microDrift}px)`,
        transformOrigin: '50% 50%'
      }}>
        {/* Your content here */}
      </div>
      <Vignette opacity={vignetteFromZoom(camera.zoom, 0.35, true)} />
    </AbsoluteFill>
  );
};
```

## Full Example — Building a Custom Camera from Scratch

This example builds a camera movement WITHOUT using any helper functions — pure `interpolate()` and math:

```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  
  // 1. ZOOM: Start wide, zoom to 1.3x at 40%, ease back to 1.15x
  const zoom = interpolate(frame, [0, dur * 0.4, dur], [1, 1.3, 1.15], {
    extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)
  });
  
  // 2. PAN: Drift left (negative X) to follow content
  const panX = interpolate(frame, [0, dur], [3, -5], {
    extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)
  });
  
  // 3. PERSPECTIVE TILT: Subtle 3D rotation for depth
  const rotateY = interpolate(frame, [0, dur * 0.3, dur], [0, -6, -3], {
    extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)
  });
  
  // 4. BREATHE: Micro-movements during the hold phase (40-80% of scene)
  const breatheZoom = 1 + 0.006 * Math.sin(frame * 0.018 * Math.PI);
  const breatheDrift = 1.2 * Math.sin(frame * 0.012 * Math.PI);
  
  // 5. VIGNETTE: Darken edges proportional to zoom
  const vignette = interpolate(zoom, [1, 1.5], [0.05, 0.3], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
  });
  
  // 6. DYNAMIC ORIGIN: Shifts opposite to pan direction
  const originX = 50 - panX * 0.3;
  
  // 7. ENTER/EXIT transitions
  const enterOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const exitOpacity = interpolate(frame, [dur - 15, dur], [1, 0], { extrapolateLeft: 'clamp' });
  const opacity = Math.min(enterOpacity, exitOpacity);
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', opacity }}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: `perspective(900px) rotateY(${rotateY}deg) scale(${zoom * breatheZoom}) translateX(${panX}%) translateY(${breatheDrift}px)`,
        transformOrigin: `${originX}% 50%`
      }}>
        <PurpleGradientBg intensity={0.4} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: 86, fontWeight: 900, fontFamily }}>
          Camera Move
        </div>
      </div>
      {/* Vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${vignette}) 100%)`,
        pointerEvents: 'none'
      }} />
    </AbsoluteFill>
  );
};
```

> **Deep reference**: For the full camera safety system (focus regions, safe zoom clamping, content layout math), see `_Pipelines/pipeline/camera_plan.py` and `_Pipelines/pipeline/camera_safety.py`.
