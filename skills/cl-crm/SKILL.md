---
name: cl-crm
description: Use the authenticated ContentLead Desktop CRM bridge for 32 owner/platform commands plus stored-message binary media download: contacts, rich timeline, CSV, revision-safe bulk, tasks, pipeline, owner buyers and platform customer/payment context. Platform ADMIN WhatsApp inspection, exact approved replies and reviewed mark-read are separate from creator messaging; no role impersonation, consent, charge or account/access changes.
tags: crm, contacts, tasks, followups, opportunities, notes, sources, customers, payments, deals, desktop bridge
---

# ContentLead CRM — scoped relationship work, not channel automation

> **Owns the question:** *"How can an agent read and update the supported CRM workspace without bypassing ownership, administrator scope, revisions, consent, or existing channel tools?"*
> **Delegates to:** `cl-calls` for Calls Studio; existing authorized tools for unsupported inbox channels/customer actions and offer/deals/billing workflows.

## Connect and discover

Read `~/.skilltown-desktop/api.json` afresh. Do not print its token, start the
app, switch origins, or call production merely to test this skill.

```python
import json, pathlib, urllib.request

def bridge(path, body=None):
    d = json.loads((pathlib.Path.home()/".skilltown-desktop"/"api.json").read_text())
    req = urllib.request.Request(
        f"http://127.0.0.1:{d['port']}{path}",
        data=None if body is None else json.dumps(body).encode(),
        headers={"Authorization": "Bearer "+d["token"], "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=35) as response:
        return json.load(response)

manifest = bridge("/api/bridge/crm/commands")["data"]

def crm(name, **params):
    result = bridge("/api/bridge/crm/commands/"+name, {"params": params})
    if result.get("ok") is not True:
        raise RuntimeError(result)
    return result["data"]
```

The manifest must report namespace `crm`, version `1`, and exactly **32
commands**: 18 reads and 14 writes. This includes rich timeline, CSV artifact
export, revision-aware bulk actions, opportunity totals and platform CRM context.
Platform support WhatsApp list/get/reply/markRead commands require `scope:"platform"`
and the caller's current ADMIN role; see [support-inbox.md](support-inbox.md).
Stored-message media uses its separate fixed authenticated binary GET, not a JSON command.
Use its exact JSON schemas. A source checkout,
skill listing, or packaged file is not proof the installed Desktop and website
release support the handlers. Treat 404 as release mismatch, 503
`MIGRATION_REQUIRED` as unapplied persistence, and report source, packaged,
installed, and deployed status separately.

## Pick a recipe

| Work | Read |
|---|---|
| Contact search/detail/timeline/create/update/archive; CSV export; approved bulk tag/archive actions; tasks | [contacts-tasks.md](contacts-tasks.md) |
| Platform ADMIN WhatsApp inspection, stored media, exact approved replies and reviewed mark-read (not owner messaging) | [support-inbox.md](support-inbox.md) |
| Opportunities, stages, amounts, notes and activity | [opportunities-notes.md](opportunities-notes.md) |
| Authorized source browse, preview, import/link and unlink | [sources.md](sources.md) |
| Owner customer relationships; separate platform-admin customer/access and payment reads | [customers-payments.md](customers-payments.md) |
| Scope, consent, revisions, errors, UI-only/excluded capabilities | [boundaries.md](boundaries.md) |
| Every exact schema and a validated synthetic request | [commands.md](commands.md) |

## Non-negotiable safety

- Identity comes only from the signed-in session. Never send owner/actor IDs
  or `scopeKey`. A customer lookup value or `customerUserId` is a read filter,
  never the executing identity. Owner and platform are separate workspaces; platform requires
  current ADMIN authority and is never an arbitrary owner selector.
- Every write requires `acknowledged:true` **after explicit user approval**.
  This is an execution acknowledgement, not magic permission, consent, recording
  authority, messaging permission, entitlement, or proof of ownership.
- Preview is advisory and read-only. Apply reauthorizes every source and is
  transactional. Never infer consent, auto-merge by phone/email, overwrite a
  contact from source data, or retry a stale/uncertain write automatically.
- Only the documented platform ADMIN WhatsApp subset is exposed: inspected
  conversations/stored media, exact approved text replies and reviewed mark-read.
  TradingChat, other channel actions, Calls/microphone, billing/access changes,
  campaigns, broadcasts and paid activities require their existing authorized tools.
- Minimize PII in output. Use cursor paging. Respect revision conflicts and
  refresh before a specifically reapproved retry.
- CSV exports return a bounded UTF-8 artifact inside `data`, never a cloud URL
  or server-side path. Save only to an explicitly chosen local file without
  overwriting; do not print the CSV. Bulk `ok:true` can contain failed items:
  inspect every outcome and never automatically replay the original batch.
