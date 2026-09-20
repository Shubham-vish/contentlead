---
name: cl-voice
description: Voice cloning + text-to-speech for ContentLead. Generate speech into the UI history, clone/list/rename/preview/delete owned voices, read saved generations, then add audio to an explicitly targeted timeline track. Uses the SkillTown Desktop Voice Lab bridge with signed-in cookies; no manual provider credentials.
tags: voice, tts, text-to-speech, clone, cloning, voiceover, narration, speech, audio, bridge, minimax
---

# Voice Cloning & Text-to-Speech (via Desktop Bridge)

> **⚙️ Is the ContentLead app running?** These calls need `~/.skilltown-desktop/api.json`. If it is missing, the desktop app is not running — start it, then wait ~30s for the file: **macOS** `open -a "ContentLead"` · **Windows (PowerShell)** `Start-Process "$env:LOCALAPPDATA\Programs\ContentLead\ContentLead.exe"`. Full OS-aware detect/start/poll (Linux + dev too): see `cl-editor/infrastructure.md` → "Ensure the ContentLead desktop app is running". Only ask the user if it still does not come up.

Clone a voice, synthesize narration, and add it to the timeline — all through the
local SkillTown Desktop **voice bridge**. Every call is a single HTTP request with
one bearer token. The bridge uses the same `/api/voice-lab/*` routes as the UI:
capability checks, owned clone names/previews, and generation history all match.
Provider credentials stay server-side. **No hand-copied JWT or RPC framing.**

> Discover these endpoints through `/api/capabilities`. If history/rename/preview
> is missing, the desktop process needs an updated build/restart. Skill availability
> alone does not prove route availability. Never fall back to `/api/ai/*` for voice:
> that bypasses UI persistence. `voice.generate` is not an `/api/execute` command.

## 0. Setup — one-time per shell

```bash
# Read desktop port + token (rewritten every app restart)
eval "$(node -e '
  const c = require(require("os").homedir()+"/.skilltown-desktop/api.json");
  console.log(`export API=http://127.0.0.1:${c.port}\nexport TOKEN=${c.token}`);
')"

# Auth uses the Bearer scheme for these bridge routes:
export AUTH="Authorization: Bearer $TOKEN"

