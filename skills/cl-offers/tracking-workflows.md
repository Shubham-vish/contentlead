# Tracking setup, custom interactions and central activity

Start with `cl-meta-ads` for authenticated Desktop discovery and approval
boundaries. Read [the shared event/custom workflow](../cl-meta-ads/events-and-custom.md)
for manual Pixel + standard events, optional success-only action or section
click/view definitions, and all/selected multi-offer cursor queries.

Exact writable fields and command examples are generated in
[tracking-commands.md](tracking-commands.md). Read current configuration and
`customEventTargets` before updating. `events.custom` omitted preserves the
existing custom list; an array replaces it, and `[]` removes all. No raw JS,
financial payloads, reserved standard names, provider tokens or consent grants.

Use `offer.tracking.summaries.get` for summary cards and
`offer.tracking.events.list` for recorded activity. Both omit `offerIds` for all
owned offers or select up to 50 owned IDs. Activity is not revenue: browser
observations/Pixel attempts, Meta acceptance and verified business transitions
are distinct. Never double-count correlated browser/server rows as purchases.
Configuration eligibility is not verified delivery; historical coverage remains
unknown/partial without backfill.
