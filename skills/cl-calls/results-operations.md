# Results, readiness and operations

Use [commands.md](commands.md) for every exact payload/result/default.
All side effects need specific authorization and ACK. No internal/admin routes.

## Attempts, recordings and processing

Use paged queries/detail for attempts and recordings; filter by campaign/contact,
status, date or live state using manifest-supported entity filters. Continue
until nextCursor null. `calls.call.notes` **replaces** notes; read first if
preserving existing text. `calls.call.end` requests hangup, reconcile refreshes
saved provider status and never redials. Read status after either.

`calls.agentSession.get {attemptId}` returns saved AI revision/configuration,
bounded turns, usage/status/errors; no tools/transfer or carrier token.
`calls.recording.get {id}` returns recording/transcript/segments/analysis/jobs.
Missing transcript/analysis stays missing; do not manufacture output.
`calls.recording.retry` retries archival; `calls.processing.retry` separately
authorizes paid processing under existing submission fences. UNKNOWN/timeouts
require inspection, never reset/resubmit blindly.

Private playback, scrolling/selecting transcripts and **mark reviewed** are
authenticated UI interactions. Human review/listening cannot be inferred from
a downloaded file, output existence or a successful processing job.

## Readiness, settings and analytics

`calls.workspace.get` is capped recent workspace/configuration with dialError,
dailyLimit and worker readiness, not complete history. `calls.settings.get`
returns settings, owned credential metadata and runtime models/flags.
`calls.plivo.check` verifies caller/account readiness; `calls.google.check`
checks selected owned credential APIs/access. Neither provisions anything.
Missing Desktop/web routes (404), denied capability (403), disabled operator/
worker/model (503) and unauthenticated session are **different** blockers.

`calls.settings.save` is full replacement at expectedRevision. Processing,
analysis and AI enablement require explicit data-transfer/charges approval;
selected credential must be owned. No key entry/provisioning/capability grant.
Do not modify flags/daily ceilings/worker activation to bypass a user blocker.

`calls.analytics` uses full backend date-range aggregation; send explicit-offset
ISO from/to instants, never ambiguous local dates. Totals/outcomes/storage/cost
arrays are not proof missing prices were zero or processing completed.

## Automation and safe recovery

`calls.automation.save` supports owned OFFER/COURSE/WEBINAR source/template,
delaySeconds 0–604800, enabled boolean. enabled=true is explicit activation,
not implied by saving a plan. `calls.automation.disable` stops future rule work,
not active calls. Existing opt-in/source/capability/dispatcher validation remains.
OPERATOR campaign preparation is never automatic per-person manual dispatch.

Operations state exposes policy/plans/jobs/UNKNOWN attempts/heartbeats.
Policy save is revisioned and `queued:false`; retentionDays null disables age
policy, not restores deleted data. Retention preview is a read-only exact
version/fingerprint plan; disclose skipped counts and expiration. Confirm and
resume require **`DELETE ARCHIVED CALL DATA`**, real current plan token/ID and
explicit irreversible-deletion authorization. No blind uncertain provider delete.
Attest requires actual human evidence for PROVIDER/PROVIDER_RESULTS stage;
never fabricate evidence or treat AI output as operator confirmation.

UNKNOWN resolution needs exact attempt version, real provider evidence and
**`RESOLVE UNKNOWN CALL`**. Existing PROVIDER_SID syntax supports Twilio CA
identifiers; **do not invent Plivo SID recovery support**. Resolution never
redials; NO_CALL_CREATED requires actual supporting evidence.

## Coverage boundaries

| UI surface | Honest agent support |
|---|---|
| Tabs/cards/forms/focus, picker display, drawer close, Voice Lab open | UI navigation only; manipulate saved data through documented commands, not invented commands for each widget |
| Manual per-person next/skip, browser connection, microphone/devices/mute | Prepare and progress commands plus returned handoffUrl; human click per contact |
| Live agent voice test | Existing UI microphone/relay; paid text test is separate |
| Private playback/listening approval, recording reviewed checkbox | Human UI only; no autonomous attestation |
| Voice discovery/generation | Delegate existing cl-voice, not invented calls voice-generation commands |
| Contact delete, transfer/hold/external agent tools, provider provisioning | Not supported UI functionality; no fake API coverage |
| Internal dispatch/callbacks, capability grants, processing-access administration | Intentionally not exposed to product agents |

All other current data actions map through the command reference and website's
Calls Studio UI→API→command→Desktop parity table. Never claim source coverage
as installed/deployed or exercised paid functionality.
