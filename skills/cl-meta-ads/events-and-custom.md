# Offer events and optional custom interactions

Discover both command manifests using the startup in `SKILL.md`. These recipes
configure tracking or read recorded activity; they never send/fabricate events,
grant visitor consent, approve OAuth, or change campaigns/budgets.
Exact schemas: [Offer tracking commands](../cl-offers/tracking-commands.md).

## Manual Pixel and standard events

1. Resolve immutable owned offer IDs with `offer.list`.
2. Read `offer.tracking.get` with `{"params":{"offerId":"offer_example"}}`.
3. Only on an explicit setup request, call `offer.tracking.update` with the same
   offer ID and a complete writable `input`, preserving unrelated saved fields.
   Never copy read-only DTO fields such as `status`, `version`,
   `credentialConfigured` or `customEventTargets` into `input`.
4. For independent browser-only setup use the human-supplied numeric `pixelId`,
   `enabled:true`, `consentRequired:true`, and null linked
   `connectionId`/`adAccountId`/`datasetId`. Do not detach existing linked
   server-delivery configuration unless explicitly requested.
5. Standard `events` fields are `landing:"ViewContent"|null`,
   `landingPageView:boolean`, `checkout:"InitiateCheckout"|null`,
   `addPaymentInfo:"AddPaymentInfo"|null`, `thankyou:null`,
   `thankyouPageView:boolean`, `freelead:"Lead"|null`,
   `purchase:"Purchase"|null`. Preserve the desired existing mapping.
6. Read configuration back. A configured Pixel is not verified delivery.
   Lead/Purchase come from verified business transitions, never a thank-you
   visit or arbitrary button. Email has no tracking surface.

Reporting OAuth is optional for independent manual browser tracking. Linked
CAPI still needs separately reviewed grants and authorized assets; reporting
readiness is not CAPI readiness. The agent never grants visitor consent.

## Optional custom interaction

Read `offer.tracking.get` and use its `customEventTargets` for actual section IDs
and action names on the selected surface. Do not guess targets or write JS.
Custom interaction definitions are limited to 20:

```json
{
  "id": "details-opened",
  "eventName": "DetailsOpened",
  "label": "Details opened",
  "enabled": true,
  "surface": "offer",
  "trigger": {"type": "action", "actionName": "openDetails", "phase": "success"}
}
```

Replace the example action with a discovered action. Alternative triggers:
`{"type":"click","sectionId":"details"}` or
`{"type":"section_view","sectionId":"details"}` on a discovered section.
`surface` is `offer|checkout|thankyou`, never email. IDs are stable,
1–100 alphanumeric/underscore/hyphen characters; `eventName` starts with a
letter and has at most 40 alphanumeric/underscore characters. Optional labels
are 1–80 characters. IDs and names must be unique case-insensitively.

Save using the existing `offer.tracking.update` complete input:
**omitting `events.custom` preserves saved definitions; supplying an array
replaces the entire custom list; `[]` removes all.** Read/merge first when adding,
editing, disabling or deleting one definition. Other tracking fields are not
generic patches. Re-read before overwriting concurrent edits.

Reserved Meta standard names (case-insensitive): PageView, ViewContent, Search,
AddToCart, AddToWishlist, InitiateCheckout, AddPaymentInfo, Purchase, Lead,
CompleteRegistration, Contact, CustomizeProduct, Donate, FindLocation, Schedule,
StartTrial, SubmitApplication, Subscribe. No custom financial value/currency
payload, raw JavaScript, provider tokens, owner identity or visitor consent input.
Backend validation remains authoritative for targets and reserved names.

## Central all-offer / selected-offer activity

`offer.tracking.summaries.get` reads summary cards:

```json
{"params":{}}
```

Omit `offerIds` for all owned offers; select a subset using
`{"params":{"offerIds":["offer_example","offer_second"]}}`.
Both commands accept at most 50 selected IDs; `[]` is invalid, not “all”.
Unowned IDs are rejected, never silently widened to all offers.

`offer.tracking.events.list` reads the same central journal as the seller UI:

```json
{"params":{"offerIds":["offer_example","offer_second"],"source":"browser","limit":20}}
```

Optional filters: ISO `from`/`to`, `eventName`, `source:browser|server`,
`status`, opaque `cursor`, `limit` (1–100; default 50).
Response `data.events` contains curated records and `data.nextCursor`.
Continue with the exact returned cursor and unchanged filters; stop at null.
Never decode/build cursors or send visitor acquisition receipts through commands.

Statuses: browser_observed, pixel_dispatch_attempted, failed, blocked, verified, pending,
processing, retry, delivered, dead, cancelled.
Browser-observed means observed locally; Pixel dispatch attempted means `fbq`
was attempted, not accepted by Meta. Server `metaAccepted`/delivery status is a
separate signal, not verified ad attribution (`attributionVerified:false`).
Business verification is not a count of browser events. Correlated browser and
server rows must not be double-counted as purchases/revenue. Use
`offer.tracking.getLedger` for recorded verified business totals by currency.
Historical instrumentation coverage remains unknown/partial; no backfill is
implied by the journal, summary cards, or an empty result.

Already-consented observations can wait briefly for receipt acquisition:
the browser keeps at most 100 events in memory for 30 seconds, batches up to 20,
and makes at most three bounded journal-delivery attempts without repeating
Pixel dispatch. Original event IDs/timestamps/configuration are retained.
Withdrawal, unmount, configuration or offer changes clear pending work; no
pre-consent activity is captured. Canonical Lead/Purchase observations require
their original acquisition receipt. Missing/expired observations must not be
interpreted as confirmed absence of business activity.

After timeout, HTML, transport, 502 or 504, never blindly replay setup mutations.
Read saved configuration first. Only recognized JSON session 401 permits the
existing bridge's single cookie refresh/retry.
