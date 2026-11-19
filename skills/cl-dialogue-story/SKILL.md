---
name: cl-dialogue-story
description: Generate viral two-character dialogue storytelling reels (Modi–Rahul style, but for ANY story/topic/characters) end-to-end from a tiny script JSON. Ports the proven TlEditingSolution pipeline (5M+ views) — Hinglish→Latin captioning, per-character TTS, word-level subtitles, AI per-dialogue image selection with word-timed placement, hook-title overlay, and Instagram caption/hashtags — but renders with ContentLead + Remotion instead of MoviePy for far richer visuals. Deterministic, resumable, stage-by-stage.
tags: dialogue, story, storytelling, viral, reel, short, modi, rahul, two-character, conversation, hinglish, devanagari, transliteration, captions, subtitles, tts, voice, images, hook, title, caption, hashtags, pipeline, remotion, tlediting
---

# Dialogue-Story Pipeline — Viral Two-Character Storytelling Reels

> **Current execution gate:** Load `cl-editor/workflow-readiness.md` before using
> this playbook. `--plan` is now offline and does not read discovery/private
> overlays or write the script. Real execution requires **both** `--tab-id` and
> `--content-id`, validated against the renderer's current readiness before API
> stages and editor writes. Composition additionally requires advertised
> `contracts.trackPlacement.createNewTrack:true`; it creates owned role tracks,
> then reuses only their actual IDs and applies native layer priorities.
> Documentation delivery does not install scripts, voices or private assets.
> Preserve paid-action/local-proposal approval and actual save/render receipts.
> Historical manual media snippets below are payload fragments: add explicit
> track intent and follow the current readiness guide, not implicit routing.

> **Connection gate:** Follow `cl-editor/infrastructure.md` for fresh private
> discovery and bounded authenticated health checks. Missing discovery is not
> proof that the app is stopped; file presence is not readiness. Launch only
> when the task authorizes it, never for a source-only audit. Do not reload,
> switch origins or contact providers merely to check these instructions.

Turn a **tiny dialogue script** into a finished vertical reel — with character voices,
word-level subtitles in correct Latin script, AI-chosen context images timed to the
exact words spoken, a hook-title overlay, and a ready-to-post Instagram caption +
hashtags. This is a faithful, upgraded port of the **TlEditingSolution** pipeline
(a proven engine: 5M+ views, a 1.2M-view viral hit) — same deterministic flow and
same AI prompts, but the renderer is **ContentLead + Remotion**, so you get spring
animations, a camera engine, karaoke captions and fully-editable scenes instead of a
one-shot MoviePy render.

> This skill is a **router + playbook + runnable orchestrator**. The docs give the
> AI the exact deterministic rules and prompts (so runs are predictable, not
> improvised). The orchestrator (`orchestrator/run.mjs`) executes them against the
> live local API. Read the sub-docs before running.

## Why this is predictable AND more viral than the original

The original's predictability came from **two** things, and we keep both:

1. **An explicit content plan** — define the hook, character roles, topic and
   dialogue arc in your script. The public example supplies the JSON shape;
   personal tuned formulas are not a public dependency or a virality guarantee.
2. **Deterministic execution** — the same stages, in the same order, with the same
   AI prompts and the same composition rules — captured in `pipeline-stages.md`,
   `orchestrator/prompts.example.mjs`, `remotion-composition.md`, and implemented
   by `orchestrator/run.mjs`. Model outputs themselves are not deterministic.

The public pipeline reuses the stage structure through ContentLead's current
voice, transcription and image bridges; it does not ship the original personal
voices or exact tuned prompts. Remotion adds animated characters, styled karaoke
captions and editable timeline layers. Quality and engagement still need review.

> **Virality scoring:** clip/segment selection uses the shared **`cl-virality-scoring`** skill
> (8-signal 0-100 rubric). Load it when deciding which dialogue moments to keep or lead with.

## Do we need the code, or are docs enough?

**Both.** Docs alone would let the AI drift run-to-run and you'd lose predictability.
So this skill ships:

- **Playbook docs** — generic rules and schemas (the "what/why"), with public
  prompt templates rather than personal tuned formulas.
- **A runnable, resumable orchestrator** (`orchestrator/run.mjs`) — the "how",
  executed identically every time (the "code flow").
- **A reusable Remotion scene** (`orchestrator/scenes/DialogueCharacter.tsx`) — the
  character rendering primitive.

