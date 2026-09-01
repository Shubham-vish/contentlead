---
name: cl-content-inspiration
description: Research trending content, analyze competitors, search across platforms (IG, YT, X/Twitter, Reddit, tech news), transcribe videos, download videos from any URL (YouTube/IG/TikTok/X → local mp4), save findings and references, and push AI-generated insights into the SkillTown Findings UI. Covers /content/inspiration (legacy IG feed), /content/inspiration/explore (transient fan-out search), and /content/inspiration/pulse (persistent niche monitoring) using the SkillTown Desktop bridge plus built-in web/GitHub tools.
tags: inspiration, trending, research, competitor, niche, search, transcribe, hooks, ideas, content-planning, scraping, twitter, x, reddit, technews, instagram, youtube, findings, ai-output, pulse, explore, velocity, bridge, cookies, references, viral-hooks, hook-analysis, media-download, yt-dlp, url-download, video-download, download-video, save-to-disk, cl-ai-clipping-input, tiktok
---

# Content Inspiration & Research

> **⚙️ Is the ContentLead app running?** These calls need `~/.skilltown-desktop/api.json`. If it is missing, the desktop app is not running — start it, then wait ~30s for the file: **macOS** `open -a "ContentLead"` · **Windows (PowerShell)** `Start-Process "$env:LOCALAPPDATA\Programs\ContentLead\ContentLead.exe"`. Full OS-aware detect/start/poll (Linux + dev too): see `cl-editor/infrastructure.md` → "Ensure the ContentLead desktop app is running". Only ask the user if it still does not come up.

Research tools for finding ideas, analyzing competitors, and discovering trends **before** creating content in the `cl-content-publishing` pipeline.

Use one documented interface:

- **SkillTown Desktop bridge** — local HTTP routes under `http://127.0.0.1:$PORT/api/bridge/*` for logged-in-user context, UI integration, creator refresh, media downloads, references, transcripts, and Findings.
- **Built-in agent tools** — web search, web fetch, and GitHub tools for general web/GitHub research.

Auth for bridge calls:

```bash
API=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo "$API" | python3 -c 'import sys,json; print(json.load(sys.stdin)["port"])')
TOKEN=$(echo "$API" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')
# Use: -H "Authorization: Bearer $TOKEN"
```

## When to use this skill

Load `cl-content-inspiration` when the user wants to:
- **Discover** what's trending / going viral on a topic.
- **Study** a competitor's content.
- **Extract** hooks, transcripts, and viral patterns from videos.
- **Monitor** niches over time with Pulse.
- **Push AI-generated findings** into the SkillTown UI.
- **Save references** to examples the user can revisit.

## When NOT to use this skill

- Posting content to IG/YT/LinkedIn → use `cl-content-publishing`.
- Editing video or creating scenes → use `cl-editor` / `cl-remotion`.
- Scoring a script without research → use `cl-script-evaluator`.
- Extracting viral clips from a video file → use `cl-ai-clipping`.
- Detecting a creator's editing style → use `cl-creator-styles`.

## ⚡ Which tool for which URL?

**This is the most important section.** Two systems exist — pick the right one:

| Scenario | What to use | Why |
|----------|------------|-----|
| **Random YouTube URL** → transcript | `POST /api/bridge/inspiration/transcript` with `{source:"youtube", url:"..."}` | Works directly, extracts captions natively ✅ |
| **Random YouTube URL** → metadata | Built-in `web_fetch` on the URL, or `POST /api/bridge/media/download` to also save | Simple and reliable |
| **Random IG reel URL** → transcript | 1. Add creator: `POST /creators` → 2. Refresh: `POST /creators/refresh` → 3. Transcribe: `POST /transcribe` | IG requires social-browser cookies; tracked creator flow handles this |
| **Random IG reel URL** → download | `POST /api/bridge/media/download` with `{url, source:"instagram"}` | Uses social-browser cookies automatically |
| **Random X/Twitter URL** → transcript | `POST /api/bridge/inspiration/transcript` with `{source:"x", url:"...", videoUrl:"<direct_mp4>"}` — need the direct video URL | X needs CDN URL; get it from tracked items or search results |
| **Tracked creator content** → transcript | `POST /transcribe` (IG) or `POST /transcript` (YT/X/Reddit) — items already have videoUrl from refresh | Best path for content you're monitoring |
| **Any URL** → download to disk | `POST /api/bridge/media/download` | Uses yt-dlp + auto-cookies |
| **General web research** | Built-in `web_search`, `web_fetch` tools | No bridge needed |

