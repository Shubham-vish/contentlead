# Private products, fulfillment and receipts

All commands below use `/api/bridge/offer-studio/commands/<name>` with
`{"params":{...},"confirm":true}` only where specified. Responses are native
JSON; preserve HTTP status and inspect native `error`/partial outcomes.
Every operation uses the current session, not a caller-supplied buyer/seller ID.

## Public free capture and coupon check

`offer.capture.submit` accepts `{offerName,email,name?,phone?,phoneCountry?,
responses?,marketingConsent?,consentText?,acquisitionReceipt?,turnstileToken?}`.
Approve exact real recipient, answers, delivery/message consequences and
consent before outer `confirm:true`. Never infer marketing consent; true
requires the actual reviewed consent text. `responses` has at most100 scalar/
string-array fields (strings≤2000, arrays≤100). No synthetic attribution object,
honeypot bypass or CAPTCHA solver. Native rate limits and optional human-solved
Turnstile verification remain. A Turnstile rejection is a genuine human
verification boundary, not permission to bypass it. Native partial dispatch
and private `deliveryUrl` must be inspected; do not auto-repeat a submission.

`offer.coupon.validate {offerName,code}` reads native public coupon validity
without consuming it, creating an order or paying. One-time/recurring platform
provider checkout, actual payment authorization/OTP/3DS still require the
human provider UI; never fabricate payment IDs or success callbacks.

Platform coupons are different: `offer.account.validateCoupon
{code,currency?:"INR"|"USD"}` delegates ContentLead's own native eligibility/
currency/rate-limit checks. One actual approved code, never enumeration.
This returns native validity/pricing but neither reserves a coupon nor
creates an order. The provider UI owns the actual platform payment attempt.

## Upload → catalog → sell

After specific approval for the exact local file, the source Desktop adapter is:

```text
POST /api/bridge/offer-studio/product-upload
{"filePath":"/absolute/approved/path/workbook.pdf","confirm":true}
```

Discover availability first: this module must be integrated and installed.
It forwards one multipart `file` to native `/api/digital-products/upload`.
Select a nonempty regular file within the Desktop allowed user directories,
at most **200 MiB** (native cap); symlinks are rejected. The adapter buffers the
bounded file and native multipart parser may also buffer it; large uploads are
not streaming/resumable jobs. Success: HTTP201 `{deliverable:{id,kind:"file",
label,blobPath,fileName,sizeBytes,contentType}}`. This is a private products
container receipt, not a public URL. Keep it private.

Pass the **returned deliverable** to `offer.product.create`'s `deliverables`
or `offer.product.addDeliverable`, then `offer.product.attachToOffer`.
Do not substitute `offer.media.upload`: that uploads public 5MiB images for page
branding, not private files. For links use `{kind:"url",label,url}`.
Product `amountPaise` is integer INR paise, unlike checkout `basePrice` in rupees.
Upload alone does not save/link a product, publish an offer or deliver anything.

For an existing bundle: `offer.product.update {productId,bundleChildIds:[...]}`
replaces its ordered child selection. Children must be owned non-bundle
products; self/nested/empty selections are rejected. Read `product.get` first;
review the complete replacement, update, then read back. Existing
`product.create {type:"BUNDLE",bundleChildIds:[...]}` creates a new bundle.

Upload timeout/invalid receipt is uncertain: no automatic replay or cleanup.
There is no upload-ID reconciliation endpoint. Inspect saved products and ask
for an explicit decision before a new upload; an unlinked private blob can remain.

## Seller: detect failures and recover exact delivery

1. `offer.leads.list {offerName,take?,skip?,q?,sort?,direction?,
   deliveryStatus?,marketingConsent?}` returns `{leads,total,take,skip}`.
   `take`1–1000, default100; `skip` defaults0. Delivery status is
   `PENDING|DELIVERED|PARTIAL|FAILED`; consent is boolean.
   Sorts: `name|email|phone|marketingConsent|deliveryStatus|createdAt`;
   direction `asc|desc`. This is owner-scoped PII, never a messaging-consent grant.
2. `offer.delivery.byLead {offerName,leadId}` returns the actual `deliveryId`.
   IDs are UUIDs; absence/404 is not a fabricated retry target.
