# Content Lifecycle — Create, Read, Update, Upload

The SkillTown Desktop local HTTP API is the documented interface for content lifecycle work. Read `~/.skilltown-desktop/api.json` fresh before each call and use `Authorization: Bearer $TOKEN`.

## Endpoints

### `POST /api/content/create` — Create new content

Creates a new Content document in Cosmos DB. This endpoint lives in the `cl-editor` skill (`contentlead/infrastructure.md`) because it can also open an editor tab.

> **⚠️ There is no `POST /api/bridge/content` create route.** Create with `/api/content/create`, then use `PUT /api/bridge/content/:id` to set titles, video URLs, captions, thumbnails, and status.

| Body field | Type | Required | Default | Description |
|------------|------|----------|---------|-------------|
| `title` | string | ✅ | — | Content title |
| `description` | string | | `""` | Content description |
| `waitForReady` | bool | | `false` | Wait for the editor tab to be ready |
| `timeoutMs` | int | | route default | Max wait time if `waitForReady` is true |

**Returns:** `{ contentId, tabId, editorReady, ... }`.

```bash
curl -X POST "http://127.0.0.1:$PORT/api/content/create"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"title":"5 AI Tools for 2025","description":"Deep dive into the best AI tools","waitForReady":true,"timeoutMs":120000}'
```

To set dashboard/platform titles immediately after creation:

```bash
curl -X PUT "http://127.0.0.1:$PORT/api/bridge/content/content_xxx"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"displayTitle":"5 AI Tools You Need in 2025","contentTitle":"5 AI Tools You Need in 2025","status":"draft"}'
```

---

### `GET /api/bridge/content` — Browse content

Lists the user's content documents with pagination and filtering.

| Query | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | int | `20` | Max items to return |
| `offset` | int | `0` | Pagination offset |
| `status` | string | all | Filter: `draft`, `ready`, `published`, or omit for all |

**Returns:** `{ items: [Content...], total, offset, limit }`.

Each item contains: `id`, `content_id`, `title`, `displayTitle`, `status`, `thumbnail`, `videoUrl`, `channels`, `createdAt`, `updatedAt`.

```bash
curl "http://127.0.0.1:$PORT/api/bridge/content?status=draft&limit=5"   -H "Authorization: Bearer $TOKEN"
```

---

### `GET /api/bridge/content/:id` — Get full content details

Returns the complete Content document with all metadata, channels, and publish state.

| Path param | Required | Description |
|------------|----------|-------------|
| `:id` | ✅ | Content ID to retrieve |

**Returns:**
- Top-level: `title`, `displayTitle`, `contentTitle`, `description`, `caption`, `status`
- Video: `videoUrl`, `videoSasUrl`, `downloadableSasUrl`, `sasExpiresAt`
- Media: `thumbnail`
- Channels: `channels.instagram`, `channels.youtube`, `channels.linkedin`
- Timestamps: `createdAt`, `updatedAt`

```bash
curl "http://127.0.0.1:$PORT/api/bridge/content/content_xxx"   -H "Authorization: Bearer $TOKEN"
```

Use this to check whether video is attached, channels are configured, or a platform is already published.

---

### `PUT /api/bridge/content/:id` — Update content metadata

Updates top-level metadata on a Content document. Only provided fields are changed.

| Body field | Type | Description |
|------------|------|-------------|
| `title` | string | Internal title (legacy) |
| `displayTitle` | string | Dashboard display name |
| `contentTitle` | string | Platform title (YouTube, social) |
| `description` | string | Content description |
| `caption` | string | Social media caption text |
| `status` | string | `draft`, `ready`, or `published` |
| `videoUrl` | string | Base video blob URL (no SAS token) |
| `videoSasUrl` | string | Video streaming URL with SAS token |
| `downloadableSasUrl` | string | Video download URL with SAS token |
| `sasExpiresAt` | string | ISO datetime when SAS URLs expire |
| `thumbnail` | string | Thumbnail image URL |
| `channels` | object | Channel config/publish state object |

**Returns:** Updated Content document JSON.

**Error:** `{ "error": "status must be draft, ready, or published" }` if invalid status.

```bash
curl -X PUT "http://127.0.0.1:$PORT/api/bridge/content/content_xxx"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"displayTitle":"5 AI Tools You Need in 2025","contentTitle":"5 AI Tools You Need in 2025","description":"A deep dive into the best AI tools for content creators","thumbnail":"https://storage.blob.../thumb.jpg","status":"ready"}'
```

After uploading a video, pass the canonical URL and SAS fields returned by the upload flow. Never hand-craft Blob URLs or SAS query strings yourself; the Desktop-mediated flow mints/rotates them.

