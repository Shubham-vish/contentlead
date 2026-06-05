---
name: media-and-audio
description: Adding images, video, audio to timeline. Volume, speed, opacity, and media replacement.
tags: image, video, audio, music, volume, speed, playback, opacity, b-roll, replace
---

# Media and Audio

Use these commands to place images, video clips, and audio on the timeline, then adjust playback and presentation.

## Smart Track Management

All add commands (`editor.addText`, `editor.addImage`, `editor.addVideo`, `editor.addCaption`) support **smart track reuse**. Instead of creating a new track for every item, the executor:

1. Checks for existing agent-created tracks of the same type
2. Finds one with no time overlap for the new item
3. Merges the item into that track if found, or creates a new one

This keeps the timeline clean — non-overlapping items share tracks.

### ⚠️ CRITICAL: Always pass `from` and `to` (or `from_ms`/`duration_ms`) in add commands

**Track reuse ONLY works when items have correct time positions at creation.** If you omit `from`/`to`, items default to time 0 — every item overlaps at 0, forcing a new track each time.

**BAD** (creates 7 tracks for 7 non-overlapping items):
```python
# Don't do this — all items land at time 0, then get moved
for slide in slides:
    addImage(src=slide.img)           # lands at 0-5s → overlap!
    moveItem(itemId, from=slide.from) # track already created
```

**GOOD** (creates 1 track for 7 non-overlapping items):
```python
# Pass from/to at creation — track reuse kicks in
for slide in slides:
    addImage(src=slide.img, from=slide.from, to=slide.to)  # correct time → reuses track
```

Real-world result: **19 tracks → 7 tracks** just by passing `from`/`to`.

### Track control params for all add commands

| Param | Type | Description |
|---|---|---|
| `from` / `from_ms` | `number` | Timeline start time in ms — **always provide this** |
| `to` | `number` | Timeline end time in ms (alternative to `duration_ms`) |
| `duration_ms` | `number` | Duration in ms (from + duration_ms = to) |
| `trackId` | `string` | Force a specific track ID (must exist, correct type) |

**Scene tracks** (`scene.addLibraryScene`, `scene.addCustomScene`) also reuse existing template tracks when time ranges don't overlap. Tagged with both `isAgentTrack` and `isTemplateTrack`.

> Tracks created by the agent are tagged with `metadata.isAgentTrack = true`.
> Only agent-created tracks are candidates for reuse — user-created tracks are never touched.

### Track naming

Use `editor.renameTrack` to label tracks for clarity:
```json
{"type": "editor.renameTrack", "params": {"trackId": "abc123", "name": "🎵 Music - Gravitational Forces"}}
```
This makes tracks identifiable in the timeline UI (e.g., `🖼 Backgrounds`, `📝 Text Overlays`, `🔊 SFX - Ding`).

## ⚠️ CRITICAL: Track Z-Order (Layer Visibility)

**In video editors, top track (Track 0) = front layer.** This means:
- Text/caption tracks MUST be ABOVE (lower index than) scene/image tracks
- If text is below scene tracks, the background covers the text — it becomes invisible

**Always call `editor.reorderTracks` after building a video.** It sorts tracks by layer priority:
1. Text/Caption tracks (top — most visible)
2. Audio tracks
3. Video tracks
4. Regular image tracks
5. Template/scene tracks (bottom — background layer)

---

## Style Guide Defaults

All text and caption commands now default to the project's cinematic style guide:

- **Font**: Montserrat (weight 800 for headings, 400 for body)
- **Colors**: White `#FFFFFF` headings, `#D0D0D0` body, purple glow shadow
- **Sizes**: Headline 96px, Title 80px, Subtitle 52px, Body 36px, Label 24px, Caption 64px
- **Effects**: Purple text shadow `0 4px 30px rgba(138, 43, 226, 0.6)` for headings

Use `params.role` to select a text style: `'headline'`, `'title'`, `'subtitle'`, `'body'`, `'label'`, `'caption'`.
If not provided, role is auto-inferred from text length (≤3 words → title, ≤8 → subtitle, else body).

