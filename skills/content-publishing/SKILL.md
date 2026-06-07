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

All writes go to the **same Cosmos DB** that the ContentLead website (contentlead.in) uses.
Changes made via these tools are **immediately visible** in the UI dashboard.

> **⚠️ CRITICAL: Always publish with `content_id`.**
> Direct/legacy mode (`account_id + video_url`) publishes successfully but is **NOT tracked**
> in the ContentLead dashboard — the user won't see it in their content list.

> **⚠️ LinkedIn is NOT content-aware.** It does not read from or write to Content documents.
> See `linkedin.md` for the workaround to maintain tracking.

---

## Load the Right Sub-Doc

| When you need to... | Load |
|---------------------|------|
| Create, list, get, update content, upload video/thumbnail | `content-lifecycle.md` |
| Configure channel settings (captions, tags, scheduling, toggles) | `channel-configuration.md` |
| Publish to Instagram, set up CTA/DM automation, poll status | `instagram.md` |
| Publish to YouTube, CTA auto-comments | `youtube.md` |
| Post to LinkedIn | `linkedin.md` |
| Debug SAS expiry, video requirements, rate limits | `platform-rules.md` |
| Run end-to-end flows (create → publish all platforms) | `workflows.md` |

---

## All Tools at a Glance

### Content Lifecycle (6 tools) → `content-lifecycle.md`

| Tool | What it does |
|------|-------------|
| `content_create` | Create a new Content document |
| `content_list` | Browse/filter content with pagination |
| `content_get` | Get full content with all metadata + channels |
| `content_update` | Update title, description, caption, video URLs, thumbnail, status |
| `content_get_upload_url` | Get pre-signed Azure Blob URL for uploading video/thumbnail |
| `content_configure_publish` | Set channel config (caption, hashtags, account, schedule, toggle) |

### Instagram (7 tools) → `instagram.md`

| Tool | What it does |
|------|-------------|
| `instagram_get_accounts` | List connected IG accounts |
| `instagram_get_posts` | Get published posts with metrics |
| `instagram_publish_reel` | Start reel publish (async — creates container) |
| `instagram_publish_status` | Poll publish progress until PUBLISHED |
| `instagram_validate_token` | Check if account token is still valid |
| `instagram_get_automation` | Get CTA/DM automation config |
| `instagram_update_automation` | Set CTA keywords, DM templates, follow gates |

### YouTube (1 tool) → `youtube.md`

| Tool | What it does |
|------|-------------|
| `youtube_publish` | Upload video + auto-post CTA comment |

### LinkedIn (4 tools) → `linkedin.md`

| Tool | What it does |
|------|-------------|
| `linkedin_get_account` | Get connected LinkedIn account |
| `linkedin_post` | Create a post (⚠️ NOT content-aware) |
| `linkedin_get_posts` | Get published posts |
| `linkedin_delete_post` | Delete a post |

---

## Important Concepts (Quick Reference)

### Three Title Fields

| Field | MCP param | Where it shows |
|-------|-----------|----------------|
| `title` | `title` | Internal/legacy — database label |
| `displayTitle` | `display_title` | Dashboard content list |
| `contentTitle` | `content_title` | YouTube title, social headings |

**Rule:** Always set `display_title` for dashboard. Set `content_title` for platform-facing titles.

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

---

## Related Skills

| Skill | Relationship |
|-------|-------------|
| `content-inspiration` | Research topics, scrape competitors, find trending content **before** creating content. Instagram/YouTube/Twitter/Reddit scraping lives there. |
| `contentlead` | Desktop editor commands — add text, video, audio, scenes to the timeline |
| `remotion` | Scene templates and custom scene authoring |

> **For Instagram competitor/research scraping** (`scraping_instagram_download_reels`, `scraping_instagram_get_user_info`), see `content-inspiration/social-scraping.md`. This skill only covers **owned-account** publishing and management tools.
