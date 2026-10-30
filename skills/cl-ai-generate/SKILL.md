---
name: cl-ai-generate
description: "Drive the ContentLead in-app AI generation surface (Veo 3.1 video, Gemini Omni video/edit, NanoBanana images) from any agent via the desktop /api/execute bridge. Owns the aiVideo.* command recipe: generate -> poll job -> add candidate to timeline -> approve/reject, including start/end frames and reference images, plus bring-your-own-key (Google Cloud project) quota. Load this whenever you need to GENERATE new footage/stills inside the editor rather than editing existing media."
tags: ai-video, veo, omni, nanobanana, generate, text-to-video, image-to-video, reference-images, start-frame, end-frame, byok, aiVideo, api/execute
---

# cl-ai-generate — In-App AI Media Generation (Veo / Omni / NanoBanana)

> **⚙️ Is the ContentLead app running?** These calls need `~/.skilltown-desktop/api.json`. If it is missing, the desktop app is not running — start it, then wait ~30s for the file: **macOS** `open -a "ContentLead"` · **Windows (PowerShell)** `Start-Process "$env:LOCALAPPDATA\Programs\ContentLead\ContentLead.exe"`. Full OS-aware detect/start/poll (Linux + dev too): see `cl-editor/infrastructure.md` → "Ensure the ContentLead desktop app is running". Only ask the user if it still does not come up.

> **Owns the question:** *"How do I generate a NEW video/image inside ContentLead from an agent — Veo/Omni/NanoBanana — and land it on the timeline, via commands (not the panel UI)?"*
> **Delegates to:** `cl-editor` (startup protocol, `/api/execute`, track intent), `track-management` (track z-order), `audio-gain-eq`/`item-editing` (post-gen cleanup), `rendering` (final MP4), `cl-voice` (speech and cloned voices). This skill covers the **in-editor command surface**, not raw provider calls.

---

## When to use this skill vs. others

| You want to… | Use |
|---|---|
| Generate a clip/still **inside the editor** and drop it on a track | **this skill** (`aiVideo.*` commands) |
| Generate speech or clone/manage a voice in the same UI library | `cl-voice` (desktop Voice Lab bridge) |
| Edit / trim / caption **existing** media | `cl-editor` sub-skills |
| Remove silence from generated dialogue | `editor.removeSilence` (see `item-editing` / `audio-gain-eq`) |

---

## Prerequisite: cl-editor startup protocol

This skill runs **on top of** `cl-editor`. Before any command:

1. Read `~/.skilltown-desktop/api.json` → `PORT`, `TOKEN`.
2. Health check, diagnostics, **check tabs** (multi-tab → pass `tabId` on every call).
3. Open the target content (`/api/navigate`).
4. Check `/api/capabilities` advertises all six `aiVideo.*` commands. Missing entries mean the desktop build is outdated; a skill listing alone does not prove handler availability.

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
| `aiVideo.getJobStatus` | saved-server write | Poll using `jobId` **and `progressId`**. Completion merges a candidate into the UI library and returns `candidateId`; existing reviews are preserved. |
| `aiVideo.listCandidates` | query | List all generated candidates for this content. |
| `aiVideo.addCandidateToTimeline` | mutation | Place a finished candidate on a track (**track intent required**). |
| `aiVideo.approve` / `aiVideo.reject` | system | Mark a candidate approved/rejected. |

---

## Models & modes

`model` (exact ids):

| id | Kind | Modes | Notes |
|---|---|---|---|
| `veo-3.1-generate-preview` | video | text-to-video, image-to-video | Native audio. Start/end frames **OR** up to 3 refs. 8s cap. |
| `veo-3.1-fast-generate-preview` | video | text-to-video, image-to-video | Faster/cheaper. Same frame/ref support. 8s cap. |
| `veo-3.1-lite-generate-preview` | video | text-to-video, image-to-video | Start/end frames, **no refs or 4K**. 8s cap. |
| `gemini-omni-flash-preview` | video | text-to-video, image-to-video, video-edit | Start/end frames, no reference images or audio input. Fixed 10s generation; speech may be RAI-blocked. |
| `gemini-2.5-flash-image` | image | text-to-image, compose | NanoBanana. Up to 3 refs. |
| `gemini-3-pro-image-preview` | image | text-to-image, compose | NanoBanana Pro. Up to **14** refs. |

`mode`: `text-to-video` · `image-to-video` · `video-edit` · `text-to-image` · `compose`.

Use the app model IDs above, not guessed provider aliases. Video aspects are **9:16 / 16:9**; images also support 1:1 / 4:3 / 3:4. The source of truth is `SkillTown/lib/aiVideo/models.ts`. Omni edit keeps source settings; omit aspect/resolution in that mode.

---

## `aiVideo.generate` params

