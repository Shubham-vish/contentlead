# SkillTown Desktop — AI Agent Guide

> Control the SkillTown video editor from any AI terminal.

## ⚠️ MANDATORY Startup Protocol

**EVERY session must follow this protocol before ANY editing.** Do not skip steps.

### Step 0: Start the App (if not running)

The app loads the cloud frontend from `contentlead.in` by default. No local server needed.

```bash
# Check if app is already running
cat ~/.skilltown-desktop/api.json 2>/dev/null | python3 -c "
import sys,json,subprocess
d = json.load(sys.stdin)
r = subprocess.run(['kill', '-0', str(d['pid'])], capture_output=True)
if r.returncode == 0: print(f'RUNNING on port {d[\"port\"]} — origin: {d.get(\"appOrigin\",\"unknown\")}')
else: print('NOT RUNNING')
"

# If not running, launch:
# Production (packaged .app):
open /Applications/ContentLead.app

# Development (CURRENT — use this):
cd /Users/shubham/Codes/SkillTown-Desktop && npm run dev
# Or point to local Next.js dev server:
cd /Users/shubham/Codes/SkillTown-Desktop && npm run dev -- --url=http://localhost:3000

# ⚠️ Port and token CHANGE every restart — always re-read api.json
```

#### Switching between cloud and local dev at runtime

You can switch the frontend origin without restarting the app:

```bash
# Switch to local dev server (must be running on localhost:3000)
curl -X POST http://127.0.0.1:$PORT/api/app/set-origin \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"origin": "local"}'

# Switch back to cloud
curl -X POST http://127.0.0.1:$PORT/api/app/set-origin \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"origin": "cloud"}'

# Check current origin
curl http://127.0.0.1:$PORT/api/app/origin -H "Authorization: Bearer $TOKEN"

# Shortcut names: "cloud" | "local" | "local-ip" | any full URL
# After switching, wait for editor: POST /api/editor/wait-ready
```

### Step 1: Connect
```bash
API=$(cat ~/.skilltown-desktop/api.json)
PORT=$(echo $API | python3 -c "import sys,json; print(json.load(sys.stdin)['port'])")
TOKEN=$(echo $API | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
```

### Step 2: Health check — STOP if not healthy
```bash
curl -s http://127.0.0.1:$PORT/api/health -H "Authorization: Bearer $TOKEN"
# Check: editor.ready == true, media.serverActive == true
```

### Step 3: Run unified diagnostics — FIX before proceeding
```bash
curl -s "http://127.0.0.1:$PORT/api/diagnostics?full=true" -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f'Status: {d[\"status\"]} — {d[\"summary\"]}')
print(f'Editor: ready={d[\"editorReady\"]}, content={d.get(\"contentId\",\"none\")}')
"
# If status is 'issues_found', fix all errors before editing
# Common fixes:
#   - ERR_CONNECTION_REFUSED on media URLs → media URLs have stale port, reload project
#   - Blob URL errors → media needs re-adding
#   - React errors → reload the page via POST /api/reload
```

### Step 4: Open content if editor not ready
```bash
# List available content
curl -s "http://127.0.0.1:$PORT/api/content/list" -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys,json; d=json.load(sys.stdin)
for item in d.get('items',[]):
    print(f'{item[\"contentId\"]} — {item.get(\"title\",\"untitled\")} [{item.get(\"source\")}]')
"

# Navigate to editor + wait + auto-restore
curl -s -X POST "http://127.0.0.1:$PORT/api/navigate" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"url": "/content/<contentId>", "waitForReady": true, "autoRestore": true, "timeoutMs": 120000}'
# Auto-appends ?view=editor, waits for compilation + editor mount, restores autosave
```

### Step 5: Wait for DB content to fully load (NEW PROJECTS)

**⚠️ Race condition warning:** After navigating to a newly created project, `editorReady=true` fires when the editor component mounts, but the content data is still loading from the database asynchronously. If you add items before the DB fetch completes, the DB data (empty design) will **overwrite** all your additions.

```bash
# After navigation completes, wait for DB content load:
sleep 10  # Must wait 8-12 seconds after editorReady for new projects

# Then verify canvas size before adding anything:
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type": "query.getCanvasSize", "params": {}}'
# → {"width": 1080, "height": 1920} — if wrong, resize first!
```

### Step 6: NOW you can start editing
```bash
curl -s http://127.0.0.1:$PORT/api/skills/overview -H "Authorization: Bearer $TOKEN"
```

### ⚠️ CRITICAL: Always save before killing or restarting the app

**You MUST call `editor.save` before ANY of these actions:**
- Killing/terminating the app process
- Rebuilding and reinstalling the app
- Restarting the app for any reason
- Running tests that may restart the app

```bash
# Save to cloud DB (always do this first)
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type": "editor.save", "params": {}}'

# Verify save succeeded before proceeding
# Response: {"status":"success","result":{"saved":true}}
```

The autosave timer writes to local `.skilltown` files periodically, but this does NOT save to the cloud DB. If you kill the app without `editor.save`, any work since the last autosave tick is lost locally, and ALL work is lost from the cloud perspective.

### Common startup issues & auto-fixes

| Error Pattern | Cause | Fix |
|---|---|---|
| `ERR_CONNECTION_REFUSED` on `127.0.0.1:3000` | Only if using `origin: "local"` — local Next.js dev server not running | Start Next.js (`cd SkillTown && npm run dev`) or switch back to cloud: `POST /api/app/set-origin {"origin":"cloud"}` |
| `ERR_CONNECTION_REFUSED` on `127.0.0.1:XXXXX/media` | Media server port changed after restart | Reload project — URLs are auto-healed on load |
| Audio waveforms gone / no playback after restart | Audio URLs used stale `/api/local-file` port | Auto-healed: `rewriteMediaUrlPort()` converts `/api/local-file` → `/media` on editor load |
| `blob:` URL errors | Blob URLs don't survive page reloads | Re-add the media from local file path |
| Editor not ready after 120s | First-time compilation (13,700 modules) | Wait longer; subsequent loads are <1s |
| Editor not ready (stuck) | Editor component not mounted | `POST /api/navigate` with `waitForReady: true` |
| Timeline validation errors | Orphaned items or gaps | `editor.deleteItems` for orphans, `editor.removeGaps` for gaps |
| Media inaccessible | File moved/deleted | Remove item or provide new file path |
| Port/token mismatch | App restarted, old api.json cached | Re-read `~/.skilltown-desktop/api.json` |

### New Infrastructure API Endpoints

These endpoints are available on the Electron API server (in addition to `POST /api/execute` for editor commands):

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check — editor ready, media server status, error counts |
| `/api/diagnostics?full=true` | GET | Unified diagnostic check — console errors, scene errors, timeline issues |
| `/api/screenshot` | GET | Capture screenshot of the Electron window (returns PNG) |
| `/api/navigate` | POST | Navigate to a URL — `{url, waitForReady, autoRestore, timeoutMs}` |
| `/api/tabs` | GET | List all open tabs and the active `tabId` |
| `/api/tabs/new` | POST | Open a new tab — `{url}` or `{contentId}` |
| `/api/tabs/:id/activate` | POST | Switch focus to a specific tab |
| `/api/tabs/:id/close` | POST | Close a specific tab |
| `/api/content/create` | POST | Create new content in CosmosDB — `{title, description}` → creates DB record + navigates to editor |
| `/api/content/list` | GET | List available content (DB + local autosaves) |
| `/api/bridge/instagram/*` | GET/POST | MCP mirror bridge for Instagram accounts, publish/status, token validation, posts, and CTA automation (`update_cta` supports `messageBody` + `buttons[]`; publish status auto-syncs CTA draft → production) |
| `/api/bridge/youtube/*` | POST | MCP mirror bridge for YouTube publishing |
| `/api/bridge/content/*` | POST | MCP mirror bridge for content publish configuration |
| `/api/bridge/context/*` | GET/POST | MCP mirror bridge for context store list/search/get/edit/manage |
| `/api/bridge/learn/*` | GET/POST | MCP mirror bridge for Learn/KB list/search/get/edit/manage/categories |
| `/api/project/create` | POST | Create local project file (autosave only, no DB) |
| `/api/project/save` | POST | Save current project to file |
| `/api/project/save-autosave` | POST | Save current project to canonical autosave file |
| `/api/media/import` | POST | Import media file — `{filePath}` → serves via media server |
| `/api/media/analyze` | POST | Analyze media file metadata (duration, resolution, codec) |
| `/api/render` | POST | Start render job; supports presets or `{renderType:"design", data:{...}, contentId, uploadToCloud:true}` to upload MP4 + thumbnail and update Content URLs |
| `/api/render/:jobId` | GET | Poll render job status, including `cloudVideoUrl`, `thumbnailUrl`, and `contentUpdated` after cloud upload |
| `/api/console-errors` | GET | Get buffered console errors from the renderer |
| `/api/reload` | POST | Force-reload the renderer page |

### Content Creation Flow

To create new content programmatically:
```bash
# Create content in CosmosDB + auto-navigate to editor
curl -s -X POST "http://127.0.0.1:$PORT/api/content/create" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title": "My Video", "description": "A cool video"}'
# Returns: {status, contentId, navigated}
# ⚠️ Then wait 10-12s for DB content load (see Step 5)
```

## 🔍 MANDATORY Error Monitoring Protocol

**AI agents MUST monitor for errors continuously — not just at startup.** The user should NEVER have to report an error that the agent could have caught.

### When to Check for Errors

| Trigger | What to Check |
|---|---|
| **After EVERY command** | Check response `status` field — if `"failed"`, diagnose and fix immediately |
| **After adding scenes** | Run `query.diagnoseScenes` — scenes crash silently with bad props |
| **After batch operations** | Check ALL results in the batch — don't assume success |
| **After adding 3+ items** | Run `GET /api/console-errors` to catch rendering errors |
| **After seeking/playing** | Run `GET /api/console-errors` to catch playback errors |
| **Before presenting results to user** | Run full diagnostic (below) |

### ⚠️ editorHealth — Check EVERY command response

Every command response includes an `editorHealth` object. **Always read it:**
```json
{
  "editorHealth": {
    "status": "clean",           // or "issues_found"
    "commandSuccess": true,
    "newConsoleErrors": 0,       // errors since last command
    "totalConsoleErrors": 2,
    "currentSceneErrors": 0,     // ← CHECK THIS after adding scenes
    "errorGroups": []
  }
}
```
**If `currentSceneErrors > 0` after adding a scene → the scene has bad props. Run `query.diagnoseScenes` immediately, fix or delete the broken scene.**

### Full Diagnostic Check (run after every editing session)

**💾 Before running diagnostics at the end of a session, always save first:**
```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type": "editor.save", "params": {}}'
```

```bash
# PREFERRED: Single unified diagnostics check (replaces 4 separate calls)
curl -s "http://127.0.0.1:$PORT/api/diagnostics" -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f'Status: {d[\"status\"]} — {d[\"summary\"]}')
if d.get('console',{}).get('errorCount',0):
    for e in d['console']['errors']:
        print(f'  [console] {e[\"message\"][:120]}')
if d.get('scenes',{}).get('count',0):
    for e in d['scenes']['errors']:
        print(f'  [scene] {e}')
"

# With ?afterSeq=N — only errors since last check (use lastSeq from previous call)
curl -s "http://127.0.0.1:$PORT/api/diagnostics?afterSeq=42" -H "Authorization: Bearer $TOKEN"

# With ?full=true — also includes timeline validation and media health (slower)
curl -s "http://127.0.0.1:$PORT/api/diagnostics?full=true" -H "Authorization: Bearer $TOKEN"
```

**How proactive error detection works:**
1. Every command response includes `warnings` array + `hasNewErrors` flag + `diagnosticsCursor` seq number
2. Scene-affecting commands (`scene.addLibraryScene`, `editor.addVideo`, etc.) wait 500ms after execution to catch async render errors
3. `GET /api/diagnostics?afterSeq=N` gives you only NEW errors since your last check
4. SSE stream emits `error.console` events in real-time

**Agent workflow for zero-surprise editing:**
```
1. Save diagnosticsCursor from first command response
2. After each command, check response.hasNewErrors
3. If hasNewErrors: call /api/diagnostics?afterSeq=<cursor> to get details
4. Before presenting results to user: call /api/diagnostics?full=true
```

### Individual diagnostic endpoints (if you need granular access)

```bash
# 1. Console errors — catches runtime crashes, React errors, scene failures
curl -s "http://127.0.0.1:$PORT/api/console-errors" -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); errors=[e for e in d.get('entries',[]) if e.get('level')=='error']; print(f'Errors: {len(errors)}'); [print(f'  {e[\"message\"][:120]}') for e in errors]"

# 2. Scene runtime errors — catches scenes that crash during rendering
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"query.getSceneErrors","params":{}}' | python3 -c "import sys,json; d=json.load(sys.stdin); r=d.get('result',{}); print(f'Scene errors: {r.get(\"count\",0)}')"

# 3. Timeline validation — catches orphaned items, gaps, broken references
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"query.validateTimeline","params":{}}' | python3 -m json.tool

# 4. Media health — catches stale URLs, missing files
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"media.status","params":{}}' | python3 -c "import sys,json; d=json.load(sys.stdin); r=d.get('result',{}); print(f'Media items: {r.get(\"totalMediaItems\",0)}, Broken: {r.get(\"brokenCount\",0)}')"
```

### Scene Props Validation

**CRITICAL**: When adding library scenes, ALWAYS check what props the scene requires:

```bash
# Check required props BEFORE adding a scene
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"scene.getSceneProps","params":{"sceneId":"HeatmapScene"}}'
```

Common scene prop mistakes that cause crashes:
| Scene | Required Prop | Type | Crash if Missing |
|---|---|---|---|
| HeatmapScene | `data`, `rowLabels`, `colLabels` | `number[][]`, `string[]`, `string[]` | ✅ FIXED — has defaults now |
| LineChartScene | `dataPoints`, `xLabels` | `number[]`, `string[]` | ✅ `Math.max(...undefined)` |
| PieChartScene | `slices` | `{label, value, color}[]` | ✅ `slices.reduce is not a function` |
| DonutChartScene | `segments` | `{label, value, color}[]` | ✅ `.map is not a function` |
| BarRaceScene | `rounds`, `barColors` | `{label, values}[]`, `Record` | ✅ `outputRange must contain only numbers` |
| MetricDashboard | `metrics` | `{label, value, change?, prefix?}[]` | ✅ Undefined map |
| StarfieldWarp | — | — | ❌ Safe — no required array props |

