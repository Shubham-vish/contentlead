---
name: cl-production
description: Operate ContentLead episode clipping and podcast production through validated desktop commands. Owns saved source readiness, canonical word selections, shortlist revisions, bounded discovery pause/resume, batch draft recovery, camera setup, speaker-directed shots, manual sync, reviewed tightening, caption-language drafts, edited excerpts, finishing recipes and final delivery review. Load cl-editor first for connection and tab targeting.
tags: clipping, podcast, production, shortlist, discovery, camera, director, sync, tightening, language, excerpt, recipes, delivery
---

# Production - Episode to Reviewed Drafts

> **Owns the question:** "How do I run the reviewed clipping/podcast workflow through desktop commands, without bypassing its UI safeguards?"
> **Delegates to:** `cl-editor` for connection, media, undo, save and export; `cl-virality-scoring` for creative scoring; `cl-content-publishing` for separately authorized publishing.

## Start here

For recording-session dashboard operations (rather than the timeline), read
`recording-dashboard.md`. Its bridge routes do not implement local capture or
the native processing/upload/finalization lifecycle.
For separately mounted native processing, studio device/quality and actual
LiveKit peer chat, read `native-runtime.md`; those capability-gated renderer
controllers are not timeline commands or saved-dashboard HTTP routes.

Follow `cl-editor` startup: fresh API handle, health, diagnostics, tabs. Send every
command to an explicit `tabId`. `params.contentId`, when supplied, is an assertion
against that tab's content, NOT a way to operate on another open project.

Use `GET /api/capabilities` to check the running desktop's catalog. An old desktop or
cloud frontend may not have these commands even when the skills are available.
Both updated web handlers and updated desktop code are required. Unknown commands
are an upgrade/deployment blocker, not permission to invent alternative commands.

```json
{
  "type": "production.getSources",
  "tabId": "<episode-tab>",
  "params": {"contentId": "<episode-content-id>"}
}
```

Send this envelope to `POST /api/execute` with the normal Bearer header.
Inspect `status`, `error`, `result`, `warnings` and `editorHealth` on every response.

**Timeline production state scopes** (mounted dashboard/studio scopes are in
`native-runtime.md`):

- `production.*` reads/writes **saved server documents**, using the signed-in
  tab's same-origin cookies and existing owner/capability checks. Save first.
  These commands do not load drafts, mutate the open timeline or trigger its
  desktop autosave. Refresh/reopen UI data explicitly. Recipe application returns
  `reloadRequired` for affected editors; do not save stale open editor state.
- Timeline `podcast.*` and `transcript.*Tightening` operate on the **live editor** through
  shared planners and atomic history. Pause playback before preview. Apply is a
  separate request with the returned `previewToken` and `confirm:true`, after
  reviewing the result. Repeat the original preview inputs unchanged. Changes to
  input, transcript, locks, effects, keyframes, camera effects or timeline require a
  fresh preview. Inspect the returned before/after `changes` as well as the plan.
  Save after apply.

Never fabricate approval, audition or final-preview confirmation. Do not publish,
render, spend AI credits or change a reference microphone without user intent.

## 1. Sources, shortlist and boundary revisions

| Command | Params besides optional `contentId` |
|---|---|
| `production.getSources` | none; returns candidates, sources and readiness |
| `production.getSourceWords` | `sourceKey`; returns canonical source `words`, `sourceRevision`, `transcriptRevision`, `speakerDiarization` |
| `production.getCandidateWords` | `candidateId`; returns full canonical words, inclusive `startWord`/`endWord` and `sourceRevision` |
| `production.saveCandidate` | `id` (new stable 16-80 character alphanumeric/hyphen ID), `sourceKey`, `name`, `selectedWords`, optional `note`, `includeCaptions` |
| `production.reviseCandidate` | original `candidateId`, new stable `id`, inclusive zero-based `startWord`, `endWord`, unchanged `sourceRevision` |
| `production.getWorkspace` | none; returns workspace, delivery and sources |
| `production.reviewCandidate` | `candidateId`, `status`: proposed/accepted/rejected/archived |
| `production.renameCandidate` | `candidateId`, `name`; creation-attempted inputs cannot be renamed |
| `production.selectCandidate` | `candidateId`, `selected` boolean |
| `production.createDraft` | `candidateId`; accepted AND selected first |

Read saved words rather than re-transcribing or inventing timings. `selectedWords`
is a contiguous slice of `{word,start,end}` in **source seconds**, at most 2,000
words / 30 minutes. Preserve the exact text/timestamps. Draft captions rebase once.
Revision makes a new proposal; it does not change the original candidate or draft.
Audition the source using the UI/source media before recording acceptance.

