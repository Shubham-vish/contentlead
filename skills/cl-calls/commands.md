# Calls command reference

Generated from the executable Zod registry by `node scripts/sync-calls-reference.cjs` in the website source. Do not hand-edit. 46 commands.

## Transport, errors and examples

Discover `GET /api/bridge/calls/commands` → `{ok:true,data:{version,commands,queryFilters,querySorts,limits,humanOnly,excluded}}`. Live manifest is authoritative; this checked reference is a release snapshot, not proof of installed/deployed support.

Every command below uses **POST** `/api/bridge/calls/commands/<exact-name>` with `{params:{...}}`. Desktop forwards to **POST** `/api/calls/commands/<exact-name>`, then the authorized user API shown per command. Responses: `{ok:true,data:<result below>}` or HTTP error `{ok:false,error}`; transport may return `{error,message}`. No identity/provider secrets in parameters. Outer JSON limit: 300000 bytes. Existing downstream serialized-input limits also apply: backend text test/reset 64000 characters, other backend actions 16000; personalization 200000; operations 64000. Shared previews obey their field/table bounds. Bridge timeout 180 seconds; paid text test backend budget 150 seconds.

All mutations require `acknowledged:true` after specific human authorization. Examples are synthetic schema-valid payloads, NOT permission to execute; hydrate owned UUIDs, revisions, history and review/preview tokens from real read results first. Example review/import tokens deliberately are not valid server tokens. Schema-valid does not mean authorized or executable. Nested required fields are required only when their parent is supplied. Unknown fields rejected. Effects/refinements (consent evidence, context size/reserved keys, unique audience, valid entity filters and actual ownership) also apply; see workflows.

Common errors for every command: 400 invalid schema; 401 confirmed session rejection (at most one Desktop refresh); 403 capability/origin denied; 404 unavailable/unowned item or missing release; 409 stale/conflicting/UNKNOWN result; 413 size bound; 429 quota; 503 runtime disabled. HTML 502/504, transport loss and ambiguous 403 never replay mutations. Preserve request identities and inspect saved state before any uncertain retry. Canary cap is not authorization. Read-only previews never write, dial or charge.

## calls.contact.save

Workflow: [contacts-agents](contacts-agents.md). User API: **POST** `/api/calls`, action `contact.save`. **Mutation; explicit ACK required.**

Create/update a full contact form; not a patch. Never infer consent; true permission flags also require human consentAttestation and actual purpose/evidence.

Returns: Create: saved contact including id. Update: {id}; hydrate detail afterwards. 409 duplicate phone.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | optional | string; format=uuid |
| `data` | required | object (fields below) |
| `data.name` | required | string; minLength=1; maxLength=200 |
| `data.phone` | required | string; pattern=^\+91[6-9]\d{9}$ |
| `data.email` | optional | string; format=email; maxLength=254 OR "" |
| `data.consentPurpose` | optional | string; maxLength=500; default="" |
| `data.consentEvidence` | optional | string; maxLength=4000; default="" |
| `data.consent` | optional | boolean; default=false |
| `data.recordingConsent` | optional | boolean; default=false |
| `data.doNotCall` | optional | boolean; default=false |
| `data.pronunciation` | optional | string; maxLength=200; default="" |
| `data.context` | optional | map<string, string; maxLength=2000>; default={} |
| `acknowledged` | required | true |
| `consentAttestation` | optional | string; minLength=20; maxLength=4000 |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "data": {
      "name": "Synthetic recipient",
      "phone": "+919876543210",
      "context": {
        "topic": "Demo"
      }
    },
    "acknowledged": true
  }
}
```

## calls.contact.suppress

Workflow: [contacts-agents](contacts-agents.md). User API: **POST** `/api/calls`, action `contact.suppress`. **Mutation; explicit ACK required.**

Record DNC and revoke calling consent.

Returns: {saved:true}; 404 unavailable contact.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; format=uuid |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000001",
    "acknowledged": true
  }
}
```

## calls.campaign.save

Workflow: [campaigns](campaigns.md). User API: **POST** `/api/calls`, action `campaign.save`. **Mutation; explicit ACK required.**

Save/update DRAFT with owned audience and assets; no dial. Stable draftKey for new-save recovery; mode OPERATOR is a manual queue. Unique recipients only.

