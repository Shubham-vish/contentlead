---
name: cl-web-demo
description: "Record a polished demo of ANY website inside ContentLead Desktop: open it in the isolated Demo browser (tabId demo:main), take AI control, show the agent cursor/ripple/optional AI badge, highlight elements, record MP4 + events sidecar, then import into a ContentLead project and auto-place zoom punches and click SFX with camera.autoZoomFromEvents. USE FOR: website demo, product tour of any site, record a site walkthrough in ContentLead, demo browser, screen-record a URL with auto zoom. NOT the standalone Playwright/Remotion pipeline (my-demo-factory)."
tags: demo, website, demo-browser, recording, auto-zoom, walkthrough, cursor, ui-automation
---

# cl-web-demo — any website → recorded demo → auto-zoomed edit

> **Owns the question:** *"Make a demo video of this website (any URL) using ContentLead."*
> Mechanics live in the owning docs. This skill is the end-to-end recipe:
> - UI actions: [`cl-desktop/ui-automation.md`](../cl-desktop/ui-automation.md), sections "Demo browser" and "Recording"
> - editor commands: [`cl-editor`](../cl-editor/SKILL.md), with auto-zoom in `cl-editor/animations-and-effects.md`
>
> Want a standalone CLI pipeline with assertions, a PDF and subtitles instead? Use [`my-demo-factory`](../my-demo-factory/SKILL.md).

## Ground rules
- **Connect** with `cl-desktop` steps 1–4: read `~/.skilltown-desktop/api.json` privately and never print the token.
- **Demo browser:** tabId `demo:main` uses its own persistent session `persist:cl-demo`.
  - Any `https` site works. `http` works only for localhost and private IPs.
  - Logins persist. If the flow needs an account, **ask the person to sign in by hand** in the Demo browser first.
- **Human-only fields:** passwords, OTP, card and payment fields return `UI_HUMAN_ONLY`. Never work around this.
- **Downloads and permission prompts are denied.** Don't script flows that need them.
- **Single page:** `target=_blank` and `window.open` load in the same window, and there are no demo tabs.
- **Don't wipe logins:** never call `demo-browser-clear-session` unless the person asks.
- **Don't auto-play** the result. Give the paths.

## Helper
```bash
API=~/.skilltown-desktop/api.json
PORT=$(python3 -c "import json;print(json.load(open('$API'))['port'])")
TOKEN=$(python3 -c "import json;print(json.load(open('$API'))['token'])")
ui(){ curl -s -X POST "http://127.0.0.1:$PORT/api/ui" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$1"; }
ex(){ curl -s -X POST "http://127.0.0.1:$PORT/api/execute" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$1"; }
```
Every mutation needs a unique `idempotencyKey`.

## Recipe

### 1. Plan the take (before touching the site)
Write 4–10 beats, each one an action plus the point the viewer should see. Choose:
- **Viewport:** 1280×720 for landscape. For reels, use 1080×1350 or 720×1280 (phone layout).
- **Marks:** put `{"action":"mark","params":{"label":"zoom-here"}}` where the auto-zoom should punch in without a click.

### 2. Open the site and inspect it
```bash
ui '{"action":"demo-browser-open","tabId":"demo:main","params":{"url":"https://example.com","width":1280,"height":720},"idempotencyKey":"wd-open-1"}'
ui '{"action":"ui-enable","tabId":"demo:main","params":{},"idempotencyKey":"wd-en-1"}'
```
- **Inspect:** use the observe/snapshot and screenshot actions in `ui-automation.md` to find stable locators: role/text first, then CSS. Screenshot each beat's target before recording.
- **Rehearse:** do a dry `ui-run` without `record`, then reset with `demo-browser-navigate` back to the start URL.

### 3. Style the cursor and overlay
```bash
ui '{"action":"ui-cursor","tabId":"demo:main","params":{"show":true,"preset":"reel","rippleColor":"#FFD43B"},"idempotencyKey":"wd-cur-1"}'
```
- `badge` and `frame` are **off by default**. Add `"badge":true` (or `{"text":"AI","color":"#7C3AED"}`) and `"frame":true` only when the person wants the "AI is controlling" look.
- Use `ui-highlight` to call out an element during a beat. Labels are kept inside the viewport.

