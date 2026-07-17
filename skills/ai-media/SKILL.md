---
name: ai-media
description: AI-powered media generation and analysis — image generation/analysis/search, text generation, asset re-hosting, and transcription (including speaker-diarized). Routed through the local SkillTown Desktop MCP proxy so no manual JWT setup is required. Use whenever you need to create, find, or analyze media assets for a ContentLead video.
tags: ai, media, image, generate, analyze, vision, text, transcribe, speakers, diarization, mcp, proxy, content
---

# AI Media Generation & Analysis (via Desktop Proxy)

> **MCP domain:** all tools in this skill are exposed on the MCP server under domain `prepwithai` (the backend service name) and prefixed `prepwithai_*`. Only the *skill folder* is named `ai-media` — the wire protocol is unchanged.

The backend runs on a **remote MCP server** (`mcp.prepwithai.in`). Talking to it directly requires a hand-copied JWT, an `x-user-id` header, and JSON-RPC framing. **Do not do that.**

Instead, every call in this skill goes through the local **SkillTown Desktop MCP proxy** — one HTTP POST, one bearer token, one JSON body. The proxy mints and refreshes the JWT for you from your Electron cookies, caches tool schemas, and normalises the response envelope.

> Full endpoint contract: `_EditingStyleDetails/_Agent/skills/contentlead/mcp-via-desktop.md`

## 0. Setup — one-time per shell

```bash
# Read desktop port + bearer token (auto-written by the running SkillTown Desktop app)
eval "$(node -e '
  const c = require(require("os").homedir()+"/.skilltown-desktop/api.json");
  console.log(`export API=http://127.0.0.1:${c.port}\nexport TOKEN=${c.token}`);
')"

# Sanity: proxy status — should show token.isFresh:true and knownDomains list
curl -sf "$API/api/mcp/status" -H "Authorization: Bearer $TOKEN" \
  | jq '{isFresh: .token.isFresh, expiresAt: .token.expiresAt, domains: .knownDomains, cached: .toolsCache.entries[].domain}'
```

If `~/.skilltown-desktop/api.json` doesn't exist, the desktop app isn't running — ask the user to launch it.

`/api/mcp/status` is also the best discovery endpoint: `knownDomains` lists every domain the proxy will accept, `aliases` documents shortcuts (e.g. `content` → `editor + storystudio`), and `metrics.callsByTool` tells you what's been used recently.

## 1. The one call shape you'll use everywhere

```bash
curl -sX POST "$API/api/mcp/call" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "prepwithai",
    "tool":   "prepwithai_<name>",
    "args":   { ... }
  }'
```

### Gotchas that will bite you if you skip this section

1. **Tool names include the domain prefix.** `prepwithai_health_check` — **not** `health_check`. The proxy passes the name verbatim to the remote MCP; unprefixed names return `Unknown tool`.
2. **Some args are JSON-encoded STRINGS, not real arrays/objects.** Any schema field described as *"JSON array of ..."* or *"JSON object with ..."* (e.g. `messages`, `variables`, `prompts`, `reference_images`, `initial_state`) must be a **stringified JSON** value. See `text_generate` example below.
3. **Response envelope:**
   ```json
   { "ok": true|false,
     "domain": "prepwithai",
     "tool":   "prepwithai_...",
     "content": { "result": "<usually another JSON string>" },
     "rawParts": [ { "type":"text", "text":"..." } ],
     "elapsedMs": 237 }
   ```
   - Successful text payloads land in `content.result` (often a JSON string — double-parse when needed).
   - Errors land in `content` as a plain string and `ok:false`.
   - Extract with: `jq -r '.content.result'` then `jq -r 'fromjson | .whatever'`.
4. **Assets return temporary Azure SAS URLs.** Download immediately or re-host via `prepwithai_asset_rehost` for a permanent URL.

## 2. Discover live schemas whenever unsure

Never guess field names — ask the proxy:

```bash
# All 23 prepwithai tools with full schemas
curl -sf "$API/api/mcp/tools?domain=prepwithai" \
  -H "Authorization: Bearer $TOKEN" | jq '.tools[] | {name, description, schema:.inputSchema}'

# Refresh cache after MCP server upgrade
curl -sf "$API/api/mcp/tools?domain=prepwithai&refresh=true" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
```

---

## 3. Tool inventory (23 tools, live-verified)

### 🎨 Images

| Tool | Purpose |
|------|---------|
| `prepwithai_image_generate` | Text → image (Gemini). Requires Gemini API key. |
| `prepwithai_image_generate_batch` | Batch of prompts, processed sequentially. |
| `prepwithai_image_compose` | 1–14 reference images + prompt → new composited image. |
| `prepwithai_image_search` | Stock images via Tavily. Requires Tavily API key. |
| `prepwithai_image_analyze` | GPT-4o Vision on an image URL. |
| `prepwithai_asset_rehost` | Copy any public URL into permanent Azure Blob (`passets`). |

**Aspect ratios:** `1:1`, `16:9`, `9:16`, `4:5`, `5:4`
**Styles:** `photorealistic`, `illustration`, `watercolor`, `cinematic digital art`, …

#### Full worked example — generate → download → add to editor timeline

```bash
# 1. Generate
OUT=$(curl -sX POST "$API/api/mcp/call" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"domain":"prepwithai","tool":"prepwithai_image_generate","args":{
        "prompt":"Futuristic AI workspace, holographic screens, purple neon",
        "aspect_ratio":"9:16",
        "style":"cinematic digital art"
      }}')
