# Owned Meta Ads workflows

## Audit

Perform discovery and auth checks from `SKILL.md`. Read `metaAds.getConnection`,
then `metaAds.listAdAccounts`. Choose only an account actually returned for this
owner. Read its existing report/date window; inspect `metaAds.listJobs` and
`metaAds.getJob` when stale or pending. Do not queue a sync merely to audit.
For a known immutable owned offer ID, read `offer.tracking.get`,
`offer.tracking.getLedger` and `offer.tracking.getDeliveryDiagnostics`.
Report missing setup, provider errors, queued work and unknown live verification
honestly. Never run a global conversion-outbox drain.

## Setup

Read connection readiness first. If the user asked to connect, call
`metaAds.beginOAuth` with a relative return path. Give the official returned URL
to the human; never approve scopes or claim URL creation means connected.
After their approval, re-read status and `metaAds.listAdAccounts`. Check
`permissionReadiness` before choosing a dataset. Report-only setup selects the
account using `metaAds.selectAssets` with `datasetId:null`, without requesting
dataset/Pixel edges. For eligible CAPI setup, use `metaAds.listDatasets` for the
selected account, then select only listed IDs using `metaAds.selectAssets`.
Explicitly requested disconnect uses `metaAds.disconnect`.
OAuth credentials remain server-side; no manual token input command exists.

Check `permissionReadiness` before configuring server conversion delivery.
Reporting eligibility uses `ads_read`; CAPI eligibility additionally requires
`business_management`, `ads_management` and `pages_read_engagement`. Missing
permissions are returned separately for reports and CAPI. App Review/advanced
access, the applicable Marketing API access tier, customer authorization and
asset/Pixel management access are human/platform setup prerequisites, not
something the agent can grant.
See Meta's [Conversions API as a platform prerequisites](https://developers.facebook.com/documentation/ads-commerce/conversions-api/set-up-conversions-api-as-a-platform).

A reporting-only connection can select an account without a dataset. Discovery
and selection are read-only provider operations, not proof of CAPI readiness.
Do not enable offer tracking with linked OAuth references when `.capi.eligible`
is false: that save is rejected with `missing_capi_permission`. Tracking can
report `report_only` with `credentialConfigured:false`. Independent browser-only
Pixel configuration still requires visitor consent. Even `.capi.eligible:true`
and configured credentials do not prove delivery: retain `deliveryVerified:false`.
Possessing `ads_management` never adds campaign/budget/pause/spend commands.

## Offer tracking

Resolve the immutable offer ID from an owned offer, never the slug as an ID.
Read `offer.tracking.get` before editing. `offer.tracking.update` takes the full
validated `input` object; preserve fields the user did not ask to change.
Choose linked connection/account/dataset only from owner-scoped discovery.
Consent remains required. Landing/thank-you PageView options are independent
of ViewContent and checkout/AddPaymentInfo. A thank-you route is never a
purchase signal: the `thankyou` conversion field must remain null.
Free leads and purchases originate from business-verified server transitions.
Read back tracking/readiness after saving. Configured does not mean live-tested.

## Sync and reports

An explicitly requested `metaAds.requestInsightsSync` queues bounded historical
Insights work for an account and date range; it does not create/change ads.
Use its job ID with `metaAds.getJob`, or list the owner's latest jobs.
Do not claim a queued job has finished; inspect failed/backoff/stale status.
Read `metaAds.getInsightsReport` for date, entity level, optional offer and
currency. Keep Meta metrics separate from seller ledger metrics.
Inspect ledger `coverage`: `complete:false`, `history:"partial"`,
`instrumentationStartedAt:null` and `backfillStatus:"not_performed"` mean the
requested historical revenue is not fully covered. Report totals as recorded
matching conversions only, even when those individual conversions are verified.
Do not infer instrumentation start from the first recorded row.
Ledger filters support offer, currency, owned product and ISO timestamps plus
bounded limit. Product filters match immutable product-ID snapshots and return
the **whole matching order's** totals, not allocated item revenue. Records
predating product snapshots are excluded from product-filtered results.
Read the `productFilter.revenueAllocation` label; do not call this per-product
attribution or profit.

## Recovery

Unrecognized 401, provider permissions, 403, throttling and configuration errors
are not session-refresh invitations. Follow structured error codes and
retry-after/backoff instructions. After an uncertain setup mutation, read status
before deciding whether another user-authorized attempt is safe.
