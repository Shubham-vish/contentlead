---
name: text-and-captions
description: Full params for editor.addText and editor.addCaption — fonts, styling, karaoke, presets, track management
tags: text, caption, font, style, subtitle, title, stroke, shadow, role
---

# Text and Captions

Use these commands for titles, lower-thirds, subtitles, karaoke captions, and text restyling.

> ## ⚠️ CRITICAL: Track Z-Order for EVERY Text/Caption
>
> **Track 0 is the TOP/front-most layer.** Captions and text must stay above video/image/background tracks or they will be hidden.
>
> **Pattern:** After adding ANY caption/text item, immediately call `editor.reorderTracks` **or rely on the now-automatic reordering** in `editor.addCaption`, `editor.addText`, and `editor.autoCaption`.
>
> As of 2026-06-18, `editor.addCaption` and `editor.addText` auto-reorder by default. Pass `autoReorder: false` only when you intentionally want to skip it and will reorder later. `editor.autoCaption` also auto-reorders by default.

## Style Guide Defaults

All text and caption commands use the project's **dark cinematic** style guide by default:

| Role | Font Size | Weight | Font | Color | Shadow | Letter Spacing |
|------|-----------|--------|------|-------|--------|----------------|
| `headline` | 96px | 800 | Montserrat | `#FFFFFF` | Purple glow | `-0.02em` |
| `title` | 80px | 800 | Montserrat | `#FFFFFF` | Purple glow | `-0.02em` |
| `subtitle` | 52px | 600 | Montserrat | `#D0D0D0` | Dark shadow | `normal` |
| `body` | 36px | 400 | Montserrat | `#D0D0D0` | Dark shadow | `normal` |
| `label` | 24px | 700 | Montserrat | `#BC4AEF` | Purple glow (subtle) | `0.08em` |
| `caption` | 120px | 800 | Montserrat | `#FFFFFF` | Purple glow | `0.02em` |

Font: **Montserrat** for all roles. Purple glow = `0 4px 30px rgba(138, 43, 226, 0.6)`.

Use `params.role` to select — or let the system auto-infer from text length (≤3 words → title, ≤8 → subtitle, else body).

## Smart Track Reuse

Text items are placed on existing agent-created text tracks when their time ranges don't overlap. This prevents 1-item-per-track clutter. Pass `trackId` to force a specific track.

## ⚠️ CRITICAL: Track Z-Order (Layer Visibility)

**In video editors, top track (Track 0) = front layer.** Text MUST be on top tracks, scenes/backgrounds on bottom tracks.

- **Track 0 = TOP/front-most layer**
- **Caption/text tracks → top**
- **Audio tracks → middle**
- **Video/image tracks → bottom/background**
- **Empty tracks are garbage-collected**
- **Always call `editor.reorderTracks` after building a video** — sorts text to top, scenes to bottom
- After adding ANY caption/text item, immediately call `editor.reorderTracks` OR rely on automatic reordering
- As of 2026-06-18, `editor.addCaption`, `editor.addText`, and `editor.autoCaption` auto-reorder by default; pass `autoReorder: false` to skip
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
| `autoReorder` | `boolean` | `true` | Automatically call `editor.reorderTracks` after adding; pass `false` only for bulk workflows where you reorder later |

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

Add a caption layer. Defaults to Montserrat 120px, weight 800, purple active highlight.

| Param | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | required | Caption text |
| `from` (alias: `from_ms`) | `number` | `0` | Timeline start time |
| `to` or `durationMs` (alias: `duration_ms`) | `number` | `3000` | Caption end or duration |
| `words` | `array<object>` | auto | Optional karaoke words. Accepts `params.words` (preferred) or `params.details.words`. Both timing formats accepted: `{ word, from, to }` or `{ word, start, end }` (all in ms). The handler normalizes to include both properties internally. |
| `fontSize` | `number` | `120` | Font size (Montserrat) |
| `fontWeight` | `number` | `800` | Font weight |
| `activeColor` | `string` | `#BC4AEF` | Active word highlight color |
| `color` | `string` | `#ffffff` | Text color |
| `textShadow` | `string` | purple glow | CSS text-shadow |
| `trackId` | `string` | auto | Place in specific track |
| `autoReorder` | `boolean` | `true` | Automatically call `editor.reorderTracks` after adding; pass `false` only for bulk workflows where you reorder later |

