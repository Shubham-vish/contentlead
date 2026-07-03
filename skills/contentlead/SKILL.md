---
name: contentlead
description: Control the ContentLead video editor from any AI agent. This is the master router skill. Load this first to discover capabilities, then load specific sub-skills for detailed API instructions. Use this for editing video, adding scenes/text/media, managing tracks, and exporting. For Remotion scene creation, load the `remotion` skill.
---

# ContentLead Editor — AI Master Router

ContentLead is a desktop video editor (Electron + Next.js) with a local HTTP API that lets AI agents control the entire editing workflow.

**This is a router document.** Do not guess command parameters from this file. Use the skill table below to load the specific, detailed skill document for the task you are trying to accomplish.

## Mandatory Startup Protocol

Every session must execute these steps before any editing commands.

1. **Read API info:** `cat ~/.skilltown-desktop/api.json` (extract port and token)
2. **Health check:** `curl -s http://127.0.0.1:$PORT/api/health -H "Authorization: <token>"`
3. **Diagnostics:** `curl -s "http://127.0.0.1:$PORT/api/diagnostics?full=true" -H "Authorization: <token>"`
4. **Open Content:** 
   - List: `curl -s http://127.0.0.1:$PORT/api/content/list`
   - Open: `curl -s -X POST http://127.0.0.1:$PORT/api/navigate -d '{"url":"/content/<id>","waitForReady":true,"autoRestore":true}'`
5. **Verify Canvas:** Check dimensions with `query.getCanvasSize` before adding items.

## ⚠️ CRITICAL VISIBILITY RULE: Track Z-Order

**Track 0 is the FRONT layer.** Higher track numbers (Track 1, 2, 3) are placed **BEHIND** Track 0.
If you add text on Track 2 and a video on Track 0, the text will be **invisible** (hidden behind the video).
**SOLUTION:** ALWAYS call `editor.reorderTracks` after adding items to automatically fix layer ordering.


## Skill Routing Table

**⚠️ CRITICAL:** Load the relevant skill file BEFORE attempting to use commands in that category. The detailed docs contain mandatory rules (like track z-order, parameter names, and timing formats) that you will fail without.

| Task | Skill to Load | Key Commands |
|------|---------------|--------------|
| Text & Typography (manual) | `text-and-captions` | `editor.addText`, `editor.editItem` |
| Video & Chroma-key | `video` | `editor.addVideo`, `editor.addVideoSegments`, `editor.setClipState` |
| Images & Static Media | `images` | `editor.addImage`, `editor.replaceMedia`, `media.validate` |
| Audio, Gain, EQ, Noise | `audio-gain-eq` | `editor.addAudio`, `editor.setAudioGain`, `audio.setEq`, `audio.reduceNoise` |
| Position, Crop, Resize | `canvas-and-positioning` | `editor.positionItem`, `editor.resize`, `editor.cropItem` |
| Trim/Split/Cut on timeline | `item-editing` | `editor.splitItem`, `editor.cutItem`, `editor.trimItem`, `editor.moveItem` |
| Tracks, Z-order, Linking | `track-management` | `editor.reorderTracks`, `editor.linkTracks`, `editor.renameTrack` |
| Bulk / Batch operations | `bulk-operations` | `bulk.styleByType`, `bulk.shiftAll`, `POST /api/batch` |
| Transcripts, Auto-Captions | `transcription-and-editing` | `content.applyCaptions`, `query.getTranscriptionStatus` |
| Animations, Transitions, VFX | `animations-and-effects` | `editor.setAnimation`, `editor.addTransitionBetween`, `editor.addKeyframe` |
| Full E2E Pipeline & Scenes | `storystudio-pipeline` | (Workflow guide, pipeline states) |
| Project save/load, Export | `project-and-export` | `editor.save`, `editor.export`, `project.getFullState` |
| Read timeline/editor state | `queries-and-state` | `query.getTimelineItems`, `query.getTrackInfo`, `query.getEditorState` |
| Debugging, Logs, Arch | `infrastructure` | `GET /api/diagnostics`, `GET /api/console-errors` |
| Multi-tab collaboration | `multi-tab` | `GET /api/tabs`, `POST /api/tabs/new`, `tabId` on `/api/execute` |

## Disambiguation: Which Text/Cut command do I use?

- **Titles / Lower Thirds:** Use `editor.addText` (`text-and-captions`).
- **Subtitles (Auto-generated):** Use `content.applyCaptions` (`transcription-and-editing`).
- **Karaoke/Word-level manual captions:** Use `editor.addCaption` (`text-and-captions`).
- **Fixing typos in auto-captions:** Use `editor.editCaptionWord` (`transcription-and-editing`).
- **Trimming media BEFORE adding:** Pass `trim: {from, to}` to `editor.addVideo` (`video`).
- **Cutting/splitting clips ALREADY on timeline:** Use `editor.splitItem` / `editor.cutItem` (`item-editing`).
