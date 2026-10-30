# Reel Inbox and existing Findings

Reel Inbox (`/content/reel-inbox`) is distinct from tracked-creator Inspiration:
it contains posts shared through linked Instagram senders, including stored
transcripts. Requires a Desktop that lists these endpoints in
`GET /api/capabilities`; use the normal bearer and signed-in web session.

| Method / path | Parameters / outcome |
|---|---|
| `GET /api/bridge/reel-inbox/senders` | `{senders:[{senderId,username,isActive?,connectedAt?}],source:"stored",providerVerified:false}`; inactive senders excluded, no account tokens |
| `GET /api/bridge/reel-inbox` | Required `?sender_ids=<comma-separated IDs>`; optional `page=1`, `limit=20` (1–100), `status`, `search` (≤500 chars) |
| `DELETE /api/bridge/reel-inbox` | `{items:[{id,senderId}],approved:true}`; 1–50 exact pairs; deletes stored inbox rows, not Instagram posts |
| `DELETE /api/bridge/reel-inbox/senders/<senderId>` | `{approved:true}`; native soft-unlink |
| `POST /api/bridge/reel-inbox/verification` | `{approved:true}` → `{code,displayMessage,recipientUsername,expiresAt,humanActionRequired}` |
| `GET /api/bridge/reel-inbox/verification?code=0123` | Poll the exact four-digit code as a string, preserving leading zeros |
| `GET /api/bridge/inspiration/ai-output?since=<ISO timestamp>` | Read existing instance-local Findings; omit `since` for recent entries |

Inbox `status`: `all|pending|processing|transcribed|failed`. Listing returns
`{items,totalCount,page,limit,hasMore,source:"stored",providerVerified:false}`.
Rows retain their stored caption/transcript/media fields; they are not a fresh
provider scrape. Paginate while `hasMore` is true. At most 50 unique sender IDs
may be selected per request. Both listing and deletion reuse the native
owner-linked sender authorization; an arbitrary public Instagram ID is not a
valid ownership grant.

## Research → script

1. List linked senders; select the intended account.
2. Read transcribed inbox rows. Evaluate hooks using `cl-script-evaluator`
   and `cl-virality-scoring`; reuse the existing transcript rather than paying
   for duplicate transcription.
3. Use `cl-content-style` HTTP routes to save original remixes, or create a
   Content document through `cl-content-publishing`.
4. To link another sender, prepare verification after approval. The **human
   must send** `displayMessage` to `recipientUsername` from that Instagram
   account. This route does not send a DM or bypass Instagram login.
5. Poll until `verified`, `expired` or `not_found`; then re-read senders.
   Never start repeated verification jobs as polling.

## Deletion and failure semantics

Preview exact rows/senders and obtain explicit approval before delete/unlink.
Deletion returns `{success,results,successCount,failCount,retryable:false}`;
HTTP 207 means some rows failed, not complete success. Never replay the whole
batch; re-read state and review only remaining targets. Timeouts/5xx/non-JSON
writes are uncertain and are never automatically retried.

## Findings are transient

The existing POST `/api/bridge/inspiration/ai-output` pushes reviewed findings
using `{title,content,format?,actions?,context?,sessionId?}`. Desktop caps content
at 102400 characters even though native `fullpage` permits more.
GET returns `{findings,source:"instance-memory",durable:false}`. Native storage
keeps 50 per user per server instance, GET returns the newest 20, and deployment,
restart or another server instance can lose/hide them. `since` is a timestamp,
not a durable cursor. Save enduring research as a reference, Hub draft, Content
script or style remix; do not claim Findings were permanently stored.
