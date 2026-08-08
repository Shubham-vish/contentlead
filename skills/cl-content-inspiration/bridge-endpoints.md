# Desktop Bridge — full endpoint reference

Every route below lives at `http://127.0.0.1:$PORT` where `$PORT` and `$TOKEN` come from `~/.skilltown-desktop/api.json`. All routes require:

```
Authorization: Bearer $TOKEN
```

Missing the `Bearer` prefix → `401 {"error":"unauthorized"}`.

The bridge is a thin proxy — it forwards to `POST/GET /api/content/inspiration/*` on the SkillTown cloud with the user's auth cookies attached. Errors from the cloud pass through mostly unchanged.

---

## Read routes

### `GET /api/bridge/inspiration/feed`

Legacy IG-only feed. Reads the user's synced reels from Cosmos.

**Query params:**
| Name | Type | Default | Notes |
|---|---|---|---|
| `username` | string | (all) | Filter to a single tracked creator. Pass an IG handle without `@`. |
| `search` | string | — | Substring match across caption, username, hashtags. |
| `page` | int | `1` | 1-based. |
| `limit` | int | `20` | Max 100. |

**Response:**
```json
{ "items": InspirationReel[], "totalCount": N, "page": 1, "limit": 20, "hasMore": true }
```

Pure Cosmos read — no live source pull. Cheap. Use this on every page-load, not `/search`.

---

### `GET /api/bridge/inspiration/creators`

List all tracked creators.

**Response:**
```json
{
  "creators": [
    { "id": "user__ig__mkbhd", "source": "instagram", "identifier": "mkbhd",
      "displayName": "MKBHD", "avatarUrl": "...", "addedAt": "...", "lastRefreshedAt": "...",
      "notes": "..." }
  ]
}
```

---

### `GET /api/bridge/inspiration/niches`

List the user's Pulse niches.

**Response:**
```json
{ "niches": NicheDoc[] }
```

Each `NicheDoc` has `slug`, `name`, `sources[]`, `description`, `settings` (per-source query overrides), `stats.itemCount`, `stats.lastRefreshedAt`.


---

### `GET /api/bridge/inspiration/niches/:slug`

Get one Pulse niche plus its stored items.

**Response:**
```json
{ "niche": NicheDoc, "items": UnifiedItem[], "totalCount": N }
```

---

### `GET /api/bridge/inspiration/export?format=json|csv&ids=id1,id2&username=X`

Export items. Either `ids` (comma-separated) or `username` (all items for a tracked creator).

**Response:** JSON body with `data` (JSON array) or `csv` (string) depending on `format`. Default format: `json`.

---

## Write routes

### `POST /api/bridge/inspiration/search`

Fan-out search across sources. **This is the workhorse for /explore.**

**Body:**
```json
{
  "context": "string OR SearchContext object",
  "sources": ["instagram", "x", "youtube", "reddit", "technews"],
  "limit": 10,
  "round": 0,
  "seenIds": []
}
```

| Field | Required | Default | Notes |
|---|---|---|---|
| `context` | ✅ (or `query`) | — | Plain string is auto-expanded to `{query, keywords: query.split(/\s+/), hashtags: [], entities: [], origin: "desktop-bridge"}`. Pass a full `SearchContext` for entity/language hints. |
| `sources` | | `["instagram"]` | Any subset of the 5 sources. |
| `limit` | | `10` | Max **25** per source. Higher → 400. |
| `round` | | `0` | 0 initial, 1-5 for "Load more". Rotates query suffixes so subsequent rounds surface NEW items, not the same top items again. |
| `seenIds` | | `[]` | Any UnifiedItem id already shown. The route drops these from the response so pagination doesn't repeat. |

**Response:** `FanOutResponse` — see `explore-vs-pulse.md` for full shape and how to interpret `perSource[i].fromCache`, `notice`, `needsConnect`, `retryable`.

**Common `notice` strings:**
- `"widened to past year"` — YouTube auto-broadened the time window after coming up empty at 1d/7d.
- `"Instagram results from your synced reels cache for \"<term>\"."` — expected on IG; not an error.

