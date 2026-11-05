# Queries and State Reading

Before editing, use `query.getCapabilities` and `query.getProjectReadiness` with
an explicit tab and `params.expectedContentId`. See
[workflow-readiness.md](workflow-readiness.md) for the actual hydration/save
contract, bounded observation, unsupported-command handling and durable handoff.

Use these read-only commands to inspect the timeline, check item properties, and verify editor state.

## ⚠️ State vs Discovery
- If you need to know **how to connect** or if the editor is ready, see `SKILL`.
- If you need a **list of available commands**, use `SKILL`.
- Most commands below inspect **content inside the editor**; the two readiness
  queries above additionally expose the actual renderer execution contract.

## Core Queries

### `query.getEffectSpans`

Get the canonical Effect Span projection across effects-store, clip-FX, camera,
and reveal sources. Returned `startFrame` is inclusive and `endFrame` is
exclusive; both are **absolute project frames**.

```json
{ "type": "query.getEffectSpans", "params": {
  "itemId": "video_broll",
  "source": "effects-store"
}}
```

Optional filters: `itemId` (`trackItemId` alias), `source`, and exact `spanId`.
Returns `{spans, count}`. Use the returned `span.id` with
`editor.updateEffectSpan`, `editor.deleteEffectSpan`,
`editor.toggleEffectSpan`, or `editor.duplicateEffectSpan`. See
`animations-and-effects` for the mutation matrix and verified examples.

### `query.getTimelineItems` (Recommended)
Get a clean list of all items currently on the timeline.
```json
{ "type": "query.getTimelineItems", "params": { "trackId": "track_abc", "type": "video" } }
```

### `query.getTrackInfo`
Get all tracks and their IDs. **Do this before attempting track operations.**
```json
{ "type": "query.getTrackInfo", "params": {} }
```

### `query.getItemProperties`
Get the full `details` and `metadata` of a specific item.
```json
{ "type": "query.getItemProperties", "params": { "itemId": "vid_abc" } }
```

### `query.getItemsAtTime`
Find out what is visible at a specific millisecond timestamp.
```json
{ "type": "query.getItemsAtTime", "params": { "timeMs": 5000 } }
```

## Global State

### `query.getCanvasSize`
```json
{ "type": "query.getCanvasSize", "params": {} }
```

### `query.getDuration`
Get the total duration of the timeline (in ms).
```json
{ "type": "query.getDuration", "params": {} }
```

### `query.getEditorState` / `GET /api/state`
Returns the raw internal design state.
*Warning: Returns `null` if the timeline is completely empty. Prefer `getTimelineItems` for item inspection.*

## Playback & Preview

### `editor.seekToFrame`
Seek to a specific frame number (0-indexed).
```json
{ "type": "editor.seekToFrame", "params": { "frame": 150 } }
```

### `editor.previewRange`
Play a specific time range then auto-pause. Max 30 seconds.
```json
{ "type": "editor.previewRange", "params": { "from": 5000, "to": 10000 } }
```

**Returns:** `{ playing, fromMs, toMs, durationMs, autoPauseScheduled }`

## Diagnostics & Transition Queries

### `query.diagnoseScenes`
Check all bundled/custom scenes for React errors.
```json
{ "type": "query.diagnoseScenes", "params": {} }
```

### `query.listTransitions`
List available transition presets and currently applied transitions.
```json
{ "type": "query.listTransitions", "params": {} }
```

### `query.getTranscriptionStatus`
Check the status of a running transcription/auto-caption job.
```json
{ "type": "query.getTranscriptionStatus", "params": {} }
```

### `query.capturePreviewFrame`
Capture the current canvas as a PNG data URL. **Does NOT seek or wait** — captures whatever is currently on screen. If you need a frame at a specific time, use `query.previewFrameAt` (below) instead.
```json
{ "type": "query.capturePreviewFrame", "params": {} }
```

### `query.previewFrameAt` ⭐ (recommended for time-specific verification)

**Atomic seek + wait-for-stabilization + composite capture.** This is the correct way to verify what the timeline shows at a given time — it replaces the buggy `editor.seekTo` → sleep → `/api/screenshot` sequence.

**Why:** A stationary video can still contain a stale frame, and an empty loading placeholder is not proof of readiness. `query.previewFrameAt` pauses, seeks to the nearest project frame, then requires active timeline media to exist. Native videos must finish seeking, have decoded data, and match their runtime source clocks (including trim/rate); native presentation callbacks are checked where available. Images must load successfully. Active compositor canvases must acknowledge the requested frame without stale-source fallback. Readiness must hold across two animation-frame paint opportunities.

```json
{ "type": "query.previewFrameAt", "params": {
    "timeMs": 15000,
    "waitTimeoutMs": 3000
}}
```

**Returns:**
```json
{
  "imageBase64": "<raw PNG base64, without data URL prefix>",
  "width": 1080, "height": 1920,
  "timeMs": 15000,
  "stabilized": true,
  "targetFrame": 450,
  "stabilizationWaitedMs": 187,
  "readinessBlockers": [],
  "imageTimings": [],
  "videoTimings": [
    {"src":"...","expectedTime":4.32,"currentTime":4.32,"presentedTime":4.32,"stable":true,"seeking":false,"readyState":4}
  ]
}
```

