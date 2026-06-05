---
name: effects
description: Cinematic effect components available as sandbox globals
tags: effects, film-grain, vignette, chromatic, speaker-pip
---

# Effects

## Components
- `<FilmGrain />` props: `opacity?`, `speed?`, `frequency?`, `zIndex?`
- `<ChromaticAberration />` props: `strength?`, `zIndex?`
- `<SpeakerPIP />` props: `height?`, `warmth?`, `showTorso?`, `headScale?`, `enterDelay?`, `floatAmplitude?`, `bgGradient?`
- `<Vignette />` props: `opacity?`

## Cinematic stack
```jsx
const Scene = () => { const frame = useCurrentFrame(); return <AbsoluteFill style={{ backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}><PurpleGradientBg intensity={0.18} /><FilmGrain opacity={0.05} speed={7} /><ChromaticAberration strength={2} /><Vignette opacity={1} /><div style={{ opacity: fadeIn(frame, 0, 12), color: '#fff', fontSize: 78, fontWeight: 900, fontFamily, zIndex: 30 }}>Cinematic Look</div></AbsoluteFill>; };
```

## Speaker bubble setup
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000' }}><SpeakerPIP height={900} warmth={0.2} /><FilmGrain opacity={0.04} /><Vignette opacity={1} /></AbsoluteFill>;
```

## Rules
- Stack effects on top of content, not inside animated text wrappers.
- Keep `FilmGrain` subtle (`0.03`–`0.08`).
- Keep `ChromaticAberration` low (`1`–`3`) unless you want a glitchy look.
- Use `Vignette` almost everywhere for export-safe depth.

## Video Effects via Bundled Scenes

For cinematic video effects (not available with plain `editor.addVideo`), embed `<OffthreadVideo>` inside a bundled scene:

| Effect | How |
|--------|-----|
| Ken Burns (zoom/pan) | `interpolate` zoom + translate over duration |
| Camera shake | `noise2D` on X/Y per frame (±1-3px) |
| 3D perspective tilt | `rotateX/rotateY` with `perspective()` CSS |
| Vignette | `radial-gradient` overlay linked to zoom |
| Color grading | CSS `filter: saturate() contrast() brightness()` |
| Chromatic aberration | `boxShadow: inset` with red/cyan at low opacity |
| Film grain | SVG noise pattern with frame-offset `backgroundPosition` |
| Zoom pulses | Multi-keyframe `interpolate` (in → hold → out) |
| Letterbox bars | Top/bottom black divs with animated height |
| Anamorphic streaks | Horizontal gradient bars drifting with frame |

Use `scene.addBundledScene` with `import { noise2D } from '@remotion/noise'` and `import { OffthreadVideo } from 'remotion'`.
