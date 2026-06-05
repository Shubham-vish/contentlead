---
name: text-and-captions
description: Full params for editor.addText and editor.addCaption — fonts, styling, karaoke, presets, track management
tags: text, caption, font, style, subtitle, title, stroke, shadow, role
---

# Text and Captions

Use these commands for titles, lower-thirds, subtitles, karaoke captions, and text restyling.

## Style Guide Defaults

All text and caption commands use the project's **dark cinematic** style guide by default:

| Role | Font Size | Weight | Color | Shadow | Letter Spacing |
|------|-----------|--------|-------|--------|----------------|
| `headline` | 96px | 800 | `#FFFFFF` | Purple glow | `-0.02em` |
| `title` | 80px | 800 | `#FFFFFF` | Purple glow | `-0.02em` |
| `subtitle` | 52px | 600 | `#D0D0D0` | Dark shadow | `normal` |
| `body` | 36px | 400 | `#D0D0D0` | Dark shadow | `normal` |
| `label` | 24px | 700 | `#BC4AEF` | Purple glow (subtle) | `0.08em` |
| `caption` | 64px | 800 | `#FFFFFF` | Purple glow | `0.02em` |

Font: **Montserrat** for all roles. Purple glow = `0 4px 30px rgba(138, 43, 226, 0.6)`.

Use `params.role` to select — or let the system auto-infer from text length (≤3 words → title, ≤8 → subtitle, else body).

## Smart Track Reuse

Text items are placed on existing agent-created text tracks when their time ranges don't overlap. This prevents 1-item-per-track clutter. Pass `trackId` to force a specific track.

## ⚠️ CRITICAL: Track Z-Order (Layer Visibility)

**In video editors, top track (Track 0) = front layer.** Text MUST be on top tracks, scenes/backgrounds on bottom tracks.

- **Always call `editor.reorderTracks` after building a video** — sorts text to top, scenes to bottom
- If text tracks end up below scene tracks, text is invisible (covered by background)
- The `editor.reorderTracks` command sorts: text/caption (top) → audio → video → images → template scenes (bottom)

## ⚠️ Text Pacing: Sequential Reveals (NOT text blocks)

**Never dump multiple lines into one text item.** This creates a static wall of text with no visual flow.

Instead, break content into separate text items with staggered timing:

❌ **BAD** — one text block:
```json
{"text": "Fear makes you sell early\nGreed makes you hold long\nStick to your plan", "from": 5000, "to": 10000}
```

✅ **GOOD** — sequential reveals:
```json
{"text": "Fear makes you sell early", "from": 5000, "to": 8000, "y": 550}
{"text": "Greed makes you hold long", "from": 6500, "to": 9500, "y": 700}
{"text": "Stick to your plan", "from": 8000, "to": 10000, "y": 850}
```

### Pacing guidelines
- Each text item: 2-4 seconds visible
- Stagger reveals by 1-1.5 seconds between lines
- Use different Y positions for visual separation (e.g., 500, 650, 800)
- Title lines: appear first at y=500, second line at y=650 (stagger 1s)
- Section structure: label → title line 1 → title line 2 → supporting points → transition

## `editor.addText`

Add a styled text layer to the timeline.

| Param | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | required | Text content |
| `from` (alias: `from_ms`) | `number` | `0` | Timeline start time |
| `to` | `number` | auto | Timeline end time |
| `durationMs` | `number` | `5000` | Duration (if no `to`) |
| `role` | `string` | auto | `headline`, `title`, `subtitle`, `body`, `label`, `caption` |
| `fontSize` | `number` | role-based | Font size in pixels |
| `color` | `string` | role-based | Hex text color |
| `textAlign` | `string` | `"center"` | `left`, `center`, or `right` |
| `fontFamily` | `string` | `"Montserrat"` | Font family |
| `fontWeight` | `number\|string` | role-based | CSS weight |
| `letterSpacing` | `string` | role-based | CSS tracking |
| `lineHeight` | `number` | role-based | CSS line-height |
| `textShadow` | `string` | role-based | CSS text-shadow |
| `textTransform` | `string` | `"none"` | `uppercase`, `lowercase`, `capitalize` |
| `backgroundColor` | `string` | transparent | Background fill behind text |
| `width` | `number` | role-based | Text box width |
| `x` | `number` | auto | Canvas X position |
| `y` | `number` | auto | Canvas Y position |
| `opacity` | `number` | `100` | Opacity from `0` to `100` (100 = fully opaque) |
| `strokeWidth` | `number` | `0` | Stroke width in pixels |
| `strokeColor` | `string` | none | Stroke color |
| `trackId` | `string` | auto | Place in specific track |

Example — cinematic title (uses defaults):

```json
{
  "type": "editor.addText",
  "params": {
    "text": "Launch Day",
    "from": 0,
    "durationMs": 4000,
    "role": "title"
  }
}
```

Example — styled title (explicit overrides):

```json
{
  "type": "editor.addText",
  "params": {
    "text": "Launch Day",
    "from": 0,
    "durationMs": 4000,
    "role": "title",
    "fontSize": 96,
    "color": "#ffffff",
    "textTransform": "uppercase",
    "letterSpacing": "-0.02em",
    "textShadow": "0 4px 30px rgba(138, 43, 226, 0.6)",
    "width": 900,
    "x": 90,
    "y": 820,
    "strokeWidth": 4,
    "strokeColor": "#000000"
  }
}
```