# Sanity: voice features need a signed-in cloud session (cookie auth).
curl -s "$API/api/health" -H "$AUTH" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('cloud.authenticated =', d.get('cloud',{}).get('authenticated'))"
# If cloud.authenticated is false/null → sign in inside the ContentLead app first.
```

If `~/.skilltown-desktop/api.json` doesn't exist, the desktop app isn't running —
start it (see the "Is the ContentLead app running?" note at the top: macOS `open -a "ContentLead"`, Windows `Start-Process`), then re-read the config. Only ask the user if it still doesn't come up.

## 1. Endpoint reference

All routes require `Authorization: Bearer <token>`. Bodies are JSON.

| Method | Path | Body / Query | Returns |
|--------|------|--------------|---------|
| `GET`  | `/api/bridge/voice/voices` | `?voice_type=all\|system\|voice_cloning` | `{ voices:[{voice_id, display_name?, voice_name?, preview_audio_url?, ...}], count }` |
| `POST` | `/api/bridge/voice/generate` | `{ text, voice_id, voice_name?, speed?, format? }` | `{ audio_url, format, duration_seconds?, history_id }` |
| `POST` | `/api/bridge/voice/upload` | `{ filePath }` (absolute local audio path) | `{ url, size_bytes, mime, file_name }` |
| `POST` | `/api/bridge/voice/clone` | `{ audio_url, voice_name?, display_name?, voice_id?, demo_text? }` | `{ voice_id, cloned_voice_id, display_name, details? }` |
| `POST` | `/api/bridge/voice/upload-and-clone` | `{ filePath, voice_name?, display_name?, voice_id?, demo_text? }` | Clone result plus `{upload_url, upload}` |
| `GET` | `/api/bridge/voice/history` | `?page=1&pageSize=20` (1-100) | `{ items, pagination:{page,pageSize,total,hasMore} }` |
| `DELETE` | `/api/bridge/voice/history` | `?id=<history-id>` | `{ success:true }`; does not delete timeline items |
| `POST` | `/api/bridge/voice/voices/:voice_id/rename` | `{ display_name:string\|null }` | `{ voice_id, display_name }` |
| `POST` | `/api/bridge/voice/preview` | `{ voice_id, text?, fresh? }` | `{ audio_url, duration_seconds?, cached }`; uncached/custom previews cost credits |
| `POST` | `/api/bridge/voice/delete` | `{ voice_id, voice_type? }` | `{ status, voice_id, created_time }` |
| `DELETE` | `/api/bridge/voice/voices/:voice_id` | `?voice_type=voice_cloning` | `{ status, voice_id, created_time }` |

Notes:
- `voice_type` defaults: list → `all`; delete → `voice_cloning`.
- `format`: `mp3` (default), `wav`, `flac`, `aac`; `audio_format` is an alias.
- `speed`: server clamps to 0.5-2.0 (`1.0` = normal).
- `text` must be **≤ 5000 characters** per generate call.
- Cloning input accepts `.wav .mp3 .m4a .flac .aac .ogg/.opus` (mime auto-inferred).
- `audio_url` for clone must be **publicly reachable** — upload local files first.
- Supply `voice_name` when cloning so the UI shows a meaningful name rather than a raw provider ID.
- Writes notify open same-origin Voice Lab panels; history/voice lists also refresh on focus. No timeline insertion happens automatically.
- Check `history_id` / `cloned_voice_id` to confirm persistence. `persistence_error` explicitly identifies provider success with a failed library save. Preserve the successful output/voice ID and report the persistence failure; never blindly re-generate/re-clone.

## 2. List voices

```bash
# Preset (system) voices — no cloning needed, use immediately
curl -s "$API/api/bridge/voice/voices?voice_type=system" -H "$AUTH" \
  | python3 -c "import sys,json;[print(v['voice_id'],'—',(v.get('description') or [''])[0][:60]) for v in json.load(sys.stdin)['voices']]"

# Your cloned voices
curl -s "$API/api/bridge/voice/voices?voice_type=voice_cloning" -H "$AUTH" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print('cloned voices:',d['count']);[print(' ',v['voice_id']) for v in d['voices']]"
```

Well-known preset voices: `English_expressive_narrator` (British male, audiobook),
`English_radiant_girl` (American female). Always list first to get current ids.

## 3. Generate speech (voiceover) → add to timeline

```bash
# 1. Synthesize
OUT=$(curl -sX POST "$API/api/bridge/voice/generate" -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"text":"Welcome to ContentLead — your AI video editor.",
       "voice_id":"English_expressive_narrator","voice_name":"Narrator","speed":1.0,"format":"mp3"}')
URL=$(echo "$OUT" | python3 -c "import sys,json;print(json.load(sys.stdin)['audio_url'])")

# 2. Download into an allowed media dir (SAS URL — grab it now)
OUTFILE=~/Downloads/voiceover.mp3
curl -sfL "$URL" -o "$OUTFILE"

# 3. Inspect actual duration (fallback when duration_seconds is absent/invalid).
# Load cl-editor startup + audio-gain-eq before timeline editing.
DURATION_MS=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTFILE" \
  | python3 -c 'import sys,math; s=float(sys.stdin.read()); assert math.isfinite(s) and s>0; print(round(s*1000))')
# Set TAB_ID from GET /api/tabs; pick an existing audio track or create one explicitly.
curl -sX POST "$API/api/execute" -H "$AUTH" -H "Content-Type: application/json" \
  -d "$(python3 -c "import json;print(json.dumps({'type':'editor.addAudio','tabId':'$TAB_ID','params':{'src':'$OUTFILE','name':'Voiceover','trackName':'Narration','from':0,'duration':int('$DURATION_MS'),'volume':90}}))")"
