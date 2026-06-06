---
name: social-media
description: Publish, manage posts, and configure CTA automation for Instagram, LinkedIn, and YouTube. Use MCP tools for full capabilities or desktop bridge for quick publishing.
tags: publish, instagram, linkedin, youtube, social, post, upload, reel, accounts, share, cta, automation, scraping
---

# Social Media Publishing & Management

Two access paths are available:

1. **MCP Server tools** (full capabilities) — get posts, manage CTA, automation, scraping, token validation
2. **Desktop bridge endpoints** (quick publish) — publish, poll status, list accounts from the Electron app

> **Prerequisite:** Before publishing, set up your content using the **`content-management`** skill.
> Use `content_create` → `content_update` → `content_configure_publish` to prepare content,
> then come back here to publish.

---

## Instagram Publishing Flow (IMPORTANT — Async, 2-Step Process)

Instagram publishing is **asynchronous**. You cannot publish in a single call.

```
Step 1: instagram_publish_reel()  →  Creates a "container" on Instagram's servers
Step 2: instagram_publish_status()  →  Poll every 10-30 seconds until:
        - IN_PROGRESS  →  keep polling
        - FINISHED     →  if auto_publish=true, publishes automatically
        - PUBLISHED    →  done! media_id and permalink available
        - ERROR        →  publishing failed (check error_message)
```

**Typical timeline:** Container processing takes 30-120 seconds.

---

## MCP Tools — Instagram (7 tools)

### `instagram_get_accounts` — List connected accounts

No parameters. Returns all connected Instagram accounts.

**Returns:**
```json
{
  "accounts": [
    {
      "id": "abc123",               // ← Use this as account_id everywhere
      "username": "myhandle",
      "profilePic": "https://...",
      "pageName": "My Business Page",
      "status": "active",
      "automationEnabled": true,
      "tokenExpiry": "2025-12-31"
    }
  ]
}
```

**Always call this first** to get valid `account_id` values for other tools.

---

### `instagram_get_posts` — Get posts with metrics

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `account_id` | string | ✅ | — | Account ID from `instagram_get_accounts` |
| `limit` | int | | `10` | Max posts to return (1-50) |
| `media_id` | string | | — | Fetch a specific post by Instagram media ID |
| `media_type` | string | | — | Filter: `"REELS"`, `"IMAGE"`, `"VIDEO"`, `"CAROUSEL_ALBUM"` |
| `include_cta` | bool | | `false` | Include CTA automation config per post |

**Returns:** Array of posts, each with: `id`, `caption`, `media_url`, `permalink`, `timestamp`, `like_count`, `media_type`, and optionally `cta` config.

---

### `instagram_get_automation` — Get CTA/automation config

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `account_id` | string | | — | Get automation config for this account |
| `media_id` | string | | — | Get per-post CTA config for this media |

Call with no params → summary of all accounts.
Call with `account_id` → rules for that account.
Call with `media_id` → CTA keywords/DM template for that post.

---

### `instagram_update_automation` — Update CTA & automation

This tool has **3 different actions**, each with different required params:

#### Action: `"toggle"` — Enable/disable automation

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | ✅ | `"toggle"` |
| `account_id` | string | ✅ | Account to toggle |
| `enabled` | bool | ✅ | `true` to enable, `false` to disable |

```python
instagram_update_automation(action="toggle", account_id="abc123", enabled=True)
```

#### Action: `"update_rules"` — Set account-level automation rules

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | ✅ | `"update_rules"` |
| `account_id` | string | ✅ | Account to update |
| `automation_rules` | string | ✅ | JSON array of rule objects |

Each rule: `{"triggerKeywords": ["free", "link"], "dmTemplate": "Here's your link: ...", "commentReplyTemplate": "Check DMs!", "enabled": true}`

```python
instagram_update_automation(
    action="update_rules",
    account_id="abc123",
    automation_rules='[{"triggerKeywords": ["free"], "dmTemplate": "Here is your free guide!", "enabled": true}]'
)
```

