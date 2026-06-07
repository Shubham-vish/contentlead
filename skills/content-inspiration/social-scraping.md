# Social Scraping — Instagram & Twitter/X

> **Requires cookies.** Use `scraping_cookie_update(platform="instagram"|"twitter", cookies="...")` first.
> Check status with `scraping_cookie_status()`.

---

## Instagram Scraping (3 tools)

### `scraping_instagram_download_reels` — Get reels from a profile

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `username` | string | ✅ | — | Instagram username (without @) |
| `count` | int | | `5` | Number of reels (1–5). For more, call with `offset`. |
| `offset` | int | | `0` | Skip N reels. Use `next_offset` from previous response. |

**Returns:** Video URLs, captions, likes, views, comments, duration + `next_offset`.

---

### `scraping_instagram_download_reel_url` — Get reel by URL

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `reel_url` | string | ✅ | Full URL (e.g. `"https://www.instagram.com/reel/ABC123/"`) |

---

### `scraping_instagram_get_user_info` — Get profile info

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | ✅ | Instagram username (without @) |

**Returns:** Followers, following, posts count, bio, profile picture URL.

---

## Twitter/X Scraping (3 tools)

### `scraping_twitter_search` — Search tweets

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | ✅ | — | Search query |
| `limit` | int | | `10` | Max results |
| `product` | string | | `"Latest"` | `"Latest"` or `"Top"` |
| `min_likes` | int | | `0` | Min like count |
| `min_retweets` | int | | `0` | Min retweet count |
| `min_replies` | int | | `0` | Min reply count |
| `language` | string | | — | Language code (`"en"`) |
| `since` | string | | — | Start date `"YYYY-MM-DD"` |
| `until` | string | | — | End date `"YYYY-MM-DD"` |
| `has_media` | string | | — | Filter: `"images"`, `"videos"`, `"media"` |
| `exclude_replies` | bool | | `false` | Exclude reply tweets |
| `exclude_retweets` | bool | | `false` | Exclude retweets |
| `verified_only` | bool | | `false` | Only verified accounts |
| `from_users` | string | | — | JSON array: `'["elonmusk", "openai"]'` |

---

### `scraping_twitter_get_trending` — Get trending topics

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `woeid` | int | `23424848` | Where On Earth ID. India=`23424848`, US=`23424977`, Global=`1` |

---

### `scraping_twitter_get_user_tweets` — Get user timeline

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `username` | string | ✅ | — | Twitter username (without @) |
| `limit` | int | | `10` | Number of tweets |
| `cursor` | string | | — | Pagination cursor from previous response |

---

## Cookie Management

### `scraping_cookie_update` — Set browser cookies

| Param | Type | Description |
|-------|------|-------------|
| `platform` | string | `"instagram"`, `"twitter"`, `"youtube"`, `"reddit"` |
| `cookies` | string | JSON array from Cookie-Editor browser extension |

### `scraping_cookie_status` — Check which platforms have cookies

No params. Returns which platforms have active cookies.

**How to get cookies:**
1. Install "Cookie-Editor" browser extension
2. Log in to Instagram/Twitter in the browser
3. Click Cookie-Editor → Export → Copy
4. Pass the JSON to `scraping_cookie_update`
