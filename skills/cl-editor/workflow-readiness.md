# Editor workflow: readiness → edits → durable handoff

This is the safe entry point for a create/import → transcribe/cut → group/edit →
preview → save → render workflow. Commands listed by a catalog are not proof that
the selected renderer is current, hydrated, or supports that command. This
contract is implemented in web source; an older running renderer can remain
unverified until its normal release/update lifecycle. Do not start, reload,
navigate, or switch an app simply to satisfy discovery.

## 1. Pin the tab and content before writing

Use the authenticated Desktop connection from `infrastructure.md`. Discover tabs,
then address **every** command with an explicit `tabId`. In a multi-tab session,
untargeted capabilities intentionally do not choose a renderer.

`GET /api/capabilities?tabId=<id>` exposes the selected renderer's source-bound
handshake when supported. `query.getCapabilities` and
`query.getProjectReadiness` are actual renderer queries:

```json
{
  "tabId": "chosen-editor-tab",
  "type": "query.getCapabilities",
  "params": {"expectedContentId": "chosen-content"}
}
```

Successful query results include:

```json
{
  "schemaVersion": 1,
  "contractVersion": "2026-10-30.1",
  "commands": ["query.getCapabilities", "...actual implemented names..."],
  "commandCount": 272,
  "hydration": {"status": "ready", "contentId": "chosen-content"},
  "readyForWrites": true,
  "save": {
    "available": true,
    "dirty": false,
    "saving": false,
    "lastSavedAt": null,
    "error": null
  }
}
```

`query.getProjectReadiness` returns only `hydration`, `readyForWrites` and `save`.
Nullable save observations mean unknown, not false. Hydration can be `loading`
or `failed` with `error`. A read-only project can be hydrated but not writable.
Capability names are derived from executor cases and strict domain definitions,
not dependency-object keys; a parity regression verifies that inventory.
Availability does **not** imply one universal parameter schema or permission.
Native Desktop commands, notably `editor.autoCaption`, are a separate inventory.

`contracts.trackPlacement.createNewTrack:true` advertises explicit fresh-track
placement for image/video/audio/caption/custom-scene insertion. Agents may create
a deliberate role track, find its actual ID from the returned item via
`query.getTrackInfo`, and reuse that ID; never select an unrelated compatible
track implicitly. Older renderers without this feature declaration are not
verified for the dialogue helper's role-track composition.

Before a timeline mutation require all of:

- The selected renderer actually advertises the intended renderer command.
- `hydration.contentId` equals the intended content and `status` is `ready`.
- `readyForWrites` is true; for cloud save require `save.available` too.
- Add `params.expectedContentId` to subsequent commands. This assertion never
  opens or navigates a project. A tab ID alone does not pin content after navigation.

For loading, use bounded observation: e.g. at most ten readiness queries over
thirty seconds, stop immediately on failure, content mismatch or deadline.
Intervals only pace observation; elapsed sleep is never evidence of readiness.
An unsupported query/legacy handshake is **unverified**, not an empty project.
Do not retry mutations blindly after transport timeout or content change.

Real Electron and Firebase editor dispatch recheck hydration/content immediately
before execution. Desktop also guards queued IPC delivery. Saved-server
`production.*`, job inspection and read-only queries retain their distinct state
scope; readiness does not convert them into live timeline mutations.

The transport-only `expectedContentId` assertion is validated **before** dispatch
and removed only before strict production/podcast schema parsing. Their other
unknown-field/revision/token checks remain strict; individual, batch and framework
runner paths share that boundary. `project.getFullState` requires a matching
**ready hydrated owner**, even though it is a read; a hydrated read-only project
may export. A newly addressed content ID must never stamp the prior project's
global timeline as its own artifact.

## 2. Execute the supported stages

