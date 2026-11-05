# Native UI control (observe, click, drag, type, keys, upload, wait) and tab recording

ContentLead Desktop can drive one **explicit, active, visible app tab** (or a
detached panel window) with trusted native input (in-process CDP `Input.*`,
falling back to `webContents.sendInputEvent`; no remote debugging port). It can
observe the page, wait and verify, and record the tab (MP4 via ffmpeg, else WebM)
with a click/event sidecar. Use it when no
domain command exists: timeline multi-select + drag, board canvas gestures,
UI-only dialogs, uploads through a drop zone. **Prefer domain commands**
(`/api/execute`, bridge routes), because they are verifiable and idempotent; UI
input only proves dispatch.

Control is prompt-free and has no time limit. It ends on `ui-disable`, Help →
**Stop AI control and recording** (Cmd/Ctrl+Shift+Escape), switching/closing the
tab, a cross-document navigation/reload, or the window being hidden/minimised.
Same-document route changes (SPA navigation) keep control.

## Calling

```bash
API=$(python3 -c "import json,os;d=json.load(open(os.path.expanduser('~/.skilltown-desktop/api.json')));print(f\"http://127.0.0.1:{d['port']}\")")
TOKEN=$(python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/.skilltown-desktop/api.json')))['token'])")
ui() { curl -s -X POST "$API/api/ui" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$1"; }

curl -s "$API/api/tabs" -H "Authorization: Bearer $TOKEN"          # pick the tabId
curl -s "$API/api/ui" -H "Authorization: Bearer $TOKEN"            # action catalog
ui '{"action":"ui-enable","tabId":"TAB","idempotencyKey":"en-1"}'
ui '{"action":"ui-inspect","tabId":"TAB","params":{}}'
```

Never print the token. Body: `{action, tabId, params?, idempotencyKey}`.
- `tabId` is always required (except the OS-level `os-*` actions). Only trusted ContentLead origins (contentlead.in or
  the configured dev origin) are controllable, plus any allowed website inside the demo browser
  (`demo:main`, see "Demo browser (any website)"); the tab must be active and visible.
- Mutations need a unique `idempotencyKey` (`[A-Za-z0-9_-]{1,80}`). Re-sending the
  same key + params returns the original result (no double click); the same key
  with different params → `CONFLICT`.
- One action at a time per tab (`UI_BUSY` otherwise).
- Response: `{status:"ok",data}` (HTTP 200) or `{status:"error",code,message}`
  (400 invalid, 404 not found, 409 state/guard errors).

## Actions

`GET /api/ui` returns the authoritative catalog with every param and limit.
`ref` = any `selector`/`ref` returned by `ui-inspect`, `ui-snapshot` or `ui-screenshot-marks`.

**Control / safety**

| Action | Params |
|---|---|
| `ui-enable` / `ui-disable` | `{}` (`social:main` needs `{thirdPartyReadOnly:true}`; `demo:main` works on any allowed URL with full interaction) |
| `ui-status` | → `enabled, ready, readOnly, paused, pauseReason` |
| `ui-resume` | `{}`: resume after a human-takeover pause, once the person is done |
| `ui-log` | `{since?, limit?≤500, allTabs?}`: local action log `~/.skilltown-desktop/logs/agent-ui-*.jsonl` |
| `ui-checkpoint` | `{mode:"create"\|"restore"\|"list", checkpointId?, label?}`: editor project snapshot before risky work |

**Observe** (read-only)

| Action | Params |
|---|---|
| `ui-inspect` | `{selector?, frames?}` → ≤200 visible non-protected controls (incl. `canvas`) with selector + rect |
| `ui-snapshot` | `{selector?, maxNodes?}` → a11y-style tree `{depth, ref, role, name, states, value?, rect, agentId?, agentKey?}` |
| `ui-screenshot-marks` | `{selector?, max?, inline?, scale?}` → PNG with numbered boxes + `marks[{n, ref, role, name, rect}]` |
| `ui-read` | `{selector?, maxChars?}` → visible text + live `alerts` (role=alert/status, aria-live, sonner toasts) |
| `ui-windows` | `{}` → app tabs, detached panels (`panel:<id>`), social browser (`social:main`), demo browser (`demo:[{tabId:"demo:main",url,title,visible}]`) |

**Act** (mutations: `idempotencyKey` required)

| Action | Params |
|---|---|
| `ui-click` | `{selector\|ref \| x,y, frames?, button?:left\|right, clickCount?:1\|2, modifiers?, holdMs?:0-5000}` |
| `ui-drag` | `{from: selector\|{x,y}, to: {x,y}\|{dx,dy}, steps?:1-120, holdMs?, button?, frames?, modifiers?}` |
| `ui-hover` | `{selector \| x,y, frames?}` |
| `ui-scroll` | `{selector \| x,y, deltaY?, deltaX?}` (±2000; either axis alone works; nested scroll containers work) |
| `ui-type` | `{selector \| x,y, text (≤16000), replace?:bool}` |
| `ui-key` | `{selector\|ref \| x,y (optional), key, modifiers?, global?}`: keys listed below; `{key:"Escape", global:true}` closes menus with no target |
| `ui-select` | `{selector\|ref, value \| label}`: native `<select>` only (use `ui-click` for Radix/shadcn menus) |
| `ui-clipboard` | `{text, selector\|ref \| x,y (optional), restore?}`: paste into an editable field; the old clipboard is restored |
| `ui-upload` | `{selector\|ref, paths[1..20]}`: file input or drop zone, without the OS picker |
| `ui-dialog` | `{kind:"js"\|"open"\|"save"\|"clear", accept?, promptText?, paths?, path?, overwrite?, timeoutMs?}`: pre-answers the **next** dialog |
| `ui-tab-open` | `{url (same origin), activate?}`: opens a new tab; then `ui-enable` it |
| `ui-history` | `{direction:"back"\|"forward"\|"reload"}` (reload / cross-document navigation revokes control) |
| `ui-viewport` | `{width:320-3840, height:240-2160}`: consistent layouts for recordings |

