# Timeline finishing, saved layouts and teleprompter

These are source-defined contracts, not proof the running Desktop/frontend has
been updated. Discover live renderer names with `query.getCapabilities` first.
If a command or bridge route is unavailable, stop and report the installation
gap. Never use an unrelated command as a silent substitute.

For renderer calls, send `POST /api/execute` with explicit `tabId`, `type` and
`params.expectedContentId`. Require the addressed project's hydration/write
readiness. Save the timeline after successful mutations. An uncertain outcome
requires inspection, not an automatic retry.

## Detach and nested layers

| Command | Params beyond `expectedContentId` | Outcome |
|---|---|---|
| `editor.detachAudio` | `itemIds`: 1–50 video IDs | Uses native detach: separate audio, source video muted, settings preserved; returns `audioItemIds` |
| `editor.combineItems` | `itemIds`: 2–50 distinct timeline IDs | Native nested scene; returns `itemId`, `combinedItemIds` |
| `editor.uncombineItems` | `itemId`: nested scene ID | Restores captured originals with native time-offset semantics; returns `restoredItemIds` |

These use the UI's native operations and timeline undo/redo. Locked/missing
targets fail. Uncombine rejects existing original IDs and locked restoration
tracks instead of overwriting items. Combining is a nested visual composition,
not lossless flattening of every possible effect or an exported video.

## Exact native freeze frame

On a renderer advertising `editor.freezeFrame`, send only
`params.expectedContentId` to the explicit timeline `tabId`. The native UI helper
captures its largest visible video source (then canvas/image fallback), not the
composited preview. Ensure the intended source is visibly loaded first.
The command inserts the native three-second image at the current playhead,
using native history/new-track insertion, and returns its real inserted ID,
dimensions, display range and `captureMode`. No capturable source fails clearly.
It does not seek or guarantee a source-clock-stabilized composite capture;
use `query.previewFrameAt` for that different verification workflow. Save after
inspection. An uncertain insertion is not permission to insert it again.

## Markers and chapters

| Command | Params |
|---|---|
| `query.getMarkers` | none |
| `editor.addMarker` | `timeMs` ≥ 0; optional `label` (default `"Marker"`), six-digit hex `color` (default `"#f59e0b"`), `type`: `"marker"`/`"chapter"` |
| `editor.updateMarker` | `markerId`, nonempty `updates` containing only `timeMs`, `label`, `color`, `type` |
| `editor.removeMarker` | `markerId` |

Markers are saved project metadata. Like their UI controls, these operations
do not create timeline undo entries. Missing IDs fail. Labels are 1–500 trimmed
characters; time is milliseconds, not frames.

## Editable virtual scene layers

The existing catalog entries are dispatched on updated renderers:
`scene.getEditableNodes` takes `itemId` and returns native layer definitions,
capabilities and overrides. `scene.updateEditableNode` takes `itemId`, `nodeId`
and nonempty `patch`; `scene.resetEditableNode` takes `itemId`, `nodeId`.
All use the same explicit tab/content assertion protocol as other editor calls.
Read the actual node capabilities before patching. Supported override groups
are native `transform`, `props`, `timing`, `visible`, `locked`, `zIndex` and
`keyframes`; unsupported capabilities/fields and locked target tracks fail.
Update/reset use native history. Reset means authored layer defaults, not
resetting the entire scene. Discovery, not catalog metadata alone, establishes
whether an older frontend actually dispatches these commands.

## Master-bus loudness and limiter

`query.getMasterBus` returns `masterBus`, effective `params` and `presets`.
`audio.setMasterBus` takes `preset`: `instagram`, `youtube`, `podcast`,
`broadcast_tv`, `cinema`, `custom` or `off`.

For `custom`, also supply the complete `customParams` object:

| Field | Allowed range |
|---|---|
| `integratedLufs` | -30 to -8 |
| `truePeakDbfs` | -6 to 0 |
| `loudnessRangeLu` | 1 to 20 |
| `limiterThresholdDbfs` | -24 to 0 |
| `limiterRatio` | 1 to 30 |
| `limiterAttackMs` | 0.1 to 20 |
| `limiterReleaseMs` | 10 to 500 |
| `limiterKneeDb` | 0 to 40 |

Non-custom presets reject `customParams`. `off` returns effective `params:null`.
The shared UI/store/export setting is persisted without timeline undo; it is
not a measured loudness or render receipt. Inspect the final exported audio.

## Picture-preserving voice replacement

1. Select the intended video and call `query.getVoiceReplacement` with `itemId`.
   Inspect `canReplace`, `canRestore`, reasons, and returned `snapshot`.
2. Obtain an explicitly authorized, timing-aligned **full-source muxed video**
   from the existing voice/timing pipeline (`cl-voice`). A speech-only audio URL
   or a trimmed excerpt is not a replacement for the source movie.
3. Call `editor.applyVoiceReplacement` with the unchanged `snapshot` and
   `outputVideoUrl`. Selection, source, trim range, rate, duration and locks
   must still match. No generation or timing alignment is performed here.
4. To restore, query a fresh snapshot, then send
   `editor.restoreVoiceReplacement` with that `snapshot`.

Apply/restore use native undo and preserve picture timing. The snapshot contains
`contentId`, `itemId`, `sourceUrl`, `referenceRangeMs:{from,to}`,
`playbackRate`, and `sourceDurationMs`. Never fabricate these values.

## Saved layouts

