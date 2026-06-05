---
name: patterns
description: Ready-to-paste sandbox scene patterns for common SkillTown video tasks
tags: patterns, examples, scenes, sandbox, remotion
---

# Patterns

## 1) Title card + particles
```jsx
const Scene = () => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const scale = springPop(frame, fps, 0); return <AbsoluteFill style={{ backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center' }}><PurpleGradientBg intensity={0.4} /><FloatingParticles count={18} /><div style={{ transform: `scale(${scale})`, color: '#fff', fontSize: 88, fontWeight: 900, fontFamily }}>SkillTown</div></AbsoluteFill>; };
```

## 2) Kinetic typography
```jsx
const Scene = () => { const words = ['PLAN', 'EDIT', 'EXPORT']; return <AbsoluteFill style={{ backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}>{words.map((word, i) => <Sequence key={word} from={i * 20} durationInFrames={20}><div style={{ color: i === 1 ? '#BC4AEF' : '#fff', fontSize: 100, fontWeight: 900, fontFamily }}>{word}</div></Sequence>)}</AbsoluteFill>; };
```

## 3) Counter / stats
```jsx
const Scene = () => { const frame = useCurrentFrame(); const value = Math.round(interpolate(frame, [0, 75], [0, 980], { extrapolateRight: 'clamp' })); return <AbsoluteFill style={{ backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}><div style={{ color: '#FFD27F', fontSize: 128, fontWeight: 900, fontFamily }}>{value}</div></AbsoluteFill>; };
```

## 4) Staggered list reveal
```jsx
const Scene = () => { const frame = useCurrentFrame(); const items = ['List scenes', 'Preview code', 'Add custom scene']; return <AbsoluteFill style={{ backgroundColor: '#0f172a', padding: 110, justifyContent: 'center' }}>{items.map((item, i) => <div key={item} style={{ opacity: fadeIn(frame, staggerDelay(i, 0, 10), 10), transform: `translateY(${slideUp(frame, staggerDelay(i, 0, 10), 24, 12)}px)`, color: '#fff', fontSize: 44, marginBottom: 24, fontFamily: bodyFont }}>• {item}</div>)}</AbsoluteFill>; };
```

## 5) Split comparison
```jsx
const Scene = () => <AbsoluteFill><SplitScreenLayout topContent={<div style={{ width: '100%', height: '100%', background: '#111', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 72, fontFamily }}>Before</div>} bottomContent={<div style={{ width: '100%', height: '100%', background: '#22c55e', color: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 72, fontFamily }}>After</div>} subtitleText="BEFORE / AFTER" /></AbsoluteFill>;
```

## 6) Lower third name bar
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#111' }}><MinimalCaption text="Shubham • Product Demo" bottom="8%" bold /></AbsoluteFill>;
```

## 7) CTA with pulsing button
```jsx
const Scene = () => { const frame = useCurrentFrame(); const pulse = 1 + breathe(frame, 0.03, 0.05); return <AbsoluteFill style={{ backgroundColor: '#001835', justifyContent: 'center', alignItems: 'center' }}><div style={{ transform: `scale(${pulse})` }}><YellowButton label="Try SkillTown" /></div></AbsoluteFill>; };
```

## 8) Code showcase
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#001835', padding: 80, justifyContent: 'center' }}><SyntaxHighlighter lines={manifestJsonLines.slice(0, 8)} highlightLine={4} /></AbsoluteFill>;
```

## 9) Image showcase + Ken Burns
```jsx
const Scene = () => { const frame = useCurrentFrame(); const { durationInFrames } = useVideoConfig(); const scale = kenBurns(frame, durationInFrames, 1, 1.06); return <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#000' }}><Img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }} /><Vignette opacity={1} /></AbsoluteFill>; };
```

## 10) Film-grain cinematic look
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#111' }}><PurpleGradientBg intensity={0.2} /><FilmGrain opacity={0.06} /><ChromaticAberration strength={2} /><Vignette opacity={1} /></AbsoluteFill>;
```

## 11) Progress bar
```jsx
const Scene = () => { const frame = useCurrentFrame(); const p = interpolate(frame, [0, 90], [0, 100], { extrapolateRight: 'clamp' }); return <AbsoluteFill style={{ backgroundColor: '#0b1020', justifyContent: 'center', padding: 90 }}><div style={{ color: '#fff', fontSize: 54, fontWeight: 800, fontFamily, marginBottom: 20 }}>Uploading Assets</div><div style={{ height: 24, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}><div style={{ width: `${p}%`, height: '100%', background: '#8A2BE2', borderRadius: 999 }} /></div></AbsoluteFill>; };
```

## 12) Quote card with handwritten style
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#2B2B2B', justifyContent: 'center', alignItems: 'center', padding: 120 }}><HandwrittenText fontSize={68} allCaps={false} rotate={-1}>"Make every frame intentional."</HandwrittenText></AbsoluteFill>;
```
