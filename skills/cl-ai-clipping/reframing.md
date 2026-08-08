---
name: reframing
description: Vertical reframing strategies for converting landscape video to 9:16 portrait. Covers static center crop (v1) and future face-tracked dynamic crop (v2).
tags: reframe, crop, vertical, portrait, 9:16, face-detection, opencv, center-crop
---

# Vertical Reframing — Landscape to 9:16

> Convert any landscape (16:9) video to portrait (9:16) for TikTok, Reels, and Shorts.

## v1: Static Center Crop (Available Now)

The simplest approach — crop a vertical strip from the center of each frame. Works well for:
- Talking-head videos (speaker roughly centered)
- Podcasts with fixed camera angles
- Screen recordings with centered content
- Any content where the subject doesn't move much laterally

### How it works

```
┌────────────────────────────────────┐  1920×1080 source
│         ┌──────────┐               │
│         │          │               │
│         │  CENTER  │               │
│         │   CROP   │               │
│         │ 607×1080 │               │
│         │          │               │
│         └──────────┘               │
└────────────────────────────────────┘
          ↓
     ┌──────────┐  Scaled to 1080×1920
     │          │
     │          │
     │  9:16    │
     │  OUTPUT  │
     │          │
     │          │
     └──────────┘
```

### Crop calculations

**Formula:**
```
cropWidth  = sourceHeight × (9 / 16)
cropHeight = sourceHeight
cropX      = (sourceWidth - cropWidth) / 2    ← centered
cropY      = 0
```

Ensure `cropWidth` is divisible by 2 (video codec requirement).

**Common resolutions:**

| Source | cropWidth | cropX | cropHeight | cropY |
|--------|-----------|-------|------------|-------|
| 1920×1080 | 607 → 608 | 656 | 1080 | 0 |
| 2560×1440 | 810 | 875 | 1440 | 0 |
| 3840×2160 | 1215 → 1216 | 1312 | 2160 | 0 |
| 1280×720 | 405 → 406 | 437 | 720 | 0 |
| 1080×1080 (square) | 607 → 608 | 236 | 1080 | 0 |

### Editor commands

**⚠️ IMPORTANT: `cropItem` crops source pixels but does NOT auto-scale to fill the canvas.**
After cropping, you must also resize the item to fill the 1080×1920 canvas.

**Recommended approach — scale + position (no crop needed):**
```json
// Step 1: Set canvas to 9:16
{"type": "editor.resize", "params": {"width": 1080, "height": 1920}}

// Step 2: Add video at full source size
{"type": "editor.addVideo", "params": {
  "src": "/path/to/video.mp4",
  "from": 0, "width": 1920, "height": 1080, "duration": 65000
}}

// Step 3: Scale to fill canvas height and position X to show speaker
// Scale factor = 1920/1080 = 1.778
// Scaled: width=3413, height=1920
// Center crop: left = -(3413-1080)/2 = -1167
{"type": "editor.positionItem", "params": {
  "itemId": "<videoItemId>",
  "x": -1167, "y": 0, "width": 3413, "height": 1920
}}
```

**For speaker NOT centered**, adjust X position:
- Speaker on left: `"x": -900` (shift right to show left of frame)
- Speaker on right: `"x": -1400` (shift left to show right of frame)

**For jump-cut zoom effect**, alternate between 100% and 107%:
```json
// 100% fill (even clips)
{"type": "editor.positionItem", "params": {"itemId": "<id>", "x": -1050, "y": 0, "width": 3413, "height": 1920}}
// 107% zoom (odd clips)  
{"type": "editor.positionItem", "params": {"itemId": "<id>", "x": -1170, "y": -67, "width": 3652, "height": 2054}}
```

### Adjusting crop position

For videos where the speaker is NOT centered, shift the crop window:

```json
// Speaker is on the left third
{"type": "editor.cropItem", "params": {
  "itemId": "<videoItemId>",
  "crop": {"x": 100, "y": 0, "width": 608, "height": 1080}
}}

// Speaker is on the right third
{"type": "editor.cropItem", "params": {
  "itemId": "<videoItemId>",
  "crop": {"x": 1212, "y": 0, "width": 608, "height": 1080}
}}
```

### When center crop is NOT enough

| Scenario | Problem | Solution |
|---|---|---|
| Two speakers side by side | One gets cropped out | Split into 2 stacked views (top/bottom) or choose one speaker |
| Speaker walks around | Goes in/out of frame | Need face-tracked reframing (v2) |
| Presentation with slides | Content on edges gets cut | Use wider crop + scale down, or overlay slide as separate image |
| Multiple camera angles | Different speaker positions | Different crop per segment |

---

## v2: Face-Tracked Dynamic Crop (✅ Implemented)

Per-frame face detection that moves the crop window to follow the speaker.

### Architecture (actual — no Python/OpenCV)

```
Source Video → ffmpeg frame extraction (fps filter, system ffmpeg only)
                  ↓
            JPEG frames → base64 data URLs
                  ↓
            IPC to Electron renderer
                  ↓
            Chrome Shape Detection API (FaceDetector, GPU-accelerated)
                  ↓
            Per-frame bounding boxes [{x, y, width, height}]
                  ↓
            computeCropSegments() — groups by 15% movement threshold
                  ↓
            Segments [{startSec, endSec, faceCenterX, faceCenterY, avgFaceWidth, cropX}]
```

**Key files:**
- `electron/main/face-detect.cjs` — frame extraction + segment computation
- `electron/api-server/media-routes.cjs` → `handleFaceDetect` — API endpoint
- `electron/main/reframe-engine.cjs` — smoothing + keyframe generation

### ⚠️ CRITICAL: System ffmpeg required

Remotion's bundled ffmpeg is compiled with `--disable-filters` and **lacks the `fps` filter**.
The endpoint uses `platform.getFfmpegPath()` (system ffmpeg at `/opt/homebrew/bin/ffmpeg`).

### How to use

**Basic (whole video):**
```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/media/face-detect" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"path": "/path/to/video.mp4", "sampleRate": 1}'
```

**⚠️ Per-clip time range (RECOMMENDED for clipping):**
```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/media/face-detect" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "path": "/path/to/video.mp4",
    "startSec": 92.3,
    "endSec": 100.4,
    "sampleRate": 2,
    "perFrame": true
  }'
```

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `path` | string | required | Absolute path to video file |
| `sampleRate` | number | 1 | Frames per second to extract |
| `startSec` | number | 0 | Start of time range (uses ffmpeg `-ss` for fast seek) |
| `endSec` | number | duration | End of time range |
| `maxFrames` | number | 120 (full) / unlimited (ranged) | Hard cap on frames |
| `perFrame` | boolean | false | Include per-frame face bounding boxes in response |
| `targetRatio` | number | 9/16 | Target aspect ratio for crop calculations |

### ⚠️ Limitation: 120-frame cap on full-video detection

When NO time range is given, frames are capped at 120 (covering ~120s at 1fps).
For long videos (e.g., 600s podcast), clips beyond 120s get **zero face data**.

**ALWAYS use `startSec`/`endSec` for per-clip detection in clipping workflows.**
When a time range is given, the cap is lifted — all frames in the range are extracted.

### Response format

```json
{
  "filePath": "/tmp/video.mp4",
  "sourceWidth": 1920,
  "sourceHeight": 1080,
  "durationSec": 600.014,
  "durationMs": 600014,
  "framesAnalyzed": 16,
  "facesDetected": 16,
  "segmentCount": 1,
  "segments": [
    {
      "startSec": 92.3,
      "endSec": 100.8,
      "startMs": 92300,
      "endMs": 100800,
      "cropX": 641,
      "cropY": 0,
      "cropWidth": 607,
      "cropHeight": 1080,
      "faceCenterX": 945,
      "faceCenterY": 374,
      "avgFaceWidth": 234,
      "method": "face-tracked"
    }
  ],
  "dominantPosition": {"x": 945, "y": 540},
  "dominantCropX": 641,
  "cropWidth": 607,
  "cropHeight": 1080,
  "method": "face-tracked",
  "perFrameData": [
    {
      "timeSec": 92.3,
      "faces": [
        {"x": 833, "y": 264, "width": 240, "height": 240, "centerX": 953, "centerY": 384}
      ]
    }
  ]
}
```

