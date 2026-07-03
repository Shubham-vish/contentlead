# Instagram — Publishing, CTA Automation & Account Management

> **Copilot CLI without MCP server:** use bridge mode through the running SkillTown Desktop app. See [`bridge-mode.md`](bridge-mode.md) for auth, endpoint parity, and curl examples.

## Publishing Flow (Async, 2-Step)

Instagram publishing is **asynchronous** — you cannot publish in a single call.

```
Step 1: instagram_publish_reel()     → Creates a "container" on Instagram's servers
Step 2: instagram_publish_status()   → Poll every 10-30 seconds:
        IN_PROGRESS  →  keep polling
        FINISHED     →  if auto_publish=true, publishes automatically
        PUBLISHED    →  done! mediaId and permalink available
        ERROR        →  publishing failed
```

**Typical processing time:** 30–120 seconds.

---

## Account Tools

### `instagram_get_accounts` — List connected accounts

No parameters. Returns all connected Instagram accounts.

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

**Always call this first** to get valid `account_id` values.

---

### `instagram_get_posts` — Get posts with metrics

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `account_id` | string | ✅ | — | Account ID from `instagram_get_accounts` |
| `limit` | int | | `10` | Max posts (1–50) |
| `media_id` | string | | — | Fetch specific post by media ID |
| `media_type` | string | | — | Filter: `"REELS"`, `"IMAGE"`, `"VIDEO"`, `"CAROUSEL_ALBUM"` |
| `include_cta` | bool | | `false` | Include CTA config per post |

**Returns:** Array of posts with `id`, `caption`, `media_url`, `permalink`, `timestamp`, `like_count`, `media_type`, and optionally `cta`.

---

### `instagram_validate_token` — Check account health

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `account_id` | string | ✅ | Account ID |

**Returns:** `{ "healthy": true }` or `{ "healthy": false, "error": "token_expired" }`

Possible errors: `token_invalid`, `token_expired`, `permissions_revoked`. If unhealthy → user must reconnect in ContentLead UI.

---

## Publishing Tools

### `instagram_publish_reel` — Start reel publish

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `content_id` | string | ✅ **Always use this** | — | Reads caption, account, video from Content doc. Tracks in dashboard. |
| `account_id` | string | | — | ⚠️ Legacy — bypasses content tracking |
| `video_url` | string | | — | ⚠️ Legacy — bypasses content tracking |
| `caption` | string | | — | ⚠️ Legacy — bypasses content tracking |

> **⚠️ Direct mode (`account_id` + `video_url`) publishes to Instagram but the ContentLead
> dashboard will NOT show it. Always use `content_id`.**

**Prerequisites (content-aware mode):**
- ✅ Content has video (`videoUrl` or `downloadableSasUrl` set via `content_update`)
- ✅ `channels.instagram.selected_account` set via `content_configure_publish`
- ✅ Not already published (`channels.instagram.published !== true`)
- ✅ Not currently publishing (`publish_progress.stage !== "processing"`)

**Returns:**
```json
{
  "success": true,
  "containerId": "17889xxx",
  "contentId": "content_xxx",
  "message": "Reel container created. Poll status to track progress."
}
```

**Idempotency:** Returns 409 if already published or currently publishing.

---

### `instagram_publish_status` — Poll publish progress

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `content_id` | string | ✅ **Always use this** | — | Resolves container/account from Content doc, writes result back |
| `container_id` | string | | — | ⚠️ Legacy — only if no content_id |
| `account_id` | string | | — | ⚠️ Legacy — only if no content_id |
| `auto_publish` | bool | | `false` | If `true` and container FINISHED → publish immediately |

**Status progression:**
```
IN_PROGRESS → FINISHED → (auto_publish) → PUBLISHED
                       ↘ ERROR / EXPIRED
```

**Response — In progress:**
```json
{
  "containerId": "17889xxx",
  "contentId": "content_xxx",
  "status": "IN_PROGRESS",
  "statusMessage": "Media is being processed",
  "shouldPoll": true
}
```

**Response — Published:**
```json
{
  "status": "PUBLISHED",
  "mediaId": "17889xxx",
  "permalink": "https://www.instagram.com/reel/ABC123/",
  "contentId": "content_xxx",
  "shouldPoll": false
}
```

**Response — Finished (auto_publish=false):**
```json
{
  "containerId": "17889xxx",
  "status": "FINISHED",
  "statusMessage": "Container ready for publishing",
  "shouldPoll": false
}
```

**Response — Error:**
```json
{
  "containerId": "17889xxx",
  "status": "ERROR",
  "statusMessage": "Media processing failed",
  "shouldPoll": false
}
```

**Content doc updates:** When published with `content_id`, automatically writes `published`, `published_at`, `media_id`, `published_url`, `publish_progress` to `Content.channels.instagram`.

