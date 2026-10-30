# Deals native payload quick reference

These are **`params.body`** examples, not top-level command envelopes.
Every write also needs **outer `confirm:true` after specific user approval**.
Read fresh native state first; returned IDs and validation errors are
authoritative. These examples do not grant publication, funding or approval.

## Profiles

- `deals.creator.register/edit`: required `displayName` when creating;
  editable fields include `headline,bio,pitch,avatarUrl,city,state,country,
  languages,niches,primaryPlatforms,socialLinks,publicContacts,contactMode,
  openToWork,listedPublicly,audienceCountries,audienceAgeBands,audienceGender,
  audienceNote,insightsMedia,submitForVerification`.
  `socialLinks:[{platform,handle?,url}]`,
  `publicContacts:[{type,value,label?}]`;
  contact mode is `PLATFORM|DIRECT|BOTH`. Public listing/submission requires
  the native completeness bar. Self-reported links never imply verified account
  ownership; use `deals.accounts.list` and its actual account/post IDs.
- `deals.brand.register/edit`: creating requires `legalName`; optional
  `brandDisplayName,gstin,isAgency,agencyName,agencyContactEmail,
  agencyContactPhone,websiteUrl,logoUrl,billingEmail,billingPhone,addressLine1,
  city,state,pincode,about,socialLinks:[{platform,url}]`.
  POST submits for review; identity changes can require a fresh review.
  Never supply `status,reviewedBy,reviewedAt,gstinVerified` to fake verification.
- Edits merge the native saved editable profile. Lists/arrays supplied in the
  body replace that field: retain existing entries unless removal was approved.
  Keep contact, audience, invoice and tax information private.

## Create, edit, publish, apply

`deals.campaigns.create` MANAGED draft example:

```json
{"title":"Product launch creators","description":"The actual approved brief",
 "platforms":["instagram"],"fulfillmentMode":"MANAGED","budgetTotal":1000,
 "requiresApproval":true,"ideaValidationRequired":true,
 "prePostApprovalRequired":true}
```

Budget is INR **major units**, currently at least 500. In a live-provider
environment this is requested budget, **not spendable funding**. Platform fee
is server-owned. Native simulated environments may credit play money:
never use simulated results as proof of real funding.
Optional `category,endsAt,productDetails,contentRequirements,assets,
payoutPerThousandViews,minViews,payoutPerClick,payoutPerThousandEngagement,
affiliate,notifyEmails,notifyPhones,showBrandContact,contactEmail,contactPhone,
contactNote` remain native validation inputs. Financial terms require review.
Target platforms are `instagram|youtube`; dates are future ISO strings.

DIRECT draft example:

```json
{"title":"Product collaboration","description":"The actual approved offer",
 "platforms":["instagram"],"fulfillmentMode":"DIRECT",
 "contactEmail":"brand@example.test",
 "compensation":{"types":["BARTER"]}}
```

DIRECT requires at least one real contact channel (`contactEmail,contactPhone,
contactInstagram,contactWebsite`) plus valid `compensation`.
It holds **no escrow** and is not a guaranteed ContentLead payout.
Compensation shape:
`{types:["PAID"|"BARTER"|"COMMISSION"|"DISCUSS"],minInr?,maxInr?,payBasis?,
commissionPercent?,note?}`.
PAID requires a positive `minInr` and
`payBasis:"PER_REEL"|"PER_POST"|"PER_STORY"|"PACKAGE"`; `maxInr` cannot be below
the minimum. COMMISSION requires `commissionPercent` greater than0 and at most100.
Never invent financial terms or contact details.

`campaigns.edit` wraps brief changes:
`{details:{title?,description?,productDetails?,contentRequirements?,assets?,...}}`.
Only `details` is accepted; use `campaigns.setStatus` for lifecycle and native
funding for budget. Native role/state rules may lock economic or affiliate terms
after participation. Read back the saved campaign and its completeness warnings.

