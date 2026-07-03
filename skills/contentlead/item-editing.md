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

### ⚠️ `editor.addAudio` without `durationMs` defaults to 10000ms (10s) block
When you call `editor.addAudio` with just `{src, from_ms}` — no `duration_ms` — the item is created with a **10-second placeholder block** even if the actual audio file is only 0.4–3s. The audio plays for its real duration (waveform stops correctly), but the item block spans 10s and can:
- Extend past the end of your main video (breaks "no dead air" rule for reels)
- Overlap and hide other SFX blocks in the timeline UI
- Make it look like SFX are longer than they are

**Root cause:** `editor.addAudio` cannot synchronously probe the duration of a `media://` URL (audio files load async). It falls back to 10000ms. Video items don't have this problem because `<video>.duration` populates fast enough.

**Prevention (best):** Always pass `duration_ms` explicitly:
```json
// Pre-probe with ffprobe first, then:
{ "type": "editor.addAudio", "params": { "url": "/path/to/whoosh.wav", "from_ms": 5000, "duration_ms": 476 } }
```
Shell one-liner to get ms: `ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 file.wav | awk '{printf "%.0f\n", $1*1000}'`

**Cleanup (after the fact):** ffprobe each source, then update BOTH trim and display (see below — trim alone is not enough).

### ⚠️ `editor.trimItem` updates trim.to but NOT display.to
Calling `editor.trimItem` to shrink a block from `to: 10000` down to `to: 1276` sets `trim.to: 1276` correctly — but leaves `display.to: 10000` untouched. The audio still cuts off at 1.276s (good), but the timeline block still occupies 10s (bad).

To ACTUALLY shrink the timeline block, use `editor.editItem` with the `updates.display` shape:
```json
{ "type": "editor.editItem", "params": {
  "itemId": "abc123",
  "updates": { "display": { "from": 5000, "to": 6276 } }
}}
```
⚠️ **Note:** `editor.editItem` only accepts `display` inside `updates`, NOT `details`. Wrong shape (`details.display`) returns "No details to update. Use moveItem for display changes, trimItem for trim changes." — a misleading error, because `moveItem` shifts position and `trimItem` doesn't touch display either. Only `editItem + updates.display` works.

**Full cleanup pattern for oversized SFX blocks:**
```python
# 1. Fetch all audio items
# 2. For each local-file SFX (skip blob URLs like BG music):
#    a. Parse src → local path (unquote from ?path=)
#    b. real_ms = ffprobe(path)
#    c. If current (trim.to - trim.from) > real_ms:
#       - trimItem(id, trim={from: cur_from, to: cur_from + real_ms})
#       - editItem(id, updates={display: {from: disp.from, to: disp.from + real_ms}})
# 3. editor.save
```
Batch both commands via `/api/batch` for atomicity. Verified working: 38 items cleaned in <1s.

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
