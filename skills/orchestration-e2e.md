---
name: orchestration-e2e
description: Master end-to-end workflow — from raw materials to finished rendered video. 8-phase pipeline with formal edit plan, asset validation, tiered QA.
tags: orchestration, workflow, pipeline, end-to-end, plan, render, automation, master, e2e
---

# End-to-End Video Editing — Orchestration Guide

> **This is the master workflow.** Follow these 8 phases to take raw materials (video, script, topic) and produce a finished, rendered video — fully AI-driven.

## When to Use This Guide

| Starting Point | Phases to Run |
|---|---|
| Raw video + transcript | All 8 phases |
| Topic brief only (AI generates everything) | 0 → 1 (skip media) → 2–8 |
| Enhance existing project | 0 → 1 (inspect) → skip 2–3 → 4–8 |
| StoryStudio B-roll pipeline | 0 → 1 → 2 → 3 → 4 (StoryStudio path) → 5–8 |

## Convention: All Timings in Milliseconds

Every value in the edit plan and every command param uses **milliseconds**. `1 second = 1000`. All scene commands (`from`, `durationMs`) also use milliseconds.

## Skills to Load Per Phase

| Phase | Skills to Load |
|---|---|
| 0: Setup | `getting-started`, `overview` |
| 1: Analyze | `media-and-audio`, `ai-content-generation` |
| 2: Plan | `scenes-and-templates`, `text-and-captions` |
| 3: Foundation | `scenes-and-templates`, `media-and-audio` |
| 4: Content | `text-and-captions`, `canvas-and-positioning`, `storystudio-pipeline` |
| 5: Enhance | `animations-and-effects`, `custom-scene-authoring` |
| 6: Verify | `queries-and-state` |
| 7: Render | `rendering`, `project-and-export` |

---

## Phase 0 — Setup & Discovery

### 0.1 Connect to the Editor

```bash
# Read connection info
API_JSON=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo $API_JSON | jq -r '.port')
TOKEN=$(echo $API_JSON | jq -r '.token')

# Health check
curl http://127.0.0.1:$PORT/api/health -H "Authorization: Bearer $TOKEN"
```

Verify: `editor.ready = true` and `editor.contentId` matches the loaded content. (`hasDesign` is not a health field — use `POST /api/execute {type:"query.getEditorState"}` or `GET /api/state` to inspect the actual design.)

### 0.2 Navigate to Content (if needed)

```bash
curl -X POST http://127.0.0.1:$PORT/api/navigate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"url": "/content/content_XXX", "waitForReady": true, "timeout": 30000}'
```

### 0.3 Load Style

Read the project's style tokens:
```bash
cat _EditingStyleDetails/_Style/kallaway-cinematic/style.json
```

Extract: `background`, `colors`, `fonts`, `typography` for use in Phases 3–5.

### 0.4 Existing Project Safety

Before modifying an existing project:
1. Export current state: `GET /api/project/export`
2. Save a backup: `POST /api/project/save` with explicit path
3. Never delete user-created tracks — only modify agent-created tracks (`metadata.isAgentTrack = true`)

---

## Phase 1 — Analyze Raw Materials

### 1.1 Inventory Check

Determine what the user provides:

| Material | Analysis Action |
|---|---|
| Video clips | `ffprobe` for metadata, `ffmpeg` to extract frames |
| Audio/voiceover | `ffprobe` for duration, check format |
| Script/transcript | Parse text, estimate duration (150 WPM) |
| Topic brief | Plan content generation (TTS, images, scenes) |
| Images/screenshots | Check dimensions, prepare for timeline |

### 1.2 Media Validation Gate ⚠️

For EVERY media file, before any timeline operations:

```bash
# Extract metadata — REQUIRED for video
ffprobe -v quiet -print_format json -show_streams /path/to/video.mp4
# → width, height, duration (seconds × 1000 = ms)
```

Validation checklist:
- [ ] File exists at the path
- [ ] Format is supported (mp4, webm, mov, mp3, wav, jpg, png)
- [ ] `width`, `height`, `durationMs` extracted (for video)
- [ ] File is accessible via `/api/local-file` endpoint or public URL
- [ ] No `blob:` or `data:` URLs for video (only images support data URLs)