**Scenes with defensive defaults** (won't crash if props missing): HeatmapScene, StarfieldWarp.
**Scenes WITHOUT defaults** (WILL crash): LineChartScene, PieChartScene, DonutChartScene, BarRaceScene, MetricDashboard, and most others.

**Rule**: If unsure about scene props, check `scene.getSceneProps` first. If scene still crashes, it's a defensive-coding gap — fix the scene component to use defaults.
**After adding any scene**, seek to its time range and check `editorHealth` for render errors — scenes crash silently.

### Error Recovery Procedures

| Error Type | Detection | Fix |
|---|---|---|
| Scene crash (`data.map is not a function`) | `query.getSceneErrors` or console errors | Update scene props: `scene.updateSceneProps` with valid data, or delete the item |
| `getCurrentFrame returned NaN` | Console warnings (98x+) | Usually harmless pre-existing bug; if excessive, reload editor |
| `setPositionState non-finite` | Console error | Playback state issue; pause and re-seek |
| `outputRange must contain only numbers` | Console error | Scene animation prop is wrong type; fix scene props or scene code |
| Delete returns success but items persist | Check state after delete | Use `editor.purgeItems` as fallback |

### editorHealth in Command Responses

Every `/api/execute` response includes `editorHealth`. **READ IT after every command:**

```json
{
  "editorHealth": {
    "status": "clean" | "issues_found",
    "commandSuccess": true,
    "newConsoleErrors": 0,
    "totalConsoleErrors": 0,
    "currentSceneErrors": 0,
    "commandCorrections": [],
    "errorGroups": [{ "source": "console", "type": "TypeError", "count": 2 }],
    "firstError": { "source": "scene", "message": "Cannot read properties..." },
    "hint": "GET /api/diagnostics for details"
  }
}
```

**Workflow:** If `status === "clean"` → proceed. If `"issues_found"` → STOP and fix.
Check `commandCorrections` — the API may have auto-fixed your params (see Smart Param Corrections below).

### Smart Param Auto-Corrections

The API auto-fixes common param mistakes and reports what was fixed in `commandCorrections`:

| Mistake | Auto-Fix |
|---|---|
| `editor.editItem({borderWidth: 4})` | Wraps in `details: {borderWidth: 4}` |
| `editor.trimItem({from: 1000, to: 8000})` | Wraps in `trim: {from: 1000, to: 8000}` |
| `editor.setVolume({volume: 150})` | Clamps to 100 |
| `scene.addLibraryScene({sceneId: "StarfieldWarp"})` | Appends "Scene" suffix |
| `scene.addLibraryScene({sceneId: "starfieldwarpscene"})` | Case-corrects |

**Properties auto-wrapped into `details` for `editor.editItem`:**
`borderWidth`, `borderColor`, `borderRadius`, `volume`, `opacity`, `blur`, `brightness`,
`flipX`, `flipY`, `rotate`, `visibility`, `boxShadow`, `transform`, `fontWeight`,
`fontSize`, `fontFamily`, `color`, `text`, `width`, `height`, `top`, `left`

### Post-Command Duration Validation

For `addAudio`, `addVideo`, `addImage` — if you pass a `duration` param, the API validates that the created item's actual duration matches. If >20% mismatch, a warning with a `fixCommand` is returned.

### Proactive Error Detection Architecture

```
Layer 1: Command responses → editorHealth + warnings[] + diagnosticsCursor
Layer 2: GET /api/diagnostics → ?afterSeq=N (cheap delta) or ?full=true (deep check)
Layer 3: SSE /api/events → real-time push (error.console, command.failed)
```

When to call `/api/diagnostics` directly:
- Before presenting results to user → `?full=true`
- Investigating `editorHealth.status: "issues_found"` → `?afterSeq=<cursor>`

## 🔧 Known Infrastructure Issues & Enhancement Backlog

### Bugs That Were Fixed (code changes applied)

| Issue | Root Cause | Fix Applied | File |
|---|---|---|---|
| Scenes always portrait (1080×1920) | 5 hardcoded `width: 1080, height: 1920` in scene handlers | Added `getSceneDimensions()` that reads canvas size from zustand store | `commandExecutorScenes.ts` |
| `setAnimation` only applied fadeIn | Handler hardcoded `fadeIn` default + `property: 'opacity'` only | Rewrote with full preset→composition mapping (scale, slide, zoom, fade) | `transformHandlers.ts` |
| Animation in+out dispatch race | Dispatching both together: `out` overwrites `in` | Dispatch `out` first (40ms wait), then `in` separately | `transformHandlers.ts` |
| **TypeError: reading 'from'** | `@designcombo/animations` MaskAnim accesses `item.display.from` without null check | Wrapped `item` prop with display fallback in all 4 item renderers | `image.tsx`, `video.tsx`, `illustration.tsx`, `shape.tsx` |
| **Player crash on undefined display** | Multiple render paths access `item.display.from` without guards | Added null-safety to `calculateFrames`, `base-sequence`, `composition`, `template`, `audio-data`, all item renderers | 10+ files |
| **BoxAnim crash: reading 'from'** | `animations!` non-null assertion crashes when animations undefined; `getSlideAnimation()` returns undefined entries that crash BoxAnim's internal `c.from` filter | Replaced `animations!` with safe null-check + `.filter(Boolean)` sanitize in ALL 6 renderers; fixed `get-animations.tsx` to null-check slide results and optional-chain `.composition` | `get-animations.tsx`, `text.tsx`, `image.tsx`, `video.tsx`, `illustration.tsx`, `shape.tsx`, `caption.tsx` |

### Known Bugs Still Open

| Issue | Severity | Description | Workaround |
|---|---|---|---|
| **Animations don't persist** | HIGH | `setAnimation` works in-session but animations are lost on save/restore | Re-apply animations after every project restore |
| ~~Volume >100~~ | N/A | **Not a bug** — volume >100 is intentional (amplification/boost feature) | Use `query.getAudioLoudness` to verify levels |
| **`orientation` param ignored** | LOW (fixed) | `orientation` only sets metadata, never affected actual scene dimensions | Now auto-derived from canvas, but param still misleading |
| **HMR breaks after code changes** | MEDIUM | Hot module replacement can leave broken state after modifying handler code | Full app restart (`kill all + npm run dev:with-server`) required |
| **Placement returns empty `{}`** | MEDIUM | `placement` on text items is ignored — all text centers by default | Use `editor.positionItem` or combine text into single blocks |

### Enhancements Needed

| Enhancement | Priority | Description |
|---|---|---|
| **Animation persistence** | HIGH | Serialize `animations` object in save/restore path so animations survive reload |
| **Track auto-reorder on build** | MEDIUM | Auto-call `reorderTracks` after batch scene+text additions |
| **Bundled scene error recovery** | LOW | If esbuild compile fails, provide better error messages with line numbers |

## Quick Start

```bash
# 1. Read connection info
cat ~/.skilltown-desktop/api.json
# → {"port": 3847, "token": "abc...", "baseUrl": "http://127.0.0.1:3847", "editorReady": true}

# 2. Check readiness (no auth needed)
curl http://127.0.0.1:$PORT/api/info

# 3. Load the overview skill for full capabilities
curl http://127.0.0.1:$PORT/api/skills/overview -H "Authorization: Bearer $TOKEN"
```

## Skills System

This editor uses **modular skill docs** — don't try to learn everything at once. Load only what you need.

### How to use skills

```bash
# List all available skills
curl http://127.0.0.1:$PORT/api/skills -H "Authorization: Bearer $TOKEN"

# Load a specific skill by name
curl http://127.0.0.1:$PORT/api/skills/text-and-captions -H "Authorization: Bearer $TOKEN"

# Search skills by keyword
curl "http://127.0.0.1:$PORT/api/skills?q=animation" -H "Authorization: Bearer $TOKEN"
```

### Recommended flow

1. **Always start** with `overview` — it lists all commands briefly
2. **Load specific skills** based on your task:

| Task | Skill to load |
|------|---------------|
| First time connecting | `getting-started` |
| Adding/styling text or captions | `text-and-captions` |
| Animations, keyframes, effects | `animations-and-effects` |
| Position, align, rotate, layers | `canvas-and-positioning` |
| Images, video, audio, volume | `media-and-audio` |
| Move, trim, split, delete, bulk ops | `timeline-operations` |
| Scene library, custom Remotion scenes | `scenes-and-templates` |
| Write custom .tsx scenes (full freedom) | `custom-scene-authoring` |
| Advanced scenes with imports (@remotion/*) | See "Bundled Scenes" section below |
| Video with effects (Ken Burns, 3D, color grade) | See "Bundled Scenes → Video with Effects" below |
| **Remotion deep knowledge** | `remotion/SKILL` (index) → loads topic-specific rules |
| Sandbox rules (MUST read for custom scenes) | `remotion/rules/sandbox-rules` |
| Animation helpers (fadeIn, springPop, etc.) | `remotion/rules/animation-helpers` |
| Shared components (backgrounds, overlays) | `remotion/rules/components` |
| Complete scene patterns (ready to paste) | `remotion/rules/patterns` |
| Scene API commands (add/list/preview) | `remotion/rules/scene-commands` |
| Scene catalog & selection guide | `remotion/rules/scene-catalog-guide` |
| Camera presets, 4-phase motion, BREATHE | `remotion/rules/camera-engine` |
| Transitions (LightLeaks) & 7 caption styles | `remotion/rules/transitions-and-captions` |
| SFX search, voiceover, volume guidelines | `remotion/rules/sfx-and-audio` |
| Creative workflow & planning philosophy | `remotion/rules/creative-approach` |
| Render videos locally | `rendering` |
| **🎯 End-to-end video creation** | **`orchestration-e2e`** — master 8-phase pipeline |
| AI B-roll pipeline (5 steps) | `storystudio-pipeline` |
| Apply/remove images & captions | `content-bridge` |
| Save, export, resize, tracks | `project-and-export` |
| **AI image generation, vision, TTS** | `prepwithai/SKILL` |
| **Transcribe video + Hinglish captions** | `transcription-and-editing` (Firebase polling + Latin transliteration) |
| Read state, timeline, transcript | `queries-and-state` |
| Save/load .skilltown project files | `project-files` |
| **🎯 AI viral clipping pipeline** | **`ai-clipping`** — transcribe → score virality → extract clips → reframe → render |
| **📝 Script evaluation & writing** | **`script-evaluator`** — score scripts 0-100, rewrite hooks, write viral scripts |

## Architecture

```
AI Terminal → reads ~/.skilltown-desktop/api.json → gets port + token
           → curl GET /api/health → checks app health
           → curl GET /api/app/origin → checks cloud vs local-dev mode
           → curl GET /api/content/list → discovers available content
           → curl POST /api/navigate → opens content in editor (auto-activates editor view)
           → curl POST /api/editor/wait-ready → waits for editor mount
           → curl POST /api/project/restore → restores saved project from autosave
           → curl GET /api/skills/overview → understands capabilities
           → curl POST /api/execute → sends commands to editor
           → curl POST /api/scenes → create custom .tsx scenes
           → curl POST /api/scene-bundles/build → compile scenes with real imports
           → curl POST /api/render → render locally via Remotion; with contentId/uploadToCloud, upload MP4 + thumbnail and update Content URLs
           → Electron main process → IPC → renderer → DesignCombo editor

Hybrid architecture:
  Cloud (contentlead.in)  →  Frontend UI, auth, database, content library
  Local (Electron)        →  Video rendering (Remotion+FFmpeg), file access, media server, AI API
  
  Switch at runtime: POST /api/app/set-origin {"origin": "local"} or {"origin": "cloud"}
```

> **Scope note:** This guide documents the recommended command/API subset for AI agents. It is curated, not exhaustive. Additional commands and endpoints exist — use `GET /api/skills` at runtime for the full current surface, or `GET /api/capabilities` for endpoint discovery.

## Navigation & Content Discovery

### Discovery file (v4)
```bash
cat ~/.skilltown-desktop/api.json
# → {"schemaVersion":4, "port":54110, "token":"abc...", "baseUrl":"http://127.0.0.1:54110",
#    "apiOrigin":"http://127.0.0.1:54110", "appOrigin":"https://contentlead.in",
#    "mediaServerPort":54109, "editorReady":false, "activeTabId":"tab-abc",
#    "tabs":[{"tabId":"tab-abc","contentId":"content_abc","title":"My Video",
#             "url":"/content/content_abc?view=editor","active":true,"ready":false}], ...}
```
- `apiOrigin` — the local API server (always localhost)
- `appOrigin` — the frontend origin (cloud `contentlead.in` or local dev `localhost:3000`)
- `tabs[]` — all open projects/tabs; use `tabId` from this array to target commands
- Top-level `contentId` / `editorReady` describe the ACTIVE tab only

### Health check
```bash
curl http://127.0.0.1:$PORT/api/health -H "Authorization: Bearer $TOKEN"
# → {"status":"healthy"|"degraded"|"error", "editor":{ready,contentId,stateVersion,capabilities},
#    "navigation":{currentURL,appOrigin}, "media":{serverPort,serverActive},
#    "project":{autosaveExists,autosavePath}, "errors":{recentCount,totalBuffered}, "api":{port,uptime}}
```
- `healthy` = editor ready, no recent errors
- `degraded` = editor not ready OR recent errors exist
- `error` = critical issues

### List available content
```bash
curl http://127.0.0.1:$PORT/api/content/list -H "Authorization: Bearer $TOKEN"
# → {"items":[{"contentId":"content_abc...","title":"My Video","source":"remote","editorUrl":"/content/content_abc...?view=editor","hasLocalAutosave":true,...}],
#    "count":5, "remoteCount":4, "localCount":1, "currentContentId":"content_abc...", "editorReady":true}
```
Returns content from **two sources**:
- `remote` — user's cloud content library (fetched from Next.js `/api/content`)
- `local` — local-only autosave files in `~/.skilltown-desktop/projects/`

Each item includes `editorUrl` — pass it to `/api/navigate` to open.

### Navigate to content (opens editor automatically)
```bash
# Quick open — navigates and returns immediately
curl -X POST http://127.0.0.1:$PORT/api/navigate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "/content/content_abc..."}'

# Full open — waits for editor + restores autosave
curl -X POST http://127.0.0.1:$PORT/api/navigate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "/content/content_abc...", "waitForReady": true, "autoRestore": true, "timeoutMs": 30000}'
```
**⚠️ Always use `autoRestore: true`** — without it, the editor opens empty even if an autosave exists.

**AI Agent workflow for opening a content:**
```
1. GET /api/content/list → find the contentId you want
2. POST /api/navigate with {url: item.editorUrl, waitForReady: true, autoRestore: true}
3. Wait for response (blocks until editor is ready + autosave restored)
4. GET /api/diagnostics → verify clean state before editing
```

### Get navigation state
```bash
curl http://127.0.0.1:$PORT/api/navigation -H "Authorization: Bearer $TOKEN"
# → {"currentURL":"http://...", "path":"/content/...", "contentId":"content_abc...",
#    "editorReady":true, "editorContentId":"content_abc...", "canGoBack":true, "title":"..."}
```

### Wait for editor readiness
```bash
curl -X POST http://127.0.0.1:$PORT/api/editor/wait-ready \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"timeoutMs": 15000, "expectedContentId": "content_abc..."}'
```
Blocks until `ElectronAgentBridge` signals the editor is mounted and ready for commands.

### Restore a saved project
```bash
curl -X POST http://127.0.0.1:$PORT/api/project/restore \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contentId": "content_abc..."}'
```
Loads the autosave `.skilltown` file and sends `editor.loadDesign` to restore the full timeline.

### Origin switching (cloud ↔ local dev)

Switch the app between cloud production and local development server at runtime:

```bash
# Check current origin
curl http://127.0.0.1:$PORT/api/app/origin -H "Authorization: Bearer $TOKEN"
# → {"origin":"https://contentlead.in", "mode":"cloud", "shortcuts":{"cloud":"https://contentlead.in","local":"http://localhost:3000","local-ip":"http://127.0.0.1:3000"}}

# Switch to local dev (Next.js must be running on localhost:3000)
curl -X POST http://127.0.0.1:$PORT/api/app/set-origin \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"origin": "local"}'
# → {"success":true, "previousOrigin":"https://contentlead.in", "activeOrigin":"http://localhost:3000", "mode":"local-dev", "navigated":true}

# Switch to custom port
curl -X POST http://127.0.0.1:$PORT/api/app/set-origin \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"origin": "http://localhost:3001"}'

# Switch back to cloud
curl -X POST http://127.0.0.1:$PORT/api/app/set-origin \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"origin": "cloud"}'
```

| Shortcut | Resolves to |
|----------|-------------|
| `cloud` | `https://contentlead.in` |
| `local` | `http://localhost:3000` |
| `local-ip` | `http://127.0.0.1:3000` |

**Options:**
- `navigate` (default `true`) — reload window to new origin
- `path` (default `"/content"`) — path to load after switch

**After switching:** use `POST /api/editor/wait-ready` to wait for the editor to reinitialize. CORS is automatically updated and the discovery file (`api.json`) is refreshed with the new `appOrigin`.

### Typical AI workflow
> **Multi-tab note:** When multiple tabs are open, resolve your target `tabId` from `~/.skilltown-desktop/api.json` or `GET /api/tabs`, then include it in every `/api/execute` body. See [`skills/contentlead/multi-tab.md`](skills/contentlead/multi-tab.md).
> **⚠️ Multi-tab validation:** If multiple tabs are open, `/api/execute` REQUIRES `tabId` in the body. Omitting it returns HTTP 409 with the full tab list — pick the right one and retry.

```bash
# 1-5. Follow the MANDATORY Startup Protocol above (health, errors, validate, media check)

# 6. Find content to edit
curl http://127.0.0.1:$PORT/api/content/list -H "Authorization: Bearer $TOKEN"

# 7. Navigate + wait + restore (all in one call)
curl -X POST http://127.0.0.1:$PORT/api/navigate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "/content/content_abc...", "waitForReady": true, "autoRestore": true}'

# 8. Re-run error check after loading project (media URLs may be stale)
curl -s "http://127.0.0.1:$PORT/api/console-errors?level=error&clear=true" -H "Authorization: Bearer $TOKEN"
# Wait 2 seconds for async media errors
sleep 2
curl -s "http://127.0.0.1:$PORT/api/console-errors?level=error" -H "Authorization: Bearer $TOKEN"

# 9. Start editing
curl -X POST http://127.0.0.1:$PORT/api/execute ...

# 10. After EVERY batch of edits, check for errors
curl -s "http://127.0.0.1:$PORT/api/console-errors?level=error&afterSeq=LAST_SEQ" -H "Authorization: Bearer $TOKEN"

# 11. 💾 Save periodically — after each phase of work or every 5-10 commands
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type": "editor.save", "params": {}}'
# → {"status":"success","result":{"saved":true}}
```

## Error Handling & Verification

### 🔴 CRITICAL RULE: Never ignore errors

The AI agent MUST:
1. **Check errors at startup** — before any editing (see Startup Protocol)
2. **Check `editorHealth` in EVERY command response** — it's embedded in every response
3. **Check errors after media/scene commands** — wait 2s, then check `/api/diagnostics`
4. **Check errors before saving** — run `validateTimeline` and `media.status`
5. **💾 Save your work** — call `editor.save` after completing edits and before rendering. Also save periodically during long editing sessions (every 5-10 commands, or after completing each phase of work).
6. **Check errors before rendering** — run `render.validate`
6. **Self-heal before user sees errors** — if errors are detected, fix them immediately or try a different approach

If errors are found, **STOP and fix them** before continuing. Do not accumulate errors.

### ⚠️ MANDATORY: Post-Command Validation Protocol

**After EVERY command that modifies the timeline**, the AI MUST:

```
1. Read `editorHealth` from the command response:
   - status: "clean" → proceed
   - status: "issues_found" → STOP and diagnose
   
2. If issues_found:
   a. Check `currentSceneErrors` — if > 0, the scene code is broken
   b. Check `firstError.message` — understand what crashed
   c. Call GET /api/diagnostics for full details
   d. FIX the error immediately (delete broken item, recreate differently)
   e. Verify fix: run another command and check editorHealth is "clean"

3. After adding bundled scenes (scene.addBundledScene):
   a. Wait 1 second for async compilation
   b. Seek playhead to the scene's time range: editor.seekTo(fromMs + 100)
   c. Check editorHealth — scene render errors appear only when the scene is visible
   d. If scene errors: DELETE the broken scene and try a DIFFERENT approach

4. After batch operations (3+ items):
   a. Seek through timeline checking each scene: seek to 0s, 5s, 10s, etc.
   b. At each position, check editorHealth for scene errors
   c. Fix any errors found before proceeding
```

### Critical Learnings: What NOT To Do

| Anti-pattern | What happens | Correct approach |
|---|---|---|
| **Embed base64 data URIs in bundled scene code** | Query response truncates long strings → broken images → white screen | Save images to ~/Downloads, serve via media server URL |
| **Delete many items at once** | Editor goes into `not_ready` state, rollback | Delete one at a time with 1s pause between |
| **Ignore `editorHealth` in responses** | Errors accumulate, user sees crashes | Check `editorHealth.status` after EVERY command |
| **Assume query.getState returns full data** | It may return empty/partial during transient states | Use `query.getTimelineItems` (more reliable) |
| **Use `query.getState` to get image URLs** | Long base64 strings get truncated | Images served via media server don't need base64 |
| **Skip seek-test after adding scenes** | Scene render errors only appear when scene is visible | Always seek to new scene's time and check health |
| **Use `animations!` non-null assertion** | Crashes when item has no animations (transient states, new items) | Always check `animations ?` before calling `getAnimations()`, sanitize results with `.filter(Boolean)` |

### Known Null-Safety Issues in @designcombo/animations

The `MaskAnim` component from `@designcombo/animations` directly accesses `item.display.from` without null checks (line 306 in compiled code). During transient states (item add/delete), `item.display` can be undefined.

**Permanent fix applied**: All `MaskAnim` usages now wrap the `item` prop:
```tsx
item={item.display ? item : { ...item, display: { from: 0, to: 1000 } }}
```
Files fixed: `image.tsx`, `video.tsx`, `illustration.tsx`, `shape.tsx`

**Additional guards applied**: `calculateFrames()`, `base-sequence.tsx`, `composition.tsx`, `template.tsx`, `audio-data.ts`, `caption.tsx` — all now handle `undefined` display gracefully.

### Known Null-Safety Issues in getAnimations / BoxAnim

`BoxAnim` (also from `@designcombo/animations`) internally does `c.from !== void 0` on animation array entries. If an entry is `undefined`, it throws "Cannot read properties of undefined (reading 'from')".

**Two root causes fixed**:
1. **`animations!` non-null assertion** — all 6 item renderers used `animations!` which crashes when `animations` is undefined. Now all check `animations ?` before calling `getAnimations()`.
2. **`getSlideAnimation()` returning undefined** — if a slide type doesn't match any if/else branch, `undefined` is pushed to the array. Now `get-animations.tsx` null-checks the result, and all renderers sanitize with `.filter(Boolean)`.

**Pattern applied in ALL renderers**:
```tsx
const _sanitize = (a: any) => Array.isArray(a) ? a.filter(Boolean) : a;
const _rawAnims = animations ? getAnimations(animations, item, frame, fps)
  : { animationIn: null, animationOut: null, animationTimed: null };
const animationIn = _sanitize(_rawAnims.animationIn);
const animationOut = _sanitize(_rawAnims.animationOut);
const animationTimed = _sanitize(_rawAnims.animationTimed);
```
Files fixed: `text.tsx`, `image.tsx`, `video.tsx`, `illustration.tsx`, `shape.tsx`, `caption.tsx`, `get-animations.tsx`

### Post-command error checking
Every `/api/execute` response includes a `warnings` array if any browser console errors/warnings occurred during command execution:

```json
{
  "status": "success",
  "result": { "itemId": "abc123" },
  "warnings": [
    { "seq": 45, "level": "error", "message": "[BufferedVideo] Blob URL is stale...", "source": "video.tsx" }
  ]
}
```

**AI workflow after every command batch:**
1. Check the response `warnings` field — if present, diagnose before proceeding
2. For media commands (addVideo, addImage), also check `/api/console-errors?afterSeq=LAST_SEQ` after 1-2 seconds (media errors may be async)
3. If errors found, fix the issue before adding more items
4. **💾 After a significant batch of work (5+ items added, major scene changes, or risky operations), call `editor.save` to persist progress.** Don't wait until the end — save incrementally so work isn't lost if something crashes.

### Error endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/console-errors` | Browser console errors/warnings (in-memory ring buffer, max 200) |
| `GET /api/console-errors?afterSeq=N` | Only new entries since seq N |
| `GET /api/console-errors?level=error` | Only errors (skip warnings) |
| `GET /api/console-errors?search=video` | Filter by message content (case-insensitive) |
| `GET /api/console-errors?limit=50` | Max entries to return (default: 100) |
| `GET /api/console-errors?clear=true` | Read and clear the buffer |
| `GET /api/logs` | Activity log (persisted to `~/.skilltown-desktop/agent-activity.jsonl`) |

**Console error response format:**
```json
{
  "entries": [
    { "seq": 12, "level": "error", "message": "Failed to load video...", "source": "video.tsx", "line": 45, "timestamp": "..." }
  ],
  "count": 2, "totalBuffered": 15, "lastSeq": 13
}
```

**Key distinction:** A command can succeed (`status: "success"`) but still produce browser warnings in `response.warnings`. Check BOTH `status` AND `warnings` after every command.

### Error persistence
- All browser console warnings and errors are persisted to `~/.skilltown-desktop/agent-activity.jsonl` with `source: "browser-console"`
- The in-memory buffer holds up to 200 entries (lost on restart)
- The JSONL file persists across restarts

### Self-Healing Procedures

When errors are detected, the AI agent should fix them automatically:

| Error | Detection | Auto-Fix |
|---|---|---|
| **Stale media port** | `ERR_CONNECTION_REFUSED` on `127.0.0.1:XXXXX/media` | Reload project via `POST /api/project/restore` — URLs are auto-healed |
| **Blob URL stale** | `blob:` errors in console | Get the original file path from the item's metadata, re-add with local path |
| **Item not on canvas** | `validateTimeline` shows orphans | Delete orphaned items with `editor.deleteItems` |
| **Timeline gaps** | `validateTimeline` shows gaps | `editor.removeGaps` to close them |
| **Media file missing** | `media.status` shows inaccessible | Remove the item or prompt user for replacement file |
| **Editor unresponsive** | Commands timing out (20s) | `POST /api/reload` with `waitForReady: true` |
| **Circuit breaker open** | `query.getCircuitBreakerStatus` shows open circuits | Wait for reset (30s), then retry |
| **React crash** | White screen / editor not ready after load | `POST /api/reload` to force page reload |

### Video/audio media — URL resolution
- **Videos and audio** are served via the **dedicated media server** (`http://127.0.0.1:<mediaPort>/media?path=...`)
  - This server starts on a random port at app launch (logged as `[MediaServer] Serving local videos on ...`)
  - It has CORS headers built-in and supports HTTP Range requests for seeking
  - Allowed directories: `~/Movies`, `~/Downloads`, `~/Desktop`, `~/Documents`, `~/Pictures`, `~/Music`, `~/Codes`
- **Images** are converted to inline data URLs (small, no server dependency)
- ⚠️ **Never store `blob:` URLs** in persisted state — they don't survive page reloads
- Local file paths (`/Users/.../file.mp4`) are auto-resolved to media server URLs by the API server
- The API server's `/api/local-file` endpoint is a **fallback only** — prefer the media server to avoid CORS

#### Why CORS matters even for local files
Browsers treat different ports as different origins. The Next.js app on `:3000` cannot fetch from the API server on `:RANDOM_PORT` without CORS headers. The media server was purpose-built with CORS headers, so always route video/audio through it.

#### URL resolution chain
1. AI sends `editor.addVideo` with local path (e.g., `/Users/.../file.mp4`)
2. `api-server.cjs → resolveLocalMediaInParams()` converts to media server URL
3. `commandExecutor.ts → resolveMediaSrc()` recognizes `/media?path=` and keeps it as-is
4. `<video src="http://127.0.0.1:<mediaPort>/media?path=...">` plays with full seeking support

## Real-Time Events (SSE)

Subscribe to the server-sent event stream when you want push-based feedback instead of polling:

```bash
curl -N http://127.0.0.1:$PORT/api/events -H "Authorization: Bearer $TOKEN"
```

### Events emitted
- `command.completed` — after each successful command (includes `commandId`, `type`, `executionTimeMs`)
- `command.failed` — after each failed command (includes `error`)
- `render.progress` — render job progress updates (`jobId`, progress %, status)
- `render.completed` / `render.failed` — render job completion state
- `editor.ready` / `editor.notReady` — editor mount/unmount notifications
- `error.console` — browser console errors forwarded in real time

Use SSE to monitor long-running edits, watch render status, and catch async browser issues the moment they happen.

## Command Framework

Every mutation response now includes infrastructure metadata in addition to `status` and `result`:

- `stateVersion` — monotonic counter incremented after every mutation
- `changeDescription` — human-readable summary (for example, `Added 2 items (text_01, video_02)`)
- `executionTimeMs` — total command runtime
- `warnings` — any console errors/warnings captured during execution

Example:

```json
{
  "commandId": "cmd_123",
  "status": "success",
  "stateVersion": 42,
  "changeDescription": "Added 2 items (text_01, video_02)",
  "executionTimeMs": 118,
  "warnings": [],
  "result": { ... }
}
```

## AI Collaboration Commands

| Command | Description | Params |
|---------|-------------|--------|
| `ai.undoLastAction` | Undo the most recent AI mutation and return context about what was undone | none |
| `ai.previewChange` | Preview what a command list would change without applying it | `{commands: [{type, params}, ...]}` |
| `render.verifyOutput` | Check render output status after rendering | render/output-specific params |

Preview example:

```json
{
  "type": "ai.previewChange",
  "params": {
    "commands": [
      { "type": "editor.addText", "params": { "text": "Hello", "from": 0, "durationMs": 2000 } },
      { "type": "editor.addImage", "params": { "src": "https://example.com/image.jpg", "from": 0, "durationMs": 2000 } }
    ]
  }
}
```

## Diagnostics & Debugging

| Command | Description | Params |
|---------|-------------|--------|
| `query.diff` | Get state diffs since a version number | `{sinceVersion: number}` |
| `query.getVisibleText` | Get text items visible at a specific time | `{timeMs: number}` |
| `query.getCircuitBreakerStatus` | Check if any command types are circuit-broken | none |
| `query.getAssets` | Get all registered media assets | none |
| `validateTimeline` | Full timeline health check (orphaned items, gaps, track order, audio overlap) | none |
| `getCommandHistory` | Recent command execution history | `{count?: number}` |
| `getSceneErrors` | Scene-related errors | none |
| `getMetrics` | Command execution metrics (success/fail rates, timing) | none |

## Media Validation

| Command | Description | Params |
|---------|-------------|--------|
| `media.validate` | Pre-flight URL check for CORS, accessibility, content type, and blob detection | `{url: string, type?: "image"|"video"|"audio"}` |
| `media.status` | Batch check all project media | `{types?: string[]}` |
| `media.prepare` | Batch URL accessibility check | `{urls: string[]}` |
| `render.validate` | Pre-render validation for blob URLs, orphaned items, and coverage gaps | none |

Use `media.validate` before adding media and `render.validate` before exporting complex projects.

## Additional Editor Commands

These are commonly useful commands not covered in the core sections above:

| Command | Description | Params |
|---------|-------------|--------|
| `editor.play` | Start playback | none |
| `editor.pause` | Pause playback | none |
| `editor.seekToFrame` | Seek to a specific frame number | `{frame: number}` |
| `editor.select` | Select an item on the timeline | `{itemId: string}` |
| `editor.deselectAll` | Clear selection | none |
| `editor.cloneItem` | Duplicate an item | `{itemId: string}` |
| `editor.positionItem` | Set item spatial position | `{itemId, top?, left?}` |
| `editor.rotateItem` | Rotate an item | `{itemId, angle: number}` |
| `editor.alignItem` | Align item to canvas edge/center | `{itemId, align: string}` (`alignment` also accepted) |
| `editor.setZIndex` | Set item z-index layer | `{itemId, zIndex: number}` |
| `editor.setOpacity` | Set item opacity | `{itemId, opacity: number}` |
| `editor.setPlaybackRate` | Set video playback speed | `{itemId, rate: number}` |
| `editor.addVideoSegments` | Add multiple trimmed segments from one source | `{url, segments: [{start, end, label?}], gap?, startAt?, width?, height?, volume?}` |
| `editor.removeSegment` | Cut a time range, optionally ripple-shifting later items | `{from_ms, to_ms, ripple?: boolean}` |
| `editor.clearTimeline` | Clear all items, filtered types, or one track | `{types?: string[], trackId?: string}` |
| `bulk.styleByType` | Apply one style payload to every item of a type | `{type: "caption"|"text"|"video", details: {...styling}}` |
| `editor.addKeyframe` | Add animation keyframe | `{itemId, time, property, value}` |
| `editor.removeKeyframe` | Remove animation keyframe | `{itemId, keyframeId}` |
| `editor.addEffect` | Apply visual effect to item | `{itemId, effect: {type, params}}` |
| `editor.removeEffect` | Remove effect from item | `{itemId, effectId}` |
| `editor.removeAnimation` | Remove animation from item | `{itemId, type: "in"\|"out"}` |
| `editor.muteTrack` | Mute/unmute a track | `{trackId, muted: boolean}` |
| `editor.lockTrack` | Lock/unlock a track | `{trackId, locked: boolean}` |
| `editor.hideTrack` | Show/hide a track | `{trackId, hidden: boolean}` |
| `editor.renameTrack` | Rename a track | `{trackId, name: string}` |
| `editor.addTransition` | Add transition between two specific items | `{fromId, toId, kind, duration?, direction?}` |
| `editor.addTransitionBetween` | Smart: add transition after an item (auto-finds next clip) | `{itemId, kind, duration?, direction?}` |
| `editor.removeTransition` | Remove a transition | `{transitionId}` or `{fromId, toId}` or `{fromId}` |
| `query.listTransitions` | List available presets + applied transitions | none |
| `editor.addTemplate` | Add a design template | template-specific params |
| `query.getTimelineItems` | Get all items on the timeline | none |
| `query.getTrackInfo` | Get track details | `{trackId?: string}` |
| `query.getItemProperties` | Get detailed item props | `{itemId: string}` |
| `query.getCurrentTime` | Get current playback time | none |
| `query.getDuration` | Get total timeline duration | none |
| `query.getCanvasSize` | Get canvas dimensions | none |
| `query.getSelectedItems` | Get currently selected items | none |
| `query.getItemsAtTime` | Get items visible at a time | `{timeMs: number}` |
| `query.listFonts` | List available fonts | none |
| `query.getAllText` | Get all text content from timeline | none |
| `query.diagnoseScenes` | Check all scenes for errors | none |
| `batch.execute` | Execute multiple commands in sequence | `{commands: [{type, params}, ...]}` |

## Complete Command Reference

> Prefer the namespaced `query.*`, `media.*`, `content.*`, `storystudio.*`, `project.*`, `render.*`, `bulk.*`, `batch.*`, and `ai.*` forms shown below.

### Text, captions, and styling

| Category | Commands |
|---|---|
| Text & captions | `editor.addText`, `editor.addCaption`, `editor.editItem` |
| Typography queries | `query.getAllText`, `query.listFonts`, `query.getVisibleText` |

### Media, audio, and validation

| Category | Commands |
|---|---|
| Add/replace media | `editor.addImage`, `editor.addVideo`, `editor.addVideoSegments`, `editor.addAudio`, `editor.replaceMedia` |
| Media playback/style | `editor.setVolume`, `editor.setAudioGain`, `editor.setPlaybackRate`, `editor.setOpacity` |
| Media checks | `media.validate`, `media.prepare`, `media.status`, `query.getAudioLoudness` |

### Timeline, selection, and bulk changes

| Category | Commands |
|---|---|
| Timeline edits | `editor.moveItem`, `editor.trimItem`, `editor.splitItem`, `editor.cutItem`, `editor.cloneItem`, `editor.removeSegment`, `editor.deleteItems`, `editor.purgeItems` |
| Selection | `editor.select`, `editor.deselectAll` |
| Cleanup & batching | `editor.clearTimeline`, `editor.removeGaps`, `editor.setMagnetic`, `bulk.deleteByType`, `bulk.styleByType`, `bulk.shiftAll`, `batch.execute` |
| AI helpers | `ai.undoLastAction`, `ai.previewChange` |

### Canvas, effects, and playback

| Category | Commands |
|---|---|
| Positioning | `editor.positionItem`, `editor.alignItem`, `editor.rotateItem`, `editor.setZIndex` |
| Motion & effects | `editor.addTransition`, `editor.addTransitionBetween`, `editor.removeTransition`, `query.listTransitions`, `editor.setAnimation`, `editor.removeAnimation`, `editor.addKeyframe`, `editor.removeKeyframe`, `editor.addEffect`, `editor.removeEffect` |
| Playback | `editor.play`, `editor.pause`, `editor.seekTo`, `editor.seekToFrame` |

### Tracks, project state, and export

| Category | Commands |
|---|---|
| Track operations | `editor.reorderTracks`, `editor.muteTrack`, `editor.lockTrack`, `editor.hideTrack`, `editor.renameTrack` |
| Project commands | `editor.resize`, `editor.setBackground`, `editor.loadDesign`, `editor.save`, `editor.undo`, `editor.redo`, `editor.export`, `project.getFullState`, `project.saveAutosave`, `project.loadFullState` |
| Render checks | `render.validate`, `render.verifyOutput` |

### Read-only queries and diagnostics

| Category | Commands |
|---|---|
| Core state | `query.getEditorState`, `query.getTrackInfo`, `query.getTimelineItems`, `query.getItemProperties`, `query.getCurrentTime`, `query.getItemsAtTime`, `query.getDuration`, `query.getCanvasSize`, `query.getSelectedItems`, `query.getTranscript`, `query.getProjectInfo` |
| Diagnostics | `query.diagnoseScenes`, `query.validateTimeline`, `query.getSceneErrors`, `query.getMetrics`, `query.getCommandHistory`, `query.getCircuitBreakerStatus`, `query.capturePreviewFrame`, `query.diff`, `query.getAssets`, `query.listAnimationPresets` |

### Scenes and templates

| Category | Commands |
|---|---|
| Scene catalog | `scene.listScenes`, `scene.getSceneProps`, `scene.getSceneSource`, `scene.previewCode`, `scene.validateCode` |
| Scene creation | `scene.addLibraryScene`, `scene.addCustomScene`, `scene.addBundledScene`, `scene.updateSceneProps`, `template.buildFromJSON`, `editor.addTemplate` |

### Content bridge and StoryStudio

| Category | Commands |
|---|---|
| Content bridge | `content.getDetails`, `content.getTranscriptWords`, `content.updateMetadata`, `content.applyImage`, `content.removeImage`, `content.applyCaptions`, `content.removeCaptions` |
| StoryStudio pipeline | `storystudio.getPipelineState`, `storystudio.getGroupings`, `storystudio.getDecisions`, `storystudio.generateGroupings`, `storystudio.generateDecisions`, `storystudio.generateStrings`, `storystudio.searchImages`, `storystudio.applyAssets` |

## Additional API Endpoints

These endpoints exist but are not covered in detail above:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/media/heal` | Manually trigger media URL healing |
| `GET` | `/api/render/capabilities` | Check available render codecs/formats |
| `GET` | `/api/render/jobs` | List all render jobs |
| `GET` | `/api/render/:jobId` | Get status of a specific render job |
| `POST` | `/api/render/:jobId/cancel` | Cancel a running render job |
| `GET` | `/api/project/export` | Export current project |
| `POST` | `/api/project/import` | Import a project file |
| `POST` | `/api/project/save` | Save project to disk |
| `POST` | `/api/project/save-autosave` | Save current project to canonical autosave file |
| `POST` | `/api/project/open` | Open a project file |
| `GET` | `/api/project/autosaves` | List available autosave files |
| `GET` | `/api/project/recent` | List recently opened projects |
| `GET` | `/api/capabilities` | Full endpoint/capability discovery |

## Batch Operations with Transactions

For multi-step edits, AI can use transactions for atomic operations:

```json
{"type": "batch", "commands": [...], "transaction": true}
```

If any command fails, all earlier commands in the batch are automatically rolled back via undo.

## Circuit Breaker & Retry

- Media commands (`addVideo`, `addImage`, `addAudio`) and `editor.save` automatically retry with exponential backoff
- Maximum retry count: 2 retries after the initial attempt
- If a command type fails 3 consecutive times, its circuit breaker opens for 30 seconds
- Use `query.getCircuitBreakerStatus` to inspect breaker state before retrying manually

## Clip Transitions (Timeline)

Transitions create smooth visual effects between adjacent clips on the same track. These are **timeline transitions** (not scene enter/exit animations).

### Available Transition Kinds

| Kind | Name | Directions |
|------|------|-----------|
| `fade` | Fade | — |
| `slide` | Slide | `from-left`, `from-right`, `from-top`, `from-bottom` |
| `wipe` | Wipe | `from-left`, `from-right`, `from-top`, `from-bottom` |
| `flip` | Flip | `from-left`, `from-right`, `from-top`, `from-bottom` |
| `clockWipe` | Clock Wipe | — |
| `star` | Star | — |
| `circle` | Circle | — |
| `rectangle` | Rectangle | — |
| `slidingDoors` | Sliding Doors | — |

### Transition Commands

#### `editor.addTransitionBetween` (recommended)
Adds a transition after a given clip, auto-finding the next adjacent clip on the same track.

```json
{"type": "editor.addTransitionBetween", "params": {
  "itemId": "clip_abc",
  "kind": "fade",
  "duration": 500,
  "direction": "from-left"
}}
```
- `itemId` (required) — the clip to add a transition AFTER
- `kind` (required) — one of the transition kinds above
- `duration` (optional, ms, default 500) — overlap duration
- `direction` (optional) — only for slide/wipe/flip

#### `editor.addTransition` (explicit)
Adds a transition between two specific clips (you must know both IDs).

```json
{"type": "editor.addTransition", "params": {
  "fromId": "clip_abc",
  "toId": "clip_def",
  "kind": "slide",
  "duration": 700,
  "direction": "from-right"
}}
```

#### `editor.removeTransition`
Removes a transition. Accepts any of: `transitionId`, `{fromId, toId}`, or just `{fromId}` (removes its outgoing transition).

```json
{"type": "editor.removeTransition", "params": {"fromId": "clip_abc"}}
```

#### `query.listTransitions`
Returns available presets and all currently applied transitions.

```json
{"type": "query.listTransitions", "params": {}}
```

### Transition Tips
- Duration is in **milliseconds** (500 = 0.5s overlap)
- Transitions only work between adjacent clips on the same track
- Audio is automatically handled: incoming clip is muted during the overlap period
- Use `query.listTransitions` first to see what's already applied before adding more
- Removing a transition reverts to a hard cut (no gap created)

## 🤖 AI Content Generation (PrepWithAI)

The agent has access to **PrepWithAI MCP tools** for AI-powered content creation:

- **Image generation** — Generate images from text prompts (Gemini), add to timeline
- **Video frame analysis** — Extract frames with ffmpeg, analyze to understand content, create matching scenes
- **Text-to-speech** — Generate voiceovers with Minimax TTS
- **Content-aware editing** — Analyze video frames → understand topics → create contextual intros/transitions/outros

Load the `prepwithai/SKILL` skill for full documentation, workflows, and examples.

## 🎬 Creative Approach — Think Like a Video Editor

**DON'T** just dump content on a timeline. **Plan first**, then execute:

1. **Analyze** source material (extract + view video frames)
2. **Plan** the video structure (scenes, transitions, pacing, style)
3. **Build in phases**: canvas → background scenes → content → text → reorder → **save** → verify
4. **Verify** thoroughly (no gaps, no hidden text, no errors)

> 💾 **Save after each phase**, not just at the end. Call `editor.save` after completing background scenes, after content, and after text/reorder. This way if a later phase fails, you don't lose earlier work.

Load the `remotion/rules/creative-approach` skill for the full planning workflow, pacing guidelines, and common mistakes to avoid.

## 📦 Scene & Template Sources

The editor has access to **159 pre-built scenes** from the `@shubham-vish/remotion-templates` package, plus the full orchestration patterns in `_Pipelines/`.

| Capability | Location |
|-----------|----------|
| 159 scene catalog with AI selection | `_Agent/scene-catalog.json` |
| Scene prop schemas | `_Agent/scene-props.json` |
| SFX library (500+ files) | `_Assets/sfx/` |
| Auto-edit pipeline patterns | `_Pipelines/pipeline/` |
| B-roll automation patterns | `_Pipelines/tools/broll.py` |
| Camera system patterns | `_Pipelines/pipeline/camera_plan.py` |
| Transition planning patterns | `_Pipelines/pipeline/transition_planner.py` |

**How to use**: Browse `_Pipelines/` for orchestration patterns. Translate them into MCP tool calls + editor commands — do NOT run the Python directly.

### Key Pattern: Content-Aware Video Editing
```
1. Extract 3 frames per video (ffmpeg -ss <time> -i video.mp4 -frames:v 1 frame.jpg)
2. View/analyze frames to understand what each video shows
3. Create custom Remotion scenes that match the actual content
4. Generate relevant AI images for transitions/backgrounds
```

## ⚠️ Custom Scene Code Rules

When using `scene.addCustomScene`, the code runs in a **browser sandbox**:
- Define `const Scene = () => { ... }` — NO imports, NO exports, NO `return Scene;`
- All Remotion/React APIs are available as globals (e.g. `useCurrentFrame`, `interpolate`, `AbsoluteFill`)
- Load the `scenes-and-templates` skill for full rules and examples

## 🚀 Bundled Scenes (Advanced — Full Import Support)

When sandbox scenes aren't enough (need `@remotion/noise`, `@remotion/shapes`, video effects, etc.), use **bundled scenes**. This is the most powerful scene creation method — it bridges the gap between remotion-projects' 159 components and the video editor.

### Quick start

```bash
# Build a scene with real imports
curl -X POST http://127.0.0.1:$PORT/api/scene-bundles/build \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-noise-scene", "source": "import React from \"react\";\nimport { useCurrentFrame } from \"remotion\";\nimport { noise2D } from \"@remotion/noise\";\n\nexport default function Scene() {\n  const frame = useCurrentFrame();\n  const n = noise2D(\"seed\", frame * 0.01, 0);\n  return <div style={{opacity: 0.5 + n * 0.5, background: \"#333\", width: \"100%\", height: \"100%\"}} />;\n}"}'

# Check supported imports
curl http://127.0.0.1:$PORT/api/scene-bundles/supported-imports \
  -H "Authorization: Bearer $TOKEN"

# Add to timeline via command (build + add in one step)
{ "type": "scene.addBundledScene", "params": {
  "source": "import React from 'react';\nimport ...\nexport default function Scene() { ... }",
  "name": "Noise Background", "from": 0, "durationMs": 5000
}}
```

### How it works
1. AI writes `.tsx` with real `import` statements
2. esbuild (in Electron main process) compiles to CJS (~3ms), keeping React/Remotion as external
3. Bundle cached by content hash in `~/.skilltown-desktop/scene-bundles/`
4. Renderer loads via `new Function()` + custom `require()` mapping to host app modules
5. React/Remotion context is shared (singleton) — hooks like `useCurrentFrame()` work normally
6. The compiled code is stored in item `metadata.bundledCode` — survives save/restore

### Supported imports (19 packages)
`react`, `react-dom`, `react/jsx-runtime`, `react/jsx-dev-runtime`, `remotion`,
`@remotion/noise`, `@remotion/shapes`, `@remotion/paths`, `@remotion/transitions`,
`@remotion/media-utils`, `@remotion/motion-blur`, `@remotion/google-fonts`,
`@remotion/light-leaks`, `@remotion/captions`, `@remotion/animation-utils`,
`@remotion/layout-utils`,
`@shubham-vish/remotion-templates`, `@skilltown/remotion-templates`

### Using catalog scenes in bundled scenes
Bundled scenes can import ANY of the 159 catalog scenes directly:
```tsx
import { PieChartScene } from '@shubham-vish/remotion-templates';

export default function Scene() {
  return <PieChartScene 
    title="Revenue Split"
    segments={[
      { label: 'Product A', value: 45, color: '#00FF88' },
      { label: 'Product B', value: 35, color: '#00BFFF' },
      { label: 'Product C', value: 20, color: '#FFD700' },
    ]}
  />;
}
```
This is the best approach when you want to **customize** a catalog scene (add overlays, combine scenes, modify behavior). For using a catalog scene as-is, prefer `scene.addLibraryScene` instead.

### Key rules
- **Must `export default`** a React component — `export default function Scene() { ... }`
- Unsupported imports are **rejected before build** with clear error messages
- React/Remotion hooks work normally (`useCurrentFrame`, `useVideoConfig`, `interpolate`, `spring`, etc.)
- Build takes ~3ms (cached by content hash — instant reuse on identical source)
- Items are stored as `type: "image"` with `metadata.isTemplate: true, metadata.sceneType: "__bundled__"`

### 🎬 Video with Effects (Ken Burns, 3D Camera, Color Grading)

**This is the killer feature.** Plain `editor.addVideo` creates a raw clip with no effects. Bundled scenes can **embed video inside a Remotion component** with full cinematic control:

```tsx
import { useCurrentFrame, useVideoConfig, interpolate, AbsoluteFill, OffthreadVideo, Easing } from 'remotion';
import { noise2D } from '@remotion/noise';

const VIDEO = 'http://127.0.0.1:<mediaPort>/media?path=...';

export default function KenBurns() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Ken Burns zoom: slow zoom from 1.0× to 1.35×
  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.35], {
    extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)
  });

  // Camera shake via Perlin noise
  const shakeX = noise2D('sx', frame * 0.04, 0) * 1.5;
  const shakeY = noise2D('sy', 0, frame * 0.04) * 1.5;

  // 3D perspective tilt
  const rotX = noise2D('rx', frame * 0.008, 0) * 2;
  const rotY = noise2D('ry', 0, frame * 0.008) * 3;

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <div style={{ perspective: '1000px', perspectiveOrigin: `${50 - rotY * 2}% ${50 - rotX * 2}%` }}>
        <div style={{
          inset: '-15%', position: 'absolute',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${zoom}) translate(${shakeX}%, ${shakeY}%)`,
          filter: `saturate(1.15) contrast(1.05) brightness(1.0)`
        }}>
          <OffthreadVideo src={VIDEO} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
      {/* Vignette, letterbox, color overlay, etc. */}
    </AbsoluteFill>
  );
}
```

**Available video effects** (from remotion-projects patterns):

| Effect | How |
|--------|-----|
| Ken Burns (zoom/pan) | `interpolate` zoom + translate over duration |
| Camera shake | `noise2D` on X/Y per frame (±1-3px) |
| 3D perspective tilt | `rotateX/rotateY` with `perspective()` CSS |
| Dynamic perspective origin | `perspectiveOrigin` shifts opposite to tilt |
| Vignette | `radial-gradient` overlay, intensity linked to zoom |
| Letterbox bars | Top/bottom black divs with animated height |
| Color grading | CSS `filter: saturate() contrast() brightness()` |
| Teal/orange look | `linear-gradient` overlay with `mixBlendMode: 'color'` |
| Chromatic aberration | `boxShadow: inset` with red/cyan at low opacity |
| Film grain | SVG noise pattern with frame-offset `backgroundPosition` |
| Anamorphic streaks | Horizontal gradient bars drifting with frame |
| Zoom pulses | Multi-keyframe `interpolate` (in → hold → out) |
| Speed ramps | Different `startFrom` values on `<OffthreadVideo>` |
| Depth of field | `filter: blur()` on layers at different Z depths |

### When to use which
| Scenario | Use |
|----------|-----|
| Simple text, shapes, basic animation | `scene.addCustomScene` (sandbox) |
| Need `@remotion/noise`, `@remotion/shapes`, external packages | `scene.addBundledScene` |
| Video with effects (Ken Burns, 3D camera, color grading) | `scene.addBundledScene` with `<OffthreadVideo>` |
| Library preset (LightLeaks, etc.) | `scene.addLibraryScene` |

### ⚠️ Save persistence for bundled scenes
The `editor.save` command saves to the Next.js backend DB, which may fail/timeout for large bundled code. **Use `project.saveAutosave`** as the reliable local autosave fallback:

```bash
curl -X POST http://127.0.0.1:$PORT/api/execute \
  -H "Authorization: ******" \
  -d '{"type": "project.saveAutosave", "params": {}}'