- `campaigns.setStatus`: `{status:"ACTIVE"|"PAUSED"|"COMPLETED"|"CANCELLED"}`.
  `ACTIVE` can publish a draft or resume a paused campaign only if native gates
  allow it. It is not a field-level draft update.
- `campaigns.duplicate`: no body needed; returned campaign is an unfunded draft.
- `campaigns.join`: no body needed; returns native participation state. A pending
  application is not acceptance.
- `applications.review`: `{action:"approve"|"reject",reason?}` with both
  `campaignId,participationId` in params. Only still-pending applications transition.
- DIRECT `campaigns.apply`: `{message?}`. Owner `leads.update`:
  `{status:"NEW"|"CONTACTED"|"ARCHIVED"}` with campaignId and leadId.
- DIRECT `campaigns.reportBrand`: `{reason:"NO_RESPONSE"|"NO_PAYMENT"|"OTHER",note?}`.

## Creatives and submissions

- `creatives.create`: `{ideaTitle?,ideaBody?,draftNote?,attachments?}`.
  The native participation/campaign snapshot chooses IDEA or DRAFT; caller
  cannot choose an arbitrary stage/status/approval.
  IDEA needs title/body; DRAFT needs note or attachment.
- `creatives.edit`: the same editable payload fields while DRAFT or
  CHANGES_REQUESTED. `ideaTitle` max255; ideaBody/draftNote max20000.
  Attachments replace the list, max20:
  `[{label:"Approved draft",url:"<plain uploaded URL>",kind:"video"}]`;
  kinds are `image|video|link|doc`. Keep existing attachments when appending.
- `creatives.submit`: no body needed; native transition bumps revision.
- `creatives.review`: `{decision:"approve"|"changes"|"reject",note?}`;
  changes requires a note (max1000). Do **not** use submission-style uppercase
  decisions here. Read the resulting creative/review events before next step.
- `creatives.withdraw`: no body needed; terminal before posting.
- `creatives.post` and `submissions.create` accept the **already-published**
  content body:
  - Connected post: `{url,platform,verifiedPlatform,verifiedAccountId,mediaId,
    verifiedAccountHandle?,thumbnailUrl?}` from `accounts.list/posts`.
    Ownership is checked server-side; never forge account identifiers.
  - URL fallback: `{url}` for a supported public Instagram/YouTube post.
    It is not ownership-verified and has native review/settlement restrictions.
- `submissions.review`: `{decision:"APPROVED"|"REJECTED",reason?}`.
  This is a **financial gate**: approval can settle real earnings.
- `submissions.escalate`: `{reason}`. `submissions.refresh`: **only `{real:true}`**,
  not `views`, `simulate`, or caller-reported measurements.
- `assessment.run`: `{attachmentIndex,confirm:true}` in the body **as well as
  outer confirmation**. Uses actual media/quota; advisory assessment is never
  creative approval or payment authorization.

## Read paging

- `creatives.list`: `params.query.cursor` follows returned `nextCursor`
  (up to200/page).
- `messages.history`: `{limit:1..50,before?}` follows returned `nextBefore`.
- `campaigns.paymentClaims.list`: native owner campaign instructions/history.
- `admin.payments.list`: `params.query:{view:"pending"|"history",page?}`.
- `withdrawals.list`: last100, no arbitrary owner/account selector.
- Never infer “all history” from a bounded last-N list or a page without
  consuming its cursor. Metadata, creative stage, verified payment, available
  balance and completed transfer are separate evidence.

## Local large asset uploads

These are Desktop **local API routes**, not `params.body` command envelopes.
They upload only the exact approved regular local file in an authorized
creative or thread context. No caller-supplied upload URL/account/container.

```text
POST /api/bridge/deals/asset-upload
{"campaignId":"<campaign>","creativeId":"<editable-owned-creative>",
 "filePath":"<approved-absolute-local-path>","confirm":true}
```

For chat, replace `creativeId` with `creatorUserId`; do not supply both.
Creative context requires the owning creator, matching campaign and native
editability. Thread context requires the authorized BRAND/CREATOR/ADMIN role.
Source files, symlinks, size/type and context are checked; approval does not
permit another file, account or destination.

