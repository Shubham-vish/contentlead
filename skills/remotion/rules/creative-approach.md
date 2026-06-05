---
name: creative-approach
description: Video editing philosophy — plan before executing, think like a video editor
tags: creative, planning, workflow, philosophy, video-editor, approach
---

# Creative Approach — Think Like a Video Editor

## Philosophy

DON'T just dump scenes and text on a timeline. **Plan the video** like a professional editor would — consider pacing, visual variety, audience engagement, and narrative flow.

## The Planning-First Workflow

### 1. Analyze the source material

Before touching the timeline:

- **Extract frames** from each video clip (3 per video at 25%, 50%, 75% of duration)
- **View/analyze frames** to understand the actual content
- **Read any transcripts** to understand the narrative
- **Identify the key message** of each segment

```bash
# Extract representative frames
ffmpeg -ss 5 -i video.mp4 -frames:v 1 -q:v 2 /tmp/frame-5s.jpg -y
ffmpeg -ss 15 -i video.mp4 -frames:v 1 -q:v 2 /tmp/frame-15s.jpg -y
ffmpeg -ss 30 -i video.mp4 -frames:v 1 -q:v 2 /tmp/frame-30s.jpg -y
```

### 2. Create a detailed editing plan

Write out (mentally or in a structured way):

- **Video structure**: What goes where, in what order
- **Scene types**: Which scenes for which purpose (intro, transition, data, CTA)
- **Transition strategy**: How sections connect narratively
- **Text/caption plan**: What text appears when, what role (headline, subtitle, body)
- **Timing**: Rough durations for each segment
- **Style**: Color palette, font choices, mood

### 3. Present the plan

Before building, articulate your plan:
- "I'll create a 45-second reel with 3 sections..."
- "Each section gets an intro scene, the video clip, and a text overlay..."
- "I'll use LightLeaks transitions between sections..."

### 4. Build in phases

```
Phase 1: Set canvas background (dark, prevents white flashes)
Phase 2: Add all background scenes (openers, transitions, closers)
Phase 3: Add all video/image content
Phase 4: Add all text/captions (they go to top tracks after reorder)
Phase 5: editor.reorderTracks → fix z-order
Phase 6: editor.save → persist
Phase 7: Verify (state check, error check, gap check)
```

### 5. Verify thoroughly

- Check scene coverage has no gaps
- Check text is visible (above scenes in track order)
- Check for console errors
- Check media URLs are valid

## Creative Capabilities Available

### In SkillTown Desktop sandbox scenes:

| Capability | How | Examples |
|-----------|-----|---------|
| **Text animations** | `fadeIn`, `slideUp`, `springPop`, `staggerDelay` | Word-by-word reveals, kinetic typography |
| **Visual effects** | `FilmGrain`, `ChromaticAberration`, `Vignette` | Cinematic look |
| **Particle systems** | `FloatingParticles`, `ParticleTriangles` | Ambient motion |
| **Captions** | `TikTokCaptions` with 7 styles | Word-level animated subtitles |
| **Backgrounds** | `PurpleGradientBg`, `GradientBg`, `DarkGridBg`, `WavyLineBackground` | Animated scene backgrounds |
| **Camera motion** | `kenBurns`, `cameraZoom`, `getCameraState`, `buildCameraTransform` | Zoom, pan, perspective |
| **Draw effects** | `lineDraw`, `strokeDraw`, `checkDraw`, `drawOn` | SVG reveal animations |
| **Ambient motion** | `drift`, `breathe`, `glowPulse`, `shimmer`, `flicker` | Subtle micro-movements |
| **Layout** | `SplitScreenLayout`, `ThreeZoneStack`, `BlueBorderFrame` | Multi-section compositions |
| **Data** | `SyntaxHighlighter`, `ConsoleOutput` | Code/terminal displays |
| **Branding** | `BrandLogo`, `YellowButton`, `InstagramCTA` | CTAs and brand elements |

### Via PrepWithAI MCP tools:

| Capability | Tool |
|-----------|------|
| AI image generation | `prepwithai_image_generate` |
| Image from references | `prepwithai_image_compose` |
| Frame/image analysis | `prepwithai_image_analyze` |
| Text-to-speech | `prepwithai_speech_generate` |
| Voice cloning | `prepwithai_speech_clone_voice` |
| Sound effects search | `prepwithai_sfx_search` |
| Script generation | `prepwithai_text_generate` |
| Image search | `prepwithai_image_search` |

### From remotion-projects (reference — read the logic, not just presets):

If deeper capabilities are needed, these exist in the sibling `remotion-projects` codebase. **Don't just copy presets — read the implementation logic to understand HOW things work so you can create new variations from scratch.**

| Capability | Location | What to learn from it |
|-----------|----------|----------------------|
| Camera system | `video-engine/src/buildercentral/camera-utils.ts` (490 lines) | Keyframe interpolation with holds, CSS transform stacking order, focus region safety, dynamic origin math |
| Camera presets | `video-engine/src/buildercentral/highlight-presets.ts` (123 lines) | Parameter ranges that work (rotateY, zoomRange, panStrength, smoothing) and WHY each value was chosen |
| SFX suggestion logic | `video-engine/_apis/sfx_suggest.py` (288 lines) | Scene-type → SFX pairing rules, volume levels, frame timing patterns, keyword matching |
| Light leak effects | `video-engine/src/shared/scenes/effect/FilmLightLeakScene.tsx` | Envelope math (fade in/out), sine pulse, diagonal drift with `Math.sin(frame * 0.02)` |
| 135+ scene catalog | `video-engine/src/catalog.ts` | Scene metadata structure, tags, pairing suggestions for AI selection |
| Scene components | `video-engine/src/shared/scenes/` (155+ files) | How charts, layouts, effects, infographics are built with Remotion primitives |
| Theme/colors system | `video-engine/src/shared/scenes/_theme.ts` | Universal color palette, font loading, style override system, `s()` helper |
| Python auto-edit pipeline | `video-engine/_apis/pipeline/` (8 modules) | Scene detection (OpenCV), frame analysis (OCR), camera planning, transition selection |
| Template renderer | `video-engine/src/buildercentral/TemplateRenderer.tsx` | How JSON compositions map to React components, SFX injection, transition routing |

## Pacing Guidelines

| Content Type | Duration Per Scene | Text Hold Time |
|-------------|-------------------|----------------|
| Hook/title | 2–3s | N/A |
| Key point | 3–4s | 2–3s per line |
| Data/chart | 5–8s | 3–4s for labels |
| Video segment | Varies (clip length) | Overlay 2–3s |
| Transition | 1–2s | Brief label only |
| CTA/outro | 3–5s | Full duration |

## Common Mistakes to Avoid

1. **Wall of text**: Never put multiple lines in one text item. Stagger them.
2. **No transitions**: Abrupt cuts feel amateur. Use LightLeaks or custom scenes.
3. **White flashes**: Always set dark canvas background before adding content.
4. **Hidden text**: Always call `editor.reorderTracks` — text below scenes is invisible.
5. **Static boring**: Use `breathe`, `drift`, `glowPulse` for ambient motion even in simple scenes.
6. **No verification**: Always check state, errors, and gaps before declaring done.
7. **Ignoring content**: Generic scenes are worse than content-aware ones. Analyze the actual video.
