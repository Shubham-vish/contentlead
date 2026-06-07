# YouTube Research — Search, Metadata, Transcripts, Channel Videos

> No cookies needed for public videos.

---

## `scraping_youtube_search` — Search YouTube

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | ✅ | — | Search query (e.g. `"AI video editing tutorial"`) |
| `limit` | int | | `5` | Results (max 25) |
| `sort` | string | | `"relevance"` | `"relevance"` or `"date"` |
| `upload_within` | string | | — | `"hour"`, `"day"`, `"week"`, `"month"`, `"year"` |
| `min_views` | int | | `0` | Minimum view count |
| `min_duration_sec` | int | | — | Min duration in seconds |
| `max_duration_sec` | int | | — | Max duration in seconds |
| `exclude_shorts` | bool | | `false` | Drop videos under 60s |
| `region` | string | | — | ISO country code (`"US"`, `"IN"`) |
| `feature` | string | | — | `"hd"`, `"4k"`, `"live"`, `"subtitled"` |
| `language` | string | | — | BCP-47 hint (`"en"`, `"hi"`) |

**Returns:** Video metadata: title, duration, views, thumbnail, direct video/audio URLs.

---

## `scraping_youtube_get_info` — Get video metadata + stream URLs

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | ✅ | YouTube video URL |

**Returns:** Title, duration, author, views, likes, description, publish date, **direct video URL** (mp4 with audio — playable/downloadable immediately), audio-only URL, thumbnail URL.

Stream URLs expire in ~6 hours. No cookies needed for public videos.

---

## `scraping_youtube_get_transcript` — Extract transcript/subtitles

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | string | ✅ | — | YouTube video URL |
| `language` | string | | `"en"` | Preferred subtitle language code |

**Returns:**
```json
{
  "success": true,
  "video_id": "...",
  "title": "...",
  "language": "en",
  "is_auto": true,
  "transcript": "Full plain text...",
  "transcript_length": 1234,
  "segments": [
    { "start": 0.0, "end": 4.32, "text": "Hello and welcome." }
  ],
  "segment_count": 142
}
```

Runs async — multiple transcript requests run in parallel.

---

## `scraping_youtube_channel_videos` — List channel videos

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `channel` | string | ✅ | — | Channel handle (`"@mkbhd"`), URL, or channel ID |
| `limit` | int | | `25` | Videos per call (max 50) |
| `offset` | int | | `0` | Skip N videos. Use `next_offset` from previous response. |

**Returns:**
```json
{
  "success": true,
  "channel": "@mkbhd",
  "fetched_count": 25,
  "offset": 0,
  "next_offset": 25,
  "has_more": true,
  "data": [
    {
      "video_id": "...",
      "title": "...",
      "url": "https://youtube.com/watch?v=...",
      "duration_seconds": 612,
      "view_count": 1234567,
      "publish_date": "2025-01-15",
      "thumbnail_url": "https://..."
    }
  ]
}
```