### Sizes, types and transfer

- **≤10MiB:** existing bounded multipart path; HTTP201 returns only
  `{attachmentId,attachment_url,attachment_type}`.
- **>10MiB through512MiB:** HTTP202 returns a local job. Files below256MiB use
  bounded direct streaming; larger files use four concurrent4MiB blocks and an
  ordered block-list commit. File-change checks run before committing blocks.
  No full-file base64, whole-file buffer or arbitrary storage proxy.
- Both native Deals upload UIs cap files at512MiB. Larger files are rejected,
  not silently split into unrelated assets or labeled a human-approval step.
- Supported safe extension/MIME pairs:
  - Images: `jpg/jpeg,png,webp,gif,avif,heic/heif,bmp,tif/tiff`.
  - Video: `mp4,m4v,mov,webm,mkv,avi,mpeg/mpg`.
  - Audio: `mp3,wav,m4a,aac,ogg,flac` (chat; creative kinds have no audio kind).
  - Documents: `pdf,txt,md,doc,docx`.
  Native MIME/extension matching is required. SVG, HTML, executable and generic
  ZIP uploads are not exposed; never rename a rejected file to bypass checks.

The native grant fixes caller/campaign/target, file metadata and a derived
`offer-assets` blob path. Signed write URL/grant stay private inside transport:
two-hour write window,24-hour read-only completion/reconciliation window.
Native verification rechecks current role/editability and committed BlockBlob
properties against the approved size/MIME before returning a plain receipt.
This is not antivirus/content approval or a cryptographic proof of file content.

### Job inspection and recovery

| Local route | Exact purpose |
|---|---|
| `GET /api/bridge/deals/asset-upload` | `{jobs,maxConcurrent:2,restartPersistent:false,storageCleanup:false}`. Do not select or cancel another task's job. |
| `GET /api/bridge/deals/asset-upload/<jobId>` | Cache-only job snapshot; polling is not a new provider/native verification. |
| `DELETE /api/bridge/deals/asset-upload/<jobId>` | After explicit cancellation instruction, abort local transfer/work only. No blob deletion, transaction rollback or remote cleanup. Completed returns409. |
| `POST /api/bridge/deals/asset-upload/<jobId>/reconcile` with `{"confirm":true}` | Deliberately verify native storage state after uncertainty. Calls **only native status**, never re-uploads bytes, re-commits blocks or repeats complete. |

Job keys:

- Identity: `jobId,campaignId,creativeId` **or** `creatorUserId,fileName,size`.
- State: `status:"running"|"cancelling"|"completed"|"failed"|"cancelled"`;
  `stage:"init"|"upload"|"commit"|"complete"`.
- Progress: `uploadedBytes,totalBlocks,acknowledgedBlocks`.
- Evidence: `outcomeUncertain,stagedBlocksMayRemain,cancellationRequested`,
  `updatedAt` (milliseconds), and
  `fileSnapshot:"pending"|"unchanged"|"failed"`.
- Fixed safety facts: `submitted:false,automaticReplay:false,
  remoteCleanupAttempted:false`.
- On verified success: `attachment:{attachmentId,attachment_url,attachment_type}`.
- On failure: `error:{code,message,httpStatus?}`; no SAS/grant/full local path.
- After reconciliation: `storageState:"missing"|"uploaded"`. Verified uploaded
  can become completed with an attachment; missing is **not proof of rollback**
  and may retain partial/staged uncertainty.

Use the attachment only after verified completion. A cancellation racing a
verified completion may return `completed` with `cancellationRequested:true`;
never claim the object was rolled back or deleted. A known file-identity/change
failure cannot be repaired merely by observing matching size/type in storage.
Local read/stat/size/mtime/ctime failures produce
`error.code:"file_approval_integrity_failed"`; pending or failed file snapshots
cannot be promoted by reconciliation (HTTP409, no attachment). An unchanged
snapshot plus a lost commit response can be recovered by native status alone.
No automatic retry, replay, discard or cleanup follows an uncertain response.

