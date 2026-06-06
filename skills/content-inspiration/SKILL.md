---
name: content-inspiration
description: Research trending content, analyze competitors, search across platforms (IG, YT, Twitter, Reddit, tech news), and transcribe videos. Use MCP tools for full research capabilities or desktop bridge for quick lookups.
tags: inspiration, trending, research, competitor, niche, search, transcribe, hooks, ideas, content-planning, scraping, twitter, reddit, technews
---

# Content Inspiration & Research

Two access paths:

1. **MCP Server tools** (full research) — scrape IG/YT/Twitter, Reddit, tech news, web search, context memory
2. **Desktop bridge endpoints** (quick lookups) — feed, search, transcribe from the Electron app

---

## MCP Tools — YouTube Scraping (4 tools)

### `scraping_youtube_search` — Search YouTube

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | ✅ | — | Search query (e.g. `"AI video editing tutorial"`) |
| `limit` | int | | `5` | Results (max 25) |
| `sort` | string | | `"relevance"` | `"relevance"` or `"date"` |
| `upload_within` | string | | — | `"hour"`, `"day"`, `"week"`, `"month"`, `"year"` |
| `min_views` | int | | `0` | Minimum view count |
| `min_duration_sec` | int | | — | Min duration in seconds |
| `max_duration_sec` | int | | — | Max duration in seconds |
| `exclude_shorts` | bool | | `false` | Drop videos under 60s |
| `region` | string | | — | ISO country code (e.g. `"US"`, `"IN"`) |
| `feature` | string | | — | `"hd"`, `"4k"`, `"live"`, `"subtitled"` |
| `language` | string | | — | BCP-47 hint (e.g. `"en"`, `"hi"`) |

**Returns:** Video metadata: title, duration, views, thumbnail, direct video/audio URLs.

### `scraping_youtube_get_info` — Get video metadata + stream URLs

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | ✅ | YouTube video URL |

**Returns:** Title, duration, author, views, likes, description, publish date, **direct video URL** (mp4 with audio — playable/downloadable immediately), audio-only URL, thumbnail URL. Stream URLs expire in ~6 hours. No cookies needed for public videos.

### `scraping_youtube_get_transcript` — Extract transcript/subtitles

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | string | ✅ | — | YouTube video URL |
| `language` | string | | `"en"` | Preferred subtitle language code |

**Returns:**
```json
{
  "success": true,
  "video_id": "...",
  "title": "...",
  "language": "en",
  "is_auto": true,
  "transcript": "Full plain text...",
  "transcript_length": 1234,
  "segments": [
    { "start": 0.0, "end": 4.32, "text": "Hello and welcome." }
  ],
  "segment_count": 142
}
```

Runs async — multiple transcript requests run in parallel.

### `scraping_youtube_channel_videos` — List channel videos

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `channel` | string | ✅ | — | Channel handle (`"@mkbhd"`), URL, or channel ID |
| `limit` | int | | `25` | Videos per call (max 50) |
| `offset` | int | | `0` | Skip N videos. Use `next_offset` from previous response. |

**Returns:** `{ success, channel, fetched_count, offset, next_offset, has_more, data: [{video_id, title, url, duration_seconds, view_count, publish_date, thumbnail_url}] }`

---

## MCP Tools — Twitter/X Scraping (3 tools)

> **Requires Twitter cookies.** Use `scraping_cookie_update(platform="twitter", cookies="...")` first.

### `scraping_twitter_search` — Search tweets

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | ✅ | — | Search query |
| `limit` | int | | `10` | Max results |
| `product` | string | | `"Latest"` | `"Latest"` or `"Top"` |
| `min_likes` | int | | `0` | Min like count |
| `min_retweets` | int | | `0` | Min retweet count |
| `min_replies` | int | | `0` | Min reply count |
| `language` | string | | — | Language code (e.g. `"en"`) |
| `since` | string | | — | Start date `"YYYY-MM-DD"` |
| `until` | string | | — | End date `"YYYY-MM-DD"` |
| `has_media` | string | | — | Filter: `"images"`, `"videos"`, `"media"` |
| `exclude_replies` | bool | | `false` | Exclude reply tweets |
| `exclude_retweets` | bool | | `false` | Exclude retweets |
| `verified_only` | bool | | `false` | Only verified accounts |
| `from_users` | string | | — | JSON array of usernames: `'["elonmusk", "openai"]'` |

