---
name: content-inspiration
description: Research trending content, analyze competitors, search across platforms (IG, YT, Twitter, Reddit, tech news), transcribe videos, and store findings. Use MCP tools for full research or desktop bridge for quick lookups.
tags: inspiration, trending, research, competitor, niche, search, transcribe, hooks, ideas, content-planning, scraping, twitter, reddit, technews, instagram, youtube
---

# Content Inspiration & Research

Research tools for finding ideas, analyzing competitors, and discovering trends
**before** creating content in the `content-publishing` pipeline.

Two access paths:

1. **MCP Server tools** (full research) — scrape IG/YT/Twitter, Reddit, tech news, web search, context memory
2. **Desktop bridge endpoints** (quick lookups) — feed, search, transcribe from the Electron app

---

## Load the Right Sub-Doc

| When you need to... | Load |
|---------------------|------|
| Search YouTube, get video info, transcripts, channel videos | `youtube-research.md` |
| Scrape Instagram profiles/reels, Twitter search/trending | `social-scraping.md` |
| Search Reddit, browse subreddits, get comments | `reddit-research.md` |
| Aggregate tech news, RSS feeds, web search/crawl | `news-and-web.md` |

---

## All Tools at a Glance

### YouTube Research (4 tools) → `youtube-research.md`

| Tool | What it does |
|------|-------------|
| `scraping_youtube_search` | Search YouTube with filters (views, duration, region) |
| `scraping_youtube_get_info` | Get video metadata + direct stream URLs |
| `scraping_youtube_get_transcript` | Extract transcript/subtitles with timestamps |
| `scraping_youtube_channel_videos` | List a channel's videos with pagination |

### Social Scraping (6 tools + cookie management) → `social-scraping.md`

| Tool | What it does |
|------|-------------|
| `scraping_instagram_download_reels` | Get reels from a profile |
| `scraping_instagram_download_reel_url` | Get reel by URL |
| `scraping_instagram_get_user_info` | Get profile info (followers, bio) |
| `scraping_twitter_search` | Search tweets with engagement filters |
| `scraping_twitter_get_trending` | Get trending topics |
| `scraping_twitter_get_user_tweets` | Get user's timeline |
| `scraping_cookie_update` | Set browser cookies for IG/Twitter |
| `scraping_cookie_status` | Check which platforms have active cookies |

### Reddit Research (7 tools) → `reddit-research.md`

| Tool | What it does |
|------|-------------|
| `scraping_reddit_fetch_posts` / `reddit_fetch_posts` | Get subreddit posts |
| `scraping_reddit_search` / `reddit_search` | Search Reddit |
| `scraping_reddit_get_comments` / `reddit_get_comments` | Get post comments |
| `scraping_reddit_fetch_user_posts` | Get user's posts |

### News & Web (9 tools) → `news-and-web.md`

| Tool | What it does |
|------|-------------|
| `technews_fetch` | Aggregate tech & AI news (9 sources) |
| `technews_list_sources` | List news sources |
| `technews_fetch_rss` | Fetch from RSS feeds |
| `technews_extract` | Extract full article content |
| `web_search` | Search the internet (Tavily) |
| `web_fetch` | Fetch a single page (FREE) |
| `web_extract` | Extract content from URLs |
| `web_crawl` | Crawl a website |
| `web_map` | Map a website's URL structure |

### Context Store (5 tools — persistent AI memory)

Personal context store for saving research, prompts, instructions, and references.

| Tool | What it does |
|------|-------------|
| `context_list` | Browse context items (`"flat"` or `"tree"` view) |
| `context_search` | Search by keyword, type, or tags |
| `context_get` | Get a context item by ID |
| `context_manage` | Create/update/delete items and folders |
| `context_edit` | Edit item content in-place (find/replace/insert) |

---

## Cookie Management

Instagram and Twitter scraping require browser cookies.

```python
# Check which platforms have cookies
scraping_cookie_status()

# Set cookies (exported from Cookie-Editor browser extension)
scraping_cookie_update(platform="instagram", cookies='[{"name":"sessionid","value":"..."}]')
scraping_cookie_update(platform="twitter", cookies='[{"name":"auth_token","value":"..."}]')
```

YouTube does NOT need cookies for public videos.

---

## Desktop Bridge Endpoints (Alternative)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bridge/inspiration/feed` | Browse a creator's content feed |
| POST | `/api/bridge/inspiration/search` | AI-powered cross-platform search |
| POST | `/api/bridge/inspiration/transcribe` | Transcribe a video by shortcode |

### Feed
```bash
curl "http://127.0.0.1:$PORT/api/bridge/inspiration/feed?username=garyvee&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Search
```bash
curl -X POST http://127.0.0.1:$PORT/api/bridge/inspiration/search \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"context": "AI tools for content creators", "sources": ["instagram"]}'
```

### Transcribe
```bash
curl -X POST http://127.0.0.1:$PORT/api/bridge/inspiration/transcribe \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"shortcode": "C8xABcDeFgH"}'
```

---

## Research Workflows

### Workflow 1: Full topic research
```python
# 1. What's trending?
technews_fetch(sources="hackernews,producthunt", limit=10, since_hours=24)

# 2. What's Twitter saying?
scraping_twitter_search(query="AI video editing", limit=10, min_likes=50)

# 3. What's Reddit discussing?
scraping_reddit_search(query="best video editing tools 2025", subreddit="videography")

# 4. What's on YouTube?
scraping_youtube_search(query="AI video editing tutorial", limit=10, min_views=10000)

# 5. Study a top video
scraping_youtube_get_transcript(url="https://youtube.com/watch?v=...")

# 6. Save findings
context_manage(operations='{"action": "create_article", "title": "Research: AI Editing", "content": "..."}')
```

### Workflow 2: Competitor analysis
```python
scraping_instagram_get_user_info(username="competitor")
scraping_instagram_download_reels(username="competitor", count=5)
scraping_youtube_channel_videos(channel="@competitor", limit=10)
scraping_twitter_get_user_tweets(username="competitor", limit=20)
```

### Workflow 3: Find viral hooks
```python
scraping_youtube_search(query="viral hooks tutorial", min_views=50000)
scraping_youtube_get_transcript(url="<top result>")
# → Analyze first 3-5 segments for the hook pattern
```

---

## Tips

- **YouTube doesn't need cookies** — `scraping_youtube_*` works without setup
- **Always check cookie status first** for IG/Twitter scraping
- **Search broadly, then narrow** — start general, filter by engagement
- **Transcribe top performers** — study hooks (first 30s), CTAs, structure
- **Save findings** — use `context_manage` to store research for later
- **Combine platforms** — trending on Twitter + performing on YouTube = validated topic
