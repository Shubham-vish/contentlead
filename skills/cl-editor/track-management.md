---
name: track-management
description: Organize tracks and use per-clip FX lane expansion, selection, range editing, and keyframe rows
tags: track, tracks, timeline, fx-lane, effect-span, keyframe, z-order, layer, reorder, moveTrack, reuse, lock, mute, rename, link
---

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

## Per-clip FX lanes

Eligible timeline items show a compact **FX** toggle. Click it to expand one
row per projected Effect Span below that clip. Expansion increases the owning
track's layout height, so other tracks remain aligned; collapsing removes only
the lane UI, not any effect.

Eligible types are audio, caption, composition, image, rect, shape, template,
text, and video items with a valid positive display range. An expanded clip
with no projected effects shows **No effects**.

### Selecting a bar

Clicking an effect bar:

1. selects the parent clip as the normal timeline selection;
2. records the span ID and parent ID separately;
3. opens the Properties panel; and
4. routes to the source-specific Effect Span inspector.

The parent clip therefore remains in `activeIds`; selecting an effect is not a
replacement synthetic item selection. Clicking ordinary timeline/canvas space,
pressing **Escape**, selecting another parent, or deleting the native effect
clears the span selection and restores the normal clip inspector.

The selected bar gets a focus outline. **Delete/Backspace** deletes it only when
the track is unlocked and the span is deletable.

### Drag and trim constraints

The lane previews a range while the pointer is down and commits once on pointer
release. Ranges are absolute project frames, start-inclusive/end-exclusive, and
cannot leave the parent clip. Resize handles support Left/Right Arrow for
one-frame changes.

| Source | Drag bar | Trim handles |
|---|---:|---:|
| effects-store | Yes | Yes |
| camera-focus | Yes | Yes |
| clip-FX edge envelope | No | Yes |
| clip-FX two-edge zoom | No | Yes |
| clip-FX legacy continuous zoom | No | No |
| camera-rig | No | No |
| reveal-mask | Projected bar only; adapter currently rejects range commits | Projected handles exist, but range commit is not implemented |

Locked tracks reject drag, trim, and delete. Unsupported commits keep the
native data unchanged and surface an error instead of approximating the effect.

### Keyframe sub-rows

Camera rig, camera focus, and reveal bars show a diamond control. Click it to
expand/collapse a dedicated keyframe row:

- camera rig: enabled rotation, position, and scale keyframes;
- camera focus: enter/hold/exit boundary frames;
- reveal: enabled mask keyframe tracks.

Clicking a keyframe diamond seeks the player to that absolute frame and keeps
the span selected. These rows are navigational in V1: edit values in the routed
camera/reveal inspector rather than dragging timeline diamonds.

For canonical span commands and inspector/source behavior, see
`animations-and-effects`.

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