### `scraping_twitter_get_trending` — Get trending topics

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `woeid` | int | `23424848` | Where On Earth ID (default: India). US = `23424977`, Global = `1` |

### `scraping_twitter_get_user_tweets` — Get user timeline

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `username` | string | ✅ | — | Twitter username (without @) |
| `limit` | int | | `10` | Number of tweets |
| `cursor` | string | | — | Pagination cursor from previous response |

---

## MCP Tools — Instagram Scraping (3 tools)

> **Requires Instagram cookies.** Use `scraping_cookie_update(platform="instagram", cookies="...")` first.
> Also documented in the `social-media` skill.

### `scraping_instagram_download_reels` — Get reels from a profile

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `username` | string | ✅ | — | Instagram username (without @) |
| `count` | int | | `5` | Number of reels (1-5). For more, call with `offset`. |
| `offset` | int | | `0` | Skip N reels. Use `next_offset` from previous response. |

**Returns:** Video URLs, captions, likes, views, comments, duration + `next_offset`.

### `scraping_instagram_download_reel_url` — Get reel by URL

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `reel_url` | string | ✅ | Full URL (e.g. `"https://www.instagram.com/reel/ABC123/"`) |

### `scraping_instagram_get_user_info` — Get profile info

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | ✅ | Instagram username (without @) |

**Returns:** Followers, following, posts count, bio, profile picture URL.

---

## MCP Tools — Reddit (4 tools in scraping + 3 in reddit domain)

Two sets of Reddit tools exist:
- `scraping_reddit_*` — in the scraping domain (more params, pagination)
- `reddit_*` — in the reddit domain (simpler)

### `scraping_reddit_fetch_posts` / `reddit_fetch_posts` — Get subreddit posts

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `subreddits` | string | ✅ | — | Comma-separated: `"videography,filmmaking"` |
| `sort` | string | | `"hot"` | `"hot"`, `"new"`, `"top"`, `"rising"` |
| `limit` | int | | `10` | Max posts |
| `time_filter` | string | | `"week"` | `"hour"`, `"day"`, `"week"`, `"month"`, `"year"`, `"all"` |
| `include_comments` | bool | | `false` | Include top comments |
| `comments_per_post` | int | | `5` | Comments per post (if included) |
| `after` | string | | — | Pagination cursor (scraping variant only) |

### `scraping_reddit_search` / `reddit_search` — Search Reddit

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | ✅ | — | Search query |
| `subreddit` | string | | — | Restrict to subreddit |
| `sort` | string | | `"relevance"` | `"relevance"`, `"hot"`, `"top"`, `"new"`, `"comments"` |
| `time_filter` | string | | `"month"` | Time range |
| `limit` | int | | `10` | Max results |
| `include_comments` | bool | | `false` | Include comments |
| `min_score` | int | | `0` | Min upvotes (scraping variant) |
| `min_comments` | int | | `0` | Min comment count (scraping variant) |
| `author` | string | | — | Filter by author (scraping variant) |
| `flair` | string | | — | Filter by flair (scraping variant) |

### `scraping_reddit_get_comments` / `reddit_get_comments` — Get post comments

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `permalink` | string | ✅ | — | Post permalink (e.g. `"/r/videography/comments/abc123/title/"`) |
| `limit` | int | | `20` | Max comments |

### `scraping_reddit_fetch_user_posts` — Get user's posts (scraping only)

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `username` | string | ✅ | — | Reddit username |
| `sort` | string | | `"new"` | `"new"`, `"hot"`, `"top"` |
| `limit` | int | | `10` | Max posts |

---

## MCP Tools — Tech News (4 tools)

