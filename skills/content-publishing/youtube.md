# YouTube — Publishing & CTA Comments

> **Copilot CLI without MCP server:** use bridge mode through the running SkillTown Desktop app. See [`bridge-mode.md`](bridge-mode.md) for auth, endpoint parity, and curl examples.

## `youtube_publish` — Upload video to YouTube

YouTube publishing is **synchronous** — the response comes after the upload completes (1–5 minutes for long videos).

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `content_id` | string | ✅ | — | Content ID (reads metadata from Content doc) |
| `channel_id` | string | | — | YouTube channel ID (optional if set in Content doc) |
| `selected_account` | string | | — | Account name (alternative to channel_id) |
| `title` | string | | from Content | Override video title |
| `description` | string | | from Content | Override description |
| `tags` | string | | from Content | Override tags: `'["AI", "tutorial"]'` |
| `privacy_status` | string | | from Content | Override: `"public"`, `"private"`, `"unlisted"` |
| `thumbnail_url` | string | | from Content | Override thumbnail URL |

### Video URL Resolution

The tool resolves the video to upload in this order:
```
downloadableSasUrl → videoSasUrl → videoUrl
```
If all SAS URLs are expired, the upload fails.

### What Happens Internally

1. Reads metadata from `Content.channels.youtube` (or uses param overrides)
2. Downloads video from resolved URL to a temp file
3. Uploads to YouTube via YouTube Data API
4. Writes back to Content doc: `published`, `video_id`, `published_url`, `youtube_response`
5. Auto-reads CTA config from the Content document
6. If CTA exists → posts a comment on the video and pins it
7. Writes CTA state: `cta_comment_id`, `cta_comment_posted`, `cta_comment_pinned`, `cta_comment_posted_at`

### Response

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

---

## YouTube Categories

Common category IDs (use with `content_configure_publish` `category` param):

| ID | Category |
|----|----------|
| `1` | Film & Animation |
| `2` | Autos & Vehicles |
| `10` | Music |
| `15` | Pets & Animals |
| `17` | Sports |
| `20` | Gaming |
| `22` | People & Blogs (default) |
| `23` | Comedy |
| `24` | Entertainment |
| `25` | News & Politics |
| `26` | Howto & Style |
| `27` | Education |
| `28` | Science & Technology |

---

## CTA Auto-Comment

YouTube CTA works differently from Instagram — there's no separate automation tool.
Instead, CTA config is read from the Content document and automatically applied during publish:

1. Configure CTA in the Content doc's `channels.youtube` (via `content_configure_publish` or UI)
2. When `youtube_publish` runs, it reads the CTA config
3. After successful video upload, it posts a comment with the CTA text
4. It then pins that comment to the top

The CTA comment typically contains a link (e.g., "Download the free guide: https://...").

---

## Legacy Desktop Bridge (Alternative)

> **⚠️ This legacy publishing bridge is not the MCP-mirror bridge mode.** For Copilot CLI without MCP, prefer the content-aware `/api/bridge/youtube/publish` mirror documented in [`bridge-mode.md`](bridge-mode.md).

```bash
curl -X POST http://127.0.0.1:$PORT/api/bridge/publish/youtube \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "contentId": "content_xxx",
    "channelId": "UCxxx",
    "metadata": {
      "title": "5 AI Tools for 2025",
      "description": "In this video...",
      "tags": ["AI", "tools"],
      "privacyStatus": "public"
    }
  }'
# → { "success": true, "videoId": "dQw4...", "videoUrl": "https://youtube.com/watch?v=..." }
```

---

## Error Handling

| Error | When | Fix |
|-------|------|-----|
| 409 "already published" | Video already uploaded | Check `content_get()` → `channels.youtube.published` |
| Video URL unreachable | SAS URL expired | Check `sasExpiresAt`, generate new URLs |
| Upload timeout | Very large video | Try again, or use shorter video |
| `quotaExceeded` | YouTube API quota hit | Wait 24h or use different API project |

## Tips

- **YouTube upload is slow** — 1–5 minutes is normal for large videos. Don't timeout.
- **Set privacy to `unlisted` first** for testing, then update to `public` via YouTube Studio.
- **Category matters for discovery** — use `28` (Science & Technology) or `27` (Education) for tech content.
- **CTA is automatic** — no separate step needed if CTA config exists in the Content doc.
