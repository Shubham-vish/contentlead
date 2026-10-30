---
name: cl-meta-ads
description: Read owned Meta Ads performance and configure unified offer tracking through the authenticated ContentLead Desktop bridge. Connect through human-approved official OAuth, choose accounts/datasets, queue Insights sync, inspect jobs, compare Meta-reported metrics with separate verified seller ledger totals, and diagnose conversion delivery. No campaign, budget, pause or spend mutations. Competitor Ad Library research belongs to cl-ad-intelligence.
tags: meta-ads, owned-performance, insights, offer-tracking, pixel, conversions, attribution
---

# ContentLead Meta Ads — Owned Performance and Offer Tracking

> **Owns the question:** “How are my own ads performing, and is my offer tracking configured?”
> **Related:** `cl-offers` owns offer design/checkout; `cl-ad-intelligence` owns competitor research.

## Start here

1. Read fresh `~/.skilltown-desktop/api.json` locally. Never print its bearer token.
2. Use that file's loopback port and bearer for Desktop requests.
3. Check authenticated `GET /api/health` and `GET /api/app/auth`.
   An offer/ads task does not require a video editor to be mounted.
4. If signed out, ask the human to sign in in the existing app.
   Do not collect API keys, passwords, vendor tokens or cookies in prompts.
5. Discover `GET /api/bridge/meta-ads/commands` and
   `GET /api/bridge/offer-studio/commands` before choosing commands.
6. Load [commands.md](commands.md) for generated schemas/examples, then
   [workflows.md](workflows.md) for the specific task.

Source support, running Desktop availability and deployed backend availability
are separate. A skill listing alone is not proof that a handler is deployed.
Never restart, reinstall or switch the user's running Desktop merely to load a skill.

## Command transport

Meta commands:

```text
POST /api/bridge/meta-ads/commands/<metaAds.command>
Authorization: Bearer <current-local-token>
Content-Type: application/json
{"params":{}}
```

Offer commands use the same local authentication and body shape:

```text
POST /api/bridge/offer-studio/commands/<offer.tracking.command>
{"params":{"offerId":"<immutable-owned-offer-id>"}}
```

The bridge executes same-origin fetch with the app's authenticated cookies.
Identity always comes from that session, never an owner/user field in the body.
Use exact generated command names. No arbitrary Graph HTTP proxy exists.
The Meta manifest is `{ok:true,data:{namespace:"metaAds",version:1,commands:[...]}}`
with **10** commands. Command success is `{ok:true,data}`. The Offer manifest
instead is `{commands:[...]}` and includes **six** tracking commands; tracking
command success is also `{ok:true,data}`, unlike ordinary Offer builder commands'
`result.data`. Preserve HTTP errors and inspect `ok`; do not unwrap all business
namespaces with one assumed envelope.

## Workflow router

| Task | Read |
|---|---|
| Safe read-only audit of current setup/performance | [workflows.md — Audit](workflows.md#audit) |
| Connect/reconnect, select account/dataset, disconnect | [workflows.md — Setup](workflows.md#setup) |
| Configure a specific offer and event mapping | [workflows.md — Offer tracking](workflows.md#offer-tracking) |
| Manual Pixel, optional custom interactions, all/multi-offer activity | [events-and-custom.md](events-and-custom.md) |
| Queue sync, poll status, inspect stale/errors | [workflows.md — Sync and reports](workflows.md#sync-and-reports) |
| Interpret ROI, attribution and delivery | [measurement.md](measurement.md) |
| Exact payload schema and example for each command | [commands.md](commands.md) |

## Hard boundaries

- Default audit is read-only. Do not connect, disconnect, change assets/tracking,
  or queue provider work unless the user requested that setup action.
- OAuth initiation returns an official browser URL. The human opens it and
  approves scopes; the agent does not grant consent or complete OAuth itself.
- Visitor analytics/marketing consent is a separate human choice, not OAuth.
  Never manufacture it, switch `consentRequired` off, or grant it via commands.
- Secrets input/rotation is UI-only. Commands never accept raw provider tokens.
- Campaign creation, budget changes, pause/resume and all ad spend are unsupported.
  Do not invent a spend-approval flow or claim this is a complete Ads Manager.
- Setup flags/configuration are not evidence that a live Pixel event arrived.
- Read `permissionReadiness.reports` and `.capi` separately. A reporting
  connection may be `report_only` for tracking: missing CAPI grants cannot be
  replaced by selecting a dataset or by an agent claiming readiness.
- CAPI eligibility still requires reviewed permissions, customer authorization
  and asset access. `deliveryVerified:false` means no live delivery verification.
- Meta actions and attributed revenue are provider-reported, not verified business
  truth. Read [measurement.md](measurement.md) before comparing them.
- Business verification does not establish complete historical revenue. Ledger
  totals cover recorded matching conversions only; inspect historical coverage.
- Never automatically replay a mutation after transport failure, timeout,
  redirect, HTML, invalid JSON, 502 or 504. Inspect saved status first.
  Only a recognized JSON session 401 may refresh cookies and retry once.
