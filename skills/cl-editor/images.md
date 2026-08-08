# Images & Static Media

Commands for adding and manipulating images in the timeline.

## Adding Images

### `editor.addImage`
```json
{ "type": "editor.addImage", "params": {
  "src": "https://example.com/image.jpg",
  "from": 0,
  "durationMs": 5000,
  "details": {
    "objectFit": "cover"
  }
}}
```

**Important Rules for Images:**
1. **Never use `blob:` URLs** — they do not survive page reloads or project saves.
2. Provide local paths (e.g., `/Users/shubham/.../image.jpg`) — the API server will automatically convert them to data URIs or media server URLs.
3. For AI-generated backgrounds, use `objectFit: "cover"` to ensure they fill the screen.
4. Base64 data URIs are supported but keep them under 2MB total (use JPEG quality 70, not PNG).

## Replacing Media

### `editor.replaceMedia`
If an image file was moved or renamed, use this to fix the reference without losing timeline position or effects.

```json
{ "type": "editor.replaceMedia", "params": {
  "itemId": "img_abc123",
  "src": "/Users/shubham/Downloads/new-image.jpg"
}}
```

## Styling

Images support borders, border-radius, opacity, and CSS filters via `editor.editItem`:

```json
{ "type": "editor.editItem", "params": {
  "itemId": "img_abc",
  "details": {
    "borderWidth": 4,
    "borderColor": "#FFFFFF",
    "borderRadius": 20,
    "opacity": 0.9,
    "filterContrast": 1.1,
    "filterSaturate": 1.2
  }
}}
```

## Pre-flight Validation

### `media.validate`
Check if an image URL is accessible and not blocked by CORS before adding.
```json
{ "type": "media.validate", "params": { "url": "https://...", "type": "image" } }
```
