---
name: components
description: Sandbox-ready shared components injected by SkillTown Desktop
tags: remotion, components, backgrounds, overlays, captions, ui
---

# Components

All examples are valid sandbox snippets: no imports, define `Scene` directly.

## Backgrounds
### `PurpleGradientBg`
Props: `intensity?: number`, `opacity?: number`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000' }}><PurpleGradientBg intensity={0.45} /></AbsoluteFill>;
```
### `GradientBg`
Props: `from?`, `via?`, `to?`, `angle?`
```jsx
const Scene = () => <AbsoluteFill><GradientBg from="#E040FB" via="#7C4DFF" to="#448AFF" angle={135} /></AbsoluteFill>;
```
### `GrayGridBg`
Props: `bgColor?`, `lineColor?`, `spacing?`, `opacity?`
```jsx
const Scene = () => <AbsoluteFill><GrayGridBg /></AbsoluteFill>;
```
### `DarkGridBg`
Props: `bgColor?`, `lineColor?`, `spacing?`, `opacity?`
```jsx
const Scene = () => <AbsoluteFill><DarkGridBg /></AbsoluteFill>;
```
### `WavyLineBackground`
Props: `animate?`, `lineColor?`, `lineColorLight?`
```jsx
const Scene = () => <AbsoluteFill><WavyLineBackground /></AbsoluteFill>;
```

## Particles / overlays
### `FloatingParticles`
Props: `count?: number`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000' }}><FloatingParticles count={18} /></AbsoluteFill>;
```
### `ParticleTriangles`
Props: `count?: number`
```jsx
const Scene = () => <AbsoluteFill><ParticleTriangles count={12} /></AbsoluteFill>;
```
### `Vignette`
Props: `opacity?: number`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#111' }}><Vignette opacity={1} /></AbsoluteFill>;
```
### `GridOverlay`
Props: `opacity?: number`, `spacing?: number`
```jsx
const Scene = () => <AbsoluteFill><GradientBg /><GridOverlay /></AbsoluteFill>;
```
### `CyberpunkOverlay`
Props: `color?`, `scanLines?`, `grid?`, `intensity?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#111' }}><CyberpunkOverlay intensity={0.3} /></AbsoluteFill>;
```

## Layout
### `SplitScreenLayout`
Props: `topContent`, `bottomContent`, `subtitleText?`, `splitRatio?`, `showGlowDivider?`
```jsx
const Scene = () => <SplitScreenLayout topContent={<div style={{ width: '100%', height: '100%', background: '#111', color: '#fff' }}>Top</div>} bottomContent={<div style={{ width: '100%', height: '100%', background: '#0ea5e9', color: '#000' }}>Bottom</div>} subtitleText="Split Screen" />;
```
### `BlueBorderFrame`
Props: `screenshotSrc?`, `label?`, `borderColor?`
```jsx
const Scene = () => <AbsoluteFill><BlueBorderFrame label="ChatGPT UI" /></AbsoluteFill>;
```
### `ThreeZoneStack`
Props: `topContent`, `captionContent`, `bottomContent`, `brandLogo?`, `animateBackground?`, `captionColor?`
```jsx
const Scene = () => <ThreeZoneStack topContent={<div style={{ width: '100%', height: '100%', background: '#1e293b' }} />} captionContent={<div style={{ color: '#fff', fontSize: 34, fontWeight: 700, fontFamily }}>Middle caption</div>} bottomContent={<div style={{ width: '100%', height: '100%', background: '#334155' }} />} />;
```

## UI elements
### `TopLabel`
Props: `text`, `delay?`, `fontSize?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#fff' }}><TopLabel text="SIMPLE PROMPT" /></AbsoluteFill>;
```
### `SubtitleBar`
Props: `text`, `delay?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#0f172a' }}><SubtitleBar text="No cloud. No API keys." /></AbsoluteFill>;
```
### `YellowButton`
Props: `label`, `index?`, `baseDelay?`, `variant?`, `fontSize?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#001835', justifyContent: 'center', alignItems: 'center' }}><YellowButton label="Generate" /></AbsoluteFill>;
```
### `InstagramCTA`
Props: `handle?`, `profileSrc?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000' }}><InstagramCTA handle="@skilltownapp" /></AbsoluteFill>;
```
### `SpeechBubbleCTA`
Props: `text?`, `highlightWord?`, `delay?`, `show?`, `speakerInsetSrc?`, `speakerMainSrc?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#111' }}><SpeechBubbleCTA highlightWord="CRAZY" /></AbsoluteFill>;
```
### `BrandLogo`
Props: `name`, `color?`, `iconSrc?`, `iconEmoji?`, `fontSize?`, `customFontFamily?`, `uppercase?`, `delay?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000', alignItems: 'center', paddingTop: 24 }}><BrandLogo name="SkillTown" iconEmoji="⚡" /></AbsoluteFill>;
```

## Text / captions
### `CaptionText`
Props: `segments`, `fontSize?`, `defaultColor?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><CaptionText segments={[{ text: 'This is the caption', startFrame: 0, endFrame: 90 }]} /></AbsoluteFill>;
```
### `HandwrittenText`
Props: `children`, `fontSize?`, `color?`, `fontWeight?`, `allCaps?`, `rotate?`, `opacity?`, `style?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#2B2B2B', justifyContent: 'center', alignItems: 'center' }}><HandwrittenText fontSize={64} allCaps={false}>handwritten note</HandwrittenText></AbsoluteFill>;
```
### `HighlightBox`
Props: `children`, `delay?`, `color?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}><div style={{ fontSize: 64, fontWeight: 800, color: '#fff', fontFamily }}>Use <HighlightBox>this phrase</HighlightBox></div></AbsoluteFill>;
```
### `MinimalCaption`
Props: `text`, `pill?`, `bottom?`, `fontSize?`, `bold?`, `delay?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#111' }}><MinimalCaption text="Fast local editing" /></AbsoluteFill>;
```
### `ComparisonLabel`
Props: `topLabel`, `topSubLabel?`, `bottomLabel`, `bottomSubLabel?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000' }}><ComparisonLabel topLabel="Before" bottomLabel="After" /></AbsoluteFill>;
```
### `NumberOverlay`
Props: `number`, `delay?`, `color?`, `fontSize?`, `topPosition?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#111' }}><NumberOverlay number={7} /></AbsoluteFill>;
```
### `TikTokCaptions`
Props: `captions`, `style?`, `styleOverrides?`, `combineTokensWithinMs?`, `verticalPosition?`, `maxCharsPerLine?`, `timeOffsetMs?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000' }}><TikTokCaptions captions={[{ text: 'Build', startMs: 0, endMs: 500, timestampMs: 0, confidence: 1 }, { text: 'faster', startMs: 500, endMs: 1000, timestampMs: 500, confidence: 1 }]} style="karaoke" /></AbsoluteFill>;
```
### `HindiSubtitleBar`
Props: `text`, `top?`, `bottom?`, `fontSize?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000' }}><HindiSubtitleBar text="AI TOOLS" bottom="8%" /></AbsoluteFill>;
```

## Code
### `SyntaxHighlighter`
Props: `lines`, `mode?`, `highlightLine?`, `highlightColor?`, `fontSize?`, `showLineNumbers?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#001835', justifyContent: 'center', padding: 80 }}><SyntaxHighlighter lines={manifestJsonLines.slice(0, 6)} /></AbsoluteFill>;
```
### `ConsoleOutput`
Props: `lines`, `fontSize?`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#0B1220', justifyContent: 'center', padding: 80 }}><ConsoleOutput lines={[{ text: '$ npm run build', delay: 0 }, { text: 'Build succeeded', delay: 12 }]} /></AbsoluteFill>;
```

## Effects
### `FilmGrain`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#111' }}><FilmGrain opacity={0.05} /></AbsoluteFill>;
```
### `ChromaticAberration`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#111' }}><ChromaticAberration strength={2} /></AbsoluteFill>;
```
### `SpeakerPIP`
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#000' }}><SpeakerPIP /></AbsoluteFill>;
```

## Also Injected As Globals
- `ChromePuzzleLogo`, `NeonLimeCircle`, `BackgroundWatermark`
- `BCPlaceholderImage`, `PlaceholderImage`, `SpeakerPlaceholder`
- `TealSpeakerZone`, `AppLogoPill`, `InChatGPTLabel`
