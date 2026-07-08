---
name: testing
description: Agent-run testing for the ContentLead desktop editor. The AI agent itself executes commands, inspects state, captures screenshots, and judges pass/fail.
tags: testing, qa, bridge, contract, state, visual, workflow, screenshots, diagnostics
---

# ContentLead Agent-Run Testing

This skill turns the AI agent into the **test runner, assertion engine, and visual judge**.

- No external LLM APIs
- No vitest / jest / npm test runner
- No generated harness required
- The agent reads test definitions, runs real bridge commands, inspects JSON state, captures screenshots, and reports results inline

Use this when the user says things like:

- “run the bridge command tests”
- “run contract tests only”
- “run caption tests”
- “run the visual smoke suite”

---

## 1) File Layout

Recommended structure:

```text
_EditingStyleDetails/_Agent/skills/testing/
  SKILL.md                       # this file: protocol + runner rules
  suites/
    bridge-smoke.yaml            # representative mixed-layer suite
    contract-core.yaml           # future: response-shape-only tests
    captions.yaml                # future: caption/text focused tests
    media-visual.yaml            # future: screenshot-heavy tests
```

Current seed suite:

- `testing/suites/bridge-smoke.yaml`

---

## 2) What the Agent Must Do

When asked to run tests:

1. Read `~/.skilltown-desktop/api.json`
2. Perform startup checks
3. Create or reuse a **throwaway test content**
4. Read one or more suite YAML files
5. Filter tests by user request (`all`, `contract`, `visual`, `caption`, specific tags)
6. For each test:
   - reset editor state
   - run setup steps
   - execute the command under test
   - inspect response
   - inspect state
   - optionally capture + inspect screenshot
   - run diagnostics
7. Report results inline in chat

The agent is the judge. The YAML is only the checklist.

---

## 3) Startup Protocol for Test Runs

Always do this first.

### 3.1 Read connection details

```bash
API=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['port'])")
TOKEN=$(echo "$API" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
BASE="http://127.0.0.1:$PORT"
AUTH="Authorization: Bearer $TOKEN"
```

### 3.2 Health check

```bash
curl -s "$BASE/api/health" -H "$AUTH"
```

Pass only if:

- `editor.ready == true`
- `media.serverActive == true`

### 3.3 Diagnostics check

```bash
curl -s "$BASE/api/diagnostics?full=true" -H "$AUTH"
```

If diagnostics are already bad, do **not** start a test suite on that tab. Create a fresh test content instead.

### 3.4 Multi-tab rule

If multiple tabs are open, the agent must use the `tabId` of the active test tab on every `/api/execute` call body:

```json
{ "type": "query.getCanvasSize", "params": {}, "tabId": "tab_abc123" }
```

---

## 4) Sandbox / Isolation Strategy

### Default strategy: fresh content per run + empty design before each test

This is the recommended balance between safety and speed.

#### At start of suite run

Create a throwaway content item:

```bash
curl -s -X POST "$BASE/api/content/create" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"title":"AI TEST — safe to delete","description":"Bridge/API test sandbox","waitForReady":true,"timeoutMs":60000}'
```

Save:

- `contentId`
- `tabId`

Wait 10 seconds after creation because new DB-backed projects can overwrite immediate edits:

```bash
sleep 10
```

### Reset before each test

Use `editor.loadDesign` with an explicit empty design instead of relying on deletes.

#### Empty portrait design

```json
{
  "trackItemsMap": {},
  "trackItemDetailsMap": {},
  "tracks": [],
  "trackItemIds": [],
  "transitionsMap": {},
  "transitionIds": [],
  "size": { "width": 1080, "height": 1920 },
  "duration": 60000,
  "fps": 30
}
```

#### Empty landscape design

```json
{
  "trackItemsMap": {},
  "trackItemDetailsMap": {},
  "tracks": [],
  "trackItemIds": [],
  "transitionsMap": {},
  "transitionIds": [],
  "size": { "width": 1920, "height": 1080 },
  "duration": 60000,
  "fps": 30
}
```

Apply with:

```bash
curl -s -X POST "$BASE/api/execute" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"type":"editor.loadDesign","params":{"design":{"trackItemsMap":{},"trackItemDetailsMap":{},"tracks":[],"trackItemIds":[],"transitionsMap":{},"transitionIds":[],"size":{"width":1080,"height":1920},"duration":60000,"fps":30}},"tabId":"TAB_ID"}'
```

