# cl-board — Actions (Mutations)

All commands here push undo history (one entry per command; `board.batch` pushes one entry for the whole batch).

## Object types (`renderAs`)

The board understands these `renderAs` values in `board.addNode`. Aliases `render_as` also work. **NOTE:** don't confuse with the outer `type` (command name) — the object variant goes in `params.renderAs`.

| renderAs | Description |
|---|---|
| `sticky` | Sticky-note. Colored fill, editable text, default 220×140. |
| `shape` (default) | Geometric shape. Sub-type via `shapeType`: `rectangle`, `circle`, `ellipse`, `diamond`, `triangle`, `arrow`, `cylinder`, `cloud`, etc. |
| `text` | Free-standing text. No fill background. |
| `mermaid` | Mermaid diagram rendered from `mermaidCode`. |
| `frame` | Titled bounding rectangle used to group content. |
| `doc` | Rich-text markdown document block. |
| `image` | Image (needs `src` URL and dimensions). See also `board.addImage` for auto-probe. |
| `freehand` \| `draw` \| `path` | Pen strokes: `points: [[x,y],…]` or `[{x,y},…]`. |
| `html` | Sandboxed HTML block: `html: "<h1>…</h1>"`. |
| `webview` \| `iframe` \| `embed` | Iframe embed: `url: "https://…"`. |
| `video` | Video player: `src: "https://…mp4"`. |

## `board.addNode` — create one object

```jsonc
{"type":"board.addNode","params":{
  "renderAs": "sticky",       // required (see table); default "shape"
  "x": 100,                   // required, world coord
  "y": 100,                   // required, world coord
  "width": 240,               // optional, sensible default per renderAs
  "height": 160,              // optional
  "text": "Design review",    // optional, applies to sticky/shape/text/frame
  "fillColor": "#fbbf24",     // optional, defaults to nearby-object style
  "textColor": "#0f172a",     // optional
  "fontSize": 18,             // optional
  "shapeType": "rectangle",   // ONLY for renderAs="shape"
  "mermaidCode": "graph TD;A-->B", // ONLY for renderAs="mermaid"
  "src": "https://…",         // ONLY for image/video (URL)
  "url": "https://…",         // ONLY for webview
  "html": "<h1>…</h1>",       // ONLY for html
  "points": [[0,0],[10,10]],  // ONLY for freehand
  "animationStyle": "pulse",  // optional decorator
  "animatedIcon": "star"      // optional — see AnimatedIconId in types.ts
}}
// → { "action": "board.addNode", "executionTimeMs": 3, "objectId": "obj_abc123" }
```

**Style inheritance**: if you omit `fillColor`/`strokeColor`, the executor finds the nearest existing shape/sticky and copies its aesthetics. This is why a batch produces a coherent-looking board without you having to think about colors.

### Image sizing — two ways

If you already know natural dimensions, pass them and skip a network probe:

```jsonc
{"type":"board.addNode","params":{
  "renderAs":"image",
  "src":"https://images.pexels.com/…jpg",
  "naturalWidth":1920, "naturalHeight":1080,
  "width":400, "height":225,
  "x":600, "y":400
}}
```

If you have only a URL, use **`board.addImage`** which probes the image, computes aspect-preserving dimensions, then inserts:

```jsonc
{"type":"board.addImage","params":{
  "src":"https://images.pexels.com/…jpg",
  "x":600, "y":400,
  "maxWidth":400   // caps width; height auto-scales; default 400
}}
// → { "objectId":"obj_img_9k", "naturalWidth":1920, "naturalHeight":1080, "width":400, "height":225 }
```

### Freehand drawing

Pen strokes are literal point lists. World coords, absolute:

```jsonc
{"type":"board.addNode","params":{
  "renderAs":"freehand",
  "points": [[100,100],[110,102],[120,108],[130,120]],
  "color":"#ef4444",
  "strokeWidth":4,
  "isHighlighter":false
}}
```

Use this to annotate diagrams: draw circles around important nodes, underline titles, sketch arrows connectors don't cover. `isHighlighter:true` adds semi-transparent yellow fill effect.

## `board.editNode` — update an existing object

