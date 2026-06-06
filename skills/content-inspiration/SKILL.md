---
name: content-inspiration
description: Research trending content, analyze competitors, search across platforms, and transcribe videos — all from the desktop app. Use before creating content to find winning hooks, topics, and formats.
tags: inspiration, trending, research, competitor, niche, search, transcribe, hooks, ideas, content-planning
---

# Content Inspiration

Research trending content, analyze creators, and transcribe videos before creating your own. The bridge proxies to SkillTown's content inspiration engine — powered by cross-platform data from Instagram, YouTube, and more.

## Prerequisites

- User must be **logged in** on the ContentLead web app
- ContentLead subscription active (content inspiration is a gated feature)

## Quick Start

```bash
# 1. Search for content in a niche
curl -X POST http://127.0.0.1:$PORT/api/bridge/inspiration/search \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"context": "AI tools for content creators", "sources": ["instagram"]}'

# 2. Browse a creator's feed
curl "http://127.0.0.1:$PORT/api/bridge/inspiration/feed?username=garyvee&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# 3. Transcribe a video for hook analysis
curl -X POST http://127.0.0.1:$PORT/api/bridge/inspiration/transcribe \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"shortcode": "C8xABcDeFgH"}'
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bridge/inspiration/feed` | Browse a creator's content feed |
| POST | `/api/bridge/inspiration/search` | Search for inspiration across platforms |
| POST | `/api/bridge/inspiration/transcribe` | Transcribe a video by shortcode |

---

## Browse Creator Feed

### `GET /api/bridge/inspiration/feed`

Browse content from a specific creator or search across all indexed content.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `username` | string | | Creator username to browse |
| `search` | string | | Keyword search across all content |
| `page` | number | `1` | Pagination page |
| `limit` | number | `20` | Results per page (max 50) |

```bash
# Browse a specific creator
curl "http://127.0.0.1:$PORT/api/bridge/inspiration/feed?username=garyvee&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Search by keyword
curl "http://127.0.0.1:$PORT/api/bridge/inspiration/feed?search=viral+hooks&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "items": [
    {
      "shortcode": "C8xABcDeFgH",
      "username": "garyvee",
      "caption": "The #1 thing holding back content creators...",
      "mediaType": "VIDEO",
      "likeCount": 45200,
      "commentCount": 1230,
      "viewCount": 892000,
      "timestamp": "2025-01-15T10:30:00Z",
      "thumbnailUrl": "https://...",
      "videoUrl": "https://..."
    }
  ],
  "totalCount": 342,
  "page": 1,
  "limit": 10,
  "hasMore": true
}
```

---

## Search for Inspiration

### `POST /api/bridge/inspiration/search`

AI-powered content search across multiple platforms. Returns ranked, deduplicated results.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `context` | string or object | ✅ | Simple query string OR full SearchContext `{query, keywords, hashtags, entities, origin}` |
| `query` | string | | Shortcut — same as passing `context` as a string |
| `sources` | string[] | | Platforms to search: `["instagram"]`, `["youtube"]`, or both |
| `perSourceLimit` | number | | Results per source (default 10) |
| `limit` | number | | Alias for perSourceLimit |
| `round` | number | | Search round for pagination (default 1) |
| `seenIds` | string[] | | IDs to exclude (for fresh results) |

```bash
curl -X POST http://127.0.0.1:$PORT/api/bridge/inspiration/search \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "context": "short-form video editing tips for beginners",
    "sources": ["instagram"],
    "perSourceLimit": 15
  }'
```

**Response:**
```json
{
  "items": [
    {
      "id": "...",
      "shortcode": "C8xABcDeFgH",
      "username": "editingpro",
      "caption": "5 editing tricks that took me from 0 to 100K...",
      "engagement": { "likes": 12000, "comments": 450, "views": 230000 },
      "relevanceScore": 0.92
    }
  ],
  "perSource": { "instagram": 15 },
  "context": "short-form video editing tips for beginners",
  "fetchedAt": "2025-01-15T10:30:00Z",
  "round": 1,
  "exhausted": false
}
```

---

## Transcribe a Video

### `POST /api/bridge/inspiration/transcribe`

Extract the transcript from an inspiration video. Useful for analyzing hooks, CTAs, and content structure.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `shortcode` | string | ✅ | Video shortcode (from feed/search results) |
| `language` | string | | Language hint (e.g., `"en"`, `"hi"`) |
| `translateToEnglish` | boolean | | Translate to English (default: true) |

```bash
curl -X POST http://127.0.0.1:$PORT/api/bridge/inspiration/transcribe \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"shortcode": "C8xABcDeFgH"}'
```

**Response (accepted — transcription is async):**
```json
{
  "status": "accepted",
  "shortcode": "C8xABcDeFgH",
  "processingStatus": "processing"
}
```

The transcript will be available in the content inspiration feed once processing completes.

---

## Use Case Recipes

### Research before creating

```bash
# 1. Find trending content in your niche
curl -X POST http://127.0.0.1:$PORT/api/bridge/inspiration/search \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"context": "AI productivity tools 2025"}'

# 2. Analyze a top performer's content
curl "http://127.0.0.1:$PORT/api/bridge/inspiration/feed?username=topCreator&limit=5" \
  -H "Authorization: Bearer $TOKEN"

# 3. Transcribe their best video to study the hook
curl -X POST http://127.0.0.1:$PORT/api/bridge/inspiration/transcribe \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"shortcode": "C8xABcDeFgH"}'

# 4. Now create your own video inspired by the research
curl -X POST http://127.0.0.1:$PORT/api/project/create \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title": "5 AI Tools You Need in 2025", "width": 1080, "height": 1920}'
```

### Full content lifecycle

```
Research (inspiration/search)
  → Plan (content-direction skill)
    → Create (editor commands)
      → Render (POST /api/render)
        → Publish (bridge/publish/instagram + linkedin + youtube)
```

---

## Error Handling

| Error | Meaning | Fix |
|-------|---------|-----|
| `not_authenticated` | User not logged in | Log in via the Electron app window |
| `missing_params` | Required field missing | Check param tables above |
| `bridge_timeout` | Request took >30s | Retry; search may be slow for large queries |
| `upstream_error` | Web API returned error | Check if subscription is active |

## Tips for AI Agents

- **Search broadly, then narrow** — start with a general `context`, then explore specific creators
- **Transcribe top performers** — study their hooks, structure, and CTAs
- **Use `seenIds`** to get fresh results on repeated searches
- **Combine with content-direction skill** — research first, then plan the video structure
- **Save inspiration notes** — use the context store or project metadata to record insights
