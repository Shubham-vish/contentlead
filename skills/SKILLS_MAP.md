---
name: skills-map
description: Plain-language map of every skill grouped by pipeline stage, with the "shared brains" and how the scripting skills relate. Read this first to understand what exists and which skill to load for a task.
tags: overview, index, map, scripting, relationships, help, start
---

# Skills Map — What We Have & How They Relate

> One content pipeline. Every skill plugs into one stage.
> Two skills are **shared brains** that other skills call — don't re-implement them.

```
IDEA → RESEARCH → SCRIPT → PRODUCE (edit / voice / media) → CLIP → PUBLISH
```

---

## 🧠 Shared brains (load these; never re-implement their logic)

| Skill | What it is | Who calls it |
|-------|------------|--------------|
| **`cl-desktop`** | Whole-Desktop entry router: private discovery, live capabilities/readiness, domain lifecycle routing, safe outcomes and genuine human handoffs. | start here for cross-feature ContentLead workflows |
| **`cl-virality-scoring`** | The single 0–100 virality rubric (8 signals). Medium-agnostic — judges "is this viral?" for a clip, a written script, a hook line, a post idea, or a thumbnail. | `cl-ai-clipping`, `cl-script-evaluator`, `cl-dialogue-story`, `cl-content-style` |
| **`cl-editor`** | Master router for the ContentLead desktop video editor (290 source renderer names, including native freeze frame; verify live capabilities). Load first before any editor command; it explains the local HTTP API. | every skill that touches the editor |
| **`cl-production`** | Reviewed episode clipping, discovery, podcast camera/director/sync, tightening, derived drafts, finishing recipes and delivery through desktop commands. | `cl-ai-clipping`, `cl-editor`, podcast production agents |
| **`cl-board`** | ContentLead Boards via the Desktop bridge: diagrams, staged mindmap reveal and whole-branch controls, connector routing/patterns/markers, search-and-reveal, screenshots, saving, command discovery, and library web API reference. Do NOT use for video editing. | any skill that needs to draw or arrange on a canvas |

**Rule:** if you need to score how viral something is, load `cl-virality-scoring`. Do NOT write ad-hoc scoring heuristics anywhere else.

---

## ✍️ Scripting cluster (READ THIS — for the scripting agent)

These three chain together. They do **not** overlap — each owns a different question:

| Skill | Owns the question | What it does |
|-------|-------------------|--------------|
| **`cl-content-style`** | *Whose voice?* | Stores a creator's personal voice (extracted from their sample scripts, saved in Cosmos). **Remixes** any inspiration content into that voice. |
| **`cl-script-evaluator`** | *How good is the craft?* | Two modes — **write** a viral script from scratch, and **score/rewrite** an existing script. |
| **`cl-virality-scoring`** | *Will it pop?* | The shared 0–100 verdict both of the above call. |

### The scripting flow

```
cl-content-style (voice)  →  cl-script-evaluator (craft polish)  →  cl-virality-scoring (verdict)
       │                                                            ▲
       └──────────────── scores its own remix output ──────────────┘
```

- The `cl-content-style` workflow creates a caller-generated draft in the user's voice, saves it through its REST remix route, scores it with `cl-virality-scoring`, then hands it to `cl-script-evaluator` for polish. This is not an executable editor alias.
- `cl-script-evaluator` writing a fresh script also calls `cl-virality-scoring` at Step 1.
- **`cl-dialogue-story`** is the special case: two-character dialogue reels (Modi–Rahul format) for any topic. It also scores via `cl-virality-scoring`.

**One-paragraph brief for the scripting agent:**
> We have a shared virality brain (`cl-virality-scoring`) — never write your own scoring logic, load it. For scripting: `cl-script-evaluator` both **writes** and **scores** scripts; `cl-content-style` captures a specific creator's **voice** and **remixes** inspiration into it, then scores via `cl-virality-scoring` and hands drafts to `cl-script-evaluator` for polish. So the flow is **cl-content-style (voice) → cl-script-evaluator (craft) → cl-virality-scoring (verdict)**. `cl-dialogue-story` is the two-character-reel special case.

---

## 🔎 Research / Inspiration

