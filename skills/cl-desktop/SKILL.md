---
name: cl-desktop
description: Start here for the whole ContentLead Desktop workflow: private connection discovery, live renderer readiness, research, editing, publishing, creator surfaces, commerce, CRM, Calls, Webinars and Deals. Routes to owning skills rather than inventing generic commands.
tags: desktop, start, workflow, discovery, capabilities, readiness, routing
---

# ContentLead Desktop — Whole-Workflow Router

Use this router for the overall desktop product. `cl-editor` owns video editing; `cl-apps` owns hosted static websites, not the desktop itself.

## Connect without disturbing another session

1. Privately read `~/.skilltown-desktop/api.json`; never print tokens/cookies or enable shell tracing. File presence is not liveness.
2. Make an authenticated loopback `GET /api/health` with connection and total timeouts. On refusal/401, re-read discovery once. If still unavailable, report it; do not start/reload/switch origins unless authorized.
3. Check `GET /api/app/origin` and `GET /api/app/auth`. Local bearer authorization does **not** establish web login. Login/OAuth/account selection that needs a person stays in the UI.
4. Read `GET /api/tabs`; pin the intended `tabId`. Never close other tabs to bypass HTTP409 ambiguity.
5. Read `GET /api/capabilities?tabId=<id>`. Top-level `commands` are the **installed snapshot**; `renderer.capabilities` is a sender-bound live report when `renderer.source` is `renderer-handshake`. Inspect `contractVersion`, `commands`, `hydration`, `readyForWrites`, `save` and reported `contracts.trackPlacement.createNewTrack`/command names. A legacy renderer or absent contract is explicitly unverified, not fully supported by inference.
6. For video work load `cl-editor`, then its `workflow-readiness` guide. Use `query.getProjectReadiness` / `query.getCapabilities` and `params.expectedContentId`. Editor mount, hydrated project data, media readiness and web authentication are separate.

Prefer `POST /api/content/create` with `{title,navigate:false}`, followed by `POST /api/tabs/new {contentId}` when creating a separate editing project. This avoids replacing another project. Creation with navigation must identify its tab when multiple tabs exist; a timeout after creation is not permission to create a duplicate.

## Route to the owner

| Workflow stage | Load | Supported path / handoff |
|---|---|---|
| Research and competitor creatives | `cl-content-inspiration`, `cl-ad-intelligence` | Owned REST research/watchlists and Ad Library routes; do not mistake HTTP-only aliases for editor commands. |
| Script, voice and creative plan | `cl-content-direction`, `cl-script-evaluator`, `cl-content-style`, `cl-virality-scoring` | Human creative review; use the shared scoring rubric, not new scoring heuristics. |
| Images, video generation and speech | `cl-ai-media`, `cl-ai-video`, `cl-ai-generate`, `cl-voice` | Estimate/approve paid work; poll the saved job and inspect candidates before timeline placement. AI Video Studio HTTP commands differ from editor `aiVideo.*`. |
| Video editing, import, transcript and save | `cl-editor`, `cl-production` | Explicit tab/project targeting, readiness, native bounded media tools, previews, reviewed apply, save receipt. Do not copy command parameters from this router. |
| Local render and delivery | `cl-editor` → `rendering` | Native render job status/cancel/output verification. A cancelled client request is not proof the underlying provider job stopped. |
| Publish, schedule, inspect and remove owned posts | `cl-content-publishing` | Native Instagram/YouTube and approved LinkedIn routes; reconcile stored attempts after uncertainty. Provider login/consent remains human. |
| Boards, docs, storefront and hosted apps | `cl-board`, `cl-creator-hub`, `cl-creator-biopage`, `cl-apps` | Their own canvas/command bus or bounded local uploads, draft preview and reviewed publication. Boards PDF uses the shared bounded prepare→review→start/status→apply job, not image insertion; save separately. First handle claim uses the reviewed native onboarding bridge. |
| Sell offers; buyer subscriptions and invoices | `cl-offers` | Discover `/api/bridge/offer-studio/commands`; buyer subscription/invoice aliases reuse native authorization. Explicit `confirm:true` where documented; mandate consent/payment remains the buyer's UI action. No separate billing RPC. |
| Leads, customer context, tasks and sales pipeline | `cl-crm` | Scoped timeline/context, bounded CSV, revision-safe approved bulk actions; preserve per-item outcomes. Support Inbox is explicitly platform-ADMIN-only, not creator/owner WhatsApp access; exact approved known-thread replies retain native window and stale-message guards. Billing/access changes are not generic CRM writes. |
| Calls and follow-up | `cl-calls` | Approved campaigns and native recovery; no inferred recipient consent. Manual live microphone/call controls and provider limitations are explicit handoffs/gaps. |
| Meetings and webinars | `cl-webinars` | Saved schedule/assets, bounded reports/pagination, native start/end/test lifecycle. Follow moderation and broadcast approval boundaries. |
| Brand/creator campaigns, submissions and funding | `cl-deals` | Native fixed command adapters, role-scoped creative/chat state, proof up to5MiB and attachments up to512MiB. Larger-than10MiB assets use bounded streamed local jobs with explicit cancellation/read-only reconciliation, never automatic replay; upload is not submit/send. Confirm money-affecting actions; payment itself may require the UI. |
| Owned advertising measurement | `cl-meta-ads` | Official human-approved OAuth, read-only Insights and offer tracking; no campaign/budget/spend mutation commands. |

