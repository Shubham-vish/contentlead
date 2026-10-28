# Measurement, privacy and attribution

- Anonymous first-party visitor/acquisition identifiers are not authenticated
  user identities. Do not merge them into a person merely because a click exists.
- Consent governs optional browser marketing events and identifiers. Refusal,
  blockers, cross-device journeys and missing click IDs reduce match coverage.
- Server purchase/subscription/refund/lead records come from verified business
  transitions, not from a browser thank-you URL. Renewals/refunds must not be
  mislabeled as new purchases.
- Meta Insights metrics/actions use Meta's attribution window/timezone and may
  be delayed or modeled. Check report freshness, currency and window labels.
- First-party seller ledger totals are owner-scoped business totals, not proof
  that an ad account/campaign caused those transactions. Do not divide all seller
  revenue by ad spend and call it verified campaign ROAS.
- Ledger totals describe recorded matching conversions, not complete historical
  revenue. Its coverage explicitly reports `complete:false`, `history:"partial"`,
  `instrumentationStartedAt:null`, `backfillStatus:"not_performed"`,
  `reason:"instrumentation_start_unknown"` and `basis:"recorded_conversions_only"`,
  with the requested ISO date bounds. Unknown instrumentation start cannot be
  inferred from the earliest row. A verified event does not prove a full backfill.
- An owned-product ledger filter matches immutable product-ID snapshots; money
  represents the entire matching order, not that item's allocated revenue.
  Legacy records without product snapshots do not match. Preserve the report's
  `whole_matching_order` label.
- Never infer a Meta campaign from `fbclid` alone. UTM/click provenance is
  first-party attribution evidence, not deterministic cross-platform truth.
- Compare compatible date windows, timezone, currency and units. Money is kept
  separate per currency; do not silently sum currencies or confuse minor units
  with decimal provider spend.
- Delivery diagnostics expose safe statuses/attempt counts/error codes, not
  raw conversion payloads, email/phone, visitor identifiers, or access tokens.
  Queued/delivered transport status is not evidence of accepted attribution.
- Pixel/event/credential readiness flags describe setup only. Live event
  receipt, matching quality and performance require separate human verification.
- Reporting permission is not CAPI permission. Preserve the separate
  `permissionReadiness.reports`/`.capi` eligibility and missing-permission lists;
  `report_only` is not server-delivery readiness. CAPI eligibility is also not a
  delivery receipt: `deliveryVerified:false` remains an explicit limitation.
- Competitor ad longevity is only a heuristic. An active/long-running public ad
  does not reveal spend, conversions, profitability or ROI.
