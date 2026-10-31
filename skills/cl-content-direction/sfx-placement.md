---
name: sfx-placement
description: "Approved SFX palette to deterministic cue plan, acoustic alignment, explicit track placement and rendered-audio review."
tags: sfx, sound-effects, placement, timing, audio, review
---

# SFX Placement: Picture First, Measured Sound Second

Read [sfx-reference.md](sfx-reference.md) for role selection, licensing and palette
approval. Use `cl-editor` for live commands; the worksheet below is planning data,
not a new editor API.

## 1. Preserve the approved edit

Use the approved transcript and output-clock visual events. Do not independently
retranscribe with a weaker model or move a sentence/cut to fit a sound. Account
for source trims, speed changes and nested offsets before planning audio.

Choose meaningful events, including explicit no-SFX decisions. Check existing
source/baked audio to avoid doubling clicks or effects. Music is optional unless
the approved style specifically calls for it.

## 2. Freeze a cue worksheet

Extend existing decision IDs / selected-SFX records rather than replacing them.
Record these fields per cue in the project's review artifact:

| Field | Meaning |
|-------|---------|
| `cueId`, `decisionId` | Stable link to the approved visual/story event |
| `role`, `reason` | Why this event needs sound, or why it stays silent |
| `fps`, `targetFrame` | Final output timebase and target visual frame |
| `assetId`, `sourcePath`, `sha256` | Pinned selected file; never a bare expiring URL |
| `trimStartMs`, `trimEndMs` | Absolute source in/out points; end is exclusive |
| `anchorKind`, `anchorSourceMs` | `start`, `arrival` or `peak`; position in source |
| `playbackRate`, `gainDb` | Actual playback transform and initial gain |
| `trackId` | Explicit compatible owner track after creation |
| `license`, `sourceUrl`, `attribution` | Verified permission/provenance |
| `approval`, `styleRevision` | Candidate or approved, with user-review evidence |

This uses an **absolute source-out** `trimEndMs`. Translate deliberately to APIs
whose `trimEnd` instead means "amount removed from the end"; never pass this
worksheet through unchanged.

Freeze file identity after review. A re-search must not silently replace an
approved cue. A changed source hash requires remeasurement and review.

## 3. Align the audible moment

For constant-rate playback:

```text
targetMs = targetFrame * 1000 / fps
startMs = targetMs - (anchorSourceMs - trimStartMs) / playbackRate
```

Use the exact rational FPS when applicable. Require positive playback rate and
an anchor inside the chosen trim. If startMs is negative, adjust the cue/trim
explicitly or omit it; do not silently clamp and claim the anchor still matches.
Variable-speed audio needs the actual time map, not this formula.

- **Start**: a pre-trimmed immediate click.
- **Arrival**: the sound becomes perceptually present, often before its peak.
- **Peak**: a deliberate rising swell or impact climax.

Inspect/listen to the selected trim. A silence threshold, waveform maximum,
spectral onset or timestamp in an old manifest is evidence, not a universal
perceptual anchor. Document the chosen definition and offset.

Cut at quiet boundaries when practical and use short fades where appropriate.
Cutting exactly at an onset does **not** guarantee a click-free edit. Preserve
natural typing bursts and decays; do not machine-gun one sample to fill a field.

## 4. Musical alignment is optional

Only snap movable events when verified music beats and the approved edit allow
it. Coarse loudness peaks are beat candidates, not beat ground truth. Keep an
explicit per-event tolerance; if no valid beat exists, retain the visual/word
anchor. Never extend a search window or shift dependent scenes without review.

## 5. Place and mix

- Resolve live `tabId`/content readiness via `cl-editor`.
- Create a compatible audio track once or select an existing `trackId`; reuse
  its actual returned owner. Never rely on a track name for deterministic reuse.
- Translate worksheet times to the documented command units. Inspect the
  resulting source trim, display range, gain and owner; save and verify.
- Keep speech intelligible. Fixed gain percentages cannot compensate for
  different source loudness, frequency balance or mono cancellation.
- Choose one owner for ducking/mastering. `audio.duckMusic` is a coarse whole-item
  volume operation, not evidence of dynamic sidechain automation.

## 6. Verify the export

Use [`cl-audio/audio-review.md`](../cl-audio/audio-review.md). Measure the actual
encoded output, not just a source WAV or stored master-bus preset.

Review the cue worksheet alongside the render: wrong source/trim, early/late
arrival, masked speech, repetitive accents, clipped tails and unintended gaps.
Compare stereo and mono, then listen on headphones and a phone. A screenshot
cannot establish audible sync, and an acoustic score cannot approve taste.

The local audio inspector measures file-level loudness/peaks/mono energy; it
does **not** automatically verify this worksheet's cue alignment or masking.
Mark those checks unreviewed until they are actually inspected.
