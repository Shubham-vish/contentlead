# cl-board — Viewport, Selection, and IO

Everything that is NOT object CRUD: camera control, selection, theme, canvas background, and persistence.

## PDF import — shared native jobs

These commands use the **same `PdfImportService` as PDFImportPanel**, including
pdf.js, native grid placement, authenticated `/api/boards/upload`, and canvas
history. They do not imitate a PDF import with unrelated image-add or a modal.
Runtime-discover them through `board.query.commands`; older renderers need an
owner-approved update, not automatic reload of unsaved work.

### Select a local PDF without exposing Desktop credentials to the renderer

After the user selects the exact file:

```bash
curl -X POST "http://127.0.0.1:$PORT/api/media/import" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"path":"/absolute/path/slides.pdf","userSelected":true}'
```

The bounded native PDF branch checks regular-file/home policy, no symlinks,
PDF magic and at most100MiB. It copies into private local media-imports without
overwriting an existing file, and returns
`{status:"imported",mediaUrl,fileName,size,contentType:"application/pdf",...}`.
An unavailable media server returns503 without copying. Use the **returned
`mediaUrl`**, not a guessed port or `/api/local-file` URL. The media-server URL is
loopback `/media?path=...`, CORS-readable without a bearer. Never put the Desktop
token in a renderer URL or command parameter.

An approved HTTPS PDF asset URL also works if browser CORS permits it.
Preparation omits credentials, refuses redirects/embedded URL credentials, and
bounds actual streamed bytes even without Content-Length. HTTP is accepted only
for Desktop loopback `/media`. It is not a generic endpoint proxy.

### Prepare, select, upload, review, apply

Send each body to `POST /api/execute` with the usual Desktop bearer. Always use
the explicit board tabId. Outer `status:"success"` means a job action was
accepted; **inner `result.status` is the actual import phase**.

```json
{"tabId":"<board-tabId>","type":"board.importPdf.prepare","params":{"sourceUrl":"<returned mediaUrl>","fileName":"slides.pdf"}}
```

Returns a session-scoped `jobId` immediately. Poll:

```json
{"tabId":"<board-tabId>","type":"board.importPdf.status","params":{"jobId":"<jobId>"}}
```

Wait for `review`; inspect `totalPages`/`fileName`. No pages have been uploaded
or placed. Get user approval of the exact selected pages, their cloud disclosure,
and placement, then:

```json
{"tabId":"<board-tabId>","type":"board.importPdf.start","params":{"jobId":"<jobId>","pages":[1,3,4],"x":100,"y":200,"approved":true}}
```

`pages` is a distinct, explicit1-based array,1–500 entries within the source PDF.
Pages are placed in ascending page order using the native400×560 objects, up to
4 columns,40-unit gaps. `x`/`y` must be finite within±10000000. No silent
“first500” truncation: for a larger document select the desired at most500 pages.
UI accepts `all` only for documents at most500 pages, or explicit ranges.

Rendering and upload run sequentially with cancellation, bounded canvas
dimensions/pixels and local downscaling to fit the native10MiB/page PNG limit.
Only selected pages are rendered/uploaded. Poll status; it reports
`pages`, `uploadedPages`, `failures`, `objectIds`, `saveRequired`.
States: `preparing → review → running → ready|partial`, then `applied`;
or `cancelled|failed`. Uploaded pages are **staged, not on the canvas**.

After `ready`, review then apply:

```json
{"tabId":"<board-tabId>","type":"board.importPdf.apply","params":{"jobId":"<jobId>","approved":true}}
```

Only successfully issued native signed HTTPS page URLs are added, in **one undo entry**. The response has
`objectIds` and `saveRequired:true`. Verify with `board.query.objects`, then call
`board.save` and inspect its response. Applying does not itself persist the board.
No temporary data/blob URLs are placed where autosave could strip them.
Repeated apply returns the same IDs without adding duplicates; after undo use
`board.redo`, not apply as a shortcut to duplicate pages.

These are long-lived signed read URLs, **not permanent access**:
`generateReadSasUrl` currently defaults to two years. Expiry, deletion or storage
policy changes can still make saved images inaccessible; saving a URL does not
extend its lifetime.

### Partial failure, explicit retry, and cancellation

`failures` contains bounded `{page,stage,code,status?,outcomeUncertain}` entries.
Codes are `render_failed`, `upload_rejected`, or `upload_uncertain`;401/403
indicate sign-in/access recovery in the app. No PDF text, raw provider body,
source URL or cookie is logged in those errors.

- If bytes were accepted but native read-URL signing fails, `/api/boards/upload`
  returns502 `{error:"read_url_unavailable",blobAccepted:true,retryable:false}`
  without a raw private blob URL. The job reports `upload_uncertain` and stages
  nothing for that page. Inspect signing/storage before any reviewed retry;
  automatically re-uploading can duplicate an already accepted blob.
