# Instagram — Publishing, CTA Automation & Account Management

Use the SkillTown Desktop local HTTP API. Read `~/.skilltown-desktop/api.json` fresh before each call and use `Authorization: Bearer $TOKEN`.

## Publishing Flow (Async, 2-Step)

Instagram publishing is asynchronous — you cannot publish in a single call.

```
Step 1: POST /api/bridge/instagram/publish
        → Creates a container on Instagram's servers
Step 2: GET /api/bridge/instagram/publish/status?contentId=...&publish=true
        → Poll every 10-30 seconds:
          IN_PROGRESS  → keep polling
          FINISHED     → if publish=true, publishes automatically
          PUBLISHED    → done! mediaId and permalink available
          ERROR        → publishing failed
```

**Typical processing time:** 30–120 seconds.

---

## Accounts and posts

### `GET /api/bridge/instagram/accounts` — List connected accounts

No parameters. Returns all connected Instagram accounts.

```bash
curl "http://127.0.0.1:$PORT/api/bridge/instagram/accounts"   -H "Authorization: Bearer $TOKEN"
```

Example response:

```json
{
  "accounts": [
    {
      "id": "abc123",
      "username": "myhandle",
      "profilePic": "https://...",
      "pageName": "My Business Page",
      "status": "active",
      "automationEnabled": true,
      "tokenExpiry": "2025-12-31"
    }
  ]
}
```

Always call this first to get valid account IDs.

### `GET /api/bridge/instagram/posts` — Get posts with metrics

| Query | Required | Default | Description |
|-------|----------|---------|-------------|
| `account` | ✅ | — | Account ID from the accounts endpoint |
| `limit` | | `10` | Max posts |
| `mediaId` | | — | Fetch specific post by media ID |
| `includeCta` | | `false` | Include CTA config per post |

Returns posts with `id`, `caption`, `media_url`, `permalink`, `timestamp`, `like_count`, `media_type`, and optionally `cta`.

```bash
curl "http://127.0.0.1:$PORT/api/bridge/instagram/posts?account=ig_abc123&limit=10&includeCta=true"   -H "Authorization: Bearer $TOKEN"
```

### `GET /api/bridge/instagram/validate` — Check account health

| Query | Required | Description |
|-------|----------|-------------|
| `account` | ✅ | Account ID |

Returns `{ "healthy": true }` or `{ "healthy": false, "error": "token_expired" }`.

Possible errors: `token_invalid`, `token_expired`, `permissions_revoked`. If unhealthy, user must reconnect in ContentLead UI.

---

## Publishing

### `POST /api/bridge/instagram/publish` — Start reel publish

| Body field | Required | Description |
|------------|----------|-------------|
| `contentId` | ✅ | Reads caption, account, and video from Content doc. Tracks in dashboard. |
| `accountId` | | Optional account override |

> **⚠️ Always use `contentId`.** Direct account/video workflows can publish but are not dashboard-tracked, so they are intentionally not documented for agent use.

Prerequisites:
- Content has video (`videoUrl`, `videoSasUrl`, or `downloadableSasUrl` set through content update/render upload)
- `channels.instagram.selected_account` is set through channel configuration, unless `accountId` is provided
- Not already published (`channels.instagram.published !== true`)
- Not currently publishing (`publish_progress.stage !== "processing"`)

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/instagram/publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","accountId":"ig_account_id"}'
```

Response:

```json
{
  "success": true,
  "containerId": "17889xxx",
  "contentId": "content_xxx",
  "message": "Reel container created. Poll status to track progress."
}
```

Idempotency: returns 409 if already published or currently publishing.

### `GET /api/bridge/instagram/publish/status` — Poll publish progress

| Query | Required | Default | Description |
|-------|----------|---------|-------------|
| `contentId` | ✅ | — | Resolves container/account from Content doc and writes result back |
| `publish` | | `false` | If `true` and container is `FINISHED`, publish immediately |

Status progression:

```
IN_PROGRESS → FINISHED → (publish=true) → PUBLISHED
                       ↘ ERROR / EXPIRED
