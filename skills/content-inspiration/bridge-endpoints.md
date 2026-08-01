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

Pure Cosmos read — no MCP traffic. Cheap. Use this on every page-load, not `/search`.

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

Get one niche + its recent items.

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
  "perSourceLimit": 10,
  "round": 0,
  "seenIds": []
}
```

| Field | Required | Default | Notes |
|---|---|---|---|
| `context` | ✅ (or `query`) | — | Plain string is auto-expanded to `{query, keywords: query.split(/\s+/), hashtags: [], entities: [], origin: "desktop-bridge"}`. Pass a full `SearchContext` for entity/language hints. |
| `sources` | | `["instagram"]` | Any subset of the 5 sources. |
| `perSourceLimit` | | `10` | Max **25**. Higher → 400. |
| `round` | | `0` | 0 initial, 1-5 for "Load more". Rotates query suffixes so subsequent rounds surface NEW items, not the same top items again. |
| `seenIds` | | `[]` | Any UnifiedItem id already shown. The route drops these from the response so pagination doesn't repeat. |

**Response:** `FanOutResponse` — see `explore-vs-pulse.md` for full shape and how to interpret `perSource[i].fromCache`, `notice`, `needsConnect`, `retryable`.

**Common `notice` strings:**
- `"widened to past year"` — YouTube auto-broadened the time window after coming up empty at 1d/7d.
- `"Instagram results from your synced reels cache for \"<term>\"."` — expected on IG; not an error.

**Common `errorCode`s:**
- `AUTH_MISSING_COOKIES` — connect the source first (for IG: install desktop app).
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

For IG, the route validates by calling `scraping_instagram_get_user_info` under the hood — confirms both that cookies are valid AND the handle exists. Other sources are regex-validated only (Phase 1).

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

---

### `DELETE /api/bridge/inspiration/niches/:slug`

Delete a niche + all its items.

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

## Not currently exposed via the bridge

These Next.js routes exist but aren't wrapped as `/api/bridge/inspiration/*`. An AI running on the desktop side has to either add a bridge passthrough or hit `contentlead.in` directly with the user's session cookies:

| Next.js path | Purpose | Where to reach it |
|---|---|---|
| `/api/content/inspiration/connection-status` | Which sources have valid cookies/session | Web UI only today |
| `/api/content/inspiration/current-cookies` | Read stored cookies for a source | Web UI only |
| `/api/content/inspiration/connect-source` | Kick off Electron social-browser login | Web UI only |
| `/api/content/inspiration/connect-ig` | IG-specific connect flow | Web UI only |
| `/api/content/inspiration/verify-connection` | Ping to confirm cookies still valid | Web UI only |
| `/api/content/inspiration/extension-results` | Ingestion endpoint (browser extension → Cosmos) | Extension only |
| `/api/content/inspiration/references` | Reference library (save/list/delete) | Web UI only |
| `/api/content/inspiration/transcript` + `/transcript/status` | Fetch stored transcript by shortcode / poll status | Web UI only |
| `/api/content/inspiration/transcribe/status` | Poll long-running transcription jobs | Web UI only |
| `/api/content/inspiration/creators/[username]` | Deep-dive on ONE tracked creator | Web UI only |
| `/api/content/inspiration/creators/preview` | Preview a creator before adding | Web UI only |
| `/api/content/inspiration/creators/load-older` | Backfill older items for a tracked creator | Web UI only |
| `/api/content/inspiration/creators/items` | Flat item list across creators (with filters) | Web UI only |
| `/api/content/inspiration/niches/[slug]/items` | Paginated items list within a niche | Web UI only |
| `/api/content/inspiration/video-proxy` + `-two` | CORS-safe video streaming for the in-app player | Player only |

If a workflow needs one of these, add a bridge passthrough following the pattern in `SkillTown-Desktop/electron/api-server/bridge-routes.cjs` (line ~1255+). Read-only routes are easy: 1 handler + 1 route registration in `api-server.cjs`.

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
- 401 → not logged in (rare — the bridge attaches auth automatically; check `~/.skilltown-desktop/api.json`).
- 403 → capability gate refused (`Cap.ContentInspirationView` not on the user's plan).
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
