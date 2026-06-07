# Reddit Research — Posts, Search, Comments

Two sets of Reddit tools exist with slightly different capabilities:

| Domain | Prefix | Extra features |
|--------|--------|---------------|
| Scraping | `scraping_reddit_*` | More filter params, pagination with `after` cursor, user posts |
| Reddit | `reddit_*` | Simpler interface |

Both work — use whichever fits your need.

---

## `scraping_reddit_fetch_posts` / `reddit_fetch_posts` — Get subreddit posts

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `subreddits` | string | ✅ | — | Comma-separated: `"videography,filmmaking"` |
| `sort` | string | | `"hot"` | `"hot"`, `"new"`, `"top"`, `"rising"` |
| `limit` | int | | `10` | Max posts |
| `time_filter` | string | | `"week"` | `"hour"`, `"day"`, `"week"`, `"month"`, `"year"`, `"all"` |
| `include_comments` | bool | | `false` | Include top comments |
| `comments_per_post` | int | | `5` | Comments per post (if included) |
| `after` | string | | — | Pagination cursor (scraping variant only) |

---

## `scraping_reddit_search` / `reddit_search` — Search Reddit

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

---

## `scraping_reddit_get_comments` / `reddit_get_comments` — Get post comments

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `permalink` | string | ✅ | — | Post permalink (e.g. `"/r/videography/comments/abc123/title/"`) |
| `limit` | int | | `20` | Max comments |

---

## `scraping_reddit_fetch_user_posts` — Get user's posts (scraping only)

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `username` | string | ✅ | — | Reddit username |
| `sort` | string | | `"new"` | `"new"`, `"hot"`, `"top"` |
| `limit` | int | | `10` | Max posts |

---

## Tips

- **Combine subreddits:** `"videography,filmmaking,editors"` for broader research
- **Use `min_score`** to filter for proven content
- **Include comments** for audience sentiment analysis
- **Sort by `top`** with `time_filter="month"` for best recent content
