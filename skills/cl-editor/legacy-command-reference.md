# Advanced / Legacy Editor Command Contracts

Source-checked 2026-10-29. These **31 existing commands** supplement the domain
guides; they do not add handlers or promise a universal input schema.

## Transport, safety and persistence

Send editor commands as `{tabId, type, params}` to authenticated
`POST /api/execute`, with the intended editor's explicit `tabId`. The examples
below show **params only**. Never use these names as AI Video HTTP-manifest
commands or infer availability merely from a documentation listing.

Scope labels here describe actual side effects, **not guaranteed response
fields**:

- **Read**: inspect live editor state; no design write.
- **UI**: playback/panels; not design persistence or a Desktop window/tab switch.
- **Session**: retained proposal/preview metadata; not durable project storage.
- **Timeline**: edits live design/supplemental stores. Inspect the result, verify
  with `query.previewFrameAt`, then `editor.save` and require `result.saved:true`.
  Recovery autosave alone does not confirm cloud persistence.
- **Saved library**: authenticated server CRUD; separate from timeline undo/save.

No automatic approval is implied. Destructive edits and saved-library writes
require user intent. Only the proposal family below has a hard local approval
gate. Legacy handlers differ in locks, validation and undo; do not assume every
command is atomic or universally reversible. Inspect `status`, `error` and
partial results, not HTTP success alone. No retries after uncertain writes.

## Change inspection / proposals — five commands

| Command | Actual params / result | Scope and approval |
|---|---|---|
| `ai.previewChange` | `{commands:[{type,params},...]}` nonempty. Returns `commandCount`, `totalAffectedItems`, `changes`. Special cases inspect `editor.editItem` (`itemId` string/array, `updates.details/display`), `editor.deleteItems` (`itemIds`), and `editor.moveItem` (`itemId`,`from`). Others report preview unavailable. | Read. A structural estimate, **not** planner validation, rendered preview, approval token, or permission to apply. |
| `ai.undoLastAction` | `{}`. Fails if command history empty; reports `undone`, `commandId`, `itemsBefore`, `itemsAfter`. | Timeline. Dispatches **one ordinary history undo**, then reports command-tracker context. Does not search/filter the undo stack for an AI action; intervening manual edits can be undone. Never use it to reverse saved-library/provider operations. |
| `editor.proposeEdit` | `{operation:"delete"|"rippleDelete"|"style",itemIds:[...],details?}`. Deduplicated 1–100 string IDs; affected plan ≤200 items. Style details only `color` (hex), `fontSize` (1–1000), `opacity` (0–100 percent). Color/fontSize require text/caption; opacity visual non-audio. Returns `{proposal}` with `id`, `changes`, `status`, expiry. | Session. Requires mounted project/manager, checks locks. Stores plan/fingerprint without applying. Up to20 retained proposals, expiry15minutes. |
| `editor.getEditProposal` | `{proposalId:"..."}` → `{proposal}` in same content **and manager instance**. | Session/read. Availability after reload/navigation is not guaranteed. |
| `editor.applyEditProposal` | `{proposalId:"..."}`. Pending proposals fail with `result.code:"approval-required"`; passing a guessed `confirm` field cannot authorize them. Already locally applied proposals return `deduplicated:true`. | The agent cannot approve. Human uses editor proposal preview to apply/reject. Local application checks expiry, locks, full document/supplemental fingerprint, commits one undoable edit; then save. No agent rejection/cancel command exists. |

Example proposed style (not immediate application):

```json
{"operation":"style","itemIds":["title-id"],"details":{"color":"#ffffff","fontSize":64}}
```

Re-propose after `stale-proposal`, `proposal-expired` or unavailable session.
Do not silently re-create/re-apply destructive proposals after user rejection.

## Timeline layers / effect continuation — six commands

All six below are **Timeline** writes without an agent approval token.
Obtain IDs from current timeline/effect queries. Conversion **moves**, not copies,
the source camera/effects onto the layer. Front-most adjustment layers broadcast
to visual clips behind them; verify z-order and the entire overlapping range.

### `editor.addAdjustmentLayer`

Params: `{id?,from?,to?,parameters?,name?,trackId?,autoReorder?}`. `from/to`
are milliseconds; defaults span the timeline (10seconds when no duration).
Creates media-less `type:"adjustment"` plus `color-grade` effect with
`parameters:{intensity:100,...suppliedParameters}`. Returns `itemId`, `trackId`,
`effectId` and reorder information. Creates/reuses a nonoverlapping compatible
adjustment track; new lane gets priority0. This legacy handler uses fallback
timing rather than strict range rejection: supply finite `0 <= from < to`.
It does not use media-add commands' `trackName` intent contract.