# → result.path = ~/.skilltown-desktop/projects/<contentId>.autosave.skilltown
# → result.bytes and result.contentId confirm what was written
```

The command captures the full project state (including bundled code) and writes the autosave file via Electron IPC. The autosave file survives page reloads and app restarts. **Note:** this saves LOCALLY only — it does NOT clear the editor's unsaved indicator (which tracks cloud-save state). To also sync to cloud, call `editor.save` when it's healthy.

## Scene Catalog (159 Scenes)

The editor includes the full `@shubham-vish/remotion-templates` scene library with **159 pre-built scenes** across 11 categories.

### Browsing the catalog
```json
// List all scenes (or filter by category/search)
{ "type": "scene.listScenes", "params": { "category": "chart" } }
{ "type": "scene.listScenes", "params": { "search": "particle" } }

// Get editable props for a specific scene
{ "type": "scene.getSceneProps", "params": { "sceneId": "PieChartScene" } }

// Get source code of a scene (for reading/customizing)
{ "type": "scene.getSceneSource", "params": { "sceneId": "AnimatedBarScene" } }
```

### Adding catalog scenes
```json
// Quick: Use as-is with default or custom props
{ "type": "scene.addLibraryScene", "params": {
  "sceneId": "AnimatedBarScene",
  "from": 0, "durationMs": 5000,
  "sceneProps": { "title": "Performance Metrics", "metrics": [...] }
}}