```

```bash
curl "http://127.0.0.1:$PORT/api/bridge/instagram/publish/status?contentId=content_xxx&publish=true"   -H "Authorization: Bearer $TOKEN"
```

Response — in progress:

```json
{
  "containerId": "17889xxx",
  "contentId": "content_xxx",
  "status": "IN_PROGRESS",
  "statusMessage": "Media is being processed",
  "shouldPoll": true
}
```

Response — published:

```json
{
  "status": "PUBLISHED",
  "mediaId": "17889xxx",
  "permalink": "https://www.instagram.com/reel/ABC123/",
  "contentId": "content_xxx",
  "shouldPoll": false
}
```

Content doc updates: when published with `contentId`, the endpoint writes `published`, `published_at`, `media_id`, `published_url`, and `publish_progress` to `Content.channels.instagram`.

CTA auto-sync: when a real Instagram `media_id` lands, the status endpoint copies any draft CTA from `ContentLeadCTA` keyed by `media_${contentId}` to `ConfigurationData` keyed by `media_${media_id}`. No manual CTA copy is needed after publishing.

Polling strategy: call every 10–30 seconds until `shouldPoll` is false.

---

## Scheduling

> **Scheduling is Instagram-reels only.** There is no YouTube or LinkedIn scheduler — those platforms publish immediately (see `youtube.md`, `linkedin.md`). A scheduled reel is published automatically by a background worker that polls on a fixed dispatch interval, so the actual post can land up to a few minutes after the requested slot.

### `POST /api/bridge/instagram/publish/schedule` — Schedule reel

| Body field | Required | Description |
|------------|----------|-------------|
| `contentId` | ✅ | Content ID |
| `selectedAccount` | ✅ | Instagram account ID |
| `wallTime` | ✅ | Local wall time in `YYYY-MM-DDTHH:mm` |
| `timeZone` | | Defaults to `Asia/Kolkata` |
| `caption` | | Optional caption override |
| `hashtags` | | Optional hashtag list |

**Slot constraints (enforced server-side):** `wallTime` must be a minimum lead time in the future AND snapped to a fixed slot boundary. Both are server-configured minute values that **can change**, so do not hard-code them — if your time violates either rule, the request is rejected with a message that states the exact required lead time and slot size. Read that message, round your time up to the next slot boundary, add the minimum lead, and retry.

> ### ⚠️ Set the CTA BEFORE you schedule — otherwise the published reel has NO comment automation
> Scheduling does **not** create CTA/DM automation. When the slot fires, the background worker only *promotes* a **pre-existing draft CTA** — the one keyed by `contentId` in the `ContentLeadCTA` container — onto the live Instagram `media_id`. **If no draft exists at publish time, the reel goes live with no automation, and this flow cannot attach it retroactively** (you would have to configure it manually on the live post using its real `media_id`).
>
> **Therefore, before calling `publish/schedule`, first call `POST /api/bridge/instagram/automation` with `action:"update_cta"`, `contentId`, and `containerName:"ContentLeadCTA"`** (see the CTA & DM Automation section below, and Workflow 3 in `workflows.md`). This is the single most common reason a scheduled reel ends up with "No automation set up."

### `PATCH /api/bridge/instagram/publish/schedule` — Reschedule

Body: `contentId`, `wallTime`, optional `timeZone`, optional `selectedAccount`. Rejects if publishing has started. The same slot constraints as the POST above apply.

### `DELETE /api/bridge/instagram/publish/schedule` — Cancel schedule

Body: `contentId`, optional `cancelled_reason`. Cancels a scheduled reel and releases the slot. Rejects if publishing has started.

### `GET /api/bridge/instagram/publish/scheduled-status` — One content schedule state

Query: `contentId=<id>`. Returns the reel's scheduler fields, including `status`, `publish_state`, `media_id`, `published_url`, `error_message`, and `publish_progress`.

**`publish_state` lifecycle** — a scheduled reel advances through these values as the worker processes it (poll this endpoint to track progress):

| `publish_state` | Meaning |
|-----------------|---------|
| `scheduled` | Waiting for its slot |
| `claimed` | Worker has picked it up |
| `creating_container` / `container_created` | Building the Instagram media container |
| `container_processing` / `container_ready` | Instagram is transcoding the media |
| `publishing` | Container is being published to the feed |
| `published` | ✅ Live — `media_id` and `published_url` are set |
| `failed` / `quarantined` / `publish_outcome_unknown` | Needs attention — check `error_message` |

The pipeline is resumable and idempotent: a crashed/stalled reel is re-picked-up automatically on the next dispatch and continues from its last state, so you will not get a double-post.

### `GET /api/bridge/instagram/publish/list` — List scheduled/in-flight reels

Query: `states?`, `accounts?`, `sort?`, `limit?`. Each item includes `publishState` (same values as the table above) so you can render live progress.

---

## CTA & DM Automation

> **Multi-tab note:** CTA settings are contentId-scoped/mediaId-scoped, not tab-scoped. Do not pass `tabId` to automation endpoints. `tabId` is only for editor `/api/execute` commands; see `../contentlead/multi-tab.md`.

### CTA storage model

CTA automation uses two Cosmos containers:

- **`ContentLeadCTA`** — draft container used by the Content editor UI before publish. Pre-publish CTA is keyed by `media_${contentId}`.
- **`ConfigurationData`** — production container used by the Instagram webhook when live comments arrive. Post-publish CTA is keyed by `media_${realIGMediaId}`.

Set CTA before publishing with `contentId` and the default `containerName: "ContentLeadCTA"`. The draft is auto-promoted to the production `ConfigurationData` container (keyed by the real Instagram `media_id`) at publish time, so agents never copy it manually. **This auto-sync happens on BOTH publish paths:** the immediate `publish/status` flow syncs when it receives the media ID, and the **scheduled** flow syncs inside the background worker when the slot fires. In both cases the draft must already exist — see the ⚠️ callout in the Scheduling section.

### `GET /api/bridge/instagram/automation` — Get CTA config

| Query | Description |
|-------|-------------|
| none | Summary of all accounts |
| `account=<accountId>` | Rules for that account |
| `mediaId=<id>` | CTA keywords/DM template for that post |

### `POST /api/bridge/instagram/automation` — Update CTA & automation

Three actions are supported.

#### Action: `toggle`

| Body field | Required | Description |
|------------|----------|-------------|
| `action` | ✅ | `toggle` |
| `accountId` | ✅ | Account to toggle |
| `enabled` | ✅ | `true`/`false` |

#### Action: `update_rules`

| Body field | Required | Description |
|------------|----------|-------------|
| `action` | ✅ | `update_rules` |
| `accountId` | ✅ | Account to update |
| `automationRules` | ✅ | Array of rule objects |

Each rule: `{ "triggerKeywords": ["free", "link"], "dmTemplate": "Here's your link: ...", "commentReplyTemplate": "Check DMs!", "enabled": true }`.

#### Action: `update_cta` (most common)

| Body field | Required | Description |
|------------|----------|-------------|
| `action` | ✅ | `update_cta` |
| `contentId` or `mediaId` | ✅ | Content ID before publish, real media ID after publish |
| `contains` | ✅ | Array of trigger keywords |
| `messageBody` | ✅ | DM text; converted to Messenger button-template payload when `buttons` are present |
| `buttons` | | Array of `{label, url}` pairs |
| `commentReplies` | | Array of public auto-replies |
| `enableCommentReply` | | Enable auto-reply to comments |
| `enableFollowGate` | | Require follow before DM |
| `followReply` | | Message if user has not followed |
| `followButtonText` | | Button text, e.g. `Follow @myhandle` |
| `containerName` | | Default `ContentLeadCTA` |
| `syncToProduction` | | Copy to production immediately when `mediaId` is a real Instagram media ID |

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/instagram/automation"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"action":"update_cta","contentId":"content_xxx","contains":["free","link","send","guide"],"messageBody":"Here is your free guide: https://mysite.com/guide","buttons":[{"label":"Download Guide","url":"https://mysite.com/guide"}],"commentReplies":["Thanks! Check your DMs 🎁","Sent! Look in your inbox 📩"],"enableCommentReply":true,"enableFollowGate":true,"followReply":"Follow us first, then comment again to get the guide!","followButtonText":"Follow @myhandle","containerName":"ContentLeadCTA","syncToProduction":false}'
```

> **⚠️ Set CTA before publishing.** Call `POST /api/bridge/instagram/automation` before `POST /api/bridge/instagram/publish`.

---

## Error Handling

| Error | When | Fix |
|-------|------|-----|
| 409 `already published` | Content already published | Check `GET /api/bridge/content/:id` first |
| 409 `publish in progress` | Container still processing | Wait and poll status |
| `token_expired` | IG token expired | User must reconnect in ContentLead UI |
| `missing_params` | Required fields missing | Check endpoint tables above |
| Video URL unreachable | SAS URL expired | Check `sasExpiresAt`, get new URLs |

## Tips

- Always set CTA before publishing; status polling auto-syncs draft CTA to production when the real Instagram media ID lands.
- Poll every 15s; faster polling does not speed up processing.
- Check token health with `GET /api/bridge/instagram/validate?account=...` if publish fails with auth errors.
- Always publish with `contentId` for dashboard tracking.
