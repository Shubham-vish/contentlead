---
name: ai-media
description: AI-powered media generation and analysis — image search/generation/compose/analyze (vision), text generation, asset re-hosting, and transcription (short, long, speaker-diarized). Routed through the local SkillTown Desktop AI bridge (/api/bridge/ai/*) so there is no MCP server, no manual JWT, and no API keys in the request. Use whenever you need to create, find, or analyze media assets for a ContentLead video.
tags: ai, media, image, generate, analyze, vision, text, transcribe, speakers, diarization, bridge, content
---

# AI Media Generation & Analysis (via Desktop AI Bridge)

Every capability in this skill is a **plain HTTP POST** to the local SkillTown
Desktop app under `/api/bridge/ai/*`. There is **no MCP server** and **no
JSON-RPC framing** — just one bearer token and one real JSON body.

**How the auth + keys work (you don't manage any of it):**

```
CLI/agent ──POST /api/bridge/ai/*──▶ SkillTown Desktop
              (Bearer token)              │ attaches signed-in-user cookies
                                          ▼
                              SkillTown  /api/ai/<endpoint>
                                          │ • getUser() from cookies
                                          │ • injects PREPWITHAI_API_SECRET
                                          │ • injects YOUR per-user Tavily/Gemini
                                          │   key from your account settings
                                          ▼
                              api.prepwithai.in/api/<endpoint>
```

You never copy a JWT, never send `x-user-id`, and **never put a Tavily or Gemini
key in the body** — the SkillTown proxy resolves your per-user key server-side
from your account (Settings → Image Search / Image Generation). If a key is
missing you'll get a clear error telling you to set it there.

> **Migrated from MCP:** this skill previously used `POST /api/mcp/call` with
> stringified-JSON args and `prepwithai_*` tool names. That path is **gone**.
> Args are now real JSON arrays/objects, responses are the backend JSON
> directly (single parse — no `content.result` double-decode).

## 0. Setup — one-time per shell

```bash
# Read desktop port + bearer token (auto-written by the running SkillTown Desktop app)
eval "$(node -e '
  const c = require(require("os").homedir()+"/.skilltown-desktop/api.json");
  console.log(`export API=http://127.0.0.1:${c.port}\nexport TOKEN=${c.token}`);
')"

# Sanity: desktop is up and you are authenticated
curl -sf "$API/api/health" -H "Authorization: Bearer $TOKEN" | jq '{status, cloud}'
```

If `~/.skilltown-desktop/api.json` doesn't exist, the desktop app isn't running — ask the user to launch it.

**Every** call below uses `Authorization: Bearer $TOKEN` (the plain token
without `Bearer` is rejected on bridge routes).

## 1. The one call shape you'll use everywhere

```bash
curl -sX POST "$API/api/bridge/ai/<group>/<action>" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ...real JSON... }'
```

- **Response is the backend JSON directly.** e.g. image search → `{ "images": [...] }`.
  On error → `{ "error": "...", "message": "...", "details": {...} }` with a non-2xx status.
- **Assets return temporary Azure SAS URLs.** Download immediately, or re-host via
  `asset/rehost` for a permanent URL before persisting into a project.

---

## 2. Route inventory

| Route | Backend | Purpose |
|-------|---------|---------|
| `POST /api/bridge/ai/image/search` | `search_images` | Stock images via Tavily. Per-user Tavily key injected. |
| `POST /api/bridge/ai/image/generate` | `process_image` | Text → image (Gemini). Per-user Gemini key injected. |
| `POST /api/bridge/ai/image/compose` | `compose_image` | 1–14 reference images + prompt → composited image. |
| `POST /api/bridge/ai/image/analyze` | `analyze_image` | GPT-4o Vision on an image URL or base64. |
| `POST /api/bridge/ai/text/generate` | `text_completion` | Free-form GPT chat / structured output. |
| `POST /api/bridge/ai/sfx/search` | `sfx/search` | Semantic sound-effects search (1000+ catalog). |
| `GET /api/bridge/ai/sfx/categories` | `sfx/categories` | List SFX categories/subcategories + counts. |
| `GET /api/bridge/ai/sfx/quick-picks` | `sfx/quick-picks` | Curated quick-pick SFX. |
| `POST /api/bridge/ai/sfx/select` | `select_and_time_sfx` | AI selects + times SFX for a sentence/decision. |
| `POST /api/bridge/ai/transcribe/short` | `transcribe_short_video` | ≤ 90 s / ≤ 25 MB. Sync. Words + SRT. |
| `POST /api/bridge/ai/transcribe/long` | `analyze_audio` | Long files, chunked/async (job). |
| `POST /api/bridge/ai/transcribe/speakers` | `transcribe_with_speakers` | Speaker-diarized transcript. |
| `POST /api/bridge/ai/asset/rehost` | `upload_asset` | Any public URL → permanent Azure Blob. |

---

## 3. 🎨 Images

**Aspect ratios:** `1:1`, `16:9`, `9:16`, `4:5`, `5:4`
**Styles:** `photorealistic`, `illustration`, `watercolor`, `cinematic digital art`, …

### Search stock images (Tavily)

```bash
curl -sX POST "$API/api/bridge/ai/image/search" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"steaming cup of masala chai on a wooden table","max_results":5}' \
  | jq '.images[] | {url, description}'
```

Defaults applied by the bridge: `provider:"tavily"`, `max_results:5`,
`include_descriptions:true`. Override any by including it in the body.

### Generate an image (Gemini) → download → add to timeline

```bash
# 1. Generate — bridge defaults operation:"generate", provider:"gemini",
#    store_in_azure:true, so you get a durable Azure URL back.
URL=$(curl -sX POST "$API/api/bridge/ai/image/generate" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"prompt":"Futuristic AI workspace, holographic screens, purple neon",
       "aspect_ratio":"9:16","style":"cinematic digital art"}' \
  | jq -r '.image_url // .azure_url // .url')

# 2. Download locally (SAS URL — may expire)
IMG=$(mktemp -t aibg).png
curl -sfL "$URL" -o "$IMG"

# 3. Add to editor timeline (direct /api/execute — NOT a bridge/ai call)
curl -sX POST "$API/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$(jq -n --arg s "$IMG" '{type:"editor.addImage",params:{src:$s,name:"AI Background",from:0,duration:5000}}')"
```

> Editor commands (`editor.*`, `scene.*`) go through `/api/execute`, NOT the AI
> bridge. See `contentlead/*.md`.

### Compose from reference images

```bash
curl -sX POST "$API/api/bridge/ai/image/compose" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"prompt":"Put the product on a marble kitchen counter, morning light",
       "reference_images":["https://…/product.png","https://…/kitchen.jpg"],
       "aspect_ratio":"1:1"}' \
  | jq -r '.image_url'
```

`reference_images` is a **real JSON array** (no stringification).

### Analyze an image (GPT-4o Vision)

```bash
curl -sX POST "$API/api/bridge/ai/image/analyze" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"prompt":"Describe this frame in 20 words","image_url":"https://…/frame.jpg","detail_level":"high"}' \
  | jq -r '.analysis // .result // .message'
```

Provide **either** `image_url` **or** `base64_image` (plus `prompt`).

### 🎬 Video frame analysis (ffmpeg + analyze)

```bash
# 1. Extract frames at representative timestamps
ffmpeg -ss 5  -i /path/video.mp4 -frames:v 1 -q:v 2 /tmp/frame-a.jpg -y
ffmpeg -ss 15 -i /path/video.mp4 -frames:v 1 -q:v 2 /tmp/frame-b.jpg -y

# 2a. Prefer the local `view` tool to read the frame (free, no upload).
# 2b. OR re-host + analyze remotely:
PUB=$(curl -sX POST "$API/api/bridge/ai/asset/rehost" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"url":"https://…/frame.jpg"}' | jq -r '.public_url // .url')

curl -sX POST "$API/api/bridge/ai/image/analyze" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$(jq -n --arg u "$PUB" '{prompt:"Describe this frame in 20 words",image_url:$u,detail_level:"high"}')"
```

Frame-extraction defaults: short clip (<30 s) → 5 s / 15 s / 25 s; long clip → 10 s / 30 s / 50 s.

---

## 4. ✍️ Text

`text/generate` takes a **real `messages` array** (no stringification). Use a
system message for role/format control, and `output_schema` (or
`response_format`) for structured JSON.

```bash
curl -sX POST "$API/api/bridge/ai/text/generate" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
        "messages":[
          {"role":"system","content":"You are a caption writer."},
          {"role":"user","content":"3-word tagline for an AI editor."}
        ],
        "temperature":0.7,
        "max_tokens":40
      }' | jq -r '.message // .text // .content'
```

Structured output (e.g. for the B-roll planner in `dialogue-broll`):

```bash
curl -sX POST "$API/api/bridge/ai/text/generate" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
        "messages":[{"role":"user","content":"For this dialogue, output image search plans as JSON."}],
        "output_schema":{"type":"object","properties":{"plans":{"type":"array"}}}
      }'
```

> **Text templates gone with MCP.** The old `text_generate_from_template` /
> `text_list_templates` tools were MCP-only convenience wrappers. Reproduce them
> by putting the same instruction in a `system` message here (e.g. "Write a
> LinkedIn post about {topic} for {audience}, tone: {tone}"). No separate
> template endpoint is needed.

---

## 5. 🎙️ Transcription (Whisper via PrepWithAI)

| Route | Use for |
|-------|---------|
| `transcribe/short` | ≤ 90 s and ≤ 25 MB. Synchronous. Returns word/segment timestamps + SRT. |
| `transcribe/long`  | Longer files. Chunked/async — returns `{process_id, firebase_path}`. |
| `transcribe/speakers` | Speaker-diarized (Whisper + GPT-4o). Returns `speakerTranscript.{dialogue[], words[]}`. |

30+ languages auto-detected. Optional `translate_to_english`.

```bash
# Short clip — synchronous
curl -sX POST "$API/api/bridge/ai/transcribe/short" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"video_url":"https://…/clip.mp4"}' \
  | jq -r '{text, srt, segments:(.segments|length)}'

# Speaker-diarized
curl -sX POST "$API/api/bridge/ai/transcribe/speakers" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"video_url":"https://…/podcast.mp4"}' \
  | jq '.speakerTranscript | {speakers:(.dialogue|group_by(.speaker)|length), lines:(.dialogue|length)}'
```

### Long transcription + job tracking

```bash
# Fire the long job
RESP=$(curl -sX POST "$API/api/bridge/ai/transcribe/long" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"audio_url":"https://…/podcast.mp3","content_id":"content_<your-id>","granularity":"word","num_passes":1}')
PID=$(echo "$RESP"  | jq -r '.process_id')
FBP=$(echo "$RESP"  | jq -r '.firebase_path')

# Subscribe the desktop job tracker to the Firebase progress path, then poll the
# cached snapshot (<1 ms, no external hit, no Firebase auth).
JOB=$(curl -sX POST "$API/api/jobs/subscribe" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$(jq -n --arg p "$FBP" '{kind:"transcription",firebase_path:$p}')" | jq -r '.trackingUrl')

until [ "$(curl -s "$API$JOB" -H "Authorization: Bearer $TOKEN" | jq -r .status)" = "complete" ]; do sleep 5; done
curl -s "$API$JOB" -H "Authorization: Bearer $TOKEN" \
  | jq '.snapshot.result | {full_text, words: .complete_transcription.words}'
```

#### Job tracking endpoints

| Endpoint | Purpose |
|---|---|
| `POST /api/jobs/subscribe` | Track any Firebase path `{kind, firebase_path}` → `{trackingUrl}` |
| `GET /api/jobs` | List tracked jobs (`?status=in_progress\|complete\|failed\|stale`) |
| `GET /api/jobs/:id` | Cached snapshot (progress, chunks, result) — <1 ms |
| `GET /api/jobs/:id/stream` | SSE stream of live updates |
| `DELETE /api/jobs/:id` | Unsubscribe + drop cache |

The desktop opens ONE persistent Firebase SSE upstream per job and pushes
changes into memory (~50 ms after the backend writes). Jobs auto-complete on
`result.status === "success"` or `progress.percentage >= 100`.

---

## 5b. 🔊 Sound effects (SFX)

Semantic search over a 1000+ SFX catalog, plus AI auto-selection/timing. SFX
run on backend service keys — no per-user key needed.

```bash
# Browse the catalog
curl -s "$API/api/bridge/ai/sfx/categories" -H "Authorization: Bearer $TOKEN" | jq '.data.categories'

# Semantic search
curl -sX POST "$API/api/bridge/ai/sfx/search" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"dramatic cinematic boom","top_k":5,"category":"impacts","energy":"high","max_duration":3}' \
  | jq '.data.results[] | {name, sfx_url, duration, category}'
```

Filters: `category`, `energy` (low/medium/high), `mood`, `min_duration`,
`max_duration`, `top_k`. Results are SAS-signed for immediate download.

`POST /api/bridge/ai/sfx/select` (AI select + time) takes a sentence + its
timed decisions and returns the best-fit SFX aligned to those moments — the
same engine TlEditingSolution uses for auto-SFX. Then add each hit to the
timeline as audio via `editor.addAudio` (`/api/execute`; see `audio-gain-eq`).

---

## 6. 🛠️ Asset re-hosting

Temporary SAS-token URLs expire. Copy any public URL into permanent Azure Blob
(`passets`) before persisting or referencing it long-term:

```bash
curl -sX POST "$API/api/bridge/ai/asset/rehost" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"url":"https://…/temp-sas-image.png"}' | jq -r '.public_url // .url'
```

---

## 7. Content-aware video editing pattern

The single most valuable use of this skill is combining **analysis + generation**:

1. **Extract** representative frames from the source video (`ffmpeg`).
2. **Understand** each frame — prefer the local `view` tool (free); fall back to
   `image/analyze` when the AI can't see the file.
3. **Generate** matching content:
   - Titles/descriptions → `text/generate` (system-prompt as template)
   - Backgrounds / B-roll → `image/generate`, or search stock via `image/search`
   - Long transcripts → `transcribe/long`
4. **Attach** every generated asset to the timeline via `/api/execute`
   (`editor.addImage`, `editor.addText`, …). See `contentlead/*.md`.

For dialogue-driven B-roll (decide → source → pick → align → place), load the
**`dialogue-broll`** skill — it orchestrates this skill's routes per line of
dialogue.

---

## 8. Notes & pitfalls

- **Editor commands are NOT bridge/ai routes.** Use `/api/execute` for `editor.*`,
  `scene.*`, `ui.*`. Only remote AI capabilities live under `/api/bridge/ai/*`.
- **Never send API keys in the body.** The SkillTown proxy injects your per-user
  Tavily (search) / Gemini (generate/compose) key server-side. If you get
  `missing key`, set it in the SkillTown app → Settings → Image Search / Image
  Generation, then retry.
- **Args are real JSON.** `messages`, `reference_images`, `output_schema` are
  arrays/objects — do NOT stringify them (that was an MCP-only quirk).
- **SAS-token URLs expire** — always download or `asset/rehost` before persisting.
- **`Bearer` prefix required** on bridge routes.

## 9. Cross-references

- `contentlead/*.md` — editor commands (all `editor.*` / `scene.*` via `/api/execute`)
- `dialogue-broll/` — dialogue-driven B-roll orchestration (uses these routes)
- `content-inspiration/` — web/scraping/news research inputs
- `content-publishing/` — Instagram/LinkedIn/YouTube publishing
