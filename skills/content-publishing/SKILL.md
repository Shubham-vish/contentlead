---
name: content-publishing
description: End-to-end content publishing — create content, set metadata, upload video, configure channels, set CTA, publish to Instagram/YouTube/LinkedIn, poll status. One skill for the entire pipeline.
tags: content, create, update, upload, publish, instagram, youtube, linkedin, channels, configure, cta, automation, schedule, sas, thumbnail, video, reel, post
---

# Content Publishing — Full Pipeline

This skill covers the **complete flow** from content creation to social media publishing:

```
Create → Edit Metadata → Upload Video → Configure Channels → Set CTA → Publish → Verify
```

The documented interface is the **SkillTown Desktop local HTTP API**. It writes to the same Cosmos DB used by contentlead.in, so changes appear in the dashboard immediately.

> **⚠️ CRITICAL: Always publish with `contentId`.**
> Direct account/video publishing is not dashboard-tracked. The user will not see it in their ContentLead content list or publish status.

> **⚠️ LinkedIn is NOT content-aware.** It does not read from or write to Content documents.
> See `linkedin.md` for the workaround to maintain tracking.

---

## Auth for every call

Read `~/.skilltown-desktop/api.json` fresh before each call; the port and token change after desktop restarts.

```bash
API=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['port'])")
TOKEN=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl "http://127.0.0.1:$PORT/api/bridge/content?limit=5"   -H "Authorization: Bearer $TOKEN"
```

---

## Load the Right Sub-Doc

| When you need to... | Load |
|---------------------|------|
| Understand local HTTP auth, event stream, and endpoint tables | `bridge-mode.md` |
| Create a content record and open an editor tab | `contentlead/infrastructure.md` → `POST /api/content/create` |
| Create, list, get, update content, upload video/thumbnail | `content-lifecycle.md` |
| Configure channel settings (captions, tags, scheduling, toggles) | `channel-configuration.md` |
| Publish to Instagram, set up CTA/DM automation, poll status | `instagram.md` |
| Publish to YouTube, CTA auto-comments | `youtube.md` |
| Post to LinkedIn | `linkedin.md` |
| Debug SAS expiry, video requirements, rate limits | `platform-rules.md` |
| Run end-to-end flows (create → publish all platforms) | `workflows.md` |

---

## Endpoints at a Glance

### Content Lifecycle (6 endpoints) → `content-lifecycle.md`

| Endpoint | What it does |
|---------|-------------|
| `POST /api/content/create` | Create a new Content document and optionally wait for the editor tab |
| `GET /api/bridge/content` | Browse/filter content with pagination |
| `GET /api/bridge/content/:id` | Get full content with all metadata + channels |
| `PUT /api/bridge/content/:id` | Update title, description, caption, video URLs, thumbnail, status |
| `POST /api/bridge/content/upload-url` | Get pre-signed Azure Blob URL for uploading video/thumbnail |
| `POST /api/bridge/content/configure-publish` | Set channel config (caption, hashtags, account, schedule, toggle) |

### Instagram (10+ endpoints) → `instagram.md`

| Endpoint | What it does |
|---------|-------------|
| `GET /api/bridge/instagram/accounts` | List connected Instagram accounts |
| `GET /api/bridge/instagram/posts` | Get published posts with metrics and optional CTA config |
| `POST /api/bridge/instagram/publish` | Start tracked reel publishing from a Content document |
| `GET /api/bridge/instagram/publish/status` | Poll publish progress until `PUBLISHED` |
| `GET /api/bridge/instagram/validate` | Check account token/session health |
| `GET /api/bridge/instagram/automation` | Get CTA/DM automation config |
| `POST /api/bridge/instagram/automation` | Set CTA keywords, DM templates, follow gates, account rules |
| `POST/PATCH/DELETE /api/bridge/instagram/publish/schedule` | Schedule, reschedule, or cancel a reel |
| `GET /api/bridge/instagram/publish/scheduled-status` | Get schedule state for one reel |
| `GET /api/bridge/instagram/publish/list` | List scheduled/in-flight reels |

### YouTube (1 endpoint) → `youtube.md`

| Endpoint | What it does |
|---------|-------------|
| `POST /api/bridge/youtube/publish` | Upload video from Content and auto-post CTA comment |

### LinkedIn (2 endpoints) → `linkedin.md`

| Endpoint | What it does |
|---------|-------------|
| `GET /api/bridge/accounts` | Get connected accounts, including LinkedIn accounts |
| `POST /api/bridge/publish/linkedin` | Create a LinkedIn post (not content-aware) |

---

## Important Concepts (Quick Reference)

### Three Title Fields

| Field | Where it shows |
|-------|----------------|
| `title` | Internal/legacy database label |
| `displayTitle` | Dashboard content list |
| `contentTitle` | YouTube title, social headings |

**Rule:** Always set `displayTitle` for the dashboard. Set `contentTitle` for platform-facing titles.

### Video URL Resolution Order (for publishing)

```
downloadableSasUrl → videoSasUrl → videoUrl
```

SAS URLs expire (check `sasExpiresAt`). If all expired → publish fails.
See `platform-rules.md` for details.

### Content Status

| Status | Meaning |
|--------|---------|
| `draft` | Work in progress (default) |
| `ready` | Complete, ready to publish |
| `published` | Published to at least one platform |

### CTA / Comment Automation — set it BEFORE you publish or schedule

There is **one shared draft CTA** per content: a `media_trigger` doc in the **`ContentLeadCTA`** container keyed by `contentId`, created with `POST /api/bridge/instagram/automation` (`action:"update_cta"`). It powers **both** the Instagram comment→DM automation **and** the pinned YouTube CTA comment.

- It must exist **before** publish/schedule fires. At publish time it is auto-promoted to the live post's real `media_id` — no manual copy needed.
- **If it does not exist when the post goes live, there is NO automation, and it cannot be attached retroactively through the publish flow.**
- This is the #1 reason a published/scheduled reel shows "No automation set up." See `instagram.md` (Scheduling + CTA sections) and `youtube.md`.

### Scheduling is Instagram-only

Only Instagram reels have a scheduler (`.../publish/schedule`, published by a background worker). YouTube and LinkedIn publish immediately — to time them, run the publish call yourself at the desired moment.

---

## Related Skills

| Skill | Relationship |
|-------|-------------|
| `content-inspiration` | Research topics, scrape competitors, find trending content before creating content. |
| `contentlead` | Desktop editor commands — add text, video, audio, scenes to the timeline. Also documents `POST /api/content/create`. There is no `/api/bridge/content` create route; create via `/api/content/create`, then update via `PUT /api/bridge/content/:id`. |
| `remotion` | Scene templates and custom scene authoring |

> For Instagram competitor/research scraping, see `content-inspiration/social-scraping.md`. This skill only covers owned-account publishing and management.