// Batch: Build full video from JSON template (like remotion-projects TemplateRenderer)
{ "type": "template.buildFromJSON", "params": {
  "scenes": [
    { "sceneId": "HookScene", "durationMs": 3000, "sceneProps": { "title": "Welcome!" } },
    { "sceneId": "AnimatedBarScene", "durationMs": 5000, "sceneProps": { "title": "KPIs", "metrics": [...] } },
    { "sceneId": "PieChartScene", "durationMs": 5000, "sceneProps": { "title": "Revenue Split" } },
    { "sceneId": "CinematicOutroScene", "durationMs": 4000 }
  ],
  "gap": 0,
  "startFrom": 0
}}

// Advanced: Import in bundled scene for customization
{ "type": "scene.addBundledScene", "params": {
  "source": "import { PieChartScene } from '@shubham-vish/remotion-templates';\nexport default () => <PieChartScene ... />;",
  "from": 0, "durationMs": 5000
}}
```

### Categories
| Category | Count | Examples |
|----------|-------|---------|
| chart | 24 | LineChart, PieChart, DonutChart, BarRace, Treemap |
| data-viz | 15 | NumberTicker, StatsGrid, GaugeDial, MetricDashboard |
| motion-bg | 50+ | ParticleExplosion, Starfield, Aurora, MatrixRain, DNAHelix |
| text | 9 | TypewriterQuote, GlitchText, WordByWord, GradientQuote |
| layout | 20+ | FlipCard, ParallaxLayers, PhoneMockup, MasonryReveal |
| comparison | 5 | BeforeAfter, ComparisonCards, SplitScreen |
| opener/closer | 10 | CinematicOutro, GrandFinale, HookScene |
| effect | 5 | LightLeaks, FilmGrain, ShatterGlass |

### Reference files
- `_Agent/scene-catalog.json` — Full catalog with IDs, descriptions, tags, props schemas (159 scenes)
- `_Agent/scene-props.json` — Machine-readable field definitions for each scene

## Captions & Subtitles

`@remotion/captions` is available for word-level animated captions:

```tsx
import { createTikTokStyleCaptions } from '@remotion/captions';

