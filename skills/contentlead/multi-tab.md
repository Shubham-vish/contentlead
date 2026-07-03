# ContentLead Multi-Tab Control

## Overview

SkillTown-Desktop now supports multiple simultaneous projects via tabs. Agents can discover every open tab and target a specific project by passing `tabId` to editor commands, which keeps concurrent work isolated even when multiple agents are editing different projects in the same desktop app.

## Discovery

`~/.skilltown-desktop/api.json` now uses `schemaVersion: 4` and includes a `tabs[]` array in addition to the active-tab compatibility fields (`contentId`, `editorReady`, etc.). Treat the top-level `contentId` as the active tab only; use `tabs[]` or `GET /api/tabs` when you need all projects.

Example discovery file:

```json
{
  "schemaVersion": 4,
  "port": 54110,
  "token": "abc...",
  "baseUrl": "http://127.0.0.1:54110",
  "apiOrigin": "http://127.0.0.1:54110",
  "appOrigin": "https://contentlead.in",
  "contentId": "content_active",
  "activeTabId": "tab-abc",
  "tabs": [
    {
      "tabId": "tab-abc",
      "contentId": "content_active",
      "title": "Active Project",
      "url": "/content/content_active?view=editor",
      "active": true,
      "ready": true
    },
    {
      "tabId": "tab-def",
      "contentId": "content_other",
      "title": "Other Project",
      "url": "/content/content_other?view=editor",
      "active": false,
      "ready": true
    }
  ]
}
```

### `GET /api/tabs`

Use this endpoint whenever you need the current tab list after startup.

```bash
curl -s http://127.0.0.1:$PORT/api/tabs \
  -H "Authorization: Bearer $TOK" | python3 -m json.tool
```

Response shape:

```json
{
  "status": "success",
  "activeTabId": "tab-abc",
  "tabs": [
    {
      "tabId": "tab-abc",
      "contentId": "content_active",
      "title": "Active Project",
      "url": "/content/content_active?view=editor",
      "active": true,
      "ready": true
    }
  ]
}
```

### Real-time tab updates

Subscribe to `GET /api/events` and watch for the `tabs.updated` SSE event so workers can react when the user or another agent opens, closes, activates, or navigates tabs.

```bash
curl -N http://127.0.0.1:$PORT/api/events \
  -H "Authorization: Bearer $TOK"
```

Event payload shape:

```text
event: tabs.updated
data: {"activeTabId":"tab-abc","tabs":[{"tabId":"tab-abc","contentId":"content_active","active":true}]}
```

## Targeting a tab in commands

The same 4-rule strict validation applies to **every HTTP endpoint that dispatches renderer commands**, not just `/api/execute`. Endpoints in scope:

| Endpoint | tabId location | Notes |
|----------|---------------|-------|
| `POST /api/execute` | body `{tabId}` | Main command endpoint |
| `POST /api/batch` | body `{tabId}` on each command | Batch runs in one tab |
| `POST /api/project/save` | body `{tabId}` or `{contentId}` | Saves specific project |
| `POST /api/project/save-autosave` | body `{tabId}` or `{contentId}` | Autosave specific project |
| `POST /api/project/export` | body `{tabId}` | Exports specific project |
| `POST /api/project/import` | body `{tabId}` | Imports into specific tab |
| `POST /api/project/open` | body `{tabId}` | Opens file in specific tab |
| `POST /api/project/restore` | body `{tabId}` or `{contentId}` | Restores specific project |
| `POST /api/project/duplicate` | body `{tabId}` | Duplicates specific project |
| `GET  /api/state` | query `?tabId=` | Reads specific tab's state |
| `GET  /api/diagnostics` | query `?tabId=` | Diagnoses specific tab |
| `GET  /api/screenshot?mode=preview` | query `?tabId=` | Captures specific tab |

If `tabId` (or `contentId` for endpoints that accept it) is omitted and only one tab is open, the command runs against that tab. If multiple tabs are open and no target is specified, the request is REJECTED with HTTP 409 and an actionable error listing all available tabs. This prevents commands being silently applied to the wrong project.

```bash
# Body-based (POST endpoints)
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOK" \
  -H "Content-Type: application/json" \
  -d '{"tabId": "tab-abc", "type": "editor.addText", "params": {"text": "Hello"}}'

# Query-based (GET endpoints)
curl "http://127.0.0.1:$PORT/api/diagnostics?tabId=tab-abc" \
  -H "Authorization: Bearer $TOK"

# contentId-based (auto-resolves to the single hosting tab if unambiguous)
curl -X POST http://127.0.0.1:$PORT/api/project/save-autosave \
  -H "Authorization: Bearer $TOK" \
  -H "Content-Type: application/json" \
  -d '{"contentId": "content_9daa..."}'
```

### Endpoints that intentionally ignore tabId

These target the active tab by design (background/UI operations, not agent commands):

- Health-check cache refreshers inside the API server
- Keyboard shortcut dispatcher (`deselectAll`, etc.)
- SSE stream events (broadcast globally)

These paths don't accept agent-supplied commands, so ambiguity isn't possible.

### Validation errors you might get

#### Rule 1 — Unknown tabId (HTTP 404)

```json
{
  "status": "failed",
  "error": "unknown_tab",
  "message": "No tab found with tabId='tab-xyz'. Call GET /api/tabs to list valid tabIds.",
  "tabId": "tab-xyz",
  "availableTabs": [...]
}
```

**How to fix:** call `GET /api/tabs`, pick the right tabId, retry.

