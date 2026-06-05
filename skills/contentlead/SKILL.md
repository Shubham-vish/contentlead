---
name: contentlead
description: Control the ContentLead video editor from any AI agent. Covers connection, authentication, command execution, error handling, and the full editing workflow. Use when asked to edit video in ContentLead, control the desktop editor, add scenes/text/media to a timeline, render/export videos, or troubleshoot the editor API. For Remotion scene creation (custom animations, effects, camera), also load the `remotion` skill. For creative planning and storyboarding, load the `content-direction` skill.
---

# ContentLead Editor — AI Agent Skill

ContentLead is a desktop video editor (Electron + Next.js) with a **local HTTP API** that lets AI agents control the entire editing workflow — add text, images, video, animated scenes, audio, transitions, render to MP4, and more.

The editor includes 159 pre-built Remotion scenes, a real-time preview, and supports custom scene creation with full React/Remotion capabilities.

## Architecture

```
AI Agent (Claude, Copilot, ChatGPT, Cursor, etc.)
    │
    ▼  HTTP + JSON (Bearer token auth)
┌──────────────────────────────┐
│  Local API Server (Electron) │  ← port + token in ~/.skilltown-desktop/api.json
└──────────────┬───────────────┘
               │ IPC
               ▼
┌──────────────────────────────┐
│  Editor (React + Remotion)   │  ← 110+ commands, real-time preview
└──────────────────────────────┘
```

No external servers needed for editing. Everything runs locally.

## Quick Start

```bash
# 1. Read connection info (changes every session)
API=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo $API | python3 -c "import sys,json; print(json.load(sys.stdin)['port'])")
TOKEN=$(echo $API | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 2. Health check
curl -s http://127.0.0.1:$PORT/api/health -H "Authorization: Bearer $TOKEN"

# 3. Discover capabilities
curl -s http://127.0.0.1:$PORT/api/skills/overview -H "Authorization: Bearer $TOKEN"

# 4. Execute a command
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type": "editor.addText", "params": {"text": "Hello World", "from": 0, "durationMs": 3000}}'
```

## Mandatory Startup Protocol

**Every session must follow this before editing.** Do not skip steps.

### Step 0: Verify the App Is Running

```bash
cat ~/.skilltown-desktop/api.json 2>/dev/null | python3 -c "
import sys,json,subprocess
d = json.load(sys.stdin)
r = subprocess.run(['kill', '-0', str(d['pid'])], capture_output=True)
if r.returncode == 0: print(f'RUNNING on port {d[\"port\"]}')
else: print('NOT RUNNING')
"
```

If not running, start with BOTH Next.js + Electron:
```bash
cd /path/to/SkillTown-Desktop && npm run dev:with-server
# ⚠️ First load compiles 13,700+ modules (30-40s), subsequent loads <1s
# ⚠️ Port and token CHANGE every restart — always re-read api.json
```

### Step 1: Connect
```bash
API=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo $API | python3 -c "import sys,json; print(json.load(sys.stdin)['port'])")
TOKEN=$(echo $API | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
```

### Step 2: Health Check — STOP if not healthy
```bash
curl -s http://127.0.0.1:$PORT/api/health -H "Authorization: Bearer $TOKEN"
# Must have: editor.ready == true, media.serverActive == true
```

### Step 3: Run Diagnostics
```bash
curl -s "http://127.0.0.1:$PORT/api/diagnostics?full=true" -H "Authorization: Bearer $TOKEN"
# If status is 'issues_found', fix all errors before editing
```

### Step 4: Open Content
```bash
# List available content
curl -s http://127.0.0.1:$PORT/api/content/list -H "Authorization: Bearer $TOKEN"

# Navigate + wait + auto-restore autosave
curl -s -X POST http://127.0.0.1:$PORT/api/navigate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"url": "/content/<contentId>", "waitForReady": true, "autoRestore": true, "timeoutMs": 120000}'
```

### Step 5: Wait for DB Load (new projects only)
```bash
# After navigating to NEW projects, wait 10-12s for DB content to load
sleep 10
# Then verify canvas before adding anything:
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type": "query.getCanvasSize", "params": {}}'
```

### Step 6: Start Editing
```bash
# Load the full capability overview from the running app
curl -s http://127.0.0.1:$PORT/api/skills/overview -H "Authorization: Bearer $TOKEN"
```

## Command Execution

All editing is done via `POST /api/execute` with a JSON body:

```json
{
  "type": "editor.addText",
  "params": {
    "text": "Hello World",
    "from": 0,
    "durationMs": 3000,
    "fontSize": 64,
    "color": "#FFFFFF"
  }
}
```

### Response Format

Every response includes `editorHealth` — **always check it**:

```json
{
  "commandId": "cmd_123",
  "status": "success",
  "stateVersion": 42,
  "executionTimeMs": 118,
  "editorHealth": {
    "status": "clean",
    "commandSuccess": true,
    "newConsoleErrors": 0,
    "currentSceneErrors": 0
  },
  "result": { "itemId": "text_abc123" }
}
```

If `editorHealth.status === "issues_found"` → **STOP and fix** before continuing.

### Batch Execution

```json
{
  "type": "batch",
  "commands": [
    {"type": "editor.addText", "params": {"text": "Title", "from": 0, "durationMs": 3000}},
    {"type": "editor.addText", "params": {"text": "Subtitle", "from": 1000, "durationMs": 2000}}
  ],
  "transaction": true
}
```

