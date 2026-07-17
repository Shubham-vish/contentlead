---
name: transcription-and-editing
description: Transcribe video, apply captions, trim/cut segments, remove pauses (jump cuts), and build edited timelines from source video.
tags: transcription, captions, trim, cut, split, jump-cut, pause-removal, segments, subtitle, karaoke, ffmpeg, whisper
---

# Transcription & Video Editing Workflow

End-to-end workflow for editing talking-head or screen-share videos: transcribe → identify segments → cut → add captions.

## Quick Reference — New Commands

| Command | What It Does |
|---------|-------------|
| `editor.autoCaption` | **One-shot**: transcribe a clip + apply karaoke captions + persist transcript + reorder tracks |
| `editor.addVideo` with `trim_start`/`trim_end` | Add a video clip showing only a source time range |
| `editor.addVideoSegments` | Add multiple trimmed segments from one source in a single call |
| `editor.clearTimeline` | Remove all items, filter by type, or clear one track |
| `editor.removeSegment` | Cut out a time range with ripple-shift |
| `editor.splitItem` | Split item(s) at a time point |
| `editor.cutItem` | Split + delete one side |
| `content.applyCaptions` | Apply word-level karaoke captions |
| `query.getTranscriptionStatus` | Check auto-caption/transcription job status (idle/processing/completed/error) |
| `editor.editCaptionWord` | Fix one caption word's text or timing |
| `editor.bulkReplaceText` | Find/replace text across all captions/text items |

---

## Phase 1: Transcription

### Option 0 (recommended): One-shot `editor.autoCaption`

The fastest path. A single command that resolves the clip's source, extracts audio,
transcribes it, applies word-level karaoke captions to the timeline, persists the
transcript to the content, and reorders tracks so captions sit on top. Handles the
whole Option A/B pipeline below for you.

```json
{
  "type": "editor.autoCaption",
  "params": {
    "trackItemId": "video_abc",
    "language": "hi",
    "passes": 1,
    "translate": false,
    "autoReorder": true
  }
}
```

| Param | Type | Default | Description |
|---|---|---|---|
| `trackItemId` | `string` | **required** | The video/audio clip on the timeline to caption |
| `from` / `to` | `number` (ms) | clip range | Optional sub-window of the clip to caption |
| `language` | `string` | `"hi"` | Transcription language (`hi` = Hindi/Hinglish, `en`, etc.) |
| `passes` | `1`–`3` | `1` | Retry passes with widening audio padding — raise if edge words get clipped |
| `style` | `string` | — | Caption style preset to apply |
| `translate` | `boolean` | `false` | Translate captions instead of transcribing verbatim |
| `autoReorder` | `boolean` | `true` | Reorder tracks (captions to top) after applying |

**Returns** on success:
```json
{
  "status": "success",
  "captionCount": 42,
  "trackId": "track_xyz",
  "jobId": "tc_lz3k9f8a2b1c",
  "reordered": true,
  "transcriptPersisted": true,
  "transcriptWordCount": 318
}
```

**Progress tracking via job file.** The command runs a multi-step job and writes live
progress to:

```
~/.skilltown-desktop/jobs/<jobId>.json
```

The `/api/execute` call **blocks until the job finishes** and returns the final result,
but for a long clip you can tail the job file to watch progress. Shape:

```json
{
  "jobId": "tc_lz3k9f8a2b1c",
  "status": "in_progress",          // → "success" | "failed"
  "params": { ... },
  "steps": {
    "resolve_source":    { "done": true, "sourceDurationSec": 222.9 },
    "extract_audio":     { "done": true },
    "upload":            { "done": true },
    "transcribe":        { "done": false, "progress": 63 },   // 0–100
    "filter_words":      { "done": false },
    "apply_captions":    { "done": false },
    "persist_transcript":{ "done": false },
    "reorder_tracks":    { "done": false }
  },
  "result": null
}
```