> ⚠️ **Repositioning after creation**: `x` and `y` set the initial canvas position.
> To **move or resize text later**, use **`editor.positionItem`** (see `canvas-and-positioning` skill).
> Do NOT use `editor.editItem` with `display.x`/`display.y` — those are timeline metadata,
> not visual coordinates. The renderer reads `details.top`/`details.left` (CSS), which
> only `positionItem` updates correctly.

## `editor.addCaption`

Add a caption layer. Defaults to Montserrat 64px, weight 800, purple active highlight.

| Param | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | required | Caption text |
| `from` (alias: `from_ms`) | `number` | `0` | Timeline start time |
| `to` or `durationMs` (alias: `duration_ms`) | `number` | `3000` | Caption end or duration |
| `words` | `array<object>` | auto | Optional per-word timing for karaoke |
| `fontSize` | `number` | `64` | Font size (Montserrat) |
| `fontWeight` | `number` | `800` | Font weight |
| `activeColor` | `string` | `#BC4AEF` | Active word highlight color |
| `color` | `string` | `#ffffff` | Text color |
| `textShadow` | `string` | purple glow | CSS text-shadow |
| `trackId` | `string` | auto | Place in specific track |

Example — caption with karaoke words:

```json
{
  "type": "editor.addCaption",
  "params": {
    "text": "This editor API is fast",
    "from": 1200,
    "durationMs": 2600,
    "words": [
      { "word": "This", "from": 1200, "to": 1550 },
      { "word": "editor", "from": 1550, "to": 2050 },
      { "word": "API", "from": 2050, "to": 2450 },
      { "word": "is", "from": 2450, "to": 2700 },
      { "word": "fast", "from": 2700, "to": 3800 }
    ]
  }
}
```

## `editor.editItem`

Modify an existing text or caption item by ID.

| Param | Type | Default | Description |
|---|---|---|---|
| `item_id` | `string` | required | Existing text or caption item ID |
| `details` | `object` | `{}` | Fields to change on the item |

Example — restyle a lower-third:

```json
{
  "type": "editor.editItem",
  "params": {
    "item_id": "text_01",
    "details": {
      "text": "Shubham Sharma",
      "fontSize": 54,
      "fontFamily": "Inter-Bold",
      "fontWeight": "700",
      "color": "#ffffff",
      "backgroundColor": "#111827cc",
      "width": 620,
      "x": 60,
      "y": 1620,
      "textAlign": "left",
      "strokeWidth": 0,
      "textShadow": "0 4px 12px rgba(0,0,0,0.35)"
    }
  }
}
```

## Font and Styling Notes

- Use `query.listFonts` to discover supported fonts.
- `opacity` uses `0` to `100` scale (100 = fully opaque).
- `width` and `height` are useful for multi-line text blocks and aligned titles.
- `strokeWidth` + `strokeColor` improve readability over busy footage.
- `textShadow` is ideal for glow, depth, and contrast.

## Common Patterns / Recipes

### Centered title

```json
{
  "type": "editor.addText",
  "params": {
    "text": "WELCOME",
    "from": 0,
    "durationMs": 3000,
    "fontSize": 120,
    "fontFamily": "Anton-Regular",
    "textTransform": "uppercase",
    "color": "#ffffff",
    "width": 900,
    "x": 90,
    "y": 840,
    "textAlign": "center",
    "opacity": 100
  }
}
```

### Lower-third

```json
{
  "type": "editor.addText",
  "params": {
    "text": "Host Name",
    "from": 2000,
    "durationMs": 4500,
    "fontSize": 42,
    "fontFamily": "Inter-Bold",
    "color": "#ffffff",
    "backgroundColor": "#000000bb",
    "width": 560,
    "height": 90,
    "x": 60,
    "y": 1640,
    "textAlign": "left",
    "opacity": 100
  }
}
```

### Neon text

```json
{
  "type": "editor.addText",
  "params": {
    "text": "LIVE NOW",
    "from": 0,
    "durationMs": 2500,
    "fontSize": 96,
    "fontFamily": "Poppins-Bold",
    "color": "#00ffb3",
    "textShadow": "0 0 10px #00ffb3, 0 0 24px #00ffb3, 0 0 48px rgba(0,255,179,0.7)",
    "width": 820,
    "x": 130,
    "y": 860,
    "textAlign": "center",
    "opacity": 100
  }
}
```

### Outlined text

```json
{
  "type": "editor.addText",
  "params": {
    "text": "BREAKING NEWS",
    "from": 0,
    "durationMs": 3500,
    "fontSize": 110,
    "fontFamily": "Anton-Regular",
    "color": "#ffffff",
    "strokeWidth": 5,
    "strokeColor": "#000000",
    "width": 940,
    "x": 70,
    "y": 820,
    "textAlign": "center",
    "opacity": 100
  }
}
```

### Caption refresh flow

```json
[
  {
    "type": "editor.addCaption",
    "params": {
      "text": "First line of captions",
      "from": 0,
      "durationMs": 1800,
      "words": [
        { "word": "First", "from": 0, "to": 800 },
        { "word": "line", "from": 800, "to": 1200 },
        { "word": "of", "from": 1200, "to": 1400 },
        { "word": "captions", "from": 1400, "to": 1800 }
      ]
    }
  },
  {
    "type": "editor.save",
    "params": {}
  }
]
```
