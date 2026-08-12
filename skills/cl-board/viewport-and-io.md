# cl-board — Viewport, Selection, and IO

Everything that is NOT object CRUD: camera control, selection, theme, canvas background, and persistence.

## Viewport

The board uses a simple 2D world-space camera: `{x, y, zoom}`.

- `x`, `y` — the WORLD coordinate that maps to the top-left of the visible canvas.
- `zoom` — multiplier. 1.0 = 100%.
- Screen ↔ world: `worldX = (screenX / zoom) - viewport.x`.

### `board.setViewport`

```jsonc
{"type":"board.setViewport","params":{"x": -450, "y": 120, "zoom": 0.85}}
// All fields optional; only the provided ones change. Throws if none provided.
```

### `board.zoomToFit`

```jsonc
{"type":"board.zoomToFit","params":{}}
```

Frames every object on the canvas with a small margin. This is what the "1:1" button in the toolbar calls.

### `board.panBy`

```jsonc
{"type":"board.panBy","params":{"dx": 200, "dy": 0}}
```

Increments viewport by `dx` / `dy` in world units.

## Selection

Selection is a plain string array of object IDs. Multiple objects can be selected at once.

### `board.select`

```jsonc
{"type":"board.select","params":{"ids":["obj_1","obj_2"]}}
// → { "selectedIds": ["obj_1","obj_2"] }
```

Replaces the current selection.

### `board.selectAll`

```jsonc
{"type":"board.selectAll","params":{}}
```

### `board.clearSelection`

```jsonc
{"type":"board.clearSelection","params":{}}
```

## Theme + background

### `board.setTheme`

```jsonc
{"type":"board.setTheme","params":{"theme": "dark"}}  // "dark" | "light"
```

Only affects the board's UI chrome (grid color, connector default colors, etc.). Existing objects keep whatever colors they were set to.

### `board.setBackground`

```jsonc
{"type":"board.setBackground","params":{"color": "#0a0a0f"}}
```

Any valid CSS color string. Use rgba if you want translucency over a theme fallback.

## Persistence

### `board.save` — canvas + title → SkillTown DB

```jsonc
{"type":"board.save","params":{}}
// → {
//   "saved": true,
//   "boardId": "396033e9-...",
//   "objectCount": 42,
//   "responseStatus": 200
// }
```

Calls `PUT /api/boards/[boardId]` with the current `{title, canvasData}`. Before serializing it:

