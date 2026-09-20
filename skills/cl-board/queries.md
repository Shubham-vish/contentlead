# cl-board — Queries

The `board.query.*` commands are read-only. The separate `board.revealObject` command described below changes fold state, selection, and camera.

Universal request shape (assumes `PORT`, `TOKEN`, `TAB_ID` are set per `SKILL.md` startup):

```bash
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"<COMMAND>","params":<PARAMS>}'
```

## `board.query.info` — top-level metadata

```jsonc
{"type":"board.query.info","params":{}}
// →
// {
//   "boardId": "396033e9-...",
//   "boardTitle": "Untitled Board",
//   "theme": "dark" | "light",
//   "isDirty": true,
//   "objectCount": 42,
//   "selectedCount": 2,
//   "viewport": {"x": 0, "y": 0, "zoom": 1},
//   "canvasBackground": "#0a0a0f"
// }
```

Use this as your first call after connecting — it confirms the bridge is wired and tells you if there's unsaved work you might trample.

## `board.query.commands` — renderer command discovery

```jsonc
{"type":"board.query.commands","params":{}}
// → { "commands": ["board.query.info", "board.query.commands", "board.mindmap.expand", ...] }
```

This is the actual loaded renderer's list, unlike static Desktop catalog descriptions. If unavailable, the frontend may need updating. A tab marked ready can still be stale; require a successful response before edits.

## `board.query.objects` — list objects with filters

```jsonc
{"type":"board.query.objects","params":{
  "type": "sticky" | "shape" | "text" | "connector" | "mermaid" | "image" | "frame" | "freehand" | "pdf_page" | "webview" | "video",  // optional filter
  "ids": ["obj_1", "obj_2"],  // optional filter — only return these
  "query": "roadmap",          // optional full-text/type search, case-insensitive; includes folded nodes
  "region": {                  // optional — exact-bbox spatial filter (NOT the spatial grid — no over-return)
    "x": 0, "y": 8000, "width": 4200, "height": 200,
    "mode": "intersects" | "contained"  // default "contained"
  },
  "limit": 200                 // optional — default 500, hard-cap 500
}}
// →
// {
//   "total": 42,
//   "truncated": false,
//   "objects": [
//     {"id":"obj_1","type":"sticky","x":100,"y":100,"width":220,"height":140,"text":"...","fill":"#fbbf24"},
//     ...
//   ]
// }
```

`region` uses stored axis-aligned object bounds, not rendered connector paths or collapsed-chip bounds. `contained` (default) requires the whole box inside the rectangle; `intersects` returns overlap including edge touches. Pair with `type` to scope further.

The `objects` array is a **summary**, not the full object. Summaries include `collapsed`, `childrenCollapsed`, `foldStage` (`pill|textOnly|open`), and `mindmapKind` when present. Connector summaries include routing, pattern, markers, color, and arrow size. Fold stage is local state, not a visibility flag: an open node may still be hidden by an ancestor. For every stored field use `board.query.object` with `verbose:true`.

The `query` filter uses the same text fields as the UI Search panel and excludes freehand objects. Search itself never opens folds.

## `board.query.canvasBounds` — bbox of all content

```jsonc
{"type":"board.query.canvasBounds","params":{
  "excludeIds": ["obj_1"],       // optional — ignore these ids
  "typeFilter": "sticky",         // optional — only include this type
  "includeConnectors": false      // optional — default false (connectors follow endpoints)
}}
// →
// {
//   "minX": -100, "minY": -6642,
//   "maxX":  7285, "maxY": 13600,
//   "width": 7385, "height": 20242,
//   "count": 220, "isEmpty": false
// }
// Empty board → { minX:0, minY:0, maxX:0, maxY:0, width:0, height:0, count:0, isEmpty:true }
```

Use this to place a new composition **below existing content** without collisions:

```jsonc
{"type":"board.query.canvasBounds","params":{}}
// then: place your new frame at y = result.maxY + 200
```

## `board.query.object` — full detail for one object

```jsonc
{"type":"board.query.object","params":{"id":"obj_1","verbose":true}}
// →
// { "object": { /* full CanvasObject as stored in Zustand */ } }
```

Throws if the ID doesn't exist. Use `board.query.objects` first to know what's on the board.

Without `verbose:true`, returns a summary with capped text bodies and redacted inline media payloads, not the full stored object.

## `board.revealObject` — reveal and frame a search result

