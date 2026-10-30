---
name: cl-editor
description: Control the ContentLead video editor from any AI agent. This is the master router skill. Load this first to discover capabilities, then load specific sub-skills for detailed API instructions. Use this for editing video, adding scenes/text/media, managing tracks, and exporting. For Remotion scene creation, load the `cl-remotion` skill.
tags: video-editor, desktop-bridge, timeline, tracks, media, rendering
---

# ContentLead Editor — AI Master Router

> **Connection first:** a discovery file is not proof the app is running. Read it without printing its token, then make an authenticated, bounded loopback health request. If unavailable, report that state; only launch the app when the task permits it. Never start, reload, switch origins, or close somebody else's tabs during a source-only audit. See `infrastructure.md`.

ContentLead is a desktop video editor (Electron + Next.js) with a local HTTP API that lets AI agents control the entire editing workflow.

**This is a router document.** Do not guess command parameters from this file. Use the skill table below to load the specific, detailed skill document for the task you are trying to accomplish.

For exact native freeze frames and mounted teleprompter transport, read
`workflow-completion.md`. Mounted player/dashboard/studio controllers require
matching Desktop non-timeline readiness support; source documentation alone
does not establish installation. Do not send project restore/save to those tabs.

## Mandatory Startup Protocol

Every session must execute these steps before any editing commands.

1. **Read API info privately:** extract `port` and `token` from `~/.skilltown-desktop/api.json` into variables, without printing the file/token. Re-read after connection refusal or HTTP 401; discovery can be stale.
2. **Health check:** `curl -s http://127.0.0.1:$PORT/api/health -H "Authorization: Bearer $TOKEN"` (note: `Bearer ` prefix REQUIRED)
3. **⚠️ Check tabs FIRST:** `GET /api/tabs` with the same authorization. Pin the intended `tabId` on commands and supported diagnostic/project endpoints. Ambiguous multi-tab command requests are rejected (HTTP 409), not silently sent to the active editor. Do not close other tabs to bypass targeting. Load `multi-tab.md`.
4. **Diagnostics:** authenticated `GET /api/diagnostics?full=true&tabId=<target-tab-id>`. A tab with no mounted editor cannot pass editor diagnostics; use the relevant business command manifest instead if the task is not an editing task.
5. **Open Content:** 
   - List: authenticated `GET /api/content/list`.
   - Navigate only when requested, using `POST /api/tabs/<tabId>/navigate` with JSON `{url:"/content/<id>?view=editor",waitForReady:true,autoRestore:true}` and authorization/content-type headers.
   - Editor readiness is not a universal project-hydration guarantee. Verify the addressed project's state before mutations; do not rely on a fixed sleep.
6. **Verify Canvas:** Check dimensions with `query.getCanvasSize` before adding items.
7. **Load `overview` master index** when this router table lacks the row you need — it lists every sub-skill on disk with a one-line summary.

`GET /api/capabilities?tabId=<id>` keeps the installed snapshot separate from the live `renderer.capabilities`: authoritative command names/contract version, hydration, `readyForWrites` and save state. `renderer.source:"unverified-legacy-renderer"` means live support is unknown. Use `query.getCapabilities` / `query.getProjectReadiness` and `params.expectedContentId`; native Desktop commands such as `editor.autoCaption` are listed separately, not falsely inferred missing from the web inventory. `GET /api/skills` serves docs/provenance/helper locations, not handler installation. `/api/bridge/*` uses the logged-in web session and server schemas. For whole-product routing load `cl-desktop`.

Packaged skills contain documentation/reference data only. Workflows referencing helper scripts such as `orchestrator/run.mjs` require a separate canonical helper checkout and its dependencies; `/api/skills` does not install these pipelines.

## ⚠️ TRACK INTENT IS NOW REQUIRED on `editor.addImage` / `editor.addVideo` / `editor.addAudio` / `editor.addVideoSegments`

To prevent track fragmentation (one item per new track), these commands now REJECT calls that don't explicitly declare track intent. Pass one of:

- `"trackId": "<existing-track-id>"` — append to a specific track
- `"createNewTrack": true, "trackName": "AI B-Roll"` — force a NEW owned track (`trackName` optional)
- `"trackName": "AI B-Roll"` alone — legacy auto-placement hint; may reuse a compatible track, not a fresh-track guarantee
- `"trackId": "__auto__"` — legacy auto-placement (only when you truly don't care)

Error shape when missing:
```json
{"status":"failed","error":"trackId_or_trackName_required","result":{"hint":"...","compatibleTracks":[...],"itemType":"video"}}
```
Read `compatibleTracks` from the error result to pick an existing track ID.

## ⚠️ Error Monitoring — Built Into Every Command

Completed `/api/execute` execution paths include `editorHealth`; `warnings[]` is optional and appears when issues are found. Auth/body/tab/preflight rejections may lack health fields: check HTTP status and JSON errors first. If `editorHealth.newConsoleErrors > 0` or `hasNewErrors: true`, inspect warnings and targeted diagnostics. Load `infrastructure.md` for details.

## ⚠️ CRITICAL VISIBILITY RULE: Track Z-Order

**Track 0 is the FRONT layer.** Higher track numbers (Track 1, 2, 3) are placed **BEHIND** Track 0.
If you add text on Track 2 and a video on Track 0, the text will be **invisible** (hidden behind the video).
**SOLUTION:** ALWAYS call `editor.reorderTracks` after adding items to automatically fix layer ordering.

## 🛑 CRITICAL RULE: Frame 0 Must Be a Usable Poster

Never build a scene whose frame 0 is black / blank / single-color. The rendered MP4's first frame is what Instagram, YouTube, and the ContentLead dashboard use as the default thumbnail — and an already-published Instagram Reel's cover **cannot** be changed via API. If your intro uses a delayed reveal, make the primary text/subject visible at frame 0 (animate scale/translate/glow, keep `opacity: 1`). See `rendering` skill → "The First Frame Must Be a Usable Thumbnail" for the poster-safe `skipReveal` pattern and the Custom Thumbnail flow (Option A: mid-frame extract, Option B: AI-generate) when you genuinely can't use frame 0.

## 🎯 Verification: use `query.previewFrameAt`, NEVER `editor.seek` + `/api/screenshot`

**The seek+screenshot race is real.** `editor.seekTo` dispatches a seek to the Remotion player, but the underlying HTMLVideoElement takes 100–500 ms to buffer the requested source-time. A screenshot taken immediately after seek captures the video at its PREVIOUS position (often source-t=0), silently producing wrong "verification" frames.

**Use `query.previewFrameAt`** — atomic seek + wait-for-stabilization + composite capture:
```json
{ "type": "query.previewFrameAt",
  "params": { "timeMs": 15000, "waitTimeoutMs": 3000 }
}
```
Returns `{imageBase64, width, height, timeMs, targetFrame, stabilized, videoTimings[], imageTimings[], readinessBlockers[], ...}` on verified capture. Checks active timeline media (including missing/loading placeholders), native source clocks and presented frames, image load/error state, and compositor frame acknowledgments. Readiness must hold across two paint opportunities. On timeout, returns `stabilized: false`, `captureSkipped: true`, and **no image**; inspect `readinessBlockers` rather than treating it as a successful visual check.

Legacy `query.capturePreviewFrame` still exists but does NOT wait — only use when you're certain the frame is already stable.


## Skill Routing Table

**⚠️ CRITICAL:** Load the relevant skill file BEFORE attempting to use commands in that category. The detailed docs contain mandatory rules (like track z-order, parameter names, and timing formats) that you will fail without.

| Task | Skill to Load | Key Commands |
|------|---------------|--------------|
| Project hydration, command support, safe batching and save receipts | `workflow-readiness` | `query.getCapabilities`, `query.getProjectReadiness`, `params.expectedContentId`, `editor.save` |
| Native detach/nesting, chapter markers, master bus, voice replacement, saved layouts and teleprompter library | `workflow-completion` | `editor.detachAudio`, `editor.combineItems`, `editor.uncombineItems`, `query.getMarkers`, `audio.setMasterBus`, `editor.applyVoiceReplacement`, `layout.saveCurrent`; saved teleprompter server bridge |
| Text & Typography (manual) | `text-and-captions` | `editor.addText`, `editor.editItem` |
| Video & Chroma-key | `video` | `editor.addVideo`, `editor.addVideoSegments`, `editor.setClipState` |
| Images & Static Media | `images` | `editor.addImage`, `editor.replaceMedia`, `media.validate` |
| Audio, Gain, EQ, Noise | `audio-gain-eq` | `editor.addAudio`, `editor.setAudioGain`, `audio.setEq`, `audio.reduceNoise` |
| **Voice cloning & TTS / voiceover** | `cl-voice` | `/api/bridge/voice/*`: generate into UI history, clone into the owned library, list/history, preview, rename, delete; then `editor.addAudio` with measured duration and track intent |
| Position, Crop, Resize | `canvas-and-positioning` | `editor.positionItem`, `editor.resize`, `editor.cropItem` |
| Trim/Split/Cut on timeline | `item-editing` | `editor.splitItem`, `editor.cutItem`, `editor.trimItem`, `editor.moveItem` |
| Tracks, Z-order, Linking | `track-management` | `editor.reorderTracks`, `editor.linkTracks`, `editor.renameTrack` |
| **Preventing track fragmentation** (multiple `add*` in a row) | `track-fragmentation-prevention` | Patterns A/B for consolidating captions/audio/scenes onto single tracks |
| Bulk / Batch operations | `bulk-operations` | `bulk.styleByType`, `bulk.shiftAll`, `POST /api/batch` |
| Transcripts, Auto-Captions | `transcription-and-editing` | `content.applyCaptions`, `query.getTranscriptionStatus` |
| Animations, Transitions, VFX | `animations-and-effects` | `editor.setAnimation`, `editor.addTransitionBetween`, `editor.addKeyframe` |
| Full E2E Pipeline & Scenes | `storystudio-pipeline` | (Workflow guide, pipeline states) |
| Saved Scenes (per-user library) | `legacy-command-reference` → saved-scene contracts | `scene.saveToMyScenes`, `scene.listMyScenes`, `scene.getMyScene`, `scene.addMyScene`, `scene.updateMyScene`, `scene.deleteMyScene` |
| Project save/load, Snapshots | `project-and-export` | `editor.save`, `editor.createSnapshot`, `editor.restoreSnapshot`, `project.saveAutosave`, `project.getFullState`, `project.loadFullState` |
| **🎬 Local video rendering (mp4 output, jobId, progress, cancel)** | `rendering` | `POST /api/render` (renderType `"design"`/`"custom"`/`"template"`), `GET /api/render/{jobId}` (progress + `outputPath`), `GET /api/render/jobs`, `POST /api/render/{jobId}/cancel`, `render.validate`, `render.verifyOutput`. **Output → `~/Movies/SkillTown/{jobId}.mp4`**. ⚠️ Do **NOT** use `editor.export` for programmatic renders — it returns `jobId: null` (see `project-and-export.md`). |
| Read timeline/editor state | `queries-and-state` | `query.getTimelineItems`, `query.getTrackInfo`, `query.getEditorState` |
| Debugging, Logs, Arch | `infrastructure` | `GET /api/diagnostics`, `GET /api/console-errors` |
| Legacy / advanced command contracts | `legacy-command-reference` | Source-verified params, saved-state effects and approval boundaries for advanced/legacy editor commands |
| Testing / QA | `cl-testing` | Agent-run contract, state, visual, and workflow tests |
| Content metadata & bridge | `content-bridge` | `content.getDetails`, `content.updateMetadata`, `content.applyImage` |
| Multi-tab collaboration | `multi-tab` | `GET /api/tabs`, `POST /api/tabs/new`, `tabId` on `/api/execute` |
| **AI Media Generation (Veo / Omni / NanoBanana)** | `cl-ai-generate` | `aiVideo.generate` → UI pending job; `getJobStatus` with jobId + progressId → saved candidate; `listCandidates`, `addCandidateToTimeline`, `approve`/`reject`. Discover through `/api/capabilities`; library writes and timeline save are separate. |
| **AI Viral Clipping** | `cl-ai-clipping` | Transcribe → score virality → extract clips → reframe 9:16 → render |
| **Script Evaluation & Writing** | `cl-script-evaluator` | Score scripts 0-100, rewrite hooks, write viral scripts from scratch |
| **Dialogue-Story Reels (2-char, Modi–Rahul style)** | `cl-dialogue-story` | Full viral pipeline: script→TTS voices→word-timed Latin captions→per-dialogue AI images→hook title + IG caption→Remotion compose. `orchestrator/run.mjs` |
| **Dialogue-driven B-roll (relevant images timed to words)** | `cl-dialogue-broll` | Per-segment: AI decides #images + query → search/generate → pick best → word-timestamp align + gaps → place on timeline. Ports TlEditingSolution image logic; works on ANY clip |
| **Podcast Layouts (2p/1p/share/9:16)** | `podcast-layouts` | `layout.list`, `layout.apply`, `layout.getActive`, `layout.tagRole` |
| **Reviewed clipping / podcast production** | `cl-production` | `production.*` saved shortlist/discovery/drafts/recipes/delivery; `podcast.*` preview/apply setup, director and sync; `transcript.previewTightening` / `transcript.applyTightening` |
| **Masks & Animated Reveals** | `masking-and-reveal` | `mask.get`, `mask.set`, `mask.clear`, `reveal.listPresets`, `reveal.apply`, `reveal.clear` |
| **Brand Kits** | `brand-kits` | `brand.listKits`, `brand.apply`, `brand.applyColor`, `brand.applyFont`, `brand.addAssetToCanvas` |
| **Background Removal (AI matting)** | `background-removal` | `editor.removeBackground`, `editor.restoreBackground`, `editor.bulkRemoveBackground`, `media.removeBackground`, `query.getBackgroundRemovalStatus` |

## Disambiguation: Which Text/Cut command do I use?

- **Titles / Lower Thirds:** Use `editor.addText` (`text-and-captions`).
- **Subtitles (Auto-generated):** Use `content.applyCaptions` (`transcription-and-editing`).
- **Karaoke/Word-level manual captions:** Use `editor.addCaption` (`text-and-captions`).
- **Fixing typos in auto-captions:** Use `editor.editCaptionWord` (`transcription-and-editing`).
- **Trimming media BEFORE adding:** Pass `trim: {from, to}` to `editor.addVideo` (`video`).
- **Cutting/splitting clips ALREADY on timeline:** Use `editor.splitItem` / `editor.cutItem` (`item-editing`).
