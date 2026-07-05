# Queries and State Reading

Use these read-only commands to inspect the timeline, check item properties, and verify editor state.

## ⚠️ State vs Discovery
- If you need to know **how to connect** or if the editor is ready, see `SKILL`.
- If you need a **list of available commands**, use `SKILL`.
- The commands below are for inspecting **the content inside the editor**.

## Core Queries

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
Capture the current canvas as a PNG data URL.
```json
{ "type": "query.capturePreviewFrame", "params": {} }
```
