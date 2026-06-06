---
name: social-media
description: Publish, manage posts, and configure CTA automation for Instagram, LinkedIn, and YouTube. Use MCP tools for full capabilities or desktop bridge for quick publishing.
tags: publish, instagram, linkedin, youtube, social, post, upload, reel, accounts, share, cta, automation, scraping
---

# Social Media Publishing & Management

Two access paths are available:

1. **MCP Server tools** (full capabilities) — get posts, manage CTA, automation, scraping, token validation
2. **Desktop bridge endpoints** (quick publish) — publish, poll status, list accounts from the Electron app

## MCP Tools (Recommended — Full Capabilities)

### Content Management (3 tools — manage content BEFORE publishing)

| Tool | What it does |
|------|-------------|
| `content_get` | Get full Content doc: title, description, thumbnail, videoUrl, channels config, publish status |
| `content_update` | Set top-level metadata directly in DB: `title`, `display_title`, `content_title`, `description`, `caption`, `thumbnail`, `video_url`, `status` (draft/ready/published) |
| `content_get_upload_url` | Get SAS upload URL to attach video/thumbnail files to a content |

### Content Publish Config (2 tools — set channel-specific config)

| Tool | What it does |
|------|-------------|
| `content_configure_publish` | Set platform publish config: caption/hashtags (IG), title/desc/tags/privacy/thumbnail_url (YT), selected_account |
| `youtube_publish` | Publish content to YouTube — reads metadata from Content doc, uploads, writes back, auto-posts CTA |

### Instagram (7 tools)

| Tool | What it does |
|------|-------------|
| `instagram_get_accounts` | List all connected IG accounts (IDs, usernames, automation status) |
| `instagram_get_posts` | Get last N posts with metrics. Params: `account_id`, `limit` (1-50), `media_id`, `media_type` (REELS/IMAGE/VIDEO), `include_cta` |
| `instagram_get_automation` | Get CTA config per-account or per-post. Params: `account_id` or `media_id` |
| `instagram_update_automation` | **3 actions:** `toggle` (enable/disable automation), `update_rules` (trigger keywords + DM templates), `update_cta` (per-post keywords, DM body, comment replies, follow gate) |
| `instagram_publish_reel` | Publish a reel. **Recommended:** pass `content_id` to track in UI. Legacy: `account_id` + `video_url` |
| `instagram_publish_status` | Poll publish progress. Pass `content_id` or `container_id` + `account_id`. With `auto_publish=true`, publishes when ready |
| `instagram_validate_token` | Check if account token is still valid. Returns `healthy: true/false` |

### Content Publish Setup (2 tools — NEW)

| Tool | What it does |
|------|-------------|
| `content_configure_publish` | Set title/desc/caption/tags/thumbnail/account on a Content doc before publishing. Works for all platforms. |
| `youtube_publish` | Publish content video to YouTube. Reads metadata from Content doc, uploads, writes back, auto-posts CTA comment |

#### Complete Content Lifecycle (UI Parity)
```
# 1. Get content to check current state
content_get(content_id="content_xxx")

# 2. Update top-level metadata (title, description, thumbnail)
content_update(
  content_id="content_xxx",
  display_title="5 AI Tools You Need in 2025",
  description="A deep dive into the best AI tools...",
  thumbnail="https://storage.blob.core.windows.net/.../thumb.jpg",
  status="ready"
)

# 3. Configure Instagram channel
content_configure_publish(
  content_id="content_xxx",
  platform="instagram",
  caption="5 AI tools you need in 2025! 🚀",
  hashtags='["AI", "tools", "2025"]',
  selected_account="ig_account_id"
)

# 4. Set up CTA for Instagram DM automation
instagram_update_automation(
  action="update_cta",
  media_id="content_xxx",
  contains='["free", "link", "send"]',
  message_body='{"text": "Here is your free guide: https://..."}',
  enable_comment_reply=true
)

# 5. Publish to Instagram (content-aware — tracks in UI)
instagram_publish_reel(content_id="content_xxx")

# 6. Poll until published
instagram_publish_status(content_id="content_xxx", auto_publish=true)

# 7. Configure YouTube channel
content_configure_publish(
  content_id="content_xxx",
  platform="youtube",
  title="5 AI Tools You Need in 2025",
  description="In this video...",
  tags='["AI", "tools"]',
  privacy="public",
  selected_account="channel_id"
)

# 8. Publish to YouTube (auto-posts CTA comment)
youtube_publish(content_id="content_xxx")
```

