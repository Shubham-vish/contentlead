# Canvas, Positioning, and Transforms

Commands for resizing the main video canvas, positioning items spatially, cropping, rotating, and managing z-index.

## Global Canvas

### `query.getCanvasSize`
Check current dimensions. **Always do this before adding scenes.**
```json
{ "type": "query.getCanvasSize", "params": {} }
```

### `editor.resize`
Resize the whole project canvas.
```json
{ "type": "editor.resize", "params": { "width": 1080, "height": 1920 } }
```

### `editor.setBackground`
Set the global canvas background (prevents white flashes).
```json
{ "type": "editor.setBackground", "params": { "type": "color", "value": "#0a0a0f" } }
```

## Spatial Positioning

### `editor.positionItem`
Move an item to specific X/Y coordinates.
```json
{ "type": "editor.positionItem", "params": {
  "itemId": "clip_abc",
  "top": 100,
  "left": 200
}}
```

### `editor.alignItem`
Snap an item to canvas edges or center.
```json
{ "type": "editor.alignItem", "params": {
  "itemId": "clip_abc",
  "align": "center" // "top", "bottom", "left", "right", "center-horizontal", "center-vertical"
}}
```

## Transforms

### `editor.cropItem`
Crop an image or video visually.
```json
{ "type": "editor.cropItem", "params": {
  "itemId": "clip_abc",
  "crop": { "x": 100, "y": 100, "w": 800, "h": 600 }
}}
```
*Note: Uses the in-editor crop math to reposition the media cleanly within the new container bounds.*

### `editor.rotateItem`
```json
{ "type": "editor.rotateItem", "params": { "itemId": "clip_abc", "angle": 45 }}
```

### Generic Transforms via `editor.editItem`
You can also patch details directly:
```json
{ "type": "editor.editItem", "params": {
  "itemId": "clip_abc",
  "details": {
    "flipX": true,
    "flipY": false,
    "opacity": 0.8,
    "blendMode": "screen"
  }
}}
```

## Z-Index (Layering)

While `editor.reorderTracks` (see `timeline-operations`) handles macro layer ordering (text > video > backgrounds), you can manually adjust z-index within a track.

### `editor.setZIndex`
```json
{ "type": "editor.setZIndex", "params": { "itemId": "clip_abc", "zIndex": 10 }}
```