```jsonc
{"type":"board.editNode","params":{
  "id": "obj_abc123",        // required
  "text": "Updated text",
  "fill": "#ef4444",
  "x": 200, "y": 300,
  "width": 320, "height": 200
  // any field valid on `addNode` can be set here
}}
// → { "action": "board.editNode", "objectId": "obj_abc123" }
```

Only the fields you pass are changed. Position updates via `editNode` do NOT re-route attached connectors — use `board.moveNode` instead if the object has connectors.

## `board.moveNode` — move + re-route connectors

```jsonc
{"type":"board.moveNode","params":{"id":"obj_abc123","x":800,"y":400}}
```

Same as `editNode` for `x`/`y` but also re-computes connector anchor points for every connector touching this node. Use whenever you're moving a node that has arrows going in or out.

## `board.deleteNodes` — remove objects

```jsonc
{"type":"board.deleteNodes","params":{"ids":["obj_1","obj_2","obj_3"]}}
// → { "action": "board.deleteNodes", "objectIds": ["obj_1","obj_2","obj_3"] }
```

Silently skips IDs that don't exist. Also removes any connectors that referenced the deleted objects.

## `board.addConnector` — draw an arrow

```jsonc
{"type":"board.addConnector","params":{
  "fromId": "obj_1",       // required — source object ID
  "toId": "obj_2",         // required — target object ID
  "label": "yes",          // optional edge label
  "style": "arrow",        // optional: "arrow" | "line" | "dashed"
  "startArrow": "none",    // optional: "none" | "arrow" | "circle" | "diamond"
  "endArrow": "arrow",
  "color": "#94a3b8",
  "strokeWidth": 2
}}
// → { "action":"board.addConnector", "objectId": "obj_conn_x" }
```

The connector will pick the best anchor points on both nodes automatically. If you want to pin specific anchors, pass `fromAnchor` / `toAnchor` (one of `top`, `right`, `bottom`, `left`, `center`).

## `board.editConnector`

Same as `editNode` but for connector objects.

## `board.groupObjects` / `board.ungroupObjects`

```jsonc
{"type":"board.groupObjects","params":{"ids":["obj_1","obj_2","obj_3"]}}
// → { "objectIds": ["obj_1","obj_2","obj_3"] }
```

Sets a shared `groupId` on the objects. They now move / select as one unit.

## `board.lockObjects`

```jsonc
{"type":"board.lockObjects","params":{"ids":["obj_1"]}}
```

Toggles the `locked` flag. Locked objects can't be edited from the UI (or by other agents) without an explicit unlock.

## `board.bringToFront` / `board.sendToBack`

```jsonc
{"type":"board.bringToFront","params":{"ids":["obj_1"]}}
{"type":"board.sendToBack","params":{"ids":["obj_1"]}}
```

Operates on the given IDs. If `ids` is omitted, uses the current selection.

## Slide decks

The board can double as a slide-deck editor. Every "slide" is a large frame with content laid out inside.

### `board.addSlide` — one slide

```jsonc
{"type":"board.addSlide","params":{
  "layout": "titleAndBullets",   // see `slideLayouts.ts` for the full list
  "theme": "midnight",           // see `DECK_THEMES` in `slideLayouts.ts`
  "props": {                     // layout-specific props
    "title": "Q3 Roadmap",
    "bullets": ["Ship boards bridge", "Rewrite pdf import", "Ship voice cloning"]
  },
  "x": 0,  "y": 0                // top-left corner of the slide frame
}}
// → { "objectId": "obj_frame_x", "objectIds": ["obj_frame_x", "obj_title_x", "obj_bullets_x"] }
```

The result includes both the parent frame ID and every child object created inside it.

### `board.generateDeck` — multiple slides

```jsonc
{"type":"board.generateDeck","params":{
  "theme": "midnight",
  "slides": [
    {"layout":"titleOnly",       "props":{"title":"Q3 Roadmap"}},
    {"layout":"titleAndBullets", "props":{"title":"Wins","bullets":["A","B","C"]}},
    {"layout":"quote",           "props":{"quote":"Stay hungry.","author":"SJ"}}
  ],
  "startX": 0,
  "startY": 0,
  "gapPx": 240
}}
// → { "objectIds": ["obj_1","obj_2","obj_3",...] }  (every child object)
```

