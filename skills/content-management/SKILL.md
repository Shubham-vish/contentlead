---
name: content-management
description: Full content lifecycle — create, browse, edit metadata, upload video/thumbnail, configure channels, toggle publish, schedule, set SAS URLs. All writes go to Cosmos DB and are visible in the ContentLead website UI.
tags: content, create, list, update, upload, thumbnail, video, sas, channels, configure, schedule, metadata, title, description, caption, status, draft, ready, published
---

# Content Management — Full Lifecycle

This skill covers everything you need to manage Content documents — from creation
through channel configuration — **before** publishing.

For actual publishing (Instagram/YouTube/LinkedIn), see the `social-media` skill.
For content research and inspiration, see the `content-inspiration` skill.

All tools write to the **same Cosmos DB** that the ContentLead website uses.
Changes are **immediately visible** in the UI dashboard at contentlead.in.

---

## Important Concepts

### Title Fields (3 different fields — know when to use each)

| Field | MCP param | Purpose | Where it shows |
|-------|-----------|---------|----------------|
| `title` | `title` | Internal/legacy title. Set at creation, rarely changed after. | Database ID-like label |
| `displayTitle` | `display_title` | **User-facing name** shown in the content list/dashboard. | Content list, cards |
| `contentTitle` | `content_title` | **Platform title** — used as YouTube video title, social post heading. | YouTube title, social posts |

**Rule of thumb:** Always set `display_title` for the dashboard. Set `content_title` for what appears on social platforms. Both default to `title` if not set.

### Video URL Fields (3 URLs — know the difference)

| Field | MCP param | What it is |
|-------|-----------|-----------|
| `videoUrl` | `video_url` | **Base blob URL** — permanent, no SAS token. Cannot be used for streaming or download without adding a SAS token. |
| `videoSasUrl` | `video_sas_url` | **Streaming URL** — blob URL + SAS token for browser playback. Expires at `sasExpiresAt`. |
| `downloadableSasUrl` | `downloadable_sas_url` | **Download/publish URL** — blob URL + SAS token with download permissions. This is what the publish pipeline uses. Expires at `sasExpiresAt`. |
| `sasExpiresAt` | `sas_expires_at` | ISO datetime when SAS URLs expire (typically 24h). After expiry, generate new SAS URLs. |

**Publishing uses this resolution order:** `downloadableSasUrl` → `videoSasUrl` → `videoUrl`. If all SAS URLs are expired, publish will fail. Always check `sasExpiresAt` before publishing.

### Content Status Values

| Status | Meaning |
|--------|---------|
| `draft` | Work in progress. Default for new content. |
| `ready` | Content is complete and ready to publish. |
| `published` | Content has been published to at least one platform. |

### Finding Account IDs

Before configuring channels, you need account/channel IDs. Get them from:
- **Instagram:** `instagram_get_accounts()` → use `id` field (social-media skill)
- **YouTube:** `GET /api/bridge/accounts` → `youtube.channels[].id` (social-media skill)
- **LinkedIn:** `linkedin_get_account()` → `accounts[].id` (social-media skill)

---

## MCP Tools

### 1. `content_create` — Create new content

Creates a new Content document in the database.

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | string | ✅ | — | Content title (max 255 chars) |
| `display_title` | string | | = title | User-facing display name in the dashboard |
| `content_title` | string | | = title | Platform-specific title (YouTube, social) |
| `description` | string | | `""` | Content description |
| `status` | string | | `"draft"` | `"draft"`, `"ready"`, or `"published"` |

**Returns:** Full Content document JSON with `content_id`, `id`, `userId`, `createdAt`, etc.

```python
content_create(title="5 AI Tools for 2025", description="Deep dive into the best AI tools")
# → { "id": "xxx", "content_id": "content_xxx", "title": "5 AI Tools for 2025", "status": "draft", ... }
```

---

### 2. `content_list` — Browse content