See `podcast-layouts.md`. `layout.list` optionally accepts
`includeUserLayouts:true`. `layout.apply` accepts `source:"user"` plus a saved
`layoutId`; the default source remains built-in.

`layout.saveCurrent` takes `name` (1–200 trimmed characters), required `atMs`,
and optional `category`: `2p`, `1p`, `share`, `grid`, `vertical`, `custom`.
It captures the same role cells as the Save Layout dialog: the role's item at
that time, falling back to its first item; invisible roles become hidden bindings.
At least one visible role-tagged item is required.

`layout.deleteUser` takes `layoutId`. Save/delete mutate the signed-in saved
library, not timeline history. Do not promise undo for deleting a saved layout.
Applying a saved layout uses the existing timeline operation and rechecks
readiness after the asynchronous library lookup.

## Teleprompter: saved scripts and settings

On a Desktop release advertising the bridge, authenticate normally:

- `GET /api/bridge/teleprompter/commands`: signed-in command manifest.
- `POST /api/bridge/teleprompter/commands/<name>` with `{"params":{...}}`.

| Name | Params |
|---|---|
| `teleprompter.list` | optional `offset` ≥ 0, `limit` 1–100 (default 50); metadata only, `nextOffset` |
| `teleprompter.get` | `scriptId`; returns full script |
| `teleprompter.create` | `title` (1–200 trimmed characters), `content` (≤100,000 characters) |
| `teleprompter.update` | `scriptId`, nonempty `updates` of `title`/`content` only |
| `teleprompter.delete` | `scriptId`, `confirm:true` |
| `teleprompter.getSettings` | none |
| `teleprompter.saveSettings` | complete `settings` object (not a patch) |

Read settings before changing them. Fields: `fontSize` 20–120,
`scrollSpeed` 1–200, `backgroundColor`/`textColor`/`readingLineColor`/
`verticalLineColor` six-digit hex, `fontFamily`, `lineHeight` 1–3,
`readingLinePosition`/`verticalLinePosition` 0–100,
`verticalLineEnabled`, `scrollWidth` 50–100, `letterSpacing` -2–10,
`isFlipped`, `isVerticallyFlipped`, `textAlign` left/center/right,
`reverseMouseWheel`, `bottomControlsPosition` 20–200.

Server identity binds Firebase paths to the signed-in owner. Caller `userId`
is rejected. Successful results carry `stateScope:"saved-server"` and normally
`playerUrl`; legacy hyphenated IDs return `playerUrl:null` with a reason (create
a new saved copy to play). These commands do not start scrolling, manipulate
an open player's unsaved state, grant microphone/camera consent, or record video.

### Mounted player transport is a separate command surface

Only on a Desktop/frontend advertising `teleprompter-live.1` and the commands
below, target the already-mounted `/teleprompter/<player-slug>` tab with
`POST /api/execute`. Every call requires `params.expectedScriptId`; optional
`expectedContentId` must match that same script ID. Read the actual capability
manifest/state, not timeline `query.getCapabilities`, on this non-timeline tab.
Non-editor URL identity and project-recovery/media-health gating must be
installed too; catalog presence alone is insufficient. Do not send timeline
autosave/restore commands or request `autoRestore:true` for this view.

| Command | Additional params |
|---|---|
| `teleprompter.live.getState` | none |
| `teleprompter.live.start`, `teleprompter.live.resume`, `teleprompter.live.pause` | none |
| `teleprompter.live.reset` | none; pauses and seeks to zero |
| `teleprompter.live.setSpeed` | `intervalMs`: integer 1–200 **milliseconds per one-pixel tick**; smaller is faster |
| `teleprompter.live.seek` | `positionPx` ≥ 0; clamped to the actual scrollable maximum |

Results expose `playing`, `intervalMs`, `positionPx`, `maxPositionPx`,
`scriptId`, `stateScope:"mounted-player"`. These drive the native mounted
scroll interval/play state; they are not saved-script/settings writes.
Speed overrides reset when saved speed or the mounted script changes.
Browser fullscreen remains a user-gesture UI affordance, not an advertised
command. These commands do not request capture permission or record media.

## Creator review/share link

On a release with the media bridges, use
`GET /api/bridge/content/:contentId/share` to inspect active owned links.
`POST` to the same route with `{}` creates/reuses an active share link;
`{regenerate:true}` invalidates the previous link and creates another.
This intentionally grants anyone with the link unauthenticated viewing access:
require the creator's intent, and do not publish the returned link accidentally.
The response includes `shareSuffix` (combine with the configured ContentLead
origin, not the loopback Desktop origin). There is no revoke-only operation in
this UI/API. Regeneration is a saved-server write and cannot be undone through
timeline history; inspect GET after an uncertain result.

## Local matting model availability

Use the authenticated **native HTTP routes**, not the stale catalog-only
`matte.listModels`, `matte.getModelStatus`, `matte.downloadModel` execute names:

- `GET /api/ai-matte/model/list` returns `{models:[...]}` and actual on-disk status.
- `GET /api/ai-matte/model/status?modelId=<encoded-id>` reads one model's status.
- `POST /api/ai-matte/model/download` with `{modelId}` starts/joins an authorized
  model download (200 ready, or 202 downloading); poll status until ready.

Discover model IDs from list. Large models consume disk/network bandwidth;
download only with the user's intent, and do not claim readiness from a 202.
These routes do not perform matting, spend generation credits, or install a
missing Python/runtime dependency automatically.
