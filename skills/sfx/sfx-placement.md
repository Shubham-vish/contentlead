---
name: sfx-placement
description: "How to analyze content and place SFX from the core-set library. Covers transcript-based placement, scene-type pairing, gain/volume rules, clipping long sounds, and building the final SFX track."
tags: sfx, sound-effects, placement, core-set, editing, audio, whoosh, transition, digital-readout
---

# SFX Placement Skill

Place sound effects intelligently on any video content using the **core-set** (27 keyed sounds).

## SFX Library Locations

| Library | Path | Sounds | Use |
|---------|------|--------|-----|
| **Core Set** (primary) | `_Assets/sfx/core-set/` | 27 keyed sounds | AI default — one best sound per role |
| **Full Library** (fallback) | `_Assets/sfx/remotion-ready/` | 81 sounds in 12 categories | When you need variety or niche sounds |
| **Manifest** | `core-set/core_sfx_manifest.json` | ML analysis per sound | Waveform, spectral, clip guidance |

> **Regenerate manifests anytime:** `python _Assets/sfx/_analysis/generate_manifest.py <folder>`

---

## Core Set — 27 Keys

### 🎯 Hero SFX (Use Frequently)
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `digital_readout` | 1.0s | 20% | **STAR** — tech terms, stats, numbers, reveals, API names |
| `whoosh` | 2.2s | **50%** | Topic transitions, scene changes, slide switches |
| `pop` | 1.1s | 25% | Bullet points, list items, text appearing, callouts |
| `ding` | 3.0s | **12%** | Success, correct, key points, achievements |

### 🖱️ Clicks & Typing
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `mouse_click` | 0.9s | 20% | Click, select, button press |
| `double_click` | 0.5s | 20% | Section starts, opening files |
| `keyboard` | 1.3s | 20% | Short typing bursts |
| `typing_loop` | 11.4s | **15%** | Extended code demos — **clip to match length** |

### 🔀 Transitions
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `whoosh` | 2.2s | **50%** | Standard transitions |
| `whoosh_deep` | 2.3s | **40%** | Deep cinematic, heavy topic shifts |
| `swoosh_fast` | 0.6s | **35%** | Quick cuts, rapid list items |

### 💥 Impact & Emphasis
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `air_hit` | 1.3s | 20% | Punchy intros, big reveals, action verbs |
| `slap` | 0.9s | 20% | Reality check, hard truth |

### 🔔 Notifications & Success
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `ding` | 3.0s | **12%** | Success, milestones |
| `chime` | 1.6s | 20% | Soft positive, checkmarks |
| `notification_bell` | 1.0s | 20% | Tool mentions, alerts |

### 📸 Camera & Capture
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `camera_shutter` | 0.4s | 20% | Screenshots, results |
| `digital_shutter` | 1.5s | 20% | Screen captures, recording |

### 🎵 Risers
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `riser_short` | 0.9s | 20% | Quick pre-reveal |
| `riser_long` | 5.2s | 20% | Long build-ups — **clip from end** |

### ❌ Negative & Error
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `error` | 1.7s | 20% | Errors, bugs, failures |
| `wrong_answer` | 1.5s | 20% | Wrong buzzer, anti-patterns |
| `record_scratch` | 1.0s | 25% | "Wait what?", plot twist |

### 🖥️ UI & Digital
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `bubble` | 0.2s | 25% | Chat bubbles, tooltips, popups |
| `hacking` | 3.1s | **15%** | Terminal demos — **clip to match** |
| `data_beeps` | 6.1s | **15%** | Loading, processing — **clip to match** |
| `morph` | 2.0s | 20% | AI transformation, automation |

### 🎭 Foley & Special
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `chalk` | 0.9s | 20% | Drawing diagrams, annotations |
| `thug_life` | 10.5s | 20% | Meme flex — **clip to 2-3s** |

---

## Placement Workflow

### Step 1: Analyze the Content