| Skill | Use it to |
|-------|-----------|
| **`cl-content-inspiration`** | Research trends; scrape/analyze competitor content across IG, YouTube, X, Reddit; transcribe/download source videos. Feeds ideas + transcripts into scripting. |
| **`cl-ad-intelligence`** | Search & analyze competitor ads from the Meta Ad Library; track brands; save ads to folders. |
| **`cl-meta-ads`** | Owned Meta Ads read-only Insights, human-approved OAuth, account/dataset selection, sync/jobs, unified owner-scoped offer tracking and verified seller-ledger/delivery diagnostics. Optional typed custom interactions and central all/multi-offer event journal; [workflow](cl-meta-ads/events-and-custom.md). No campaign, budget, pause or spend commands. [Schemas and examples](cl-meta-ads/commands.md). |

---

## 🎬 Production (turn a script into a video)

| Skill | Use it to |
|-------|-----------|
| **`cl-content-direction`** | Creative strategy, storyboarding, narrative arcs, SFX/audio-layering plan, track management. The "director" layer. |
| **`cl-ai-media`** | AI image search / generation / compose / vision analysis; text generation. Sources visuals. |
| **`cl-ai-generate`** | Generate video/images through discoverable `aiVideo.*` commands; pending jobs and candidates appear in AI Generate. Poll with jobId + progressId, then add to an explicitly targeted track and save. Veo, Omni, NanoBanana and BYOK. |
| **`cl-ai-video`** | 23 authenticated AI Video Studio HTTP commands: models, Reference Kits, prompt enhancement/presets, estimates, generation, jobs and saved candidates. Distinct from the six editor `aiVideo.*` commands; use `cl-ai-generate` for editor integration and timeline placement. |
| **`cl-voice`** | Desktop Voice Lab bridge: speech/history/clones; Replace Voice with selected-trim transcription, local Hindi word matching, one-time setup, selected-word resync/nudges/undo, and Advanced timing. Add audio with measured duration + explicit track intent. |
| **`cl-audio`** | Local audio processing — vocal/music stem separation, cleanup. |
| **`cl-dialogue-broll`** | Add word-timed B-roll images/scenes that pop in as concepts are spoken (any clip). Reuses word-level transcript + `cl-ai-media`. |
| **`cl-creator-styles`** | Browse / inspect / subset / compose the SkillTown visual style templates (10 creator styles). The *visual* look — distinct from `cl-content-style` (which is the *voice*). |
| **`cl-remotion`** | Author custom Remotion scenes (animations, effects, charts, transitions) to add to the editor timeline. |

---

## ✂️ Clipping

| Skill | Use it to |
|-------|-----------|
| **`cl-ai-clipping`** | Turn a long video (podcast/interview) into viral vertical clips: transcribe → score with `cl-virality-scoring` → extract → reframe 9:16 → caption → render. |

---

## 📤 Publishing

| Skill | Use it to |
|-------|-----------|
| **`cl-content-publishing`** | End-to-end publish: create content, set metadata, upload video, configure channels, set CTA, post to Instagram / YouTube / LinkedIn, poll status. |

---

## 💸 Offers (sales pages, checkout, thank-you, email)

| Skill | Use it to |
|-------|-----------|
| **`cl-offers`** | 118 source-manifest native commands: Offer Studio pages/checkout/delivery/email/tracking, seller fulfillment, buyer purchases/reaccess/private files, subscriptions/invoices and billing. [Exact schemas](cl-offers/commands.json). Explicit outer confirmation where documented; mandate consent/payment, refunds and administrator billing/access policy remain their authorized UI flows. |
| **`cl-creator-biopage`** | Build, theme, and publish a creator's personalized public bio page at `contentlead.in/<handle>` (link-in-bio / storefront) — typed allowlisted sections + starter kits + theme vibes + AI generate-from-profile + draft/publish, all via `/api/storefront/commands/*`. Sibling to `cl-offers`; `shopOffers` surfaces the creator's offers. |
| **`cl-creator-hub`** | Build and manage a creator's documentation / knowledge-base Hub at `contentlead.in/hub/<handle>` — create/organize/publish nested FOLDERS + markdown DOCS, list the tree, read a doc, move/delete, and AI-generate a doc from a topic, all via `/api/hub/commands/*`. Sibling to `cl-creator-biopage` (bio page) and `cl-offers` (sales pages); owns the docs hub, not the bio page or checkout. |