Poll `steps.transcribe.progress` (0–100) for the slow transcription phase. On failure,
the failing step gets `{ done: false, error: "..." }` and top-level `status: "failed"`.
Use `query.getTranscriptionStatus` (below) as the reload-safe status source.
### Option A (recommended): MCP + auto-tracked job

Fire-and-forget with real-time push tracking. No polling. No secrets. Works
from any AI CLI on any machine — the desktop app owns Firebase auth via cookies.

```bash
PORT=$(node -e "console.log(require(require('os').homedir()+'/.skilltown-desktop/api.json').port)")
TOKEN=$(node -e "console.log(require(require('os').homedir()+'/.skilltown-desktop/api.json').token)")
API=http://127.0.0.1:$PORT

# 1. Extract audio (only step the AI does locally)
ffmpeg -y -i /path/to/video.mp4 -vn -acodec libmp3lame -b:a 128k /tmp/audio.mp3

# 2. Upload via MCP (Azure blob under the hood — no manual SAS/keys needed)
AUDIO_URL=$(curl -sX POST $API/api/mcp/call \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"domain":"prepwithai","tool":"prepwithai_asset_rehost",
        "args":{"source":"/tmp/audio.mp3","kind":"audio"}}' \
  | jq -r '.content.result | fromjson | .url')

# 3. Kick off transcription — returns immediately with a trackingUrl
RESP=$(curl -sX POST $API/api/mcp/call \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"domain\":\"prepwithai\",\"tool\":\"prepwithai_transcribe_long\",
       \"args\":{\"audio_url\":\"$AUDIO_URL\",\"language\":\"hi\",
                    \"content_id\":\"content_<your-id>\"}}")
JOB=$(echo "$RESP" | jq -r .trackingUrl)     # e.g. /api/jobs/<process_id>

# 4a. Poll the cached snapshot (0ms latency — reads from desktop memory, not Firebase)
while true; do
  STATUS=$(curl -s $API$JOB -H "Authorization: Bearer $TOKEN" | jq -r .status)
  echo "[$(date +%T)] $STATUS"
  [ "$STATUS" = "complete" ] && break
  [ "$STATUS" = "failed" ] && exit 1
  sleep 5
done

# 4b. OR subscribe to the SSE stream (real-time push, no polling)
curl -N -s $API$JOB/stream -H "Authorization: Bearer $TOKEN"

# 5. Read the finished transcript from the cached snapshot
curl -s $API$JOB -H "Authorization: Bearer $TOKEN" \
  | jq '.snapshot.result | {full_text, srt: .srt_content, words: .complete_transcription.words}' \
  > /tmp/transcript.json
```

**How the tracking works** (you never need to touch Firebase directly):

1. `prepwithai_transcribe_long` returns `{process_id, firebase_path}` and the MCP proxy
   auto-subscribes to that Firebase path via native SSE (`Accept: text/event-stream`).
2. Every progress push from the backend lands in an in-memory cache on the desktop.
3. `GET /api/jobs/:id` serves that cache in <1 ms — no external calls.
4. When the backend writes `result.complete_transcription`, the job is auto-marked
   `complete`, the upstream stream is closed, and the cache stays for 1 hour.
5. Same pattern works for ANY future backend job that writes to a Firebase path —
   register manually via `POST /api/jobs/subscribe {kind, firebase_path}`.

**Other job endpoints** (all under `Authorization: Bearer $TOKEN`):

| Endpoint | Purpose |
|---|---|
| `GET /api/jobs` | List all tracked jobs (`?status=in_progress` to filter) |
| `GET /api/jobs/:id` | Full cached snapshot for one job |
| `GET /api/jobs/:id/stream` | SSE stream of live updates (real-time push) |
| `POST /api/jobs/subscribe` | Manually track a Firebase path `{kind, firebase_path}` |
| `DELETE /api/jobs/:id` | Unsubscribe + drop cache |

### Transcript Data Format