### 4. Record in one `ui-run`
```bash
ui '{"action":"ui-run","tabId":"demo:main","idempotencyKey":"wd-run-1","params":{
  "record":{"path":"<slug>-take1.mp4","fps":60,"leadInMs":400,"tailMs":800},
  "steps":[ {"action":"ui-click","params":{"selector":"..."},"waitAfterMs":600},
            {"action":"mark","params":{"label":"zoom-here"}},
            {"action":"demo-browser-navigate","params":{"url":"https://example.com/pricing"},"waitAfterMs":1200},
            {"action":"ui-scroll","params":{"deltaY":400},"waitAfterMs":700} ]}}'
```
- **Pacing:** use 500–900 ms `waitAfterMs` so the ripple and the result read on screen. Speed is fixed later in the edit.
- **Polling:** poll `record-status {recordingId}` until `state:"completed"`. Keep `path`, `eventsPath`, `width`, `height` and `videoDurationMs`.
- **QA the frames:** pull 3–4 frames with ffmpeg (start, a click, the end) and view them before editing. Retake if a beat missed.

### 5. Import into a ContentLead project
1. `POST /api/content/create {"title":"<site> demo","navigate":false}`, then `POST /api/tabs/new {contentId}`. Pin that `tabId`. See `cl-desktop` and `cl-editor/workflow-readiness`.
2. Upload or import the MP4 and add it with `editor.addVideo`, including `width`, `height` and `duration` from ffprobe (track rules in `cl-editor`). Note the returned item id.

### 6. Auto-zoom and SFX from the events
```bash
ex '{"tabId":"<editorTab>","type":"camera.autoZoomFromEvents","params":{"itemId":"<videoItemId>",
  "eventsPath":"/Users/<you>/.skilltown-desktop/recordings/<slug>-take1.events.json",
  "options":{"maxZoom":2.2,"sfx":true,"punches":true,"replace":true}}}'
```
- `eventsPath` must be absolute, `.json` and ≤ 5 MB. It works in Desktop only; elsewhere use `events` inline or `eventsUrl`.
- Trimming and speed changes are mapped automatically (`display.from + (t − trim.from)/playbackRate`). Apply speed or trim first, then re-run with `replace:true`.
- The same command is available as **Camera ▸ Auto-zoom from recording…**.

### 7. Save and verify
- Run `editor.save`, then confirm the saved state via `GET /api/bridge/content/<id>` (zoom keyframes and SFX present).
- Render through `cl-editor/rendering`, and check frame 0 / the cover before publishing (`my-cl-publishing`).

## Scrape data / inspect a site's API calls
The details are in `cl-desktop/ui-automation.md`, section "Scraping and network capture (Demo browser)". All of these
need `ui-enable` on `demo:main`.
1. **Capture first.** Start with `ui-network-capture-start {resourceTypes:["xhr","fetch"]}`, then browse, scroll or
   page through the site. Stop with `ui-network-capture-stop {captureId, har:true}` to get the JSONL and HAR. Credential
   headers and secret query values are redacted. Auth, payment and OAuth URLs keep metadata only.
2. **Call the JSON API you found** with `ui-page-fetch {url, method?, body?}`. It runs inside the page with the
   person's login, so it returns clean JSON.
3. **Only when the data exists only in HTML,** use `ui-scrape {item, fields, next:{selector}|{scroll:true}|{urls}, format:"csv"}`.
   Files land in `~/.skilltown-desktop/scrapes`.
- **Be polite:** respect the site's terms and robots rules. Keep `delayMs` (800 ms by default, 300 ms minimum), use
  small `maxPages`, and don't scrape personal data you weren't asked for.
- **Private files:** response bodies are stored as-is, so don't share capture files.
- **Never** try to read password, OTP or card fields. They return `null` / `UI_HUMAN_ONLY`.

## Errors to expect
| Code | Meaning / fix |
|---|---|
| `UI_URL_BLOCKED` | The URL scheme or host isn't allowed (file:, javascript:, public http…). `demo-browser-status.lastBlocked` shows which. |
| `UI_HUMAN_ONLY` | A protected field. Ask the person to fill it, then continue. |
| `UI_NO_HISTORY` | There is no back/forward entry. |
| Control lost after a blocked navigation, or after the window closed/hid | `ui-enable` again. Recording stops when control ends. |