You do **not** need to copy the original Python. Its logic lives here as
deterministic JS + prompts wired to our live endpoints.

## Public vs Private (this skill is shipped publicly)

Keep personal voices, art, working scripts and tuned formulas outside this public
skill directory, in user-owned private storage. Ignore rules do not make a public
skill folder an appropriate home for private documentation.

**Your one-time setup (use an existing private directory):**
```bash
cp orchestrator/config.example.json /absolute/private/path/dialogue-config.json
# Fill only authorized voice IDs and asset paths, then pass --config on real runs.
```
`run.mjs` accepts `--config <path>` or `DIALOGUE_STORY_CONFIG`; config values
fill missing voice/art without being copied into the script. Generated stage
outputs **are** written to the working script, so keep that script private too.
Legacy in-folder `config.local.json` and `prompts.local.mjs` loading remains
supported by the helper; do not create new private material there. The public
helper has no external prompt-module option: use its generic
`prompts.example.mjs`, rather than claiming it loads an external tuned formula.
Background is **optional** — set it only when a story needs a gameplay backdrop;
otherwise the bg layer is skipped.



Input is one JSON file with `dialogues: [{ "id", "character", "sentence" }]` (Hinglish is fine).
Each dialogue may also have `emotion`, `model` and `reaction`. `sentence` contains
only spoken words; `reaction` is one advertised leading vocalization tag name
without parentheses (for example `"sighs"`). Keep visual acting notes separate.
The voice stage reads `/api/bridge/voice/options`, validates every line before
spending credits, sends the resolved settings, and checks their returned values.
Do not hardcode a mood/tag list into scripts: author against the current options
using `cl-voice` §1a. Missing options stops execution rather than producing plain
speech. Mood Auto is omitted/null, not `"auto"` or `"neutral"`.

```json
{"id":1,"character":"Trader","sentence":"One more trade.","emotion":"sad","reaction":"sighs"}
```

Stages save their outputs back to the script. Voice outputs also retain the exact
synthesis request/history ID: changed settings or an uncertain paid attempt require
reconciliation, not deleting a flag and automatically regenerating. Replacing audio
invalidates downstream captions and timing. A failed download resumes from the saved URL.

| # | Stage | What it does | Live capability used | Output field |
|---|-------|--------------|----------------------|--------------|
| 0.5 | Script cleanup | Hinglish → proper mixed Devanagari/Latin | `POST /api/bridge/ai/text/generate` | `sentence` (normalized) |
| 1.0 | Voices | Per-character TTS (Minimax) | **voice** skill `/api/bridge/voice/*` | `audio.{url,duration}` |
| 1.1 | Word timing | Word-level timestamps | `POST /api/bridge/ai/transcribe/short` | `word_data.words[]` |
| 1.2 | Transliteration | Devanagari → correct Latin for captions | `POST /api/bridge/ai/text/generate` (ported prompt) | `proc_word_data` |
| 1.5 | Context images | # images + word-timed windows + Tavily search + best-pick | `POST /api/bridge/ai/image/search` + ported prompts | `images[]` |
| 2.0 | Caption/title | IG caption+hashtags + short hook-title overlay | `POST /api/bridge/ai/text/generate` (ported prompts) | `title_data`, `captioned_data` |
| 3.0 | Compose | Bg + characters (L/R springs) + karaoke subs + timed images + title | `editor.*` via `/api/execute` + Remotion | timeline |
| handoff | Review/save/export (not run automatically by the helper) | Preview + current cloud receipt + verified render artifact | `cl-editor/workflow-readiness.md`, Desktop `/api/render` | verified output path |

Full details, resumability logic, and exact command payloads: **`pipeline-stages.md`**.

## Sub-documents (read the relevant one before that stage)

| Doc | Contents |
|-----|----------|
| `orchestrator/scripts/example.dialogue.json` | Public script JSON example; copy to private working storage before generation |
| `pipeline-stages.md` | Stage-by-stage: exact endpoint, args, resumability field, ported rules, fallbacks |
| `orchestrator/prompts.example.mjs` | Public generic prompt templates; no personal formula required |
| `remotion-composition.md` | The 5-layer composition rules ported from `editor_agent.py` + the Remotion upgrades (character scene, karaoke subs, timed images, title, camera) |

## ⭐ Verified voice recipe (do this first, never skip)