```json
{
  "complete_transcription": {
    "words": [
      {"word": "hello", "start": 0.5, "end": 0.9},
      {"word": "world", "start": 1.0, "end": 1.4}
    ],
    "full_text": "hello world ...",
    "duration": 222.9,
    "language": "hi"
  },
  "srt_content": "1\n00:00:00,500 --> 00:00:00,900\nhello\n\n...",
  "txt_content": "hello world ..."
}
```

> Code-switched audio (e.g., Hindi with English words like "content creator") returns mixed-script words —
> English words come back in Latin, Hindi words in Devanagari. Don't re-transliterate already-Latin words.

### Checking transcription status — `query.getTranscriptionStatus`

Auto-caption (`editor.autoCaption`) transcription runs asynchronously. Poll its status instead of guessing — it's derived from persisted content, so it survives reloads.

| Param | Type | Description |
|---|---|---|
| `scopeKey` | `string` (optional) | Filter to one transcription scope; omit to list all |

**Returns:** `{ isAnyProcessing, activeProcesses: [{ scopeKey, processId }], scopeCount, scopes: [{ scopeKey, status, cancelled, wordCount, hasSavedWords, transcribedAt, processId }] }`

`status` is one of `idle | pending | processing | completed | error | cancelled`. Wait for `isAnyProcessing: false` (and `status: "completed"` with `wordCount > 0`) before reading the transcript with `query.getTranscript`.

```json
{ "type": "query.getTranscriptionStatus", "params": {} }
```

---

## Phase 1.5: Transliteration to Latin Script (for Hindi/Hinglish captions)

Devanagari words from Whisper need conversion to Latin for Instagram-style captions. Three approaches, in order of quality:

### Approach 1: `indic-transliteration` library (quick, decent quality)

```bash
pip3 install indic-transliteration
```

```python
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate

def to_latin(text):
    if all(ord(c) < 256 for c in text):  # already Latin
        return text
    # ITRANS = readable Roman; KOLKATA = diacritic-heavy IAST
    return transliterate(text, sanscript.DEVANAGARI, sanscript.ITRANS).lower()
```

**Output quality**: Decent but artifacts like `aa`, `~n`, trailing `.a` need cleanup.

### Approach 2: Hand-tuned Hinglish dictionary (best for top-200 common words)

Maintain a `HINGLISH_MAP` for natural casual romanization:
```python
HINGLISH_MAP = {
    'अगर': 'agar', 'तुम': 'tum', 'है': 'hai', 'भाई': 'bhai',
    'देख': 'dekh', 'बना': 'bana', 'ज़रूर': 'zaroor', ...
}
def hinglish(text):
    return HINGLISH_MAP.get(text, fallback_to_itrans(text))
```

This gives the most natural output (matches how Indians text on WhatsApp/IG).

### Approach 3: LLM-based transliteration (highest quality)

Use `prepwithai_text_generate` MCP tool with a prompt:
```
Convert this Hindi (Devanagari) text to natural Hinglish (Latin script) as Indians text on social media. Keep English words unchanged. Be casual, not formal.
```

### Multi-Pass Strategy

For best results, run all 3 approaches and pick the cleanest output per word, or use LLM to polish dictionary output. The Devanagari source is always the same — only the romanization changes.

---

## Phase 2: Identify Segments

Analyze the transcript to find interesting segments and pauses:

```python
# Find pauses > 500ms between words
pauses = []
for i in range(1, len(words)):
    gap = words[i]["start"] - words[i-1]["end"]
    if gap > 0.5:
        pauses.append({
            "start": words[i-1]["end"],
            "end": words[i]["start"],
            "duration": gap
        })

# Find interesting segments by content
# Group words into sentences, evaluate which to keep
segments = [
    {"start": 3000, "end": 21700, "label": "hook"},
    {"start": 75000, "end": 100000, "label": "demo"},
    {"start": 205000, "end": 220500, "label": "cta"}
]
```

---

## Phase 3: Build Edited Timeline

### Method 1: `addVideoSegments` (one call, recommended)

