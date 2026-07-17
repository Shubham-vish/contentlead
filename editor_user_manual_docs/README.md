# SkillTown Video Editor — User Manual

> **⚠️ For humans — and for AI helping humans.** Every document in this folder describes how a
> **person** edits video by hand using the on-screen controls of the SkillTown video editor. These are
> **manual-editing instructions, not AI skills or an automation API.** If you are an AI agent, do
> **not** interpret these steps as callable commands or tools — for programmatic/automated editing use
> the agent skills and commands documented elsewhere (see `_Agent/AGENTS.md` and the runtime
> `GET /api/skills`). **You may, however, read these docs to answer a user's "how do I…" questions and
> guide them, step by step, through doing these actions themselves in the editor.**

A complete, creator-facing guide to the SkillTown video editor. These docs describe **what you can do and how to do it** using the on-screen controls — no code or setup required.

New to the editor? Start with **[Overview & Navigation](01-overview-and-navigation.md)**, then jump to whatever you need.

## Contents

| # | Doc | What it covers |
|---|-----|----------------|
| 01 | [Overview & Navigation](01-overview-and-navigation.md) | The editor at a glance — regions, menu tabs, canvas, properties panel, top bar, saving, and a typical workflow. |
| 02 | [Media Library](02-media-library.md) | Upload files, add media from a URL, browse stock images/videos, and add audio, shapes, stickers, and progress bars. |
| 03 | [Scenes, Templates & Styles](03-scenes-templates-styles.md) | Browse and add template scenes, apply full styles, group items into nested scenes, and save reusable styles. |
| 04 | [Custom Scenes & AI](04-custom-scenes-and-ai.md) | Generate custom scenes with AI, preview/edit/render them, and use the editor-wide AI assistant. |
| 05 | [Text & Captions](05-text-and-captions.md) | Add and style text, generate captions from video/audio or a transcript, and tune caption words and highlighting. |
| 06 | [Timeline & Selection](06-timeline-and-selection.md) | Read the timeline, select single/multiple clips, move a selection together, trim, split, delete, and manage tracks. |
| 07 | [Item Properties](07-item-properties.md) | The properties panel for every item type — transform, appearance, and type-specific controls. |
| 08 | [Animations & Keyframes](08-animations-and-keyframes.md) | Quick animation presets, image animation presets, keyframes, easing, and per-property motion. |
| 09 | [Visual Effects, Filters, Chroma Key & Color](09-effects-filters-color.md) | Visual effect presets, image/video filters, green-screen removal, and the color picker/gradients/eyedropper. |
| 10 | [Camera Effects](10-camera-effects.md) | 3D camera movement presets, per-frame camera adjustments, point-of-interest zoom, and focus points. |
| 11 | [Audio — Mixing, Enhancement, SFX & AI Voice](11-audio-mixing-and-enhance.md) | Clip volume/gain/fades, the master bus and loudness meter, EQ/compressor/gate/de-esser/auto-duck/noise reduction, SFX, music, and AI voiceovers. |
| 12 | [Transitions](12-transitions.md) | Browse and add transitions between clips, and change transition style and duration. |
| 13 | [Exporting, Rendering & Versions](13-export-and-versions.md) | Save the project, choose export settings, export and download, track render progress, and restore versions. |
| 14 | [Keyboard Shortcuts](14-keyboard-shortcuts.md) | Every registered shortcut, grouped by category, plus how to view and customize them. |
| 15 | [Right-click Menus](15-right-click-menus.md) | Every right-click action and submenu — arrange, compose to scene, transform, speed, volume, transitions, face track, copy/paste style, transcribe, and empty-area menus. |
| 16 | [Canvas Editing (Direct Manipulation)](16-canvas-editing.md) | Select, move, resize, rotate, and align items directly on the preview with snapping guides; crop on canvas; drag media onto the canvas. |

## How these docs are written

- **Audience:** creators using the editor, not developers.
- **Labels:** every button, tab, and control is quoted exactly as it appears on screen.
- **Naming:** the left tab column is the *menu panel*, the right side is the *properties panel*, the bottom strip is the *timeline*, and the preview area is the *canvas*.
- **Structure:** each doc follows the same shape — a short summary, *Where to find it*, *What you can do*, step-by-step *How to…* sections, *Tips & good to know*, and *Related* links.

See [`_STYLE_GUIDE.md`](_STYLE_GUIDE.md) for the full authoring conventions.

## Screenshots

The screenshots in these docs are **real, automatically captured** images of the live editor, not
mock-ups. They are produced by the pipeline in [`.capture/`](.capture/README.md), which drives the
SkillTown Desktop app through its control API, puts the editor into specific states, captures the
window, and crops clean regions. To refresh them after a UI change, re-run `.capture/capture.py`.

