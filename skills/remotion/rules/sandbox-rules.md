---
name: sandbox-rules
description: Critical rules for SkillTown Desktop sandbox scenes
tags: remotion, sandbox, scene.addCustomScene, custom-scene, rules
---

# Sandbox Rules

Use this format for `scene.addCustomScene` and `scene.previewCode`:

```jsx
const Scene = () => {
  return <AbsoluteFill />;
};
```

## Hard Rules

- **MUST define `const Scene = () => { ... }`** — `compileScene()` looks for a variable named `Scene`.
- **NO imports** — `compileScene()` strips them before Babel, but omit them.
- **NO exports** — the sandbox is script mode, not a module.
- **NO `return Scene;` at the end** — this is a common source of `return outside of function` failures.
- **NO `const { ... } = Remotion;`** — there is no `Remotion` object in scope.
- **Use frame-driven motion only** — not CSS animations/transitions.
- **Props are not passed to timeline sandbox scenes** — use constants, arrays, or `useVideoConfig()`.
- **Helper components can be declared before `Scene`**:

```jsx
const Badge = ({ text }) => (
  <div style={{ padding: '12px 20px', borderRadius: 999, background: '#8A2BE2', color: '#fff' }}>
    {text}
  </div>
);

const Scene = () => (
  <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
    <Badge text="Sandbox OK" />
  </AbsoluteFill>
);
```

## How The Sandbox Actually Works

- `scene.addCustomScene` sends raw code to `/api/execute`.
- `commandExecutorScenes.ts` pre-validates with `compileScene(params.code)`.
- `compileScene()`:
  1. strips import/export lines,
  2. runs Babel with `react` + `typescript` presets,
  3. executes the transpiled code in `new Function(...)`,
  4. returns the `Scene` variable if found,
  5. **dry-renders** the component to catch `ReferenceError` (e.g. undefined globals).
- This is **not eval** and **not a module**. Think: **single script body with injected globals**.
- Timeline items store your source in `metadata.customSceneCode` and set `metadata.sceneType = '__custom__'`.
- Use `scene.validateCode` to test code before adding to timeline — it returns errors without adding anything.

## ⚠️ CRITICAL: No Namespace Objects

All helpers are **direct globals**, NOT namespaced:
- ✅ `fadeIn(frame, 0, 12)` — correct
- ❌ `AnimationHelpers.fadeIn(frame, 0, 12)` — WILL CRASH: "AnimationHelpers is not defined"
- ✅ `<PurpleGradientBg />` — correct
- ❌ `<SharedComponents.PurpleGradientBg />` — WILL CRASH: "SharedComponents is not defined"
- ✅ `fontFamily: primaryFont` — correct
- ❌ `fontFamily: FONTS.block` — WILL CRASH: "FONTS is not defined"

## Babel / TypeScript Rules

- JSX/TSX is transpiled at runtime.
- Type annotations are stripped.
- This works:

```jsx
const Scene = () => {
  const points = [10, 20, 30] as number[];
  return <AbsoluteFill>{points.join(' • ')}</AbsoluteFill>;
};
```

## Available Sandbox Globals

### React
- `React`, `createElement`, `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`, `Fragment`

### Remotion
- `AbsoluteFill`, `useCurrentFrame`, `useVideoConfig`, `interpolate`, `Easing`, `Sequence`, `spring`, `Img`, `staticFile`

### Theme / style helpers
- `fontFamily`, `primaryFont`, `defaultFontFamily`, `headingFont`, `bodyFont`, `handwrittenFont`, `sansFont`, `scriptFont`, `codeFont`, `impactFont`
- `COLORS`, `SHADOWS`, `LAYOUT`, `mergeColors`, `s`, `resolveFile`, `resolveStyle`

### Animation helpers
- `fadeIn`, `fadeOut`
- `slideUp`, `slideLeft`, `slideFromLeft`, `slideFromRight`, `slideFromBottom`
- `scaleIn`, `springPop`, `scalePop`, `ctaPop`, `nodePopIn`, `numberPop`
- `kenBurns`, `cameraZoom`
- `drift`, `breathe`, `glowPulse`, `shimmer`, `flicker`
- `staggerDelay`
- `lineDraw`, `strokeDraw`, `checkDraw`, `drawOn`
- `highlightBoxScale`, `beatFlash`, `captionFade`, `captionExit`, `bubbleBounce`

### Shared components
- `FloatingParticles`, `PurpleGradientBg`, `Vignette`
- `GrayGridBg`, `DarkGridBg`
- `SplitScreenLayout`, `BlueBorderFrame`, `TopLabel`, `CyberpunkOverlay`, `InstagramCTA`
- `GradientBg`, `ParticleTriangles`
- `ChromePuzzleLogo`, `NeonLimeCircle`, `BackgroundWatermark`
- `SubtitleBar`, `YellowButton`, `ConsoleOutput`, `BCPlaceholderImage`, `SyntaxHighlighter`, `TikTokCaptions`
- `HindiSubtitleBar`, `TealSpeakerZone`, `AppLogoPill`, `InChatGPTLabel`
- `CaptionText`, `HandwrittenText`, `HighlightBox`, `GridOverlay`
- `ComparisonLabel`, `MinimalCaption`, `WavyLineBackground`
- `PlaceholderImage`, `SpeakerPlaceholder`, `SpeechBubbleCTA`, `BrandLogo`, `NumberOverlay`, `ThreeZoneStack`

### Cinematic effects
- `FilmGrain`, `ChromaticAberration`, `SpeakerPIP`

### Data / camera / render helpers
- `manifestJsonLines`
- `resolveKeyframes`, `interpolateCameraProperty`, `getCameraState`, `computeShake`, `shakeScaleForZ`, `computePOI`, `dynamicOrigin`, `computeFocusCamera`, `buildCameraTransform`, `computeTransition`, `vignetteFromZoom`
- `LayersRenderer`, `TextOverlay`, `PIPRenderer`, `HighlightOverlay`, `EffectsRenderer`, `atmosphericFilter`, `depthOfFieldBlur`

### Safe globals
- `Math`, `console`, `Array`, `Object`, `String`, `Number`, `JSON`, `Date`
- `parseInt`, `parseFloat`
- `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`

## Correct vs Wrong

### Correct

```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, 0, 12);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity, color: '#fff', fontSize: 72, fontWeight: 800, fontFamily }}>SkillTown</div>
    </AbsoluteFill>
  );
};
```

### Wrong

```jsx
import { AbsoluteFill } from 'remotion';
const { useCurrentFrame } = Remotion;
export default Scene;
return Scene;
```

## Notes That Matter In Our App

- `scene.addCustomScene` creates an image-type template item on the timeline.
- Custom scenes are background/template tracks: `metadata.isTemplateTrack = true` on the track.
- Default orientation for custom scenes is `portrait` unless you pass `orientation: 'landscape'`.
- Use `scene.previewCode` first when testing risky code.
