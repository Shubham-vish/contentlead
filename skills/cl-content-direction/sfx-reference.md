# SFX Reference — 27 Core Sounds

All sounds are in `_Assets/sfx/core-set/`. AI should use key names, not filenames.
All sounds are loudness-normalized (`loudnorm I=-16, TP=-3 dB`).

---

## 🎯 Hero SFX (Use Frequently)

| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `digital_readout` | 1.0s | 20% | **STAR** — tech terms, stats, numbers, reveals, API names |
| `whoosh` | 2.2s | **50%** | Topic transitions, scene changes, slide switches |
| `pop` | 1.1s | 25% | Bullet points, list items, text appearing, callouts |
| `ding` | 3.0s | 20% | Success, correct, key points, achievements |

## 🖱️ Clicks & Typing

| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `mouse_click` | 0.9s | 20% | Clicking UI, selecting, button presses |
| `double_click` | 0.5s | 20% | Section starts, new topics, opening files |
| `keyboard` | 1.3s | 20% | Short typing bursts, entering text |
| `typing_loop` | 11.4s | **15%** | Extended code demos — **must clip to match length** |

## 🔀 Transitions & Movement

| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `whoosh` | 2.2s | **50%** | Standard transitions |
| `whoosh_deep` | 2.3s | **40%** | Heavy cinematic transitions |
| `swoosh_fast` | 0.6s | **35%** | Quick cuts, rapid list items |

## 💥 Impact & Emphasis

| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `air_hit` | 1.3s | 20% | Punchy intros, big reveals |
| `slap` | 0.9s | 20% | Reality checks, hard truths |

## 🔔 Notifications & Success

| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `ding` | 3.0s | 20% | Success, milestones |
| `chime` | 1.6s | 20% | Soft positive, checkmarks |
| `notification_bell` | 1.0s | 20% | Alerts, pings, announcements |

## 📸 Camera & Capture

| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `camera_shutter` | 0.4s | 20% | Screenshots, comparisons |
| `digital_shutter` | 1.5s | 20% | Screen captures, digital photos |

## 🎵 Build-ups & Risers

| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `riser_short` | 0.9s | 20% | Quick anticipation before reveals |
| `riser_long` | 5.2s | 20% | Dramatic build-ups — **clip from end (keep peak)** |

## ❌ Negative & Error

| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `error` | 1.7s | 20% | Error states, bugs, failures |
| `wrong_answer` | 1.5s | 20% | Wrong buzzer, anti-patterns |
| `record_scratch` | 1.0s | 25% | "Wait what?", plot twist |

## 🖥️ UI & Digital

| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `bubble` | 0.2s | 25% | Chat bubbles, tooltips, playful |
| `hacking` | 3.1s | **15%** | Terminal/CLI demos — **clip to match** |
| `data_beeps` | 6.1s | **15%** | Data loading, scanning — **clip to match** |
| `morph` | 2.0s | 20% | AI transformations, before→after |

## 🎭 Foley & Special

| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `chalk` | 0.9s | 20% | Diagrams, annotations, handwriting |
| `thug_life` | 10.5s | 20% | Meme/flex moments — **clip to 2-3s, max once** |

---

## Content-Type Pairing

| Content Type | Heavy Use | Moderate | Occasional |
|-------------|-----------|----------|------------|
| Tech tutorial | `digital_readout`, `keyboard`, `typing_loop` | `whoosh`, `ding`, `pop` | `air_hit`, `riser_short` |
| Product demo | `digital_readout`, `whoosh`, `pop`, `ding` | `camera_shutter`, `morph` | `riser_short`, `record_scratch` |
| Educational | `pop`, `ding`, `chime`, `digital_readout` | `whoosh`, `chalk`, `keyboard` | `error`, `wrong_answer` |
| Comparison/VS | `whoosh`, `air_hit`, `record_scratch` | `pop`, `wrong_answer` | `thug_life`, `riser_long` |

## Scene-Type → SFX Pairing

| Scene Type | Entry SFX | Accent SFX | Exit SFX |
|-----------|-----------|------------|----------|
| Title card | `riser_short` → `air_hit` | `digital_readout` | — |
| Camera/Video | `swoosh_fast` | — | `whoosh` |
| Ken Burns | `whoosh` (light) | — | — |
| Code/Terminal | `keyboard` | `typing_loop`, `hacking` | `ding` |
| Data/Chart | `riser_short` | `digital_readout` per point | `chime` |
| Text callout | `pop` | `digital_readout` | — |
| Comparison/VS | `whoosh` | `record_scratch` | `ding` |
| Screenshot | `camera_shutter` | `digital_readout` | — |
| Success/Result | `riser_short` → `ding` | `chime` | — |

## Placement Rules (Quick Reference)

1. **Gain levels**: Whoosh-type 35-50%, loops 15%, everything else 20-25%
2. **Clip long sounds**: 8 sounds are >2s — trim to fit
3. **Min 1.5s gap** between any two SFX
4. **digital_readout**: Min 7s gap, use 8-10 times per 60s
5. **Target 35-50 total** placements per 60s track
6. **Risers**: Place BEFORE the reveal, pair with `air_hit`/`ding` after
7. **Max uses**: `air_hit` (3-4), `thug_life` (1), `riser_long` (1-2)
8. **Every placement must be contextually accurate** — never pad

## File Locations

| Resource | Path |
|----------|------|
| Core set sounds | `_Assets/sfx/core-set/` |
| Core set manifest | `_Assets/sfx/core-set/core_sfx_manifest.json` |
| Core set guide | `_Assets/sfx/core-set/CORE_SFX_GUIDE.md` |
| Full library (81) | `_Assets/sfx/remotion-ready/` |
| Full library manifest | `_Assets/sfx/remotion-ready/sfx_manifest.json` |

For detailed transcript-based placement workflow, see `sfx-placement.md`.
