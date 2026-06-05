---
name: animation-helpers
description: Exact SkillTown sandbox animation helper signatures and usage notes
tags: remotion, helpers, fade, slide, spring, draw
---

# Animation Helpers

Assume this inside your sandbox scene:

```jsx
const frame = useCurrentFrame();
const { fps, durationInFrames } = useVideoConfig();
```

## Fade
- `fadeIn(frame, delay = 0, duration = 12) -> number`
  ```jsx
  const opacity = fadeIn(frame, 0, 12);
  ```
- `fadeOut(frame, endFrame, duration = 8) -> number`
  ```jsx
  const opacity = fadeOut(frame, durationInFrames, 8);
  ```

## Slide
- `slideUp(frame, delay = 0, distance = 20, duration = 15) -> number`
  ```jsx
  const y = slideUp(frame, 0, 20, 15);
  ```
- `slideLeft(frame, delay = 0, distance = 30, duration = 15) -> number`
  ```jsx
  const x = slideLeft(frame, 0, 30, 15);
  ```
- `slideFromLeft(frame, delay = 0, distance = 80, duration = 8) -> number`
  ```jsx
  const x = slideFromLeft(frame, 6, 80, 8);
  ```
- `slideFromRight(frame, delay = 0, distance = 30, duration = 15) -> number`
  ```jsx
  const x = slideFromRight(frame, 8, 30, 15);
  ```
- `slideFromBottom(frame, delay = 0, distance = 30, duration = 15) -> number`
  ```jsx
  const y = slideFromBottom(frame, 4, 30, 15);
  ```

## Scale / Pop
- `scaleIn(frame, delay = 0, duration = 12, from = 0.9) -> number`
  ```jsx
  const scale = scaleIn(frame, 0, 12, 0.9);
  ```
- `springPop(frame, fps, delay = 0) -> number`
  ```jsx
  const scale = springPop(frame, fps, 0);
  ```
- `scalePop(frame, delay = 0, duration = 6) -> number`
  ```jsx
  const scale = scalePop(frame, 0, 6);
  ```
- `ctaPop(frame, fps, delay = 0) -> number`
  ```jsx
  const scale = ctaPop(frame, fps, 12);
  ```
- `nodePopIn(frame, fps, delay = 0) -> number`
  ```jsx
  const scale = nodePopIn(frame, fps, 6);
  ```
- `numberPop(frame, fps, delay = 0) -> number`
  ```jsx
  const scale = numberPop(frame, fps, 10);
  ```

## Camera
- `kenBurns(frame, durationInFrames, from = 1.0, to = 1.04) -> number`
  ```jsx
  const scale = kenBurns(frame, durationInFrames, 1, 1.06);
  ```
- `cameraZoom(frame, durationInFrames, start = 1.0, peak = 1.08, end = 1.02) -> number`
  ```jsx
  const scale = cameraZoom(frame, durationInFrames, 1, 1.08, 1.02);
  ```

## Ambient
- `drift(frame, amplitude = 3, speed = 0.02) -> number`
  ```jsx
  const driftY = drift(frame, 3, 0.02);
  ```
- `breathe(frame, amplitude = 0.03, speed = 0.03) -> number`
  ```jsx
  const breatheScale = 1 + breathe(frame, 0.03, 0.03);
  ```
- `glowPulse(frame, min = 0.6, max = 1.0, speed = 0.04) -> number`
  ```jsx
  const glow = glowPulse(frame, 0.6, 1, 0.04);
  ```
- `shimmer(frame, speed = 0.8) -> number`
  ```jsx
  const shimmerOpacity = shimmer(frame, 0.8);
  ```
- `flicker(frame, min = 0.85, max = 1.0) -> number`
  ```jsx
  const opacity = flicker(frame, 0.85, 1);
  ```

## Timing
- `staggerDelay(index, baseDelay = 0, gap = 3) -> number`
  ```jsx
  const delay = staggerDelay(2, 8, 3);
  ```

## Draw
- `lineDraw(frame, delay, duration = 20) -> number`
  ```jsx
  const progress = lineDraw(frame, 0, 20);
  ```
- `strokeDraw(frame, delay, length, duration = 20) -> { dashoffset, dasharray }`
  ```jsx
  const stroke = strokeDraw(frame, 0, 320, 20);
  ```
- `checkDraw(frame, delay) -> number`
  ```jsx
  const progress = checkDraw(frame, 12);
  ```
- `drawOn(frame, delay = 0, duration = 10) -> number`
  ```jsx
  const progress = drawOn(frame, 0, 10);
  ```

## Special
- `highlightBoxScale(frame, delay) -> number`
  ```jsx
  const scale = highlightBoxScale(frame, 0);
  ```
- `beatFlash(frame, bpm = 130) -> number`
  ```jsx
  const flash = beatFlash(frame, 130);
  ```
- `captionFade(frame, delay) -> number`
  ```jsx
  const opacity = captionFade(frame, 8);
  ```
- `captionExit(frame, exitAt) -> number`
  ```jsx
  const opacity = captionExit(frame, 70);
  ```
- `bubbleBounce(frame, fps, delay = 0) -> number`
  ```jsx
  const scale = bubbleBounce(frame, fps, 10);
  ```

## Helper Demo

```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const opacity = fadeIn(frame, 0, 12) * fadeOut(frame, durationInFrames, 10);
  const y = slideUp(frame, 0, 24, 15) + drift(frame, 3, 0.02);
  const scale = springPop(frame, fps, 0) * (1 + breathe(frame, 0.02, 0.03));
  return <AbsoluteFill style={{ backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center' }}><div style={{ opacity, transform: `translateY(${y}px) scale(${scale})`, fontSize: 80, fontWeight: 900, color: COLORS.textPrimary, fontFamily }}>Helper Stack</div></AbsoluteFill>;
};
```
