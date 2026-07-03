---
name: project-and-export
description: Save, export, resize canvas, track management, undo/redo, design loading
tags: save, export, resize, track, mute, lock, hide, rename, undo, redo, load, design
---

# Project and Export

Use these commands to persist work, manage canvas size, control selection, and manage tracks.

## Common canvas sizes

| Format | Width | Height | Aspect |
|---|---:|---:|---|
| Portrait | `1080` | `1920` | `9:16` |
| Landscape | `1920` | `1080` | `16:9` |
| Square | `1080` | `1080` | `1:1` |

## `editor.save`

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "editor.save",
  "params": {}
}
```

## Snapshots

Snapshots are manual project checkpoints stored in Cosmos DB. Each project keeps a maximum of 5 snapshots; creating a 6th snapshot auto-evicts the oldest one.

## ⚠️ Snapshot Before Batch Operations

Before any destructive/batch operation (deleting multiple items, moving many, bulk restyling, applying auto-captions to full video), ALWAYS create a snapshot:

```json
{
  "type": "editor.createSnapshot",
  "params": { "label": "Before batch caption cleanup" }
}
```

This gives you a one-shot Ctrl+Z equivalent via `editor.restoreSnapshot({snapshotId})`. Without it, a batch mistake requires rebuilding from scratch.

**When you MUST snapshot first:**
- Before `bulk.deleteByType`
- Before `bulk.styleByType` on many items
- Before `editor.clearTimeline` (even with `trackId` filter)
- Before `editor.removeSegment` with ripple
- Before running `editor.autoCaption` on already-captioned content
- Before mass `editor.moveItem` loops
- Before deleting scene/audio tracks

The snapshot system already supports up to 5 snapshots per project (older auto-evict).

### `editor.createSnapshot`

| Param | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | auto-generated | Optional snapshot label |

```json
{
  "type": "editor.createSnapshot",
  "params": {
    "label": "Before title redesign"
  }
}
```

### `editor.listSnapshots`

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

```json
{
  "type": "editor.listSnapshots",
  "params": {}
}
```

### `editor.restoreSnapshot`

| Param | Type | Default | Description |
|---|---|---|---|
| `snapshotId` | `string` | required | Snapshot ID to restore |

```json
{
  "type": "editor.restoreSnapshot",
  "params": {
    "snapshotId": "snapshot_123"
  }
}
```

### `editor.renameSnapshot`

| Param | Type | Default | Description |
|---|---|---|---|
| `snapshotId` | `string` | required | Snapshot ID to rename |
| `label` | `string` | required | New label |

```json
{
  "type": "editor.renameSnapshot",
  "params": {
    "snapshotId": "snapshot_123",
    "label": "Approved draft"
  }
}
```

### `editor.deleteSnapshot`

| Param | Type | Default | Description |
|---|---|---|---|
| `snapshotId` | `string` | required | Snapshot ID to delete |

```json
{
  "type": "editor.deleteSnapshot",
  "params": {
    "snapshotId": "snapshot_123"
  }
}
```

## `project.saveAutosave` — local autosave file (fallback for large projects)

Writes the full project state directly to `~/.skilltown-desktop/projects/<contentId>.autosave.skilltown`. Use this when `editor.save` times out (typically on projects with large bundled scenes >10KB per scene).

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | Uses currently-loaded contentId. |

```json
{ "type": "project.saveAutosave", "params": {} }
// → { path, bytes, contentId }
```

**Also exposed via HTTP:** `POST /api/project/save-autosave` (same auth as `/api/execute`).

**Important:** This does NOT clear the "unsaved changes" indicator — it saves LOCALLY only. The cloud autosave loop will continue firing after this call (correct behavior — cloud is still stale). To actually mark saved-to-cloud, call `editor.save`.

**When to use it:**
- `editor.save` timed out (bundled scenes, big projects)
- You want a durable local checkpoint without touching cloud
- You're about to restart the app and cloud save isn't reachable

The autosave file survives page reloads and app restarts. On next load, `POST /api/project/restore` reads it.



| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "editor.undo",
  "params": {}
}
```

## `editor.redo`

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "editor.redo",
  "params": {}
}
```

## `editor.resize`

| Param | Type | Default | Description |
|---|---|---|---|
| `width` | `number` | required | New canvas width |
| `height` | `number` | required | New canvas height |

Example:

```json
{
  "type": "editor.resize",
  "params": {
    "width": 1080,
    "height": 1920
  }
}
```

## `editor.export`

| Param | Type | Default | Description |
|---|---|---|---|
| `format` | `string` | `"mp4"` | Export format |
| `project_name` | `string` | project title or default | Output name |

Example:

```json
{
  "type": "editor.export",
  "params": {
    "format": "mp4",
    "project_name": "launch-recap-final"
  }
}
```

## `editor.loadDesign`

Load a full design JSON object into the editor.

| Param | Type | Default | Description |
|---|---|---|---|
| `design` | `object` | required | Complete design payload |

Example:

```json
{
  "type": "editor.loadDesign",
  "params": {
    "design": {
      "id": "design_123",
      "tracks": [],
      "metadata": {
        "name": "Imported Design"
      }
    }
  }
}
```

## `editor.select`

Select one or more items.

| Param | Type | Default | Description |
|---|---|---|---|
| `item_ids` | `array<string>` | required | Items to select |

Example:

```json
{
  "type": "editor.select",
  "params": {
    "item_ids": ["text_title", "image_bg"]
  }
}
```

## `editor.deselectAll`

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "editor.deselectAll",
  "params": {}
}
```