# Verify item/timing from the response, then editor.save with the same tabId.
```

> Media server allowed dirs include `~/Downloads`, `~/Movies`, `~/Documents`,
> `~/Music`, `~/Codes`, etc. Save the mp3 there so the timeline can play it.
> Voiceover/narration volume guideline: **80–100** (see `remotion/rules/sfx-and-audio`).

**UI verification:** `GET /api/bridge/voice/history` must contain the returned
`history_id` with its text, voice name, URL and duration. The same record appears
under AI Generate → Voice → **History**, directly below **Latest generation** (both stay visible, no history tabs). `GET /api/bridge/voice/voices?voice_type=voice_cloning`
must contain the cloned ID/name shown under Clone voice. Listing and history are
read-only; generation, cloning and uncached preview consume credits. Do not use
paid operations as speculative health checks.

## 3a. Replace a video's voice in the editor sidebar

Video context menu **Replace voice...**, **Properties > Audio > Replace Voice**,
and a generated video's Replace voice action all open **AI > Voice** in the
right sidebar. This reuses Voice Lab's voice picker, generation controls and
history; it is not a separate modal or a second voice library.

- **Generate:** reuse the original transcript, choose a voice and explicitly
  generate WAV. This consumes generation allowance and saves to normal history.
- **Saved speech:** browse/search the paginated history and choose **Use this audio**.
- **Upload:** choose a local audio/video recording or a timeline audio/video clip.

Saved/uploaded speech must contain the same words and language. **Get transcript
text...** opens the original script; **Copy text** contains no timestamps.
Missing transcripts are transcribed only on explicit request, potentially
uploading the source and using plan allowance.

Under **Timing controls**, change the maximum stretch or add manual sync points
for drift around a word (for example after 4–5s). Match that word's onset in
the original and unaligned replacement, using seconds relative to each selected
window. Adding points switches from automatic acoustic matching to uniform
speed between point pairs. Start/end are implicit. Review with **Original /
Replaced**, **Loop from/to**, or **Last 3 seconds**, then explicitly Apply.
Changing timing settings needs only another local preview, not paid generation.
**Back to Voice** / **Resume voice replacement** preserves the session draft.

API: first `GET /api/timing-align/capabilities`. Manual points require
`supportsSyncPoints:true` and
`syncPointCoordinates:"selection-relative-milliseconds"`; otherwise update and
restart desktop. `POST /api/timing-align/run` accepts normal reference/new
sources and source-ms ranges, `outputVideo:true`, `verify:true`, `maxStretch`
(1–4), and optional `syncPoints`, e.g.
`[{"referenceTimeMs":4500,"newTimeMs":3500}]`. Maximum twelve strictly increasing
interior pairs. Poll `/api/timing-align/progress/:jobId`; use
`result.outputVideoUrl` only after a successful video result and explicit user
review. The picture is stream-copied; selected audio is replaced, not isolated
from music. Both selected speech windows must be 0.1–60s.

**Limits:** manual points are not automatic phonetic alignment. Extreme segment
ratios fail rather than silently moving points. Neither acoustic scores nor
lower stretch limits guarantee lip-sync or artifact-free audio. The previously
approved clip-specific native-speed-ending assembly is not this generic API.

**Sync choices and local retries:** the sidebar now offers Rhythm match,
Even pace, Speech-span fit, and Manual word points. Choose a mode, explicitly
create a preview, then compare; **Restore previous preview** recovers the prior
version. `alignmentMode` accepts `acoustic|uniform|speech-span|manual`; gate on
the desktop's `alignmentModes` capability. Speech-span uses audible energy
bounds, not recognized words; music/noise can affect it.

Comparison defaults to **side-by-side**, with a **Single view** toggle and
themed play/pause, seek and mute controls. **Fix ending** selects the last three
seconds and 1.15x pace. **Retry selected part** changes only the loop selection;
use **Finish sooner** for a delayed ending (below 1x would make it slower).
**Starts late / Starts early** shift earlier/later, adjustable in 50ms steps.
No paid speech is generated. **Undo last correction** restores the prior WAV.
Undo before comparing another correction to the same baseline.

Section API: require `supportsSectionRepair:true` and
`repairCoordinates:"selection-relative-milliseconds"`. Send the previous
preview's `outputPath` as `newPath`, the original reference/range, and e.g.
`repair:{"fromMs":5000,"toMs":8000,"speed":1.15,"offsetMs":0}`. Do not send
`newRangeMs`, sync points, or `alignmentMode` for this operation. Base:
duration-matching mono 48kHz PCM16 preview WAV. Speed 0.8–1.5; offset ±1000ms.
Outside-selection PCM is preserved; joins occur inside the selection.
Speech that would be shifted/cut outside the selection causes a visible error,
not silent truncation. Result must confirm `unchangedOutsideRepair:true`.
MP4 audio remains AAC-reencoded. Older running desktop services need a full
desktop restart; refreshing the web page is not sufficient.

## 3b. Remove silence / tighten dialogue — native timeline command (preferred) or offline Python

Raw TTS/cloned clips have dead air at the head/tail of each line and inconsistent
loudness. For punchy dialogue reels (brain-rot / Modi-vs-Rahul style), there are
now **two correct paths**:

> # ⚠️ ORDER IS NON-NEGOTIABLE ⚠️
> **Preferred in-app path:** PLACE RAW AUDIO → ADD CAPTIONS/LINKED VISUALS →
> `editor.removeSilence` with `cascadeLinkedTracks:true`.
>
> **Offline Python path:** PROCESS AUDIO → PLACE PROCESSED AUDIO → *THEN* CAPTION.
>
> Caption word timings are stored as **absolute timeline times**. If you use the
> Python script, **NEVER caption first and trim later** — every word after the first
> shifts earlier and the karaoke desyncs. If the audio is already on the timeline
> with captions/images, use `editor.removeSilence` instead; it splices the audio and
> automatically shifts linked tracks to stay in sync.

### 3b-1. Preferred: `editor.removeSilence` for audio already on the timeline

Use this when the audio/video item is already in the editor. It runs the app's
native silence detector and cut engine: detects internal silence in the item's
audio, then splices it out on the timeline. With `cascadeLinkedTracks:true`
(default), linked tracks — captions, character images, b-roll grouped with the
audio — are shifted automatically so everything stays synced.

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `itemId` | `string` | required | Audio or video timeline item to de-silence |
| `thresholdDbfs` | `number` | `-50` | Silence threshold in dBFS. Raise toward `-45` to catch soft breathy pauses; do not go above `-45` |
| `minSilenceMs` | `number` | `800` | Minimum silence length to cut. Lower = tighter; keep ≥ `120` |
| `mergeGapMs` | `number` | `200` | Merge nearby silent ranges before cutting |
| `mode` | `'remove'\|'split-only'` | `'remove'` | `remove` = splice out silence AND ripple-close the holes; `split-only` = just cut, leave pieces in place |
| `rippleScope` | `'all'\|'linked'\|'source'` | `'all'` | Which tracks shift left to stay in sync after a cut. `all` = every later item; `linked` = the clip's track + its link group; `source` = only the clip's own track. `cascadeLinkedTracks:false` is accepted as an alias for `source` |
| `apply` | `boolean` | `true` | `false` = dry run, no timeline mutation |
| `cuts` | `{sourceStart,sourceEnd}[]` | — | Two-step: apply these exact cuts and skip detection (e.g. cuts returned from a prior dry run, optionally reviewed) |

**How it works (two phases):** (1) it cuts the silent source spans out of the clip,
then (2) ripple-closes the resulting display holes and shifts every later item left by
the same cumulative delta. The **first clip is anchored** and **intentional gaps between
clips are preserved** — trimming one speaker's internal pauses slides the next speaker
left but keeps the turn-taking gap.

```bash
# Step 1 — dry run: returns the cut ranges WITHOUT touching the timeline
curl -sX POST "$API/api/execute" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"type":"editor.removeSilence","params":{"itemId":"audio_abc","apply":false,"thresholdDbfs":-45,"minSilenceMs":150,"mergeGapMs":120}}'

