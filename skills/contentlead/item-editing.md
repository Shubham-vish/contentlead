# Timeline Editing (Trim, Split, Cut)

Commands for modifying items that are **already on the timeline**.

> **Disambiguation:** If you are adding a NEW video and only want a portion of it, do not add the whole thing and split it. Instead, pass `trim: {from, to}` to the `editor.addVideo` command (see `video.md`).

## Trimming & Moving

### `editor.trimItem`
Change the start/end bounds of an existing item.
```json
{ "type": "editor.trimItem", "params": {
  "itemId": "vid_abc",
  "from": 2000,
  "to": 8000
}}
```

### `editor.moveItem`
Slide an item left or right on the timeline (changes `display.from` and `display.to` by the same offset).
```json
{ "type": "editor.moveItem", "params": {
  "itemId": "vid_abc",
  "from": 5000,
  "to": 11000
}}
```

## Splitting & Cutting

### `editor.splitItem`
Slice a clip into two separate clips at a specific time.
```json
{ "type": "editor.splitItem", "params": {
  "itemId": "vid_abc",
  "time": 4500,
  "cascade": true 
}}
```

### `editor.cutItem`
Remove a specific time chunk out of the middle of a clip, resulting in two clips with a gap between them.
```json
{ "type": "editor.cutItem", "params": {
  "itemId": "vid_abc",
  "cutFrom": 3000,
  "cutTo": 6000,
  "cascade": true
}}
```

### ⚠️ Cascade Behavior (Linked Tracks)
By default, `splitItem` and `cutItem` use `cascade: true`. If the item's track is linked to other tracks (via `editor.linkTracks`), the split/cut will **also** happen to any time-overlapping items on those linked tracks. Set `cascade: false` to only affect the specific `itemId`.

## Deleting & Cleanup

### `editor.deleteItems`
Standard way to delete items. Dispatches an event.
```json
{ "type": "editor.deleteItems", "params": {
  "itemIds": ["vid_abc"],
  "cascade": false 
}}
```
*(Unlike splits, delete defaults to `cascade: false` to avoid accidentally deleting B-roll).*

### `editor.purgeItems`
**Use this if items refuse to delete.** It bypasses the event system and rips them directly out of the state store.
```json
{ "type": "editor.purgeItems", "params": {
  "itemIds": ["zombie_1"]
}}
```

### `editor.removeGaps`
Shift all items to the left to close any empty space on the timeline.
```json
{ "type": "editor.removeGaps", "params": { "trackId": "track_video" } }
```