#### CTA Update Example
```
instagram_update_automation(
  action="update_cta",
  media_id="17889...",
  contains='["free", "link", "send"]',           # trigger keywords
  message_body='{"text": "Here is your free guide: https://..."}',
  comment_replies='["Thanks! Check your DMs 🎁"]',
  enable_comment_reply=true,
  enable_follow_gate=true,
  follow_reply="Follow us first, then comment again!",
  follow_button_text="Follow @myhandle"
)
```

### LinkedIn (4 tools)

| Tool | What it does |
|------|-------------|
| `linkedin_get_account` | Get connected LI account info (name, token status, can_post) |
| `linkedin_post` | Publish post. Params: `text`, `image_urls` (JSON array), `article_url`, `article_title`, `visibility` (PUBLIC/CONNECTIONS) |
| `linkedin_get_posts` | Get last N published posts (default 20) |
| `linkedin_delete_post` | Delete a post by URN. Params: `post_urn`, `delete_from_linkedin` (default true) |

### Instagram Scraping (3 tools)

| Tool | What it does |
|------|-------------|
| `scraping_instagram_download_reels` | Download reels from a user profile |
| `scraping_instagram_download_reel_url` | Download a specific reel by URL |
| `scraping_instagram_get_user_info` | Get user profile info (followers, bio, etc.) |

## Desktop Bridge Endpoints (Alternative — from Electron app)

Use these when running inside the desktop app. The bridge authenticates through the user's web session — no extra API keys needed.

## Quick Start

```bash
# 1. Check which accounts are connected
curl http://127.0.0.1:$PORT/api/bridge/accounts -H "Authorization: Bearer $TOKEN"

# 2. Publish to Instagram
curl -X POST http://127.0.0.1:$PORT/api/bridge/publish/instagram \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"contentId": "content_xxx", "selectedAccount": "ig_account_id"}'

# 3. Poll for publish status
curl "http://127.0.0.1:$PORT/api/bridge/publish/instagram/status?contentId=content_xxx" \
  -H "Authorization: Bearer $TOKEN"
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bridge/accounts` | List all connected social accounts |
| POST | `/api/bridge/publish/instagram` | Start Instagram Reel publish |
| GET | `/api/bridge/publish/instagram/status` | Poll Instagram publish progress |
| POST | `/api/bridge/publish/linkedin` | Create a LinkedIn post |
| POST | `/api/bridge/publish/youtube` | Upload video to YouTube |
| GET | `/api/bridge/publish/youtube/status` | Check YouTube upload status |

---

## List Connected Accounts

### `GET /api/bridge/accounts`

Returns all connected social accounts across all three platforms. Uses `Promise.allSettled` — partial results returned if one platform fails.

```bash
curl http://127.0.0.1:$PORT/api/bridge/accounts -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "instagram": {
    "ok": true,
    "accounts": [
      { "id": "abc123", "username": "myhandle", "profilePic": "https://...", "pageName": "My Page", "status": "active", "automationEnabled": false }
    ]
  },
  "linkedin": {
    "ok": true,
    "accounts": [
      { "id": "def456", "name": "John Doe", "headline": "Content Creator", "profilePic": "https://..." }
    ]
  },
  "youtube": {
    "ok": true,
    "channels": [
      { "id": "UCxxx", "title": "My Channel", "thumbnail": "https://...", "subscriberCount": "1.2K" }
    ]
  }
}
```

If a platform fails: `{ "ok": false, "error": "not_authenticated" }`

---

## Instagram Publishing

Instagram publishing is **asynchronous** — you start it, then poll for status.

### Step 1: Start Publish

#### `POST /api/bridge/publish/instagram`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `contentId` | string | ✅ | Content ID (must have an uploaded video) |
| `selectedAccount` | string | ✅ | Instagram account ID (from `/api/bridge/accounts`) |
| `videoUrl` | string | | Override video URL (must be public) |
| `metadata` | object | | Optional caption, hashtags |

```bash
curl -X POST http://127.0.0.1:$PORT/api/bridge/publish/instagram \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "contentId": "content_073de19c",
    "selectedAccount": "abc123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Reel container created",
  "containerId": "17889...",
  "shouldPoll": true
}
```

### Step 2: Poll Status

#### `GET /api/bridge/publish/instagram/status?contentId=...`

Poll every 10-30 seconds until `published: true` or `canRetry: true` (failure).