### `board.applyDeckTheme` — recolor existing deck

```jsonc
{"type":"board.applyDeckTheme","params":{"theme":"ocean"}}
```

Reads every slide frame currently on the board and re-styles them + their child objects to the new theme.

## Layout & transform commands

**`board.duplicate`** — clone one or many objects with an offset:

```jsonc
{"type":"board.duplicate","params":{
  "ids": ["obj_a","obj_b"],   // or single "id": "obj_a"
  "dx": 40, "dy": 40           // offset for the clones, default 20/20
}}
// → { "objectIds": ["obj_a2","obj_b2"] }
```

**`board.align`** — snap 2+ objects to a common edge or center:

```jsonc
{"type":"board.align","params":{
  "ids": ["obj_a","obj_b","obj_c"],
  "mode": "left"   // left | right | top | bottom | centerX | centerY
}}
```

**`board.distribute`** — evenly space 3+ objects horizontally or vertically:

```jsonc
{"type":"board.distribute","params":{
  "ids": ["obj_a","obj_b","obj_c","obj_d"],
  "mode": "horizontal"   // horizontal | vertical
}}
```

**`board.setTransform`** — rotate, scale, or resize a single object:

```jsonc
{"type":"board.setTransform","params":{
  "id": "obj_a",
  "rotation": 45,     // degrees
  "scaleX": 1.5,
  "scaleY": 1.5,
  "x": 100, "y": 200,
  "width": 300, "height": 200,
  "opacity": 0.8
}}
```

## Image search + place from the internet

**`board.query.searchImages`** — search Pexels for stock images (query-only, safe to run alongside mutations):

```jsonc
{"type":"board.query.searchImages","params":{
  "query": "kitchen counter",
  "page": 1,
  "perPage": 12
}}
// → { "query":"…","page":1,"count":12,"hasMore":true,
//     "photos":[{"id":"…","src":"https://…jpg","preview":"…","width":1920,"height":1280,"alt":"…","photographer":"…"}, …] }
```

**Recipe — search web image, then place it:**
```jsonc
// 1. search
{"type":"board.query.searchImages","params":{"query":"designer workspace"}}
// pick photo.src from results, then:
// 2. place (auto-probes dimensions, scales to maxWidth, preserves aspect)
{"type":"board.addImage","params":{"src":"<picked-src>","x":600,"y":400,"maxWidth":400}}
```

## `board.batch` — sequential batch with reference resolution

Run many actions with one undo entry. Use `$ACTION_N_RESULT` to reference the ID of a previously-created object (N is 0-indexed):

```jsonc
{"type":"board.batch","params":{"actions":[
  {"type":"board.addNode","params":{"type":"sticky","x":0,   "y":0,  "text":"Idea A"}},
  {"type":"board.addNode","params":{"type":"sticky","x":300, "y":0,  "text":"Idea B"}},
  {"type":"board.addConnector","params":{
    "fromId":"$ACTION_0_RESULT",
    "toId":  "$ACTION_1_RESULT",
    "label":"relates to"
  }}
]}}
// → { "total": 3, "succeeded": 3, "failed": 0, "results": [ /* per-action */ ] }
```

Rules:

- References resolve to `.result.objectId` of the referenced action.
- If any action fails, the batch continues but the failed action reports `status:"failed"` in its result. The batch itself is `success` unless **every** action failed.
- One undo entry covers the entire batch. `board.undo` reverses all of it in one shot.
- Max reasonable size is ~100 actions before latency starts to matter.

## `board.deleteRegion` — bounded-box eraser

Delete every non-connector, non-locked object whose bbox lies inside (or intersects) a rectangle. Uses **exact bbox math**, not the spatial grid, so it never over-returns.

