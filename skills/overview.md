---
name: overview
description: Entry point — all editor capabilities organized by category. Load this first, then load specific skills for detailed params.
tags: overview, capabilities, index, help, start
---

# SkillTown Desktop Editor — Overview

## How to Control the Editor

The desktop app runs a local HTTP API. Commands are JSON objects with `type` and `params`.

### Discovery
```bash
cat ~/.skilltown-desktop/api.json
# → { "schemaVersion": 3, "port": 3847, "token": "abc...", "baseUrl": "http://127.0.0.1:3847",
#     "apiOrigin": "http://127.0.0.1:3847", "appOrigin": "https://contentlead.in",
#     "mediaServerPort": 3848, "contentId": "content_xxx", "editorReady": true,
#     "startedAt": "2025-...", "pid": 12345 }
```

### Health Check (recommended first call)
```bash
curl http://127.0.0.1:$PORT/api/health -H "Authorization: Bearer $TOKEN"
# → { status: "healthy"|"degraded"|"error", editor: {ready, contentId, stateVersion, capabilities},
#     navigation: {currentURL, appOrigin}, media: {serverPort, serverActive},
#     project: {autosaveExists, autosavePath}, errors: {recentCount, totalBuffered}, api: {port, uptime} }
```

### Navigation & Content Discovery
```bash
# List all content items
curl http://127.0.0.1:$PORT/api/content/list -H "Authorization: Bearer $TOKEN"

# Navigate to a content page (auto-opens editor)
curl -X POST http://127.0.0.1:$PORT/api/navigate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"url": "/content/content_xxx", "waitForReady": true, "timeoutMs": 30000}'

# Check current navigation state
curl http://127.0.0.1:$PORT/api/navigation -H "Authorization: Bearer $TOKEN"
```

### Origin Switching (Cloud ↔ Local Dev)
```bash
# Check current origin
curl http://127.0.0.1:$PORT/api/app/origin -H "Authorization: Bearer $TOKEN"

# Switch to local dev server
curl -X POST http://127.0.0.1:$PORT/api/app/set-origin \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"origin": "local"}'
# Shortcuts: "cloud" | "local" | "local-ip" | any full URL
```