**Wait / verify**

| Action | Params |
|---|---|
| `ui-wait` | exactly one of `selector, selectorGone, text, textGone, route ("/content/*"), networkIdle:true, editorReady:true`, plus `timeoutMs?≤30000` |
| `ui-batch` | `{steps:[{action, params?, expect?:<ui-wait params>}] (≤50), checkpoint?, continueOnError?}` → per-step results; stops at the first failure |
| `ui-diff` | `{mode:"before", selector?\|rect?}` → `diffId`; `{mode:"after", diffId}` → `changedRatio`, bbox, diff PNG |

**Record**

| Action | Params |
|---|---|
| `record-start` | see [Recording](#recording) |
| `record-stop` / `record-status` | `{recordingId}` → state, engine, frames, private `path`, `eventsPath` |
| `record-mark` | `{label, data?, x?, y?}`: labelled marker (e.g. `"zoom-here"`, `"sfx-whoosh"`) in the sidecar |
| `demo-start` / `demo-stop` / `demo-status` | Teach by demo: records the **person's** input → `batchSteps` for `ui-batch` |

**Playwright-style automation** (all levels/protected/payment/retry-key rules still apply)

`ui-click`, `ui-hover`, `ui-drag`, `ui-scroll` and `ui-type` are upgraded
automatically when you pass a locator or motion field. Locator target:
`{selector}` | `{text, exact?}` | `{role, name?, exact?}` | `{testId}` (matches
`data-agent-id`, then `data-testid`), plus `nth?`, `frames?`, `offset?:{x,y}`.
Before acting it waits (`timeoutMs`, default 5000) until the target is attached,
visible, enabled, stable and receives events (`UI_TIMEOUT` / `UI_TARGET_COVERED`).
The pointer moves along a smooth eased path (`moveDurationMs`, `steps`). Wheel
deltas are split into small notches. Results include `engine:"cdp"|"electron"`.
CDP input is marked as synthetic, so it never triggers the takeover pause. With
DevTools open it falls back to `sendInputEvent`.

| Action | Params |
|---|---|
| `ui-query` | `{target fields, includeHidden?, limit?}` → rects, visibility, enabled, short text |
| `ui-wait-for` | `{target fields, state?:visible\|hidden\|attached\|detached, timeoutMs?}` |
| `ui-wait-idle` / `ui-wait-stable` | network quiet + 2 frames / region pixels stop changing |
| `ui-move` | smooth pointer move to `{x,y}` or a target (guide a recording) |
| `ui-press` | `{key, modifiers?:[Alt\|Control\|Meta\|Shift], target?, global?, repeat?, showKeys?}` |
| `ui-screenshot` | `{target?\|clip?, format?:png\|jpeg, scale?, path?}` → `{path, width, height}`; border hidden; errors `UI_CAPTURE_TIMEOUT`/`UI_CAPTURE_EMPTY`, never empty |
| `ui-set-viewport` / `ui-reset-viewport` | `{width, height, deviceScaleFactor?, resizeWindow?}`: fixed framing for recordings |
| `ui-cursor` | `{show, preset?:reel\|subtle\|off, style?, size?, color?, ripple?, rippleColor?, rippleSize?, keys?, badge?, frame?}` |
| `ui-highlight` | `{target\|rect, label?, style?:box\|reel, spotlight?, durationMs?}` or `{clear:true}`; labels stay 8px inside the viewport (below the box when there is no room above, else just inside its top) |
| `ui-mouse-leave` | `{target?}`: clear hover cards/tooltips before a clean shot |

**AI badge and viewport frame (opt-in).** `badge` is `true`, `false` (default) or
`{text?, color?}`: a dark pill with a glowing sparkle and bold "AI" text riding just
below-right of the cursor tip (text: 1-24 chars of one-line plain text, rendered as
text only, never markup; color: `#rrggbb`, default the `rippleColor`). It scales with
`size`, bounces with the press and flips left/up near viewport edges. `frame:true`
(default `false`) adds a thin glowing inset outline in the ripple colour around the
viewport while the cursor is shown. Both are off in every preset; neither intercepts
input. They are removed on `show:false` and whenever control is revoked (`ui-disable`,
Stop, tab change/close, reload or full navigation).

```bash
ui '{"action":"ui-cursor","tabId":"TAB","params":{"show":true,"preset":"reel","badge":true,"frame":true}}'
ui '{"action":"ui-cursor","tabId":"TAB","params":{"show":true,"badge":{"text":"Agent","color":"#00FF88"}}}'
```

`modifiers` = unique subset of `["shift","control","meta","alt"]` (strictly
validated). They are held on the mouse/key events, so pages see
`shiftKey/ctrlKey/metaKey/altKey`.

`ui-key` keys: Enter Escape Tab Backspace Delete Arrow* Home End PageUp PageDown
Space `+ - =`. App shortcuts are the letters **A Z Y C X V S D K** with `control`
or `meta`: select all, undo, shift+Z/Y redo, copy/cut/paste, save, duplicate and
command menu. Keys go to the page only, never the OS. With no target, the key goes
to the page's focused element (`windowLevel:true`). control/meta/alt are refused
with Tab/ArrowLeft/ArrowRight (app tab and history shortcuts).

Coordinates are top-level viewport CSS pixels; zoom is handled for you.

### Stable refs

Refs are chosen in this order:
1. `[data-agent-id="…"]`
2. `[data-agent-id="…"][data-agent-key="<item id>"]` for repeated items
3. `#id`
4. A path anchored at the nearest marked ancestor, e.g.
   `[data-agent-id="clip-list"] > li:nth-of-type(3) > button:nth-of-type(1)`.

The web app marks editor toolbar, timeline, media bin, scenes, boards, YouTube,
Instagram, content, CRM and nav controls. The full list is in
`cl-editor/queries-and-state.md` → *Stable DOM markers*. Click them directly, e.g.
`{"ref":"[data-agent-id=\"timeline.split\"]"}`.

## Inspect → act → verify

1. `ui-enable`, then `ui-snapshot` / `ui-screenshot-marks` (or `ui-inspect`).
   For canvases (timeline, preview, boards), use the renderer hit-test commands below.
2. Perform **one** action, or a short `ui-batch` with `expect` waits.
3. Verify with `ui-wait`, `ui-read` (toasts), `ui-diff`, or domain state (`query.*`,
   or the hit-test commands again). `dispatched:true` is not proof of a saved change.
4. Recover from errors:
   - `UI_TARGET_*`: re-inspect.
   - `UI_CONTEXT_CHANGED` / `UI_CONTROL_DISABLED`: re-check the tab and `ui-enable`
     again. If the human stopped control, do not silently restart it; ask or report.
   - `UI_PAUSED`: the person took over. Wait, then `ui-resume` only when appropriate.

### Timeline multi-select + move (canvas)

The Fabric timeline is a canvas. Aim with `timeline.getItemRects`, which returns
viewport CSS px (the same space as `/api/ui`). Only use points where `hittable` is
`true`.

```bash
ex() { curl -s -X POST "$API/api/execute" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$1"; }

# 1. Geometry: items[] {id, from, to, selected, hitPoint{x,y}, hittable}; mapping {pxPerSecond, pxPerMs, ...}
ex '{"type":"timeline.revealItem","tabId":"TAB","params":{"itemId":"A"}}'
ex '{"type":"timeline.getItemRects","tabId":"TAB","params":{"itemIds":["A","B"],"visibleOnly":true}}'

# 2. Click A's hitPoint, then add B with shift ("meta" on macOS / "control" on Windows toggles one item)
ui '{"action":"ui-click","tabId":"TAB","params":{"x":412,"y":618},"idempotencyKey":"sel-a"}'
ui '{"action":"ui-click","tabId":"TAB","params":{"x":575,"y":618,"modifiers":["shift"]},"idempotencyKey":"sel-b"}'

# 3. Move both 2 s right: dx = 2 * mapping.pxPerSecond (e.g. 2 * 48 = 96), dragging from A's hitPoint
ui '{"action":"ui-drag","tabId":"TAB","params":{"from":{"x":412,"y":618},"to":{"dx":96,"dy":0},"steps":16},"idempotencyKey":"mv-ab"}'

# 4. Verify: both selected and `from` shifted by ~2000 ms (snapping may round it)
ex '{"type":"timeline.getItemRects","tabId":"TAB","params":{"itemIds":["A","B"]}}'
```

Re-read rects after any scroll, zoom or selection change. Trim handles
(`handles.left/right`) exist only on selected clips. `ui-key {"key":"Delete"}` or
`{"key":"D","modifiers":["meta"]}` then acts on the selection. Boards work the same
way with `board.getNodeRects` / `board.revealNode`, and the preview with
`preview.getLayerRects`.

### Batch with checkpoint

```bash
ui '{"action":"ui-batch","tabId":"TAB","idempotencyKey":"b-1","params":{"checkpoint":true,"steps":[
  {"action":"ui-click","params":{"ref":"[data-agent-id=\"timeline.split\"]"}},
  {"action":"ui-key","params":{"key":"Z","modifiers":["meta"]},"expect":{"networkIdle":true}}]}}'
# failed? ui-checkpoint {"mode":"restore","checkpointId":"<from result>"}
```

### WebSocket (lower latency + live frames)

- Endpoint: `ws://127.0.0.1:<port>/api/ui/ws`, localhost only.
- Auth: `Authorization: Bearer` header or `?token=`.
- Requests: send `{id, action, tabId, params, idempotencyKey}` and get
  `{id, status, data|code}` back. The protocol matches `POST /api/ui`.
- Frames: `{id, action:"subscribeFrames", tabId, params:{fps≤10, scale≤0.5, quality?, format?:"base64"|"binary"}}`
  streams `{type:"frame", seq, data (JPEG)}` for a controlled tab. Frames stop
  when control is revoked.
- Unprompted notices: `{type:"paused"|"revoked"|"frames-stopped"}`.

## AI control levels (set by the person only)

Every action in `GET /api/ui` has a `level`. The person picks the level in
**Help ▸ AI control** (native confirmation dialog for Extended/Full; duration
"this session only", "for 1 hour" or "always"). Agents can only **read** it
(`ui-status` → `level`, `levelScope`, `levelExpiresAt`, `spendCapInr`,
`spentInr`, `socialSites`) and **lower** it (`ui-level-lower {"level":"standard"}`
or `ui-disable`). No API, WebSocket or page path can raise it
(`UI_LEVEL_RAISE_FORBIDDEN`). Actions above the current level return
`UI_LEVEL_REQUIRED`; ask the person to change it, never work around it.

| Level | Adds |
|---|---|
| `standard` (default) | Everything below in "Protected" stays blocked |
| `extended` | Sign-in/out, OAuth connect/disconnect, account and settings controls (`data-agent-human-only="account"`); click/type/drag on the social sites the person ticked (Help ▸ AI control ▸ Social sites) |
| `full` | Payments (see below), password/OTP typing, any file input, uploads from any non-credential folder, `ui-eval`, OS-level `os-*` input. Only `data-agent-human-only="always"` stays blocked |

- **Payments (full)**: a payment control needs `confirmPayment:true` on `ui-click`
  / `ui-invoke` (`UI_PAYMENT_CONFIRM_REQUIRED`), only when the person asked for that
  purchase. The rupee amount is read from the button (else the largest ₹ amount in
  the surrounding checkout); it must fit the person's per-session spend cap
  (default ₹1000) → `UI_PAYMENT_CAP_EXCEEDED`; unreadable or non-INR amounts →
  `UI_PAYMENT_AMOUNT_UNKNOWN` unless the person chose "No limit". Results carry
  `payment {amountInr, source, capInr, spentInr}` and the log flags `payment:true`.
- **Secrets (full)**: `ui-type` into password/OTP fields works, but values are
  never returned by `ui-snapshot`/`ui-agent-ids` and log entries are `sensitive:true`
  with text dropped.
- **Uploads**: the person can add folders (Help ▸ AI control ▸ Extra upload
  folders). In full any regular non-hidden file is allowed, but credential stores
  (Keychains, browser profiles, `~/.ssh`, `.env`, `/etc`, the app's own
  `~/.skilltown-desktop/*.json`) are always refused.
- If DevTools is open on the tab, `ui-upload`/`ui-dialog` close it for the action
  and reopen it afterwards.

### Generic access: `ui-agent-ids` + `ui-invoke`

Any feature without a domain command can be reached through its
`data-agent-id` marker:

```bash
ui '{"action":"ui-agent-ids","tabId":"TAB","params":{"max":200}}'   # [{agentId, agentKey?, role, label, state, hittable, rect}]
ui '{"action":"ui-invoke","tabId":"TAB","params":{"agentId":"media-bin.item","agentKey":"clip-42","action":"click","modifiers":["meta"]},"idempotencyKey":"inv-1"}'
ui '{"action":"ui-invoke","tabId":"TAB","params":{"agentId":"export.fps","action":"select","value":"60 fps"},"idempotencyKey":"inv-2"}'
ui '{"action":"ui-invoke","tabId":"TAB","params":{"agentId":"captions.enabled","action":"toggle"},"idempotencyKey":"inv-3"}'  # before/after/toggled
```

Actions: `click` (`modifiers?`, `confirmPayment?`), `toggle`, `focus`, `type`
(`value`, `replace?`), `select` (native `<select>` by value or label). It uses the
same native input path and guards as `ui-click`/`ui-type`/`ui-select`. Several
matches → `UI_TARGET_AMBIGUOUS` (pass `agentKey`); other errors `UI_NOT_TOGGLE`,
`UI_NOT_EDITABLE`, `UI_NOT_SELECTABLE`, `UI_OPTION_NOT_FOUND`. Both are allowed
inside `ui-batch`.

### `ui-eval` (full only)

`{"code":"return document.title + args.x;","args":{"x":1},"world":"isolated","timeoutMs":5000}`:
`code` is an async function body (≤20000 chars) that runs in an isolated world
(DOM, no page globals) unless `world:"main"`. The result must be JSON (≤256 KB)
and it times out after ≤10 s (`UI_EVAL_TIMEOUT`, `UI_EVAL_THREW`,
`UI_EVAL_RESULT_INVALID`, `UI_EVAL_RESULT_TOO_LARGE`). The log stores a SHA-256
and the first 200 chars of the code. Use it only for gaps: a synchronous infinite
loop cannot be interrupted.

### OS-level input `os-*` (full only)

These actions drive the real pointer and keyboard outside the app window, for
example Finder, native file dialogs or dragging a file into the app. They take
**no `tabId`**:

- `os-status`, `os-screenshot {displayId?}` and `os-list-windows` are read-only.
- `os-click`, `os-move`, `os-drag`, `os-scroll`, `os-type`, `os-key` and
  `os-activate-app` each need an `idempotencyKey`.
- Coordinates are global DIP points from `os-status.displays[].bounds`.

```bash
ui '{"action":"os-status"}'
ui '{"action":"os-key","params":{"key":"G","modifiers":["meta","shift"]},"idempotencyKey":"go-1"}'   # Finder: Go to Folder
```

**macOS setup** (once, by the person): System Settings ▸ Privacy & Security ▸
**Accessibility** (input) and **Screen Recording** (screenshots and window
titles) must list ContentLead. In dev builds, grant them to Electron or the
terminal instead. Shortcuts: Help ▸ AI control ▸ macOS permissions. Missing
permission → error with `permission` + `settingsUrl`; tell the person, never try
to open it yourself.

**Stops and refusals:**
- OS input stops on Help ▸ Stop (⌘/Ctrl+⇧+Esc), when the level drops below full,
  and when the person takes over (`UI_PAUSED` until `ui-resume`).
- Password fields with macOS secure input refuse keys (`OS_SECURE_INPUT`).
- `os-type` text is never logged.

## Protected (human-only at the standard level)

`UI_HUMAN_ONLY` is returned for: password/OTP/file inputs, `autocomplete`
credential/card fields, anything inside `[data-agent-human-only]`, and controls
labelled with specific credential/payment/OAuth terms (sign in/out/up, log in/out,
pay/payment/checkout/purchase/buy now, connect/disconnect Instagram/YouTube/Google…,
API key/secret/access token, delete account, payout/withdraw/KYC/IFSC/bank
account, authorize). Off-origin links and links to `/auth`, `/login`,
`/checkout`, `/pay` are blocked. While a protected dialog or password/OTP field is
visible, all input is blocked. Generic words such as "account" or "admin" are
**not** blocked. Below `full` there is no script execution and no system-wide input.
Markers can be typed: `data-agent-human-only="account"` (unlocked in extended),
`"payment"` (full + confirmPayment), `"always"` (never unlocked); a bare marker
unlocks only in full.

## Safety while controlling

- A thin animated border marks the controlled tab. It is hidden in recordings.
- **Human takeover**: real clicks, keys or scrolling by the person in that tab
  pause control (`UI_PAUSED`, `ui-status.pauseReason`). Mouse movement alone does
  not. Your own synthetic input is tracked, so it never pauses control.
- Every action is appended to the local JSONL log (`ui-log`). Typed text is
  truncated; text sent to protected/sensitive fields is never logged.
- `ui-upload` and `ui-dialog` paths must be regular, non-hidden files under
  ~/Downloads, ~/Desktop, ~/Movies, ~/Pictures, ~/Music, ~/Documents/ContentLead or
  ~/.skilltown-desktop. Paths are resolved with realpath (no symlink escape),
  credential-like names are refused, and the size cap is 2 GiB. Violations return
  `UI_PATH_NOT_ALLOWED` / `UI_PATH_SENSITIVE`.
- `social:main` (third-party sites) is read/scroll only unless the level is
  extended/full and the person allowed that site. Panel windows
  (`panel:<id>`) behave like tabs.

## Demo browser (any website)

A separate app window for recording polished demos of **any https website** (tabId `demo:main`). There is no
per-site prompt.
- **Isolated session**: it uses its own persistent partition `persist:cl-demo`. ContentLead's login and cookies are never
  reachable from it.
- **Logins persist**: the person can sign in by hand inside the window, and that login survives app restarts.
- **No app APIs in the page**: there is no preload, and contextIsolation, sandbox and nodeIntegration-off are all on.

| Action | Params → result |
|---|---|
| `demo-browser-open` | `{url?, width?, height?, timeoutMs?}`. `url` defaults to `about:blank`; a bare host gets `https://`. `width` 320–3840 and `height` 240–2160 go together and set the **page viewport** in CSS px. `timeoutMs` is 0–60000 (default 15000). Creates/shows/focuses the window and loads the URL. → status fields + `{created, timedOut, loadError?}` |
| `demo-browser-navigate` | `{url, timeoutMs?}` → status + `{timedOut, loadError?}` |
| `demo-browser-history` | `{direction:"back"\|"forward"\|"reload"\|"stop"}` → status + `{dispatched, direction}` (`UI_NO_HISTORY` if there is nowhere to go) |
| `demo-browser-status` | `{}` (read, no key) → `{tabId, open, visible, focused, url, title, loading, canGoBack, canGoForward, bounds:{x,y,width,height}, contentSize:{width,height}, partition, lastBlocked?:{url, reason, at}}` |
| `demo-browser-close` | `{}` → `{tabId, closed, open:false, note}`. Ends control and recording. Logins stay. |
| `demo-browser-clear-session` | `{confirm:true}` (required) → status + `{cleared:true}`. Wipes cookies, storage and cache of the demo partition, which logs the person out of every site. Only call this when asked. |

All of these actions need `tabId:"demo:main"`. Mutations need an `idempotencyKey`. `navigate`, `history` and `status` are
allowed as `ui-run` steps.

**URL policy**: `https://` is allowed for any host. `http://` is allowed only for localhost, `*.localhost`, `127.x`, `::1`,
`10.x`, `172.16–31.x` and `192.168.x`. `about:blank` is also allowed. Everything else is refused with
`UI_URL_BLOCKED`: `file:`, `javascript:`, `data:`, `blob:`, `chrome:`, `devtools:`, `view-source:`, other `about:` pages
and URLs with embedded credentials.
- The same check runs on in-page navigations and main-frame redirects. A blocked one stays on the current page and
  shows up in `lastBlocked`.
- `window.open` and `target=_blank` load in the **same window**. No popup windows are created.
- A site's "Leave page?" (`beforeunload`) prompt never blocks navigate, close or app quit here. If a navigation is still cancelled, it returns `loadError:"NAVIGATION_CANCELLED"`.
- Single page: there are no demo tabs.

**Control**: `ui-enable` on `demo:main` needs no trusted origin. It gives full interaction: clicks, typing, scroll,
`ui-run`, `ui-cursor` (badge/frame/ripple), `ui-highlight`, `ui-set-viewport`, screenshots and `record-start/mark/status`.
- Off-origin links are ordinary clicks here. Navigation is guarded by the URL policy above.
- Control and an active recording **survive page loads**, including cross-site ones, and the agent cursor is redrawn.
- Control is revoked when the page reaches a refused URL, when the window is closed, hidden or minimised, and on
  `ui-disable` or stop-all.
- The page guards still apply. Password, OTP, credential, card and payment fields are human-only (`UI_HUMAN_ONLY`),
  and their values are never read. Sign-in/connect controls need the extended level, as elsewhere. The person signs in
  by hand.
- The AI-control border is shown as usual.

**Denied by default**: every permission request (camera, mic, geolocation, notifications, clipboard-read, MIDI…),
screen/device pickers (HID/serial/USB) and **downloads**. Downloads are cancelled, so `ui-download-wait` won't see a file
here. Media does not autoplay without a gesture.

**Viewport**: prefer `demo-browser-open {width,height}`. It sizes the real window content, so it persists across page
loads. `ui-set-viewport` emulation also works, but a full navigation resets it.

**Worked example** (`ui` = the curl helper from "Calling"):
```bash
ui '{"action":"demo-browser-open","tabId":"demo:main","params":{"url":"https://www.wikipedia.org","width":1280,"height":720},"idempotencyKey":"d1"}'
ui '{"action":"ui-enable","tabId":"demo:main","params":{},"idempotencyKey":"d2"}'
ui '{"action":"ui-set-viewport","tabId":"demo:main","params":{"width":1280,"height":720},"idempotencyKey":"d3"}'   # optional
ui '{"action":"ui-cursor","tabId":"demo:main","params":{"show":true,"preset":"reel","rippleColor":"#FF3366","badge":true,"frame":true},"idempotencyKey":"d4"}'
ui '{"action":"ui-run","tabId":"demo:main","idempotencyKey":"d5","params":{
  "record":{"path":"site-demo.mp4","fps":30,"leadInMs":300,"tailMs":600},
  "steps":[{"action":"ui-click","params":{"selector":"#searchInput"},"waitAfterMs":300},
           {"action":"ui-type","params":{"selector":"#searchInput","text":"Screen recording"},"waitAfterMs":300},
           {"action":"mark","params":{"label":"zoom-here"}},
           {"action":"ui-click","params":{"selector":"button[type=submit]"},"waitAfterMs":2000},
           {"action":"ui-scroll","params":{"deltaY":300},"waitAfterMs":500}]}}'
# → {..., recording:{recordingId,...}}
ui '{"action":"record-status","tabId":"demo:main","params":{"recordingId":"rec-..."}}'
# poll until state:"completed" → {path:".../recordings/site-demo.mp4", eventsPath:".../site-demo.events.json", width, height, videoDurationMs, frameCount, ...}
```
The events sidecar is identical to the one from trusted surfaces. Import the MP4 with `editor.addVideo`, then pass
`eventsPath` to the editor command `camera.autoZoomFromEvents` for zoom punches on clicks and `zoom-here` marks.

## Recording

`record-start` captures only this tab to `~/.skilltown-desktop/recordings` (mode 0600).
Params: `{engine?:"auto"|"screencast"|"capture", durationMs?|maxDurationMs? (≤600000, default 60000 safety stop),
fps?:30|60 (1-60), pointer?:"reel"|"subtle"|"off", keys?:bool, cursor?, path?}`, plus engine-specific params:
- **screencast** (the `auto` choice when ffmpeg is found: PATH, Homebrew, bundled ffmpeg-static or `SKILLTOWN_FFMPEG`):
  native device-pixel CDP screencast → constant-frame-rate H.264 MP4 (`format:"mp4"|"webm"|"frames"`,
  `clip:{x,y,width,height}` CSS px or `target` locator crop, `maxWidth/maxHeight`, `quality`, `keepFrames`).
  Without ffmpeg you get JPEG frames + `frames.json` and a `note`. Fails cleanly if DevTools is open on the tab.
- **capture** (fallback, or with `scale`, `selector` crop, `audio`, `zoom`): capturePage → WebM.
- **Pointer**: `reel` (default) is a 28px white arrow with a big yellow `#FFD43B` double-ring click ripple.
  `subtle` is the old small blue ring; `off` draws nothing. `keys:true` adds keystroke pills.
  A `cursor` object takes the `ui-cursor` style keys, including the opt-in `badge` and `frame`
  (e.g. `cursor:{preset:"reel", badge:true}`).
- **Output path** (`path`, also `ui-screenshot path`): a bare name is saved under
  `~/.skilltown-desktop/{recordings,ui-shots}`. An absolute path must be new, inside your home folder and
  outside hidden/system folders. Files are never overwritten (`UI_PATH_EXISTS`).
- **Audio**: video only unless `audio:"tab"` (this tab's own sound, Opus).
  `"system"` works on Windows and, experimentally, on macOS 14.2+ (Electron
  loopback). If system audio fails, the clip falls back to video only and reports
  `audioWarning`. Elsewhere it returns `RECORDING_AUDIO_UNSUPPORTED`.
- **Zoom**: `zoom` keyframes give eased zoom/pan at a constant output size.
- **Overlay**: the pointer preset (cursor, ripples, drag trails, optional key pills) is drawn
  into the page while recording; the AI-control border is hidden.
- **Stopping**: a small "Stop & save" window is shown, and the human can stop at any
  time. Recording also auto-stops on duration, tab switch, crop change or control stop.
- **Limits**: capture 64 MiB per clip; 20 clips per app session; one active recording;
  the `maxDurationMs` safety stop.

Poll `record-status` until `completed`.

**Events sidecar** `<video>.events.json` (path in `eventsPath`):
`{version:1, engine, video, fps, width, height, durationSec, frameCount, coordinateSpace:"video-pixels",
cssToVideo:{scaleX,scaleY,offsetX,offsetY}, clip, viewport, events:[{t, tMs, frame, source:"agent"|"human",
type:"click"|"drag-start"|"drag-end"|"scroll"|"press"|"key"|"type"|"hover"|"mark"|"highlight"|..., x, y, inFrame, rect?, from?, to?, label?, target?}]}`.
- `tMs` is measured from the first video frame.
- `x`/`y` are output video pixels; crop, scale and zoom keyframes are already applied.
- `source:"human"` events come from an active `demo-start`.
- Typed text is never stored.

**Recipe: record a demo, then auto-place zoom punches and SFX**
1. `ui-set-viewport {width:1080,height:1350}` (optional). Then `record-start {fps:60, durationMs:30000}`.
   Drive the UI with locator clicks, and use `record-mark {label:"zoom-here"}` for beats.
2. Poll `record-status` → `path`, `eventsPath`. Import the video with `editor.addVideo` (track intent required, see cl-editor).
3. For each event with `type:"click"` or `label:"zoom-here"`, set `f = itemStartFrame + round(tMs/1000*projectFps)`.
   Add `editor.addKeyframe` `scale` 1 → 1.4 (`easeOut`, f-6 → f) → 1 (`easeInOut`, f+20).
   Set `x`/`y` so the point (`x/width`, `y/height`) stays centred.
4. Add a click/whoosh SFX at the same `f` with `editor.addAudio` on one shared SFX track (see `track-fragmentation-prevention`).
   Skip events closer than ~0.4 s together.

**Teach by demo**: run `demo-start`, let the person perform the workflow, then
`demo-stop` returns `batchSteps` you can replay with `ui-batch`. Protected targets
become skipped placeholders. While a demo runs, agent input is refused with
`UI_DEMO_RECORDING`.

## Batches, forms, assertions, tracing, dialogs, downloads, popups, network, record mode

All need `ui-enable`; `GET /api/ui` has every param. Mutations need a retry key; `ui-expect`, `ui-trace-*`,
`ui-dialog-wait`, `ui-popup-wait`, `ui-wait-request/response` are reads **unless** they carry a `trigger`.

| Action | Params / notes |
|---|---|
| `ui-run` | `{steps:[{action, params?, waitAfterMs?, at?} \| {pauseMs} \| {action:"mark", params:{label}}], timeline?:"sequential"\|"timed", stopOnError?:true, maxDurationMs?, record?:{format, fps, path, ..., leadInMs?, tailMs?}}`. ≤300 steps in-process (no gaps between actions); `timed` starts each step at `at` ms and reports `lateMs`. `record` wraps the batch in a screencast with a `ui-run:start` mark. Not allowed as steps: `ui-enable/disable`, `ui-run`, `ui-batch`, `record-*`, `demo-start/stop/status`, `demo-browser-open/close/clear-session`, `ui-codegen-*`, `ui-level-lower`, `ui-resume`. Losing control/pause aborts at once (`details.abortedAt`). |
| `ui-fill` | `{target\|selector\|text\|role,name?\|testId, value, clear?:true, delayMs?}`: click, select all, trusted typing, read back (`verified`). `""` clears. |
| `ui-select` | Native: `{selector\|ref, value\|label}` (unchanged). Playwright-style: `{target:{...}, value\|label\|index}` also opens custom (Radix) dropdowns and clicks the option. |
| `ui-check` | `{target, checked?:true}`: idempotent checkbox/radio/switch; `changed:false` if already set. |
| `ui-expect` | `{target, one of toHaveText\|toContainText\|toBeVisible\|toBeHidden\|toBeEnabled\|toHaveValue\|toHaveCount\|toBeChecked, ignoreCase?, timeoutMs?:5000}`; retries until true. |
| `ui-trace-start` / `ui-trace-stop` | `{screenshots?:true, dom?:false, path?}` → `~/.skilltown-desktop/traces/<id>/index.html` (static, script-free) + `trace.json`. Screenshots cost ~50-150 ms per action: turn off for timed recordings. |
| `ui-dialog` | `{policy:"accept"\|"dismiss"\|"ask"\|"default", promptText?, askTimeoutMs?}`: persistent JS dialog policy (accept/dismiss also leave/stay on `beforeunload`; `ask` holds the page until `ui-dialog-respond`). The old one-shot `{kind:"js"\|"open"\|"save"\|"clear"}` form still works. |
| `ui-dialog-wait` / `ui-dialog-respond` | `{timeoutMs?, trigger?}` → `{dialogId, type, message, handled}`; `{accept, promptText?, dialogId?}`. Respond runs alongside the click blocked by the dialog. |
| `ui-download-wait` | `{timeoutMs?:30000, trigger?}` → `{path, filename, size, mime, url}` in `~/.skilltown-desktop/downloads` (max 512 MiB; only this tab's next download). |
| `ui-popup-wait` | `{timeoutMs?, trigger?}` → `{opened:"tab", tabId}` (internal link opened as a new active tab: `ui-enable` that tab next), `{opened:"window"}` (blank popout, e.g. podcast video popout) or `{opened:"external", url}` (system browser). |
| `ui-wait-request` / `ui-wait-response` | `{urlIncludes\|urlRegex, method?, status?, body?, timeoutMs?, trigger?}` → url (secrets redacted), status, timing, JSON/text `body` ≤256 KB. |
| `ui-route` / `ui-unroute` | `{urlIncludes\|urlRegex, method?, respond:{status?, json?\|body?, headers?}, times?, delayMs?}` → `routeId`; `{routeId}\|{all:true}`. XHR/fetch of this tab only, max 20, cleared on disable/navigation. |
| `ui-codegen-start` / `ui-codegen-stop` | `{path?, maxEvents?}` / `{discard?}`. Records the **person's** clicks, typing, wheel, drags and keys (badge "Recording your actions"; agent input is skipped) → `{run:{action:"ui-run", params:{timeline:"timed", steps}}, summary, masked, warnings}` saved to `~/.skilltown-desktop/codegen`. Replay with `ui-run` as-is. |

Trigger pattern (arms first, then acts, so nothing is missed):

```bash
ui '{"action":"ui-download-wait","tabId":"TAB","idempotencyKey":"dl-1","params":{"trigger":{"action":"ui-click","params":{"testId":"export-csv"}}}}'
ui '{"action":"ui-wait-response","tabId":"TAB","idempotencyKey":"save-1","params":{"urlIncludes":"/api/content","status":200,"trigger":{"action":"ui-click","params":{"testId":"save-draft"}}}}'
```

ContentLead specifics:
- **Never mocked or body-read** (`UI_ROUTE_DENIED`, `bodyOmitted:"denied"`): auth/session/token/OTP URLs, payments (Razorpay, Cashfree, Stripe, `/api/payment`, `/checkout`, `/purchase`, `/order`), identity providers (Google/Microsoft/Apple/Facebook sign-in, `accounts.*`) and Instagram/Meta/YouTube `graph.*`/OAuth/upload endpoints. Use mocks only for clean demo data (content lists, analytics).
- **Codegen targets** prefer `data-agent-id` (as `testId`; list items use `[data-agent-id][data-agent-key]`), then `data-testid`/`data-demo-id`, ARIA role+name, exact text, `#id`, CSS path; canvas (timeline) input uses x,y.
- Password/OTP/payment fields and `data-agent-human-only` controls are never read, filled, selected or recorded (`UI_HUMAN_ONLY` / masked with a warning): the person must do those steps.
- Without `ui-dialog`, nothing changes: ContentLead keeps a page whose `beforeunload` blocks unload (and cancels a pending quit).

## Errors

| Code | Meaning / recovery |
|---|---|
| `UI_NOT_READY` | Tab not active/visible/trusted or still loading → activate it (`POST /api/tabs/activate`) and retry |
| `UI_CONTROL_DISABLED` | Call `ui-enable` first (control was revoked) |
| `UI_CONTEXT_CHANGED` | Tab/page changed mid-action → re-inspect |
| `UI_HUMAN_ONLY` | Protected target → hand over to the human |
| `UI_URL_BLOCKED` | Demo browser refused the URL (non-http(s) scheme, plain http to a public host, embedded credentials) → use an `https://` URL |
| `UI_NO_HISTORY` | `demo-browser-history` back/forward with nothing to go to |
| `UI_TARGET_NOT_FOUND/AMBIGUOUS/HIDDEN/COVERED/DISABLED/CHANGED` | Re-inspect, scroll, close overlays |
| `UI_BUSY` | Wait for the previous action |
| `CONFLICT` | Reused idempotencyKey with different params |
| `UI_PAUSED` | Human took over → wait, then `ui-resume` |
| `UI_CAPTURE_TIMEOUT` / `UI_CAPTURE_EMPTY` | Window minimized/occluded or not painted (10s bound, one empty retry) → bring the window forward, then retry |
| `UI_DEMO_RECORDING` | A teach-by-demo recording is running → `demo-stop` first |
| `UI_PATH_NOT_ALLOWED` / `UI_PATH_SENSITIVE` | Upload/dialog path outside the allowlist |
| `UI_WAIT_TIMEOUT` | `ui-wait` / `expect` condition not met in time |
| `UI_DEBUGGER_BUSY` | A non-DevTools debugger is attached (DevTools itself is closed and reopened automatically) |
| `UI_LEVEL_REQUIRED` | Action needs a higher AI control level → ask the person (Help ▸ AI control) |
| `UI_LEVEL_RAISE_FORBIDDEN` | Agents can only lower the level |
| `UI_PAYMENT_CONFIRM_REQUIRED` / `UI_PAYMENT_CAP_EXCEEDED` / `UI_PAYMENT_AMOUNT_UNKNOWN` | Payment rules (full only) |
| `UI_EVAL_*` | `ui-eval` timeout, throw or bad result |
| `OS_*` | OS input: permission, secure input, out of bounds, unsupported platform |
| `UI_RUN_FAILED` / `UI_RUN_TIMEOUT` | A `ui-run` step failed (`details.steps`, `failedStep`; use `stopOnError:false` to continue) / exceeded `maxDurationMs` |
| `UI_EXPECT_FAILED` | `ui-expect` not met (`details.expected/actual`) → re-inspect |
| `UI_CHECK_FAILED` / `UI_NOT_CHECKABLE` / `UI_OPTION_NOT_FOUND` | Form helper could not set the state / target / option (message lists options) |
| `UI_TRACE_ACTIVE` / `UI_TRACE_NOT_ACTIVE` | Stop the running trace first / nothing to stop |
| `UI_DIALOG_POLICY_REQUIRED` / `UI_NO_DIALOG` / `UI_DIALOG_PENDING` | Set `ui-dialog {policy}` first / nothing pending / answer the `ask` dialog first |
| `UI_TIMEOUT` | No dialog, download, popup or matching request/response in time |
| `UI_DOWNLOAD_TOO_LARGE` / `UI_DOWNLOAD_FAILED` / `UI_DOWNLOAD_UNAVAILABLE` | >512 MiB, cancelled/interrupted, or no session for downloads |
| `UI_ROUTE_DENIED` / `UI_ROUTE_LIMIT` / `UI_ROUTE_NOT_FOUND` | Protected URL (see denylist) / 20 routes / unknown routeId |
| `UI_CODEGEN_ACTIVE` / `UI_CODEGEN_NOT_ACTIVE` / `UI_CODEGEN_FAILED` | Record mode already running / not running / recorder could not start |
| `UI_PATH_EXISTS` | Trace/codegen output already exists (never overwritten) → choose a new name |

## Recording-ready UI: stable ids + framing/presentation commands

**Stable `data-agent-id` conventions** (web app). Ids are dotted lowercase
`surface.area.action` and unique on a page. Repeated items add
`data-agent-key="<id>"`. Prefer `ui-invoke {agentId, agentKey?}` over raw
coordinates, so a click never lands on the neighbouring button. Newer ids:
- `content.tab.<tabId>` and `content.detail.{save,cancel-edit,download,share,share-copy,duplicate,edit,delete}`
- `properties.tab.<tabId>`
- `publish.instagram.{publish,cancel-processing,schedule,schedule-cancel,schedule-refresh}` and `publish.youtube.publish`
- `cta.{add,edit,refresh,toggle,add-config}`
- `offers.builder.{surface.<id>,actions-library,tracking,preview,publish-view,page-settings,branding,open-sections,open-inspector}`
- `crm.inbox.send`
- `inspiration.{time-window(+key),filters,has-transcript,sort,more-tools,selection.clear,selection.transcribe,selection.transcribe-youtube,selection.pin}`
- shared dialogs: `dialog.confirm`, `dialog.cancel` and `dialog.close`. Pass `agentKey`/scope if two dialogs are open.

**Before recording** (all view-only, ephemeral and reversible; send these via
`/api/execute`):
1. `ui.preparePresentation` (board: `board.preparePresentation`). It dismisses
   transient UI, then hides toasts, the Next dev overlay and tours. Use
   `hideCursor` / `hideScrollbars` to opt in to hiding those too. The
   save-conflict toast stays visible.
2. Frame the shot:
   - Timeline: `timeline.zoomToFit`, `timeline.zoomToRange {startMs,endMs}` or `timeline.scrollToTime {timeMs}`.
   - Preview: `preview.zoomToFit` or `preview.setZoom {relativeToFit}`.
   - Board: `board.frameNodes {nodeIds}`.
3. Set the speed with `preview.setPlaybackRate {rate}`.
4. Between takes, use `ui.dismissTransient` (board: `board.dismissTransient`) to close stuck menus, tooltips and toasts.
5. Finish with `ui.resetPresentation` / `board.resetPresentation`.

None of these save anything, and timeline zoom changes are not written to the saved view.
