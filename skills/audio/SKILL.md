---
name: audio
description: Local audio processing recipes for the ContentLead workflow — vocal/music stem separation from any video or audio file, plus supporting downloads and encodes. All local, no cloud. Cross-platform (Mac + Windows + Linux).
tags: audio, stems, separation, vocals, instrumental, karaoke, demucs, ffmpeg, yt-dlp, source-separation
---

# Local Audio Processing

Offline recipes for extracting stems from any audio or video file. No API keys, no cloud, everything runs on the user's machine.

Current recipes:

- **Stem separation** — split any track into vocals + instrumental (or full 4-stem: drums / bass / vocals / other) using [Demucs](https://github.com/facebookresearch/demucs).
- **(Companion)** download an arbitrary Instagram / TikTok / YouTube / X reel to a local file before separating — see the `Download → separate` end-to-end below.

## Tool prerequisites

Three cross-platform CLI tools. Check them first — if any are missing, install per OS.

```bash
# Check
which ffmpeg && ffmpeg -version | head -1
which yt-dlp && yt-dlp --version
python3 -c "import demucs; print('demucs', demucs.__version__)"
```

### Install — macOS

```bash
brew install ffmpeg yt-dlp
python3 -m pip install --user 'demucs>=4.0'
```

### Install — Windows (PowerShell)

```powershell
winget install --id=Gyan.FFmpeg     # or: choco install ffmpeg
winget install --id=yt-dlp.yt-dlp   # or: pip install yt-dlp
py -m pip install --user "demucs>=4.0"
```

### Install — Linux (Debian/Ubuntu)

```bash
sudo apt install ffmpeg
python3 -m pip install --user yt-dlp 'demucs>=4.0'
```

**GPU acceleration (optional but ~7× faster):** demucs auto-uses CUDA on Windows/Linux with an Nvidia GPU, or MPS on Apple Silicon. On CPU a 3-minute song takes ~60s; on GPU ~5–8s. First run downloads the model (~80 MB) into the torch cache.

---

## Recipe 1 — Stem separation from a local audio/video file

Goal: given a `.mp3`, `.wav`, `.m4a`, `.mp4`, `.mov`, `.mkv`, or any ffmpeg-readable file, produce `vocals_only.wav` + `music_only.wav` (or 4 stems).

### Step 1. Convert to demucs-friendly PCM WAV

Demucs takes any format ffmpeg can read, but PCM 44.1 kHz stereo is the safe path (no re-encode artefacts, no sample-rate surprises). Skip this step if your input is already PCM WAV.

```bash
INPUT="/path/to/track.mp4"           # video or audio, any format
WORK="./audio_full.wav"

ffmpeg -y -i "$INPUT" \
  -vn -acodec pcm_s16le -ar 44100 -ac 2 \
  "$WORK"
```

Flags:
- `-vn` — drop video (if input is a video file)
- `-acodec pcm_s16le` — 16-bit PCM
- `-ar 44100` — 44.1 kHz sample rate (demucs default)
- `-ac 2` — stereo

### Step 2. Run demucs

**Two-stem mode (vocals + instrumental) — recommended default:**

```bash
python3 -m demucs.separate \
  --two-stems=vocals \
  -n htdemucs \
  -o separated \
  "$WORK"
```

Outputs land at:
```
separated/htdemucs/audio_full/vocals.wav
separated/htdemucs/audio_full/no_vocals.wav
```

**Full 4-stem mode:**

```bash
python3 -m demucs.separate -n htdemucs -o separated "$WORK"
```

Outputs:
```
separated/htdemucs/audio_full/vocals.wav
separated/htdemucs/audio_full/drums.wav
separated/htdemucs/audio_full/bass.wav
separated/htdemucs/audio_full/other.wav
```

**Model choices** (all download automatically on first use):

| `-n` value | Speed | Quality | When |
|---|---|---|---|
| `htdemucs` *(default)* | Medium | Best overall | Default. Hybrid Transformer, current SOTA. |
| `htdemucs_ft` | Slow (4× slower) | Best (fine-tuned per stem) | When quality matters more than time. |
| `mdx_extra_q` | Fast | Slightly worse than htdemucs | Faster iteration, longer files. |
| `htdemucs_6s` | Medium | Adds guitar + piano stems | 6-stem mode only. |

### Step 3. Flatten + encode (optional but tidier)

Move stems out of the nested `separated/<model>/<track>/` layout and produce compact `.m4a` versions for quick listening.

```bash
OUT="./stems"
mkdir -p "$OUT"
mv separated/htdemucs/audio_full/vocals.wav     "$OUT/vocals_only.wav"
mv separated/htdemucs/audio_full/no_vocals.wav  "$OUT/music_only.wav"
rm -rf separated

# Compact AAC (~700 KB / min at 192k)
ffmpeg -y -i "$OUT/vocals_only.wav" -c:a aac -b:a 192k "$OUT/vocals_only.m4a"
ffmpeg -y -i "$OUT/music_only.wav"  -c:a aac -b:a 192k "$OUT/music_only.m4a"
```

### Step 4. Sanity-check the stems

Loudness + duration must be sensible. If either stem is `-inf dB` or way shorter than the source, something went wrong.

```bash
for f in "$OUT"/*.wav; do
  RMS=$(ffmpeg -hide_banner -nostats -i "$f" -filter:a "volumedetect" -f null /dev/null 2>&1 \
          | awk -F': ' '/mean_volume/{print $2}')
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  printf "%-20s RMS=%s  dur=%ss\n" "$(basename $f)" "$RMS" "$DUR"
done
```

Expected: both files match source duration (±1s), RMS between `-30` and `-10` dB. Talking-heavy sources will show a much quieter `music_only` (that's the source, not a bug).

---

## Recipe 2 — Download from social → separate (end-to-end)

Full flow for "here's a reel URL, give me its vocals and music". This is exactly what powered the earlier `~/Downloads/reels/DbtsuVAt8O1/` job.

```bash
URL="https://www.instagram.com/reel/<SHORTCODE>/"
SHORT=$(echo "$URL" | sed -E 's|.*/reel/([^/?]+).*|\1|')
FOLDER=~/Downloads/reels/$SHORT
mkdir -p "$FOLDER"
cd "$FOLDER"

# 1. Download (IG/TikTok/Twitter usually need auth cookies from a browser)
yt-dlp \
  --cookies-from-browser chrome \
  --no-mtime \
  -o "original.%(ext)s" \
  "$URL"

# 2. Extract full audio
ffmpeg -y -i original.mp4 -vn -acodec pcm_s16le -ar 44100 -ac 2 audio_full.wav

# 3. Separate
python3 -m demucs.separate --two-stems=vocals -n htdemucs -o separated audio_full.wav

# 4. Flatten
mv separated/htdemucs/audio_full/vocals.wav    vocals_only.wav
mv separated/htdemucs/audio_full/no_vocals.wav music_only.wav
rm -rf separated

# 5. Compact m4a for previews
ffmpeg -y -i vocals_only.wav -c:a aac -b:a 192k vocals_only.m4a
ffmpeg -y -i music_only.wav  -c:a aac -b:a 192k music_only.m4a

ls -lah
```

### Cookies flag per browser (yt-dlp accepts these names)

`chrome`, `chromium`, `edge`, `brave`, `arc`, `firefox`, `opera`, `safari`, `vivaldi`, `whale`. Same string works on every OS — yt-dlp knows where each browser stores its cookie jar. If the user is logged in there, downloads that require auth (IG reels, most TikTok, X) just work.

### Non-social sources

For a plain URL (`https://example.com/track.mp3`) or a public YouTube video, skip `--cookies-from-browser`:

```bash
yt-dlp -o "original.%(ext)s" "$URL"
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Instagram sent an empty media response` | IG requires auth for that reel | Add `--cookies-from-browser chrome` (or whichever browser the user is logged into IG in). |
| `torch.OutOfMemoryError` on GPU | Model + long file exceeded VRAM | Add `--segment 8` (splits into 8-second chunks) or force CPU with `-d cpu`. |
| Output is 0 bytes / demucs exits silently | Input format demucs can't read | Do the ffmpeg PCM conversion in Step 1 first. Never feed demucs `.webm` or DRM-encumbered files directly. |
| `music_only.wav` sounds mostly silent | Source is talking-heavy with minimal background music | Not a bug — source material. Confirm by checking the full audio; if there's no music there, there can't be any in the stem. |
| `vocals_only.wav` has bleeding music/ambience | Song has heavy processing (autotune extreme, layered vocals, sound effects hitting the vocal range) | Try `-n htdemucs_ft` (fine-tuned, slower, cleaner). Or accept — no separator is perfect for adversarial sources. |
| Windows: `demucs: command not found` when calling as `demucs` | Not on PATH after `pip install --user` | Use `python -m demucs.separate` (always works), or add `%APPDATA%\Python\PythonXX\Scripts` to PATH. |
| Long files take forever on CPU | Real | Use GPU if available (`-d cuda` on Nvidia, `-d mps` on Apple Silicon). CPU on Mac still runs at ~2× realtime, so a 3-min song = ~90s. |

---

## When to use this skill vs alternatives

| Use case | Tool |
|---|---|
| Isolate vocals from a music track (karaoke, remix) | This skill — 2-stem `htdemucs` |
| Split a talking-head reel into speech + background music | This skill — 2-stem `htdemucs` |
| Full remix (drums/bass/vocals/other separate) | This skill — 4-stem `htdemucs` |
| Just extract audio from a video | `ffmpeg -vn` — no demucs needed |
| Transcribe speech to text | `ai-media` skill → `/api/bridge/ai/transcribe` (Whisper) — no separation needed |
| Remove background *noise* (not music) from a mic recording | Different tool — try `rnnoise` or a dedicated denoiser. Demucs is not a denoiser. |
| Isolate a specific speaker from a group conversation | Different problem (speaker diarization). Try `pyannote-audio`. |

---

## Design note — why this is a skill, not a desktop app command

Right now, stem separation is a rare, on-demand power-user task. Bundling Python + Torch + demucs into the SkillTown Desktop app would cost:

- ~250 MB installer bloat
- Mac notarization pain for PyTorch binaries
- Windows: CUDA-vs-CPU packaging branches

If separation becomes a repeated user workflow (right-click any audio/video item → "Separate stems"), the honest next step is to add a `media.separateStems` API-server command mirroring `media.removeBackgroundImage` — either shelling out to a locally installed demucs (this skill's install steps) or calling a cloud endpoint (Replicate hosts htdemucs at ~$0.002/song, ~2s response). Until then, this skill covers the capability with zero desktop-app changes.

---

## Cross-references

- `content-inspiration/social-scraping.md` — the front half of Recipe 2 (downloading reels via the SkillTown Desktop bridge). Prefer the bridge when the user is already signed in via the desktop app; use `yt-dlp --cookies-from-browser` as a fallback.
- `ai-media/SKILL.md` — `/api/bridge/ai/transcribe` if you want text instead of audio.
- `voice/SKILL.md` — voice cloning + TTS. Complementary — you can clone a voice from a `vocals_only.wav` produced here.
