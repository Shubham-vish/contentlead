---
name: cl-offers
description: Build and edit ContentLead offers and four builder surfaces, checkout branding, recurring billing, free capture, private digital products/bundles, fulfillment recovery, coupons, email and tracking. Inspect buyer deliveries and native file artifacts, buyer GST details, ContentLead plan/access, seller payments/leads/subscribers and owned invoices. Provider authorization and financial approval remain human.
tags: offers, checkout, recurring, subscriptions, digital delivery, products, branding, tracking, desktop bridge
---

# ContentLead Offer Studio

## Connect without disturbing the current app

Read fresh `~/.skilltown-desktop/api.json` locally; never print its token.
Use its loopback port/bearer for authenticated `/api/health` and `/api/app/auth`,
then `GET /api/bridge/offer-studio/commands`.
No mounted video editor is required. If the app is unavailable or signed out,
report that boundary; do not start, restart, reload or switch it just to discover
commands. Source support, packaged/installed Desktop and deployed website
availability are separate.

The local bridge forwards through the app's same-origin authenticated session:

```text
POST /api/bridge/offer-studio/commands/<exact-name>
{"params":{...}}
```

In-app equivalent: `POST /api/offer-studio/commands/<exact-name>`.
The manifest is `{commands:[...]}`, not an editor command catalog.
The source manifest combines the builder/tracking registry with the native
buyer subscription/invoice and commerce adapters. [commands.json](commands.json) is a source-derived
snapshot of every exact name, schema, requirements and idempotence flag.
The runtime manifest wins. Read its selected command, never guess a field.

Put `offerName` **inside `params`**, especially for builder commands whose schema
requires it. Web-only top-level `offerName` sets context but does not satisfy a
required `params.offerName`. Identity comes from the signed-in session only.

## Envelopes and recovery

- Ordinary Offer Studio success:
  `{ok:true,command,result:{ok:true,data,message?,undo?}}`.
- Ordinary failure may be top-level `{ok:false,error,validationErrors?}` or nested
  `{ok:false,command,result:{ok:false,error,code?,details?}}`.
- Tracking uses its own route branch:
  `{ok:true,data}` / `{ok:false,error,code?,details?}`; route-level authentication,
  validation and authorization errors can have another HTTP error envelope.
- `offer.subscription.*` and `offer.invoice.*` return **native JSON directly**,
  not `result.data`. Read HTTP status; native failures use `{error:"..."}`.
  Their strict envelope is `{params:{...},confirm?:true}`. Start/check/cancel
  and invoice get/download require **outer** `confirm:true`.
- `offer.leads.*`, `offer.payments.*`, `offer.delivery.*`, `offer.purchase.*`,
  `offer.billing.*` and `offer.account.*` also return native JSON directly.
  Delivery resend/revoke, purchase open/download and billing update require
  **outer** `confirm:true`; they use the same strict `{params,confirm?}` envelope.
- `offer.capture.submit` and `offer.coupon.validate` are also native-JSON
  adapters. Capture requires explicit approval plus outer `confirm:true`;
  it can send real messages/grant access. Coupon validation is read-only.
- Inspect HTTP status **and** `ok`; do not assume error is always an object or
  that success data always lives under the same key.
- Only a recognized JSON session rejection permits the bridge's one session
  refresh. A timeout, HTML, invalid JSON, redirect or gateway failure is an
  uncertain mutation outcome: inspect saved state, never automatically replay.
- Some commands return an undo recipe. It is not a transaction, revision lock or
  permission to overwrite later edits. Read fresh state before an approved undo.
  `idempotent:true` does not authorize an automatic retry.

## Workflows and ownership