Example call sequence: getSources -> getSourceWords -> saveCandidate ->
reviewCandidate(accepted) -> selectCandidate(true) -> createDraft. The returned
`contentId` is the NEW draft; `addressedContentId` remains the episode.
Open the draft in a separate tab. Source clips do not retain the episode's edits.

## 2. Bounded discovery, pause/resume and batches

`production.saveBrief` takes `brief`:
```json
{"topic":"A practical lesson","speaker":"","minSeconds":20,"maxSeconds":60,"count":3}
```

`production.discoverWindow` takes the same `brief`, `sourceKey`, stable `requestId`,
explicit `windowIndex` (start at 0) and `aiConsent:true`. This invokes the configured
paid AI provider; it is NOT the no-provider agent reasoning workflow.

Each call runs **one** bounded window. Inspect returned `discovery`. Continue only
at its `nextWindowIndex`, preserving requestId and inputs. Pause by issuing no
further windows; an in-flight provider call is not cancelled. Resume by reading
getWorkspace and continuing unfinished coverage. Do not restart from zero with
new IDs to evade retry/budget limits. Three attempts/window, at most 24 windows.
The proposal pool preserves temporal diversity, not a global virality ranking.

For a batch, accept and select each candidate, then call createDraft sequentially
for selected pending/failed candidates. Inspect each result, retain successful
IDs and retry failed entries only. This is bounded orchestration, not a background
queue. An abandoned in-flight create may require waiting two minutes before retry;
discovery leases may take five minutes. Never overwrite a recovered edited draft.

## 3. Camera setup, director and sync

`podcast.inspect {sourceId}` reads setup metadata, readiness, source key,
source-clock turns and linked partners. `sourceId` is a timeline item ID.
If turns lack usable labels, obtain/review diarization; never guess identities.

`podcast.previewCameraSetup` takes:
```json
{
  "options":{
    "sourceId":"<video-item>",
    "referenceId":"<reference-audio-or-video-item>",
    "mode":"single-camera",
    "assignments":[
      {"role":"speakerA","region":"left"},
      {"role":"speakerB","region":"right"}
    ],
    "alreadySynchronized":true
  }
}
```

Use `alreadySynchronized:true` only with explicit confirmation. Otherwise supply
`options.sync` in the format below. In existing-camera mode, independently align
other recordings first; a selected source offset never aligns unrelated sources.
Apply with `podcast.applyCameraSetup`, identical `options`, previewToken, confirm.
Preview clone IDs are provisional; use IDs from the apply result/next inspect.
Copies are silent; the selected reference stays audible. Switching reference
mutes the old setup reference, not unrelated music. Muted/hidden/detached references
and locked targets fail before writes. Use mode `existing` after creating copies;
undo before rebuilding. Left/right select source halves, preserving cover/contain.

`podcast.previewDirector` takes `sourceId`, `recipe` and optional reviewed `turns`.
Omitted turns load the source-keyed transcript in the open editor:
```json
{
  "version":1,
  "bindings":[
    {"speaker":"A","role":"speakerA","region":"left"},
    {"speaker":"B","role":"speakerB","region":"right"}
  ],
  "minHold":2,"overlap":"two-up",
  "screenRanges":[],"overrides":[],"shots":[]
}
```

Use the actual speaker labels, not these example labels. Empty shots generates a
plan. Nonempty shots validates a manually edited plan. Shots/overrides have
`{start,end,layoutId,reason,roles?}` in **timeline seconds**; turns have
`{speaker,start,end}` in **source seconds**. Screen ranges use timeline seconds.
Read `layout.list` for layout IDs. Apply with `podcast.applyDirector`, the same
preview inputs, previewToken, confirm. To modify the returned shots, issue another
preview with that edited recipe first. Camera membership changes invalidate setup.

`podcast.previewSync` takes `sourceId` and:
```json
{"sync":{"version":1,"referenceId":"<other-item>","offset":0.25,
 "points":[],"bypassLinks":false}}
```
Offset is reference minus source seconds. Points are `{reference,source}` source
seconds; the first pair determines offset, later pairs estimate drift. One/zero
points means drift unknown. There is no audio correlation or time stretching.
Apply with `podcast.applySync`, same inputs, previewToken, confirm. Only the selected
item moves. `bypassLinks:true` requires explicit acknowledgement that linked
captions/partners stay behind; it never bypasses a locked source.

