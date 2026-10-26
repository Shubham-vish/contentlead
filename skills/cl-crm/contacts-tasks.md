# Contacts and follow-ups

## Read before changing

1. `crm.workspace.get {scope}` confirms the effective workspace.
2. `crm.contacts.list` resolves IDs with bounded search/filter/cursor paging.
3. `crm.contacts.detail {id}` returns the contact, first-page work, links and
   refreshed safe source projections. Use separate list commands for more pages.

Owner scope is the signed-in user's CRM. Platform is a distinct current-ADMIN
workspace; clear owner selections/caches when switching.

## Contacts

- Create only after the user approves the exact fields.
- Update/archive requires current `expectedRevision`; on 409 reload and show the
  changed record before asking whether to retry.
- Archive is reversible. It preserves linked work/history.
- Labels are bounded CRM labels. `CUSTOMER` is a CRM status, not evidence of a
  paid subscription. Phone/email never imply consent or verified identity.
- Do not auto-merge matching phone/email or write imported source data over an
  existing contact.

## Tasks / follow-ups

- `crm.tasks.list` filters by contact, status, due window and assignment.
  "today" is UTC in CRM v1.
- Reload one selected task with `crm.tasks.list {id,limit:1}`. Omit
  `status`, `contactId`, `assignee` and `due` filters so stale UI filters cannot
  hide it. A missing or cross-scope ID returns an empty page.
- Create/update tasks with `assignee:"me"` or `"unassigned"` only.
- Finish work with `DONE` or `CANCELED`; no destructive delete command exists.
- A linked `contactId`, when present, must belong to the same CRM scope.

See [commands.md](commands.md) for exact schemas and validated requests.