Then verify reset:

```bash
curl -s -X POST "$BASE/api/execute" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"type":"query.getTimelineItems","params":{},"tabId":"TAB_ID"}'
```

Expected: empty item list / count 0.

### Fallback reset if editor state looks corrupted

1. `POST /api/reload` with `waitForReady:true`
2. Re-run `editor.loadDesign` empty reset
3. If still unstable, create a fresh content item and continue there

---

## 5) Suite File Format

Use YAML for test definitions. It is easier for humans to edit than JSON and easy for an AI agent to read.

### Why YAML + Markdown hybrid

- `SKILL.md` = runner protocol, judgment rules, reporting rules
- `*.yaml` = concrete tests

That keeps behavior instructions separate from test inventory.

### Minimal schema

```yaml
version: 1
suite:
  id: bridge-smoke
  name: Bridge smoke suite
  defaults:
    isolation: reset-design
    resetPreset: empty-portrait
    artifactDir: ~/.skilltown-desktop/test-artifacts
  assets:
    talking_head_video: REQUIRED_ABSOLUTE_PATH
    audio_sample: REQUIRED_ABSOLUTE_PATH

tests:
  - id: contract.canvas-size
    name: query.getCanvasSize returns width/height
    category: contract
    tags: [query, smoke]
    execute:
      type: query.getCanvasSize
      params: {}
    assert:
      response:
        - path: status
          equals: success
        - path: result.width
          type: number
        - path: result.height
          type: number
```

### Supported fields

#### Test metadata

- `id`
- `name`
- `category`: `contract | state | visual | workflow`
- `tags`: free-form filters like `caption`, `media`, `audio`, `crop`
- `requiresAssets`: optional list of asset keys; if missing, mark test `SKIP`

#### Steps

- `resetPreset`: `empty-portrait | empty-landscape`
- `setup`: ordered list of setup steps
- `execute`: the main command under test
- `assert.response`: checks on the immediate command response
- `assert.state`: follow-up read-only checks
- `assert.visual`: screenshot-based judgment

#### Assertion operators

- `equals`
- `notEquals`
- `exists`
- `type`
- `contains`
- `gte`
- `lte`
- `oneOf`

The agent can evaluate these directly after reading JSON.

### Variable interpolation

Inside YAML, placeholders may reference:

- `{{assets.NAME}}`
- `{{steps.STEP_ID.result...}}` for command steps
- `{{steps.STEP_ID...}}` for HTTP steps whose parsed JSON body is stored directly at the step root
- `{{run.tabId}}`
- `{{run.contentId}}`

The agent resolves them mentally while executing the suite.

---

## 6) Step Types

Use simple, explicit step kinds.

### Command step

```yaml
- id: resize
  kind: command
  type: editor.resize
  params:
    width: 1920
    height: 1080
```

### HTTP step

```yaml
- id: analyze-video
  kind: http
  method: POST
  path: /api/media/analyze
  body:
    path: "{{assets.talking_head_video}}"
```

### Sleep step

```yaml
- id: settle
  kind: sleep
  ms: 1000
```

### Screenshot step

Usually this is driven from `assert.visual`, not `setup`, but explicit capture is allowed:

```yaml
- id: screenshot
  kind: screenshot
  filename: crop-check.png
```

## 6b) LLM-Subjective Test Format

Tests with `judge: llm` use a different format than regular deterministic tests. Instead of
hard `assert` blocks, they have:

- **`steps:`** — ordered list of actions the agent must execute
- **`criteria:`** — free-text rubric the agent uses to judge pass/fail

### Schema

```yaml
- id: visual.custom-scene-renders
  name: "VISUAL: Custom scene renders correctly"
  category: visual
  tags: [visual, scene, screenshot]
  judge: llm                        # ← marks this as subjective
  assets_required: true             # ← optional, marks media dependency
  steps:
    - action: human-readable description
      command:
        type: editor.addText
        params: { text: "Hello", from: 0, durationMs: 3000 }
    - action: capture screenshot
      command:
        type: query.capturePreviewFrame
        params: { format: png }
  criteria: |
    PASS if:
    - Text "Hello" is visible on canvas
    - Background is dark
    FAIL if:
    - Blank canvas
    - Error indicators visible
```