### Key rules:
1. **YouTube is frictionless** — just pass the URL to `/transcript`, done.
2. **Instagram requires tracking** — add the creator first, refresh pulls via social browser, then transcribe works.
3. **X/Reddit transcripts need `videoUrl`** — the direct CDN URL comes from search/feed results that already have it.
4. **For downloads**, `/api/bridge/media/download` works for all platforms (uses yt-dlp + desktop cookies).

## Quick decision tree

```
Need to search a topic across sources?           → POST /api/bridge/inspiration/search
Need synced IG reels?                            → GET  /api/bridge/inspiration/feed
Need a live pull for a specific creator?         → POST /creators, then POST /creators/refresh
Need older posts from a creator?                 → POST /creators/load-older (paginate back-catalog)
Need stored items (no scraping)?                 → GET  /creators/items?source=&identifier=
Need ongoing niche monitoring?                   → GET|POST /niches, POST /niches/:slug/refresh
Need a transcript?
  ├── YouTube URL (any, random)                  → POST /transcript {source:"youtube", url:"..."}  ✅ instant
  ├── Instagram (tracked creator's reel)         → POST /transcribe {shortcode:"..."} or /transcribe-bulk
  ├── X/Reddit (from search/feed with videoUrl)  → POST /transcript {source, url, videoUrl}
  └── Any local/remote file                      → POST /api/bridge/ai/transcribe/{short,long,speakers}
Need to save a great example permanently?        → POST /references {action:"pin"}
Need to show the user an analysis result?        → POST /ai-output
Need to check if IG/X are connected?             → GET  /connection-status
Need to download a video URL to disk?            → POST /api/bridge/media/download
Need web or GitHub research?                     → use built-in web search/fetch/GitHub tools
```

## Instagram nuance: cache, creator refresh, and URL download

- `POST /api/bridge/inspiration/search` with source `"instagram"` searches the user's **already-synced reel cache** in Cosmos, populated by the SkillTown Desktop app's Electron social browser.
- If the cache is empty or the user has not connected Instagram, per-source results can include `errorCode:"AUTH_MISSING_COOKIES"` and `needsConnect:true`. Ask the user to connect in the desktop app; you can preflight with `GET /api/bridge/inspiration/connection-status`.
- To pull a **specific creator** live: `POST /api/bridge/inspiration/creators`, then `POST /api/bridge/inspiration/creators/refresh`, then read `/feed` or relevant stored items.
- To grab an **arbitrary reel/video URL**: `POST /api/bridge/media/download`. The downloader auto-installs `yt-dlp` and auto-pulls desktop social-browser cookies for IG/X when available.

## Load the right sub-doc

| When you need to... | Load |
|---------------------|------|
| Search YouTube, get media, transcripts, channel videos | `youtube-research.md` |
| Research Instagram profiles/reels and Twitter/X | `social-scraping.md` |
| Search Reddit, subreddits, comments caveats | `reddit-research.md` |
| Aggregate tech news, RSS feeds, web search/crawl | `news-and-web.md` |
| Understand /inspiration vs /explore vs /pulse, velocity, needsConnect, FanOutResponse | `explore-vs-pulse.md` |
| Full desktop bridge endpoint reference | `bridge-endpoints.md` |

## Interfaces at a glance

### Desktop bridge inspiration routes

