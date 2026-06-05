---
name: content-direction
description: Creative strategy, storyboarding, narrative arcs, track management, and content planning for the ContentLead video editor. Use before building any non-trivial video. Pairs with the `contentlead` skill (editor commands) and `remotion` skill (scene creation).
tags: creative, storyboard, narrative, planning, strategy, hook, pacing, direction, tracks
---

# Content Direction — Creative Strategy for Video Editing

## Why This Matters

Technical capability without creative direction produces demo reels, not content. Every video edit must start with a PURPOSE — what story are we telling, who's watching, what should they feel?

## Mandatory Pre-Edit Steps

### Step 0: Verify Canvas Dimensions

**Always check first:**
```json
{"type": "query.getCanvasSize", "params": {}}
```

| Content Type | Dimensions | When |
|-------------|-----------|------|
| Landscape | 1920×1080 | Data-viz, charts, dashboards, professional |
| Portrait | 1080×1920 | Reels, TikTok, stories, mobile-first |

If wrong, resize BEFORE adding any scenes — scenes render squished on the wrong canvas.

## Narrative Arc Patterns

### 1. Hook → Build → Payoff (Most Common for Reels)
```
0-3s:   HOOK    — Bold visual, dramatic SFX, immediate attention
3-15s:  BUILD   — Develop the idea, show the process, escalate
15-25s: PAYOFF  — Big reveal, result, climax moment
25-30s: CLOSE   — CTA, logo, or lingering final shot
```
**Best for:** Product demos, tutorials, showcases, before/after

### 2. Problem → Agitation → Solution
```
0-5s:   PROBLEM    — Show the pain point (dark mood, tension SFX)
5-15s:  AGITATION  — Make it worse, show frustration (building music)
15-25s: SOLUTION   — Reveal the fix (bright transition, impact SFX)
25-30s: PROOF      — Show it working (ding, success SFX)
```
**Best for:** SaaS demos, feature reveals, comparison content

### 3. Montage / Showcase
```
Scene 1: Establishing shot (wide, Ken Burns, ambient)
Scene 2: Detail shot (bordered crop, zoom)
Scene 3: Action shot (3D perspective, movement)
Scene 4: Comparison (split-screen, PiP)
Scene 5: Hero shot (camera orbit, dramatic)
Scene 6: Close (fade to logo/text)
```
**Best for:** Portfolio pieces, mood reels, music videos

### 4. Tutorial / Walkthrough
```
Step 1: "Here's what we'll build" (end result preview)
Step 2: "Step 1..." (screen recording + text overlay)
Step 3: "Step 2..." (different angle/zoom)
Step N: "And that's it!" (result + SFX celebration)
```
**Best for:** How-to content, educational, tech walkthroughs

## Pacing Guidelines

| Video Length | Recommended Scenes | Scene Duration | SFX Count |
|---|---|---|---|
| 15s (short reel) | 3-4 scenes | 3-5s each | 5-8 |
| 30s (standard reel) | 5-7 scenes | 4-6s each | 10-15 |
| 45s (extended) | 6-8 scenes | 5-7s each | 15-25 |
| 60s (full reel) | 8-12 scenes | 4-7s each | 25-40 |

### Pacing Rules
- **Never 3 slow scenes in a row** — alternate fast/slow
- **Build energy toward the middle** — don't peak at the start
- **End with resolution** — don't cut abruptly during peak energy
- **Transitions should match pacing** — hard cuts for fast, fades for slow

## Scene Diversity Matrix

When building a multi-scene video, track these to ensure variety:

| Scene | Visual Effect | Source | Text? | SFX Type | Energy |
|---|---|---|---|---|---|
| 1 | Ken Burns | video_A | Title | whoosh | Low |
| 2 | Bordered crop | video_B | Caption | camera_shutter | Medium |
| 3 | PiP | video_A + C | Label | notification | Medium |
| 4 | Split screen | video_B + D | Comparison | air_hit | High |
| 5 | 3D perspective | video_C | — | digital_readout | High |
| 6 | Camera orbit | video_A | CTA | impact | High→Low |

**Check columns for diversity:**
- Visual Effect: No same effect 3x → ✅
- Source: At least 3 unique sources → ✅
- Energy: Builds up, varies → ✅

## Audio Layering Strategy

### Layer 1: Background Music (ALWAYS present)
- Add FIRST before any SFX
- Volume: 25-35 (about -12 to -9 dB)
- Choose music that matches the content mood
- Location: `_Assets/background_music/`

### Layer 2: SFX (Contextual, not random)
- Map each SFX to content meaning using the SFX-to-Context table in `media-and-audio.md`
- Place at meaningful moments, not arbitrary time points
- Respect spacing rules: min 1.5s gap, min 7s for same type

### Layer 3: Source Audio (Selective)
- If a video has speech, unmute it (set as primary audio)
- If a video has ambient sound, keep at low volume for atmosphere
- If a video has no useful audio, keep muted

