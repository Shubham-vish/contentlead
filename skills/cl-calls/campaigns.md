# Campaigns, timing and call handoff

Exact schemas/examples: [commands.md](commands.md). Safety: [SKILL.md](SKILL.md).

## Save one durable draft

`calls.campaign.save` covers Goal/Audience/Experience/Timing, including shared
recording and per-person overrides. Hydrate owned contact/agent/asset UUIDs using
queries first. Maximum 100 unique recipients. Use a stable UUID `draftKey` for
new-save recovery; edit only a saved DRAFT `id`. Saving never queues calls.
Enabled automation can fence draft edits/launch; do not bypass it.

| Experience | Exact payload semantics |
|---|---|
| Live AI | `mode:"AGENT"`, saved `agentId`, no recorded message |
| Shared recording | `mode:"RECORDED"`, `sharedAssetId`, optional `recipients[].assetId` overrides |
| Customized generated/hybrid | Still `mode:"RECORDED"`; prepare approved final per-person assets through [audio-personalization.md](audio-personalization.md), then explicitly save assignments |
| Live manual | `mode:"OPERATOR"`, no agent required; saved audience queue, **not autodial**. Saved recording choices are retained but not played in manual calls |

`scheduledAt` is explicit-offset ISO instant or null. Example
`"2026-12-01T10:00:00+05:30"` (illustrative, choose user-authorized future time).
`calls.schedule.preview` reports normalized instant, IST display, future/window
checks and `dialed:false`, never persists. The UI picker uses **browser timezone**,
not presumed IST; null clears the time. DST gaps rejected; ambiguous new picks
use earlier offset, unchanged saved instants retain original identity.
AGENT/RECORDED null permits immediate authorized launch; OPERATOR time means
**available after**, never an automatic timed call. Starts remain 09–20 India.

## Review is separate from launch/preparation

Read `calls.campaign.review {id}` and show exact current audience, purpose,
numbers/recording implications, mode, selected assets, revision, schedule,
daily allowance and **every blocker**. Do not silently alter consent/settings
to make a blocked review pass.

Only after the user authorizes this precise review:

```python
# campaign_id is the saved owned UUID, not an example label.
review = call("calls.campaign.review", id=campaign_id)
# STOP here until the human explicitly approves the displayed exact review.
# call("calls.campaign.launch", id=campaign_id,
#      expectedRevision=review["revision"], reviewToken=review["token"],
#      acknowledged=True)
```

RECORDED/AGENT launch returns `{id,queued}` and can incur paid calls through the
existing dispatcher. It is **not** preview. OPERATOR launch instead returns
`{id,queued:0,manual:true}`, saves MANUAL_READY and creates **no attempts**.
Current configuration/permission/window/schedule blockers still apply.
Changed source/agent/settings/audience/permission/revision invalidates review:
409 means re-read and renew authorization, never blind replay.

## Prepared manual queue → HUMAN Call next

`calls.campaign.manual.progress {id}` returns durable rows/eligibility,
nextContactId, activeAttempt, completed/total and relative `handoffUrl`.
Open that URL in the signed-in Calls UI. The human must review current preflight,
headset/microphone/carrier authorization and charges, then click **Call next**
for **each** person. Explicit **Skip (no call)** is an audited human action.
Reload/timer/automation/hangup never advances or dials automatically.

Current consent/purpose/recording/DNC/destination binding, strict dial capability,
India hours, daily cap and owner-wide active/UNKNOWN fences are checked per click.
Revision/contact identity prevents duplicate attempts; completed recipients are
not implicitly redialed. Resume the same saved queue, not a new instant attempt.
Do not fetch carrier tokens, simulate a human click or invent an AI next/skip API.

## Individual calls and cancellation

`calls.call.start` supports separately authorized RECORDED/AGENT only and can
immediately dial. Keep its UUID `requestKey` stable through uncertain recovery.
The browser individual call, devices/mute and connection remain UI-only.
No hold, automatic transfer or agent tool calling exists.

`calls.campaign.cancel` cancels future queued work; `calls.call.end` separately
requests active hangup. Read actual status afterwards. An UNKNOWN/timeout is
not proof no call exists: query/reconcile; never redial or change UUID to escape.