Returns: {id}; 409 stale/non-DRAFT/automation-fenced edit; maximum 100 recipients.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | optional | string; format=uuid |
| `draftKey` | optional | string; format=uuid |
| `data` | required | object (fields below) |
| `data.name` | required | string; minLength=1; maxLength=200 |
| `data.purpose` | required | string; maxLength=500 |
| `data.mode` | required | "RECORDED" / "OPERATOR" / "AGENT" |
| `data.sharedAssetId` | optional | string; format=uuid OR null |
| `data.agentId` | optional | string; format=uuid OR null |
| `data.scheduledAt` | optional | string; format=date-time OR null |
| `data.maxDuration` | optional | integer; minimum=30; maximum=1800; default=300 |
| `data.recipients` | required | array<object (fields below)>; maxItems=100 |
| `data.recipients[].contactId` | required | string; format=uuid |
| `data.recipients[].assetId` | optional | string; format=uuid OR null |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "data": {
      "name": "Synthetic manual queue",
      "purpose": "Requested demo",
      "mode": "OPERATOR",
      "scheduledAt": null,
      "recipients": [
        {
          "contactId": "00000000-0000-4000-8000-000000000001"
        }
      ]
    },
    "acknowledged": true,
    "draftKey": "00000000-0000-4000-8000-000000000001"
  }
}
```

## calls.campaign.review

Workflow: [campaigns](campaigns.md). User API: **POST** `/api/calls`, action `campaign.review`. **Read-only; no ACK.**

Read exact current review and all per-person blockers. Review token is not launch permission.

Returns: {token,revision,callerNumber,scheduledAt,mode,purpose,maxDuration,agentRevision,blockers,dailyRemaining,recipients}.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; format=uuid |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000001"
  }
}
```

## calls.campaign.manual.progress

Workflow: [campaigns](campaigns.md). User API: **POST** `/api/calls`, action `campaign.manual.progress`. **Read-only; no ACK.**

Read durable manual audience, eligibility and current attempt; open returned relative handoffUrl for HUMAN Call next/skip.

Returns: {id,handoffUrl,name,status,revision,purpose,scheduledAt,rows,nextContactId,activeAttempt,completed,total}; no token or dial.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; format=uuid |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000001"
  }
}
```

## calls.campaign.launch

Workflow: [campaigns](campaigns.md). User API: **POST** `/api/calls`, action `campaign.launch`. **Mutation; explicit ACK required.**

Require explicit approval of exact current review. RECORDED/AGENT queue paid calls; OPERATOR only prepares MANUAL_READY, with no attempts.

Returns: {id,queued,manual?:true}; OPERATOR queued=0; 409 stale review/revision; 503 provider runtime.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; format=uuid |
| `expectedRevision` | required | integer; exclusiveMinimum=0 |
| `reviewToken` | required | string; minLength=64; maxLength=64 |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000001",
    "expectedRevision": 1,
    "reviewToken": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "acknowledged": true
  }
}
```

## calls.campaign.cancel

Workflow: [campaigns](campaigns.md). User API: **POST** `/api/calls`, action `campaign.cancel`. **Mutation; explicit ACK required.**

Cancel future queued campaign work; active call must be ended separately.

Returns: {canceled:true,message}.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; format=uuid |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000001",
    "acknowledged": true
  }
}
```

## calls.agent.save

Workflow: [contacts-agents](contacts-agents.md). User API: **POST** `/api/calls`, action `agent.save`. **Mutation; explicit ACK required.**

Create/update instructions and increment saved revision. No test or dial; tools empty and handoff disabled.

Returns: Create: saved agent including id/revision. Update: {id}; query detail for new revision.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | optional | string; format=uuid |
| `data` | required | object (fields below) |
| `data.name` | required | string; minLength=1; maxLength=200 |
| `data.instructions` | required | string; minLength=1; maxLength=12000 |
| `data.greeting` | optional | string; maxLength=2000; default="" |
| `data.language` | optional | "hi-IN" / "en-IN"; default="hi-IN" |
| `data.voice` | optional | "hi-IN-Standard-A" / "en-IN-Standard-A" OR null |
| `data.guardrails` | optional | object (fields below); default={} |
| `data.guardrails.maxTurns` | optional | integer; minimum=1; maximum=30; default=20 |
| `data.guardrails.maxTokens` | optional | integer; minimum=1000; maximum=30000; default=30000 |
| `data.tools` | optional | array<unknown>; maxItems=0; default=[] |
| `data.handoff` | optional | object (fields below); default={"enabled":false} |
| `data.handoff.enabled` | required | false |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "data": {
      "name": "Synthetic follow-up",
      "instructions": "Discuss only the requested demo. Respect opt-outs.",
      "language": "en-IN",
      "tools": [],
      "handoff": {
        "enabled": false
      }
    },
    "acknowledged": true
  }
}
```

## calls.automation.save

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls`, action `automation.save`. **Mutation; explicit ACK required.**

Create/update owned opt-in source/template rule. enabled=true is explicit activation; disabled save does not authorize later activation.

Returns: Saved automation with id/revision; provider/capability/source validation unchanged.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | optional | string; format=uuid |
| `data` | required | object (fields below) |
| `data.name` | required | string; minLength=1; maxLength=200 |
| `data.sourceType` | required | "OFFER" / "COURSE" / "WEBINAR" |
| `data.sourceId` | required | string; minLength=1; maxLength=200 |
| `data.campaignId` | required | string; format=uuid |
| `data.delaySeconds` | required | integer; minimum=0; maximum=604800 |
| `data.enabled` | required | boolean |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "data": {
      "name": "synthetic",
      "sourceType": "OFFER",
      "sourceId": "synthetic",
      "campaignId": "00000000-0000-4000-8000-000000000001",
      "delaySeconds": 0,
      "enabled": false
    },
    "acknowledged": true
  }
}
```