Lists the user's content documents with pagination and filtering.

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `limit` | int | | `20` | Max items to return |
| `offset` | int | | `0` | Pagination offset |
| `status` | string | | `""` (all) | Filter: `"draft"`, `"ready"`, `"published"`, or `""` for all |

**Returns:** `{ items: [Content...], total: N, offset: N, limit: N }`

Each item contains: `id`, `content_id`, `title`, `displayTitle`, `status`, `thumbnail`, `videoUrl`, `channels`, `createdAt`, `updatedAt`

```python
content_list(status="draft", limit=5)
# → { "items": [...], "total": 42, "offset": 0, "limit": 5 }

content_list(offset=20, limit=20)  # page 2
```

---

### 3. `content_get` — Get full content details

Returns the complete Content document with all metadata, channels, and publish state.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `content_id` | string | ✅ | The content ID to retrieve |

**Returns:** Full Content document JSON including:
- Top-level: `title`, `displayTitle`, `contentTitle`, `description`, `caption`, `status`
- Video: `videoUrl`, `videoSasUrl`, `downloadableSasUrl`, `sasExpiresAt`
- Media: `thumbnail`
- Channels: `channels.instagram`, `channels.youtube`, `channels.linkedin` (each with all config + publish state)
- Timestamps: `createdAt`, `updatedAt`

```python
content_get(content_id="content_xxx")
# Use to check: Is video attached? Is channel configured? Is it already published?
```

---

### 4. `content_update` — Update content metadata

Updates top-level metadata on a Content document. Only provided fields are changed — others remain untouched.

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `content_id` | string | ✅ | — | Content ID to update |
| `title` | string | | — | Internal title (legacy) |
| `display_title` | string | | — | Dashboard display name |
| `content_title` | string | | — | Platform title (YouTube, social) |
| `description` | string | | — | Content description |
| `caption` | string | | — | Social media caption text |
| `video_url` | string | | — | Base video blob URL (no SAS token) |
| `video_sas_url` | string | | — | Video streaming URL with SAS token |
| `downloadable_sas_url` | string | | — | Video download URL with SAS token |
| `sas_expires_at` | string | | — | ISO datetime when SAS URLs expire |
| `thumbnail` | string | | — | Thumbnail image URL |
| `status` | string | | — | `"draft"`, `"ready"`, or `"published"` |

**Returns:** Updated Content document JSON.

**Error:** `{ "error": "status must be draft, ready, or published" }` if invalid status.

```python
# Set multiple fields at once
content_update(
    content_id="content_xxx",
    display_title="5 AI Tools You Need in 2025",
    content_title="5 AI Tools You Need in 2025",
    description="A deep dive into the best AI tools for content creators",
    thumbnail="https://storage.blob.core.windows.net/.../thumb.jpg",
    status="ready"
)

# After uploading a video, set all 3 video URLs
content_update(
    content_id="content_xxx",
    video_url="https://storageaccount.blob.core.windows.net/videos/video.mp4",
    downloadable_sas_url="https://storageaccount.blob.core.windows.net/videos/video.mp4?sv=2022&sig=abc...",
    sas_expires_at="2025-06-15T12:00:00Z"
)
```

---

### 5. `content_get_upload_url` — Get SAS upload URL

Gets a pre-signed Azure Blob Storage URL for uploading a file (video or thumbnail) to content.

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `content_id` | string | ✅ | — | Content ID to upload to |
| `file_name` | string | ✅ | — | File name (e.g. `"video.mp4"`, `"thumbnail.jpg"`) |
| `content_type` | string | | auto-detect | MIME type (e.g. `"video/mp4"`, `"image/jpeg"`) |

