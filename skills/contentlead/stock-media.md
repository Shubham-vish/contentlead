---
name: stock-media
description: Search Pexels stock photos/videos and drop them on the ContentLead timeline. Two search commands wrap the same `/api/pexels` proxies the UI uses; add-to-timeline reuses the generic `editor.addImage` / `editor.addVideo`.
tags: media, stock, pexels, images, videos, search, add-to-timeline
---

# Stock Media (Pexels) — Agent Commands

**Two commands** cover Pexels search — the "add to timeline" step uses the existing generic `editor.addImage` / `editor.addVideo` commands with the `src` URL you pick from a search result. There is no dedicated "addPexels" command by design: once you have a URL, timeline placement is not Pexels-specific.

| Command | Category | Purpose |
|---|---|---|
| `media.searchPexelsImages` | query (read-only) | Text search or curated feed |
| `media.searchPexelsVideos` | query (read-only) | Text search or popular feed |
| `editor.addImage` | mutation | Place any image (Pexels or not) on the timeline |
| `editor.addVideo` | mutation | Place any video (Pexels or not) on the timeline |

## Auth / API key

The search commands proxy through the existing Next.js routes at `/api/pexels` and `/api/pexels-videos`. The API key resolves in this order:

1. **`params.apiKey`** — per-call override.
2. **User's Pexels key from Settings** — resolved from the Firebase config cache (`globalSettings/pexelsApiKey`); the same key the UI's *Pexels Setup* dialog manages.
3. **`process.env.PEXELS_API_KEY`** — server-side fallback in the Next.js route.

If none is set, the proxy returns HTTP 500 `"Pexels API key not configured"` and the command fails with that message.

## `media.searchPexelsImages`

Search photos by text, or omit `query` for Pexels' curated feed.

```bash
curl -sX POST "$API/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d '{
    "type": "media.searchPexelsImages",
    "params": { "query": "golden hour coffee window seat", "perPage": 5 }
  }' | jq '.result.results[] | {pexelsId, src, width, height, photographer, alt}'
```

| Param | Type | Default | Notes |
|---|---|---|---|
| `query` | string | — | Omit for **curated** feed |
| `page` | number | 1 | |
| `perPage` | number | 10 | Clamped to `[1, 80]` |
| `apiKey` | string | — | Per-call override |

Result: `{ results: [...], count, total_results, page, per_page, has_next_page, has_prev_page, mode: 'search'|'curated' }` — each `results[i]` has `{ id, pexelsId, src, preview, width, height, photographer, photographer_url, alt, original_url, avg_color }`.

## `media.searchPexelsVideos`

Same shape, but for video. Omit `query` for the **popular** feed.

```bash
curl -sX POST "$API/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d '{"type": "media.searchPexelsVideos", "params": {"query":"aerial ocean cinematic","perPage":5}}' \
  | jq '.result.results[] | {pexelsId, src, width, height, duration, fps, quality}'
```

Each result includes the best-quality `video_file` link picked automatically (prefers `hd`, falls back to `sd`, then first available), plus `duration` in **seconds** (multiply by 1000 for `durationMs`), `fps`, and a `preview` thumbnail URL.

## Standard workflow: search → add

Because `editor.addImage` / `editor.addVideo` already accept any HTTP URL as `src`, adding a Pexels result is a straightforward two-step flow.

### Image

```bash
# 1. Search
RESULTS=$(curl -sX POST "$API/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d '{"type":"media.searchPexelsImages","params":{"query":"foggy forest morning","perPage":10}}')

# 2. Pick the src of your preferred result (index 0 = top hit)
SRC=$(echo "$RESULTS" | jq -r '.result.results[0].src')
W=$(echo "$RESULTS" | jq -r '.result.results[0].width')
H=$(echo "$RESULTS" | jq -r '.result.results[0].height')

# 3. Add it to the timeline via the generic editor.addImage
curl -sX POST "$API/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d "{\"type\":\"editor.addImage\",\"params\":{\"src\":\"$SRC\",\"from\":0,\"durationMs\":5000,\"width\":$W,\"height\":$H}}"
```

### Video

```bash
# 1. Search
RESULTS=$(curl -sX POST "$API/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d '{"type":"media.searchPexelsVideos","params":{"query":"cinematic sunrise mountains drone","perPage":5}}')

# 2. Pick the src + auto-derived metadata
SRC=$(echo "$RESULTS" | jq -r '.result.results[0].src')
W=$(echo "$RESULTS" | jq -r '.result.results[0].width')
H=$(echo "$RESULTS" | jq -r '.result.results[0].height')
# Pexels reports duration in seconds — convert to ms
DUR_MS=$(echo "$RESULTS" | jq -r '.result.results[0].duration * 1000 | floor')

# 3. Add it to the timeline via the generic editor.addVideo
curl -sX POST "$API/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d "{\"type\":\"editor.addVideo\",\"params\":{\"src\":\"$SRC\",\"from\":0,\"durationMs\":$DUR_MS,\"width\":$W,\"height\":$H}}"
```

