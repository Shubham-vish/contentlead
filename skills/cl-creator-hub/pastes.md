# Public pastes (separate from Hub docs)

`/pastes`, `/paste/new` and `/p/<slug>` provide a lightweight text/code sharing
surface. These are not private notes and not `hub.*` documents. Requires a
Desktop advertising these routes in `/api/capabilities`; use normal bearer
authentication. Reads/listing use native saved state, not provider metrics.

| Method / path | Contract |
|---|---|
| `GET /api/bridge/pastes` | `{pastes:[{id,slug,title,content,preview,createdAt,updatedAt}]}`; latest 100 owned pastes |
| `POST /api/bridge/pastes` | `{title?,content,approved:true}` → HTTP 201 `{slug,public:true}` |
| `GET /api/bridge/pastes/<slug-or-id>` | Native public paste read; knowing the link permits reading |
| `PATCH /api/bridge/pastes/<id>` | `{title,approved:true}` → `{success:true}`; owner-only |
| `DELETE /api/bridge/pastes/<id>` | `{approved:true}` → `{success:true}`; owner-only |

Creation immediately makes the paste available at
`https://contentlead.in/p/<slug>` to anyone with the link. Preview the entire
content and confirm public sharing before POST. Never put credentials,
private customer data or unapproved source code in it. There is no draft,
unpublish, private-share mode, content-replace PATCH or expiration setting.
Native PATCH changes only the title. To change text, deliberately create a new
approved paste and separately approve deletion of the old one.

Content must be nonempty and ≤1048576 characters; indentation/leading/trailing
whitespace is preserved. Title ≤255 characters, default `Untitled`.
List to resolve the exact UUID `id` before rename/delete; do not pass an
arbitrary public slug as proof of ownership.

Creation/deletion/rename are never automatically retried. A timeout/5xx or
malformed native JSON is uncertain, not rollback: inspect the saved owned list
and public URL before taking a reviewed follow-up action.
