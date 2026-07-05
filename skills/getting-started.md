---
name: getting-started
description: Setup, auth, discovery, and first commands for AI agents
tags: setup, auth, token, discovery, api, curl, start, connect
---

# Getting Started

Use this skill first. It shows how to discover the local API, authenticate, inspect the editor, make a safe first edit, and save.

## Discovery

SkillTown Desktop writes connection details to `~/.skilltown-desktop/api.json` on startup. Always read it fresh because the port and token change per session.

```bash
cat ~/.skilltown-desktop/api.json
```

Expected shape (v3):

```json
{
  "schemaVersion": 3,
  "port": 3847,
  "pid": 12345,
  "token": "64-char-hex-token",
  "baseUrl": "http://127.0.0.1:3847",
  "apiOrigin": "http://127.0.0.1:3847",
  "appOrigin": "https://contentlead.in",
  "mediaServerPort": 3848,
  "contentId": "current-project-id",
  "editorReady": true,
  "startedAt": "2025-01-15T10:30:00.000Z"
}
```

- `apiOrigin` — the local API server (always localhost)
- `appOrigin` — the frontend the Electron window is loading (cloud or local dev)

## Authentication

- `GET /api/info` does **not** require auth.
- All other endpoints require `Authorization: Bearer <token>`.
- Commands are JSON bodies with top-level `type` and `params`.

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/info` | No | App status, readiness, current content ID |
| `GET` | `/api/health` | Yes | Comprehensive health check (editor, media, errors) |
| `GET` | `/api/navigation` | Yes | Current URL, editor state, contentId |
| `GET` | `/api/content/list` | Yes | List all content items with autosave info |
| `POST` | `/api/navigate` | Yes | Navigate to URL (auto-opens editor for content pages) |
| `POST` | `/api/editor/wait-ready` | Yes | Block until editor is mounted and ready |
| `POST` | `/api/project/restore` | Yes | Restore autosave project into editor |
| `POST` | `/api/reload` | Yes | Reload page (with optional waitForReady/autoRestore) |
| `GET` | `/api/capabilities` | Yes | Machine-readable command catalog |
| `GET` | `/api/state?scope=summary\|snapshot\|full` | Yes | Read editor state |
| `POST` | `/api/execute` | Yes | Execute one command |
| `POST` | `/api/batch` | Yes | Execute many commands in order |
| `GET` | `/api/skills` | Yes | List available skill docs |
| `GET` | `/api/skills/:name` | Yes | Load one skill document by name |
| `GET` | `/api/app/auth` | Yes | Check user login state (200 if logged in, 401 if not) |
| `GET` | `/api/app/origin` | Yes | Get current app origin (cloud vs local dev) |
| `POST` | `/api/app/set-origin` | Yes | Switch between cloud and local dev server |

## Health Check

Verify the app is running before doing anything else:

```bash
curl http://127.0.0.1:$PORT/api/health -H "Authorization: Bearer $TOKEN"
```

Typical response:

```json
{
  "editor": { "ready": true, "hasDesign": true, "itemCount": 5 },
  "media": { "port": 3848, "healthy": true },
  "errors": []
}
```

Fallback (no auth): `GET /api/info` — returns basic status.

## User Login Check

Before executing editor commands, verify the user is logged into the web app:

```bash
curl http://127.0.0.1:$PORT/api/app/auth -H "Authorization: ******"
# Logged in:  200 → { "authenticated": true, "user": { "name": "...", "email": "..." } }
# Not logged: 401 → { "authenticated": false, "user": null }
```

If `authenticated: false`, the user must sign in via the app UI first. The app auto-redirects to the login page on startup if no session exists. Login persists across app restarts (7-day refresh token).

## Origin Switching (Cloud ↔ Local Dev)

The Electron app loads a frontend (cloud `contentlead.in` by default, or local `localhost:3000` for development). You can switch at runtime without restarting.

### Check current origin
```bash
curl http://127.0.0.1:$PORT/api/app/origin -H "Authorization: Bearer $TOKEN"
# → { origin: "https://contentlead.in", mode: "cloud", shortcuts: {...} }
```

### Switch to local dev
```bash
curl -X POST http://127.0.0.1:$PORT/api/app/set-origin \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"origin": "local"}'
# → { success: true, activeOrigin: "http://localhost:3000", mode: "local-dev" }
```

### Switch back to cloud
```bash
curl -X POST http://127.0.0.1:$PORT/api/app/set-origin \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"origin": "cloud"}'
```

### Shortcut names
| Shortcut | Resolves to |
|----------|-------------|
| `cloud` | `https://contentlead.in` |
| `local` | `http://localhost:3000` |
| `local-ip` | `http://127.0.0.1:3000` |

You can also pass any full URL: `{"origin": "http://localhost:3001"}`.

**Options:**
- `navigate` (default `true`) — reload the window to the new origin
- `path` (default `"/content"`) — path to navigate to after switching

After switching, use `POST /api/editor/wait-ready` to wait for the editor to reinitialize.

## Navigation & Content Discovery

AI agents can navigate to any content and open it in the editor:

### List content items
```bash
curl http://127.0.0.1:$PORT/api/content/list -H "Authorization: Bearer $TOKEN"
# → { items: [{ id, title, updatedAt, hasAutosave, autosavePath }], total }
```

### Navigate to content (auto-opens editor)
```bash
curl -X POST http://127.0.0.1:$PORT/api/navigate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"url": "/content/content_xxx", "waitForReady": true, "timeoutMs": 30000}'
# → { success: true, editorReady: true }
```

### Wait for editor to be ready (after navigation/reload)
```bash
curl -X POST http://127.0.0.1:$PORT/api/editor/wait-ready \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"timeoutMs": 30000}'
```

