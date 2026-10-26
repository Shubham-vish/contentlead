# Opportunities, notes and activity

## Opportunities

Resolve the scoped contact first, then create/update/archive with explicit user
approval. Allowed stages are `PROSPECT`, `QUALIFIED`, `PROPOSAL`, `WON`, `LOST`.

- Create with stage `WON`/`LOST`, or update to either stage, requires a top-level
  `closureReason` (3–500 trimmed characters). The reason is recorded as a private
  closure activity; do not send it for other stages. Reopened opportunities do
  not show the historical closure reason as their current reason.
- Money uses integer `amountMinor` plus three-letter uppercase `currency`.
- Reload one selected opportunity with
  `crm.opportunities.list {id,archived,limit:1}`, setting `archived` to match
  whether the selected record has `archivedAt`. A missing or cross-scope ID
  returns an empty page.
- CRM opportunity stages do not modify Deals, checkout, orders, subscriptions,
  payouts or account access.
- Update/archive requires `expectedRevision`. A 409 means reload and review; do
  not blindly resubmit.
- Archive is reversible and preserves history.

## Notes and activity

`crm.notes.create` adds a durable private note inside the selected scope.
`crm.activities.list` pages persisted CRM notes/audit events for one contact.

Source projections refreshed in contact detail are not durable activity events.
Do not claim external source refresh, support messages, calls, purchases or
channel replies were performed merely because a projection or source link exists.
