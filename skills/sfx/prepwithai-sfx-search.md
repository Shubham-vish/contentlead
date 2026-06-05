---
name: prepwithai-sfx-search
description: "Search, discover, and add sound effects from the PrepWithAI cloud SFX library (1000+ sounds). Covers semantic search, category/mood/energy filters, download, and timeline placement."
tags: sfx, sound-effects, prepwithai, search, download, cloud, library, semantic, mood, energy, category
---

# PrepWithAI SFX Search — Cloud Sound Effects Library

Use the **PrepWithAI MCP tools** to search a cloud library of 1000+ professionally curated sound effects. This supplements the local core-set (27 sounds) when you need variety, niche sounds, or specific moods.

> **When to use this vs core-set:**
> - **Core set** (`_Assets/sfx/core-set/`): Fast, 27 keyed sounds, no network needed. Use for standard editing.
> - **PrepWithAI cloud**: 1000+ sounds, semantic search, mood/energy filters. Use when core-set doesn't have the right character or you need multiple distinct variations.

---

## Quick Start

```python
# 1. Search
results = prepwithai_sfx_search(query="dramatic cinematic boom", top_k=5)

# 2. Pick the best match (highest score)
best = results[0]  # {name, description, score, category, duration, blob_path, tags}

# 3. Download to local
# The blob_path is a public Azure URL — download it
curl -sL "https://prepwithai.blob.core.windows.net/sfx/{blob_path}" -o ~/Downloads/boom.mp3

# 4. Add to editor timeline
POST /api/execute
{"type": "editor.addAudio", "params": {
  "src": "/Users/.../Downloads/boom.mp3",
  "name": "Boom SFX",
  "from": 5000,
  "duration": 1500,
  "volume": 40
}}
```

---

## MCP Tool Reference

### `prepwithai_sfx_search` — Semantic Search

Search by natural language description. Returns ranked results by relevance score.

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | *required* | Natural language description of the sound you need |
| `top_k` | int | 10 | Max results to return |
| `category` | string | null | Filter by category (see categories below) |
| `energy` | string | null | Filter: `"low"`, `"medium"`, `"high"` |
| `mood` | string | null | Filter: `"dramatic"`, `"calm"`, `"tense"`, `"happy"`, etc. |
| `min_duration` | float | null | Minimum duration in seconds |
| `max_duration` | float | null | Maximum duration in seconds |

**Response shape:**

```json
{
  "results": [
    {
      "name": "Cinematic Boom Hit",
      "description": "Deep cinematic impact boom with reverb tail",
      "score": 0.92,
      "category": "Hits",
      "duration": 2.1,
      "blob_path": "hits/cinematic_boom_hit.wav",
      "tags": ["cinematic", "boom", "impact", "dramatic"]
    }
  ]
}
```

### `prepwithai_sfx_categories` — List Categories

Returns all available SFX categories with descriptions.

**No parameters required.**

---

## SFX Categories

| Category | Typical Sounds | Best For |
|----------|---------------|----------|
| **Camera** | Shutter clicks, photo sounds, film advance | Screenshot reveals, comparisons, before/after |
| **Comedy** | Cartoon sounds, boings, sad trombones | Fun/casual content, meme moments |
| **Foley** | Footsteps, fabric, glass, environment | Realistic ambience, scene-setting |
| **Hits** | Impacts, punches, slams, booms | Scene transitions, big reveals, emphasis |
| **Mechanical** | Gears, levers, machines, motors | Tech/engineering content, robot themes |
| **Music** | Short stings, jingles, fanfares | Intro/outro accents, achievement moments |
| **Notifications** | Dings, alerts, chimes, bell sounds | UI reveals, success moments, milestones |
| **Playful** | Bouncy, fun, whimsical, magical | Kids content, casual explainers |
| **Pops** | Bubble pops, cork pops, snaps | Text reveals, list items, bullet points |
| **Risers** | Tension builders, crescendos, swells | Building anticipation before reveals |
| **Transitions** | Whooshes, swells, sweeps, wipes | Scene transitions, topic changes |
| **Typing** | Keyboard clicks, mechanical keys | Code/terminal scenes, typing demos |
| **UI** | Clicks, toggles, switches, menus | Interface demonstrations, button presses |
| **Whooshes** | Fast motion, swooshes, air sounds | Slide transitions, fast movements |

---

## Search Strategies

### By mood/energy

```python
# Calm, ambient sounds for backgrounds
prepwithai_sfx_search(query="gentle ambient atmosphere", energy="low", mood="calm")

# Dramatic impacts for key moments
prepwithai_sfx_search(query="epic impact", energy="high", mood="dramatic")

# Happy, upbeat notifications
prepwithai_sfx_search(query="success notification", mood="happy", max_duration=1.5)
```