| Stage | Actual command surface | Required review / continuation |
|---|---|---|
| Create/open project | Desktop HTTP `POST /api/content/create`, tab creation/navigation; see `desktop-bridge-routes.md` | Create with `{title,description?,navigate:false}` to avoid implicit navigation. Open via `POST /api/tabs/new {contentId}` or explicitly navigate a chosen tab. Preserve returned content/tab identifiers and wait for that content's readiness, not a fixed delay. There are no renderer `content.create`/`content.load` handlers. |
| Import media | Desktop HTTP `/api/media/import`; renderer `media.validate`, `editor.addVideo`, `editor.addAudio`, `editor.addImage`, `editor.addVideoSegments` | See `video.md`, `audio-gain-eq.md` and `images.md`. Supply an existing `trackId` **or** `createNewTrack:true`. `from`/`duration` are milliseconds. Verify returned item and track; never assume insertion succeeded. |
| Transcribe | Desktop-native `editor.autoCaption`; renderer `query.getTranscriptionStatus`, `query.getTranscript` | See `transcription-and-editing.md`. Choose an actual `trackItemId`, language/timing mode and cost approval. Native auto-caption returns a synchronous completion receipt with `captionCount`, `trackId`, `jobId`, `transcriptPersisted` and `transcriptWordCount`. Do not resend on timeout. There is no native auto-caption status/cancel HTTP route; renderer status concerns persisted UI transcription state, not a cancellation API. |
| Transcript-guided cuts | `transcript.previewTightening`, `transcript.applyTightening`; `editor.cutItem` for deliberate item cuts | Load `cl-production`. Tightening requires the same source/proposals, returned preview token, reviewed `approvedIds` and `confirm:true`. A changed source requires a new preview. |
| Group/move/edit | `editor.groupItems`, `editor.moveGroup`, `editor.select`, existing item/track commands | Inspect IDs, locks and track placement. Group moves reject invalid/locked targets atomically and preserve supplemental/keyframe undo. `editor.undo`/`redo` are separate deliberate operations, not batch rollback. |
| Production drafts | `production.*`, `podcast.*`; see `cl-production` | Saved-server shortlist/episode revisions and local podcast preview/apply contracts differ. Preserve revision/token checks, explicit destination and local approvals. Inspect partial results before retry. |
| AI candidates | `aiVideo.generate`, `aiVideo.getJobStatus`, `aiVideo.listCandidates`, `aiVideo.addCandidateToTimeline`, `aiVideo.approve`/`reject` | Load `cl-ai-generate`. Paid generation needs approval. Pin returned job/candidate/content identity, inspect state, then use explicit track intent. Approval of a candidate is not cloud saving the project. |
| Scenes/templates | `scene.validateCode`, `scene.previewCode`, `scene.addCustomScene`; template commands in `cl-remotion`/`cl-creator-styles` | Preview code is not timeline insertion. Preserve public templates versus private assets and inspect actual inserted scenes. |
| Preview | `query.previewFrameAt` | Require `stabilized:true`, `captureSkipped!==true` and successful media checks. Merely seeking, or taking a potentially stale screenshot, is not verification. |
| Durable save | `editor.save` | Require the receipt checks below. Local recovery autosave is not cloud save. |
| Render/handoff | Renderer `project.getFullState`, `render.validate`, `render.verifyOutput`; Desktop HTTP `/api/render` jobs | Use the render recipe below; `editor.export` is UI-oriented and not a pollable job contract. Final audiovisual review remains human-required. |

This table routes to the real domain contracts; it does not invent a universal
planner or replace per-command parameters. Edit proposals still require local
human approval. Do not automate clicking an approval dialog or reinterpret a
`pending` proposal as applied.

## 3. Bounded batch and retries

`batch.execute` accepts:

```json
{
  "commands": [
    {"type": "editor.select", "params": {"itemIds": ["actual-item-id"]}},
    {"type": "editor.setVolume", "params": {"itemId": "actual-item-id", "volume": 80}}
  ],
  "stopOnError": true,
  "expectedContentId": "chosen-content"
}
```

The canonical list is `params.commands`; legacy `command.commands` is retained.
There must be **1–50** children; nested batches, unknown names, malformed child
params and conflicting content assertions fail before any child executes.
The parent content assertion is inherited and checked again for each child.