### `editor.convertCameraToAdjustmentLayer`

Params: `{sourceItemId,targetItemId?,coverFrames?,id?,name?,trackId?,autoReorder?}`.
Source aliases `itemId`/`fromItemId`; target aliases `toItemId`/`nextItemId`.
Source must exist and have enabled camera motion/base zoom. Existing adjustment
source or no camera yields `skipped`. Optional target extends the source span
by its duration or `coverFrames`, rounded/clamped to1..target-duration frames.
Missing target leaves source-only span. Source camera is removed; new layer is
selected. Returns `itemId`, `trackId`, `sourceItemId`, `spanFrames`, `coverFrames`.
This is not a strict adjacency check; select the intended neighboring clip.

### `editor.convertEffectToAdjustmentLayer`

Params: `{sourceItemId,effectId?,source?,targetItemId?,coverFrames?,id?,name?,trackId?,autoReorder?}`.
Source aliases `itemId`/`fromItemId`. `source` beginning `"camera"` delegates to
camera conversion above. Otherwise `effectId` selects that stored effect;
omitting it moves **all enabled** source effects. `effectType` is not a filter
despite an old source comment. Existing adjustment/no effects/missing effect
returns `skipped`. Optional target extension uses canonical `targetItemId`.
Returns layer/source IDs, span/cover frames and `movedEffects`.

### `editor.copyEffectSpanToItem`

Params: `{spanId,itemId?,targetItemId,atFrameRelative?,copy?}`.
Span aliases `effectSpanId`/`id`; optional source filter alias `trackItemId`;
target aliases `toItemId`/`destItemId`. `atFrameRelative` is a finite **frame
offset within the destination**, not milliseconds; omitted preserves the
source-relative placement. Default `copy:true`; `false` moves instead.
Discover actual spans via `query.getEffectSpans`. Cross-item effect copies can
create continuation links. Unsupported sources can return `skipped` or
`failed`; inspect `changed`, `unsupported`, `reason`, `sourceSpanId`,
`targetItemId`, `copied`. Uses shared span mutation logic, not arbitrary detail
patches. Do not equate span source IDs with timeline item IDs.

### `editor.extendCameraToItem`

Params: `{sourceItemId,targetItemId,coverFrames?}` with source aliases
`itemId`/`fromItemId`, target aliases `toItemId`/`nextItemId`.
Writes continued camera onto target, **replacing its camera configuration**.
`coverFrames` defaults to whole target and clamps1..target-duration frames.
Same item, missing target, no enabled source motion or invalid ranges returns
`skipped` with reason; success returns `changed`, `targetItemId`, `coverFrames`.
Uses the camera store directly; this handler alone does not promise an atomic
timeline+supplemental undo transaction.

### `editor.addTemplate`

Low-level insertion of an **already materialized timeline template item**.
Params are forwarded to `ADD_TEMPLATE` with generated `id` if omitted; no
template lookup, compilation, code validation or wait-for-appearance is done.
Supply the item's actual `display:{from,to}` in ms, `details`, `metadata` and
other required native item fields. Returns `{itemId}` on dispatch, not proof it
rendered. For normal use prefer documented `scene.addBundledScene`,
`scene.addCustomScene` or creator-style insertion, which build their expected
template payloads. Do not pass an invented `{templateId}`-only contract.

## Fades / clip envelopes — two commands

### `editor.setFade`

**Timeline**, state manager required; `{itemId:"..."}` or `{itemIds:[...]}`.
Pass one or more `fadeInMs`, `fadeOutMs`, `audioFadeInMs`, `audioFadeOutMs`,
curve/curvature fields. Finite numeric durations in ms clamp to0..half clip
duration. Ordinary fade is picture opacity on visual clips, volume on audio.
Independent video-audio fades accept `null` to delete/relink to visual fade;
ordinary `fadeInMs:null` is not a clear operation (use0).

Curve keys: `fadeInCurve`, `fadeOutCurve`, `audioFadeInCurve`, `audioFadeOutCurve`;
values `linear|ease-in|ease-out|smooth|exp|custom`, or null to clear.
Matching `*Curvature` keys clamp to−1..1, null clears.
Invalid curves are ignored, not schema errors. Returns `{updated:{[id]:...}}`.
One state-manager history update after all targets resolve. This handler does
not itself assert locked tracks; do not use that omission to bypass a UI lock.

### `editor.setEffectEnvelope`

**Timeline**, manager and `itemId`/`itemIds` required. Params include `effect`
plus effect fields or `clear:true`.

