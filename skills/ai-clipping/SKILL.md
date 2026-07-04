---
name: ai-clipping
description: Extract viral short-form clips from long-form video. AI-powered transcript analysis, virality scoring, vertical reframing, and batch clip creation — all orchestrated through existing editor APIs.
tags: clipping, viral, shorts, reels, tiktok, transcript, highlights, reframe, vertical, 9:16, batch
---

# AI Clipping — Viral Clip Extraction

> Turn a 30-minute podcast into 5 viral TikTok/Reels clips — entirely through the editor API.

## How It Works

**You (the AI agent) ARE the intelligence layer.** No separate LLM API call needed. You read the transcript, score virality with your own reasoning, then use existing editor commands to create the clips.

```
Source Video → Transcribe → Score Virality → Extract Clips → Reframe 9:16 → Caption → Render
     ↓              ↓              ↓                ↓              ↓           ↓         ↓
  import       autoCaption    YOUR BRAIN      addVideo+trim    cropItem   autoCaption  render
```

## Prerequisites

- ContentLead Desktop running (follow `contentlead` startup protocol)
- Source video file accessible (in ~/Movies, ~/Downloads, ~/Desktop, ~/Documents, ~/Codes)
- Editor open with a project loaded

## Quick Reference — Commands Used

| Step | Command | Purpose |
|------|---------|---------|
| Import | `POST /api/media/import` | Import source video |
| Analyze | `POST /api/media/analyze` | Get duration, resolution, fps |
| Transcribe | `editor.autoCaption` | Get word-level transcript |
| Poll status | `query.getTranscriptionStatus` | Wait for transcription |
| Read transcript | `query.getTranscript` | Get timestamped words/segments |
| Create clip project | `POST /api/content/create` | New project per clip |
| Resize canvas | `editor.resize` | Set to 1080×1920 (9:16) |
| Add trimmed video | `editor.addVideo` | Place trimmed source clip |
| Crop to vertical | `editor.cropItem` | Center crop for 9:16 |
| Auto-caption clip | `editor.autoCaption` | Add captions to clip |
| Render | `POST /api/render` | Export final MP4 |
| Tab management | `GET /api/tabs`, `POST /api/tabs/activate` | Switch between projects |

---

## Phase 1: Analyze Source Video

### 1.1 Import and analyze the source video

```bash
# Import video file
curl -s -X POST "http://127.0.0.1:$PORT/api/media/import" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"filePath": "/Users/shubham/Movies/podcast-episode-42.mp4"}'
# → {mediaUrl, fileName, duration, ...}

# Get detailed metadata
curl -s -X POST "http://127.0.0.1:$PORT/api/media/analyze" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"filePath": "/Users/shubham/Movies/podcast-episode-42.mp4"}'
# → {duration, width, height, fps, codec, scenes[], loudness{}}
```

### 1.2 Transcribe the source video

You need a project with the source video loaded to run autoCaption:

```json
// Add the full source video to the current project
{"type": "editor.addVideo", "params": {
  "src": "/Users/shubham/Movies/podcast-episode-42.mp4",
  "from": 0,
  "width": 1920, "height": 1080,
  "duration": 1800000
}}

// Run auto-caption (triggers Whisper transcription)
{"type": "editor.autoCaption", "params": {"language": "en"}}
```

### 1.3 Poll for completion

```json
// Poll until transcription finishes
{"type": "query.getTranscriptionStatus", "params": {}}
// Wait for: isAnyProcessing: false, status: "completed", wordCount > 0
```

### 1.4 Read the transcript

```json
{"type": "query.getTranscript", "params": {}}
// → {words: [{word, start, end}, ...], text: "full transcript...", srt: "..."}
```

---

## Phase 2: Score Virality (YOUR BRAIN)

This is where you — the AI agent — apply your intelligence. No API call needed.

### 2.1 Content Type Detection

First, classify the content. Read the first ~3000 chars of transcript and determine:

```
Content Type: podcast | interview | tutorial | lecture | commentary | debate | vlog | other
Content Density: low (filler/chit-chat) | medium | high (dense info/stories)
```

This affects how you score — a high-density interview has different viral patterns than a casual vlog.

### 2.2 Virality Scoring Framework

Score each potential clip 0-100 using these 8 signals (ranked by impact):