### Detection backends

| Backend | Accuracy | Speed | Availability |
|---|---|---|---|
| Chrome Shape Detection API | ~95% | ~20-30 fps | Chromium 134+ (auto-enabled in Electron) |
| Skin-color heuristic | ~60-70% | ~50+ fps | Always available (fallback) |

### Using face data for positioning

**⚠️ Use `editor.editItem` NOT `editor.positionItem`** — positionItem says "success" but doesn't persist.

**Formula for 9:16 reframing from face position:**
```
canvas = 1080×1920
source = 1920×1080
baseScale = 1920/1080 = 1.778
zoom = 1.0 (standard) or 1.07 (punch-in)
totalScale = baseScale × zoom

width  = round(1920 × totalScale)
height = round(1080 × totalScale)
left   = -(faceCenterX × totalScale - 540)    // center face in canvas
left   = clamp(left, -(width-1080), 0)        // keep within bounds
top    = -(height-1920) / 2                    // center vertically
```

**Example — apply per-clip face-centered framing:**
```json
{"type": "editor.editItem", "params": {
  "itemId": "<videoItemId>",
  "details": {
    "width": 3413,
    "height": 1920,
    "left": "-1060px",
    "top": "0px"
  }
}}
```

### Using `avgFaceWidth` for smart zoom

`avgFaceWidth` tells you how big the face is in the source frame:
- **Close-up** (faceW > 300): face fills frame → standard zoom (1.0×)
- **Medium shot** (faceW 200-300): normal → alternate 1.0×/1.07× for jump cuts
- **Wide/two-shot** (faceW < 200): face is small → zoom in more (1.07-1.15×)

### Recommended clipping workflow

```
For each clip segment:
  1. POST /api/media/face-detect with startSec/endSec/perFrame
  2. Read faceCenterX, faceCenterY, avgFaceWidth from segment
  3. Choose zoom level based on avgFaceWidth + jump-cut alternation
  4. Compute left/top/width/height with formula above
  5. Apply with editor.editItem (NOT positionItem)
```

---

## Hybrid Approach: Scene-Based Crop (Available Now)

Use `POST /api/media/analyze` to get scene boundaries, then apply different static crops per scene:

```json
// 1. Analyze video for scene changes
// POST /api/media/analyze → scenes: [{start: 0, end: 45.2}, {start: 45.2, end: 120.5}, ...]

// 2. For each scene, determine speaker position
//    (use screenshot/frame extraction + your vision to check)

// 3. Apply different crops per segment using addVideoSegments
{"type": "editor.addVideoSegments", "params": {
  "url": "/path/to/video.mp4",
  "segments": [
    {"start": 0, "end": 45200, "label": "Speaker left"},
    {"start": 45200, "end": 120500, "label": "Speaker center"},
    {"start": 120500, "end": 180000, "label": "Speaker right"}
  ]
}}

// 4. Crop each segment differently
// Segment 1 (speaker left): cropX = 100
// Segment 2 (speaker center): cropX = 656
// Segment 3 (speaker right): cropX = 1212
```

This gives you 80% of the value of face tracking without any new infrastructure.

---

## v3: `reframe.apply` — One-Command Reframe (✅ NEW — Recommended)

**The proper way to reframe.** A single `/api/execute` command that handles everything:
face detection → layout analysis → auto-choose follow or split → apply.

### Why this exists