At most two concurrent jobs and32 in-memory entries; older job cleanup runs on
later starts after30minutes. **Not restart-persistent:** restarting Desktop or
job eviction loses its private grant/recovery context. Report that boundary;
do not fabricate saved status, guess blob paths or start another upload
automatically. Neither cancellation nor local job cleanup removes remote blobs
or staged blocks.

### Attach, review, then submit separately

- Creative edit attachment:
  `{label:"Approved draft",url:attachment_url,kind:"video"}`.
  Preserve the existing attachment list and separately approve the edit.
- After saving, `deals.creatives.attachment` params
  `{creativeId,attachmentIndex:"0"}` returns a private ten-minute
  `{downloadUrl,expiresInSeconds:600}` for the stored creator-owned uploaded
  artifact. Index is a string0–19. No caller URL/path is accepted.
  The native UI uses the same viewer-authorized reader for those private blobs.
- Chat send attachment:
  `params.body:{body:"Approved reply",attachments:[{attachmentId,
  attachment_url,attachment_type}]}` plus outer confirmation.
  New large chat paths remain `deal-chat/<campaign>/<creator>/<file>`;
  sender sanitization and receiver `deals.messages.attachment` retain native
  thread/stored-message authorization. The upload is not a message send.

An uploaded file is not a submitted creative, approval, social publication or
payment. Re-read the current creative/revision or actual chat history before
the next separately approved operation.

## Affiliate configuration and real conversion import

`deals.affiliate.configure` uses:

```json
{"campaignId":"<owned-campaign>","body":{"affiliate":{
 "affiliateEnabled":true,"affiliatePayoutMode":"CPA_FLAT",
 "destinationUrl":"https://brand.example/offer",
 "cpaFlatPayout":100,"attributionWindowHours":168,
 "conversionHoldDays":7,"promoCodePrefix":"BRAND"}}}
```

Send outer `confirm:true` after approving the exact terms. Allowed fields:
`affiliateEnabled,affiliatePayoutMode,destinationUrl,attributionWindowHours,
conversionHoldDays,cpcPayout,cpaFlatPayout,commissionPct,maxCpcClicksPerCreator,
maxConversionsPerCreator,promoCodePrefix`. Modes:
`DISABLED|CPC|CPA_FLAT|COMMISSION|HYBRID`.
Payouts are INR **rupees**, commission is percentage points0–80, attribution
24–720 hours, hold0–60days. Native validation and campaign ownership remain.
Nonempty partial URL/prefix updates work on published campaigns; economic
changes then return409. Draft configuration should supply the complete intended
terms: omitted draft fields use native defaults, not a generic merge.
No top-up/status/provider-signature fields are accepted here.

`deals.affiliate.importConversions` is the native manual-import business action:

```json
{"campaignId":"<owned-campaign>","body":{"rows":[
 {"order_id":"<real-order>","order_value_paise":250000,
  "promo_code":"<actual-promo>","occurred_at":"2026-10-30T10:00:00Z","status":"paid"},
 {"order_id":"<real-refunded-order>","status":"refunded"}
]}}
```

Again outer `confirm:true`, after reviewing every real source order, amount,
attribution and refund decision. Row fields only:
`order_id,order_value_paise,net_order_value_paise,promo_code,click_id,short_code,
creator_user_id,occurred_at,status`. Values are integer INR **paise**, not rupees;
paid rows require `order_value_paise`. Status:
`paid|refund|refunded|chargeback|cancelled|canceled`; ISO timestamp optional.
1–1000rows, also bounded by the command route's body limit; split only
deliberately reviewed disjoint batches, never retry uncertain rows blindly.
Native campaign/order-ID deduplication and attribution apply, but this is not a
batch transaction: inspect `{accepted,reversed,rejected,errors}` and analytics.
Imports can immediately credit/reverse **real** creator earnings.
Never fabricate order evidence, convert heuristic clicks into paid orders or
use a new order ID to evade a prior rejection/deduplication result.