3. Specifically approve recipient + offer + real channel dispatch + link
   invalidation, then `offer.delivery.resend {offerName,id}` with outer
   `confirm:true`. It rotates the link and attempts native email/WhatsApp.
   A revoked delivery cannot be restored by resend. Inspect `dispatch` per
   channel and reread leads: top-level `ok:true` is not proof every channel sent.
4. For separately approved access withdrawal:
   `offer.delivery.revoke {offerName,id,reason?}` with outer `confirm:true`
   revokes the link and entitlements. **It does not refund payment.**
   A saved false result is not successful revocation.

Resend has no requestId/idempotent dispatch guarantee. Never retry a timeout
automatically. Seller paid-delivery lookup beyond known IDs is not provided by
this lead-only resolver; use exact owned records/support rather than guessing IDs.
Configured thank-you WhatsApp/community links are edited through
`offer.thankyou.setStyle {offerName,style:{whatsappLink:"https://..."}}`.
Opening/joining an external community remains the buyer's action; configuration
is not evidence that a group invite was sent or a buyer joined.

## Buyer: saved access → contents → artifact

1. `offer.purchase.deliveries {take?,skip?}` lists saved digital deliveries for
   this signed-in account, including unclaimed matching-email deliveries.
   Returns `{deliveries,total,take,skip}` with source references, product IDs,
   expiry/revocation state, **not bearer tokens or blob paths**. A saved delivery
   alone is not proof recurring access is still valid.
2. Approve invalidating old emailed/bookmarked links, then
   `offer.purchase.open {id}` with outer `confirm:true`. Native ownership,
   guest-email claim, revocation and paid-period gates apply. Success:
   `{deliveryUrl}` for a fresh private `/deliver/<token>` link. Keep it private.
3. Extract the token **in memory only** and use
   `offer.purchase.contents {token}` to discover real product/deliverable IDs.
   This validates the token and returns labels/metadata without recording a
   download or exposing private blob paths.
4. After artifact-access approval,
   `offer.purchase.download {token,productId,deliverableId}` with outer
   `confirm:true` returns `{downloadUrl}`. It uses native exact-inclusion,
   expiry/revocation checks and records access. File URLs are native ten-minute
   SAS grants; external-link deliverables return their configured destination.
   It does not fetch caller URLs or return file bytes. Keep URLs private.

The command adapter requires an authenticated Desktop account, even though a
human can open a valid guest token in the public delivery page. Do not treat
guest possession as permission to claim another signed-in account. Expired or
revoked access is a truthful error, not permission to change token/expiry.
`offer.purchase.list {take?,skip?}` also reads the shared native purchase-page
inventory, including legacy purchases, ContentLead platform subscriptions,
free digital deliveries and **paid-but-unfulfilled** orders. It returns
`{purchases,total,take,skip,summary,scope}`. Response pages are bounded1–1000;
the underlying shared UI inventory loads all current account rows. TradingLead/
indicator subscriptions are excluded. Mixed-product account history does not
authorize unrelated purchases. A `processing` row exposes the real payment/order
reference for support, not a fictional delivery ID; do not pay again or invent
an entitlement-repair command.
Amounts and `summary.totalSpent` use the UI's native INR major-unit values.
This is the saved purchase-page projection (including one current platform
subscription row), not a full historical payment ledger or payout settlement.

## Billing, platform plan and seller reporting

- `offer.billing.get {}` → `{billing}` for current buyer GST/address details.
- `offer.billing.update {gstin?,gstLegalName?,billingAddress?}` needs outer
  `confirm:true`. At least one field; `null` clears. Address:
  `line1,line2,city,state,country,postalCode`. Native GST validation remains.
  Changes apply to **future checkout**, not existing frozen invoice snapshots.
  This is not platform-admin invoice branding or seller tax identity editing.
- `offer.account.plans {}` reads current **ContentLead platform** pricing,
  trial duration and checkout upsells. `offer.account.access {}` reads current
  session platform plan/access/expiry. Neither grants access, starts a trial,
  changes billing or authorizes payment. Human platform checkout remains
  `/contentlead/checkout`; do not automate OTP/3DS/provider dialogs.
- `offer.payments.list {offerName?}` returns native seller-owned paid Razorpay
  `{transactions,summary}` for one/all owned offers. It includes buyer PII and
  saved summary aggregates; no provider reconciliation/payout settlement.
  Native list is not cursor-paged. Do not infer platform fees, refunds, net
  payout or all historical business revenue from this summary.
  `offer.tracking.getLedger` remains the separate recorded conversion ledger.
