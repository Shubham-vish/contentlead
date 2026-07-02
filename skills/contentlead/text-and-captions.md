# Text and Captions

Use these commands to manually add text overlays, titles, lower thirds, and manual karaoke-style captions to the timeline.

> **Disambiguation:** 
> - If you want **automatic, transcription-driven subtitles**, use `content.applyCaptions` (see `transcription-and-editing` skill).
> - If you want to fix a typo in an existing auto-caption, use `editor.editCaptionWord` (see `transcription-and-editing`).
> - Use the commands below for **manual** text elements.

## ⚠️ CRITICAL: Track Z-Order (Layer Visibility)

**Track 0 = TOP/front-most layer.** Caption and text tracks must be above all video/image/background tracks.
After adding ANY caption/text item, immediately call `editor.reorderTracks` (unless you passed `autoReorder: true` or relied on the default). If text ends up below scene tracks, it will be invisible.

## Commands

### `editor.addText`
Add a manual text overlay (titles, lower thirds, callouts).

```json
{ "type": "editor.addText", "params": {
  "text": "Breaking News",
  "from": 2000,
  "durationMs": 4000,
  "details": {
    "fontSize": 72,
    "color": "#FFFFFF",
    "fontFamily": "Inter",
    "fontWeight": 700,
    "textAlign": "center"
  },
  "autoReorder": true 
}}
```

**Positioning Note:** Newly added text centers automatically. To move it, use `editor.positionItem` (see `canvas-and-positioning`) or update `details.top` / `details.left` via `editor.editItem`.
**Height Note:** Text rendered height is ~ `fontSize * 1.5`. Leave enough gap when stacking.

### `editor.addCaption`
Add a manual karaoke-style caption track using word-level timing arrays.

```json
{ "type": "editor.addCaption", "params": {
  "from": 0,
  "durationMs": 5000,
  "details": {
    "words": [
      {"word": "Hello", "start": 0, "end": 500},
      {"word": "world", "start": 500, "end": 1000}
    ]
  },
  "autoReorder": true
}}
```
*Note: `words` timings are in milliseconds, relative to the clip start (0).*

### `editor.editItem` (for styling Text)
Update the style of an existing text item.

```json
{ "type": "editor.editItem", "params": {
  "itemId": "text_abc",
  "details": {
    "color": "#FF0000",
    "borderWidth": 2,
    "borderColor": "#000000",
    "borderRadius": 8,
    "backgroundColor": "rgba(0,0,0,0.5)"
  }
}}
```

### `bulk.styleByType`
Apply styling to all text or caption items at once.

```json
{ "type": "bulk.styleByType", "params": {
  "type": "text",
  "details": { "fontFamily": "Montserrat", "color": "#EAEAEA" }
}}
```