#### Action: `"update_cta"` — Set per-post CTA (most common)

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | ✅ | `"update_cta"` |
| `media_id` | string | ✅ | Instagram media ID or content_id |
| `contains` | string | ✅ | JSON array of trigger keywords: `'["free", "link", "send"]'` |
| `message_body` | string | ✅ | JSON object with DM text: `'{"text": "Here is your link: https://..."}'` |
| `comment_replies` | string | | JSON array of auto-reply texts: `'["Thanks! Check your DMs 🎁"]'` |
| `enable_comment_reply` | bool | | Enable auto-reply to comments (`true`/`false`) |
| `enable_follow_gate` | bool | | Require follow before DM (`true`/`false`) |
| `follow_reply` | string | | Message if user hasn't followed |
| `follow_button_text` | string | | Button text (e.g. `"Follow @myhandle"`) |

```python
instagram_update_automation(
    action="update_cta",
    media_id="content_xxx",                          # can be content_id
    contains='["free", "link", "send", "guide"]',    # trigger keywords
    message_body='{"text": "Here is your free guide: https://mysite.com/guide"}',
    comment_replies='["Thanks! Check your DMs 🎁", "Sent! Look in your inbox 📩"]',
    enable_comment_reply=True,
    enable_follow_gate=True,
    follow_reply="Follow us first, then comment again to get the guide!",
    follow_button_text="Follow @myhandle"
)
```

---

### `instagram_publish_reel` — Start reel publish

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `content_id` | string | ⭐ Recommended | — | Content ID — reads caption, account, video from Content doc. Tracks in UI. |
| `account_id` | string | | — | Account ID (optional if Content doc has `selected_account`) |
| `video_url` | string | | — | Public video URL (optional if Content doc has video) |
| `caption` | string | | — | Caption (optional if Content doc has caption) |

**Two modes:**
1. ✅ **Content-aware** (recommended): Pass `content_id` — everything reads from Content doc, publish progress tracked in UI.
2. **Direct** (legacy): Pass `account_id` + `video_url` + `caption` — publishes directly, no UI tracking.

**Prerequisites for content-aware mode:**
- Content must have a video (`videoUrl` or `downloadableSasUrl`)
- Content must have `channels.instagram.selected_account` set
- Content must NOT already be published (`channels.instagram.published !== true`)
- Content must NOT be currently publishing (`publish_progress.stage !== "processing"`)

**Returns:**
```json
{
  "success": true,
  "containerId": "17889xxx",
  "contentId": "content_xxx",
  "message": "Reel container created. Poll /api/mcp/instagram/publish/status to track progress."
}
```

**Idempotency:** Returns 409 if content is already published or currently being published.

**Next step:** Call `instagram_publish_status` to poll until published.

---

### `instagram_publish_status` — Poll publish progress

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `content_id` | string | ⭐ Recommended | — | Content ID — resolves container/account from Content doc |
| `container_id` | string | | — | Container ID from `instagram_publish_reel` (legacy mode) |
| `account_id` | string | | — | Account ID (legacy mode) |
| `auto_publish` | bool | | `false` | If `true` and container is FINISHED, publish immediately |

**Status progression:**
```
IN_PROGRESS → FINISHED → (auto_publish) → PUBLISHED
                       ↘ ERROR / EXPIRED
```

**Returns (in progress):**
```json
{
  "containerId": "17889xxx",
  "contentId": "content_xxx",
  "status": "IN_PROGRESS",
  "statusMessage": "Media is being processed",
  "shouldPoll": true
}
```

**Returns (published — when `auto_publish=true` and container is FINISHED):**
```json
{
  "status": "PUBLISHED",
  "mediaId": "17889xxx",
  "permalink": "https://www.instagram.com/reel/ABC123/",
  "contentId": "content_xxx",
  "shouldPoll": false
}
```

**Returns (finished but auto_publish=false):**
```json
{
  "containerId": "17889xxx",
  "status": "FINISHED",
  "statusMessage": "Container ready for publishing",
  "shouldPoll": false
}
```

