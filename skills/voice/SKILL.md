---
name: voice
description: Voice cloning + text-to-speech for ContentLead. Clone a voice from a local or hosted audio sample, generate speech (voiceover/narration) from any cloned or preset voice, list/delete voices, then drop the audio onto the timeline. Routed through the local SkillTown Desktop voice bridge (/api/bridge/voice/*) using the signed-in user's cookies — no manual JWT or API secret needed.
tags: voice, tts, text-to-speech, clone, cloning, voiceover, narration, speech, audio, bridge, minimax
---

# Voice Cloning & Text-to-Speech (via Desktop Bridge)

Clone a voice, synthesize narration, and add it to the timeline — all through the
local SkillTown Desktop **voice bridge**. Every call is a single HTTP request with
one bearer token. The bridge forwards to the SkillTown `/api/ai/*` proxy, which
authenticates from your Electron cookies and injects the backend secret
server-side. **No hand-copied JWT, no MCP framing, no local secrets.**

> These are the REAL, live-verified endpoints. The old `prepwithai_speech_*` MCP
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
ask the user to launch it.

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
- `ai-media/SKILL` — other AI media (image/text/transcription) via the desktop MCP proxy.
