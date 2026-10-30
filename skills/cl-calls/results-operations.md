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
**`RESOLVE UNKNOWN CALL`**, plus `acknowledged:true` on the command.
`resolution:"PROVIDER_SID"` accepts the actual **Plivo call UUID** or **Twilio
CA+32hex SID** in `providerSid`. The server chooses the provider from the saved
attempt configuration/agent runtime, never an agent-supplied carrier.
Plivo **request UUIDs are not call UUIDs**. Inspect the provider account's actual
call record and preserve its exact call ID; do not manufacture or reformat IDs.
The read-only inspection verifies owner, reservation, version, account/caller,
destination and UTC dispatch window, then the write rechecks the locked
reservation and rejects already-used/ambiguous identifiers.
Attachment increments version but deliberately **keeps UNKNOWN**; follow with
`calls.call.reconcile {id,acknowledged:true}` to obtain the provider outcome.
Neither operation redials. NO_CALL_CREATED still requires actual supporting
evidence and cannot clear an already attached/parent call.

For an uncertain operation, first read `calls.operations.state`, then the
specific attempt/recording/job using `calls.query.detail` or the matching
recording/session reader. Preserve the same request/plan identity. A failed
proxy request is not proof the provider did nothing; do not invoke a destructive
resume, processing retry or a fresh call merely to clear the error.

Example (substitute only the inspected owned attempt/call/evidence):

```json
{"params":{"attemptId":"00000000-0000-4000-8000-000000000001","expectedVersion":3,"resolution":"PROVIDER_SID","providerSid":"00000000-0000-4000-8000-000000000123","evidence":"Actual provider account log reference, caller, recipient and UTC dispatch window verified.","confirmation":"RESOLVE UNKNOWN CALL","acknowledged":true}}
```

Invoke `POST /api/bridge/calls/commands/calls.operations.attempt.resolve`.
The example is synthetic, not proof or permission to operate on a real call.
On409, refresh the exact attempt and renew approval; never fall back to another
provider or NO_CALL_CREATED. On uncertainty, inspect saved state before any
new write. Source support requires updated website/backend deployment; no live
provider recovery is implied by installed skills.

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