```jsonc
{"type":"board.deleteRegion","params":{
  "x": 0, "y": 8000, "width": 4200, "height": 200,  // required — world coords
  "mode": "contained" | "intersects",  // default "contained"
  "dryRun": true,                       // if true → returns wouldDelete + ids without mutating
  "excludeLocked": true,                // default true — skip objects with locked:true
  "typeFilter": "sticky"                // optional — only delete this type
}}
// → dryRun:  { "dryRun": true,  "wouldDelete": 3, "ids": ["obj_a","obj_b","obj_c"] }
// → real:    { "deleted": 3, "ids": ["obj_a","obj_b","obj_c"] }
```

**Safety rules:**
- **Always run with `dryRun:true` first** and read the id list before committing.
- Connectors are automatically skipped — they follow their endpoints, so deleting an endpoint object also cleans up its connector.
- `deleteObjects` internally pushes one undo entry, so a mistake reverses with a single `board.undo`.

Typical "wipe a swim-lane" flow:

```jsonc
// 1. Dry-run
{"type":"board.deleteRegion","params":{"x":0,"y":8000,"width":4200,"height":200,"dryRun":true}}
// → {"wouldDelete": 3, "ids":["a","b","c"]}
// 2. Confirm (agent inspects list, decides it looks right)
{"type":"board.deleteRegion","params":{"x":0,"y":8000,"width":4200,"height":200}}
// → {"deleted": 3, "ids":["a","b","c"]}
```

## History control

```jsonc
{"type":"board.undo","params":{}}   // → { "undone": true }
{"type":"board.redo","params":{}}   // → { "redone": true }
{"type":"board.deleteAll","params":{}} // → { "deleted": 42 }
```

`board.deleteAll` also pushes to the undo stack — you can restore the whole board with `board.undo`. Useful for "clear and rebuild" flows without asking the user to confirm.

## Checkpoints — named bookmarks over the undo stack

Checkpoints are lightweight bookmarks: they store the current `undoStack.length` plus `objects.length` at a point in time. Restore is performed by calling `undo()` in a loop until the depth matches — so redo stays sane and the same reversal path the UI uses is used here.

### `board.checkpoint` — snapshot current state

```jsonc
{"type":"board.checkpoint","params":{"name":"before-refactor"}}
// name is OPTIONAL — auto-generated as "checkpoint-1", "checkpoint-2", ...
// → { "id":"cp_xxxx", "name":"before-refactor",
//     "undoStackDepth": 12, "objectCount": 42, "createdAt": 1734000000000 }
```

Zero-cost: takes no snapshot bytes, just records two integers. Create liberally before any risky batch.

### `board.restoreCheckpoint` — roll back to a checkpoint

```jsonc
{"type":"board.restoreCheckpoint","params":{"name":"before-refactor"}}
// or by id:
{"type":"board.restoreCheckpoint","params":{"id":"cp_xxxx"}}
// → { "restored": true, "undoStackDepth": 12, "objectCount": 42 }
```

**Behavior:**
- Calls the store's own `undo()` in a loop until `undoStack.length === checkpoint.undoStackDepth`.
- Every step is a real undo, so the redo stack is populated — you can `board.redo` back to the "after" state.
- Max 200 iterations. If the loop doesn't converge, the handler throws (indicates the checkpoint is stale or the undo stack was tampered with).
- **Throws with a clear error** if the checkpoint is "in the future" (i.e. current `undoStack.length < checkpoint.undoStackDepth`). Happens when you rewound past the bookmark manually, then tried to restore — the intermediate history is gone.

### `board.deleteCheckpoint` — remove a bookmark

```jsonc
{"type":"board.deleteCheckpoint","params":{"name":"before-refactor"}}
// or by id
// → { "deleted": true, "id": "cp_xxxx", "name": "before-refactor" }
```

Does NOT touch the undo stack — only the checkpoint registry.

See `queries.md` for `board.query.checkpoints`.

## `board.exportPng` — high-quality offscreen render (NON-mutating)

Rasterize a world region (or the bbox of some IDs) to a base64 PNG. Different from `board.screenshot`:

- Does NOT move the viewport, does NOT persistently touch DOM overlays.
- Uses `html2canvas` with `{x,y,width,height}` mapped against the current viewport transform, so the current camera pose is respected but not changed.
- Output resolution is exactly `maxWidth × (h * maxWidth / w)` after downscale.
- Panels are briefly hidden via the store's `setPanelVisibility` if that action is available, and restored afterwards. If not available, a warning is logged and the shot proceeds with overlays in place.