All defaults can be overridden by explicit params.

---

## `editor.addImage`

Add an image item. Uses the `ADD_ITEMS` dispatch pattern internally. Reuses existing agent image tracks when possible.

| Param | Type | Default | Description |
|---|---|---|---|
| `url` or `src` | `string` | required | Source image URL or base64 data URL |
| `from_ms` or `from` | `number` | `0` | Timeline start time |
| `duration_ms` or `duration` | `number` | `5000` | Timeline duration |
| `width` | `number` | source size or auto | Display width |
| `height` | `number` | source size or auto | Display height |
| `x` | `number` | auto | Canvas X position |
| `y` | `number` | auto | Canvas Y position |
| `opacity` | `number` | `100` | Opacity from `0` to `100` (100 = fully opaque) |
| `trackId` | `string` | auto | Specific track to place item in |

> **Local files**: Images can be loaded as base64 data URLs (`data:image/jpeg;base64,...`).
> The `resolveMediaSrc` helper auto-converts local file paths and `/api/local-file` URLs.
> Data URLs work reliably for images (but NOT for videos — see `editor.addVideo`).

> ⚠️ **Repositioning after creation**: The `x`, `y`, `width`, `height` params set the
> initial position at creation time. To **move or resize later**, use
> **`editor.positionItem`** (see `canvas-and-positioning` skill) — NOT `editor.editItem`.
> `editor.editItem` with `display.x`/`display.y` updates timeline metadata only and
> does NOT change the visual position on the canvas. The renderer reads `details.top`
> and `details.left` (CSS values), which only `positionItem` updates correctly.

Example:

```json
{
  "type": "editor.addImage",
  "params": {
    "url": "https://example.com/cover.jpg",
    "from_ms": 0,
    "duration_ms": 5000,
    "width": 1080,
    "height": 1920,
    "x": 0,
    "y": 0,
    "opacity": 100
  }
}
```

## `editor.addVideo`

Add a video clip.

| Param | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | required | Source video URL |
| `from_ms` | `number` | `0` | Timeline start time |
| `duration_ms` | `number` | editor default | Timeline duration |
| `width` | `number` | `1920` | Video width in pixels |
| `height` | `number` | `1080` | Video height in pixels |
| `duration` | `number` | auto-detected | Video duration in **ms** (see ⚠️ below) |
| `volume` | `number` | `100` | Clip audio level from `0` to `100` (100 = full volume) |
| `trim_start` | `number` | `0` | Source trim start in milliseconds |
| `trim_end` | `number` | source end | Source trim end in milliseconds |

> ⚠️ **CRITICAL — Pre-provide video metadata to avoid failures**
>
> The internal state reducer creates a hidden `<video>` element to detect `duration`, `width`, and `height`.
> This **fails** for localhost URLs, data URLs, blob URLs, CORS-restricted URLs, and many non-public URLs.
> When it fails, the item silently never appears in the timeline.
>
> **Always provide `width`, `height`, AND `duration` (ms)** in params. When all three are present,
> the reducer skips the internal video element load entirely and the item is added reliably.
>
> Use `ffprobe` or equivalent to extract metadata before calling this command:
> ```bash
> ffprobe -v quiet -print_format json -show_streams video.mp4
> # → width, height, duration (convert seconds → ms)
> ```

Example:

```json
{
  "type": "editor.addVideo",
  "params": {
    "url": "https://example.com/broll.mp4",
    "from_ms": 3000,
    "width": 1920,
    "height": 1080,
    "duration": 4500,
    "volume": 20,
    "trim_start": 1000,
    "trim_end": 5500
  }
}
```

## `editor.addAudio`

Add an audio clip.

| Param | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | required | Source audio URL |
| `from_ms` | `number` | `0` | Timeline start time |
| `duration_ms` | `number` | source length or editor default | Timeline duration |
| `volume` | `number` | `100` | Audio level from `0` to `100` (100 = full volume) |

Example:

```json
{
  "type": "editor.addAudio",
  "params": {
    "url": "https://example.com/music.mp3",
    "from_ms": 0,
    "duration_ms": 30000,
    "volume": 35
  }
}
```

## `editor.replaceMedia`

Swap the source media while keeping the existing item's placement and styling.

| Param | Type | Default | Description |
|---|---|---|---|
| `item_id` | `string` | required | Existing image, video, or audio item |
| `url` | `string` | required | New media URL |

Example:

```json
{
  "type": "editor.replaceMedia",
  "params": {
    "item_id": "image_01",
    "url": "https://example.com/replacement.jpg"
  }
}
```

## `editor.setVolume`

Adjust an audio or video item's volume.

| Param | Type | Default | Description |
|---|---|---|---|
| `item_id` | `string` | required | Audio-capable item |
| `volume` | `number` | required | Value from `0` to `100` (100 = full volume) |

Example:

```json
{
  "type": "editor.setVolume",
  "params": {
    "item_id": "audio_music",
    "volume": 22
  }
}
```

## `editor.setPlaybackRate`

Change playback speed.

| Param | Type | Default | Description |
|---|---|---|---|
| `item_id` | `string` | required | Video or audio item |
| `rate` | `number` | `1` | Value from `0.25` to `4` |

Example:

```json
{
  "type": "editor.setPlaybackRate",
  "params": {
    "item_id": "video_broll",
    "rate": 1.5
  }
}
```

## `editor.setOpacity`

Adjust transparency.

| Param | Type | Default | Description |
|---|---|---|---|
| `item_id` | `string` | required | Image or video item |
| `opacity` | `number` | required | Value from `0` to `100` (100 = fully opaque) |

Example:

```json
{
  "type": "editor.setOpacity",
  "params": {
    "item_id": "image_overlay",
    "opacity": 60
  }
}
```

---

## ⚠️ Audio Constraints & Volume Guidelines

### Html5Audio tag limit

The browser can only mount **~5-6 Html5Audio tags simultaneously**. This is a hard browser limit — exceeding it causes silent playback failure (DOMException errors, no audio plays at all).

**Rule: Keep total audio items ≤ 5** (including music + all SFX).

**Audio track reuse**: Non-overlapping audio items auto-share tracks (like text/image). The `addAudioHandler` uses `ADD_ITEMS` dispatch with `findCompatibleTrack()`. 4 non-overlapping SFX → 1 track instead of 4.

**Audio duration/trim fix**: The handler uses `ADD_ITEMS` (not `ADD_AUDIO`) to control display and trim at creation time. `ADD_AUDIO` ignores `display.to` and overrides it with detected audio duration. `ADD_ITEMS` respects the exact values we pass. (`stateManager.updateState()` works fine for move/trim — the earlier canvas-blank issue was a race condition specific to calling it immediately after ADD_AUDIO.)

**API param normalization**: The API server normalizes `duration_ms` → `duration` (snake_case → camelCase) before params reach the handler. Handlers must check `params.duration` (not just `params.duration_ms`). Same for `from_ms` → `from`, `to_ms` → `to`.

| Setup | Audio items | Status |
|---|---|---|
| 1 music + 3 SFX | 4 | ✅ Safe |
| 1 music + 4 SFX | 5 | ✅ Safe (limit) |
| 1 music + 7 SFX | 8 | ❌ CRASHES — silent failure |

The limit is on **total items in timeline**, not items playing simultaneously. The browser pre-mounts ALL audio elements at once regardless of their time position.

### Volume scale: 0–100 and dB gain

Volume is on a **0 to 100** linear scale internally. The UI also shows a **dB fader** (−60 dB to 0 dB).

**Conversion**: `volume = 10^(dB/20) × 100` and `dB = 20 × log10(volume/100)`

| Volume | dB | Effect |
|---|---|---|
| `0` | −∞ | Muted |
| `1` | −40 dB | Nearly silent |
| `25-35` | −12 to −9 dB | Background music level |
| `50` | −6 dB | Half perceived loudness |
| `100` | 0 dB | Full volume (unity) |