## calls.automation.disable

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls`, action `automation.disable`. **Mutation; explicit ACK required.**

Disable owned automation; does not hang up active calls.

Returns: {disabled:true}; 404 unavailable rule.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; format=uuid |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000001",
    "acknowledged": true
  }
}
```

## calls.call.start

Workflow: [campaigns](campaigns.md). User API: **POST** `/api/calls`, action `call.start`. **Mutation; explicit ACK required.**

Immediately start a separately authorized paid RECORDED/AGENT call. requestKey is stable UUID. OPERATOR is forbidden: use human UI.

Returns: {id,mode}; 403 strict access; 409 consent/window/active or UNKNOWN conflict; 503 missing runtime.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `contactId` | required | string; format=uuid |
| `assetId` | required | string; format=uuid OR null |
| `agentId` | optional | string; format=uuid OR null |
| `mode` | required | "RECORDED" / "AGENT" |
| `purpose` | required | string; minLength=1; maxLength=500 |
| `requestKey` | required | string; format=uuid |
| `maxDuration` | required | integer; minimum=30; maximum=1800 |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "contactId": "00000000-0000-4000-8000-000000000001",
    "assetId": null,
    "mode": "AGENT",
    "purpose": "Requested demo",
    "requestKey": "00000000-0000-4000-8000-000000000001",
    "maxDuration": 300,
    "acknowledged": true,
    "agentId": "00000000-0000-4000-8000-000000000001"
  }
}
```

## calls.call.end

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls`, action `call.end`. **Mutation; explicit ACK required.**

Request hangup of owned active attempt; not proof provider completed it.

Returns: {requested:true}; inspect attempt status afterwards.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; format=uuid |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000001",
    "acknowledged": true
  }
}
```

## calls.call.reconcile

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls`, action `call.reconcile`. **Mutation; explicit ACK required.**

Refresh owned provider status; never redial UNKNOWN.

Returns: {refreshed:true}; inspect saved attempt.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; format=uuid |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000001",
    "acknowledged": true
  }
}
```

## calls.call.notes

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls`, action `call.notes`. **Mutation; explicit ACK required.**

Replace owned attempt notes (not append).

Returns: {saved:true}; 404 unavailable attempt.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; format=uuid |
| `notes` | required | string; maxLength=8000 |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000001",
    "notes": "synthetic",
    "acknowledged": true
  }
}
```

## calls.recording.retry

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls`, action `recording.retry`. **Mutation; explicit ACK required.**

Retry existing recording archival only; inspect uncertainty first.

Returns: {saved:true}; 404 unavailable recording. Does not grant listening review.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; format=uuid |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000001",
    "acknowledged": true
  }
}
```

## calls.agent.test

Workflow: [contacts-agents](contacts-agents.md). User API: **POST** `/api/calls/backend`, action `agent.test`. **Mutation; explicit ACK required.**

Paid text simulation, not voice or telephone verification. Keep sessionId/requestId stable on uncertainty; draft is the test instructions, not an agent ID.

Returns: {sessionId,requestId,reply,ended,reason,tokens,tokensRemaining,turnsRemaining,dailyTurnsRemaining}; 429 budget; 503 runtime.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `sessionId` | required | string; format=uuid |
| `requestId` | required | string; format=uuid |
| `credentialId` | required | string; minLength=1; maxLength=191 |
| `model` | required | string; minLength=1; maxLength=100 |
| `purpose` | required | string; minLength=1; maxLength=500 |
| `draft` | required | object (fields below) |
| `draft.instructions` | required | string; minLength=1; maxLength=12000 |
| `draft.greeting` | required | string; maxLength=2000 |
| `draft.language` | required | "hi-IN" / "en-IN" |
| `draft.maxTurns` | required | integer; minimum=1; maximum=30 |
| `draft.maxTokens` | required | integer; minimum=1000; maximum=30000 |
| `history` | required | array<object (fields below)>; maxItems=24 |
| `history[].role` | required | "user" / "model" |
| `history[].text` | required | string; minLength=1; maxLength=2000 |
| `text` | required | string; minLength=1; maxLength=2000 |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "sessionId": "00000000-0000-4000-8000-000000000001",
    "requestId": "00000000-0000-4000-8000-000000000001",
    "credentialId": "synthetic-owned-credential",
    "model": "choose-from-settings-runtime-models",
    "purpose": "Requested demo",
    "draft": {
      "instructions": "Discuss only the requested demo.",
      "greeting": "Hello",
      "language": "en-IN",
      "maxTurns": 12,
      "maxTokens": 6000
    },
    "history": [],
    "text": "What is the requested demo about?",
    "acknowledged": true
  }
}
```

