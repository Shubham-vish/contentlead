---
name: dialogue-story
description: Generate viral two-character dialogue storytelling reels (Modi–Rahul style, but for ANY story/topic/characters) end-to-end from a tiny script JSON. Ports the proven TlEditingSolution pipeline (5M+ views) — Hinglish→Latin captioning, per-character TTS, word-level subtitles, AI per-dialogue image selection with word-timed placement, hook-title overlay, and Instagram caption/hashtags — but renders with ContentLead + Remotion instead of MoviePy for far richer visuals. Deterministic, resumable, stage-by-stage.
tags: dialogue, story, storytelling, viral, reel, short, modi, rahul, two-character, conversation, hinglish, devanagari, transliteration, captions, subtitles, tts, voice, images, hook, title, caption, hashtags, pipeline, remotion, tlediting
---

# Dialogue-Story Pipeline — Viral Two-Character Storytelling Reels

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

1. **The content formula** (viral hooks, 12-dialogue myth-bust arc, character roles,
   topic selection) — captured verbatim in `script-schema-and-formula.md`.
2. **Deterministic execution** — the same stages, in the same order, with the same
   AI prompts and the same composition rules — captured in `pipeline-stages.md`,
   `ai-prompts.md`, `remotion-composition.md`, and enforced by `orchestrator/run.mjs`.

We only **replace the renderer**. Everything that made it work (same Minimax voices,
same WhisperX-class word timing, same Tavily image search, same GPT prompts) is reused
via ContentLead's bridges. The upgrade: Remotion characters animate with real springs,
subtitles become styled karaoke captions, images get transitions, and the whole thing
stays editable on the timeline afterward. **Same virality logic, strictly richer output.**

## Do we need the code, or are docs enough?

**Both.** Docs alone would let the AI drift run-to-run and you'd lose predictability.
So this skill ships:

- **Playbook docs** — the ported rules and schemas (the "what/why"). The exact
  prompts + tuned viral formula are kept in the **private overlay** (see below).
- **A runnable, resumable orchestrator** (`orchestrator/run.mjs`) — the "how",
  executed identically every time (the "code flow").
- **A reusable Remotion scene** (`orchestrator/scenes/DialogueCharacter.tsx`) — the
  character rendering primitive.

You do **not** need to copy the original Python. Its logic lives here as
deterministic JS + prompts wired to our live endpoints.

## Public vs Private (this skill is shipped publicly)

Nothing personal lives in the tracked files. Personal data is loaded at runtime from a
**gitignored private overlay** (`orchestrator/config.local.json`) and is never written
back into scripts.

| Stays PUBLIC (committed) | Stays PRIVATE (gitignored, per-user) |
|--------------------------|--------------------------------------|
| Generic docs, `run.mjs`, `lib/`, `scenes/`, `config.example.json`, `prompts.example.mjs`, `scripts/example.dialogue.json` (characters carry only `side`) | `config.local.json` (your cloned **voice IDs**, character **art paths**, default **background**) |
| The generic pipeline + technique | `assets/characters/*` (character **likenesses** — copyright/likeness) |
| | `prompts.local.mjs` (your **tuned viral prompts** — competitive IP) |
| | `ai-prompts.md` + `script-schema-and-formula.md` (the **exact prompts + 12-dialogue formula**) |
| | Your working `scripts/*.json` (accumulate personal generated asset URLs) |

**Your one-time personal setup:**
```bash
cd orchestrator
cp config.example.json config.local.json   # gitignored — your voice IDs, art paths, bg
cp prompts.example.mjs  prompts.local.mjs  # gitignored — refine the tuned wording
```
`run.mjs` auto-loads `config.local.json` (override with `--config <path>` or env
`DIALOGUE_STORY_CONFIG`) and prefers `prompts.local.mjs` over `prompts.example.mjs`.
Public scripts reference characters by name only; the overlay fills voice + art.
Background is **optional** — set it only when a story needs a gameplay backdrop;
otherwise the bg layer is skipped.

> **Backing up the private files:** they're `.gitignore`'d from the public repo, so
> commit them to your **private full-mirror repo** for cross-PC sync (see
> `orchestrator/PRIVATE-MIRROR.md`).



