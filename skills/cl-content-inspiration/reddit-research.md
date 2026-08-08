# Reddit Research — Posts, Search, Comments

Use `/api/bridge/inspiration/search` for topic/subreddit discovery and the built-in web tools for public Reddit pages when deeper thread inspection is needed.

Auth pattern: read `~/.skilltown-desktop/api.json`, then send `Authorization: Bearer $TOKEN` to `http://127.0.0.1:$PORT/api/bridge/...`.

---

## Search Reddit

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/search"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"context":"best video editing tools in r/videography with high comments","sources":["reddit"],"limit":10}'
```

Use the natural-language `context` for subreddit, recency, score/comment hints, then filter returned `UnifiedItem.engagement` fields client-side.

---

## Subreddit posts

For ongoing tracking, add a subreddit as a creator-like source and refresh it:

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/creators"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"source":"reddit","identifier":"r/videography"}'

curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/creators/refresh"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"source":"reddit","identifier":"r/videography"}'
```

For ad-hoc browsing, use `/search` with `sources:["reddit"]`.

---

## Comments on a Reddit post

Note: no bridge route currently exposes structured Reddit comments. Use built-in web fetch on the public permalink when needed.

---

## User posts

Note: no bridge route currently exposes Reddit user-post threads. Approximate with `/search` using `context:"posts by u/<username> ..."`, or use built-in web search/fetch.

---

## Tips

- Use `"reddit"` in the bridge `sources` array.
- Combine subreddits in the `context` text for broad research.
- Include comments/score/recency requirements in `context`, then filter the response.
- Save promising posts with `/api/bridge/inspiration/references`.