## calls.agent.test.reset

Workflow: [contacts-agents](contacts-agents.md). User API: **POST** `/api/calls/backend`, action `agent.test.reset`. **Mutation; explicit ACK required.**

Explicitly reset text-test session state, not the daily quota. Never reset to escape an uncertain paid turn.

Returns: {reset:true}.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "acknowledged": true
  }
}
```

## calls.plivo.check

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls/backend`, action `plivo.check`. **Read-only; no ACK.**

Read owned caller/account readiness; no provisioning or call.

Returns: {provider,authenticated,numberCount,callerNumber,callerReady,callingEnabled,blockers,checkedAt}.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| — | — | no parameters |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {}
}
```

## calls.settings.save

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls/backend`, action `settings.save`. **Mutation; explicit ACK required.**

Replace settings at expectedRevision; processing/analysis/AI enablement requires explicit charges/data-transfer approval. No provisioning/capability grant.

Returns: {settings}; 409 revision conflict; 403 capability; 503 runtime.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `settings` | required | object (fields below) |
| `settings.credentialId` | required | string; minLength=1; maxLength=191 OR null |
| `settings.model` | required | string; maxLength=100 |
| `settings.language` | required | "hi-IN" / "en-IN" |
| `settings.speechBucket` | required | string; maxLength=222 |
| `settings.processingEnabled` | required | boolean |
| `settings.analysisEnabled` | required | boolean |
| `settings.aiEnabled` | required | boolean |
| `settings.retentionDays` | required | integer; minimum=1; maximum=3650 OR null |
| `expectedRevision` | required | integer; minimum=0 |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "settings": {
      "credentialId": "synthetic",
      "model": "synthetic",
      "language": "hi-IN",
      "speechBucket": "synthetic",
      "processingEnabled": false,
      "analysisEnabled": false,
      "aiEnabled": false,
      "retentionDays": 1
    },
    "expectedRevision": 0,
    "acknowledged": true
  }
}
```

## calls.google.check

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls/backend`, action `google.check`. **Read-only; no ACK.**

Check APIs/access for selected owned credential metadata ID; no enablement/provisioning.

Returns: {projectId,services:Record<string,boolean>,message}.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `credentialId` | required | string; minLength=1; maxLength=191 |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "credentialId": "synthetic"
  }
}
```

## calls.processing.retry

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls/backend`, action `processing.retry`. **Mutation; explicit ACK required.**

Explicit paid processing retry using existing submission/recovery fences.

Returns: {queued}; 503 disabled runtime; UNKNOWN cannot be blindly resubmitted.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; format=uuid |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000001",
    "acknowledged": true
  }
}
```

## calls.analytics

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls/backend`, action `analytics`. **Read-only; no ACK.**

Read full backend range aggregation with explicit-offset ISO instants, not recent snapshot totals.

Returns: {from,to,attempts,seconds,outcomes:[{status,attempts,seconds}],recordings:[{storageStatus,recordings}],costs:[{currency,amount,pricedAttempts}]}.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `from` | required | string; format=date-time |
| `to` | required | string; format=date-time |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "from": "2026-12-01T00:00:00+05:30",
    "to": "2026-12-02T00:00:00+05:30"
  }
}
```

## calls.personalization.state

Workflow: [audio-personalization](audio-personalization.md). User API: **POST** `/api/calls/personalization`, action `state`. **Read-only; no ACK.**

Read global saved draft, job items and runtime. Not implicitly the current campaign audience.

Returns: {draft:{revision,spec}|null,jobs:[{id,revision,status,createdAt,sourcesChanged?,items:[{contactId,status,phase,nameAssetId,outputAssetId,error,historyId}]}],runtime:{enabled,generationEnabled}}.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| — | — | no parameters |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {}
}
```

## calls.personalization.draft.save

Workflow: [audio-personalization](audio-personalization.md). User API: **POST** `/api/calls/personalization`, action `draft.save`. **Mutation; explicit ACK required.**

Save exact requested audience/spec at expectedRevision. No generation. Changing sources invalidates old output selection.