### `technews_fetch` — Aggregate tech & AI news

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `sources` | string | all 9 | Comma-separated: `"hackernews,producthunt,arxiv,devto,github_trending,huggingface,lobsters,stackoverflow"` |
| `query` | string | — | Filter by keyword |
| `limit` | int | `15` | Max items per source |
| `since_hours` | int | — | Only items from last N hours |
| `min_score` | int | `0` | Min score/upvotes |
| `filters` | string | — | JSON filters object |

### `technews_list_sources` — List available news sources

No params. Returns source keys, names, search support.

### `technews_fetch_rss` — Fetch from RSS feeds

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `feeds` | string | — | JSON array of RSS feed URLs |
| `limit_per_feed` | int | `10` | Items per feed |

### `technews_extract` — Extract full article content

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `urls` | string | — | JSON array of URLs to extract |
| `max_chars` | int | `5000` | Max content per article |

---

## MCP Tools — Web Search & Crawl (5 tools)

> **Requires Tavily API key.** Except `web_fetch` which is free.

### `web_search` — Search the internet

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | — | Search query |
| `search_depth` | string | `"basic"` | `"basic"` (fast) or `"advanced"` (deeper) |
| `max_results` | int | `5` | Max results (1-20) |
| `include_answer` | bool | `true` | Include AI-generated answer summary |
| `topic` | string | `"general"` | `"general"` or `"news"` |
| `days` | int | — | Only results from last N days |
| `include_domains` | string | — | JSON array: `'["github.com"]'` |
| `exclude_domains` | string | — | JSON array of domains to exclude |

### `web_fetch` — Fetch a single page (FREE)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `url` | string | — | URL to fetch |
| `max_content_length` | int | `5000` | Max chars (0 = no limit) |
| `mode` | string | `"smart"` | `"smart"` (tries all), `"direct"`, `"jina"` (handles JS), `"wayback"` |

### `web_extract` — Extract content from URLs (Tavily)

| Param | Type | Description |
|-------|------|-------------|
| `urls` | string | Single URL or JSON array of URLs |

### `web_crawl` — Crawl a website

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `url` | string | — | Starting URL |
| `max_depth` | int | `1` | Link hops to follow |
| `max_pages` | int | `10` | Max pages to visit |

### `web_map` — Map a website's URL structure

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `url` | string | — | Starting URL |
| `max_depth` | int | `1` | Link hops |
| `max_pages` | int | `50` | Max pages to discover |

---

## MCP Tools — Context Store (5 tools — persistent AI memory)

Personal context store for saving research, prompts, instructions, and references.

### `context_list` — Browse context items

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `view` | string | `"flat"` | `"flat"` (sorted by popularity) or `"tree"` (folder hierarchy) |
| `type` | string | — | Filter by type |
| `folder_id` | string | — | List folder contents |
| `recursive` | bool | `false` | Include nested subfolders |

### `context_search` — Search context

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Keyword search |
| `type` | string | — | Filter by type |
| `tags` | string | — | Filter by tags |
| `limit` | int | `20` | Max results |

### `context_get` — Get a context item

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | Item ID |
| `as_markdown` | bool | Convert HTML to markdown |

### `context_manage` — Create/update/delete context

| Param | Type | Description |
|-------|------|-------------|
| `operations` | string | JSON string — single op or array of ops. Actions: `create_article`, `update_article`, `delete_article`, `create_folder`, etc. |

### `context_edit` — Edit context in-place

| Param | Type | Description |
|-------|------|-------------|
| `edits` | string | JSON string with find/replace/insert edits |

---

## Cookie Management (for scraping tools)

### `scraping_cookie_update` — Set browser cookies

| Param | Type | Description |
|-------|------|-------------|
| `platform` | string | `"instagram"`, `"twitter"`, `"youtube"`, `"reddit"` |
| `cookies` | string | JSON array from Cookie-Editor browser extension |

### `scraping_cookie_status` — Check which platforms have cookies

No params. Returns which platforms have active cookies.

---

## Research Workflows

