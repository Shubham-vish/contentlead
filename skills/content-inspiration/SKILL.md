---
name: content-inspiration
description: Research trending content, analyze competitors, search across platforms (IG, YT, X/Twitter, Reddit, tech news), transcribe videos, download videos from any URL (YouTube/IG/TikTok/X → local mp4), save findings and references, and push AI-generated insights into the SkillTown Findings UI. Covers /content/inspiration (legacy IG feed), /content/inspiration/explore (transient fan-out search), and /content/inspiration/pulse (persistent niche monitoring) using the SkillTown Desktop bridge plus built-in web/GitHub tools.
tags: inspiration, trending, research, competitor, niche, search, transcribe, hooks, ideas, content-planning, scraping, twitter, x, reddit, technews, instagram, youtube, findings, ai-output, pulse, explore, velocity, bridge, cookies, references, viral-hooks, hook-analysis, media-download, yt-dlp, url-download, video-download, download-video, save-to-disk, ai-clipping-input, tiktok
---

# Content Inspiration & Research

Research tools for finding ideas, analyzing competitors, and discovering trends **before** creating content in the `content-publishing` pipeline.

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

Load `content-inspiration` when the user wants to:
- **Discover** what's trending / going viral on a topic.
- **Study** a competitor's content.
- **Extract** hooks, transcripts, and viral patterns from videos.
- **Monitor** niches over time with Pulse.
- **Push AI-generated findings** into the SkillTown UI.
- **Save references** to examples the user can revisit.

## When NOT to use this skill

- Posting content to IG/YT/LinkedIn → use `content-publishing`.
- Editing video or creating scenes → use `contentlead` / `remotion`.
- Scoring a script without research → use `script-evaluator`.
- Extracting viral clips from a video file → use `ai-clipping`.
- Detecting a creator's editing style → use `creator-styles`.

## Quick decision tree

```
Need to search a topic across sources?           → POST /api/bridge/inspiration/search
Need synced IG reels?                            → GET  /api/bridge/inspiration/feed
Need a live pull for a specific creator?         → POST /creators, then POST /creators/refresh
Need ongoing niche monitoring?                   → GET|POST /niches, GET|DELETE /niches/:slug, POST /niches/:slug/refresh
Need a transcript?
  ├── Instagram by shortcode                     → POST /transcribe or /transcribe-bulk
  ├── YouTube/X/Reddit/Instagram by URL          → POST /transcript, poll GET /transcript?key=...
  └── Any local/remote media                     → POST /api/bridge/ai/transcribe/{short,long,speakers}
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
| `POST /api/bridge/inspiration/creators/refresh` | Live refresh one tracked creator |
| `POST /api/bridge/inspiration/creators/refresh-all` | Refresh all tracked creators |
| `DELETE /api/bridge/inspiration/creators/:identifier` | Remove a tracked creator |
| `GET|POST /api/bridge/inspiration/niches` | List/create Pulse niches |
| `GET /api/bridge/inspiration/niches/:slug` | Fetch one Pulse niche plus its stored items |
| `POST /api/bridge/inspiration/niches/:slug/refresh` | Refresh a Pulse niche and persist items |
| `DELETE /api/bridge/inspiration/niches/:slug` | Delete a Pulse niche |
| `POST /api/bridge/inspiration/transcribe` | Transcribe one Instagram reel by shortcode |
| `POST /api/bridge/inspiration/transcribe-bulk` | Transcribe up to 10 Instagram reels |
| `POST /api/bridge/inspiration/transcript` | Unified transcript request by URL |
| `GET /api/bridge/inspiration/transcript?key=...` | Poll async transcript status |
| `GET|POST /api/bridge/inspiration/references` | List/pin/unpin/update reference items |
| `GET /api/bridge/inspiration/export` | Export items as JSON/CSV |
| `POST /api/bridge/inspiration/items/update` | Update transcript/notes/tags/AI metadata |
| `POST /api/bridge/inspiration/ai-output` | Push rich findings into the UI panel |
| `GET /api/bridge/inspiration/connection-status` | Check source connection/cookie state |
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