#### Rule 2 — Single tab open, no tabId needed

Command runs against the only tab. No error, no warning.

#### Rule 3 — Multi-tab ambiguity (HTTP 409 Conflict)

```json
{
  "status": "failed",
  "error": "tabId_required",
  "message": "Multiple tabs are open — you MUST specify tabId...",
  "tabCount": 3,
  "activeTabId": "tab-abc",
  "availableTabs": [...],
  "hint": "..."
}
```

**How to fix:** the response CONTAINS the tabId list. Pick the right one (match by `contentId` or `title`), then re-send the same command with `tabId` in the body.

#### Rule 4 — Tab exists but editor not mounted (HTTP 425 Too Early)

```json
{
  "status": "failed",
  "error": "tab_not_ready",
  "message": "Tab 'tab-xyz' exists but its editor has not mounted yet.",
  "tabId": "tab-xyz",
  "editorReady": false
}
```

**How to fix:** poll `GET /api/tabs` or subscribe to SSE `tabs.updated` until that tab's `ready: true`, then retry.

## Tab lifecycle (creating, switching, closing tabs)

### Create a tab

Open a URL in a fresh tab:

```bash
curl -X POST http://127.0.0.1:$PORT/api/tabs/new \
  -H "Authorization: Bearer $TOK" \
  -H "Content-Type: application/json" \
  -d '{"url": "/content/content_abc?view=editor"}'
```

Open a content item in a fresh tab:

```bash
curl -X POST http://127.0.0.1:$PORT/api/tabs/new \
  -H "Authorization: Bearer $TOK" \
  -H "Content-Type: application/json" \
  -d '{"contentId": "content_abc"}'
```

Typical response:

```json
{
  "status": "success",
  "tabId": "tab-abc",
  "activeTabId": "tab-abc",
  "tab": {
    "tabId": "tab-abc",
    "contentId": "content_abc",
    "url": "/content/content_abc?view=editor",
    "active": true,
    "ready": true
  }
}
```

### Activate a tab

```bash
curl -X POST http://127.0.0.1:$PORT/api/tabs/tab-abc/activate \
  -H "Authorization: Bearer $TOK"
```

### Close a tab

```bash
curl -X POST http://127.0.0.1:$PORT/api/tabs/tab-abc/close \
  -H "Authorization: Bearer $TOK"
```

Save before closing a tab if you made changes:

```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOK" \
  -H "Content-Type: application/json" \
  -d '{"tabId":"tab-abc","type":"editor.save","params":{}}'
```

### Navigate an existing tab

Use this when you want to open a different content/project in an existing tab instead of creating a new tab.

```bash
curl -X POST http://127.0.0.1:$PORT/api/tabs/tab-abc/navigate \
  -H "Authorization: Bearer $TOK" \
  -H "Content-Type: application/json" \
  -d '{"contentId": "content_new"}'
```

You can also navigate by URL:

```bash
curl -X POST http://127.0.0.1:$PORT/api/tabs/tab-abc/navigate \
  -H "Authorization: Bearer $TOK" \
  -H "Content-Type: application/json" \
  -d '{"url": "/content/content_new?view=editor"}'
```

## Parallel-agent patterns

### Pattern A: Two agents, two tabs (isolated)

Agent A works on `tab-1` and Agent B works on `tab-2`. Both agents pass `tabId` in every `/api/execute` body. Per-tab command queues mean commands in `tab-1` and `tab-2` do not block each other, while commands within the same tab still execute in order.

```bash
# Agent A
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
  -d '{"tabId":"tab-1","type":"editor.addText","params":{"text":"A"}}'

# Agent B
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
  -d '{"tabId":"tab-2","type":"editor.addText","params":{"text":"B"}}'
```

### Pattern B: One agent, multiple tabs (workflow orchestration)

One agent opens three tabs for three projects, then applies the same edit to all of them with three concurrent `/api/execute` calls using different `tabId` values.

```bash
for TAB in tab-1 tab-2 tab-3; do
  curl -s -X POST http://127.0.0.1:$PORT/api/execute \
    -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
    -d "{\"tabId\":\"$TAB\",\"type\":\"editor.addText\",\"params\":{\"text\":\"Reviewed by AI\"}}" &
done
wait
```

### Pattern C: Coordinator agent + worker agents

The coordinator calls `GET /api/tabs`, records work items in SQL todos keyed by `tabId`, and assigns each worker a specific tab. Workers pick up one todo at a time and include that `tabId` in every command, diagnostic check, save, and render request.

Suggested todo fields:

```text
id: edit-content-abc
description: Apply intro polish to content_abc in tab-abc. Every /api/execute call must include tabId=tab-abc.
status: pending | in_progress | done | blocked
```

## Anti-patterns

- Sending commands without `tabId` when multiple tabs are open — this now HARD-FAILS with HTTP 409 `tabId_required`. Read the response's `availableTabs` list and re-send with the correct tabId.
- Assuming `~/.skilltown-desktop/api.json` `contentId` is the tab you're working on — it is only the ACTIVE tab.
- Relying on tab order — tabs can be reordered by the user; always look up by `tabId`.

## Session-start protocol update

Use this startup flow for multi-tab aware agents:

```text
1. cat ~/.skilltown-desktop/api.json  → see all tabs
2. If your target contentId is already in tabs[] → use its tabId
3. Else → POST /api/tabs/new {contentId} to open it in a fresh tab
4. Every subsequent /api/execute → pass tabId
```