#### `editor.setAudioGain` — Set gain in dB

Set audio volume using professional dB units. More intuitive than raw 0-100 for mixing.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemIds` | `string[]` | **required** | Audio item IDs |
| `gainDb` | `number` | **required** | Gain in dB. Range: −60 (near-silent) to 0 (unity). |

```json
{
  "type": "editor.setAudioGain",
  "params": {
    "itemIds": ["music_01"],
    "gainDb": -9
  }
}
```

#### `query.getAudioLoudness` — Get audio levels

Returns current volume, gain in dB, source info for each audio item.

```json
{
  "type": "query.getAudioLoudness",
  "params": { "itemIds": ["music_01", "sfx_01"] }
}
```

### ⚠️ MANDATORY: Analyze SFX with ffprobe Before Placing

**NEVER place SFX blindly.** Always analyze the actual audio file first:

```bash
# Get peak dB, mean dB, duration for an SFX file
ffprobe -v quiet -print_format json -show_format -show_streams \
  -f lavfi -i "amovie=/path/to/sfx.mp3,astats=metadata=1:reset=0" 2>&1 | \
  python3 -c "
import json,sys,subprocess
# Quick method: use ffmpeg volumedetect
r = subprocess.run(['ffmpeg','-i','/path/to/sfx.mp3','-af','volumedetect','-f','null','-'],
  capture_output=True, text=True)
for line in r.stderr.split('\n'):
    if 'max_volume' in line or 'mean_volume' in line:
        print(line.strip())