### 1.3 Frame Analysis (for video clips)

```bash
# Extract 3 frames per video at 25%, 50%, 75%
DURATION_S=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 /path/to/video.mp4)
for pct in 25 50 75; do
  TS=$(echo "$DURATION_S * $pct / 100" | bc)
  ffmpeg -ss $TS -i /path/to/video.mp4 -frames:v 1 -q:v 2 /tmp/frame-${pct}pct.jpg -y
done
```

Analyze extracted frames with `prepwithai_image_analyze` to understand content:
- What's shown (people, UI, product, text)
- Visual mood (dark, bright, colorful)
- Relevant topics for scene selection

### 1.4 Build Materials Manifest

Output a structured manifest:

```json
{
  "materials": {
    "videos": [
      { "path": "/path/to/clip1.mp4", "width": 1920, "height": 1080, "durationMs": 45000, "analysis": "AI tool demo" }
    ],
    "audio": [
      { "path": "/path/to/voiceover.wav", "durationMs": 60000 }
    ],
    "images": [],
    "transcript": { "wordCount": 450, "hasTimestamps": true },
    "topic": "AI agents for video editing"
  },
  "totalDurationMs": 60000,
  "orientation": "portrait",
  "gaps": ["no background music", "no B-roll images"]
}
```

---

## Phase 2 — Plan the Video (Edit Plan)

### 2.1 The Edit Plan Schema

Phase 2 produces a **formal edit plan** — a JSON contract that all subsequent phases execute against. This is the most critical phase.

```json
{
  "canvas": { "width": 1080, "height": 1920, "fps": 30 },
  "totalDurationMs": 60000,
  "style": "kallaway-cinematic",
  "background": "#0a0a0f",

  "segments": [
    {
      "id": "intro",
      "fromMs": 0,
      "toMs": 5000,
      "type": "intro",
      "scene": { "method": "library", "sceneId": "scene_gradient_intro_01", "props": { "title": "AI Revolution" } },
      "text": [
        { "content": "AI Revolution", "role": "headline", "fromMs": 500, "toMs": 4500 }
      ],
      "transition": null
    },
    {
      "id": "section-1",
      "fromMs": 5000,
      "toMs": 25000,
      "type": "content",
      "scene": { "method": "motionBg", "sceneId": "DataStreamScene" },
      "media": { "type": "video", "path": "/path/to/clip1.mp4", "trimStartMs": 0, "trimEndMs": 20000, "volume": 100 },
      "text": [
        { "content": "Building the Future", "role": "title", "fromMs": 5000, "toMs": 8000 },
        { "content": "with AI Agents", "role": "subtitle", "fromMs": 6500, "toMs": 9500 }
      ],
      "transition": { "type": "LightLeaks", "preset": "warm-film", "durationMs": 1000 }
    },
    {
      "id": "outro",
      "fromMs": 55000,
      "toMs": 60000,
      "type": "outro",
      "scene": { "method": "library", "sceneId": "scene_cta_01", "props": { "text": "Subscribe" } },
      "text": [],
      "transition": { "type": "LightLeaks", "preset": "cool-blue", "durationMs": 1000 }
    }
  ],

  "audio": {
    "music": { "source": "from_assets", "volume": 25, "fullDuration": true },
    "voiceover": { "source": "tts", "volume": 100, "text": "..." },
    "sfx": [
      { "type": "whoosh", "atMs": 5000, "reason": "intro→content transition" },
      { "type": "impact", "atMs": 0, "reason": "title reveal" }
    ]
  },

  "checks": {
    "requiresVoiceover": true,
    "requiresBroll": false,
    "requiresRender": true,
    "isNewProject": true
  }
}
```

### 2.2 Planning Decisions

#### Segment Type → Scene Selection