The simplest way — extracts multiple segments from one source video:

```json
{
  "type": "editor.addVideoSegments",
  "params": {
    "url": "http://127.0.0.1:<mediaPort>/media?path=<encoded_path>",
    "segments": [
      {"start": 3000, "end": 21700, "label": "hook"},
      {"start": 75000, "end": 100000, "label": "demo"},
      {"start": 100000, "end": 112000, "label": "automation"},
      {"start": 205000, "end": 220500, "label": "cta"}
    ],
    "gap": 0,
    "startAt": 0,
    "width": 1080,
    "height": 1920,
    "volume": 100
  }
}
```

**Returns:**
```json
{
  "segmentsAdded": 4,
  "totalDuration": 71200,
  "items": [
    {"itemId": "abc", "label": "hook", "display": {"from": 0, "to": 18700}, "trim": {"from": 3000, "to": 21700}},
    ...
  ]
}
```

### Method 2: `addVideo` with `trim_start`/`trim_end` (per-clip control)

For adding individual clips with more control:

```json
{
  "type": "editor.addVideo",
  "params": {
    "url": "<video_url>",
    "from_ms": 0,
    "trim_start": 75000,
    "trim_end": 100000,
    "width": 1080,
    "height": 1920,
    "volume": 100
  }
}
```

**Key behavior:**
- `trim_start`/`trim_end` → source range to play (ms)
- `from_ms` → where on the timeline to place it
- Duration is **auto-calculated** from trim range (no manual math needed!)
- Also accepts: `source_start`/`source_end`, `trimStart`/`trimEnd`, or `trim: {from, to}`

### Method 3: Pre-cut with ffmpeg (for large seek distances)

When source video is very long (>2min) and segments are far apart, browser decoders may timeout. Pre-cut with ffmpeg:

```bash
ffmpeg -ss 3 -to 21.7 -i source.mp4 -c:v libx264 -preset fast -crf 18 -c:a aac -b:a 128k /tmp/cuts/01_hook.mp4
ffmpeg -ss 75 -to 100 -i source.mp4 -c:v libx264 -preset fast -crf 18 -c:a aac -b:a 128k /tmp/cuts/02_demo.mp4
```

Then add each cut file as a separate video. `/tmp/` is in the media server's allowed paths.

### When to use which method

| Scenario | Method |
|----------|--------|
| Source < 2 min, segments close together | `addVideoSegments` (browser trim) |
| Source > 2 min, segments > 60s apart | ffmpeg pre-cut → add individual files |
| Single segment extraction | `addVideo` with `trim_start`/`trim_end` |
| Need exact frame accuracy | ffmpeg pre-cut (browser trim is approximate) |

---

## Phase 4: Jump Cuts (Remove Pauses)

### Automatic: Remove all pauses > threshold

After building the timeline with `addVideoSegments`, use `removeSegment` to cut out pauses:

```python
# For each pause found in transcript analysis:
for pause in pauses_sorted_reverse:  # Process from end to start!
    # Map source pause time to timeline time
    timeline_pause_start = map_source_to_timeline(pause["start"])
    timeline_pause_end = map_source_to_timeline(pause["end"])
    
    execute({
        "type": "editor.removeSegment",
        "params": {
            "from_ms": timeline_pause_start,
            "to_ms": timeline_pause_end,
            "ripple": True  # Shift everything left to close the gap
        }
    })
```

**⚠️ CRITICAL: Process pauses from END to START.** Each ripple-shift changes timeline positions of everything after it. Working backwards keeps unprocessed positions stable.

### `editor.removeSegment` details