Returns: Same state as personalization.state with new draft revision; 409 conflict/active job.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `expectedRevision` | required | integer; minimum=0 |
| `spec` | required | object (fields below) |
| `spec.a` | required | string; format=uuid OR null |
| `spec.c` | required | string; format=uuid OR null |
| `spec.aText` | required | string; maxLength=5000 |
| `spec.cText` | required | string; maxLength=5000 |
| `spec.selected` | required | array<string; format=uuid>; maxItems=500 |
| `spec.names` | required | map<string, string; format=uuid> |
| `spec.voiceId` | required | string; maxLength=200 |
| `spec.segments` | optional | array<object (fields below) OR object (fields below)>; minItems=1; maxItems=8 |
| `spec.segments[](variant 1).kind` | required | "audio" |
| `spec.segments[](variant 1).assetId` | required | string; format=uuid OR null |
| `spec.segments[](variant 1).text` | required | string; maxLength=5000 |
| `spec.segments[](variant 2).kind` | required | "speech" |
| `spec.segments[](variant 2).template` | required | string; maxLength=5000 |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "expectedRevision": 0,
    "spec": {
      "a": null,
      "c": null,
      "aText": "",
      "cText": "",
      "selected": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "names": {},
      "voiceId": "synthetic-owned-voice",
      "segments": [
        {
          "kind": "speech",
          "template": "Hello {{name}}"
        }
      ]
    },
    "acknowledged": true
  }
}
```

## calls.personalization.job.start

Workflow: [audio-personalization](audio-personalization.md). User API: **POST** `/api/calls/personalization`, action `job.start`. **Mutation; explicit ACK required.**

Submit authorized missing paid speech/assembly for exact saved revision. Preserve requestId. No automatic listening approval.

Returns: Same personalization state; 409 stale revision/source/unknown submission; 503 disabled generation/execution.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `expectedRevision` | required | integer; exclusiveMinimum=0 |
| `requestId` | required | string; format=uuid |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "expectedRevision": 1,
    "requestId": "00000000-0000-4000-8000-000000000001",
    "acknowledged": true
  }
}
```

## calls.personalization.job.pause

Workflow: [audio-personalization](audio-personalization.md). User API: **POST** `/api/calls/personalization`, action `job.pause`. **Mutation; explicit ACK required.**

Stop future work; submitted generation can finish and be billed.

Returns: Same personalization state; existing job/item phases retained.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; minLength=1; maxLength=191 |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "synthetic",
    "acknowledged": true
  }
}
```

## calls.personalization.job.cancel

Workflow: [audio-personalization](audio-personalization.md). User API: **POST** `/api/calls/personalization`, action `job.cancel`. **Mutation; explicit ACK required.**

Cancel unfinished future work; cannot undo submitted paid generation.

Returns: Same personalization state; already saved audio retained.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; minLength=1; maxLength=191 |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "synthetic",
    "acknowledged": true
  }
}
```

## calls.personalization.job.resume

Workflow: [audio-personalization](audio-personalization.md). User API: **POST** `/api/calls/personalization`, action `job.resume`. **Mutation; explicit ACK required.**

Resume safe unfinished stages only after renewed authorization; never resubmit unknown paid work.

Returns: Same personalization state; source hashes and unknown-submission fences remain authoritative.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; minLength=1; maxLength=191 |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "synthetic",
    "acknowledged": true
  }
}
```

## calls.operations.state

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls/operations`, action `state`. **Read-only; no ACK.**

Read retention policy/plans, processing jobs, unknown attempts and worker heartbeats.

Returns: {enabled,policy,plans,jobs,unknownAttempts,heartbeats}.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| — | — | no parameters |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {}
}
```

## calls.operations.policy.save

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls/operations`, action `policy.save`. **Mutation; explicit ACK required.**

Save retention policy revision only; null disables age policy. Does not queue deletion.

Returns: {policy,queued:false}; 409 revision conflict.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `expectedRevision` | required | integer; minimum=0 |
| `retentionDays` | required | integer; minimum=1; maximum=3650 OR null |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "expectedRevision": 0,
    "retentionDays": 1,
    "acknowledged": true
  }
}
```

## calls.operations.retention.preview

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls/operations`, action `retention.preview`. **Read-only; no ACK.**

Dry-run exact eligible archived versions/fingerprints; no deletion or policy write.

Returns: {dryRun:true,enabled,policy,items,skipped,scanned,scanLimit,expiresAt,planToken:string|null}.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| — | — | no parameters |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {}
}
```

## calls.operations.retention.confirm

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls/operations`, action `retention.confirm`. **Mutation; explicit ACK required.**

Irreversible exact-plan deletion, only after explicit user request and typed confirmation. Token expires.

Returns: {plan:{id,status,items,policyRevision,...}}; 409 changed/expired plan.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `planToken` | required | string; minLength=1; maxLength=32000 |
| `confirmation` | required | "DELETE ARCHIVED CALL DATA" |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "planToken": "synthetic",
    "confirmation": "DELETE ARCHIVED CALL DATA",
    "acknowledged": true
  }
}
```

## calls.operations.retention.resume

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls/operations`, action `retention.resume`. **Mutation; explicit ACK required.**

Resume safe deletion stages using saved planId and renewed typed confirmation. Never blindly repeat uncertain provider deletes.

Returns: {plan}; stage/uncertainty fences preserved.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `planId` | required | string; pattern=^[A-Za-z0-9_-]{1,191}$ |
| `confirmation` | required | "DELETE ARCHIVED CALL DATA" |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "planId": "synthetic",
    "confirmation": "DELETE ARCHIVED CALL DATA",
    "acknowledged": true
  }
}
```

## calls.operations.retention.attest

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls/operations`, action `retention.attest`. **Mutation; explicit ACK required.**