- No automatic upload retries. After inspecting a partial job, explicitly
  approve retrying failed pages:
  `board.importPdf.retry {jobId,approved:true}`. Already uploaded successes are
  retained, not re-uploaded. An uncertain upload may have left an orphaned asset.
- To deliberately keep only successful pages use
  `board.importPdf.apply {jobId,approved:true,allowPartial:true}`.
  Failed pages remain reported; this is not complete-import success.
- `board.importPdf.cancel {jobId}` aborts preparation/render/upload and discards
  staging. Navigation to another board also cancels the job. No staged pages
  are placed afterward; completed cloud uploads are **not deleted** automatically.
  Abort cannot guarantee an in-flight storage request did not commit.
- Applied jobs require `board.undo` rather than cancel. One active job per
  renderer; finish/cancel before preparing another. Jobs are not restored after
  renderer reload. On timeout inspect the job/canvas; never blindly restart an
  import or reload unsaved work. Password-protected/unreadable PDFs fail
  preparation rather than being silently downgraded.
- These job commands are not executor `board.batch` actions. Poll individual
  commands on the same board tab; don't confuse command acceptance with upload,
  apply, or saved-board completion.

Native UI now uses these same review/upload/retry/apply stages. Closing its panel
cancels un-applied work; it no longer silently clears failed background uploads
and lets autosave strip missing page images.

## Viewport — two independent axes

There are **two** zoom systems on a board page, do not confuse them:

| System | Controls what | Where | How to change |
|---|---|---|---|
| **Page zoom** | The whole browser page (topbar, panels, canvas as a whole) | Topbar pill `−  100%  +` (`PageZoomControl.tsx`) | Cmd/Ctrl + `0` / `=` / `-` (bound by the topbar control, not the canvas), or click the pill. Persisted to `localStorage["board-page-zoom"]`, applied via `document.documentElement.style.zoom`. |
| **Board (canvas) zoom** | The board camera — how much world you see | Bottom-right canvas toolbar (`−  N%  +  ⊞`), trackpad pinch, Ctrl+scroll | `board.setViewport`, `board.zoomToFit`, `board.panBy` |

**Bridge commands operate on board zoom only.** The topbar page-zoom is a browser-UI concern; there's no bridge command for it (agents shouldn't be scaling the user's whole page).

## Board camera

The board uses a simple 2D world-space camera: `{x, y, zoom}`.

- `x`, `y` — world-space translation before zoom. The visible top-left world coordinate is `{-x, -y}`.
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

Frames content with a small margin. This is fit-to-content, not a reset to 100% zoom.

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

### `board.save` — canvas → SkillTown DB

```jsonc
{"type":"board.save","params":{}}
// → {
//   "saved": true,
//   "boardId": "396033e9-...",
//   "objectCount": 42,
//   "responseStatus": 200
// }
```

Calls `PUT /api/boards/[boardId]` with `{canvasData: JSON.stringify(state)}`. Title is saved separately with `board.setTitle`. Before serializing it:

