---
name: cl-deals
description: Operate ContentLead Deals as the signed-in creator, brand owner or authorized Deals admin. Discover commands for profiles, campaigns/applications, DIRECT leads/directory, creative review and private artifacts, bounded local media uploads through 512MiB, affiliate configuration/real order imports, published submissions, authorized chat, funding proofs/recovery, payout readiness/history and specifically approved idempotent creator withdrawal requests. Mutations require explicit approval and confirm:true; provider payment authorization, KYC/destination changes and admin financial processing remain human.
tags: deals, marketplace, campaigns, creators, brands, collaborations, chat, funding, proofs, payouts
---

# ContentLead Deals

> **Owns the question:** “How do I take an authorized Deals workflow from
> discovery through review, delivery and financial-state verification?”

This is the public product command surface. Identity/role/ownership come only
from the signed-in application session; supplied account IDs never grant access.

## Connection and exact protocol

Follow `cl-desktop`'s audited connection rules; do **not** open an editor:
read fresh local Desktop discovery privately, bounded authenticated loopback
health and app-auth checks, then `GET /api/bridge/deals/commands`.
If unavailable/signed out, report the boundary without launching, reloading,
switching origin, changing tabs or logging credentials.

```text
POST /api/bridge/deals/commands/<exact-name>
{"params":{"campaignId":"<returned-id>","body":{...}},"confirm":true}
```

In-app: `/api/deals/commands/<name>`. Manifest: `{commands:[...]}`.
[commands.json](commands.json) is a source snapshot; runtime wins.
[payloads.md](payloads.md) gives crucial native profile, campaign, creative and
submission body shapes; do not guess fields from a display label.
Reads also use POST to the command endpoint, but omit `confirm` and usually
`body`. Path identifiers are **inside params**, query filters inside
`params.query`, native action data inside **`params.body`**.
Never replace the allowlisted route with a caller-provided URL.

Every native non-GET mutation and lazy-creating `deals.affiliate.me` requires
**outer boolean `confirm:true`**, after
the user approves that exact action/recipient/campaign/revision/amount.
Some native bodies also require their own `confirm:true` (assessment/outreach):
outer confirmation does not replace inner domain checks. Do not invent
`acknowledged` fields. Reads never silently mark messages/notifications read.

Responses preserve native status and JSON (no universal `ok/result` envelope).
Inspect HTTP status and `error`; **HTTP202 is pending**, not funded/completed.
No automatic retry after timeout, transport failure, invalid JSON or uncertain
provider result. Read saved state/history, then obtain a deliberate recovery
decision. There is no cross-command transaction or universal revision lock.

## Discover and prepare

| Stage | Exact commands / boundary |
|---|---|
| Creator / brand setup | `deals.creator.profile/register/edit`, `deals.brand.profile/register/edit`; review native profile fields first. Registration is not verification. |
| Connected posts | `deals.accounts.list`, `deals.accounts.posts`; OAuth stays official human consent. |
| Marketplace / directory | `deals.campaigns.list/get`, `deals.directory.list/get/reachout/updateOutreach`. Directory query: `q,category,market,sort,page`. Reachout body: `{message?}`; update body: `{status:"RESPONDED"|"ARCHIVED"}`. |
| Notifications | `deals.notifications.list`, `deals.notifications.markRead {notificationId}` after reviewing it. |
| Readiness / earnings | `deals.account.readiness`, `deals.balance.get`, `deals.earnings.get`, `deals.withdrawals.list`; separately approved `deals.withdrawals.request`. Balances distinguish paise/minor units from INR major units. |

