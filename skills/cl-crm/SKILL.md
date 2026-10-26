---
name: cl-crm
description: Use the authenticated ContentLead Desktop CRM bridge for the exact 21 owner/platform CRM v1 commands, including platform-admin read-only customers and payments. Explicit approval is required for CRM writes. Replies, Calls, charges, consent and account/access changes remain in existing tools/UI.
tags: crm, contacts, tasks, followups, opportunities, notes, sources, customers, payments, deals, desktop bridge
---

# ContentLead CRM — scoped relationship work, not channel automation

> **Owns the question:** *"How can an agent read and update the supported CRM workspace without bypassing ownership, administrator scope, revisions, consent, or existing channel tools?"*
> **Delegates to:** `cl-calls` for Calls Studio; existing platform inbox UI for WhatsApp/TradingChat replies and customer actions; existing offer/deals/billing tools for their authoritative workflows.

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

manifest = bridge("/api/bridge/crm/commands")

def crm(name, **params):
    result = bridge("/api/bridge/crm/commands/"+name, {"params": params})
    if result.get("ok") is not True:
        raise RuntimeError(result)
    return result["data"]
```

The manifest must report namespace `crm`, version `1`, and exactly **21
commands**: 10 reads and 11 writes. Use its exact JSON schemas. A source checkout,
skill listing, or packaged file is not proof the installed Desktop and website
release support the handlers. Treat 404 as release mismatch, 503
`MIGRATION_REQUIRED` as unapplied persistence, and report source, packaged,
installed, and deployed status separately.

## Pick a recipe

| Work | Read |
|---|---|
| Contact search/detail/create/update/archive; tasks/follow-ups | [contacts-tasks.md](contacts-tasks.md) |
| Opportunities, stages, amounts, notes and activity | [opportunities-notes.md](opportunities-notes.md) |
| Authorized source browse, preview, import/link and unlink | [sources.md](sources.md) |
| Platform-admin customer/access summaries and checkout payment reads | [customers-payments.md](customers-payments.md) |
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
- WhatsApp/TradingChat replies/read/tags/customer actions, Calls and microphone
  workflows, billing/access changes, campaigns, broadcasts and paid activities
  are not CRM commands. Use the existing authorized UI/tool only when asked.
- Minimize PII in output. Use cursor paging. Respect revision conflicts and
  refresh before a specifically reapproved retry.