| # | Signal | What to Look For | Weight |
|---|--------|-------------------|--------|
| 1 | **HOOK MOMENTS** | "The secret is...", "Nobody talks about...", "I was completely wrong about..." — statements creating immediate curiosity | Highest |
| 2 | **EMOTIONAL PEAKS** | Genuine surprise, laughter, anger, vulnerability, excitement; raw unscripted reactions | High |
| 3 | **OPINION BOMBS** | Strong, polarizing, or counter-intuitive statements that trigger agree/disagree | High |
| 4 | **REVELATION MOMENTS** | Surprising facts, stats, or confessions that reframe thinking | High |
| 5 | **CONFLICT/TENSION** | Disagreement, pushback, or confrontation | Medium |
| 6 | **QUOTABLE ONE-LINERS** | A sentence that works as a standalone quote card | Medium |
| 7 | **STORY PEAKS** | The climax or twist of an anecdote; the payoff moment | Medium |
| 8 | **PRACTICAL VALUE** | A concrete tip, hack, or insight viewers can immediately apply | Medium |

### 2.3 Clip Selection Rules

- **Duration sweet spot: 45–90 seconds**
  - Go shorter (20–44s) only for a perfect standalone one-liner
  - Go longer (91–180s) only when a story arc needs full context
- **Every clip must open with a strong HOOK** — a line that grabs attention within the first 3 seconds
- **Never cut mid-sentence or mid-thought** — each clip must feel complete and self-contained
- **Clips must not overlap significantly** (>50% overlap = drop the lower-scoring one)
- **Score on viral potential, not general quality** — boring but accurate ≠ viral

### 2.4 Output Format

For each clip, produce:

```json
{
  "title": "The One Thing Nobody Tells You About AI",
  "start_time": 423.5,
  "end_time": 489.2,
  "score": 87,
  "hook_sentence": "Here's what nobody in this industry will tell you publicly...",
  "virality_reason": "Opens with forbidden-knowledge hook, delivers a contrarian take with specific examples"
}
```

### 2.5 Chunking for Long Videos (>30 min)

For videos longer than 30 minutes, process in 20-minute chunks with 1-minute overlap:

```
Chunk 1: 0:00 – 20:00
Chunk 2: 19:00 – 39:00  (1 min overlap)
Chunk 3: 38:00 – 58:00
...
```

Score each chunk independently, then deduplicate across all chunks:
- Sort all highlights by score (highest first)
- For each highlight, check if it overlaps >50% with any already-kept highlight
- If yes, drop it; if no, keep it
- Return top N clips

### 2.6 Adapt Scoring to Content Type

| Content Type | Prioritize | De-prioritize |
|---|---|---|
| **Podcast** | Opinion bombs, quotable lines, story peaks | Tutorial steps |
| **Interview** | Revelation moments, emotional peaks, conflict | Introductions, pleasantries |
| **Tutorial** | Practical value, "aha" moments | Setup/prerequisites |
| **Lecture** | Counter-intuitive insights, memorable analogies | Routine explanations |
| **Commentary** | Hot takes, prediction moments, reaction peaks | Recaps |
| **Debate** | Clash moments, strongest rebuttals, concessions | Procedural segments |

---

## Phase 3: Create Clip Projects

For each selected highlight, create a separate editor project:

### 3.1 Create new project

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/content/create" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"title": "Clip 1 — The One Thing Nobody Tells You", "description": "Score: 87 | Hook: forbidden-knowledge opener"}'
# → {contentId, navigated: true}
```

**⚠️ Wait 10-12 seconds after navigation for DB content to load** (race condition — see AGENTS.md Step 5).

### 3.2 Set up canvas for vertical

```json
{"type": "editor.resize", "params": {"width": 1080, "height": 1920}}
```

### 3.3 Add trimmed source video

```json
{"type": "editor.addVideo", "params": {
  "src": "/Users/shubham/Movies/podcast-episode-42.mp4",
  "from": 0,
  "trim": {"from": 423500, "to": 489200},
  "width": 1920, "height": 1080,
  "duration": 65700
}}
```

The `trim` values are in milliseconds — they select the source time range.
`from: 0` places the clip at the start of the new project's timeline.

### 3.4 Vertical reframing (center crop)

For v1, use static center crop. This works well for talking-head content where the speaker is roughly centered:

```json
// Get the video item ID from the addVideo response
// Then crop to vertical: take the center 607px width from the 1080px-tall source
// For 1920×1080 source → 9:16 crop = 607×1080 from center
{"type": "editor.cropItem", "params": {
  "itemId": "<videoItemId>",
  "crop": {
    "x": 656,
    "y": 0,
    "width": 607,
    "height": 1080
  }
}}
```

**Crop calculation for common source resolutions:**

| Source | Target | Crop Width | Crop X (centered) |
|--------|--------|------------|-------------------|
| 1920×1080 | 9:16 | 607 | 656 |
| 2560×1440 | 9:16 | 810 | 875 |
| 3840×2160 | 9:16 | 1215 | 1312 |
| 1280×720 | 9:16 | 405 | 437 |

**Formula:**
```
cropWidth = sourceHeight × (9/16)
cropX = (sourceWidth - cropWidth) / 2
cropHeight = sourceHeight
cropY = 0
```

### 3.5 Add captions to the clip

```json
{"type": "editor.autoCaption", "params": {"language": "en"}}
```

Wait for transcription to complete (poll `query.getTranscriptionStatus`).

### 3.6 Save the clip project

```json
{"type": "editor.save", "params": {}}
```

---

## Phase 4: Batch Processing

### Multi-clip workflow

```
For each highlight (sorted by score, highest first):
  1. POST /api/content/create → new project
  2. Wait 10-12s for DB load
  3. editor.resize → 1080×1920
  4. editor.addVideo with trim → place trimmed clip
  5. editor.cropItem → vertical reframe
  6. editor.autoCaption → add captions
  7. Wait for transcription
  8. editor.save
  9. POST /api/render → export MP4
  10. Move to next clip