## 4. Tightening and reviewed language/speakers

`transcript.previewTightening {sourceKey}` returns conservative suggestions and
previewToken without cutting. Optional `proposals` are agent-reviewed
`{first,last,category,reason}` word-index ranges; categories are filler,
false-start, repetition, rambling. They are canonicalized against current source
words, not accepted as arbitrary times. Omitting proposals uses the same local
heuristics as the UI. This command itself makes no paid AI call.

After listening/reviewing, call `transcript.applyTightening` with the same sourceKey
and proposals, previewToken, confirm:true and `approvedIds` from those suggestions.
Unapproved suggestions are untouched. Normal-rate media only; source, captions
and linked cuts compose in one undo step. Undo through `editor.undo`.

`production.saveSpeakers` takes sourceKey, `sourceRevision` set to the
**transcriptRevision** returned by getSourceWords, unchanged
`baseSpeakerDiarization` (object or null), and `data`:
`{speakers:[{id,name,color}],segments:[{speakerId,startTime,endTime}],source:"manual"}`.
Times are full-source seconds; `speakerId:""` is unknown. Refresh canonical words
after saving. Reviewed mappings affect discovery freshness, not word text.

`production.previewLanguage` takes sourceKey, sourceRevision = **transcriptRevision**,
`operation` (correction/transliteration/translation), `targetLanguage`, `glossary`
(string, including empty) and reviewed `segments:[{first,last,text}]`.
Indices are inclusive, zero-based; ordered nonoverlapping segments <=30 seconds.
Supply reviewed text; this command validates it, it does not generate translation.
Use the existing AI media/text skill separately if generation is requested.
Create with `production.createLanguage`, the identical inputs and previewToken.
Timing is estimated per segment; never claim translated word-level karaoke.

## 5. Excerpts, recipes and style episodes

`production.previewExcerpt` takes stable requestId, title, `from`, `to` in
**timeline milliseconds**, aligned to FPS. Save first. Create with
`production.createExcerpt`, same inputs plus returned `revision`. It retains saved
timeline edits; it is neither a source clip nor a full `content.duplicate`.
Unsupported media/transition boundaries fail rather than silently losing edits.

Recipes:
- `production.listRecipes`: saved recipes plus library revision.
- `production.saveRecipe`: revision and recipe `{id,name,captionPreset?,audioPreset?,
  brandKitId?,layoutPreference?,deliveryPreset?}`. Use actual catalog/UI preset IDs;
  omitted settings remain unchanged. No caption insertion or footage adaptation.
- `production.previewRecipe`: recipeId, stable requestId, explicit contentIds
  (1-20 distinct owned drafts). Inspect each result's changes, skips and error.
- `production.applyRecipe`: same selection/request, `tokens:{[contentId]:token}`
  from preview, confirm:true. Inspect all outcomes. `partial:true` yields failed
  command status even if some drafts applied; retry with the SAME request identity.
  Reload affected editors. No cross-container ACID or whole-batch rollback claimed.

`production.previewEpisode` takes styleId, `values:{title,hero?:{url,durationMs},cta?}`
and optional `bindings:{version:1,bindings:[...]}` (otherwise uses saved declarations).
Each binding is `{field:"title"|"hero"|"cta",target:{kind:"overlay",id,property:"text"|"src"}}`
or a scene target `{kind:"scene",index,property}`. Choose actual declared targets from
the saved style, never guess. `production.createEpisode` adds unchanged previewToken
and stable requestId. This creates a detached draft, not template insertion.

## 6. Delivery is a review, not publishing

`production.linkDraft {draftContentId}` registers a language/excerpt derivative in
the original episode tab. Owned ancestry is verified; never attach unrelated IDs.

Read getWorkspace for delivery rows and current revision. Open, finish, save and
preview each final draft. Only with explicit user decisions call
`production.approveDelivery` with candidateId (or derived row ID), revision,
`confirmedPreview:true` and `review:{account,time,cover,cta}`. Include timezone or
explicit manual/unscheduled timing. Use "None" only intentionally. Saved edits
invalidate approvals. This does not render, publish, schedule or graduate a reel.

## Failure and verification rules

No broad retries or new IDs on timeouts. Read current workspace/draft state first.
HTTP 401 means sign in on the addressed origin; 409 means refresh/review again.
Do not weaken guards by manually patching metadata or source timestamps.
Unit tests and command success are not export pixel-parity or audition evidence.
Use disposable content for mutation tests. After apply, inspect state, undo/redo,
save/reopen and verify a rendered sample only when rendering is authorized.
