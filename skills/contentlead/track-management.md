# Track Management & Z-Order

Commands for organizing the timeline into tracks, controlling layer visibility, and track linking.

## ⚠️ CRITICAL: Track Z-Order (Layer Visibility)

**Track 0 is the FRONT layer (closest to the viewer).**
**Higher track numbers go BEHIND lower track numbers.**

This is the opposite of some design tools.
- **Track 0:** Front layer (Text, Captions, Overlays)
- **Track 1:** Behind Track 0 (Images, B-Roll)
- **Track 2+:** Background layers (Video, Scenes)

If you place text on Track 3, and a video on Track 0, the video will completely hide the text.

### `editor.reorderTracks` (THE FIX)
Because track math is confusing, the API provides an auto-sorter. **Always call this after adding new items to the timeline.** It automatically moves Text to the front (Track 0) and Videos/Scenes to the back.
```json
{ "type": "editor.reorderTracks", "params": {} }
```

## Track Layer Priority

`editor.reorderTracks` sorts tracks by a numeric priority — **lower priority = closer to viewer (higher on stack)**:

| Track Type | Default Priority | Position |
|-----------|-----------------:|----------|
| text / caption | **1** | Front (top) |
| audio | **2** | — |
| video | **3** | — |
| image (regular) | **4** | — |
| image with `metadata.isTemplateTrack: true` | **5** | Bottom (background) |

Custom scenes (added via `scene.addCustomScene`, `scene.addLibraryScene`, `scene.addBundledScene`) get `metadata.isTemplateTrack: true` and default to the bottom — great for backgrounds, wrong when a scene needs to overlay video.

### `editor.editTrack` — override the default priority

Set an explicit `metadata.priority` (number) to override the type-based default. Lower value = closer to viewer. Persists across save, restore, undo/redo.

```json
// Promote a scene track above videos (make it a foreground overlay)
{ "type": "editor.editTrack", "params": {
  "trackId": "track_abc",
  "metadata": { "priority": 1 }
}}

// Then call reorderTracks so the change takes effect
{ "type": "editor.reorderTracks", "params": {} }
```

Pass `metadata.priority: null` to clear the override and fall back to the default rank.

**Other track metadata** can also be updated the same way: `{trackId, metadata: {name, isTemplateTrack, ...}}`.

**Fallback options** if you don't want to touch metadata:
- `editor.moveTrack({trackId, index: 0})` — push to a specific position manually
- Manually drag in the UI

## Track Commands

### `editor.renameTrack`
Label tracks so you know what's on them.
```json
{ "type": "editor.renameTrack", "params": { "trackId": "track_abc", "name": "🎵 Music" } }
```

### `editor.muteTrack` / `editor.hideTrack` / `editor.lockTrack`
```json
{ "type": "editor.muteTrack", "params": { "trackId": "track_abc", "muted": true } }
{ "type": "editor.hideTrack", "params": { "trackId": "track_abc", "hidden": true } }
{ "type": "editor.lockTrack", "params": { "trackId": "track_abc", "locked": true } }
```

## Track Linking

Linking tracks ensures that when you split, cut, or delete items on the primary track, the time-aligned items on the linked tracks are also affected. This is crucial for keeping A-roll (video) and B-roll/Audio synced during cuts.

### `editor.linkTracks`
```json
{ "type": "editor.linkTracks", "params": {
  "trackIds": ["track_video", "track_audio"]
}}
```

### `editor.unlinkTracks`
```json
{ "type": "editor.unlinkTracks", "params": { "trackIds": ["track_video"] } }
```

### `editor.moveTrack`
Manually push a track to a specific layer.
```json
{ "type": "editor.moveTrack", "params": { "trackId": "track_abc", "index": 0 } }
```

## Item Grouping

Group items together to move them as a unit on the timeline. Groups are stored as `metadata.groupId` on each item.

### `editor.groupItems`
```json
{ "type": "editor.groupItems", "params": {
  "itemIds": ["text_title", "img_bg", "audio_sfx"],
  "groupId": "intro_group"
}}
```
| Param | Type | Default | Description |
|---|---|---|---|
| `itemIds` | `string[]` | required | At least 2 item IDs to group |
| `groupId` | `string` | auto-generated | Optional custom group ID |

**Returns:** `{ groupId, itemIds, count }`

### `editor.ungroupItems`
```json
{ "type": "editor.ungroupItems", "params": { "groupId": "intro_group" } }
```

### `editor.moveGroup`
Move all items in a group by a time offset.
```json
{ "type": "editor.moveGroup", "params": {
  "groupId": "intro_group",
  "offsetMs": 5000
}}
```
| Param | Type | Default | Description |
|---|---|---|---|
| `groupId` | `string` | required | Group to move |
| `offsetMs` | `number` | required | Time shift in ms (positive=forward, negative=backward) |

**Returns:** `{ groupId, moved, offsetMs }`