**Polling strategy:** Call every 10–30 seconds until `shouldPoll` is `false`.

---

## CTA & DM Automation (MCP mode + bridge mode)

CTA automation can be configured in two ways:

- **MCP mode** — use `instagram_get_automation` / `instagram_update_automation` when the MCP server is attached.
- **Bridge mode** — use the local desktop HTTP bridge when Copilot CLI can read `~/.skilltown-desktop/api.json`; no MCP server or signed-in CLI browser session is needed.

> **Multi-tab note:** CTA settings are **contentId-scoped / mediaId-scoped, not tab-scoped**. Do not pass `tabId` to these automation endpoints. `tabId` is only for editor `/api/execute` commands; see `../contentlead/multi-tab.md`.

### MCP mode — `instagram_get_automation` / `instagram_update_automation`

#### `instagram_get_automation` — Get CTA config

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `account_id` | string | | Get automation config for an account |
| `media_id` | string | | Get per-post CTA config |

- No params → summary of all accounts
- `account_id` → rules for that account
- `media_id` → CTA keywords/DM template for that post

---

#### `instagram_update_automation` — Update CTA & automation

3 different actions:

##### Action: `"toggle"` — Enable/disable automation

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | `"toggle"` | ✅ | |
| `account_id` | string | ✅ | Account to toggle |
| `enabled` | bool | ✅ | `true`/`false` |

##### Action: `"update_rules"` — Set account-level rules

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | `"update_rules"` | ✅ | |
| `account_id` | string | ✅ | Account to update |
| `automation_rules` | string | ✅ | JSON array of rule objects |

Each rule: `{"triggerKeywords": ["free", "link"], "dmTemplate": "Here's your link: ...", "commentReplyTemplate": "Check DMs!", "enabled": true}`

##### Action: `"update_cta"` — Set per-post CTA (most common)

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | `"update_cta"` | ✅ | |
| `media_id` | string | ✅ | Instagram media ID or `content_id` |
| `contains` | string | ✅ | JSON array of trigger keywords: `'["free", "link", "send"]'` |
| `message_body` | string | ✅ | JSON object: `'{"text": "Here is your link: https://..."}'` |
| `comment_replies` | string | | JSON array: `'["Thanks! Check your DMs 🎁"]'` |
| `enable_comment_reply` | bool | | Enable auto-reply to comments |
| `enable_follow_gate` | bool | | Require follow before DM |
| `follow_reply` | string | | Message if user hasn't followed |
| `follow_button_text` | string | | Button text (e.g. `"Follow @myhandle"`) |

**Example:**
```python
instagram_update_automation(
    action="update_cta",
    media_id="content_xxx",
    contains='["free", "link", "send", "guide"]',
    message_body='{"text": "Here is your free guide: https://mysite.com/guide"}',
    comment_replies='["Thanks! Check your DMs 🎁", "Sent! Look in your inbox 📩"]',
    enable_comment_reply=True,
    enable_follow_gate=True,
    follow_reply="Follow us first, then comment again to get the guide!",
    follow_button_text="Follow @myhandle"
)
```

> **⚠️ Set CTA BEFORE publishing.** Call `update_cta` before `instagram_publish_reel`.

---

### Bridge mode — local desktop API

For Copilot CLI without the MCP server, use the cross-cutting bridge docs: [`bridge-mode.md`](bridge-mode.md).

## Legacy Desktop Bridge (Alternative)

> **⚠️ Publishing bridge endpoints are NOT content-aware** — they don't update the Content document's
> publish status. Use MCP publish tools with `content_id` for tracked publishing. For MCP-mirror bridge publishing and CTA automation, see [`bridge-mode.md`](bridge-mode.md).

```bash
# Start publish via bridge
curl -X POST http://127.0.0.1:$PORT/api/bridge/publish/instagram \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"contentId": "content_xxx", "selectedAccount": "ig_account_id"}'
# → { "success": true, "containerId": "17889...", "shouldPoll": true }

# Poll status
curl "http://127.0.0.1:$PORT/api/bridge/publish/instagram/status?contentId=content_xxx" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Handling

| Error | When | Fix |
|-------|------|-----|
| 409 "already published" | Content already published | Check with `content_get` first |
| 409 "publish in progress" | Container still processing | Wait and poll status |
| `token_expired` | IG token expired | User must reconnect in ContentLead UI |
| `missing_params` | Required fields missing | Check param tables above |
| Video URL unreachable | SAS URL expired | Check `sasExpiresAt`, get new URLs |

## Tips

- **Always set CTA before publishing** — use MCP mode (`instagram_update_automation`) or bridge mode (`POST /api/bridge/instagram/automation`) before `instagram_publish_reel`
- **Poll every 15s** — faster polling doesn't speed up processing
- **Check token health** — call `instagram_validate_token` if publish fails with auth errors
