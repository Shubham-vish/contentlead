---
name: timeline-operations
description: Move, trim, split, delete, clone items. Bulk operations, track reordering, and mass changes.
tags: move, trim, split, delete, clone, bulk, shift, gap, rearrange, reorder, tracks, z-order
---

# Timeline Operations

Use these commands to change timing, duplicate or remove items, and make broad timeline-wide adjustments.

**Quick Reference**

| Command | Description | Params |
|---|---|---|
| `editor.undo` | Undo the last action and restore the previous editor state | none |

## ⚠️ CRITICAL: Track Reordering

### `editor.reorderTracks`

Reorder tracks so content layers are correctly stacked. **Call this after building any video.**

> ⚠️ **Common mistake:** forgetting to call this after adding captions/text. As of 2026-06-18, `editor.addCaption`, `editor.addText`, and `editor.autoCaption` auto-call this by default — but if you bulk-add via `content.applyCaptions` or modify track structure manually, you **MUST** call this yourself.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | Automatically sorts by layer priority |

**Layer priority** (Track 0 = TOP/front-most layer):
1. Caption / text tracks — top
2. Audio tracks — middle
3. Video tracks — bottom/background
4. Regular image tracks — bottom/background
5. Template / scene tracks — bottom-most backgrounds

Empty tracks are garbage-collected during reorder.

**Why this matters:** In video editors, Track 0 (top) renders in front. If background scenes are on top tracks and text is on bottom tracks, the backgrounds cover all text — making it invisible.

```json
{"type": "editor.reorderTracks", "params": {}}
```

### `editor.setBackground`

Set the global canvas background. **ALWAYS do this first** — prevents white flashes even if scenes have gaps or errors.

| Param | Type | Default | Description |
|---|---|---|---|
| `type` | `string` | `"color"` | `"color"` or `"image"` |
| `value` | `string` | `"#000000"` | Hex color or image URL |

```json
{"type": "editor.setBackground", "params": {"type": "color", "value": "#0a0a0f"}}
```

### Clearing all items

**Preferred:** Use `editor.clearTimeline` (simpler, supports filtering):

| Param | Type | Default | Description |
|---|---|---|---|
| `types` | `string[]` | all item types | Optional filter such as `caption`, `text`, or `video` |
| `trackId` | `string` | all tracks | Clear only one specific track |

```json
// Clear everything
{"type": "editor.clearTimeline", "params": {}}

// Clear only captions
{"type": "editor.clearTimeline", "params": {"types": ["caption"]}}

// Clear only video items
{"type": "editor.clearTimeline", "params": {"types": ["video"]}}

// Clear only one track
{"type": "editor.clearTimeline", "params": {"trackId": "track_01"}}
```

**Fallback** if clearTimeline fails — use `editor.loadDesign` with empty state:

```json
{"type": "editor.loadDesign", "params": {"design": {
  "trackItemsMap": {}, "trackItemDetailsMap": {}, "tracks": [],
  "trackItemIds": [], "transitionsMap": {}, "transitionIds": [],
  "size": {"width": 1080, "height": 1920}, "duration": 60000, "fps": 30
}}}
```

### `editor.removeSegment` — Cut out a time range

Remove a section from the timeline and optionally shift everything after it left.

| Param | Type | Default | Description |
|---|---|---|---|
| `from_ms` | `number` | required | Start of range to remove |
| `to_ms` | `number` | required | End of range to remove |
| `ripple` | `boolean` | `true` | Shift items after `to_ms` left |
| `types` | `string[]` | all types | Only affect specific types |

```json
{"type": "editor.removeSegment", "params": {
  "from_ms": 15000, "to_ms": 16500, "ripple": true
}}
```

**⚠️ When removing multiple ranges:** process from END to START so ripple shifts don't invalidate unprocessed positions.

> **See also:** [Transcription & Editing Workflow](./transcription-and-editing.md) for complete transcription → captions → jump cuts workflow.

## `editor.moveItem`

Move an item to a new start time.

| Param | Type | Default | Description |
|---|---|---|---|
| `item_id` | `string` | required | Target item |
| `from_ms` | `number` | required | New start time on the timeline |

Example:

```json
{
  "type": "editor.moveItem",
  "params": {
    "item_id": "text_intro",
    "from_ms": 2500
  }
}
```

## `editor.trimItem`

Change the visible or audible range of an item.

| Param | Type | Default | Description |
|---|---|---|---|
| `item_id` | `string` | required | Target item |
| `from_ms` | `number` | current start or trim start | New start boundary |
| `to_ms` | `number` | current end or trim end | New end boundary |

Example:

```json
{
  "type": "editor.trimItem",
  "params": {
    "item_id": "video_main",
    "from_ms": 2000,
    "to_ms": 8200
  }
}
```