"
```

**What to check:**
| Metric | What It Tells You | Red Flag |
|---|---|---|
| Peak dB | Loudest moment | > −1 dB = near-clipping, needs low editor volume |
| Mean dB | Average loudness | > −10 dB = very loud source |
| Duration | Length of SFX | > 3s = probably music/sting, not SFX |
| Character | Listen/check waveform | Musical = wrong for impact/accent |

**Effective dB calculation:**
```
Editor volume 0-100 → dB gain: 20 × log10(volume/100)
Effective peak = source peak dB + editor gain dB
Target: SFX effective peak between −18 dB and −10 dB
Target: Music effective peak between −20 dB and −14 dB
```

### Volume range: 0–200+ (amplification supported)

Volume values **above 100 are valid** — they provide amplification/boost. The scale is:
- 0 = muted, 100 = unity (0 dB), 200 = +6 dB boost

### SFX volume by type (guidelines)

Different SFX types need different volumes to sound balanced:

| SFX Type | Recommended Vol | Character |
|---|---|---|
| Mouse click | 35–45 | Subtle, light accent |
| Chime / ding | 50–60 | Medium, melodic accent |
| Notification | 45–55 | Medium attention-getter |
| Bell | 55–65 | Strong, resonant |
| Whoosh / swoosh | 40–50 | Fast transition accent |
| Impact / hit | 50–60 | Dramatic emphasis |
| Pluck | 40–50 | Light melodic accent |
| Background music | 25–35 | Ambient, under everything |

### Image sizing for full-canvas backgrounds

When using images as full-canvas backgrounds:

1. **Generate at 16:9 aspect ratio** — but AI generators (Gemini) often produce 1024×1024 squares regardless
2. **Always resize to match canvas** before adding (e.g., 1920×1080 for landscape)
3. **Use JPEG, not PNG** — PNG base64 is 5-10× larger and chokes the renderer
4. **Keep total base64 under 2MB** — 7 JPEG backgrounds at ~150KB each = ~1MB (safe). 7 PNG backgrounds at ~2MB each = ~14MB (crashes)

```python
# Resize with Pillow (center-crop square to 16:9, then resize)
from PIL import Image
img = Image.open("bg.png")
w, h = img.size
new_h = int(w / (1920/1080))  # crop to 16:9
top = (h - new_h) // 2
img = img.crop((0, top, w, top + new_h))
img = img.resize((1920, 1080), Image.LANCZOS)
img.save("bg.jpg", "JPEG", quality=70)  # ~100-200KB vs 1-2MB PNG
```

## Audio Auto-Normalization (Playback-Time)

The editor includes an automatic audio normalization system (`useAudioNormalization` hook) that ensures consistent perceived loudness across all audio files at playback time.

### How It Works

1. **Measurement**: When an audio URL is first encountered, the hook fetches it via `fetch()`, decodes with Web Audio API's `decodeAudioData()`, and scans all channels for peak sample amplitude
2. **Correction gain**: `correctionGain = targetPeak (0.708 / -3dB) ÷ measuredPeak`
3. **Applied to volume**: `finalVolume = volumeLinear × normGain` — the correction multiplies with the user-set volume
4. **Caching**: Module-level `Map<string, number>` cache — each URL is measured once per session. A `pendingFetches` Map prevents duplicate concurrent fetches.
5. **Shared AudioContext**: Creates one AudioContext instance, reuses it for all measurements

### Safety Guards

| Guard | Value | Why |
|-------|-------|-----|
| Max correction | 4.0× (+12 dB) | Prevents amplifying near-silent/corrupt files to ear-splitting levels |
| Target peak | 0.708 (-3 dB) | Industry-standard headroom — no clipping |
| Loading fallback | 1.0× (no change) | While measuring, audio plays at normal volume — no pop or silence |
| Error fallback | 1.0× | If fetch/decode fails, audio plays unmodified |
| Muted skip | Only measures when volume > 0 | Saves resources for background videos with volume=0 |

### Where It's Applied

| Component | File | Integration |
|-----------|------|-------------|
| Audio player | `player/items/audio.tsx` | `normalizedVolume = volumeLinear * normGain` applied to `<RemotionAudio volume={...}>` |
| Video player | `player/items/video.tsx` | Same pattern in `BufferedVideo`, only when `volume > 0` |

### Relationship to File-Level Normalization

The **core-set SFX files** are also pre-normalized at the file level using `ffmpeg loudnorm` (I=-16, TP=-3dB). This gives:
- **File-level**: All SFX files within ~5 dB of each other (was 15 dB spread before normalization)
- **Playback-level**: Auto-normalization hook provides additional correction for any remaining differences and for user-uploaded files

Both layers work together — file normalization reduces the range, playback normalization catches the rest.

### Remotion Audio Tag Limit

⚠️ **CRITICAL**: Remotion's `<Player>` defaults to `numberOfSharedAudioTags={5}`. Videos with many SFX + music easily exceed this, causing the ENTIRE composition to crash (white screen + ⚠️ icon). The player is configured with `numberOfSharedAudioTags={32}` to handle SFX-heavy projects. If you see white screen errors, this is likely the cause.

---

## Media Validation & Health

### `editor.setAudioGain` — Additional Details

Use dB units when you want predictable mixing instead of raw 0-100 volume values.

| Param | Type | Default | Description |
|---|---|---|---|
| `gainDb` | `number` | required | Also accepts `gain_db` or `db`; clamped to `-60` through `0` |
| `itemIds` | `string[]` | optional | Audio item IDs to update |
| `itemId` | `string` | optional | Single audio item ID |
| `item_ids` | `string[]` | optional | Snake_case alias |

Updates **audio items only**. Non-audio or missing items are reported in `skipped`.

**Returns:** `{ gainDb, volumeLinear, updatedIds, skipped }`

```json
{
  "type": "editor.setAudioGain",
  "params": {
    "gain_db": -9,
    "item_ids": ["music_01", "sfx_01"]
  }
}
```

### `media.validate`

Check one media URL before adding it to the timeline.

| Param | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | required | Media URL or local path |
| `type` | `string` | auto-detect | Optional expected type: `image`, `video`, or `audio` |

**Returns:** `{ url, accessible, valid, issues, cors, contentType, contentLengthBytes, mediaType }`

```json
{
  "type": "media.validate",
  "params": {
    "url": "https://example.com/hero.mp4",
    "type": "video"
  }
}
```

### `media.prepare`

Run the same accessibility check across multiple URLs in one batch.

| Param | Type | Default | Description |
|---|---|---|---|
| `urls` | `string[]` | required | URLs or local paths to pre-check |

**Returns:** `{ prepared, failed, results }`

```json
{
  "type": "media.prepare",
  "params": {
    "urls": [
      "https://example.com/shot-1.jpg",
      "https://example.com/shot-2.jpg"
    ]
  }
}
```

### `media.status`

Scan the current project for broken, warning, or healthy media items.

| Param | Type | Default | Description |
|---|---|---|---|
| `types` | `string[]` | all media | Optional filter such as `["image", "video"]` |

**Returns:** `{ total, ok, errors, warnings, items, summary }`

```json
{
  "type": "media.status",
  "params": {
    "types": ["image", "audio"]
  }
}
```

### Text styling capabilities (textShadow, backgroundColor)

Text items support rich CSS styling that creates professional glow/neon effects:

| Param | Type | Example | Effect |
|---|---|---|---|
| `textShadow` | `string` | `"0 0 30px rgba(0,191,255,0.8), 0 0 60px rgba(0,191,255,0.5)"` | Multi-layer glow |
| `backgroundColor` | `string` | `"rgba(0,0,0,0.55)"` | Semi-transparent text backdrop |
| `letterSpacing` | `string` | `"3"` | Letter spacing in px |
| `fontWeight` | `string` | `"800"` | Bold weight |
| `fontFamily` | `string` | `"Montserrat"` | Font family |
| `WebkitTextStrokeColor` | `string` | `"#FFD700"` | Text outline color |
| `opacity` | `number` | `90` | Transparency (0-100 scale) |
| `border` | `string` | `"2px solid #fff"` | Border around text box |

**Professional glow text pattern** (from Kallaway/remotion style):
```json
{
  "textShadow": "0 0 30px rgba(0,191,255,0.8), 0 0 60px rgba(0,191,255,0.5), 0 0 90px rgba(0,191,255,0.3)",
  "backgroundColor": "rgba(0,0,0,0.55)",
  "fontFamily": "Montserrat",
  "fontWeight": "800",
  "letterSpacing": "3",
  "width": 1500
}
```

### Known editor API limitations

| Feature | Status | Workaround |
|---|---|---|
| `placement` (x, y positioning) | ❌ Doesn't work — returns empty `{}` | All items center by default. Use `editor.positionItem` or single combined text blocks. |
| `setAnimation` | ✅ FIXED — works in-session (see caveats below) | Use `animationIn`/`animationOut` params, dispatch in+out separately with 40ms delay. Animations do NOT persist through save/reload — re-apply after restore. |
| `addText`/`addImage` `fromMs` ignored | ✅ Fixed — pass `from`/`to` params | Works when using correct param names |
| Template scenes (end-card, etc.) | ❌ Fail with "not found" | Use library scenes or custom scenes instead |
| `ADD_AUDIO` ignores `display.to` | ✅ Fixed — handler uses `ADD_ITEMS` instead | Audio display/trim now set correctly at creation |
| `stateManager.updateState()` kills canvas | ✅ Resolved — was caused by conflicting with async ADD_AUDIO | `moveItem`/`trimItem` work fine. Issue was specific to calling updateState immediately after ADD_AUDIO dispatch (race with async audio load). |
| API normalizes `duration_ms` → `duration` | ✅ Handled — handlers check both param names | Use `from`/`to` when possible (bypass normalization) |
| Manual audio drag between tracks | ❌ Blocked in @designcombo/timeline (minified) | Programmatic track reuse via `findCompatibleTrack()` works. Manual drag not possible. |
| CDN audio URLs (cdn.designcombo.dev) | ❌ All return 404 | Use local files via media server: `http://127.0.0.1:$MEDIA_PORT/media?path=ABSOLUTE_PATH` (preferred) or `/api/local-file?path=PATH&token=TOKEN` (auto-healed on restart) |
| Stale audio URLs after app restart | ✅ Auto-healed | `rewriteMediaUrlPort()` converts both stale `/media` port and `/api/local-file` URLs to current media server port on editor load. No manual intervention needed. |