```bash
curl "http://127.0.0.1:$PORT/api/bridge/publish/instagram/status?contentId=content_073de19c" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (in progress):**
```json
{ "status": "IN_PROGRESS", "shouldPoll": true }
```

**Response (published):**
```json
{ "published": true, "media_id": "17889...", "published_url": "https://instagram.com/reel/..." }
```

**Response (failed):**
```json
{ "shouldPoll": false, "canRetry": true, "error": "Media processing failed" }
```

---

## LinkedIn Publishing

LinkedIn posts are **synchronous** — the response confirms success immediately.

### `POST /api/bridge/publish/linkedin`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `accountId` | string | ✅ | LinkedIn account ID |
| `text` | string | ✅ | Post text content |
| `postType` | string | | `text`, `image`, `article` (default: `text`) |
| `imageUrns` | string[] | | Image URNs (upload first via web app) |
| `articleUrl` | string | | Article URL to share |
| `articleTitle` | string | | Article title |

```bash
curl -X POST http://127.0.0.1:$PORT/api/bridge/publish/linkedin \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "accountId": "def456",
    "text": "Just launched our new video! 🎬\n\n#contentcreation #video"
  }'
```

**Response:**
```json
{ "success": true, "post": { "id": "urn:li:share:7xxx", "text": "...", "createdAt": "..." } }
```

---

## YouTube Publishing

YouTube upload is **synchronous** but may take time for long videos.

### `POST /api/bridge/publish/youtube`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `contentId` | string | ✅ | Content ID (must have an uploaded video) |
| `channelId` | string | | YouTube channel ID (from accounts) |
| `videoUrl` | string | | Override video URL (must be public) |
| `thumbnailUrl` | string | | Custom thumbnail URL |
| `metadata` | object | | `{ title, description, tags, privacyStatus }` |
| `title` | string | | Shortcut for metadata.title |
| `description` | string | | Shortcut for metadata.description |
| `tags` | string[] | | Shortcut for metadata.tags |

```bash
curl -X POST http://127.0.0.1:$PORT/api/bridge/publish/youtube \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "contentId": "content_073de19c",
    "channelId": "UCxxx",
    "metadata": {
      "title": "How AI Is Changing Content Creation",
      "description": "In this video...",
      "tags": ["AI", "content", "video"],
      "privacyStatus": "public"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "videoUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "message": "Video uploaded successfully"
}
```

### `GET /api/bridge/publish/youtube/status?videoId=...`

Check upload status for a specific video.

---

## Complete Workflow: Edit → Render → Publish

```bash
# 1. Edit video in the editor (using editor commands)
# 2. Save the project (triggers upload to cloud storage)
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type": "editor.save", "params": {}}'

# 3. Check which platforms are connected
curl http://127.0.0.1:$PORT/api/bridge/accounts -H "Authorization: Bearer $TOKEN"

# 4. Publish to Instagram
curl -X POST http://127.0.0.1:$PORT/api/bridge/publish/instagram \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"contentId": "content_xxx", "selectedAccount": "ig_id"}'

# 5. Post to LinkedIn (simultaneously)
curl -X POST http://127.0.0.1:$PORT/api/bridge/publish/linkedin \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"accountId": "li_id", "text": "New video just dropped! 🎬"}'

# 6. Upload to YouTube
curl -X POST http://127.0.0.1:$PORT/api/bridge/publish/youtube \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"contentId": "content_xxx", "metadata": {"title": "...", "description": "..."}}'

# 7. Poll Instagram until published
# (poll every 15s — Instagram container processing takes 30-120s)
```

---

## Error Handling

| Error | Meaning | Fix |
|-------|---------|-----|
| `not_authenticated` | User not logged in on web app | Log in via the Electron app window |
| `no_window` | Electron window not available | Restart the desktop app |
| `bad_origin` | Renderer on wrong origin | Check app origin with `GET /api/app/origin` |
| `bridge_timeout` | Request took >30s | Retry; check network |
| `missing_params` | Required fields missing | Check the param table above |

## Tips for AI Agents

- **Always list accounts first** — don't assume which platforms are connected
- **Instagram is async** — start the publish, then poll every 15-30 seconds
- **LinkedIn/YouTube are sync** — response confirms success immediately
- **Video must be on a public URL** — localhost URLs won't work for social APIs
- **Save before publishing** — `editor.save` triggers the cloud upload pipeline
- **Cross-post thoughtfully** — adjust text/format for each platform's audience
