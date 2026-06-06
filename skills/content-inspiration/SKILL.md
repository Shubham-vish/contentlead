---
name: content-inspiration
description: Research trending content, analyze competitors, search across platforms (IG, YT, Twitter, Reddit, tech news), and transcribe videos. Use MCP tools for full research capabilities or desktop bridge for quick lookups.
tags: inspiration, trending, research, competitor, niche, search, transcribe, hooks, ideas, content-planning, scraping, twitter, reddit, technews
---

# Content Inspiration & Research

Two access paths:

1. **MCP Server tools** (full research) — scrape IG/YT/Twitter, Reddit, tech news, web search, context memory
2. **Desktop bridge endpoints** (quick lookups) — feed, search, transcribe from the Electron app

## MCP Tools (Recommended — Full Research)

### YouTube Scraping (4 tools)

| Tool | What it does |
|------|-------------|
| `scraping_youtube_search` | Search YouTube for videos by query |
| `scraping_youtube_get_info` | Get video metadata (title, views, description, duration) |
| `scraping_youtube_get_transcript` | Extract full transcript/subtitles from a video |
| `scraping_youtube_channel_videos` | List videos from a YouTube channel |

### Twitter/X Scraping (3 tools)

| Tool | What it does |
|------|-------------|
| `scraping_twitter_search` | Search tweets by query |
| `scraping_twitter_get_trending` | Get trending topics |
| `scraping_twitter_get_user_tweets` | Get tweets from a specific user |

### Reddit (3 tools)

| Tool | What it does |
|------|-------------|
| `reddit_fetch_posts` | Fetch posts from a subreddit |
| `reddit_search` | Search Reddit by query |
| `reddit_get_comments` | Get comments on a post |

### Tech News (4 tools)

| Tool | What it does |
|------|-------------|
| `technews_fetch` | Aggregate from HN, arXiv, Product Hunt, Dev.to, GitHub Trending, HuggingFace, Lobsters, StackOverflow |
| `technews_list_sources` | List all available news sources |
| `technews_fetch_rss` | Fetch from custom RSS feeds |
| `technews_extract` | Extract full article content from a URL |

### Web Search & Crawl (5 tools)

| Tool | What it does |
|------|-------------|
| `web_search` / `search_web` | Search the web (Tavily-powered) |
| `web_fetch` / `search_fetch` | Fetch and extract content from a URL |
| `web_extract` / `search_extract` | Extract clean text from URLs |
| `web_crawl` / `search_crawl` | Crawl a website following links |
| `web_map` / `search_map` | Map a website's URL structure |

### Context Store (5 tools — persistent AI memory)

| Tool | What it does |
|------|-------------|
| `context_list` | List stored context entries |
| `context_search` | Search context by keyword |
| `context_get` | Get a specific context entry |
| `context_manage` | Create/update/delete context entries |
| `context_edit` | Edit context content in-place |

### Research Workflow Example

```
1. technews_fetch(sources=["hackernews", "producthunt"], limit=10)
   → Find trending topics in tech

2. scraping_twitter_search(query="AI video editing")
   → See what's being discussed on Twitter

3. reddit_search(query="best video editing tools 2025", subreddit="videography")
   → Get community opinions

4. scraping_youtube_search(query="AI video editing tutorial")
   → Find top YouTube content

5. scraping_youtube_get_transcript(video_url="https://youtube.com/watch?v=...")
   → Study the hook and structure

6. context_manage(action="create", title="Research: AI Video Editing", content="...")
   → Save findings for later
```

## Desktop Bridge Endpoints (Alternative — from Electron app)

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