**For video with audio** — extract and transcribe:
```bash
# Extract audio
ffmpeg -i <video> -vn -acodec pcm_s16le -ar 16000 -ac 1 /tmp/sfx_audio.wav -y

# Transcribe with word-level timestamps (Whisper)
python -c "
import whisper, json
model = whisper.load_model('base')
result = model.transcribe('/tmp/sfx_audio.wav', word_timestamps=True, language='en')
words = []
for seg in result['segments']:
    for w in seg.get('words', []):
        words.append({'word': w['word'].strip(), 'start': round(w['start'], 3), 'end': round(w['end'], 3)})
for w in words:
    print(f'{w[\"start\"]:7.3f}s  {w[\"word\"]}')
"
```

**For text/script only** — work from the script with estimated timings.

**For scene-based editing** — use scene types (see Scene Pairing below).

### Step 2: Map SFX to Content Moments

Read the transcript and assign SFX keys to specific timestamps. Think about **what's happening** at each moment:

| Content Moment | SFX Key | Why |
|----------------|---------|-----|
| "Let me show you this API..." | `digital_readout` | Tech term mention |
| *Scene transitions to new topic* | `whoosh` | Topic change |
| "Click on settings..." | `mouse_click` | UI action described |
| *Code appears on screen* | `keyboard` or `typing_loop` | Code/typing visual |
| "And the result is..." | `riser_short` → `ding` | Build-up → success reveal |
| "DON'T do this..." | `wrong_answer` or `error` | Negative emphasis |
| *Screenshot shown* | `camera_shutter` | Visual capture |
| "Wait, actually..." | `record_scratch` | Interruption/correction |
| *Bullet points appear* | `pop` (per bullet) | Sequential items |
| *Terminal running* | `hacking` | CLI demo |
| "Check out this tool" | `notification_bell` | Tool/product mention |

### Step 3: Apply Placement Rules

1. **Min 1.5s gap** between any two SFX
2. **digital_readout: min 7s gap** — space evenly, use 8-10 times per 60s track
3. **Target 35-50 total** placements per 60s (contextual + digital_readouts)
4. **Max uses per track:** air_hit (3-4), thug_life (1), riser_long (1-2)
5. **Every placement must be contextually accurate** — never pad with random SFX

### Step 4: Clip Long Sounds

8 sounds are >2s and **must be clipped** to fit:

| Key | Full | How to Clip |
|-----|------|-------------|
| `typing_loop` | 11.4s | Any segment — uniform. Match code demo length |
| `thug_life` | 10.5s | First 2-3s only (recognizable intro) |
| `data_beeps` | 6.1s | Any segment — repetitive. Match loading duration |
| `riser_long` | 5.2s | **Use last N seconds** — always end at file end (peak) |
| `hacking` | 3.1s | Any segment — continuous digital. Match terminal demo |
| `ding` | 3.0s | First 1s for punchy, full 3s for dramatic |
| `whoosh_deep` | 2.3s | Peak at 0.12-0.82s. Clip to ~1s |
| `whoosh` | 2.2s | Peak at 0.55-1.09s. Clip to ~1s |

**How to clip precisely:** Use `onset_times_s` from the manifest as cut points (cutting at onsets = no click artifacts).

### Step 5: Apply Gain

> **Normalization:** All core-set SFX are loudness-normalized (`loudnorm I=-16, TP=-3 dB`).
> Peak levels are within ~5 dB of each other, so the gain percentages below produce
> consistent perceived volume across all files. Originals are backed up in `_originals/`.

```
Whoosh-type transitions:  35-50% gain (louder — they're brief)
Loop sounds (typing, hacking, data_beeps):  15% gain (quieter — they play longer)
Ding, record_scratch, wrong_answer:  12-15% gain (inherently resonant — need less)
Everything else:  20-25% gain
```

Convert to dB: `dB = 20 × log10(gain_percent / 100)`
- 50% = -6.0 dB
- 25% = -12.0 dB
- 20% = -14.0 dB
- 15% = -16.5 dB
- 12% = -18.4 dB

---

## Scene-Type Pairing (for timeline editors)

When editing scene-by-scene rather than transcript-based:

| Scene Type | Entry SFX | Accent SFX | Exit SFX |
|-----------|-----------|------------|----------|
| Title card / Intro | `riser_short` → `air_hit` | `digital_readout` | — |
| Camera/Video scene | `swoosh_fast` | — | `whoosh` |
| Photo / Ken Burns | `whoosh` (light) | — | — |
| Code / Terminal | `keyboard` | `typing_loop`, `hacking` | `ding` |
| Data / Chart reveal | `riser_short` | `digital_readout` per point | `chime` |
| Text callout | `pop` | `digital_readout` | — |
| Comparison / VS | `whoosh` | `record_scratch` or `wrong_answer` | `ding` |
| Screenshot reveal | `camera_shutter` | `digital_readout` | — |
| Error / Warning | `error` or `wrong_answer` | — | — |
| Success / Result | `riser_short` → `ding` | `chime` | — |
| Meme / Flex moment | — | `thug_life` (2-3s clip) | — |
| AI / Automation | `morph` | `data_beeps` | `ding` |

### Volume by Audio Layer

| Layer | Volume | Notes |
|-------|--------|-------|
| Voiceover | 80-100% | Primary — never compete |
| Background music | 15-30% | Subtle bed |
| Transition SFX | 35-50% | Brief, punchy |
| Accent SFX | 20-25% | Clear but not jarring |
| Loop SFX | 15% | Background texture |

---

## Content-Type Profiles

### Tech Tutorial / Code Walkthrough
**Heavy:** `digital_readout`, `keyboard`, `typing_loop`, `hacking`, `mouse_click`, `camera_shutter`
**Moderate:** `whoosh`, `ding`, `pop`, `data_beeps`
**Occasional:** `air_hit`, `riser_short`, `error`

### AI Tool Review / Product Demo
**Heavy:** `digital_readout`, `whoosh`, `pop`, `ding`, `notification_bell`
**Moderate:** `camera_shutter`, `air_hit`, `morph`
**Occasional:** `riser_short`, `record_scratch`

### Educational / Course Content
**Heavy:** `pop`, `ding`, `chime`, `digital_readout`
**Moderate:** `whoosh`, `camera_shutter`, `chalk`, `keyboard`
**Occasional:** `error`, `wrong_answer`, `record_scratch`

### Comparison / VS Content
**Heavy:** `whoosh`, `air_hit`, `record_scratch`, `ding`
**Moderate:** `pop`, `wrong_answer`, `camera_shutter`
**Occasional:** `thug_life`, `slap`, `riser_long`

---

## Building an SFX WAV Track (Standalone)

For producing a single SFX track file (drag into Descript/editor):

```python
from pydub import AudioSegment
import math

CORE_SET_DIR = "_Assets/sfx/core-set"

def load_sfx(key, max_ms=1000):
    """Load SFX, normalize, trim."""
    sfx = AudioSegment.from_file(f"{CORE_SET_DIR}/{FILENAME_MAP[key]}")
    if len(sfx) > max_ms:
        sfx = sfx[:max_ms]
    peak_norm = -sfx.max_dBFS
    sfx = sfx.apply_gain(peak_norm)
    gain_db = 20 * math.log10(GAIN_MAP[key])
    return sfx.apply_gain(gain_db)

def build_track(events, duration_ms):
    """Build silent track with SFX overlaid at timestamps."""
    track = AudioSegment.silent(duration=duration_ms)
    for ts_ms, key in events:
        sfx = load_sfx(key)
        track = track.overlay(sfx, position=ts_ms)
    return track

# Example usage
events = [
    (500, "whoosh"),
    (3200, "digital_readout"),
    (5800, "keyboard"),
    (8100, "pop"),
    (10500, "digital_readout"),
    # ... 35-50 events total
]
track = build_track(events, duration_ms=60000)
track.export("My Video - SFX Track.wav", format="wav")
```

---

## Fallback to Full Library

When core-set doesn't have the right character:
1. Check `remotion-ready/sfx_manifest.json` — 81 sounds with full ML analysis
2. Search by `tags`, `mood`, `energy`, `brightness` fields
3. Use `mfcc_13` for similarity comparison (cosine distance between MFCC vectors)
4. Multiple variants available: 12 whooshes, 11 pops, 16 clicks, 9 notifications
