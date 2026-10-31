# SFX Roles and Palette Review

Use the user's approved palette first. There is no bundled universal "27-sound"
library in this public skill. Historical `_Assets/sfx/core-set/` paths and file
counts are not a portable asset resolver or proof the sounds remain available.

## Select by role, not by quota

| Visible/story event | Candidate role | When silence is preferable |
|---------------------|----------------|----------------------------|
| Actual button press | Short click/press | Source already contains a useful click |
| Visible typing | Natural typing passage matching the burst | Field is static or voice needs focus |
| Panel/card enters | Soft pop or short movement | Frequent minor UI updates |
| Scene/topic transition | Whoosh/swipe appropriate to the motion | A clean hard cut already works |
| Confirmed completion | Restrained success/chime | Repeated routine confirmations |
| Error or correction | Short error accent | It distracts from the explanation |
| Major reveal | Riser into impact, if approved | Conversational or sensitive material |
| Pure reasoning | Usually no SFX | Let the words carry the moment |

These are suggestions, not required layers. Do not add an effect merely because
a technical term was spoken, a word highlighted, or a cut occurred.

## Palette approval

Before introducing a new sound family or changing an existing mapping:

1. Identify the scope: brand, format, audience and existing style revision.
2. Preserve existing approved choices; label uncertain historical choices as
   "saved reference, approval unverified", not approved.
3. Offer a small comparison on the same representative motion, with a no-SFX
   option. Keep picture, timing and playback level comparable. State whether
   levels were loudness-matched, peak-matched or untouched.
4. Ask which roles to keep, replace or omit. A sound-pack name is not a visual
   theme selection; review visual changes separately.
5. Save only explicit approval, its scope, source identity and restrictions.
   Until approval, candidates must not become defaults.

## Asset eligibility

- Use `cl-ai-media` for cloud search, quick picks and selection; check live
  response fields rather than assuming a catalog size or URL lifetime.
- A user-supplied local library must have an existing root, resolvable files and
  provenance. Do not invent a fallback path.
- Inspect the manifest's license status and source terms before selection.
  `usable: true`, a filename, a repository license, or a "realness" score is not
  clearance for commercial use or redistribution.
- Exclude quarantined assets. Hold unverified/restricted sources for clearance
  rather than treating organic posting as automatically permitted.
- Permission to use a sound in a finished video may forbid distributing the
  standalone file in an application or public skill.
- Preserve attribution/source/license information through the cue plan.

## Levels and measurements

Do not assume every library file is normalized. `gainDb = 20 * log10(volume/100)`
converts the editor multiplier; it does not measure the result's LUFS.

Use conservative per-cue gain, listen against speech, and measure the actual
render. Short one-shots can have undefined integrated LUFS; do not aggressively
normalize them to a full-program target. Sample rate is not a quality ranking.

See [sfx-placement.md](sfx-placement.md) for timing and
[`cl-audio`](../cl-audio/SKILL.md) for local measurements.