| Work | Commands / important contract |
|---|---|
| Discover / create | `offer.list`; `offer.create {title,slug?,template?,status?}`. Default is draft. |
| Rename / copy / lifecycle | `offer.rename {offerName,title?,slug?}`, `offer.duplicate`, `offer.archive`, `offer.publish`, `offer.unpublish`. Confirm consequential publication/removal first. |
| Sections | `offer.builder.list`, `.listTemplates`, `.add`, `.remove`, `.move`, `.duplicate`, `.rename`, `.setSpacing`, `.setHidden`, `.updateCode`, `.rewriteWithAI`, `.swapTemplate`. |
| Whole page | `.listPresets`, `.applyPagePreset`, `.generatePage`. Presets are sales-page kits, not a promise of surface-specific checkout/email layouts. `replace` discards existing sections; `append` preserves them. |
| Page settings | `.setPageSettings` takes fields directly, **not `patch`**; e.g. `{offerName,surface:"checkout",presentationMode:"drawer"}`. |
| Buyer actions | `.listActions`, `.createAction`, `.updateAction`, `.deleteAction`, `.attachAction`, `.detachAction`, `.generateAction`. Custom actions are offer-wide; bindings are section/surface-specific. |
| Checkout commerce | `.setTitle`, `.setBasePrice {basePrice}`, `.setGstRate {gstRate}`, `.addBonus`, `.removeBonus`, `.setSuccessMessage`, `.setUrgencyText`, `.addUpsell`, `.removeUpsell`, `.setOrderBump`, `.setBilling`. Prefix: `offer.checkout`. |
| Branding | `offer.checkout.setStyle {style}`, `offer.thankyou.setStyle {style}`, `offer.style.listPresets` / `.applyPreset`. Style objects merge; inspect schema for exact fields. |
| Sales-page theme | `offer.theme.applyPreset`, `.setColors {primaryColor?,secondaryColor?,accentColor?,bgColor?,textColor?}`, `.setFont {fontFamily,fontScale?}`, `.setRadius {radius}`, `.setMeta`. Theme radius is an enum, not pixels. |
| Coupons | `offer.coupon.create {code,discountType,discountValue,...}`, `.update {code,updates}`, `.delete`, `.expire`. Offer-scoped; not available with recurring billing. |
| Free capture | `offer.digital.getConfig`, `.setMode`, `.setCapture`, `.setFormFields`, `.addFormField`, `.removeFormField`, `.generateForm`, `.setNurture`, `.preflight`. Free capture is on the sales page, not paid checkout. |
| Digital catalog / delivery | `offer.product.list`, `.get`, `.create`, `.update`, `.remove`, `.restore`, `.addDeliverable`, `.removeDeliverable`, `.attachToOffer`, `.detachFromOffer`, `.listForOffer`. Use returned product/deliverable IDs. |
| Buyer email | `offer.email.setSubject`, `.setBody`, `.setReplyTo`, `.sendTest {offerName,to}`. A test sends real email: obtain approval. No `templateId` field. |
| Media / AI | `offer.media.upload {dataUrl,fileName}`, `.list`, `.delete`, `.generateImage`; `offer.generatePage`, `offer.rewriteCopy`, `offer.suggestPricing`. Upload does **not** accept a local `filePath`. AI calls may consume quota. |

For section commands use `surface:"offer"|"checkout"|"thankyou"|"email"`; omitted
means `"offer"`. Always read the selected surface first. Non-offer sections are
stored separately under `offer.surfaces[surface]`; editing one must not replace
sales-page sections. Discover template IDs with `listTemplates {surface}`.

Common exact fields:
`add {offerName,surface,type,templateId?,position?}`,
`rename {offerName,surface,sectionId,name}`,
`setSpacing {offerName,surface,sectionId,marginTop?,marginBottom?,textAlign?}`,
`rewriteWithAI {offerName,surface,sectionId,prompt}`,
`attachAction {offerName,surface,sectionId,attachId,binding:{actionId,params?,order?}}`.
Actions use IDs for update/delete/bindings, not display names. Read schemas for
required `kind` and all other fields.

## Paid / recurring example (configuration, not buyer authorization)

```json
{"params":{"title":"Founder Sprint","slug":"founder-sprint","template":"course"}}
```

Send that to `offer.create`, then with its actual returned slug:

```text
offer.checkout.setBasePrice {offerName:"founder-sprint",basePrice:4999}
offer.checkout.setGstRate {offerName:"founder-sprint",gstRate:18}
offer.checkout.setBilling {offerName:"founder-sprint",billing:{
  mode:"recurring",period:"monthly",interval:1,totalCycles:12}}
offer.builder.setPageSettings {offerName:"founder-sprint",
  surface:"checkout",presentationMode:"drawer"}
```

Amounts are INR major units here; GST is percentage points (`18`, **not `0.18`**).
Recurring cadence is finite, at most ten years; daily intervals must be 7–366
days. Paid recurring offers require a valid fixed price and no coupons, upsells
or order bumps. Changing configuration affects **new buyers**, not existing
mandates. Use `{billing:{mode:"one_time"}}` to return to one-time checkout.
Do not silently remove incompatible extras or manufacture buyer consent.

### Buyer subscriptions: prepare → human authorize → inspect/recover → cancel

These are native subscription commands, **not seller builder operations**.
All rows below except `subscribers` use the buyer session; cancellation also
allows the owning seller:

| Exact command | `params` and contract |
|---|---|
| `offer.subscription.list` | `{}`; last 100 current buyer subscriptions, saved state only. |
| `offer.subscription.subscribers` | `{offerName}`; owning seller only, latest 100 subscribers with permitted buyer identity, captured-cycle count and paid-through summary. No provider reconciliation. |
| `offer.subscription.prepare` | `{offerName}`; fresh terms, quote, enabled/preview state, existing subscription and current buyer identity. |
| `offer.subscription.start` | `{offerName,requestId,quote,consent:true,acquisitionReceipt?}` plus outer `confirm:true`. `requestId` is a stable UUID; quote is the exact current 64-character hash. Creates/prepares a provider mandate, **not permission to authorize it**. May contact provider/send its notification. |
| `offer.subscription.get` | `{offerName,id}`; buyer-owned saved state and payment cycles, no provider reconciliation. |
| `offer.subscription.check` | `{offerName,id}` plus outer `confirm:true`; provider reconciliation can persist verified payments/access. Does not accept checkout signatures/provider tokens. |
| `offer.subscription.cancel` | `{offerName,id}` plus outer `confirm:true`; native buyer-or-creator cancellation checks remain. Stops future renewals; paid access is retained. |

