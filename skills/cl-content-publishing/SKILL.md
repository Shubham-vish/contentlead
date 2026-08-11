---
name: cl-content-publishing
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
| Duplicate a Content record + its timeline (produces an independent copy) | `content-lifecycle.md` |
| Configure channel settings (captions, tags, scheduling, toggles) | `channel-configuration.md` |
| Publish to Instagram, set up CTA/DM automation, poll status | `instagram.md` |
| Publish to YouTube, CTA auto-comments | `youtube.md` |
| Post to LinkedIn | `linkedin.md` |
| Read / create / update saved account combinations (cross-platform presets) | `combinations.md` |
| Debug SAS expiry, video requirements, rate limits | `platform-rules.md` |
| Run end-to-end flows (create → publish all platforms) | `workflows.md` |

---

## Endpoints at a Glance

### Content Lifecycle (8 endpoints) → `content-lifecycle.md`

| Endpoint | What it does |
|---------|-------------|
| `POST /api/content/create` | Create a new Content document and optionally wait for the editor tab |
| `POST /api/bridge/content/:id/duplicate` | Clone a Content record + linked VideoEditing timeline + CTA draft. Preserves group provenance via groupId. |
| `POST /api/bridge/content/backfill-groupids` | One-time backfill for pre-grouping content — idempotent. |
| `GET /api/bridge/content` | Browse/filter content with pagination |
| `GET /api/bridge/content/:id` | Get full content with all metadata + channels |
| `PUT /api/bridge/content/:id` | Update title, description, caption, video URLs, thumbnail, status |
| `POST /api/bridge/content/upload-url` | Get pre-signed Azure Blob URL for uploading video/thumbnail |
| `POST /api/bridge/content/configure-publish` | Set channel config (caption, hashtags, account, schedule, media items, toggle) |

### Instagram (10+ endpoints) → `instagram.md`

| Endpoint | What it does |
|---------|-------------|
| `GET /api/bridge/instagram/accounts` | List connected Instagram accounts |
| `GET /api/bridge/instagram/posts` | Get published posts with metrics and optional CTA config |
| `POST /api/bridge/instagram/publish` | Start tracked Instagram publishing from a Content document; publishes the configured `post_type` (`reel`, `image`, `story`, `carousel`, etc.) |
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
| `POST /api/bridge/youtube/publish` | Upload video from Content and auto-post CTA comment. Accepts `publishAt` (ISO UTC) or `wallTime`+`timeZone` for **native scheduled publish** — Google flips privacy at fire time, no external cron needed. |

### LinkedIn (2 endpoints) → `linkedin.md`

| Endpoint | What it does |
|---------|-------------|
| `GET /api/bridge/accounts` | Get connected accounts, including LinkedIn accounts |
| `POST /api/bridge/publish/linkedin` | Create a LinkedIn post (not content-aware) |

### Account Combinations (4 endpoints) → `combinations.md`

Cross-platform presets ("AI lineup", "trading content", etc.) so users don't reselect the same accounts every reel. UI convenience today — agents resolve a combo client-side and fan out per-platform publish calls.

| Endpoint | What it does |
|---------|-------------|
| `GET /api/bridge/content/combinations` | List saved combinations + connected accounts per platform |
| `POST /api/bridge/content/combinations` | Create a saved combination `{name, description?, enabled?, accounts:{instagram?,youtube?,linkedin?,x?}}` |
| `PATCH /api/bridge/content/combinations` | Update a combination `{id, ...changes}` |
| `DELETE /api/bridge/content/combinations?id=` | Delete a combination |

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

> **🛑 MANDATORY user confirmation before writing a CTA.** The DM copy, destination URLs, button labels, and public reply lines are visible to real followers — do NOT invent them. Unless the user has already given you every field verbatim, present a grouped preview of the resolved values (`contains`, `messageBody`, each `button.label`+`button.url`, `commentReplies`, and `followReply`/`followButtonText` if follow-gate is on) and get explicit approval before calling `update_cta`. Never guess URLs (e.g. `example.com/guide`) — if the user hasn't confirmed the link exists, ask. Applies to both immediate publish and scheduled publish. Full rule: `instagram.md` → "🛑 MANDATORY: Confirm CTA content with the user".

### 🛑 MANDATORY: Confirm timing & post mode before publishing