```bash
curl -X PUT "http://127.0.0.1:$PORT/api/bridge/content/content_xxx"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"videoUrl":"https://storage.blob.../video.mp4","downloadableSasUrl":"https://storage.blob.../video.mp4?sv=...","sasExpiresAt":"2027-06-15T12:00:00.000Z"}'
```

---

### `POST /api/bridge/content/upload-url` — Get SAS upload URL

Gets a pre-signed Azure Blob Storage URL for uploading a file (video or thumbnail) to content.

| Body field | Type | Required | Description |
|------------|------|----------|-------------|
| `contentId` | string | ✅ | Content ID to upload to |
| `fileName` | string | ✅ | File name, e.g. `video.mp4`, `thumbnail.jpg` |
| `contentType` | string | | MIME type, e.g. `video/mp4`, `image/jpeg` |

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

Manual upload flow:

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/upload-url"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","fileName":"final-render.mp4","contentType":"video/mp4"}'

# PUT binary bytes to response.uploadUrl with response.headers, then update the Content doc with response.videoUrl, response.downloadableSasUrl, and response.sasExpiresAt.
```

> The AI agent usually coordinates this flow; the client/system performs the binary upload.

### Local render upload shortcut — preferred for Desktop renders

For videos rendered by SkillTown Desktop, prefer `POST /api/render` with a `contentId` and `uploadToCloud: true` instead of the manual SAS upload flow:

```json
{
  "renderType": "design",
  "data": { "...": "..." },
  "contentId": "content_xxx",
  "uploadToCloud": true
}
```

When upload succeeds, the render job extracts a **frame-0** thumbnail, uploads both MP4 and thumbnail, updates `Content.videoUrl`, `Content.videoSasUrl`, `Content.downloadableSasUrl`, `Content.sasExpiresAt`, and `Content.thumbnail`, and returns `cloudVideoUrl`, `thumbnailUrl`, and `contentUpdated: true`. If cloud upload fails, the local render still succeeds and the response includes the failure reason. `GET /api/render/:jobId` includes the same upload fields once upload completes.

> **🛑 Because the thumbnail is frame 0 of the rendered video, and because Instagram Reels also uses that same first frame as its default cover:**
> - **Frame 0 MUST be a usable poster** — no black/blank/single-color openings unless you also provide a custom thumbnail. See `contentlead/rendering.md` → "The First Frame Must Be a Usable Thumbnail" for the poster-safe scene pattern.
> - **When frame 0 genuinely can't be a good cover** (delayed reveal, blackout intro, etc.), upload a custom thumbnail via **`POST /api/bridge/content/upload-url`** (Option A: mid-video ffmpeg extract; Option B: AI-generated image via `/api/bridge/ai/image/generate`). Full recipes in `contentlead/rendering.md` → "Custom Thumbnails".
> - **Already-published Instagram Reels' covers cannot be changed via API.** If a wrong-cover reel is already live, the user must edit the cover in the IG app manually, OR delete + republish (the CTA draft auto-syncs to the new `media_id`).

---

### `POST /api/bridge/content/configure-publish` — Configure channel publishing

Sets `Content.channels[platform]`. See `channel-configuration.md` for platform config schemas.

| Body field | Type | Required | Description |
|------------|------|----------|-------------|
| `contentId` | string | ✅ | Content ID to configure |
| `platform` | string | ✅ | `instagram`, `youtube`, or `linkedin` |
| `config` | object | ✅ | Platform-specific config fields |

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","platform":"instagram","config":{"enabled":true,"toPublish":true,"postType":"reel","caption":"Comment FREE for the guide","hashtags":["AI","tools"],"selectedAccount":"ig_account_id"}}'
```

---

## Content Document Schema

```text
Content {
  id                    // Cosmos DB doc ID
  content_id            // Content ID (format: "content_xxx")
  userId                // Owner user ID
  createdAt, updatedAt  // Timestamps

  title                 // Internal title
  displayTitle          // Dashboard display name
  contentTitle          // Platform title (YouTube, social)
  description           // Content description
  caption               // Social media caption

  thumbnail             // Thumbnail image URL
  videoUrl              // Base video blob URL (no SAS token)
  videoSasUrl           // Streaming URL with SAS token
  downloadableSasUrl    // Download/publish URL with SAS token
  sasExpiresAt          // When SAS URLs expire

  status                // "draft" | "ready" | "published"

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
| `{ "error": "Unauthorized" }` | Invalid/missing local auth or expired desktop session | Re-read `api.json`; if still unauthorized, sign in via desktop UI |
| `{ "error": "Content not found" }` | Invalid `contentId` | Verify with `GET /api/bridge/content` |
| `{ "error": "Title is required" }` | Create without title | Provide `title` |
| `{ "error": "Title must be 255 characters or less" }` | Title too long | Shorten title |
| `{ "error": "status must be draft, ready, or published" }` | Invalid status | Use `draft`, `ready`, or `published` |