### By use case

```python
# Tech tutorial — need typing sounds
prepwithai_sfx_search(query="mechanical keyboard typing", category="Typing", max_duration=3.0)

# Product demo — need UI interactions
prepwithai_sfx_search(query="modern UI button click", category="UI", energy="medium")

# Comparison video — need whoosh transitions
prepwithai_sfx_search(query="fast cinematic whoosh", category="Whooshes", max_duration=1.5, energy="high")

# Data visualization — need counting/ticking
prepwithai_sfx_search(query="digital counter tick", category="UI")

# Error/warning moment
prepwithai_sfx_search(query="error buzzer wrong", mood="tense")
```

### Finding variations

When you need multiple distinct sounds of the same type (e.g., 5 different pops for a list):

```python
# Get 10 pop variations
results = prepwithai_sfx_search(query="pop bubble snap", category="Pops", top_k=10)
# Pick 5 with best scores but different names for variety
```

---

## Download & Add to Timeline

### Step 1: Download the SFX file

The `blob_path` from search results is relative to the PrepWithAI storage. Download it locally:

```bash
# Using curl
curl -sL "https://prepwithai.blob.core.windows.net/sfx/{blob_path}" -o ~/Downloads/{filename}

# Or use prepwithai_asset_rehost to get a permanent URL
prepwithai_asset_rehost(url="https://prepwithai.blob.core.windows.net/sfx/{blob_path}")
# → Returns permanent public_url
```

### Step 2: Add to editor

```bash
# Via the SkillTown Desktop API
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "type": "editor.addAudio",
    "params": {
      "src": "/Users/.../Downloads/boom.mp3",
      "name": "Cinematic Boom",
      "from": 5000,
      "duration": 1500,
      "volume": 40
    }
  }'
```

### Step 3: Adjust after adding

```bash
# Change volume
{"type": "editor.editItem", "params": {"itemId": "ITEM_ID", "volume": 30}}

# Move in time
{"type": "editor.editItem", "params": {"itemId": "ITEM_ID", "from": 6000}}

# Trim duration
{"type": "editor.editItem", "params": {"itemId": "ITEM_ID", "duration": 1000}}
```

---

## Volume Guidelines for Cloud SFX

| SFX Type | Volume | Why |
|----------|--------|-----|
| Transition whoosh/swoosh | 30–50 | Brief and punchy, needs to cut through |
| Impact/hit/boom | 35–50 | One-shot emphasis, should feel impactful |
| UI click/notification | 25–40 | Clear but not jarring |
| Riser/build-up | 15–25 | Background tension builder |
| Ambient/atmosphere | 10–20 | Subtle, never competing with voice |
| Pop/snap | 35–50 | Short and punchy |
| Comedy/special | 30–45 | Depends on tone of content |

---

## Batch SFX Workflow

For adding multiple SFX to a video (e.g., 30+ placements):

```python
# 1. Search once for each SFX type you need
whooshes = prepwithai_sfx_search(query="whoosh transition", category="Transitions", top_k=3)
pops = prepwithai_sfx_search(query="pop bubble", category="Pops", top_k=3)
hits = prepwithai_sfx_search(query="impact hit", category="Hits", top_k=3)

# 2. Download all unique files
# 3. Use POST /api/batch to add all SFX at once:
{
  "commands": [
    {"type": "editor.addAudio", "params": {"src": "/path/whoosh1.mp3", "from": 0, "duration": 1000, "volume": 40, "name": "Whoosh"}},
    {"type": "editor.addAudio", "params": {"src": "/path/pop1.mp3", "from": 3000, "duration": 800, "volume": 35, "name": "Pop"}},
    {"type": "editor.addAudio", "params": {"src": "/path/hit1.mp3", "from": 10000, "duration": 1200, "volume": 45, "name": "Hit"}}
  ]
}
```

---

## Combining with Core-Set

Best practice: use the **core-set** as your primary library (fast, no network), and **PrepWithAI cloud** for:

- Sounds not in the core-set (comedy, foley, mechanical, ambient)
- When you need multiple variations of the same type
- When the content demands a specific mood/energy the core-set can't match
- When the user specifically requests "find me a sound that..."

```
Decision tree:
  Need SFX → Is it in core-set? (27 keyed sounds)
    YES → Use core-set (faster, no download)
    NO  → Search PrepWithAI cloud library
           → Download → Add to timeline
```

---

## Related Skills

- **`sfx-placement`** — Core-set library reference, transcript-based placement strategy, gain rules
- **`media-and-audio`** — General audio commands (add, volume, speed, opacity, replace)
- **`remotion/rules/sfx-and-audio`** — SFX pairing logic for Remotion scenes, voiceover workflow
