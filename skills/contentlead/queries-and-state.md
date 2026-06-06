---
name: queries-and-state
description: Read-only commands for inspecting editor state, timeline items, transcript, fonts, and animations
tags: query, state, timeline, items, transcript, fonts, duration, canvas, selected, inspect, read
---

# Queries and State

Always query before editing so you understand the current design, timing, tracks, and available presets.

## `query.getEditorState`

Returns editor state at one of three detail levels:

- `summary`: `trackCount`, `itemCount`, `duration`, `canvas`
- `snapshot`: summary plus design overview
- `full`: complete design JSON

| Param | Type | Default | Description |
|---|---|---|---|
| `scope` | `string` | `"summary"` | `summary`, `snapshot`, or `full` |

> **Response structure**: All commands return `{commandId, status, result, completedAt, executionTimeMs}`.
> The actual state data is inside `result`. For `GET /api/state`, the design is at `result.design`:
> ```json
> {
>   "commandId": "...",
>   "status": "success",
>   "result": {
>     "design": {
>       "trackItemsMap": { ... },  // all items keyed by ID
>       "tracks": [ ... ],          // track objects with item references
>       "duration": 138000,         // total duration in ms
>       "transitionsMap": { ... },
>       "fps": 30,
>       "size": { "width": 1920, "height": 1080 }
>     }
>   }
> }
> ```
> ⚠️ Items are at `result.design.trackItemsMap`, NOT at `result.trackItemsMap`.

Example:

```json
{
  "type": "query.getEditorState",
  "params": {
    "scope": "summary"
  }
}
```

## `query.getTrackInfo`

Get all tracks and the items on them.

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

## `query.getTimelineItems`

Filter timeline items by type, track, range, or point in time.

| Param | Type | Default | Description |
|---|---|---|---|
| `type` | `string` | all types | Optional type filter |
| `track_id` | `string` | all tracks | Optional track filter |
| `from_ms` | `number` | start of timeline | Range start filter |
| `to_ms` | `number` | end of timeline | Range end filter |
| `at_time_ms` | `number` | omitted | Return items active at one time |

Example:

```json
{
  "type": "query.getTimelineItems",
  "params": {
    "type": "text",
    "track_id": "track_overlays",
    "from_ms": 0,
    "to_ms": 8000,
    "at_time_ms": 3200
  }
}
```

## `query.getItemProperties`

Read one item's properties.

| Param | Type | Default | Description |
|---|---|---|---|
| `item_id` | `string` | required | Item to inspect |

Example:

```json
{
  "type": "query.getItemProperties",
  "params": {
    "item_id": "text_title"
  }
}
```

## `query.getCurrentTime`

Returns `time_ms`, `frame`, and `fps`.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "query.getCurrentTime",
  "params": {}
}
```

## `query.getDuration`

Returns total project duration.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "query.getDuration",
  "params": {}
}
```

## `query.getCanvasSize`

Returns `width`, `height`, and `aspect`.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "query.getCanvasSize",
  "params": {}
}
```

## `query.getSelectedItems`

Read current selection.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "query.getSelectedItems",
  "params": {}
}
```

## `query.getAllText`

Read all text and captions in timeline order.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "query.getAllText",
  "params": {}
}
```

## `query.getTranscript`

Transcript scope options:

- `summary`: word count, preview text, `hasWordTimestamps`
- `words`: full timed word list
- `segments`: grouped segments with ranges

| Param | Type | Default | Description |
|---|---|---|---|
| `scope` | `string` | `"summary"` | `summary`, `words`, or `segments` |
| `track_id` | `string` | current/default track | Optional track scope |
| `from_ms` | `number` | transcript start | Optional start bound |
| `to_ms` | `number` | transcript end | Optional end bound |

Example:

```json
{
  "type": "query.getTranscript",
  "params": {
    "scope": "segments",
    "track_id": "track_voiceover",
    "from_ms": 0,
    "to_ms": 15000
  }
}
```

## `query.getProjectInfo`

Combined content, editor, and StoryStudio summary.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "query.getProjectInfo",
  "params": {}
}
```

## `query.listFonts`

Search the available font catalog.

| Param | Type | Default | Description |
|---|---|---|---|
| `category` | `string` | all categories | Optional category filter |
| `search` | `string` | empty | Optional font name search |
| `limit` | `number` | `20` | Maximum results |

Example:

```json
{
  "type": "query.listFonts",
  "params": {
    "category": "sans-serif",
    "search": "Inter",
    "limit": 20
  }
}
```

## `query.getAudioLoudness`