# Step 2a — apply (detects + splices + ripples every later item left to stay in sync)
curl -sX POST "$API/api/execute" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"type":"editor.removeSilence","params":{"itemId":"audio_abc","apply":true,"thresholdDbfs":-45,"minSilenceMs":150}}'

# Step 2b — OR apply exact reviewed cuts from the dry run (skips re-detection)
curl -sX POST "$API/api/execute" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"type":"editor.removeSilence","params":{"itemId":"audio_abc","apply":true,"cuts":[{"sourceStart":640,"sourceEnd":880}]}}'
```

Response `result` includes `{ applied, cutsApplied, rippledItemCount, rippleScope,
ranges:[{startMs,endMs,peakDbfs}], cuts:[{sourceStart,sourceEnd}], totalRemovedMs }`.
`apply:false` sets `applied:false` and mutates nothing. Every call is undoable
(`editor.undo`; a real remove = 2 history steps: cut + ripple-close).

### 3b-1a. ⏱️ Timing rules — don't over-trim, keep a light inter-speaker pause

**Don't over-trim (protect natural speech):**

- Flat/quiet stretches in a waveform are usually **soft real audio** — breaths, word
  tails, trailing vowels at roughly −40 to −45 dBFS — **not silence**. The waveform
  renderer scales to peak, so soft audio *looks* like empty gaps.
- Presets, gentlest → tightest:
  - `-50 dBFS / 800 ms` (**default**) — only true long dead air. Safest.
  - `-45 dBFS / 150 ms / mergeGap 120` — **recommended for punchy reels**; removes
    breathy inter-word pauses while keeping speech natural.
  - **Do NOT** raise the threshold above `-45 dBFS` or drop `minSilenceMs` below
    ~`120 ms` — you start clipping consonant/word tails and breaths → choppy, robotic
    speech. Leave ≥ ~120 ms of any real pause.
- If a clip was already run through `process_dialogue_audio.py --max-gap-ms …`, a
  default `editor.removeSilence` will report **0 removable** — that is **correct**,
  there is no dead air left. Don't crank the threshold just to "see something cut."

**Light pause between speakers (turn-taking):**

- Never butt one speaker's audio hard against the next. A turn change needs a short beat.
- Place each next line at `previousLineEnd + PAUSE`, with **PAUSE ≈ 120–200 ms**
  (~150 ms feels natural; ≤80 ms sounds rushed; >300 ms drags).
- `editor.removeSilence` **preserves** this gap: it anchors the first clip and only
  closes the silence windows it detected, so trimming speaker A's internal pauses
  ripples speaker B left **but keeps the turn-taking gap** (verified — an 80 ms
  Modi→Rahul gap survived a trim pass).
- To *standardize* the turn gap, trim first, then set it explicitly with
  `editor.moveItem` on the next clip (`from = prevEnd + 150`).

### 3b-2. Offline/pre-import option: `process_dialogue_audio.py`

Use the Python path only when preparing files **before** importing them into the
timeline. It remains useful for batch offline processing and loudness prep, but
the in-timeline "remove gaps" job should use `editor.removeSilence`.

This is a faithful port of the TlEditingSolution pipeline
(`AudioTrimmer.trim_silence` + `boost_audio.py`).

Script: [`scripts/process_dialogue_audio.py`](scripts/process_dialogue_audio.py)

What it does, in order: **trim** leading/trailing silence (thresh −40 dBFS,
min-silence 100 ms) → optionally **collapse** long internal pauses → **boost**
(+dB gain and/or peak normalize). Defaults mirror TlEditing: −40 dBFS / 100 ms,
**+13 dB**, normalize **on**.

```bash
# one-time: pip install pydub   (ffmpeg must be on PATH)

