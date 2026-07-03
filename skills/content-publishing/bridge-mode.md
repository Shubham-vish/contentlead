# Bridge Mode — Local Desktop API for MCP Tools

Bridge mode is a thin SkillTown Desktop proxy to the ContentLead Next.js MCP endpoints. It uses the same local Bearer token as `/api/execute` and forwards the desktop app's signed-in session cookies, so Copilot CLI does not need a separate browser login or MCP server attachment. Naming mirrors the MCP path: `/api/mcp/x` becomes `/api/bridge/x`.

## When to use bridge vs MCP

| Use | Best when | Auth/session | Example |
|-----|-----------|--------------|---------|
| MCP mode | The MCP server is attached in the agent runtime | MCP server handles auth/tool calls | `instagram_update_automation(...)` |
| Bridge mode | You only have Copilot CLI plus a running SkillTown Desktop app | Local Bearer token + desktop session cookies | `POST /api/bridge/instagram/automation` |

## Auth

Read the local desktop API token and port immediately before calling bridge endpoints. They change after every desktop restart.

```bash
TOK=$(python3 -c "import json;print(json.load(open('/Users/shubham/.skilltown-desktop/api.json'))['token'])")
PORT=$(python3 -c "import json;print(json.load(open('/Users/shubham/.skilltown-desktop/api.json'))['port'])")
```

All bridge calls use:

```bash
-H "Authorization: Bearer $TOK"
```

If the forwarded desktop cookies are expired, bridge endpoints return HTTP `401`:

```json
{ "error": "session_expired", "message": "SkillTown session expired — sign in via the desktop app UI" }
```

## Full endpoint reference

### Instagram

| Bridge path | Method | Body/query params | Description | MCP tool equivalent |
|-------------|--------|-------------------|-------------|---------------------|
| `/api/bridge/instagram/accounts` | GET | — | List connected Instagram accounts | `instagram_get_accounts` |
| `/api/bridge/instagram/automation` | GET | none, or `account=<accountId>`, or `mediaId=<id>` | Get all-account automation summary, account rules, or per-media CTA | `instagram_get_automation` |
| `/api/bridge/instagram/automation` | POST | `action:update_cta`, `mediaId?`/`media_id?`/`contentId?`, `contains`, `messageBody?`/`message_body?`, `commentReplies?`, `enableCommentReply?`, `enableFollowGate?`, `followReply?`, `followButtonText?`, `configName?` | Upsert per-post CTA; camelCase fields are normalized to MCP snake_case | `instagram_update_automation` |
| `/api/bridge/instagram/automation` | POST | `action:toggle`, `accountId`, `enabled` | Enable/disable automation for an account | `instagram_update_automation` |
| `/api/bridge/instagram/automation` | POST | `action:update_rules`, `accountId`, `automationRules` | Replace account-level automation rules | `instagram_update_automation` |
| `/api/bridge/instagram/publish` | POST | `contentId?`, `accountId?`, `videoUrl?`, `caption?`; legacy direct mode: `accountId`, `videoUrl`, `caption?` | Start Instagram Reel publishing through the MCP mirror | `instagram_publish_reel` |
| `/api/bridge/instagram/publish/status` | GET | `containerId?`, `account?`, `contentId?`, `publish=true?` | Poll Instagram publish status; publish when requested by upstream params | `instagram_publish_status` |
| `/api/bridge/instagram/validate` | GET | `account=<accountId>` | Validate Instagram account token/session health | `instagram_validate_token` |
| `/api/bridge/instagram/posts` | GET | `account=<accountId>`, `limit?`, `mediaId?`, `mediaType?`, `includeCta?` | List published Instagram posts with metrics and optional CTA config | `instagram_get_posts` |

`update_cta` accepts agent-friendly camelCase and normalizes to the existing Next.js MCP body: `mediaId→media_id`, `messageBody→message_body`, `commentReplies→comment_replies`, `enableCommentReply→enable_comment_reply`, `enableFollowGate→enable_follow_gate`, `followReply→follow_reply`, `followButtonText→follow_button_text`, `configName→config_name`. If only `contentId` is provided, or `mediaId` starts with `content_`, the bridge resolves it to `Content.channels.instagram.media_id` via `/api/content/:contentId`; otherwise it falls back to the content ID. Missing `mediaId`/`media_id`/`contentId` for `update_cta` returns HTTP `400`: `{ "error": "missing_mediaId", "message": "update_cta requires mediaId or contentId" }`.

### YouTube

| Bridge path | Method | Body/query params | Description | MCP tool equivalent |
|-------------|--------|-------------------|-------------|---------------------|
| `/api/bridge/youtube/publish` | POST | `contentId`, `channelId?`, `selectedAccount?`, `title?`, `description?`, `tags?`, `privacyStatus?`, `thumbnailUrl?` | Upload a Content document video to YouTube through the MCP mirror | `youtube_publish` |

### LinkedIn

No new `/api/mcp/linkedin/*` mirror endpoints shipped in the bridge parity commit. Use the MCP tools when attached, or the existing legacy desktop bridge documented in `linkedin.md` for direct posting.

| Bridge path | Method | Body/query params | Description | MCP tool equivalent |
|-------------|--------|-------------------|-------------|---------------------|
| `/api/bridge/publish/linkedin` | POST | `accountId`, `text`, `postType?`, `imageUrns?` | Legacy desktop bridge for posting to LinkedIn; not an MCP mirror | `linkedin_post` |

### Content

| Bridge path | Method | Body/query params | Description | MCP tool equivalent |
|-------------|--------|-------------------|-------------|---------------------|
| `/api/bridge/content/configure-publish` | POST | `contentId`, `platform:"instagram"|"youtube"|"linkedin"`, `config:{...}` | Configure per-platform publish settings on a Content document | `content_configure_publish` |