Record genuine HUMAN provider-deletion evidence for specified stage, never invented evidence.

Returns: {plan}; typed deletion confirmation required.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `planId` | required | string; pattern=^[A-Za-z0-9_-]{1,191}$ |
| `recordingId` | required | string; pattern=^[A-Za-z0-9_-]{1,191}$ |
| `stage` | required | "PROVIDER" / "PROVIDER_RESULTS" |
| `evidence` | required | string; minLength=20; maxLength=4000 |
| `confirmation` | required | "DELETE ARCHIVED CALL DATA" |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "planId": "synthetic",
    "recordingId": "synthetic",
    "stage": "PROVIDER",
    "evidence": "syntheticxxxxxxxxxxx",
    "confirmation": "DELETE ARCHIVED CALL DATA",
    "acknowledged": true
  }
}
```

## calls.operations.attempt.resolve

Workflow: [results-operations](results-operations.md). User API: **POST** `/api/calls/operations`, action `attempt.resolve`. **Mutation; explicit ACK required.**

Attach an inspected Plivo call UUID or Twilio CA SID to UNKNOWN using the persisted provider, real evidence/version, ACK and typed confirmation. Plivo request UUIDs are not call UUIDs. Provider/account/destination/caller/time/reservation checks remain; no redial. NO_CALL_CREATED requires genuine no-call evidence.

Returns: {resolved:true,redialed:false,status}; attaching an ID keeps UNKNOWN and increments version; separately reconcile its outcome. 409 stale/foreign/ambiguous/already-used ID.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `attemptId` | required | string; pattern=^[A-Za-z0-9_-]{1,191}$ |
| `expectedVersion` | required | integer; exclusiveMinimum=0 |
| `resolution` | required | "NO_CALL_CREATED" / "PROVIDER_SID" |
| `providerSid` | optional | string; pattern=^CA[0-9a-fA-F]{32}$ OR string; format=uuid |
| `evidence` | required | string; minLength=20; maxLength=4000 |
| `confirmation` | required | "RESOLVE UNKNOWN CALL" |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "attemptId": "synthetic",
    "expectedVersion": 1,
    "resolution": "NO_CALL_CREATED",
    "evidence": "syntheticxxxxxxxxxxx",
    "confirmation": "RESOLVE UNKNOWN CALL",
    "acknowledged": true
  }
}
```

## calls.query.list

Workflow: [contacts-agents](contacts-agents.md). User API: **POST** `/api/calls/query`, action `query.list`. **Read-only; no ACK.**

List any of seven entities using entity-specific filters below. Continue with nextCursor until null; workspace is not full history.

Returns: {entity,items,nextCursor:string|null}; 400 invalid filters/range; invalid/foreign cursor rejected.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `entity` | required | "contacts" / "campaigns" / "assets" / "agents" / "attempts" / "recordings" / "automations" |
| `search` | optional | string; maxLength=200; default="" |
| `limit` | optional | integer; minimum=1; maximum=100; default=50 |
| `cursor` | optional | string; minLength=1; maxLength=4096 OR null |
| `sort` | optional | string; minLength=1; maxLength=40 |
| `direction` | optional | "asc" / "desc" |
| `filters` | optional | map<string, unknown>; default={} |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "entity": "contacts"
  }
}
```

## calls.query.detail

Workflow: [contacts-agents](contacts-agents.md). User API: **POST** `/api/calls/query`, action `query.detail`. **Read-only; no ACK.**

Read full owned item plus related hydration, including contact evidence/context, agent instructions and campaign recipient asset assignments.

Returns: {entity,item,related:{contacts,campaigns,assets,agents,attempts,recordings,automations,recipients}}; 404 unavailable item.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `entity` | required | "contacts" / "campaigns" / "assets" / "agents" / "attempts" / "recordings" / "automations" |
| `id` | required | string; format=uuid |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "entity": "contacts",
    "id": "00000000-0000-4000-8000-000000000001"
  }
}
```

## calls.workspace.get

Workflow: [results-operations](results-operations.md). User API: **GET** `/api/calls`. **Read-only; no ACK.**

Read recent capped workspace/configuration readiness, not complete history.

Returns: {contacts,campaigns,recipients,assets,attempts,recordings,agents,automations,configuration,configurationError,dialError,dailyLimit,workersConnected,lastDispatchAt}.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| — | — | no parameters |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {}
}
```

## calls.settings.get

Workflow: [results-operations](results-operations.md). User API: **GET** `/api/calls/backend`. **Read-only; no ACK.**

Read selected settings and owned credential metadata, never credentials themselves.

Returns: {settings,credentials:[{id,label,projectId,location,enabled}],runtime}; flags are not proof handlers are deployed.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| — | — | no parameters |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {}
}
```

## calls.recording.get

Workflow: [results-operations](results-operations.md). User API: **GET** `/api/calls?recording=<id>`. **Read-only; no ACK.**

Read saved recording/transcript/analysis/jobs. Missing output remains missing.

