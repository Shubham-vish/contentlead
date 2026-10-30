---
name: cl-ad-intelligence
description: "Search, analyze, and manage competitor ads from Meta Ad Library. Track brands, save ads to folders, extract video/images, and run heuristic creative analysis (hook detection, CTA, emotional triggers, scoring). USE FOR: competitor ads, ad library, ad creative analysis, track brands, save ads, ad folders, Meta ads, Facebook ads, Instagram ads."
tags: competitor-ads, meta-ad-library, facebook-ads, instagram-ads, creative-analysis
---

# Ad Intelligence — AI Agent Skill

> Follow `cl-desktop`'s audited connection rules: privately parse fresh
> `~/.skilltown-desktop/api.json`, then bounded authenticated health/app-auth
> checks. File presence is not liveness. If unavailable/signed out, report the
> boundary; do not start, reload or switch the shared app to discover commands.

Research and analyze competitor ads across Meta platforms (Facebook + Instagram).

## Quick Start

```bash
# All endpoints are on the Desktop bridge: http://127.0.0.1:$PORT/api/bridge/ads/*
# Auth: Bearer token from ~/.skilltown-desktop/api.json
# Meta API key: stored in Firebase config, retrieve via /api/bridge/ads/config
```

## Prerequisites

1. **Desktop app running** — all routes go through Electron bridge
2. **Meta Ad Library API key** — user must configure via the UI or `POST /api/bridge/ads/config`. The Desktop catalog advertises `ads.*` names, but this recipe verifies the REST handlers, not renderer execution; do not assume `ads.setConfig` works through `/api/execute`.
3. **Logged in** — brands/saved/folders require authenticated session

---

## Endpoints Reference

### Search & Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bridge/ads/search` | Search Meta Ad Library |
| GET | `/api/bridge/ads/pages` | Resolve brand name → Page ID |
| GET | `/api/bridge/ads/thumbnail` | Capture ad snapshot as JPEG (no auth) |
| GET | `/api/bridge/ads/media` | Extract video/image URLs from snapshot (no auth) |

### Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bridge/ads/analyze` | Heuristic analysis of one ad |
| POST | `/api/bridge/ads/analyze-batch` | Analyze multiple ads + avg score |
| POST | `/api/bridge/ads/compare` | Compare ads grouped by brand/platform |

### Brand Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bridge/ads/brands` | List tracked brands |
| POST | `/api/bridge/ads/brands` | Track a brand `{pageId, pageName, pictureUrl?}` |
| DELETE | `/api/bridge/ads/brands?pageId=X` | Untrack a brand |

### Saved Ads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bridge/ads/saved` | List saved ads `?folderId=&tag=` |
| POST | `/api/bridge/ads/saved` | Save ad(s) `{ad, tags?, folderId?, notes?}` or `{ads: [...], tags?, folderId?}` |
| DELETE | `/api/bridge/ads/saved?adId=X` | Unsave an ad |
| PATCH | `/api/bridge/ads/saved` | Update `{adId, tags?, folderId?, notes?}`; null clears folder/notes |

### Folders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bridge/ads/folders` | List folders |
| POST | `/api/bridge/ads/folders` | Create `{name, color?}` |
| PATCH | `/api/bridge/ads/folders` | Rename `{folderId, name}` |
| DELETE | `/api/bridge/ads/folders?folderId=X` | Delete folder |

