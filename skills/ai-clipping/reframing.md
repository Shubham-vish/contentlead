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

```json
// Step 1: Set canvas to 9:16
{"type": "editor.resize", "params": {"width": 1080, "height": 1920}}

// Step 2: Add video
{"type": "editor.addVideo", "params": {
  "src": "/path/to/video.mp4",
  "from": 0, "width": 1920, "height": 1080, "duration": 65000
}}

// Step 3: Crop to vertical (center)
{"type": "editor.cropItem", "params": {
  "itemId": "<videoItemId>",
  "crop": {"x": 656, "y": 0, "width": 608, "height": 1080}
}}
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

### How to use

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/media/face-detect" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"path": "/path/to/video.mp4", "sampleRate": 1}'
```

Returns `segments[]` — each segment has a different `cropX` based on where the speaker's face is detected. The endpoint:

1. Extracts 1 frame/second using ffmpeg
2. Runs face detection on each frame (Chrome Shape Detection API or skin-color fallback)
3. Groups consecutive frames with similar face positions into segments
4. Returns crop coordinates per segment

### Detection backends

| Backend | Accuracy | Speed | Availability |
|---|---|---|---|
| Chrome Shape Detection API | ~95% | ~20-30 fps | Chromium 134+ with experimental flag (auto-enabled) |
| Skin-color heuristic | ~60-70% | ~50+ fps | Always available (fallback) |

### Architecture

```
Source Video → Python Worker → OpenCV/MediaPipe → Face coordinates per frame
                                                        ↓
                                              Smooth crop trajectory
                                                        ↓
                                              FFmpeg re-encode with
                                              per-frame crop filter
                                                        ↓
                                              Reframed MP4 output
```

### Reference implementation

From `AI-Youtube-Shorts-Generator/shorts_generator/local/clipper.py`:

```python
# Key concepts:
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# Per frame:
gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))

# Pick largest face (usually the speaker)
x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
cx, cy = x + w // 2, y + h // 2

# Smooth tracking (prevent jitter)
smoothing = 0.15
new_cx = int(last_cx + (cx - last_cx) * smoothing)
new_cy = int(last_cy + (cy - last_cy) * smoothing)
```

### Integration in ContentLead — ✅ Implemented

The face detection runs entirely within Electron:

**Option A: Python sidecar** (not needed — kept for reference)
- Spawn a Python child process from Electron (same pattern as render-worker.cjs)
- Requires: `opencv-python` pip package (~50MB)
- Pro: Full OpenCV/MediaPipe access, proven approach
- Con: Needs Python bundled or available on system

**Option B: FFmpeg-only** (limited)
- FFmpeg has no built-in face detection filter
- `cropdetect` finds static crop boundaries (not faces)
- Not suitable for dynamic face tracking

**Option C: Browser-based (tfjs/mediapipe-js)**
- Run face detection in the Electron renderer via TensorFlow.js or MediaPipe JS
- Pro: No Python needed, runs in existing browser context
- Con: Slower, can't easily process video frames at scale

### Current recommendation

**`POST /api/media/face-detect` is live and ready to use.** The endpoint:

1. Extracts sample frames with ffmpeg (1/sec by default)
2. Sends frames to the Electron renderer for face detection
3. Chrome Shape Detection API runs GPU-accelerated face detection
4. Falls back to skin-color heuristic if Shape Detection is unavailable
5. Returns crop segments with per-segment face positions

For **single-speaker centered content**, the static center crop (`dominantCropX`) is still fine.
For **multi-speaker or moving content**, use the per-segment crops.

The agent can use `POST /api/media/analyze` with `detectScenes: true` alongside face detection to get both scene boundaries AND face positions for maximum accuracy.

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
