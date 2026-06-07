# News & Web — Tech News, RSS, Web Search & Crawl

---

## Tech News (4 tools)

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

## Web Search & Crawl (5 tools)

> **Requires Tavily API key** except `web_fetch` which is free.

### `web_search` — Search the internet

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | — | Search query |
| `search_depth` | string | `"basic"` | `"basic"` (fast) or `"advanced"` (deeper) |
| `max_results` | int | `5` | Max results (1–20) |
| `include_answer` | bool | `true` | Include AI-generated answer summary |
| `topic` | string | `"general"` | `"general"` or `"news"` |
| `days` | int | — | Only results from last N days |
| `include_domains` | string | — | JSON array: `'["github.com"]'` |
| `exclude_domains` | string | — | JSON array of domains to exclude |

### `web_fetch` — Fetch a single page (FREE — no API key)

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

## Tips

- **Use `technews_fetch` for daily trend monitoring** — 9 sources in one call
- **`web_fetch` is free** — no API key needed, use for single pages
- **`web_crawl` for multi-page scraping** — follows links, extracts content from each
- **RSS feeds** — great for monitoring specific blogs or publications regularly
