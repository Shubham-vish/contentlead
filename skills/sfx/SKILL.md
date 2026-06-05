---
name: sfx
description: Complete sound effects workflow for ContentLead — core library (27 keyed sounds), cloud search (1000+ via PrepWithAI), placement strategy, volume/gain rules, scene-type pairing, and batch SFX workflows. Use when adding SFX to videos, searching for sounds, or planning audio design.
tags: sfx, sound-effects, audio, prepwithai, core-set, placement, whoosh, transition, impact, mood, energy, volume
---

# SFX — Sound Effects for ContentLead

Complete workflow for finding, placing, and mixing sound effects in the ContentLead video editor.

## Two SFX Libraries

| Library | Sounds | Access | Best For |
|---------|--------|--------|----------|
| **Core Set** (local) | 27 keyed sounds | `_Assets/sfx/core-set/` | Standard editing — fast, no network, one best sound per role |
| **PrepWithAI Cloud** | 1000+ sounds | `prepwithai_sfx_search()` MCP tool | Variety, niche sounds, mood/energy filtering |

**Decision tree:**
```
Need SFX → Is it in core-set? (27 keyed sounds)
  YES → Use core-set (fast, no download needed)
  NO  → Search PrepWithAI cloud → Download → Add to timeline
```

---

## Core Set — 27 Keyed Sounds

Each key maps to exactly one sound. AI should use keys, not filenames.

### 🎯 Hero SFX (Use Frequently)
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `digital_readout` | 1.0s | 20% | **STAR** — tech terms, stats, numbers, reveals, API names |
| `whoosh` | 2.2s | **50%** | Topic transitions, scene changes, slide switches |
| `pop` | 1.1s | 25% | Bullet points, list items, text appearing, callouts |
| `ding` | 3.0s | 20% | Success, correct, key points, achievements |

### 🖱️ Clicks & Typing
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `mouse_click` | 0.9s | 20% | Clicking UI, selecting, button presses |
| `double_click` | 0.5s | 20% | Section starts, new topics, opening files |
| `keyboard` | 1.3s | 20% | Short typing bursts, entering text |
| `typing_loop` | 11.4s | **15%** | Extended code demos — **must clip** |

### 🔀 Transitions & Movement
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `whoosh` | 2.2s | **50%** | Standard transitions |
| `whoosh_deep` | 2.3s | **40%** | Heavy cinematic transitions |
| `swoosh_fast` | 0.6s | **35%** | Quick cuts, rapid list items |

### 💥 Impact & Emphasis
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `air_hit` | 1.3s | 20% | Punchy intros, big reveals |
| `slap` | 0.9s | 20% | Reality checks, hard truths |

### 🔔 Notifications & Success
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `ding` | 3.0s | 20% | Success, milestones |
| `chime` | 1.6s | 20% | Soft positive, checkmarks |
| `notification_bell` | 1.0s | 20% | Alerts, pings, announcements |

### 📸 Camera & Capture
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `camera_shutter` | 0.4s | 20% | Screenshots, comparisons |
| `digital_shutter` | 1.5s | 20% | Screen captures, digital photos |

### 🎵 Build-ups & Risers
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `riser_short` | 0.9s | 20% | Quick anticipation before reveals |
| `riser_long` | 5.2s | 20% | Dramatic build-ups — **clip from end** |

### ❌ Negative & Error
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `error` | 1.7s | 20% | Error states, bugs, failures |
| `wrong_answer` | 1.5s | 20% | Wrong buzzer, anti-patterns |
| `record_scratch` | 1.0s | 25% | "Wait what?", plot twist |

### 🖥️ UI & Digital
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `bubble` | 0.2s | 25% | Chat bubbles, tooltips, playful |
| `hacking` | 3.1s | **15%** | Terminal/CLI demos — **clip** |
| `data_beeps` | 6.1s | **15%** | Data loading, scanning — **clip** |
| `morph` | 2.0s | 20% | AI transformations, before→after |