Saved business commands use the signed-in web session through `/api/bridge/<domain>/commands/:name`, not editor IPC. An editor `tabId` does not isolate a business/account mutation. Read its manifest and skill; the envelope is usually `{params}`, sometimes with required outer confirmation.

### Additional end-to-end routes

- **Buyer purchases/reaccess/private downloads and seller fulfillment:** `cl-offers`
  → `fulfillment.md`. Discover owned purchases/deliveries and exact IDs before
  approved reaccess, resend or revoke. Private product upload uses the separate
  selected-local `/api/bridge/offer-studio/product-upload` endpoint, not public
  branding upload or `/api/execute`. Keep tokens/SAS private; paid-but-unfulfilled
  is not repaired by synthetic payment success.
- **Affiliate terms/imports and creator withdrawals:** `cl-deals` → `payloads.md`.
  Reviewed real conversions/refunds and explicit financial confirmation only.
  Preserve integer paise and stable request IDs; REQUESTED does not mean PAID.
- **Account/social maintenance:** `cl-content-publishing` →
  `account-maintenance.md`. Stored disconnect is not verified provider revocation;
  OAuth, reconnect and identity/contact verification remain human.
- **Reel Inbox:** `cl-content-inspiration` → `reel-inbox.md`. Inspect sender-filtered
  pages and partial outcomes; verification requires a genuine human DM.
- **Public pastes/private context/legacy courses:** `cl-creator-hub` →
  `pastes.md`, `context-store.md`, `legacy-courses.md`. These fixed HTTP routes are
  distinct from Hub documents, Offer Studio and timeline execution. Public paste
  approval is sharing consent; course upload does not create an attachment.
- **Webinar invitations/reports:** `cl-webinars`. Matching-email self acceptance
  does not impersonate a host or join a room. Discover the fixed binary
  `GET /api/bridge/webinars/report.csv` before requesting complete attendance/funnel
  CSV; JSON report previews are not complete exports.
- **Markers/detach audio/combine/master bus/voice replacement and saved layouts:**
  `cl-editor` → `workflow-completion.md`, `audio-gain-eq.md`, `podcast-layouts.md`.
  Pin tab/project assertions, inspect snapshots/locks and save verified state.
- **Saved teleprompter, assets/styles and podcast dashboard:** `cl-production` →
  `recording-dashboard.md`, `cl-creator-styles` → `owned-library.md`. Seven saved
  teleprompter commands do not control mounted scroll/start/pause/reset. Metadata
  registration is not byte upload; dashboard status is not completed processing.