# process a single downloaded line in place (TlEditing defaults: trim + normalize + 13 dB)
python "$SKILLS/voice/scripts/process_dialogue_audio.py" ~/Downloads/voiceover.mp3

# gentler boost, write to a new file, no normalize
python "$SKILLS/voice/scripts/process_dialogue_audio.py" in.mp3 -o out.mp3 --boost-db 6 --no-normalize

# also shorten mid-line pauses longer than 350 ms
python "$SKILLS/voice/scripts/process_dialogue_audio.py" in.mp3 --max-gap-ms 350

# batch a whole folder of dialogue lines, in place
python "$SKILLS/voice/scripts/process_dialogue_audio.py" "~/Downloads/dialogue/*.mp3" --boost-db 13
```

Then `editor.addAudio` the **processed** file and caption from that processed
file. In-place runs write a one-time `.backup` next to the original. Run
`--help` for all flags.

> **Rule of thumb:** for multi-speaker dialogue reels, trim every line and boost to a
> consistent level so no speaker is quieter than another. Use `--max-gap-ms` only when
> a specific line drags; the head/tail trim alone already tightens most cuts.

## 4. Clone a voice

### 4a. From a local recording (one call)

```bash
curl -sX POST "$API/api/bridge/voice/upload-and-clone" -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"filePath":"/Users/you/Downloads/sample.wav",
       "demo_text":"This is the text spoken in my reference recording."}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print('new voice_id:',d.get('voice_id'));print('upload_url:',d.get('upload_url'))"