Readiness returns native KYC/payout state and masked destination, not decrypted
PAN/bank credentials. **Human handoff** for setup, destination changes,
penny-drop and admin financial approval: use native Deals account/earnings UI.
After reviewing exact available balance and masked destination, an explicitly
approved `deals.withdrawals.request` accepts
`{body:{amountPaise:100000,requestId:"reviewed-attempt-1",note?}}` with outer
`confirm:true`. Integer **paise**, never rupees or a changing `all` amount.
Stable requestId is mandatory (8–128 letters/digits/`._:-`) and maps to the
native idempotency key. This immediately debits **real** available balance and
freezes the destination; it is not a harmless draft or completed transfer.
Native KYC, minimum/balance, one-in-flight and transactional lock gates remain.
Inspect `withdrawals.list` for frozen state/reference/reversals. No automatic
retry or changed-key recovery after uncertainty; only deliberately recover the
same reviewed attempt using its same key. Native replay is not a new payment.

## Campaign and participation lifecycle

1. Read `campaigns.get`, then `campaigns.create` for a draft (native JSON body).
   `campaigns.edit` accepts **only `{details:{...}}`**, never budget/status fields.
   `campaigns.duplicate` creates a new unfunded draft, not a funded copy.
2. Review completeness, dates, fulfillment and creator/brand requirements.
   `campaigns.setStatus` body is **only**
   `{status:"ACTIVE"|"PAUSED"|"COMPLETED"|"CANCELLED"}`. Publishing/activation,
   pausing, completion and cancellation are consequential approved mutations;
   native transition/completeness/ownership checks remain authoritative.
3. **MANAGED:** `campaigns.join`; owner `applications.list/review`.
   **DIRECT/contact-the-brand:** `campaigns.apply {body:{message?}}` records a
   lead and unlocks permitted contact; it does not join escrow or guarantee pay.
   Owner `leads.list`, then `leads.update {body:{status:"NEW"|"CONTACTED"|"ARCHIVED"}}`.
   Creator `campaigns.reportBrand {body:{reason:"NO_RESPONSE"|"NO_PAYMENT"|"OTHER",note?}}`.
4. Read `campaigns.report` and current campaign state after each consequential
   transition. A published listing is not proof of funding or paid delivery.

After acceptance, `deals.affiliate.me {campaignId}` returns the caller's tracked
link/promo and recorded stats. It needs outer `confirm:true` because native GET
can create an assignment. Owner `deals.affiliate.analytics {campaignId}` reads
reporting; `query:{view:"creators",page:1}` pages creators. Do not equate reported
conversions with transferred earnings or fabricate conversions/imports.