```json
{
  "type": "editor.removeSegment",
  "params": {
    "from_ms": 15000,
    "to_ms": 16500,
    "ripple": true,
    "types": ["video"]
  }
}
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `from_ms` | number | required | Start of segment to remove |
| `to_ms` | number | required | End of segment to remove |
| `ripple` | boolean | `true` | Shift items after `to_ms` left by the removed duration |
| `types` | string[] | all | Only affect specific types (e.g., `["video"]`, `["video", "caption"]`) |

**What it handles:**
- Items fully inside range → deleted
- Items spanning start boundary → trimmed at end
- Items spanning end boundary → trimmed at start
- Items containing entire range → split into two parts
- Items after range → shifted left (if ripple=true)
- Trim ranges on video/audio → properly recalculated

### Manual: Split + Delete

For precise control, use split + delete:

```json
// Split at pause start
{"type": "editor.splitItem", "params": {"itemIds": ["videoId"], "timeMs": 15000}}
// → Returns newItemIds: {"videoId": "rightPartId"}

// Cut the right part at pause end  
{"type": "editor.cutItem", "params": {"itemIds": ["rightPartId"], "timeMs": 16500, "cutMode": "keep-right"}}

// Close the gap
{"type": "editor.removeGaps", "params": {}}
```

---

## Phase 5: Apply Captions

### Build caption payload from transcript

Map word timestamps from source video time to timeline time:

```python
# Edit segments define the source→timeline mapping
segments = [
    {"src_start": 3.0, "src_end": 21.7, "tl_start": 0.0},
    {"src_start": 75.0, "src_end": 100.0, "tl_start": 18.7},
    # ...
]

mapped_words = []
for word in transcript_words:
    for seg in segments:
        if word["start"] >= seg["src_start"] and word["start"] < seg["src_end"]:
            offset = seg["tl_start"] - seg["src_start"]
            mapped_words.append({
                "word": word["word"],
                "start": round((word["start"] + offset) * 1000),  # → ms
                "end": round((word["end"] + offset) * 1000)
            })
            break

# Group into 3-5 word subtitle segments
subtitles = []
for i in range(0, len(mapped_words), 4):
    chunk = mapped_words[i:i+4]
    subtitles.append({
        "text": " ".join(w["word"] for w in chunk),
        "start": chunk[0]["start"] / 1000,   # → seconds
        "end": chunk[-1]["end"] / 1000,
        "words": chunk                         # word timing in ms
    })
```

### Apply captions

```json
{
  "type": "content.applyCaptions",
  "params": {
    "subtitles": [
      {
        "text": "hello world this is",
        "start": 0.5,
        "end": 2.1,
        "words": [
          {"word": "hello", "start": 500, "end": 900},
          {"word": "world", "start": 1000, "end": 1400},
          {"word": "this", "start": 1500, "end": 1700},
          {"word": "is", "start": 1800, "end": 2100}
        ]
      }
    ],
    "words": [...]
  }
}
```

**Caption features:**
- Word-level karaoke highlighting (active word changes color)
- Default style: **Montserrat 800-weight**, 72px, gold (#FFD700) active color, grey (#CCCCCC) appeared color, uppercase
- Position: lower third (`top: canvasHeight * 0.68`), centered horizontally with 80px margins
- Semi-transparent dark background (`rgba(0,0,0,0.35)`) with 12px border radius
- Black stroke (6px) for readability over video
- Auto-creates a caption track

### Caption positioning

For screen-share + face-cam videos, position captions in the black bars:

```json
// After applying captions, adjust position:
// For each caption item, use editor.editItem to set top position
{"type": "editor.editItem", "params": {
  "itemId": "<captionId>",
  "details": {"top": "1600px"}
}}
```

---

## Phase 6: Clear and Rebuild

### `editor.clearTimeline`

```json
// Clear everything
{"type": "editor.clearTimeline", "params": {}}

// Clear only captions (keep video)
{"type": "editor.clearTimeline", "params": {"types": ["caption"]}}

// Clear only video (keep captions)
{"type": "editor.clearTimeline", "params": {"types": ["video"]}}

// Clear only one track
{"type": "editor.clearTimeline", "params": {"trackId": "track_01"}}
```

---

## Complete Workflow Example

```bash
# 1. Extract audio + transcribe
ffmpeg -i video.mp4 -vn -acodec aac /tmp/audio.m4a
# → upload + transcribe via MCP → get word timestamps