### Restore autosaved project
```bash
curl -X POST http://127.0.0.1:$PORT/api/project/restore \
  -H "Authorization: Bearer $TOKEN"
# Automatically finds and loads the autosave file for the current content
```

### Typical AI workflow
1. Read `~/.skilltown-desktop/api.json` for port/token
2. `GET /api/health` — verify app is ready
3. `GET /api/content/list` — find content to edit
4. `POST /api/navigate` with `waitForReady: true` — open it
5. `POST /api/project/restore` — load saved state
6. Edit with `POST /api/execute` commands
7. `editor.save` to persist

## Error Codes

| HTTP Status | Error | Meaning | Common Fix |
|---|---|---|---|
| `401` | `unauthorized` | Missing or invalid bearer token | Re-read `api.json` and resend token |
| `400` | `missing_type` | Missing `type` in request body | Send `{ "type": "...", "params": { ... } }` |
| `503` | `editor_not_ready` | Editor not ready or no project open | Open the editor/project and retry |
| `504` | `timeout` | Command took longer than ~20s | Retry after busy work finishes |
| `500` | `command_failed` | Command execution failed | Inspect `error` / `message` in response |

## First Command Sequence

Recommended order for a safe first session:

1. Check app info
2. Get editor state summary
3. Get tracks and item IDs
4. Make one small edit
5. Save

### 1. Query editor summary

```json
{
  "type": "query.getEditorState",
  "params": {
    "scope": "summary"
  }
}
```

### 2. Query tracks

```json
{
  "type": "query.getTrackInfo",
  "params": {}
}
```

### 3. Make a small edit

```json
{
  "type": "editor.addText",
  "params": {
    "text": "Hello from the API",
    "from_ms": 0,
    "duration_ms": 3000,
    "fontSize": 96,
    "color": "#ffffff",
    "textAlign": "center"
  }
}
```

### 4. Save

```json
{
  "type": "editor.save",
  "params": {}
}
```

## Batch Format

Use batch for related edits that should run in order.

```json
{
  "commands": [
    {
      "type": "query.getEditorState",
      "params": {
        "scope": "summary"
      }
    },
    {
      "type": "editor.addText",
      "params": {
        "text": "Intro title",
        "from_ms": 0,
        "duration_ms": 2500,
        "fontSize": 88,
        "color": "#ffffff"
      }
    },
    {
      "type": "editor.save",
      "params": {}
    }
  ],
  "stopOnError": false
}
```

## Command Reference

### `query.getEditorState`

Read a summary, snapshot, or full design before editing.

| Param | Type | Default | Description |
|---|---|---|---|
| `scope` | `string` | `"summary"` | One of `summary`, `snapshot`, or `full` |

Example:

```json
{
  "type": "query.getEditorState",
  "params": {
    "scope": "summary"
  }
}
```

### `query.getTrackInfo`

Get all tracks plus their items and IDs.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "query.getTrackInfo",
  "params": {}
}
```

### `editor.addText`

Create a simple starter edit.

| Param | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | required | Text content to display |
| `from_ms` | `number` | `0` | Timeline start time in milliseconds |
| `duration_ms` | `number` | editor default | How long the text stays visible |
| `fontSize` | `number` | `120` | Font size in pixels |
| `color` | `string` | `"#ffffff"` | Text color as hex |
| `textAlign` | `string` | `"center"` | `left`, `center`, or `right` |

Example:

```json
{
  "type": "editor.addText",
  "params": {
    "text": "Hello from the API",
    "from_ms": 0,
    "duration_ms": 3000,
    "fontSize": 96,
    "color": "#ffffff",
    "textAlign": "center"
  }
}
```

### `editor.save`

Persist changes.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "editor.save",
  "params": {}
}
```

## Common Patterns / Recipes

### Safe read-first workflow

```json
[
  {
    "type": "query.getEditorState",
    "params": {
      "scope": "summary"
    }
  },
  {
    "type": "query.getTrackInfo",
    "params": {}
  }
]
```

### First visible confirmation edit

```json
[
  {
    "type": "editor.addText",
    "params": {
      "text": "API connected",
      "from_ms": 0,
      "duration_ms": 2000,
      "fontSize": 84,
      "color": "#00ff88",
      "textAlign": "center"
    }
  },
  {
    "type": "editor.save",
    "params": {}
  }
]
```

### Minimal retry loop

1. Re-read `~/.skilltown-desktop/api.json`
2. Re-check `/api/info`
3. Re-run the last query
4. Retry the mutation only after the editor is ready

## Tips for AI Agents

- Always read `~/.skilltown-desktop/api.json` first.
- Always check `/api/info` before mutating.
- Start with read-only queries before edits.
- Use `query.getTrackInfo` to discover valid `item_id` and `track_id` values.
- Keep edits small and verify state between steps.
- Save after meaningful mutations.
- Use `/api/capabilities` or `/api/skills/:name` when you need exact command docs.
- Use batch for ordered multi-step changes, but prefer single commands while exploring.

## ⚠️ Important Technical Notes

### State response structure
All command responses are wrapped: `{commandId, status, result, completedAt, executionTimeMs}`.
For state queries, actual data is inside `result`. The design is at `result.design`:
- `result.design.trackItemsMap` — all items keyed by ID
- `result.design.tracks` — track objects
- `result.design.duration` — total duration in ms

### Adding videos requires metadata
When using `editor.addVideo`, **always provide `width`, `height`, and `duration` (ms)**.
Without these, the internal reducer tries to load the video in a hidden element, which fails for
localhost URLs, data URLs, and many non-public URLs. See the `media-and-audio` skill for details.