// In a bundled scene, use word-level timing data:
const captions = createTikTokStyleCaptions({
  words: [
    { word: 'Hello', start: 0, end: 500 },
    { word: 'world', start: 500, end: 1000 },
  ],
  // ... styling options
});
```

Pattern: Transcribe audio → extract word timings → render animated captions as a bundled scene overlay.

### `content.applyCaptions` timing formats

Use either transcript-style seconds or timeline-style milliseconds:
- `subtitles[].startTime` (seconds) **or** `subtitles[].from` (ms)
- `subtitles[].endTime` (seconds) **or** `subtitles[].to` (ms)
- `words[].start` (seconds) **or** `words[].from` (ms)
- `words[].end` (seconds) **or** `words[].to` (ms)

## Auth

All endpoints except `/api/info` require: `Authorization: Bearer <token>`

Token is in `~/.skilltown-desktop/api.json` — changes each session.

## ⚠️ Key Caveats for AI Agents

### ⚠️ CRITICAL: Correct Command Names

These command names are commonly confused. Using the wrong name silently fails or errors:

| ❌ Wrong Name | ✅ Correct Name | Notes |
|---|---|---|
| `editor.addAnimation` | `editor.setAnimation` | `addAnimation` doesn't exist |
| `editor.getAnimationPresets` | `query.listAnimationPresets` | Query namespace, not editor |
| `editor.removeItem` | `editor.deleteItems` | Plural, takes `{itemIds: string[]}` |
| `editor.seek` | `editor.seekTo` | `seek` doesn't exist, use `seekTo` with `{timeMs: N}` |
| `bulk.shiftAll({shift_ms: N})` | `bulk.shiftAll({shiftMs: N})` | camelCase param name |
| `editor.editItem({text: "x"})` | `editor.editItem({details: {text: "x"}})` | Text/style changes must be wrapped in `details` |
| `scene.updateSceneProps({props:{}})` | `scene.updateSceneProps({sceneProps:{}})` | Param is `sceneProps`, not `props` |

**Animation command syntax:**
- `editor.setAnimation`: `{itemId, type: "in"|"out", animationId: "fadeIn"|"slideInLeft"|...}`
- Effects via `editor.editItem`: `{itemId, effects: [{type: "textGlow", params: {...}}]}`

### ⚠️ CRITICAL: Delete Commands — Known Bugs & Workarounds

Delete operations are unreliable. **ALWAYS verify after deleting:**

| Command | Issue | Workaround |
|---|---|---|
| `editor.deleteItems` | Uses event dispatch (async) — may return "success" before items are actually removed. T3 verification catches this. | Check `GET /api/state` after delete to confirm items gone |
| `bulk.deleteByType` | **Fixed bug**: was calling `getState().setState()` which does nothing. Now fixed but still verify. | Use T3 verification in response; if `verified: false`, retry or use `purgeItems` |
| `editor.purgeItems` | Direct store modification — more reliable but may leave empty tracks. Now auto-removes empty tracks. | Preferred for bulk cleanup; always reload editor state after |
| `editor.loadDesign` with empty design | **Nuclear option** — guaranteed to clear everything | See "Clearing a timeline" section below |

**Verification pattern after any delete:**
```bash
# Delete items
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"editor.deleteItems","params":{"itemIds":["item1","item2"]}}'

