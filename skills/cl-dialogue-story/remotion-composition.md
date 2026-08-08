# Remotion Composition — ported layout rules + the upgrade

Canvas: **1080×1920** vertical. Ported from `TlEditingSolution/Tools/main/editor_agent.py`
(`DynamicVideoEditor.edit()`) and `video_processor.py` configs. The original composited
5 layers with MoviePy; we build the **same 5 layers** with ContentLead tracks + Remotion
scenes — gaining real springs, transitions, karaoke captions and post-hoc editability.

## ⭐ Text styling rule — prefer Remotion scenes over plain text/captions

**As much as possible, put ALL on-screen text (titles, hooks, karaoke captions, lower-thirds)
through Remotion scenes — NOT plain `editor.addText` / `editor.addCaption`.** Plain text items
give flat, unstyled results. Remotion scenes (via `scene.addBundledScene` / `scene.addCustomScene`
/ `scene.addLibraryScene`) unlock springs, per-word animation, gradients, strokes, glow,
kinetic typography and the exact viral look — and stay fully editable.

- **Titles/hooks** → a Remotion title scene (pop-in spring, scale bounce, auto-fit box).
- **Karaoke captions** → a Remotion caption scene with word-level highlight animation.
- Only fall back to `editor.addText` / `editor.addCaption` when a matching Remotion scene
  genuinely doesn't exist. Load the `cl-remotion` skill for the caption/text scene catalog.

## Layer stack &amp; z-order (front → back)

Remember ContentLead: **Track 0 = front**. After adding, call `editor.reorderTracks`.

| Track (front→back) | Layer | Source |
|--------------------|-------|--------|
| 0 | **Title hook** overlay | `title_data` |
| 1 | **Karaoke subtitles** (word-by-word) | `proc_word_data.words` |
| 2 | **Context images** (timed) | `dialogue.images[]` |
| 3 | **Characters** (L/R, spring slide-in) | `characters[*].image` |
| 4 | **Background gameplay** video | `background_video` |

(Original composite order: `bg + character_clips + relevant_image_clips + subtitle_clips + title_clips` — same stack, title on top.)

## Timeline clock

- Dialogue `d[i]` **start** = Σ `d[0..i-1].audio.duration`; **length** = `d[i].audio.duration`.
- Concatenate all dialogue audios in order = the master audio (drives total duration).
- All per-dialogue sub-timings (`word.start/end`, `image_start/end`) are **relative** to
  that dialogue's start — add the dialogue start when placing on the global timeline.

## Layer 4 — Background
Full-timeline gameplay video (Minecraft parkour / satisfying loop), cropped to 1080×1920,
`bg_displacement_sec` optional start offset. Muted (audio comes from dialogue voices).

## Layer 3 — Characters (the recognizable look)
Ported constants: `char_height (TARGET_H) = 1640`, `char_y_margin = 0`, `char_x_margin = 40`.
- **Alternate side every dialogue** (toggles each line; expert vs questioner end up on
  opposite sides). Respect `characters[c].side` as the starting/home side.
- **y** = `video.h - TARGET_H - char_y_margin + 850` = `1920 - 1640 + 850` → **≈1130**
  (characters sit low, feet near bottom).
- **x (left home):** `char_x_margin + 40` ≈ **80**.
- **x (right home):** `video.w - charWidth - char_x_margin + 200`.
- **Entrance:** `slide_in_left` for left, `slide_in_right` for right, duration ~0.1s
  (original) — in Remotion use a **spring** slide + optional swish SFX for a nicer feel.
- Show the character for the full duration of its dialogue.

**Remotion upgrade:** use the reusable `scenes/DialogueCharacter.tsx` (spring slide-in
from the correct edge, holds, optional exit). Parametric — no baked `.mov` cache dir.

## Layer 2 — Context images (word-timed)
For each `img` in `dialogue.images`:
- **global start** = `dialogueStart + img.image_start`; **end** = `dialogueStart + img.image_end`.
- If a title is showing and this is dialogue 0, clamp start to `>= title duration`
  (original: `image_actual_start = max(title_duration, image_actual_start)`).
- Position: top area with margins `image_x_margin = image_y_margin = 60`; size to a
  comfortable card (leave gameplay visible per the 60–90% coverage rule).
