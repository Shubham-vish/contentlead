---
name: desktop-bridge-routes
description: Use the SkillTown-Desktop local API and desktop bridge routes for AI media, voice, transcription, content, publishing, context, hub, inspiration, downloads, and related workflows.
tags: desktop-bridge, local-api, transcribe, prepwithai, learn, tools, discovery, proxy, token
---

# Desktop Bridge and Local API Routes

Use the SkillTown-Desktop local HTTP API instead of remote tool proxies. The desktop app reuses the signed-in browser session and exposes JSON endpoints on localhost.

## Auth pattern

Read the current port and bearer token before every session because both can change when the app restarts:

Do not print the discovery JSON/token. Its existence does not establish liveness; use a bounded authenticated health request. A source-only audit must not start/reload/switch the app or contact the web backend.

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
| Creator hub | `GET /api/bridge/hub/commands`, `POST /api/bridge/hub/commands/:name` |
| Creator bio/storefront | `GET /api/bridge/storefront/commands`, `POST /api/bridge/storefront/commands/:name` |
| Creator Apps | `GET /api/bridge/apps/commands`, `POST /api/bridge/apps/commands/:name` |
| Offer Studio | `GET /api/bridge/offer-studio/commands`, `POST /api/bridge/offer-studio/commands/:name` |
| Calls Studio | `GET /api/bridge/calls/commands`, `POST /api/bridge/calls/commands/:name` |
| CRM | `GET /api/bridge/crm/commands`, `POST /api/bridge/crm/commands/:name`; platform-ADMIN Inbox media is actual bounded binary at `GET /api/bridge/crm/inbox/whatsapp/media?threadId=&messageId=`, not a JSON command or caller-selected URL |
| Meta Ads | `GET /api/bridge/meta-ads/commands`, `POST /api/bridge/meta-ads/commands/:name` |
| Deals / Marketplace | `GET /api/bridge/deals/commands`, `POST /api/bridge/deals/commands/:name` |
| Deals local proof / attachment | `POST /api/bridge/deals/proof-upload` (5MiB), `POST /api/bridge/deals/asset-upload` (512MiB); explicit file/campaign/confirmation. Up to10MiB returns201 receipt, larger returns202 local job. Use GET job status/list, DELETE local cancellation, POST `/:jobId/reconcile {confirm:true}` for native read-only recovery, never byte replay. Load `cl-deals`. |
| First creator handle | `POST /api/bridge/user/handle {handle,displayName?,approved:true}`; native ownership/reserved/conflict checks; no existing handle or invented GET route |
| Local PDF for Boards | `POST /api/media/import {path,userSelected:true}`; safe selected regular PDF up to100MiB, returns renderer-readable `mediaUrl`, then `board.importPdf.prepare/start/status/retry/apply/cancel`; load `cl-board` |
| Webinars | `GET /api/bridge/webinars/commands`, `POST /api/bridge/webinars/commands/:name` |
| Inspiration | `/api/bridge/inspiration/*` |
| Media download | `POST /api/bridge/media/download` |
| Create content | `POST /api/content/create` |
| Update content lifecycle fields | `PUT /api/bridge/content/:id` |
| List content | `GET /api/bridge/content` |
| Configure publishing | `POST /api/bridge/content/configure-publish` |
| Instagram publishing and account flows | `/api/bridge/instagram/*` |
| YouTube publishing | `/api/bridge/youtube/*` |
| LinkedIn saved posts / deletion | `GET` / `DELETE /api/bridge/linkedin/posts`; deletion needs exact account/post and `approved:true` |
| LinkedIn bounded image / publish | `POST /api/bridge/linkedin/posts/upload-image` (8MiB), `POST /api/bridge/publish/linkedin`; load `cl-content-publishing` for explicit approval/payloads |
| Web search | Use CLI-native web search/fetch tools |
| GitHub code/repo operations | Use CLI-native GitHub tools or local git commands |

Do not invent endpoint names. If a needed route is not listed here or in `GET /api/capabilities`, use the documented CLI-native tool for that area or report the gap.

The old `/api/bridge/learn/*` and `/api/bridge/hub/:handle/*` surfaces are not the current Hub command transport. Identity is resolved from the signed-in session; do not inject another owner/handle. Load the owning skill before dispatching any business command, including required approvals.

## Two separate command paths

- **Editor:** `/api/execute` → explicit tab validation → per-tab queue → `editor:execute` IPC → preload → `ElectronAgentBridge` → web editor executor → `editor:result`. Local bearer authentication is not web login.
- **Saved business objects:** `/api/bridge/<domain>/commands/:name` → local auth and namespace boundary → allowlisted web route, using renderer `fetch(...,{credentials:"include"})` (or session-cookie uploads) → web authentication, validation and domain dispatcher. Body is normally `{params:{...}}`; discover the manifest and owning skill. This does not require the editor to be mounted, and is not isolated by adding editor `tabId`.
- **Discovery:** `/api/capabilities` separates executable `commands` from REST-only `httpOperations` (including ads/content-style aliases and inspiration watchlists); these REST-only aliases are rejected by `/api/execute` and `/api/batch`. Web command manifests describe their own server surface. `/api/skills` is documentation, potentially newer local canonical content or older bundled content. None proves the loaded cloud renderer and installed Desktop are at the same revision.

Read HTTP status **and** the JSON outcome; editor HTTP 200 can contain `status:"failed"`. A bridge timeout may follow a committed server write. Reconcile saved state before retrying; do not treat transport failure as rollback or silently fall back to another account, tab, or endpoint.

Known JSON command buses, reviewed JSON passthrough routes, native publishing and opted-in multipart uploads reject HTML/malformed JSON success as uncertain, never as `{raw:...}` success. Generic JSON mutations are not automatically refreshed/replayed. Calls/CRM/Meta retain their narrowly recognized session-auth retry only. Unrelated text exports/binary modules retain their actual format. An attachment upload does not send a chat message or submit a creative; inspect its receipt and then perform the separately authorized native write. Deals attachment/proof responses remove signed query/short-link secrets.

Native `editor.autoCaption` is a synchronous Desktop workflow returning its receipt only after completion; it is not in the web renderer inventory. Generic `/api/jobs` monitors returned provider progress metadata; `DELETE /api/jobs/:id` unsubscribes local monitoring, **not** provider cancellation. Do not invent a cancellation route or repeat a timed-out transcription blindly.

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


## Screenshots of any page (`GET /api/screenshot`, app ≥1.0.44)

Not editor-only: `mode=auto` (default) returns the editor canvas when the tab has an editor, else the whole page (meetings, webinars, offers, boards, admin…). `mode=preview|page|window`, `tabId=` (background tabs OK), `windowId=` (from `GET /api/screenshot/targets`), `fullPage=1`, `format=png|jpeg`, `jpegQuality=`, `maxWidth=`, `save=1` (→ `{path}` in `~/.skilltown-desktop/screenshots/`, `inline=1` to also get base64). For video-frame verification still prefer `query.previewFrameAt`.