### How the agent judges

1. Execute all `steps` in order, tracking results
2. For screenshot steps, save the image and inspect visually
3. Read the `criteria` rubric
4. Use your own reasoning to determine PASS or FAIL
5. If PASS: report with brief evidence ("Gold text visible, dark background, centered")
6. If FAIL: report with specific reason ("Canvas was blank — scene failed to compile")

### Variable references in steps

- `{{previous.result.itemId}}` — the `result.itemId` from the previous step
- `{{previous_step.itemId}}` — alias for tracking the item across non-adjacent steps
- `{{assets.NAME}}` — asset paths from suite defaults

### When to use subjective tests

- Verifying **visual quality** (does the scene look right?)
- Verifying **creative workflows** (does the assembled video make sense?)
- Verifying **animation behavior** at specific frames
- Testing **multi-step workflows** where final output matters more than individual commands
- Any test where JSON assertions alone cannot prove correctness

---

## 7) How to Judge Each Test Type

## Contract tests

Purpose: validate **response shape**, presence of expected fields, and obvious type correctness.

Typical checks:

- `status == "success"`
- `result` exists
- required fields exist
- field types are sensible
- `editorHealth.commandSuccess == true`

Contract tests do **not** need deep timeline assertions unless the command is expected to mutate state.

## State tests

Purpose: verify command → state change.

Typical pattern:

1. execute mutation
2. call `query.getTimelineItems`, `query.getItemProperties`, or `project.getFullState`
3. assert the expected fields actually changed

Prefer:

- `query.getTimelineItems` for item existence/count/type
- `query.getItemProperties` for one-item property checks
- `project.getFullState` for deep project design inspection

## Visual tests

Purpose: verify user-visible correctness that JSON alone cannot prove.

Pattern:

1. seek to target time
2. capture screenshot
3. decode PNG to file
4. inspect image visually
5. score pass/fail against a fixed rubric

## Workflow tests

Purpose: multi-step flows where the final result matters more than any one command.

Pattern:

1. reset
2. run a short sequence of real commands
3. assert final response(s)
4. assert resulting state
5. assert screenshot quality

---

## 8) Screenshot Capture + Visual Evaluation

### Capture

```bash
ART="$HOME/.skilltown-desktop/test-artifacts/$RUN_ID"
mkdir -p "$ART"

curl -s "$BASE/api/screenshot" -H "$AUTH" | \
python3 -c '
import sys, json, base64, os
d=json.load(sys.stdin)
b64 = d.get("imageBase64") or d.get("image") or d.get("dataUrl") or d.get("data")
if not b64:
    raise SystemExit("No screenshot payload found")
if "," in b64:
    b64 = b64.split(",",1)[1]
out = os.path.expanduser("'"$ART"'/shot.png")
with open(out, "wb") as f:
    f.write(base64.b64decode(b64))
print(out)
'
```

### What the agent should look for

The agent should judge against **observable criteria**, not vibes.

Good visual checks:

- Is the main subject visible?
- Is the subject centered or intentionally framed?
- Is text readable against the background?
- Is any text clipped off-screen?
- Does the crop fill the canvas without obvious empty bars?
- Is the top/bottom split layout actually showing both speakers?
- Are colors/contrast good enough to read at a glance?

Bad visual checks:

- “Looks nice”
- “Feels polished”
- “Probably okay”

### Visual result rubric

Use this rubric:

- **PASS** — all explicit criteria satisfied
- **FAIL** — one or more criteria clearly violated
- **UNSURE** — ambiguous visual result; report as fail-with-uncertainty and explain what is unclear

### Example visual criteria

#### Caption readability

- text occupies safe area
- text is not cropped at left/right/bottom
- foreground/background contrast is high
- words are large enough to read on a phone-sized frame

#### Crop / reframe correctness

- face or speaker is inside frame
- eyes/head are not clipped
- empty side gutters are not the dominant visual
- in split mode, both speakers are visible and occupy separate halves

---

## 9) Required Post-Command Safety Checks

After every mutation command, inspect:

- `status`
- `warnings`
- `editorHealth`

If `editorHealth.status == "issues_found"`:

