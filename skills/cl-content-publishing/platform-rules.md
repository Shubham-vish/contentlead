# Platform Rules — Video Requirements, SAS URLs, Rate Limits

## SAS URL Expiry

Azure Blob Storage SAS (Shared Access Signature) URLs are time-limited. If expired, video publish/streaming will fail.

### Checking Expiry

```bash
curl "http://127.0.0.1:$PORT/api/bridge/content/content_xxx"   -H "Authorization: Bearer $TOKEN"
# Check sasExpiresAt against current time.
```

### Refreshing SAS URLs

```bash
# Get fresh upload/read URLs
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/upload-url"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","fileName":"video.mp4","contentType":"video/mp4"}'

# After uploading bytes if needed, update content with returned fields
curl -X PUT "http://127.0.0.1:$PORT/api/bridge/content/content_xxx"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"downloadableSasUrl":"https://...?sv=...","sasExpiresAt":"2027-06-15T12:00:00.000Z"}'
```

### URL Types

| URL Field | SAS? | Expires? | Use case |
|-----------|------|----------|----------|
| `videoUrl` | No | Never | Permanent reference (may not stream without SAS) |
| `videoSasUrl` | Yes | Yes | Browser playback/streaming |
| `downloadableSasUrl` | Yes | Yes | Download + publishing (adds Content-Disposition header) |

### Resolution Order for Publishing

```
downloadableSasUrl → videoSasUrl → videoUrl
```

The publish pipeline tries each in order. If the first available URL works, it uses that.

---

## Video Requirements

### Instagram Reels

| Constraint | Value |
|------------|-------|
| Format | MP4 (H.264 codec) |
| Aspect ratio | 9:16 (recommended), 1:1, 4:5 also accepted |
| Duration | 3 seconds – 15 minutes |
| Max file size | 1 GB |
| Audio | Required (silent videos may be rejected) |
| Resolution | 1080×1920 recommended |

### YouTube

| Constraint | Value |
|------------|-------|
| Format | MP4, MOV, AVI, WMV, FLV, WebM |
| Max file size | 256 GB (or 12 hours, whichever is less) |
| Resolution | 1080p+ recommended |
| Aspect ratio | 16:9 (standard), 9:16 (Shorts) |
| Shorts | Under 60 seconds, 9:16 aspect ratio |

### Thumbnails

| Constraint | Value |
|------------|-------|
| Format | JPEG recommended (not PNG — 10× smaller for base64) |
| Resolution | 1280×720 (16:9) |
| Max file size | 2 MB |
| YouTube custom thumbnails | Requires verified account |

---

## Rate Limits

### Instagram API

- **Container creation:** ~25 per day per account
- **Publishing:** Rate limited by Meta — exact limits vary
- **Status polling:** No strict limit, but 10–30s intervals recommended

### YouTube Data API

- **Daily quota:** 10,000 units (1 upload = 1,600 units ≈ 6 uploads/day)
- **Reset:** Midnight Pacific Time
- **Workaround:** Request quota increase via Google Cloud Console

### LinkedIn API

- **Posts per day:** No official documented limit (500+/day reported)
- **Rate limits:** 100 requests per day per application member

---

## Common Failure Modes

| Problem | Symptom | Fix |
|---------|---------|-----|
| SAS URL expired | `403 Forbidden` or empty response | Refresh with `POST /api/bridge/content/upload-url` |
| Video URL unreachable | Publish hangs or errors | Ensure URL is publicly accessible |
| Token expired | `401` or `token_expired` error | User must reconnect account in ContentLead UI |
| Video too large | Upload timeout or IG rejection | Compress video, reduce resolution |
| Wrong aspect ratio | IG may reject or auto-crop | Use 9:16 for reels, 16:9 for YouTube |
| No audio track | IG may reject reel | Add silent audio track if needed |
| YouTube quota exceeded | `quotaExceeded` error | Wait 24h or use different API project |
| Duplicate publish | 409 error | Content already published — check first |

---

## Image Format Best Practices

- JPEG for thumbnails and backgrounds — much smaller than PNG.
- Keep total base64 under 2 MB to prevent renderer crashes in the editor.
- Use CDN URLs or Azure Blob URLs with SAS tokens.
- Do not use localhost URLs for social publishing; social APIs cannot access local files.
