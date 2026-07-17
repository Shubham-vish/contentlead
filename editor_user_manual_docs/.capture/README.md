# Screenshot capture pipeline

This folder holds the automated screenshot tooling for the editor user manual. The images it
produces live in `../images/` and are embedded in the manual docs.

## How it works

`capture.py` drives the running **SkillTown Desktop** app through its local control API
(`~/.skilltown-desktop/api.json` → port + token). It:

1. Opens a project in the editor on the local dev origin (`http://localhost:3000`) and waits until
   `editorReady=true` (the cloud origin needs a login, the local dev server does not).
2. Puts the editor into a series of well-defined states using editor commands
   (`editor.deselectAll`, `editor.seekTo`, `editor.select`, …).
3. Captures the whole window via `GET /api/screenshot` (returns base64 PNG) and saves it.
4. Crops clean, manual-ready regions with Pillow (fractional boxes, so they scale with the window).

## Requirements

- SkillTown Desktop app running.
- The editor already open on a project **or** pass `--navigate <contentId>` to open one.
- Python with Pillow (`pip install pillow`).

## Run

```bash
# capture from the project currently open in the editor
python3 capture.py

# open a specific project on the local dev server first, then capture
python3 capture.py --navigate content_03b9016b-55e8-43df-8595-167519b9ec3c
```

## Output

Final images are written to `../images/*.png`. Full-window working captures are named `_*.png`
and are git-ignored (they are regenerated on every run). A `manifest.json` lists the captured
states.

## Notes / limits

- Crop boxes are tuned for the standard editor layout. If the layout changes, adjust the fractions
  in `capture.py`.
- Left-rail panels are opened programmatically with the `ui.openTab` editor command (added to the
  SkillTown command executor). The `ai` tab opens a left-side panel and is not auto-cropped here.
- These are real UI screenshots from a live editor, not generated art.
- Some panels load their content asynchronously (e.g. SFX, stock media). If a panel looks like it is
  still loading, increase the `time.sleep(...)` before its capture in `capture.py`.