## Track management

### `editor.muteTrack`

| Param | Type | Default | Description |
|---|---|---|---|
| `track_id` | `string` | required | Track to change |
| `muted` | `boolean` | `true` when omitted by some clients | Whether the track is muted |

Example:

```json
{
  "type": "editor.muteTrack",
  "params": {
    "track_id": "track_music",
    "muted": true
  }
}
```

### `editor.lockTrack`

| Param | Type | Default | Description |
|---|---|---|---|
| `track_id` | `string` | required | Track to change |
| `locked` | `boolean` | `true` when omitted by some clients | Whether the track is locked |

Example:

```json
{
  "type": "editor.lockTrack",
  "params": {
    "track_id": "track_main_video",
    "locked": true
  }
}
```

### `editor.hideTrack`

| Param | Type | Default | Description |
|---|---|---|---|
| `track_id` | `string` | required | Track to change |
| `hidden` | `boolean` | `true` when omitted by some clients | Whether the track is hidden |

Example:

```json
{
  "type": "editor.hideTrack",
  "params": {
    "track_id": "track_overlays",
    "hidden": true
  }
}
```

### `editor.renameTrack`

| Param | Type | Default | Description |
|---|---|---|---|
| `track_id` | `string` | required | Track to rename |
| `name` | `string` | `"Track"` | New track label |

Example:

```json
{
  "type": "editor.renameTrack",
  "params": {
    "track_id": "track_music",
    "name": "Background Music"
  }
}
```

## Common Patterns / Recipes

### Save then export

```json
[
  {
    "type": "editor.save",
    "params": {}
  },
  {
    "type": "editor.export",
    "params": {
      "format": "mp4",
      "project_name": "final-cut"
    }
  }
]
```

### Switch canvas to landscape

```json
[
  {
    "type": "editor.resize",
    "params": {
      "width": 1920,
      "height": 1080
    }
  },
  {
    "type": "editor.save",
    "params": {}
  }
]
```

### Lock background layers while editing text

```json
[
  {
    "type": "editor.lockTrack",
    "params": {
      "track_id": "track_main_video",
      "locked": true
    }
  },
  {
    "type": "editor.select",
    "params": {
      "item_ids": ["text_title"]
    }
  }
]
```

### Load a design snapshot

```json
{
  "type": "editor.loadDesign",
  "params": {
    "design": {
      "id": "design_snapshot",
      "tracks": [],
      "metadata": {
        "name": "Recovered Layout"
      }
    }
  }
}
```

---

## Full State & Render Validation

### `editor.loadDesign` — Additional Detail

Loads a full design JSON payload and restores saved animations after the design is mounted.

| Param | Type | Default | Description |
|---|---|---|---|
| `design` | `object` | required | Full design JSON to load |

**Returns:** `{ animationsRestored }`

```json
{
  "type": "editor.loadDesign",
  "params": {
    "design": {
      "tracks": [],
      "trackItemsMap": {},
      "duration": 60000,
      "fps": 30,
      "size": { "width": 1080, "height": 1920 }
    }
  }
}
```

### `project.getFullState`

Serialize the complete project state, including design and editor preferences.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | Exports the full persisted project object |

**Returns:** `{ project }`

```json
{
  "type": "project.getFullState",
  "params": {}
}
```

### `project.loadFullState`

Load a full persisted project object back into the editor.

| Param | Type | Default | Description |
|---|---|---|---|
| `project` | `object` | required | `{ design, editorPreferences? }` payload |

**Returns:** `{ loaded, trackCount, itemCount, animationsRestored }`

```json
{
  "type": "project.loadFullState",
  "params": {
    "project": {
      "design": {
        "tracks": [],
        "trackItemsMap": {},
        "duration": 60000,
        "fps": 30,
        "size": { "width": 1920, "height": 1080 }
      },
      "editorPreferences": {
        "background": { "type": "color", "value": "#0a0a0f" }
      }
    }
  }
}
```

### `render.validate`

Check whether the current project is ready to render.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | Runs pre-render content, timeline, and media checks |

**Returns:** `{ canRender, checklist, warnings, stats }`

```json
{
  "type": "render.validate",
  "params": {}
}
```

### `render.verifyOutput`

Verify render output availability after a render job completes.

| Param | Type | Default | Description |
|---|---|---|---|
| `jobId` | `string` | required | Render job ID to verify |

**Returns:** `{ jobId, verified, note }`

```json
{
  "type": "render.verifyOutput",
  "params": {
    "jobId": "render_01"
  }
}
```