### Config

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bridge/ads/config` | Get API key status |
| POST | `/api/bridge/ads/config` | Set API key `{apiKey}` |
| DELETE | `/api/bridge/ads/config` | Remove API key |

`GET /config` returns `{configured, apiKey, apiKeyFull}`: **`apiKeyFull` is a
secret**, not merely status. Keep it in memory only, never print/save it in
logs, reports, prompts or public skill files. Search/pages require both the
Desktop bearer token and `x-meta-ad-api-key`; the configured key is not
automatically attached by these handlers. Confirm configuration writes/removal.
Thumbnail/media are the documented unauthenticated exceptions; other routes
require `Authorization: Bearer $TOKEN`. Research scores are heuristics, not
evidence of performance, spend or conversions.

Tracked brands, saved ads and folders use the same session-owned native
collections as the UI. IDs allow1–200 letters/digits/underscore/hyphen, not
paths. Saved batches contain1–1000ads; tags at most100, notes at most10000
characters. A batch patches only its selected ads, not the whole collection.
Confirm save/update/untrack/unsave/delete actions before writes. An uncertain
write is never safe to replay automatically: read the saved collection first.
The source proxy opts into strict JSON; HTML/invalid JSON/transport failure is
not success or permission to silently repeat a mutation.
The optional UI creative-brief template, first-seen counters, grid density,
player controls and clipboard/export presentation do not have REST commands.
These are not a claim of agent-generated personalized creative or automated
brand monitoring; use the supported search/saved analysis workflow.

---

## Search Parameters

```bash
GET /api/bridge/ads/search?q=fitness+app&country=US&status=ACTIVE&media_type=VIDEO&limit=25
```

| Param | Values | Default |
|-------|--------|---------|
| `q` | keyword search | — |
| `page_ids` | comma-separated Meta Page IDs | — |
| `country` | ISO code (US, GB, IN, etc.) | US |
| `status` | ACTIVE, INACTIVE, ALL | ACTIVE |
| `media_type` | ALL, IMAGE, VIDEO, MEME | ALL |
| `limit` | 1–100 | 25 |
| `after` | pagination cursor from previous response | — |

**Headers required:** `x-meta-ad-api-key: <token>`

---

## Analysis Response Schema

```json
{
  "analysis": {
    "hookType": "pattern-interrupt|question|statistic|story|null",
    "ctaPresent": true,
    "ctaType": "purchase|signup|learn-more|download|booking|free-trial|link|null",
    "emotionalTriggers": ["fear","scarcity","value","transformation","convenience","trust","novelty"],
    "urgencySignals": ["time-limited","quantity-limited","immediate-action"],
    "socialProof": true,
    "bodyLength": 120,
    "estimatedReadTime": 7,
    "platforms": ["facebook","instagram"],
    "isLongRunning": true,
    "score": 88
  }
}
```

### Score breakdown (0–100)
- Base: 20
- Hook detected: +15
- CTA present: +15
- Emotional triggers: +8 each (max 20)
- Urgency signals: +10
- Social proof: +10
- Long-running (>30 days): +10

---

## Workflows

### Workflow 1: Competitor Research

```bash
# 1. Find brand's Page ID
GET /api/bridge/ads/pages?q=Nike

# 2. Search their active ads
GET /api/bridge/ads/search?page_ids=123456789&status=ACTIVE&limit=50

# 3. Analyze all their creatives
POST /api/bridge/ads/analyze-batch
Body: {"ads": [<results from step 2>]}

# 4. Track for future monitoring
POST /api/bridge/ads/brands
Body: {"pageId": "123456789", "pageName": "Nike"}

# 5. Save top-performing ads
POST /api/bridge/ads/saved
Body: {"ads": [<top 5 by score>], "tags": ["competitor","nike"], "folderId": "..."}
```

### Workflow 2: Market Analysis

```bash
# 1. Search a niche
GET /api/bridge/ads/search?q=AI+video+editor&country=US&media_type=VIDEO

# 2. Compare brands in the space
POST /api/bridge/ads/compare
Body: {"ads": [...], "groupBy": "page"}

# 3. Identify patterns — which hooks/CTAs dominate?
# → summary[].topHooks, summary[].topCtas, summary[].topTriggers
```

### Workflow 3: Creative Audit

```bash
# 1. Get your brand's active ads
GET /api/bridge/ads/search?page_ids=YOUR_PAGE_ID&status=ACTIVE

# 2. Score them all
POST /api/bridge/ads/analyze-batch
Body: {"ads": [...]}

# 3. Compare against competitor
POST /api/bridge/ads/compare
Body: {"ads": [...your ads + competitor ads...], "groupBy": "page"}

# 4. Extract video from top performer for reference
GET /api/bridge/ads/media?url=<snapshot_url_of_top_ad>
```

---

## Tips

- **Always get config first** — `GET /api/bridge/ads/config` to verify API key is set
- **Page IDs are more precise than keywords** — resolve brand → ID, then search by ID
- **Video ads have richer analysis** — use `media_type=VIDEO` for richer insights
- **Longevity is a heuristic only** — `durationDays > 30` suggests continued public activity, not proven spend, conversions, profitability or ROI. For the user's owned performance and verified offer ledger, use `cl-meta-ads`, not competitor-library observations.
- **Save with tags** — makes retrieval easier later (`?tag=competitor`)
- **Compare by platform** — `groupBy: "platform"` reveals FB vs IG strategy differences
