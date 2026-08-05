---
name: desktop-bridge-routes
description: Use the SkillTown-Desktop local API and desktop bridge routes for AI media, voice, transcription, content, publishing, context, hub, inspiration, downloads, and related workflows.
tags: desktop-bridge, local-api, transcribe, prepwithai, learn, tools, discovery, proxy, token
---

# Desktop Bridge and Local API Routes

Use the SkillTown-Desktop local HTTP API instead of remote tool proxies. The desktop app reuses the signed-in browser session and exposes JSON endpoints on localhost.

## Auth pattern

Read the current port and bearer token before every session because both can change when the app restarts:

```bash
API=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['port'])")
TOKEN=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -s "http://127.0.0.1:$PORT/api/health" \
  -H "Authorization: Bearer $TOKEN"
```

Bridge calls use the same header:

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/ai/text/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write a short hook for a productivity reel"}'
```

## Route map

| Capability | Local endpoint |
|---|---|
| AI image generation | `POST /api/bridge/ai/image/generate` |
| AI image search | `POST /api/bridge/ai/image/search` |
| AI image composition | `POST /api/bridge/ai/image/compose` |
| AI image analysis / vision | `POST /api/bridge/ai/image/analyze` |
| Asset rehost | `POST /api/bridge/ai/asset/rehost` |
| AI text generation | `POST /api/bridge/ai/text/generate` |
| Voice generation | `POST /api/bridge/voice/generate` |
| Voice cloning | `POST /api/bridge/voice/clone` |
| Voice deletion | `POST /api/bridge/voice/delete` |
| Short transcription | `POST /api/bridge/ai/transcribe/short` |
| Long transcription | `POST /api/bridge/ai/transcribe/long` |
| Speaker transcription | `POST /api/bridge/ai/transcribe/speakers` |
| Sound effects | `/api/bridge/ai/sfx/*` |
| Context store | `/api/bridge/context/*` |
| Learn / knowledge base | `/api/bridge/learn/*` |
| Creator hub | `/api/bridge/hub/:handle/*` |
| Inspiration | `/api/bridge/inspiration/*` |
| Media download | `POST /api/bridge/media/download` |
| Create content | `POST /api/content/create` |
| Update content lifecycle fields | `PUT /api/bridge/content/:id` |
| List content | `GET /api/bridge/content` |
| Configure publishing | `POST /api/bridge/content/configure-publish` |
| Instagram publishing and account flows | `/api/bridge/instagram/*` |
| YouTube publishing | `/api/bridge/youtube/*` |
| Web search | Use CLI-native web search/fetch tools |
| GitHub code/repo operations | Use CLI-native GitHub tools or local git commands |

Do not invent endpoint names. If a needed route is not listed here or in `GET /api/capabilities`, use the documented CLI-native tool for that area or report the gap.

## Common calls

### Transcribe a clip

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/ai/transcribe/short" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"video_url":"https://example.com/clip.mp4"}'
```

Long transcription returns job metadata; subscribe through the local jobs endpoint when a Firebase path is returned:

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/ai/transcribe/long" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"audio_url":"https://example.com/audio.m4a","content_id":"content_abc"}'

curl -s -X POST "http://127.0.0.1:$PORT/api/jobs/subscribe" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kind":"transcription","firebase_path":"<path from previous response>"}'
```

Use `POST /api/bridge/ai/transcribe/speakers` with `{ "video_url": "..." }` for speaker-tagged output.

### Generate text

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/ai/text/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write 5 punchy lower-third captions for a creator economy video"}'
```

### Generate or search images

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/ai/image/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"cinematic neon workspace, vertical 9:16"}'

curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/ai/image/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"startup team meeting b-roll"}'
```

### Create and configure content

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/content/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Video","description":"Draft created by the agent","waitForReady":true}'

curl -s -X PUT "http://127.0.0.1:$PORT/api/bridge/content/$CONTENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated title","description":"Updated description"}'

curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contentId":"content_abc","channel":"instagram","privacy":"public"}'
```

### Context, hub, inspiration, and downloads

```bash
curl -s "http://127.0.0.1:$PORT/api/bridge/context/search?q=launch&limit=5" \
  -H "Authorization: Bearer $TOKEN"

curl -s "http://127.0.0.1:$PORT/api/bridge/hub/$HANDLE/articles" \
  -H "Authorization: Bearer $TOKEN"

curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/media/download" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/video"}'
```

## Discovery and validation

- Check desktop readiness with `GET /api/health`; `cloud.authenticated` should be true for bridge routes that depend on the signed-in account.
- Use `GET /api/capabilities` for current local endpoint discovery.
- Use `GET /api/diagnostics?full=true` before and after editing workflows.
- For content editing commands, continue to use `POST /api/execute`.

## Gaps

- Web search and GitHub access are intentionally CLI-native rather than desktop bridge routes.
- If `GET /api/capabilities` does not list a bridge route for a niche service, treat it as unavailable and report the missing route instead of guessing.