---

## 🤝 Deals / Creator Marketplace

| Skill | Use it to |
|-------|-----------|
| **`cl-deals`** | 77 source-manifest native commands: role-scoped campaigns, applications/submissions, creative drafts, inbox/history, funding/proof, balances/reporting, affiliate configuration/imports and creator withdrawal requests. [Exact schemas](cl-deals/commands.json), [payloads](cl-deals/payloads.md). Bounded local proof/asset uploads; explicit confirmation for financial/lazy-mutating actions; REQUESTED is not PAID; no generic payment RPC. |

---

## ☎️ Calls Studio

| Skill | Use it to |
|-------|-----------|
| **`cl-calls`** | 46 source-manifest commands in the [Calls router](cl-calls/SKILL.md) with grouped workflows and [exact schemas/examples](cl-calls/commands.md): recipients/context/imports, agents/tests, AI/recorded/manual campaigns, audio/script previews/personalization, results, analytics/settings/automation/retention/recovery. No inferred consent; manual Call next/skip, microphone/live voice and listening approval remain human UI handoffs. |

---

## 🤝 CRM

| Skill | Use it to |
|-------|-----------|
| **`cl-crm`** | 32 JSON commands (18 reads/14 acknowledged writes): scoped contacts/timeline, bounded complete CSV, revision-aware approved bulk operations, opportunities/summary, tasks, notes/activity, source linking and customer context. Owner/platform-admin boundaries remain distinct; fresh platform-ADMIN WhatsApp inspection, exact approved replies and reviewed mark-read, plus a separate fixed stored-message binary media GET route, are [support-only, not owner messaging](cl-crm/support-inbox.md). [Schemas/examples](cl-crm/commands.md). Route Calls to `cl-calls`; consent and billing/access writes remain their existing authorized tools/UI. |

---

## 🌐 Creator Apps (static app hosting)

| Skill | Use it to |
|-------|-----------|
| **`cl-apps`** | Upload, host and manage a creator's **Creator Apps** — static sites / SPAs served at `contentlead.in/apps/<slug>`. Owns the whole catalogue: upload/replace a local folder or `.zip` (`/api/bridge/apps/upload-local`), list/inspect, rename + set slug + set entry file, publish/unpublish, get public URL, get an owner-only styled draft **preview**, create/revoke an unlisted **share link**, and delete — all via the desktop bridge `apps.*` command bus. NOT the desktop video editor (`cl-editor`), NOT sales pages (`cl-offers`), NOT the bio page (`cl-creator-biopage`), NOT the docs hub (`cl-creator-hub`). |

---

## 🎥 Meetings & Webinars (live, pre-recorded, repeat series)

Source manifest: **83 commands**, including matching-email invitation acceptance.
Discover the installed fixed binary CSV export separately from JSON previews.

| Skill | Use it to |
|-------|-----------|
| **`cl-webinars`** | Run a creator's **meetings and webinars** end-to-end from an agent via the desktop bridge `webinar.*` command bus (`/api/bridge/webinars/commands/*` → `/api/sessions/commands/*`): create/schedule/update/cancel/duplicate, start/end, **pre-recorded (broadcast) webinars** (upload a local video with `/api/bridge/webinars/upload-video`, reuse a past recording, waiting-screen image + music), **test runs**, repeat series on picked dates, branded emails, registrations/invites, polls/Q&A/chat/CTA moderation, recordings/replay, attendance + funnel analytics. Commands reuse the exact web route handlers (same auth, quotas, rate limits). NOT the video editor (`cl-editor`), NOT podcast clipping (`cl-production`). |

---

## 🛠️ Ops / Entry docs

| Doc / Skill | Purpose |
|-------------|---------|
| **`cl-desktop`** | Whole-product startup and lifecycle routing; live capability/readiness checks, safe outcomes, helper installation and human handoffs. |
| **`overview.md`** | All editor capabilities by category + how the local HTTP API works. Load first for editor control. |
| **`getting-started.md`** | Quick-start walkthrough. |
| **`orchestration-e2e.md`** | Full end-to-end orchestration example across skills. |
| **`cl-testing`** | Agent-run testing of the ContentLead desktop editor. |

