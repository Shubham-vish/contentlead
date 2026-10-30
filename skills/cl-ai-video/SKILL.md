---
name: cl-ai-video
description: "Operate ContentLead's authenticated AI Video Studio HTTP commands: inspect models, Reference Kits, prompt enhancement and Enhance-style presets, estimate cost, generate images/video, wait/cancel jobs, and browse saved candidates. Use cl-ai-generate for the six editor aiVideo commands and timeline placement; cl-ai-media for raw image/text/vision helpers."
tags: contentlead, ai-video, veo, omni, nanobanana, reference-kit, enhance, presets, generation, jobs
---

# ContentLead AI Video Studio

> **Owns:** the authenticated AI Video Studio HTTP command route.
> **Related:** `cl-ai-generate` owns editor command integration;
> `cl-editor` owns tabs, timeline placement, save and render;
> `cl-ai-media` owns raw text/image/vision helpers.

## Transport and availability

Use the signed-in ContentLead web session:

```text
GET  /api/ai-video/commands/<name>                  → manifest
POST /api/ai-video/commands/<name> {"params":{...}} → command result
```

The desktop cookie-forwarding equivalents are
`GET /api/bridge/ai-video/commands` and
`POST /api/bridge/ai-video/commands/<name>`.
Follow `cl-editor` startup and explicit tab targeting when using desktop.
Never start, navigate or reload an app during a source-only audit.

The manifest is authoritative for the running origin. A local skill or source
change does not establish packaged/deployed handler availability.
Invalid parameters fail JSON-schema validation; every command requires auth.
Inspect both the outer `ok` and nested `result.ok`, plus `error`,
`validationErrors` and `result.data`. HTTP 401 requires sign-in.

**Do not send these route names to editor `/api/execute`.** Its six `aiVideo.*`
commands have a different envelope and surface. In particular route
`aiVideo.generate` requires `contentId`; editor generate addresses the target tab.

## Command catalog

The source manifest defines **23 commands**. Optional fields have `?`; use exact
live schemas and model capabilities rather than guessing values.

| Command | Params | Purpose |
|---|---|---|
| `aiVideo.getState` | none | Models, jobs, kits, mode labels and `firebaseAdminConfigured`. Start here. |
| `aiVideo.models.list` | none | Full model capabilities. |
| `aiVideo.models.get` | `id` | One model. |
| `aiVideo.models.compatibleWith` | `kind?`, `mode?`, `refCount?`, `needsReferenceImages?`, `needsStartFrame?`, `needsEndFrame?`, `minDurationSec?`, `aspectRatio?`, `resolution?` | Matches and rejected models with reasons. |
| `aiVideo.prompt.enhance` | `basePrompt`, `modelId?`, `mode?`, `aspect?`, `resolution?`, `durationSec?`, `characterStyle?`, `sceneStyle?`, `kitId?`, `referenceUrls?`, `analyzeReferences?`, `temperature?`, `presetId?` | AI rewrite; may invoke vision. This is not a free/static preview. |
| `aiVideo.prompt.previewSystemPrompt` | `modelId?`, `mode?`, `aspect?`, `resolution?`, `durationSec?`, `characterStyle?`, `sceneStyle?`, `presetId?` | Inspect assembled Enhance instructions without an LLM/vision call; returns `systemPrompt`, `defaultGoal`, `preset`, `kind`. |
| `aiVideo.presets.list` | `kind?`: image/video/both | Built-in and user Enhance styles. |
| `aiVideo.presets.create` | `name`, `description?`, `kind?`, `systemPromptOverride?`, `extraGuidance?` | Save user Enhance style; provide override or guidance. |
| `aiVideo.presets.update` | `id`, same optional create fields | Partial update; built-ins protected. |
| `aiVideo.presets.delete` | `id` | Delete user preset; built-ins protected. |
| `aiVideo.generate` | `contentId`, `model`, `mode`, `prompt`, `aspect?`, `resolution?`, `durationSec?`, `variantCount?`, `profileId?`, `referenceImages?`, `startImage?`, `endImage?`, `editVideoUrl?`, `credentialId?`, `modelName?` | Queue one provider generation. Retain `jobId`, `progressId`, `firebasePath`. |
| `aiVideo.jobs.get` | `progressId` | Read progress record. |
| `aiVideo.jobs.list` | `activeOnly?`, `contentId?`, `limit?` | Current user's jobs. |
| `aiVideo.jobs.wait` | `progressId`, `timeoutMs?` | Bounded server-side wait; default 120000ms, max 300000ms. Inspect `timedOut`. |
| `aiVideo.jobs.cancel` | `progressId`, `jobId?` | Request cancellation; inspect result, do not claim refund/provider termination without evidence. |
| `aiVideo.library.list` | `contentId`, `limit?`, `kind?`, `approved?` | Saved completed candidates. |
| `aiVideo.library.get` | `contentId`, `id` | Candidate by ID/job ID. |
| `aiVideo.kits.list` | none | Saved Reference Kits. |
| `aiVideo.kits.get` | `id` | One kit. |
| `aiVideo.kits.analyze` | `id?`, `urls?`, `kind?` | AI vision plus compatible models; not a no-provider preview. |
| `aiVideo.credentials.list` | none | Owned BYOK project projections; never raw keys. |
| `aiVideo.quota.get` | none | Current usage/limits; do not promise unlimited quota. |
| `aiVideo.cost.estimate` | `model`, `resolution?`, `durationSec?`, `variantCount?` | Static model rate estimate, not a billing guarantee. |