| Segment Type | Recommended Scenes |
|---|---|
| `intro` / `hook` | opener scenes, gradient intros, motion-bg with title |
| `content` | motion-bg behind video/text, DataStreamScene, NebulaCloudsScene |
| `data` / `stats` | chart scenes (BarChart, PieChart, NumberTicker) |
| `transition` | LightLeaks (always `mode: "evolve-only"`) |
| `quote` | text scenes (TypewriterQuote, GlitchText) |
| `outro` / `cta` | closer scenes, CTA layouts |

#### Text Pacing Rules

- **Headlines/titles**: 2–3 seconds visible
- **Subtitles**: 2–4 seconds visible
- **Body text**: 3–5 seconds visible
- **Sequential reveals**: stagger by 1–1.5 seconds between lines
- **Never** put multiple lines in one text item — use separate items with staggered timing

#### Audio Level Guidelines

| Layer | Volume | Notes |
|---|---|---|
| Voiceover/dialogue | `100` | Primary layer — full volume |
| Background music (during speech) | `15–25` | Ducked under speech |
| Background music (no speech) | `35–50` | Higher in gaps |
| SFX | `60–80` | Short, peak moments only |

### 2.3 Duration Estimation

- **From transcript**: `wordCount / 150 * 60 * 1000` ms (150 WPM average)
- **Intro**: 3–5 seconds
- **Outro/CTA**: 3–5 seconds
- **Transition overlaps**: 0.5–1 second at boundaries
- **Total padding**: add 10% buffer

---

## Phase 3 — Build the Foundation

Execute these in order. Each step references the edit plan.

### 3.1 Set Background

```json
{ "type": "editor.setBackground", "params": { "type": "color", "value": "#0a0a0f" } }
```

⚠️ **Always set this first** — prevents white flashes between scenes.

### 3.2 Set Canvas Size (if needed)

```json
{ "type": "editor.resize", "params": { "width": 1080, "height": 1920 } }
```

### 3.3 Add Background Scenes (Full Coverage)

From the edit plan, add scenes for EVERY segment. **NO GAPS** — the entire duration must be covered.

```json
{ "type": "scene.addLibraryScene", "params": {
  "sceneId": "DataStreamScene", "from": 0, "durationMs": 25000, "sceneProps": {}
}}
```

**Rules:**
- Prefer `scene.addLibraryScene` for catalog scenes
- Use `scene.addBundledScene` for custom scenes with imports
- Use `scene.addCustomScene` for simple sandbox scenes
- Non-overlapping scenes auto-share tracks
- Verify: no time gaps between scenes

### 3.4 Add Background Music

```json
{ "type": "editor.addAudio", "params": {
  "url": "http://127.0.0.1:PORT/api/local-file?path=/path/to/music.wav&token=TOKEN",
  "from_ms": 0, "duration_ms": 60000, "volume": 25
}}
```

Search assets: check `_Assets/music/` or use `prepwithai_sfx_search` for ambient tracks.

### 3.5 Checkpoint

```json
{ "type": "editor.save", "params": {} }
```

After save, verify with: `GET /api/state?scope=summary` — confirm itemCount > 0.

---

## Phase 4 — Build Content Layers

### 4.1 Add Video Clips

For each video in the edit plan, always provide metadata:

```json
{ "type": "editor.addVideo", "params": {
  "url": "http://127.0.0.1:PORT/api/local-file?path=/path/to/clip.mp4&token=TOKEN",
  "from_ms": 5000, "duration_ms": 20000,
  "width": 1920, "height": 1080, "duration": 45000,
  "volume": 100, "trim_start": 0, "trim_end": 20000
}}
```

⚠️ **Always provide `width`, `height`, `duration`** — without these, video items silently fail to appear.

> **Repositioning**: To move or resize any item after creation, use `editor.positionItem` — see `canvas-and-positioning` skill. Do NOT use `editor.editItem` with `display.x`/`display.y` — those are timeline-only metadata and don't affect visual position.

### 4.2 Add Text Layers (Sequential Reveals)

For each segment's text array in the edit plan:

