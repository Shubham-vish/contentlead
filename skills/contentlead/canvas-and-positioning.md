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
  "x": 200,
  "y": 100
}}
```
| Param | Type | Description |
|---|---|---|
| `x` | `number` | Horizontal position (pixels from left) |
| `y` | `number` | Vertical position (pixels from top) |
| `width` | `number` | Optional — resize width |
| `height` | `number` | Optional — resize height |

### `editor.alignItem`
Snap an item to canvas edges or center.
```json
{ "type": "editor.alignItem", "params": {
  "itemId": "clip_abc",
  "align": "center"
}}
```
*Valid values: `center`, `centerH`, `centerV`, `left`, `right`, `top`, `bottom`*

## Transforms

### `editor.cropItem`
Crop an image or video visually.
```json
{ "type": "editor.cropItem", "params": {
  "itemId": "clip_abc",
  "crop": { "x": 100, "y": 100, "width": 800, "height": 600 }
}}
```
| Param | Type | Description |
|---|---|---|
| `crop.x` | `number` | Crop origin X (source pixels, default 0) |
| `crop.y` | `number` | Crop origin Y (source pixels, default 0) |
| `crop.width` | `number` | Crop width (source pixels, required) |
| `crop.height` | `number` | Crop height (source pixels, required) |
| `preservePosition` | `boolean` | Default `true` — repositions item so cropped content stays visually fixed |

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

While `editor.reorderTracks` (see `track-management`) handles macro layer ordering (text > video > backgrounds), you can manually adjust z-index within a track.

### `editor.setZIndex`
Change item layer order within its track. Uses direction-based movement, not absolute z-index values.
```json
{ "type": "editor.setZIndex", "params": { "itemId": "clip_abc", "direction": "front" }}
```
*Valid directions: `front`, `back`, `forward`, `backward`*