**Common `errorCode`s:**
- `AUTH_MISSING_COOKIES` — connect the source first in the desktop app; if Desktop is missing, send the user to `/download`.
- `AUTH_INVALID_COOKIES` — cookies expired. `needsCookieRefresh: true` → tell user to update.
- `RATE_LIMITED` — retry after `retryAfterSec`.
- `UPSTREAM_TIMEOUT` — the source page didn't respond in 30s. Retry.
- `EXTRACTION_FAILED` — page shape changed (YT bot-detection). Retry once, then give up.
- `INTERNAL_ERROR` — check `rawError` for the technical detail.

---

### `POST /api/bridge/inspiration/creators`

Track a new creator.

**Body:**
```json
{ "source": "instagram", "identifier": "mkbhd", "notes": "optional" }
```

| Field | Notes |
|---|---|
| `source` | `"instagram"` \| `"x"` \| `"youtube"` \| `"reddit"`. **NOT `"technews"`** (aggregate-only). |
| `identifier` | Handle-shaped input; the route normalizes: IG handle (strips `@`), X handle (strips `@`, extracts from URL), YouTube `@handle`/`youtube.com/@name`/`youtube.com/channel/UC…`/bare handle/`UC…` id, Reddit `r/subreddit`. |
| `notes` | Optional freeform note. |
| `username` | Legacy alias for `identifier` (IG only). Both work. |

For IG, the route validates through the bridge-backed Instagram profile check — confirming both that cookies are valid and that the handle exists. Other sources are regex-validated only (Phase 1).

**Response:** `{ creator: TrackedCreator }` on success. `400` with `{error, message}` on invalid identifier.

---

### `DELETE /api/bridge/inspiration/creators/:identifier`

Untrack a creator. `identifier` is URL-encoded (matches the value you added with).

**Response:** `{ok: true}`.

---

### `POST /api/bridge/inspiration/creators/refresh`

Refresh ONE creator's feed. Runs the source-specific scraper (Electron social browser for IG, HTTP fetchers for X/YT/Reddit) and appends new items to that creator's Cosmos doc.

**Body:**
```json
{ "source": "instagram", "identifier": "mkbhd" }
```

**Response:** `{ok: true, newItems: N, totalItems: N, elapsedMs: N}` (shape varies slightly per source).

---

### `POST /api/bridge/inspiration/creators/refresh-all`

Refresh EVERY tracked creator. No body. Sequential to avoid hammering IG rate limits.

**Response:** `{ok: true, refreshed: N, failed: N, results: [{identifier, ok, error?}]}`.

⚠️ Can take 30-60s on a 10-creator account.

---

### `POST /api/bridge/inspiration/niches`

Create a Pulse niche.

**Body:**
```json
{ "name": "AI editing tools", "sources": ["x","youtube","reddit","technews"], "description": "optional" }
```

| Field | Notes |
|---|---|
| `name` | Required. Slugified server-side to derive `slug`. |
| `sources` | Default: `["x","youtube","reddit","technews"]` (IG excluded — cache-only). |
| `description` | Optional. |

**Response:** `{ niche: NicheDoc }`.


### `DELETE /api/bridge/inspiration/niches/:slug`

Delete a Pulse niche and its cached items.

**Response:** `{ok: true}`.

---

### `POST /api/bridge/inspiration/niches/:slug/refresh`

Run the niche's search across its configured sources and persist new items.

**Response:** `FanOutResponse` (same shape as `/search`), plus items persisted to Cosmos so they show up on `/pulse/:slug` immediately.

---

### `POST /api/bridge/inspiration/transcribe`

Transcribe ONE Instagram reel via Whisper (`prepwithai_backend`).

**Body:**
```json
{ "shortcode": "C8xABC", "language": "en", "translateToEnglish": true }
```

| Field | Notes |
|---|---|
| `shortcode` | Required. IG reel shortcode (from the URL). |
| `language` | Optional BCP-47. Auto-detect if omitted. |
| `translateToEnglish` | Default `true`. Whisper translates non-English audio. |

**Response:**
```json
{ "ok": true, "transcript": "...", "segments": [{"start":0,"end":2.5,"text":"..."}],
  "language": "en", "cached": false }
```

Sets the reel's `processingStatus` to `completed` and mirrors into the shared transcript cache — subsequent calls for the same reel hit cache (no Whisper cost).