Preset limits: name 80 chars, description 240, full override 4000, guidance 2000.
Default kind is both. A full override replaces the entire Enhance base prompt,
including rules; preview before selecting it. Preset/library writes are saved
server state, not timeline edits and not timeline undo.

## Reviewed recipe

1. Read state, model capabilities, quota, owned kits and static cost estimate.
2. Select a compatible model. Veo Lite has no refs/4K; Omni has no refs and edit
   inherits source settings. Veo frame guidance and reference images are mutually
   exclusive. Use `models.compatibleWith` for current limits.
3. If editing Enhance instructions, read `prompt.previewSystemPrompt`; save a
   user preset only on user intent. Enhancement/kit analysis are separate AI calls.
4. With authorized spend, call generate once. Prefer hosted reference/frame/edit
   URLs or saved kits, not blob URLs, local paths or large inline base64.
5. Wait using **progressId**, not the provider jobId. Terminal status is
   completed/failed/cancelled. Timeout is not failure: inspect existing jobs before
   retrying to avoid duplicate charges. If Firebase Admin is unavailable, report
   that blocker rather than treating empty progress as completion.
6. On completion, read the saved candidate through library.get/list.
7. For timeline placement, switch to `cl-ai-generate` and the original editor tab:
   addCandidateToTimeline with explicit trackId or trackName; reorder, inspect
   `query.previewFrameAt`, then `editor.save`. Library persistence is separate.
8. For explicit cancellation, call jobs.cancel with progressId (and jobId if
   needed), then inspect status. Cancellation is not permission to start a new job.

Never fabricate approval, publish, spend, change credential projects or rewrite
saved user presets without intent. Never expose credentials in skill examples.

## Source map

- `SkillTown/lib/aiVideo/commands/manifest.ts`: names and schemas.
- `commands/dispatch.ts`, `registry.ts`, `schema.ts`: lookup/validation.
- `commands/service.ts`, `serverContext.ts`: owner-scoped operations.
- `SkillTown/app/api/ai-video/commands/[name]/route.ts`: authenticated route.
- `SkillTown/lib/aiVideo/models.ts`: model capability truth.
- `SkillTown/lib/aiVideo/jobStore.ts`: progress and saved library.
- `SkillTown/app/api/ai-video/generate/route.ts`: asynchronous provider engine.
