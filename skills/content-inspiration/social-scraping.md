# Social Research — Instagram & Twitter/X

Use the SkillTown Desktop bridge and the user's connected desktop sessions. Read auth from `~/.skilltown-desktop/api.json`, then call `http://127.0.0.1:$PORT/api/bridge/...` with `Authorization: Bearer $TOKEN`.

> **Instagram cache vs live nuance:** `/api/bridge/inspiration/search` with `sources:["instagram"]` searches the user's already-synced reels cache in Cosmos. It does not pull arbitrary Instagram live results. For a specific creator, add them to tracked creators, refresh them, then read `/feed`. For an arbitrary reel/video URL, download it with `/api/bridge/media/download`.

---

## Instagram creator reels — tracked creator flow

### 1) Add or ensure the creator is tracked

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/creators"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"source":"instagram","identifier":"mkbhd"}'
```

### 2) Refresh that creator live

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/creators/refresh"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"source":"instagram","identifier":"mkbhd"}'
```

### 3) Read synced reels from the cache

```bash
curl "http://127.0.0.1:$PORT/api/bridge/inspiration/feed?username=mkbhd&limit=10"   -H "Authorization: Bearer $TOKEN"
```

**Returns:** synced reel items with captions, engagement, duration, media metadata, shortcode, and cache state.

---

## Instagram reel by URL

Use the media downloader for arbitrary reel/post/video URLs:

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/media/download"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"url":"https://www.instagram.com/reel/ABC123/","quality":"720p"}'
```

The bridge auto-installs `yt-dlp` when needed and auto-pulls desktop social-browser cookies for Instagram/X if the user has connected that source.

---

## Instagram profile info

Tracked creator records include normalized identifier, display name, avatar, notes, and refresh timestamps via:

```bash
curl "http://127.0.0.1:$PORT/api/bridge/inspiration/creators"   -H "Authorization: Bearer $TOKEN"
```

Note: no bridge route currently exposes detailed Instagram profile stats such as follower/following/post counts and bio. Use the tracked creator record where available.

---

## Twitter/X search

Use cross-source search with `"x"` (not `"twitter"`):

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/search"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"context":"AI video editing","sources":["x"],"limit":10}'
```

For richer query constraints, include them in `context` (for example: `"AI video editing with 50+ likes, latest posts only"`) and filter returned `UnifiedItem.engagement` fields client-side.

---

## Twitter/X trending topics

Note: no bridge route currently exposes Twitter/X trending topics by WOEID. Approximate with `/api/bridge/inspiration/search` or built-in web search.

---

## Twitter/X user timeline

Track and refresh an X creator, then read results through Explore/Pulse/feed surfaces as returned by the bridge:

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/creators"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"source":"x","identifier":"openai"}'

curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/creators/refresh"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"source":"x","identifier":"openai"}'
```

---

## Connection and cookie prerequisites

Check source connection before search or download:

```bash
curl "http://127.0.0.1:$PORT/api/bridge/inspiration/connection-status"   -H "Authorization: Bearer $TOKEN"
```

If Instagram/X are not connected or cookies are invalid, send the user through the desktop app's Connect flow, then retry. Search responses may return `errorCode:"AUTH_MISSING_COOKIES"`, `needsConnect:true`, or `needsCookieRefresh:true`; surface those as connection actions rather than hard failures.
