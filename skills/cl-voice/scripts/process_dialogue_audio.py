#!/usr/bin/env python3
"""
process_dialogue_audio.py — Dialogue/TTS audio post-processor for ContentLead reels.

Ported from the proven TlEditingSolution pipeline (Tools/main/audio_trimmer.py +
Tools/boost_audio.py). Run this on EVERY generated/cloned voice clip BEFORE placing
it on the timeline, so dialogue reels feel tight and punchy — no dead air at the
head/tail of a line, and consistent, loud levels across speakers.

What it does (in order):
  1. TRIM  — removes leading/trailing silence (detect_nonsilent, thresh -40 dBFS,
             min_silence_len 100 ms). This is the "gap removal" that makes cuts snap.
  2. GAPS  — (optional) collapses long INTERNAL silences down to a fixed max so
             mid-line pauses don't drag. Off unless --max-gap-ms is given.
  3. BOOST — applies a fixed +dB gain and/or peak normalization so every line sits
             at a consistent, loud level.

Defaults mirror the TlEditingSolution values:
  - silence threshold  -40 dBFS   (AudioTrimmer.silence_threshold)
  - min silence len     100 ms    (AudioTrimmer.min_silence_len)
  - boost              +13 dB     (DynamicVideoEditor boost_audio_db)
  - normalize            on       (DynamicVideoEditor boost_audio_normalize)

Usage:
  # single file, in place, TlEditing defaults (trim + normalize + 13 dB)
  python process_dialogue_audio.py modi-clone-test.mp3

  # write to a new file, gentler +6 dB, no normalize
  python process_dialogue_audio.py in.mp3 -o out.mp3 --boost-db 6 --no-normalize

  # also collapse internal pauses longer than 350 ms
  python process_dialogue_audio.py in.mp3 --max-gap-ms 350

  # batch a whole folder (glob), each file trimmed + boosted in place
  python process_dialogue_audio.py "audio_dir/*.mp3" --boost-db 13

Dependency:  pip install pydub   (needs ffmpeg on PATH)
Exit code 0 on success, non-zero if any file failed.
"""

import argparse
import glob
import os
import sys

try:
    from pydub import AudioSegment
    from pydub.silence import detect_nonsilent
    from pydub.effects import normalize as pydub_normalize
except ImportError:
    sys.stderr.write(
        "ERROR: pydub is required. Install with:  pip install pydub\n"
        "       (ffmpeg must also be installed and on PATH)\n"
    )
    sys.exit(2)


def trim_silence(audio, silence_thresh=-40, min_silence_len=100):
    """Remove silence from the START and END of the clip. Returns trimmed audio.

    Mirrors TlEditingSolution AudioTrimmer.trim_silence.
    """
    nonsilent = detect_nonsilent(
        audio, min_silence_len=min_silence_len, silence_thresh=silence_thresh
    )
    if not nonsilent:
        print("   ! no non-silent range found; leaving clip untouched")
        return audio
    content_start = nonsilent[0][0]
    content_end = nonsilent[-1][1]
    removed_start = content_start / 1000.0
    removed_end = (len(audio) - content_end) / 1000.0
    print(f"   trim: -{removed_start:.3f}s head, -{removed_end:.3f}s tail")
    return audio[content_start:content_end]


def collapse_internal_gaps(audio, max_gap_ms, silence_thresh=-40, min_silence_len=100):
    """Collapse INTERNAL silences longer than max_gap_ms down to max_gap_ms.

    Keeps speech chunks intact, only shortens the dead air between them. Optional —
    only runs when --max-gap-ms is supplied.
    """
    nonsilent = detect_nonsilent(
        audio, min_silence_len=min_silence_len, silence_thresh=silence_thresh
    )
    if len(nonsilent) < 2:
        return audio
    keep_silence = AudioSegment.silent(duration=max_gap_ms)
    out = audio[nonsilent[0][0]:nonsilent[0][1]]
    saved = 0
    for prev, cur in zip(nonsilent, nonsilent[1:]):
        gap = cur[0] - prev[1]
        if gap > max_gap_ms:
            out += keep_silence
            saved += gap - max_gap_ms
        else:
            out += audio[prev[1]:cur[0]]
        out += audio[cur[0]:cur[1]]
    if saved:
        print(f"   gaps: collapsed internal pauses, saved {saved/1000.0:.3f}s")
    return out