---

## Common Patterns / Recipes

### Add background music

```json
[
  {
    "type": "editor.addAudio",
    "params": {
      "url": "/Users/shubham/Downloads/music_track.mp3",
      "from_ms": 0,
      "duration_ms": 45000,
      "volume": 28
    }
  }
]
```

> **Note**: Local file paths are auto-resolved to media server URLs. Prefer local paths over CDN URLs (CDN URLs return 404).

### Add B-roll over a talking clip

```json
[
  {
    "type": "editor.addVideo",
    "params": {
      "url": "https://example.com/city-broll.mp4",
      "from_ms": 6000,
      "duration_ms": 3500,
      "volume": 0,
      "trim_start": 2000,
      "trim_end": 5500
    }
  },
  {
    "type": "editor.setOpacity",
    "params": {
      "item_id": "video_broll",
      "opacity": 95
    }
  }
]
```

### Picture-in-picture

```json
[
  {
    "type": "editor.addVideo",
    "params": {
      "url": "https://example.com/webcam.mp4",
      "from_ms": 0,
      "duration_ms": 12000,
      "volume": 100,
      "trim_start": 0,
      "trim_end": 12000
    }
  },
  {
    "type": "editor.setOpacity",
    "params": {
      "item_id": "video_webcam",
      "opacity": 98
    }
  }
]
```

