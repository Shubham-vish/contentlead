---
name: text-animations
description: Sandbox-safe typography patterns for SkillTown scenes
tags: text, captions, typewriter, kinetic, sequence
---

# Text Animations

## 1) Typewriter effect
```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const text = 'Build polished videos locally.';
  const chars = Math.floor(interpolate(frame, [0, 70], [0, text.length], { extrapolateRight: 'clamp' }));
  return <AbsoluteFill style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><div style={{ color: '#fff', fontSize: 64, fontWeight: 800, fontFamily: codeFont }}>{text.slice(0, chars)}<span style={{ opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0 }}>|</span></div></AbsoluteFill>;
};
```

## 2) Word-by-word reveal with `Sequence`
```jsx
const Word = ({ text }) => { const frame = useCurrentFrame(); return <span style={{ opacity: fadeIn(frame, 0, 6), transform: `translateY(${slideUp(frame, 0, 18, 8)}px)`, display: 'inline-block' }}>{text}</span>; };
const Scene = () => { const words = ['Fast.', 'Local.', 'Editable.']; return <AbsoluteFill style={{ backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}><div style={{ display: 'flex', gap: 20, fontSize: 78, fontWeight: 900, color: '#fff', fontFamily }}>{words.map((word, index) => <Sequence key={word} from={index * 14} durationInFrames={40}><Word text={word} /></Sequence>)}</div></AbsoluteFill>; };
```

## 3) Kinetic typography
```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = ['TURN', 'IDEAS', 'INTO', 'VIDEOS'];
  const index = Math.min(words.length - 1, Math.floor(frame / 20));
  const scale = springPop(frame % 20, fps, 0);
  return <AbsoluteFill style={{ backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}><div style={{ color: '#FFD27F', fontSize: 110, fontWeight: 900, fontFamily, transform: `scale(${scale})` }}>{words[index]}</div></AbsoluteFill>;
};
```

## 4) Staggered list reveal
```jsx
const Scene = () => { const frame = useCurrentFrame(); const items = ['No upload', 'No round-trip', 'No cloud render']; return <AbsoluteFill style={{ backgroundColor: '#0F172A', justifyContent: 'center', padding: '0 120px' }}>{items.map((item, index) => { const delay = staggerDelay(index, 0, 10); return <div key={item} style={{ opacity: fadeIn(frame, delay, 10), transform: `translateY(${slideUp(frame, delay, 24, 12)}px)`, color: '#fff', fontFamily: bodyFont, fontSize: 44, marginBottom: 26 }}>• {item}</div>; })}</AbsoluteFill>; };
```

## 5) Gradient text with animated clip
```jsx
const Scene = () => { const frame = useCurrentFrame(); const reveal = interpolate(frame, [0, 40], [0, 100], { extrapolateRight: 'clamp' }); return <AbsoluteFill style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><div style={{ fontSize: 92, fontWeight: 900, fontFamily, background: 'linear-gradient(90deg, #E040FB 0%, #7C4DFF 50%, #448AFF 100%)', WebkitBackgroundClip: 'text', color: 'transparent', clipPath: `inset(0 ${100 - reveal}% 0 0)` }}>Gradient Type</div></AbsoluteFill>; };
```

## 6) Handwritten note
```jsx
const Scene = () => { const frame = useCurrentFrame(); return <AbsoluteFill style={{ backgroundColor: '#2B2B2B', justifyContent: 'center', alignItems: 'center' }}><div style={{ opacity: fadeIn(frame, 0, 10) }}><HandwrittenText fontSize={72} allCaps={false} rotate={-2}>write it like a note</HandwrittenText></div></AbsoluteFill>; };
```