```jsonc
{"type":"board.exportPng","params":{
  "region": {"x":0, "y":8000, "width":4200, "height":800}, // OR use "ids": [...]
  "padding": 60,           // default 60 (only when ids given)
  "maxWidth": 2400,        // default 2400
  "scale": 2,              // default 2 (retina)
  "background": "#141727", // optional override
  "includeConnectors": true // default true (only when ids given)
}}
// → { "imageBase64":"data:image/png;base64,...",
//     "world": {"x":0,"y":8000,"width":4200,"height":800},
//     "exportedWidth": 2400, "exportedHeight": 457,
//     "scale": 2, "viewportZoom": 1 }
```

If neither `region` nor `ids` is provided, exports the bbox of ALL objects (with padding). Empty boards throw.

## Common recipes

**Draw a two-node flowchart:**
```jsonc
{"type":"board.batch","params":{"actions":[
  {"type":"board.addNode","params":{"type":"shape","shapeType":"rectangle","x":100,"y":200,"text":"Start"}},
  {"type":"board.addNode","params":{"type":"shape","shapeType":"rectangle","x":500,"y":200,"text":"End"}},
  {"type":"board.addConnector","params":{"fromId":"$ACTION_0_RESULT","toId":"$ACTION_1_RESULT"}}
]}}
```

**Fill a 3×3 sticky grid:**
```jsonc
{"type":"board.batch","params":{"actions":[
  {"type":"board.addNode","params":{"type":"sticky","x":0,  "y":0,  "text":"1"}},
  {"type":"board.addNode","params":{"type":"sticky","x":260,"y":0,  "text":"2"}},
  {"type":"board.addNode","params":{"type":"sticky","x":520,"y":0,  "text":"3"}},
  {"type":"board.addNode","params":{"type":"sticky","x":0,  "y":180,"text":"4"}},
  ...
]}}
```

**Rename a bunch of frames at once** (no `bulk` op — use a batch):
```jsonc
{"type":"board.batch","params":{"actions":[
  {"type":"board.editNode","params":{"id":"obj_frame_1","text":"Chapter 1"}},
  {"type":"board.editNode","params":{"id":"obj_frame_2","text":"Chapter 2"}}
]}}
```

## Mindmap / collapsible trees

Boards has first-class support for Xmind-style collapsible mindmaps. Nodes tagged with `metadata.mindmapKind ∈ {"root","branch","leaf"}` participate in the mindmap flow: the "+" affordance button, Tab-key add-child, branch-color inheritance on connectors, and per-node collapse pill.

**4 commands cover the whole feature:**

| command | what it does |
|---|---|
| `board.addMindmapChild` | Add a child under a mindmap parent. Same geometry, styling, and connector color inheritance as clicking "+" or hitting Tab in the UI. |
| `board.mindmap.layout` | Re-flow an existing subtree — BFS through descendants, stack each parent's children evenly to the right (or left). |
| `board.toggleCollapse` | Flip one node's collapsed state. Its children hide/reappear. |
| `board.collapseAllDescendants` | Force `mode: "collapse"` or `mode: "expand"` on a whole subtree in one call. |

### Starting a tree from scratch

The root node is a plain `text` object with the mindmap sentinel in its metadata. `board.addNode` supports it directly:

```jsonc
{"type":"board.addNode","params":{
  "renderAs": "text",
  "id": "root",
  "x": 500, "y": 400,
  "width": 200, "height": 60,
  "text": "AI Content Stack",
  "fontSize": 22, "fontWeight": 700,
  "metadata": { "mindmapKind": "root" }
}}
```

Then everything downstream is `board.addMindmapChild`:

```jsonc
{"type":"board.batch","params":{"actions":[
  {"type":"board.addMindmapChild","params":{"parentId":"root",           "text":"Ideation"}},
  {"type":"board.addMindmapChild","params":{"parentId":"root",           "text":"Production"}},
  {"type":"board.addMindmapChild","params":{"parentId":"$ACTION_0_RESULT","text":"Trend scanning"}},
  {"type":"board.addMindmapChild","params":{"parentId":"$ACTION_0_RESULT","text":"Hook writing"}},
  {"type":"board.addMindmapChild","params":{"parentId":"$ACTION_1_RESULT","text":"Filming"}},
  {"type":"board.addMindmapChild","params":{"parentId":"$ACTION_1_RESULT","text":"Editing"}}
]}}
```

`$ACTION_N_RESULT` resolves to the `objectId` returned by that batch step — the standard `board.batch` reference machinery works with mindmap actions.

### `board.addMindmapChild`

| param | default | description |
|---|---|---|
| `parentId` | — | Required. Must resolve to an object with `metadata.mindmapKind ∈ {root,branch,leaf}`. Rejects plain shapes/text with a helpful error. |
| `text` | `"Untitled"` | Node label. `label` is accepted as an alias. |
| `direction` | `"right"` | `"right"` or `"left"`. Left flips the connector anchors so the line comes off the parent's left face. |
| `height` | `44` | Child height in px. Width matches the parent. |
| `horizontalGap` | auto | Gap between parent and child edges. Auto-adjusts if the parent's "+" affordance has been dragged outward. |

**Returns** `{ objectId, connectorId, x, y, width, height }`. Use `objectId` in downstream batch actions.

**Behavior notes:**
- If the parent is collapsed (`collapsed:true` or `childrenCollapsed:true`), the parent is auto-unfolded so the new child is visible — mirrors the interactive flow.
- Connector inherits `strokeColor` / `style` / `endArrow` from the parent's own incoming connector (branch-color propagation).
- Children stack vertically — a second child is placed below the first, third below the second, using the same spacing math as `positionForNewChild` in `mindmapLayout.ts`.

### `board.mindmap.layout`

Reflow an existing subtree. Useful after `board.batch`-adding a bunch of nodes at arbitrary coords, or after users drag things around.

| param | default | description |
|---|---|---|
| `rootId` | — | Required. Root of the subtree to reflow. `rootId` itself is never moved. |
| `direction` | `"right"` | `"right"` or `"left"` — which side to lay children on. |
| `horizontalGap` | `208` | Distance between parent-right and child-left edges. |
| `verticalGap` | `24` | Distance between stacked siblings. |

**Returns** `{ rootId, moved, movedIds }`. `moved` counts descendants whose coords actually changed — nodes already in the right spot are left alone (keeps the undo entry small).

```jsonc
// After batching a bunch of nodes at random coords, snap them into a clean tree
{"type":"board.mindmap.layout","params":{"rootId":"root"}}
```

The layout is a BFS: place direct children of the root first, then recurse into each child's own descendants. Sibling order is stable — nodes already stacked top-to-bottom keep that order after reflow.

### `board.toggleCollapse` and `board.collapseAllDescendants`

Both act on a single node id — the *node* is what's collapsed, not the whole subtree.

```jsonc
// Toggle one node — hide/show its direct children
{"type":"board.toggleCollapse","params":{"objectId":"branch1"}}
// → { objectId: "branch1", collapsed: true }

// Force-collapse an entire subtree from a given node down
{"type":"board.collapseAllDescendants","params":{"objectId":"root","mode":"collapse"}}
// → { objectId: "root", affectedIds: ["root","branch1","branch2","branch1.a"] }

// Same command with mode:"expand" fully unfolds
{"type":"board.collapseAllDescendants","params":{"objectId":"root","mode":"expand"}}
```

`affectedIds` in the response is the exact set of nodes whose collapsed state changed — safe to log or highlight for the user.

### End-to-end recipe

Build a 3-level tree, collapse two branches, screenshot the result, then unfold everything:

```jsonc
{"type":"board.batch","params":{"actions":[
  {"type":"board.addNode","params":{
    "renderAs":"text","id":"root","x":500,"y":400,"width":220,"height":60,
    "text":"Product","fontSize":22,"fontWeight":700,
    "metadata":{"mindmapKind":"root"}
  }},
  {"type":"board.addMindmapChild","params":{"parentId":"root","text":"Onboarding"}},
  {"type":"board.addMindmapChild","params":{"parentId":"root","text":"Growth"}},
  {"type":"board.addMindmapChild","params":{"parentId":"root","text":"Retention"}},
  {"type":"board.addMindmapChild","params":{"parentId":"$ACTION_1_RESULT","text":"Sign-up"}},
  {"type":"board.addMindmapChild","params":{"parentId":"$ACTION_1_RESULT","text":"First-day success"}},
  {"type":"board.addMindmapChild","params":{"parentId":"$ACTION_2_RESULT","text":"Virality loops"}},
  {"type":"board.addMindmapChild","params":{"parentId":"$ACTION_2_RESULT","text":"Paid channels"}},
  {"type":"board.mindmap.layout","params":{"rootId":"root"}},
  {"type":"board.collapseAllDescendants","params":{"objectId":"$ACTION_2_RESULT","mode":"collapse"}}
]}}
```

Then `board.screenshot` on the whole tree. Fully expand for a second shot with `board.collapseAllDescendants { objectId: "root", mode: "expand" }`.

## What actions DON'T support (yet)

### Wanted commands — reference

Full ranked gap analysis lives in session `plan.md` (or copy it to `~/.copilot/skills/cl-board/wanted.md` when you formalize). Top 5 that would ship first:

1. **`board.screenshot { region?, ids?, hidePanels?, maxWidth? }`** — one-shot region/object capture with panel hiding. Today: `setViewport` + `/api/screenshot` + base64 decode (see `viewport-and-io.md`), and every shot has the AI panel occluding ~40% of the canvas with no bridge way to hide it.
2. **`board.togglePanels { ai?, rightSidebar?, layers?, toolbar? }`** — hide the AI Whiteboard Assistant / Image Properties / Layers side panels for a clean shot.
3. ~~`board.deleteRegion`~~ ✅ **shipped** — see the `board.deleteRegion` section above. Uses exact bbox math and supports `dryRun`.
4. ~~`board.query.canvasBounds`~~ ✅ **shipped** — see `queries.md`. Returns `{minX, minY, maxX, maxY, width, height, count, isEmpty}` with optional `excludeIds`, `typeFilter`, `includeConnectors`.
5. **`board.defineStyle` / style tokens** — kill payload repetition (fillColor, textColor, fontSize, bold on every shape) and enforce coherence across a session.

### Other gaps (still-supported workarounds)

- **Setting connector waypoints.** The executor picks anchors automatically.
- **Applying animation presets in bulk.** You can pass `animationStyle` per node, but there's no "animate everything selected" command.
- **Uploading images from local paths.** For remote URLs use `board.addImage`; for a raw file you already have on disk, see `viewport-and-io.md` for the `/api/boards/upload` endpoint.
- **Auto-layout of a whole tree/graph.** ~~Solved for mindmap-shaped trees — see `board.mindmap.layout` below.~~ For arbitrary DAGs, `board.align` + `board.distribute` are still the primitives.
- **Image search from providers other than Pexels.** `board.query.searchImages` is Pexels-only; use a general web-image tool for Google/Unsplash then feed the resulting URL to `board.addImage`.

## `board.defineStyle` — register a session-scoped style token

Save a property bag under a name once, then apply it to any subsequent `board.addNode` / `board.editNode` / `board.addSection` by passing `styleId: "<name>"` in that command's params.

> ⚠️ **Session-scoped only.** Tokens live in the Zustand store for the lifetime of the board tab. They are NOT persisted to Cosmos. Reloading (`board.reload`) or reopening the board wipes them. Re-register at the top of every session.

| param | required | default | description |
|---|---|---|---|
| `id` | yes | — | Token name, e.g. `"hero-title"`. Alphanumeric + hyphen recommended. |
| `style` | yes | — | Property bag: `fillColor`, `strokeColor`, `textColor`, `fontSize`, `bold`, `fontFamily`, `borderRadius`, `opacity`, `background`, `borderColor`, `borderWidth`, etc. |
| `replace` | no | `false` | If `true`, overwrite the whole token; else deep-merge into existing. |

