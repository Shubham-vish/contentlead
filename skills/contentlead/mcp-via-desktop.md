---
name: mcp-via-desktop
description: Call MCP tools (transcribe, learn, web, github, prepwithai, etc.) through the SkillTown-Desktop app's local proxy — no manual JWT setup needed.
tags: mcp, transcribe, prepwithai, learn, tools, discovery, proxy, token
---

# MCP via Desktop Proxy

The SkillTown-Desktop app now proxies all MCP tool calls through its
local HTTP API. This means **AI CLIs no longer need to configure
`mcp.json` with a manual JWT** — the desktop app mints, caches, and
rotates tokens automatically using the user's already-authenticated
session cookies.

## Why prefer this over direct MCP config

| Concern | Direct `mcp.json` (old) | Desktop proxy (new) |
|---|---|---|
| Setup | Copy 6-day JWT from `/profile` → paste into `mcp.json` | Zero setup — cookies do it |
| Rotation | Manual every 6 days | Auto (bounded 30-min cache, 1-h pre-exp refresh) |
| User swap | Old JWT valid up to 6 days after logout | Bounded ≤ 30 min after swap |
| Auditing | None | Full SSE stream: `mcp.token.*`, `mcp.tools.*`, `mcp.call.*` |
| CI / headless | Still works (no cookies) | Requires desktop running |

Rule of thumb: **use this proxy whenever the desktop app is running**.
Fall back to direct MCP config only for CI/headless.

## Endpoints

All endpoints require the desktop bearer token in
`Authorization: Bearer $DESKTOP_TOKEN` (same as every other
`/api/*` route on the desktop). The desktop's port and token are
discoverable via the same handshake used by any other command tool
(look up `SKILLTOWN_DESKTOP_PORT` and `SKILLTOWN_DESKTOP_TOKEN`).

### `GET /api/mcp/status`

Inspect proxy state — cached token exp, cached tool domains, known
domain list, per-tool call counters. **Non-authenticated read.**

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:$PORT/api/mcp/status" | jq
```

Returns:
```json
{
  "mcpEndpoint": "https://mcp.prepwithai.in/mcp/",
  "token": { "userId": "…", "expiresAt": "…", "isFresh": true, … },
  "toolsCache": { "domainCount": 2, "ttlMs": 86400000, "entries": [ … ] },
  "knownDomains": ["content","context","editor", … ],
  "aliases": { "content": ["editor","storystudio"], "search": ["web"] },
  "metrics": { "totalCalls": 3, "errorCalls": 0, "lastCallAt": "…", "callsByTool": { … } }
}
```

### `GET /api/mcp/tools?domain=<name>`

Discover tools for a domain (or comma-separated multi-domain).
Response is cached for **24 h** per canonical domain key.

Add `&refresh=true` to bypass cache for a single request.

```bash
# Single domain
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:$PORT/api/mcp/tools?domain=prepwithai" | jq '.tools[].name'

# Multiple
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:$PORT/api/mcp/tools?domain=web,github" | jq
```

### `POST /api/mcp/call`

Invoke an MCP tool. Body:
```json
{
  "domain": "prepwithai",
  "tool":   "transcribe_video",
  "args":   { "videoUrl": "https://…/clip.mp4" },
  "timeoutMs": 120000   // optional, 1s..15min, default 5min
}
```

Response wraps the MCP result:
```json
{
  "ok": true,
  "domain": "prepwithai",
  "tool":   "transcribe_video",
  "content": { … parsed tool output … },
  "rawParts": [ … raw MCP content parts … ],
  "elapsedMs": 8421
}
```

Errors return non-2xx with `{ error, message, mcpCode?, mcpData? }`.

### `POST /api/mcp/refresh`

Force-clear caches. Say "refresh mcp tools list" and the AI runs:

```bash
# Clear tools cache only (keep token)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:$PORT/api/mcp/refresh?scope=tools"

# Clear just one domain
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:$PORT/api/mcp/refresh?scope=tools&domain=prepwithai"

# Clear cached JWT (next call re-mints)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:$PORT/api/mcp/refresh?scope=token"

# Nuke everything
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:$PORT/api/mcp/refresh?scope=all"
```

`scope` defaults to `all`. `domain` narrows only the `tools` scope.

### `POST /api/mcp/token/refresh`

Force-mint a new JWT immediately (useful for debugging).

## Available domains

Kept in sync with `MCP_Server/mcp/server.py::AVAILABLE_DOMAINS`:

```
editor, storystudio, content, context, learn, linkedin,
instagram, prepwithai, remotion, whiteboard, reddit, technews,
scraping, web, github, trading, filesystem
```

Aliases: `content` → `editor + storystudio`; `search` → `web`.

## Recommended flow for the AI

1. **Discover once per session**:
   `GET /api/mcp/tools?domain=<what-you-need>` — the 24 h cache means
   this is usually zero-latency after first call.
2. **Invoke**: `POST /api/mcp/call` with the exact `name` from the tool
   list and `arguments` matching the tool's JSON schema.
3. **On stale results**: if the user says "refresh tools" or you get a
   404 for a tool the user says exists, hit
   `POST /api/mcp/refresh?scope=tools` and re-list.

## Common calls

**Transcribe a video** (uploaded/URL):
```json
POST /api/mcp/call
{ "domain":"prepwithai", "tool":"transcribe_video", "args": { "videoUrl":"…" } }
```

**Search / fetch web content**:
```json
POST /api/mcp/call
{ "domain":"web", "tool":"web_search", "args": { "query":"react 19 features" } }
```

**Educational search** (Reddit, YouTube, blogs):
```json
POST /api/mcp/call
{ "domain":"learn", "tool":"learn_search", "args": { "topic":"vector databases" } }
```

**Trending tech news**:
```json
POST /api/mcp/call
{ "domain":"technews", "tool":"hackernews_top", "args": { "limit": 20 } }
```

## SSE events (for live UI)

The desktop's `/api/events` SSE stream now emits:

| Event | Data |
|---|---|
| `mcp.token.refreshed` | `{ reason, userId, expiresAt, elapsedMs }` |
| `mcp.tools.refreshed` | `{ domain, count, elapsedMs }` |
| `mcp.call.started`    | `{ domain, tool, argKeys }` |
| `mcp.call.completed`  | `{ domain, tool, elapsedMs, isError }` |
| `mcp.call.failed`     | `{ domain, tool, error, message }` |
| `mcp.cache.invalidated` | `{ cleared: [...] }` |

## Error semantics

| HTTP | Meaning |
|---|---|
| 400 | `bad_request` — bad domain / tool name / args shape |
| 401 | Desktop bearer missing, or user not signed into SkillTown |
| 502 | MCP server unreachable or returned malformed / RPC error |
| 504 | Timeout (mint or call) |

Retry-once on auth error is automatic and handles both HTTP 401 and
JSON-RPC `-32001` responses.

## Guarantees

- **Same-user isolation**: cached JWT is bound to its embedded `userId`
  and re-minted at least every 30 min so account swaps take effect
  quickly.
- **Race-safe**: token/list generation counters prevent late-arriving
  refresh results from resurrecting invalidated caches.
- **Bounded timeouts**: absolute deadline across mint + fetch + body
  parsing + one auth retry.
- **Input hardened**: unknown domains, malformed tool names, array
  `args`, and oversized payloads (> 500 KB) are rejected client-side.
