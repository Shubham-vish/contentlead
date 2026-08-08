---
name: background-removal
description: AI-powered background removal for videos and images. Uses Robust Video Matting (RVM) ONNX models with CoreML/DirectML/CPU execution providers. Works offline. Two-tier surface — timeline items (editor.*) and standalone files (media.*).
---

# Background Removal — AI Matting

Remove backgrounds from **videos** using Robust Video Matting (RVM) shipped with the desktop app. Produces alpha-composited transparent WebM files with **temporal coherence** across frames (no flicker) — much better than in-browser live matting.

> **Images:** see the "Image Background Removal" section at the bottom. Different model (BiRefNet/ISNet), separate command surface.

---

## When to use each variant

| Variant | Model | Quality | Speed (M-series ANE) | Use when |
|---------|-------|---------|----------------------|----------|
| `fast`  | RVM MobileNetV3 | ★★★★ | Near-realtime (~1–2× duration) | Standard talking-head / clean bg, default choice |
| `best`  | RVM ResNet50    | ★★★★★ | ~3–5× slower | Fine hair, motion blur, low-contrast subjects |

---

## Two namespaces

### `editor.*` — apply to an item already on the timeline
Mutates `IVideoDetails.aiMatting` and swaps `details.src` to the transparent WebM. Reversible via `editor.restoreBackground` or `editor.undo`.

### `media.*` — process a file on disk (or remote URL)
Just returns `{ outputUrl, cacheKey, ... }`. No timeline mutation. Use this when the user has a source they haven't dropped on the timeline yet, or when you need the matted output for another purpose.

Both namespaces hit the same backend (RVM ONNX runtime) → same cache.

---

## `editor.removeBackground`

Remove background on ONE timeline video item.

```json
{
  "type": "editor.removeBackground",
  "params": {
    "itemId": "vid_01",
    "variant": "fast",              // optional, default "fast"
    "mode":    "full",              // "full" (whole source) | "range" (segment only)
    "startMs": 0,                   // required when mode="range" — source coords
    "endMs":   0                    // required when mode="range" — source coords
  }
}
```

**Behavior:**
- Blocks until done. Returns `{ itemId, applied: true, cacheKey, outputUrl, cached, variant, mode, processedRangeMs? }`.
- Idempotent — if the item already has matting with the same variant+mode+range, returns `{ skipped: 'already-applied' }`.
- Cache hit ≈ instant (<50ms). Cold path = full inference (seconds to minutes depending on clip length + variant).
- Stamps `details.aiMatting = { enabled: true, model: 'rvm', pipeline: 'baked', variant, cacheKey, originalSrc, mode, processedRangeMs?, originalTrim?, originalDuration? }`.
- For `mode: 'range'`, remaps `trim` to `{ from: 0, to: (endMs - startMs) }` on the item.

**⚠️ Only works on `type: 'video'` items.** Fails cleanly on other types.

**Range params are in the SOURCE's coordinate space**, not the timeline's. If the user says "remove bg from 5s–15s of the clip", that's the trim-into-source range — use their `startMs=5000, endMs=15000` regardless of where the clip sits on the timeline.

---

## `editor.restoreBackground`

Revert. Swaps `details.src` back to `aiMatting.originalSrc` and sets `aiMatting.enabled = false`. For range mode, restores the trim window onto the source's coordinate space.

```json
{
  "type": "editor.restoreBackground",
  "params": { "itemId": "vid_01" }
}
```

Returns `{ itemId, restored: true, originalSrc }`.

---

## `editor.bulkRemoveBackground`

Fan out over many items — or the entire timeline. Shares cache across items with the same underlying source (no duplicated compute).

```json
{
  "type": "editor.bulkRemoveBackground",
  "params": {
    "itemIds":     ["vid_01","vid_02"],   // optional; omit to process every video on the timeline
    "variant":     "fast",                 // optional
    "stopOnError": false                   // default false — try every item
  }
}
```

