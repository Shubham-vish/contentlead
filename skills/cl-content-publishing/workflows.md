# Workflows — End-to-End Publishing Flows

All examples use the SkillTown Desktop local HTTP API. Read `~/.skilltown-desktop/api.json` fresh before the workflow and use `Authorization: Bearer $TOKEN`.

```bash
API=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['port'])")
TOKEN=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
```

## Workflow 1: Full Pipeline — Create → Configure → CTA → Publish All Platforms

### Step 1: Create content

```bash
curl -X POST "http://127.0.0.1:$PORT/api/content/create"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"title":"5 AI Tools for 2025","description":"A deep dive into AI tools for content creators","waitForReady":true,"timeoutMs":120000}'
# Save contentId from the response, e.g. content_xxx.
```

### Step 2: Set metadata and video

```bash
curl -X PUT "http://127.0.0.1:$PORT/api/bridge/content/content_xxx"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"displayTitle":"5 AI Tools You Need in 2025","contentTitle":"5 AI Tools You Need in 2025","description":"A deep dive into AI tools for content creators","caption":"5 AI tools you need right now! 🚀

Comment FREE to get the guide!","videoUrl":"https://storage.blob.../video.mp4","downloadableSasUrl":"https://storage.blob.../video.mp4?sv=...","sasExpiresAt":"2025-12-31T00:00:00Z","thumbnail":"https://storage.blob.../thumb.jpg","status":"ready"}'
```

If you render locally in SkillTown Desktop, prefer `POST /api/render` with `contentId` and `uploadToCloud:true`; it renders locally, uploads the MP4 + thumbnail, and sets `Content.videoUrl`, SAS URLs, and `thumbnail` automatically.

### Step 3: Get account IDs

```bash
curl "http://127.0.0.1:$PORT/api/bridge/instagram/accounts"   -H "Authorization: Bearer $TOKEN"

curl "http://127.0.0.1:$PORT/api/bridge/accounts"   -H "Authorization: Bearer $TOKEN"
```

Use the returned Instagram account ID, YouTube channel/account ID, and LinkedIn account ID.

### Step 4: Configure channels

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","platform":"instagram","config":{"enabled":true,"toPublish":true,"postType":"reel","caption":"5 AI tools you need right now! 🚀

Comment FREE to get the guide!","hashtags":["AI","tools","2025","contentcreator"],"selectedAccount":"ig_abc123"}}'

curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","platform":"youtube","config":{"enabled":true,"toPublish":true,"postType":"long","title":"5 AI Tools You Need in 2025","description":"In this video, I share the top 5 AI tools...","tags":["AI","tools","tutorial"],"privacy":"public","category":"22","selectedAccount":"UCxxx"}}'

curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","platform":"linkedin","config":{"enabled":true,"toPublish":true,"postType":"post","title":"5 AI Tools You Need in 2025","description":"Just published a deep dive into AI tools...

#AI #ContentCreation","selectedAccount":"li_def456"}}'
```

### Step 5: Set Instagram CTA before publishing

The CTA endpoint accepts agent-friendly `messageBody` + `buttons[]`, writes the draft to `ContentLeadCTA` keyed by `media_${contentId}`, and publish status auto-syncs it to `ConfigurationData` when the real Instagram media ID lands. CTA is contentId-scoped, not tab-scoped, so no `tabId` is required.

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/instagram/automation"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"action":"update_cta","contentId":"content_xxx","contains":["FREE","GUIDE","LINK","SEND"],"messageBody":"Here is your free AI tools guide.","buttons":[{"label":"Download Guide","url":"https://mysite.com/guide"},{"label":"Watch Tutorial","url":"https://mysite.com/tutorial"}],"commentReplies":["Thanks! Check your DMs 🎁","Sent! Look in your inbox 📩"],"enableCommentReply":true,"enableFollowGate":true,"followReply":"Follow us first, then comment again!","followButtonText":"Follow @myhandle","containerName":"ContentLeadCTA","syncToProduction":false}'
```

### Step 6: Publish to Instagram

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/instagram/publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx"}'

# Poll every 15 seconds until shouldPoll is false.
curl "http://127.0.0.1:$PORT/api/bridge/instagram/publish/status?contentId=content_xxx&publish=true"   -H "Authorization: Bearer $TOKEN"
```

Expected final response includes `status:"PUBLISHED"`, `mediaId`, and `permalink`.

### Step 7: Publish to YouTube

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/youtube/publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx"}'
```

Expected response includes `success:true`, `videoId`, and optional CTA comment state.

### Step 8: Post to LinkedIn and mark tracking manually

LinkedIn posting is not content-aware. Read the Content doc if you need a caption or YouTube URL, post, then manually mark LinkedIn status.

