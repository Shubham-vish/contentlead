# Local Audio Review

## Read-only measurements

Requires Python 3, `ffmpeg` (astats/loudnorm/pan) and `ffprobe`. No Python packages,
models, credentials or uploads. Run from this canonical skill checkout:

```bash
python3 scripts/audio_qa.py /path/final.mp4 --output /path/new-audio-report.json
```

The helper is not a Desktop command and is not installed by `/api/skills`.
Packaged Markdown-only installs must locate the canonical helper checkout or
report it unavailable. Never invent an API command or silently skip measurement.

Output includes source SHA-256, first audio-stream metadata, integrated LUFS,
sample peak, estimated intersample true peak, RMS and stereo-to-mono energy
change. Stereo uses `(L+R)/2`; total cancellation is explicit `mono_silent:true`,
not a fabricated finite dB value. No source samples are changed or saved.

Exit codes: **0** measurements completed without the listed warnings;
**2** report completed with warnings requiring review; **1** measurement/input/
output failure. JSON output refuses overwrite. Each external process has a
15-minute timeout; a timeout is a failed check, not a passed result.

The default true-peak warning ceiling is **-1 dBTP**, a conservative review
starting point, not a promise about every platform. Override with
`--true-peak-ceiling` only for the actual delivery requirement.

Undefined meters are `null`. Integrated LUFS often cannot characterize a
sub-400 ms one-shot; do not force short cues to a full-program LUFS target.
Mono loss below -6 dB is a review warning, not automatic permission to alter a
deliberate stereo effect.

## Cue-level and human review

The helper does **not** detect whether a sound suits a scene, whether speech is
masked, whether cues are correctly aligned, or whether the license is valid.
It is not a quality/virality score. Full review also needs:

1. The pinned cue worksheet from `cl-content-direction/sfx-placement.md`.
2. Rendered checks at the actual visual/word anchors, including trims and tails.
3. Speech intelligibility, intentional silence and repeat-source review.
4. Headphone and phone/mono listening, with concrete timestamps for problems.
5. Explicit user approval before changing the visual theme or sound palette.

Measure the **encoded MP4**, even if the source WAV passed: codec conversion can
change peaks. Preserve source files and approved gains; make a reviewed,
reversible correction rather than blindly normalizing or downmixing everything.

## Optional model-based analysis

An external local analyzer such as earshot may help rank candidates, find a
usable trim or build a soundtrack review sheet. It is optional, not installed
by this skill, and does not replace source licensing or user taste review.
Pin its version, disclose/download model dependencies deliberately, and mark
unavailable checks explicitly. Never upload audio to an optional provider
without consent. Do not apply launch-film scoring as a universal style rule.