Only `mode: 'full'` is supported here (range mode needs per-item startMs/endMs — call `editor.removeBackground` per item instead).

Returns:
```json
{
  "variant": "fast",
  "processed": 4,
  "results":   [{ "itemId": "vid_01", "applied": true, "cacheKey": "…", "cached": false }, …],
  "skipped":   [{ "itemId": "sc_02", "reason": "not-video (type=scene)" }],
  "errors":    []
}
```

---

## `query.getBackgroundRemovalStatus`

Read matting state for one item or the whole timeline.

```json
// One item
{ "type": "query.getBackgroundRemovalStatus", "params": { "itemId": "vid_01" } }

// All video items
{ "type": "query.getBackgroundRemovalStatus", "params": {} }
```

Returns:
```json
{
  "items": [
    {
      "itemId": "vid_01",
      "type":   "video",
      "hasMatting": true,
      "matting": {
        "enabled":   true,
        "model":     "rvm",
        "pipeline":  "baked",
        "variant":   "fast",
        "mode":      "full",
        "cacheKey":  "3f4a91c…",
        "originalSrc": "http://127.0.0.1:5178/media?path=…",
        "processedRangeMs": null,
        "applyOrigin": "user",
        "processedAt": 1738934110000
      },
      "currentSrc": "http://127.0.0.1:5178/media?path=…/mattes/<key>/matted.webm"
    }
  ],
  "count": 1
}
```

---

## `media.removeBackground`

Process a standalone file — no timeline touched.

```json
{
  "type": "media.removeBackground",
  "params": {
    "sourcePath": "/Users/shubham/Downloads/talk.mp4",   // OR sourceUrl
    "sourceUrl":  "https://…/clip.mp4",
    "variant":    "fast",
    "mode":       "range",
    "startMs":    30000,
    "endMs":      60000,
    "wait":       true         // default true — block until done
  }
}
```

**`wait: true`** (default) — returns the final payload:
```json
{
  "jobId":        "mtj_abc",
  "jobStatus":    "done",
  "cached":       false,          // true = came from disk cache
  "reattached":   false,          // true = attached to a running duplicate
  "outputUrl":    "http://127.0.0.1:5178/media?path=/…/mattes/<key>/matted.webm",
  "outputPath":   "/…/mattes/<key>/matted.webm",
  "cacheKey":     "…",
  "variant":      "fast",
  "mode":         "range",
  "processedRangeMs": { "from": 30000, "to": 60000 },
  "width":  1920,
  "height": 1080,
  "fps":    30
}
```

**`wait: false`** — returns `{ jobId, jobStatus, ... }` immediately; poll via `media.getBackgroundRemovalStatus`.

Duplicate calls with the same `source + variant + mode + range` are **deduplicated** — they either hit the disk cache (instant) or reattach to an existing running job.

---

## `media.getBackgroundRemovalStatus`

```json
{ "type": "media.getBackgroundRemovalStatus", "params": { "jobId": "mtj_abc" } }
```

Returns full job payload: `{ status, pct, frame, total, downloadPct, outputUrl?, error?, … }`.

---

## `media.cancelBackgroundRemoval`

```json
{ "type": "media.cancelBackgroundRemoval", "params": { "jobId": "mtj_abc" } }
```

---

## `media.lookupBackgroundRemoval`

Query the persistent cache without starting a job. Fast — reads a JSON index off disk.

```json
{
  "type": "media.lookupBackgroundRemoval",
  "params": {
    "source":  "/Users/shubham/Downloads/talk.mp4",   // path OR URL
    "variant": "fast",
    "mode":    "range",
    "startMs": 30000,
    "endMs":   60000
  }
}
```

Returns `{ found: true, outputUrl, cacheKey, variant, mode, processedRangeMs, width, height, fps }` or `{ found: false }`.