The old `POST /api/media/reframe` had a critical bug: keyframe `x` values are **ADDITIVE** to the item's `left` CSS property (`applied.left = baseLeft + keyframedX`). Setting `left=-1213px` AND keyframe `x=-1213` doubled the offset to `-2426px` — pushing the face off-screen.

`reframe.apply` fixes this by:
1. Setting `left` to center the **dominant face** (duration-weighted average)
2. Computing keyframe `x` as **offsets from that base** (0 = no pan)

### Quick Start

```bash
# Auto-detect layout (single speaker → follow, two speakers → split)
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "type": "reframe.apply",
    "params": {
      "itemId": "video_abc123",
      "layout": "auto"
    }
  }'
```

The source video path is auto-detected from the item's `src`. Canvas defaults to 1080×1920.

### Layout Modes

| Mode | When Used | What Happens |
|------|-----------|-------------|
| `"auto"` (default) | Always recommended | Analyzes per-frame face data. If >40% of frames have 2 side-by-side faces → split. Otherwise → follow. |
| `"follow"` | Force single-speaker | Scales video to fill canvas, centers on dominant face, adds panning keyframes |
| `"split"` | Force two-speaker | Stacks two copies vertically: right speaker → top half, left speaker → bottom half |

### Split Layout (Two Speakers)

```
Landscape source (1920×1080):           Portrait output (1080×1920):
┌──────────┬──────────┐                ┌──────────────┐
│ Speaker  │ Speaker  │                │  Speaker B   │ ← right side → top
│    A     │    B     │    ──────►     │  (960px)     │
│  (left)  │ (right)  │                ├──────────────┤
└──────────┴──────────┘                │  Speaker A   │ ← left side → bottom
                                       │  (960px)     │
                                       └──────────────┘
```

**How it works:**
1. Detects 2 faces in >40% of frames, separated by >25% of frame width
2. Computes average face position for left and right speakers
3. Modifies existing video item → top half (right speaker, cropped + scaled)
4. Adds a second video item → bottom half (left speaker, cropped + scaled)
5. Mutes the second item to avoid double audio

**Each half:** Scaled to fill 1080×960 (half of 1080×1920 canvas), with the face centered horizontally.

### Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `itemId` | string | **required** | Video track item to reframe |
| `path` | string | auto-detect | Source video file (extracted from item if omitted) |
| `layout` | string | `"auto"` | `"auto"`, `"follow"`, or `"split"` |
| `preset` | string | `"smooth"` | Smoothing preset for follow mode |
| `canvasWidth` | number | 1080 | Target canvas width |
| `canvasHeight` | number | 1920 | Target canvas height |
| `startSec` | number | — | Face detect time range start |
| `endSec` | number | — | Face detect time range end |
| `sampleRate` | number | 2 | Frames/sec to analyze |
| `staticOnly` | boolean | false | If true, only static positioning (no keyframes) |
| `fps` | number | 30 | Project frame rate |
| `options` | object | — | Override smoothing params |

### Response (Follow Mode)

```json
{
  "status": "success",
  "result": {
    "itemId": "video_abc123",
    "source": {"width": 1920, "height": 1080, "durationSec": 65},
    "canvas": {"width": 1080, "height": 1920},
    "scaling": {"baseScale": 1.778, "scaledWidth": 3413, "scaledHeight": 1920},
    "faceDetection": {
      "framesAnalyzed": 130,
      "facesDetected": 118,
      "segmentCount": 3,
      "dominantFaceCX": 986,
      "segments": [
        {"startSec": 0, "endSec": 25, "faceCenterX": 986},
        {"startSec": 25, "endSec": 40, "faceCenterX": 614},
        {"startSec": 40, "endSec": 65, "faceCenterX": 988}
      ]
    },
    "positioning": {
      "baseLeft": -1213,
      "method": "keyframed",
      "width": 3413,
      "height": 1920
    },
    "keyframes": {
      "applied": true,
      "count": 3,
      "keyframes": [
        {"frame": 0, "absoluteX": -1213, "offsetX": 0},
        {"frame": 750, "absoluteX": -551, "offsetX": 662},
        {"frame": 1200, "absoluteX": -1217, "offsetX": -4}
      ]
    }
  }
}
```