Input is one JSON file: `[{ "id", "character", "sentence" }]` (Hinglish is fine).
Every stage writes its output back into the script JSON and **skips if that field
already exists** — delete a field to re-run only that stage.

| # | Stage | What it does | Live capability used | Output field |
|---|-------|--------------|----------------------|--------------|
| 0.5 | Script cleanup | Hinglish → proper mixed Devanagari/Latin | `POST /api/bridge/ai/text/generate` | `sentence` (normalized) |
| 1.0 | Voices | Per-character TTS (Minimax) | **voice** skill `/api/bridge/voice/*` | `audio.{url,duration}` |
| 1.1 | Word timing | Word-level timestamps | `POST /api/bridge/ai/transcribe/short` | `word_data.words[]` |
| 1.2 | Transliteration | Devanagari → correct Latin for captions | `POST /api/bridge/ai/text/generate` (ported prompt) | `proc_word_data` |
| 1.5 | Context images | # images + word-timed windows + Tavily search + best-pick | `POST /api/bridge/ai/image/search` + ported prompts | `images[]` |
| 2.0 | Caption/title | IG caption+hashtags + short hook-title overlay | `POST /api/bridge/ai/text/generate` (ported prompts) | `title_data`, `captioned_data` |
| 3.0 | Compose | Bg + characters (L/R springs) + karaoke subs + timed images + title | `editor.*` via `/api/execute` + Remotion | timeline |
| 4.0 | Export | Render + return file/URL | `editor.export` | `final_video` |

Full details, resumability logic, and exact command payloads: **`pipeline-stages.md`**.

## Sub-documents (read the relevant one before that stage)

| Doc | Contents |
|-----|----------|
| `script-schema-and-formula.md` | **(private)** Script JSON schema, the 12-dialogue viral formula, character roles, hook/CTA/topic IP — gitignored, in your private mirror |
| `pipeline-stages.md` | Stage-by-stage: exact endpoint, args, resumability field, ported rules, fallbacks |
| `ai-prompts.md` | **(private)** The exact tuned prompts — gitignored, in your private mirror. Public template of the prompt *shapes*: `orchestrator/prompts.example.mjs` |
| `remotion-composition.md` | The 5-layer composition rules ported from `editor_agent.py` + the Remotion upgrades (character scene, karaoke subs, timed images, title, camera) |

## ⭐ Verified voice recipe (do this first, never skip)

> # ⚠️ AUDIO ORDER RULE — READ THIS FIRST ⚠️
> **Preferred in-app flow:** Generate → place RAW audio on timeline → add captions /
> linked visuals → `editor.removeSilence { apply:true, cascadeLinkedTracks:true }`.
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

1. **Voices = CLONED voices** (`voice_type: voice_cloning`), set in `config.local.json`:
   Modi `moss_audio_c7d1738a-7b38-11f0-9359-4e72c55db738`, Rahul `RahulVoice_003`.
   System/preset voices sound wrong — always use the clones.
2. **TTS text = the Devanagari `sentence`**, sent DIRECTLY. Hindi in देवनागरी, only real
   English/tech words in Latin. Never romanize the audio input. (`latin` is caption-only.)
3. **Call:** `POST /api/bridge/voice/generate` (Bearer auth) `{ text, voice_id, speed:1.0, format:"mp3" }`
   → `{ audio_url, duration_seconds }`. Add with `editor.addAudio {src,from,volume:95}`,
   first line at `from:0`, each next at the running sum of prior durations.
4. **Preferred gap removal:** add captions / character images / b-roll as linked
   timeline items, then call `editor.removeSilence` on each dialogue audio item with
   `apply:true, cascadeLinkedTracks:true`. This removes internal gaps and keeps all
   linked caption/image timing synced automatically.
5. **Offline/pre-import option:** if you are composing from files before timeline
   import, run the downloaded mp3 through the **voice** skill's
   `scripts/process_dialogue_audio.py` BEFORE `editor.addAudio`. This is the ported
   TlEditingSolution audio prep (silence trim −40 dBFS / 100 ms + normalize + 13 dB).
   **Re-read the processed clip's duration** (it shrinks after trimming) and use THAT
   for the running offset. See the **voice** skill §3b for flags (`--boost-db`,
   `--max-gap-ms`, `--no-normalize`).