1. Waits up to 4 seconds for any in-flight blob uploads to finish (so you don't persist blob URLs). If the timer expires, it saves anyway rather than blocking forever.
2. Runs the payload through `stripDataUrls` — anything with a `data:` or `blob:` URL is dropped.
3. Clears the `isDirty` flag on success.

The board's own autosave hook fires every 10 seconds after a mutation, but it's still worth calling `board.save` explicitly at the end of a batch — it's the only way to guarantee cloud persistence before you tell a user "done."

### `board.setTitle`

```jsonc
{"type":"board.setTitle","params":{"title":"Q3 Roadmap"}}
// → { "title": "Q3 Roadmap" }
```

Sends `{title}` only to `/api/boards/[boardId]`. Does NOT serialize the canvas — safe to call while an upload is still in flight (this was a bug fixed in the boards review).

### `board.reload` — re-fetch from server

```jsonc
{"type":"board.reload","params":{}}
// → { "loaded": true, "boardId": "...", "objectCount": 42, "title": "..." }
```

Discards local unsaved changes and reloads canvas state from `/api/boards/[boardId]`. Useful after another tab / user has edited the same board.

## Titles vs canvas — the fix that lives here

If you rename a board WHILE an image upload is running, the old bug was that the rename would `st.serialize()` the canvas inline and persist `blob:` / `data:` URLs. That's why title save is a dedicated `saveBoardTitle(boardId, title)` call — it sends only `{title}` to `/api/boards/[boardId]`. The bridge uses that helper. Don't reinvent it with a raw `PUT` from your agent.

## Autosave

Autosave lives in the browser, not the bridge. The rules that matter to you:

- Only re-armed on `!isDirty → isDirty` transitions (viewport pans, selection changes, hover don't reset the timer).
- 2-second debounce, but capped by a 10-second maxWait from the first dirty flag.
- Silently stops after any 401/403 from `/api/boards/[boardId]` — so if you sign out mid-session, autosave stops trying.

For agents: never rely on autosave for correctness. Call `board.save` yourself at the end of every mutation batch.

## Common recipes

**Open, plan, edit, save, verify:**
```bash
# 1. Snapshot
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.query.snapshot"}'

# 2. ... do a bunch of `board.batch` calls ...

# 3. Frame the new content
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.zoomToFit"}'

# 4. Persist
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.save"}'

# 5. Verify — reload from DB and check counts match
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.reload"}'
```

**Center the camera on a specific object:**
```bash
# 1. Look it up
OBJ=$(curl -s -X POST ... -d '{"tabId":"'$TAB_ID'","type":"board.query.object","params":{"id":"obj_1"}}')
# 2. Compute new viewport (world coord of object → put at center of screen)
# 3. board.setViewport with {x: -(obj.x + obj.width/2 - screenW/2/zoom), y: similar}
```

**Bulk rename → save → confirm:**
```bash
curl -s -X POST ... -d '{"tabId":"'$TAB_ID'","type":"board.batch","params":{"actions":[
  {"type":"board.editNode","params":{"id":"obj_1","text":"Renamed"}},
  {"type":"board.editNode","params":{"id":"obj_2","text":"Renamed"}}
]}}'
curl -s -X POST ... -d '{"tabId":"'$TAB_ID'","type":"board.save"}'
```

## Screenshots — `board.screenshot` / `board.screenshot.multi`

The board now ships **native screenshot commands** that (a) auto-hide overlay panels for a clean shot, (b) auto-frame the target world region with 10% padding, and (c) restore viewport + panel state on the way out. They call `html2canvas` under the hood on the `[data-board-canvas]` container, so mermaid diagrams, images, and shapes are all captured.

### `board.togglePanels`

Set the visibility of any subset of overlays; returns the *previous* state of every touched panel so a caller can restore.

```bash
# Hide everything except the toolbar (default of hideAll)
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d "{\"tabId\":\"$TAB\",\"type\":\"board.togglePanels\",\"params\":{\"hideAll\":true}}"

# Toggle individual panels
# keys: ai | external | minimap | ruler | layers | toolbar   (each optional, boolean)
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d "{\"tabId\":\"$TAB\",\"type\":\"board.togglePanels\",\"params\":{\"minimap\":false,\"ruler\":true}}"
```

Response shape:
```json
{ "previous": { "ai": false, "external": false, "minimap": true, "ruler": false, "layers": true, "toolbar": true },
  "current":  { "ai": false, "external": false, "minimap": false, "ruler": true,  "layers": true, "toolbar": true } }
```

### `board.screenshot`

| param | default | meaning |
|---|---|---|
| `region` | – | `{x,y,width,height}` in world coords. Wins over `ids`. |
| `ids` | – | Compute bbox from these object IDs, plus `padding`. |
| `padding` | `40` | World-coord padding around `ids` bbox. |
| `hidePanels` | `true` | Temporarily hides ai/external/minimap/layers, restores after. |
| `maxWidth` | `1600` | Cap output canvas width (wire economy). |
| `format` | `"png"` | `"png"` or `"jpeg"`. |
| `quality` | `0.92` | jpeg only. |
| `background` | current bg | Override fill for transparent areas. |

Neither `region` nor `ids`? The board's total object bounding box is used.

```bash
# Screenshot everything on the board (jpeg, 1200px wide)
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d "{\"tabId\":\"$TAB\",\"type\":\"board.screenshot\",\"params\":{\"maxWidth\":1200,\"format\":\"jpeg\",\"quality\":0.85}}" \
  -o board.json

# Screenshot a specific object (by id)
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d "{\"tabId\":\"$TAB\",\"type\":\"board.screenshot\",\"params\":{\"ids\":[\"obj_123\"],\"padding\":80}}" \
  -o obj.json

# Screenshot a world region
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d "{\"tabId\":\"$TAB\",\"type\":\"board.screenshot\",\"params\":{\"region\":{\"x\":0,\"y\":0,\"width\":2400,\"height\":1600}}}" \
  -o region.json
```

Response:
```json
{ "imageBase64": "data:image/png;base64,...",
  "world":  { "x": 0, "y": 0, "width": 2400, "height": 1600 },
  "zoom":   0.54,
  "screen": { "width": 1600, "height": 1067 } }
```

Decode helper (writes to a working file):
```bash
python3 -c "
import json, base64, sys
d = json.load(open(sys.argv[1]))['result']
b = d['imageBase64']
if b.startswith('data:'): b = b.split(',',1)[1]
open(sys.argv[2], 'wb').write(base64.b64decode(b))
" board.json ./board.png
```

### `board.screenshot.multi`

Runs several shots sequentially, panels hidden once at the start and restored once at the end. Viewport is restored between shots so each region computation is stable.

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB'","type":"board.screenshot.multi","params":{
        "shots":[
          {"ids":["obj_1"], "padding":40},
          {"ids":["obj_2"], "padding":40},
          {"region":{"x":0,"y":0,"width":3000,"height":2000}, "maxWidth":1400}
        ]
      }}' \
  -o multi.json
```

Response: `{ "shots": [ { imageBase64, world, zoom, screen }, ... ] }`.

### Footnote — fallback via `/api/screenshot`

If the desktop app hasn't picked up the new build yet, or you need a raw window screenshot including panels, the generic desktop endpoint still works. Frame with `board.setViewport`, wait for the DOM to settle, then `GET /api/screenshot?mode=preview&tabId=$TAB`. Zoom picking: `zoom = min(Wscr / Wworld, Hscr / Hworld) * 0.9`. Preview area ≈ 1440×1000 CSS px depending on panel state. Downside: any open panel occludes part of the shot.

## Multi-tab safety net

If you accidentally hit the editor tab with a `board.*` command, the editor bridge silently ignores it (and vice versa — a `scene.addBundledScene` sent to the board tab is a no-op). Nothing bad happens; you just get a "command not handled" response. Fix by re-reading `/api/tabs` and picking the right `tabId`.
