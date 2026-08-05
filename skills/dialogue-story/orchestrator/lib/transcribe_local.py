#!/usr/bin/env python3
"""Local word-level transcription — the offline WhisperX replacement (fully local).

Usage:
  python3 transcribe_local.py <audio.mp3> [--known "known latin sentence"] [--lang hi] [--model small]

Emits JSON on stdout:
  { "duration": <sec>, "language": "hi",
    "heard":  [ {word,start,end}, ... ],     # what whisper actually heard (Devanagari)
    "words":  [ {word,start,end}, ... ] }     # caption words with REAL timings

If --known is given, the known Latin words are snapped onto whisper's real per-word
timings (correct spelling + real pacing). Otherwise the heard Devanagari words are
transliterated to Latin. Either way, timings come from the ACTUAL audio, never even-spacing.
"""
import sys, json, argparse, re

def to_latin(dev_words):
    try:
        from indic_transliteration import sanscript
        from indic_transliteration.sanscript import transliterate
        out = []
        for w in dev_words:
            if re.search(r"[\u0900-\u097F]", w):  # has Devanagari
                out.append(transliterate(w, sanscript.DEVANAGARI, sanscript.ITRANS).lower())
            else:
                out.append(w)  # already Latin/number
        return out
    except Exception:
        return dev_words

def snap_known(known_words, heard):
    """Map M known Latin words onto N heard real timings by proportional index.
    Exact 1:1 when counts match; graceful proportional drift when they differ."""
    n = len(heard); m = len(known_words)
    if n == 0 or m == 0:
        return []
    out = []
    for j, kw in enumerate(known_words):
        i = min(n - 1, int(round(j * (n - 1) / max(1, m - 1)))) if m > 1 else 0
        out.append({"word": kw, "start": heard[i]["start"], "end": heard[i]["end"]})
    # enforce monotonic non-overlapping timings
    for k in range(1, len(out)):
        if out[k]["start"] < out[k - 1]["end"]:
            out[k]["start"] = out[k - 1]["end"]
        if out[k]["end"] < out[k]["start"]:
            out[k]["end"] = out[k]["start"] + 0.15
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--known", default=None)
    ap.add_argument("--lang", default="hi")
    ap.add_argument("--model", default="small")
    a = ap.parse_args()

    from faster_whisper import WhisperModel
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(a.audio, language=a.lang, word_timestamps=True)
    heard = []
    for seg in segments:
        for w in (seg.words or []):
            heard.append({"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)})

    if a.known:
        known = [t for t in re.split(r"\s+", a.known.strip()) if t]
        words = snap_known(known, heard)
    else:
        latin = to_latin([h["word"] for h in heard])
        words = [{"word": latin[i], "start": heard[i]["start"], "end": heard[i]["end"]} for i in range(len(heard))]

    print(json.dumps({
        "duration": round(info.duration, 3),
        "language": info.language,
        "heard": heard,
        "words": words,
    }, ensure_ascii=False))

if __name__ == "__main__":
    main()