```json
[
  { "type": "editor.addText", "params": { "text": "Building the Future", "role": "title", "from_ms": 5000, "duration_ms": 3000 } },
  { "type": "editor.addText", "params": { "text": "with AI Agents", "role": "subtitle", "from_ms": 6500, "duration_ms": 3000 } }
]
```

**Rules:**
- One idea per text item
- Stagger reveals by 1–1.5 seconds
- Use `role` param for automatic style guide defaults
- **Always pass `x`, `y` at creation** for correct initial placement (see `canvas-and-positioning` skill)
- **To reposition later**: use `editor.positionItem` — NOT `editor.editItem` with `display.y`

### 4.3 Add Transitions (LightLeaks)

Place 1-second LightLeaks at each segment boundary, centered (0.5s before + 0.5s after):

```json
{ "type": "scene.addLibraryScene", "params": {
  "sceneId": "LightLeaks",
  "from": 4500, "durationMs": 1000,
  "sceneProps": { "preset": "warm-film", "mode": "evolve-only", "intensity": 0.9, "background": "transparent", "blendMode": "screen" }
}}
```

⚠️ **Always use `mode: "evolve-only"`** — prevents the double-flash problem.

### 4.4 StoryStudio B-Roll (if `checks.requiresBroll`)

Run the 5-step pipeline in order:
```
storystudio.getPipelineState → generateGroupings → generateDecisions → generateStrings → searchImages → applyAssets
```
See `storystudio-pipeline` skill for full details.

### 4.5 Add Captions (if transcript available)

```json
{ "type": "editor.addCaption", "params": {
  "text": "word", "from_ms": 1000, "duration_ms": 500
}}
```

For karaoke-style captions with word-level timestamps from transcript.

### 4.6 Reorder Tracks ⚠️

**ALWAYS run this after building content:**

```json
{ "type": "editor.reorderTracks", "params": {} }
```

This ensures: text (top) → audio → video → images → scenes (bottom). Without this, text may be invisible behind scenes.

### 4.7 Checkpoint

```json
{ "type": "editor.save", "params": {} }
```

---

## Phase 5 — Enhance & Polish

### 5.1 Animations

Add enter/exit animations to text items:

```json
[
  { "type": "editor.setAnimation", "params": { "item_id": "TEXT_ID", "type": "in", "preset": "fadeIn" } },
  { "type": "editor.setAnimation", "params": { "item_id": "TEXT_ID", "type": "out", "preset": "fadeOut" } }
]
```

**Recommended combos:**
- Titles: `fadeIn` + `fadeOut`
- Subtitles: `slideInBottom` + `fadeOut`
- CTAs: `scaleIn` + `heartbeatAnimationLoop`
- Labels: `typeWriterIn` + `fadeOut`

### 5.2 Visual Effects

Apply to B-roll or background videos:

```json
{ "type": "editor.addEffect", "params": { "item_id": "VIDEO_ID", "effect_type": "blur" } }
```

Common effects: `blur` (background), `grayscale` (stylistic), `brightness`, `contrast`, `sepia`.

### 5.3 SFX

