---
name: scenes-and-templates
description: Scene library with 159 templates, custom Remotion JSX scenes, and scene management
tags: scene, template, remotion, intro, outro, chart, motion, custom, library
---

# Scenes and Templates

Scenes are Remotion-powered timeline items. Use them for intros, outros, charts, data visuals, motion backgrounds, and reusable animated layouts.

## Scene Types — When to Use Which

There are 3 scene types. **Always prefer the simplest type that meets the need:**

| Type | Command | Imports | Editable in UI | Best For |
|---|---|---|---|---|
| **Library** | `scene.addLibraryScene` | N/A (pre-built) | Props only | Standard visuals — charts, data-viz, motion-bg, openers, closers. **Use first.** |
| **Custom** | `scene.addCustomScene` | ❌ Globals only | ✅ Full code editor | Simple one-off visuals — unique text layouts, geometric animations, simple effects |
| **Bundled** | `scene.addBundledScene` | ✅ Real imports (19 pkgs) | ✅ Source viewer + rebuild | Complex scenes needing imports — video with Ken Burns, noise-based effects, shapes, paths |

### Decision flow:
1. **Does a library scene exist for this?** → Use `scene.addLibraryScene`. Check with `scene.listScenes`.
2. **Need custom visuals but NO imports?** → Use `scene.addCustomScene`. Globals available: `React`, `AbsoluteFill`, `useCurrentFrame`, `useVideoConfig`, `interpolate`, `Easing`, `Sequence`, `spring`, `Img`, `staticFile`.
3. **Need real imports** (`@remotion/noise`, `@remotion/shapes`, `OffthreadVideo`, etc.)? → Use `scene.addBundledScene`. Full `.tsx` with `export default`.

### Key differences:
- **Library scenes** are configurable via `sceneProps` (title, colors, data, etc.) — use `scene.getSceneProps` to discover available props. Cannot change the underlying code.
- **Custom scenes** store code in `metadata.customSceneCode`. Users can edit live in the Template Settings panel with auto-compile preview. No imports — use globals only.
- **Bundled scenes** store original source in `metadata.bundledSource` and compiled code in `metadata.bundledCode`. Users can view source and edit+rebuild in the Template Settings panel. Supports 19 import packages (see supported imports list).

### Reusing existing custom/bundled scenes
Before creating a new custom or bundled scene, check if a similar one already exists in the current project. You can find existing scenes via `query.getTimelineItems` and inspect their `metadata.customSceneCode` or `metadata.bundledSource`.

## Categories Overview

Available scene categories (159 scenes total across 11 categories):

- `chart` — 24 scenes (LineChart, PieChart, DonutChart, BarRace, etc.)
- `data-viz` — 15 scenes (NumberTicker, StatsGrid, GaugeDial, etc.)
- `motion-bg` — 50+ scenes (Particles, Starfield, Aurora, MatrixRain, etc.)
- `text` — 9 scenes (TypewriterQuote, GlitchText, WordByWord, etc.)
- `layout` — 20+ scenes (FlipCard, ParallaxLayers, PhoneMockup, etc.)
- `comparison` — 5 scenes (BeforeAfter, ComparisonCards, SplitScreen)
- `opener` — opening/intro scenes
- `closer` — outro/CTA scenes
- `effect` — visual effects and overlays
- `structural` — section dividers
- `speaker` — speaker/PIP segments

## `scene.listScenes`

Search the library of 159 templates.

| Param | Type | Default | Description |
|---|---|---|---|
| `category` | `string` | all categories | Optional category filter |
| `search` | `string` | empty | Optional text search |
| `limit` | `number` | `50` | Maximum results to return |

Example:

```json
{
  "type": "scene.listScenes",
  "params": {
    "category": "opener",
    "search": "gradient",
    "limit": 10
  }
}
```

## `scene.getSceneProps`

Fetch editable props for one scene. **Always call this before adding text overlays** to check what text the scene already renders internally.