### Response (Split Mode)

```json
{
  "status": "success",
  "result": {
    "itemId": "video_abc123",
    "source": {"width": 1920, "height": 1080, "durationSec": 65},
    "canvas": {"width": 1080, "height": 1920},
    "layout": {
      "layout": "split",
      "topItem": {
        "itemId": "video_abc123",
        "speaker": "right",
        "faceCX": 1340,
        "position": {"left": -110, "top": 0, "width": 1707, "height": 960}
      },
      "bottomItem": {
        "itemId": "video_xyz789",
        "speaker": "left",
        "faceCX": 580,
        "position": {"left": -5, "top": 960, "width": 1707, "height": 960}
      },
      "scale": 0.889,
      "halfHeight": 960
    },
    "faceDetection": {
      "framesAnalyzed": 130,
      "facesDetected": 118,
      "faceLayout": {
        "isSplitCandidate": true,
        "twoFaceRatio": 0.78,
        "leftFaceCX": 580,
        "rightFaceCX": 1340
      }
    }
  }
}
```

### How the Math Works

**Follow mode:**
```
Canvas: 1080×1920 (9:16)    Source: 1920×1080 (16:9)

baseScale = canvasHeight / sourceHeight = 1920/1080 = 1.778
scaledWidth = 1920 × 1.778 = 3413px

dominantFaceCX = 986px (weighted average across segments)
baseLeft = -(986 × 1.778 - 540) = -1213px  ← centers dominant face

For each keyframe segment:
  absoluteX = -(segFaceCX × scale - canvasW/2)   ← where this face sits
  offsetX = absoluteX - baseLeft                  ← offset from dominant
  
Keyframe x = offsetX (additive to left, so total = baseLeft + offsetX = absoluteX ✓)
```

**Split mode:**
```
Canvas: 1080×1920 (9:16)    Source: 1920×1080 (16:9)
Each half: 1080×960

scale = halfHeight / sourceHeight = 960/1080 = 0.889
scaledW = 1920 × 0.889 = 1707px (wider than 1080 → crop sides)
scaledH = 1080 × 0.889 = 960px (fills half exactly)

For each speaker:
  left = -(faceCX × scale - canvasWidth/2)  ← centers face horizontally
  top = 0 (top half) or 960 (bottom half)
```

### AI Agent Workflow (Recommended)

```bash
# 1. Add video to timeline
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"type": "editor.addVideoSegments", "params": {
    "url": "/path/to/podcast.mp4",
    "segments": [{"start": 0, "end": 20, "label": "Intro"}]
  }}'

# 2. Reframe in one command (auto-detects single vs two speakers)
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"type": "reframe.apply", "params": {
    "itemId": "<itemId from step 1>",
    "startSec": 0,
    "endSec": 20
  }}'
# Done! Auto-detects layout and applies.
```

### For Static-Only (Short Clips)

For podcast clips ≤10s where the face barely moves, skip keyframes:

```json
{"type": "reframe.apply", "params": {
  "itemId": "video_abc",
  "staticOnly": true
}}
```

---

## v3-legacy: Dynamic Reframe HTTP Endpoints

> **⚠️ These endpoints have the additive-offset bug.** Use `reframe.apply` (above) instead.
> Kept for reference — keyframes from these endpoints set absolute `x` values that double-offset
> when the item also has a `left` position set.

**One-shot smooth reframing** — face detection + smoothing + keyframe animation in one API call. The video pans smoothly to follow the speaker's face.

### Quick Start (One Call)

```bash
# Full pipeline: detect faces → smooth → generate keyframes → optionally apply
curl -s -X POST "http://127.0.0.1:$PORT/api/media/reframe" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "path": "/path/to/video.mp4",
    "itemId": "video_abc123",
    "preset": "smooth",
    "apply": true,
    "canvasWidth": 1080,
    "canvasHeight": 1920,
    "fps": 30
  }'
```

