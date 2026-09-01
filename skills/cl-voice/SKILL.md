---
name: cl-voice
description: Voice cloning + text-to-speech for ContentLead. Clone a voice from a local or hosted audio sample, generate speech (voiceover/narration) from any cloned or preset voice, list/delete voices, then drop the audio onto the timeline. Routed through the local SkillTown Desktop voice bridge (/api/bridge/voice/*) using the signed-in user's cookies — no manual JWT or API secret needed.
tags: voice, tts, text-to-speech, clone, cloning, voiceover, narration, speech, audio, bridge, minimax
---

# Voice Cloning & Text-to-Speech (via Desktop Bridge)

> **⚙️ Is the ContentLead app running?** These calls need `~/.skilltown-desktop/api.json`. If it is missing, the desktop app is not running — start it, then wait ~30s for the file: **macOS** `open -a "ContentLead"` · **Windows (PowerShell)** `Start-Process "$env:LOCALAPPDATA\Programs\ContentLead\ContentLead.exe"`. Full OS-aware detect/start/poll (Linux + dev too): see `cl-editor/infrastructure.md` → "Ensure the ContentLead desktop app is running". Only ask the user if it still does not come up.

Clone a voice, synthesize narration, and add it to the timeline — all through the
local SkillTown Desktop **voice bridge**. Every call is a single HTTP request with
one bearer token. The bridge forwards to the SkillTown `/api/ai/*` proxy, which
authenticates from your Electron cookies and injects the backend secret
server-side. **No hand-copied JWT, no RPC framing, no local secrets.**

> These are the REAL, live-verified endpoints. The old `prepwithai_speech_*`
> tool names are **not** the supported path — use `/api/bridge/voice/*` below.

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
| `GET`  | `/api/bridge/voice/voices` | `?voice_type=all\|system\|voice_cloning` | `{ voices:[{voice_id, voice_name, voice_type, created_time, description}], count }` |
| `POST` | `/api/bridge/voice/generate` | `{ text, voice_id, speed?, format? }` | `{ status, audio_url, format, duration_seconds }` |
| `POST` | `/api/bridge/voice/upload` | `{ filePath }` (absolute local audio path) | `{ url, size_bytes, mime, file_name }` |
| `POST` | `/api/bridge/voice/clone` | `{ audio_url, voice_id?, demo_text? }` | `{ status, voice_id, details }` |
| `POST` | `/api/bridge/voice/upload-and-clone` | `{ filePath, voice_id?, demo_text? }` | `{ status, voice_id, upload_url, details }` |
| `POST` | `/api/bridge/voice/delete` | `{ voice_id, voice_type? }` | `{ status, voice_id, created_time }` |
| `DELETE` | `/api/bridge/voice/voices/:voice_id` | `?voice_type=voice_cloning` | `{ status, voice_id, created_time }` |

Notes:
- `voice_type` defaults: list → `all`; delete → `voice_cloning`.
- `format` accepts `mp3` (default) / `wav` / etc.; `audio_format` is also accepted as an alias.
- `speed` is a multiplier (`1.0` = normal).
- `text` must be **≤ 5000 characters** per generate call.
- Cloning input accepts `.wav .mp3 .m4a .flac .aac .ogg/.opus` (mime auto-inferred).
- `audio_url` for clone must be **publicly reachable** — upload local files first.

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
       "voice_id":"English_expressive_narrator","speed":1.0,"format":"mp3"}')
URL=$(echo "$OUT" | python3 -c "import sys,json;print(json.load(sys.stdin)['audio_url'])")

# 2. Download into an allowed media dir (SAS URL — grab it now)
OUTFILE=~/Downloads/voiceover.mp3
curl -sfL "$URL" -o "$OUTFILE"

# 3. Add to the timeline (editor command → /api/execute, NOT the voice bridge)
curl -sX POST "$API/api/execute" -H "$AUTH" -H "Content-Type: application/json" \
  -d "$(python3 -c "import json,os;print(json.dumps({'type':'editor.addAudio','params':{'src':os.path.expanduser('$OUTFILE'),'name':'Voiceover','from':0,'volume':90}}))")"
```

> Media server allowed dirs include `~/Downloads`, `~/Movies`, `~/Documents`,
> `~/Music`, `~/Codes`, etc. Save the mp3 there so the timeline can play it.
> Voiceover/narration volume guideline: **80–100** (see `remotion/rules/sfx-and-audio`).

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