---

## Quick "which skill do I load?" cheat sheet

### Phase-3 source inventory and newly routed workflows

These are source manifest counts, not proof of installed/deployed capability:
CRM **32**, Calls **46**, Webinars **83**, Offers **118**, Deals **77**;
video renderer **290** names (not the whole Desktop catalog), including
14 initial workflow/layout commands, native freeze frame and three restored
editable-scene dispatches. Boards have **79** source registry names, including
9 native artifact/spreadsheet commands. The integrated26-name continuation
comprises freeze frame1, board9, live teleprompter7, dashboard processing5 and
studio4. Saved teleprompter's **7** native HTTP commands remain a separate surface.
These counts do not certify installed/deployed/runtime parity.
Discover each installed endpoint/manifest and live renderer before use.

| Workflow | Owner / reference |
|---|---|
| Buyer purchases, reaccess/private files; seller delivery and private product upload | `cl-offers` → [fulfillment](cl-offers/fulfillment.md); tokens/URLs stay private, approved mutations never auto-replay |
| Affiliate terms/conversion imports and creator withdrawal requests | `cl-deals` → [payloads](cl-deals/payloads.md); REQUESTED is not PAID |
| Account/social connection maintenance | `cl-content-publishing` → [account maintenance](cl-content-publishing/account-maintenance.md); OAuth remains human |
| Reel Inbox and genuine DM verification | `cl-content-inspiration` → [Reel Inbox](cl-content-inspiration/reel-inbox.md) |
| Public pastes, private Context Store, legacy courses/chapter resources/offers | `cl-creator-hub` → [pastes](cl-creator-hub/pastes.md), [context](cl-creator-hub/context-store.md), [legacy courses](cl-creator-hub/legacy-courses.md); distinct from Hub |
| Matching-email webinar invitation acceptance and complete binary CSV | `cl-webinars`; discover `GET /api/bridge/webinars/report.csv`, not a JSON preview |
| Markers, detach audio, combine/uncombine, master bus and voice replacement | `cl-editor` → [workflow completion](cl-editor/workflow-completion.md); explicit project assertions and save |
| Saved teleprompter, podcast dashboard, assets and owned layouts/styles | `cl-production` → [dashboard](cl-production/recording-dashboard.md), `cl-creator-styles` → [owned library](cl-creator-styles/owned-library.md); saved metadata is not capture/processing/player transport |
| Mounted teleprompter transport, local podcast processing and studio devices/chat | `cl-production` → [native runtime](cl-production/native-runtime.md); explicit tab plus exact script/session assertion and matching mounted URL. Accepted processing invocation is not completed output |
| Native board SVG/PDF/editable-PPTX/GIF artifacts and spreadsheet prepare/apply | `cl-board` → [artifacts and spreadsheets](cl-board/native-artifacts-and-spreadsheets.md); preserve fidelity warnings, job completion and separate board save |

Still-open crucial operations: editable PPTX **import**, recording start, and
recording stop/chunk/upload finalization. They are not advertised commands or
reclassified as human-only. Native editable PPTX export is not editable import.

| I want to… | Load |
|------------|------|
| Score how viral anything is | `cl-virality-scoring` |
| Write / rate a script | `cl-script-evaluator` (+ `cl-virality-scoring`) |
| Write in a specific creator's voice / remix a reel | `cl-content-style` |
| Make a two-character dialogue reel | `cl-dialogue-story` |
| Research trends / competitors | `cl-content-inspiration`, `cl-ad-intelligence` |
| Talk to the editor at all | `cl-editor` (first), then `overview.md` |
| Draw on a whiteboard / build a diagram, mind map, or slide deck | `cl-board` |
| Add images / generate visuals | `cl-ai-media`, `cl-dialogue-broll` |
| Clone a voice / TTS | `cl-voice` |
| Create / schedule / run a webinar or meeting, pre-recorded or live | `cl-webinars` |
| Split stems / clean audio | `cl-audio` |
| Apply a visual style template | `cl-creator-styles` |
| Build a custom animated scene | `cl-remotion` |
| Cut a long video into clips | `cl-ai-clipping` |
| Publish to IG / YT / LinkedIn | `cl-content-publishing` |
| Plan the creative / storyboard | `cl-content-direction` |
