# Podcast recording dashboard is separate from timeline production

Timeline `production.*` and `podcast.*` renderer commands do not create or manage a
recording-studio session. On a Desktop version with the creator-media bridge,
the following JSON routes reuse the signed-in native dashboard APIs.
Treat unavailable routes as an installation/integration gap.

| Desktop route under `/api/bridge/podcast` | Native operation |
|---|---|
| `GET /sessions?cursor=...&limit=50` | Owned/shared sessions, cursor pagination |
| `POST /sessions` | Create `{title,description?,scheduledAt?,mode?}`; mode `SOLO` or `MULTI`; capability/rate limits still apply |
| `GET /sessions/:id` | Authorized dashboard state |
| `PATCH /sessions/:id` | Host-only `{title?,description?,scheduledAt?,status?}`; never fabricate completion |
| `DELETE /sessions/:id` | Existing host-only deletion; obtain explicit user intent |
| `GET /sessions/:id/recordings` | Authorized recording metadata/fresh signed URLs |
| `GET /sessions/:id/edits` | Requester's edits, not another participant's private edits |
| `GET /sessions/:id/edit` | Edit readiness |
| `POST /sessions/:id/edit` | Open/create seeded edit: `{mode:"open"|"new",contentId?,frameStyle?}` |
| `PATCH /sessions/:id/edit` | Host-only `{contentId}` sets the default to an owned edit linked to this session |
| `PATCH /sessions/:id/participants/:participantId/share` | Host sets `{shared:boolean}` for a guest's dashboard access |
| `GET/POST /sessions/:id/show-notes` | Read/create: `{title,body?,type?,sortOrder?}` |
| `PATCH/DELETE /sessions/:id/show-notes/:noteId` | Update `{title?,body?,type?,status?,sortOrder?}` or delete |
| `POST /sessions/:id/show-notes/reorder` | `{noteIds:[...]}`: 1–1000 distinct UUIDs belonging to this session |
| `GET /processing/:jobId` | Existing server processing record (not native job control) |

Inspect HTTP status and JSON errors; do not blindly repeat writes after timeouts.
Session titles are 1–200 characters, descriptions ≤2,000, and `scheduledAt`
is an ISO datetime or null. Session statuses: CREATED/LIVE/RECORDING/PROCESSING/
COMPLETED/CANCELLED. Those labels do not perform the corresponding capture or
processing work. Notes use title 1–300 characters, nullable body, type
TOPIC/QUESTION/SEGMENT/BREAK, and status PENDING/ACTIVE/DONE.
`frameStyle` is an object: minimally `{layout:"fill"}` or
`{layout:"framed",frameColor:"#RRGGBB"}`; it is not a layout-name string.
Only open the returned editor `contentId` after readiness succeeds. Saved-server
operations are not timeline undo entries. Shared viewers retain the server's
read/edit/host distinctions; the bridge does not elevate their rights.

**Remaining boundaries:** no room-token or guest-consent bypass, no retired
`/process` call (it returns 410), and no claim that these routes start/stop local
capture or finish local processing. The native UI performs processing, polling,
output upload, export finalization and completion as a coupled workflow; native
processing alone is not a completed/cloud-playable episode. That end-to-end
native automation is separately exposed by the source-defined mounted controller
in `native-runtime.md`, only when its matching Desktop/frontend transport is
installed. Recording start/stop/finalization remain unsupported commands.
Do not mark the session completed by PATCH as a substitute for producing and
finalizing real exports.