def boost(audio, boost_db=13, use_normalize=True):
    """Apply fixed +dB gain and/or peak normalization. Mirrors boost_audio.py."""
    before = audio.max_dBFS
    if boost_db and boost_db > 0:
        audio = audio + boost_db
    if use_normalize:
        audio = pydub_normalize(audio)
    print(f"   level: {before:.2f} -> {audio.max_dBFS:.2f} dBFS "
          f"(+{boost_db}dB{', normalize' if use_normalize else ''})")
    return audio


def process_file(path, out_path, args):
    print(f"» {os.path.basename(path)}")
    ext = os.path.splitext(path)[1].lstrip(".").lower() or "mp3"
    audio = AudioSegment.from_file(path)
    orig = len(audio)

    if not args.no_trim:
        audio = trim_silence(audio, args.silence_thresh, args.min_silence_len)
    if args.max_gap_ms:
        audio = collapse_internal_gaps(
            audio, args.max_gap_ms, args.silence_thresh, args.min_silence_len
        )
    audio = boost(audio, args.boost_db, not args.no_normalize)

    # Safety backup when overwriting in place
    if out_path == path and not args.no_backup:
        backup = path + ".backup"
        if not os.path.exists(backup):
            AudioSegment.from_file(path).export(backup, format=ext)
            print(f"   backup: {os.path.basename(backup)}")

    audio.export(out_path, format=ext)
    print(f"   saved: {os.path.basename(out_path)}  "
          f"({orig/1000.0:.3f}s -> {len(audio)/1000.0:.3f}s)")


def main():
    p = argparse.ArgumentParser(description="Trim + boost dialogue/TTS audio.")
    p.add_argument("input", help="audio file or glob (e.g. 'dir/*.mp3')")
    p.add_argument("-o", "--output", help="output file (single input only; "
                                          "default overwrites in place)")
    p.add_argument("--boost-db", type=float, default=13,
                   help="fixed gain in dB (default 13; 0 disables)")
    p.add_argument("--no-normalize", action="store_true",
                   help="skip peak normalization (on by default)")
    p.add_argument("--no-trim", action="store_true",
                   help="skip leading/trailing silence trim")
    p.add_argument("--max-gap-ms", type=int, default=0,
                   help="collapse internal pauses longer than this (0 = off)")
    p.add_argument("--silence-thresh", dest="silence_thresh", type=int, default=-40,
                   help="silence threshold in dBFS (default -40)")
    p.add_argument("--min-silence-len", dest="min_silence_len", type=int, default=100,
                   help="min silence length in ms to count as silence (default 100)")
    p.add_argument("--no-backup", action="store_true",
                   help="do not write a .backup when overwriting in place")
    args = p.parse_args()

    files = sorted(glob.glob(os.path.expanduser(args.input)))
    if not files:
        sys.stderr.write(f"No files matched: {args.input}\n")
        sys.exit(1)
    if args.output and len(files) > 1:
        sys.stderr.write("-o/--output only valid with a single input file.\n")
        sys.exit(1)

    failed = 0
    for f in files:
        out = os.path.expanduser(args.output) if args.output else f
        try:
            process_file(f, out, args)
        except Exception as e:  # noqa: BLE001
            failed += 1
            sys.stderr.write(f"   ERROR on {f}: {e}\n")
    print(f"\nDone. {len(files)-failed}/{len(files)} ok"
          + (f", {failed} failed" if failed else ""))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
