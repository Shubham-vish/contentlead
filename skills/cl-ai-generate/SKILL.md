---
name: cl-ai-generate
description: "Drive the ContentLead in-app AI generation surface (Veo 3.1 video, Gemini Omni video/edit, NanoBanana images) from any agent via the desktop /api/execute bridge. Owns the aiVideo.* command recipe: generate -> poll job -> add candidate to timeline -> approve/reject, including start/end frames and reference images, plus bring-your-own-key (Google Cloud project) quota. Load this whenever you need to GENERATE new footage/stills inside the editor rather than editing existing media."
tags: ai-video, veo, omni, nanobanana, generate, text-to-video, image-to-video, reference-images, start-frame, end-frame, byok, aiVideo, api/execute
---

# cl-ai-generate — In-App AI Media Generation (Veo / Omni / NanoBanana)

> **Owns the question:** *"How do I generate a NEW video/image inside ContentLead from an agent — Veo/Omni/NanoBanana — and land it on the timeline, via commands (not the panel UI)?"*
> **Delegates to:** `cl-editor` (startup protocol, `/api/execute`, track intent), `track-management` (track z-order), `audio-gain-eq`/`item-editing` (post-gen cleanup like `editor.removeSilence`), `rendering` (final MP4). For **out-of-app** direct-gcloud Veo/Omni generation see `my-veo-reel-gen` / `my-omni-video-gen` — this skill is the **in-editor command surface** instead.

---

## When to use this skill vs. others

| You want to… | Use |
|---|---|
| Generate a clip/still **inside the editor** and drop it on a track | **this skill** (`aiVideo.*` commands) |
| Generate a clip **outside the app** with raw gcloud/curl, then import a file | `my-veo-reel-gen`, `my-omni-video-gen` |
| Edit / trim / caption **existing** media | `cl-editor` sub-skills |
| Remove silence from generated dialogue | `editor.removeSilence` (see `item-editing` / `audio-gain-eq`) |

---

## Prerequisite: cl-editor startup protocol

This skill runs **on top of** `cl-editor`. Before any command:

1. Read `~/.skilltown-desktop/api.json` → `PORT`, `TOKEN`.
2. Health check, diagnostics, **check tabs** (multi-tab → pass `tabId` on every call).
3. Open the target content (`/api/navigate`).

All commands below are issued as:

```bash
curl -s -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "type": "aiVideo.generate", "params": { ... }, "tabId": "<tab-if-multi>" }'
```

The desktop bridge routes `/api/execute` → IPC `editor:execute` → `ElectronAgentBridge` → the shared `commandExecutor` (the same executor the web app uses), so these commands behave identically in Electron and web.

---

## The command surface (6 commands)

| Command | Category | What it does |
|---|---|---|
| `aiVideo.generate` | system | Start a Veo/Omni/NanoBanana job. Returns `{ job, candidate? }`. |
| `aiVideo.getJobStatus` | query | Poll a job by `jobId`. On completion persists a candidate + returns `candidateId`. |
| `aiVideo.listCandidates` | query | List all generated candidates for this content. |
| `aiVideo.addCandidateToTimeline` | mutation | Place a finished candidate on a track (**track intent required**). |
| `aiVideo.approve` / `aiVideo.reject` | system | Mark a candidate approved/rejected. |

---

## Models & modes

`model` (exact ids):

| id | Kind | Modes | Notes |
|---|---|---|---|
| `veo-3.1-generate-preview` | video | text-to-video, image-to-video | Native audio, lip-sync. Start+end frame + up to 3 refs. 8s cap. |
| `veo-3.1-fast-generate-preview` | video | text-to-video, image-to-video | Faster/cheaper. Same frame/ref support. 8s cap. |
| `veo-3.1-lite-generate-preview` | video | text-to-video, image-to-video | Lowest cost. 8s cap. |
| `gemini-omni-flash-preview` | video | text-to-video, image-to-video, video-edit | Start frame only, no audio input, 10s cap. Photoreal-human exact speech may be RAI-blocked. |
| `gemini-2.5-flash-image` | image | text-to-image, compose | NanoBanana. Up to 3 refs. |
| `gemini-3-pro-image-preview` | image | text-to-image, compose | NanoBanana Pro. Up to 3 refs. |

`mode`: `text-to-video` · `image-to-video` · `video-edit` · `text-to-image` · `compose`.

> Vertex maps the `-preview` ids to GA `-001` ids internally. Do **not** pass `-001` yourself; pass the `-preview` id above.

---

## `aiVideo.generate` params

