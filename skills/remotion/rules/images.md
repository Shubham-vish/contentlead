---
name: images
description: Correct image usage patterns for sandbox scenes in SkillTown Desktop
tags: images, Img, staticFile, ken-burns, sandbox
---

# Images

## Rules
- Use **`Img`**, not `<img>`.
- Remote URLs work directly.
- `staticFile()` only works for files inside `remotion-workspace/public/`.
- Size images with `style={{ width, height, objectFit }}`.
- Use `kenBurns()` or `cameraZoom()` for frame-driven motion.

## Remote image
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000' }}><Img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></AbsoluteFill>;
```

## Local image via app endpoint
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000' }}><Img src="http://127.0.0.1:54110/api/local-file?path=/Users/shubham/Pictures/example.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></AbsoluteFill>;
```
Replace the host/port/path with your current app values.

## `staticFile()` for `remotion-workspace/public/`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000' }}><Img src={staticFile('logo.png')} style={{ width: 320, height: 320, objectFit: 'contain' }} /></AbsoluteFill>;
```

## Ken Burns image
```jsx
const Scene = () => { const frame = useCurrentFrame(); const { durationInFrames } = useVideoConfig(); const scale = kenBurns(frame, durationInFrames, 1, 1.08); return <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#000' }}><Img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }} /><Vignette opacity={1} /></AbsoluteFill>; };
```

## Framed showcase image
```jsx
const Scene = () => { const frame = useCurrentFrame(); return <AbsoluteFill style={{ backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}><Img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200" style={{ width: 860, height: 1200, objectFit: 'cover', borderRadius: 28, transform: `translateY(${slideUp(frame, 0, 24, 12)}px)`, opacity: fadeIn(frame, 0, 12), boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }} /></AbsoluteFill>; };
```

## Image sequence pattern
```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const images = ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200'];
  const index = Math.min(images.length - 1, Math.floor(frame / 45));
  const opacity = interpolate(frame % 45, [0, 8, 36, 44], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ backgroundColor: '#000' }}><Img src={images[index]} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity }} /><Vignette opacity={1} /></AbsoluteFill>;
};
```
