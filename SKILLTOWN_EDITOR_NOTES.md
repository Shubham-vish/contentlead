# SkillTown Editor Notes

Start with the main guide: [`AGENTS.md`](AGENTS.md). It is the authoritative startup, diagnostics, command, and save protocol for agents controlling the editor.

## Dispatch patterns

- Images and template scenes use `ADD_ITEMS` so tracks and items are created together.
- Scenes should be tagged as template items and kept on lower/background tracks.
- Text/caption tracks must stay above scene/video/background tracks; call `editor.reorderTracks` after bulk edits.
- `editorBridgeHelpers` is the bridge/helper layer for sending editor commands and reading command responses.

## Building videos programmatically

1. Verify canvas size first.
2. Plan the narrative arc and track layout.
3. Add background scenes/media before text.
4. Pass `from` and `to`/`durationMs` at creation time for track reuse.
5. Replace canned template props with real user content.
6. Check `editorHealth`, run diagnostics, reorder tracks, and save.

## Per-topic skills

Load only the skill you need: `overview`, `scenes-and-templates`, `creator-styles`, `timeline-operations`, `media-and-audio`, `project-and-export`, `queries-and-state`, `rendering`, or the Remotion rule files under `skills/remotion/`.