> # ⚠️ AUDIO ORDER RULE — READ THIS FIRST ⚠️
> **Preferred in-app flow:** Generate → audition RAW audio → place approved audio
> → add captions / linked visuals. Only if tightening is requested: dry-run
> `editor.removeSilence`, review the cuts, then apply with explicit ripple scope.
>
> **Offline Python flow:** Generate → PROCESS (trim + boost) → place on timeline →
> THEN caption from the processed file.
>
> **Caption karaoke style (active-word scale):** `details.animation` controls the
> active-word pop. Default is now `letterKaraoke/scaleAnimationLetterEffectSoft`
> (gentle ~1.14x — classy, readable). Use `letterKaraoke/scaleAnimationLetterEffect`
> for the big 1.4x pop, or `none` for pure color-only (no scale). Switch on existing
> captions with `bulk.styleByType {type:"caption",details:{animation:"..."}}`.
>
> Captions are separate timeline items and word timings are absolute. If captions
> already exist, do **not** trim with Python afterward; use `editor.removeSilence`
> so linked captions/images shift with the audio. If you inherit an edit where
> captions were made from untrimmed audio and cannot use linked-track cascade, do
> **boost/normalize only** (`--no-trim`, same duration).

The single most important correctness rule in this pipeline:

1. **Voices = authorized choices**, discovered through `cl-voice` and supplied
   in the private config. A clone requires permission to reproduce that voice;
   public examples do not supply personal clone IDs or authorize impersonation.
2. **TTS text = the Devanagari `sentence`**, sent DIRECTLY. Hindi in देवनागरी, only real
   English/tech words in Latin. Never romanize the audio input. (`latin` is caption-only.)
3. **Call:** `POST /api/bridge/voice/generate` (Bearer auth) `{ text, voice_id, speed:1.0, format:"mp3" }`
   → `{ audio_url, duration_seconds }`. Add with `editor.addAudio {src,from,volume:95}`,
   first line at `from:0`, each next at the running sum of prior durations.
4. **Optional gap removal:** preserve raw takes and natural breaths. If requested,
   preview cuts with `apply:false`, listen, then apply only approved cuts with an
   explicit `rippleScope`. `cascadeLinkedTracks:true` alone leaves the default
   scope at `all`, which can shift unrelated later items.
5. **Offline/pre-import option:** if you are composing from files before timeline
   import and cleanup is approved, process a copy using the **voice** skill's
   `scripts/process_dialogue_audio.py` BEFORE `editor.addAudio`. Its legacy
   −40 dBFS / 100 ms / +13 dB defaults can remove breaths or clip audio; follow
   `cl-voice` §3b rather than applying those defaults automatically.
   **Re-read the processed clip's duration** (it shrinks after trimming) and use THAT
   for the running offset. See the **voice** skill §3b for flags (`--boost-db`,
   `--max-gap-ms`, `--no-normalize`).
6. **Smoke-test one line first** (generate Modi's line, add at `from:0`, confirm it sounds
   right) before batching all dialogues. See `pipeline-stages.md → Stage 1.0` for the
   exact curl and both worked examples.

### Native in-timeline silence removal: `editor.removeSilence`

For expressive speech, the recipe above additionally requires options discovery,
model/mood forwarding and returned-settings verification (`cl-voice` §1a).
Measure the downloaded audio duration and preserve natural vocal reactions;
the original plain-text examples do not synthesize the acting notes themselves.

Use this for the timeline version of the dialogue reel. It runs the app's native
silence detector (`lib/podcast/audio/silenceDetector.ts`) and cut engine
(`timelineCutsCore.applyCutsToStateManager`) with the same knobs as the old Python
script: threshold dBFS, min-silence, and merge-gap. It detects internal silence in
an audio/video item and splices it out. With `cascadeLinkedTracks:true` (default),
linked caption items, character images, and b-roll grouped with the audio are
shifted automatically.

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `itemId` | `string` | required | Audio or video timeline item to de-silence |
| `thresholdDbfs` | `number` | `-50` | Silence threshold in dBFS. Raise toward `-45` to catch soft pauses; never above `-45` |
| `minSilenceMs` | `number` | `800` | Minimum silence length to cut. Keep ≥ `120` |
| `mergeGapMs` | `number` | `200` | Merge nearby silent ranges before cutting |
| `mode` | `'remove'\|'split-only'` | `'remove'` | `remove` = splice + ripple-close holes; `split-only` = just split |
| `rippleScope` | `'all'\|'linked'\|'source'` | `'all'` | Which tracks shift left to stay in sync. `cascadeLinkedTracks:false` = alias for `source` |
| `apply` | `boolean` | `true` | `false` = dry run, no timeline mutation |
| `cuts` | `{sourceStart,sourceEnd}[]` | — | Two-step: apply these exact cuts, skip detection |

