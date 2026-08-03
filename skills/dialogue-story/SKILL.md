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

The single most important correctness rule in this pipeline:

1. **Voices = CLONED voices** (`voice_type: voice_cloning`), set in `config.local.json`:
   Modi `moss_audio_c7d1738a-7b38-11f0-9359-4e72c55db738`, Rahul `RahulVoice_003`.
   System/preset voices sound wrong — always use the clones.
2. **TTS text = the Devanagari `sentence`**, sent DIRECTLY. Hindi in देवनागरी, only real
   English/tech words in Latin. Never romanize the audio input. (`latin` is caption-only.)
3. **Call:** `POST /api/bridge/voice/generate` (Bearer auth) `{ text, voice_id, speed:1.0, format:"mp3" }`
   → `{ audio_url, duration_seconds }`. Add with `editor.addAudio {src,from,volume:95}`,
   first line at `from:0`, each next at the running sum of prior durations.
4. **Smoke-test one line first** (generate Modi's line, add at `from:0`, confirm it sounds
   right) before batching all dialogues. See `pipeline-stages.md → Stage 1.0` for the
   exact curl and both worked examples.

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
the **voice** bridge, the **ai-media** MCP proxy, and the **contentlead** editor
commands — all already documented in their own skills; this skill orchestrates them
in the proven order.

## Beyond Modi–Rahul

The characters, voices, topic and formula are all **data**, not code. Swap the
`characters` map + character PNGs/voice IDs and the same pipeline produces any
two-hander: teacher↔student, founder↔skeptic, Elon↔Peter, etc. Extra character art
already exists under `TlEditingSolution/CharImages/` (elon, peter, stewie, trump).
Keep the **role contrast** (curious questioner vs. confident expert) — that contrast
is what drives retention. See `script-schema-and-formula.md`.