With `transaction: true`, if any command fails, all are rolled back.

## Runtime Skill Discovery

The running app serves **20 detailed skill docs** via its API. Load them on-demand:

```bash
# List all available skills
curl -s http://127.0.0.1:$PORT/api/skills -H "Authorization: Bearer $TOKEN"

# Load a specific skill
curl -s http://127.0.0.1:$PORT/api/skills/text-and-captions -H "Authorization: Bearer $TOKEN"

# Search skills by keyword
curl -s "http://127.0.0.1:$PORT/api/skills?q=animation" -H "Authorization: Bearer $TOKEN"
```

### Skill Loading Guide

| Task | Skill to Load |
|------|---------------|
| First time connecting | `getting-started` |
| Full capabilities overview | `overview` |
| Adding/styling text | `text-and-captions` |
| Animations, keyframes, effects | `animations-and-effects` |
| Position, align, rotate, layers | `canvas-and-positioning` |
| Images, video, audio, volume | `media-and-audio` |
| Move, trim, split, delete, bulk ops | `timeline-operations` |
| Pre-built scene library (159 scenes) | `scenes-and-templates` |
| Custom Remotion scenes (full code) | `custom-scene-authoring` |
| Render/export video | `rendering` |
| Save/load projects | `project-and-export` |
| Read editor state & timeline | `queries-and-state` |
| End-to-end video creation | `orchestration-e2e` |
| AI image gen, TTS, vision | `ai-content-generation` |
| SFX placement | `sfx-placement` |

## Command Categories (Quick Reference)

## Command Categories (Quick Reference)

### Text & Captions
`editor.addText`, `editor.addCaption`, `editor.editItem`

### Media
`editor.addImage`, `editor.addVideo`, `editor.addAudio`, `editor.replaceMedia`, `editor.setVolume`

### Timeline
`editor.moveItem`, `editor.trimItem`, `editor.splitItem`, `editor.deleteItems`, `editor.removeGaps`

### Scenes (159 pre-built + custom)
`scene.addLibraryScene`, `scene.addCustomScene`, `scene.addBundledScene`, `scene.listScenes`, `scene.getSceneProps`

### Playback & Canvas
`editor.play`, `editor.pause`, `editor.seekTo`, `editor.resize`, `editor.setBackground`

### Effects & Animation
`editor.setAnimation`, `editor.addKeyframe`, `editor.addEffect`, `editor.addTransition`

### Tracks
`editor.reorderTracks`, `editor.muteTrack`, `editor.lockTrack`, `editor.renameTrack`

### Queries (read-only)
`query.getTimelineItems`, `query.getCanvasSize`, `query.getCurrentTime`, `query.getDuration`, `query.diagnoseScenes`

### Render
`POST /api/render` with preset: `preview`, `draft`, `final`, `4k`

## Error Handling

## Error Handling

### Key Rules

1. **Check `editorHealth` in EVERY command response** — it's embedded in every response
2. **After adding scenes**: seek to scene's time range and check for render errors
3. **After batch operations**: run `GET /api/diagnostics`
4. **Before presenting results**: run `GET /api/diagnostics?full=true`

### Common Auto-Fixes

| Error | Fix |
|-------|-----|
| `ERR_CONNECTION_REFUSED` on media URLs | Reload project — URLs auto-heal |
| Scene crash (`data.map is not a function`) | Fix scene props or delete broken item |
| Editor unresponsive | `POST /api/reload` with `waitForReady: true` |
| Zombie items after delete | Use `editor.purgeItems` |

## Critical Rules

### Time Units
**All timeline values use MILLISECONDS** — `from: 5000` = 5 seconds. No exceptions.

### Track Z-Order
**Top track = front layer.** Always call `editor.reorderTracks` after adding all items. Text must be above scenes/backgrounds.

### Media URLs
- **Videos/audio**: served via media server (`/media?path=...`). Local paths auto-resolved.
- **Images**: converted to inline data URLs
- **Never use `blob:` URLs** — they don't survive reloads

### Audio Limit
Max ~5 total audio items in timeline (browser Html5Audio tag limit). Keep to 1 music + max 4 SFX.

### Smart Param Corrections
The API auto-fixes common mistakes (e.g., unwrapped `borderWidth` → wrapped in `details`). Check `commandCorrections` in responses.

## Related Skills

- **`remotion`** — Remotion scene creation knowledge (animations, camera, effects, components). Use when writing custom scenes for the ContentLead editor.
- **`content-direction`** — Creative planning, storyboarding, pacing, track management. Use before building any non-trivial video.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/diagnostics` | Error diagnostics (`?full=true` for deep check) |
| GET | `/api/content/list` | List available content |
| POST | `/api/navigate` | Navigate to content |
| POST | `/api/execute` | Execute editor command |
| POST | `/api/batch` | Execute multiple commands |
| GET | `/api/state` | Get current editor state |
| POST | `/api/render` | Start render job |
| GET | `/api/skills` | List runtime skills |
| GET | `/api/skills/:name` | Load specific skill |
| GET | `/api/events` | SSE event stream |
| GET | `/api/console-errors` | Browser errors |

## Auth

All endpoints except `/api/info` require: `Authorization: Bearer <token>`

Token is in `~/.skilltown-desktop/api.json` — changes each session.
