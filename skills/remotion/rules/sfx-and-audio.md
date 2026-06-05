---
name: sfx-and-audio
description: Sound effects acquisition, placement, and audio workflow for SkillTown Desktop
tags: sfx, audio, sound-effects, whoosh, transition-sound, voiceover, volume
---

# SFX & Audio Workflow

SkillTown Desktop does NOT have a local SFX library. Instead, use **PrepWithAI MCP tools** to search, discover, and download sound effects, then add them to the timeline.

## SFX Acquisition Workflow

### 1. Search for SFX

```bash
# Via PrepWithAI MCP tool
prepwithai_sfx_search(query="dramatic cinematic boom", top_k=5)
# Returns: name, description, score, category, duration, blob_path, tags

# Filter by category, mood, energy
prepwithai_sfx_search(query="whoosh", category="Transitions", energy="high", max_duration=2.0)

# List all categories
prepwithai_sfx_categories()
```

### 2. Download Locally

```bash
# Download the SFX file to an allowed directory
curl -sL "<blob_url>" -o ~/Downloads/boom.mp3
```

### 3. Add to Timeline

```json
{ "type": "editor.addAudio", "params": {
  "src": "/Users/.../Downloads/boom.mp3",
  "name": "Boom SFX",
  "from": 5000,
  "duration": 1500
}}
```

### 4. Adjust Volume

```json
{ "type": "editor.editItem", "params": {
  "itemId": "sfx_item_id",
  "volume": 40
}}
```

## SFX Categories (via PrepWithAI)

| Category | Examples | Use For |
|----------|---------|---------|
| Camera | Shutter clicks, photo sounds | Screenshot reveals |
| Comedy | Cartoon sounds, laugh tracks | Fun/casual content |
| Foley | Footsteps, fabric, environment | Realistic ambience |
| Hits | Impact, punch, slam, boom | Scene transitions, emphasis |
| Mechanical | Gears, levers, machines | Tech/engineering content |
| Music | Short music stings | Intro/outro accents |
| Notifications | Dings, alerts, chimes | UI reveal moments |
| Playful | Bouncy, fun, whimsical | Kids/casual content |
| Pops | Bubble pops, cork pops | Text reveals, list items |
| Risers | Tension builders, crescendos | Building anticipation |
| Transitions | Whooshes, swells, sweeps | Scene transitions |
| Typing | Keyboard clicks, mechanical | Code/terminal scenes |
| UI | Click, toggle, switch sounds | Interface demonstrations |
| Whooshes | Fast motion, swoosh effects | Slide transitions |

## Scene-Type → SFX Pairing Logic

The logic behind SFX pairing is based on **energy matching** and **temporal placement**. Each scene has 3 SFX slots: entry, accent, and exit. The rules:

1. **Entry SFX** — Matches the scene's entrance energy. Gentle scenes (Ken Burns) get airy whooshes. Dramatic scenes (title cards) get risers → hits.
2. **Accent SFX** — Placed at key content moments (data point appears, word highlights, camera shifts). Should match the visual action.
3. **Exit SFX** — Usually a whoosh or nothing. Only add if the scene has an exit animation.
4. **Frame timing** — Entry SFX at frame 0-15. Accent SFX at the key visual moment. Exit SFX at negative offset from end (e.g., frame -15 = 15 frames before scene end).
5. **Volume scaling** — Risers: 0.15-0.25 (background build). Hits: 0.4-0.5 (impact). UI sounds: 0.3-0.4 (subtle). Pops: 0.5-0.6 (punchy).

### Detailed Pairing Table (from remotion-projects `sfx_suggest.py`)