Add sound effects at key moments (from the edit plan's `audio.sfx` array):

1. Search: `prepwithai_sfx_search(query="cinematic whoosh", top_k=5)`
2. Download the SFX file
3. Add to timeline: `editor.addAudio` with short duration and appropriate volume

### 5.4 Camera Effects (for video clips)

For Ken Burns or 3D camera shake on video clips, use `scene.addBundledScene` with `@remotion/noise` imports. See `scenes-and-templates` skill for full examples.

### 5.5 Audio Ducking

Verify music volume is lower during speech:
- Query all audio items: `query.getTimelineItems` with `type: "audio"`
- If music and voiceover overlap, ensure music volume ≤ 25

---

## Phase 6 — Verify & QA

### 6.1 Fast QA (after every batch)

After executing any batch of commands:
```bash
curl "http://127.0.0.1:$PORT/api/logs?level=error&latest=true&limit=5" -H "Authorization: Bearer $TOKEN"
curl "http://127.0.0.1:$PORT/api/console-errors" -H "Authorization: Bearer $TOKEN"
```

If errors: diagnose and fix before proceeding.

### 6.2 Structural QA (before render)

```json
[
  { "type": "query.getEditorState", "params": { "scope": "summary" } },
  { "type": "query.getTrackInfo", "params": {} },
  { "type": "query.getAllText", "params": {} }
]
```

Verify against the edit plan:

| Check | How | Fix |
|---|---|---|
| Duration matches plan | `result.design.duration` ≈ `totalDurationMs` | Extend/trim last segment |
| No scene gaps | Scene items cover 0 → duration continuously | Add missing scenes |
| Text is visible | Text tracks are above scene tracks | `editor.reorderTracks` |
| Item count is reasonable | Compare to plan segment/text counts | Add missing items |
| Track order correct | Text tracks at index 0–N, scenes at bottom | `editor.reorderTracks` |
| Audio present | Audio items exist if plan requires them | Add missing audio |

### 6.3 Common Issues & Fixes

| Issue | Symptom | Fix |
|---|---|---|
| Text invisible | Text exists but not visible in player | `editor.reorderTracks` |
| White flashes | Gaps between scenes | Add scenes to cover gaps |
| Video not appearing | addVideo returned success but no item | Provide `width`, `height`, `duration` params |
| Double flash on transitions | LightLeaks plays twice | Set `mode: "evolve-only"` |
| Stale data after load | Items from previous project appear | Clear all stores before DESIGN_LOAD |
| Music too loud | Voiceover drowned out | `editor.setVolume` on music to 20 |

---

## Phase 7 — Render & Export

### 7.1 Save Before Render

```bash
curl -X POST http://127.0.0.1:$PORT/api/project/save \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{}'
```

### 7.2 Start Render

```bash
curl -X POST http://127.0.0.1:$PORT/api/render \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "renderType": "design",
    "data": { "design": "CURRENT_STATE" },
    "codec": "h264",
    "outputFormat": "mp4",
    "quality": 85
  }'
```

Or use the editor's current state directly via `GET /api/project/export` → extract design → pass to render.

### 7.3 Poll Until Complete

```bash
# Check status every 10 seconds
curl http://127.0.0.1:$PORT/api/render/$JOB_ID -H "Authorization: Bearer $TOKEN"
```

Wait for `status: "completed"` → `outputPath` has the file.

### 7.4 Render QA

Verify the output:
```bash
# Check file exists and has reasonable size
ls -lh ~/Movies/SkillTown/$JOB_ID.mp4

# Check video metadata
ffprobe -v quiet -print_format json -show_format ~/Movies/SkillTown/$JOB_ID.mp4
```

---

## Phase 8 — Deliverables & Handoff

### 8.1 Report to User

Summarize what was built:
- Total duration
- Number of scenes, text items, audio tracks
- Style used
- Render output path (if rendered)
- Content ID for web access

### 8.2 Known Caveats

Report any:
- Skipped optional enhancements
- SFX that couldn't be found
- Scenes that used fallback templates
- Audio levels that may need manual tweaking

---

## Recovery Playbook

| Error | Cause | Fix |
|---|---|---|
| `401 Unauthorized` | Token expired | Re-read `~/.skilltown-desktop/api.json` |
| `503 editor_not_ready` | Page not loaded | `POST /api/navigate` → `POST /api/editor/wait-ready` |
| `ECONNREFUSED` | App not running | Start SkillTown Desktop |
| Items not appearing | Media URL unreachable | Check `/api/local-file` endpoint, use HTTP URLs |
| Text invisible after build | Wrong track order | `editor.reorderTracks` |
| Save fails silently | Large bundled scenes | Use `POST /api/project/save` with explicit path |
| Render stuck | Worker crash | Cancel job, check terminal logs, retry |
| Black frames in render | WebGL issue | Simplify scenes, reduce concurrent effects |

---

## Workflow Variants

### Variant A: Topic Only (No Raw Media)

When the user provides only a topic or brief — AI generates everything:

1. **Phase 1**: Skip media analysis. Generate content plan from topic.
2. **Phase 2**: Plan segments. Use `prepwithai_text_generate` for script. Estimate durations.
3. **Phase 3**: Generate voiceover with `prepwithai_speech_generate`. Generate background images with `prepwithai_image_generate`. Add motion-bg scenes.
4. **Phase 4**: Add generated voiceover as audio. Add text from script as sequential reveals. Generate B-roll images with `prepwithai_image_generate`.
5. **Phases 5–8**: Same as standard flow.

### Variant B: Enhance Existing Project

1. **Phase 0**: Export current state, inspect what exists.
2. **Phase 1**: Analyze existing items — what's missing? (transitions, SFX, animations, B-roll)
3. **Skip Phases 2–3**: Foundation already exists.
4. **Phase 4**: Add only missing content (transitions, captions, extra text).
5. **Phase 5**: Add animations and effects to existing items.
6. **Phases 6–8**: Same as standard flow.

⚠️ Never delete user-created tracks. Only modify agent-created items.

### Variant C: StoryStudio B-Roll Focus

1. **Phases 0–3**: Standard setup.
2. **Phase 4**: Run full StoryStudio pipeline:
   ```
   getPipelineState → generateGroupings → generateDecisions → generateStrings → searchImages → applyAssets
   ```
3. **Phase 5**: Add animations to applied assets, add transitions.
4. **Phases 6–8**: Standard QA and render.

---

## Quick Reference: Command Cheat Sheet

### Setup
```bash
cat ~/.skilltown-desktop/api.json                          # Get PORT/TOKEN
curl http://127.0.0.1:$PORT/api/health -H "Auth..."       # Health check
curl http://127.0.0.1:$PORT/api/skills/overview -H "..."   # Load capabilities
```

### Build (in order)
```
editor.setBackground → scene.addLibraryScene (×N) → editor.addAudio →
editor.addVideo → editor.addText (×N) → LightLeaks transitions →
editor.reorderTracks → editor.save
```

### Enhance
```
editor.setAnimation (in/out) → editor.addEffect → editor.addAudio (SFX) →
editor.addKeyframe → editor.save
```

### Verify
```
query.getEditorState → query.getTrackInfo → query.getAllText →
/api/logs?level=error → /api/console-errors
```

### Render
```
POST /api/project/save → POST /api/render → GET /api/render/$JOB_ID (poll)
```

---

## Content Layering Validation (Post-Edit)

**Run this validation AFTER building a timeline, BEFORE presenting to user.**

### Layer Completeness Check

```
For each scene in timeline:
  1. VISUAL: Does it have a clear visual treatment? (not just raw video)
  2. TEXT: Does it have supporting text/caption if content needs explanation?
  3. AUDIO: Is there SFX at the scene boundary? Is there music underneath?
  4. TRANSITION: Is there an animation in/out (not hard cut unless intentional)?
  
If ANY layer is missing without good reason → add it before presenting.
```

### Audio Coverage Rules

| Rule | Check | Fix |
|---|---|---|
| **No dead silence > 3s** | Seek through timeline, listen for gaps | Add background music or ambient |
| **Background music present** | At least one music track at vol 25-35 | Add from `_Assets/background_music/` |
| **SFX contextually placed** | Each SFX matches the scene content, not random | Re-map using SFX-to-Context table |
| **All video sources muted?** | If all OffthreadVideo are muted, audio is empty | Either unmute one source or add music |
| **Audio item count ≤ 5** | Count total audio items in timeline | Combine or remove excess |

### "No Silent Video" Rule

If the final timeline has video content but NO audio (all videos muted, no music, no SFX), this is a **HARD FAIL**. The AI must add at minimum:
1. Background music at low volume (25-35), OR
2. At least 3-4 contextual SFX across the timeline

A video with no audio feels broken to users, even if the visuals are perfect.

### Scene Diversity Score

After building all scenes, check:
- How many unique source videos/images used? (target: at least 1 per 2 scenes)
- How many unique visual treatments? (target: no same effect 3x in a row)
- How many different SFX types used? (target: at least 4 distinct types)

If diversity is low, add variety before presenting.