**Returns:**
```json
{
  "uploadUrl": "https://...?sv=2022&sig=...",   // PUT the file binary here
  "videoUrl": "https://.../video.mp4",           // permanent blob URL (no SAS)
  "downloadableSasUrl": "https://...?sv=...",    // read URL with SAS token
  "sasExpiresAt": "2025-06-15T12:00:00Z",       // when URLs expire
  "headers": { "x-ms-blob-type": "BlockBlob" }, // required PUT headers
  "metadata": { "contentId": "content_xxx" }
}
```

**After upload, update the Content doc:**
```python
# Step 1: Get upload URL
result = content_get_upload_url(content_id="content_xxx", file_name="video.mp4", content_type="video/mp4")

# Step 2: Upload file (PUT binary to uploadUrl — done by client, not AI)

# Step 3: Link the URLs to the Content document
content_update(
    content_id="content_xxx",
    video_url=result["videoUrl"],
    downloadable_sas_url=result["downloadableSasUrl"],
    sas_expires_at=result["sasExpiresAt"]
)
```

> **Note:** The AI agent cannot upload binary file data itself. This tool is useful when
> a client system or user is doing the actual upload, and the AI coordinates the flow.

---

### 6. `content_configure_publish` — Configure channel for publishing

Sets platform-specific publish config on `Content.channels[platform]`. Call this **before** publishing.

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `content_id` | string | ✅ | — | Content ID to configure |
| `platform` | string | ✅ | — | `"instagram"`, `"youtube"`, or `"linkedin"` |

#### Common params (all platforms)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `selected_account` | string | — | Account/channel ID to publish from. Get from `instagram_get_accounts()` or `linkedin_get_account()` or bridge. |
| `post_type` | string | — | **Instagram:** `"reel"`, `"feed"`, `"story"`. **YouTube:** `"long"`, `"short"`. **LinkedIn:** `"post"`, `"article"`. |
| `to_publish` | bool | — | Mark this channel for publishing (`true`/`false`) |
| `enabled` | bool | — | Enable/disable this channel (`true`/`false`) |
| `status` | string | — | Channel status: `"draft"`, `"scheduled"`, `"ready"` |
| `publish_date` | string | — | Scheduled date (ISO, e.g. `"2025-06-15"`) |
| `publish_timestamp` | string | — | Scheduled datetime (ISO, e.g. `"2025-06-15T14:00:00+05:30"`) |

#### Instagram-specific params

| Param | Type | Description |
|-------|------|-------------|
| `caption` | string | Post caption text |
| `hashtags` | string | JSON array: `'["ai", "video", "tools"]'` |
| `location` | string | Location tag (e.g. `"Mumbai, India"`) |

> **Note:** `tagged_users` is in the server allowlist but not yet exposed as an MCP param.

#### YouTube-specific params

| Param | Type | Description |
|-------|------|-------------|
| `title` | string | Video title |
| `description` | string | Video description |
| `tags` | string | JSON array: `'["AI", "tutorial"]'` |
| `privacy` | string | `"public"`, `"private"`, or `"unlisted"` |
| `thumbnail_url` | string | Custom thumbnail URL |
| `category` | string | YouTube category ID (default `"22"` = People & Blogs) |

#### LinkedIn-specific params

| Param | Type | Description |
|-------|------|-------------|
| `title` | string | Post title |
| `description` | string | Post content text (stored as `content` field internally) |
| `hashtags` | string | JSON array: `'["marketing", "ai"]'` |

**Returns:**
```json
{
  "success": true,
  "contentId": "content_xxx",
  "platform": "instagram",
  "applied": ["caption", "hashtags", "selected_account", "platform"],
  "rejected": ["some_invalid_field"],  // only if you sent blocked/unknown fields
  "config": { /* current channel config after update */ }
}
```

**Blocked fields** (system-owned — set automatically during publish, cannot be manually set):
`published`, `published_at`, `media_id`, `video_id`, `container_id`, `publish_progress`,
`published_url`, `youtube_response`, `instagram_response`, `linkedin_response`,
`cta_comment_id`, `cta_comment_posted`, `cta_comment_pinned`, `error_message`

