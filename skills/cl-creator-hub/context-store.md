# Existing Context Store (not Hub publication)

`/context-store` stores the signed-in user's reusable prompts, instructions,
personas and references. Unlike global `/learn` articles or creator Hub docs,
these are private working context, not a publication channel.
The following Desktop HTTP endpoints already forward to native
`/api/mcp/context/*`; they are not `hub.*` or editor execute commands.

| Route | Request / outcome |
|---|---|
| `GET /api/bridge/context` | `?view=tree|flat&type=prompt|instruction|persona|reference&fields=full`; default tree/summary |
| `GET /api/bridge/context/search` | `?q=<text>&type=<optional>&tags=<optional>&limit=<optional>` |
| `GET /api/bridge/context/<id-or-slug>` | Read one owned item; optional `?as=markdown` |
| `GET /api/bridge/context/folder/<id>` | List owned folder; optional `?recursive=true` |
| `POST /api/bridge/context/manage` | Single operation `{action,...}` or `{operations:[...]}`; max 50, sequential, **not transactional** |
| `POST /api/bridge/context/edit` | `{id,text,find?,replace_all?,at_line?,after_heading?}`; native partial edit |

Use the normal Desktop bearer and existing signed-in session. Resolve exact
owned IDs before writing; never submit an owner/user override or an arbitrary
folder ID. Preview changes and obtain explicit approval before deletes.
These legacy routes do not implement an `approved` request field or independently
prove consent. Do not copy their shape onto newer approval-gated routes.

`manage` actions:

- `create_folder`: `{action,name,parentId?,icon?}`.
- `rename_folder`: `{action,folderId,name}`.
- `delete_folder`: `{action,folderId}`; review descendants before deleting.
- `create_item`: `{action,name,content?,type?,tags?,folderId?,description?,contentType?}`.
- `update_item`: `{action,itemId,name?,content?,type?,tags?,folderId?,description?,isActive?,contentType?}`.
- `delete_item`: `{action,itemId}`.
- `move_item`: `{action,itemId,folderId?}`.

Prefer reviewed single operations with resolved IDs, especially after failures.
Batch response is `{success,total,succeeded,failed,results}`: top-level
`success:true` does **not** mean all operations succeeded. Inspect every result
and re-read changed items; never replay a partially applied batch.

Partial-edit semantics: `find+text` replaces a unique match (or all when
`replace_all:true`); `at_line+text` inserts before a **zero-based** line;
`after_heading+text` inserts after a matching heading; `text` alone appends.
Read the current item first. A timeout does not imply rollback and is not
permission to append/create again automatically.