```jsonc
{"type":"board.query.objects","params":{"query":"Needle"}}
// Choose one returned ID:
{"type":"board.revealObject","params":{"id":"obj_1"}}
// → { objectId, affectedIds, focused:true, bounds:{x,y,width,height} }
```

Uses the UI Search behavior: open the required ancestor path and result's text; keep newly exposed off-path siblings as chips. Selects and frames the object. Connectors use resolved path bounds, not their stored zero-sized box. Missing IDs fail. If the canvas has no measurable viewport, the object is revealed/selected but `focused:false` is returned and a warning is logged.

Fold changes form one undo step; camera/selection are not undo-logged. Send this separately, not inside `board.batch`. Use `board.mindmap.expand` with `scope:"subtree"` only when you explicitly want the whole branch open.

## `board.query.selection` — what's selected

```jsonc
{"type":"board.query.selection","params":{}}
// →
// { "selectedIds": ["obj_1","obj_2"], "count": 2, "objects": [ /* summaries */ ] }
```

## `board.query.snapshot` — condensed snapshot for LLM context

```jsonc
{"type":"board.query.snapshot","params":{}}
// →
// A `BoardSnapshot` — the same format the in-app AI chat sends per message.
// Includes: summary (type counts, dominant colors, layout hints), objects,
// connectors, selected, viewport, and a small style palette.
```

This is the payload the board's AI panel uses for `getPerMessageState`. Perfect for feeding into an external LLM before deciding what to do.

## `board.query.viewport` — camera state

```jsonc
{"type":"board.query.viewport","params":{}}
// → { "viewport": {"x": -450, "y": 120, "zoom": 0.85} }
```

Coordinates are **world-space translations**: `screenX = (worldX + viewport.x) * zoom` (and similarly for y). The visible top-left world coordinate is `{-viewport.x, -viewport.y}`.

## `board.query.objectAtPoint` — hit test one point

```jsonc
{"type":"board.query.objectAtPoint","params":{"x": 512, "y": 384}}
// → { "object": { /* summary */ } | null }
```

`x`, `y` are **world-space** coordinates (not screen pixels). Convert from screen with `worldX = (screenX / zoom) - viewport.x`.

## Common query recipes

**Find every sticky containing "TODO":**
```jsonc
{"type":"board.query.objects","params":{"type":"sticky","query":"TODO"}}
```

**Find connectors leaving a specific node:**
```jsonc
{"type":"board.query.objects","params":{"type":"connector"}}
// then: r.objects.filter(c => c.from === "obj_1")
```

**Get bounding box of all content (for layout planning):**
```jsonc
{"type":"board.query.canvasBounds","params":{}}
// → {minX, minY, maxX, maxY, width, height, count, isEmpty}
// or, from a full snapshot:
{"type":"board.query.snapshot","params":{}}
// snapshot.summary already includes a `bounds` field: {minX, minY, maxX, maxY}
```

## What queries DON'T give you

- **Rendered pixel data.** There is no `board.query.thumbnail`; use `board.screenshot` or the saved SVG preview web API documented in `viewport-and-io.md`.
- **Undo/redo stack contents.** You can call `board.undo` blind, then `board.query.info` to see what changed.
- **Blueprint AI state.** The AI chat's `useBoardAIStore` is intentionally not exposed — the bridge is a peer to that chat, not a way to drive it.

## `board.query.checkpoints` — list named bookmarks

```jsonc
{"type":"board.query.checkpoints","params":{}}
// →
// {
//   "checkpoints": [
//     {"id":"cp_xxxx","name":"before-refactor","undoStackDepth":12,"objectCount":42,"createdAt":1734000000000},
//     ...  // oldest-first
//   ],
//   "count": 3
// }
```

Checkpoints are lightweight — creating one costs two integers, not a snapshot. See `actions.md` § *Checkpoints* for `board.checkpoint` / `board.restoreCheckpoint` / `board.deleteCheckpoint`.

## `board.query.styles` — list every registered style token

Read-only inspection of the session-scoped style-token registry populated by `board.defineStyle`.

```jsonc
{"type":"board.query.styles","params":{}}
// →
// {
//   "styles": {
//     "hero-title":  { "fillColor": "#0f172a", "textColor": "#f8fafc", "fontSize": 36, "bold": true },
//     "body-copy":   { "fontFamily": "Inter, sans-serif", "fontSize": 16 }
//   },
//   "count": 2
// }
```

Empty result → `{ "styles": {}, "count": 0 }`. Tokens are **not persisted**; expect an empty result at the top of every new session until you re-register them.