- `waitTimeoutMs` defaults to 3000; must be finite, positive, and at most 30000. There is no configurable polling interval.
- `stabilized: false` → `captureSkipped: true`, with **no `imageBase64`**. Inspect `readinessBlockers` (missing media, image errors, unpresented videos, pending compositor, or capture deadline). A longer timeout will not repair failed URLs. The timeout budget covers readiness and asynchronous PNG encoding; an unready frame is not sent through GPU capture.
- Videos whose source clocks cannot be verified (for example uninstrumented custom-scene videos) conservatively time out instead of claiming stability.
- Cross-origin `<canvas>` layers are silently skipped (browser security).

**Use cases:** verify a caption is visible at a specific time; confirm B-roll appears where you scheduled it; check whether frame 0 of a scene is a usable poster before rendering.

## Additional Queries

These are straightforward — naming tells you what they do:

| Command | Params | Returns |
|---|---|---|
| `query.getCurrentTime` | `{}` | Current playback position in ms |
| `query.getSelectedItems` | `{}` | `{ selectedIds, count, items }` |
| `query.getAllText` | `{}` | All text/caption content with timing |
| `query.getVisibleText` | `{ timeMs }` | Text items visible at that time |
| `query.getProjectInfo` | `{}` | Project metadata (contentId, title, counts) |
| `query.listFonts` | `{}` | Available fonts |
| `query.listAnimationPresets` | `{}` | Animation presets (in/out/loop) — use before `setAnimation` |
| `query.getAssets` | `{}` | All registered media assets |
| `query.diff` | `{ sinceVersion }` | State diffs since a version number |

## Hit-testing for native UI control (`timeline.*` / `preview.*` geometry)

Read-only, cheap, no undo/save effect. Use them to aim `POST /api/ui` clicks/drags (see `cl-desktop/ui-automation.md`) at the Fabric timeline canvas and the preview player, which are not DOM. Every rect is **top-level viewport CSS px** (same space as `ui-click {x,y}`), already corrected for canvas offset, timeline scroll, timeline zoom and CSS scale; devicePixelRatio is reported but never needs applying. Shared per-target shape: `rect` (full box, may be off-screen), `visible`, `visibleRect` (clipped by scroll panes + window), `hitPoint` (centre of the visible part or `null`), `hittable` (`elementFromPoint` reaches the canvas/layer, i.e. no overlay on top).

| Command | Params | Returns |
|---|---|---|
| `timeline.getItemRects` | `{ itemIds?, trackIds?, visibleOnly?, includeHandles? = true, limit? ≤ 500 }` | `{ coordinateSpace, viewport{innerWidth,innerHeight,devicePixelRatio}, canvas{rect,visibleRect,logicalWidth,logicalHeight}, scroll{scrollLeft,scrollTop}, zoom{index,zoom,unit}, mapping, playhead, total, truncated, items[], missingIds? }`; item = `{ id, trackId, type, name, from, to, durationMs, selected, rect, visible, visibleRect, hitPoint, hittable, handles{requiresSelection:true, left, right} }` (times in ms) |
| `timeline.getTrackRects` | `{ trackIds?, visibleOnly? }` | same header + `tracks[{ id, index, type, name, itemCount, muted, locked, hidden, header (DOM row [data-track-row]), lane (canvas lane) }]` |
| `timeline.timeToViewportX` | `{ timeMs }` \| `{ seconds }` \| `{ timesMs: [] }` | header + `laneCenterY`, `points[{ timeMs, x, visible }]` (single input also spread at top level) |
| `timeline.revealItem` | `{ itemId, align?: "nearest" \| "center", margin? }` | scrolls the **view only** (not the design) so the clip is visible, then `getItemRects` result + `scrolled`, `item` |
| `preview.getLayerRects` | `{ itemIds?, visibleOnly? }` | `{ container{rect,visibleRect}, composition{width,height}, playheadMs, layers[{ id, type, zOrder (0 = front), selected, from, to, activeAtPlayhead, mounted, rect, visible, visibleRect, hitPoint, hittable }], selectionControls[{ direction, rect, hitPoint }] }` |

`mapping` is function-free: `x = originX - scrollLeft + seconds * pxPerSecond` (also `pxPerMs`, `zeroX`). `playhead` = `{ timeMs, x, rect, visible, visibleRect, hitPoint, knobPoint }` (DOM `[data-agent-id="timeline.playhead"]`; drag from `knobPoint` to scrub).

Recipes:
- **Move a clip**: `timeline.revealItem` → `ui-drag` from `item.hitPoint` by `Δms * mapping.pxPerMs` → verify with `query.getTimelineItems`.
- **Trim**: select the clip first (handles are only live on selected clips), re-read rects, drag `handles.left/right` centre.
- **Shift/Cmd multi-select**: `ui-click` each `hitPoint` with `modifiers`.
- Always re-read after scroll/zoom changes; only trust `hittable: true` points (overlay scrollbars/menus may cover edges). Preview layers exist only while active at the playhead (`mounted: false` otherwise); rotated layers report axis-aligned bounds.
- Errors: `timeline-not-mounted` / `preview-not-mounted` (timeline collapsed or editor not open in that tab).