| Route | What it does |
|------|-------------|
| `POST /api/bridge/inspiration/search` | Cross-platform fan-out search across Instagram cache, X, YouTube, Reddit, tech news |
| `GET /api/bridge/inspiration/feed` | Browse synced Instagram reels by tracked creator |
| `GET|POST /api/bridge/inspiration/creators` | List/add tracked creators |
| `POST /api/bridge/inspiration/creators/refresh` | Live refresh one tracked creator (X, YouTube, Reddit; IG uses /refresh route) |
| `POST /api/bridge/inspiration/creators/refresh-all` | Refresh all tracked creators |
| `POST /api/bridge/inspiration/creators/load-older` | Paginate older posts from a creator's back-catalog |
| `GET /api/bridge/inspiration/creators/items` | Get stored items for a creator (fast, no scraping) |
| `POST /api/bridge/inspiration/creators/preview` | Preview a creator's profile + sample items before adding |
| `DELETE /api/bridge/inspiration/creators/:identifier` | Remove a tracked creator |
| `GET|POST /api/bridge/inspiration/niches` | List/create Pulse niches |
| `GET /api/bridge/inspiration/niches/:slug` | Fetch one Pulse niche plus its stored items |
| `POST /api/bridge/inspiration/niches/:slug/refresh` | Refresh a Pulse niche and persist items |
| `DELETE /api/bridge/inspiration/niches/:slug` | Delete a Pulse niche |
| `DELETE /api/bridge/inspiration/niches/:slug/items` | Clear cached items for a niche |
| `POST /api/bridge/inspiration/transcribe` | Transcribe one Instagram reel by shortcode (must be from tracked creator) |
| `POST /api/bridge/inspiration/transcribe-bulk` | Transcribe up to 10 Instagram reels |
| `POST /api/bridge/inspiration/transcript` | Unified transcript request by URL (YouTube works directly; IG/X/Reddit need videoUrl) |
| `GET /api/bridge/inspiration/transcript?key=...` | Poll async transcript status |
| `GET|POST /api/bridge/inspiration/references` | List/pin/unpin/update reference items |
| `GET /api/bridge/inspiration/export` | Export items as JSON/CSV |
| `POST /api/bridge/inspiration/items/update` | Update transcript/notes/tags/AI metadata |
| `POST /api/bridge/inspiration/ai-output` | Push rich findings into the UI panel |
| `GET /api/bridge/inspiration/connection-status` | Check source connection/cookie state |
| `GET /api/bridge/inspiration/watchlists` | List all watchlists for current user |
| `POST /api/bridge/inspiration/watchlists` | Create a new watchlist |
| `GET /api/bridge/inspiration/watchlists/:id` | Get one watchlist by ID |
| `PUT /api/bridge/inspiration/watchlists/:id` | Update watchlist metadata (name, color, emoji) |
| `DELETE /api/bridge/inspiration/watchlists/:id` | Delete a watchlist |
| `POST /api/bridge/inspiration/watchlists/:id/members` | Add creator keys to a watchlist |
| `DELETE /api/bridge/inspiration/watchlists/:id/members` | Remove creator keys from a watchlist |
| `POST /api/bridge/media/download` | Download YouTube/IG/TikTok/X/Reddit/CDN media to local mp4/m4a |
| `POST /api/bridge/ai/transcribe/{short,long,speakers}` | General AI transcription for local/remote media |

### Built-in research tools

Use the agent's built-in web search/web fetch/GitHub tools for current web, news, source-code, and repository research. Use `news-and-web.md` for suggested workflows and caveats.

## Examples

### Search

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/search"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"context":"AI tools for content creators","sources":["instagram","x","youtube"],"limit":10}'
```

Valid `sources`: `"instagram"`, `"x"`, `"youtube"`, `"reddit"`, `"technews"`.

### Add and refresh a creator

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/creators"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"source":"instagram","identifier":"mkbhd"}'

curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/creators/refresh"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"source":"instagram","identifier":"mkbhd"}'
```

### Bulk transcribe Instagram reels

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/transcribe-bulk"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"items":[{"shortcode":"C8xABC"},{"shortcode":"D9yDEF"}]}'
```

### Push AI findings to the UI panel

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/ai-output"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"title":"Viral Hook Analysis","format":"markdown","content":"## Top Patterns
| Hook | Count |
|---|---|
| Question | 5 |","context":{"page":"explore","query":"AI tools","itemCount":12}}'
```