**Before you call `POST /api/bridge/instagram/publish` or `POST /api/bridge/instagram/publish/schedule`, get explicit user confirmation on all three of these** — unless the user has clearly stated them in this session:

1. **Publish now vs schedule** — "Do you want this posted now, or scheduled?" If schedule, get the exact `wallTime` + timezone.
2. **Trial vs real account** — some workspaces have a trial/dev handle (e.g. `shubh.v2026`, `tradinglead.in`) used for dry-runs. Confirm the target Instagram username and its `accountId`. Do not default to the "main" account just because it looks like the primary one.
3. **Reel vs feed vs story vs carousel** (the configured `post_type`) — confirm this matches what the user expects, especially if a previously configured channel already has a different `post_type` set.
4. **Trial reel or regular reel?** — Set `trial_reel: true/false` explicitly on the publish call.

**⚠️ The word "trial" is heavily overloaded.** Users saying "trial reel" / "trial post" / "trial mode" may mean:
- **Meta Trial Reels feature** (`trial_reel: true`) — served only to non-followers, hidden from grid, private metrics
- **Trial/dev account** — a throwaway Instagram handle (`shubh.v2026`, etc.) used for testing

**If not clear from context, STOP and ask which one.** Do not silently assume. `POST /api/bridge/instagram/publish` and `/publish/schedule` both accept `trial_reel` (bool) and `trial_graduation_strategy` (default `"manual"`, never auto-graduate without user consent). See `instagram.md` → "🛑 MANDATORY: Trial Reels — always confirm, never guess". You cannot convert a live regular reel to trial after publish; user must delete + republish.

**How to confirm** — one grouped preview, single question. Example:

```
About to publish:
  • Account:    @ailead.ai  (ig_direct_24c74…)
  • Post type:  Reel
  • Mode:       Trial Reel  (served only to non-followers, hidden from grid)
  • Timing:     Schedule for 2026-08-07 17:45 IST
  • Caption:    "16 Essential SFX every UI designer…"
  • CTA:        (already confirmed above)

Approve, or tell me what to change?
```

**When the user says "just post it" or "schedule it"** without specifying account/timing/type/trial-mode, still surface the resolved values (which account you're about to hit, which slot you're about to book, trial or regular) and get one-line approval before firing. Never assume a real-account, immediate-publish, regular-reel default silently.

### Instagram post types

Set `channels.instagram.post_type` with `/api/bridge/content/configure-publish`. Supported values: `reel`, `feed`, `story`, `image`, `carousel`.

- `reel` uses the Content video URL.
- `image`, `story`, and `carousel` use `media_items: [{ "type": "image"|"video", "url": "https://..." }]`.
- Media URLs must be public HTTPS URLs. Carousel requires 2–10 items. Stories do not use captions.
- Publish with `POST /api/bridge/instagram/publish`; it publishes whatever the configured `post_type` is.

### Scheduling

Both **Instagram** and **YouTube** support native scheduling, but through different mechanics:

- **Instagram** — dedicated `POST /api/bridge/instagram/publish/schedule` endpoint. A background worker in the desktop app claims the slot and publishes at fire time. Takes `wallTime` + `timeZone`.
- **YouTube** — the same `POST /api/bridge/youtube/publish` endpoint accepts `publishAt` (UTC ISO) or `wallTime` + `timeZone`. Google's own system flips the video from `private` to `public` at the target time; the desktop app doesn't need to be running at fire time.
- **LinkedIn** — no scheduling. Post immediately via `POST /api/bridge/publish/linkedin`; to time it, run the call yourself at the desired moment.

For AI-agent workflows, both IG and YT accept the same `{ contentId, wallTime, timeZone }` shape, so a fan-out schedule is one payload template across two endpoints.

---

## Related Skills

| Skill | Relationship |
|-------|-------------|
| `cl-content-inspiration` | Research topics, scrape competitors, find trending content before creating content. |
| `cl-editor` | Desktop editor commands — add text, video, audio, scenes to the timeline. Also documents `POST /api/content/create`. There is no `/api/bridge/content` create route; create via `/api/content/create`, then update via `PUT /api/bridge/content/:id`. |
| `cl-remotion` | Scene templates and custom scene authoring |

> For Instagram competitor/research scraping, see `cl-content-inspiration/social-scraping.md`. This skill only covers owned-account publishing and management.
