---
name: rendering
description: Render videos locally using Remotion — start, monitor, cancel render jobs
tags: render, video, export, mp4, webm, gif, output, encode, ffmpeg, remotion, bundle, cancel, progress
---

# Video Rendering — Full Reference

## Overview

The desktop app includes a **local Remotion renderer** that runs as a child process. It bundles the remotion-workspace project, selects a composition, and renders it to video using ffmpeg + Chromium.

**Output directory:** `~/Movies/SkillTown/`

## Prerequisites

The render worker checks these at startup:
- **ffmpeg** — install via `brew install ffmpeg`
- **Chromium/Chrome** — Remotion auto-downloads via `ensureBrowser()` if needed

Check dependency status:
```bash
curl http://127.0.0.1:$PORT/api/render/capabilities -H "Authorization: Bearer $TOKEN"
```

---

## Render Types

### 1. Custom Scene Render (`renderType: "custom"`)

Renders a custom scene you created via the scene API.

```bash
curl -X POST http://127.0.0.1:$PORT/api/render \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "renderType": "custom",
    "data": {
      "sceneName": "split-screen",
      "props": {
        "leftUrl": "https://example.com/v1.mp4",
        "rightUrl": "https://example.com/v2.mp4",
        "durationInFrames": 300,
        "fps": 30,
        "width": 1920,
        "height": 1080
      }
    }
  }'
```

- `sceneName` — name of the scene (as created via `/api/scenes`)
- `props` — passed to the scene's React component
- Special props: `durationInFrames`, `fps`, `width`, `height` set composition metadata

### 2. Design Render (`renderType: "design"`)