### 🎭 Foley & Special
| Key | Duration | Gain | Use For |
|-----|----------|------|---------|
| `chalk` | 0.9s | 20% | Diagrams, annotations, handwriting |
| `thug_life` | 10.5s | 20% | Meme/flex moments — **clip to 2-3s, max once** |

---

## PrepWithAI Cloud Search

When core-set doesn't have what you need:

```python
# Semantic search
prepwithai_sfx_search(query="dramatic cinematic boom", top_k=5)
# → {name, description, score, category, duration, blob_path, tags}

# Filter by category, mood, energy, duration
prepwithai_sfx_search(query="whoosh", category="Transitions", energy="high", max_duration=2.0)

# List all categories
prepwithai_sfx_categories()
```

### Cloud Categories
| Category | Use For |
|----------|---------|
| Camera | Screenshot reveals, before/after |
| Comedy | Fun content, meme moments |
| Foley | Realistic ambience, scene-setting |
| Hits | Transitions, big reveals, emphasis |
| Mechanical | Tech/engineering, robot themes |
| Music | Intro/outro stings, achievements |
| Notifications | UI reveals, success, milestones |
| Playful | Kids content, casual explainers |
| Pops | Text reveals, list items |
| Risers | Building anticipation |
| Transitions | Scene changes, topic shifts |
| Typing | Code/terminal scenes |
| UI | Interface demos, button presses |
| Whooshes | Slide transitions, fast movements |

### Search Strategies

```python
# By mood
prepwithai_sfx_search(query="gentle ambient", energy="low", mood="calm")
prepwithai_sfx_search(query="epic impact", energy="high", mood="dramatic")

# By use case
prepwithai_sfx_search(query="mechanical keyboard", category="Typing", max_duration=3.0)
prepwithai_sfx_search(query="modern UI click", category="UI", energy="medium")

# Get variations (e.g., 5 different pops for a list)
prepwithai_sfx_search(query="pop bubble snap", category="Pops", top_k=10)
```

### Download & Add

```bash
# Download
curl -sL "https://prepwithai.blob.core.windows.net/sfx/{blob_path}" -o ~/Downloads/sound.mp3

# Add to timeline
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type": "editor.addAudio", "params": {
    "src": "/path/to/sound.mp3", "name": "Boom", "from": 5000, "duration": 1500, "volume": 40
  }}'
```

---

## Placement Strategy

### Transcript-Based Placement

Analyze content to decide where SFX go:

1. **Read transcript** — `{"type": "query.getTranscriptState", "params": {}}`
2. **Identify moments** — tech terms → `digital_readout`, transitions → `whoosh`, reveals → `riser` + `air_hit`
3. **Place SFX** with proper timing and gain
4. **Check spacing** — min 1.5s gap between any two SFX

### Content-Type Pairing

| Content Type | Heavy Use | Moderate | Occasional |
|-------------|-----------|----------|------------|
| Tech tutorial | `digital_readout`, `keyboard`, `typing_loop` | `whoosh`, `ding`, `pop` | `air_hit`, `riser_short` |
| Product demo | `digital_readout`, `whoosh`, `pop`, `ding` | `camera_shutter`, `morph` | `riser_short`, `record_scratch` |
| Educational | `pop`, `ding`, `chime`, `digital_readout` | `whoosh`, `chalk`, `keyboard` | `error`, `wrong_answer` |
| Comparison/VS | `whoosh`, `air_hit`, `record_scratch` | `pop`, `wrong_answer` | `thug_life`, `riser_long` |

### Scene-Type → SFX Pairing (Remotion scenes)

| Scene Type | Entry SFX | Accent SFX | Exit SFX |
|-----------|-----------|------------|----------|
| Title card | Riser (v:0.25) + Hit (v:0.45) | UI interface (v:0.3) | — |
| Camera/Video | Swoosh (v:0.3) | Swipe on pan (v:0.3) | Whoosh (v:0.25) |
| Ken Burns | Airy whoosh (v:0.2) | — | — |
| Bar/Chart | Riser (v:0.15) | UI bleep per bar (v:0.3) | Notification (v:0.4) |
| Counter/Stat | Riser (v:0.2) | Hit on number (v:0.4) | UI interface (v:0.35) |
| Highlight | Cinematic whoosh (v:0.35) | UI per word | Hit on last word (v:0.4) |
| Light Leaks | Airy whoosh (v:0.2) | — | — |