| Param | Type | Default | Description |
|---|---|---|---|
| `sceneId` | `string` | required | Scene template ID. Use camelCase in agent docs/examples. |

The response includes an `inputSchema` string showing all available props and a `fields` array with details.

**⚠️ Text props in scenes**: If a scene has props like `title`, `subtitle`, `overlayTitle`, `textLine1`, etc., the scene RENDERS that text internally. Do NOT duplicate it with separate text track items — this causes overlapping text. See AGENTS.md "Scene Text vs Track Text" section.

Example:

```json
{
  "type": "scene.getSceneProps",
  "params": {
    "sceneId": "LineChartScene"
  }
}
```

## `scene.addLibraryScene`

Add a pre-built scene to the timeline.

| Param | Type | Default | Description |
|---|---|---|---|
| `sceneId` | `string` | required | Template ID from `scene.listScenes`. Use camelCase in agent docs/examples. |
| `from` | `number` | `0` | Timeline start time in ms (alias: `from_ms`) |
| `durationMs` | `number` | scene default | Scene duration in ms (alias: `duration_ms`) |
| `sceneProps` | `object` | `{}` | Prop overrides for the scene (alias: `scene_props`) |

Example:

```json
{
  "type": "scene.addLibraryScene",
  "params": {
    "sceneId": "GaugeDialScene",
    "from": 0,
    "durationMs": 4000,
    "sceneProps": {
      "value": 72,
      "label": "Performance",
      "maxValue": 100
    }
  }
}
```

## `scene.addCustomScene`

Add a custom Remotion JSX scene to the timeline. For simple animations without imports.

| Param | Type | Default | Description |
|---|---|---|---|
| `code` | `string` | required | JSX source string (sandbox format — see rules below) |
| `name` | `string` | `"Custom Scene"` | Friendly name |
| `from` | `number` | `0` | Timeline start time in ms (alias: `from_ms`) |
| `durationMs` | `number` | `5000` | Scene duration in ms (alias: `duration_ms`) |

### ⚠️ CRITICAL: Sandbox Code Rules

The code runs in a **sandboxed environment** — NOT a regular .tsx file. Follow these rules exactly:

1. **Define `const Scene = () => { ... }`** — the sandbox looks for a variable named `Scene`
2. **Use JSX directly** — Babel transpiles it at runtime
3. **NO `import` statements** — all needed APIs are injected as globals
4. **NO `export` statements** — they're stripped but may cause confusion
5. **NO `return Scene;` at the end** — this causes "return outside of function" error
6. **NO `const { ... } = Remotion;`** — use globals directly: `useCurrentFrame`, `interpolate`, etc.

## `scene.addBundledScene`

**Most powerful scene creation method.** Compiles full `.tsx` with real `import` statements via esbuild. Use for:
- Importing `@remotion/noise`, `@remotion/shapes`, `@remotion/captions`
- Embedding videos with effects (`<OffthreadVideo>` + Ken Burns, 3D camera, color grading)
- Importing and customizing catalog scenes from `@shubham-vish/remotion-templates`
- Any scene that needs real imports

| Param | Type | Default | Description |
|---|---|---|---|
| `source` | `string` | required | Full `.tsx` source with imports and `export default` |
| `name` | `string` | `"Bundled Scene"` | Friendly name |
| `from` | `number` | `0` | Timeline start time (ms) |
| `durationMs` | `number` | `5000` | Scene duration (ms) |
| `orientation` | `string` | canvas-derived | `"portrait"` or `"landscape"` — **auto-injected by api-server from canvas size** |

### ⚠️ CRITICAL: Scene Dimensions — 3-Layer Defense

Scene dimensions are now automatically handled by a 3-layer defense system. You generally do NOT need to worry about dimensions — just make sure the canvas is the right size before you start.

