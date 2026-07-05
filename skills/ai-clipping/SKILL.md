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
  -d '{"path": "/Users/shubham/Movies/podcast-episode-42.mp4"}'
# → {status, sourcePath, importedPath, mediaUrl, fileName, size, extension}

# Get detailed metadata
curl -s -X POST "http://127.0.0.1:$PORT/api/media/analyze" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"path": "/Users/shubham/Movies/podcast-episode-42.mp4"}'
# → {filePath, analysis: {duration, durationMs, format, size, video, audio, sceneChanges, volume, energy}}
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

### 1.5 Speaker Diarization (Optional — for multi-speaker content)

For podcasts, interviews, and panel discussions, run hybrid speaker diarization to identify WHO said what. This enables better clip selection (balanced Q&A, best guest answers, etc.).

**Desktop Command (simple — recommended):**
```json
{"type": "query.transcribeWithSpeakers", "params": {
  "trackItemId": "<video track item ID>",
  "quality": "balanced"
}}
```

**Alternative inputs (skip audio extraction):**
```json
{"type": "query.transcribeWithSpeakers", "params": {
  "audioUrl": "<public URL to audio/video>",
  "quality": "best",
  "language": "hi",
  "outputScript": "latin"
}}
```

**Quality presets:**
- `"fast"` — transcript only, no speakers. Use for quick previews.
- `"balanced"` (default) — 1-pass transcription + speaker diarization. Good for most content.
- `"best"` — 3-pass transcription + speakers. Use for final clip selection on important content.

**Response:**
```json
{
  "success": true,
  "mode": "speaker",
  "transcript": {
    "text": "What about crypto? It's not something you can ban...",
    "word_count": 353,
    "language": "en"
  },
  "speakers": {
    "count": 2,
    "items": [
      {"id": "spk_0", "word_count": 145, "total_speech_sec": 62.4},
      {"id": "spk_1", "word_count": 198, "total_speech_sec": 78.8}
    ]
  },
  "speakerTranscript": {
    "dialogue": [
      {"turn_index": 0, "speaker": "spk_0", "start_sec": 0.0, "end_sec": 3.4, "duration_sec": 3.4, "text": "What about crypto?", "word_count": 3},
      {"turn_index": 1, "speaker": "spk_1", "start_sec": 3.8, "end_sec": 12.2, "duration_sec": 8.4, "text": "It's not something you can ban...", "word_count": 25}
    ],
    "words": [{"word": "What", "start_sec": 0.0, "end_sec": 0.4, "speaker": "spk_0"}, ...]
  },
  "warnings": [],
  "stats": {"whisper_time_ms": 9000, "diarize_time_ms": 35000, "quality": "balanced"}
}
```

**Primary outputs:**
- **For clip selection/scoring:** `result.speakerTranscript.dialogue` — turn-level data with speaker labels. Use this to identify interesting clips.
- **For caption timing:** `result.speakerTranscript.words` — word-level timestamps from Azure Whisper. **⚠️ ALWAYS use this for caption placement. NEVER estimate word timing proportionally from turn-level `dialogue` entries.** Proportional estimation drifts 2-4 seconds on turns longer than 30s.

### ⚠️ CRITICAL: Caption Timing — MUST Use Word-Level Timestamps

The `speakerTranscript` response contains TWO arrays:
- `dialogue[]` — turn-level: `{speaker, start_sec, end_sec, text}`. Good for **clip selection** (who said what, when).
- `words[]` — word-level: `{word, start_sec, end_sec, speaker}`. **MANDATORY for caption timing.**

**Why this matters:** A single dialogue turn can span 30-120 seconds. If you split that turn's text into 4-word caption chunks and distribute timing proportionally (`chunk_start = turn_start + (word_index / total_words) * turn_duration`), the captions will drift 2-4 seconds from actual speech. Real speech has pauses, emphasis, and speed changes that proportional math cannot capture.

**Correct caption flow when using diarization data:**
```python
# 1. Get word-level timestamps from diarization response
words = result['speakerTranscript']['words']
# Each word: {"word": "crypto", "start_sec": 3.4, "end_sec": 3.8, "speaker": "spk_1"}

# 2. Filter words for the clip's time range
clip_start, clip_end = 432.2, 558.0  # seconds in source
clip_words = [w for w in words if w['start_sec'] >= clip_start and w['end_sec'] <= clip_end]

# 3. Group into 3-5 word chunks — BREAK at speaker transitions
captions = []
chunk = []
prev_speaker = None
for w in clip_words:
    # Force break at speaker change
    if prev_speaker and w['speaker'] != prev_speaker and chunk:
        captions.append({
            'text': ' '.join(cw['word'] for cw in chunk),
            'from': round((chunk[0]['start_sec'] - clip_start) * 1000),
            'to': round((chunk[-1]['end_sec'] - clip_start) * 1000)
        })
        chunk = []
    chunk.append(w)
    prev_speaker = w['speaker']
    # Also break at ~4 words
    if len(chunk) >= 4:
        captions.append({
            'text': ' '.join(cw['word'] for cw in chunk),
            'from': round((chunk[0]['start_sec'] - clip_start) * 1000),
            'to': round((chunk[-1]['end_sec'] - clip_start) * 1000)
        })
        chunk = []
# flush remaining
if chunk:
    captions.append({
        'text': ' '.join(cw['word'] for cw in chunk),
        'from': round((chunk[0]['start_sec'] - clip_start) * 1000),
        'to': round((chunk[-1]['end_sec'] - clip_start) * 1000)
    })

# 4. Apply with content.applyCaptions
{"type": "content.applyCaptions", "params": {"subtitles": captions}}
```

