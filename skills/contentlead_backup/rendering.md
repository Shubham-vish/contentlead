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

```bash
curl -X POST http://127.0.0.1:$PORT/api/render \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "renderType": "design",
    "data": {
      "design": { ...IDesign JSON... },
      "fps": 30,
      "width": 1920,
      "height": 1080
    }
  }'
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