### Execute a Command
```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "editor.addText", "params": {"text": "Hello", "from_ms": 0, "duration_ms": 3000}}'
```

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/info` | App status (no auth needed) |
| GET | `/api/health` | Comprehensive health check (editor, media, errors) |
| GET | `/api/state?scope=summary\|snapshot\|full` | Current editor state |
| GET | `/api/capabilities` | Machine-readable command catalog |
| POST | `/api/debug/toggle` | Toggle verbose debug logging |
| POST | `/api/media/heal` | Heal stale media URLs in editor state |
| POST | `/api/execute` | Execute single command |
| POST | `/api/batch` | Execute multiple commands |
| GET | `/api/events` | SSE event stream |
| GET | `/api/metrics` | API and editor metrics |
| GET | `/api/logs` | Query activity logs |
| GET | `/api/console-errors` | Browser console errors/warnings |
| GET | `/api/diagnostics` | Unified error check (`?full=true` for deep scan) |
| GET | `/api/screenshot` | Capture current preview frame as base64 PNG |
| GET | `/api/skills` | List available skill docs |
| GET | `/api/skills/:name` | Load a specific skill doc |
| GET | `/api/scenes` | List custom scenes |
| POST | `/api/scenes` | Create a custom scene |
| GET | `/api/scenes/:name` | Get scene source |
| PUT | `/api/scenes/:name` | Update scene code |
| DELETE | `/api/scenes/:name` | Delete a scene |
| POST | `/api/scene-bundles/build` | Build scene with imports |
| GET | `/api/scene-bundles` | List cached scene bundles |
| GET | `/api/scene-bundles/supported-imports` | List supported imports for bundled scenes |
| GET | `/api/scene-bundles/:id` | Get a bundle by ID |
| DELETE | `/api/scene-bundles/:id` | Delete a cached bundle |
| GET | `/api/render/capabilities` | Check render capabilities |
| GET | `/api/render/jobs` | List render jobs |
| POST | `/api/render` | Start a render job |
| GET | `/api/render/:jobId` | Check render status |
| POST | `/api/render/:jobId/cancel` | Cancel render |
| GET | `/api/project/export` | Export full project as JSON |
| POST | `/api/project/import` | Import design JSON into editor |
| POST | `/api/project/save` | Save project to .skilltown file |
| POST | `/api/project/open` | Load .skilltown file into editor |
| GET | `/api/project/autosaves` | List autosave files |
| GET | `/api/project/recent` | Recent projects list |
| POST | `/api/project/restore` | Restore autosave project into editor |
| POST | `/api/navigate` | Navigate to URL or content path |
| GET | `/api/navigation` | Current URL and navigation state |
| POST | `/api/reload` | Reload the editor page |
| POST | `/api/editor/wait-ready` | Block until editor is mounted and ready |
| GET | `/api/content/list` | List available content/projects |
| POST | `/api/content/create` | Create new content in the database |
| GET | `/api/local-file?path=...` | Serve a local file |
| POST | `/api/media/import` | Import a local file into the media library |
| POST | `/api/media/analyze` | Analyze a media file with ffmpeg |
| POST | `/api/ui/action` | Trigger a UI action (`save`, `undo`, `redo`, etc.) |
| GET | `/api/app/origin` | Get the current frontend origin |
| POST | `/api/app/set-origin` | Switch cloud/local origin |
| GET | `/api/bridge/accounts` | List connected IG/LI/YT accounts |
| POST | `/api/bridge/instagram/publish` | Instagram Reel publish (content-aware, CTA sync) — **preferred** |
| GET | `/api/bridge/instagram/publish/status` | Poll Instagram publish progress (content-aware) — **preferred** |
| POST | `/api/bridge/youtube/publish` | YouTube upload (content-aware) — **preferred** |
| POST | `/api/bridge/publish/instagram` | *Legacy* Instagram publish (not content-aware) |
| GET | `/api/bridge/publish/instagram/status` | *Legacy* Instagram publish status |
| POST | `/api/bridge/publish/linkedin` | LinkedIn post |
| POST | `/api/bridge/publish/youtube` | *Legacy* YouTube upload (not content-aware) |
| GET | `/api/bridge/publish/youtube/status` | *Legacy* YouTube upload status |
| GET | `/api/bridge/inspiration/feed` | Browse creator content feed |
| POST | `/api/bridge/inspiration/search` | Search for content inspiration |
| POST | `/api/bridge/inspiration/transcribe` | Transcribe a video by shortcode |
| GET | `/api/bridge/hub/:handle/articles` | List hub articles (tree/flat) |
| GET | `/api/bridge/hub/:handle/articles/:id` | Get single hub article |
| GET | `/api/bridge/hub/:handle/search?q=...` | Search hub articles |
| POST | `/api/bridge/hub/:handle/manage` | Create/update/delete/publish hub articles & folders |
| POST | `/api/bridge/hub/:handle/edit` | Edit hub article content in-place |

### Activity Logs & Error Checking

> ⚠️ **Before starting any work**, follow the **Mandatory Startup Protocol** in AGENTS.md — check health, errors, timeline validation, and media status.

After executing commands, always check for errors:
```bash
# Get recent errors
curl "http://127.0.0.1:$PORT/api/logs?level=error&latest=true&limit=10" -H "Authorization: Bearer $TOKEN"

# Get all logs after a known sequence number
curl "http://127.0.0.1:$PORT/api/logs?afterSeq=42&limit=20" -H "Authorization: Bearer $TOKEN"

# Get logs for a specific command
curl "http://127.0.0.1:$PORT/api/logs?commandId=abc-123" -H "Authorization: Bearer $TOKEN"
```

Response: `{ entries: [{seq, ts, level, source, message, commandId, data}], currentSeq: N }`

**Important**: Media commands (addAudio, addVideo, addImage) now verify that items actually appear in the timeline before returning success. If a media URL is unreachable or CORS-blocked, the command will return `failed` with a helpful error message.

### Local File Serving

To add local files (audio/video/images) to the editor, use the **media server** (preferred) or the local-file endpoint:
```bash
# Preferred: Media server URL (stable across restarts, port from api.json "mediaServerPort")
# http://127.0.0.1:$MEDIA_PORT/media?path=/absolute/path/to/file.mp3

# Fallback: API server URL (port changes on restart — auto-healed on editor load)
# http://127.0.0.1:$PORT/api/local-file?path=/absolute/path/to/file.mp3&token=$TOKEN
```

- Media server URLs are stable (port doesn't change on restart)
- `/api/local-file` URLs are auto-healed → `/media` URLs when the editor loads (via `rewriteMediaUrlPort`)
- Supports range requests (required for video seeking in Chromium)
- `file://` URLs don't work in the browser context — always use HTTP URLs

