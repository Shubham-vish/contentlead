---
name: scene-commands
description: Exact SkillTown Desktop API commands for listing, previewing, and adding scenes
tags: api, execute, scenes, templates, custom-scene
---

# Scene Commands

All commands go to `POST /api/execute` with bearer auth.

## Workflow
1. **Browse** → `scene.listScenes`
2. **Inspect** → `scene.getSceneProps`
3. **Validate** → `scene.validateCode` (for custom scenes — catches runtime errors)
4. **Add** → `scene.addLibraryScene` (catalog as-is) or `scene.addBundledScene` (imports/customization) or `scene.addCustomScene` (sandbox)
5. **Modify** → `scene.updateSceneProps`
6. **Preview** → `scene.previewCode`

### When to use which
| Scenario | Command |
|----------|---------|
| Use a catalog scene as-is with props | `scene.addLibraryScene` |
| Need imports (`@remotion/*`, templates) | `scene.addBundledScene` |
| Video with effects (Ken Burns, 3D, zoom) | `scene.addBundledScene` with `<OffthreadVideo>` |
| Customize a catalog scene (add overlays, combine) | `scene.addBundledScene` importing from `@shubham-vish/remotion-templates` |
| Simple text/shape animation, no imports | `scene.addCustomScene` (sandbox) |
| Captions with word-level timing | `scene.addBundledScene` with `@remotion/captions` |

Current executor behavior:
- Library scenes come from `SCENE_CATALOG`.
- Timeline scene items are stored as `type: 'image'` with `metadata.isTemplate = true` and `metadata.sceneType`.
- Current catalog source exposes categories including `chart`, `motion-bg`, `layout`, `text`, `data-viz`, `effect`, `structural`, `comparison`, `closer`, `opener`, `speaker`.
- Default orientation logic is: landscape for `chart`, `comparison`, `layout`, `data-viz`, `ui`; portrait for everything else.
- Prefer **camelCase** params. Snake case is only a fallback.

## `scene.listScenes`
Params: `{ category?, search?, limit? }`

```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"scene.listScenes","params":{"category":"opener","search":"intro","limit":10}}'
```

```json
{
  "type": "scene.listScenes",
  "params": { "category": "opener", "search": "intro", "limit": 10 }
}
```

## `scene.getSceneProps`
Params: `{ sceneId }`

```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"scene.getSceneProps","params":{"sceneId":"LineChartScene"}}'
```

```json
{
  "type": "scene.getSceneProps",
  "params": { "sceneId": "LineChartScene" }
}
```

## `scene.addLibraryScene`
Params: `{ sceneId, from?, durationMs?, sceneProps? }`

```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"scene.addLibraryScene","params":{"sceneId":"AnimatedBarScene","from":0,"durationMs":5000,"sceneProps":{"title":"Quarterly KPIs"}}}'
```

```json
{
  "type": "scene.addLibraryScene",
  "params": {
    "sceneId": "AnimatedBarScene",
    "from": 0,
    "durationMs": 5000,
    "sceneProps": { "title": "Quarterly KPIs" }
  }
}
```

## `scene.addBundledScene`
Params: `{ source, name?, from?, durationMs?, orientation? }`

Compiles full `.tsx` source with real imports (via esbuild) and adds to timeline. Use when you need `@remotion/noise`, `@remotion/shapes`, `<OffthreadVideo>`, `@remotion/captions`, or any catalog scene import.

```json
{
  "type": "scene.addBundledScene",
  "params": {
    "source": "import React from 'react';\nimport { useCurrentFrame, AbsoluteFill, interpolate } from 'remotion';\nimport { noise2D } from '@remotion/noise';\n\nexport default function Scene() {\n  const frame = useCurrentFrame();\n  const n = noise2D('seed', frame * 0.01, 0);\n  return <AbsoluteFill style={{ opacity: 0.5 + n * 0.5, background: '#1a1a2e' }} />;\n}",
    "name": "Noise Background",
    "from": 0,
    "durationMs": 5000
  }
}
```

**Import catalog scenes for customization:**
```json
{
  "type": "scene.addBundledScene",
  "params": {
    "source": "import React from 'react';\nimport { AbsoluteFill } from 'remotion';\nimport { PieChartScene } from '@shubham-vish/remotion-templates';\n\nexport default function Scene() {\n  return <AbsoluteFill>\n    <PieChartScene title='Revenue' segments={[{label:'A',value:45,color:'#00FF88'},{label:'B',value:35,color:'#00BFFF'},{label:'C',value:20,color:'#FFD700'}]} />\n  </AbsoluteFill>;\n}",
    "name": "Custom Pie Chart",
    "from": 5000,
    "durationMs": 6000
  }
}
```

**Video with effects (Ken Burns, 3D camera):**
```json
{
  "type": "scene.addBundledScene",
  "params": {
    "source": "import React from 'react';\nimport { useCurrentFrame, useVideoConfig, interpolate, AbsoluteFill, OffthreadVideo, Easing } from 'remotion';\nimport { noise2D } from '@remotion/noise';\n\nconst VIDEO = 'http://127.0.0.1:PORT/media?path=...';\n\nexport default function KenBurns() {\n  const frame = useCurrentFrame();\n  const { durationInFrames } = useVideoConfig();\n  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.35], { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });\n  const shakeX = noise2D('sx', frame * 0.04, 0) * 1.5;\n  const shakeY = noise2D('sy', 0, frame * 0.04) * 1.5;\n  return <AbsoluteFill style={{ background: '#000' }}>\n    <div style={{ inset: '-15%', position: 'absolute', transform: `scale(${zoom}) translate(${shakeX}%, ${shakeY}%)` }}>\n      <OffthreadVideo src={VIDEO} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />\n    </div>\n  </AbsoluteFill>;\n}",
    "name": "Video Ken Burns",
    "from": 0,
    "durationMs": 15000
  }
}
```