1. Waits up to 4 seconds for any in-flight blob uploads to finish (so you don't persist blob URLs). If the timer expires, it saves anyway rather than blocking forever.
2. Runs the payload through `stripDataUrls` — anything with a `data:` or `blob:` URL is dropped.
3. Clears the `isDirty` flag on success.

Call `board.save` explicitly at the end of a batch and inspect the response. A successful save does not guarantee pending local images were uploaded: stripped assets can be absent after reload. Concurrent-save revision protection and failed-upload recovery remain known limitations; avoid editing while saving and inspect important media.

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

Saved `canvasData` JSON strings and object responses are supported. Malformed JSON, invalid object collections, and invalid viewports fail before replacing the canvas; a response arriving after navigation to another board is rejected.

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
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.query.snapshot"}'

# 2. ... do a bunch of `board.batch` calls ...

# 3. Frame the new content
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.zoomToFit"}'

# 4. Persist
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.save"}'

# 5. Optional persistence check — ONLY after successful save, with no new edits.
# Reload discards unsaved work. Compare expected fields/assets, not just counts.
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.reload"}'
```

**Center the camera on a specific object:**
```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.revealObject","params":{"id":"obj_1"}}'
```

## Boards library

The library is separate from a loaded board's `board.*` commands. **Use Desktop's cookie-authenticated bridge** with the same bearer header as `/api/execute`; no manual web JWT or cookie extraction is needed:

| Desktop endpoint | Contract |
|---|---|
| `GET /api/bridge/boards?q=roadmap&sort=title` | List/search/sort owned boards; returns `{boards,nextCursor}`. |
| `GET /api/bridge/boards?cursor=<nextCursor>&sort=recent` | Next page; keep the same search and sort. |
| `POST /api/bridge/boards` | JSON `{title,description?}`; returns the new board directly, including `id`. |
| `GET /api/bridge/boards/<id>` | Read saved board; `canvasData` is normally a JSON string. |
| `PUT /api/bridge/boards/<id>` | Update saved board metadata or serialized canvas. Prefer renderer `board.save` for an open board so media sanitization runs. |
| `DELETE /api/bridge/boards/<id>` | Delete only an explicitly requested board or your own disposable test board. |

After creation, open `POST /api/tabs/new {"url":"/board/<id>","activate":false,"waitForReady":true}`. Require successful `board.query.info` before editing. Pass `tabId` on every command, including **each command inside a Desktop `/api/batch`**; do not rely on its outer `tabId`.

Underlying authenticated web APIs on the app origin:

| API | Contract |
|---|---|
| `GET /api/boards?q=roadmap&sort=recent` | Owner-scoped title/description search. `sort`: `recent`, `oldest`, `title`. Returns `{boards,nextCursor}`; 50 cards per page. |
| `GET /api/boards?cursor=<nextCursor>&sort=recent` | Next page; retain the same search/sort parameters. |
| `POST /api/boards` | JSON `{title,description?}`; returns the new board with `id`. |
| `GET /api/boards/<id>` | Load an owned board. |
| `DELETE /api/boards/<id>` | Delete an owned board; only on explicit request. |
| `GET /api/boards/<id>/thumbnail` | Owner-authenticated saved-content SVG; private caching with revision ETag. |

Use the signed-in app session for direct web APIs. The Desktop discovery token only authenticates localhost Desktop routes; it is **not** a web API bearer token. Thumbnail generation currently has no `/api/bridge/boards/<id>/thumbnail` passthrough; use the authenticated web endpoint above.

Blank previews reflect saved background/grid. Large boards use representative crops/sampling; complex media may be placeholders. Previews are not pixel-perfect screenshots. Tour placement, hover feedback, responsive headers, card retry and pagination rendering are UI behavior, not extra command names. Library cards remain private; publish is not proof of viewer access.

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

**Foreground the board for capture:** record the active tab via `GET /api/tabs`, then `POST /api/tabs/<board-tab-id>/activate {}`. Background/minimized tabs can suspend animation frames and time out. Restore the previous tab afterward if it still exists and the user has not switched elsewhere. Do not immediately retry a timed-out capture: its renderer work can still be finishing.

Screenshot and PNG export expand tiny overflow-visible SVG layers **only in the capture clone**, so branches, root leaders, freehand paths, and connector markers are not clipped away. Live canvas geometry is unchanged. This does not remove other html2canvas limitations: fixed corner controls may remain, and virtualized/offscreen media are not guaranteed complete.

PNG export targets the dedicated canvas world layer rather than a transformed cursor/UI element, and crop offsets do not double-count camera pan. Validate actual image content, not just a successful response or PNG prefix.

### `board.togglePanels`

Set the visibility of any subset of overlays; returns the *previous* state of every touched panel so a caller can restore.

```bash
# Hide everything except the toolbar (default of hideAll)
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"tabId\":\"$TAB_ID\",\"type\":\"board.togglePanels\",\"params\":{\"hideAll\":true}}"

# Toggle individual panels
# keys: ai | external | minimap | ruler | layers | toolbar   (each optional, boolean)
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"tabId\":\"$TAB_ID\",\"type\":\"board.togglePanels\",\"params\":{\"minimap\":false,\"ruler\":true}}"
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
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"tabId\":\"$TAB_ID\",\"type\":\"board.screenshot\",\"params\":{\"maxWidth\":1200,\"format\":\"jpeg\",\"quality\":0.85}}" \
  -o board.json

# Screenshot a specific object (by id)
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"tabId\":\"$TAB_ID\",\"type\":\"board.screenshot\",\"params\":{\"ids\":[\"obj_123\"],\"padding\":80}}" \
  -o obj.json

# Screenshot a world region
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"tabId\":\"$TAB_ID\",\"type\":\"board.screenshot\",\"params\":{\"region\":{\"x\":0,\"y\":0,\"width\":2400,\"height\":1600}}}" \
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
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB_ID'","type":"board.screenshot.multi","params":{
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

If the desktop app hasn't picked up the new build yet, or you need a raw window screenshot including panels, the generic desktop endpoint still works. Frame with `board.setViewport`, wait for the DOM to settle, then `GET /api/screenshot?mode=preview&tabId=$TAB_ID`. Zoom picking: `zoom = min(Wscr / Wworld, Hscr / Hworld) * 0.9`. Preview area ≈ 1440×1000 CSS px depending on panel state. Downside: any open panel occludes part of the shot.

## Multi-tab safety net

If you accidentally hit the editor tab with a `board.*` command, the editor bridge silently ignores it (and vice versa — a `scene.addBundledScene` sent to the board tab is a no-op). Nothing bad happens; you just get a "command not handled" response. Fix by re-reading `/api/tabs` and picking the right `tabId`.