# Wait 500ms for async dispatch, then verify
sleep 0.5
curl -s "http://127.0.0.1:$PORT/api/state" -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys,json; d=json.load(sys.stdin)
design = d.get('result',{}).get('design',{})
items = design.get('trackItemsMap',{}) if design else {}
remaining = [k for k in ['item1','item2'] if k in items]
print(f'Remaining: {remaining}' if remaining else 'All deleted ✅')
"
```

### ⚠️ Design State — Two Stores That Must Stay In Sync

The editor has TWO state stores:
- **stateManager** (from `@designcombo/state`): Primary state, used by event dispatchers
- **zustand useStore**: UI-facing store, used by `getDesignJson()` for saving/serialization

If you only update one, changes won't persist. This is why:
- `editor.deleteItems` (event dispatch) sometimes leaves zombies in zustand
- `editor.purgeItems` was rewritten to clean BOTH stores
- After direct store manipulation, always call `getDesignJson()` to verify serialization works

### ⚠️ Design State Access — Correct Way to Read State

```bash
# Method 1: GET /api/state (reads from zustand/getDesignJson)
# ⚠️ Returns null when design is empty or has no items
curl -s "http://127.0.0.1:$PORT/api/state" -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys,json; d=json.load(sys.stdin)
design = d.get('result',{}).get('design')
if design is None: print('Design is NULL (empty timeline)')
else: print(f'Items: {len(design.get(\"trackItemsMap\",{}))}')
"

# Method 2: project.getFullState (reads from stateManager — more reliable)
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"project.getFullState","params":{}}' | \
  python3 -c "
import sys,json; d=json.load(sys.stdin)
design = d.get('result',{}).get('project',{}).get('design',{})
print(f'Items: {len(design.get(\"trackItemsMap\",{}))}')
"
```

### ⚠️ Timeline `display` Field = Time, NOT Position

The `display` field on timeline items is `{from: ms, to: ms}` — this is the **time position** on the timeline, NOT spatial coordinates.
- `display.from` = when the item starts (milliseconds)
- `display.to` = when the item ends (milliseconds)
- Spatial info (position on canvas) is in `details` → `top`, `left`, `width`, `height`

### State response nesting
All API responses wrap results: `{commandId, status, result: {...}}`.
For `GET /api/state`, the design data is at `result.design.trackItemsMap`, NOT `result.trackItemsMap`.
**Fresh projects have `result.design = null`** — check for this before accessing items.

### Video metadata must be pre-provided
The `ADD_VIDEO` reducer internally creates a `<video>` element to detect duration/width/height.
This **fails silently** for localhost URLs, data URLs, and CORS-blocked URLs — the item never appears.
**Always provide `width`, `height`, and `duration` (ms)** when calling `editor.addVideo`.
Use `ffprobe` to extract metadata before adding videos.

### Image vs video loading
- **Images**: Base64 data URLs work. Use `data:image/jpeg;base64,...` for local files.
- **Videos**: Data URLs do NOT work (Chromium can't seek them). Use HTTP URLs with range request support.
  The dedicated media server (`/media?path=...`) is the preferred endpoint. The API server's `/api/local-file?path=...&token=...` is a fallback.

### Hot reload
Changes to `commandExecutor.ts` may not hot-reload — a page refresh in the Electron app may be needed.

### Param naming (camelCase vs snake_case)
The commandExecutor accepts BOTH camelCase and snake_case for common params:
- `from` / `from_ms` — timeline start time
- `to` / `duration_ms` — timeline end (or start + duration)
- `sceneId` / `scene_id` — scene template ID
- `durationMs` / `duration_ms` — duration in milliseconds
- `sceneProps` / `props` — scene property overrides
**Always prefer camelCase** (`from`, `durationMs`, `sceneId`) — snake_case is a fallback.

### Clearing a timeline
`editor.deleteItems` may not work reliably for all items. The guaranteed way to clear everything:
```json
{"type": "editor.loadDesign", "params": {"design": {
  "trackItemsMap": {}, "trackItemDetailsMap": {}, "tracks": [],
  "trackItemIds": [], "transitionsMap": {}, "transitionIds": [],
  "size": {"width": 1080, "height": 1920}, "duration": 60000, "fps": 30
}}}
```

### Dispatch patterns (internal)
- **Images**: Use `ADD_ITEMS` (creates track + item together, matching native file drop behavior)
- **Videos**: Use `ADD_VIDEO` with `options: { resourceId: 'main', scaleMode: 'none' }`. Smart track reuse auto-adds `targetTrackId` + `isNewTrack: false` when a compatible track is found. Only `from` in display (no `to`).
- **Text**: Uses `ADD_TEXT` — works reliably. Smart track reuse via `targetTrackId`.
- **Scenes**: Use `ADD_ITEMS` with `isTemplate: true` — same as images, but tagged `isTemplateTrack`

---

## ⚠️ CRITICAL: Track Z-Order (Layer Visibility)

> ## ⚠️ DO NOT HIDE CAPTIONS/TEXT
>
> **Track 0 = TOP/front-most layer.** Caption/text tracks must be above all video/image/background tracks. After adding ANY caption/text item, immediately call `editor.reorderTracks` **or rely on automatic reordering** (`editor.addCaption`, `editor.addText`, and `editor.autoCaption` auto-call it by default as of 2026-06-18).
>
> If you bulk-add via `content.applyCaptions`, add B-roll, or manually modify track structure, you **MUST** call `editor.reorderTracks` yourself.

**Top track (Track 0) = front layer.** Text on bottom tracks is INVISIBLE behind backgrounds.

### The Rule
- Text/caption tracks MUST be ABOVE (lower track index than) scene/image tracks
- Track 0 = TOP/front-most layer
- Caption/text tracks → top
- Audio tracks → middle
- Video/image tracks → bottom/background
- Empty tracks should be garbage-collected
- If text ends up below scene tracks, backgrounds cover all text → invisible content
- Scene tracks have `metadata.isTemplateTrack = true` — they are background layers

### The Fix: Always call `editor.reorderTracks`
**After adding all items to a video, ALWAYS call `editor.reorderTracks`.** `editor.addCaption`, `editor.addText`, and `editor.autoCaption` now do this automatically by default; pass `autoReorder: false` only if you will reorder later. It sorts tracks by layer priority:
1. **Text/Caption** (top — most visible, front layer)
2. **Audio**
3. **Video**
4. **Regular images**
5. **Template/Scene tracks** (bottom — background layer)

### Why this happens
New tracks are appended in creation order. If you add scenes first and text second, scenes end up on top tracks and text on bottom — which is backwards for visibility.

---

## Smart Track Management

All add commands (`editor.addText`, `editor.addImage`, `editor.addVideo`, `editor.addCaption`, `scene.addLibraryScene`, `scene.addCustomScene`) support **smart track reuse**:

1. Checks for existing agent-created tracks of the same type
2. Finds one with no time overlap for the new item
3. Merges into that track if found, or creates a new one

This keeps timelines clean — e.g., 44 items can fit in just 4 tracks.

### ⚠️ CRITICAL: Always pass `from`/`to` in add commands

**Track reuse ONLY works when items are created at their correct time positions.** If you omit `from`/`to`, items default to time 0 — every item "overlaps" at 0, creating a new track each time. Then you use `moveItem` to fix timing but the track is already created.

```python
# ❌ BAD: 7 items → 7 tracks (all created at time 0, then moved)
for slide in slides:
    r = addImage(src=slide.img)        # all land at 0-5s → overlap
    moveItem(r.itemId, from=slide.from, to=slide.to)  # too late, track already created

# ✅ GOOD: 7 items → 1 track (created at correct times, auto-reuse)
for slide in slides:
    addImage(src=slide.img, from=slide.from, to=slide.to)  # track reuse works!
```

**Real result: 19 tracks → 7 tracks** just by passing `from`/`to` at creation time.

### Track management is the AI's responsibility

The API provides the tools — the AI decides how to use them:
- Pass `from`/`to` to enable automatic track reuse
- Pass `trackId` to force placement on a specific track
- Use `editor.renameTrack` to label tracks (e.g., `🎵 Music`, `📝 Text Overlays`, `🖼 Backgrounds`)
- The AI should plan track layout: which items share tracks, when to create new ones

### Track naming for clarity

```json
{"type": "editor.renameTrack", "params": {"trackId": "abc123", "name": "🎵 Music - Gravitational Forces"}}
{"type": "editor.renameTrack", "params": {"trackId": "def456", "name": "🖼 Backgrounds"}}
{"type": "editor.renameTrack", "params": {"trackId": "ghi789", "name": "📝 Text Overlays"}}
```

### Implementation details
- Tracks are tagged `metadata.isAgentTrack = true` (or `isTemplateTrack` for scenes)
- Only agent-created tracks are candidates for reuse — user tracks are never touched
- Race conditions prevented via in-memory `pendingOccupancy` tracking
- Pass `trackId` param to force placement on a specific track

---

## ⚠️ Audio Constraints

### Html5Audio tag limit: max ~5 total items

The browser can only mount **~5-6 Html5Audio tags simultaneously**. This counts ALL audio items in the timeline, not just those playing at the current time. Exceeding this causes **silent playback failure** — no errors in console, audio just doesn't play.

**Rule: Keep total audio items ≤ 5** (1 music track + max 4 SFX).

**Audio track reuse**: Non-overlapping audio items now share tracks automatically (same as text/image). The agent's `addAudioHandler` passes `targetTrackId` to the state manager when a compatible audio track exists. 4 non-overlapping SFX → 1 audio track instead of 4.

### Volume scale: 0–100 and dB gain

| Volume | dB Equivalent | Use |
|---|---|---|
| `0` | −∞ | Muted |
| `25-35` | −12 to −9 dB | Background music |
| `40-50` | −8 to −6 dB | Subtle SFX (clicks, whooshes) |
| `50-60` | −6 to −4 dB | Medium SFX (chimes, notifications) |
| `55-70` | −5 to −3 dB | Strong SFX (bells, impacts) |
| `100` | 0 dB (unity) | Full volume (narration) |

**Two ways to set volume:**
- `editor.setVolume` — raw 0-100 scale: `{itemId, volume: 35}`
- `editor.setAudioGain` — professional dB scale: `{itemIds: ["music_01"], gainDb: -9}` (range: −60 to 0 dB)

**Conversion**: `volume = 10^(dB/20) × 100` — so −9 dB ≈ volume 35, −6 dB = volume 50.

**Use `editor.setAudioGain`** for mixing — dB values are more intuitive for balancing audio levels. Use `query.getAudioLoudness` to check current levels.

**Each SFX type needs a different volume** — clicks are quieter than bells. Always calibrate per-SFX. Load the `media-and-audio` skill for ffprobe analysis workflow and effective dB calculations.

### Image sizing for backgrounds

- AI generators produce **1024×1024 squares** regardless of aspect ratio requests
- Always **resize to canvas dimensions** (e.g., 1920×1080) before adding
- Use **JPEG quality 70** instead of PNG — 10× smaller base64, prevents renderer crashes
- Keep total base64 image data **under 2MB** (7 JPEGs at ~150KB = ~1MB ✅, 7 PNGs at ~2MB = ~14MB ❌)

---

## ⚠️ CRITICAL: Custom Scene Validation

**Always validate custom scene code before adding to timeline.**

Custom scenes can compile successfully but crash at render time if they reference non-existent globals (e.g. `SharedComponents.X` instead of `PurpleGradientBg`). These render errors are invisible through the API — only visible in the editor UI.

### The Rule
1. **Always call `scene.validateCode` before `scene.addCustomScene`**
2. All sandbox globals are **direct names** — NOT namespaced
3. ✅ `fadeIn(frame, 0, 12)` — correct
4. ❌ `AnimationHelpers.fadeIn(frame, 0, 12)` — CRASHES
5. ✅ `<PurpleGradientBg />` — correct
6. ❌ `<SharedComponents.PurpleGradientBg />` — CRASHES
7. ✅ `fontFamily: primaryFont` — correct
8. ❌ `fontFamily: FONTS.block` — CRASHES

### Validation workflow
```json
// Step 1: Validate
{ "type": "scene.validateCode", "params": { "code": "const Scene = () => ..." } }
// Step 2: Only if valid, add to timeline
{ "type": "scene.addCustomScene", "params": { "code": "...", "name": "...", "from": 0 } }
```

---

## Video Building Best Practices

### Content structure
When building a full video (e.g., a reel), follow this pattern:
1. **Set dark canvas background** — `editor.setBackground` with `#0a0a0f`
2. **Add all background scenes FIRST** (they go to bottom tracks after reorder)
3. **Add LightLeak transitions** at section boundaries (1s each, centered on boundary ±0.5s)
4. **Add all text/content LAST** (they go to top tracks after reorder)
5. **Call `editor.reorderTracks`** to fix layer ordering
6. **Call `editor.save`** to persist

