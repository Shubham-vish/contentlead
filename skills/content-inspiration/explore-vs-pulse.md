# Explore vs Pulse vs Inspiration — the 3 UIs

There are **three distinct routes** in the SkillTown web app for content research. They share code but have very different data models. When an agent pushes findings or reads state, it needs to know which one it's targeting.

| Route | Component | Data model | Purpose |
|---|---|---|---|
| `/content/inspiration` | `ContentInspirationEngineView` | **Instagram-only reels cache** in Cosmos (per-user) | Legacy feed. Browse synced IG reels by tracked creator through the desktop bridge. |
| `/content/inspiration/explore` | `ExploreSurface` | **Transient fan-out** — no persistence | Ad-hoc topic/URL/text search across sources. Results vanish on refresh. |
| `/content/inspiration/pulse` | `PulseSurface` | **Persistent niches** in Cosmos (niche-items container) | "Monitor these keywords across these sources forever." Items accumulate. |

## When to use which

- **Investigating a creator I already track** → `/inspiration` (calls `/api/bridge/inspiration/feed?username=…`).
- **User just typed a topic and wants to see what's out there right now** → `/explore` (calls `/api/bridge/inspiration/search`).
- **User wants ongoing tracking of a topic and to compare velocity across weeks** → `/pulse` (calls `/api/bridge/inspiration/niches/…`).

## The AI findings panel target

`POST /api/bridge/inspiration/ai-output` supports `context.page` = `"inspiration"` | `"explore"` | `"pulse"` | `"feed"`. Set it correctly so the finding shows up on the surface the user is looking at.

---

# FanOutResponse — what `/search` and `/niches/:slug/refresh` return

The fan-out route returns a `FanOutResponse`:

```typescript
{
  items: UnifiedItem[];              // Blended, deduped across all sources
  perSource: SourceSearchResult[];   // Per-source breakdown (see below)
  context: SearchContext;            // Echo of what was searched
  fetchedAt: string;                 // ISO
  round?: number;                    // 0 = initial, 1-5 = subsequent "Load more"
  exhausted?: boolean;               // True when no source returned new items this round
  allFailed?: boolean;               // True when every source errored
}
```

Per-source result (`perSource[i]`):

```typescript
{
  source: "instagram" | "x" | "youtube" | "reddit" | "technews";
  items: UnifiedItem[];
  elapsedMs?: number;

  // Non-fatal error state — the fan-out kept going for other sources
  error?: string;                    // User-friendly message
  errorCode?: string;                // Stable enum (see below)
  rawError?: string;                 // Original upstream/bridge message; only surface via a "Details" disclosure
  retryable?: boolean;
  retryAfterSec?: number;            // Backoff hint for rate limits

  // Connection state
  needsConnect?: boolean;            // True on any AUTH_* code → show "Connect" CTA
  needsCookieRefresh?: boolean;      // Subset: cookies expired specifically → "Update cookies" CTA

  // Cache metadata
  fromCache?: boolean;               // Served from per-source TTL cache, not live
  fromSharedCache?: boolean;         // Hit the cross-user Cosmos cache (fetched by someone else moments ago)
  fetchedAt?: string;                // When these items were captured

  // UI notices
  notice?: string;                   // e.g. "widened to past year" after auto-broadening
}
```

## Handling patterns

**Rate-limit / retryable failure:**
```
if (source.retryable && source.retryAfterSec) {
  // Show "Retry in Xs" chip; do NOT auto-retry more than once
}
```

**Connection missing (most common on Instagram):**
```
if (source.needsConnect) {
  // errorCode is one of:
  //   AUTH_MISSING_COOKIES   → first-time connect
  //   AUTH_INVALID_COOKIES   → expired/rotated → needsCookieRefresh = true
  //   AUTH_INSUFFICIENT_SCOPE → account exists but can't access this content
  // For IG on Explore/Pulse: the fix is to connect the source in SkillTown Desktop; if Desktop is missing, send user to /download.
  // For IG/X: send the user through the desktop Connect flow, then retry.
}
```

**Cache-served result:**
```
if (source.fromCache) {
  // Display "cached · Xh ago · refresh" so user knows to hit refresh for live
  // fromSharedCache means "another user fetched this seconds ago" — still safe to show
}
```

---

# Velocity scoring (⚡ / ⚡⚡ / ⚡⚡⚡)

Each `UnifiedItem` on Pulse (and increasingly on Explore) gets a `velocity` badge computed at ingest time:

```
performanceMultiplier = itemViews / creatorMedianViews
```

- **⚡ (1× baseline)** — normal, matches the creator's usual reach.
- **⚡⚡ (2×+)** — outperforming their baseline. Signal of "this is landing."
- **⚡⚡⚡ (5×+)** — viral for that creator. Study the hook + first 3 seconds.

For Pulse niches (where there's no single creator baseline), velocity is computed against the **niche's rolling median** for the same source. This makes velocity comparable across creators of very different follower counts — a 100k-follower's ⚡⚡⚡ is a real signal, not just "big account got views."

## Filtering by velocity

Pulse UI exposes:
- `velocityMin` — hide anything below N× baseline.
- Source filter (any subset of instagram/x/youtube/reddit/technews).
- Kind filter (`video` / `image` / `text` / `article`).
- Date range (last 24h / 7d / 30d / all).
- `hasTranscript` boolean — for Whisper'd IG reels + YouTube caption'd videos.

These filters are all client-side in `pulseFilters.ts` — no separate API call.

---

# Denylist

Users can globally hide a creator or a hashtag with the **denylist**. Any item whose author.handle or hashtags intersects the denylist is stripped from `/feed`, `/search`, and every niche.

There's no bridge endpoint for it today — modifications happen via the web UI (`/inspiration/settings`). Read the current denylist via `/api/content/inspiration/denylist` (Next.js only, no bridge passthrough yet).

---

# The `sources` array — what's actually valid

Consistent naming across the codebase:

| Value | Platform | Notes |
|---|---|---|
| `"instagram"` | Instagram | Cache-only on Explore/Pulse search; use tracked creator add + refresh for live creator pulls |
| `"x"` | Twitter/X | **NOT `"twitter"`** — the API always uses `"x"` |
| `"youtube"` | YouTube | HTML scrape (no cookies needed) |
| `"reddit"` | Reddit | Public JSON API (no cookies needed) |
| `"technews"` | Aggregated tech news | RSS union. Aggregate only — cannot track a "creator" here. |

For **creator tracking** (`POST /creators`, `POST /creators/refresh`) the valid sources are `instagram | x | youtube | reddit` (technews is excluded — it's not creator-shaped data).

---

# Common gotchas

1. **`"twitter"` is not a valid source id.** Use `"x"` everywhere.
2. **IG search returns empty with `needsConnect: true` if the user hasn't installed the desktop app.** That's not a bug — server can't scrape IG live. Send them to `/download`.
3. **`round` maxes at 5.** After that, `exhausted: true` and further "Load more" calls will short-circuit.
4. **`limit` maxes at 25 per source.** Requesting more returns 400.
5. **`ai-output` findings are in-memory per Next.js instance, max 50 per user.** In desktop single-instance mode this is fine. If the marketing site ever runs multi-instance, findings won't sync across pods.
6. **Bridge auth needs `Bearer` prefix.** `Authorization: Bearer <token>` — without the word `Bearer` the server returns `{"error": "unauthorized"}`.
7. **The `Cap.ContentInspirationView` capability gate** wraps every route. If a user's plan doesn't include it, they get 403 — not 401. The bridge doesn't translate this — the AI sees `403` and should surface a plan upgrade message.
