---
name: animations
description: Core frame-driven Remotion animation APIs available in the sandbox
tags: remotion, animation, interpolate, spring, sequence, easing
---

# Animations

## Rules

- **All motion must come from `useCurrentFrame()`**.
- **Do not use CSS transitions or CSS animations** — they do not export reliably.
- Prefer `interpolate(..., { extrapolateRight: 'clamp' })` for one-shot motion.
- Use `Sequence` for timed sections.
- Use `Img` instead of `<img>`.

## APIs

### `useCurrentFrame()`
Returns the local frame number, starting at `0`.

### `useVideoConfig()`
Returns `{ fps, width, height, durationInFrames }`.

### `interpolate(input, inputRange, outputRange, options)`
Use for deterministic value mapping.

```jsx
const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
const pulse = interpolate(frame, [0, 30, 60], [0, 1, 0], { extrapolateRight: 'clamp' });
```

Useful options:
- `extrapolateLeft`: `'clamp' | 'extend' | 'identity'`
- `extrapolateRight`: `'clamp' | 'extend' | 'identity'`
- `easing`

### `spring({ frame, fps, config })`
Common configs:
- smooth / no bounce: `{ damping: 200 }`
- bouncy pop: `{ damping: 12, stiffness: 200, mass: 0.5 }`
- very bouncy: `{ damping: 8 }`

### `Easing`
Available: `linear`, `ease`, `in`, `out`, `inOut`, `cubic`, `bezier`, `circle`, `elastic`, `bounce`, `back`, `quad`, `poly`, `sin`, `exp`.

### `Sequence`
Offsets children in time. Inside a `Sequence`, `useCurrentFrame()` resets to `0`.

### `AbsoluteFill`
An absolutely positioned full-canvas div.

### `Img`
Use `Img` for images so Remotion waits for loading.

## Complete Sandbox Examples

### 1) Fade-in text with easing

```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const y = interpolate(frame, [0, 20], [40, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return <AbsoluteFill style={{ backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}><div style={{ opacity, transform: `translateY(${y}px)`, color: '#fff', fontSize: 72, fontWeight: 800, fontFamily }}>Fade In</div></AbsoluteFill>;
};
```

### 2) Spring pop entrance

```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 200, mass: 0.5 } });
  return <AbsoluteFill style={{ backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center' }}><div style={{ transform: `scale(${scale})`, color: COLORS.accentGold, fontSize: 96, fontWeight: 900, fontFamily }}>POP</div></AbsoluteFill>;
};
```

### 3) Multi-stage interpolation

```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18, 60, 84], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, 18, 84], [0.9, 1, 1.05], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return <AbsoluteFill style={{ backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}><div style={{ opacity, transform: `scale(${scale})`, color: '#fff', fontSize: 80, fontWeight: 800, fontFamily }}>Hold Then Exit</div></AbsoluteFill>;
};
```

### 4) Sequenced sections

```jsx
const Section = ({ title, color }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}><div style={{ opacity: fadeIn(frame, 0, 10), color, fontSize: 82, fontWeight: 900, fontFamily }}>{title}</div></AbsoluteFill>;
};
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#050510' }}><Sequence from={0} durationInFrames={45}><Section title="Intro" color="#FFFFFF" /></Sequence><Sequence from={45} durationInFrames={45}><Section title="Middle" color="#BC4AEF" /></Sequence><Sequence from={90} durationInFrames={45}><Section title="Outro" color="#00FFFF" /></Sequence></AbsoluteFill>;
```

### 5) Combining multiple animations

```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 180, mass: 0.6 } });
  const rotate = interpolate(frame, [0, 25], [-8, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.4)) });
  const y = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}><div style={{ opacity, transform: `translateY(${y}px) rotate(${rotate}deg) scale(${scale})`, color: '#FFD27F', fontSize: 78, fontWeight: 900, fontFamily }}>Combined Motion</div></AbsoluteFill>;
};
```