When `apply: true` + `itemId` provided, keyframes are automatically applied to the video item's `x` property — the video pans within the vertical canvas.

### Response

```json
{
  "sourceWidth": 1920,
  "sourceHeight": 1080,
  "framesAnalyzed": 65,
  "facesDetected": 58,
  "faceSegments": [...],
  "keyframes": [
    {"frame": 0, "x": -888, "y": 0, "easing": "easeInOutCubic"},
    {"frame": 150, "x": -1421, "y": 0, "easing": "easeInOutCubic"},
    {"frame": 300, "x": -1065, "y": 0, "easing": "easeInOutCubic"}
  ],
  "commands": [
    {"type": "editor.addKeyframe", "params": {"trackItemId": "video_abc123", "property": "x", "frame": 0, "value": -888, "easing": "easeInOutCubic"}},
    ...
  ],
  "metadata": {
    "method": "face-tracked",
    "preset": "smooth",
    "keyframeCount": 3,
    "panRange": 533
  }
}
```

### Presets

```bash
# List all presets
curl -s "http://127.0.0.1:$PORT/api/media/reframe/presets" -H "Authorization: $TOKEN"
```

| Preset | Dead Zone | Min Hold | Max Speed | Best For |
|--------|-----------|----------|-----------|----------|
| `smooth` (default) | 8% | 1.5s | 30%/s | General talking-head, podcasts |
| `responsive` | 5% | 0.8s | 50%/s | Active movement, presentations |
| `locked` | 20% | 3s | 20%/s | Minimal movement, interviews |
| `cinematic` | 10% | 2s | 15%/s | Slow, dramatic pans |
| `vlogger` | 4% | 0.5s | 60%/s | Single face, tight follow |

### From Pre-Computed Segments (Skip Detection)

If you already ran face detection (e.g., cached), generate keyframes directly:

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/media/reframe/from-segments" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "segments": [
      {"startSec": 0, "endSec": 5, "faceCenterX": 803, "cropX": 500, "cropWidth": 607},
      {"startSec": 5, "endSec": 10, "faceCenterX": 1103, "cropX": 800, "cropWidth": 607}
    ],
    "sourceWidth": 1920,
    "sourceHeight": 1080,
    "itemId": "video_abc123",
    "apply": true,
    "preset": "cinematic"
  }'
```

### AI Agent Workflow (for AI Clipping)

```
1. POST /api/media/reframe {path, preset: "smooth"}
   → Get keyframes + face segments (don't apply yet)

2. POST /api/content/create → new clip project
3. Wait 10-12s for DB load
4. editor.resize → 1080×1920
5. editor.addVideo → place trimmed clip (get itemId)

6. POST /api/media/reframe/from-segments {
     segments: <from step 1, filtered to clip time range>,
     itemId: <from step 5>,
     apply: true,
     trimStartSec: <clip start time>
   }
   → Keyframes applied, video pans smoothly

7. editor.autoCaption → add captions
8. editor.save
```

### Smoothing Algorithm

The engine applies 4 passes to produce smooth, natural-looking pans:

1. **Dead zone filter** — movements < deadZonePercent of frame width are ignored (prevents jitter from slight head movement)
2. **Minimum hold** — stays at each position for minHoldSec before moving
3. **Speed limiter** — pans never exceed maxSpeedPercent of frame width per second
4. **Edge clamping** — crop window never goes beyond source frame boundaries (with edgePaddingPercent margin)

### Custom Options

Override any smoothing parameter:

```json
{
  "path": "/path/to/video.mp4",
  "options": {
    "deadZonePercent": 12,
    "minHoldSec": 2,
    "maxSpeedPercent": 25,
    "easing": "easeInOutSine",
    "edgePaddingPercent": 8
  }
}
```