Receipt: `subResults`, `totalCommands`, `completedCommands`, `stoppedAt`,
`atomic:false`. The default stops after the first failed child; explicit
`stopOnError:false` continues and still reports failure. Earlier successes are
not rolled back. `completedCommands` counts attempted children, not successes.
There is no batch cancellation, idempotency key or safe whole-batch replay.
After a timeout, query actual state and retry only known incomplete operations.
Use domain job cancellation where implemented; do not pretend cancellation can
undo cloud writes or an already completed generation.

## 4. Save the snapshot you intend to hand off

Successful `editor.save` returns a cloud receipt for the submitted content:

```json
{
  "saved": true,
  "stateScope": "saved-server",
  "contentId": "chosen-content",
  "currentDesignSaved": true,
  "newerChanges": false,
  "activeContentChanged": false
}
```

For a complete handoff require `saved:true`, matching `contentId`,
`currentDesignSaved:true`, `newerChanges:false` and
`activeContentChanged:false`. If an edit arrives during save, the submitted
snapshot can save successfully while newer changes remain dirty. Save again
only after inspecting those changes. If navigation occurred, the receipt still
belongs to the original content; it must not clear or mirror the new project.
Failed saves remain failures, with unsaved state preserved.

`query.getProjectReadiness.save` observes the registered UI save handler.
`project.getFullState` exports a design snapshot; it is not itself a save.
Local crash-recovery checkpoints and version history are not server durability.

## 5. Render a validated immutable snapshot

Use `project.getFullState` only after the above save receipt and final preview.
Preserve its canonical `fps`, tracks, transitions, maps and dimensions; do not
reconstruct a design from nonempty-map fallbacks or force every project to 30fps.
Add render-required `width`/`height` from the returned `size` as described in
`project-and-export.md`, then:

1. Renderer `render.validate` with `{}` checks the active timeline; require
   `canRender:true`. This is not validation of an arbitrary submitted snapshot.
2. Obtain user approval for a render that incurs cost.
3. Desktop `POST /api/render` with
   `{renderType:"design",data:<flat-design>,...approved-render-options}`; retain
   the real `jobId`. Do not nest the design under `data.design`.
4. Poll `GET /api/render/{jobId}` with a bounded deadline. Inspect the returned
   job status; do not launch a duplicate render after timeout.
5. Use the actual cancellation route in `rendering.md` when requested.
6. On completion, use renderer `render.verifyOutput` with `{jobId}`. Require
   `artifactVerified:true` and `verified:true`; it checks the actual Desktop job
   artifact, not just a filename. Keep the receipt and output path for handoff.
7. Human final playback checks audio, captions, timing, framing and content.

Source/mock regression validation is not proof of installed packaging, a running
renderer, provider availability, rendered output quality or deployed reachability.
Those are separate acceptance checks.

## Optional orchestrator installation is not implicit

`/api/skills` serves documentation; it does not install runnable Node/Python
helpers. A fresh user can execute the command workflow above without an
orchestrator. For source helpers, use a user-authorized **new public checkout**
of `github.com/Shubham-vish/contentlead`, never overwrite an installed independent
directory, and inspect only public Git-tracked files.

The public dialogue helper uses Node builtins. Local word timing needs Python 3,
`faster-whisper` and an available model (first use may download it unless cached);
`indic-transliteration` is optional. FFmpeg is for separate manual processing
recipes, not directly invoked by this helper. Private
`config.local.json`, `prompts.local.mjs`, personal scripts and character assets
are not shipped dependencies. Example voice/asset placeholders require the
user's own authorized configuration.

The public dialogue helper now has isolated Node/mock regressions for offline
`--plan`, lazy validated discovery, explicit `--tab-id` **and** `--content-id`,
matching project readiness, and real role-track insertion payloads. Real runs
require an updated renderer advertising the new-track feature. No credentials,
private voice/asset configuration or models are supplied by documentation.

The helper stops after composition: preview, cloud save and render are explicit
handoff steps above. Composition remains non-atomic/non-idempotent; inspect actual
state after a failure rather than automatically replaying. No live provider,
rendered quality or installed/deployed parity is certified by these mock tests.
