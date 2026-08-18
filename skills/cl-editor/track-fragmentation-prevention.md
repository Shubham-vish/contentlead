---
description: How and why agent add* commands fragment into multiple tracks — and the exact patterns that prevent it. Load whenever adding more than one item of the same type in sequence (captions, audio SFX, custom scenes, images).
tags: tracks, track-management, consolidation, caption, audio, sfx, scene, add-handler, fragmentation
---

# Track Fragmentation — Why It Happens and How To Stop It

Agents often notice their timeline ends up with **N separate tracks for N items of the same type** (e.g. 7 caption tracks × 1 caption each). This makes the timeline hard to read, breaks visual grouping, and can cause z-order bugs.

## Root Cause (verified)

Every `editor.add*` handler calls `findCompatibleTrack(itemType, from, to, stateManager, forceTrackId?)` (in `SkillTown/.../commandHandlers/trackOccupancy.ts`).

Behaviour:
1. If `params.trackId` is provided, it's forced (bypasses the search).
2. Otherwise, the function looks at `stateManager.getState().design.tracks[]` for:
   - Same `type`
   - Not `locked` / `static`
   - **Agent-created marker**: `metadata.isAgentTrack === true`, `metadata.isTemplateTrack === true`, `metadata.isSfxTrack === true`, `metadata.isDroppedMediaTrack === true`, OR name starts with `"AI "` / `"API Media"` / `"Templates"` / `"Custom: "`. (For type `audio`, ALL audio tracks qualify.)
   - No time overlap with existing items (`doTimesOverlap`).
   - No time overlap with `pendingOccupancy` (tracks with items dispatched but not yet in state).

**The failure mode:** `pendingOccupancy` is keyed by `trackId`, but the *newly-created* track's ID **isn't in `state.tracks` yet** when the next `add*` command fires. So the next call sees zero compatible tracks → creates another new one → repeat.

This bites when:
- Batching multiple `add*` commands via `POST /api/batch` (no state updates between them).
- Firing sequential `POST /api/execute` calls with no wait between them.
- Using tight `Promise.all` fan-out.

## Reliable Patterns

### Pattern A — Sequential add + wait (recommended for most cases)

Send one `add*` at a time. WAIT for the response, then send the next. The reducer has time to insert the new track into state, so the next `findCompatibleTrack` finds and reuses it.

```py
first_track = None
for chunk in chunks:
    r = call("editor.addCaption", {"from": t0, "durationMs": d, "details": {...}})
    # No trackId needed — the reducer registers the first track before we send the 2nd call
    time.sleep(0.05)  # cheap safety margin; sync urllib already blocks per response
```

Verified in this session: **25 captions on 1 track** using sequential await.

### Pattern B — Force `trackId` on every call after the first

Grab the returned `trackId` from the first `add*` response and pass it explicitly to every subsequent call:

```py
first = call("editor.addAudio", {"src": s1, "from": 0, "durationMs": 1500})
tid = first["result"]["trackId"]  # or result.item.trackId
for a in more_audios:
    call("editor.addAudio", {"trackId": tid, "src": a.src, "from": a.t, "durationMs": a.d})
```

This is the **safest pattern for `POST /api/batch`** — batching bypasses the state-update race.

### Pattern C — Pre-create the track, then add

Only if the runtime exposes a `track.create` command; otherwise skip.

## `scene.addCustomScene` — special notes

- Params: `{ code, name?, from?, durationMs?, orientation?, editableManifest? }` — **no `trackId`**.
- **Naming trick:** every custom scene lands on a track named `Custom: <name>` (default `Custom: Custom Scene`). Sequential adds *do* consolidate onto the first `Custom: *` track (verified this session: 8 scenes on 1 track).
- `from` param **is** respected — do NOT rely on old lore that says it's ignored; if a scene lands at `0` you're on an old build.

## Consolidating an already-fragmented timeline

If your timeline is already fragmented (say, 8 tracks × 1 scene each):

1. Snapshot each item's full state via `GET /api/state`:
   - `id`, `trackId`, `display.from`, `display.to`
   - For scenes: `metadata.customSceneCode` / `metadata.bundledCode` + `metadata.bundleId`
   - For audio: `details.src`, `details.volume`, `display`
   - For captions: `details.words[]` and every style key
2. `editor.deleteItems` for items 2..N (keep the first — its track becomes the target).
3. Re-add each using Pattern A (sequential) or Pattern B (explicit `trackId`).
4. Verify with `query.getTrackInfo` — expect one populated track per type.

`editor.editItem` **cannot** change an item's `trackId` at the top level — always delete + re-add.

## Verify with `query.getTrackInfo`

Track topology should look like:

```
[0] caption  'AI Captions'          items=25   ← FRONT
[1] audio    'AI Audio'             items=4    (all SFX / VO)
[2] video    'video track'          items=7    (webcam)
[3] video    'video track'          items=7    (screen)
[4] image    'Custom: Custom Scene' items=8    ← BACK
```

If any type shows > 1 non-empty track, apply the consolidation flow.

## Gotchas discovered this session

- `editor.addCaption` respects `from` but sets `display.to = from` (durationMs is **not** applied to display range in some builds). After adding captions, fix with `editor.editItem` and pass `{"display": {"from": t0, "to": t0 + dur}}`.
- `bulk.styleByType` requires `details:` (not `properties:`) — the schema error is `type and details required`.
- Deleted tracks stay in `state.tracks` (item-empty ghosts). They don't render, but they clutter the topology. There's no `deleteTrack` command exposed today; `editor.reorderTracks` prunes some of them.