Returns: {recording,transcript,segments,analysis,jobs}; 404 unavailable recording.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `id` | required | string; format=uuid |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000001"
  }
}
```

## calls.agentSession.get

Workflow: [results-operations](results-operations.md). User API: **GET** `/api/calls/agent-sessions?attempt=<attemptId>`. **Read-only; no ACK.**

Read owned attempt's saved AI session, revision, bounded turns, usage and errors.

Returns: {id,attemptId,agentId,agentRevision,runtime,status,model,language,turns,usage,errorCode,startedAt,endedAt,handoffSupported:false}; 404 unavailable session.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `attemptId` | required | string; format=uuid |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "attemptId": "00000000-0000-4000-8000-000000000001"
  }
}
```

## calls.voice.import

Workflow: [audio-personalization](audio-personalization.md). User API: **POST** `/api/calls/personalization/voice`. **Mutation; explicit ACK required.**

Import existing owned Voice Lab history without generating or approving. Delegate actual voice discovery/generation to cl-voice.

Returns: {id}; 404 missing/unowned history.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `historyId` | required | string; minLength=1; maxLength=191 |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "historyId": "synthetic",
    "acknowledged": true
  }
}
```

## calls.contacts.preview

Workflow: [contacts-agents](contacts-agents.md). User API: **POST** `/api/calls (previewContacts → contact.importRows only on import)`. **Read-only; no ACK.**

Validate header-first table and explicit zero-based mapping. No write or consent. Mapping name/email/pronunciation=-1 means absent.

Returns: {rows,valid,previewToken,grantsConsent:false}; each row has contact/errors. Max 200 rows, 30 columns, 200000 serialized table characters.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `table` | required | array<array<string; maxLength=12000>; maxItems=30>; minItems=2; maxItems=201 |
| `mapping` | required | object (fields below) |
| `mapping.name` | required | integer; minimum=-1 |
| `mapping.phone` | required | integer; minimum=0 |
| `mapping.email` | required | integer; minimum=-1 |
| `mapping.pronunciation` | required | integer; minimum=-1 |
| `mapping.context` | required | array<integer; minimum=0>; maxItems=20 |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "table": [
      [
        "phone",
        "topic"
      ],
      [
        "9876543210",
        "Synthetic demo"
      ]
    ],
    "mapping": {
      "name": -1,
      "phone": 0,
      "email": -1,
      "pronunciation": -1,
      "context": [
        1
      ]
    }
  }
}
```

## calls.contacts.import

Workflow: [contacts-agents](contacts-agents.md). User API: **POST** `/api/calls (previewContacts → contact.importRows only on import)`. **Mutation; explicit ACK required.**

Save only this exact previewed table/mapping. Existing phones skipped, never updated or granted consent. Repreview after any change.

Returns: {imported,duplicates,ids}; includes existing matching IDs; 409 changed preview; 400 invalid/duplicate rows.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `table` | required | array<array<string; maxLength=12000>; maxItems=30>; minItems=2; maxItems=201 |
| `mapping` | required | object (fields below) |
| `mapping.name` | required | integer; minimum=-1 |
| `mapping.phone` | required | integer; minimum=0 |
| `mapping.email` | required | integer; minimum=-1 |
| `mapping.pronunciation` | required | integer; minimum=-1 |
| `mapping.context` | required | array<integer; minimum=0>; maxItems=20 |
| `previewToken` | required | string; minLength=64; maxLength=64 |
| `acknowledged` | required | true |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "table": [
      [
        "phone",
        "topic"
      ],
      [
        "9876543210",
        "Synthetic demo"
      ]
    ],
    "mapping": {
      "name": -1,
      "phone": 0,
      "email": -1,
      "pronunciation": -1,
      "context": [
        1
      ]
    },
    "previewToken": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "acknowledged": true
  }
}
```

## calls.schedule.preview

Workflow: [campaigns](campaigns.md). User API: **POST** `/api/calls/commands/<name> (shared callingWindowOpen)`. **Read-only; no ACK.**

Convert explicit-offset timestamp to IST and report future/window checks; never saves or schedules. UI picker uses browser timezone; OPERATOR time means available-after.

Returns: {scheduledAt,indiaTime,timeZone,callingWindowOpen,inFuture,dialed:false}.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `scheduledAt` | required | string; format=date-time |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "scheduledAt": "2026-12-01T10:00:00+05:30"
  }
}
```

## calls.personalization.preview

Workflow: [audio-personalization](audio-personalization.md). User API: **POST** `/api/calls/commands/<name> (owned hydration + shared renderContactTemplate)`. **Read-only; no ACK.**

Resolve scripts using the SAME renderContactTemplate as UI, with owned contacts/audio. name uses pronunciation first. No save, generation, assembly or approval; valid describes text resolution, not execution readiness.

Returns: {rows:[{contactId,segments:[{kind,text,assetId?}],error:string|null}],valid,generated:false,saved:false}; 404 unavailable contact/audio; missing fields return row errors.

