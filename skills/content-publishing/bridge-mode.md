# Desktop API — Local HTTP Endpoints

SkillTown Desktop exposes local HTTP endpoints for content publishing and related operations. The agent reads the local discovery file, sends requests to `127.0.0.1`, and the desktop app forwards the signed-in user's session to ContentLead.

## Auth

Read the local desktop API token and port immediately before each call. They change after every desktop restart.

```bash
API=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['port'])")
TOKEN=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
```

All calls use:

```bash
-H "Authorization: Bearer $TOKEN"
```

If the forwarded desktop cookies are expired, endpoints return HTTP `401`:

```json
{ "error": "session_expired", "message": "SkillTown session expired — sign in via the desktop app UI" }
```

## SSE events

Subscribe to the desktop stream to react to mutations without polling:

```bash
curl -N "http://127.0.0.1:$PORT/api/events?token=$TOKEN"
```

Content mutations emit:

```json
{
  "event": "content.updated",
  "data": {
    "contentId": "content_xxx",
    "changedFields": ["videoUrl", "thumbnail"],
    "source": "render-upload",
    "timestamp": 1783100000000
  }
}
```

`source` is `render-upload` for local render uploads and `desktop-bridge` for `/api/bridge/content/*` writes. The web editor listens for matching `contentId` and refetches the Content record, so thumbnail, video URL, title, description, and caption changes appear without manual refresh.

Render jobs started through `POST /api/render` emit `render.job.created`, `render.progress`, and `render.job.completed`:

```json
{
  "event": "render.job.completed",
  "data": {
    "jobId": "uuid",
    "contentId": "content_xxx",
    "status": "completed",
    "progress": 100,
    "outputPath": "/Users/shubham/Movies/SkillTown/render.mp4",
    "cloudVideoUrl": "https://...",
    "thumbnailUrl": "https://...",
    "fileSizeBytes": 47000000,
    "createdAt": "2026-07-04T00:00:00.000Z",
    "completedAt": "2026-07-04T00:02:00.000Z"
  }
}
```

## Full endpoint reference

### Instagram