```bash
curl "http://127.0.0.1:$PORT/api/bridge/content/content_xxx"   -H "Authorization: Bearer $TOKEN"

curl -X POST "http://127.0.0.1:$PORT/api/bridge/publish/linkedin"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"accountId":"li_def456","text":"Just published: 5 AI Tools You Need in 2025! 🚀

#AI #ContentCreation"}'

curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","platform":"linkedin","config":{"status":"published"}}'
```

### Step 9: Verify everything

```bash
curl "http://127.0.0.1:$PORT/api/bridge/content/content_xxx"   -H "Authorization: Bearer $TOKEN"
# Check channels.instagram.published === true
# Check channels.youtube.published === true
# Check channels.linkedin.status === "published"
```

---

## Workflow 2: Upload Video via SAS URL

> Preferred for local renders: use `POST /api/render` with `{ "contentId":"content_xxx", "uploadToCloud":true }`. It uploads the MP4 and thumbnail and updates the Content document automatically. Use the manual SAS flow below only for external/client-side binary uploads.

```bash
# 1. Get upload URL
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/upload-url"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","fileName":"final-render.mp4","contentType":"video/mp4"}'
# Response includes uploadUrl, videoUrl, downloadableSasUrl, sasExpiresAt, headers.

# 2. Client/system uploads binary to uploadUrl via HTTP PUT with response.headers.

# 3. Link uploaded video to content
curl -X PUT "http://127.0.0.1:$PORT/api/bridge/content/content_xxx"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"videoUrl":"https://storage.blob.../video.mp4","downloadableSasUrl":"https://storage.blob.../video.mp4?sv=...","sasExpiresAt":"2027-06-15T12:00:00.000Z"}'
```

---

## Workflow 3: Schedule a Reel for Later (Instagram only)

> **Scheduling exists only for Instagram reels.** YouTube and LinkedIn have no scheduler — they publish immediately (Workflow 1, Steps 7–8). To "schedule" those, run the publish call yourself at the desired time.

### Step 1 (REQUIRED for comment automation): set the CTA draft FIRST

A scheduled reel's automation is created **only** by promoting a pre-existing draft CTA when the slot fires. If you skip this, the reel publishes with **no** comment/DM automation, and it cannot be attached retroactively through this flow. So set the CTA before scheduling — run **Workflow 1, Step 5** (the `update_cta` call with `containerName:"ContentLeadCTA"`) for this `contentId` now. Skip this step only if the reel deliberately needs no automation.

### Step 2: Schedule the reel

Use the dedicated schedule endpoint. `wallTime` must satisfy the server's minimum-lead and slot-boundary rules; if it is rejected, the error states the exact required lead time and slot size — round up to the next slot and retry. Do not hard-code specific minute values, as they can change.

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/instagram/publish/schedule"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","selectedAccount":"ig_abc123","wallTime":"2026-08-05T14:00","timeZone":"Asia/Kolkata","caption":"Coming soon! 🎬","hashtags":["AI","tools"]}'
```

### Step 3: Manage / track the schedule

Use `PATCH /api/bridge/instagram/publish/schedule` to reschedule and `DELETE /api/bridge/instagram/publish/schedule` to cancel (both reject once publishing has started). Track progress with `GET /api/bridge/instagram/publish/scheduled-status?contentId=content_xxx` and watch `publish_state` advance `scheduled → claimed → creating_container → container_processing → container_ready → publishing → published` (see the lifecycle table in `instagram.md`). When it reaches `published`, `media_id` and `published_url` are set, and — if you did Step 1 — the CTA is now live on the real post.

---

## Workflow 4: Check Publish Readiness

```bash
curl "http://127.0.0.1:$PORT/api/bridge/content/content_xxx"   -H "Authorization: Bearer $TOKEN"
```

Check:
- Has video: `videoUrl` or `downloadableSasUrl` is present.
- SAS URLs are still valid: `sasExpiresAt` is in the future.
- Instagram configured: `channels.instagram.selected_account` and `channels.instagram.caption` exist.
- Already published: `channels.instagram.published` is not true before a first publish.

---

## Workflow 5: Find Existing Content and Publish

```bash
# List ready content
curl "http://127.0.0.1:$PORT/api/bridge/content?status=ready&limit=10"   -H "Authorization: Bearer $TOKEN"

# Read selected content
curl "http://127.0.0.1:$PORT/api/bridge/content/content_xxx"   -H "Authorization: Bearer $TOKEN"

# If configured and not already published, publish Instagram
curl -X POST "http://127.0.0.1:$PORT/api/bridge/instagram/publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx"}'
```

---

## Quick Decision Guide

| Question | Answer |
|----------|--------|
| Publishing for the first time? | Workflow 1 (full pipeline) |
| Just uploading a local render? | `POST /api/render` with `contentId` + `uploadToCloud:true` |
| Uploading an external video binary? | Workflow 2 (SAS URL upload) |
| Setting up Instagram for future publish? | Workflow 3 (schedule endpoint) |
| Not sure if content is ready? | Workflow 4 (readiness check) |
| Content exists, just need to publish? | Workflow 5 (find & publish) |
