# Mounted native processing and studio controls

These are source-defined controllers, **not installation or live-runtime
acceptance**. Require both the Desktop catalog and the addressed renderer's
exact capability names/contract. Non-editor route identity and project
restore/media-health gating must also be installed; a catalog spread alone
does not make these safe. Do not send editor save/restore/diagnostic commands
or request timeline `autoRestore:true` for these views.

Every `/api/execute` envelope requires explicit `tabId` and
`params.expectedSessionId`; optional `expectedContentId` must match the same
session ID. These assertions do not select/load another session. Permission,
host checks and actual native runtime readiness are not fabricated.

## Local processing: full native workflow, not processor-only success

Mount the actual host `/podcast/dashboard/<sessionId>` on supported Desktop.
Require `podcast-local-processing.1`. The controller invokes **the page's
existing `useLocalProcessing` instance**, including persisted scope, native
processing, real output uploads, `/exports/complete` and terminal state.

| Command | Additional params |
|---|---|
| `podcast.localProcessing.getState` | none |
| `podcast.localProcessing.start` | `confirm:true`; optional `options:{createComposite?,createMixedAudio?}` |
| `podcast.localProcessing.retry` | `confirm:true` |
| `podcast.localProcessing.resume` | `confirm:true` |
| `podcast.localProcessing.reprocess` | `confirm:true`, `recordingIds`: 1–100 distinct recording IDs |

Writes return **accepted, not completed**, with invocation/job/phase metadata.
Poll getState; inspect `phase`, `overallProgress`, `uploadProgress`,
`pendingInvocation`, `error` and `failureReason`. `completed:true` requires the
actual hook's completed phase after upload/finalization, no pending invocation
and no invocation/native error. Native processor `job.status:"done"` alone
is not completion or a cloud-playable episode.

Retry/resume use the native persisted full/targeted run scope. Targeted
reprocess preserves unrelated outputs through the existing scoped finalize
logic. Inspect native run/export state before an **explicit** retry; never
automatically repeat an uncertain upload/finalize operation. There is no
advertised cancel: native cancellation does not safely abort every upload and
finalization phase. Navigating away does not establish that work stopped.
The retired cloud `/process` remains 410 and is not a fallback.

## Studio device/quality configuration

On mounted multi/solo `/podcast/studio/<sessionId>`, require `podcast-studio.1`.
Native recording start/stop/finalization are **not implemented commands**.

| Command | Additional params |
|---|---|
| `podcast.studio.getDevices` | none |
| `podcast.studio.selectDevice` | `kind`: `audioinput`/`videoinput`/`audiooutput`, `deviceId` from the native list |
| `podcast.studio.setQuality` | complete `config:{camera,screenShare,composite,resolution}` |

The three quality numbers are integer fps 1–60; resolution is `720p`, `1080p`
or `4k`. The native setter applies to the **next recording**, not already
captured bytes. Changes fail while recording or its uploads remain busy.

Device switches use the same underlying LiveKit/Solo adapter as the UI.
Camera/microphone/speaker-selection permission must **already be granted**
and verifiable via the browser permission API. Prompt/denied/unsupported
permission checks fail clearly without requesting consent or attempting the
switch; use the human device lobby/OS settings first. Input switches require
an actual live track with matching `getSettings().deviceId`. Audio-output
receipts explicitly return `activeDeviceVerified:false` because the native
adapter has no output getter; this is not physical sound verification.
getDevices does not request permissions; ungranted labels may be blank.
Its `activeInputs` reports actual native input track settings/readiness (or
null), useful for reconciling an uncertain switch. Output selection remains
unverifiable through this adapter, not an invented selected device ID.

## Connected multi-party studio peer chat

`podcast.studio.sendChat` requires an actual connected LiveKit room, not Solo
or a persisted-chat-only HTTP endpoint:

```json
{"expectedSessionId":"...","acknowledgeSend":true,"text":"Ready for the next topic","isNote":false}
```

Text is trimmed, 1–4,000 characters; `isNote` is optional. User intent is
required because this sends a real message to peers. It reuses the UI's
reliable native data-bus publish/local echo, then independently persists chat.
Inspect `published`, `persisted`, `persistenceError` and
`peerDeliveryAcknowledged:false`. Native publish completion is not recipient
delivery/read confirmation. Persistence failure never causes a second publish;
do not resend automatically to “repair” history after an uncertain result.

## Remaining recording boundary

No command here starts fake recorders or fabricates chunks. Native start may
fall back to getUserMedia and broadcasts peer start; it needs a permission-safe
and consent-bounded command mode before exposing capture. Native stop returns
before asynchronous recorder/chunk/upload finalization; it needs a real
multi-recorder terminal receipt before claiming completion. Use the UI for
those recording lifecycles until those separate gaps are closed.
