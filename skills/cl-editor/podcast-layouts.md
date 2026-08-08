---
name: podcast-layouts
description: Apply pre-built podcast layouts (2-person split, single-speaker focus, screenshare with PIPs, vertical 9:16 variants) to timeline ranges. Use when the user has role-tagged podcast clips (Speaker A / Speaker B / Screen) and wants to switch the visual arrangement — either for the entire timeline or for a specific range/scene.
---

# Podcast Layouts

The ContentLead editor ships with a curated library of **podcast layouts** — pre-built cell arrangements that place Speaker A / Speaker B / Screen clips into visually balanced compositions. Applying a layout splits the selected clips at the range boundaries, rewrites the interior segments into the chosen cells (position + size + crop), stamps `details.layoutTag`, and fades out any role the layout hides.

Everything you do here is a thin wrapper around `applyLayoutToRange`, the same engine the sidebar Layouts panel uses. Undo/redo works exactly like a manual edit.

## Role Model — the prerequisite

Every layout is defined in terms of **roles**, not specific clips:

| Role       | Meaning                                            |
|------------|----------------------------------------------------|
| `speakerA` | Primary host / first speaker camera                |
| `speakerB` | Second speaker camera                              |
| `speakerC` | Third speaker (rare, only in `2p` grid variants)   |
| `speakerD` | Fourth speaker (very rare)                         |
| `screen`   | Screenshare / slide feed                           |

Roles are stored as `metadata.podcastRole` on each timeline item. The podcast dashboard's Framed preset tags these automatically. For manually-imported clips, you must tag them first:

```bash
# Tag the two currently selected clips as speakerA and speakerB
curl -sX POST http://127.0.0.1:$PORT/api/execute -H "Authorization: $TOKEN" \
  -d '{"type":"layout.tagRole","params":{"itemIds":["itm_1"],"role":"speakerA"}}'
curl -sX POST http://127.0.0.1:$PORT/api/execute -H "Authorization: $TOKEN" \
  -d '{"type":"layout.tagRole","params":{"itemIds":["itm_2"],"role":"speakerB"}}'
```

Pass `role: null` to clear a tag.

## Commands

### `layout.list` — inventory + current tag status
No parameters. Returns:

```json
{
  "layouts": [
    { "id": "builtin:split-5050", "name": "Split 50 / 50 (A | B)", "category": "2p",
      "requiredRoles": ["speakerA", "speakerB"], "description": "..." }
  ],
  "taggedCounts": { "speakerA": 3, "speakerB": 3, "speakerC": 0, "speakerD": 0, "screen": 1 },
  "canvasSize": { "width": 1920, "height": 1080 }
}
```

Always call this first when the user's intent is fuzzy ("make it look like a split screen") — it tells you what's actually taggable in the current project.

### `layout.apply` — apply a layout to a range
```json
{
  "type": "layout.apply",
  "params": {
    "layoutId": "builtin:split-5050",
    "range": { "start": 0, "end": 15000 },
    "options": { "gap": 8, "cornerRadius": 12, "background": "#0F1218" },
    "itemIds": ["itm_A", "itm_B"],
    "roleAssignments": { "speakerA": ["itm_A"], "speakerB": ["itm_B"] }
  }
}
```

Parameter resolution priority:
1. **`range`** (ms) — explicit wins.
2. **`itemIds`** — derives the range from the union of `display.from..to` on those items.
3. **Current selection** — fallback; matches what the Layouts sidebar does.

Errors when: no roles are tagged in the timeline, no valid range can be derived, or no tagged clips overlap the range.

### `layout.getActive` — read the current layout tag
```json
{ "type": "layout.getActive", "params": { "atMs": 5000 } }
```
`atMs` defaults to the playhead. Returns `{ activeLayoutId, tagsByItem, ambiguous }`. `activeLayoutId` is only set when every item covering that time shares the same tag; otherwise `ambiguous: true`.

### `layout.tagRole` — assign / clear the role tag
```json
{ "type": "layout.tagRole", "params": { "itemIds": ["itm_1"], "role": "speakerA" } }
```
`itemIds` optional (defaults to selection). `role` must be one of `speakerA|speakerB|speakerC|speakerD|screen` or `null` to clear.

## Layout Inventory

| id | Category | Required Roles | Notes |
|----|----------|----------------|-------|
| `builtin:split-5050` | 2p | speakerA, speakerB | Classic side-by-side, A left / B right |
| `builtin:split-5050-mirror` | 2p | speakerA, speakerB | Mirrored: B left / A right |
| `builtin:focus-a` | 1p | speakerA | Speaker A fullscreen, B hidden |
| `builtin:focus-b` | 1p | speakerB | Speaker B fullscreen, A hidden |
| `builtin:share-full` | share | screen | Screen fullscreen, speakers hidden |
| `builtin:share-2pip` | share | speakerA, speakerB, screen | Screen dominant + both speakers as small PIPs |
| `builtin:share-1pip` | share | speakerA, screen | Screen + Speaker A PIP; B hidden |
| `builtin:share-1pip-b` | share | speakerB, screen | Screen + Speaker B PIP; A hidden |
| `builtin:share-side-a` | share | speakerA, screen | Screen + Speaker A side-by-side |
| `builtin:share-side-b` | share | speakerB, screen | Screen + Speaker B side-by-side |
| `builtin:9x16-stacked` | vertical | speakerA, speakerB | A over B, full-width |
| `builtin:9x16-stacked-ba` | vertical | speakerA, speakerB | B over A |
| `builtin:9x16-focus-a` | vertical | speakerA | A fullscreen, 9:16 |
| `builtin:9x16-focus-b` | vertical | speakerB | B fullscreen, 9:16 |
| `builtin:9x16-share-stacked` | vertical | speakerA, speakerB, screen | Screen + speakers stacked below |
| `builtin:9x16-share-a` | vertical | speakerA, screen | Speaker A dominant (66%) + screen small |
| `builtin:9x16-share-b` | vertical | speakerB, screen | Speaker B dominant + screen small |
| `builtin:9x16-share-big-a` | vertical | speakerA, screen | Screen dominant (66%) + Speaker A small |
| `builtin:9x16-share-big-b` | vertical | speakerB, screen | Screen dominant + Speaker B small |
| `builtin:9x16-a-above-share` | vertical | speakerA, screen | Speaker A on top, gap for captions, screen below |
| `builtin:9x16-b-above-share` | vertical | speakerB, screen | Speaker B on top, gap for captions, screen below |
| `builtin:9x16-share-pip-a` | vertical | speakerA, screen | Screen full + Speaker A as PIP |