#### Layer 1: API Server (auto-inject)
`smartParamCorrection` queries the live canvas via `query.getCanvasSize` and injects **explicit `width`, `height`, AND `orientation`** into every `scene.addLibraryScene`, `scene.addCustomScene`, and `scene.addBundledScene` command. If the canvas query fails, it falls back to `landscape`.

#### Layer 2: Command Executor (`getSceneDimensions`)
Priority order: **explicit params → orientation param → zustand store → fallback**. Even if the API server injection fails, the store has the correct canvas size from `editor.resize`.

#### Layer 3: Player Renderer (`template.tsx`)
`nativeWidth`/`nativeHeight` default to the **container dimensions** (the item's `details.width`/`details.height`). Even if old metadata says `nativeOrientation: "portrait"`, the scene fills the canvas because `scale = container/container = 1.0`.

#### What the `nativeOrientation` metadata does
Each scene item stores `metadata.nativeOrientation` which tells the Remotion player what resolution to render the scene component at. If `nativeOrientation` doesn't match the container, the scene is scaled (letterboxed). The fix ensures `nativeOrientation` is always derived from the actual scene dimensions, not from the scene's category.

#### Mandatory workflow before adding scenes
1. **Check canvas size**: `query.getCanvasSize` → verify it matches your intended format
2. **Resize if needed**: `editor.resize` with `{width: 1920, height: 1080}` for landscape
3. **THEN add scenes** — all 3 layers ensure correct dimensions automatically

#### Partial-fill scenes (split-screen, PiP, insets)
Scenes do NOT have to fill the entire canvas. You can create partial-size scenes by passing explicit `width` and `height`:
```bash
# Half-width scene for split-screen layout
scene.addLibraryScene({sceneId: "PieChartScene", width: 960, height: 1080, from: 0, durationMs: 5000})

# Small inset scene (e.g., animated chart in corner)
scene.addLibraryScene({sceneId: "NumberTicker", width: 400, height: 300, from: 5000, durationMs: 3000})
```
The `nativeWidth`/`nativeHeight` will match the specified size, so the scene renders at that exact resolution with no letterboxing. Position with `top`/`left` in `scene.updateSceneProps`.

#### If scenes appear with wrong aspect ratio
- The canvas size was likely wrong when scenes were added
- Fix: resize canvas, delete old scenes, re-add them
- Prevention: ALWAYS verify `query.getCanvasSize` before adding the first scene

### Scene Transitions — `enterAnim` / `exitAnim`

Each scene has `metadata.enterAnim` and `metadata.exitAnim` controlling how it appears/disappears.

**Available types:**
| Type | Effect | When to Use |
|---|---|---|
| `none` | Hard cut — instant appear/disappear | **Default for contiguous scenes** (back-to-back) |
| `fade` | Opacity 0→1 over `durationInFrames` | Standalone scenes with gaps, or artistic fade-ins from black |

**⚠️ CRITICAL: Contiguous scenes MUST use `enterAnim: { type: 'none' }`**

When scenes are placed back-to-back (e.g., 0-8s, 8-16s, 16-26s), using `fade` causes a **visible white/background flash** at each boundary. The outgoing scene disappears instantly, but the incoming scene fades in from transparent — exposing the canvas background for ~0.5s. This is jarring and must be avoided.

**When `fade` IS appropriate:**
- First scene of a video fading in from black (set canvas background to black first)
- Scene after a deliberate gap (e.g., 2s of black between sections)
- Scene following a LightLeak transition overlay
- Artistic intent where a gradual reveal is desired

**Setting transitions:**
```json
// Update enterAnim on an existing scene (sceneProps can be omitted)
{
  "type": "scene.updateSceneProps",
  "params": {
    "itemId": "scene_item_id",
    "enterAnim": { "type": "none" }
  }
}

// Set both sceneProps AND transition in one call
{
  "type": "scene.updateSceneProps",
  "params": {
    "itemId": "scene_item_id",
    "sceneProps": { "title": "New Title" },
    "enterAnim": { "type": "fade", "durationInFrames": 15 },
    "exitAnim": { "type": "none" }
  }
}
```

**Default behavior:** New scenes are created with `enterAnim: { type: 'none' }` by default. Only change this when you have a specific creative reason.

**Decision guide:**
1. Are scenes contiguous (no gap)? → `enterAnim: none` (mandatory)
2. Is there a gap before this scene? → `fade` is appropriate
3. Is this the first scene? → `fade` from black can be nice, but `none` is also fine
4. Is there a LightLeak overlay at the boundary? → `none` on both adjacent scenes (the overlay IS the transition)

### Rules for bundled scenes
- **Must `export default`** a React component
- Use real `import` statements (not globals)
- 19 supported packages (see supported imports list)
- Build takes ~3ms (cached by content hash)
- Stored in item `metadata.bundledCode`

### Example: Video with Ken Burns + 3D camera shake

```json
{
  "type": "scene.addBundledScene",
  "params": {
    "source": "import React from 'react';\nimport { useCurrentFrame, useVideoConfig, interpolate, AbsoluteFill, OffthreadVideo, Easing } from 'remotion';\nimport { noise2D } from '@remotion/noise';\n\nconst VIDEO = 'http://127.0.0.1:PORT/media?path=...';\n\nexport default function KenBurns() {\n  const frame = useCurrentFrame();\n  const { durationInFrames } = useVideoConfig();\n  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.35], { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });\n  const shakeX = noise2D('sx', frame * 0.04, 0) * 1.5;\n  const shakeY = noise2D('sy', 0, frame * 0.04) * 1.5;\n  return <AbsoluteFill style={{ background: '#000' }}><div style={{ inset: '-15%', position: 'absolute', transform: `scale(${zoom}) translate(${shakeX}%, ${shakeY}%)` }}><OffthreadVideo src={VIDEO} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div></AbsoluteFill>;\n}",
    "name": "Video Ken Burns",
    "from": 0,
    "durationMs": 15000
  }
}
```

### Example: Import and customize a catalog scene

```json
{
  "type": "scene.addBundledScene",
  "params": {
    "source": "import React from 'react';\nimport { AbsoluteFill } from 'remotion';\nimport { PieChartScene } from '@shubham-vish/remotion-templates';\n\nexport default function Scene() {\n  return <PieChartScene title='Revenue' segments={[{label:'Product A',value:45,color:'#00FF88'},{label:'Product B',value:35,color:'#00BFFF'},{label:'Product C',value:20,color:'#FFD700'}]} />;\n}",
    "name": "Custom Pie Chart",
    "from": 5000,
    "durationMs": 6000
  }
}
```

### Supported imports (19 packages)
`react`, `react-dom`, `react/jsx-runtime`, `react/jsx-dev-runtime`, `remotion`,
`@remotion/noise`, `@remotion/shapes`, `@remotion/paths`, `@remotion/transitions`,
`@remotion/media-utils`, `@remotion/motion-blur`, `@remotion/google-fonts`,
`@remotion/light-leaks`, `@remotion/captions`, `@remotion/animation-utils`,
`@remotion/layout-utils`,
`@shubham-vish/remotion-templates`, `@skilltown/remotion-templates`

### Available Globals (no imports needed)

- **React**: `React`, `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`, `Fragment`
- **Remotion**: `AbsoluteFill`, `useCurrentFrame`, `useVideoConfig`, `interpolate`, `Easing`, `Sequence`, `spring`, `Img`, `staticFile`
- **Animation helpers**: `fadeIn`, `fadeOut`, `slideUp`, `scaleIn`, `springPop`, `kenBurns`, `drift`, `breathe`, `glowPulse`, `shimmer`, etc.
- **Components**: `FloatingParticles`, `PurpleGradientBg`, `Vignette`, `GradientBg`, `SyntaxHighlighter`, `GridOverlay`, etc.
- **Standard JS**: `Math`, `console`, `Array`, `Object`, `JSON`, `Date`, `parseInt`, `parseFloat`

### Correct Example

```json
{
  "type": "scene.addCustomScene",
  "params": {
    "code": "const Scene = () => {\n  const frame = useCurrentFrame();\n  const { fps } = useVideoConfig();\n  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });\n  const scale = spring({ frame, fps, config: { damping: 12 } });\n  return (\n    <AbsoluteFill style={{ backgroundColor: '#0f0f23', justifyContent: 'center', alignItems: 'center' }}>\n      <div style={{ transform: `scale(${scale})`, opacity, fontSize: 72, fontWeight: 900, color: '#FFD700' }}>\n        Hello World\n      </div>\n    </AbsoluteFill>\n  );\n};",
    "name": "Animated Title",
    "from": 0,
    "durationMs": 4000
  }
}
```

### Common Mistakes That Cause Errors

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `import { AbsoluteFill } from 'remotion';` | Just use `AbsoluteFill` directly |
| `const { useCurrentFrame } = Remotion;` | Just use `useCurrentFrame` directly |
| `export default Scene;` | Just define `const Scene = () => ...` |
| `return Scene;` at end of code | Don't add this — sandbox finds `Scene` automatically |
| `<OffthreadVideo>` | Use `<Img>` for images; video via URL in styles |

### Pre-Compilation Validation

The API now **validates code before adding** to the timeline. If the code has syntax errors or doesn't define a `Scene` component, the API returns an error with hints instead of adding a broken scene.

## `scene.updateSceneProps`

Update props on an existing scene item.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | required | Existing scene timeline item (alias: `item_id`) |
| `sceneProps` | `object` | required | Props to update (alias: `scene_props`) |

Example:

```json
{
  "type": "scene.updateSceneProps",
  "params": {
    "itemId": "scene_item_01",
    "sceneProps": {
      "title": "Updated headline",
      "primaryColor": "#14b8a6"
    }
  }
}
```

## `scene.previewCode`

Preview custom scene code without permanently adding it.

| Param | Type | Default | Description |
|---|---|---|---|
| `code` | `string` | required | JSX source string |
| `name` | `string` | `"Preview"` | Preview label |
| `duration_frames` | `number` | `90` | Preview length in frames |

Example:

```json
{
  "type": "scene.previewCode",
  "params": {
    "code": "const Scene = ({ style: so }) => <AbsoluteFill style={{ ...so, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}><div style={{ color: '#fff', fontSize: 72 }}>Preview Only</div></AbsoluteFill>;",
    "name": "Preview Test",
    "duration_frames": 90
  }
}
```

## Workflow: list → get props → add → customize

1. Use `scene.listScenes` to find candidates.
2. Use `scene.getSceneProps` to inspect editable fields.
3. Use `scene.addLibraryScene` to place the scene.
4. Use `scene.updateSceneProps` to refine the result.
5. Use `scene.previewCode` before committing custom JSX.
6. **Call `editor.reorderTracks` after adding all scenes and text** — ensures text is visible on top.

## ⚠️ CRITICAL: Scene Track Behavior

### Scenes are background layers
Scenes render as `type: 'image'` items with `metadata.isTemplateTrack = true`. They should ALWAYS be on the **bottom tracks** (highest index) so text/content is visible on top.

### Always call `editor.reorderTracks` after building
If you add scenes before text, scenes end up on top tracks and cover all text. The `editor.reorderTracks` command fixes this by sorting: text (top) → scenes (bottom).

### Smart track reuse
Non-overlapping scenes automatically share tracks. 10 scenes with no time overlap → 1-2 tracks. Tagged `isAgentTrack: true` + `isTemplateTrack: true`.

### Scene coverage — NO GAPS
Ensure scenes cover the FULL video duration. Gaps = white/empty frames visible in the player.
Plan contiguous ranges: 0-5s, 5-15s, 15-25s, etc. Verify with `GET /api/state`.

### Param naming
Use camelCase in agent docs and examples:
- `sceneId` — scene template ID
- `durationMs` — duration in milliseconds
- `from` — start time in milliseconds
- `sceneProps` — scene prop overrides
**Prefer camelCase** (`sceneId`, `durationMs`, `from`, `sceneProps`).

## Common Patterns / Recipes

### Add an opener

```json
[
  {
    "type": "scene.listScenes",
    "params": {
      "category": "opener",
      "search": "intro",
      "limit": 5
    }
  },
  {
    "type": "scene.addLibraryScene",
    "params": {
      "sceneId": "PieChartScene",
      "from": 0,
      "durationMs": 3500,
      "sceneProps": {
        "slices": [{"label": "Q1", "value": 30, "color": "#6366f1"}, {"label": "Q2", "value": 70, "color": "#ec4899"}]
      }
    }
  }
]
```

### Add a chart scene mid-video

```json
{
  "type": "scene.addLibraryScene",
  "params": {
    "sceneId": "AnimatedBarScene",
    "from": 12000,
    "durationMs": 5000,
    "sceneProps": {
      "title": "Q1 Growth",
      "data": [{"label": "Jan", "value": 12}, {"label": "Feb", "value": 18}, {"label": "Mar", "value": 27}, {"label": "Apr", "value": 31}]
    }
  }
}
```

### Build a custom branded slate

```json
[
  {
    "type": "scene.previewCode",
    "params": {
      "code": "const Scene = ({ style: so }) => <AbsoluteFill style={{ ...so, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}><div style={{ color: '#fff', fontSize: 80, fontWeight: 700 }}>Brand Slate</div></AbsoluteFill>;",
      "name": "Brand Slate Preview",
      "duration_frames": 120
    }
  },
  {
    "type": "scene.addCustomScene",
    "params": {
      "code": "const Scene = ({ style: so }) => <AbsoluteFill style={{ ...so, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}><div style={{ color: '#fff', fontSize: 80, fontWeight: 700 }}>Brand Slate</div></AbsoluteFill>;",
      "name": "Brand Slate",
      "from": 22000,
      "durationMs": 4000
    }
  }
]
```

## `editor.setBackground`

Set the global canvas background color. Prevents white flashes between scenes — even if scenes have gaps or rendering errors, the canvas itself stays dark.

| Param | Type | Default | Description |
|---|---|---|---|
| `type` | `string` | `"color"` | `"color"` or `"image"` |
| `value` | `string` | `"#000000"` | Hex color or image URL |

**⚠️ ALWAYS set this before adding any content:**

```json
{ "type": "editor.setBackground", "params": { "type": "color", "value": "#0a0a0f" } }
```

## Light Leak Transitions

The `LightLeaks` scene from `@shubham-vish/remotion-templates` creates cinematic light leak overlay effects. Use them as transitions between video sections.

### Scene ID: `LightLeaks`

| Prop | Type | Default | Description |
|---|---|---|---|
| `preset` | `string` | `"warm-film"` | One of 8 presets (see below) |
| `mode` | `string` | `"evolve-only"` | `"evolve-only"` (single reveal — default), `"full"` (grow+shrink), `"retract-only"` (fade away) |
| `intensity` | `number` | `0.8` | Global intensity multiplier (0-1) |
| `background` | `string` | `"transparent"` | Use `"transparent"` for overlay mode |
| `tintColor` | `string` | — | Override leak color with hex |
| `blendMode` | `string` | `"screen"` | CSS blend mode (`"screen"`, `"overlay"`, `"hard-light"`) |
| `leaks` | `array` | — | Custom layers: `{seed, hueShift, startFrame, durationInFrames, opacity}` |

### Available Presets

| Preset | Feel | Best For |
|---|---|---|
| `warm-film` | Classic orange/gold | Default transitions, film look |
| `cool-blue` | Cool cyan | Night mood, tech content |
| `golden-hour` | Rich gold/amber | Sunset, warm cinematic |
| `rainbow` | Multi-color (3 layers) | Concert, vibrant |
| `pink-dream` | Soft pink/magenta | Dreamy, aesthetic |
| `subtle-flare` | Single subtle warm flare | Minimal, elegant transitions |
| `neon-glow` | Neon green/purple | Cyberpunk, tech |
| `cinematic-red` | Deep red/orange | Dramatic, intense |

### ⚠️ CRITICAL: Light Leak Mode & Duration (The "Double Flash" Problem)

The `@remotion/light-leaks` WebGL shader has TWO animation phases:
- **1st half** ("evolve"): leak appears and grows
- **2nd half** ("retract"): leak shrinks and fades with a DIFFERENT pattern

With default `mode: "full"`, BOTH phases play — looks like the effect plays TWICE.

**FIX: ALWAYS use `mode: "evolve-only"` for transitions.** This doubles the internal shader duration so only the evolve (reveal) phase is visible within the item's actual duration. The retract phase falls outside the clip boundary and never renders.

### Mode Reference

| Mode | Behavior | Use For |
|------|----------|---------|
| `"evolve-only"` | **Single reveal flash** — only grow phase shows | ✅ Transitions (ALWAYS use this) |
| `"full"` | Grow + shrink (two visible phases) | Standalone atmospheric overlays |
| `"retract-only"` | Only fade/shrink shows | Disappear effects |

### Transition Pattern — Place at Section Boundaries

Light leaks should be **1 second long**, centered on each section boundary (0.5s before + 0.5s after):

```json
{ "type": "scene.addLibraryScene", "params": {
  "sceneId": "LightLeaks", "from": 11500, "durationMs": 1000,
  "sceneProps": { "preset": "warm-film", "mode": "evolve-only", "intensity": 0.9, "background": "transparent", "blendMode": "screen" }
}}
```

**Duration guidelines:**
- `0.5s` — very quick subtle flash
- `1.0s` — standard transition flash (RECOMMENDED)
- `1.5s–3s` — slower atmospheric reveal (still use `evolve-only` unless standalone)
- ⚠️ NEVER use `mode: "full"` for transitions — it causes the double-flash

## Motion Background Scenes

52 animated background scenes available in the `motion-bg` category. Great for full-coverage backgrounds.

### Finance/Tech Recommended Scenes

| Scene ID | Description | Best For |
|---|---|---|
| `DataStreamScene` | Flowing data characters | Intros, tech content |
| `CircuitBoardScene` | Animated circuit traces | Tech, AI content |
| `NebulaCloudsScene` | Slow nebula drift | Ambient, transitions |
| `ElectricArcScene` | Lightning arcs | Dramatic moments |
| `StarfieldWarpScene` | Warp-speed stars | Closings, energy |
| `MatrixRainScene` | Matrix-style rain | Hacking, code |
| `GalaxyScene` | Galaxy spiral | Space, epic |
| `ConstellationScene` | Connected star dots | Networks, data |
| `PlasmaFieldScene` | Plasma energy | Intense, sci-fi |

### Cinematic Effects from remotion-templates

Available as globals in custom scenes:

| Component | Props | Description |
|---|---|---|
| `Vignette` | `intensity`, `centerY`, `innerRadius`, `zIndex` | Dark edge vignette |
| `FilmGrain` | `opacity`, `speed`, `frequency`, `zIndex` | Animated film grain |
| `ChromaticAberration` | `strength`, `zIndex` | Color fringe effect |
| `LightBeams` | — | Volumetric light beams |
| `AtmosphericHaze` | — | Fog/haze overlay |

## Complete Video Building Order (with Transitions)

```
1. editor.setBackground → dark color (#0a0a0f)
2. Add background scenes (full 60s, NO gaps)
3. Add LightLeak transitions at section boundaries
4. Add text content (sequential reveals)
5. editor.reorderTracks → text on top, scenes on bottom
6. editor.save
```