**Errors:**
- 400 `missing shortcode`
- 404 reel not found for this user
- 409 already processing (state machine — retry after backoff)
- 500 Whisper failure with `errorMessage`

---

### `POST /api/bridge/inspiration/transcribe-bulk`

Transcribe up to 10 reels **sequentially** (avoids Whisper rate limits).

**Body:**
```json
{ "items": [
    { "shortcode": "C8xABC" },
    { "shortcode": "D9yDEF", "language": "hi", "translateToEnglish": true }
] }
```

| Field | Notes |
|---|---|
| `items[].shortcode` | Required per item. |
| `items[].language` / `translateToEnglish` | Same as single call. |

Max **10** items — larger arrays return 400 `too_many_items`.

**Response:**
```json
{ "results": [{"shortcode":"C8xABC","ok":true,"transcript":"...","cached":false}, ...],
  "total": 2, "succeeded": 2 }
```

Failures don't abort the batch — each result has its own `error` if it failed.

---

### `POST /api/bridge/inspiration/items/update`

Enrich items with AI-computed metadata. Great for "score the top 20 and update".

**Body:**
```json
{ "items": [
    { "id": "userId__shortcode", "aiSummary": "…", "aiHookScore": 85,
      "tags": ["tutorial","AI"], "notes": "internal note", "transcript": "…" }
] }
```

**Allowed fields per item:** `transcript`, `notes`, `tags` (string[]), `aiSummary`, `aiHookScore` (0-100 int). Other fields silently ignored. Every item MUST have an `id`.

Max **50** items per call.

**Response:** `{ ok: true, updated: N, notFound: N, errors: [] }`.

---

### `POST /api/bridge/inspiration/ai-output`

Push a finding to the UI's Findings rail (Brain icon).

**Body:**
```json
{
  "title": "Viral Hook Analysis",
  "content": "…markdown or HTML…",
  "format": "markdown",
  "context": { "page": "explore", "query": "AI tools", "itemCount": 12 },
  "actions": [
    { "id": "select", "label": "Select top", "type": "select-items",
      "payload": { "itemIds": ["id1","id2"] } }
  ],
  "sessionId": "group-multiple-findings"
}
```

| Field | Notes |
|---|---|
| `title` | Required (or `content`). |
| `content` | Required (or `title`). |
| `format` | `"markdown"` \| `"html"` \| `"json"` \| `"fullpage"`. Default `"markdown"`. |
| `context.page` | `"inspiration"` \| `"explore"` \| `"pulse"` \| `"feed"` — controls which surface's Findings panel shows the card. |
| `actions[].type` | `"select-items"` \| `"export"` \| `"copy"` \| `"save-reference"` \| `"custom"`. |
| `sessionId` | Optional. Group multiple related findings under one collapsible header. |

**Size limits:**
- `markdown` / `html` / `json` — **100 KB** content max.
- `fullpage` — **500 KB** content max.

**Response:** `{ ok: true, id: "…" }`.

⚠️ **Storage caveat:** findings live in-memory per Next.js instance (`Map<userId, AiFinding[]>`), capped at **50 per user** (older evicted). Fine in desktop single-instance mode. If the marketing site ever runs multi-instance, findings won't sync across pods.

There is currently **no GET side** for reading findings — the FindingsPanel polls Next.js directly, not via the bridge.

---

### `GET /api/bridge/inspiration/connection-status`

Pre-flight for `/search`. Returns per-source connection state so an AI can skip sources that would fail with `needsConnect`.

**No params.**

**Response:**
```json
{
  "hasCookies": true,
  "platformCookies": { "instagram": true, "x": false, "youtube": false, "reddit": false },
  "status": "ok",
  "platforms": {
    "instagram": {
      "has_cookies": true,
      "saved_at": "2025-11-14T10:22:15.417Z",
      "last_verified_at": "2025-11-14T11:04:02.001Z",
      "identity": { "handle": "shubham", "name": "Shubham", "externalId": "1234..." }
    }
  }
}
```

**Common pattern:**
```
1. GET /connection-status
2. If !platformCookies.instagram → skip "instagram" from sources array in /search
3. Or: if platform.instagram.has_cookies && !platform.instagram.last_verified_at → 
   warn user to reconnect
```

---

