# Timeline Editing (Trim, Split, Cut)

Commands for modifying items that are **already on the timeline**.

> **Disambiguation:** If you are adding a NEW video and only want a portion of it, do not add the whole thing and split it. Instead, pass `trim: {from, to}` to the `editor.addVideo` command (see `video.md`).

## Trimming & Moving

### `editor.trimItem`
Change the source range of an existing item. **Also syncs `display.to`** so the timeline block resizes to match the new trim range (accounts for `playbackRate`).

```json
{ "type": "editor.trimItem", "params": {
  "itemId": "vid_abc",
  "trim": { "from": 2000, "to": 8000 }
}}
```

Returns `{trim: {...}, display: {...}}` — new display range for verification.

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
  "timeMs": 4500,
  "cascade": true 
}}
```

### `editor.cutItem`
Remove everything after (or before) a specific time, keeping one side. Use `cutMode` to control which side is kept.
```json
{ "type": "editor.cutItem", "params": {
  "itemId": "vid_abc",
  "timeMs": 3000,
  "cutMode": "keep-left",
  "cascade": true
}}
```
| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | required | Item to cut |
| `timeMs` | `number` | required | Cut point in ms (absolute timeline time) |
| `cutMode` | `string` | `"keep-left"` | `"keep-left"` or `"keep-right"` — which side to keep |
| `cascade` | `boolean` | `true` | Also cut linked track items |

### ⚠️ Cascade Behavior (Linked Tracks)
By default, `splitItem` and `cutItem` use `cascade: true`. If the item's track is linked to other tracks (via `editor.linkTracks`), the split/cut will **also** happen to any time-overlapping items on those linked tracks. Set `cascade: false` to only affect the specific `itemId`.

## ⚠️ Split & Trim Gotchas

### `editor.splitItem` on items without existing trim
If a video/audio was added WITHOUT trim (no `details.from`/`details.to` set), splitting it creates two pieces where BOTH play the source from time 0. Consequence: opening content repeats mid-video.

**Fix:** After `splitItem`, call `editor.trimItem` on each half explicitly:
```json
// First half plays source 0-8939ms
{ "type": "editor.trimItem", "params": { "itemId": "PART_A", "trim": {"from": 0, "to": 8939} }}
// Second half plays source 12039-70100ms (skips 8939-12039 = removed section)
{ "type": "editor.trimItem", "params": { "itemId": "PART_B", "trim": {"from": 12039, "to": 70100} }}
```

**Better alternative:** Use `editor.removeSegment({from_ms, to_ms, ripple: true})` — it splits AND sets trim correctly, plus ripple-shifts.

### ✅ `editor.addAudio` probes source duration automatically
When you omit `duration_ms`, the handler now creates a hidden `<audio>` element, waits for `loadedmetadata` (5s timeout), and uses the real duration. The response includes `durationProbed: true` when this happened, or a `warning` field if the probe failed (e.g. CORS-blocked source) and it fell back to the 10s default.

**Best practice: still pass `duration_ms` explicitly when known** — saves the ~100-300ms probe roundtrip per item:
```json
// Pre-probe with ffprobe first, then:
{ "type": "editor.addAudio", "params": { "url": "/path/to/whoosh.wav", "from_ms": 5000, "duration_ms": 476 } }
```
Shell one-liner to get ms: `ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 file.wav | awk '{printf "%.0f\n", $1*1000}'`

**Legacy projects:** If you inherited a project with oversized SFX blocks from before this fix, call `editor.trimItem` on each — it now correctly resizes both the source range AND the display block (see below).

### ✅ `editor.trimItem` now syncs both `trim` and `display`
Previously `trimItem` only updated `trim.to` — the timeline block stayed oversized. Now it also computes `display.to = display.from + (trim.to - trim.from) / playbackRate` and updates both atomically. Matches the UI's edge-drag behavior.

```json
{ "type": "editor.trimItem", "params": {
  "itemId": "abc123",
  "trim": { "from": 0, "to": 1276 }
}}
// Returns: { trim: {...}, display: {from: <preserved>, to: from + 1276} }
```

If you need to change ONLY the display range without touching trim (unusual — usually you want them in sync), use `editor.editItem` with `updates.display`.

### `editor.editItem` accepts multiple shapes for updates
The normalization layer accepts any of these — they all reach the same handler:
```json
// Canonical (recommended)
{ "type": "editor.editItem", "params": { "itemId": "X", "updates": {
  "details":  { "color": "#FFFFFF", "fontSize": 48 },
  "display":  { "from": 0, "to": 1276 },
  "trim":     { "from": 0, "to": 1276 },
  "metadata": { "priority": 1 }
}}}

// Top-level shorthands (all equivalent)
{ "type": "editor.editItem", "params": { "itemId": "X", "display": { "from": 0, "to": 1276 } }}
{ "type": "editor.editItem", "params": { "itemId": "X", "trim":    { "from": 0, "to": 1276 } }}
{ "type": "editor.editItem", "params": { "itemId": "X", "metadata":{ "priority": 1 } }}
{ "type": "editor.editItem", "params": { "itemId": "X", "details": { "color": "#FFFFFF" } }}
```
Precedence when multiple shapes conflict: `updates.*` wins over top-level shorthand wins over `details`-nested siblings (first-wins).

Empty `updates.details: {}` is a valid no-op success (idempotent). If you get "No valid update fields provided", check that at least one of `details`, `display`, `trim`, or `metadata` has a non-empty value.

**Historical cleanup pattern** (for legacy oversized SFX blocks from projects saved before the `trimItem` fix landed):
```python
# For SkillTown versions BEFORE the trimItem+display sync fix,
# you had to call BOTH trimItem AND editItem to shrink a block.
# On current builds, just calling editor.trimItem does both.
```

### `editor.moveItem` with `from: null` silently corrupts
Passing `from: null` (or omitting it) does NOT preserve the current value — it resets to 0. Always pass BOTH `from` and `to` as concrete numbers:
```json
// CORRECT
{ "type": "editor.moveItem", "params": { "itemId": "X", "from": 5000, "to": 8000 } }

// WRONG — corrupts item position to from=0
{ "type": "editor.moveItem", "params": { "itemId": "X", "to": 8000 } }
```

To simply resize an item's display range while keeping its start, call `editor.trimItem` instead of `moveItem`.

### Trim cleanup pattern (when shortening a video)
When your main video is 61.5s but audio/scenes/captions extend past it (e.g., 70s timeline), items past the video end will show blank. Trim all overrunning items:
```python
video_end = 61461  # your main video's display.to
for item in all_items:
    if item.display.from >= video_end:
        # Delete — entirely past
        delete(item.id)
    elif item.display.to > video_end:
        # Trim to video end (use trimItem, NOT moveItem!)
        trim(item.id, from=item.trim.from, to=item.trim.from + (video_end - item.display.from))
```

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