1. call `GET /api/diagnostics`
2. attach the relevant error details to the test result
3. fail the current test unless the test explicitly expects failure

Before finishing the suite, run:

```bash
curl -s "$BASE/api/diagnostics?full=true" -H "$AUTH"
```

If the suite leaves the sandbox broken, say so in the report.

---

## 10) Reporting Format

Report inline in chat with:

### A. Summary table

```md
| Status | ID | Category | Notes |
|---|---|---|---|
| PASS | contract.canvas-size | contract | width/height present |
| FAIL | visual.crop-video | visual | subject off-center in screenshot |
| SKIP | audio.eq | state | missing audio_sample asset |
```

### B. Totals

- Passed: N
- Failed: N
- Skipped: N

### C. Failure details only

For each failure include:

- test id
- command executed
- failed assertion(s)
- relevant response snippet
- relevant state snippet
- screenshot file path if visual

Keep success rows concise; expand only failures.

---

## 11) Invocation Rules

Map user requests to filters like this:

### “run all tests”

- load `testing/SKILL.md`
- load all suite files or at minimum `suites/bridge-smoke.yaml`
- run every test

### “run contract tests only”

- filter `category == contract`

### “run caption tests”

- filter `tags` containing `caption` or `text`

### “run crop tests”

- filter `tags` containing `crop` or `reframe`

### “run smoke suite”

- load `suites/bridge-smoke.yaml`

---

## 12) Practical Default Behavior

If the user gives no filter:

1. run the smoke suite
2. skip asset-dependent tests if required files are not provided
3. say exactly what was skipped and why

If the user provides asset paths in the prompt, the agent should substitute them into the suite before running.

---

## 13) Example Manual Command Pattern

This is the canonical mutation pattern:

```bash
curl -s -X POST "$BASE/api/execute" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "type": "editor.resize",
    "params": { "width": 1920, "height": 1080 },
    "tabId": "'"$TAB_ID"'"
  }'
```

Canonical read-only query:

```bash
curl -s -X POST "$BASE/api/execute" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "type": "query.getCanvasSize",
    "params": {},
    "tabId": "'"$TAB_ID"'"
  }'
```

---

## 14) Known Gotchas (from dry-run validation)

These were discovered during real test execution. The agent MUST follow these:

### Auth header requires `Bearer` prefix
```
Authorization: Bearer <token>
```
Without `Bearer`, the API returns `{"error": "unauthorized"}` even with a valid token.

### `editor.editItem` params format
**Correct:** `{"itemId": "...", "details": {"text": "...", "color": "..."}}`
**Wrong:** `{"id": "...", "updates": {"details": {...}}}` — returns `status: success` but silently does NOT apply changes.

### `query.getItemProperties` response shape
Properties are at `result.item.details.*`, not `result.details.*`.

### `query.getTimelineItems` response shape
Result is `{items: [...], count: N}`, NOT a direct array.
- Use `result.count` for item count assertions
- Use `result.items` for the array of items
- Use `result.items[0].type` etc. for item-level checks

### `query.getTrackInfo` response shape
Result is `{tracks: [...]}`, NOT a direct array.
- Use `result.tracks[0].id` for track ID access
- Each track: `{id, type, name, itemCount, items: [...]}`

### `editor.moveItem` needs both `from` AND `to`
The command requires `{itemId, from, to}` — both endpoints. Providing only `from` fails with "Invalid from/to values".

### `reframe.listPresets` works via both `/api/execute` and `GET /api/media/reframe/presets`
After the recent fix, `reframe.listPresets` is intercepted in `handleExecute` and returns presets directly.
It also works as the original HTTP endpoint `GET /api/media/reframe/presets`.

### `editor.undo` / `editor.redo` — fire-and-forget
These dispatch Redux actions (`HISTORY_UNDO`/`HISTORY_REDO`) and always return `{status: 'success'}` even if nothing was undone. The `loadDesign` reset between tests clears the undo stack, so undo/redo tests MUST create undo-able state in their setup steps first.

### Content creation needs login
`POST /api/content/create` requires the user to be logged in via the frontend. If it returns `{"error": "Login required"}`, use the existing active tab instead and reset with `editor.loadDesign`.