**Returns (error):**
```json
{
  "containerId": "17889xxx",
  "status": "ERROR",
  "statusMessage": "Media processing failed",
  "shouldPoll": false
}
```

**Content doc updates:** When published with `content_id`, automatically writes `published`, `published_at`, `media_id`, `published_url`, `publish_progress` to `Content.channels.instagram`.

**Polling strategy:** Call every 10-30 seconds until `shouldPoll` is `false`.

---

### `instagram_validate_token` — Check account health

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `account_id` | string | ✅ | Account ID from `instagram_get_accounts` |

**Returns:**
```json
{ "healthy": true }
// or
{ "healthy": false, "error": "token_expired" }
```

Possible errors: `"token_invalid"`, `"token_expired"`, `"permissions_revoked"`. If unhealthy, user must reconnect the account in the ContentLead UI.

---

## MCP Tools — YouTube (1 tool)

### `youtube_publish` — Publish video to YouTube

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `content_id` | string | ✅ | — | Content ID (reads metadata from Content doc) |
| `channel_id` | string | | — | YouTube channel ID (optional if set in Content doc) |
| `selected_account` | string | | — | Account name (alternative to channel_id) |
| `title` | string | | from Content | Override video title |
| `description` | string | | from Content | Override description |
| `tags` | string | | from Content | Override tags as JSON array: `'["AI", "tutorial"]'` |
| `privacy_status` | string | | from Content | Override: `"public"`, `"private"`, `"unlisted"` |
| `thumbnail_url` | string | | from Content | Override thumbnail URL |

**Video URL resolution order:** `downloadableSasUrl` → `videoSasUrl` → `videoUrl`

**What happens:**
1. Reads metadata from `Content.channels.youtube` (or uses overrides)
2. Downloads video from resolved URL
3. Uploads to YouTube via YouTube Data API
4. Writes back to Content doc: `published`, `video_id`, `published_url`, `youtube_response`
5. Auto-reads CTA config (if any) and posts + pins a comment
6. Writes CTA state: `cta_comment_id`, `cta_comment_posted`, `cta_comment_pinned`