> The result payload includes `photographer` + `photographer_url` — surface these to the user when attribution is relevant. Pexels media is free to use, but attribution is appreciated.

## When to use which

| Need | Command |
|---|---|
| Curated stock photos/videos, real content, no cost | `media.searchPexels*` here → `editor.addImage`/`editor.addVideo` |
| AI-generated novel images (no source available) | `ai-media` → `/api/bridge/ai/image/generate` (Gemini) |
| Broad web image search (any site) | `ai-media` → `/api/bridge/ai/image/search` (Tavily) |

## Canvas placement — position + size on the canvas

`editor.addImage` and `editor.addVideo` accept **`x`**, **`y`**, **`width`**, **`height`** at creation time. `x`/`y` are canvas pixel coordinates (top-left origin). To place things precisely, you almost always want to first look up the canvas size:

```bash
CANVAS=$(curl -sX POST "$API/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d '{"type":"query.getCanvasSize","params":{}}')
CW=$(echo "$CANVAS" | jq -r '.result.width')   # e.g. 1080
CH=$(echo "$CANVAS" | jq -r '.result.height')  # e.g. 1920
```

### Corner / edge presets — math you actually use

For an item of size `IW×IH` with a `P`-pixel padding on a canvas of `CW×CH`:

| Placement | `x` | `y` |
|---|---|---|
| Top-left | `P` | `P` |
| Top-right | `CW - IW - P` | `P` |
| Top-center | `(CW - IW) / 2` | `P` |
| Center | `(CW - IW) / 2` | `(CH - IH) / 2` |
| Bottom-left | `P` | `CH - IH - P` |
| Bottom-right | `CW - IW - P` | `CH - IH - P` |
| Bottom-center | `(CW - IW) / 2` | `CH - IH - P` |

Example — drop an AI-generated logo in the top-right of a 1080×1920 canvas at 300×300 with 40px padding:

```bash
GEN=$(curl -sX POST "$API/api/bridge/ai/image/generate" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d '{"prompt":"minimal geometric pastel logo","aspect":"1:1","style":"minimalist"}')
IMG=$(echo "$GEN" | jq -r '.azure_url // .imageUrl')

curl -sX POST "$API/api/execute" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d "{\"type\":\"editor.addImage\",\"params\":{\"src\":\"$IMG\",\"from\":0,\"durationMs\":5000,\"x\":740,\"y\":40,\"width\":300,\"height\":300}}"
# x = 1080 - 300 - 40 = 740, y = 40 → top-right corner
```

### Post-hoc: move or resize an existing item

Two commands operate on an already-added item — use these when you want to shift/resize after creation (or without doing the math up front):

- **`editor.positionItem`** — set any of `{x, y, width, height}` explicitly:

  ```bash
  curl -sX POST "$API/api/execute" -H "Authorization: ******" -H "Content-Type: application/json" \
    -d '{"type":"editor.positionItem","params":{"itemId":"<id>","x":40,"y":1580,"width":200,"height":200}}'
  ```

- **`editor.alignItem`** — snap to a preset (canvas math done for you):

  | `align` value | Effect |
  |---|---|
  | `center` | Both centered |
  | `centerH` / `centerV` | Center horizontally / vertically only |
  | `left` / `right` | Snap to left/right edge (`x = 0` / `x = CW - IW`) |
  | `top` / `bottom` | Snap to top/bottom edge (`y = 0` / `y = CH - IH`) |

  ```bash
  curl -sX POST "$API/api/execute" -H "Authorization: ******" -H "Content-Type: application/json" \
    -d '{"type":"editor.alignItem","params":{"itemId":"<id>","align":"center"}}'
  ```

  For corners (top-right, bottom-left, etc.), chain two calls (e.g. `right` + `top`) — the align command sets one axis at a time when you use `left`/`right`/`top`/`bottom`.

### Rotation, z-order, opacity — supporting commands

- `editor.rotateItem` — `{ itemId, angle }` (degrees)
- `editor.setZIndex` — `{ itemId, direction: 'front' | 'back' | 'forward' | 'backward' }`
- `editor.setOpacity` — `{ itemId, opacity }` (0–100)
- `editor.editItem` — general fallback: `{ itemId, updates: { details: { … } } }` for anything above (`left`, `top`, `width`, `height`, `opacity`, `borderRadius`, `boxShadow`, etc.)

## Cross-references

- `ai-media/SKILL` — Gemini image generation, GPT-4o vision analysis, Tavily search
- `contentlead/images.md` — `editor.addImage` command surface
- `contentlead/video.md` — `editor.addVideo` command surface
- `contentlead/track-management.md` — smart track reuse (inherited by `editor.addImage`/`editor.addVideo`)
