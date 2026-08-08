# YouTube — Publishing & CTA Comments

Use `POST /api/bridge/youtube/publish` through the SkillTown Desktop local HTTP API. Read `~/.skilltown-desktop/api.json` fresh before each call and use `Authorization: Bearer $TOKEN`.

## `POST /api/bridge/youtube/publish` — Upload video to YouTube

YouTube publishing is synchronous: the response comes after the upload completes (usually 1–5 minutes for long videos).

| Body field | Required | Default | Description |
|------------|----------|---------|-------------|
| `contentId` | ✅ | — | Content ID; reads metadata from Content doc |
| `channelId` | | — | YouTube channel ID, optional if set in Content doc |
| `selectedAccount` | | — | Account name/ID alternative to `channelId` |
| `title` | | from Content | Override video title |
| `description` | | from Content | Override description |
| `tags` | | from Content | Override tags array |
| `privacyStatus` | | from Content | Override: `public`, `private`, `unlisted` |
| `thumbnailUrl` | | from Content | Override thumbnail URL |

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/youtube/publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","channelId":"UCxxx","title":"5 AI Tools for 2025","description":"In this video...","tags":["AI","tools"],"privacyStatus":"public","thumbnailUrl":"https://.../thumb.jpg"}'
```

### Video URL Resolution

The endpoint resolves the video to upload in this order:

```
downloadableSasUrl → videoSasUrl → videoUrl
```

If all SAS URLs are expired, the upload fails.

### What Happens Internally

1. Reads metadata from `Content.channels.youtube` or request overrides.
2. Downloads video from the resolved URL to a local working file.
3. Uploads to YouTube via YouTube Data API.
4. Writes back to Content doc: `published`, `video_id`, `published_url`, `youtube_response`.
5. Reads the shared CTA draft from the `ContentLeadCTA` container (keyed by `contentId`) — the same draft used for Instagram.
6. If a valid CTA exists (has at least one button/link), it posts a comment on the video and pins it.
7. Writes CTA state: `cta_comment_id`, `cta_comment_posted`, `cta_comment_pinned`, `cta_comment_posted_at`.

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

Idempotency: returns 409 if `channels.youtube.published === true`.

---

## YouTube Categories

Common category IDs (use with channel configuration `category`):

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

YouTube CTA works differently from the Instagram DM automation, but it reads from the **same shared draft CTA** you create for Instagram — the `media_trigger` document in the **`ContentLeadCTA`** container keyed by `contentId`. It is **not** read from `Content.channels.youtube`. The YouTube publish flow builds a pinned comment from that CTA's buttons/links.

**To get a pinned CTA comment on your YouTube upload:**

1. Create the CTA draft **before** publishing, using the same Instagram automation endpoint (it is cross-platform — one draft serves both IG DMs and the YouTube comment):

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/instagram/automation"   -H "Authorization: ******" -H "Content-Type: application/json"   -d '{"action":"update_cta","contentId":"content_xxx","contains":["LINK"],"messageBody":"Grab the free guide 👇","buttons":[{"label":"Download Guide","url":"https://mysite.com/guide"}],"containerName":"ContentLeadCTA"}'
```

2. Publish with `POST /api/bridge/youtube/publish`. After the upload succeeds it looks up the `ContentLeadCTA` draft for that `contentId`, and if a valid one exists (must have at least one button/link), it posts a comment built from those buttons and pins it.
3. If no draft exists, publish still succeeds — it just skips the comment (logs "No CTA config found").

The CTA comment typically lists the button links, e.g. `📥 Download Guide: https://...`.

---

## Older desktop route

`POST /api/bridge/publish/youtube` still exists for older workflows. Prefer the content-aware endpoint above because it updates the Content document and CTA state.

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/publish/youtube"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","channelId":"UCxxx","metadata":{"title":"5 AI Tools for 2025","description":"In this video...","tags":["AI","tools"],"privacyStatus":"public"}}'
```

---

## Error Handling

| Error | When | Fix |
|-------|------|-----|
| 409 `already published` | Video already uploaded | Check `GET /api/bridge/content/:id` → `channels.youtube.published` |
| Video URL unreachable | SAS URL expired | Check `sasExpiresAt`, generate new URLs |
| Upload timeout | Very large video | Try again, or use shorter video |
| `quotaExceeded` | YouTube API quota hit | Wait 24h or use different API project |

## Tips

- YouTube upload is slow; 1–5 minutes is normal for large videos.
- Set privacy to `unlisted` first for testing, then update to `public` via YouTube Studio.
- Category matters for discovery; use `28` (Science & Technology) or `27` (Education) for tech content.
- CTA is automatic if a `ContentLeadCTA` draft (keyed by `contentId`, with buttons) exists — create it via the `update_cta` call shown above **before** publishing.
