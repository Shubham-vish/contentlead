# Creator account maintenance

These are Desktop HTTP routes, not editor commands. Check installed
`GET /api/capabilities` for the endpoints first. All calls use the normal
Desktop bearer; the bridge uses the signed-in web session. Do not copy cookies,
log discovery JSON, or pass `userId`. Never start/switch/reload a shared app
for a source-only audit.

## Profile and connected accounts

| Method / bridge path | Body / outcome |
|---|---|
| `GET /api/bridge/user/profile` | `{user:{id,name,email,mobileNumber,role,createdAt,verified_email,verified_mobile}}` |
| `PATCH /api/bridge/user/profile` | `{name,approved:true}`; name 1–100 chars; returns `{success,user}` |
| `DELETE /api/bridge/instagram/accounts/<accountId>` | `{approved:true}`; exact owned connected account |
| `DELETE /api/bridge/youtube/accounts/<channelId>` | `{approved:true}`; exact owned connected channel |
| `DELETE /api/bridge/linkedin/accounts/<accountId>` | `{approved:true}`; exact owned connected account |
| `PATCH /api/bridge/youtube/accounts/<channelId>` | `{automationEnabled:boolean,approved:true}`; saved account-level automation toggle |
| `POST /api/bridge/youtube/accounts/<channelId>/refresh` | `{approved:true}`; native refresh, returns `{success,expiresAt,expiresIn}` without tokens |
| `POST /api/bridge/instagram/accounts/validate-tokens` | `{approved:true}`; all owned accounts, `{results:[{accountId,healthy,error?}]}` |
| `GET /api/bridge/instagram/accounts/<accountId>/webhook` | Subscription check; native GET can also save refreshed status |
| `POST /api/bridge/instagram/accounts/<accountId>/webhook` | `{fields:[...],approved:true}`; explicitly selected fields, no silent defaults |
| `DELETE /api/bridge/instagram/accounts/<accountId>/webhook` | `{approved:true}`; unsubscribe |
| `POST /api/bridge/instagram/accounts/sync-webhooks` | `{approved:true}`; native sync of unsubscribed active accounts, `{success,synced,failed,retryable:false}` |

Use `GET /api/bridge/accounts` to resolve account IDs before reviewing an action.
Multi-disconnect is a deliberate sequence of exact single-account calls, not
an unreviewed "disconnect all".

Webhook fields: `comments`, `messages`, `messaging_postbacks`,
`message_reactions`, `message_deliveries`, `live_comments`, `feed`. Availability
depends on the account login method and provider permissions; the native
provider may reject a supported schema field for that account.

Webhook reads return `{subscription:{subscribed,fields,error?},source,
providerVerified,...}`. An Instagram native fallback with an error is marked
`source:"stored",providerVerified:false`, not a successful live refresh.
Sync preserves failed rows and does not retry them.

Disconnect success means the account was removed from saved ContentLead
configuration: `source:"stored",providerVerified:false,
providerRevocationVerified:false`. Native YouTube revocation and Instagram
registry cleanup are best-effort; do not claim provider access was fully
revoked. Disconnect does not delete already-published posts or implicitly
cancel scheduled work. Review pending schedules before approving it.

## Approval, uncertainty, and human steps

Review the exact name/account/fields/toggle first. `approved:true` is a caller
assertion of user intent, not independent evidence of human consent. Unknown
fields, caller identity overrides, malformed IDs and query selectors are
rejected. Failures are sanitized; 401/403/404 remain failures. A 5xx, timeout or
non-JSON write result is `outcome_uncertain,retryable:false`. Read saved state
and inspect the provider; never automatically replay.

Email/phone verification, password reset/change, OAuth grant/reconnect,
MCP/API credential reveal/generation and installing/restarting an update remain
human-led account-security/consent actions. The name route cannot change
contacts, passwords, roles, permissions, or workspace membership.
Publishing defaults, automation-rules settings and notification-preference tabs
are disabled "Coming soon" UI placeholders—not implemented agent settings.
There is no creator team/workspace administration surface in these profile
settings; Sessions participant invitations are separate (`cl-webinars`).

## Measurement boundary

`GET /api/bridge/instagram/posts` includes the native owned-post metrics. Apps
has separate owner analytics (`cl-apps`). Content Analytics is currently a
"Coming Soon" page, and Content Profile/legacy teacher analytics contain mock
statistics: never present those numbers as real performance.
Saved LinkedIn post status is not live provider reconciliation. No cross-platform
analytics refresh, generic calendar, or LinkedIn scheduler is invented here.