> **⚠️ API param normalization**: The API server converts snake_case → camelCase before params reach handlers: `duration_ms` → `duration`, `from_ms` → `from`, `to_ms` → `to`, `item_id` → `itemId`. Both forms work in requests.

> **⚠️ Video loading caveat**: The `ADD_VIDEO` internal reducer creates a hidden `<video>` element
> to detect duration/width/height. This **fails silently** for localhost, data, and CORS-blocked URLs.
> **Always pre-provide `width`, `height`, and `duration` (ms)** when adding videos.
> See the `media-and-audio` skill for details.

---

## Categories & Quick Reference

> **Canonical command reference**: See `AGENTS.md § Complete Command Reference` for the authoritative list of all 90+ commands with full parameter signatures.

### Media (add items to timeline)
- `editor.addText` — styled text overlay with fonts, colors, shadows, strokes
- `editor.addImage` — image with position, opacity, border
- `editor.addVideo` — video clip with volume, speed, trim
- `editor.addAudio` — audio clip with volume, trim
- `editor.addCaption` — caption with karaoke animation
- `editor.addTemplate` — pre-built template
- `editor.addTransition` — transition between items

> **⚠️ ALWAYS pass `from`/`to` (or `from_ms`/`duration_ms`) when adding items.** Without timing params, items default to time 0 and each gets a new track. With timing, non-overlapping items auto-share tracks. See `media-and-audio` skill for details.

> **⚠️ Max 5 audio items total** (Html5Audio browser limit). More = silent failure.

> **⚠️ Use JPEG for background images**, not PNG. JPEG base64 is 10× smaller, prevents renderer crashes. Keep total base64 under 2MB.

### Modify (edit existing items)
- `editor.editItem` — update any property (color, font, text, opacity...)
- `editor.moveItem` — reposition on timeline (change from/to times)
- `editor.trimItem` — change source media trim points
- `editor.deleteItems` — delete one or more items
- `editor.splitItem` — split item at a timestamp (requires explicit `itemIds`)
- `editor.cutItem` — split + delete one side (`keep-left` or `keep-right`)
- `editor.cloneItem` — duplicate items

> **Text styling via `editor.editItem`**: `textShadow` (multi-layer glow), `backgroundColor` (semi-transparent backdrop), `letterSpacing`, `fontWeight`, `fontFamily`, `WebkitTextStrokeColor`, `border`. See `media-and-audio` skill for the professional glow text pattern.

> **⚠️ `placement` (x, y positioning) does NOT work** — returns empty `{}`. All items render at center. Use single combined text blocks with `\n` instead of multiple overlapping text items.

### Canvas (spatial positioning)
- `editor.positionItem` — set x, y, width, height on canvas
- `editor.alignItem` — align to center/left/right/top/bottom/centerH/centerV
- `editor.rotateItem` — rotate by degrees
- `editor.setZIndex` — change layer order (front/back/forward/backward)

### Media Ops
- `editor.replaceMedia` — swap source URL
- `editor.setVolume` — 0-100 (100 = full volume)
- `editor.setAudioGain` — set gain in dB (−60 to 0). Professional mixing control.
- `editor.setPlaybackRate` — 0.25x to 4x speed
- `editor.setOpacity` — 0-1

### Animations & Effects
- `editor.setAnimation` — add enter/exit/loop animation
- `editor.removeAnimation` — remove animation
- `editor.addKeyframe` — animate property over time
- `editor.removeKeyframe` — remove a keyframe
- `editor.addEffect` — blur, brightness, contrast, grayscale, sepia
- `editor.removeEffect` — remove effect

### Tracks
- `editor.muteTrack`, `editor.lockTrack`, `editor.hideTrack`, `editor.renameTrack`
- Always rename tracks after building a sequence (e.g., `🎵 Music`, `📝 Text`, `🖼 BG`)

### Playback & Project
- `editor.play`, `editor.pause`, `editor.seekTo`
- `editor.undo`, `editor.redo`, `editor.save`
- `editor.resize`, `editor.export`, `editor.loadDesign`

### Smart & Bulk Operations
- `editor.removeGaps` — close gaps between items
- `editor.setMagnetic` — toggle snap
- `bulk.deleteByType` — delete all items of a type
- `bulk.styleByType` — style all items of a type at once
- `bulk.shiftAll` — shift all items by N milliseconds

