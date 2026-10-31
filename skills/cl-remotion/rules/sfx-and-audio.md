---
name: sfx-and-audio
description: Sound effects acquisition, placement, and audio workflow for SkillTown Desktop
tags: sfx, audio, sound-effects, whoosh, transition-sound, voiceover, volume
---

# SFX & Audio Workflow

Use **the SkillTown Desktop AI bridge (`/api/bridge/ai/sfx/*`)** for catalog
search, or a verified user-supplied local library. This skill does not bundle
audio files. Read `cl-content-direction/sfx-reference.md` for palette approval
and licensing, and `sfx-placement.md` for acoustic anchors and cue verification.

## SFX Acquisition Workflow

### 1. Search for SFX

```bash
# Via the desktop AI bridge
curl -sX POST "$API/api/bridge/ai/sfx/search" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"query":"dramatic cinematic boom","top_k":5}'
# Returns: data.results[] with name, description, score, category, duration, sfx_url, tags

# Filter by category, mood, energy
curl -sX POST "$API/api/bridge/ai/sfx/search" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"query":"whoosh","category":"transitions","energy":"high","max_duration":2.0}'

# List all categories
curl -s "$API/api/bridge/ai/sfx/categories" -H "Authorization: Bearer $TOKEN"
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
  "trackId": "<existing-compatible-sfx-track-id>",
  "from": 5000,
  "durationMs": 1500
}}
```

### 4. Adjust Volume

```json
{ "type": "editor.editItem", "params": {
  "itemId": "sfx_item_id",
  "volume": 40
}}
```

## SFX Categories (via the desktop AI bridge)

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

The following are candidate pairings, not automatic placement rules or approved
defaults. Entry, accent and exit are optional. Preserve the approved palette;
do not sound every visual event. All fixed frame/volume examples below are
illustrative and must be adapted to the actual motion and measured source.

1. **Entry SFX** — Matches the scene's entrance energy. Gentle scenes (Ken Burns) get airy whooshes. Dramatic scenes (title cards) get risers → hits.
2. **Accent SFX** — Placed at key content moments (data point appears, word highlights, camera shifts). Should match the visual action.
3. **Exit SFX** — Usually a whoosh or nothing. Only add if the scene has an exit animation.
4. **Frame timing** — Align the chosen audible start/arrival/peak to the actual
   output-frame event. File start is not necessarily audible arrival.
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

> **Full docs:** load the **`cl-voice`** skill — it covers the live voice bridge
> (clone, upload, generate, list, delete) with exact params. This is a quick
> reference. Use the desktop bridge routes below.

### Generate TTS voiceover

```bash
# 1. Generate speech via the desktop voice bridge
curl -sX POST "$API/api/bridge/voice/generate" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"text":"Welcome to ContentLead — your AI video editor",
       "voice_id":"English_expressive_narrator","speed":1.0,"format":"mp3"}'
# → { audio_url, format, duration_seconds }

# 2. Download (SAS URL — grab immediately)
curl -sL "<audio_url>" -o ~/Downloads/voiceover.mp3

# 3. Add to timeline
{ "type": "editor.addAudio", "params": {
  "src": "/Users/.../Downloads/voiceover.mp3",
  "createNewTrack": true,
  "trackName": "Voiceover",
  "from": 0,
  "details": { "volume": 90 }
}}
```

### Available voices

> Note: choose a `voiceId` when calling `/api/bridge/voice/generate`.

### Clone a voice

Use `POST /api/bridge/voice/clone`.

### Delete a cloned voice

Use `POST /api/bridge/voice/delete`.

## Audio + Timeline Tips

- **Reorder tracks** after adding audio: `editor.reorderTracks` puts audio below text but above video
- **Master bus**: `query.getMasterBus` / `audio.setMasterBus`; see
  `cl-editor/workflow-completion.md`. Measure the export separately.
- **SFX timing**: use the cue's measured anchor, not a universal half-second lead.
- **Overlap**: preserve intentional layers but review masking and peaks.

> **Ownership:** `cl-ai-media` owns acquisition, `cl-content-direction` owns
> approved role/placement decisions, `cl-editor` owns timeline commands, and
> `cl-audio` owns local measurements. Historical core-set paths/counts are not
> portable; verify the selected library and its license manifest.