- Edge `effect`: `opacity`, `volume`, `brightness`, `blur`, `saturation`,
  `contrast`, `grayscale`, `sepia`, `hue`. Fields `inMs`, `outMs`, `amount`,
  `inCurve`, `outCurve`, `inCurvature`, `outCurvature`. At least one applicable
  field required; numeric durations clamp0..half duration. Amount bounds:
  brightness0..100, blur0..30px, saturation/contrast0..200, grayscale/sepia0..100,
  hue−180..180degrees. Opacity/volume use legacy fade fields; match volume to
  audio and other effects to supported visual media.
- Span `effect:"zoom"`: `startScale`, `endScale`, `hold` clamp0.1..4;
  `inMs/outMs` clamp0..duration; `focusX/focusY` clamp0..1. Accepts edge
  curve/curvature fields plus legacy shared `curve`/`curvature`.
- Curves use the setFade enum; null clears specified curves. `clear:true`
  removes/reset that envelope, not the clip. Returns `{updated:{[id]:...}}`.
  One history update, but no explicit lock assertion in this handler.

```json
{"itemId":"clip-id","effect":"zoom","startScale":1,"endScale":1.12,"inMs":500}
```

## Image matting / face application — three commands

### `editor.bulkRemoveBackgroundImage`

**Timeline + local media processing**. Params
`{itemIds?:string[],variant?:"fast"|"best",alphaRefine?:boolean,stopOnError?:boolean}`.
Default variant fast, alphaRefine/stopOnError false. **Omitted or empty itemIds
targets every image item**; always give explicit nonempty IDs for a subset.
Each image is processed sequentially with its own original source/cache,
then `details.src/aiMatting` is updated. Non-images/missing IDs are skipped.
Requires Desktop local matte service; may obtain/download its model.
Returns `{processed,results,skipped,errors,variant,alphaRefine}`.
Some successes plus failures can still yield `status:"success"`: inspect errors.
`stopOnError` stops subsequent items; **not rollback/cancellation of the current
inference**. No whole-batch atomic undo guarantee. See background-removal.md
for restoration and cache queries; verify/save applied media.

### `media.applyFaceTrack`

**Timeline**, despite media prefix. Params:
`{itemId,detection,mode?:"auto"|"follow"|"split",staticOnly?:boolean,expectedItem?,canvasWidth?,canvasHeight?}`.
Requires existing video item; positive supplied canvas size must equal current
project canvas. `expectedItem` checks `display`, `trim`, `playbackRate` and
`details.src` against the captured item; include it to reject intervening edits.
Get real detection first using the documented Desktop face-detection surface;
this command applies data and **does not run detection**.

Detection normalizes current/nested response shapes. Requires positive
`sourceWidth/sourceHeight`, 1..3600 usable `segments` with finite
`startSec/endSec/faceCenterX`, end>start, and at most3600 `perFrameData` entries.
Source times are seconds, not timeline seconds; preserve returned segment
fields (`faceCenterY`, crop dimensions etc.) and per-frame face rectangles.
Per-frame entries use `{timeSec,faces:[{x,y,width,height,centerX,centerY}]}`;
finite values, nonnegative time, positive face dimensions required.
Center fallback, incomplete coverage and skin-color-heuristic results are not
reliable face data. Do not fabricate segments to bypass these checks.

Auto may replace the item with follow/split clips; forced split needs detected
two-face intervals and complete gap-free trim coverage. `staticOnly:true`
suppresses follow-mode generated x-keyframes, **not** auto-split behavior;
use `mode:"follow"` for static single-view intent. Re-query IDs after application.
Refuses locked source track, transitions and re-detection of face-track groups.
Writes restoration backup, supplemental/keyframes and one undoable transaction.

### `media.restoreFaceTrack`

**Timeline**. `{itemId}` selects a current video member with reversible backup.
Restores the original clip/group and its supplemental state; returns
`{restored:true,itemId}` (reported ID is the requested member, which may have
been replaced). Refuses absent backup, locked affected tracks or occupied
original ID. Re-query canonical timeline IDs, verify and save. This is explicit
group restoration, not a deletion-only command or provider cancellation.

## Reference-kit library — five commands

All use authenticated `/api/gen-profiles` server routes and **Saved library**
scope; require logged-in ContentLead access. No timeline mutation, generation,
preview/apply gate or timeline-undo promise. Create/update may upload supplied
data-URL references to owned blob storage. Do not retry create after a timeout
without listing/reconciling results.

| Command | Params | Result |
|---|---|---|
| `genProfile.list` | `{}` | `{profiles:[...]}` |
| `genProfile.get` | `{id}` | `{profile}` |
| `genProfile.create` | `{name,description?,kind?,referenceImages?,styleKeywords?,defaults?}` | `{profile}` with server ID |
| `genProfile.update` | `{id,name?,description?,kind?,referenceImages?,styleKeywords?,defaults?}` | `{profile}`; omitted fields stay unchanged |
| `genProfile.delete` | `{id}` | `{id,deleted:true,ok,profile?}`; destructive server write, not undoable |