## `editor.splitItem`

Split one or more items at a specific time into two parts. The original item becomes the left part, a new item is created for the right part. Uses shared `splitUtils.ts` logic (pure functions, no React hooks).

| Param | Type | Default | Description |
|---|---|---|---|
| `itemIds` | `array<string>` | **required** | IDs of items to split |
| `timeMs` | `number` | **required** | Split time in ms — must be **strictly inside** the item's display range (not at boundaries) |

**Returns:** `{ splitCount, newItemIds: { originalId: newPartId }, skipped: [...] }`

Example:

```json
{
  "type": "editor.splitItem",
  "params": {
    "itemIds": ["text_01"],
    "timeMs": 2500
  }
}
```

**Notes:**
- Audio/video items: trim values are split correctly (left part keeps original trim.from, right part starts at the split offset)
- Composition items (scenes) are skipped automatically
- If timeMs equals item start or end, the item is skipped (nothing to split)
- The new item is inserted immediately after the original in the same track

## `editor.cutItem`

Split + delete one side in a single operation. Equivalent to split + delete but atomic.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemIds` | `array<string>` | **required** | IDs of items to cut |
| `timeMs` | `number` | **required** | Cut time in ms — must be strictly inside item display range |
| `cutMode` | `string` | `"keep-left"` | `"keep-left"` keeps the portion before timeMs; `"keep-right"` keeps the portion after |

**Returns:** `{ cutMode, splitCount, deletedIds: [...], survivorIds: [...] }`

Example — trim end of a clip:

```json
{
  "type": "editor.cutItem",
  "params": {
    "itemIds": ["image_01"],
    "timeMs": 3000,
    "cutMode": "keep-left"
  }
}
```

Example — trim start of a clip:

```json
{
  "type": "editor.cutItem",
  "params": {
    "itemIds": ["audio_bg"],
    "timeMs": 5000,
    "cutMode": "keep-right"
  }
}
```

## `editor.deleteItems`

Delete one or more items.

| Param | Type | Default | Description |
|---|---|---|---|
| `item_ids` | `array<string>` | required | Items to delete |

Example:

```json
{
  "type": "editor.deleteItems",
  "params": {
    "item_ids": ["text_old", "caption_07"]
  }
}
```

## `editor.cloneItem`

Duplicate an existing item.

| Param | Type | Default | Description |
|---|---|---|---|
| `item_id` | `string` | required | Item to clone |

Example:

```json
{
  "type": "editor.cloneItem",
  "params": {
    "item_id": "text_cta"
  }
}
```

## `editor.removeGaps`

Close empty space on the timeline.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "editor.removeGaps",
  "params": {}
}
```

## `editor.setMagnetic`

Toggle magnetic snapping.

| Param | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | required | `true` enables snap, `false` disables it |

Example:

```json
{
  "type": "editor.setMagnetic",
  "params": {
    "enabled": true
  }
}
```

## `bulk.deleteByType`

Delete all items of one type.

| Param | Type | Default | Description |
|---|---|---|---|
| `type` | `string` | required | `text`, `image`, `video`, `audio`, or `caption` |

Example:

```json
{
  "type": "bulk.deleteByType",
  "params": {
    "type": "caption"
  }
}
```

## `bulk.styleByType`

Apply one style payload to every item of a type.

| Param | Type | Default | Description |
|---|---|---|---|
| `type` | `"caption" \| "text" \| "video"` | required | Apply to every item of that type |
| `details` | `object` | required | Styling properties to apply |

Example:

```json
{
  "type": "bulk.styleByType",
  "params": {
    "type": "text",
    "details": {
      "fontFamily": "Inter-Bold",
      "fontSize": 56,
      "color": "#ffffff"
    }
  }
}
```

## `bulk.shiftAll`

Shift many items by a fixed amount.

| Param | Type | Default | Description |
|---|---|---|---|
| `shift_ms` | `number` | required | Positive moves later, negative moves earlier |
| `type` | `string` | all types | Optional filter such as `text` or `caption` |

Example:

```json
{
  "type": "bulk.shiftAll",
  "params": {
    "shift_ms": 2000,
    "type": "text"
  }
}
```

## Common Patterns / Recipes

### Remove all captions

```json
{
  "type": "bulk.deleteByType",
  "params": {
    "type": "caption"
  }
}
```

### Shift everything by 2 seconds

```json
{
  "type": "bulk.shiftAll",
  "params": {
    "shift_ms": 2000
  }
}
```

### Clean up timeline

```json
[
  {
    "type": "editor.removeGaps",
    "params": {}
  },
  {
    "type": "editor.setMagnetic",
    "params": {
      "enabled": true
    }
  }
]
```

### Cut the end off a clip (replaces split+delete pattern)

Use `editor.cutItem` instead of split+delete:

```json
{
  "type": "editor.cutItem",
  "params": {
    "itemIds": ["video_01"],
    "timeMs": 5000,
    "cutMode": "keep-left"
  }
}
```

### Split a music track and add a gap between halves

```json
[
  {
    "type": "editor.splitItem",
    "params": {
      "itemIds": ["music_01"],
      "timeMs": 17000
    }
  },
  {
    "type": "editor.moveItem",
    "params": {
      "item_id": "NEW_RIGHT_PART_ID",
      "to_ms": 19000
    }
  }
]
```
Note: Use the `newItemIds` from the split result to get the right part's ID.

### Clone a CTA and move it later

```json
[
  {
    "type": "editor.cloneItem",
    "params": {
      "item_id": "text_cta"
    }
  },
  {
    "type": "editor.moveItem",
    "params": {
      "item_id": "cloned_item_id",
      "from_ms": 12000
    }
  }
]
```

---

## Track Management Best Practices

### Always pass `from`/`to` when adding items

This is the single most important rule for clean timelines. Without `from`/`to`, every item is created at time 0 and must be moved — but by then the track is already allocated.

```json
{
  "type": "editor.addText",
  "params": {
    "text": "Slide 3 Title",
    "from": 10000,
    "to": 15000
  }
}
```

### Track renaming workflow

After building a sequence, rename tracks for user clarity:

```json
[
  {"type": "editor.renameTrack", "params": {"trackId": "track_1", "name": "🎵 Background Music"}},
  {"type": "editor.renameTrack", "params": {"trackId": "track_2", "name": "🔊 SFX"}},
  {"type": "editor.renameTrack", "params": {"trackId": "track_3", "name": "📝 Text Overlays"}},
  {"type": "editor.renameTrack", "params": {"trackId": "track_4", "name": "🖼 Background Images"}}
]
```

Note: Item-level `name` is NOT editable via `editItem` — only track names can be changed.

### Text positioning limitation

The editor's `placement` (x, y) positioning **does not work** — all text items render at center. If you need multiple visible text items at the same time, combine them into one text block with `\n` line breaks. One text item per visible moment avoids all overlap issues.

---

## Track Operations

Use these commands to control track state after building or reorganizing a timeline.

### `editor.muteTrack`

Mute or unmute a track.

| Param | Type | Default | Description |
|---|---|---|---|
| `trackId` | `string` | required | Target track |
| `muted` | `boolean` | `true` when omitted | `true` mutes, `false` unmutes |

```json
{
  "type": "editor.muteTrack",
  "params": {
    "trackId": "track_music",
    "muted": true
  }
}
```

### `editor.lockTrack`

Lock or unlock a track so items cannot be changed accidentally.

| Param | Type | Default | Description |
|---|---|---|---|
| `trackId` | `string` | required | Target track |
| `locked` | `boolean` | `true` when omitted | `true` locks, `false` unlocks |

```json
{
  "type": "editor.lockTrack",
  "params": {
    "trackId": "track_voiceover",
    "locked": true
  }
}
```

### `editor.hideTrack`

Hide or show a track in the preview canvas.

| Param | Type | Default | Description |
|---|---|---|---|
| `trackId` | `string` | required | Target track |
| `hidden` | `boolean` | `true` when omitted | `true` hides, `false` shows |

```json
{
  "type": "editor.hideTrack",
  "params": {
    "trackId": "track_overlays",
    "hidden": true
  }
}
```

### `editor.renameTrack`

Rename a track for clarity in the timeline UI.

| Param | Type | Default | Description |
|---|---|---|---|
| `trackId` | `string` | required | Target track |
| `name` | `string` | `"Track"` | New track label |

```json
{
  "type": "editor.renameTrack",
  "params": {
    "trackId": "track_sfx",
    "name": "🔊 Accent SFX"
  }
}
```

> `editor.reorderTracks` is documented above. It returns `{ trackOrder }` with the final sorted stack.

## Item Operations — Additional Details

These notes supplement the item commands documented earlier in this skill.

### `editor.splitItem`

Split one or more items at a timestamp. This command accepts either a single `itemId` or an `itemIds` array.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | optional | Single item to split |
| `itemIds` | `string[]` | optional | Multiple items to split |
| `timeMs` | `number` | required | Split time in milliseconds |
| `selectionMode` | `string` | `"keep-both"` | `keep-both`, `keep-left`, or `keep-right` |

**Returns:** `{ splitCount, newItemIds, skipped }`

```json
{
  "type": "editor.splitItem",
  "params": {
    "itemId": "video_intro",
    "timeMs": 2500,
    "selectionMode": "keep-both"
  }
}
```

### `editor.cutItem`