Dry run (`apply:false`) returns
`{ ranges:[{startMs,endMs,peakDbfs}], cuts:[{sourceStart,sourceEnd}], totalRemovedMs }`
without modifying the timeline. Apply mode (`apply:true`) makes the cuts.

```bash
# Read API/TOKEN as in Startup protocol, then:
curl -sX POST "$API/api/execute" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"type":"editor.removeSilence","params":{"itemId":"audio_abc","apply":false,"thresholdDbfs":-50,"minSilenceMs":800,"mergeGapMs":200}}'

curl -sX POST "$API/api/execute" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"type":"editor.removeSilence","params":{"itemId":"audio_abc","apply":true,"cascadeLinkedTracks":true}}'
```

> **⏱️ Timing rules (don't over-trim, keep a turn-taking pause):**
> - Flat waveform stretches are usually **soft real audio** (breaths, word tails at
>   ~−42 dBFS), not silence — the waveform just scales to peak. Use `-50/800` (default,
>   only true dead air) or `-45 dBFS / 150 ms / mergeGap 120` (tight but natural).
>   **Never** exceed `-45 dBFS` or drop below ~`120 ms` min, or speech turns choppy.
>   An already-processed clip reporting **0 removable** at default is correct — leave it.
> - **Light pause between speakers:** place each next line at `prevLineEnd + 120–200 ms`
>   (~150 ms natural; ≤80 ms rushed). `editor.removeSilence` anchors the first clip and
>   preserves this inter-clip gap while rippling the next speaker left. See the **voice**
>   skill §3b-1a for the full timing rules.

## Startup protocol (same as ContentLead)

> **Auth header MUST be `Authorization: Bearer <token>`** (the plain token is rejected).
> Read `port`+`token` from `~/.skilltown-desktop/api.json` **before every batch** — the
> file is rewritten on app restart AND on origin switch (the port rotates).

```bash
# Read privately; no eval or discovery JSON output.
PORT=$(node -e 'const c=require(require("os").homedir()+"/.skilltown-desktop/api.json");process.stdout.write(String(c.port))')
TOKEN=$(node -e 'const c=require(require("os").homedir()+"/.skilltown-desktop/api.json");process.stdout.write(c.token)')
export API="http://127.0.0.1:$PORT"
export AUTH="Authorization: Bearer $TOKEN"
curl --max-time 5 -fsS "$API/api/health" -H "$AUTH" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const d=JSON.parse(s);console.log("ok:",d.ok??"unknown","| cloud.auth:",d.cloud?.authenticated??"unknown")})'
# Voices + AI need a signed-in cloud session. If cloud.authenticated is false → sign in inside ContentLead first.
```

## Run it

```bash
# The public example has placeholders; supply your own authorized voices/assets.
# Choose the existing intended tab/content explicitly. Obtain paid-action approval first.
node orchestrator/run.mjs /absolute/private/path/story.dialogue.json \
  --config /absolute/private/path/dialogue-config.json \
  --tab-id <chosen-tab> --content-id <chosen-content>

# Author your own: copy the example, edit dialogues + characters, then run it.
# --only <stage> selects a stage; it does not authorize replay.
# Reconcile saved outputs/paid attempts before any approved rerun; do not delete flags blindly.
# Fully offline generic stage plan: no discovery/token/private overlay, no script writes.
node orchestrator/run.mjs orchestrator/scripts/example.dialogue.json --plan

# Isolated mocks only; no packages/providers/Desktop required.
node --test orchestrator/lib/workflow.test.mjs
```

The helper does not choose a tab/track from discovery, start/navigate/reload an
app, or retry paid/failed writes automatically. A new named role track is created
on its first insertion; subsequent inserts use the exact returned item's owner
track. Native `editor.editTrack` priorities and `editor.reorderTracks` retain
title → captions → context images → characters → background layering.

Composition is **non-atomic and not idempotent**. On a partial failure, it stops
without marking composition complete. Inspect the addressed timeline before any
retry; deleting a stage flag is not a safe replay/rollback. This pass verifies
source/mock contracts, not actual voices, caption timing/quality, output pixels,
cloud save/reopen or installed/deployed renderer compatibility. The helper stops
after composition; review/save/render via `cl-editor/workflow-readiness.md`.

The orchestrator prints stage progress and skips completed outputs. Some AI
stages have fallback behavior; inspect their outputs rather than treating a
completed flag as quality proof. Keep diagnostic payloads private. It drives:
the **voice** bridge, the **cl-ai-media** AI bridge, and the **contentlead** editor
commands — all already documented in their own skills; this skill orchestrates them
in the proven order.

## Beyond Modi–Rahul

The characters, voices, topic and formula are all **data**, not code. Swap the
`characters` map + character PNGs/voice IDs and the same pipeline produces any
two-hander: teacher↔student, founder↔skeptic, Elon↔Peter, etc. Extra character art
already exists under `TlEditingSolution/CharImages/` (elon, peter, stewie, trump).
Keep the **role contrast** (curious questioner vs. confident expert) — that contrast
can help retention. Use the public script example; personal formulas are not shipped.

## 🎬 Live In-App Edit Playbook — Two-Character Reel (verified working)

Use this runbook when recreating the battle-tested two-character cl-dialogue-story reel directly in the ContentLead/SkillTown desktop editor. It assumes a vertical 1080×1920 reel, two exact-length speaker audio files, character PNGs, word-timed b-roll images, and paged karaoke captions.

### 1. Auth, connection, and tab targeting

1. Read fresh connection data **every session** and after every app restart/origin switch:
   ```bash
   # Parse privately as above; never print the token or whole discovery file.
   ```
   The API `port` rotates on app restart. Never hardcode it.
2. Send all editor commands to:
   ```http
   POST http://127.0.0.1:<port>/api/execute
   Authorization: Bearer <token>
   Content-Type: application/json
   ```
   Body shape:
   ```json
   { "type": "editor.addImage", "params": { "url": "..." }, "tabId": "tab_abc" }
   ```
3. If multiple tabs are open, `tabId` is mandatory. Omitting it returns `tabId_required` / HTTP 409. Resolve tabs with:
   ```http
   GET http://127.0.0.1:<port>/api/tabs
   Authorization: Bearer <token>
   ```
   Also include `tabId` when capturing screenshots:
   ```http
   GET /api/screenshot?tabId=<tabId>
   ```
4. Use media-server URLs for **all** local media sources:
   ```text
   http://127.0.0.1:<mediaServerPort>/media?path=<URL-ENCODED-ABSOLUTE-PATH>
   ```
   HTTPS/blob URLs are also acceptable when already produced by the app. Do **not** use raw local file paths that get embedded as data URIs; cloud save can fail from project bloat.

### 2. Canonical asset layout and timing (~11.8s reel)

| Layer | Timing | Layout / params |
|---|---:|---|
| Total duration | `11831ms` | Modi audio `6329ms` + `150ms` gap + Rahul audio `5352ms` |
| Gameplay video | `[0, 11831]` | `x:0, y:0, width:1080, height:1920, trim:{from:0,to:11831}` |
| Speaker A audio | `[0, 6329]` | `editor.addAudio {url, from:0, to:6329}` |
| Speaker B audio | `[6479, 11831]` | `editor.addAudio {url, from:6479, to:11831}` |
| Character A / Modi left | `[0, 6329]` | `x:-430, y:830, width:1463, height:1200` |
| Character B / Rahul right | `[6479, 11831]` | `x:200, y:830, width:1200, height:1200` |
| B-roll images | word windows | `x:70, y:110, width:940, height:940`, retimed to the illustrated phrase |

Keep the inter-speaker gap light and natural: `120–200ms`, with `150ms` as the canonical default.

### 3. Build order — follow exactly

1. Start with a verified empty, intended project. Clear only when replacing its
   contents was explicitly authorized; never clear an existing edit by default:
   ```json
   { "type": "editor.clearTimeline", "params": {} }
   ```
   Or filtered:
   ```json
   { "type": "editor.clearTimeline", "params": { "types": ["video", "audio", "image", "caption"] } }
   ```
2. Add gameplay background video:
   ```json
   { "type": "editor.addVideo", "params": {
     "url": "http://127.0.0.1:<mediaServerPort>/media?path=<encoded-bg-path>",
     "from": 0,
     "to": 11831,
     "trim": { "from": 0, "to": 11831 },
     "x": 0, "y": 0, "width": 1080, "height": 1920
   }}
   ```
   Save the returned `result.itemId`.
3. Fix z-order immediately. Gameplay video can render in front of images because track priority order places text/caption first, then audio, video, image. Video can hide character images unless pushed backward.
   ```json
   { "type": "query.getTrackInfo", "params": {} }
   ```
   Find the track containing the gameplay `itemId`, then:
   ```json
   { "type": "editor.editTrack", "params": { "trackId": "<videoTrackId>", "metadata": { "priority": 6 } } }
   { "type": "editor.reorderTracks", "params": {} }
   ```
   Higher `metadata.priority` means further back.
4. Add exact-length speaker audio:
   ```json
   { "type": "editor.addAudio", "params": { "url": "<modi-audio-url>", "from": 0, "to": 6329 } }
   { "type": "editor.addAudio", "params": { "url": "<rahul-audio-url>", "from": 6479, "to": 11831 } }
   ```
5. Add character images:
   ```json
   { "type": "editor.addImage", "params": { "url": "<modi-png-url>", "from": 0, "to": 6329, "x": -430, "y": 830, "width": 1463, "height": 1200 } }
   { "type": "editor.addImage", "params": { "url": "<rahul-png-url>", "from": 6479, "to": 11831, "x": 200, "y": 830, "width": 1200, "height": 1200 } }
   ```
6. Add b-roll images, one image per illustrated phrase window:
   ```json
   { "type": "editor.addImage", "params": { "url": "<broll-url>", "from": 2420, "to": 3540, "x": 70, "y": 110, "width": 940, "height": 940 } }
   ```
7. Add captions as 3-word phrase pages (see next section).
8. Reorder tracks again:
   ```json
   { "type": "editor.reorderTracks", "params": {} }
   ```
9. Apply entrance animations (characters + b-roll).
10. Save locally and to cloud, then verify visually.

Handlers accept these aliases: `src`/`url`, `from`/`from_ms`, `to`, `duration`/`duration_ms`/`durationMs`, `trim:{from,to}`, `width`, `height`, `x`, `y`. `x`/`y` become left/top pixels.

### 4. Captions — the #1 correctness rule

The standard caption renderer displays **all words in one caption item at once**. Therefore, never put a full sentence into one caption item. Proper viral karaoke is **one caption item per phrase-page**, usually 3 words per page, with each page having its own continuous time window.

Rules:

1. Split each speaker line into ~3-word pages.
2. Make page windows continuous: each page `to` equals the next page `from`; the last page `to` equals the line end. This prevents caption flicker/gaps.
3. Word timings inside a caption item are **0-based relative to that item's `display.from`**. If the page starts globally at `2420ms`, a global word `2420–3540` becomes `{start:0,end:1120}`.
4. Pass `words` at the top level, not inside `details`. `details.words` can override the normalized word array because `details` is spread last.
5. Pass `to` explicitly. Otherwise the handler default can set `captionTo = params.to ?? 3000`.
6. `wordsPerLine` is a string enum, never a number:
   ```text
   "punctuationOrPause" | "time" | "singleWord"
   ```
   Numeric values crash the caption control at OPTIONS lookup. `linesPerCaption` is a number.

Recommended caption command:

```json
{ "type": "editor.addCaption", "params": {
  "from": 2420,
  "to": 3540,
  "words": [
    { "word": "ye", "start": 0, "end": 260 },
    { "word": "AI", "start": 260, "end": 620 },
    { "word": "kaam", "start": 620, "end": 1120 }
  ],
  "wordsPerLine": "punctuationOrPause",
  "linesPerCaption": 1,
  "fontFamily": "Montserrat",
  "fontWeight": 800,
  "fontSize": 88,
  "color": "#FFFFFF",
  "activeColor": "#FFCE3A",
  "appearedColor": "#FFFFFF",
  "strokeWidth": 9,
  "strokeColor": "#000000",
  "textShadow": "0 5px 20px rgba(0,0,0,0.7)",
  "lineHeight": 1.14,
  "width": 980,
  "x": 50,
  "y": 1250,
  "animation": "letterKaraoke/scaleAnimationLetterEffectSoft"
}}
```

Active-word scale animation options:

| Value | Effect |
|---|---|
| `letterKaraoke/scaleAnimationLetterEffectSoft` | Default classy active-word pop, gentle ~1.14× |
| `letterKaraoke/scaleAnimationLetterEffect` | Big active-word pop, ~1.4× |
| `none` | Color-only karaoke, no scale |

Change existing captions in bulk:

```json
{ "type": "bulk.styleByType", "params": { "type": "caption", "details": { "animation": "letterKaraoke/scaleAnimationLetterEffectSoft" } } }
```

In the UI this is Caption Words → **Word Animation**. `Active Word – Soft/Big` scales only the currently spoken word. Fade/Scale/Slide/Zoom/Pop/Jump/Pulse are per-word entrance intros, not active-word-only scaling.

#### Copy-paste Python helper: 3-word paged captions

```python
def caption_pages(words, line_from, line_to, page_size=3):
    """
    words: [{'word': str, 'start': global_ms, 'end': global_ms}, ...]
    returns editor.addCaption params with continuous page windows and relative word timings
    """
    pages = []
    chunks = [words[i:i + page_size] for i in range(0, len(words), page_size)]
    for idx, chunk in enumerate(chunks):
        page_from = chunk[0]['start'] if idx > 0 else line_from
        if idx + 1 < len(chunks):
            page_to = chunks[idx + 1][0]['start']
        else:
            page_to = line_to
        pages.append({
            'from': page_from,
            'to': page_to,
            'words': [
                {
                    'word': w['word'],
                    'start': max(0, w['start'] - page_from),
                    'end': max(0, w['end'] - page_from),
                }
                for w in chunk
            ],
            'wordsPerLine': 'punctuationOrPause',
            'linesPerCaption': 1,
            'fontFamily': 'Montserrat',
            'fontWeight': 800,
            'fontSize': 88,
            'color': '#FFFFFF',
            'activeColor': '#FFCE3A',
            'appearedColor': '#FFFFFF',
            'strokeWidth': 9,
            'strokeColor': '#000000',
            'textShadow': '0 5px 20px rgba(0,0,0,0.7)',
            'lineHeight': 1.14,
            'width': 980,
            'x': 50,
            'y': 1250,
            'animation': 'letterKaraoke/scaleAnimationLetterEffectSoft',
        })
    return pages
```

### 5. Entrance animations

Use `editor.setAnimation` for in-animations:

```json
{ "type": "editor.setAnimation", "params": { "itemId": "<itemId>", "animationIn": "slideInLeft", "duration": 420 } }
```

Legacy syntax is also supported:

```json
{ "type": "editor.setAnimation", "params": { "itemId": "<itemId>", "animationType": "in", "type": "slideInLeft", "duration": 420 } }
```

Recommended animation plan:

| Item | Preset | Duration |
|---|---|---:|
| Modi / left character | `slideInLeft` | `420ms` |
| Rahul / right character | `slideInRight` | `420ms` |
| B-roll image 1 | `scaleIn` | `300–320ms` |
| B-roll image 2 | `zoomIn` | `300–320ms` |
| B-roll image 3 | `slideInRight` | `300–320ms` |
| B-roll image 4 | `slideInDown` | `300–320ms` |
| B-roll image 5 | `slideInLeft` | `300–320ms` |

Valid entrance presets include `fadeIn`, `scaleIn`, `scaleOut`, `slideInLeft`, `slideInRight`, `slideInUp`, `slideInDown`, `slideOutLeft`, `slideOutRight`, `zoomIn`, `zoomOut`. Default duration is `500ms`; use `350–420ms` for snappier reels.

> Verify animation persistence through the current save receipt and an authorized
> reopen. Historical reload failures are not proof of current behavior; inspect
> state before reapplying, and never reload the shared app as an automatic repair.

### 6. Audio preprocessing and silence removal

Correct sequence:

1. Process/trim/boost audio first.
2. Place processed audio on the timeline.
3. Build captions from the processed audio so word timings match.

Offline pipeline default: trim gaps + boost before import, for example with `--max-gap-ms 250`. Do not over-trim: never exceed `-45 dBFS` threshold and do not go below about `120ms` min silence. Keep inter-speaker pauses in the `120–200ms` range.

If captions/images already exist on the timeline, do **not** re-trim externally with Python. Use first-class in-app silence removal so linked captions/images shift together:

```json
{ "type": "editor.removeSilence", "params": {
  "itemId": "<audioItemId>",
  "apply": true,
  "cascadeLinkedTracks": true,
  "thresholdDbfs": -50,
  "minSilenceMs": 800,
  "mergeGapMs": 200
}}
```

For a dry run:

```json
{ "type": "editor.removeSilence", "params": {
  "itemId": "<audioItemId>",
  "apply": false,
  "thresholdDbfs": -50,
  "minSilenceMs": 800,
  "mergeGapMs": 200
}}
```

### 7. Save and visual verification

1. Local autosave:
   ```http
   POST /api/project/save
   Authorization: Bearer <token>
   Content-Type: application/json
   ```
   Body:
   ```json
   { "tabId": "<tabId>" }
   ```
   A small saved size such as `~46KB` is good; it indicates URL-based media, not giant data-URI embeds.
2. Cloud save:
   ```json
   { "type": "editor.save", "params": {} }
   ```
   Require `saved:true`, matching `contentId`, `currentDesignSaved:true`,
   `newerChanges:false` and `activeContentChanged:false` in `result`, following
   `cl-editor/workflow-readiness.md`. Local autosave or `status:"success"` alone
   is not proof that the current cloud design was saved.
3. Seek and screenshot:
   ```json
   { "type": "editor.seekTo", "params": { "time": 6479 } }
   ```
   Or:
   ```json
   { "type": "editor.seekToFrame", "params": { "frame": 194 } }
   ```
   Then:
   ```http
   GET /api/screenshot?tabId=<tabId>
   ```
   The response is JSON `{ "imageBase64": "..." }`; decode it to PNG if needed.
4. For timed video evidence use `query.previewFrameAt` with the chosen `tabId`
   and `timeMs`; require `stabilized:true`, an image and successful media checks.
   A screenshot after seeking or playing is not proof of frame stabilization.
5. Every `/api/execute` response includes `editorHealth` and `warnings[]`. Treat the command as healthy only when:
   ```text
   editorHealth.status === "clean"
   editorHealth.newConsoleErrors === 0
   warnings is empty or non-critical
   ```

### 8. Minimal overall build skeleton

```python
TOTAL = 11831
MODI_END = 6329
RAHUL_FROM = 6479
RAHUL_END = 11831
TAB_ID = '<tabId>'

def cmd(type_, params):
    return {
        'type': type_,
        'params': params,
        'tabId': TAB_ID,
    }

commands = [
    # Clear only a specifically approved replacement project, never by default.
    cmd('editor.addVideo', {
        'url': bg_url, 'from': 0, 'to': TOTAL,
        'trim': {'from': 0, 'to': TOTAL},
        'x': 0, 'y': 0, 'width': 1080, 'height': 1920,
    }),
    # Read returned gameplay itemId, query.getTrackInfo, edit its track metadata.priority=6, reorderTracks.
    cmd('editor.addAudio', {'url': modi_audio_url, 'from': 0, 'to': MODI_END}),
    cmd('editor.addAudio', {'url': rahul_audio_url, 'from': RAHUL_FROM, 'to': RAHUL_END}),
    cmd('editor.addImage', {'url': modi_png_url, 'from': 0, 'to': MODI_END, 'x': -430, 'y': 830, 'width': 1463, 'height': 1200}),
    cmd('editor.addImage', {'url': rahul_png_url, 'from': RAHUL_FROM, 'to': RAHUL_END, 'x': 200, 'y': 830, 'width': 1200, 'height': 1200}),
]

for image in broll_images:
    commands.append(cmd('editor.addImage', {
        'url': image['url'], 'from': image['from'], 'to': image['to'],
        'x': 70, 'y': 110, 'width': 940, 'height': 940,
    }))

for page in caption_pages(all_words_for_line, line_from=0, line_to=6329):
    commands.append(cmd('editor.addCaption', page))

commands += [
    cmd('editor.reorderTracks', {}),
    # editor.setAnimation for characters and b-roll itemIds.
    cmd('editor.save', {}),
]
```

### Common pitfalls

- Putting all words in one caption item creates a giant text block. Use 3-word paged caption items.
- Numeric `wordsPerLine` crashes the caption control. Use string enum values only.
- Forgetting to fix gameplay video track priority hides characters and b-roll behind the video.
- Using local file path `src`s can create data-URI bloat and make cloud save fail. Use media-server URLs.
- Verify saved animation state before reapplying anything after an authorized reopen.
- Trusting a screenshot immediately after edits can show stale preview state. Use stabilized `query.previewFrameAt` evidence.
- Hardcoding the API port breaks after restart. Always re-read `~/.skilltown-desktop/api.json`.