Name trims to nonempty ≤120 characters; at most24 style keywords and four
references, each≤8MiB. `kind` type is `subject|product|style|settings`.
Each reference is `{dataUrl?,url?,role:"subject"|"style"|"product"|"logo",caption?}`.
Existing URLs must pass server's allowed owned Azure container HTTPS check.
Malformed data URLs can be skipped server-side: inspect stored profile.
`defaults` fields: `modelId`, `mode`, `aspect`, `resolution`, `durationSec`,
`variantCount`; applying a kit does not prove a model accepts all defaults.
Never pass malformed `referenceImages`: the editor adapter converts a
non-array update to `[]`, potentially clearing the kit.

**Adapter limitation:** although current server profile types also support
`characterStyle`/`sceneStyle`, these editor CRUD handlers do **not** forward those
fields. Use the supported AI Video Reference Kit HTTP commands in cl-ai-video
for that workflow; do not claim the editor adapter saves them.

## Read queries — three commands

| Command | Params / result | Limits |
|---|---|---|
| `query.getKeyframes` | `{itemId?}`. With ID: `{itemId,trackItemId,tracks,hasKeyframes}`; no ID: `{keyframes,count}`. | Read. Missing entry returns empty tracks, not proof item exists. Frames use project timeline FPS. |
| `query.getEffectiveDetails` | `{itemId,frame?,timeMs?}` → `{itemId,frame,fps,timeMs,hasKeyframes,keyframedValues,baseDetails,effectiveDetails}`. Finite frame takes precedence, then finite timeMs, else playhead/0. | Read. Rounds frame, interpolates item keyframes only; not full camera/effect/overlay pixel rendering. Missing item fails. |
| `query.getPreviewRect` | `{}` → viewport `x,y,width,height`, `devicePixelRatio`, scroll and inner-window sizes. Fails without mounted preview container. | Read. CSS pixel bounds for Desktop capture, **not image data or stabilized-frame verification**. Use `query.previewFrameAt` for timed visuals. |

## Playback / UI navigation — seven commands

All **UI** scope; no timeline save, approval token or provider cancellation.
Success is command dispatch, not evidence a specific frame/panel painted.

| Command | Params / behavior |
|---|---|
| `editor.play` | `{}` dispatches player play. |
| `editor.pause` | `{}` dispatches player pause. Does not cancel render/generation. |
| `ui.openTab` | `{tab}` opens editor rail panel, **not Desktop tab**. IDs: `uploads,styles,texts,videos,images,shapes,transitions,sfx,scenes,caption,brand-kit,ai`; accepts label/singular aliases. Non-AI opens tools/menu; AI opens left AI panel. Returns `{tab,label,panel}`. |
| `ui.closePanel` | `{closeAI?:boolean}` closes menu; only truthy closeAI also closes left AI. Does not navigate/close content. |
| `ui.setRightPanelTab` | `{tab:"tools"|"properties"}` → `{tab}`. |
| `ui.setPropertiesTab` | `{tab,type?}`; tab=`design|animate|effects|camera|audio|autocaptions|transcript|content`. Optional item `type` persists `editor-tab-<type>` in localStorage. Requests one-shot tab on currently mounted property panel; does not select/create an item or guarantee that item type supports this tab. Returns `{tab,type}`. |
| `ui.getState` | `{}` → `activeMenuItem,activeMenuLabel,showMenuItem,rightPanelTab,rightPanelCollapsed,leftAIPanelOpen,availableTabs`. Read-only navigation state. |

## Source map

In SkillTown, under
`app/content/[content_id]/context/AgentCommandQueue/commandHandlers/`:
`aiCollaborationHandlers.ts`, `editProposalHandlers.ts`, `addHandlers.ts`,
`editHandlers.ts`, `effectSpanHandlers.ts`, `imageBackgroundRemovalHandlers.ts`,
`genProfileHandlers.ts`, `queryHandlers.ts`, `playbackHandlers.ts`, `uiHandlers.ts`.
Preview rectangle and face dispatch are in sibling `commandExecutor.ts`.
Shared checks/planners: `lib/podcast/faceDetection.ts`,
`components/video-editor-v2/utils/face-track-transaction.ts`,
`effects/effect-spans/mutations.ts`, `camera-effects/camera-extend.ts`,
`utils/clip-effects.ts`. Library validation: `app/api/gen-profiles/`,
`lib/genProfiles/references.ts`.
