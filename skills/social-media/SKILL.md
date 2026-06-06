---
name: social-media
description: Publish content to Instagram, LinkedIn, and YouTube from the desktop app. Covers account listing, publishing workflows, and status polling for each platform.
tags: publish, instagram, linkedin, youtube, social, post, upload, reel, accounts, share
---

# Social Media Publishing

Publish directly from the desktop editor to Instagram, LinkedIn, and YouTube using bridge endpoints. The bridge authenticates through the user's web session — no extra API keys needed.

## Prerequisites

- User must be **logged in** on the ContentLead web app (inside the Electron window)
- Social accounts must be **connected** via the web app's settings (OAuth)
- For Instagram/YouTube video publishing, the video must be on a **public URL** (uploaded via the content pipeline, not localhost)

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