### Audio Balance Target
```
Background music:  -12 to -9 dB (always audible but never dominant)
SFX accents:       -14 to -6 dB (noticeable but not jarring)
Source speech:      -3 to 0 dB   (loudest layer when present)
```

## Pre-Edit Planning Template

Use this mental template before any video editing session:

```
1. PURPOSE: What is this video for? (showcase/tutorial/demo/mood)
2. AUDIENCE: Who watches this? (clients/social/portfolio)
3. ARC: Which narrative pattern? (hook-build-payoff/problem-solution/montage)
4. SOURCES: What source material do I have? (list videos/images)
5. SCENES: How many scenes, what effect for each?
6. AUDIO: Music choice + SFX mapping
7. TEXT: What text/captions are needed?
```

**If you can't answer #1 and #3, STOP and ask the user before proceeding.**

## Video Building Best Practices

### Build Order
1. **Set dark canvas background** — `editor.setBackground` with `#0a0a0f`
2. **Add all background scenes FIRST** (bottom tracks after reorder)
3. **Add LightLeak transitions** at section boundaries (1s each)
4. **Add all text/content LAST** (top tracks after reorder)
5. **Call `editor.reorderTracks`** to fix layer ordering
6. **Call `editor.save`** to persist

### Scene Coverage — NO GAPS
Background scenes must cover the FULL video duration. Gaps = white/empty frames.
Plan contiguous ranges: 0-5s, 5-15s, 15-25s, etc.

### Scene Transitions
Contiguous scenes MUST use `enterAnim: { type: 'none' }` (hard cut). Using `fade` on back-to-back scenes causes white flash.

## Track Management

### Z-Order Rule
**Top track (Track 0) = front layer.** Text on bottom tracks is INVISIBLE behind backgrounds.

Always call `editor.reorderTracks` after adding items. Sort order:
1. **Text/Caption** (top — most visible)
2. **Audio**
3. **Video**
4. **Regular images**
5. **Template/Scene tracks** (bottom — background)

### Smart Track Reuse
**Always pass `from`/`to` in add commands.** Without them, every item creates a new track at time 0.

```python
# ❌ BAD: 7 items → 7 tracks
for slide in slides:
    addImage(src=slide.img)  # all at time 0 → new track each
    moveItem(itemId, from=slide.from, to=slide.to)

# ✅ GOOD: 7 items → 1 track
for slide in slides:
    addImage(src=slide.img, from=slide.from, to=slide.to)  # auto-reuse
```

### Track Naming
```json
{"type": "editor.renameTrack", "params": {"trackId": "abc", "name": "🎵 Music"}}
{"type": "editor.renameTrack", "params": {"trackId": "def", "name": "🖼 Backgrounds"}}
{"type": "editor.renameTrack", "params": {"trackId": "ghi", "name": "📝 Text Overlays"}}
```

## Text Pacing

**Never dump multiple lines in one text item.** Break into sequential reveals:

```
❌ {"text": "Line 1\nLine 2\nLine 3", "from": 5000, "to": 10000}

✅ {"text": "Line 1", "from": 5000, "to": 8000, "y": 500}
   {"text": "Line 2", "from": 6000, "to": 9000, "y": 650}
   {"text": "Line 3", "from": 7500, "to": 10000, "y": 800}
```

### Text Positioning — Calculate Bounds

```
Text height ≈ fontSize × 1.5
Next item top ≈ previous top + (fontSize × 1.5) + gap(20-40px)
```

### Canvas Zones (1920×1080)
- Top bar: `top: 30-100px`
- Upper third: `top: 100-360px`
- Center: `top: 360-720px` (hero text)
- Lower third: `top: 720-950px` (subtitles, CTAs)

## Style System

Text/caption commands use defaults from the selected editing style in `_Style/<style-name>/style.json`.

### Role System
Use `params.role` to select preset: `headline`, `title`, `subtitle`, `body`, `label`, `caption`. Auto-inferred from text length if not provided.

## Content Layering Checklist

Validate AFTER building, BEFORE presenting to user:

- [ ] Visual scenes have supporting text where needed?
- [ ] Background music present (or intentionally omitted)?
- [ ] SFX contextually matched to content, not randomly placed?
- [ ] No dead silence > 3 seconds?
- [ ] Videos not all muted with nothing replacing audio?
- [ ] Narrative has a clear arc?
- [ ] Scene diversity — not reusing same source excessively?
- [ ] Track z-order correct (text above scenes)?
- [ ] No gaps in scene coverage?
- [ ] All items verified with diagnostics?

**If any checkbox fails, fix before presenting.**

## Related Skills

- **`contentlead`** — Editor connection, commands, API
- **`remotion`** — Scene creation, animations, effects, camera
- Load `orchestration-e2e` from the running app for the full 8-phase pipeline