## `options` — the four global knobs

Bake user-visible presentation knobs at apply time (matches the sidebar sliders):

| Key | Type | Default | Notes |
|-----|------|---------|-------|
| `gap` | number (px) | `0` | Spacing between cells (never applied to fullscreen cells). |
| `marginTop`/`Right`/`Bottom`/`Left` | number (px) | `0` | Outer canvas padding, per side. |
| `cornerRadius` | number (px) | `0` | Applied to each non-fullscreen cell, max ~50. |
| `background` | hex string | `"#000000"` | Also updates the podcast Frame Background clip if one exists. |

`options` is optional; omit it to reuse the layout's defaults.

## Selection Heuristics

- **User says "split screen" with two people on screen** → `builtin:split-5050` (or `-mirror` if user swaps sides).
- **"Focus on the host / speaker"** for a beat → `builtin:focus-a`.
- **Shorts / vertical export** → any `builtin:9x16-*`. Prefer `-a-above-share` / `-b-above-share` when captions are on — they leave a 6% caption-safe gap between speaker and screen.
- **Someone shares slides** → `builtin:share-side-a` if only one speaker is active, `builtin:share-2pip` if both, `builtin:share-full` for a moment where the screen should dominate.
- **Never** apply a `share` layout without at least one `screen`-tagged clip — the response will report `unassignedRoles`.

## Workflow: apply a layout to the whole timeline

```bash
# 1. Check tag status.
curl -sX POST http://127.0.0.1:$PORT/api/execute -H "Authorization: $TOKEN" \
  -d '{"type":"layout.list"}'

# 2. If speakers aren't tagged, tag them.
curl -sX POST http://127.0.0.1:$PORT/api/execute -H "Authorization: $TOKEN" \
  -d '{"type":"editor.select","params":{"itemIds":["itm_hostCam"]}}'
curl -sX POST http://127.0.0.1:$PORT/api/execute -H "Authorization: $TOKEN" \
  -d '{"type":"layout.tagRole","params":{"role":"speakerA"}}'

# 3. Get the timeline duration for a full-range apply.
DURATION=$(curl -sX POST http://127.0.0.1:$PORT/api/execute -H "Authorization: $TOKEN" \
  -d '{"type":"query.getDuration"}' | jq -r .result.duration)

# 4. Apply the layout across the whole thing.
curl -sX POST http://127.0.0.1:$PORT/api/execute -H "Authorization: $TOKEN" \
  -d "{\"type\":\"layout.apply\",\"params\":{\"layoutId\":\"builtin:split-5050\",\"range\":{\"start\":0,\"end\":$DURATION}}}"
```

## Workflow: switch layout for a specific beat

Say the user says "cut to Speaker A alone from 22s to 30s, then back to split":

```bash
# Focus A from 22..30s
curl -sX POST http://127.0.0.1:$PORT/api/execute -H "Authorization: $TOKEN" \
  -d '{"type":"layout.apply","params":{"layoutId":"builtin:focus-a","range":{"start":22000,"end":30000}}}'

# Split from 30..60s
curl -sX POST http://127.0.0.1:$PORT/api/execute -H "Authorization: $TOKEN" \
  -d '{"type":"layout.apply","params":{"layoutId":"builtin:split-5050","range":{"start":30000,"end":60000}}}'
```

`applyLayoutToRange` automatically splits the underlying clips at each boundary — you do **not** need to call `editor.splitItem` beforehand.

## Gotchas

- **Response `unassignedRoles`**: the layout wants a role you haven't tagged. Fix with `layout.tagRole` and re-apply, or pick a different layout.
- **Response `skippedRoles`**: the role is tagged but no items overlap the range at all. Usually means the user asked for a range earlier than the clips exist.
- **Selection is preserved after apply.** The interior segment ids will differ (because of splits), but the pre-apply selection is restored so the right-panel stays put.
- **Hidden speakers get `opacity: 0`, not delete.** Switching back to a "both visible" layout is one command — clips are still there.
- **`details.layoutTag` is authoritative for the ribbon.** If you're writing tooling that reasons about applied layouts, read the tag; don't try to infer from cell geometry.
- **Vertical layouts require a 9:16 canvas** for previews to make sense. Call `editor.resize` (via `canvas-and-positioning`) if you're switching orientation.
