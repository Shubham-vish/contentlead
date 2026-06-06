---
name: content-management
description: Full content lifecycle — create, browse, edit metadata, upload video/thumbnail, configure channels, toggle publish, schedule, set SAS URLs. All writes go to Cosmos DB and are visible in the ContentLead website UI.
tags: content, create, list, update, upload, thumbnail, video, sas, channels, configure, schedule, metadata, title, description, caption, status, draft, ready, published
---

# Content Management — Full Lifecycle

This skill covers everything you need to manage Content documents **before** publishing.
For actual publishing (Instagram/YouTube/LinkedIn), see the `social-media` skill.

All tools write to the same Cosmos DB that the ContentLead website uses — changes are
immediately visible in the UI dashboard.

## MCP Tools (9 tools)

### Content CRUD (4 tools)

| Tool | What it does |
|------|-------------|
| `content_create` | Create a new Content document. Params: `title` (required), `display_title`, `content_title`, `description`, `status` (default: "draft"). Returns the new Content with its `content_id`. |
| `content_list` | List user's content with pagination. Params: `limit` (default 20), `offset`, `status` filter ("draft"/"ready"/"published"/empty for all). Returns `{ items, total, offset, limit }`. |
| `content_get` | Get a single Content document with all metadata, channels config, and publish status. Params: `content_id`. |
| `content_update` | Update top-level metadata. Params: `content_id` + any of: `title`, `display_title`, `content_title`, `description`, `caption`, `video_url`, `video_sas_url`, `downloadable_sas_url`, `sas_expires_at`, `thumbnail`, `status`. Only provided fields are updated. |

### File Upload (1 tool)

| Tool | What it does |
|------|-------------|
| `content_get_upload_url` | Get a pre-signed SAS upload URL for attaching a video or thumbnail to content. Params: `content_id`, `file_name`, `content_type` (optional). Returns `uploadUrl` (PUT here), `blobUrl` (permanent URL), `sasUrl` (URL with read SAS). After uploading, call `content_update` to set `video_url` / `thumbnail` / `downloadable_sas_url`. |

### Channel Configuration (1 tool)

| Tool | What it does |
|------|-------------|
| `content_configure_publish` | Set platform-specific publish config on `Content.channels[platform]`. See details below. |

### Publishing (3 tools — in `social-media` skill)

| Tool | Where documented |
|------|-----------------|
| `instagram_publish_reel` | `social-media` skill |
| `instagram_publish_status` | `social-media` skill |
| `youtube_publish` | `social-media` skill |

---

## content_configure_publish — Full Reference

Sets channel-level metadata on `Content.channels.{platform}`. Call this BEFORE publishing.

### Common params (all platforms)
| Param | Type | Description |
|-------|------|-------------|
| `content_id` | string | **Required.** The content to configure. |
| `platform` | string | **Required.** `"instagram"`, `"youtube"`, or `"linkedin"` |
| `selected_account` | string | Account/channel ID to publish from |
| `post_type` | string | Platform-specific: `reel`/`feed`/`story` (IG), `long`/`short` (YT), `post`/`article` (LI) |
| `to_publish` | bool | Mark this channel for publishing |
| `enabled` | bool | Enable/disable this channel |
| `status` | string | Channel status: `"draft"`, `"scheduled"`, `"ready"` |
| `publish_date` | string | Scheduled publish date (ISO, e.g. `"2025-06-15"`) |
| `publish_timestamp` | string | Scheduled publish timestamp (ISO datetime) |

### Instagram-specific params
| Param | Type | Description |
|-------|------|-------------|
| `caption` | string | Post caption text |
| `hashtags` | string (JSON array) | e.g. `'["ai", "video", "tools"]'` |
| `location` | string | Location tag |

### YouTube-specific params
| Param | Type | Description |
|-------|------|-------------|
| `title` | string | Video title |
| `description` | string | Video description |
| `tags` | string (JSON array) | e.g. `'["AI", "tutorial"]'` |
| `privacy` | string | `"public"`, `"private"`, or `"unlisted"` |
| `thumbnail_url` | string | Custom thumbnail URL |
| `category` | string | YouTube category ID (default `"22"` = People & Blogs) |

### LinkedIn-specific params
| Param | Type | Description |
|-------|------|-------------|
| `title` | string | Post title |
| `description` | string | Post content text |
| `hashtags` | string (JSON array) | e.g. `'["marketing", "ai"]'` |