| Scene Type | Entry SFX | Accent SFX | Exit SFX | Logic |
|-----------|-----------|------------|----------|-------|
| Title card / Intro | Riser (f:0, v:0.25) + Hit (f:15, v:0.45) | UI interface (f:20, v:0.3) | — | Build tension → impact on reveal → tech accent |
| Camera/Video scene | Swoosh (f:15, v:0.3) | Swipe (f:90, v:0.3) on pan | Whoosh (f:-15, v:0.25) | Match camera perspective shifts |
| Ken Burns (photo) | Airy whoosh (f:5, v:0.2) | — | — | Gentle — match the slow zoom energy |
| Picture-in-Picture | Pop (on enterFrame, v:0.6) | UI select (+3f, v:0.35) | — | Pop = visual appearance of PIP window |
| Bar/Donut Chart | Riser (f:0, v:0.15) | UI bleep per bar (f:20, v:0.3) | Notification (f:80, v:0.4) | Build → tick per data point → completion chime |
| Counter/Stat Reveal | Riser (f:0, v:0.2) | Hit on number impact (f:25, v:0.4) | UI interface (f:50, v:0.35) | Build → dramatic number → label reveal |
| Text Callout | UI popup (f:10, v:0.4) | UI alert (f:40, v:0.35) | — | Each callout gets its own sound |
| Highlight/Marker | Cinematic whoosh (f:0, v:0.35) | UI interface on first highlight | Hit on last word (v:0.4) | 3D entrance → word ticks → final impact |
| Noise Shake | Hit on zoomPulse frame (v:0.5) | Boom (+35f, v:0.4) | — | Double-hit matches the visual shake |
| Motion Blur | Riser (f:5, v:0.25) | Whoosh at peak blur (f:20, v:0.5) | — | Build + peak matches blur motion |
| Light Leaks | Airy whoosh (f:5, v:0.2) | — | — | Subtle — leaks are atmospheric overlays |
| Triple Stack | Whoosh per video (f:3, f:15, f:27, v:0.5) | — | — | Each video slide gets its own whoosh |
| Split Compare | Swoosh on wipe start (v:0.4) | — | — | Matches the divider movement |
| Speaker segment | — | — | Soft whoosh | Minimal — let the speaker's voice dominate |

### How to create your own SFX pairing

Think about **what's happening visually**, then match:
- **Something appears** → Pop, UI popup, camera shutter
- **Camera moves** → Whoosh (intensity matches camera speed)
- **Data animates** → UI bleep/counter per increment, notification on completion
- **Text highlights** → UI click per word, hit on key word
- **Scene transitions** → Swoosh/swipe/whoosh (energy matches transition speed)
- **Building tension** → Riser (place at start, plays through scene)
- **Revealing content** → Hit/boom (place at exact reveal frame)

## Volume Guidelines

| Audio Type | Recommended Volume | Notes |
|-----------|-------------------|-------|
| Voiceover/narration | 80–100 | Primary audio |
| Background music | 15–30 | Subtle, never competing |
| Transition SFX | 30–50 | Brief, punchy |
| Ambient SFX | 10–25 | Atmospheric only |
| UI/notification SFX | 40–60 | Clear but not jarring |

## Voiceover Workflow

### Generate TTS voiceover

```bash
# 1. Generate speech via PrepWithAI
prepwithai_speech_generate(
  text="Welcome to SkillTown — your AI video editor",
  voice_id="male-qn-qingse",
  speed=1.0,
  audio_format="mp3"
)
# → Returns audio_url, duration_seconds

# 2. Download
curl -sL "<audio_url>" -o ~/Downloads/voiceover.mp3

# 3. Add to timeline
{ "type": "editor.addAudio", "params": {
  "src": "/Users/.../Downloads/voiceover.mp3",
  "name": "Voiceover",
  "from": 0,
  "volume": 90
}}
```

### Available voices

```bash
prepwithai_speech_list_voices(voice_type="system")
# Returns voice_id, name, language, gender
```

### Clone a voice

```bash
prepwithai_speech_clone_voice(
  audio_url="<reference_audio_url>",
  demo_text="Text spoken in the reference audio"
)
# → Returns voice_id for use in speech_generate
```

## Audio + Timeline Tips

- **Reorder tracks** after adding audio: `editor.reorderTracks` puts audio below text but above video
- **Master volume**: UI-only control — no API command yet. Individual items use `editor.editItem` with `volume` param
- **SFX timing**: Place transition SFX centered on scene boundaries (start 0.5s before boundary)
- **Avoid overlap**: Don't stack too many SFX at the same timestamp — keep max 2 simultaneous

> **Reference**: SFX lives in two tiers:
> - **Core Set** (27 keyed sounds): `_Assets/sfx/core-set/` — one best sound per role, AI default. See `core_sfx_manifest.json` for ML analysis and `CORE_SFX_GUIDE.md` for quick reference.
> - **Full Library** (81 sounds): `_Assets/sfx/remotion-ready/` — 12 categories with `sfx_manifest.json` for variety/fallback.
> - **Placement guide**: See `_Agent/skills/sfx-placement.md` for the complete SFX placement workflow.
> - Use `prepwithai_sfx_search` MCP tool for additional SFX from the cloud catalog (1000+ sounds).
> - Regenerate manifests anytime: `python _Assets/sfx/_analysis/generate_manifest.py <folder>`