Renders a DesignCombo IDesign JSON (the editor's native format).

**⚠️ Body shape — pass the design FLAT under `data` (NOT nested under `data.design`):**

```bash
curl -X POST http://127.0.0.1:$PORT/api/render \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "renderType": "design",
    "data": {
      "size": {"width": 1080, "height": 1920},
      "tracks": [...],
      "trackItemIds": [...],
      "trackItemsMap": {...},
      "fps": 30,
      "width": 1080,
      "height": 1920
    }
  }'
```

Get the design with `project.getFullState` and pass **`result.project.design` directly** as `data` — do NOT wrap it in `{design: ...}`. The validator rejects nested shapes with `wrong_data_shape` error.

**Correct one-liner:**
```bash
DESIGN=$(curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tabId":"'$TAB'","type":"project.getFullState","params":{}}' | jq -c '.result.project.design')
curl -X POST http://127.0.0.1:$PORT/api/render \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$(echo "$DESIGN" | jq -c '{renderType:"design", data:(. + {fps:30, width:.size.width, height:.size.height}), preset:"instagram_reel"}')"
```

### 3. Template Render (`renderType: "template"`)

Renders a template from the `@shubham-vish/remotion-templates` library.

```bash
curl -X POST http://127.0.0.1:$PORT/api/render \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "renderType": "template",
    "data": {
      "scenes": [...scene array from template system...],
      "metadata": { "duration": 30, "fps": 30 }
    }
  }'
```

---

## Render Options

All render types support these optional fields:

| Field | Default | Description |
|-------|---------|-------------|
| `codec` | `"h264"` | Output codec: `h264`, `h265`, `vp8`, `vp9`, `prores`, `gif` |
| `outputFormat` | `"mp4"` | Container: `mp4`, `webm`, `mkv` |
| `quality` | `80` | 0-100, affects CRF |
| `outputFileName` | auto-generated | Custom output filename |
| `contentId` | | Link render to a Content document (enables cloud upload) |
| `uploadToCloud` | `true` when `contentId` is set | Upload MP4 + auto-extracted frame-0 thumbnail to cloud, update `Content.videoUrl` / `Content.thumbnail` |

Example with options:
```bash
curl -X POST http://127.0.0.1:$PORT/api/render \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "renderType": "custom",
    "data": { "sceneName": "intro", "props": {"title": "Hello"} },
    "codec": "h264",
    "outputFormat": "mp4",
    "quality": 90
  }'
```

### Presets

Use `preset: "<name>"` to bundle resolution + codec + CRF + fps in one field. Override individual values via `options: {...}`.

| Preset | Width×Height | FPS | Codec | CRF | Approx Bitrate | Use case |
|--------|--------------|-----|-------|-----|----------------|----------|
| `preview` | 854×480 | 24 | h264 | 28 | ~1.5 Mbps | Quick preview |
| `draft` | 1280×720 | 30 | h264 | 23 | ~3 Mbps | Review |
| `final` | 1920×1080 | 30 | h264 | 18 | ~8 Mbps | 16:9 landscape final |
| **`instagram_reel`** | **1080×1920** | 30 | h264 High | 18 | ~8–10 Mbps | **Instagram Reels / YT Shorts / TikTok — default for vertical viral content** |
| `instagram_reel_hq` | 1080×1920 | **60** | h264 High | 16 | ~14 Mbps | High-motion reels (dance, sport, gaming) — smoother but ~2× render time |
| `4k` | 3840×2160 | 30 | h264 | 18 | ~40 Mbps | 4K master |

**Instagram Reels spec rationale:**
- IG target upload: 1080×1920 @ 30 fps, H.264 High profile, AAC 128 kbps stereo 48 kHz, ≤90 s
- IG re-encodes every upload; sending ~8–10 Mbps at CRF 18 minimizes IG's compression damage
- 60 fps only helps high-motion content — IG plays 30/60 at the same rate but 60 preserves detail during fast motion

Example — vertical reel render:
```bash
curl -X POST http://127.0.0.1:$PORT/api/render \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "renderType": "design",
    "data": { ...design flat under data... },
    "preset": "instagram_reel"
  }'
```

Override individual preset values:
```json
{ "preset": "instagram_reel", "options": { "crf": 16, "fps": 60 } }
```

---

## 🛑 MANDATORY: The First Frame Must Be a Usable Thumbnail

**Frame 0 doubles as your cover.** Both the auto-extracted content thumbnail (via `uploadToCloud`) AND the Instagram Reels default cover come from the video's first frame. If frame 0 is black/blank/single-color, the post's cover looks broken — and you **cannot change an already-published Instagram Reel's cover through the API**.

### Rules for scene authors

1. **Never let frame 0 render as pure background.** No opacity-0 fade-ins on the main title, no waiting for animations to kick in, no black-splash intro.
2. **Design intros so the primary text/subject is fully visible at frame 0.** Animate scale / translate / glow if you want motion, but keep `opacity: 1` from frame 0.
3. **If you must animate opacity from 0**, add a `skipReveal` / `posterMode` flag that skips the fade on first entry (only later swaps/transitions animate). Pattern below.
4. **If a hard-cut blackout opening is a deliberate creative choice** (rare — e.g. blackout before a beat drop), explicitly note the intent AND generate a separate thumbnail (Custom Thumbnails section below). Do NOT rely on `uploadToCloud`'s frame-0 extraction in that case.

### Poster-safe reveal pattern

```jsx
const revealLine = (frame, delayFrames, skipReveal) => {
  if (skipReveal) return {opacity: 1, translateY: 0, scale: 1};
  const f = Math.max(0, frame - delayFrames);
  const s = spring({frame: f, fps: 30, config: {damping: 14, mass: 0.7, stiffness: 170}});
  return {
    opacity: interpolate(f, [0, 8], [0, 1], {extrapolateRight: 'clamp'}),
    translateY: interpolate(s, [0, 1], [22, 0]),
    scale: interpolate(s, [0, 1], [0.92, 1]),
  };
};

const Title = ({tMs}) => {
  const showFirst = tMs < swapMs;
  const skipReveal = showFirst;  // first title = poster-safe, later swaps = animated
  // ...pass skipReveal to each line component
};
```

### Verify frame 0 BEFORE you render

Always seek to frame 0 and screenshot before calling `/api/render`. If the shot is blank/uninformative, fix the scene:
```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d '{"tabId":"...","type":"editor.seekToFrame","params":{"frame":0}}'
# then GET /api/screenshot?tabId=...  and inspect the result
```

---

## 🖼️ Custom Thumbnails (When Frame-0 Isn't Enough)

Two flows. Both upload to cloud and set `Content.thumbnail`. Use whichever suits the content — **don't over-engineer**. For most reels, a poster-safe frame 0 (above) is the right answer.

### Option A: Extract a better frame from the rendered MP4

Best for: reels where a mid-video moment (a swap frame, the peak beat) makes a better cover than frame 0.

```bash
# 1. Extract the frame you want (e.g. at 5s)
ffmpeg -y -ss 5 -i /Users/…/rendered.mp4 -vframes 1 -q:v 2 /tmp/cover.jpg

# 2. Get an upload URL for the thumbnail
UPLOAD=$(curl -sX POST "http://127.0.0.1:$PORT/api/bridge/content/upload-url" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d '{"contentId":"content_xxx","fileName":"cover.jpg","contentType":"image/jpeg"}')
UPLOAD_URL=$(echo "$UPLOAD" | jq -r '.uploadUrl')
SAS_URL=$(echo "$UPLOAD" | jq -r '.downloadableSasUrl // .videoUrl')

# 3. PUT the bytes to uploadUrl
curl -X PUT "$UPLOAD_URL" \
  -H "x-ms-blob-type: BlockBlob" -H "Content-Type: image/jpeg" \
  --data-binary @/tmp/cover.jpg

# 4. Update Content.thumbnail
curl -X PUT "http://127.0.0.1:$PORT/api/bridge/content/content_xxx" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d '{"thumbnail":"'"$SAS_URL"'"}'
```

### Option B: AI-generate a thumbnail → upload

Best for: hero-shot covers where no single video frame stands alone. Uses the `cl-ai-media` skill's image generation bridge.

**Response shape from `POST /api/bridge/ai/image/generate`:**

```json
{
  "status": "success",
  "operation": "generate",
  "prompt": "...",
  "provider": "gemini",
  "azure_url": "https://<storage>.blob.core.windows.net/.../image.png?<sas>",
  "request_id": "...",
  "operation_id": "..."
}
```

**⚠️ Read the URL from `azure_url` — NOT `image_url` or `url`.** Those fields do not exist in the response. Verified live: Gemini provider returns a real 1024×1024 PNG at `azure_url` with a pre-signed SAS token (directly downloadable, no auth needed).

```bash
# 1. Generate (Gemini)
RESP=$(curl -sX POST "http://127.0.0.1:$PORT/api/bridge/ai/image/generate" \
  -H "Authorization: ******" -H "Content-Type: application/json" \
  -d '{"prompt":"Portrait 1080x1920 cinematic cover: bold red glowing SOUND EFFECT? text, deep black background, single white audio waveform pill, minimalist","operation":"generate","provider":"gemini"}')

IMG_URL=$(echo "$RESP" | jq -r '.azure_url')
STATUS=$(echo "$RESP" | jq -r '.status')

# 2. Verify — bridge can occasionally return nulls / non-success
if [ "$STATUS" != "success" ] || [ -z "$IMG_URL" ] || [ "$IMG_URL" = "null" ]; then
  echo "AI gen failed — fall back to Option A. Full response:"
  echo "$RESP" | jq .
  exit 1
fi

# 3. Download the generated image (azure_url is a pre-signed SAS URL, no auth needed)
curl -sL "$IMG_URL" -o /tmp/ai_cover.png

# 4. Upload to your Content's blob via SAS (same steps 2-4 as Option A above,
#    but note the file is PNG not JPEG — adjust contentType + extension)
```

**⚠️ The image-generation bridge occasionally returns nulls or a non-success status** (all fields empty, no error surfaced). Always check `status == "success"` AND that `azure_url` is a non-null string before proceeding. If it fails, retry once or fall back to Option A. If you see other field names in the response (e.g. `image_url`, `url`), the bridge shape has changed — dump the full response and update this doc.

### Decision table

| Case | Approach |
|------|----------|
| Scene has a strong opening (title visible, subject centered) | Do nothing — rely on `uploadToCloud`'s frame-0 auto-extract |
| Scene needs a delayed reveal (fade-in, buildup) | **Fix the scene** with `skipReveal` — cheapest fix |
| Best cover frame is mid-video, not frame 0 | Option A — ffmpeg extract + SAS upload |
| Want a completely bespoke cover unrelated to any video frame | Option B — AI generate + SAS upload |
| Instagram Reel already published with bad cover | **Cannot fix via API.** User must edit cover manually in the IG app OR delete + republish (CTA auto-syncs to the new `media_id`) |

---

## Job Management

### Start a Render

```bash
curl -X POST http://127.0.0.1:$PORT/api/render \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

**Response:**
```json
{
  "success": true,
  "jobId": "render_1234567890_abc123",
  "status": "rendering",
  "message": "Render job started"
}
```

### Check Job Status

```bash
curl http://127.0.0.1:$PORT/api/render/JOBID \
  -H "Authorization: Bearer $TOKEN"
```

**Response (in progress):**
```json
{
  "jobId": "render_...",
  "status": "rendering",
  "progress": 0.45,
  "startedAt": "2024-01-15T10:30:00Z"
}
```

**Response (completed):**
```json
{
  "jobId": "render_...",
  "status": "completed",
  "progress": 1,
  "outputPath": "/Users/shubham/Movies/SkillTown/render_1234567890_abc123.mp4",
  "startedAt": "...",
  "completedAt": "..."
}
```

### List All Jobs

```bash
curl http://127.0.0.1:$PORT/api/render/jobs \
  -H "Authorization: Bearer $TOKEN"
```

### Cancel a Render

```bash
curl -X POST http://127.0.0.1:$PORT/api/render/JOBID/cancel \
  -H "Authorization: Bearer $TOKEN"
```

---

## Job Statuses

| Status | Description |
|--------|-------------|
| `queued` | Job accepted, waiting for worker |
| `bundling` | Creating Remotion bundle (first time is slow ~30s, cached afterward) |
| `rendering` | Encoding frames to video |
| `completed` | Done — `outputPath` has the file |
| `failed` | Error occurred — check `error` field |
| `cancelled` | User cancelled via `POST /api/render/:jobId/cancel` |

---

## Architecture Details

```
API request → render-service.cjs (job manager)
  → render-worker.cjs (child process, fork())
    → @remotion/bundler: bundle() — creates webpack bundle
    → @remotion/renderer: selectComposition() — validates comp exists
    → @remotion/renderer: renderMedia() — frame-by-frame render
    → Output to ~/Movies/SkillTown/
```

Key properties:
- **Child process isolation** — render crashes don't affect the main app
- **4GB memory limit** — `NODE_OPTIONS=--max-old-space-size=4096`
- **Bundle caching** — after first bundle, subsequent renders reuse cached bundle
- **One render at a time** — queue system processes jobs sequentially
- **Job persistence** — jobs saved to `~/.skilltown-desktop/render-jobs.json`

---

## Workflow: Custom Scene → Render

Complete example creating and rendering a custom scene:

```bash
# 1. Read API discovery
API=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo $API | jq -r '.port')
TOKEN=$(echo $API | jq -r '.token')