Split an item and immediately delete one side. Accepts `itemId` or `itemIds`.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | optional | Single item to cut |
| `itemIds` | `string[]` | optional | Multiple items to cut |
| `timeMs` | `number` | required | Cut time in milliseconds |
| `cutMode` | `string` | `"keep-left"` | `keep-left` or `keep-right` |

**Returns:** `{ cutMode, splitCount, deletedIds, survivorIds }`

```json
{
  "type": "editor.cutItem",
  "params": {
    "itemId": "audio_bed",
    "timeMs": 12000,
    "cutMode": "keep-right"
  }
}
```

### `editor.cloneItem`

Clone the current selection, or pass explicit item IDs to clone specific items.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemIds` | `string[]` | current selection | Items to clone |

```json
{
  "type": "editor.cloneItem",
  "params": {
    "itemIds": ["text_cta", "image_logo"]
  }
}
```

### `editor.removeGaps`

Shift items left to close empty time on one track or across all tracks.

| Param | Type | Default | Description |
|---|---|---|---|
| `trackId` | `string` | all tracks | Optional track scope |

**Returns:** `{ gapsRemoved }`

```json
{
  "type": "editor.removeGaps",
  "params": {
    "trackId": "track_voiceover"
  }
}
```

### `editor.setMagnetic`

Toggle magnetic snapping and return the current state.

| Param | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | required | Enables or disables snap |

**Returns:** `{ magneticEnabled }`

```json
{
  "type": "editor.setMagnetic",
  "params": {
    "enabled": false
  }
}
```

### `editor.select`

Set the active selection explicitly.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemIds` | `string[]` | `[]` | Item IDs to select |

```json
{
  "type": "editor.select",
  "params": {
    "itemIds": ["text_title", "image_bg"]
  }
}
```

### `editor.deselectAll`

Clear the current selection.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | Clears all selected items |

```json
{
  "type": "editor.deselectAll",
  "params": {}
}
```

## Bulk & Batch Operations — Additional Details

### `bulk.deleteByType`

Delete **all** items of one type and verify they were actually removed.

| Param | Type | Default | Description |
|---|---|---|---|
| `type` | `string` | required | `text`, `caption`, `image`, `audio`, or `video` |

**Returns:** `{ deleted, ids, verified }`

```json
{
  "type": "bulk.deleteByType",
  "params": {
    "type": "caption"
  }
}
```

### `bulk.styleByType`

Apply one shared `details` payload to every item of a type.

| Param | Type | Default | Description |
|---|---|---|---|
| `type` | `"caption" \| "text" \| "video"` | required | Apply to every item of that type |
| `details` | `object` | required | Styling properties to apply |

**Returns:** `{ updated }`

```json
{
  "type": "bulk.styleByType",
  "params": {
    "type": "text",
    "details": {
      "color": "#ffffff",
      "fontSize": 64
    }
  }
}
```

### `bulk.shiftAll`

Shift every item, or every item of one type, by a fixed millisecond offset.

| Param | Type | Default | Description |
|---|---|---|---|
| `shiftMs` | `number` | required | Positive moves later, negative moves earlier |
| `type` | `string` | all item types | Optional item-type filter |

**Returns:** `{ shifted, shiftMs }`

```json
{
  "type": "bulk.shiftAll",
  "params": {
    "shiftMs": 1500,
    "type": "text"
  }
}
```

### `batch.execute`

Run multiple commands sequentially in one request.

| Param | Type | Default | Description |
|---|---|---|---|
| `commands` | `array<object>` | required | Subcommands placed at the top level of the request |

**Returns:** `{ subResults, totalCommands }`

```json
{
  "type": "batch.execute",
  "commands": [
    {
      "type": "editor.select",
      "params": {
        "itemIds": ["text_title"]
      }
    },
    {
      "type": "editor.cloneItem",
      "params": {}
    }
  ]
}
```

## AI Helpers

### `editor.undo`

Undo the last action. Restores the previous editor state.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | No parameters |

**Returns:** `{ status: "success" }`

Example:

```json
{
  "type": "editor.undo",
  "params": {}
}
```

### `ai.undoLastAction`

Undo the most recent AI mutation and return context about what changed.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | Reverts the latest AI-issued mutation |

**Returns:** `{ undone, commandId, itemsBefore, itemsAfter, description }`

```json
{
  "type": "ai.undoLastAction",
  "params": {}
}
```

### `ai.previewChange`

Preview the effect of one or more commands without applying them.

| Param | Type | Default | Description |
|---|---|---|---|
| `commands` | `array<object>` | required | Commands to simulate |

**Returns:** `{ commandCount, totalAffectedItems, changes, note }`

```json
{
  "type": "ai.previewChange",
  "params": {
    "commands": [
      {
        "type": "editor.moveItem",
        "params": {
          "itemId": "text_title",
          "from": 2000,
          "to": 5000
        }
      }
    ]
  }
}
```
