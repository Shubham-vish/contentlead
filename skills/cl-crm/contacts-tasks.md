# Contacts and follow-ups

## Read before changing

1. `crm.workspace.get {scope}` confirms the effective workspace.
2. `crm.contacts.list` resolves IDs with bounded search/filter/cursor paging.
3. `crm.contacts.detail {id}` returns the contact, first-page work, links and
   refreshed safe source projections. Use separate list commands for more pages.
4. `crm.contacts.timeline {id,type:"all",limit:30}` returns the rich feed,
   engagement (platform only), `sectionErrors` and `nextCursor`. Follow the
   cursor with the same scope/contact/type. A section error is unavailable data,
   not proof that no payments or conversations exist.

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

## Export the filtered contact list

`crm.contacts.export` accepts the contact-list filters (`scope`, `search`,
`sort`, `status`, `label`, `archived`, `sourceKind`), **not `cursor`, `limit`,
`path` or actor/owner IDs**. It reuses native paged export and spreadsheet-formula
escaping. Each page reauthorizes; the export is not a transaction/snapshot lock.

The standard response's `data` is:

```text
{filename:"crm-contacts.csv", contentType:"text/csv; charset=utf-8",
 encoding:"utf8", content:"<CSV>", byteLength, rowCount}
```

At most 5,000 rows and 1 MiB UTF-8 content; overflow is HTTP413 and returns no
partial artifact. Narrow filters rather than treating truncated content as a
complete export. Keep the CSV private; never paste it into chat or logs.

After explicit approval for the export/destination, using the `crm()` helper:

```python
artifact = crm("crm.contacts.export", scope="owner", label="VIP")
payload = artifact["content"].encode("utf-8")
if artifact["encoding"] != "utf8" or len(payload) != artifact["byteLength"]:
    raise RuntimeError("Invalid export artifact")
target = pathlib.Path("exports/approved-vip-contacts.csv")  # chosen destination
target.parent.mkdir(parents=True, exist_ok=True)
with target.open("xb") as file:  # refuses to overwrite an existing export
    file.write(payload)
```

There is no server-side file write, upload, external URL fetch or provider action.

## Approved revision-aware bulk work

1. List/inspect the exact contacts and their current revisions; show the user
   the operation, tag and selected records.
2. After approval, call:

```json
{"params":{"scope":"owner","acknowledged":true,"operation":"addTag","tag":"Reviewed",
 "items":[{"id":"00000000-0000-4000-8000-000000000001","expectedRevision":4}]}}
```

Command: `crm.contacts.bulk`. Operations: `addTag`, `removeTag`, `archive`,
`unarchive`; tag is required for tag operations. Items must have unique IDs,
positive revisions, and number 1–100. The domain service runs at most four
updates concurrently and retains audit/revision checks.

3. Inspect **every** `data.outcomes` entry, `succeeded` and `failed`; outer
   `ok:true` does not mean every item succeeded. Successful entries contain the
   updated contact/revision; failures contain `id`, `code` and `message`.
4. Do not retry succeeded items. For a conflict or uncertain request, reread
   saved contacts first, then obtain approval for a new failed-only subset with
   fresh revisions. Replaying a committed item's old revision produces conflict,
   not permission to overwrite. Role revocation can suppress the whole response
   even after partial writes, so inspect state rather than assume rollback.

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