- **Mounted teleprompter, processing and studio:** `cl-production` →
  `native-runtime.md`. Use explicit `tabId` even with one tab, matching mounted
  URL and required `expectedScriptId` / `expectedSessionId`. Live teleprompter
  transport is separate from saved settings. Processing acceptance is not final
  upload/export completion; chat publication is not peer-read acknowledgment.
  Device changes require existing permission; quality changes do not start capture.
  These non-timeline controllers intentionally have no project restore, automatic
  editor save or timeline media-health probing.
- **Native board artifacts and spreadsheets:** `cl-board` →
  `native-artifacts-and-spreadsheets.md`. SVG/PDF/editable-PPTX export returns actual
  artifacts with fidelity warnings; GIF requires completed-job inspection.
  Spreadsheet prepare is not insertion; reviewed apply and board save are separate.
  Freeze frame remains an explicitly targeted video-editor timeline mutation.

Source manifests enumerate CRM32 / Calls46 / Webinars83 / Offers118 / Deals77,
290 video-renderer names and79 board names. The26-name mounted continuation adds
freeze frame1, board9, live teleprompter7, processing5 and studio4; these overlap
the owning registry counts and must not be summed as a universal execute inventory.
Source integration does not prove the installed app/deployed backend revision.

**Still missing:** editable PPTX import, permission-safe recording start, and
recording stop/chunk/upload finalization. Do not invent aliases, substitute a
timeline render, or misclassify these missing capabilities as consent alone.

## Outcomes and jobs

- Read HTTP status **and** JSON. HTTP200 can carry a failed/partial editor result.
- Known JSON commands, reviewed JSON REST routes, publishing mutations and opted-in uploads reject HTML/non-JSON “success” as uncertain. Generic JSON mutations are not automatically replayed after auth-like failures. Calls/CRM/Meta retain only their explicitly recognized pre-execution session-auth retry.
- Reconcile the saved object, attempt or job before retrying. Do not “repair” by deleting objects, switching accounts, restoring another project or resubmitting payment/publishing.
- Use only the owning feature's real job/status/cancel contract. `DELETE /api/jobs/:id` stops local progress monitoring; it does **not** cancel provider work. Native `editor.autoCaption` is a synchronous long operation with a local receipt, not a generic cancellable renderer job.
- Both `/api/batch` and `batch.execute` are sequential, **not atomic**. Inspect completed/failed entries; no rollback is promised. Execute Desktop-native long workflows separately from renderer batches.

## Portable documentation and optional helpers

`GET /api/skills` returns provenance, partial-discovery errors and `installation`: the discovered canonical root plus reviewed helper paths/availability. Root selection is explicit `CONTENTLEAD_SKILLS_DIR`, then an installed `cl-desktop`/`cl-editor` loader target, then the legacy checkout location.

Packaged public skills contain documentation/allowlisted JSON, **not** arbitrary scripts, private overlays or installed Python/model dependencies. If a helper is required, use a user-authorized public checkout in a new folder; link skills without overwriting existing directories, or set `CONTENTLEAD_SKILLS_DIR` before a separately authorized app start. No automatic clone/install/restart occurs.

Physical helper availability is not a readiness guarantee. The reviewed optional dialogue-story orchestrator is canonical-checkout-only, not a packaged executable: it requires explicit `--tab-id`/`--content-id`, live placement/readiness capability preflight and owned role tracks before composition. Its offline plan path does not connect to Desktop or run providers. Runtime/model dependencies and paid-stage approval remain separate. Pure local voice processing still needs Python/pydub/ffmpeg and explicit input/output selection.

See [workflow verification](workflows.md). Edited source, bundled docs, installed app, loaded renderer and deployed server can all be different revisions. Never claim runtime/deployment parity from source-only tests.