### Canvas background — prevents white flashes
**ALWAYS set a dark background before adding content:**
```json
{ "type": "editor.setBackground", "params": { "type": "color", "value": "#0a0a0f" } }
```
Even with full scene coverage, scenes can have rendering errors. The dark canvas is your safety net.

### Light Leak transitions between sections
Use the `LightLeaks` scene as overlay transitions between sections.

**⚠️ ALWAYS use `mode: "evolve-only"` for transitions.** The WebGL shader has two phases (evolve + retract). With default `"full"` mode, BOTH play — looks like the effect fires twice. `evolve-only` doubles the internal shader duration so only the reveal phase is visible.

| Mode | Use For |
|------|---------|
| `"evolve-only"` | ✅ Transitions (single flash reveal) |
| `"full"` | Standalone atmospheric overlays only |
| `"retract-only"` | Disappear/fade-out effects |

```json
{ "type": "scene.addLibraryScene", "params": {
  "sceneId": "LightLeaks", "from": 11500, "durationMs": 1000,
  "sceneProps": { "preset": "warm-film", "mode": "evolve-only", "intensity": 0.9, "background": "transparent", "blendMode": "screen" }
}}
```
Presets: `warm-film`, `cool-blue`, `golden-hour`, `rainbow`, `pink-dream`, `subtle-flare`, `neon-glow`, `cinematic-red`.
Place each 1s leak centered on each scene boundary (0.5s before + 0.5s after).

### Scene type selection
Choose the right scene type for each need (see `scenes-and-templates.md` for full guide):
- **Library scene** (`scene.addLibraryScene`) — **Default choice.** 159 pre-built templates. Configurable via sceneProps.
- **Custom scene** (`scene.addCustomScene`) — Simple one-off visuals. Inline JSX with globals, no imports. Users can edit code live in UI.
- **Bundled scene** (`scene.addBundledScene`) — Complex scenes needing real imports (`@remotion/noise`, video, shapes). Full `.tsx` compiled via esbuild. Users can view/edit source and rebuild in UI.

### Scene coverage — NO GAPS
Ensure background scenes cover the FULL video duration with no gaps. Gaps = white/empty frames.
- Plan scene time ranges to be contiguous: 0-5s, 5-15s, 15-25s, etc.
- Verify with `GET /api/state` — check all scene `display.from`/`display.to` ranges

### Scene transitions — `enterAnim` / `exitAnim`
**Contiguous scenes MUST use `enterAnim: { type: 'none' }` (hard cut).** Using `fade` on back-to-back scenes causes a white flash at the boundary. `fade` is only appropriate when there's a deliberate gap, a LightLeak overlay, or an artistic fade-from-black.

New scenes default to `enterAnim: none`. Only change to `fade` with specific creative intent. See `scenes-and-templates.md` for full transition guide, decision table, and `scene.updateSceneProps` examples.

### Scene sizing — auto-handled by infrastructure
Scene dimensions are automatically handled by the 3-layer defense system (see `scenes-and-templates.md` for details):
1. **API Server** auto-injects `width`, `height`, `orientation` from canvas
2. **Command Executor** reads canvas store if no explicit params
3. **Player Renderer** defaults native dims to container dims

**You do NOT need to manually set scene dimensions** — just ensure the canvas is the right size before you start. For partial-layout scenes (split-screen, PiP, insets), pass explicit `width`/`height` to the scene command.

### ⚠️ CRITICAL: Scene Text vs Track Text — Avoid Overlap

**Many scenes have BUILT-IN text** rendered inside the Remotion component (title, subtitle, overlayTitle, textLine1, etc.). Adding separate text track items with the same content creates DOUBLE overlapping text.

#### Rule: Check scene props BEFORE adding text items
```bash
# Before adding text overlays, check what text the scene already renders:
scene.getSceneProps({sceneId: "StarfieldWarpScene"})
# → inputSchema: "overlayTitle?, overlaySubtitle?, starCount?"
# If the scene has text props, that text is ALREADY rendered inside the scene!
```

#### When to use scene props vs track text

| Text Type | Where to Put It | Example |
|---|---|---|
| Scene title/heading | **Scene prop** (`sceneProps.title`) | "The AI Revolution" inside StarfieldWarp |
| Scene subtitle | **Scene prop** (`sceneProps.subtitle`) | "Everything Changes Now" inside the scene |
| Data labels in charts | **Scene prop** (`sceneProps.items`) | Bar labels in AnimatedBarScene |
| Additional callout/stat | **Track text item** | "97% Accuracy" floating overlay |
| CTA button text | **Track text item** | "Start Creating Today →" at video end |
| Caption/narration | **Track text item** | Lower-third subtitle text |

#### If you must use BOTH scene text AND track text
Position track text in **non-overlapping zones**:
- Scene text is usually centered → put track text in **lower third** (y > 70% of canvas height)
- Or use **top bar** (y < 15% of canvas height)
- Never place track text at the same Y position as scene's built-in text

#### Scene text prop patterns
- `overlayTitle` / `overlaySubtitle` — text rendered on top of visual (StarfieldWarp, Galaxy, etc.)
- `title` / `subtitle` — primary scene text (MetricDashboard, GrandFinale, etc.)
- `textLine1` / `textLine2` — multi-line scenes (GlitchText)
- `beforeTitle` / `afterTitle` — comparison scenes (BeforeAfter)
- `keywords[]` — word arrays (GrandFinale)
- Pass empty string `""` to HIDE a scene's built-in text if you want to use track text instead

### Text pacing — Sequential reveals
**Never dump multiple lines in one text item.** Instead:
- Break content into separate text items, each with its own timing
- Stagger reveals: line 1 appears at 0s, line 2 at 1s, line 3 at 2s
- Each text item should show for 2-4 seconds before the next appears
- Use different Y positions for different lines (e.g., y=500, y=650, y=800)

Example — instead of:
```json
{"text": "Line 1\nLine 2\nLine 3", "from": 5000, "to": 10000}
```
Do:
```json
{"text": "Line 1", "from": 5000, "to": 8000, "y": 500}
{"text": "Line 2", "from": 6000, "to": 9000, "y": 650}
{"text": "Line 3", "from": 7500, "to": 10000, "y": 800}
```

### Text positioning — Calculate bounds, don't guess

**⚠️ Text items have physical height.** The rendered height of a text item is approximately `fontSize × 1.5` (line-height). When stacking multiple text items vertically, you MUST account for this:

```
Text rendered height ≈ fontSize × 1.5
Next item top ≈ previous top + (previous fontSize × 1.5) + gap(20-40px)

Example: "97.3%" at fontSize:120, top:400px
  → bottom edge ≈ 400 + (120 × 1.5) = 580px
  → next text must be at top: 620px+ (580 + 40px gap)
```

**Common font size → height reference:**
| fontSize | Approx height | Min gap to next text |
|----------|--------------|---------------------|
| 24-32px  | ~40-48px     | top + 60px          |
| 48-64px  | ~72-96px     | top + 120px         |
| 80-100px | ~120-150px   | top + 180px         |
| 120px+   | ~180px+      | top + 220px         |

**Canvas zones for 1920×1080:**
- Top bar: `top: 30-100px` (headings)
- Upper third: `top: 100-360px`
- Center: `top: 360-720px` (hero text)
- Lower third: `top: 720-950px` (subtitles, captions, CTAs)
- Bottom safe: `top: 950-1040px` (small labels only)

### Style defaults
Text/caption commands use defaults from the **selected editing style** in `_Style/<style-name>/style.json`.
Read the active style's `style.json` before creating content — it defines fonts, colors, sizes, shadows, and the role system.
- **Role system**: Use `params.role` to select preset (`headline`, `title`, `subtitle`, `body`, `label`, `caption`); auto-inferred from text length if not provided

---

## Video & Image Styling (Borders, Rounded Corners)

Videos and images support CSS-like styling via `editor.editItem`:

| Param | Type | Example | Notes |
|-------|------|---------|-------|
| `borderWidth` | number | `4` | Pixels |
| `borderColor` | string | `"#8A2BE2"` | Any CSS color |
| `borderRadius` | number | `30` | Pixels. Use `999` for circle/pill |

```json
{ "type": "editor.editItem", "params": {
  "itemId": "abc123",
  "borderWidth": 4, "borderColor": "#8A2BE2", "borderRadius": 30
}}
```

Supported on: **video** (commandExecutor line ~741-743), **image** (~654-656), **text** (~546-549).

---

## Master Volume Control

The editor has a **master volume** that scales all audio/video item volumes:

- **Store state**: `masterVolume` (0-100, default 100), `masterMuted` (boolean)
- **UI**: Volume icon + slider in the bottom toolbar (next to zoom controls)
- **How it works**: In `composition.tsx`, each item's `details.volume` is multiplied by `masterVolume` before being passed to Remotion's `<Video>` and `<Audio>` components
- **Mute toggle**: Click the volume icon to toggle mute (sets effective volume to 0 without changing the slider position)

No API command exists yet — master volume is UI-only. Individual item volumes can be set via:
```json
{ "type": "editor.editItem", "params": { "itemId": "abc123", "volume": 80 } }
```

---

## Zombie Item Cleanup (`editor.purgeItems`)

`editor.deleteItems` sometimes leaves zombie entries (items with `type: undefined`) in the store. These survive saves and reloads.

**Detection**: `GET /api/state` → check `trackItemsMap` for entries with no `type` or `type: undefined`.

**Fix**: Use `editor.purgeItems` to force-remove them:
```json
{ "type": "editor.purgeItems", "params": { "itemIds": ["zombieId1", "zombieId2"] } }
```

This command directly removes items from **both** the stateManager AND the zustand store. Regular `editor.deleteItems` only uses dispatch events, which can fail for corrupted items.

### Why two stores matter
The editor has TWO state stores that must stay in sync:
- **stateManager** (from `@designcombo/state`): Primary state, used by dispatchers
- **zustand useStore**: UI-facing store, used by `getDesignJson()` for saving

If you only update one, changes won't persist through save. `editor.purgeItems` learned this the hard way — v1 only cleaned stateManager, zombies reappeared on save.

---

## Fixing Broken Media References (`editor.replaceMedia`)

When a video/image file is moved or renamed, items referencing the old path break. Fix without recreating:

```json
{ "type": "editor.replaceMedia", "params": {
  "itemId": "abc123",
  "src": "/Users/shubham/Downloads/new-video.mp4"
}}
```

The local path is auto-resolved to a media server URL. This dispatches `REPLACE_MEDIA` internally.

**Workflow to find and fix broken items:**
1. `GET /api/state` → scan `trackItemsMap` for items with broken `src` paths
2. Check if the file exists: `ls -la <path>`
3. If renamed, find the new file and use `editor.replaceMedia` with the new path
4. Verify with `GET /api/state` again

---

## Video Thumbnails in Timeline

Timeline tracks show thumbnail previews for video items. The system:

1. First tries `@designcombo/frames` `MP4Clip` for filmstrip extraction
2. **MP4Clip often crashes** with `"stream is done, but not emit ready"` for local video streams
3. **Fallback**: `generateVideoThumbnail()` creates a hidden `<video>` element, seeks to 1 second, captures a frame via `<canvas>`, returns a `data:image/jpeg;base64,...` URL
4. The thumbnail is stored as `previewUrl` in the item's metadata

**For AI-added videos**: The `editor.addVideo` command sets `metadata: { isAgentTrack: true }` but NOT `previewUrl`. The timeline Video class auto-generates the thumbnail on initialization if `previewUrl` is empty.

**Data URL handling**: `loadFallbackThumbnail()` must NOT append `?t=timestamp` cache-busting to data URLs — only to HTTP URLs.

---

## Design Save & Load