```

### Tab management for multi-clip

Use tabs to keep all clip projects accessible:

```bash
# List all open tabs
curl -s "http://127.0.0.1:$PORT/api/tabs" -H "Authorization: $TOKEN"

# Switch to a specific tab
curl -s -X POST "http://127.0.0.1:$PORT/api/tabs/<tabId>/activate" \
  -H "Authorization: $TOKEN"
```

---

## Phase 5: Render All Clips

```bash
# Render current project
curl -s -X POST "http://127.0.0.1:$PORT/api/render" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"contentId": "<clipContentId>", "uploadToCloud": true}'

# Poll render status
curl -s "http://127.0.0.1:$PORT/api/render/<jobId>" -H "Authorization: $TOKEN"
```

---

## Complete Example Workflow

Here's the full agent thought process for a 45-minute podcast:

```
1. ANALYZE
   - Import: /Users/shubham/Movies/podcast-ep42.mp4
   - Analyze: 45:12 duration, 1920×1080, 30fps
   - Load into project, run autoCaption
   - Wait for transcription (~2-5 min for 45 min video)
   - Read full transcript (word-level timestamps)

2. SCORE (agent reasoning — no API call)
   - Content type: podcast, density: high
   - Chunk into 3 segments (0-20min, 19-39min, 38-45min)
   - Identify 8-10 candidates across all chunks
   - Score each 0-100 using virality framework
   - Deduplicate overlapping clips
   - Select top 5

3. CREATE CLIPS (for each of top 5)
   - Create new project: "Clip 1 — [Title]"
   - Resize to 1080×1920
   - Add trimmed video (start→end from scoring)
   - Center crop for vertical
   - Auto-caption
   - Save

4. RENDER
   - Render each clip to MP4
   - Upload to cloud
   - Report results to user
