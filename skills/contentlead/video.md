# Video & Chroma-Key

Commands for adding, trimming (at creation), and styling video items.

> **Disambiguation: Trimming vs Cutting**
> - **Trimming at creation:** Pass `trim: {from, to}` to `editor.addVideo` to only insert a specific portion of the source file.
> - **Cutting after creation:** Use `editor.splitItem` or `editor.cutItem` (see `item-editing`) to split or shorten clips already on the timeline.

## Adding Videos

### `editor.addVideo`
Add a video to the timeline.

```json
{ "type": "editor.addVideo", "params": {
  "src": "/Users/shubham/Downloads/broll.mp4",
  "from": 0,
  "durationMs": 4000,
  "volume": 0
}}
```

**⚠️ CRITICAL: Provide Duration & Dimensions**
For local files, the editor cannot synchronously read video metadata. You MUST provide the full duration of the file if you know it, or use `ffprobe` to check first.
If the API auto-correction reports a duration mismatch, update your command.

### `editor.addVideo` (with Trim)
Insert only seconds 10 to 15 from the source file.
```json
{ "type": "editor.addVideo", "params": {
  "src": "http://127.0.0.1:54109/media?path=/source.mp4",
  "from": 2000,
  "trim": { "from": 10000, "to": 15000 },
  "durationMs": 5000
}}
```

### `editor.addVideoSegments`
Extract multiple trimmed segments from a single source file and place them sequentially.
```json
{ "type": "editor.addVideoSegments", "params": {
  "url": "/source.mp4",
  "segments": [
    { "start": 5000, "end": 8000, "label": "intro" },
    { "start": 12000, "end": 15000, "label": "detail" }
  ],
  "gap": 0,
  "startAt": 0,
  "volume": 50
}}
```

## Video Styling & Chroma-Key

### `editor.setClipState`
Enable/disable a clip entirely, or mute its audio.
```json
{ "type": "editor.setClipState", "params": {
  "itemId": "vid_123",
  "enabled": true,
  "muted": true
}}
```

### `editor.setPlaybackRate`
Change video speed (e.g., 2.0 = 2x speed).
```json
{ "type": "editor.setPlaybackRate", "params": { "itemId": "vid_123", "rate": 2.0 } }
```

### Chroma-Key (Green Screen)
*(Implementation pending - state is stored in `details.chromaKey`)*
Currently, you must patch `details.chromaKey` via `editor.editItem`:
```json
{ "type": "editor.editItem", "params": {
  "itemId": "vid_123",
  "details": {
    "chromaKey": {
      "enabled": true,
      "keyColor": "#00ff00",
      "tolerance": 0.4
    }
  }
}}
```