### After test run, restore the project
Always call `POST /api/reload` with `{"waitForReady":true}` after the test suite finishes so the user's original project is restored from the database.

---

## 15) Seed Suites

### Automated (deterministic) — status code + state assertions

| Suite | Tests | Coverage |
|-------|-------|----------|
| `suites/queries.yaml` | 27 | All query.* contract + state checks + diagnose + getTranscript |
| `suites/core-editing.yaml` | 26 | add/edit/delete/move/split/trim/clone/clear/export/template/relink/seek/preview |
| `suites/canvas-media.yaml` | 22 | position/align/rotate/z-index/opacity/volume/crop/resize/playback + media.validate/status/detectFaces |
| `suites/tracks.yaml` | 9 | mute/lock/hide/rename/move/link/unlink/editTrack |
| `suites/audio.yaml` | 6 | EQ presets/custom/remove, gain, loudness, noise profiles |
| `suites/animation-effects.yaml` | 10 | Basic animation in/out, keyframes, effects + transitions (add/addBetween/remove) |
| `suites/animations-full.yaml` | 25 | **Full preset matrix**: 5 enter + 2 exit + 3 loop + combos + keyframes (opacity/x/y/scale) + all 5 effects + remove |
| `suites/bulk-batch.yaml` | 6 | bulk style/delete/shift, batch.execute |
| `suites/project-undo.yaml` | 14 | undo/redo, save, loadDesign, snapshots (create/rename/restore/delete), metadata, loadFullState |
| `suites/captions-content.yaml` | 11 | apply/remove/style captions, transcription + content.applyImage/removeImage/setTranscript |
| `suites/reframe-media.yaml` | 6 | reframe apply/follow/keyframes, media validation |
| `suites/scenes.yaml` | 6 | Basic scene list/add/update, custom JSX, preview |
| `suites/remotion-scenes.yaml` | 18 | **All 3 scene types** + template.buildFromJSON multi-scene workflow |
| `suites/selection-groups.yaml` | 19 | select/deselect, groups, transitions, background, reorder, purge, audio mixing, preview range, diagnose |
| `suites/bridge-smoke.yaml` | 7 | Mixed representative smoke suite |
| `suites/video-media-workflows.yaml` | 17 | **Video trim, segments, chroma-key, clip state**; image add/style/replace; align/rotate/background; audio ducking; styled text/captions |
| `suites/rendering-multitab.yaml` | 17 | render capabilities/validate/verifyOutput, multi-tab list/create, snapshots, autosave, full state, advanced queries |
| `suites/storystudio.yaml` | 8 | **All storystudio.\* pipeline commands**: getPipelineState, getGroupings, getDecisions, generateGroupings/Decisions/Strings, searchImages, applyAssets |

### LLM-Driven (subjective) — agent judges quality via screenshots + reasoning

| Suite | Tests | Coverage |
|-------|-------|----------|
| `suites/llm-subjective.yaml` | 9 | Visual: custom scene renders, chart scene, animation midpoint; Workflow: video+text assembly, 3-scene presentation, styled captions, audio mix, vertical reframe, bundled noise scene |
| `suites/error-monitoring.yaml` | 7 | Diagnostics endpoints, error-free operations (text, animation, loop, scene, video CSP) |

**Total: 270 tests (254 automated + 16 LLM-subjective/error-monitoring)**

### How to run

```
"Run the bridge smoke tests"           → load bridge-smoke.yaml
"Run all automated tests"              → load all non-llm-subjective suites
"Run the visual/subjective tests"      → load llm-subjective.yaml
"Run scene tests"                      → load remotion-scenes.yaml + scenes.yaml
"Run animation tests"                  → load animations-full.yaml
"Run media/video tests"                → load video-media-workflows.yaml
"Run full E2E"                         → load ALL suites in order
```

### Test assets (required for media tests)

Located in `SkillTown-Desktop/test-assets/` (gitignored):
- `test-video-1080p.mp4` — 5s, 1920×1080, synthetic video with audio
- `test-clip-720p.mp4` — 2s, 1280×720
- `test-voice.m4a` — 3s, speech-like audio
- `test-music.m4a` — 5s, background music
- `test-image-1080p.png` — 1920×1080
- `test-image-portrait.png` — 1080×1920
- `test-speech-video.mp4` — short video with real speech