### Workflow 1: Topic research across all platforms
```python
# 1. What's trending in tech?
technews_fetch(sources="hackernews,producthunt", limit=10, since_hours=24)

# 2. What's Twitter saying?
scraping_twitter_search(query="AI video editing", limit=10, min_likes=50, has_media="videos")

# 3. What's Reddit discussing?
scraping_reddit_search(query="best video editing tools 2025", subreddit="videography", min_score=10)

# 4. What's on YouTube?
scraping_youtube_search(query="AI video editing tutorial", limit=10, min_views=10000, exclude_shorts=True)

# 5. Study a top video's structure
scraping_youtube_get_transcript(url="https://youtube.com/watch?v=...")
# → Analyze the hook (first 30 seconds), CTA placement, structure

# 6. Save findings
context_manage(operations='{"action": "create_article", "title": "Research: AI Video Editing", "content": "..."}')
```

### Workflow 2: Competitor analysis
```python
# Study a creator's Instagram
scraping_instagram_get_user_info(username="competitor_handle")
scraping_instagram_download_reels(username="competitor_handle", count=5)

# Study their YouTube
scraping_youtube_channel_videos(channel="@competitor", limit=10)
scraping_youtube_get_info(url="<their top video>")
scraping_youtube_get_transcript(url="<their top video>")

# Study their Twitter engagement
scraping_twitter_get_user_tweets(username="competitor", limit=20)
```

### Workflow 3: Find viral hooks
```python
# Search for high-engagement reels in your niche
scraping_twitter_search(query="viral hooks content creation", min_likes=100, has_media="videos")
scraping_youtube_search(query="viral hooks tutorial", sort="relevance", min_views=50000)

# Transcribe top videos to extract hook patterns
scraping_youtube_get_transcript(url="...")
# → Look at first 3-5 segments for the hook
```

---

## Desktop Bridge Endpoints (Alternative — from Electron app)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bridge/inspiration/feed` | Browse a creator's content feed |
| POST | `/api/bridge/inspiration/search` | Search for inspiration across platforms |
| POST | `/api/bridge/inspiration/transcribe` | Transcribe a video by shortcode |

### Feed — Browse creator content

```bash
curl "http://127.0.0.1:$PORT/api/bridge/inspiration/feed?username=garyvee&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `username` | string | — | Creator username |
| `search` | string | — | Keyword search |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page (max 50) |

### Search — AI-powered cross-platform search

```bash
curl -X POST http://127.0.0.1:$PORT/api/bridge/inspiration/search \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"context": "AI tools for content creators", "sources": ["instagram"]}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `context` | string/object | ✅ | Query string or `{query, keywords, hashtags, entities, origin}` |
| `sources` | string[] | | `["instagram"]`, `["youtube"]`, or both |
| `perSourceLimit` | number | | Results per source (default 10) |

### Transcribe — Extract video transcript

```bash
curl -X POST http://127.0.0.1:$PORT/api/bridge/inspiration/transcribe \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"shortcode": "C8xABcDeFgH"}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `shortcode` | string | ✅ | Video shortcode from feed/search |
| `language` | string | | Language hint (e.g. `"en"`) |

---

## Error Handling

| Error | Meaning | Fix |
|-------|---------|-----|
| `not_authenticated` | Bridge: user not logged in | Log in via Electron app |
| `cookies_required` | Scraping: no cookies for this platform | Use `scraping_cookie_update` |
| `rate_limited` | Too many requests to platform | Wait and retry |
| `upstream_error` | Platform API error | Check if platform is accessible |

## Tips for AI Agents

- **Always check cookie status first** for scraping tools — `scraping_cookie_status()`
- **YouTube doesn't need cookies** for public videos — `scraping_youtube_*` works without setup
- **Search broadly, then narrow** — start general, then filter by engagement metrics
- **Transcribe top performers** — study hooks (first 30s), structure, and CTAs
- **Use `min_views`/`min_likes`** to filter for proven content, not noise
- **Save findings** — use `context_manage` to store research for later
- **Combine platforms** — trending on Twitter + performing on YouTube = validated topic