### ⚠️ CRITICAL: Speaker-Aware Caption Breaks

**Captions MUST break at speaker transitions.** In multi-speaker content (podcasts, interviews), never let one caption chunk contain words from two different speakers. For example:

- ❌ BAD: `"dollar devalue? Well, like"` — mixes Speaker C's question ending with Speaker A's response start
- ✅ GOOD: `"dollar devalue?"` (Speaker C) then `"Well, like everybody"` (Speaker A)

The `words[]` array from `query.transcribeWithSpeakers` includes a `speaker` field on every word. **Always check for speaker changes** when grouping words into caption chunks. Force a chunk break whenever `word.speaker` changes, even if the chunk has fewer than 4 words.

**Why this matters for viewer experience:**
- Viewers associate on-screen text with the person currently speaking
- Showing the next speaker's words before they start talking is confusing and feels broken
- Short 1-2 word captions at speaker transitions are fine — they naturally match the conversational rhythm

**DO NOT:**
- ❌ Estimate word timing by dividing turn duration evenly across words
- ❌ Use local Whisper as a fallback — Azure Whisper handles Hindi, Hinglish, transliteration, and all languages the platform supports
- ❌ Skip the `words[]` array and only use `dialogue[]` for captions
- ❌ Group words across speaker boundaries into the same caption chunk