- **Remotion upgrade — VARY the entrance, keep it SNAPPY:** each context image gets a
  quick enter animation, but **do NOT reuse the same preset for every card** — rotate
  through a set so the reel feels alive. Recommended rotation (cycle per image within a
  dialogue, and alternate across dialogues):
  `scaleIn → slideInRight → slideInLeft → slideInTop → dropAnimationIn → flipIn`.
  **Speed:** `duration` **280–340 ms** (fast/punchy). The 500 ms default is too slow for
  brain-rot pacing — always pass an explicit short `duration`. Pair with a subtle Ken
  Burns drift while on screen; cross-fade between consecutive images in a dialogue.
  Apply via `editor.setAnimation {itemId, animationIn:<preset>, duration:300}` (see the
  contentlead **animations-and-effects** skill for the full enter-preset list). Reminder:
  animations do **not** survive save/restore — re-apply after every reload.

## Layer 1 — Karaoke subtitles (correct Latin script)
Source: `proc_word_data.words` (Latin!) with per-word `start/end` — these timings come
from **real word-level transcription** of the generated audio (Stage 1.1, local whisper),
NOT even-spacing.
Ported style (`subtitle_config`): `stroke black`, `color #00e10d`/green active,
`#FFFFFF` white rest, bold display font, lower-third position.

> ⚠️ **Captions are NOT a Remotion scene.** Subtitles have a dedicated, editable,
> karaoke-highlighted **caption item** type. Use it. The "prefer Remotion scenes for text"
> rule applies to **titles/hooks/decorative text**, not the running subtitle track.

- **✅ USE `editor.addCaption` (the proper caption-item mechanism).** Chunk the Latin
  `proc_word_data.words` into short ~3-word phrase items so only the active phrase shows
  (classic viral windowed karaoke). Give each chunk its REAL per-word `start/end`
  (absolute timeline ms) so the highlight syncs to the spoken audio.
- **Apply a documented style PRESET.** The caption preset catalog lives in
  `SkillTown/.../floating-controls/caption-preset-data.ts` (Green Scale, Popular, Hind Glow,
  Fire Bold, Toxic Green, Hormozi Style, …). Pass the preset's style props to
  `editor.addCaption` (`activeColor`, `appearedColor`, `color`, `borderColor`, `borderWidth`,
  `textShadow`, `animation`, `fontFamily`/`fontUrl`) plus `presetName` for metadata.
  Default for this pipeline: **"Green Scale"** — `appearedColor #ffffff`, `activeColor
  #04f827FF`, `borderColor #000000` `borderWidth 10`,
  `animation letterKaraoke/scaleAnimationLetterEffect` (matches the ported green-active look).
- `editor.addCaption` params that matter: `from`, `to` (hold each chunk until the next
  word starts, no flicker), `text`, `words:[{word,start,end}]` (**absolute** timeline ms),
  `presetName`, style props above, `fontSize`, `x/y` (lower third, e.g. `y:1360` on 1080×1920),
  `autoReorder:false` (reorder once at the end).
- `orchestrator/run.mjs` Stage 3 (`stage30_compose`) does exactly this — see the
  `editor.addCaption` chunk loop with `GREEN_SCALE`.

## Layer 0 — Title hook overlay (0 → ~3s)
Source: `title_data.text_hook_line` (2–5 words) for `title_data.duration…` seconds.
Ported style (`title_config`): `fontsize 104`, dual color (`#00e10d`/`#FFFFFF`),
`y_position_percent 0.2` (upper third), black stroke width 4, translucent rounded
background box. **✅ PREFERRED: use a Remotion title scene** (pop-in spring, scale bounce,
gradient/glow, auto-fit box) via `scene.addBundledScene` / `scene.addCustomScene`. Only fall
back to a styled `editor.addText` if no Remotion title scene fits.
- **Remotion upgrade:** pop-in spring + slight scale bounce; auto-fit box to text.

## Build order (what `run.mjs` Stage 3 does)
1. Add background video (Track, full length).
2. For each dialogue: add its `DialogueCharacter` scene at `dialogueStart`, alternating side.
3. Add all context images at their global windows.
4. Add karaoke captions from all `proc_word_data.words` (global timings).
5. Add the title overlay.
6. `editor.reorderTracks` to enforce the z-order table above.
7. Attach the concatenated dialogue audio (or per-dialogue audio clips at their starts).

Then Stage 4 exports. Everything remains **editable** — the creator can restyle, retime
or swap any beat, which the original one-shot MoviePy render could not do.