| Path | Method | Body/query params | Description |
|------|--------|-------------------|-------------|
| `/api/bridge/instagram/accounts` | GET | — | List connected Instagram accounts |
| `/api/bridge/instagram/automation` | GET | none, or `account=<accountId>`, or `mediaId=<id>` | Get all-account automation summary, account rules, or per-media CTA |
| `/api/bridge/instagram/automation` | POST | `action:"update_cta"`, `contentId?` or `mediaId?`, `contains`, `messageBody?`, `buttons?`, `commentReplies?`, `enableCommentReply?`, `enableFollowGate?`, `followReply?`, `followButtonText?`, `containerName?`, `syncToProduction?`, `configName?` | Upsert per-post CTA; `messageBody` + `buttons[]` are converted to Messenger template shape |
| `/api/bridge/instagram/automation` | POST | `action:"toggle"`, `accountId`, `enabled` | Enable/disable automation for an account |
| `/api/bridge/instagram/automation` | POST | `action:"update_rules"`, `accountId`, `automationRules` | Replace account-level automation rules |
| `/api/bridge/instagram/publish` | POST | `contentId`, `accountId?` | Start tracked Instagram Reel publishing from a Content document |
| `/api/bridge/instagram/publish/status` | GET | `contentId`, `publish=true?` | Poll Instagram publish status; when published, auto-sync draft CTA to production |
| `/api/bridge/instagram/publish/schedule` | POST | `contentId`, `selectedAccount`, `wallTime` (`YYYY-MM-DDTHH:mm`), `timeZone?` (default `Asia/Kolkata`), `caption?`, `hashtags?` | Schedule a reel (Instagram only). `wallTime` must meet a server-configured minimum lead + slot boundary — if rejected, the error states the exact values; round up and retry (don't hard-code). **Set the CTA draft first** or the reel publishes with no automation — see `instagram.md`. |
| `/api/bridge/instagram/publish/schedule` | PATCH | `contentId`, `wallTime` (`YYYY-MM-DDTHH:mm`), `timeZone?`, `selectedAccount?` | Reschedule an already-scheduled reel to a new time. Rejects if publishing has started |
| `/api/bridge/instagram/publish/schedule` | DELETE | `contentId`, `cancelled_reason?` (default `user_cancelled`) | Cancel a scheduled reel and release the slot. Rejects if publishing has started |
| `/api/bridge/instagram/publish/scheduled-status` | GET | `contentId=<id>` | Get scheduling/publish state for one reel |
| `/api/bridge/instagram/publish/list` | GET | `states?`, `accounts?`, `sort?`, `limit?` | List scheduled/in-flight reels for an account |
| `/api/bridge/instagram/validate` | GET | `account=<accountId>` | Validate Instagram account token/session health |
| `/api/bridge/instagram/posts` | GET | `account=<accountId>`, `limit?`, `mediaId?`, `includeCta?` | List published Instagram posts with metrics and optional CTA config |

`update_cta` accepts agent-friendly camelCase and normalizes to the server body: `mediaId→media_id`, `commentReplies→comment_replies`, `enableCommentReply→enable_comment_reply`, `enableFollowGate→enable_follow_gate`, `followReply→follow_reply`, `followButtonText→follow_button_text`, `containerName→container_name`, `syncToProduction→sync_to_production`, `configName→config_name`. The `messageBody` string plus `buttons[]` label/url pairs are translated into the Facebook Messenger button template shape:

```json
{
  "attachment": {
    "type": "template",
    "payload": {
      "template_type": "button",
      "text": "DM text here",
      "buttons": [
        { "type": "web_url", "url": "https://example.com", "title": "Open Link" }
      ]
    }
  }
}
```

Advanced callers can still pass a pre-formed `message_body` object, which passes through unchanged. Missing `mediaId`/`media_id`/`contentId` for `update_cta` returns HTTP `400`: `{ "error": "missing_mediaId", "message": "update_cta requires mediaId or contentId" }`.

#### Two-container architecture

CTA automation is split across two Cosmos containers:

- **`ContentLeadCTA`** — draft container. The Content editor UI reads/writes here before publish, keyed by `media_${contentId}`.
- **`ConfigurationData`** — production container. The Instagram webhook reads here when a live comment fires, keyed by `media_${realIGMediaId}`.

Default agent flow:

1. **Pre-publish:** call `POST /api/bridge/instagram/automation` with `contentId` and default `containerName: "ContentLeadCTA"`. The editor UI shows the CTA immediately.
2. **Publish:** call `POST /api/bridge/instagram/publish`, then poll `/api/bridge/instagram/publish/status?contentId=...&publish=true`. When the real numeric `media_id` lands, the status endpoint auto-copies `ContentLeadCTA/media_${contentId}` to `ConfigurationData/media_${media_id}`.
3. **Live comments:** Instagram webhook reads `ConfigurationData` and fires the DM/comment automation.

Use `containerName: "ConfigurationData"` only when manually targeting production. Use `syncToProduction: true` only when `mediaId` is already a real numeric Instagram media ID and you want the endpoint to also copy the config to production immediately.

### YouTube

| Path | Method | Body/query params | Description |
|------|--------|-------------------|-------------|
| `/api/bridge/youtube/publish` | POST | `contentId`, `channelId?`, `selectedAccount?`, `title?`, `description?`, `tags?`, `privacyStatus?`, `thumbnailUrl?` | Upload a Content document video to YouTube and apply CTA comment behavior |

### LinkedIn

| Path | Method | Body/query params | Description |
|------|--------|-------------------|-------------|
| `/api/bridge/accounts` | GET | — | Aggregate connected Instagram, LinkedIn, and YouTube accounts |
| `/api/bridge/publish/linkedin` | POST | `accountId`, `text`, `postType?`, `imageUrns?` | Post to LinkedIn. This endpoint is not content-aware |

### Content

> **⚠️ No bridge create route.** There is **no** `POST /api/bridge/content` to create a Content document. Create content with `POST /api/content/create` (documented in the `contentlead` skill → `infrastructure.md`), then update it with `PUT /api/bridge/content/:id`.

| Path | Method | Body/query params | Description |
|------|--------|-------------------|-------------|
| `/api/content/create` | POST | `title`, `description?`, `waitForReady?`, `timeoutMs?` | Create a Content document and optionally open/wait for an editor tab |
| `/api/bridge/content` | GET | `limit?`, `offset?`, `status?` | Browse/filter Content documents |
| `/api/bridge/content/:id` | GET | — | Get full Content document |
| `/api/bridge/content/:id` | PUT | `title?`, `displayTitle?`, `contentTitle?`, `description?`, `caption?`, `status?`, `videoUrl?`, `videoSasUrl?`, `downloadableSasUrl?`, `sasExpiresAt?`, `thumbnail?`, `channels?` | Update Content fields |
| `/api/bridge/content/upload-url` | POST | `contentId`, `fileName`, `contentType?` | Get Azure Blob upload URL and read URLs |
| `/api/bridge/content/configure-publish` | POST | `contentId`, `platform:"instagram"|"youtube"|"linkedin"`, `config:{...}` | Configure per-platform publish settings on a Content document |

### Context

| Path | Method | Body/query params | Description |
|------|--------|-------------------|-------------|
| `/api/bridge/context` | GET | `view=tree|flat?`, `type?`, `fields=full?` | List context items |
| `/api/bridge/context/search` | GET | `q`, `type?`, `tags?`, `limit?` | Search context items |
| `/api/bridge/context/:id` | GET | `as=markdown?` | Get a context item by ID or slug |
| `/api/bridge/context/folder/:id` | GET | `recursive=true|false?` | List context folder contents |
| `/api/bridge/context/edit` | POST | `id`, `text`, `find?`, `replace_all?`, `at_line?`, `after_heading?` | Edit a context item |
| `/api/bridge/context/manage` | POST | single `{action,...params}` or batch `{operations:[...]}` | Manage context items/folders |

### Learn / KB

| Path | Method | Body/query params | Description |
|------|--------|-------------------|-------------|
| `/api/bridge/learn` | GET | `view=tree|flat?`, `category?`, `tag?`, `fields=full?` | List learn articles |
| `/api/bridge/learn/categories` | GET | — | List learn categories |
| `/api/bridge/learn/search` | GET | `q`, `category?`, `tag?`, `limit?` | Search learn articles |
| `/api/bridge/learn/:id` | GET | `as=markdown?` | Get a learn article by ID or slug |
| `/api/bridge/learn/folder/:id` | GET | `recursive=true|false?` | List learn folder contents |
| `/api/bridge/learn/edit` | POST | `id`, `text`, `find?`, `replace_all?`, `at_line?`, `after_heading?` | Edit a learn article |
| `/api/bridge/learn/manage` | POST | single `{action,...params}` or batch `{operations:[...]}` | Manage learn articles/folders |

### Existing desktop bridge routes

These routes still exist unchanged.

| Path | Method | Body/query params | Description |
|------|--------|-------------------|-------------|
| `/api/bridge/accounts` | GET | — | Aggregate connected Instagram, LinkedIn, and YouTube account endpoints |
| `/api/bridge/publish/instagram` | POST | `contentId`, `selectedAccount`, `videoUrl?`, `metadata?` | Older Instagram publish route |
| `/api/bridge/publish/instagram/status` | GET | `contentId` | Older Instagram publish status route |
| `/api/bridge/publish/linkedin` | POST | LinkedIn post body | LinkedIn post route |
| `/api/bridge/publish/youtube` | POST | YouTube upload body | Older YouTube upload route |
| `/api/bridge/publish/youtube/status` | GET | `videoId` | Older YouTube upload status route |
| `/api/bridge/inspiration/feed` | GET | feed query params | Inspiration feed bridge |
| `/api/bridge/inspiration/search` | POST | search body | Inspiration search bridge |
| `/api/bridge/inspiration/transcribe` | POST | transcribe body | Inspiration transcription bridge |

## Common recipes

### Set Instagram CTA before publishing

CTA is contentId/mediaId-scoped, not tab-scoped. No `tabId` is required. Before publish, write drafts to `ContentLeadCTA` with `contentId`; publish status auto-syncs them to `ConfigurationData` under the real Instagram media ID.

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/instagram/automation"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"action":"update_cta","contentId":"content_xxx","contains":["LAUNCH","LINK"],"messageBody":"DM text here","buttons":[{"label":"Get Free Trial","url":"https://example.com/trial"},{"label":"Watch Guide","url":"https://example.com/guide"}],"commentReplies":["Sent DM 💌","Check inbox ✨"],"enableCommentReply":true,"enableFollowGate":true,"followReply":"Follow me first, then tap the button 🙏","followButtonText":"Follow @myhandle","containerName":"ContentLeadCTA","syncToProduction":false}'
```

### Configure YouTube channel settings

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","platform":"youtube","config":{"enabled":true,"toPublish":true,"postType":"long","title":"5 AI Tools You Need in 2025","description":"In this video...","tags":["AI","tools"],"privacy":"public","category":"28","selectedAccount":"UCxxx"}}'
```

### List published Instagram posts with metrics

```bash
curl "http://127.0.0.1:$PORT/api/bridge/instagram/posts?account=ig_abc123&limit=10&includeCta=true"   -H "Authorization: Bearer $TOKEN"
```

### Validate account token before workflow

```bash
curl "http://127.0.0.1:$PORT/api/bridge/instagram/validate?account=ig_abc123"   -H "Authorization: Bearer $TOKEN"
```

## Anti-patterns

- Do **not** pass `tabId` to publishing endpoints. These calls are content/account/knowledge scoped, not editor-tab scoped. Use `tabId` only for editor `/api/execute` commands in multi-tab sessions.
- Do **not** assume desktop cookies stay valid forever. On HTTP `401` / `session_expired`, sign in again via the SkillTown Desktop UI and retry.
- Do **not** publish with direct account/video inputs when dashboard tracking matters. Use `contentId`.