### Context

| Bridge path | Method | Body/query params | Description | MCP tool equivalent |
|-------------|--------|-------------------|-------------|---------------------|
| `/api/bridge/context` | GET | `view=tree|flat?`, `type?`, `fields=full?` | List context items | MCP `/api/mcp/context` |
| `/api/bridge/context/search` | GET | `q`, `type?`, `tags?`, `limit?` | Search context items | MCP `/api/mcp/context/search` |
| `/api/bridge/context/:id` | GET | `as=markdown?` | Get a context item by ID or slug | MCP `/api/mcp/context/:id` |
| `/api/bridge/context/folder/:id` | GET | `recursive=true|false?` | List context folder contents | MCP `/api/mcp/context/folder/:id` |
| `/api/bridge/context/edit` | POST | `id`, `text`, `find?`, `replace_all?`, `at_line?`, `after_heading?` | Edit a context item | MCP `/api/mcp/context/edit` |
| `/api/bridge/context/manage` | POST | single `{action,...params}` or batch `{operations:[...]}` | Manage context items/folders | MCP `/api/mcp/context/manage` |

### Learn / KB

| Bridge path | Method | Body/query params | Description | MCP tool equivalent |
|-------------|--------|-------------------|-------------|---------------------|
| `/api/bridge/learn` | GET | `view=tree|flat?`, `category?`, `tag?`, `fields=full?` | List learn articles | `learn_list` |
| `/api/bridge/learn/categories` | GET | — | List learn categories | `learn_categories` |
| `/api/bridge/learn/search` | GET | `q`, `category?`, `tag?`, `limit?` | Search learn articles | `learn_search` |
| `/api/bridge/learn/:id` | GET | `as=markdown?` | Get a learn article by ID or slug | `learn_get` |
| `/api/bridge/learn/folder/:id` | GET | `recursive=true|false?` | List learn folder contents | `learn_list` |
| `/api/bridge/learn/edit` | POST | `id`, `text`, `find?`, `replace_all?`, `at_line?`, `after_heading?` | Edit a learn article | `learn_edit` |
| `/api/bridge/learn/manage` | POST | single `{action,...params}` or batch `{operations:[...]}` | Manage learn articles/folders | `learn_manage` |

### Existing legacy bridge routes

These routes still exist unchanged. They are not MCP mirrors unless noted elsewhere.

| Bridge path | Method | Body/query params | Description |
|-------------|--------|-------------------|-------------|
| `/api/bridge/accounts` | GET | — | Aggregate existing Instagram, LinkedIn, and YouTube account endpoints |
| `/api/bridge/publish/instagram` | POST | `contentId`, `selectedAccount`, `videoUrl?`, `metadata?` | Legacy Instagram publish bridge |
| `/api/bridge/publish/instagram/status` | GET | `contentId` | Legacy Instagram publish status bridge |
| `/api/bridge/publish/linkedin` | POST | LinkedIn post body | Legacy LinkedIn post bridge |
| `/api/bridge/publish/youtube` | POST | YouTube upload body | Legacy YouTube upload bridge |
| `/api/bridge/publish/youtube/status` | GET | `videoId` | Legacy YouTube upload status bridge |
| `/api/bridge/inspiration/feed` | GET | feed query params | Inspiration feed bridge |
| `/api/bridge/inspiration/search` | POST | search body | Inspiration search bridge |
| `/api/bridge/inspiration/transcribe` | POST | transcribe body | Inspiration transcription bridge |

## Common recipes

### Set Instagram CTA before publishing

CTA is contentId/mediaId-scoped, not tab-scoped. No `tabId` is required.

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/instagram/automation" \
  -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
  -d '{"action":"update_cta","contentId":"content_xxx","contains":["LAUNCH","LINK"],"messageBody":"Here is your link + coupon...","commentReplies":["Just sent you DM 💌"],"enableCommentReply":true,"enableFollowGate":true,"followReply":"Hi {name}! Follow first...","followButtonText":"Follow @myhandle","configName":"Launch CTA"}'
```

### Configure YouTube channel settings

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish" \
  -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
  -d '{"contentId":"content_xxx","platform":"youtube","config":{"enabled":true,"toPublish":true,"postType":"long","title":"5 AI Tools You Need in 2025","description":"In this video...","tags":["AI","tools"],"privacy":"public","category":"28","selectedAccount":"UCxxx"}}'
```

### List published Instagram posts with metrics

```bash
curl "http://127.0.0.1:$PORT/api/bridge/instagram/posts?account=ig_abc123&limit=10&includeCta=true" \
  -H "Authorization: Bearer $TOK"
```

### Validate account token before workflow

```bash
curl "http://127.0.0.1:$PORT/api/bridge/instagram/validate?account=ig_abc123" \
  -H "Authorization: Bearer $TOK"
```

## Anti-patterns

- Do **not** pass `tabId` to bridge endpoints. Bridge calls are content/account/knowledge scoped, not editor-tab scoped. Use `tabId` only for editor `/api/execute` commands in multi-tab sessions.
- Do **not** assume the desktop cookies stay valid forever. On HTTP `401` / `session_expired`, sign in again via the SkillTown Desktop UI and retry.
- Do **not** call MCP and bridge variants for the same mutation unless you need an intentional retry; they hit the same Next.js MCP backend.

## Future work

The bridge parity commit did not ship new `/api/bridge/linkedin/*` MCP-mirror endpoints. LinkedIn still uses the MCP tools or the legacy `/api/bridge/publish/linkedin` endpoint.
