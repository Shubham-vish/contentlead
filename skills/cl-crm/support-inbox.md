# Platform support WhatsApp — not creator/owner messaging

These commands operate the **existing platform support business account**.
They require `scope:"platform"`, CRM access and the signed-in user's **current
ADMIN role**, plus the unchanged native support handler's authorization.
They do not grant support access, select another owner, provision a number,
change opt-in or expose TradingChat. Never present these as an owner inbox.

Use the normal authenticated CRM bridge/envelope from [SKILL.md](SKILL.md):

1. `crm.inbox.whatsapp.list {scope:"platform",limit:30,skip:0}` returns bounded
   `data.rows,total,nextSkip,snapshot:false`. Continue with nextSkip; concurrent
   activity can reorder offset pages. Only native known support threads appear.
2. `crm.inbox.whatsapp.get {scope:"platform",threadId:"<listed-id>",limit:30,skip:0}`
   returns `data.meta,messages,adminRead,windowOpen,nextSkip,sourceWindowLimit:200`.
   Messages retain full selected text and `hasMedia`; raw provider URLs/IDs are
   not exposed. Inspection never marks read. Paging is confined to the native **latest200**
   messages; `nativeWindowMayBeTruncated:true` warns that older history is not
   exposed. Offset pages are not immutable snapshots.
3. Inspect the exact target and conversation. Present the exact proposed text,
   the platform support business-account identity and recipient to the user;
   obtain specific send approval. `windowOpen:false` means no free-form reply;
   do not substitute a template or another recipient.
4. Send only that approved text:

```json
{"params":{"scope":"platform","threadId":"919876543210","expectedLastMessageId":"<data.meta.lastMessageId>","body":"Exact specifically approved support text.","acknowledged":true}}
```

Invoke `POST /api/bridge/crm/commands/crm.inbox.whatsapp.reply`.
This example's number/text is synthetic, not a real target or authorization.
Text is1–4096 characters with no leading/trailing whitespace; no silent trim
or truncation. No phone, channel, owner, sender or role override is accepted.
The adapter checks the inspected last-message ID before sending, then reuses
the native reply handler and its existing24h window and known-thread checks.
This preflight is **not a transaction lock** against a message arriving while
the provider request is in flight.

Successful `data.providerAccepted:true`/`deliveryConfirmed:false` means only
the native handler confirmed submission and stored an outgoing receipt;
**not** recipient delivery/read. The native send also marks the thread read.

**No automatic retries.** A timeout, provider failure, HTML/unconfirmed response,
receipt mismatch or role revocation after sending can leave delivery uncertain.
Inspect the thread/provider before requesting renewed authorization; do not
blindly resend, change the text or claim rollback.409 means refresh/review and
renew approval.403 means real role/capability denial, not another scope to try.
There is no sender idempotency key in the native UI route: do not claim one.

## Inspect a stored screenshot/document

After inspecting the authorized thread/message, request this **binary** route:

`GET /api/bridge/crm/inbox/whatsapp/media?threadId=<listed-thread>&messageId=<stored-message-id>`

Only these two distinct query fields are accepted: threadId is6–20digits;
messageId is1–200ASCII letters/digits/`_`/`-` (the stored message key, not
`waMessageId` or a provider media ID). No URL, media ID, phone or path override.
Fresh session/CRM/ADMIN and native ADMIN checks remain authoritative. The
message must belong to that thread's native latest200 window and contain a
canonical stored attachment reference. There is no arbitrary download proxy.

Success is HTTP200 **actual bytes**, normalized nonactive Content-Type, exact
Content-Length1..104857600bytes (100MiB), `Content-Disposition:attachment`,
no-store and nosniff—not a JSON artifact/URL/base64 envelope. Provider metadata
is bounded64KiB; declared/actual oversized, empty/mismatched bodies and unsafe
HTML/JSON/XML/SVG/JavaScript MIME fail before native success. Provider requests
use a30second shared deadline, no redirects and only approved HTTPS Meta CDN
hosts. Desktop does not refresh/replay downloads and aborts short/long streams.
404 means missing/inaccessible current message/media;413 means too large;
502 means unavailable/invalid binary, not a successful attachment. Nothing marks read.

Save only to an explicitly chosen project-local destination. Do not feed this
binary response into the JSON `bridge()` helper. Example (after normal connection
health/target checks; all IDs below must come from the inspected conversation):

```python
import os, urllib.parse

def save_support_media(thread_id, message_id, destination):
    root = pathlib.Path.cwd().resolve()
    target = (root / destination).resolve()
    if not target.is_relative_to(root) or target == root:
        raise ValueError("Choose a project-local file")
    partial = target.with_name(target.name + ".part")
    d = json.loads((pathlib.Path.home()/".skilltown-desktop"/"api.json").read_text())
    query = urllib.parse.urlencode({"threadId": thread_id, "messageId": message_id})
    req = urllib.request.Request(
        f"http://127.0.0.1:{d['port']}/api/bridge/crm/inbox/whatsapp/media?{query}",
        headers={"Authorization": "Bearer " + d["token"]})
    created = False
    try:
        with partial.open("xb") as output:
            created = True
            with urllib.request.urlopen(req, timeout=40) as response:
                size = int(response.headers["Content-Length"])
                if response.status != 200 or not 1 <= size <= 104857600:
                    raise ValueError("Invalid binary artifact")
                received = 0
                while chunk := response.read(1024 * 1024):
                    received += len(chunk)
                    if received > size:
                        raise ValueError("Oversize artifact")
                    output.write(chunk)
                if received != size:
                    raise ValueError("Incomplete artifact")
        os.link(partial, target)  # Atomic no-overwrite publication.
    finally:
        if created:
            partial.unlink(missing_ok=True)
```

HTTP errors, aborted transfer, malformed lengths and an existing final/partial
file must not be reported as a successful download. Inspect the completed
local artifact with your media/file tool; do not print customer documents or
send them to another system.

## Separately approve marking the reviewed thread read

Inspection/download is read-only. After review and explicit approval:

```json
{"params":{"scope":"platform","threadId":"919876543210","expectedLastMessageId":"<data.meta.lastMessageId>","acknowledged":true}}
```

Invoke `POST /api/bridge/crm/commands/crm.inbox.whatsapp.markRead`.
The native latest-message check rejects stale review with409. Transactions
write **only that reviewed cursor**, never mark a newer arrival read, and never
regress a newer read cursor. Same-cursor repeats are idempotent while still
latest; do not automatically replay on a timeout. Success returns
`data.readMessageId`. The native read-state and inbox-index writes are separate:
an outage can leave partial state. Refresh `get`/`adminRead` (and list unread
status) before renewed approval/retry; do not claim rollback. This action does
not send a WhatsApp provider read receipt or require an open reply window.

Current intentional limits: platform ADMIN only; text replies only; no creator-
owned support-channel configuration, arbitrary cold recipient, template send,
full older-message history, tagging or other-channel send support. Missing
workflow stages are not human-only labels.