---

## Content Document Schema

```
Content {
  // Identity
  id                    // Cosmos DB doc ID
  content_id            // Content ID (format: "content_xxx")
  userId                // Owner user ID
  createdAt, updatedAt  // Timestamps

  // Top-level metadata (content_update)
  title                 // Internal title
  displayTitle          // Dashboard display name
  contentTitle          // Platform title (YouTube, social)
  description           // Content description
  caption               // Social media caption

  // Media (content_update)
  thumbnail             // Thumbnail image URL
  videoUrl              // Base video blob URL (no SAS token)
  videoSasUrl           // Streaming URL with SAS token
  downloadableSasUrl    // Download/publish URL with SAS token
  sasExpiresAt          // When SAS URLs expire

  // Status
  status                // "draft" | "ready" | "published"

  // Channel configs (content_configure_publish)
  channels: {
    instagram: {
      // User-configurable:
      platform, post_type, caption, hashtags, location, tagged_users,
      selected_account, to_publish, enabled, status,
      publish_date, publish_timestamp

      // System-written after publish (read-only):
      published          // true when published
      published_at       // ISO timestamp
      media_id           // Instagram media ID
      container_id       // Instagram container ID (during async publish)
      published_url      // Permalink (e.g. https://instagram.com/reel/xxx)
      publish_progress   // { stage, timestamp, error } — tracks async flow
      error_message      // Error details if publish failed
    }

    youtube: {
      // User-configurable:
      platform, post_type, title, description, tags, category, privacy,
      thumbnail_url, selected_account, to_publish, enabled, status,
      publish_date, publish_timestamp, playlist_id

      // System-written after publish (read-only):
      published, published_at, video_id, published_url,
      youtube_response,   // Full YouTube API response
      cta_comment_id,     // YouTube comment ID for CTA
      cta_comment_posted, // true if CTA comment was posted
      cta_comment_pinned, // true if CTA comment was pinned
      cta_comment_posted_at
    }

    linkedin: {
      // User-configurable:
      platform, post_type, title, content, hashtags, mention_users,
      selected_account, to_publish, enabled, status,
      publish_date, publish_timestamp

      // System-written after publish (read-only):
      published, published_at, linkedin_id, published_url
    }
  }
}
```

---

## Workflows

### Workflow 1: Create content from scratch
```python
# Create new content
result = content_create(title="5 AI Tools for 2025", description="Deep dive...")
content_id = result["content_id"]  # "content_xxx"
```

### Workflow 2: Find existing content
```python
# List all drafts
content_list(status="draft", limit=10)

# List all content (paginated)
content_list(limit=20, offset=0)  # page 1
content_list(limit=20, offset=20)  # page 2

# Find by checking each item's title
all_content = content_list(limit=50)
# Search items for matching title/description
```

### Workflow 3: Full lifecycle — create → edit → configure → publish
```python
# 1. Create content
content_create(title="5 AI Tools for 2025")
# → content_id = "content_xxx"

# 2. Set metadata
content_update(
    content_id="content_xxx",
    display_title="5 AI Tools You Need in 2025",
    content_title="5 AI Tools You Need in 2025",
    description="A deep dive into AI tools for content creators",
    caption="5 AI tools you need right now! 🚀 #AI #tools",
    thumbnail="https://storage.blob.../thumb.jpg",
    video_url="https://storage.blob.../video.mp4",
    downloadable_sas_url="https://storage.blob.../video.mp4?sv=...",
    sas_expires_at="2025-06-15T12:00:00Z",
    status="ready"
)

# 3. Get account IDs (social-media skill)
# instagram_get_accounts() → find account ID
# linkedin_get_account() → find account ID

# 4. Configure Instagram channel
content_configure_publish(
    content_id="content_xxx",
    platform="instagram",
    enabled=True, to_publish=True,
    caption="5 AI tools you need right now! 🚀",
    hashtags='["AI", "tools", "2025", "contentcreator"]',
    selected_account="ig_account_id",
    post_type="reel"
)

# 5. Configure YouTube channel
content_configure_publish(
    content_id="content_xxx",
    platform="youtube",
    enabled=True, to_publish=True,
    title="5 AI Tools You Need in 2025",
    description="In this video, I share the top 5 AI tools...",
    tags='["AI", "tools", "tutorial", "2025"]',
    privacy="public",
    category="22",
    selected_account="UCxxx",
    post_type="long"
)

# 6. Configure LinkedIn channel
content_configure_publish(
    content_id="content_xxx",
    platform="linkedin",
    enabled=True, to_publish=True,
    title="5 AI Tools You Need in 2025",
    description="Just published a deep dive into AI tools...\n\n#AI #ContentCreation",
    selected_account="li_account_id",
    post_type="post"
)

# 7. Publish — see social-media skill
# instagram_publish_reel(content_id="content_xxx")
# instagram_publish_status(content_id="content_xxx", auto_publish=True)
# youtube_publish(content_id="content_xxx")
```

