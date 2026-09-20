---
name: cl-board
description: Control the ContentLead Whiteboard (Boards) from any AI terminal. Same desktop bridge as cl-editor — different command surface. Use for building diagrams, mind maps, flowcharts, slide decks, sticky-note brainstorms, and anything else that belongs on a canvas rather than a video timeline. Do NOT use this for video editing (that is cl-editor).
---

# ContentLead Boards — AI Bridge

> **⚙️ Is the ContentLead app running?** These calls need `~/.skilltown-desktop/api.json`. If it is missing, the desktop app is not running — start it, then wait ~30s for the file: **macOS** `open -a "ContentLead"` · **Windows (PowerShell)** `Start-Process "$env:LOCALAPPDATA\Programs\ContentLead\ContentLead.exe"`. Full OS-aware detect/start/poll (Linux + dev too): see `cl-editor/infrastructure.md` → "Ensure the ContentLead desktop app is running". Only ask the user if it still does not come up.

Companion skill to `cl-editor`. Same discovery file (`~/.skilltown-desktop/api.json`), same `POST /api/execute` endpoint, same auth token. The difference is the **tab** you target and the **command namespace**.

## When to load this vs cl-editor

| You want to… | Load |
|---|---|
| Trim / caption / animate a video timeline | `cl-editor` |
| Add scenes / SFX / render an MP4 | `cl-editor` |
| Draw a flowchart, mind map, or system diagram | `cl-board` (this) |
| Build a slide deck as canvas frames | `cl-board` |
| Brainstorm on sticky notes / connectors | `cl-board` |
| Sketch a wireframe / architecture picture | `cl-board` |

The two bridges coexist. If both an editor tab and a board tab are open, you MUST pass `tabId` in every `/api/execute` body — the desktop returns HTTP 409 otherwise with the full tab list to pick from.

## Mandatory Startup Protocol

```bash
# 1. Read discovery file (port + token change every desktop restart)
API=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['port'])")
TOKEN=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 2. Find the board tab (or open one)
curl -s http://127.0.0.1:$PORT/api/tabs -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys, json
d = json.load(sys.stdin)
for t in d.get('tabs', []):
    print(f\"{t['tabId']}  {t.get('url','?')}  active={t.get('active')}\")
"
# Look for a URL whose pathname is '/board/<boardId>' (URLs can be absolute).
# Save that tabId.
TAB_ID=<the-tabId-from-above>

# 3. Sanity-check: the board bridge is ready.
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"tabId\":\"$TAB_ID\",\"type\":\"board.query.info\",\"params\":{}}"
# Expect: {"status":"success","result":{"boardId":"...","boardTitle":"...","objectCount":N,...}}
```

If no board tab is open, open one with:

```bash
# Open a new tab at an existing board:
curl -s -X POST http://127.0.0.1:$PORT/api/tabs/new \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"url":"/board/<boardId>"}'

# Or create a fresh board through authenticated Desktop:
# POST /api/bridge/boards {title: "..."} → returns {id: "..."}, then navigate to /board/<id>.
# Use the same Desktop bearer header; the proxy handles the signed-in app cookies.
```

The bridge lives in `app/board/[boardId]/context/BoardAgentBridge.tsx`. Readiness alone is not proof that commands respond: require a successful `board.query.info` before editing. On timeout, inspect the target tab and authentication; do not blindly repeat mutations or reload unsaved work.

## Command Namespaces