**If `speakerTranscript.words[]` is missing or empty** (edge case — API degradation):
- Retry `query.transcribeWithSpeakers` with `quality: "best"`
- If still missing, run `editor.autoCaption` on each individual clip project instead (this triggers a fresh Azure Whisper transcription on just that clip's audio)

**Error handling:** Check `result.warnings` array. Possible codes:
- `DIARIZATION_FAILED` — speakers unavailable but transcript exists (retryable)
- `NO_SPEECH_DETECTED` — no speech found in audio (not retryable)
- If `mode` is `"transcript_only"` when you requested `"speaker"`, diarization degraded gracefully.

**How it works:** Runs Azure Whisper (word timestamps) + GPT-4o-transcribe-diarize (speaker segments) in parallel on the PrepWithAI backend, then merges by time overlap. ~97-100% word-to-speaker match rate.

**When to use diarization:**
- Content has 2+ speakers (podcast, interview, debate, panel)
- You want to extract "best guest answers" or "best interviewer questions"
- You want balanced clips (roughly equal speaking time per speaker)

**When to skip (use `quality: "fast"` or `mode: "transcript_only"`):**
- Single-speaker content (vlog, tutorial, commentary)
- Speed is critical and speaker info not needed

**Using speaker context in scoring (Phase 2):**
- Tag each clip with primary speaker: `"primary_speaker": "spk_1"` (who speaks most in that clip)
- Prefer clips with speaker TRANSITIONS (question → answer) — they feel more dynamic
- For interview content, the best clips usually start with host's question + guest's answer
- Speaker ratio per clip: aim for 30-70% split (pure monologue clips are less engaging)
- Use `speakers.items` to identify who talks more overall — usually the guest

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
- **Verify clip boundaries using word-level data:** After selecting a time range, check the actual words at the start and end. The clip should begin at a sentence/thought start and end at a sentence completion. Trim trailing filler words ("But", "So", "And") that start new sentences belonging to the next topic.
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
  "virality_reason": "Opens with forbidden-knowledge hook, delivers a contrarian take with specific examples",
  "primary_speaker": "spk_1",
  "speaker_ratio": {"spk_0": 0.3, "spk_1": 0.7}
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

### 3.3b Editorial Tightening (MANDATORY)

**Before reframing or adding captions**, tighten the clip by removing filler content, dead air, and low-value speech. This is a separate phase documented in [`editorial-tightening.md`](./editorial-tightening.md).

**Summary of what to cut:**
1. **Silence gaps > 0.4s** → cut, keep 150ms breath
2. **Standalone verbal tics** → "Right?", "You know?", "Like," (< 3 words)
3. **Transition filler** → "And I can explain to you why" (adds no content)
4. **Stuttering/false starts** → Keep only the final clean version
5. **Pre-answer rambling** → Cut ramp-up, start from the real answer
6. **Low-value cross-talk** → Casual "Yeah", "Mm-hmm" that doesn't add engagement
7. **Verbose restatements** → Same info said twice in different words

**What to KEEP:**
- Genuine reactions ("You don't?!" = surprise = engagement gold)
- Questions that create tension
- Specific facts, numbers, opinions

**Method:** Use `editor.addVideoSegments` with only the keep-segments (gap=0). See editorial-tightening.md for the full algorithm, scoring framework, and examples.

**⚠️ CRITICAL ORDER:** Tighten BEFORE adding captions. Captions applied to a pre-tightened timeline will fragment and break when segments are later removed.

### 3.4 Vertical reframing

**Option A (Recommended — Dynamic face-tracked reframing):**

Use the built-in reframe pipeline to dynamically pan the crop window to follow the active speaker's face:

```bash
# Run face detection + reframe on the source video
curl -s -X POST "http://127.0.0.1:$PORT/api/media/reframe" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "path": "/path/to/source-video.mp4",
    "itemId": "<videoItemId>",
    "preset": "smooth",
    "apply": true,
    "trimStartSec": 423.5,
    "canvasWidth": 1080,
    "canvasHeight": 1920
  }'
```

**Presets:**
| Preset | Use Case |
|--------|----------|
| `smooth` | Default — gentle pans, good for interviews/podcasts |
| `responsive` | Faster tracking, for dynamic content with quick speaker switches |
| `locked` | Minimal movement, holds position longer |
| `cinematic` | Slow, intentional pans |
| `vlogger` | Single-speaker focus, responsive to movement |

The pipeline: extracts 1 frame/sec → detects faces via Chrome Shape Detection API → smooths positions (dead zones, min hold time, max speed) → generates keyframes → applies to video item.

**Option B (Fallback — static center crop):**

For v1 or when face detection isn't needed, use a static center crop. Works for talking-head content where the speaker is roughly centered:

```json
{"type": "editor.cropItem", "params": {
  "itemId": "<videoItemId>",
  "crop": {
    "x": 656, "y": 0,
    "width": 607, "height": 1080
  }
}}
```

**Or use fill-canvas scaling** (scales video to fill vertical frame, crops sides):
```json
{"type": "editor.editItem", "params": {
  "id": "<videoItemId>",
  "updates": {"details": {
    "crop": null,
    "width": 3413, "height": 1920, "left": -1167, "top": 0
  }}
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

**Option A (Preferred — when you have diarization word data):**

If you ran `query.transcribeWithSpeakers` in Phase 1.5, you already have word-level timestamps. Use them directly — no need for a second transcription:

```python
# Filter speakerTranscript.words[] for this clip's time range
clip_words = [w for w in all_words if w['start_sec'] >= clip_start and w['end_sec'] <= clip_end]

# Group into 4-word chunks with REAL timestamps (see Phase 1.5 for full code)
subtitles = build_captions_from_words(clip_words, clip_start)

# Apply
{"type": "content.applyCaptions", "params": {"subtitles": subtitles}}
```

**Option B (Fallback — no prior diarization, or words[] missing):**

Run a fresh transcription on just this clip's audio:

```json
{"type": "editor.autoCaption", "params": {"language": "en"}}
```

Wait for transcription to complete (poll `query.getTranscriptionStatus`).

**⚠️ NEVER use proportional word timing from turn-level dialogue data.** See the critical warning in Phase 1.5.

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
  -d '{"renderType": "design", "data": "<design object from project.getFullState>", "contentId": "<clipContentId>", "uploadToCloud": true}'

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
  "segmentCount": 3,
  "segments": [
    {
      "startSec": 0, "endSec": 45.0, "startMs": 0, "endMs": 45000,
      "cropX": 200, "cropY": 0, "cropWidth": 608, "cropHeight": 1080,
      "faceCenterX": 504
    },
    {
      "startSec": 45.0, "endSec": 90.0, "startMs": 45000, "endMs": 90000,
      "cropX": 656, "cropY": 0, "cropWidth": 608, "cropHeight": 1080,
      "faceCenterX": 960
    },
    {
      "startSec": 90.0, "endSec": 121.0, "startMs": 90000, "endMs": 121000,
      "cropX": 1100, "cropY": 0, "cropWidth": 608, "cropHeight": 1080,
      "faceCenterX": 1404
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
| **Speaker diarization** | ✅ Done | "Who said what" for multi-speaker content — `query.transcribeWithSpeakers` |
| **Batch render endpoint** | 🟡 Planned | Render N projects in one call |
| **Auto-publish** | 🟢 Later | Post clips directly to IG/TikTok/YouTube |

## Face Detection (for Dynamic Reframing)

### `media.detectFacesInFrames`
Detect faces in captured preview frames using Chrome Shape Detection API (with skin-color heuristic fallback). Used by the AI clipping pipeline for smart vertical reframing — centering the crop on detected faces.

```json
{ "type": "media.detectFacesInFrames", "params": {
  "frames": [
    { "timeMs": 5000, "dataUrl": "data:image/png;base64,..." },
    { "timeMs": 10000, "dataUrl": "data:image/png;base64,..." }
  ]
}}
```

| Param | Type | Description |
|---|---|---|
| `frames` | `array` | Array of `{timeMs, dataUrl}` objects — each a captured frame as a data URL |

**Returns:** `{ frames: [{timeMs, faces: [{x, y, width, height}], method}] }`

The `detectionMethod` field indicates which detector was used: `"shape-detection-api"` (hardware-accelerated) or `"skin-color-heuristic"` (fallback).