### Audio ducking

```json
[
  {
    "type": "editor.setVolume",
    "params": {
      "item_id": "audio_music",
      "volume": 18
    }
  },
  {
    "type": "editor.setVolume",
    "params": {
      "item_id": "audio_voiceover",
      "volume": 100
    }
  }
]
```

### Replace a stock image but keep timing

```json
{
  "type": "editor.replaceMedia",
  "params": {
    "item_id": "image_stock_03",
    "url": "https://example.com/new-stock.jpg"
  }
}
```

---

## Local Media Loading (Desktop Only)

When running in SkillTown Desktop (Electron), you can load media from local disk.

### Images — use base64 data URLs

Convert local files to data URLs. This works reliably for images of any size.

```bash
# Convert image to data URL and add to timeline
BASE64=$(base64 -i /path/to/image.jpg)
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"editor.addImage\", \"params\": {\"src\": \"data:image/jpeg;base64,$BASE64\", \"from\": 0, \"duration\": 5000}}"
```

### Videos — pre-provide metadata + use HTTP URL

Videos **cannot** use data URLs (Chromium/Remotion can't seek them). Instead:

1. **Serve via HTTP** with range request support (e.g. Node.js server, or `/api/local-file?path=...&token=...`)
2. **Always pre-provide `width`, `height`, and `duration`** to skip internal video element load

```bash
# Get metadata first
ffprobe -v quiet -print_format json -show_streams /path/to/video.mp4
# Extract width, height, duration (seconds → ms)

# Add with metadata pre-provided
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"editor.addVideo","params":{"url":"http://127.0.0.1:9877/video.mp4","from":0,"width":1920,"height":1080,"duration":10000}}'
```

### Using `/api/local-file` endpoint

The Electron app serves local files via HTTP with CORS and range request support:

```
GET /api/local-file?path=/absolute/path/to/file.mp4&token=YOUR_TOKEN
```

- Supports `?token=` query param for auth (browser media elements can't send headers)
- Supports range requests (required for video seeking)
- Auto-detects MIME types

### Media source resolution (`resolveMediaSrc`)

The command executor automatically resolves media sources:
- **Local paths** (`/Users/.../file.jpg`) → data URL (images) or blob URL (videos) via IPC
- **`/api/local-file` URLs** → fetched and converted to blob URL
- **Localhost HTTP URLs** → fetched and converted to blob URL (for video/audio)
- **Regular HTTP/HTTPS URLs** → passed through as-is

---

## ⚠️ SFX Library: Curated Pack (PRIMARY — use these first)

The 12 curated SFX in `_Assets/sfx/curated-pack/` are the PRIMARY sound library. Use these BEFORE falling back to `remotion-ready/` or other folders.

### SFX-to-Context Mapping (from soundeffects pipeline)

**NEVER place SFX randomly at transitions.** Always match to content meaning:

| SFX Key | File | Use When | Frequency |
|---|---|---|---|
| `digital_readout` | `textdigitalreadout.wav` | Tech terms, stats, data reveals, numbers appearing | **8-10x per track** (signature sound, min 7s gap between uses) |
| `whoosh` | `whoosh_1.wav` | Topic transitions, scene changes, camera moves | 3-5x per track |
| `impact` | `impact_7.wav` | Dramatic moments, big reveals, punchlines | 1-3x per track (save for impact) |
| `air_hit` | `mixkit-air-in-a-hit-2161.wav` | Punchy intros, action verbs, first appearance | 2-4x per track |
| `camera_shutter` | `camera_shutter_5.wav` | Image reveals, screenshots, photo moments | 1-3x per track |
| `digital_shutter` | `mixkit-camera-digital-shutter-1432.wav` | Screen captures, code snapshots, UI reveals | 1-3x per track |
| `ding` | `correct_ding.wav` | Success moments, key points, achievements | 2-3x per track |
| `notification` | `mixkit-bike-notification-bell-590.wav` | Alerts, tool names, pings, attention | 2-3x per track |
| `riser` | `riser_3.wav` | Build-up before reveals, tension, anticipation | 1-2x per track |
| `keyboard` | `keyboard-button-click-06-c-fesliyanstudios.com_.wav` | Typing, code, writing, entering text | 1-3x per track |
| `mouse_click` | `mouse_click.wav` | Clicking, selecting UI, subtle emphasis | 2-4x per track |
| `double_click` | `mixkit-fast-double-click-on-mouse-275.wav` | Section starts, new topics, button presses | 2-3x per track |

### SFX Gain Normalization Rules

**Standard pattern** (from soundeffects pipeline):
```
1. Peak normalize to 0 dBFS (bring peak to maximum)
2. Apply target gain:
   - Whoosh: 50% → -6 dB (louder, transition emphasis)
   - Everything else: 20% → -14 dB (subtle, non-distracting)
```

**In editor volume terms:**
- Whoosh/transitions: volume = 25-30
- Standard SFX: volume = 10-15
- Impact/dramatic: volume = 15-20

### SFX Spacing Rules

| Rule | Value | Why |
|---|---|---|
| **Min gap between ANY two SFX** | 1.5 seconds | Prevents cluttered audio |
| **Min gap between SAME SFX type** | 7 seconds | Prevents repetitive/annoying feel |
| **Max SFX per track** | 35-50 for full reel | ~1 every 2-3 seconds feels right |
| **Trim max duration** | 1 second per SFX | Prevents bleeding over transitions |
| **Total audio items in timeline** | ≤ 5 | Browser Html5Audio tag limit |

### SFX File Locations

| Library | Path | Quality | Use |
|---|---|---|---|
| **curated-pack** (PRIMARY) | `_Assets/sfx/curated-pack/` | ⭐⭐⭐ Production | Always use first |
| pack-ailead | `_Assets/sfx/pack-ailead/` | ⭐⭐⭐ Brand-curated | AI Lead brand SFX pack |
| pack-contentlead | `_Assets/sfx/pack-contentlead/` | ⭐⭐⭐ Brand-curated | Content Lead brand SFX pack |
| remotion-ready | `_Assets/sfx/remotion-ready/` | ⭐⭐ Generic | Fallback only |
| youtube-extracts | `_Assets/sfx/youtube-extracts/` | ⭐⭐⭐ Extracted from reels | For matching specific reel styles |
| use_with_caution | `_Assets/sfx/use_with_caution/` | ⭐⭐ Mixed | Browse when curated doesn't have what you need |