# 2. Create a scene
curl -X POST http://127.0.0.1:$PORT/api/scenes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "title-card",
    "code": "import React from \"react\";\nimport { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from \"remotion\";\n\nconst TitleCard: React.FC<{title: string; subtitle?: string}> = ({title, subtitle}) => {\n  const frame = useCurrentFrame();\n  const {fps} = useVideoConfig();\n  const scale = spring({frame, fps, config: {damping: 12}});\n  return (\n    <AbsoluteFill style={{backgroundColor: \"#0f0f23\", justifyContent: \"center\", alignItems: \"center\"}}>\n      <div style={{transform: `scale(${scale})`, textAlign: \"center\"}}>\n        <h1 style={{color: \"#fff\", fontSize: 80, margin: 0}}>{title}</h1>\n        {subtitle && <p style={{color: \"#888\", fontSize: 36}}>{subtitle}</p>}\n      </div>\n    </AbsoluteFill>\n  );\n};\n\nexport default TitleCard;"
  }'

# 3. Render it
curl -X POST http://127.0.0.1:$PORT/api/render \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "renderType": "custom",
    "data": {
      "sceneName": "title-card",
      "props": {
        "title": "My Video",
        "subtitle": "Chapter 1",
        "durationInFrames": 90,
        "fps": 30,
        "width": 1920,
        "height": 1080
      }
    },
    "codec": "h264"
  }'

# 4. Poll for completion
JOB_ID=<from step 3 response>
curl http://127.0.0.1:$PORT/api/render/$JOB_ID \
  -H "Authorization: Bearer $TOKEN"

# 5. Open the output
open ~/Movies/SkillTown/$JOB_ID.mp4
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "ffmpeg not found" | `brew install ffmpeg` |
| "Chromium not found" | Remotion downloads automatically on first render; or `npx remotion browser ensure` |
| Bundle takes very long | First bundle is ~30s; subsequent renders reuse cache |
| Render OOM | Reduce resolution or simplify scene; worker has 4GB limit |
| "Composition not found" | Check scene name matches — composition ID is `Custom_<name>` |
| Job stuck in "rendering" | Cancel and restart; check worker logs in terminal |
