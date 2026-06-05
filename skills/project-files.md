---
name: project-files
description: Save, load, export, and import entire projects as .skilltown JSON files. Use for bulk state reads/writes, project persistence, and full state manipulation.
tags: project, save, load, export, import, file, state, bulk, autosave
---

# Project Files (.skilltown)

## Overview

The project file system lets you export the **entire editor state** as a single JSON file, modify it, and load it back. This is much faster than command-by-command manipulation for bulk operations.

**File format**: `.skilltown` (JSON)
**Location**: Files saved to `~/.skilltown-desktop/projects/` or user-chosen path

## When to Use

| Use Case | Approach |
|----------|----------|
| Add 1-2 items | Use `POST /api/execute` commands |
| Read full state, then make many changes | Use `GET /api/project/export` → modify → `POST /api/project/import` |
| Save project to disk | `POST /api/project/save` |
| Open saved project | `POST /api/project/open` |
| Backup before risky changes | `POST /api/project/save` first |

## File Schema

> **⚠️ API state nesting**: When reading state via `GET /api/state`, the design is nested at
> `result.design` (not at the top level). The file schema below shows the `design` object directly.
> In API responses: `response.result.design.trackItemsMap` — NOT `response.result.trackItemsMap`.

```json
{
  "schemaVersion": 1,
  "meta": {
    "title": "My Video Project",
    "createdAt": "2026-05-28T12:00:00Z",
    "modifiedAt": "2026-05-28T14:30:00Z",
    "fps": 30,
    "size": { "width": 1920, "height": 1080 }
  },
  "design": {
    "fps": 30,
    "size": { "width": 1920, "height": 1080 },
    "tracks": [
      { "id": "track1", "type": "video", "items": ["item1", "item2"], "name": "Video Track" }
    ],
    "trackItemIds": ["item1", "item2"],
    "trackItemsMap": {
      "item1": {
        "id": "item1",
        "type": "text",
        "name": "Title",
        "display": { "from": 0, "to": 3000 },
        "details": { "text": "Hello World", "fontSize": 48, "color": "#ffffff" }
      }
    },
    "transitionsMap": {},
    "transitionIds": [],
    "duration": 30000,
    "markers": [],
    "keyframes": {},
    "effects": {}
  },
  "editorPreferences": {
    "hiddenTrackIds": [],
    "background": null
  },
  "assets": [
    { "id": "item3", "type": "audio", "src": "/local-media/song.mp3", "name": "Background Music" }
  ],
  "customScenes": []
}
```

## API Endpoints

### Export Project State
```bash
# Get the full project state as JSON
curl http://127.0.0.1:$PORT/api/project/export \
  -H "Authorization: Bearer $TOKEN"
```
Returns: `{ status: "success", project: {...}, currentPath: "/path/or/null" }`

### Import Project State
```bash
# Load a design into the editor (replaces current state)
curl -X POST http://127.0.0.1:$PORT/api/project/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "design": { "fps": 30, "size": {"width":1920,"height":1080}, "tracks": [...], "trackItemsMap": {...} } }'
```

You can send either:
- A full project object (with `schemaVersion` + `design`)
- Just `{ "design": {...} }` — it will be wrapped in a project skeleton

### Save to File
```bash
# Save to a specific path
curl -X POST http://127.0.0.1:$PORT/api/project/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "filePath": "/Users/me/projects/my-video.skilltown" }'

# Save to default location (autosave path)
curl -X POST http://127.0.0.1:$PORT/api/project/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Open from File
```bash
curl -X POST http://127.0.0.1:$PORT/api/project/open \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "filePath": "/Users/me/projects/my-video.skilltown" }'
```

### List Autosaves
```bash
curl http://127.0.0.1:$PORT/api/project/autosaves \
  -H "Authorization: Bearer $TOKEN"
```

### List Recent Projects
```bash
curl http://127.0.0.1:$PORT/api/project/recent \
  -H "Authorization: Bearer $TOKEN"
```

## Bulk Edit Workflow

The most powerful pattern — read everything, modify, write back:

```python
import requests, json

BASE = "http://127.0.0.1:PORT"
HEADERS = {"Authorization": "Bearer TOKEN", "Content-Type": "application/json"}

# 1. Export current state
resp = requests.get(f"{BASE}/api/project/export", headers=HEADERS)
project = resp.json()["project"]

# 2. Modify the project JSON
design = project["design"]

# Add a new text item
new_id = "my-new-text-001"
design["trackItemsMap"][new_id] = {
    "id": new_id,
    "type": "text",
    "name": "AI Generated Title",
    "display": {"from": 0, "to": 5000},
    "details": {
        "text": "Breaking News",
        "fontSize": 64,
        "color": "#ff0000",
        "fontFamily": "Arial",
        "fontWeight": "bold"
    }
}

# Add to a track (create one if needed)
if not design["tracks"]:
    design["tracks"].append({"id": "track-1", "type": "text", "items": []})
design["tracks"][0]["items"].append(new_id)

# 3. Import back
resp = requests.post(f"{BASE}/api/project/import", headers=HEADERS, json=project)
print(resp.json())
```

## Key Design Properties

### Track Item Types
| Type | Key Details Properties |
|------|----------------------|
| `text` | `text`, `fontSize`, `fontFamily`, `color`, `fontWeight`, `backgroundColor` |
| `image` | `src` (URL), `width`, `height`, `opacity` |
| `video` | `src` (URL), `volume`, `playbackRate` |
| `audio` | `src` (URL), `volume`, `playbackRate` |
| `scene` | `sceneName`, `compositionId`, `sceneProps` |

### Display Timing
All items have `display: { from: number, to: number }` in **milliseconds**.

### Trim (for media)
Media items may have `trim: { from: number, to: number }` for source-level trimming.

## Important Notes

1. **DESIGN_LOAD dispatch** — Import uses the canonical `DESIGN_LOAD` event from `@designcombo/state`, the same path the editor uses internally. This ensures proper initialization.

2. **Keyframes & Effects** — Stored in separate stores but included in the project file. Both are restored on import.

3. **Asset URLs** — The `assets` array is a manifest for reference. Actual src URLs are in `trackItemsMap[id].details.src`. Local files should use the `/api/local-file` endpoint or be in the `public/local-media/` folder.

4. **Validation** — Projects are validated before import. Missing items, orphaned references, and schema mismatches are reported as warnings.

5. **Autosave** — Projects are auto-saved every 30 seconds to `~/.skilltown-desktop/projects/{contentId}.autosave.skilltown`.
