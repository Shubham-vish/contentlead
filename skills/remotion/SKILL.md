---
name: remotion
description: Remotion scene creation knowledge for the ContentLead video editor. Covers animations (interpolate, spring, easing), 30+ animation helpers, 40+ shared components, camera engine, effects, charts, text animations, transitions, captions, and SFX. These scenes are created and added to the ContentLead editor timeline via commands like `scene.addCustomScene`, `scene.addBundledScene`, and `scene.addLibraryScene`. For editor connection and command execution, load the `contentlead` skill first. For creative planning and storyboarding, load the `content-direction` skill.
tags: remotion, scenes, animation, effects, camera, charts, captions, transitions, contentlead
---

# Remotion Scenes for ContentLead Editor

These skills teach you how to create animated scenes using Remotion — React components that render as video frames. Scenes created here are added to the **ContentLead editor timeline** via the editor's API commands.

**Prerequisites:** Load the `contentlead` skill to understand how to connect to the editor and execute commands. Scenes are added via `POST /api/execute` with scene command types.

## Three Ways to Create Scenes

### 1. Sandbox Scenes (simplest) — `scene.addCustomScene`
- JSX code strings compiled at runtime in the browser via Babel
- **NO imports** — all APIs injected as globals
- Define `const Scene = () => { ... }` — no exports
- Best for simple text, shapes, basic animation

### 2. Bundled Scenes (most powerful) — `scene.addBundledScene`
- Full `.tsx` with real `import` statements compiled via esbuild (~3ms)
- Supports 19 packages: `@remotion/noise`, `@remotion/shapes`, `@remotion/captions`, `@shubham-vish/remotion-templates` (159 scenes), etc.
- Can embed `<OffthreadVideo>` with Ken Burns, 3D camera, color grading effects
- Can import and customize any catalog scene
- Use `export default function Scene() { ... }`

### 3. Library Scenes (fastest) — `scene.addLibraryScene`
- Use any of 159 pre-built scenes from the catalog by name
- Pass props like `title`, `metrics`, `segments`, etc.
- No code writing needed — just scene ID + props
- Browse with `scene.listScenes`, inspect with `scene.getSceneProps`

## Load Rules by Topic

Read individual rule files for detailed explanations and code examples:

- [rules/animations.md](rules/animations.md) — Core animation: interpolate, spring, Easing curves
- [rules/animation-helpers.md](rules/animation-helpers.md) — Our 30+ built-in helpers: fadeIn, springPop, kenBurns, etc.
- [rules/components.md](rules/components.md) — 40+ shared components: backgrounds, overlays, captions
- [rules/theme.md](rules/theme.md) — Fonts, COLORS, SHADOWS, LAYOUT, mergeColors, s()
- [rules/sequencing.md](rules/sequencing.md) — Sequence, timing, stagger patterns
- [rules/images.md](rules/images.md) — Img component, staticFile, remote URLs
- [rules/text-animations.md](rules/text-animations.md) — Typography, typewriter, kinetic text
- [rules/charts.md](rules/charts.md) — Bar charts, pie charts, counters, data visualization
- [rules/camera-engine.md](rules/camera-engine.md) — Perspective zoom, shake, POI, 5 camera presets, BREATHE mechanism
- [rules/effects.md](rules/effects.md) — FilmGrain, ChromaticAberration, SpeakerPIP
- [rules/scene-commands.md](rules/scene-commands.md) — API commands: addCustomScene, addLibraryScene, listScenes, etc.
- [rules/scene-catalog-guide.md](rules/scene-catalog-guide.md) — Scene selection strategy, categories, pairing logic
- [rules/transitions-and-captions.md](rules/transitions-and-captions.md) — LightLeaks, custom transitions, 7 TikTok caption styles
- [rules/sfx-and-audio.md](rules/sfx-and-audio.md) — SFX search/placement, voiceover, volume guidelines
- [rules/creative-approach.md](rules/creative-approach.md) — "Think Like a Video Editor" — planning workflow, pacing, common mistakes
- [rules/patterns.md](rules/patterns.md) — Complete working scene examples ready to paste
- [rules/sandbox-rules.md](rules/sandbox-rules.md) — Critical do's and don'ts for sandbox scenes
- [rules/debugging.md](rules/debugging.md) — Common errors, troubleshooting, performance tips

## Quick Start

```jsx
// Minimal sandbox scene — paste into scene.addCustomScene
const Scene = () => {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, 0, 15);
  const scale = springPop(frame, 30, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center' }}>
      <PurpleGradientBg intensity={0.4} />
      <div style={{ opacity, transform: `scale(${scale})`, fontSize: 72, fontWeight: 900, color: 'white', fontFamily }}>
        Hello World
      </div>
    </AbsoluteFill>
  );
};
```