Owner `deals.affiliate.configure {campaignId,body:{affiliate:{...}}}` closes
affiliate configuration after campaign creation; outer `confirm:true` is
required. Native economic terms remain locked after DRAFT. Read
[payloads.md](payloads.md#affiliate-configuration-and-real-conversion-import)
for exact units and fields. Secret rotation remains human/UI credential work.
For specifically approved **real** orders/refunds, owner
`deals.affiliate.importConversions {campaignId,body:{rows:[...]}}` accepts typed
native JSON rows, not raw CSV/arbitrary settlement instructions. Outer
`confirm:true` is mandatory: this can immediately settle/reverse real earnings.
Review every order ID, amount and attribution before dispatch; inspect per-row
results and analytics after partial/uncertain outcomes, never auto-replay.

Use the manifest's `requiredIds`; list/get results supply IDs. Native body
validation is authoritative; commands do not accept arbitrary role overrides,
approval bypasses, simulated top-ups or direct database repairs.

## Creative approval and already-published delivery

`deals.creatives.list/create/get/edit/submit/review/post/withdraw` preserve native
participation, editability, revision and stage checks. Read `creatives.get` and
review events before editing/submitting/reviewing. Re-read after conflict (409);
never overwrite another reviewer or assume approvals apply to a newer revision.
`withdraw` is terminal for a not-yet-posted creative, not an undo.

The bounded Desktop `POST /api/bridge/deals/asset-upload` adapter takes:
`{campaignId,filePath,creativeId?,creatorUserId?,confirm:true}`. Supply either
the owning editable creative's `creativeId` or the authorized thread's
`creatorUserId`; review the installed schema first. Creative uploads require
the current creator and `DRAFT`/`CHANGES_REQUESTED` in the same campaign.
Thread uploads require a native authorized BRAND/CREATOR/ADMIN context.
Only regular local files up to the native **512MiB** cap are accepted; the
destination is fixed `offer-assets`, never caller-controlled. Safe supported
types and the exact large-job protocol are in
[payloads.md](payloads.md#local-large-asset-uploads).
Files **≤10MiB** return HTTP201
`{attachmentId,attachment_url,attachment_type}` without signed query/hash or
`short_url`. Files **>10MiB through 512MiB** return HTTP202 with a **local job**;
GET `/api/bridge/deals/asset-upload/<jobId>` until its verified completion.
The job streams an unchanged approved file, using bounded direct Azure upload
or four concurrent 4MiB blocks and an ordered commit, then native ownership/
editability/size/type verification. No whole-file base64 or unbounded buffering.

An upload does **not** send a message or attach/submit a creative.
Use only a completed job's `attachment` or the small-upload receipt.
Attach via the separately confirmed native body:
creative attachments use `{label,url:attachment_url,kind:"image"|"video"|"link"|"doc"}`
(not the upload object; audio has no native audio creative kind).
After saving, `deals.creatives.attachment {creativeId,attachmentIndex:"0"}`
resolves that stored uploaded artifact to private ten-minute
`{downloadUrl,expiresInSeconds:600}`. Index is a string `"0"`–`"19"`;
the server rechecks viewer role and exact creator/campaign blob ownership.
Native creative UI links use the same authorized reader. External links are
not turned into a URL-signing/fetch proxy.

For a deliberate local cancellation, DELETE
`/api/bridge/deals/asset-upload/<jobId>`; it aborts local HTTP only, not a
remote rollback or blob deletion. A completed job cannot be cancelled.
After uncertainty, explicitly approved POST
`/api/bridge/deals/asset-upload/<jobId>/reconcile {"confirm":true}` performs
only native storage-state verification—**never re-uploads bytes or commits**.
Missing/partial remains unresolved; never automatically replay or discard it.
Jobs are memory-only and may be cleaned after 30 minutes on later starts:
app restart loses job/grant recovery. Native signed write URLs/grants stay
internal; no arbitrary URL/container or provider-token surface is exposed.

`creatives.post` attaches already-published content; **it does not publish to a
social provider**. For standard campaign delivery use
`submissions.list/create`, then owner `submissions.review` with
`{decision:"APPROVED"|"REJECTED",reason?}` or `submissions.escalate {reason}`.
Approval can immediately settle **REAL earnings** for an eligible URL-sourced
submission. Obtain the human's explicit financial/content approval first.
`submissions.refresh` accepts **only `{real:true}`**: live platform measurement
may settle eligible earnings. No manual/fabricated/demo view counts are exposed.
Provider publishing/consent remains `cl-content-publishing`'s separate workflow.

## Actual chat history, attachments and response

1. `deals.messages.inbox` locates authorized conversations.
2. `deals.messages.list` is **authorization metadata only**
   (`myRole,campaignTitle`), **not messages**.
3. `deals.messages.history {campaignId,creatorUserId,query:{limit:25,before?}}`
   returns actual oldest-to-newest messages in a bounded page (1–50), plus
   exclusive `nextBefore`. Continue with that cursor; realtime stays native UI.
   History reads do not mark anything read.
4. Attachments contain `attachmentKey/nativePath`, not raw stored signed URLs.
   `deals.messages.attachment {campaignId,creatorUserId,messageId,attachmentKey}`
   returns a native ten-minute `{downloadUrl,expiresInSeconds}`; keep it private.
5. After reviewing actual messages, `messages.markRead` uses
   `{body:{action:"markRead",messageId:"<viewed-id>"}}` plus outer confirmation.
6. Draft the exact response and obtain approval before `messages.send`.
   Text is **`params.body.body`**, not `text`:

```json
{"params":{"campaignId":"<campaign>","creatorUserId":"<creator>",
  "body":{"body":"The exact approved reply"}},"confirm":true}
```

The native send derives sender role and validates uploaded attachments.
For a separately approved attachment send, add
`params.body.attachments:[{attachmentId,attachment_url,attachment_type}]`
from the bounded asset upload result; keep `params.body.body` for the text.
On an uncertain send, inspect history; **never automatically resend** merely
because metadata/inbox state lagged or the transport timed out.

## Funding: prepare / human pay / recover, or proof / claim / human approval

### Provider checkout

Read `campaigns.get`, verify owner/managed/live state and amount.
`deals.funding.prepare {body:{amount}}` uses INR **major units** and creates a
native funding order after approval. It does **not** charge or credit budget.
Actual provider checkout/OTP/3DS is human in the native campaign funding UI;
do not automate dialogs or manipulate browser storage to inject an order.
Keep the exact order ID from the human-authorized attempt.

For an already-paid live order with a lost callback,
`deals.funding.reconcile {body:{orderId}}` plus outer confirmation invokes native
provider verification/idempotent credit. It only accepts live `order_...` IDs,
never simulation IDs, caller-supplied amounts or forged payment signatures.
202 means pending: retain the order ID and inspect campaign/payment state;
do not create or pay another order. Provider preparation is not proof of charge.

### Offline funding and proof

1. Owner `deals.campaigns.paymentClaims.list {campaignId}` returns native payment
   instructions and claim history. DIRECT/ended campaigns cannot be funded.
2. After approval, bounded Desktop
   `POST /api/bridge/deals/proof-upload`
   `{campaignId,filePath,role:"owner"|"admin",confirm:true}` uploads a local
   screenshot/photo/PDF through the **existing authorized multipart native
   route**. At most **5MiB**; PNG/JPEG/WebP/GIF/HEIC/HEIF/PDF, with native
   byte-sniffing/content/path checks still applied. Role defaults to owner;
   admin requires the actual signed-in Deals-admin role.
   HTTP201 returns `{proofUrl,contentType,size}` without signed query/hash;
   never supply an arbitrary URL. Do not replay an uncertain upload.
3. Owner `paymentClaims.create` body:
   `{amount,method?,reference?,paidAt?,note?,proofUrl?}`. Amount is INR major units.
   This is a report for verification, **not a credit**. Inspect returned/listed
   claim state; do not make a duplicate claim after an uncertain result.
4. Owner/admin `deals.funding.proof {claimId}` retrieves a native ten-minute
   artifact. It authorizes against the stored claim/campaign, not a supplied
   storage path. Do not log/share its signed URL.
5. If the user cancels before submission, separately confirmed
   `deals.funding.discardProof {campaignId,body:{proofUrl}}` (owner) or
   `deals.admin.payments.discardProof` (admin) discards only an unreferenced proof.
   Native protection refuses to delete evidence attached to a claim.
6. **Human Deals-admin financial decision:** `deals.admin.payments.list` reads
   pending/history; after actual human verification, existing
   `deals.admin.payments.record {campaignId,body:{amount,claimId?,method?,
   reference?,paidAt?,note?,proofUrl?,idempotencyKey?}}` credits **REAL spendable
   budget**. Reuse an approved attempt's stable idempotency key and inspect
   history/current budget before recovery. Never run this as a test or infer
   approval from an uploaded receipt. `admin.payments.reject` uses
   `{claimId,body:{action:"reject",reason}}`, also human-confirmed.

Other admin reads: `deals.admin.queue/tracking/activity`. Admin outreach
`deals.outreach.list/create/action` retains recipient/contact-basis and inner
confirmation checks; approval can schedule **real email**. Admin access does
not authorize a general account lookup, quota change, automatic transfer,
pricing publication, dispute reversal or provider payout.

## Verification and availability

Verify saved state/history after writes; read financial buckets separately
from impressions/creative approval/provider attempts. Source commands, deployed
web handlers, installed Desktop and packaged skills may be different revisions.
Never call live money/message/upload/delete/publish operations just to test
source coverage; use isolated mocks and native regression suites.

Related: `cl-offers` (offers/buyer subscriptions/invoices),
`cl-crm` (relationships), `cl-content-publishing` (separate provider publishing).