| Namespace | What it does | Undo-logged? |
|---|---|---|
| `board.query.*` | Read canvas state (info, objects, selection, snapshot, viewport, point hit-test) | No |
| `board.query.canvasBounds` | Bbox of all objects (`minX/minY/maxX/maxY/width/height/count/isEmpty`) | No |
| `board.query.searchImages` | Pexels stock-image search (returns URLs + dimensions) | No |
| `board.addNode`, `board.editNode`, `board.deleteNodes`, `board.moveNode` | Object CRUD via `BoardActionExecutor` | Yes |
| `board.deleteRegion` | Bounded-box eraser with exact bbox math + `dryRun` | Yes |
| `board.addImage` | Fetch remote image URL, auto-probe size, insert scaled | Yes |
| `board.addConnector`, `board.editConnector` | Connectors between objects | Yes |
| `board.addMindmapChild`, `board.mindmap.layout` | Create children with shared mindmap styling; reflow a subtree | Yes |
| `board.mindmap.expand`, `board.mindmap.collapse` | UI-equivalent folding: `scope: "step"` (default) or `"subtree"` | Yes, when changed |
| `board.toggleCollapse`, `board.collapseAllDescendants` | Legacy folding commands; see compatibility notes in `actions.md` | Yes |
| `board.revealObject` | Reveal an object's ancestor path, select it, and frame it like a search result | Fold changes only |
| `board.query.commands` | Actual command names supported by the loaded board renderer | No |
| `board.groupObjects`, `board.ungroupObjects`, `board.lockObjects` | Selection ops | Yes |
| `board.duplicate` | Clone one or many objects with an offset | Yes |
| `board.align`, `board.distribute` | Multi-object alignment (2+) / distribution (3+) | Yes |
| `board.setTransform` | Rotate / scale / resize / move a single object | Yes |
| `board.bringToFront`, `board.sendToBack` | Z-order | Yes |
| `board.addSlide`, `board.generateDeck`, `board.applyDeckTheme` | Slide-deck helpers | Yes |
| `board.batch` | Run executor mutations with `$ACTION_N_RESULT` refs; not arbitrary queries, IO, or reveal commands | Yes (one entry) |
| `board.undo`, `board.redo`, `board.deleteAll` | History control | (special) |
| `board.setViewport`, `board.zoomToFit`, `board.panBy` | Camera | No |
| `board.select`, `board.selectAll`, `board.clearSelection` | Selection | No |
| `board.setTheme`, `board.setBackground` | Canvas appearance | No |
| `board.togglePanels` | Show/hide overlays (ai, external, minimap, ruler, layers, toolbar). Convenience `hideAll: true`. Returns `previous` state. | No |
| `board.screenshot` | Capture a world region (or `ids` bbox) as base64 PNG/JPEG. Auto hides overlays, restores viewport & panels. | No |
| `board.screenshot.multi` | Sequential capture of many regions with one hide/restore cycle. Returns `{ shots: [...] }`. | No |
| `board.exportPng` | High-quality offscreen PNG render (`region` OR `ids`). Does NOT move viewport or mutate DOM state persistently. | No |
| `board.checkpoint`, `board.restoreCheckpoint`, `board.query.checkpoints`, `board.deleteCheckpoint` | Named bookmarks over the undo stack. Restore = `undo()` loop until depth matches. | Special |
| `board.defineStyle`, `board.deleteStyle`, `board.query.styles` | Session-scoped named style presets. Reference via `styleId` on any command. | No (session-scoped, not persisted) |
| `board.addSection` | Titled frame that auto-lays out its children (stack / row / grid) — one atomic undo entry. | Yes |
| `board.save`, `board.setTitle`, `board.reload` | Persistence (`/api/boards/[boardId]`) | N/A |

**`renderAs` supported by `board.addNode`:** `sticky`, `shape`, `text`, `mermaid`, `frame`, `doc`, `image`, `freehand`/`draw`/`path`, `html`, `webview`/`iframe`/`embed`, `video`.

Full parameter reference: `queries.md`, `actions.md`, `viewport-and-io.md` in this skill folder.

## Skill Routing Table

| Task | Load |
|---|---|
| Read canvas / find objects / inspect selection | `queries` |
| Add / edit / delete shapes, stickies, text, connectors | `actions` |
| Slide decks (`board.addSlide` / `board.generateDeck`) | `actions` (section "Slide decks") |
| Move camera, change theme, save / rename board | `viewport-and-io` |
| **Take screenshots** (region / object / whole board) — use `board.screenshot` / `board.screenshot.multi`. Fallback = `setViewport` + `/api/screenshot`. | `viewport-and-io` (section "Screenshots") |
| Batch actions with `$ACTION_N_RESULT` refs | `actions` (section "Batch + references") |
| Staged mindmap reveal, full-branch folding, moving the add button, branch styling | `actions` (section "Mindmap / collapsible trees") |
| Search folded content and reveal a result | `queries` (`query` filter, then `board.revealObject`) |
| Boards library list/search/sort/thumbnail APIs | `viewport-and-io` (section "Boards library") |

