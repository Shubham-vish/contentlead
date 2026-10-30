---
name: infrastructure
description: Infrastructure endpoints for debugging, media management, project lifecycle, screenshots, and UI automation
tags: debug, media, import, analyze, screenshot, project, create, duplicate, ui, action, metrics, diagnostics, scene-bundles
---

# Infrastructure & Utility Endpoints

Endpoints for debugging, media management, project lifecycle, and UI automation that don't fit neatly into the editing workflow.

## 🟢 Ensure the ContentLead desktop app is running (do this FIRST)

Every bridge call needs fresh `~/.skilltown-desktop/api.json` discovery. File existence alone does **not** prove liveness: an earlier crash can leave stale port/token data. A missing file means discovery is unavailable, not necessarily that no process exists.

**Step 1 — detect.** Parse discovery without printing credentials, verify its API origin is loopback, and use an authenticated request with a short timeout to `/api/health`. On refusal or 401, re-read discovery once. If still unavailable, report runtime unavailability. A source/mock audit must stop here without launching, reloading, switching origins, or contacting cloud/provider APIs.

**Step 2 — only if the task allows launching.** Pick the ONE line for YOUR operating system. Preserve existing work and do not start a local web server or switch an existing application's origin as an automatic repair.

```bash
# ── macOS (packaged app) ──────────────────────────────────────────────
open -a "ContentLead"

# ── Linux (packaged AppImage/deb) ─────────────────────────────────────
contentlead >/dev/null 2>&1 &        # or launch the installed .desktop entry
```

```powershell
# ── Windows (packaged app) — PowerShell. Per-user NSIS install. ────────
Start-Process "$env:LOCALAPPDATA\Programs\ContentLead\ContentLead.exe"
# If the user changed the install dir, fall back to the Start-menu shortcut:
Start-Process "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\ContentLead.lnk"
```

```bash
# ── Dev / localhost (any OS, from the repo) ───────────────────────────
cd SkillTown-Desktop && npm start           # electron .  (uses cloud web app)
# full stack (local Next.js + Electron):  npm run dev:with-server
```

**Step 3 — wait for discovery, then verify liveness.** These file polls alone do not establish readiness; re-read credentials and repeat the authenticated health request after discovery appears.

```bash
# bash (macOS/Linux) — poll up to ~30s
for i in $(seq 1 30); do [ -f ~/.skilltown-desktop/api.json ] && break; sleep 1; done
```
```powershell
# PowerShell (Windows)
1..30 | ForEach-Object { if (Test-Path "$env:USERPROFILE\.skilltown-desktop\api.json") { break }; Start-Sleep 1 }
```

**Step 4 — distinguish failures.** Missing/stale discovery is a local connection issue. Web login is separate: `GET /api/app/auth` reports that session (200/401). A healthy local API does not prove cloud login, project hydration, command support, or provider availability.

> App identity: display name **`ContentLead`** (bundle `com.contentlead.editor`, macOS `/Applications/ContentLead.app`). This is the same app every `cl-*` bridge skill talks to.

## ⚠️ App/API Port Regenerates on Restart

On each API-server start the bearer token regenerates; the preferred port may be reused or may change. Always read fresh discovery after a restart:

```bash
CONFIG=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo "$CONFIG" | python3 -c "import sys,json; print(json.load(sys.stdin)['port'])")
TOKEN=$(echo "$CONFIG" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
```

If your script hits `ConnectionRefusedError` mid-session, re-read discovery and make one bounded health check: the listener may have restarted or stopped, with or without a port change.

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
Use `?afterSeq=<seq>` to get only errors after a known sequence number (for delta checks). The response is `{entries, count, totalBuffered, lastSeq}`, not a bare array.

## Transport and distribution contract

1. The AI reads local discovery (schema v4), authenticates with `Authorization: Bearer $TOKEN`, selects a tab, and sends `/api/execute`.
2. Desktop resolves that tab's `webContents`, queues commands per tab, and sends `editor:execute` through preload to the web `ElectronAgentBridge`. The web executor handles its own typed/validated command path. Results return through `editor:result`; Desktop accepts them only from the addressed renderer, then adds diagnostics. A timeout is not proof a mutation was rolled back.
3. `/api/bridge/*` is a different transport: Desktop forwards allowlisted requests through the signed-in renderer/session to web API routes. Business command manifests and server schemas belong to those routes; they are not entries in the editor executor's registry. Some media uploads use the same session's cookies with a Node HTTP upload.
4. `/api/capabilities?tabId=<id>` separates installed `commands`/`httpOperations`/endpoint metadata from sender-bound live `renderer.capabilities` (authoritative names/version, hydration, safe-to-write, save state and bounded `contracts.trackPlacement` fresh-track support/command names). Query `query.getCapabilities` for the full renderer contracts; absent placement support is not permission to assume it. Missing live reports are labeled unverified; multiple tabs without a target return `renderer:null` plus the list. Desktop-native handlers are listed separately. Unsupported live commands, stale `expectedContentId` and unhydrated writes fail before queued IPC; separate capability updates never trigger auto-restore. Ads/content-style/watchlist HTTP-only aliases still reject execute/batch with `command_not_executable`. No catalog alone proves complete UI parity.
5. `/api/skills` merges canonical files over validated public bundles. `source`, `partial`, `errors` and `installation` expose provenance, failures and concrete helper availability. Missing declared public families or a missing family manifest are partial/unverified, not silent completeness. Canonical root selection is explicit `CONTENTLEAD_SKILLS_DIR`, installed `cl-desktop`/`cl-editor` loader target, then legacy checkout location. Unsupported watching refreshes per request. Authenticated local private Markdown discovery is preserved, **never** redistributed. Helper availability verifies declared source-file presence only, not source hashes, Python/models or executable readiness.
6. Packaging runs `node scripts/sync-public-skills.cjs` and `--check` before electron-builder. Only public-Git-tracked Markdown, exact reviewed new public docs, allowlisted Offers/Deals `commands.json`, and four approved indexes ship. Untracked session files, arbitrary JSON/media/scripts, hidden/env/Git files and symlink escapes do not. Target roots/source overlap and unmanaged existing files are refused; generation only replaces known managed bundle contents. The hash manifest is written last. JSON references return as response `content` strings. Helper scripts/dependencies are not installed; use reported canonical paths and their prerequisites/review status, not guessed hard-coded machine paths.

Do not equate edited source, bundle, installed app, loaded renderer or deployed server. Known JSON commands/reviewed JSON routes and opted-in uploads reject HTML/non-JSON success as an uncertain outcome, with no generic mutation replay. Calls/CRM/Meta retain only their recognized pre-execution session-auth retry. Valid unrelated text/binary paths are not forced through JSON. Reconcile native saved state before retrying a timeout, payment, generation or publishing write.

### Error Information in Every Command Response

Completed `/api/execute` execution paths add error monitoring. Early auth/body/tab/preflight errors may not include it, and `warnings` is omitted when empty:

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

Read the health/diagnostic fields when present, as well as HTTP status and the JSON outcome. Missing health fields on a rejected request are not evidence of a clean editor.

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
# 1. Create content in CosmosDB + auto-navigate to editor (waits for editor ready)
curl -X POST http://127.0.0.1:$PORT/api/content/create \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title": "My Video", "description": "", "waitForReady": true, "timeoutMs": 60000}'
# → {status, contentId, tabId, editorReady: true, navigated}

# 2. Verify/set canvas dimensions BEFORE adding items
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"query.getCanvasSize","params":{}}'
# Resize if needed:
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"editor.resize","params":{"width":1080,"height":1920}}'

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
