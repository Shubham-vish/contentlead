# Account Combinations — Reusable Cross-Platform Presets

An **account combination** is a saved bundle of connected accounts across platforms — e.g. *"AI lineup"* = `@ailead.ai` on Instagram + `AILead` on YouTube + `X` on LinkedIn. Users define them once in **Settings → Combinations** and reuse them when creating/publishing content.

Read this doc when a user says something like:
- *"Publish this to my AI combo."*
- *"Post it to both my accounts."*
- *"Use my usual lineup for this reel."*
- *"Create a combo for content that goes to X, Y, and Z."*

## What a combination IS vs is NOT

| ✅ IS | ❌ IS NOT |
|---|---|
| A saved bundle of **account identifiers** across platforms | A publish target you can pass directly to `POST /api/bridge/instagram/publish` (no `combinationId` param yet) |
| Cross-platform (IG + YT + LinkedIn + X in one preset) | A place to store captions, hashtags, or CTA — those are per-content, not per-combo |
| Per-user (stored on the user's Cosmos `ContentLead` doc under `combinations[]`) | Global or shareable |
| Purely UI-side convenience today — selecting it in the **Create Content** dialog or **Channels Panel** pre-fills per-platform account pickers | Actually integrated with the publish pipeline server-side |

**Practical implication for agents:** a combination is a *lookup* — resolve it into per-platform account IDs, then fan out standard per-platform publish calls (Instagram, YouTube, LinkedIn) using the existing endpoints in `instagram.md`, `youtube.md`, `linkedin.md`.

## Data shape

```ts
interface AccountCombination {
  id: string;              // "combo_<timestamp>_<rand>"
  name: string;            // human label, e.g. "AI Content Lineup"
  description?: string;
  accounts: {
    instagram?: string;                // IG username (e.g. "ailead.ai")
    instagramBusinessAccountId?: string; // optional IG business id
    youtube?: string;                  // YT channel handle or ID
    linkedin?: string;                 // LinkedIn account name/id
    x?: string;                        // X (Twitter) account
  };
  enabled: boolean;
  createdAt: string;       // ISO
  updatedAt: string;       // ISO
}
```

## Bridge endpoints

Auth is the same as every other bridge call — `Authorization: Bearer $TOKEN` from `~/.skilltown-desktop/api.json`.

| Endpoint | What it does |
|---|---|
| `GET /api/bridge/content/combinations` | Read the user's account document — combinations under `combinations[]`, connected accounts under `insta.users`, `youtube.channels`, `linkedin.linkedInOAuthAccounts`, `x.accounts`. Use to list combos, discover which handles exist per platform, and resolve a combo by name locally with a filter. |
| `POST /api/bridge/content/combinations` | Create a new combination. Body: `{ name, description?, enabled?, accounts:{ instagram?, instagramBusinessAccountId?, youtube?, linkedin?, x? } }`. Returns the created combo (`201`) with its generated `id`. **Rejects duplicate names** (case + whitespace insensitive) with `409 duplicate_name` — PATCH the existing one instead, or pick a different name. |
| `PATCH /api/bridge/content/combinations` | Update an existing combination. Body: `{ id \| name, ...changes }` — pass **either** `id` or `name` to look it up. Any of `name`, `description`, `enabled`, `accounts` can be updated. Renaming to a name that collides with another combo returns `409 duplicate_name`. |
| `DELETE /api/bridge/content/combinations?id=combo_xxx` **or** `?name=<combo name>` | Delete a combination by id **or** by name. Returns `{ success: true, id }`. If the name matches multiple combos → `409 ambiguous_name` with the candidate list; retry with `?id=`. |

### Name resolution (case- and whitespace-insensitive)

| Server-side rule | Example |
|---|---|
| Trim leading/trailing whitespace | `"  AI Combo  "` → `"AI Combo"` |
| Collapse internal whitespace | `"AI    Combo"` → `"AI Combo"` |
| Compare case-insensitively | `"ai combo"` matches `"AI Combo"` |
| Preserve original casing on write | Stored as user typed it |
| Uniqueness enforced on create + rename | Duplicate → `409 duplicate_name` with `existing: { id, name }` |
| Ambiguous lookup at read-side | Two matches → `409 ambiguous_name` with `candidates: [{id, name}, ...]` |

You should almost always work with names in agent code. Fall back to `id` only when the name is ambiguous (server tells you which candidates matched) or when you're referring to a specific one after a rename.

### Examples

```bash
API=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['port'])")
TOKEN=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 1. List all combinations + connected accounts
curl -s "http://127.0.0.1:$PORT/api/bridge/content/combinations" \
  -H "Authorization: Bearer $TOKEN" | jq '{
    combinations,
    connected: {
      instagram: [.insta.users[]?.name],
      youtube:   [.youtube.channels[]?.name],
      linkedin:  [.linkedin.linkedInOAuthAccounts[]?.name]
    }
  }'

# 2. Create a combination
curl -sX POST "http://127.0.0.1:$PORT/api/bridge/content/combinations" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "name": "AI Content Lineup",
    "description": "AI/motion content — cross-post everywhere",
    "enabled": true,
    "accounts": {
      "instagram": "ailead.ai",
      "youtube": "AILead",
      "linkedin": "AILead"
    }
  }'

# 3. Update it BY NAME (preferred for humans/agents)
curl -sX PATCH "http://127.0.0.1:$PORT/api/bridge/content/combinations" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "name": "AI Content Lineup", "enabled": false }'

# 3b. Update BY ID (when the name is ambiguous or after a rename)
curl -sX PATCH "http://127.0.0.1:$PORT/api/bridge/content/combinations" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "id": "combo_1786...", "enabled": false }'

# 3c. Rename (server rejects if the new name would collide)
# Note: you can't use `name` for BOTH lookup + update in the same request.
# Look up by id (or by current name via GET, then PATCH by id).
curl -sX PATCH "http://127.0.0.1:$PORT/api/bridge/content/combinations" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "id": "combo_1786...", "name": "AI Lineup v2" }'

# 4. Delete BY NAME (preferred)
curl -sX DELETE "http://127.0.0.1:$PORT/api/bridge/content/combinations?name=AI%20Content%20Lineup" \
  -H "Authorization: Bearer $TOKEN"

# 4b. Delete BY ID
curl -sX DELETE "http://127.0.0.1:$PORT/api/bridge/content/combinations?id=combo_1786..." \
  -H "Authorization: Bearer $TOKEN"
```

## Agent workflow — publishing to a combination

Since combinations aren't yet accepted by the publish endpoints directly, the flow is:

1. **Resolve.** `GET /api/bridge/content/combinations` and find the combo the user asked for (by name, id, or "my usual" ≈ the enabled one or the most recently used).
2. **Confirm.** Show the user the resolved per-platform accounts + intended timing/mode via `ask_user`. Never assume; combos change.
3. **Configure per-platform.** For each account present in the combination, call `POST /api/bridge/content/configure-publish` once per platform (`instagram`, `youtube`, `linkedin`) with the correct account selector.
4. **Set the CTA once.** The CTA draft is content-scoped (`contentId`), not per-platform, so a single `POST /api/bridge/instagram/automation update_cta` covers both the Instagram DM automation and the YouTube pinned comment.
5. **Fan out publish/schedule calls** — Instagram via `POST /api/bridge/instagram/publish` (or `.../schedule`), YouTube via `POST /api/bridge/youtube/publish` (with `wallTime`+`timeZone` for scheduled), LinkedIn via `POST /api/bridge/publish/linkedin`.
6. **Verify** with `GET /api/bridge/content/:id` — check `channels.instagram.published`, `channels.youtube.published`, `channels.linkedin.status`.

### Example — "schedule this reel to my AI combo for tomorrow 8pm IST"

```bash
# Step 1: Look up the combo
COMBO=$(curl -s "http://127.0.0.1:$PORT/api/bridge/content/combinations" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.combinations[] | select(.name == "AI Content Lineup")')

IG=$(echo "$COMBO" | jq -r '.accounts.instagram')
YT=$(echo "$COMBO" | jq -r '.accounts.youtube')
LI=$(echo "$COMBO" | jq -r '.accounts.linkedin')

# Steps 2–3 — confirm with user via ask_user, then configure each platform
# (see instagram.md / youtube.md for detailed configure-publish shapes)

# Step 4 — CTA once (content-scoped)
curl -sX POST "http://127.0.0.1:$PORT/api/bridge/instagram/automation" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$(jq -n --arg cid "$CID" '{action:"update_cta", contentId:$cid, contains:[], messageBody:"...", buttons:[]}')"

# Step 5a — Instagram scheduled
curl -sX POST "http://127.0.0.1:$PORT/api/bridge/instagram/publish/schedule" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$(jq -n --arg cid "$CID" --arg ig "$IG" '{contentId:$cid, selectedAccount:$ig, wallTime:"2026-08-12T20:00", timeZone:"Asia/Kolkata"}')"

# Step 5b — YouTube scheduled (same wallTime shape thanks to bridge symmetry)
curl -sX POST "http://127.0.0.1:$PORT/api/bridge/youtube/publish" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$(jq -n --arg cid "$CID" --arg yt "$YT" '{contentId:$cid, channelId:$yt, wallTime:"2026-08-12T20:00", timeZone:"Asia/Kolkata"}')"

# Step 5c — LinkedIn: no scheduler, either post now or run this at fire time
```

## Creating a combination on user's behalf

If the user says *"save these three as a preset"* or *"create a combo called Trading Content with @tradinglead.in + TradingLead YouTube"*, do this:

1. **Resolve the accounts.** Call `GET /api/bridge/content/combinations` first — the response includes `insta.users[].name`, `youtube.channels[].name`, `linkedin.linkedInOAuthAccounts[].name`. **Only reference accounts that already exist in the connected list.** If the user names an account that isn't connected, ask them to connect it first via the **Add Instagram Account** button in the UI — do not invent handles.
2. **Confirm the payload** with `ask_user` — show the exact combo name, description, and the per-platform account values.
3. **POST it.** Include only the platforms the user actually named; leave the rest unset.
4. **Verify** — the response should be `201` with `{ id, name, accounts, enabled, createdAt, updatedAt }`. Read it back once via GET to confirm it landed in `combinations[]`.

Never silently reuse an existing combination's id for a "create" request — that would delete/replace it. If the user says *"update my Trading combo"*, PATCH the existing id; if they say *"make a new one"*, POST a fresh combo.

## Gaps / roadmap (be honest with the user if relevant)

Today's combinations are a UI convenience, not a first-class publish target. Two improvements would make them genuinely useful for agent workflows:

| Improvement | Why it matters |
|---|---|
| **Accept `combination` (name) on publish/schedule endpoints** — server resolves and fans out to each platform | Right now the agent expands the combo client-side + calls each platform separately. Server-side expansion means the caller passes `{"combination": "AI Content Lineup"}` and gets one response summarising all platforms. Same 409 ambiguous_name safety net as elsewhere. |
| **Add per-combo defaults** — e.g. default caption template, default hashtag list, default schedule slot, default trial-reel flag | Combos would carry more than just accounts, and a "publish to combo" call would fill in reasonable defaults instead of forcing full config every time. |
| **Add `lastUsedAt` + `mostRecent` sort** | *"my usual combo"* has a natural answer without the agent having to guess. |

Flag these to the user if they run into friction — they're not implemented yet but the primitives are there.

## Related skills

- `cl-content-publishing/SKILL.md` — router, endpoint tables
- `cl-content-publishing/instagram.md` — per-platform IG config + trial reels
- `cl-content-publishing/youtube.md` — per-platform YT config + `publishAt`/`wallTime` scheduling
- `cl-content-publishing/linkedin.md` — per-platform LinkedIn config
- `cl-content-publishing/content-lifecycle.md` — Content record + CTA lifecycle
- `cl-content-publishing/workflows.md` — end-to-end recipes (Workflow 1 shows the full fan-out)