Useful for "do we already have this matte?" checks before showing a "Processing…" UI.

---

## End-to-end examples

### Remove bg on a whole timeline clip
```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"editor.removeBackground","params":{"itemId":"vid_01"}}'
```

### Remove bg on 10s–20s of a raw file (no timeline)
```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "media.removeBackground",
    "params": {
      "sourcePath": "/Users/shubham/Movies/interview.mp4",
      "variant":    "best",
      "mode":       "range",
      "startMs":    10000,
      "endMs":      20000
    }
  }'
```
→ then add the resulting `outputUrl` to the timeline via `editor.addVideo`.

### Nuke bg on every video in the design
```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"editor.bulkRemoveBackground","params":{}}'
```

### Fire-and-forget bg removal for a big file
```bash
JOBID=$(curl -sX POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"media.removeBackground","params":{"sourcePath":"/big.mp4","wait":false}}' \
  | jq -r '.result.jobId')

# Later:
curl -sX POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"type\":\"media.getBackgroundRemovalStatus\",\"params\":{\"jobId\":\"$JOBID\"}}"
```

---

## Cache behavior (important)

The desktop app maintains a persistent disk cache at:
```
~/Library/Application Support/ContentLead/mattes/
  ├── <cacheKey>/matted.webm     ← the actual output
  ├── <cacheKey>/.done           ← completion marker
  ├── _index/<sourceHash>.json   ← persistent lookup index
  └── _source-cache/…            ← downloaded remote sources
```

`cacheKey = sha256(sourceBytes + variant + width + height + trimRange).slice(0,20)`

Key implications:
- Re-processing the same file with the same params = **instant** (<50ms).
- Trimming to a different range = different cacheKey = fresh processing.
- Cache survives desktop app restart.
- To force a fresh render, delete the specific `<cacheKey>/` folder manually. There's no "force" flag.

---

## Failure modes

- `Background removal requires the SkillTown Desktop app` → command was invoked in a non-desktop context (cloud web build). RVM only runs locally.
- `item has no src` → item exists but no media loaded — usually an orphan.
- `editor.removeBackground works on video items only (got type=X)` → tried on a text/image/scene item. For images use `editor.removeBackgroundImage` (below).
- `Background removal error: no output produced` → RVM crashed. Check `GET /api/diagnostics?full=true` for the ffmpeg/ONNX stderr.
- Timeouts: hard cap at 10 min per job. For very long clips, split first via `editor.splitItem` and process pieces.

---

## Image Background Removal

For static images (JPG, PNG, WebP), RVM is the wrong tool — it's video-first with temporal recurrent state.

**We ship separate image models** wired to a parallel command surface. Same cache/HTTP pattern, different models:

| Variant | Model | Quality | Size | Use when |
|---------|-------|---------|------|----------|
| `fast`  | ISNet (isnet-general-use) | ★★★★ | ~180MB | Default. Fast, clean cutouts. |
| `best`  | BiRefNet-General          | ★★★★★ | ~880MB | Fine hair, complex edges, SOTA quality. |

Commands (mirror the video surface):

- `editor.removeBackgroundImage { itemId, variant?, alphaRefine? }`
- `editor.restoreBackgroundImage { itemId }`
- `media.removeBackgroundImage { sourcePath|sourceUrl, variant?, alphaRefine? }`
- `media.lookupBackgroundImageRemoval { source, variant?, alphaRefine? }`

Outputs are **PNG with alpha channel** (not WebM).

`alphaRefine: true` applies a 3–5px erode + blur pass to smooth edges — recommended for `best` variant on hair/fur.

Images are FAST (~1–4s per image on ANE) → the API is fully synchronous. No jobs/polling/cancel needed.

Load this same skill doc for image commands too — they follow identical patterns to the video ones above.

---

## In-editor UI (for users, not agents)

Users have three ways to remove background on images in the editor. Agents should mention these when the user asks *"how do I do this myself?"*:

1. **Right-click any image on the timeline** → hover **"Remove background — Fast · N"** (top-level, one click). Uses the last-used variant. Hover the chevron for:
   - **Remove with Fast** — ISNet (ANE, ~6s cold, ms cached). Default.
   - **Remove with Best** — BiRefNet (CPU, ~18s cold, ms cached). Sharper on hair.
   - **Background removal options…** — opens the Properties panel section.
2. **Properties panel → Effects tab → AI Background Removal** — full preview, variant chooser, "Refine edges" toggle, Process / Reprocess / Restore.
3. **Restore originals · N** — appears at the top level of the right-click menu whenever the current selection contains one or more matted images.

### Bulk semantics
The right-click menu batches across all selected images:
- Label shows `Remove backgrounds — Best · 3 of 5 selected` when the selection contains non-images.
- Cache hits are near-instant; already-matched items are counted as "already applied" and skipped.
- BiRefNet runs 2-wide, ISNet runs 3-wide. A persistent sonner toast with a Cancel button reports progress.
- Each processing clip on the timeline shows a fuchsia shimmer stripe + centered "Removing bg (Fast/Best)…" pill until done.

The **Properties panel** section also has a bulk mode: when >1 image items are in the selection it swaps its single-image button for a fan-out button labelled `Remove backgrounds (N)` that runs the same per-item pipeline (each image processed with ITS OWN source, not a shared output). Restore in bulk mode reverts each item to its own `originalSrc`.

**Never** broadcast a single matting result to multiple items via a shared `EDIT_OBJECT` payload — AI matting is per-source: two images = two distinct outputs. The correct pattern is one dispatch per itemId with that item's own `mattedUrl`. See `runImageBgBatch` in `utils/image-bg-removal-batch.ts` + `applyMatteToItem` in `AIBackgroundMenu.tsx` for the reference implementation.

### Persistence of user intent
When a user clicks **Restore original**, the item's `aiMatting = { enabled: false, model }` is persisted. The Properties panel's mount-time auto-lookup respects this and will NOT re-apply a cached matte (would silently defeat the revert). Auto-heal only fires when `aiMatting` is undefined (fresh reopen).

### Refine edges — where it lives
Deliberately excluded from the right-click menu (edge cleanup can damage hair). Available only in the Properties panel per-item.

---

## Troubleshooting: BiRefNet ("best") worker crash

Symptom: user reports `image-matte worker (best) exited code=null signal=SIGTRAP` on the "best" variant only; "fast" works fine.

Root cause: onnxruntime-node's KleidiAI/MlasConv kernel SIGTRAPs during BiRefNet inference when the worker process is Electron running as node (`ELECTRON_RUN_AS_NODE=1`). Under vanilla `node`, the same code / model / ORT options run cleanly.

Fix (already shipped): the worker pool now resolves a vanilla `node` binary at spawn time and falls back to Electron only if none is found. Search order:

1. `SKILLTOWN_MATTE_NODE_BIN` env var — explicit override.
2. `resourcesPath/bundled-node/node` — packaged builds may ship one via `extraResources`.
3. `/opt/homebrew/bin/node`, `/usr/local/bin/node` — Homebrew defaults.
4. `/usr/bin/which node` — PATH lookup.
5. `process.execPath` (Electron) — last resort, logs a warning.

When Best is invoked, look for `[image-matte-worker] using vanilla node: /path/to/node` in the Electron main-process logs. If instead you see `falling back to Electron as node (BiRefNet may crash)`, ask the user to install Node.js (Homebrew: `brew install node`) or set `SKILLTOWN_MATTE_NODE_BIN` to a node binary they have.



---

## Related skills

- `video` — how to add matted output back to the timeline with `editor.addVideo`.
- `queries-and-state` — inspect item state before/after matting.
- `project-and-export` — remember to run `editor.save` after big bulk operations.