---

## Rules

1. **Gain levels**: Whoosh-type 35-50%, loops 15%, everything else 20-25%
2. **Clip long sounds**: 8 core-set sounds >2s — must trim to fit the moment
3. **Min 1.5s gap** between any two SFX placements
4. **digital_readout**: Min 7s gap between uses, use 8-10 times per 60s track
5. **Target 35-50 total** placements per 60s track
6. **Risers**: Place BEFORE the reveal, not on it. Pair with `air_hit`/`ding` after
7. **Max uses**: `air_hit` (3-4), `thug_life` (1), `riser_long` (1-2)
8. **Clipping**: Use `onset_times_s` from `core_sfx_manifest.json` for clean cuts
9. **Every placement must be contextually accurate** — never add for padding

### Clipping Long Sounds

| Key | Full Duration | How to Clip |
|-----|---------------|-------------|
| `typing_loop` | 11.4s | Uniform — clip any segment |
| `thug_life` | 10.5s | First 2-3s only. Max once |
| `data_beeps` | 6.1s | Any segment to match loading |
| `riser_long` | 5.2s | **Always keep END** (peak). Trim from start |
| `hacking` | 3.1s | Any segment to match terminal |
| `ding` | 3.0s | 1s for punchy, full for dramatic |
| `whoosh_deep` | 2.3s | Clip to ~1s (peak at 0.12-0.82s) |
| `whoosh` | 2.2s | Clip to ~1s (peak at 0.55-1.09s) |

---

## Volume Guidelines

| Audio Type | Volume | Notes |
|-----------|--------|-------|
| Voiceover/narration | 80–100 | Primary audio |
| Background music | 15–30 | Never competing |
| Transition SFX | 30–50 | Brief, punchy |
| Impact/hit SFX | 35–50 | One-shot emphasis |
| UI/notification SFX | 25–40 | Clear but not jarring |
| Riser/build-up | 15–25 | Background tension |
| Ambient/atmosphere | 10–20 | Subtle |

---

## Batch SFX Workflow

For adding many SFX at once:

```bash
# Use POST /api/batch
curl -X POST http://127.0.0.1:$PORT/api/batch \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"type": "editor.addAudio", "params": {"src": "/path/whoosh.wav", "from": 0, "duration": 1000, "volume": 40, "name": "Whoosh"}},
      {"type": "editor.addAudio", "params": {"src": "/path/pop.mp3", "from": 3000, "duration": 800, "volume": 35, "name": "Pop"}},
      {"type": "editor.addAudio", "params": {"src": "/path/digital_readout.wav", "from": 7000, "duration": 1000, "volume": 20, "name": "Digital"}}
    ]
  }'
```

---

## File Locations

| Resource | Path |
|----------|------|
| Core set sounds | `_Assets/sfx/core-set/` |
| Core set manifest | `_Assets/sfx/core-set/core_sfx_manifest.json` |
| Core set guide | `_Assets/sfx/core-set/CORE_SFX_GUIDE.md` |
| Full library (81) | `_Assets/sfx/remotion-ready/` |
| Full library manifest | `_Assets/sfx/remotion-ready/sfx_manifest.json` |
| Manifest generator | `_Assets/sfx/_analysis/generate_manifest.py` |
| SFX suggest pipeline | `_Pipelines/sfx_suggest.py` |
| Auto SFX pipeline | `_Pipelines/auto_sfx.py` |

---

## Related Skills

- **`sfx-placement`** — Detailed transcript-based placement workflow
- **`prepwithai-sfx-search`** — Detailed PrepWithAI cloud search API reference
- **`remotion/rules/sfx-and-audio`** — SFX pairing for Remotion scenes, voiceover workflow
- **`media-and-audio`** — General audio commands (add, volume, speed, opacity)