URL=$(echo "$OUT" | jq -r '.content.result | fromjson | .image_url')

# 2. Download locally (SAS URL — expires!)
IMG=$(mktemp -t aibg).png
curl -sfL "$URL" -o "$IMG"

# 3. Add to editor timeline (direct /api/execute — NOT via MCP proxy)
curl -sX POST "$API/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$(jq -n --arg s "$IMG" '{type:"editor.addImage",params:{src:$s,name:"AI Background",from:0,duration:5000}}')"
```

> Editor commands (`editor.*`) go through `/api/execute`, NOT MCP. See `contentlead/*.md`.

### 🎬 Video frame analysis (ffmpeg + `image_analyze`)

Content-aware editing pattern — extract frames, analyse them, generate matching scenes.

```bash
# 1. Extract frames at 25/50/75% of duration
ffmpeg -ss 5  -i /path/video.mp4 -frames:v 1 -q:v 2 /tmp/frame-a.jpg -y
ffmpeg -ss 15 -i /path/video.mp4 -frames:v 1 -q:v 2 /tmp/frame-b.jpg -y

# 2a. Analyse locally with the `view` tool (free, no upload) — preferred for the AI.
# 2b. OR re-host and analyse remotely:
PUB=$(curl -sX POST "$API/api/mcp/call" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"domain":"prepwithai","tool":"prepwithai_asset_rehost","args":{"url":"https://…/frame.jpg"}}' \
  | jq -r '.content.result | fromjson | .public_url')

curl -sX POST "$API/api/mcp/call" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$(jq -n --arg u "$PUB" '{domain:"prepwithai",tool:"prepwithai_image_analyze",args:{prompt:"Describe this frame in 20 words",image_url:$u,detail_level:"high"}}')"
```

Frame-extraction defaults: short clip (<30 s) → 5 s / 15 s / 25 s; long clip → 10 s / 30 s / 50 s.

### ✍️ Text

| Tool | Purpose |
|------|---------|
| `prepwithai_text_generate` | Free-form GPT-4o chat (`messages` is a **JSON-encoded string**). |
| `prepwithai_text_generate_from_template` | Predefined templates (`linkedin-post`, `content-title`, `content-description`, `content-title-description`, `instagram-caption`, `short-summary`, `seo-metadata`). |
| `prepwithai_text_list_templates` | List all template keys. |
| `prepwithai_text_template_info` | Full template details incl. system/user prompts and required variables. |

#### `text_generate` — note the JSON-in-string arg

```bash
curl -sX POST "$API/api/mcp/call" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"domain":"prepwithai","tool":"prepwithai_text_generate","args":{
        "messages":"[{\"role\":\"system\",\"content\":\"You are a caption writer.\"},{\"role\":\"user\",\"content\":\"3-word tagline for an AI editor.\"}]",
        "model":"gpt-4o",
        "temperature":0.7,
        "max_tokens":40
      }}' | jq -r '.content.result | fromjson | .message'
```

#### `text_generate_from_template`

```bash
curl -sX POST "$API/api/mcp/call" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"domain":"prepwithai","tool":"prepwithai_text_generate_from_template","args":{
        "template_key":"linkedin-post",
        "variables":"{\"topic\":\"AI-powered video editing\",\"key_points\":\"speed, style consistency, zero setup\",\"audience\":\"content creators\",\"tone\":\"punchy\"}"
      }}'
```

### 🎙️ Transcription (Whisper via PrepWithAI)

| Tool | Use for |
|------|---------|
| `prepwithai_transcribe_short` | ≤ 90 s and ≤ 25 MB. Synchronous. Returns word/segment timestamps + SRT. |
| `prepwithai_transcribe_long`  | Longer files. Chunked; **auto-tracked as a job** — see [job tracking](#-job-tracking) below. |
| `prepwithai_transcribe_with_speakers` | Speaker-diarized (hybrid Whisper + GPT-4o). Returns `speakerTranscript.{dialogue[], words[]}`. |
| `prepwithai_transcribe_retry` | Retry failed chunks (`retry_mode`: `failed` / `all` / `segment`). |

30+ languages auto-detected. Optional `translate_to_english`.

```bash
# Short clip
curl -sX POST "$API/api/mcp/call" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"domain":"prepwithai","tool":"prepwithai_transcribe_short","args":{
        "video_url":"https://…/clip.mp4"
      }}' | jq -r '.content.result | fromjson | {text, srt, segments:(.segments|length)}'

# Long clip — fire and forget, tracker handles the rest
RESP=$(curl -sX POST "$API/api/mcp/call" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"domain":"prepwithai","tool":"prepwithai_transcribe_long","args":{
        "audio_url":"https://…/podcast.mp3",
        "content_id":"content_<your-id>",
        "granularity":"word",
        "num_passes":1
      }}')
JOB=$(echo "$RESP" | jq -r .trackingUrl)   # /api/jobs/<process_id>
# Wait for completion via cached snapshot (0 ms — no external hit)
until [ "$(curl -s $API$JOB -H "Authorization: Bearer $TOKEN" | jq -r .status)" = "complete" ]; do sleep 5; done
# Read the transcript from the cache
curl -s $API$JOB -H "Authorization: Bearer $TOKEN" \
  | jq '.snapshot.result | {full_text, words: .complete_transcription.words}'

# Retry any failed chunks
PID=$(echo "$RESP" | jq -r '.content.result | fromjson | .process_id')
curl -sX POST "$API/api/mcp/call" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$(jq -n --arg p "$PID" '{domain:"prepwithai",tool:"prepwithai_transcribe_retry",args:{audio_url:"https://…/podcast.mp3",process_id:$p,retry_mode:"failed",content_id:"content_<your-id>"}}')"
```

#### 🔔 Job tracking

Any tool that returns `{process_id, firebase_path}` (currently only
`prepwithai_transcribe_long` and `_retry`) is **automatically registered** with
the desktop's job tracker. The response includes a `trackingUrl` you can hit
for the cached snapshot — no Firebase auth, no polling of external services.

| Endpoint | Purpose |
|---|---|
| `GET /api/jobs` | List all tracked jobs (`?status=in_progress\|complete\|failed\|stale`) |
| `GET /api/jobs/:id` | Cached snapshot (progress, chunks, result) — served in <1 ms |
| `GET /api/jobs/:id/stream` | SSE stream of live updates for reactive UI/CLI |
| `POST /api/jobs/subscribe` | Manually track any Firebase path `{kind, firebase_path}` |
| `DELETE /api/jobs/:id` | Unsubscribe + drop cache |

The desktop opens ONE persistent Firebase SSE upstream per job and pushes
changes into memory as they arrive (~50 ms after the backend writes). Jobs
auto-complete on `result.status === "success"` or `progress.percentage >= 100`.
Same pattern generalizes to any future async job that writes to Firebase.

### 🛠️ Utility

| Tool | Purpose |
|------|---------|
| `prepwithai_health_check` | Backend heartbeat — quick sanity check that the PrepWithAI backend is up. |
| `prepwithai_asset_rehost` | Any public URL → permanent Azure Blob URL. Use before analysing or before referencing an asset that has a SAS token. |

```bash
curl -sX POST "$API/api/mcp/call" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"domain":"prepwithai","tool":"prepwithai_health_check","args":{}}' \
  | jq -r '.content.result'
```

---

## 4. Content-aware video editing pattern

The single most valuable use of this skill is combining **analysis + generation**:

1. **Extract** representative frames from the source video (`ffmpeg`).
2. **Understand** each frame — prefer the local `view` tool (free); fall back to `prepwithai_image_analyze` when the AI can't see the file.
3. **Generate** matching content:
   - Titles/descriptions → `prepwithai_text_generate_from_template`
   - Backgrounds / B-roll → `prepwithai_image_generate` (or search stock via `prepwithai_image_search`)
   - Long transcripts → `prepwithai_transcribe_long`
4. **Attach** every generated asset to the timeline via `/api/execute` (`editor.addImage`, `editor.addText`, …). See `contentlead/*.md`.

---

## 5. Cross-references

- `contentlead/mcp-via-desktop.md` — full proxy protocol (mint/refresh/status/tools/call endpoints, error codes, retry semantics)
- `contentlead/*.md` — editor commands (all `editor.*` and `scene.*` go through `/api/execute`, not MCP)
- `content-inspiration/` — web/scraping/news domains for research inputs
- `content-publishing/` — Instagram/LinkedIn/YouTube tools (their own MCP domains)

## 6. Cheat sheet — every prepwithai tool as one curl

```bash
POST $API/api/mcp/call
  Authorization: Bearer $TOKEN
  { "domain":"prepwithai", "tool":"prepwithai_<NAME>", "args": {...} }
```

`prepwithai_health_check · text_generate · text_generate_from_template · text_list_templates · text_template_info · image_generate · image_generate_batch · image_search · image_compose · image_analyze · asset_rehost · transcribe_short · transcribe_long · transcribe_retry`

## 7. Notes & pitfalls

- **Editor commands are NOT MCP tools.** Use `/api/execute` for `editor.*`, `scene.*`, `ui.*`. Only remote AI capabilities live in prepwithai/MCP.
- **API keys** — `image_generate` needs Gemini; `image_search` needs Tavily. Manage via the `web` (a.k.a. `psearch`) domain: `apikey_status`, `apikey_update`, `apikey_delete`, `apikey_list_services`.
- **SAS-token URLs expire** — always download or `asset_rehost` before persisting.
- **JSON-in-string args** — `messages`, `variables`, `prompts`, `reference_images`, `initial_state`.
- **Prefix rule** — tool names are `prepwithai_*` end-to-end; the domain field is not a substitute for the prefix.
- **Refresh** — if a new tool was added upstream: `GET /api/mcp/tools?domain=prepwithai&refresh=true`.