**Returns:**
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "videoUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "cta": {
    "posted": true,
    "pinned": true,
    "commentId": "UgyxKJ..."
  }
}
```

**Idempotency:** Returns 409 if `channels.youtube.published === true`.

**YouTube is synchronous** — the response comes after upload completes. May take 1-5 minutes for long videos.

---

## MCP Tools — LinkedIn (4 tools)

### `linkedin_get_account` — Get connected account

No parameters. Returns connected LinkedIn account info.

**Returns:**
```json
{
  "success": true,
  "total": 1,
  "active": 1,
  "accounts": [
    { "id": "def456", "name": "John Doe", "headline": "Content Creator", "profilePic": "https://..." }
  ]
}
```

---

### `linkedin_post` — Publish a post

> **Note:** LinkedIn publishing is NOT content-aware — it does not read from or write to a Content document.
> You must pass the text directly. To cross-post from a Content doc, use `content_get` first to read
> the caption/description, then pass it to `linkedin_post`.

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `text` | string | ✅ | — | Post content (up to 3000 chars) |
| `image_urls` | string | | — | JSON array of image URLs (1-9): `'["https://..."]'` |
| `article_url` | string | | — | URL to share as a link card |
| `article_title` | string | | — | Custom title for the article card |
| `article_description` | string | | — | Custom description for the article card |
| `visibility` | string | | `"PUBLIC"` | `"PUBLIC"` or `"CONNECTIONS"` |

Post type is inferred: text only, text + images, or text + article link.

**LinkedIn is synchronous** — response confirms success immediately.

```python
linkedin_post(
    text="Just published a deep dive into AI tools! 🚀\n\n#AI #ContentCreation",
    visibility="PUBLIC"
)
```

---

### `linkedin_get_posts` — Get published posts

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `count` | int | | `20` | Number of posts to return (newest first) |

---

### `linkedin_delete_post` — Delete a post

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `post_urn` | string | ✅ | — | Post URN from `linkedin_get_posts` (e.g. `"urn:li:share:12345"`) |
| `delete_from_linkedin` | bool | | `true` | Also delete from LinkedIn. `false` = local DB only. |

---

## MCP Tools — Instagram Scraping (3 tools)

> **Requires Instagram cookies.** Use `scraping_cookie_update(platform="instagram", cookies="...")` first.

### `scraping_instagram_download_reels` — Get reels from a profile

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `username` | string | ✅ | — | Instagram username (without @) |
| `count` | int | | `5` | Number of reels (1-5). For more, call multiple times with `offset`. |
| `offset` | int | | `0` | Skip this many reels. Use `next_offset` from previous response. |

**Returns:** Video URLs, captions, likes, views, comments, duration + `next_offset` for pagination.

### `scraping_instagram_download_reel_url` — Get reel by URL

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `reel_url` | string | ✅ | Full URL (e.g. `"https://www.instagram.com/reel/ABC123/"`) |

### `scraping_instagram_get_user_info` — Get profile info

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | ✅ | Instagram username (without @) |

**Returns:** followers, following, posts count, bio, profile picture URL.

---

## Desktop Bridge Endpoints

Use these when running inside the desktop Electron app. Authenticates through the user's web session — no API keys needed.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bridge/accounts` | List all connected social accounts |
| POST | `/api/bridge/publish/instagram` | Start Instagram Reel publish |
| GET | `/api/bridge/publish/instagram/status` | Poll Instagram publish progress |
| POST | `/api/bridge/publish/linkedin` | Create a LinkedIn post |
| POST | `/api/bridge/publish/youtube` | Upload video to YouTube |
| GET | `/api/bridge/publish/youtube/status` | Check YouTube upload status |

### Bridge Instagram Publish

```bash
# Start publish
curl -X POST http://127.0.0.1:$PORT/api/bridge/publish/instagram \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"contentId": "content_xxx", "selectedAccount": "ig_account_id"}'
# → { "success": true, "containerId": "17889...", "shouldPoll": true }

# Poll (every 10-30s)
curl "http://127.0.0.1:$PORT/api/bridge/publish/instagram/status?contentId=content_xxx" \
  -H "Authorization: Bearer $TOKEN"
# → { "status": "IN_PROGRESS", "shouldPoll": true }
# → { "published": true, "media_id": "17889...", "published_url": "https://..." }
```

### Bridge LinkedIn Publish

```bash
curl -X POST http://127.0.0.1:$PORT/api/bridge/publish/linkedin \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"accountId": "def456", "text": "New video! 🎬\n\n#content"}'
# → { "success": true, "post": { "id": "urn:li:share:xxx", ... } }
```

### Bridge YouTube Publish

```bash
curl -X POST http://127.0.0.1:$PORT/api/bridge/publish/youtube \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"contentId": "content_xxx", "channelId": "UCxxx", "metadata": {"title": "...", "description": "...", "tags": ["AI"], "privacyStatus": "public"}}'
# → { "success": true, "videoId": "dQw4...", "videoUrl": "https://youtube.com/watch?v=..." }
```

---

## Complete Workflow: Content → Configure → CTA → Publish (All Platforms)