```jsonc
{"type":"board.defineStyle","params":{
  "id": "hero-title",
  "style": {
    "fillColor": "#0f172a",
    "textColor": "#f8fafc",
    "fontSize": 36,
    "bold": true,
    "fontFamily": "Inter, sans-serif"
  }
}}
// → { "id": "hero-title", "keys": ["fillColor","textColor","fontSize","bold","fontFamily"], "replaced": false, "sessionScoped": true }
```

Then apply it:

```jsonc
{"type":"board.addNode","params":{
  "renderAs":"text",
  "styleId":"hero-title",   // ← token values merged UNDERNEATH these params
  "x":0, "y":0, "width":600, "height":80,
  "text":"Welcome",
  "fontSize": 48             // ← explicit override wins over token's 36
}}
```

**Precedence:** caller params always win over token values. An unknown `styleId` fails fast with `Error: unknown styleId: <id>. Define it first with board.defineStyle` — this catches typos rather than silently ignoring them.

## `board.deleteStyle` — remove a style token

```jsonc
{"type":"board.deleteStyle","params":{"id":"hero-title"}}
// → { "id": "hero-title", "deleted": true }
```

Returns `deleted: false` when the token was not registered — this is not an error.

## `board.addSection` — titled frame with auto-layout for children

First-class alternative to `board.addNode renderAs:"frame"` (which is a passive container). This command drops a frame AND lays out its children immediately, in one atomic history entry.

| param | required | default | description |
|---|---|---|---|
| `title` | yes | — | Text shown in the title band at the top of the frame. |
| `x`, `y` | yes | — | Top-left of the frame in world coords. |
| `width` | yes | — | Frame width. Height auto-computes from children + padding. |
| `layout` | no | `"stack"` | `"stack"` (vertical), `"row"` (horizontal), or `"grid"`. |
| `gap` | no | `20` | Spacing between children (px). |
| `padding` | no | `32` | Inner padding on left/right and after the title band. |
| `titleHeight` | no | `60` | Space reserved for the title text (children start below this). |
| `cols` | no | `ceil(sqrt(N))` | Grid mode only — number of columns. |
| `background` | no | frame default | Frame fill color. |
| `borderColor` | no | — | Frame stroke color. |
| `borderWidth` | no | — | Frame stroke width. |
| `styleId` | no | — | Apply a style token to the FRAME itself (not the children). |
| `children` | yes | — | Array of `addNode`-style specs. Each may include `itemHeight` / `itemWidth` overrides. |

**Child layout rules:**
- **stack**: each child spans `width − 2·padding`. Y increments by `child.itemHeight` + `gap`. Default `itemHeight` = 120.
- **row**: children get equal share of `width − 2·padding − gap·(N−1)`. Default `itemHeight` = 200.
- **grid**: cells sized as `(width − 2·padding − gap·(cols−1)) / cols`. Row height = max `itemHeight` in that row. Default `itemHeight` = 200.

```jsonc
{"type":"board.addSection","params":{
  "title": "Product roadmap",
  "x": 0, "y": 500, "width": 1200,
  "layout": "row",
  "gap": 24,
  "padding": 40,
  "titleHeight": 72,
  "background": "#0f172a",
  "borderColor": "#334155",
  "borderWidth": 2,
  "children": [
    {"renderAs":"shape","shapeType":"rectangle","text":"Q1","fillColor":"#22d3ee","itemHeight":220},
    {"renderAs":"shape","shapeType":"rectangle","text":"Q2","fillColor":"#a855f7","itemHeight":220},
    {"renderAs":"shape","shapeType":"rectangle","text":"Q3","fillColor":"#f59e0b","itemHeight":220},
    {"renderAs":"shape","shapeType":"rectangle","text":"Q4","fillColor":"#10b981","itemHeight":220}
  ]
}}
// → { "frameId": "obj_...", "childIds": ["...","...","...","..."], "height": 332, "width": 1200, "layout": "row" }
```

Every child receives `parentFrameId = frameId` so moving/deleting the frame drags its content along. One `board.undo` restores the entire section (frame + all children) in one shot.