1. Prepare and review exact price/cadence/cycle count/account. If preview or
   disabled, stop; never override the gate. Obtain the buyer's explicit consent
   before start; `confirm:true` alone is **not** recurring-payment consent.
2. Save request UUID and resulting subscription ID. On uncertain start, inspect
   `list`/`get` before any deliberately approved retry; reuse the same request ID
   and never create another payable attempt to “fix” a timeout or stale quote.
3. **Human handoff:** buyer opens `/offers/checkout/<offerName>` to review and
   authorize in the official provider checkout (OTP/3DS/mandate consent).
   `/offers/<offerName>/subscription?id=<id>` is the saved-state management
   receipt, not a substitute for the authorization checkout. Do not automate
   provider dialogs, forge signatures, inject browser storage or grant consent.
4. After the human finishes, use `check`, then `get`; inspect cycle state,
   access and delivery-pending evidence. A prepared mandate is not a purchase.
5. Before cancellation, read current state and obtain specific approval.
   Inspect `cancelRequestedAt` versus `cancelConfirmedAt`; pending is not stopped.

Seller cancellation: read `subscribers`, identify the exact owned subscriber,
obtain approval for future-charge cancellation, then `cancel {offerName,id}`.
Re-read `subscribers`; seller access does not permit buyer-only `get`/`check`.
Cancelled subscription status alone does not revoke a verified paid period.
Lists are bounded to the latest 100; `limitReached:true` on the seller list is
an explicit boundary, not a claim that older records do not exist.

### Owned invoices

`offer.invoice.list {}` lists up to 200 current-session paid transaction invoices.
The native billing surface can include other products bought by this account;
this skill only operates on the requested ContentLead purchase. Use its actual
transaction `id`, never an invented invoice/order number.

`offer.invoice.get {id}` and `offer.invoice.download {id}` both require outer
`confirm:true`: first access may allocate/freeze invoice tax metadata; download
may render/upload the PDF. Download returns `{downloadUrl,fileName}` through
the native paid-ownership gate (`redirect=0`), **not PDF bytes**. Use only that
short-lived artifact, keep the signed URL private, never log it, and do not
send a caller-selected URL to a generic proxy. Expiry means request a fresh
native artifact, not modify the signature.

No autonomous charge/refund, provider-plan editing, cron/webhook invocation,
platform discounts/trial policy or administrator billing/access control is
provided. Those remain explicit authorized human/UI operations.

## Fulfillment, purchases and reporting

See [fulfillment.md](fulfillment.md) for private local-file upload → product /
bundle → offer attachment, failed delivery recovery, buyer reaccess/download,
buyer billing/GST, ContentLead own plans/access and seller transaction reporting.
Public `offer.media.upload` images are **not** private digital-product files.
The new local product-upload module requires Desktop integration/packaging;
discover its installed endpoint rather than assuming a source addition is live.

## Tracking and measurement

`cl-meta-ads` owns official human-approved OAuth, asset selection, owned reports,
sync/jobs and attribution limitations. Six Offer commands use immutable owned
offer IDs (not mutable slugs):
`offer.tracking.get`, `.update`, `.getLedger`, `.getDeliveryDiagnostics`,
`.events.list`, `.summaries.get`.
See [tracking-commands.md](tracking-commands.md) and
[tracking-workflows.md](tracking-workflows.md).

Custom interactions use `tracking.update`'s `input.events.custom`:
omitted preserves, array replaces, `[]` clears. Browser observations, Pixel
attempts, provider acceptance and verified business transitions are different.
No command grants visitor consent, accepts provider tokens, fabricates purchase
events or changes ad spend. Ledger coverage is partial, instrumentation start
unknown and backfill not performed; do not call it all historical revenue.
Reporting permission does not imply CAPI permission or live verified delivery.

## Safety and verification

Confirm the exact offer and requested consequential action before writes,
publication, deletion, real email or paid AI/provider activity. Offer commands
do not universally require an `acknowledged`/`confirm` field: do not invent one,
and do not treat its absence as authorization.

Read back the selected surface/configuration after a write. Previewing a page
does not prove a payment, delivery, email or Pixel event happened. Never submit
a live checkout, send messages, seed cloud data or use shared localhost services
merely to audit source. Prefer isolated mocked tests. Do not promise custom
checkout inputs, replacement payment flows or unsupported billing automation.

Related: `cl-crm` (relationships/read-only customer and payment views),
`cl-webinars` (event CTAs), `cl-meta-ads` (owned measurement),
`cl-ai-media` (assets), `cl-content-publishing` (separately approved promotion).
