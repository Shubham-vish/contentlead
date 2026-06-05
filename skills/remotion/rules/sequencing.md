---
name: sequencing
description: Timing, sections, and local frame behavior with Sequence in the sandbox
tags: sequence, timing, stagger, frames, remotion
---

# Sequencing

## Core facts
- `<Sequence from={30} durationInFrames={60}>` offsets children by 30 frames.
- Inside a `Sequence`, `useCurrentFrame()` starts again from `0`.
- Frame math: `seconds * fps = frames`.
- Example: `2s` at `30fps` = `60` frames.
- Use `staggerDelay(index, baseDelay, gap)` for repeated elements.

## Example: two sections
```jsx
const Card = ({ title, color }) => { const frame = useCurrentFrame(); return <div style={{ opacity: fadeIn(frame, 0, 8), color, fontSize: 80, fontWeight: 900, fontFamily }}>{title}</div>; };
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Sequence from={0} durationInFrames={45}><Card title="Section A" color="#fff" /></Sequence><Sequence from={45} durationInFrames={45}><Card title="Section B" color="#BC4AEF" /></Sequence></AbsoluteFill>;
```

## Example: nested sequences
```jsx
const Inner = ({ text }) => { const frame = useCurrentFrame(); return <div style={{ opacity: fadeIn(frame, 0, 8), color: '#fff', fontSize: 58, fontFamily }}>{text}</div>; };
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}><Sequence from={20} durationInFrames={80}><Sequence from={0} durationInFrames={24}><Inner text="First" /></Sequence><Sequence from={24} durationInFrames={24}><Inner text="Second" /></Sequence><Sequence from={48} durationInFrames={24}><Inner text="Third" /></Sequence></Sequence></AbsoluteFill>;
```

## Example: staggered row
```jsx
const Scene = () => { const frame = useCurrentFrame(); const items = ['Plan', 'Edit', 'Render']; return <AbsoluteFill style={{ backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}><div style={{ display: 'flex', gap: 24 }}>{items.map((item, index) => { const delay = staggerDelay(index, 0, 6); return <div key={item} style={{ opacity: fadeIn(frame, delay, 8), transform: `translateY(${slideUp(frame, delay, 18, 10)}px)`, color: '#fff', fontSize: 56, fontWeight: 800, fontFamily }}>{item}</div>; })}</div></AbsoluteFill>; };
```

## Pattern: fade between sections
```jsx
const Section = ({ title, color }) => { const frame = useCurrentFrame(); const opacity = interpolate(frame, [0, 10, 40, 50], [0, 1, 1, 0], { extrapolateRight: 'clamp' }); return <div style={{ opacity, color, fontSize: 82, fontWeight: 900, fontFamily }}>{title}</div>; };
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Sequence from={0} durationInFrames={50}><Section title="Hook" color="#fff" /></Sequence><Sequence from={50} durationInFrames={50}><Section title="Proof" color="#FFD27F" /></Sequence><Sequence from={100} durationInFrames={50}><Section title="CTA" color="#BC4AEF" /></Sequence></AbsoluteFill>;
```