> ⚠️ **Positioning note**: `x` and `y` in `editor.addCaption` / `editor.addText` are accepted as convenience inputs and are converted to `details.left` and `details.top` CSS strings (e.g. `x: 100` → `details.left: "100px"`, `y: 500` → `details.top: "500px"`). For later repositioning, use **`editor.positionItem`**. Do **not** use `editor.editItem` with `x`/`y` — visual position lives in `details.top` / `details.left`, and `positionItem` updates that correctly.
>
> **Caption compatibility note**: `words` accept both `{ word, from, to }` and `{ word, start, end }` formats (all times in milliseconds). Output always includes both key sets for compatibility. Do **not** manually set `details.top` / `details.left` for `addCaption` — use the `x` / `y` params instead, or use **`editor.positionItem`** after creation.

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

### Word timing format compatibility

The renderer and preset system accept **both** `{ word, from, to }` and `{ word, start, end }` formats (all times in milliseconds). You can mix formats safely — the system normalizes internally:

- **`from`/`to`** — canonical storage format (what gets saved to DB)
- **`start`/`end`** — used by Whisper transcription and `content.applyCaptions`
- The `addCaption` handler normalizes custom words to include both properties
- The caption player (`CaptionWord` component) reads `start ?? from` and `end ?? to`
- Preset re-application (`transformCaptions`) normalizes on read and writes both formats

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

---

## editor.autoCaption — Automated Segment Transcription (Electron Only)

Transcribes a specific clip in the timeline and applies captions automatically. Handles audio extraction, upload, transcription, and caption placement in one command.

### Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `trackItemId` | string | ✅ | — | The ID of the video/audio item to transcribe |
| `language` | string | — | `"hi"` | Language code for Whisper (`hi`, `en`, `mr`, etc.) |
| `passes` | number | — | `1` | Number of retry attempts (1–3). More passes = higher accuracy, each with less context padding |
| `style` | string | — | `""` | `"hinglish"` to transliterate Hindi → Roman script |
| `translate` | boolean | — | `false` | Translate to English |
| `from` | number | — | auto | Override clip start (ms, source-relative) |
| `to` | number | — | auto | Override clip end (ms, source-relative) |

### How It Works

1. **Resolves source** — finds the actual media file from the track item
2. **Extracts audio** — ffmpeg extracts ONLY the trimmed segment + 10s context padding
3. **Uploads** — Azure Blob (if configured) or direct file upload to PrepWithAI
4. **Transcribes** — calls PrepWithAI, polls Firebase until complete
5. **Filters words** — keeps only words within the actual clip range (discards padding)
6. **Applies captions** — calls `content.applyCaptions` with properly timed words

### Progress Monitoring

The command writes progress to `~/.skilltown-desktop/jobs/transcription_<jobId>.json`:

```json
{
  "jobId": "tc_abc123",
  "status": "in_progress",
  "steps": {
    "resolve_source": { "done": true, "src": "/path/to/video.mp4" },
    "extract_audio": { "done": true, "pass": 1, "paddingSec": 10 },
    "upload": { "done": true, "mode": "azure", "url": "https://..." },
    "transcribe": { "done": false, "progress": 45, "firebasePath": "..." },
    "filter_words": { "done": false },
    "apply_captions": { "done": false }
  }
}
```

**To monitor progress:** Read the job file periodically. The `jobId` is returned immediately in the response.

### Example Usage

```json
[
  {
    "type": "editor.autoCaption",
    "params": {
      "trackItemId": "item_abc123",
      "language": "hi",
      "passes": 2,
      "style": "hinglish"
    }
  }
]
```

### Response

```json
{
  "status": "success",
  "captionCount": 28,
  "trackId": "track_xyz",
  "jobId": "tc_m2abc123def"
}
```

### Important Notes

- **Slow command** — takes 30–120 seconds depending on clip length
- Only works on **Electron desktop app** (needs ffmpeg + local file access)
- For web users, use the existing retranscription UI in the Transcript tab
- If `PREPWITHAI_API_SECRET` is not set, the command will fail immediately
- The command auto-detects trim/display ranges from the track item — you usually don't need `from`/`to`
- Context padding (10s before/after) ensures Whisper gets clean word boundaries
