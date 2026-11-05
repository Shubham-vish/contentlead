# YouTube — Publishing & CTA Comments

Use `POST /api/bridge/youtube/publish` through the SkillTown Desktop local HTTP API. Read `~/.skilltown-desktop/api.json` fresh before each call and use `Authorization: Bearer $TOKEN`.

## `POST /api/bridge/youtube/publish` — Upload video to YouTube

YouTube publishing is synchronous: the response comes after the upload completes (usually 1–5 minutes for long videos).

> 🛑 **Privacy defaults to `private`.** The bridge forwards only `title`, `description`, `tags` from the top level into `metadata`. Every other YouTube field (`privacyStatus`, `categoryId`) MUST be inside `metadata:{}` — a top-level `privacyStatus:"public"` is silently dropped and the server uploads the video as **private** (verified 2026-11-03). Always verify after publishing (see "Verify after publish"). Desktop builds after 2026-11-03 also accept top-level `privacyStatus`/`categoryId`, but `metadata` works on every build — keep using it.

| Body field | Required | Default | Description |
|------------|----------|---------|-------------|
| `contentId` | ✅ | — | Content ID (used for tracking + CTA lookup) |
| `channelId` | ✅ | — | YouTube channel ID (`UC…`). Get IDs from `GET /api/bridge/accounts` → `youtube.channels[].id` (no titles — resolve names via `https://www.youtube.com/channel/<id>` og:title) |
| `selectedAccount` | | — | Account name/ID alternative to `channelId` |
| `videoUrl` | ✅ | — | Publicly downloadable video URL (use the Content doc's `downloadableSasUrl`). **Not** auto-resolved by this route — omitting it returns `400 Video URL is required`. |
| `title` | ✅ | — | Video title (top-level OK, or `metadata.title`) |
| `description` | | — | Description (top-level OK) |
| `tags` | | — | Tags array (top-level OK) |
| `metadata.privacyStatus` | | **`private`** | `public` / `private` / `unlisted`. **Must be inside `metadata`.** |
| `metadata.categoryId` | | `22` | e.g. `"27"` Education, `"28"` Sci & Tech. **Must be inside `metadata`.** |
| `thumbnailUrl` | | — | Custom thumbnail URL (top-level) |
| `publishAt` | | — | Schedule publish (ISO 8601 UTC, e.g. `"2026-08-11T14:00:00.000Z"`). Uses YouTube's native `videos.insert` scheduling — privacy is forced to `private` until fire time. Must be ≥10 min in the future. |
| `wallTime` + `timeZone` | | — | Agent-friendly alternative to `publishAt` (same shape Instagram uses). Bridge converts to UTC ISO and forwards. E.g. `wallTime:"2026-08-11T19:30", timeZone:"Asia/Kolkata"`. |

```bash
# Publish immediately (public)
curl -X POST "http://127.0.0.1:$PORT/api/bridge/youtube/publish" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"contentId":"content_xxx","channelId":"UCxxx","videoUrl":"<Content.downloadableSasUrl>","thumbnailUrl":"<cover SAS url>","metadata":{"title":"5 AI Tools for 2025 #shorts","description":"…","tags":["ai"],"privacyStatus":"public","categoryId":"28"}}'
# ↑ privacyStatus/categoryId INSIDE metadata — top-level ones are dropped and the video goes out PRIVATE

# Schedule via wallTime + timeZone (same shape as Instagram scheduling)
curl -X POST "http://127.0.0.1:$PORT/api/bridge/youtube/publish" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"contentId":"content_xxx","channelId":"UCxxx","videoUrl":"<Content.downloadableSasUrl>","metadata":{"title":"…"},"wallTime":"2026-08-11T19:30","timeZone":"Asia/Kolkata"}'

# Schedule via UTC publishAt directly
curl -X POST "http://127.0.0.1:$PORT/api/bridge/youtube/publish" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"contentId":"content_xxx","channelId":"UCxxx","videoUrl":"<Content.downloadableSasUrl>","metadata":{"title":"…"},"publishAt":"2026-08-11T14:00:00.000Z"}'
```

**Scheduled publish behaviour:**
- Video uploads **now** (1–5 min like an immediate publish).
- YouTube marks it `private` and shows it under **Studio → Content → Scheduled** with your target time.
- Google flips it to `public` at `publishAt` — no external cron/poller needed on our side.
- Response is enriched with `scheduled: true, publishAt: "<UTC ISO>"` so agents can distinguish.
- Bridge validation errors: `publishAt_too_soon` (<10min lead), `invalid_walltime` (bad tz), `invalid_publishAt` (bad ISO).

### Symmetry with Instagram scheduling

For AI-agent workflows, both platforms now accept the same scheduling payload shape (`wallTime` + `timeZone`), so a fan-out publish is uniform:

```jsonc
// Instagram:  POST /api/bridge/instagram/publish/schedule
// YouTube:    POST /api/bridge/youtube/publish
// Same fields, different endpoints:
{ "contentId": "content_xxx", "wallTime": "2026-08-11T19:30", "timeZone": "Asia/Kolkata" }
```

### Video URL

`/api/bridge/youtube/publish` does **not** read the video URL from the Content doc — pass `videoUrl` explicitly (normally the Content doc's `downloadableSasUrl`; check `sasExpiresAt` is in the future).

### Verify after publish (MANDATORY)

The response's `success:true` only means "uploaded". Before telling anyone it's live:

```bash
# 1. Requested privacy actually stuck
GET /api/bridge/content/<contentId>  →  channels.youtube.youtube_response.status.privacyStatus   # must equal what you asked
#    and channels.youtube.youtube_response.snippet.categoryId
# 2. Anonymous viewers can see it (oEmbed returns 401/403 "Forbidden" for private videos)
curl -s "https://www.youtube.com/oembed?url=https://www.youtube.com/shorts/<videoId>&format=json"
# 3. ctaComment.posted === true (see CTA section)
```

If privacy came back `private` by mistake, there is **no bridge endpoint** to change it — fix it in YouTube Studio (Content → Visibility) or via YouTube Data API `videos.update` with the channel's OAuth token. Never report "public" from the request body alone.

### What Happens Internally

1. Reads metadata from `Content.channels.youtube` or request overrides.
2. Downloads video from the resolved URL to a local working file.
3. Uploads to YouTube via YouTube Data API.
4. Writes back to Content doc: `published`, `video_id`, `published_url`, `youtube_response`.
5. Reads the shared CTA draft from the `ContentLeadCTA` container (keyed by `contentId`) — the same draft used for Instagram.
6. If a valid CTA exists (has at least one button/link), it posts a comment on the video. **It cannot pin it** — the YouTube Data API has no pin endpoint; `cta.pinned` is always `false`. Pin manually in Studio (`https://studio.youtube.com/video/<videoId>/comments`).
7. Writes CTA state: `cta_comment_id`, `cta_comment_posted`, `cta_comment_pinned`, `cta_comment_posted_at`.

### Response

```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "videoUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "cta": {
    "posted": true,
    "pinned": false,
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

YouTube CTA works differently from the Instagram DM automation, but it reads from the **same shared draft CTA** you create for Instagram — the `media_trigger` document in the **`ContentLeadCTA`** container keyed by `contentId`. It is **not** read from `Content.channels.youtube`. The YouTube publish flow posts a comment built from that CTA's buttons/links (pin it manually in Studio — the API cannot pin).

**To get a CTA comment on your YouTube upload:**

1. Create the CTA draft **before** publishing, using the same Instagram automation endpoint (it is cross-platform — one draft serves both IG DMs and the YouTube comment):

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/instagram/automation"   -H "Authorization: ******" -H "Content-Type: application/json"   -d '{"action":"update_cta","contentId":"content_xxx","contains":["LINK"],"messageBody":"Grab the free guide 👇","buttons":[{"label":"Download Guide","url":"https://mysite.com/guide"}],"containerName":"ContentLeadCTA"}'
```

2. Publish with `POST /api/bridge/youtube/publish`. After the upload succeeds it looks up the `ContentLeadCTA` draft for that `contentId`, and if a valid one exists (must have at least one button/link), it posts a comment built from those buttons (not pinned — pin manually in Studio). The video must be public/unlisted; on a private video the comment fails with "insufficient permissions".
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
| `400 Video URL is required` | `videoUrl` not passed | Pass the Content doc's `downloadableSasUrl` as `videoUrl` |
| Upload OK but video is **private** | `privacyStatus` sent top-level (dropped → default private) | Put it in `metadata.privacyStatus`; fix the existing video in Studio or via `videos.update` |
| `ctaComment.error: "…insufficient permissions…"` | Usually the video is **private** (comments can't be added to private videos), not a scope problem | Make the video public, then post the comment (`commentThreads.insert`) |

## Tips

- YouTube upload is slow; 1–5 minutes is normal for large videos.
- Set privacy to `unlisted` (in `metadata.privacyStatus`) first for testing, then update to `public` via YouTube Studio.
- Shorts: vertical (9:16) and ≤ 60 s (YouTube allows up to 3 min) qualify automatically; add `#shorts` to title/description.
- Shorts thumbnails: the **Shorts swipe feed/shelf ignores the custom thumbnail** and auto-picks a video frame; `thumbnailUrl` only shows on the watch page, channel grid, search and subscriptions. Put the designed cover in the video's opening frames too. See `cl-editor/rendering.md` → "Where each platform takes its cover from".
- Category matters for discovery; use `28` (Science & Technology) or `27` (Education) for tech content.
- CTA is automatic if a `ContentLeadCTA` draft (keyed by `contentId`, with buttons) exists — create it via the `update_cta` call shown above **before** publishing.
