# Channel Configuration — Set Up Platforms Before Publishing

Use `POST /api/bridge/content/configure-publish` to set platform-specific settings on a Content document **before** publishing.

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","platform":"instagram","config":{"enabled":true,"toPublish":true}}'
```

---

## Endpoint body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contentId` | string | ✅ | Content ID to configure |
| `platform` | string | ✅ | `instagram`, `youtube`, or `linkedin` |
| `config` | object | ✅ | Platform-specific settings below |

### Common `config` fields (all platforms)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `selectedAccount` | string | — | Account/channel ID. Get Instagram accounts from `GET /api/bridge/instagram/accounts`; LinkedIn and aggregate accounts from `GET /api/bridge/accounts`. |
| `postType` | string | — | **IG:** `reel`, `feed`, `story` · **YT:** `long`, `short` · **LI:** `post`, `article` |
| `toPublish` | bool | — | Mark channel for publishing |
| `enabled` | bool | — | Enable/disable this channel |
| `status` | string | — | Channel status: `draft`, `scheduled`, `ready` (convention, not enforced) |
| `publishDate` | string | — | Scheduled date: `2025-06-15` |
| `publishTimestamp` | string | — | Scheduled datetime: `2025-06-15T14:00:00+05:30` |

### Instagram-specific `config`

| Field | Type | Description |
|-------|------|-------------|
| `caption` | string | Post caption text |
| `hashtags` | array or JSON string | Hashtags, e.g. `["ai", "video", "tools"]` |
| `location` | string | Location tag, e.g. `Mumbai, India` |
| `taggedUsers` | array or JSON string | Tagged users, if supported by the current backend |

### YouTube-specific `config`

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Video title |
| `description` | string | Video description |
| `tags` | array or JSON string | Tags, e.g. `["AI", "tutorial"]` |
| `privacy` | string | `public`, `private`, or `unlisted` |
| `thumbnailUrl` | string | Custom thumbnail URL |
| `category` | string | YouTube category ID (default `22` = People & Blogs) |
| `playlistId` | string | Playlist ID, if supported by the current backend |

### LinkedIn-specific `config`

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Post title |
| `description` | string | Post content text (stored as `content` internally) |
| `hashtags` | array or JSON string | Hashtags, e.g. `["marketing", "ai"]` |
| `mentionUsers` | array or JSON string | Mentioned users, if supported by the current backend |

---

## Response

```json
{
  "success": true,
  "contentId": "content_xxx",
  "platform": "instagram",
  "applied": ["caption", "hashtags", "selectedAccount", "platform"],
  "rejected": ["someInvalidField"],
  "config": { "...": "current channel config after update" }
}
```

---

## Blocked Fields (System-Owned — Cannot Be Set Manually)

These are written automatically during publish. Setting them through channel configuration will result in rejection:

`published`, `published_at`, `media_id`, `video_id`, `container_id`, `publish_progress`,
`published_url`, `youtube_response`, `instagram_response`, `linkedin_response`, `linkedin_id`,
`cta_comment_id`, `cta_comment_posted`, `cta_comment_pinned`, `cta_comment_posted_at`,
`publish_date_ist`, `error_message`

---

## Channel Sub-Schemas

### `channels.instagram`

```text
// User-configurable:
platform, post_type, caption, hashtags, location, tagged_users,
selected_account, to_publish, enabled, status,
publish_date, publish_timestamp

// System-written after publish:
published, published_at, media_id, container_id, published_url,
publish_progress, error_message
```

### `channels.youtube`

```text
// User-configurable:
platform, post_type, title, description, tags, category, privacy,
thumbnail_url, selected_account, to_publish, enabled, status,
publish_date, publish_timestamp, playlist_id

// System-written after publish:
published, published_at, video_id, published_url, youtube_response,
cta_comment_id, cta_comment_posted, cta_comment_pinned, cta_comment_posted_at
```

### `channels.linkedin`

```text
// User-configurable:
platform, post_type, title, content, hashtags, mention_users,
selected_account, to_publish, enabled, status,
publish_date, publish_timestamp

// System-written after publish or manual tracking update:
published, published_at, linkedin_id, published_url
```

> **⚠️ LinkedIn note:** `POST /api/bridge/publish/linkedin` does not update these fields automatically. After posting, call `POST /api/bridge/content/configure-publish` with `platform:"linkedin"` and `config.status:"published"`. See `linkedin.md`.

---

## Examples

### Configure Instagram for a reel

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","platform":"instagram","config":{"enabled":true,"toPublish":true,"caption":"5 AI tools you need right now! 🚀

Comment FREE to get the guide!","hashtags":["AI","tools","2025","contentcreator"],"selectedAccount":"ig_account_id","postType":"reel"}}'
```

### Configure YouTube

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","platform":"youtube","config":{"enabled":true,"toPublish":true,"title":"5 AI Tools You Need in 2025","description":"In this video, I share the top 5 AI tools...","tags":["AI","tools","tutorial","2025"],"privacy":"public","category":"22","selectedAccount":"UCxxx","postType":"long"}}'
```

### Schedule content for later

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","platform":"instagram","config":{"status":"scheduled","publishDate":"2025-06-15","publishTimestamp":"2025-06-15T14:00:00+05:30"}}'
```

### Toggle a channel off

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","platform":"youtube","config":{"enabled":false,"toPublish":false}}'
```