# Save the returned voice_id → use it in /generate.
```

- `voice_id` is optional; omit it and the backend auto-generates one (returned on success).
- If cloning fails, `upload_url` is still returned so you can retry `/clone` with a different id.
- Give **10–30s of clean, single-speaker audio** for best results; `demo_text` should match what's spoken.

### 4b. From an already-hosted URL

```bash
curl -sX POST "$API/api/bridge/voice/clone" -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"audio_url":"https://.../reference.mp3",
       "demo_text":"Text spoken in the reference audio."}' \
  | python3 -c "import sys,json;print('voice_id:',json.load(sys.stdin).get('voice_id'))"
```

### 4c. Upload only (get a public URL, clone later)

```bash
curl -sX POST "$API/api/bridge/voice/upload" -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"filePath":"/Users/you/Downloads/sample.wav"}'
# → { url, size_bytes, mime, file_name }  — feed url into /clone
```

Then generate with the new voice:

```bash
curl -sX POST "$API/api/bridge/voice/generate" -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"text":"Narration in my own cloned voice.","voice_id":"<cloned_voice_id>","format":"mp3"}'
```

## 5. Delete a cloned voice (frees a quota slot)

> ⚠️ **Irreversible + confirm first.** Cloned voices use a limited slot quota
> (e.g. 10 slots on the Starter Audio plan). Deleting retires the `voice_id`
> permanently — the provider will not accept it again. The bridge adds **no**
> extra confirmation. Always get explicit user go-ahead before calling this.

```bash
# RPC form
curl -sX POST "$API/api/bridge/voice/delete" -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"voice_id":"moss_audio_xxxxxxxx","voice_type":"voice_cloning"}'

# REST form
curl -sX DELETE "$API/api/bridge/voice/voices/moss_audio_xxxxxxxx?voice_type=voice_cloning" -H "$AUTH"
```

## 6. Typical workflows

**Narrated video from a script**
1. `GET /voices?voice_type=system` → pick a preset (or use a cloned id).
2. Split the script into ≤5000-char chunks; `POST /generate` per chunk.
3. Download each mp3 to `~/Downloads`; `editor.addAudio` sequentially (`from` = running offset).
4. `editor.reorderTracks` (audio below text, above video) → `editor.save`.

**Clone the creator's voice, then narrate**
1. `POST /upload-and-clone` with their recording → capture `voice_id`.
2. `POST /generate` with that `voice_id` for every line.
3. Add to timeline as above.

## 7. Errors & pitfalls

- **`unauthorized`** → use `Authorization: Bearer <token>` (plain token is rejected on these routes) and re-read `api.json` after any app restart.
- **Voice calls fail even with a token** → `cloud.authenticated` is false; the user must be signed into the ContentLead app (cookie auth).
- **`missing_audio_url` on clone** → the sample isn't public; run `/upload` (or `/upload-and-clone`) first.
- **`file_not_found` / `not_a_file`** → `filePath` must be an absolute path to an existing audio file.
- **`text_too_long`** → keep each `/generate` call ≤ 5000 chars; chunk longer scripts.
- **SAS URLs expire** → download the `audio_url` immediately; don't persist it in the design.
- **Voice bridge ≠ editor commands** → `/api/bridge/voice/*` for voice; `/api/execute` (`editor.addAudio`) to place audio on the timeline.

## 8. Cross-references

- `remotion/rules/sfx-and-audio` — voiceover volume levels, SFX, audio mixing.
- `contentlead/audio-gain-eq` — gain/EQ/ducking once the voiceover is on the timeline.
- `cl-ai-media/SKILL` — other AI media (image/text/transcription) via the desktop AI bridge.