### Framing & presentation for recordings (view-only, ephemeral)

These commands never touch the design, and timeline zoom is **not** persisted to the saved view.

| Command | Params | Returns |
|---|---|---|
| `timeline.zoomToFit` | `{}` | `{ previous, scale{index,zoom,unit}, changed, scrollLeft }` (scrolls to start) |
| `timeline.setZoom` | `{ index }` (0 = coarsest … `maxIndex`) | `{ previous, scale, changed, maxIndex }` |
| `timeline.zoomToRange` | `{ startMs, endMs, padding? = 0.05 }` | `{ previous, scale, changed, scrollLeft }` (tightest discrete level that fits, range start at left) |
| `timeline.scrollToTime` | `{ timeMs, align?: "center" \| "start" \| "nearest", margin? }` | `{ scrolled, scrollLeft }` (playhead unchanged) |
| `preview.zoomToFit` | `{}` | `{ previous, zoom, fitZoom }` (same as Ctrl+0) |
| `preview.setZoom` | `{ zoom }` (0.05–5) or `{ relativeToFit }` (1 = fit) | `{ previous, zoom, fitZoom, clamped }`. Centred. |
| `preview.setPlaybackRate` | `{ rate }` (non-zero, −4…4) | `{ previous, rate }`. This is the preview speed; the clip speed is `editor.setPlaybackRate`. |
| `ui.dismissTransient` | `{ closeMenus?, dismissToasts?, clearHover? (true), closeDialogs?, blur? (false), preserveToastIds? }` | `{ menusClosed, dialogsClosed, toastsDismissed, toastsPreserved, hoverCleared, blurred }` |
| `ui.preparePresentation` | `{ hideToasts?, hideDevOverlays?, hideTours?, dismissTransient? (true), hideCursor?, hideScrollbars? (false) }` | `{ previous, state, dismissed }` |
| `ui.resetPresentation` / `ui.getPresentation` | `{}` | `{ wasActive, previous }` / `{ active, options }` |

`ui.dismissTransient` sends Escape to the topmost Radix layer, so editor shortcuts do not see it. It leaves modal dialogs open unless `closeDialogs` is set. The save-conflict toast (`editor-save-conflict`) and loading toasts are always kept.

### Stable DOM markers (`data-agent-id`)

Key controls carry `data-agent-id` (dotted lowercase `surface.area.action`); repeated items add `data-agent-key="<item id>"`, so target `[data-agent-id="youtube.video.edit"][data-agent-key="<videoId>"]`. Editor: `editor.toolbar.{undo,redo,play-pause,skip-back,toggle-timeline,save,resize,export}`, `editor.export.start`, `editor.panel.<menuId>` (uploads, texts, videos, images, …), `editor.panel.toggle`; timeline: `timeline.{play-pause,loop,zoom-in,zoom-out,zoom-fit,delete,split,split-cut,ripple-delete,duplicate,magnetic,compact,crop-mode,pan-mode,waveforms,fade-handles,freeze-frame,add-marker,add-adjustment,shortcuts,volume,canvas,ruler,playhead}`, `timeline.track` (+key = trackId) with children `timeline.track.{visibility,mute,solo,lock,select}`; media bin: `media-bin.{upload,browse,library,search}`, `media-bin.asset` (+key); scenes: `scenes.card`/`scenes.add`/`scenes.bundled.add`/`scenes.mine.add` (+key = sceneId). Properties: `properties.tab.<tabId>`. Content page: `content.tab.<tabId>`, `content.detail.{save,cancel-edit,download,share,share-copy,duplicate,edit,delete}`, `cta.{add,edit,refresh,toggle,add-config}`, `publish.instagram.{publish,cancel-processing,schedule,schedule-cancel,schedule-refresh}`, `publish.youtube.publish`. Shared dialogs: `dialog.confirm`, `dialog.cancel` and `dialog.close`. Controls marked `data-agent-human-only` (payments, auth, OAuth, secrets) must be left to the human.

## Diagnostics & Health

Commands for detecting issues that aren't visible in normal responses:

### `query.validateTimeline`
Full timeline health check — orphaned items, gaps, track order, audio overlap.
```json
{ "type": "query.validateTimeline", "params": {} }
```
**Returns:** `{ valid, issues[], itemCount, trackCount }`

### `query.getSceneErrors`
Get runtime errors from Remotion scenes (scenes crash silently — this is how you detect them).
```json
{ "type": "query.getSceneErrors", "params": {} }
```

### `query.getCircuitBreakerStatus`
Check if any command types are circuit-broken (3 consecutive failures → 30s cooldown).
```json
{ "type": "query.getCircuitBreakerStatus", "params": {} }
```

### `query.getCommandHistory` / `query.getMetrics`
Debugging tools — recent command log and success/fail/timing stats.
```json
{ "type": "query.getCommandHistory", "params": { "count": 20 } }
```