### `GET /api/bridge/inspiration/references`

List the user's pinned references, newest first.

**No params.**

**Response:**
```json
{
  "items": [
    { "id": "userId__external", "item": UnifiedItem, "note": "great hook",
      "tags": ["hook","tutorial"], "pinnedAt": "2025-11-01T…" }
  ],
  "total": 3
}
```

---

### `POST /api/bridge/inspiration/references`

Pin, unpin, or update a reference.

**Body — pin:**
```json
{ "action": "pin", "item": UnifiedItem, "note": "great hook", "tags": ["hook"] }
```

**Body — unpin:**
```json
{ "action": "unpin", "item": { "id": "…" } }
```

**Body — update (note/tags on an already-pinned item):**
```json
{ "action": "update", "itemId": "userId__external", "note": "…", "tags": ["…"] }
```

| Field | Notes |
|---|---|
| `action` | `"pin"` (default) \| `"unpin"` \| `"update"`. |
| `item` | Required for `pin`/`unpin`. Full `UnifiedItem` shape (must have `id`, `source`, `canonicalUrl`, `author`, `media`, `engagement`). For unpin only `item.id` is required. |
| `itemId` | Alternative to `item` for `update` — the client may not have the full item on hand when editing notes/tags. |
| `note` | Optional freeform note. |
| `tags` | Optional string array. |

**Responses:**
- pin → `{ pinned: true, reference: {…} }`
- unpin → `{ unpinned: true, itemId: "…" }`
- update → `{ updated: true, reference: {…} }`; `404` if not previously pinned.

---

### `POST /api/bridge/inspiration/transcript`  (unified, non-IG)

Complements `/transcribe` (IG-only, shortcode-based). This one takes a **URL** and works for **YouTube / X / Reddit / Instagram** via the unified transcription pipeline.

**Body:**
```json
{
  "source": "youtube",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "videoUrl": "…direct stream URL for Whisper (optional)…",
  "externalId": "…override cache key (optional, rare)…",
  "title": "for failure UX",
  "language": "en",
  "force": false
}
```

| Field | Notes |
|---|---|
| `source` | Required. `"youtube"` \| `"x"` \| `"reddit"` \| `"instagram"`. |
| `url` | Required (or `videoUrl`). The canonical page URL. |
| `videoUrl` | Optional direct stream URL — for Whisper providers when the page URL doesn't have a stream. IG/X/Reddit typically need this because Whisper can't fetch from the page URL alone. |
| `externalId` | Optional — pre-computed cache key. Normally derived automatically from the URL. |
| `title` | Optional — shown in the UI for failure cases. |
| `language` | Optional BCP-47. Default `"en"`. |
| `force` | Bypass the transcript cache. Default `false`. |

**Response — sync provider (YouTube captions):**
```json
{ "ok": true, "source": "youtube", "transcript": "…", "segments": [{"start":0,"end":2.5,"text":"…"}], "language": "en" }
```

**Response — async provider (Whisper for IG/X/Reddit):**
```json
{ "cacheKey": "…", "state": "processing", "providerId": "whisper",
  "expectedSeconds": 30, "processingStartedAt": "…" }
```
Poll `GET /api/bridge/inspiration/transcript?key=<cacheKey>` until `state !== "processing"`.

