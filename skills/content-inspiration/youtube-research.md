# YouTube Research — Search, Metadata, Transcripts, Channel Videos

Use bridge endpoints plus the agent's built-in web tools. Public YouTube videos usually do not need cookies.

Auth pattern:

```bash
API=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo "$API" | python3 -c 'import sys,json; print(json.load(sys.stdin)["port"])')
TOKEN=$(echo "$API" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')
```

---

## Search YouTube

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/search"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"context":"AI video editing tutorial with 10000+ views","sources":["youtube"],"limit":10}'
```

Filter the returned `UnifiedItem` list by views, duration, publish date, language, or shorts/client preferences using returned metadata. If `/search` broadens the time window, it may include a `notice` such as `"widened to past year"`.

---

## Get video metadata and local media

Use `/api/bridge/media/download` for a playable local mp4/m4a and metadata:

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/media/download"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","quality":"720p"}'
```

**Returns:** `filePath`, title, duration, width, height, size, extension, and backend details. Use the downloaded local mp4/m4a for editing, clipping, and transcription workflows instead of direct expiring stream URLs.

---

## Extract transcript/subtitles

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/transcript"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"source":"youtube","url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","language":"en"}'
```

Synchronous caption responses return `transcript` and timed `segments`. If a job is async, poll:

```bash
curl "http://127.0.0.1:$PORT/api/bridge/inspiration/transcript?key=$CACHE_KEY"   -H "Authorization: Bearer $TOKEN"
```

`no_captions` is a benign terminal state; use `/api/bridge/ai/transcribe/short`, `/long`, or `/speakers` on downloaded media when generated transcription is needed.

---

## Channel videos

Add the channel as a tracked creator, refresh it, then inspect returned/stored items:

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/creators"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"source":"youtube","identifier":"@mkbhd"}'

curl -X POST "http://127.0.0.1:$PORT/api/bridge/inspiration/creators/refresh"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"source":"youtube","identifier":"@mkbhd"}'
```

For deeper channel review, repeat tracked creator refreshes as needed and analyze the returned/stored items.
