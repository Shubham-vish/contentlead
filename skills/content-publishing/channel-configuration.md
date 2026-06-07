# Channel Configuration — Set Up Platforms Before Publishing

Use `content_configure_publish` to set platform-specific settings on a Content document
**before** calling the publish tools.

---

## `content_configure_publish` — Configure channel for publishing

Sets config on `Content.channels[platform]`. Call once per platform.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `content_id` | string | ✅ | Content ID to configure |
| `platform` | string | ✅ | `"instagram"`, `"youtube"`, or `"linkedin"` |

### Common Params (all platforms)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `selected_account` | string | — | Account/channel ID. Get from `instagram_get_accounts()`, `linkedin_get_account()`, or bridge `GET /api/bridge/accounts`. |
| `post_type` | string | — | **IG:** `"reel"`, `"feed"`, `"story"` · **YT:** `"long"`, `"short"` · **LI:** `"post"`, `"article"` |
| `to_publish` | bool | — | Mark channel for publishing (`true`/`false`) |
| `enabled` | bool | — | Enable/disable this channel |
| `status` | string | — | Channel status: `"draft"`, `"scheduled"`, `"ready"` (convention, not enforced) |
| `publish_date` | string | — | Scheduled date: `"2025-06-15"` |
| `publish_timestamp` | string | — | Scheduled datetime: `"2025-06-15T14:00:00+05:30"` |

### Instagram-Specific

| Param | Type | Description |
|-------|------|-------------|
| `caption` | string | Post caption text |
| `hashtags` | string | JSON array: `'["ai", "video", "tools"]'` |
| `location` | string | Location tag (e.g. `"Mumbai, India"`) |

> `tagged_users` is in the server allowlist but not yet exposed as an MCP tool param.

### YouTube-Specific

| Param | Type | Description |
|-------|------|-------------|
| `title` | string | Video title |
| `description` | string | Video description |
| `tags` | string | JSON array: `'["AI", "tutorial"]'` |
| `privacy` | string | `"public"`, `"private"`, or `"unlisted"` |
| `thumbnail_url` | string | Custom thumbnail URL |
| `category` | string | YouTube category ID (default `"22"` = People & Blogs) |

> `playlist_id` is in the server allowlist but not yet exposed as an MCP tool param.

### LinkedIn-Specific

| Param | Type | Description |
|-------|------|-------------|
| `title` | string | Post title |
| `description` | string | Post content text (stored as `content` field internally) |
| `hashtags` | string | JSON array: `'["marketing", "ai"]'` |

> `mention_users` is in the server allowlist but not yet exposed as an MCP tool param.

---

## Response

```json
{
  "success": true,
  "contentId": "content_xxx",
  "platform": "instagram",
  "applied": ["caption", "hashtags", "selected_account", "platform"],
  "rejected": ["some_invalid_field"],
  "config": { /* current channel config after update */ }
}
```

---

## Blocked Fields (System-Owned — Cannot Be Set Manually)

These are written **automatically** during publish. Setting them via `content_configure_publish` will result in rejection:

`published`, `published_at`, `media_id`, `video_id`, `container_id`, `publish_progress`,
`published_url`, `youtube_response`, `instagram_response`, `linkedin_response`, `linkedin_id`,
`cta_comment_id`, `cta_comment_posted`, `cta_comment_pinned`, `cta_comment_posted_at`,
`publish_date_ist`, `error_message`

---

## Channel Sub-Schemas

### `channels.instagram`

```
// User-configurable (via content_configure_publish):
platform, post_type, caption, hashtags, location, tagged_users,
selected_account, to_publish, enabled, status,
publish_date, publish_timestamp

// System-written after publish (read-only):
published          // true when published
published_at       // ISO timestamp
media_id           // Instagram media ID
container_id       // Container ID (during async publish)
published_url      // Permalink (e.g. https://instagram.com/reel/xxx)
publish_progress   // { stage, timestamp, error }
error_message      // Error details if publish failed
```

### `channels.youtube`

```
// User-configurable:
platform, post_type, title, description, tags, category, privacy,
thumbnail_url, selected_account, to_publish, enabled, status,
publish_date, publish_timestamp, playlist_id

// System-written after publish:
published, published_at, video_id, published_url,
youtube_response,        // Full YouTube API response
cta_comment_id,          // YouTube comment ID for CTA
cta_comment_posted,      // true if CTA comment was posted
cta_comment_pinned,      // true if CTA comment was pinned
cta_comment_posted_at
```

### `channels.linkedin`

```
// User-configurable:
platform, post_type, title, content, hashtags, mention_users,
selected_account, to_publish, enabled, status,
publish_date, publish_timestamp

// System-written after publish:
published, published_at, linkedin_id, published_url
```

> **⚠️ LinkedIn note:** The `linkedin_post` tool does NOT write to these fields automatically.
> You must manually call `content_configure_publish(platform="linkedin", status="published")`
> after posting. See `linkedin.md` for details.

---

## Examples

### Configure Instagram for a reel

```python
content_configure_publish(
    content_id="content_xxx",
    platform="instagram",
    enabled=True,
    to_publish=True,
    caption="5 AI tools you need right now! 🚀\n\nComment 'FREE' to get the guide!",
    hashtags='["AI", "tools", "2025", "contentcreator"]',
    selected_account="ig_account_id",
    post_type="reel"
)
```

### Configure YouTube

```python
content_configure_publish(
    content_id="content_xxx",
    platform="youtube",
    enabled=True,
    to_publish=True,
    title="5 AI Tools You Need in 2025",
    description="In this video, I share the top 5 AI tools...",
    tags='["AI", "tools", "tutorial", "2025"]',
    privacy="public",
    category="22",
    selected_account="UCxxx",
    post_type="long"
)
```

### Schedule content for later

```python
content_configure_publish(
    content_id="content_xxx",
    platform="instagram",
    status="scheduled",
    publish_date="2025-06-15",
    publish_timestamp="2025-06-15T14:00:00+05:30"
)
```

### Toggle a channel off

```python
content_configure_publish(
    content_id="content_xxx",
    platform="youtube",
    enabled=False,
    to_publish=False
)
```