### Workflow 4: Schedule content for later
```python
content_configure_publish(
    content_id="content_xxx",
    platform="instagram",
    status="scheduled",
    publish_date="2025-06-15",
    publish_timestamp="2025-06-15T14:00:00+05:30"
)
```

### Workflow 5: Check publish readiness
```python
content = content_get(content_id="content_xxx")

# Check: Does it have a video?
has_video = bool(content.get("videoUrl") or content.get("downloadableSasUrl"))

# Check: Are SAS URLs still valid?
from datetime import datetime
sas_expires = content.get("sasExpiresAt")
sas_valid = sas_expires and datetime.fromisoformat(sas_expires) > datetime.now()

# Check: Is Instagram configured?
ig = content.get("channels", {}).get("instagram", {})
ig_ready = ig.get("selected_account") and ig.get("caption")

# Check: Already published?
ig_published = ig.get("published", False)
```

### Workflow 6: Upload video via SAS URL flow
```python
# 1. Get upload URL
upload = content_get_upload_url(
    content_id="content_xxx",
    file_name="final-render.mp4",
    content_type="video/mp4"
)
# Returns: { uploadUrl, videoUrl, downloadableSasUrl, sasExpiresAt, headers }

# 2. Client/system uploads binary to upload["uploadUrl"] via HTTP PUT
#    with headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": "video/mp4" }

# 3. Link uploaded video to content
content_update(
    content_id="content_xxx",
    video_url=upload["videoUrl"],
    downloadable_sas_url=upload["downloadableSasUrl"],
    sas_expires_at=upload["sasExpiresAt"]
)
```

---

## Error Handling

| Error | When | What to do |
|-------|------|-----------|
| `{ "error": "Unauthorized" }` | Invalid/missing auth | Check MCP auth setup (x-user-id, x-api-key) |
| `{ "error": "Content not found" }` | Invalid content_id | Verify with `content_list()` |
| `{ "error": "Title is required" }` | `content_create` without title | Provide `title` param |
| `{ "error": "Title must be 255 characters or less" }` | Title too long | Shorten title |
| `{ "error": "status must be draft, ready, or published" }` | Invalid status in content_update | Use valid value |
| `{ "error": "Invalid platform" }` | configure_publish with bad platform | Use `instagram`, `youtube`, or `linkedin` |
| Fields in `rejected` array | configure_publish with blocked fields | Don't set system-owned fields (published, media_id, etc.) |

---

## Auth Setup

MCP tools authenticate via the SkillTownClient:

```
MCP Tool → SkillTownClient → HTTP Request → SkillTown Web API → Cosmos DB
                ↓
    Headers: x-user-id, x-api-key (JWT), x-mcp-secret
```

Auth is configured automatically when the MCP server starts with valid credentials.
No manual setup needed by the AI agent.