6. **Smoke-test one line first** (generate Modi's line, add at `from:0`, confirm it sounds
   right) before batching all dialogues. See `pipeline-stages.md → Stage 1.0` for the
   exact curl and both worked examples.

### Native in-timeline silence removal: `editor.removeSilence`

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
# Port + token
eval "$(node -e '
  const c=require(require("os").homedir()+"/.skilltown-desktop/api.json");
  console.log(`export API=http://127.0.0.1:${c.port}\nexport TOKEN=${c.token}`);')"
export AUTH="Authorization: Bearer $TOKEN"
curl -s "$API/api/health" -H "$AUTH" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const d=JSON.parse(s);console.log("ok:",d.ok??true,"| cloud.auth:",d.cloud?.authenticated)})'
# Voices + AI need a signed-in cloud session. If cloud.authenticated is false → sign in inside ContentLead first.
```

## Run it

```bash
# The bundled example is PRE-WIRED: real Modi/Rahul Minimax voice IDs + character PNGs
# (copied to orchestrator/assets/characters/). The only thing to supply is a gameplay
# background clip (set background_video to any .mp4 under ~/Codes|~/Downloads|~/Movies,
# or leave it to skip the bg layer).
node orchestrator/run.mjs orchestrator/scripts/example.dialogue.json

# Author your own: copy the example, edit dialogues + characters, then run it.
# Re-run only one stage: delete its output field from the JSON and run again.
# Dry-run planning (no side effects): add --plan
node orchestrator/run.mjs orchestrator/scripts/example.dialogue.json --plan
```

The orchestrator prints each stage, skips completed ones, and stops on the first
failure with the exact endpoint + payload it tried (so it's debuggable). It drives:
the **voice** bridge, the **ai-media** AI bridge, and the **contentlead** editor
commands — all already documented in their own skills; this skill orchestrates them
in the proven order.

## Beyond Modi–Rahul

The characters, voices, topic and formula are all **data**, not code. Swap the
`characters` map + character PNGs/voice IDs and the same pipeline produces any
two-hander: teacher↔student, founder↔skeptic, Elon↔Peter, etc. Extra character art
already exists under `TlEditingSolution/CharImages/` (elon, peter, stewie, trump).
Keep the **role contrast** (curious questioner vs. confident expert) — that contrast
is what drives retention. See `script-schema-and-formula.md`.

## 🎬 Live In-App Edit Playbook — Two-Character Reel (verified working)

Use this runbook when recreating the battle-tested two-character dialogue-story reel directly in the ContentLead/SkillTown desktop editor. It assumes a vertical 1080×1920 reel, two exact-length speaker audio files, character PNGs, word-timed b-roll images, and paged karaoke captions.

### 1. Auth, connection, and tab targeting

1. Read fresh connection data **every session** and after every app restart/origin switch:
   ```bash
   cat ~/.skilltown-desktop/api.json
   # → { "port": 54110, "token": "...", "mediaServerPort": 54109, "tabs": [...] }
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

1. Clear the timeline:
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

> Warning: `setAnimation` entrance animations currently do **not** persist through project save/restore reload. Re-apply all entrance animations after every reload.

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
   Confirm `status: "success"`. Cloud save requires all `src` fields to be media-server/blob/HTTPS URLs rather than bloated local data URIs.
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
4. If the preview frame looks stale right after edits, force a refresh by playing a short range:
   ```json
   { "type": "editor.previewRange", "params": { "from": 6400, "to": 7000 } }
   ```
   Avoid `query.capturePreviewFrame`; it has returned blank frames in this workflow.
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
    cmd('editor.clearTimeline', {}),
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
- Not re-applying `editor.setAnimation` after reload means entrance animations disappear.
- Trusting a screenshot immediately after edits can show stale preview state. Force refresh with `editor.previewRange`.
- Hardcoding the API port breaks after restart. Always re-read `~/.skilltown-desktop/api.json`.