### Blocked fields (system-owned — cannot be set via this tool)
`published`, `published_at`, `media_id`, `video_id`, `container_id`, `publish_progress`,
`published_url`, `youtube_response`, `instagram_response`, `linkedin_response`,
`cta_comment_*`, `error_message`

---

## Content Document Structure

```
Content {
  id, content_id, userId, createdAt, updatedAt

  // Top-level metadata (set via content_update)
  title, displayTitle, contentTitle
  description, caption
  thumbnail                          // thumbnail URL
  videoUrl                           // base blob URL (no SAS)
  videoSasUrl                        // streaming URL with SAS token
  downloadableSasUrl                 // download URL with SAS token
  sasExpiresAt                       // when SAS URLs expire
  status                             // "draft" | "ready" | "published"

  // Channel configs (set via content_configure_publish)
  channels: {
    instagram: {
      platform, post_type, caption, hashtags, location, tagged_users,
      selected_account, to_publish, enabled, status,
      publish_date, publish_timestamp,
      // System-written after publish:
      published, published_at, media_id, container_id,
      published_url, publish_progress, error_message
    },
    youtube: {
      platform, post_type, title, description, tags, category, privacy,
      thumbnail_url, selected_account, to_publish, enabled, status,
      publish_date, publish_timestamp,
      // System-written after publish:
      published, published_at, video_id, published_url,
      youtube_response, cta_comment_id, cta_comment_posted,
      cta_comment_pinned, cta_comment_posted_at
    },
    linkedin: {
      platform, post_type, title, content, hashtags, mention_users,
      selected_account, to_publish, enabled, status,
      publish_date, publish_timestamp,
      // System-written after publish:
      published, published_at, linkedin_id, published_url
    }
  }
}
```

---

## Workflows

### Create content from scratch
```
content_create(title="5 AI Tools for 2025", description="Deep dive into...")
# → returns { content_id: "content_xxx", ... }
```

### Find existing content
```
content_list(status="draft", limit=10)
# → returns { items: [...], total: 42 }
```

### Full lifecycle: create → configure → publish
```
# 1. Create
content_create(title="5 AI Tools for 2025")
# → content_id = "content_xxx"

# 2. Upload video (if you have a URL)
content_update(content_id="content_xxx", video_url="https://blob.../video.mp4")

# 3. Set thumbnail
content_update(content_id="content_xxx", thumbnail="https://blob.../thumb.jpg")

# 4. Set status to ready
content_update(content_id="content_xxx", status="ready")

# 5. Enable Instagram channel + set config
content_configure_publish(
  content_id="content_xxx", platform="instagram",
  enabled=true, to_publish=true,
  caption="5 AI tools you need! 🚀",
  hashtags='["AI", "tools"]',
  selected_account="ig_account_id"
)

# 6. Enable YouTube channel + set config
content_configure_publish(
  content_id="content_xxx", platform="youtube",
  enabled=true, to_publish=true,
  title="5 AI Tools You Need in 2025",
  description="In this video...",
  tags='["AI", "tutorial"]',
  privacy="public",
  selected_account="channel_id"
)

# 7. Publish (see social-media skill)
instagram_publish_reel(content_id="content_xxx")
instagram_publish_status(content_id="content_xxx", auto_publish=true)
youtube_publish(content_id="content_xxx")
```

### Upload video via SAS URL
```
# 1. Get upload URL
content_get_upload_url(content_id="content_xxx", file_name="video.mp4", content_type="video/mp4")
# → { uploadUrl: "https://...?sv=...&sig=...", blobUrl: "https://.../video.mp4", sasUrl: "https://...?..." }

# 2. Upload the file (PUT to uploadUrl with the binary data)
# This step must be done by the client/system, not by the AI directly

# 3. Set the URLs on the Content doc
content_update(
  content_id="content_xxx",
  video_url="<blobUrl from step 1>",
  downloadable_sas_url="<sasUrl from step 1>",
  sas_expires_at="2025-06-15T12:00:00Z"
)
```

### Schedule for later
```
content_configure_publish(
  content_id="content_xxx", platform="instagram",
  status="scheduled",
  publish_date="2025-06-15",
  publish_timestamp="2025-06-15T14:00:00+05:30"
)
```

### Check what's published
```
content_get(content_id="content_xxx")
# Check: channels.instagram.published, channels.youtube.published
# Check: channels.instagram.published_url, channels.youtube.published_url
```
