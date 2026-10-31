"""Read-only audio measurements; no models, uploads, or source processing."""

import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys


def run(command):
    result = subprocess.run(command, capture_output=True, text=True, timeout=900)
    if result.returncode:
        raise ValueError(f"{command[0]} failed: {result.stderr[-2000:].strip()}")
    return result


def number(value):
    value = float(value)
    return value if math.isfinite(value) else None


def meters(path, mono=False):
    filters = []
    if mono:
        filters.append("pan=mono|c0=0.5*c0+0.5*c1")
    filters.extend(["astats=metadata=0:reset=0", "loudnorm=I=-16:TP=-1:LRA=11:print_format=json"])
    result = run([
        "ffmpeg", "-nostdin", "-hide_banner", "-nostats", "-v", "info",
        "-i", str(path), "-map", "0:a:0", "-vn",
        "-af", ",".join(filters), "-f", "null", "-",
    ])
    match = re.search(r'\{\s*"input_i".*?\}', result.stderr, re.S)
    if not match or "Overall" not in result.stderr:
        raise ValueError("ffmpeg did not return complete loudness/astats measurements")
    loudness = json.loads(match.group())
    overall = result.stderr.rsplit("Overall", 1)[1]

    def stat(label):
        found = re.search(rf"{re.escape(label)}:\s*(\S+)", overall)
        if not found:
            raise ValueError(f"Missing ffmpeg measurement: {label}")
        return number(found.group(1))

    return {
        "integrated_lufs": number(loudness["input_i"]),
        "true_peak_dbtp": number(loudness["input_tp"]),
        "loudness_range_lu": number(loudness["input_lra"]),
        "sample_peak_dbfs": stat("Peak level dB"),
        "rms_dbfs": stat("RMS level dB"),
    }


def inspect_file(source, ceiling=-1.0):
    if not math.isfinite(ceiling):
        raise ValueError("True-peak ceiling must be finite")
    path = Path(source).resolve(strict=True)
    if not path.is_file():
        raise ValueError("Input must be a local file")
    before = path.stat()
    probe = json.loads(run([
        "ffprobe", "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=codec_name,sample_rate,channels,duration:format=duration",
        "-of", "json", str(path),
    ]).stdout)
    if not probe.get("streams"):
        raise ValueError("Input has no audio stream")
    stream = probe["streams"][0]
    channels = int(stream["channels"])
    if channels not in (1, 2):
        raise ValueError("Mono translation is defined here only for mono/stereo inputs")
    duration = stream.get("duration", probe.get("format", {}).get("duration"))
    measured = meters(path)
    mono = meters(path, mono=True) if channels == 2 else measured
    source_rms, mono_rms = measured["rms_dbfs"], mono["rms_dbfs"]
    mono_silent = source_rms is not None and mono_rms is None
    mono_change = round(mono_rms - source_rms, 3) if source_rms is not None and mono_rms is not None else None
    warnings = []
    if measured["true_peak_dbtp"] is not None and measured["true_peak_dbtp"] > ceiling:
        warnings.append("true_peak_above_requested_ceiling")
    if source_rms is None:
        warnings.append("silent_audio")
    if mono_silent or (mono_change is not None and mono_change < -6):
        warnings.append("mono_cancellation_risk")
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    after = path.stat()
    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        raise ValueError("Source changed during measurement; inspect a stable render")
    return {
        "schema_version": 1,
        "source": str(path),
        "sha256": digest.hexdigest(),
        "audio_stream": 0,
        "codec": stream["codec_name"],
        "sample_rate": int(stream["sample_rate"]),
        "channels": channels,
        "duration_s": number(duration) if duration is not None and duration != "N/A" else None,
        **measured,
        "mono_energy_change_db": mono_change,
        "mono_silent": mono_silent,
        "true_peak_ceiling_dbtp": ceiling,
        "warnings": warnings,
        "method": "ffmpeg loudnorm input meters; astats before processing; stereo mono=(L+R)/2",
        "limitations": [
            "Undefined/nonfinite meters are null, not a passing zero.",
            "Short one-shots can have undefined integrated LUFS.",
            "Only the first audio stream is measured.",
            "No automated cue sync, speech masking, licensing, taste or platform compliance verdict.",
            "True peak is ffmpeg's intersample estimate; output is discarded, source remains unchanged.",
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--true-peak-ceiling", type=float, default=-1.0)
    parser.add_argument("--output", type=Path, help="New JSON file; refuses to overwrite")
    args = parser.parse_args()
    try:
        report = inspect_file(args.source, args.true_peak_ceiling)
        text = json.dumps(report, indent=2, allow_nan=False) + "\n"
        if args.output:
            with args.output.open("x", encoding="utf-8") as handle:
                handle.write(text)
        else:
            print(text, end="")
        return 2 if report["warnings"] else 0
    except (OSError, ValueError, KeyError, subprocess.TimeoutExpired) as error:
        print(f"audio_qa: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