Get volume and gain (in dB) for audio items. Returns current volume (0-100), equivalent gain in dB, source URL, display range, and trim range per item.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemIds` | `string[]` | **required** | Audio item IDs to query |

Example:

```json
{
  "type": "query.getAudioLoudness",
  "params": {
    "itemIds": ["music_01", "sfx_01"]
  }
}
```

Returns per item: `{ volume: 30, gainDb: -10.5, src: "...", display: {...}, trim: {...} }`

## `query.listAnimationPresets`

List available animation presets grouped by `in`, `out`, and `loop`.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "query.listAnimationPresets",
  "params": {}
}
```

## Common Patterns / Recipes

### Inspect before editing

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
  },
  {
    "type": "query.getSelectedItems",
    "params": {}
  }
]
```

### Find text on one track in a time window

```json
{
  "type": "query.getTimelineItems",
  "params": {
    "type": "text",
    "track_id": "track_overlays",
    "from_ms": 5000,
    "to_ms": 12000
  }
}
```

### Prepare a caption rewrite

```json
[
  {
    "type": "query.getTranscript",
    "params": {
      "scope": "words",
      "track_id": "track_voiceover"
    }
  },
  {
    "type": "query.getAllText",
    "params": {}
  }
]
```

### Choose a font and animation set

```json
[
  {
    "type": "query.listFonts",
    "params": {
      "search": "Montserrat",
      "limit": 10
    }
  },
  {
    "type": "query.listAnimationPresets",
    "params": {}
  }
]
```

## `query.diff`

Get state diffs since a known `stateVersion`. Useful after a command batch when you want an audit trail of what changed.

| Param | Type | Default | Description |
|---|---|---|---|
| `sinceVersion` | `number` | required | Return diffs after this version |

Example:

```json
{
  "type": "query.diff",
  "params": {
    "sinceVersion": 41
  }
}
```

## `query.getVisibleText`

Return text and caption items visible at a specific timeline time.

| Param | Type | Default | Description |
|---|---|---|---|
| `timeMs` | `number` | required | Timeline position in milliseconds |

Example:

```json
{
  "type": "query.getVisibleText",
  "params": {
    "timeMs": 8200
  }
}
```

## `query.getCircuitBreakerStatus`

Inspect circuit breaker state for command types with retry/failure protection.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "query.getCircuitBreakerStatus",
  "params": {}
}
```

## `query.getAssets`

List all registered media assets currently known to the project.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "query.getAssets",
  "params": {}
}
```

## Additional Diagnostics Queries

### `query.validateTimeline`

Run timeline health checks for orphaned items, invalid references, scene gaps, track-order problems, and high-volume audio overlap.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | Validates the current project timeline |

**Returns:** `{ stats, warnings, hardErrors }`

```json
{
  "type": "query.validateTimeline",
  "params": {}
}
```

### `query.getCommandHistory`

Read the recent command log from the in-memory tracker.

| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | `number` | `20` | Maximum number of recent commands |

**Returns:** `{ commands, count }`

```json
{
  "type": "query.getCommandHistory",
  "params": {
    "limit": 10
  }
}
```

### `query.getSceneErrors`

Return active scene runtime errors and automatically prune stale entries for deleted items.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | Returns current scene error registry |

**Returns:** `{ errors, count }`

```json
{
  "type": "query.getSceneErrors",
  "params": {}
}
```

### `query.getMetrics`

Return command-tracker metrics including totals, average execution time, per-command stats, and grouped error counts.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | No parameters |

```json
{
  "type": "query.getMetrics",
  "params": {}
}
```

### `query.getAssets`

List all registered assets currently known to the command framework.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | Returns registered image, video, and audio assets |

**Returns:** `{ assets, count }`

```json
{
  "type": "query.getAssets",
  "params": {}
}
```

### `query.diff`

Get recorded state diffs since a given state version.

| Param | Type | Default | Description |
|---|---|---|---|
| `sinceVersion` | `number` | `0` | Start version for the diff window |
| `limit` | `number` | `50` | Maximum diff entries to return |

**Returns:** `{ fromVersion, toVersion, entries, count }`

```json
{
  "type": "query.diff",
  "params": {
    "sinceVersion": 41,
    "limit": 20
  }
}
```

### `query.getVisibleText`

Return all text and caption items visible at a specific timepoint.

| Param | Type | Default | Description |
|---|---|---|---|
| `timeMs` | `number` | `0` | Timeline position in milliseconds |

**Returns:** `{ timeMs, textItems, count }`

```json
{
  "type": "query.getVisibleText",
  "params": {
    "timeMs": 8200
  }
}
```

### `query.getCircuitBreakerStatus`

Inspect retry and circuit-breaker state for protected command types.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | No parameters |

```json
{
  "type": "query.getCircuitBreakerStatus",
  "params": {}
}
```

### `query.capturePreviewFrame`

Capture the current preview frame as a PNG base64 string from the canvas or video preview.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | Captures the currently visible preview |

**Returns:** `{ imageBase64, width, height, source }`

```json
{
  "type": "query.capturePreviewFrame",
  "params": {}
}
```
