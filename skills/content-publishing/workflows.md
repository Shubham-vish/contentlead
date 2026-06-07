# Workflows — End-to-End Publishing Flows

## Workflow 1: Full Pipeline — Create → Configure → CTA → Publish All Platforms

```python
# ─── STEP 1: Create content ───
result = content_create(title="5 AI Tools for 2025")
content_id = result["content_id"]  # "content_xxx"

# ─── STEP 2: Set metadata + video ───
content_update(
    content_id=content_id,
    display_title="5 AI Tools You Need in 2025",
    content_title="5 AI Tools You Need in 2025",
    description="A deep dive into AI tools for content creators",
    caption="5 AI tools you need right now! 🚀\n\nComment 'FREE' to get the guide!",
    video_url="https://storage.blob.../video.mp4",
    downloadable_sas_url="https://storage.blob.../video.mp4?sv=...",
    sas_expires_at="2025-12-31T00:00:00Z",
    thumbnail="https://storage.blob.../thumb.jpg",
    status="ready"
)

# ─── STEP 3: Get account IDs ───
ig_accounts = instagram_get_accounts()
# → use account id "ig_abc123"

li_accounts = linkedin_get_account()
# → use account id "li_def456"

# ─── STEP 4: Configure channels ───
content_configure_publish(
    content_id=content_id, platform="instagram",
    enabled=True, to_publish=True, post_type="reel",
    caption="5 AI tools you need right now! 🚀\n\nComment 'FREE' to get the guide!",
    hashtags='["AI", "tools", "2025", "contentcreator"]',
    selected_account="ig_abc123"
)

content_configure_publish(
    content_id=content_id, platform="youtube",
    enabled=True, to_publish=True, post_type="long",
    title="5 AI Tools You Need in 2025",
    description="In this video, I share the top 5 AI tools...",
    tags='["AI", "tools", "tutorial"]',
    privacy="public", category="22",
    selected_account="UCxxx"
)

content_configure_publish(
    content_id=content_id, platform="linkedin",
    enabled=True, to_publish=True, post_type="post",
    title="5 AI Tools You Need in 2025",
    description="Just published a deep dive into AI tools...\n\n#AI #ContentCreation",
    selected_account="li_def456"
)

# ─── STEP 5: Set CTA automation (before publishing) ───
instagram_update_automation(
    action="update_cta",
    media_id=content_id,
    contains='["free", "guide", "link", "send"]',
    message_body='{"text": "Here is your free AI tools guide: https://mysite.com/guide"}',
    comment_replies='["Thanks! Check your DMs 🎁", "Sent! Look in your inbox 📩"]',
    enable_comment_reply=True,
    enable_follow_gate=True,
    follow_reply="Follow us first, then comment again!",
    follow_button_text="Follow @myhandle"
)

# ─── STEP 6: Publish to Instagram ───
instagram_publish_reel(content_id=content_id)
# → { "containerId": "17889xxx", "shouldPoll": true }

# Poll every 15 seconds
instagram_publish_status(content_id=content_id, auto_publish=True)
# → { "status": "IN_PROGRESS", "shouldPoll": true }
# ... poll again ...
# → { "status": "PUBLISHED", "mediaId": "17889xxx", "permalink": "https://..." }

# ─── STEP 7: Publish to YouTube ───
youtube_publish(content_id=content_id)
# → { "success": true, "videoId": "dQw4...", "cta": { "posted": true, "pinned": true } }

# ─── STEP 8: Post to LinkedIn (NOT content-aware — manual workaround) ───
content = content_get(content_id=content_id)
yt_url = content["channels"]["youtube"].get("published_url", "")

linkedin_post(
    text=f"Just published: 5 AI Tools You Need in 2025! 🚀\n\nWatch: {yt_url}\n\n#AI #ContentCreation",
    visibility="PUBLIC"
)

# Manually mark LinkedIn as published
content_configure_publish(content_id=content_id, platform="linkedin", status="published")

# ─── STEP 9: Verify everything ───
final = content_get(content_id=content_id)
# Check: channels.instagram.published === true  ✅
# Check: channels.youtube.published === true     ✅
# Check: channels.linkedin.status === "published" ✅
```

---

## Workflow 2: Upload Video via SAS URL

```python
# 1. Get upload URL
upload = content_get_upload_url(
    content_id="content_xxx",
    file_name="final-render.mp4",
    content_type="video/mp4"
)
# → { uploadUrl, videoUrl, downloadableSasUrl, sasExpiresAt, headers }

# 2. Client/system uploads binary to upload["uploadUrl"] via HTTP PUT
#    Headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": "video/mp4" }

# 3. Link uploaded video to content
content_update(
    content_id="content_xxx",
    video_url=upload["videoUrl"],
    downloadable_sas_url=upload["downloadableSasUrl"],
    sas_expires_at=upload["sasExpiresAt"]
)
```

---

## Workflow 3: Schedule Content for Later

```python
# Configure but don't publish yet
content_configure_publish(
    content_id="content_xxx",
    platform="instagram",
    enabled=True,
    to_publish=True,
    status="scheduled",
    publish_date="2025-06-15",
    publish_timestamp="2025-06-15T14:00:00+05:30",
    caption="Coming soon! 🎬",
    selected_account="ig_abc123",
    post_type="reel"
)
```

> **Note:** Scheduling sets the metadata but does NOT auto-publish at the scheduled time.
> A separate scheduler service or manual trigger is needed to actually publish.

---

## Workflow 4: Check Publish Readiness

```python
content = content_get(content_id="content_xxx")

# Has video?
has_video = bool(content.get("videoUrl") or content.get("downloadableSasUrl"))

# SAS URLs still valid?
from datetime import datetime
sas_expires = content.get("sasExpiresAt")
sas_valid = sas_expires and datetime.fromisoformat(sas_expires) > datetime.now()

# Instagram configured?
ig = content.get("channels", {}).get("instagram", {})
ig_ready = ig.get("selected_account") and ig.get("caption")

# Already published?
ig_published = ig.get("published", False)

# Summary
print(f"Video: {has_video}, SAS valid: {sas_valid}, IG ready: {ig_ready}, IG published: {ig_published}")
```

---

## Workflow 5: Find Existing Content and Publish

```python
# List all ready content
ready = content_list(status="ready", limit=10)

# Pick one
content_id = ready["items"][0]["content_id"]

# Check if it's already configured for Instagram
content = content_get(content_id=content_id)
ig = content.get("channels", {}).get("instagram", {})

if ig.get("selected_account") and ig.get("caption") and not ig.get("published"):
    # Ready to publish
    instagram_publish_reel(content_id=content_id)
    # ... poll status ...
else:
    # Needs configuration first
    content_configure_publish(content_id=content_id, platform="instagram", ...)
```

---

## Quick Decision Guide

| Question | Answer |
|----------|--------|
| Publishing for the first time? | Workflow 1 (full pipeline) |
| Just uploading a video? | Workflow 2 (SAS URL upload) |
| Setting up for future publish? | Workflow 3 (schedule) |
| Not sure if content is ready? | Workflow 4 (readiness check) |
| Content exists, just need to publish? | Workflow 5 (find & publish) |