### Download a URL for clipping/editor workflows

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/media/download"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"url":"https://youtube.com/watch?v=abc123","quality":"720p"}'
```

## Research workflows

### Full topic research

1. `POST /api/bridge/inspiration/search` with `sources:["youtube","reddit","technews","x"]`.
2. Use built-in web search/fetch for fresh articles or source pages.
3. Transcribe top videos via `/api/bridge/inspiration/transcript` or media download + `/api/bridge/ai/transcribe/{short,long,speakers}`.
4. Save best examples with `/api/bridge/inspiration/references`.
5. Push the analysis with `/api/bridge/inspiration/ai-output`.

### Competitor analysis

1. Add competitor via `/api/bridge/inspiration/creators` for `instagram`, `x`, `youtube`, or `reddit`.
2. Refresh via `/api/bridge/inspiration/creators/refresh`.
3. Pull synced feed/items, download top URLs if needed, transcribe, and analyze hooks/CTA/structure.

### Find viral hooks

1. Search `youtube`, `instagram`, and `x` for the topic.
2. Filter by engagement/velocity.
3. Transcribe top performers.
4. Analyze the first 3-5 seconds/segments and push findings to the UI.

## Tips

- Use `"x"`, not `"twitter"`, in `sources`.
- Check `/connection-status` before Instagram/X-heavy work.
- Search broadly, then filter by engagement and recency.
- Save findings and references so the user can revisit them.
- Combine platforms: web/news trend + YouTube performance + X discussion = stronger validation.

## Watchlists (TradingView-style creator groups)

Organize tracked creators into named lists — like TradingView watchlists. Selecting a watchlist filters the entire Inspiration view (creator list + grid) to show only its members.

### Limits

- **20 watchlists** per user
- **200 creator keys** per watchlist
- **40 characters** max watchlist name

### Data model

Watchlists are stored in Cosmos DB (`ContentInspirationCreators` container, `type: "watchlist"`, partitioned by `/userId`).

```ts
interface Watchlist {
  id: string;
  userId: string;
  type: "watchlist";
  name: string;
  color?: string;       // hex, e.g. "#7c3aed"
  emoji?: string;       // e.g. "🔥"
  creatorKeys: string[]; // e.g. ["instagram:nike", "youtube:mkbhd"]
  createdAt: string;
  updatedAt: string;
}
```

### Bridge routes (all proxied from SkillTown-Desktop)

**List all watchlists:**
```bash
curl -s "http://127.0.0.1:$PORT/api/bridge/inspiration/watchlists" \
  -H "Authorization: $TOKEN"
# → { watchlists: Watchlist[] }
```

**Create a watchlist:**
```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/watchlists" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "Top Brands", "color": "#7c3aed", "emoji": "🏢", "creatorKeys": ["instagram:nike"]}'
# → { watchlist: Watchlist }
```

**Update watchlist metadata:**
```bash
curl -s -X PUT "http://127.0.0.1:$PORT/api/bridge/inspiration/watchlists/:id" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "Renamed List", "color": "#ef4444"}'
# → { watchlist: Watchlist }
```

**Delete a watchlist:**
```bash
curl -s -X DELETE "http://127.0.0.1:$PORT/api/bridge/inspiration/watchlists/:id" \
  -H "Authorization: $TOKEN"
# → { deleted: true }
```

**Add members (creator keys):**
```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/watchlists/:id/members" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"creatorKeys": ["instagram:adidas", "youtube:veritasium"]}'
# → { watchlist: Watchlist }
```

**Remove members:**
```bash
curl -s -X DELETE "http://127.0.0.1:$PORT/api/bridge/inspiration/watchlists/:id/members" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"creatorKeys": ["instagram:adidas"]}'
# → { watchlist: Watchlist }
```

### Zustand store (`watchlistStore.ts`)

The UI uses a Zustand store for client-side watchlist state:

| Action | Description |
|--------|-------------|
| `fetchWatchlists()` | Load all watchlists from API |
| `createWatchlist(name, color?, emoji?)` | Create and select new watchlist |
| `updateWatchlist(id, updates)` | Rename, change color/emoji |
| `deleteWatchlist(id)` | Delete; falls back to "All" |
| `selectWatchlist(id \| null)` | Set active filter (`null` = "All") |
| `watchlistAddMembers(id, keys[])` | Add creator keys |
| `watchlistRemoveMembers(id, keys[])` | Remove creator keys |
| `useWatchlistFilter()` | Hook returning `{ activeId, creatorKeys: Set }` for filtering |

### Firebase persistence

The last-selected watchlist ID is persisted via `useFirebaseConfig(ConfigPath.INSPIRATION_SELECTED_WATCHLIST)` so it restores on reload.

### Key matching

Creator keys may appear in different formats across the system. All filter points use tolerant 3-way matching:
1. Exact `c.key` (e.g. `instagram:username`)
2. Bare `c.identifier` (e.g. `username`)
3. Reconstructed `${source}:${identifier}`

### AI workflow examples

**Create a watchlist and populate it:**
```
1. POST /api/bridge/inspiration/watchlists  → {"name": "AI Creators"}
2. POST /api/bridge/inspiration/watchlists/:id/members → {"creatorKeys": ["instagram:openai", "youtube:3blue1brown"]}
```

**Analyze only creators in a specific watchlist:**
```
1. GET /api/bridge/inspiration/watchlists → find watchlist by name
2. Read watchlist.creatorKeys
3. For each key, GET /api/bridge/inspiration/creators/items?identifier=<key>
4. Transcribe + analyze their content
5. Push findings via /api/bridge/inspiration/ai-output
```