### ⚠️ CRITICAL: Save before kill/restart
**Always call `editor.save` before terminating the app.** Autosave only writes local `.skilltown` files — it does NOT persist to the cloud DB. Killing the app without saving means:
- Cloud DB has stale data (last explicit save)
- Local autosave may be seconds/minutes behind current state
- Any unsaved edits are permanently lost

```bash
# Always run before kill/restart/rebuild:
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type": "editor.save", "params": {}}'
```

### Save
`editor.save` persists the design to the Next.js backend database. It may timeout for projects with large bundled scene code.

```bash
# Save command:
curl -s -X POST "http://127.0.0.1:$PORT/api/execute" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type": "editor.save", "params": {}}'
# → {"status":"success","result":{"saved":true}}
```

### 💾 When to save (quick reference)

| Trigger | Why |
|---------|-----|
| After completing each build phase (scenes, content, text) | Prevents losing earlier phases if a later one fails |
| After every 5-10 commands in a long editing session | Incremental persistence — don't batch all saves to the end |
| Before running diagnostics at end of session | Ensures diagnostics reflect the saved state |
| Before killing, restarting, or rebuilding the app | **MANDATORY** — autosave ≠ cloud save |
| After fixing errors (deleted broken items, re-added) | Lock in the fix so it's not lost |
| Before rendering/exporting | Ensures render uses the latest state |
| After `editor.reorderTracks` | Track order is a common source of visual bugs — save the fix |
| When switching to a different content/project | Current project won't auto-save after navigation |

**Rule of thumb:** If you'd be upset losing the work you just did, call `editor.save` now.

**Reliable alternative for bundled scenes:** Use `project.saveAutosave` to write the current full project state directly to:
```
~/.skilltown-desktop/projects/<contentId>.autosave.skilltown
```

The autosave file is what `POST /api/project/restore` reads. This bypasses the DB save mechanism. **Note:** this saves LOCALLY only — it does NOT clear the editor's unsaved indicator (which tracks cloud-save state). To sync to cloud, call `editor.save` when it's healthy.

### Autosave timer
The Electron main process runs an autosave timer that periodically captures state via IPC and writes to the `.skilltown` file. However, this timer may not be active for all content IDs. If `editor.save` fails and the autosave timer isn't running, call `project.saveAutosave`.

### Load / Restore
After navigating to a content page, use `POST /api/project/restore` to reload the saved design:
```bash
curl -X POST http://127.0.0.1:$PORT/api/project/restore \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"contentId": "content_abc..."}'
```
Or use `POST /api/navigate` with `autoRestore: true` to navigate + wait + restore in one call.

### What survives reload
- ✅ Media server URLs (persistent, based on file paths)
- ✅ Saved design JSON (in autosave files)
- ❌ Blob URLs (stale after reload — never store these)
- ❌ In-memory state not yet saved

---

## Rendering (Export)

The render worker (`render-worker.cjs`) uses Remotion's `renderMedia()` with:
- `chromiumOptions: { gl: 'angle' }` — **required** for WebGL effects (light leaks, shaders)
- Without `gl: 'angle'`, WebGL-based scenes render as black frames

The same option is applied to `selectComposition()` so composition detection also works with WebGL content.

For content-linked local renders, call `POST /api/render` with `contentId` and `uploadToCloud: true` (default when `contentId` is present). The job renders MP4 locally, extracts a frame-1 thumbnail, uploads both through the Content upload-URL flow, updates `Content.videoUrl`, `Content.videoSasUrl`, `Content.downloadableSasUrl`, `Content.sasExpiresAt`, and `Content.thumbnail`, and returns/polls `cloudVideoUrl`, `thumbnailUrl`, and `contentUpdated`. If upload fails, the local render still succeeds and reports the failure reason.

### Render architecture
```
Electron main → spawns render-worker.cjs (child process)
render-worker → @remotion/renderer.renderMedia()
             → Chromium with ANGLE WebGL
             → outputs MP4 to specified path
```

---

---

## Time Units ⚠️

**Timeline edit fields use MILLISECONDS unless a command explicitly documents transcript-style aliases:**
- `from: 5000` = 5 seconds
- `to: 10000` = 10 seconds
- `durationMs: 3000` = 3 seconds

Scene commands also use milliseconds:
- `from: 5000` = start at 5 seconds
- `durationMs: 3000` = 3 seconds long

Most commands use milliseconds. Exception: `content.applyCaptions` also accepts `subtitles[].startTime` / `subtitles[].endTime` and `words[].start` / `words[].end` in seconds.

---

## Media Metadata Extraction

Always pre-extract video metadata before `editor.addVideo`:

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,duration \
  -of json /path/to/video.mp4
```

For duration in milliseconds (required by `editor.addVideo`):
```bash
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 /path/to/video.mp4
# → "36.500000"  (multiply by 1000 → 36500)
```

---

## End-to-End Verification Checklist

After building a video, run this sequence before reporting done:

1. **`editor.reorderTracks`** — fix layer z-order
2. **💾 `editor.save`** — persist to backend (**MANDATORY — never skip this**)
3. **`GET /api/state`** — verify:
   - Expected number of items in `trackItemsMap`
   - No zombie items (all have valid `type`)
   - Scene coverage has no gaps (check `display.from`/`display.to`)
   - All media `src` URLs are reachable (media server URLs, not blob/stale)
4. **`GET /api/diagnostics?full=true`** — verify clean status (0 console errors, 0 scene errors, timeline valid, media healthy)
5. **Render (optional)** — export and verify output file exists

---

## Caption Style Defaults

Caption styling comes from the selected style in `_Style/<style-name>/style.json → captions`.
Read the active style's `captions.md` for detailed guidelines.

---

## Known Gotcha — template.tsx

When editing scene/template rendering code: `TemplateInner` component does NOT have `item` in scope — use the `itemId` prop instead. The `item` object only exists in the parent `Template` component.

---

## Codebase Map & File Locations

| File / Path | Purpose |
|------|---------|
| `~/.skilltown-desktop/api.json` | Discovery file — port, token, mediaServerPort, pid |
| `~/.skilltown-desktop/projects/<contentId>.autosave.skilltown` | Autosave files |
| `~/.skilltown-desktop/agent-activity.jsonl` | Persisted activity log |
| `SkillTown-Desktop/electron/api-server.cjs` | HTTP API server for AI control |
| `SkillTown-Desktop/electron/main.cjs` | Electron main process, media server, IPC, navigation |
| `SkillTown-Desktop/electron/render-worker.cjs` | Remotion render worker (child process) |
| `SkillTown/…/AgentCommandQueue/commandExecutor.ts` | Central command handler for ALL editor commands |
| `SkillTown/…/AgentCommandQueue/commandHandlers/` | Individual command handler modules |
| `SkillTown/…/ElectronAgentBridge.tsx` | Renderer-side bridge — signals readiness, handles IPC |
| `SkillTown/…/store/use-store.ts` | Zustand UI store (masterVolume, cropMode, etc.) |
| `SkillTown/…/player/composition.tsx` | Renders timeline items into Remotion sequences |
| `SkillTown/…/ContentDetailView.tsx` | Content page — auto-activates editor |
| `remotion-projects/remotion-templates/src/scenes/charts/` | Chart scene components |

### API Endpoints Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/info` | No | Basic connection info (port, editorReady, contentId, mediaServerPort) |
| GET | `/api/health` | Yes | Comprehensive health check (healthy/degraded/error) |
| GET | `/api/diagnostics` | Yes | **Unified error check** — console errors + scene errors + optional timeline/media. Use `?afterSeq=N` for delta, `?full=true` for deep check |
| GET | `/api/events` | Yes | SSE event stream (real-time command results, state changes, errors, render progress) |
| GET | `/api/metrics` | Yes | API stats, connections, uptime |
| GET | `/api/navigation` | Yes | Current URL, editor state, contentId |
| GET | `/api/content/list` | Yes | List content from remote (cloud) + local (autosave) sources |
| GET/POST | `/api/bridge/instagram/*` | Yes | MCP mirror bridge for Instagram accounts, publish/status, token validation, posts, and CTA automation (`update_cta` supports `messageBody` + `buttons[]`; publish status auto-syncs CTA draft → production) |
| POST | `/api/bridge/youtube/*` | Yes | MCP mirror bridge for YouTube publishing |
| POST | `/api/bridge/content/*` | Yes | MCP mirror bridge for content publish configuration |
| GET/POST | `/api/bridge/context/*` | Yes | MCP mirror bridge for context store list/search/get/edit/manage |
| GET/POST | `/api/bridge/learn/*` | Yes | MCP mirror bridge for Learn/KB list/search/get/edit/manage/categories |
| POST | `/api/navigate` | Yes | Navigate to URL, auto-appends `?view=editor`. Options: `waitForReady`, `autoRestore`, `timeoutMs` |
| POST | `/api/editor/wait-ready` | Yes | Wait for editor readiness (blocking) |
| POST | `/api/project/restore` | Yes | Restore autosave project into editor |
| POST | `/api/reload` | Yes | Reload current page (with optional waitForReady/autoRestore) |
| GET | `/api/capabilities` | Yes | Auto-generated full command catalog with categories |
| POST | `/api/debug/toggle` | Yes | Toggle verbose debug logging |
| POST | `/api/execute` | Yes | Execute editor command. Response includes `warnings`, `hasNewErrors`, `diagnosticsCursor` |
| POST | `/api/batch` | Yes | Execute multiple commands (supports `transaction: true` for rollback) |
| GET | `/api/state` | Yes | Get current editor state/design (⚠️ returns null for empty timelines) |
| POST | `/api/scenes` | Yes | Create custom .tsx scenes |
| POST | `/api/scene-bundles/build` | Yes | Compile .tsx scene with imports (esbuild) |
| GET | `/api/scene-bundles` | Yes | List cached scene bundles |
| GET | `/api/scene-bundles/supported-imports` | Yes | List supported import packages |
| GET | `/api/scene-bundles/:id` | Yes | Get a specific bundle by ID |
| DELETE | `/api/scene-bundles/:id` | Yes | Delete a cached bundle |
| POST | `/api/render` | Yes | Start local render; with `contentId` + `uploadToCloud:true`, upload MP4 + thumbnail and update Content URLs |
| GET | `/api/console-errors` | Yes | Browser console errors/warnings. Params: `?afterSeq=N`, `?level=error`, `?search=text`, `?clear=true` |
| GET | `/api/logs` | Yes | Activity log (persisted to `~/.skilltown-desktop/agent-activity.jsonl`) |
| GET | `/api/skills` | Yes | List available skills |
| GET | `/api/skills/:name` | Yes | Load a specific skill doc |

---

## Media Path Rules

### Allowed directories for media server
`~/Movies`, `~/Downloads`, `~/Desktop`, `~/Documents`, `~/Pictures`, `~/Music`, `~/Codes`

### What happens with paths outside allowed directories
The media server returns a 403 error. **Workaround**: Copy/move the file into an allowed directory (e.g., `~/Downloads/`) before referencing it.

---

## Testing & Demo Quality Standards

When building test videos or demo content:
1. **Don't just add text items** — test diverse types: scenes, images, videos, animations, effects.
2. **Verify visually meaningful** — seek through the timeline to check items render correctly at their time positions.
3. **Check track z-order** — text above scenes above backgrounds. Call `editor.reorderTracks` after adding all items.
4. **Test complex flows**: add → animate → edit props → reorder → delete → undo → save → restore.
5. **Clean up test artifacts** — don't leave stale test items cluttering the timeline.

---

## ⚠️ MANDATORY: Creative Planning Protocol

**Before ANY video editing session**, the AI MUST plan the creative direction. Never jump straight to API calls.

### Step 0: Verify Canvas Dimensions (CRITICAL)

**ALWAYS do this first before adding ANY scenes:**
```
1. query.getCanvasSize → check current dimensions
2. If wrong for content type → editor.resize {width: 1920, height: 1080} (landscape) or {width: 1080, height: 1920} (portrait)
3. THEN proceed with scene creation
```
- **Landscape (1920×1080)**: data-viz, charts, dashboards, comparisons, professional content
- **Portrait (1080×1920)**: Instagram Reels, TikTok, stories, mobile-first content
- If you add scenes to a wrong-sized canvas, they render squished with white space — and you must delete & re-add them

### Step 1: Define the Narrative Arc

Every video needs a structure. Choose one:

| Pattern | Structure | Best For |
|---|---|---|
| **Hook → Build → Payoff** | Attention grab → escalating content → climax | Reels, demos, showcases |
| **Problem → Solution** | Show the pain → reveal the fix | Product demos, tutorials |
| **Before → After** | Old way → new way | Transformations, comparisons |
| **Montage** | Themed collection of clips | Mood pieces, portfolios |

### Step 2: Storyboard the Scenes

Before writing any scene code, plan:
```
Scene 1 (0-5s):  [HOOK] — What grabs attention? What visual? What SFX?
Scene 2 (5-12s): [BUILD] — What develops the story?
Scene 3 (12-20s):[PEAK] — What's the payoff/climax?
Scene 4 (20-25s):[CLOSE] — How does it end?
```

### Step 3: Content Diversity Rules

- **Never reuse the same video clip in 3+ scenes** — find different source material
- **Vary the visual treatment** — don't do 3 Ken Burns in a row
- **Alternate pacing** — fast cut → slow scene → fast cut
- **Every scene must serve the narrative** — if it's just "showing off an effect," cut it

### Step 4: Audio Layering Plan

Before adding ANY audio:
1. **Background music** — select and add FIRST (vol 25-35, -12 to -9 dB)
2. **SFX mapping** — match each SFX to content context, not transition position
3. **Verify no dead silence** — no stretches > 3s without audio

### Content Layering Checklist (validate before presenting to user)

Run this checklist AFTER building the timeline, BEFORE telling the user it's done:

- [ ] Visual scenes have supporting text/captions where needed?
- [ ] Background music present (or intentionally omitted with reason)?
- [ ] SFX contextually matched to content meaning, not randomly placed?
- [ ] No dead silence stretches > 3 seconds?
- [ ] Videos not all muted with nothing replacing the audio?
- [ ] Narrative has a clear arc (not just a random sequence of effects)?
- [ ] Scene diversity — not reusing the same source material excessively?

**If any checkbox fails, fix it before presenting to the user.**