## ⚠️ Multi-tab targeting

The desktop's `/api/execute` uses `tabId` in the request body to route commands to a specific tab. If a board tab and an editor tab are both open:

```bash
# ✅ Correct — always pass tabId when >1 tab is open
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"<board-tab-id>","type":"board.query.info","params":{}}'

# ❌ Wrong — no tabId, returns HTTP 409 with tab list
```

The board bridge ignores non-board commands intended for the video editor. Unknown `board.*` commands return an explicit failure. Never infer success from a ready flag or timeout; a wrong-tab command may be ignored by that tab's bridge.

For Desktop `/api/batch`, include `tabId` on **every command item**, not just the outer body. Foreground the target board before screenshots/export; background animation frames can stall capture. See `viewport-and-io` for activation and restoration.

Updated Desktop health marks the video-only scene check `not_applicable` with reason `board_surface` for ready board tabs. That is expected, not a failure; actual command/console errors still count. Older running main processes may instead spend ~20 seconds on a video scene-check timeout after successful board commands. Restart Desktop only after preserving work to load the fix. Boards use renderer `board.save`, not Desktop's video timeline autosave.

## Verification pattern (use after every mutation)

Board mutations are synchronous — the response you get back reflects the final state. But for peace of mind:

```bash
# 1. Save last snapshot version
BEFORE=$(curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.query.info"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['result']['objectCount'])")

# 2. Mutate
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.addNode","params":{"renderAs":"sticky","x":100,"y":100,"text":"Hello"}}'

# 3. Confirm
AFTER=$(curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.query.info"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['result']['objectCount'])")

echo "objects: $BEFORE → $AFTER"
```

## Persistence

Board mutations are **applied to the canvas immediately** but are **NOT persisted** to the SkillTown DB until you either:

1. Call `board.save` explicitly, or
2. Let the on-board autosave hook fire. Do not rely on its timing for automation.

`board.setTitle` persists the title only, never the canvas.

After a batch, call `board.save` and check its response. Local `blob:`/`data:` assets are stripped if uploads have not completed; successful saving is not proof those assets survived. Concurrent-save and upload-recovery limitations remain; avoid editing during a save and verify important media.

## Undo Semantics

- Executor object mutations use the normal canvas history. No-op folding adds no entry.
- `board.batch` pushes ONE undo entry for the entire batch.
- `board.undo` / `board.redo` operate on the same stack that Cmd-Z uses in the UI.
- Viewport / selection / theme changes are NOT undo-logged.

## Command discovery

```bash
# Get every command the board bridge understands (queries + mutations)
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.query.commands","params":{}}'
# → {status:"success", result:{commands:["board.query.info", ...]}}
# board.query.info is metadata, NOT a command list.
```

The Desktop-served skill is available through `GET /api/skills/cl-board/SKILL.md`; sub-documents use `/api/skills/cl-board/actions`, `/queries`, and `/viewport-and-io`. Discover exact names with `GET /api/skills?q=cl-board`. The current index may label the main document `cl-board/cl-board`; the filename URL avoids that naming ambiguity.

These routes use `Authorization: Bearer $TOKEN`. Skill files are read from the local `_EditingStyleDetails/_Agent/skills` tree; editing the symlinked source updates Desktop-served content without rebuilding Electron. Renderer commands require the updated web frontend; Desktop catalog changes require a Desktop restart. Never restart before preserving unsaved work.

## Related skills

- `cl-editor` — video editor sibling, same bridge, disjoint command surface
- `cl-content-inspiration` — for research feeding into a whiteboard (topics, competitor teardowns)
