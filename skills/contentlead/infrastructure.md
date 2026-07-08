---
name: infrastructure
description: Infrastructure endpoints for debugging, media management, project lifecycle, screenshots, and UI automation
tags: debug, media, import, analyze, screenshot, project, create, duplicate, ui, action, metrics, diagnostics, scene-bundles
---

# Infrastructure & Utility Endpoints

Endpoints for debugging, media management, project lifecycle, and UI automation that don't fit neatly into the editing workflow.

## ⚠️ App/API Port Regenerates on Restart

Every time the Electron app restarts (hot reload, crash, manual restart, code changes), the API port + token regenerate in `~/.skilltown-desktop/api.json`. Never hardcode these — always read fresh each call:

```bash
CONFIG=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo "$CONFIG" | python3 -c "import sys,json; print(json.load(sys.stdin)['port'])")
TOKEN=$(echo "$CONFIG" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
```

If your script hits `ConnectionRefusedError` mid-session, re-read the config — the port likely changed.

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

### GET /api/console-errors
Last 100 browser console errors/warnings (circular buffer). Does not clear on read.
```bash
curl "http://127.0.0.1:$PORT/api/console-errors" -H "Authorization: ******"
# -> [{"seq": 1, "level": "error", "message": "...", "source": "...", "timestamp": "..."}, ...]
```
Use `?since=<seq>` to get only errors after a known sequence number (for delta checks).

### Error Information in Every Command Response

**Every** `/api/execute` response automatically includes error monitoring data — no extra call needed:

```json
{
  "status": "success",
  "result": { ... },

  "warnings": [
    {"seq": 229, "level": "error",
     "message": "Uncaught Error: ...",
     "source": "some_module.js",
     "timestamp": "2026-07-08T13:44:30Z"}
  ],
  "warningCount": 2,
  "hasNewErrors": true,

  "editorHealth": {
    "status": "clean",
    "commandSuccess": true,
    "newConsoleErrors": 0,
    "totalConsoleErrors": 25,
    "currentSceneErrors": 0,
    "errorGroups": [],
    "firstError": null,
    "hint": "GET /api/diagnostics for full details"
  }
}
```

**These fields are returned in every response automatically — no extra call needed.** The agent just reads them from the response it already has.

| Field | What It Means |
|---|---|
| `editorHealth.newConsoleErrors` | Count of browser console errors during THIS command. **0 = clean.** |
| `editorHealth.status` | `"clean"` or `"issues_found"` |
| `hasNewErrors` | Boolean shortcut for quick checks |
| `warnings[]` | Actual error messages with source file, timestamp, severity |
| `editorHealth.totalConsoleErrors` | Total errors in buffer (includes old ones from before this command) |
| `editorHealth.errorGroups` | Errors grouped by source+type for quick categorization |
| `editorHealth.firstError` | First error message (truncated) for quick triage |

**When to make extra calls (only if needed):**
- `GET /api/diagnostics?full=true` — when `warnings[]` messages are unclear and you need more context
- `GET /api/console-errors` — when you need the full historical error buffer (e.g. errors from before your session)
- `query.diagnoseScenes` — when timeline behavior seems wrong (checks editor data model, not console)

### query.diagnoseScenes (bridge command)
Check all bundled/custom Remotion scenes for runtime rendering errors.
```json
{"type": "query.diagnoseScenes", "params": {}}
```
Returns: `{ count, errors, scenes }` — `count > 0` means a scene has bad props or broken code.

## Media Validation Commands

### `media.validate`
Pre-flight check for a single URL — tests CORS, accessibility, content type, blob detection.
```json
{ "type": "media.validate", "params": { "url": "http://...", "type": "video" } }
```
**Returns:** `{ accessible, contentType, cors, warnings }` — run before `editor.addVideo`/`addImage`.

### `media.status`
Batch check ALL media items in the current project.
```json
{ "type": "media.status", "params": {} }
```
**Returns:** `{ totalMediaItems, brokenCount, items }` — use to find stale URLs or missing files.

### `media.prepare`
Batch URL accessibility check for multiple URLs at once.
```json
{ "type": "media.prepare", "params": { "urls": ["http://...", "http://..."] } }
```

### Common Error Categories

| Category | Example Message | Cause | Action |
|---|---|---|---|
| **Firebase serialization** | `set failed: value contains a function` | Animation presets with JS function refs | Auto-stripped by `stripUndefined()` — safe to ignore |
| **Animation invalid values** | `Invalid animation values: [object Object]` | Wrong composition data sent to renderer | Check preset name is valid |
| **Font loading** | `DOMException` on font load | Caption fonts loading async | Expected, non-blocking — ignore |
| **CSP / file:// blocked** | `net::ERR_BLOCKED_BY_CSP` | Video added with `file://` path | Use media server URL: `http://127.0.0.1:PORT/media?path=...` |
| **SSE reconnect** | `net::ERR_FAILED` on `/api/events` | App restart during SSE connection | Expected during restarts — ignore |
| **Scene errors** | `currentSceneErrors > 0` | Remotion scene has rendering errors | Check scene props and component code |


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

## ⚠️ Render Worker is a Forked Child Process

The render worker (`electron/render-worker.cjs`) is a `fork()`'d Node child process. It loads all `require()`'d modules ONCE at startup. When you edit render-related code:

- `electron/render-worker.cjs`
- `electron/audio-processing/eq-filters.cjs`
- `electron/design-converter/item-converters.cjs`

The changes will NOT take effect until you restart the worker. The Electron main process doesn't auto-reload it.

**How to restart:**
```bash
# Find worker PID
ps aux | grep render-worker | grep -v grep
# Kill it — parent will respawn on next render
kill <PID>
```

Verify no worker running afterward: `ps aux | grep render-worker | grep -v grep` (should be empty). Next render call will spawn a fresh worker with your updated code.

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

### POST /api/content/create (Primary — use this)
Create new content in the **cloud database** and navigate to its editor.
```bash
curl -X POST http://127.0.0.1:$PORT/api/content/create \
  -H "Authorization: <token>" -H "Content-Type: application/json" \
  -d '{"title": "New Content", "description": "Optional description"}'
# Returns: { status, contentId, tabId, editorReady, navigated }

# With waitForReady (blocks until editor is fully ready):
curl -X POST http://127.0.0.1:$PORT/api/content/create \
  -H "Authorization: <token>" -H "Content-Type: application/json" \
  -d '{"title": "New Content", "waitForReady": true, "timeoutMs": 60000}'
# Returns: { status, contentId, tabId, editorReady: true, navigated }
```

> `/api/project/create` and `/api/project/duplicate` have been **REMOVED**.
> They created local-only files that caused "Content Not Found" on the cloud frontend.
> Always use `/api/content/create` instead.

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
