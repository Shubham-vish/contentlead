# Contacts, imports and agents

Exact command payloads/results/defaults: [commands.md](commands.md).
Use the helper and safety gates in [SKILL.md](SKILL.md).

## Discover the complete audience

`calls.query.list` supports contacts, campaigns, assets, agents, attempts,
recordings and automations. Page with returned `nextCursor` until **null**,
preserving entity/search/filters/sort/direction; default 50, max 100. See entity filter and sort tables
in the command reference. Never locally filter a capped workspace snapshot and
claim complete coverage. `calls.query.detail {entity,id}` supplies full owned
UUIDs and `related` hydration. Contacts include pronunciation, context and actual
permission evidence; campaigns include recipient asset assignments; agents
include instructions/revision. A display label is not an ID.

The manifest's `querySorts` lists exact allowed fields for each entity.
Pass `sort:"name",direction:"asc"` for contacts, for example; `direction`
requires `sort`. Omit both for the legacy native order. Confirm response
`sortVersion:1` before claiming global sorting: an older processing backend
can return legacy unsorted rows without that field. Never substitute a
local sort of a partial page for a globally sorted audience.

## Manual contact save and suppression

`calls.contact.save` creates or updates a **full form**, not a patch. Read detail
before editing; preserve permission/suppression unless specifically authorized.
Name and Indian +91 mobile are required. Context is at most 20 non-sensitive
fields; keys 1–60 characters, values ≤2000, combined JSON ≤12000 characters.
Core/prototype-related keys are reserved. Context cannot instruct the agent.

Permission flags default false. Setting either calling/recording consent true
requires an actual human `consentAttestation` (20–4000 chars), not an invented
statement; calling consent also needs specific purpose and evidence. These
flags are distinct. `calls.contact.suppress` records opt-out/revocation.
There is **no contact delete or unsuppress command/UI workflow**; do not invent
CRUD operations beyond actual create/read/update/suppress support.

## Selected file → sheet → mapping → preview → import

`POST /api/bridge/calls/import-local` is a **local route**, not a calls command:

```json
{"path":"/absolute/user-selected/recipients.xlsx","userSelected":true,"sheet":"Recipients"}
```

`path:string` and `userSelected:true` required; `sheet:string` optional for first
Excel discovery. Reads only that user-selected file; absolute or `~/` path under
user-facing Movies/Videos/Downloads/Desktop/Documents/Pictures/Music/Codes,
realpath checked against symlink escapes, never hidden account directories.
Response `{ok:true,data:{sheets,sheet,table,error,suggestedMapping,imported:false,
grantsConsent:false}}`. No contact write/charge.

CSV/TSV/TXT reject sheet selection; legacy XLS must be converted to XLSX.
Limits: 2 MB source, 8 MB expanded workbook, 1–20 Excel sheets, 200 data rows,
30 columns, 200000 serialized table characters. Formula cells/oversized selected
sheets are rejected. An invalid first/selected sheet retains sheet metadata but
`table:null`, `suggestedMapping:null`, and `error`: show error and explicitly
select a later sheet. Never silently skip/import another sheet.

For paste use a header-first `string[][]`. Explicit mapping uses zero-based
indexes: required phone ≥0, name/email/pronunciation=-1 when absent, context
indexes only for explicitly chosen columns (≤20). Missing names use phone.

```python
table = [["phone", "topic"], ["9876543210", "Synthetic demo"]]
mapping = {"name":-1, "phone":0, "email":-1, "pronunciation":-1, "context":[1]}
preview = call("calls.contacts.preview", table=table, mapping=mapping)
# Show all row errors/context. Only after specific approval:
# call("calls.contacts.import", table=table, mapping=mapping,
#      previewToken=preview["previewToken"], acknowledged=True)
```

Preview is the same UI parser/phone/context validation and never grants consent.
Import requires identical table/mapping/hash and all rows valid, no duplicate
input phones or partial invalid-row import. Changing file/sheet/mapping/context
requires a new preview. Existing phones are skipped/reported, **not updated**;
returned IDs include existing matches. Read their actual permissions before
assigning an audience. File errors: 400 invalid selection/format/sheet, 403 path
policy, 413 limits, auth/runtime errors as router. No folder scans.

## Agents and testing

`calls.agent.save` creates/updates a revisioned saved agent, not a call/test.
Instructions ≤12000, greeting ≤2000, languages hi-IN/en-IN, bounded maxTurns
1–30/maxTokens 1000–30000. Tools must be empty; handoff must remain disabled.
Use settings metadata/runtime models and owned credential IDs before testing.

`calls.agent.test` is a **paid text simulation** using draft instructions,
bounded history and stable session/request UUIDs. Explicitly disclose/authorize
charges. Inspect returned reply/end reason and token/turn/daily budgets.
`calls.agent.test.reset` resets session state, not the daily quota, and is
separately authorized; never reset an uncertain turn
to retry it. Text test is not voice quality, latency or telephone verification.

Agent live voice test is UI-only microphone/relay interaction. Navigate the
signed-in Calls UI to AI Agents → edit/new → test voice; do not request stream
tickets or claim audio connected through text testing. Selecting credentials or
opening the test panel alone does not authorize execution.