| Parameter | Presence | Type / default / limits |
|---|---|---|
| `spec` | required | object (fields below) |
| `spec.a` | required | string; format=uuid OR null |
| `spec.c` | required | string; format=uuid OR null |
| `spec.aText` | required | string; maxLength=5000 |
| `spec.cText` | required | string; maxLength=5000 |
| `spec.selected` | required | array<string; format=uuid>; maxItems=500 |
| `spec.names` | required | map<string, string; format=uuid> |
| `spec.voiceId` | required | string; maxLength=200 |
| `spec.segments` | optional | array<object (fields below) OR object (fields below)>; minItems=1; maxItems=8 |
| `spec.segments[](variant 1).kind` | required | "audio" |
| `spec.segments[](variant 1).assetId` | required | string; format=uuid OR null |
| `spec.segments[](variant 1).text` | required | string; maxLength=5000 |
| `spec.segments[](variant 2).kind` | required | "speech" |
| `spec.segments[](variant 2).template` | required | string; maxLength=5000 |

Example request (synthetic; do not execute as authorization):

```json
{
  "params": {
    "spec": {
      "a": null,
      "c": null,
      "aText": "",
      "cText": "",
      "selected": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "names": {},
      "voiceId": "synthetic-owned-voice",
      "segments": [
        {
          "kind": "speech",
          "template": "Hello {{name}}"
        }
      ]
    }
  }
}
```

## Entity-specific list filters

`filters` defaults to `{}`. These are the only fields allowed for each entity. Date bounds use explicit-offset ISO instants; `from < to`.

### contacts

| Filter | Presence | Type / limits |
|---|---|---|
| `doNotCall` | optional | boolean |
| `consent` | optional | "allowed" / "blocked" |

### campaigns

| Filter | Presence | Type / limits |
|---|---|---|
| `status` | optional | "DRAFT" / "MANUAL_READY" / "QUEUED" / "SCHEDULED" / "RUNNING" / "COMPLETED" / "CANCELED" / "PAUSED" / "LAUNCHED" |
| `mode` | optional | "RECORDED" / "OPERATOR" / "AGENT" |
| `scheduled` | optional | boolean |

### assets

| Filter | Presence | Type / limits |
|---|---|---|
| `approved` | optional | boolean |

### agents

| Filter | Presence | Type / limits |
|---|---|---|
| — | — | no filters |

### attempts

| Filter | Presence | Type / limits |
|---|---|---|
| `status` | optional | "QUEUED" / "DISPATCHING" / "AWAITING_OPERATOR" / "UNKNOWN" / "INITIATED" / "RINGING" / "IN_PROGRESS" / "COMPLETED" / "BUSY" / "NO_ANSWER" / "FAILED" / "CANCELED" / "BLOCKED" |
| `mode` | optional | "RECORDED" / "OPERATOR" / "AGENT" |
| `campaignId` | optional | string; format=uuid |
| `contactId` | optional | string; format=uuid |
| `live` | optional | boolean |
| `from` | optional | string; format=date-time |
| `to` | optional | string; format=date-time |

### recordings

| Filter | Presence | Type / limits |
|---|---|---|
| `status` | optional | "PENDING" / "SAVING" / "SAVED" / "FAILED" / "DELETING" / "DELETED" |
| `attemptId` | optional | string; format=uuid |
| `reviewed` | optional | boolean |
| `from` | optional | string; format=date-time |
| `to` | optional | string; format=date-time |

### automations

| Filter | Presence | Type / limits |
|---|---|---|
| `enabled` | optional | boolean |
| `campaignId` | optional | string; format=uuid |

## Entity-specific list sorts

`sort` is optional; omit both sort/direction for the legacy native order. When sorting, use one field below and optional `direction:"asc"|"desc"` (native default asc). Require `sortVersion:1` in the list response before claiming server-wide sorting; an older processing backend can return legacy unsorted rows. Preserve entity/search/filters/sort/direction across cursor pages. Never sort only a capped snapshot and claim a complete sorted audience.

| Entity | Allowed sort fields |
|---|---|
| contacts | `createdAt`, `updatedAt`, `name`, `phone`, `email`, `consentPurpose` |
| campaigns | `createdAt`, `updatedAt`, `name`, `mode`, `status`, `scheduledAt` |
| assets | `createdAt`, `updatedAt`, `name`, `durationMs`, `approvedAt` |
| agents | `createdAt`, `updatedAt`, `name`, `language`, `runtime`, `revision` |
| attempts | `createdAt`, `updatedAt`, `contactName`, `mode`, `status`, `durationSeconds`, `scheduledAt` |
| recordings | `createdAt`, `updatedAt`, `captureStatus`, `storageStatus`, `transcriptionStatus`, `analysisStatus`, `durationSeconds` |
| automations | `createdAt`, `updatedAt`, `name`, `eventType`, `enabled`, `lastPolledAt` |

