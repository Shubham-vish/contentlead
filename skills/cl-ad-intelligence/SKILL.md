---
name: cl-ad-intelligence
description: Search, analyze, and manage competitor ads from Meta Ad Library. Track brands, save ads to folders, extract video/images, and run heuristic creative analysis (hook detection, CTA, emotional triggers, scoring). USE FOR: competitor ads, ad library, ad creative analysis, track brands, save ads, ad folders, Meta ads, Facebook ads, Instagram ads.
---

# Ad Intelligence — AI Agent Skill

Research and analyze competitor ads across Meta platforms (Facebook + Instagram).

## Quick Start

```bash
# All endpoints are on the Desktop bridge: http://127.0.0.1:$PORT/api/bridge/ads/*
# Auth: Bearer token from ~/.skilltown-desktop/api.json
# Meta API key: stored in Firebase config, retrieve via /api/bridge/ads/config
```

## Prerequisites

1. **Desktop app running** — all routes go through Electron bridge
2. **Meta Ad Library API key** — user must configure via the UI or `ads.setConfig`
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
| POST | `/api/bridge/ads/saved` | Save ad(s) `{ad, tags?, folderId?}` or `{ads: [...]}` |
| DELETE | `/api/bridge/ads/saved?adId=X` | Unsave an ad |
| PATCH | `/api/bridge/ads/saved` | Update tags/folder `{adId, tags?, folderId?}` |

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
# → summary.topHooks, summary.topCtas, summary.topTriggers
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
- **Long-running ads are proven** — `durationDays > 30` = advertiser keeps spending = ad works
- **Save with tags** — makes retrieval easier later (`?tag=competitor`)
- **Compare by platform** — `groupBy: "platform"` reveals FB vs IG strategy differences
