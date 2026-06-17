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
| `editor.addVideo` with `trim_start`/`trim_end` | Add a video clip showing only a source time range |
| `editor.addVideoSegments` | Add multiple trimmed segments from one source in a single call |
| `editor.clearTimeline` | Remove all items, filter by type, or clear one track |
| `editor.removeSegment` | Cut out a time range with ripple-shift |
| `editor.splitItem` | Split item(s) at a time point |
| `editor.cutItem` | Split + delete one side |
| `content.applyCaptions` | Apply word-level karaoke captions |

---

## Phase 1: Transcription

### Option A: MCP Transcription (recommended for long videos)

```bash
# 1. Extract audio
ffmpeg -i /path/to/video.mp4 -vn -acodec aac -b:a 128k /tmp/audio.m4a

# 2. Upload audio to get a URL
# Use prepwithai_asset_rehost MCP tool to upload to Azure blob storage

# 3. Transcribe via MCP
# Use prepwithai_transcribe_long tool with:
#   - audio_url: the uploaded URL
#   - language: "hi" (Hindi/Hinglish), "en" (English), etc.
#   - Returns: word-level timestamps, full text, SRT

# 4. Save transcript for editing
# Save word timestamps to /tmp/transcript_words.json
```

### Option B: Pipeline API (no MCP — use from CLI/scripts)

Use this when MCP tools aren't available (CLI agents, scripts, automation).

#### Step 1 — Extract audio
```bash
ffmpeg -y -i /path/to/video.mp4 -vn -acodec libmp3lame -b:a 128k /tmp/audio.mp3
```

#### Step 2 — Upload audio to get a PUBLIC URL

The `analyze_audio` backend pulls audio from a URL — **localhost won't work**.
Upload to Azure Blob (`prepwithai` storage account, `global-assets` container) with a SAS token:

```python
from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas
from datetime import datetime, timedelta, timezone
import os

# Connection string from /Users/shubham/Codes/SkillTown/.env → AZURE_STORAGE_CONNECTION_STRING
conn_str = os.environ["AZURE_STORAGE_CONNECTION_STRING"]
account_name = "prepwithai"
account_key = conn_str.split("AccountKey=")[1].split(";")[0]
container = "global-assets"
blob_name = f"transcription/audio_{int(datetime.now().timestamp())}.mp3"

bsc = BlobServiceClient.from_connection_string(conn_str)
with open("/tmp/audio.mp3", "rb") as f:
    bsc.get_container_client(container).upload_blob(name=blob_name, data=f, overwrite=True)

sas = generate_blob_sas(
    account_name=account_name, container_name=container, blob_name=blob_name,
    account_key=account_key,
    permission=BlobSasPermissions(read=True),
    expiry=datetime.now(timezone.utc) + timedelta(hours=4),
)
audio_url = f"https://{account_name}.blob.core.windows.net/{container}/{blob_name}?{sas}"
print(audio_url)
```

#### Step 3 — Start transcription (async, returns immediately)

The `x-api-secret` is `PREPWITHAI_API_SECRET` from `/Users/shubham/Codes/SkillTown/.env`.

```bash
SECRET="<PREPWITHAI_API_SECRET>"
curl -X POST "https://api.prepwithai.in/api/analyze_audio" \
  -H "Content-Type: application/json" \
  -H "x-api-secret: $SECRET" \
  -d "{\"audio_url\": \"$AUDIO_URL\", \"language\": \"hi\"}"
# Returns: { "status": "processing", "process_id": "...", "firebase_path": "content/.../audio_transcriptions/..." }
```

> ⚠️ **Cache key is `audio_url` only — `language` is NOT part of the cache.** Re-uploading the same audio with a different language param returns the cached first-language transcription. To get multiple language passes, upload with **different blob names** (e.g., append `_pass2.mp3`).

#### Step 4 — Poll Firebase Realtime DB for the result (CRITICAL!)

The REST endpoint keeps returning `"processing"` — the actual result lands in Firebase Realtime DB.
**No auth needed** — the path has public read access.

```bash
DB_URL="https://tradingleadv2-default-rtdb.firebaseio.com"
FB_PATH="<firebase_path from step 3>"   # e.g. "content/anonymous/default/audio_transcriptions/anonymous__audio__..."

# Poll until result.complete_transcription.words exists
while true; do
  result=$(curl -s "$DB_URL/$FB_PATH/result.json")
  if [ "$result" != "null" ] && [ -n "$result" ]; then
    echo "$result" > /tmp/transcript.json
    echo "Transcription complete"
    break
  fi
  echo "Still processing..."
  sleep 5
done
```

You can also watch progress (percentage):
```bash
curl -s "$DB_URL/$FB_PATH/progress.json"
# { "completed_chunks": 1, "percentage": 100.0, "total_chunks": 1, ... }
```

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
- Default style: Bangers font, 120px, cyan active color, uppercase
- Centered vertically by default (`top: (canvasHeight - fontSize) / 2`)
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
