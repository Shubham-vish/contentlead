# Content Lifecycle — Create, Read, Update, Upload

> **Copilot CLI without MCP server:** use bridge mode through the running SkillTown Desktop app. See [`bridge-mode.md`](bridge-mode.md) for auth, endpoint parity, and curl examples.

## MCP Tools

### `content_create` — Create new content

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

### `content_list` — Browse content

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

### `content_get` — Get full content details

Returns the complete Content document with all metadata, channels, and publish state.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `content_id` | string | ✅ | The content ID to retrieve |

**Returns:** Full Content document JSON including:
- Top-level: `title`, `displayTitle`, `contentTitle`, `description`, `caption`, `status`
- Video: `videoUrl`, `videoSasUrl`, `downloadableSasUrl`, `sasExpiresAt`
- Media: `thumbnail`
- Channels: `channels.instagram`, `channels.youtube`, `channels.linkedin` (each with config + publish state)
- Timestamps: `createdAt`, `updatedAt`

```python
content_get(content_id="content_xxx")
# Use to check: Is video attached? Is channel configured? Is it already published?
```

---

### `content_update` — Update content metadata

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

# After uploading a video, set all video URLs
content_update(
    content_id="content_xxx",
    video_url="https://storageaccount.blob.core.windows.net/videos/video.mp4",
    downloadable_sas_url="https://storageaccount.blob.core.windows.net/videos/video.mp4?sv=2022&sig=abc...",
    sas_expires_at="2025-06-15T12:00:00Z"
)
```

---

### `content_get_upload_url` — Get SAS upload URL

Gets a pre-signed Azure Blob Storage URL for uploading a file (video or thumbnail) to content.

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `content_id` | string | ✅ | — | Content ID to upload to |
| `file_name` | string | ✅ | — | File name (e.g. `"video.mp4"`, `"thumbnail.jpg"`) |
| `content_type` | string | | auto-detect | MIME type (e.g. `"video/mp4"`, `"image/jpeg"`) |

**Returns:**
```json
{
  "uploadUrl": "https://...?sv=2022&sig=...",
  "videoUrl": "https://.../video.mp4",
  "downloadableSasUrl": "https://...?sv=...",
  "sasExpiresAt": "2027-06-15T12:00:00.000Z",
  "headers": {
    "x-ms-blob-type": "BlockBlob",
    "Content-Type": "video/mp4"
  },
  "metadata": {
    "blobName": "content_xxx/uuid-video.mp4",
    "containerName": "content-videos",
    "accountName": "storageaccountname"
  }
}
```

**After upload, link the URLs to the Content doc:**
```python
# 1. Get upload URL
result = content_get_upload_url(content_id="content_xxx", file_name="video.mp4", content_type="video/mp4")

# 2. Upload file (PUT binary to uploadUrl — done by client, not AI)

# 3. Link the URLs to the Content document
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

  // Channel configs (content_configure_publish) — see channel-configuration.md
  channels: {
    instagram: { ... }
    youtube: { ... }
    linkedin: { ... }
  }
}
```

For channel sub-schemas, see `channel-configuration.md`.

---

## Error Handling

| Error | When | What to do |
|-------|------|-----------|
| `{ "error": "Unauthorized" }` | Invalid/missing auth | Check MCP auth setup (x-user-id, x-api-key) |
| `{ "error": "Content not found" }` | Invalid content_id | Verify with `content_list()` |
| `{ "error": "Title is required" }` | `content_create` without title | Provide `title` param |
| `{ "error": "Title must be 255 characters or less" }` | Title too long | Shorten title |
| `{ "error": "status must be draft, ready, or published" }` | Invalid status | Use `draft`, `ready`, or `published` |

---

## Auth

MCP tools authenticate via the SkillTownClient:

```
MCP Tool → SkillTownClient → HTTP Request → SkillTown Web API → Cosmos DB
                ↓
    Headers: x-user-id, x-api-key (JWT), x-mcp-secret
```

Auth is configured automatically when the MCP server starts with valid credentials.
