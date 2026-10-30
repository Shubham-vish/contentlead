# Boundaries, approval and recovery

## What works through CRM commands

Workspace/count/source availability; contact list/detail/create/update/archive;
task list/create/update; opportunity list/create/update/archive; activity list;
private notes; authorized source list/preview/apply/unlink; filtered opportunity
totals; platform-only CRM context for exact persisted source edges.
Platform-admin `customers.get` and `payments.list` are strictly read-only;
see [customers-payments.md](customers-payments.md) for their bounded coverage.

`crm.contacts.timeline` now reuses the native rich timeline, with at most 50
items per page and a cursor bound to actor/scope/contact/filter. Owner scope
returns only its own CRM activity, tasks and source links. Platform scope can
also return authorized payments/subscriptions/conversation summaries and
per-currency engagement. It is not a channel-message history reader.
`crm.activities.list` remains the simpler persisted CRM activity/notes reader.

`crm.contacts.export` returns a complete filtered CSV artifact or rejects
overflow (5,000 rows / 1 MiB); it never silently returns a partial file.
`crm.contacts.bulk` reuses native tag/archive/unarchive processing, with 1–100
unique IDs and each current revision, explicit approval and per-item outcomes.
It is **not atomic**. See [contacts-tasks.md](contacts-tasks.md) for export
handling and safe partial-failure recovery.

## Existing UI/tools remain authoritative

The CRM inbox is **platform-admin support**, not a creator-owned messaging
inbox. Its WhatsApp channel reuses account-wide admin support storage and
native24h-window reply rules; it has no creator/owner isolation selector.
Use only `crm.inbox.whatsapp.list/get/reply/markRead` for the supported ADMIN role, with
explicit platform scope, a known native conversation and exact approved text.
These reuse the existing support business account, not a creator-owned number.
Do not route through arbitrary admin HTTP, impersonate a role or promise owner
replies. TradingChat is not exposed by these commands. The rich contact timeline
still returns summaries, not message history; see [support-inbox.md](support-inbox.md).

- WhatsApp stored media has a fixed binary GET bound to the inspected thread/message;
  mark-read is a separate approved cursor-fenced write. Neither inspection nor media
  download marks the conversation read. Other channel-specific support actions
  and TradingChat remain outside this surface.
- Calls, campaigns, microphone/live voice, Call next/skip, listening/recording
  approval in Calls Studio / `cl-calls`.
- Deals outreach/payouts, offers/orders/subscriptions, billing, account access,
  support account linking, consent and entitlements in their existing tools.
- No generic CRM message recipient, other-channel reply, call, broadcast,
  billing-mutation or automation-send alias exists. Never invent one.
- Browser-local saved contact Views (save/rename/delete), table layout,
  collapsed cards and tabs have no business-command persistence. Reproduce
  a segment through `crm.contacts.list` search/status/label/sourceKind/archive/
  sort filters; do not claim a browser View was created. Tags are contact
  `labels`, including revision-aware bulk tag changes, not a separate tag CRUD.
- Platform user account deletion/editing, role grants, entitlement changes and
  fleet-wide room/VM administration are operator tools, not creator CRM tasks.
  Use scoped source search / `customers.get` for authorized support inspection;
  no public command may impersonate a user or change their access.

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