**Supported imports (19 packages):** `react`, `react-dom`, `react/jsx-runtime`, `remotion`, `@remotion/noise`, `@remotion/shapes`, `@remotion/paths`, `@remotion/transitions`, `@remotion/media-utils`, `@remotion/motion-blur`, `@remotion/google-fonts`, `@remotion/light-leaks`, `@remotion/captions`, `@remotion/animation-utils`, `@remotion/layout-utils`, `@shubham-vish/remotion-templates`, `@skilltown/remotion-templates`

## `scene.addCustomScene`
Params: `{ code, name?, from?, durationMs?, orientation? }`

```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"scene.addCustomScene","params":{"name":"SkillTown Intro","from":0,"durationMs":5000,"orientation":"portrait","code":"const Scene = () => { const frame = useCurrentFrame(); const opacity = fadeIn(frame, 0, 12); return (<AbsoluteFill style={{ backgroundColor: COLORS.bgDark, justifyContent: \'center\', alignItems: \'center\' }}><div style={{ opacity, color: \'#fff\', fontSize: 72, fontWeight: 900, fontFamily }}>SkillTown</div></AbsoluteFill>); };"}}'
```

```json
{
  "type": "scene.addCustomScene",
  "params": {
    "code": "const Scene = () => { return <AbsoluteFill />; };",
    "name": "SkillTown Intro",
    "from": 0,
    "durationMs": 5000,
    "orientation": "portrait"
  }
}
```

## `scene.getSceneSource`
Params: `{ sceneId }`

Returns the source code of a catalog scene. Use this to understand how a scene works before customizing it in a bundled scene.

```json
{
  "type": "scene.getSceneSource",
  "params": { "sceneId": "AnimatedBarScene" }
}
```

Returns: `{ source: "const Scene = () => { ... }", sourceLength, description, hint }`

The source is sandbox-formatted (imports removed). To customize: read the logic, then write a bundled scene with real imports.

## `scene.updateSceneProps`
Params: `{ itemId, sceneProps }`

```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"scene.updateSceneProps","params":{"itemId":"scene_item_123","sceneProps":{"title":"Updated Title","accentColor":"#BC4AEF"}}}'
```

```json
{
  "type": "scene.updateSceneProps",
  "params": {
    "itemId": "scene_item_123",
    "sceneProps": { "title": "Updated Title", "accentColor": "#BC4AEF" }
  }
}
```

## `scene.previewCode`
Params: `{ code, name?, durationFrames?, orientation? }`

```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"scene.previewCode","params":{"name":"Preview Test","durationFrames":150,"orientation":"portrait","code":"const Scene = () => <AbsoluteFill style={{ backgroundColor: \'#111\', justifyContent: \'center\', alignItems: \'center\' }}><div style={{ color: \'#fff\', fontSize: 72 }}>Preview</div></AbsoluteFill>;"}}'
```

```json
{
  "type": "scene.previewCode",
  "params": {
    "code": "const Scene = () => <AbsoluteFill />;",
    "name": "Preview Test",
    "durationFrames": 150,
    "orientation": "portrait"
  }
}
```

## Practical Notes
- `scene.addCustomScene` pre-validates through `compileScene()` before the timeline item is added. This includes a **dry-render check** that catches `ReferenceError` for undefined globals.
- `scene.previewCode` updates the Custom Scene Editor preview only. It does **not** add a timeline item.
- **Always call `scene.validateCode` first** when testing new scene code — it returns errors without adding to timeline.
- After building a full edit, call `editor.reorderTracks` so text sits above scene/background tracks.

## `scene.validateCode`
Params: `{ code }`

Validates scene code (compilation + dry-render) without adding to timeline. Use before `scene.addCustomScene`.

```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"scene.validateCode","params":{"code":"const Scene = () => <AbsoluteFill><PurpleGradientBg /><div style={{ color: \"white\", fontSize: 48 }}>Test</div></AbsoluteFill>;"}}'
```

Returns `{ status: "success", result: { valid: true } }` or `{ status: "failed", error: "Render error: X is not defined" }`.

## `template.buildFromJSON`
Params: `{ scenes: [...], startFrom?, gap? }`

**JSON → Video pipeline.** Batch-adds multiple catalog scenes to the timeline in one command. Equivalent to remotion-projects' TemplateRenderer.

```json
{
  "type": "template.buildFromJSON",
  "params": {
    "scenes": [
      { "sceneId": "HookScene", "durationMs": 3000, "sceneProps": { "title": "5 AI Tools You Need" } },
      { "sceneId": "AnimatedBarScene", "durationMs": 5000, "sceneProps": { "title": "Adoption Rates", "metrics": [{"label": "ChatGPT", "value": 85, "sublabel": "Leading", "color": "#8B5CF6"}] } },
      { "sceneId": "KeyInsightScene", "durationMs": 4000, "sceneProps": { "title": "Key Takeaway", "text": "AI is transforming workflows" } },
      { "sceneId": "CinematicOutroScene", "durationMs": 4000 }
    ],
    "gap": 0,
    "startFrom": 0
  }
}
```

- Scenes are placed sequentially (each starts after the previous ends + gap)
- Or set explicit `from` on each scene for custom timing
- Props auto-default from scene schema if not provided
- Returns `{ added: N, totalDurationMs, items: [...] }`
- Call `editor.reorderTracks` after to fix layer z-order
