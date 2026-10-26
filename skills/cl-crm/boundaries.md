# Boundaries, approval and recovery

## What works through CRM commands

Workspace/count/source availability; contact list/detail/create/update/archive;
task list/create/update; opportunity list/create/update/archive; activity list;
private notes; authorized source list/preview/apply/unlink.

## Existing UI/tools remain authoritative

- WhatsApp and TradingChat thread read/reply/read-state/tags/media/customer
  actions in the platform inbox UI.
- Calls, campaigns, microphone/live voice, Call next/skip, listening/recording
  approval in Calls Studio / `cl-calls`.
- Deals outreach/payouts, offers/orders/subscriptions, billing, account access,
  support account linking, consent and entitlements in their existing tools.
- No CRM v1 message, call, broadcast, billing, automation-send or channel-reply
  alias exists. Never invent one.

## Scope and source truth

`scope:"owner"` is the signed-in user's data. `scope:"platform"` requires a
fresh effective ADMIN check and is a separate support workspace—not a selector
for another owner's private CRM. Source links are reauthorized projections;
source deployment/readiness is separate from CRM persistence.

## Writes and uncertainty

`acknowledged:true` records that the agent has explicit approval for this exact
write. It cannot override authorization or grant consent. Use revisions exactly.
After timeout, HTML/gateway failure, transport loss, or an ambiguous response,
inspect current CRM state before asking for renewed approval; never auto-replay.

Typical handling:

- 400/413: correct bounded input, then re-present if the meaning changed.
- 401: sign-in/session issue; Desktop may refresh once only for recognized JSON
  session rejection.
- 403: report the real scope/capability denial; do not switch identity.
- 404: verify scoped ID and installed/deployed command version.
- 409: reload current revision/conflict and ask before a changed retry.
- 503: report source outage or unapplied CRM migration; no local/demo fallback.