**Failure states:**
- `"failed"` — transient error. Retry with `force: true`.
- `"no_captions"` — YouTube video has no captions (benign; don't auto-retry).

---

### `GET /api/bridge/inspiration/transcript?key=<cacheKey>`

Poll an async transcript job.

**Response:**
```json
{ "cacheKey": "…", "state": "ready" | "processing" | "failed" | "no_captions" | "idle",
  "result": TranscriptResult,   // present when state === "ready"
  "errorMessage": "…",           // present on failed
  "processingStartedAt": "…",    // present while processing
  "providerId": "…", "expectedSeconds": 30 }
```

`"idle"` means no job exists for this key yet.

---


## General AI transcription

### `POST /api/bridge/ai/transcribe/{short,long,speakers}`

Transcribe any local or remote media, independent of the inspiration item cache. Use this after `/api/bridge/media/download` when the source lacks captions or when speaker diarization is needed.

| Mode | Use |
|---|---|
| `short` | Short clips and quick turnarounds |
| `long` | Longer media where chunking/long-form handling is needed |
| `speakers` | Speaker-aware transcription/diarization |

> Keep the request body aligned with the current desktop bridge capability surface. At minimum, provide the media location returned by `/api/bridge/media/download` when transcribing downloaded files.

---

## Media download (URL → local file)

### Media downloader setup

The media downloader is driven through `POST /api/bridge/media/download`. It auto-installs `yt-dlp` on first use when needed. To pre-install explicitly, POST `{ "action": "install-yt-dlp" }`.

### `POST /api/bridge/media/download {action:"install-yt-dlp"}`

Force-install the yt-dlp binary into `userData/bin/`. Idempotent — concurrent calls share the same in-flight download. Use this from a "download engine" progress UI or in test setup to preheat the environment.

**Response:**
```json
{ "ok": true, "ytDlpPath": "/…/yt-dlp_macos", "elapsedMs": 6555 }
```

Or on failure:
```json
{ "ok": false, "error": "install_failed", "message": "HTTP 503 from github.com/…" }
```

### `POST /api/bridge/media/download`

Download a video/audio URL to a local file on disk. Chooses a backend automatically per URL:

| URL type | Backend | Examples | Auth |
|---|---|---|---|
| YouTube | `yt-dlp` | `youtube.com/watch?v=…`, `youtu.be/…` | none needed |
| TikTok, FB, Vimeo, Reddit posts | `yt-dlp` | `tiktok.com/@user/video/…` | usually none |
| **Instagram** | `yt-dlp` | `instagram.com/reel/…`, `/p/…` | **cookies required** (as of 2024) |
| **Twitter / X** | `yt-dlp` | `x.com/user/status/…` | **cookies required** (as of 2024) |
| Direct CDN URL | `direct-fetch` | IG `videoUrl`, `v.redd.it/…mp4`, any `.mp4/.m4a/.webm` | Referer/Cookie headers if needed |

**Auto-cookie injection (Instagram, X/Twitter):**
When the URL is an IG or X domain and no explicit cookies are provided, the bridge automatically pulls cookies from the desktop app's social-browser session and writes a Netscape cookies file that yt-dlp consumes. **The caller doesn't need to do anything.** Prerequisite: the user has connected the source at least once through the desktop app's Connect flow; preflight with `GET /api/bridge/inspiration/connection-status`.

If the user isn't logged in yet, the request returns `{ok:false, error:"unavailable", …}` with a hint. Recovery options for the client:
- Prompt user to connect via `/connection-status` UI, then retry.
- Fall back to `cookiesFromBrowser: "chrome"` (or firefox/safari) to use the user's browser session directly.
- Ask user to export cookies to a Netscape file and pass `cookiesFile: "/path/…"`.

**Auto-install:** if yt-dlp isn't on the machine (Homebrew, PATH, or bundled), the module downloads the official release from GitHub Releases into `userData/bin/` on first use. End users do NOT need to `brew install yt-dlp`.

**Body:**
| Field | Type | Default | Notes |
|---|---|---|---|
| `url` | string | required | http(s) only |
| `source` | `"auto"\|"yt-dlp"\|"direct"` | `"auto"` | Override backend picker |
| `quality` | `"best"\|"1080p"\|"720p"\|"audio-only"` | `"best"` | `audio-only` writes `.m4a` |
| `outputDir` | string | `~/Downloads/SkillTown Media` | Must resolve under `$HOME` |
| `filename` | string | derived from URL / title | Sanitized — no path separators, control chars, capped 200 chars |
| `maxSizeMB` | number | `500` | Enforced by `--max-filesize` pre-transfer and byte-counter post-transfer |
| `timeoutMs` | number | `300000` (5 min) | Overall wall-clock cap; child is `SIGKILL`ed on timeout |
| `headers` | `{userAgent?, referer?, cookie?}` | none | For direct-fetch CDNs that 403 without auth (IG, Reddit signed URLs) |
| `cookiesFile` | string | auto-injected for IG/X | Path to Netscape cookies.txt for yt-dlp `--cookies` |
| `cookiesFromBrowser` | `"chrome"\|"firefox"\|"safari"\|"edge"\|…` | none | yt-dlp `--cookies-from-browser` — reads user's own browser session |
| `referer` | string | none | yt-dlp `--referer` |
| `userAgent` | string | none | yt-dlp `--user-agent` |
| `autoCookies` | boolean | `true` | Set `false` to skip auto-injection from social-browser |

**Success 200:**
```json
{
  "ok": true,
  "filePath": "/Users/you/Downloads/SkillTown Media/Me_at_the_zoo.mp4",
  "metadata": {
    "title": "Me at the zoo",
    "source": "yt-dlp",
    "size": 629172,
    "sizeMB": 0.6,
    "duration": 19,
    "width": 320,
    "height": 240,
    "ext": "mp4"
  },
  "elapsedMs": 9889,
  "backend": "yt-dlp",
  "cookieSource": "none" // or "user-provided" | "browser" | "social-browser (auto-injected)"
}
```

**Failure 200** (never throws — always check `ok`):
```json
{ "ok": false, "error": "unavailable", "message": "Video is unavailable, private, or region-locked." }
```

**Error codes:**
| `error` | Cause | Client action |
|---|---|---|
| `missing_url` | URL not provided | Fix request |
| `invalid_output_dir` | `outputDir` escapes $HOME/tmp | Pick a safe dir |
| `yt_dlp_install_failed` | Auto-install failed | Retry; suggest `brew install yt-dlp` |
| `yt_dlp_not_found` | Install unavailable | Manual install required |
| `file_too_large` | Exceeds `maxSizeMB` | Raise cap or pick lower quality |
| `unavailable` | Video is private/region-locked | Nothing — surface to user |
| `unsupported_url` | yt-dlp doesn't know this site | Try `source:"direct"` if it's a CDN URL |
| `http_error` | Direct-fetch got non-200 | Add cookie/referer via `headers` |
| `timeout` | Exceeded `timeoutMs` | Retry with longer timeout or lower quality |
| `spawn_failed` | yt-dlp binary broken | Force-reinstall via `action:"install-yt-dlp"` |
| `output_missing` | yt-dlp exited 0 but no file | Rare — report as bug |

**Typical workflows:**

```jsonc
// 1. Download a YouTube video for AI clipping — no cookies needed
POST /api/bridge/media/download
{ "url": "https://youtube.com/watch?v=abc123", "quality": "720p" }
// → filePath goes straight to cl-ai-clipping.probeVideo / editor.import

// 2. Grab just the audio for transcription
POST /api/bridge/media/download
{ "url": "https://youtube.com/watch?v=abc123", "quality": "audio-only" }
// → filePath is .m4a, feed to /api/media/transcribe

// 3. Instagram reel — cookies auto-injected from social-browser
POST /api/bridge/media/download
{ "url": "https://www.instagram.com/reel/DKvBQvNSMSC/" }
// Prereq: user has connected IG through the desktop app Connect flow at least once.
// Response includes cookieSource:"social-browser (auto-injected)".
// If not connected yet: returns ok:false with a hint to run /connection-status.

// 4. IG/X fallback — use the user's Chrome cookies directly (if they're logged in there)
POST /api/bridge/media/download
{ "url": "https://x.com/user/status/…", "cookiesFromBrowser": "chrome" }

// 5. Download an IG reel when you already have a direct videoUrl (no cookies needed)
POST /api/bridge/media/download
{
  "url": "https://scontent-xxx.cdninstagram.com/…/video.mp4",
  "source": "direct",
  "headers": { "referer": "https://www.instagram.com/" }
}

// 6. Scratch download under Downloads for a one-shot workflow
POST /api/bridge/media/download
{ "url": "…", "outputDir": "~/Downloads/SkillTown Media/Scratch", "quality": "1080p" }
```

**Discovery order** (in order):
1. `YT_DLP_PATH` env
2. `userData/bin/yt-dlp[.exe]` (the auto-installed binary — primary end-user path)
3. `/opt/homebrew/bin/yt-dlp` (macOS Homebrew)
4. `/usr/local/bin/yt-dlp`
5. `yt-dlp` on PATH (`which` / `where`)
6. Auto-install from `https://github.com/yt-dlp/yt-dlp/releases/latest`

---

## Not currently exposed via the bridge

These product capabilities are not in the verified desktop bridge mapping. Do not call cloud routes directly from the agent; use the web UI or add a documented desktop bridge passthrough first:

| Next.js path | Purpose | Where to reach it |
|---|---|---|
| `/api/content/inspiration/current-cookies` | Read stored cookies for a source | Web UI only |
| `/api/content/inspiration/connect-source` | Kick off Electron social-browser login | Web UI only |
| `/api/content/inspiration/connect-ig` | IG-specific connect flow | Web UI only |
| `/api/content/inspiration/verify-connection` | Ping to confirm cookies still valid | Web UI only |
| `/api/content/inspiration/extension-results` | Ingestion endpoint (browser extension → Cosmos) | Extension only |
| `/api/content/inspiration/transcribe/status` | Poll long-running IG transcription jobs (shortcode-based) | Web UI only — use `/transcript` (unified) instead when possible |
| `/api/content/inspiration/creators/[username]` | Deep-dive on ONE tracked creator | Web UI only |
| `/api/content/inspiration/creators/preview` | Preview a creator before adding | ✅ Bridge: `POST /api/bridge/inspiration/creators/preview` |
| `/api/content/inspiration/creators/load-older` | Backfill older items for a tracked creator | ✅ Bridge: `POST /api/bridge/inspiration/creators/load-older` |
| `/api/content/inspiration/creators/items` | Flat item list across creators (with filters) | ✅ Bridge: `GET /api/bridge/inspiration/creators/items` |
| `/api/content/inspiration/niches/[slug]/items` | DELETE cached items for a niche (clear cache) | ✅ Bridge: `DELETE /api/bridge/inspiration/niches/:slug/items` |
| `/api/content/inspiration/video-proxy` + `-two` | CORS-safe video streaming for the in-app player | Player only |

If a workflow needs one of these, add and document a desktop bridge passthrough before relying on it from agent instructions.

---

## Error shape (bridge-level)

Bridge returns errors as:
```json
{ "error": "kind_slug", "message": "human message" }
```

Common bridge-level errors (before hitting the cloud):
- `missing_params` — required field wasn't in the body.
- `too_many_items` — batch route received > max.
- `invalid_item` — an item in a batch is missing `id` / `shortcode`.
- `method_not_allowed` — sent GET to a POST-only route or vice versa.
- `content_too_large` — `ai-output` payload > 100 KB (non-fullpage).

Cloud-level errors (from `/api/content/inspiration/*`) pass through with status codes:
- 401 → **two different causes, two different fixes:**
  - Missing/invalid local bridge token (e.g. no `Bearer` prefix) → re-read `~/.skilltown-desktop/api.json` and resend `Authorization: Bearer <token>`.
  - The desktop app's **cloud session is signed out/expired** → **stop and ask the user to sign in inside the desktop app**, then retry. Re-reading `api.json` will NOT fix this. Do not guess or fabricate results.
- 403 → capability gate refused (`Cap.ContentInspirationView` not on the user's plan). Surface a plan-upgrade message; this is **not** a sign-in problem.
- 429 → rate limited (retry with backoff).
- 500 → cloud error (`rawError` may have detail).

---

## Cheat-sheet for common workflows

**"What's trending in my niche and let me score the top 10"**
```
1. POST /search {context, sources: ["youtube","reddit","technews"]}
2. Filter perSource for velocity ≥ ⚡⚡
3. POST /items/update {items: [{id, aiHookScore, aiSummary}]}  (up to 50)
4. POST /ai-output {title, content, context: {page:"explore"}}
```

**"Transcribe last 5 reels from a creator I track"**
```
1. GET /feed?username=<handle>&limit=5
2. POST /transcribe-bulk {items: items.map(i => ({shortcode: i.shortcode}))}
3. Read results[].transcript into your analysis
```

**"Add a competitor and refresh weekly"**
```
1. POST /creators {source, identifier}                  (add)
2. POST /creators/refresh {source, identifier}          (initial pull)
   Then user (or a cron) periodically:
3. POST /creators/refresh-all                           (weekly)
```

**"Set up ongoing Pulse tracking + first look"**
```
1. POST /niches {name, sources}
2. POST /niches/<slug>/refresh                          (first fan-out; items persist)
3. GET /niches/<slug>                                    (fetch stored items)
```