```jsonc
{
  "type": "aiVideo.generate",
  "params": {
    "model": "veo-3.1-fast-generate-preview",   // required — see table
    "mode": "text-to-video",                      // required
    "prompt": "A cinematic close-up ...",         // required (except pure video-edit)
    "aspect": "9:16",                             // "9:16" | "16:9" | "1:1" (model-dependent)
    "resolution": "1080p",                        // model-dependent (720p/1080p/4K, or 1K/2K/4K for images)
    "durationSec": 8,                             // video only, capped per model
    "variantCount": 1,                            // images can do up to 4

    // Reference inputs — pass as data URLs (data:image/png;base64,....):
    "startImage": "data:image/png;base64,...",    // image-to-video first frame
    "endImage":   "data:image/png;base64,...",    // Veo 3.1 last-frame interpolation
    "referenceImages": ["data:...","data:..."],   // up to 3 (Veo "ingredients" / NanoBanana compose)
    "editVideo":  "data:video/mp4;base64,..."     // omni video-edit source
  }
}
```

**Response:** `{ job: { jobId, status, progress, model, mode, prompt, assetType, resolution, aspectRatio, resultUrl?, createdAt } , candidate? }`.
- Veo/Omni are async → `status: "queued"/"running"`, poll `getJobStatus`.
- NanoBanana images can return `status: "completed"` + `resultUrl` + `candidate` immediately.

### Reference-input rules (match the UI / Google limits)
- **Start + end frame** = Veo 3.1 only, `image-to-video`. End frame interpolates toward the last still (works best when start/end are visually similar).
- **Reference images** = max **3** ("asset ingredients") — one each for character / object / style. More than 3 is rejected by the API.
- Omni supports **start frame only** (no end frame, no audio input).

---

## `aiVideo.getJobStatus` — poll loop

```jsonc
{ "type": "aiVideo.getJobStatus", "params": { "jobId": "<from generate>" } }
```

Poll every ~4 s until `job.status` is `completed` | `failed` | `cancelled`.
On `completed`, the handler persists a candidate to content history and returns `{ job, candidateId }`. Use that `candidateId` for the next step.

- `429` → quota rate-limit (Vertex 50/min) — back off and retry.
- Free platform key is capped (2 videos + 15 images/day). Add a Google Cloud project (BYOK, below) to lift it.

---

## `aiVideo.addCandidateToTimeline` — land it (track intent REQUIRED)

```jsonc
{
  "type": "aiVideo.addCandidateToTimeline",
  "params": {
    "candidateId": "<from getJobStatus>",   // OR "candidate": { ...full candidate }
    "trackName": "AI Generations",           // create a new track…
    // "trackId": "<existing-track-id>",     // …or append to an existing one (one is REQUIRED)
    "from": 0                                 // start ms on the track (optional; default 0)
  }
}
```

- **You MUST pass `trackName` or `trackId`** — omitting both fails with `trackName or trackId is required`.
- Videos duration defaults to the clip length; images default to a 5 s still.
- Internally routes to `editor.addImage` / `editor.addVideo`, so **track z-order rules apply** — call `editor.reorderTracks` afterward so captions/overlays stay in front (see `track-management`).

---

## `aiVideo.listCandidates` / `approve` / `reject`

```jsonc
{ "type": "aiVideo.listCandidates", "params": {} }                     // → { candidates, count }
{ "type": "aiVideo.approve", "params": { "candidateId": "<id>" } }
{ "type": "aiVideo.reject",  "params": { "candidateId": "<id>" } }
```

Candidates persist on the content doc (`aiVideoGenerations`) and in localStorage, so they survive reloads and show in the panel's **Library · past generations**.

---

## End-to-end recipe (generate → land → clean → render)

```
1. aiVideo.generate            → jobId
2. loop aiVideo.getJobStatus   → candidateId (status=completed)
3. aiVideo.addCandidateToTimeline (trackName:"AI Generations")
4. editor.reorderTracks        → fix z-order (cl-editor/track-management)
5. (dialogue?) editor.removeSilence → tighten (item-editing / audio-gain-eq)
6. POST /api/render            → final MP4 (rendering skill)
```

Verify frames with `query.previewFrameAt` (never seek+screenshot). Keep frame 0 a usable poster (see `cl-editor` rendering rules).

---

## Bring-your-own-key (BYOK) — bigger quota

Users can attach their own **Google Cloud projects** (Service Account JSON + Project ID) so generations run on **their** Vertex quota/credits instead of the shared platform key. Multiple projects → round-robin to multiply quota. Managed in the panel's **Projects** dialog; validated via `POST /api/ai-video/credentials/validate`. Agents don't need to manage keys — `aiVideo.generate` automatically uses an enabled user credential if present, else the platform key (with the free daily cap). The $300 Google free-trial project works as a BYOK project.

---

## Gotchas

- **Data URLs, not blob URLs** for `startImage`/`endImage`/`referenceImages`/`editVideo` — blob URLs don't survive the API boundary.
- **Multi-tab:** always pass `tabId` (per `cl-editor` startup) or you may target another session's editor.
- **Omni photoreal speech** is RAI-blocked — use a stylized/animated character for scripted lip-sync (see `my-omni-video-gen`).
- **Track intent is mandatory** on `addCandidateToTimeline` — read `compatibleTracks` from the error if unsure.
- **Cost:** Veo bills per second (Lite $0.05/s … Standard $0.40/s). Don't generate speculatively; confirm intent for paid work.
