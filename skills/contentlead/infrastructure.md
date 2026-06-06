---
name: infrastructure
description: Infrastructure endpoints for debugging, media management, project lifecycle, screenshots, and UI automation
tags: debug, media, import, analyze, screenshot, project, create, duplicate, ui, action, metrics, diagnostics, scene-bundles
---

# Infrastructure & Utility Endpoints

Endpoints for debugging, media management, project lifecycle, and UI automation that don't fit neatly into the editing workflow.

## Debugging & Monitoring

### POST /api/debug/toggle
Toggle verbose debug logging for command execution.
```bash
curl -X POST http://127.0.0.1:$PORT/api/debug/toggle \
  -H "Authorization: Bearer $TOKEN"
# → { debug: true|false }
```

### GET /api/metrics
API and editor metrics — command success/fail rates, timing stats, uptime.
```bash
curl http://127.0.0.1:$PORT/api/metrics -H "Authorization: Bearer $TOKEN"
# → { uptime, commands: {total, success, failed}, timing: {avg, p99}, ...}
```

### GET /api/diagnostics
Unified error check — console errors, scene errors, timeline issues, media status.
```bash
curl "http://127.0.0.1:$PORT/api/diagnostics?full=true" -H "Authorization: Bearer $TOKEN"
# → { status: "clean"|"issues_found", consoleErrors, sceneErrors, timeline, media }
```
Use `?full=true` for deep scan (slower but more thorough).

### GET /api/screenshot
Capture the current preview frame as a base64 PNG.
```bash
curl http://127.0.0.1:$PORT/api/screenshot -H "Authorization: Bearer $TOKEN"
# → { imageBase64: "data:image/png;base64,...", width, height }
```

### GET /api/events
Server-Sent Events stream for real-time updates (command results, state changes, errors).
```bash
curl -N http://127.0.0.1:$PORT/api/events -H "Authorization: Bearer $TOKEN"
# SSE stream: event: commandResult, data: {...}
```

## Media Management

### POST /api/media/heal
Heal stale media URLs in the live editor state (e.g., after port changes).
```bash
curl -X POST http://127.0.0.1:$PORT/api/media/heal \
  -H "Authorization: Bearer $TOKEN"
# → { healed: 3, items: [...] }
```

### POST /api/media/import
Import a local file into the media library.
```bash
curl -X POST http://127.0.0.1:$PORT/api/media/import \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"path": "/Users/me/Desktop/clip.mp4"}'
# → { success: true, mediaUrl: "http://127.0.0.1:$MEDIA_PORT/media?path=..." }
```

### POST /api/media/analyze
Analyze a media file with ffmpeg — duration, resolution, codec info, optional scene detection.
```bash
curl -X POST http://127.0.0.1:$PORT/api/media/analyze \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"path": "/Users/me/Desktop/clip.mp4", "detectScenes": true}'
# → { duration, width, height, codec, fps, scenes: [...] }
```

## Project Lifecycle

### POST /api/project/create
Create a new empty project with optional dimensions.
```bash
curl -X POST http://127.0.0.1:$PORT/api/project/create \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title": "My New Video", "width": 1080, "height": 1920, "fps": 30}'
# → { contentId, title, navigatedTo }
```

### POST /api/project/duplicate
Duplicate the currently loaded project.
```bash
curl -X POST http://127.0.0.1:$PORT/api/project/duplicate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title": "My Video — Copy"}'
# → { newContentId, autosavePath }
```

### POST /api/content/create
Create new content in the database and navigate to its editor.
```bash
curl -X POST http://127.0.0.1:$PORT/api/content/create \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title": "New Content", "description": "Optional description"}'
# → { contentId, navigatedTo }
```

## UI Automation

### POST /api/ui/action
Trigger a UI action in the editor (as if the user clicked a button).
```bash
curl -X POST http://127.0.0.1:$PORT/api/ui/action \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"action": "save"}'
```
**Available actions:** `save`, `undo`, `redo`, `play`, `pause`, `deselectAll`, `export`

## Scene Bundles (Advanced)

Scene bundles allow custom scenes with `import` statements (unlike basic custom scenes which use eval).

### POST /api/scene-bundles/build
Build a scene bundle from source code with imports.
```bash
curl -X POST http://127.0.0.1:$PORT/api/scene-bundles/build \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "name": "animated-title",
    "source": "import React from \"react\";\nimport { AbsoluteFill, useCurrentFrame } from \"remotion\";\n\nconst Scene = () => { const f = useCurrentFrame(); return <AbsoluteFill style={{opacity: f/30}}>Hello</AbsoluteFill>; };\nexport default Scene;"
  }'
# → { bundleId, name, outputPath }
```

### GET /api/scene-bundles
List all cached scene bundles.

### GET /api/scene-bundles/supported-imports
List available imports for bundled scenes (remotion, react, etc.).

### GET /api/scene-bundles/:id
Get a specific bundle by ID.

### DELETE /api/scene-bundles/:id
Delete a cached bundle.

## Use Case Recipes

### Debug a failing command
```bash
# 1. Toggle debug mode
curl -X POST http://127.0.0.1:$PORT/api/debug/toggle -H "Authorization: Bearer $TOKEN"
# 2. Run the failing command
curl -X POST http://127.0.0.1:$PORT/api/execute -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"type": "...", "params": {...}}'
# 3. Check diagnostics
curl "http://127.0.0.1:$PORT/api/diagnostics?full=true" -H "Authorization: Bearer $TOKEN"
# 4. Check metrics
curl http://127.0.0.1:$PORT/api/metrics -H "Authorization: Bearer $TOKEN"
```

### Create a new project from scratch
```bash
# 1. Create project
curl -X POST http://127.0.0.1:$PORT/api/project/create \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title": "My Video", "width": 1080, "height": 1920}'
# 2. Wait for editor
curl -X POST http://127.0.0.1:$PORT/api/editor/wait-ready \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"timeoutMs": 30000}'
# 3. Start editing...
```

### Analyze media before importing
```bash
# 1. Analyze the file
curl -X POST http://127.0.0.1:$PORT/api/media/analyze \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"path": "/path/to/video.mp4"}'
# 2. Import it
curl -X POST http://127.0.0.1:$PORT/api/media/import \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"path": "/path/to/video.mp4"}'
```