# 2. Analyze transcript → identify segments + pauses

# 3. Clear timeline
POST /api/execute → editor.clearTimeline

# 4. Add segments in one call
POST /api/execute → editor.addVideoSegments {
  url, segments: [{start, end, label}, ...], width, height
}

# 5. Remove pauses (from end to start!)
for pause in reversed(pauses):
    POST /api/execute → editor.removeSegment {from_ms, to_ms, ripple: true}

# 6. Apply captions (with timeline-mapped word times)
POST /api/execute → content.applyCaptions {subtitles, words}

# 7. Save
POST /api/execute → editor.save
```

---

## Verify Edits by Re-transcribing (Ground Truth)

**Captions on the timeline are NOT the same as what the audio actually plays.** When you cut/split/rearrange video segments, always re-verify by transcribing the ACTUAL audio output. Common trap: you see the correct caption text but the audio underneath plays a different section (e.g., opening line repeated).

**How to verify:**
```bash
# 1. Build the actual audio your edit produces
ffmpeg -y -ss <segment1_start> -to <segment1_end> -i source.mp4 -vn -acodec libmp3lame /tmp/p1.mp3
# ... repeat for each segment
ffmpeg -y -i "concat:/tmp/p1.mp3|/tmp/p2.mp3|/tmp/p3.mp3" -acodec copy /tmp/verify.mp3

# 2. Upload with unique blob name (see Phase 1) and re-transcribe
# 3. Diff the returned text against what you expected

# Check for repetitions:
python3 -c "
text = open('/tmp/verify_transcript.txt').read()
# Opening phrases should appear ONCE
signature = 'अगर तुम एक'  # or your video's unique opening
assert text.count(signature) == 1, f'REPETITION: found {text.count(signature)}x'
print('OK — no repetition')
"
```

**Why this matters:** In a session where the user reported "the opening line is repeating", the issue was `editor.splitItem` not setting trim on split pieces — captions looked right but audio played source from time 0 for each piece. Only re-transcription caught it.

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| 403 on media URL | File not in allowed directory | Move to ~/Codes, ~/Downloads, or /tmp/ |
| MP4Clip.tick timeout | Browser decoder can't seek far in large file | Use ffmpeg pre-cut method |
| Captions not visible | Caption track below video track | Call `editor.reorderTracks` |
| Duration wrong after trim | Old behavior before fix | Use `trim_start`/`trim_end` (auto-derives duration) |
| State lost after navigate | Editor didn't auto-save | Auto-save is now built-in (3s debounce) |
| Words not mapped to timeline | Source times vs timeline times | Apply source→timeline offset per segment |
| Pauses removal breaks positions | Ripple shift changes downstream times | Process pauses from end to start |

---

## Trim Params Reference

`editor.addVideo` accepts trim in multiple formats (all equivalent):

```json
// Format 1: trim_start / trim_end (simplest)
{"trim_start": 75000, "trim_end": 100000}

// Format 2: source_start / source_end
{"source_start": 75000, "source_end": 100000}

// Format 3: trimStart / trimEnd (camelCase)
{"trimStart": 75000, "trimEnd": 100000}

// Format 4: trim object (internal format)
{"trim": {"from": 75000, "to": 100000}}
```

All produce the same result: a clip showing source 75-100s, with display duration auto-calculated as 25s.

## Manual Transcript Management

### `content.setTranscript`
Set or replace the transcript for the current content. Use when you have an externally-generated transcript (e.g., from diarization) that you want to store on the content record.

```json
{ "type": "content.setTranscript", "params": {
  "transcript": {
    "text": "Full transcript text...",
    "words": [
      {"word": "Hello", "start": 0.0, "end": 0.5, "speaker": "Speaker 1"},
      {"word": "world", "start": 0.5, "end": 1.0, "speaker": "Speaker 1"}
    ]
  }
}}
```