```jsonc
{
  "type": "aiVideo.generate",
  "params": {
    "model": "veo-3.1-fast-generate-preview",   // required — see table
    "mode": "text-to-video",                      // required
    "prompt": "A cinematic close-up ...",         // required, including edits
    "aspect": "9:16",                             // "9:16" | "16:9" | "1:1" (model-dependent)
    "resolution": "1080p",                        // model-dependent (720p/1080p/4K, or 1K/2K/4K for images)
    "durationSec": 8,                             // video only, capped per model
    "variantCount": 1,                            // ONE output per request; submit variants separately

    // Inputs accept data URLs or publicly reachable hosted URLs, never blob: URLs:
    "startImage": "data:image/png;base64,...",    // image-to-video first frame
    "endImage":   "data:image/png;base64,...",    // Veo or Omni interpolation
    "editVideoUrl": "https://.../source.mp4",     // Omni edit, alternative to editVideo data URL
    "profileId": "<saved-reference-kit-id>",      // optional
    "credentialId": "auto"                       // auto / shared / enabled BYOK credential id
  }
}
```

Only send reference fields relevant to the selected mode; the example lists alternatives, not a request to send all fields together. For compose or reference-guided video use `referenceImages: ["https://..."]` instead of frame inputs.

The `/api/execute` envelope is `{status,result,error?,warnings?,editorHealth?}`.
`result` contains `{ job: { jobId, progressId, firebasePath, status, progress, model, mode, prompt, assetType, resultUrl?, createdAt }, candidate?, warnings? }`.
All families currently queue work in the backend. Keep **both IDs** and poll to completion. The pending job is saved to the content and appears in the AI Generate panel, including when the panel opens later.

### Reference-input rules (match the UI / Google limits)
- **Start + end frame:** Veo 3.1 or Omni, image-to-video.
- **References:** Veo Standard/Fast and NanoBanana Flash: 3; NanoBanana Pro: 14; Veo Lite/Omni: 0.
- Never combine Veo start/end frames with references. Reference-guided Veo uses 8 seconds.

---

## `aiVideo.getJobStatus` — poll loop

```jsonc
{ "type": "aiVideo.getJobStatus", "params": { "jobId": "<result.job.jobId>", "progressId": "<result.job.progressId>" }, "tabId": "<target-tab>" }
```

Poll every ~4 s until `job.status` is `completed` | `failed` | `cancelled`.
On `completed`, the handler persists a candidate to content history and returns `{ job, candidateId }`. Use that `candidateId` for the next step.
Poll in the original content tab: a supplied `contentId` must match that tab,
and jobs reporting another content ID are rejected rather than imported into its
library. Repeated polls retain the existing candidate ID and review decisions.

- A generate failure with `result.retryable: true` means no slot was admitted: back off before resubmitting.
- A timeout or pending-save warning does **not** prove generation failed. Poll the returned IDs / inspect the UI before retrying; blindly resubmitting can bill twice.
- Quotas depend on the account, model and configured limits; do not promise a fixed free allowance.
- The six editor commands do not include cancellation. For an explicitly requested
  cancellation, use `cl-ai-video`'s separate authenticated
  `aiVideo.jobs.cancel {progressId, jobId?}` command route, not `/api/execute`.

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

Candidates persist on the content doc (`aiVideoGenerations`). Video and Image show **Latest generation**, then **History** directly below it, without history tabs. This history is project-specific, not account-wide. Pending jobs use `aiVideoPendingJobs`; browser storage is only a fast-resume cache. Approve/reject requires an existing candidate. Library/review writes are separate from timeline edits and are not timeline undo operations.

---

## End-to-end recipe (generate → land → clean → render)

```
1. aiVideo.generate            → jobId + progressId (check result.warnings)
2. loop aiVideo.getJobStatus with BOTH IDs → candidateId (status=completed)
3. aiVideo.addCandidateToTimeline (trackName:"AI Generations")
4. editor.reorderTracks        → fix z-order (cl-editor/track-management)
5. (dialogue?) editor.removeSilence → tighten (item-editing / audio-gain-eq)
6. editor.save                 → persist timeline (library persistence is separate)
7. POST /api/render            → final MP4 (rendering skill)
```

Verify frames with `query.previewFrameAt` (never seek+screenshot). Keep frame 0 a usable poster (see `cl-editor` rendering rules).

---

## Bring-your-own-key (BYOK) — bigger quota

Users can attach their own **Google Cloud projects** (Service Account JSON + Project ID) so generations run on **their** Vertex quota/credits instead of the shared platform key. Multiple projects → round-robin to multiply quota. Managed in the panel's **Projects** dialog; validated via `POST /api/ai-video/credentials/validate`. Agents don't need to manage keys — `aiVideo.generate` automatically uses an enabled user credential if present, else the platform key (with the free daily cap). The $300 Google free-trial project works as a BYOK project.

---

## Gotchas

- The Video/Image **Refresh** button reloads saved content/library data without reloading the editor or discarding the prompt. Voice has its own refresh for speech history and cloned voices.

- **Data or hosted URLs, never blob URLs.** For a video-edit URL use `editVideoUrl`.
- **Multi-tab:** always pass `tabId` (per `cl-editor` startup) or you may target another session's editor.
- **Omni photoreal speech** may be RAI-blocked. Do not repeatedly retry a rejected prompt.
- **Track intent is mandatory** on `addCandidateToTimeline` — read `compatibleTracks` from the error if unsure.
- **Cost:** Veo bills per second (Lite $0.05/s … Standard $0.40/s). Don't generate speculatively; confirm intent for paid work.