```

---

## Phase 4.5: Audio Energy Analysis (Enhanced Scoring)

Use audio energy data to boost virality scores with non-textual signals:

```bash
# Analyze with energy detection enabled
curl -s -X POST "http://127.0.0.1:$PORT/api/media/analyze" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"path": "/path/to/video.mp4", "detectEnergy": true, "detectScenes": true}'
```

### Response includes:

```json
{
  "analysis": {
    "duration": 1800,
    "volume": { "meanDb": -18.5, "maxDb": -3.2 },
    "silenceSegments": [
      { "startSec": 45.2, "endSec": 48.1, "durationSec": 2.9, "startMs": 45200, "endMs": 48100 }
    ],
    "energy": {
      "windowSec": 5,
      "meanRmsDb": -22.3,
      "profile": [
        { "windowIndex": 0, "startSec": 0, "endSec": 5, "rmsDb": -24.1 },
        { "windowIndex": 1, "startSec": 5, "endSec": 10, "rmsDb": -18.5 }
      ],
      "peakMoments": [
        { "startSec": 125, "endSec": 130, "rmsDb": -14.2, "aboveMeanDb": 8.1, "startMs": 125000, "endMs": 130000 }
      ],
      "peakCount": 3
    }
  }
}
```

### How to use energy data for scoring:

| Audio Pattern | What It Means | Score Boost |
|---|---|---|
| Energy peak (>6dB above mean) | Raised voice, emphasis, excitement | +10 |
| Silence >2s followed by peak | Dramatic pause → revelation | +8 |
| Multiple peaks in 30s window | High-energy exchange / debate | +12 |
| Low energy throughout | Monotone / boring section | -10 |

### Optional parameters:

| Param | Default | Description |
|---|---|---|
| `energyWindowSec` | 5 | Size of each energy measurement window (seconds) |
| `silenceThresholdDb` | -30 | dB threshold for silence detection |
| `silenceMinDuration` | 2 | Minimum silence duration to report (seconds) |
| `peakThresholdDb` | 6 | dB above mean to count as a peak |

---

## Phase 4.6: Face-Tracked Reframing

Instead of static center crop, use face detection for intelligent vertical reframing:

```bash
# Detect faces in the source video
curl -s -X POST "http://127.0.0.1:$PORT/api/media/face-detect" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"path": "/path/to/video.mp4", "sampleRate": 1, "targetRatio": 0.5625}'
```

### Response:

```json
{
  "sourceWidth": 1920,
  "sourceHeight": 1080,
  "durationSec": 120,
  "framesAnalyzed": 120,
  "facesDetected": 108,
  "method": "face-tracked",
  "segmentCount": 3,
  "segments": [
    {
      "startSec": 0, "endSec": 45.0, "startMs": 0, "endMs": 45000,
      "cropX": 200, "cropY": 0, "cropWidth": 608, "cropHeight": 1080,
      "faceCenterX": 504, "method": "face-tracked"
    },
    {
      "startSec": 45.0, "endSec": 90.0, "startMs": 45000, "endMs": 90000,
      "cropX": 656, "cropY": 0, "cropWidth": 608, "cropHeight": 1080,
      "faceCenterX": 960, "method": "face-tracked"
    },
    {
      "startSec": 90.0, "endSec": 121.0, "startMs": 90000, "endMs": 121000,
      "cropX": 1100, "cropY": 0, "cropWidth": 608, "cropHeight": 1080,
      "faceCenterX": 1404, "method": "face-tracked"
    }
  ],
  "dominantCropX": 656,
  "cropWidth": 608,
  "cropHeight": 1080
}
```

### Using face data for clipping:

**Single-segment clips** (speaker stays in one position): Use `dominantCropX`:

```json
{"type": "editor.cropItem", "params": {
  "itemId": "<videoItemId>",
  "crop": {"x": 656, "y": 0, "width": 608, "height": 1080}
}}
```

**Multi-segment clips** (speaker moves): Split the video at segment boundaries and crop each differently:

```json
// Add segment 1 (speaker on left)
{"type": "editor.addVideo", "params": {
  "src": "/path/to/video.mp4",
  "from": 0,
  "trim": {"from": 0, "to": 45000},
  "width": 1920, "height": 1080, "duration": 45000
}}
// Crop segment 1 with face-tracked position
{"type": "editor.cropItem", "params": {
  "itemId": "<seg1ItemId>",
  "crop": {"x": 200, "y": 0, "width": 608, "height": 1080}
}}

// Add segment 2 (speaker in center)
{"type": "editor.addVideo", "params": {
  "src": "/path/to/video.mp4",
  "from": 45000,
  "trim": {"from": 45000, "to": 90000},
  "width": 1920, "height": 1080, "duration": 45000
}}
// Crop segment 2
{"type": "editor.cropItem", "params": {
  "itemId": "<seg2ItemId>",
  "crop": {"x": 656, "y": 0, "width": 608, "height": 1080}
}}
```

### Detection backends:

1. **Chrome Shape Detection API** (primary) — high accuracy, GPU-accelerated, requires `--enable-experimental-web-platform-features` flag (auto-enabled)
2. **Skin-color heuristic** (fallback) — detects flesh-toned regions in a 4×4 grid; less accurate but always available

### Optional parameters:

| Param | Default | Description |
|---|---|---|
| `sampleRate` | 1 | Frames per second to analyze |
| `maxFrames` | 120 | Maximum frames to extract |
| `targetRatio` | 0.5625 (9:16) | Target aspect ratio for crop calculation |

---

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| Transcription takes too long | Large video, slow network | Wait patiently; check `query.getTranscriptionStatus` |
| Crop looks wrong | Source resolution different than expected | Re-calculate crop with actual `width`/`height` from analyze |
| Caption timing off in clip | Trim offset not accounted for | Captions are re-generated per clip via autoCaption |
| Video won't play after crop | Crop dimensions not even numbers | Ensure cropWidth and cropHeight are divisible by 2 |
| "No caption words matched" | Clip range has silence/music only | Choose a different clip range with speech |

## Future Enhancements (v2+)

| Feature | Status | Description |
|---|---|---|
| **Face-tracked reframing** | ✅ Implemented | `POST /api/media/face-detect` — Chrome Shape Detection API with skin-color fallback |
| **Audio energy analysis** | ✅ Implemented | `POST /api/media/analyze` with `detectEnergy: true` — silence, RMS profile, peaks |
| **Speaker diarization** | 🟢 Later | "Who said what" for multi-speaker content |
| **Batch render endpoint** | 🟡 Planned | Render N projects in one call |
| **Auto-publish** | 🟢 Later | Post clips directly to IG/TikTok/YouTube |