### Content Bridge
- `content.updateMetadata` — update title, description
- `content.applyImage` / `content.removeImage`
- `content.applyCaptions` / `content.removeCaptions`

### Scenes (Remotion templates)
- `scene.listScenes` — browse 159 templates
- `scene.getSceneProps` — get customizable props
- `scene.addLibraryScene` — add scene to timeline
- `scene.addCustomScene` — add custom JSX scene
- `scene.updateSceneProps` — update existing scene
- `scene.previewCode` — preview without adding

### Story Studio (AI content pipeline)
- 5-step pipeline: groupings → decisions → search strings → stock images → apply
- Always check `storystudio.getPipelineState` first

### Queries (read-only)
- `query.getEditorState`, `query.getTrackInfo`, `query.getTimelineItems`
- `query.getItemProperties`, `query.getCurrentTime`, `query.getDuration`
- `query.getCanvasSize`, `query.getSelectedItems`, `query.getAllText`
- `query.getAudioLoudness` — volume/gain in dB for audio items
- `query.getTranscript`, `query.getProjectInfo`
- `query.listFonts`, `query.listAnimationPresets`

### Diagnostics & Infrastructure
- `query.validateTimeline` — full timeline health check
- `query.getCommandHistory` — recent command history (count param)
- `query.getSceneErrors` — scene error list
- `query.getMetrics` — command success/fail rates, timing stats
- `query.diff` — state diffs since version N
- `query.getVisibleText` — text items at specific time
- `query.getCircuitBreakerStatus` — circuit breaker status
- `query.getAssets` — registered media assets

### Media Validation
- `media.validate` — pre-flight URL check
- `media.status` — batch project media check
- `media.prepare` — batch URL accessibility pre-check
- `render.validate` — pre-render validation

### AI Collaboration
- `ai.undoLastAction` — undo with context
- `ai.previewChange` — dry-run preview
- `render.verifyOutput` — post-render verification

---

## Command Format

```json
{"type": "editor.addText", "params": {"text": "Hello", "from_ms": 0, "duration_ms": 3000}}
```

All times in **milliseconds** (1s = 1000ms). Canvas origin: (0,0) = top-left.

---

## Load Specific Skills for Detailed Params

| Skill | When to load |
|-------|-------------|
| `getting-started` | First time setup, auth, discovery |
| `text-and-captions` | Adding/styling text, captions, fonts |
| `animations-and-effects` | Enter/exit/loop animations, keyframes, visual effects |
| `canvas-and-positioning` | Position, align, rotate, z-index, coordinate guides |
| `media-and-audio` | Images, video, audio, volume, speed, opacity |
| `timeline-operations` | Move, trim, split, delete, bulk operations |
| `scenes-and-templates` | Scene library, custom Remotion scenes |
| `custom-scene-authoring` | Create custom .tsx scenes with full React/Remotion freedom |
| `rendering` | Local video rendering — start, monitor, cancel render jobs |
| `storystudio-pipeline` | AI B-roll pipeline (5 steps) |
| `infrastructure` | Debug, metrics, screenshots, media import/analyze, project create/duplicate, UI actions, scene bundles |
| `content-bridge` | Apply/remove images and captions from pipeline |
| `hub` | **Creator Hub** — manage articles, folders, publish/edit content in a user's personal knowledge hub |
| `project-and-export` | Save, export, resize, tracks, undo/redo |
| `queries-and-state` | Read editor state, timeline, transcript, fonts |
| `content-publishing` | **Full content pipeline** — create content, set metadata, upload video, configure channels, CTA, publish to IG/YT/LinkedIn, poll status. Sub-docs: `content-lifecycle.md`, `channel-configuration.md`, `instagram.md`, `youtube.md`, `linkedin.md`, `platform-rules.md`, `workflows.md` |
| `content-inspiration` | Research trending content — YouTube, Instagram, Twitter, Reddit scraping, tech news, web search. Sub-docs: `youtube-research.md`, `social-scraping.md`, `reddit-research.md`, `news-and-web.md` |
| `remotion/SKILL.md` | Index to all Remotion rules (scene commands, animations, components, patterns, debugging) |
| `remotion/rules/*` | Topic-specific Remotion rules (19 files: animations, components, patterns, camera-engine, etc.) |
