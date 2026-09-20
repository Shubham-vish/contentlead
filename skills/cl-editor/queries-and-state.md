# Queries and State Reading

Use these read-only commands to inspect the timeline, check item properties, and verify editor state.

## ⚠️ State vs Discovery
- If you need to know **how to connect** or if the editor is ready, see `SKILL`.
- If you need a **list of available commands**, use `SKILL`.
- The commands below are for inspecting **the content inside the editor**.

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