```python
# ─── STEP 1: Prepare content (content-management skill) ───
content_create(title="5 AI Tools for 2025")
# → content_id = "content_xxx"

content_update(
    content_id="content_xxx",
    display_title="5 AI Tools You Need in 2025",
    content_title="5 AI Tools You Need in 2025",
    video_url="https://storage.blob.../video.mp4",
    downloadable_sas_url="https://storage.blob.../video.mp4?sv=...",
    sas_expires_at="2025-12-31T00:00:00Z",
    thumbnail="https://storage.blob.../thumb.jpg",
    status="ready"
)

# ─── STEP 2: Get account IDs ───
instagram_get_accounts()
# → use account id "ig_abc123"

linkedin_get_account()
# → use account id "li_def456"

# ─── STEP 3: Configure channels (content-management skill) ───
content_configure_publish(
    content_id="content_xxx", platform="instagram",
    enabled=True, to_publish=True, post_type="reel",
    caption="5 AI tools you need right now! 🚀\n\nComment 'FREE' to get the guide!",
    hashtags='["AI", "tools", "2025", "contentcreator"]',
    selected_account="ig_abc123"
)

content_configure_publish(
    content_id="content_xxx", platform="youtube",
    enabled=True, to_publish=True, post_type="long",
    title="5 AI Tools You Need in 2025",
    description="In this video, I share the top 5 AI tools...",
    tags='["AI", "tools", "tutorial"]',
    privacy="public", category="22",
    selected_account="UCxxx"
)

# ─── STEP 4: Set up CTA automation ───
instagram_update_automation(
    action="update_cta",
    media_id="content_xxx",
    contains='["free", "guide", "link", "send"]',
    message_body='{"text": "Here is your free AI tools guide: https://mysite.com/guide"}',
    comment_replies='["Thanks! Check your DMs 🎁", "Sent! Look in your inbox 📩"]',
    enable_comment_reply=True,
    enable_follow_gate=True,
    follow_reply="Follow us first, then comment again!",
    follow_button_text="Follow @myhandle"
)

# ─── STEP 5: Publish to Instagram ───
instagram_publish_reel(content_id="content_xxx")
# → { "containerId": "17889xxx", "shouldPoll": true }

# Poll every 15 seconds
instagram_publish_status(content_id="content_xxx", auto_publish=True)
# → { "status": "IN_PROGRESS", "shouldPoll": true }
# ... poll again ...
# → { "status": "PUBLISHED", "published": true, "media_id": "17889xxx", "published_url": "https://..." }

# ─── STEP 6: Publish to YouTube ───
youtube_publish(content_id="content_xxx")
# → { "success": true, "videoId": "dQw4...", "cta": { "posted": true, "pinned": true } }

# ─── STEP 7: Post to LinkedIn ───
linkedin_post(
    text="Just published: 5 AI Tools You Need in 2025! 🚀\n\nWatch the full video: https://youtube.com/watch?v=dQw4...\n\n#AI #ContentCreation #Tools"
)

# ─── STEP 8: Verify everything ───
content_get(content_id="content_xxx")
# Check: channels.instagram.published === true
# Check: channels.youtube.published === true
# Check: channels.instagram.published_url, channels.youtube.published_url
```

---

## Error Handling

| Error | When | Fix |
|-------|------|-----|
| 409 "already published" | Content already published to this platform | Check with `content_get` first |
| 409 "publish in progress" | Container still processing | Wait and poll status |
| `not_authenticated` | Bridge: user not logged in | Log in via Electron app |
| `no_window` | Bridge: Electron window unavailable | Restart desktop app |
| `token_expired` | Instagram token expired | User must reconnect in UI; check with `instagram_validate_token` |
| `missing_params` | Required fields missing | Check param tables above |
| Video URL unreachable | SAS URL expired | Check `sasExpiresAt`, generate new SAS URLs |

## Tips for AI Agents

- **Always list accounts first** — never assume which platforms are connected or what IDs to use
- **Instagram is async** — `instagram_publish_reel` starts it, `instagram_publish_status` completes it. Poll every 15-30s.
- **YouTube is sync but slow** — response comes after upload, may take 1-5 minutes
- **LinkedIn is sync and fast** — response confirms immediately
- **Video must be on a public URL** — localhost URLs won't work for social APIs
- **Check SAS expiry** — if `sasExpiresAt` is past, the video URL won't work for publish
- **Use content_id for all publishing** — this is the only way publish results show up in the ContentLead UI dashboard
- **CTA must be set before publish** — for Instagram DM automation, call `instagram_update_automation(action="update_cta")` before `instagram_publish_reel`
