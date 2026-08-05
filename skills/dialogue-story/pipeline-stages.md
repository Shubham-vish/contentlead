# Pipeline Stages — exact flow, endpoints, resumability

Ported from `TlEditingSolution/final_flow.py` (`process_script`). Each stage:
1. **checks its output field** — if present, **skips** (idempotent/resumable);
2. otherwise calls the live capability and **writes the field back into the script JSON**;
3. saves the JSON after every dialogue so a crash never loses work.

To re-run one stage: delete its field(s) from the JSON and re-run `run.mjs`.

All endpoints below are the ones the **voice**, **ai-media** and **contentlead**
skills already document. This skill only calls them in the proven order.

---

## Stage 0.5 — Script normalization (Hinglish → clean mixed script)
- **Skip if:** dialogue already normalized (tracked via `_stages.norm` flag).
- **Call:** `POST /api/bridge/ai/text/generate` with a real JSON body
  `{ messages: [...] }` containing the *normalization* system prompt (see
  `ai-prompts.md §1`). Batch of 3 dialogues. The response is backend JSON directly
  (single parse; no envelope wrapper).
- **Write:** replaces `sentence` with the cleaned version.
- Original engine: `sentence_ai_processor.py` (3 retries + confidence).

## Stage 1.0 — Per-character voices (TTS)  ⭐ CRITICAL — verified recipe

> **This is the exact, tested procedure. Follow it verbatim — it is what produced the
> good-sounding Modi & Rahul audio. Do NOT change the text framing or the voice type.**

### The two rules that make or break the audio
1. **Use the CLONED voices** (`voice_type: voice_cloning`), NOT system voices. The
   character clones are what give the recognizable Modi/Rahul sound. System voices
   (e.g. `hindi_male_1_v2`) sound generic/wrong for this format.
   - Modi  → `moss_audio_c7d1738a-7b38-11f0-9359-4e72c55db738`
   - Rahul → `RahulVoice_003`
   - (These live in `config.local.json` → `characters[*].voiceId`. List all clones with
     `GET /api/bridge/voice/voices?voice_type=voice_cloning`.)
2. **Send the Devanagari `sentence` field DIRECTLY to TTS.** Hindi words must be in
   देवनागरी; only genuinely English/tech terms stay Latin (`free`, `Pro subscription`,
   `Business model`, `cup`). Minimax pronounces Devanagari correctly; romanized Hindi
   sounds bad. **Never romanize the TTS input.** (`latin` is a *separate* field used only
   for on-screen captions — see Stage 1.2.)

### Endpoint (direct voice bridge)
`POST /api/bridge/voice/generate` with `Authorization: Bearer <token>` from
`~/.skilltown-desktop/api.json`.

```bash
# Example — Modi line (the exact call that worked):
curl -sX POST "http://127.0.0.1:$PORT/api/bridge/voice/generate" \
  -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
  -d '{
    "text": "राहुल, free तो सिर्फ पहला चाय का cup है। असली कमाई तो Pro subscription में छुपी है।",
    "voice_id": "moss_audio_c7d1738a-7b38-11f0-9359-4e72c55db738",
    "speed": 1.0,
    "format": "mp3"
  }'
# → { "status":"success", "audio_url":"…", "duration_seconds": 7.92 }
```

Rahul example (same shape, his clone + his Devanagari line):
```jsonc
{ "text": "मोदी जी, ये ContentLead तो बिल्कुल free है... फिर पैसा कहाँ से आएगा? Business model ही नहीं है इसमें!",
  "voice_id": "RahulVoice_003", "speed": 1.0, "format": "mp3" }
```

### Fields
- `text` — the **Devanagari `sentence`** (≤5000 chars). Mixed Devanagari+Latin is fine.
- `voice_id` — the character's CLONED voice id (from config).
- `speed` — `1.0` (normal). `format` — `mp3`.
- The bridge only forwards `text/voice_id/speed/format`; the HD Minimax model is fixed
  server-side (do NOT bother passing `model`/`language_boost` — they are dropped).

### Add the returned audio to the timeline
Download `audio_url` to a local mp3, then `editor.addAudio { src:<file>, from:<cumulativeMs>, volume:95 }`.
The **first** line starts at `from:0`; each subsequent line starts at the running sum of
prior `duration_seconds` (× 1000). `duration_seconds` **is the clock** for all later
stages (captions/images are timed relative to it).

### Single-line manual smoke test (recommended before a full run)
Generate ONE Modi line, add it at `from:0`, screenshot/scrub to confirm it sounds right,
THEN batch the rest. This is exactly how the good audio was validated.

- **Skip if:** `dialogue.audio?.file` exists.
- **Write:** `dialogue.audio = { url, file, duration }`.
- Orchestrator: `run.mjs stage10_voices` (resolves `charVoice()` → config voiceId → the
  call above → `downloadTo()` → stores `d.audio`).
- Original engine parity: `audio_processor.py` + `services/minimax_voice_service.py`
  (model `speech-2.5-hd-preview`), which also fed the raw Devanagari `sentence` to TTS.

## Stage 1.1 — Word-level timestamps  ⭐ LOCAL

> **Transcription runs FULLY LOCALLY with faster-whisper for this pipeline. Do NOT route
> this through the hosted AI transcribe bridge or `editor.autoCaption` — when remote
> transcription is unavailable, captions can silently degrade to fake even-spacing.**

- **Skip if:** `dialogue.word_data?.words?.length`.
- **Call:** `python3 orchestrator/lib/transcribe_local.py <dialogue.audio.file>`
  (faster-whisper `small`, int8 CPU, `word_timestamps=True`, `language=hi`) → real
  per-word `{word,start,end}` from the ACTUAL generated mp3, in ~3s. This is the true
  WhisperX replacement — offline, deterministic, no network.
- **Write:** `dialogue.word_data.words = [{ word, start, end }]` (Devanagari, as heard).
- **Why local:** the audio is generated from KNOWN text, so we don't need a hosted
  service — whisper on the local file gives real timing, and Stage 1.2 snaps our
  correct Latin onto it. Requires `pip install faster-whisper` (already present) + ffmpeg.
- Original engine parity: WhisperX `init_word_data` (same word-level timing role).

## Stage 1.2 — Transliteration (Devanagari → correct Latin for captions)
- **Skip if:** `dialogue.proc_word_data?.text`.
- **Preferred (deterministic):** use the author-provided `dialogue.latin` (correct Latin
  of the exact line) and **snap** those words onto the REAL whisper timings from Stage 1.1
  via `snapKnown()` (proportional index map: exact 1:1 when counts match, graceful drift
  otherwise). This gives correct spelling + real spoken pacing. NO transcription of the
  romanization is needed. (`run.mjs stage12_translit` does this.)
- **Fallback (no `latin`):** `POST /api/bridge/ai/text/generate` with
  `{ messages: [...] }` and the **transliteration prompt** (`ai-prompts.md §2`) —
  this is critical for *correct on-screen Latin captions*. Then map the Latin words
  back onto the `word_data` timings (same count/order).
- **Write:** `dialogue.proc_word_data = { text, words:[{word,start,end}] }`.
- Rules baked into the prompt: keep language, only change script; standard Hindi
  transliteration; keep already-Latin words; **numbers as digits** ("दो"→"2",
  "चार सौ अस्सी"→"480p", "चार के"→"4K"); acronyms as-is (CDN, OTP).
- Original engine: `subtitle_ai_processor.py` (`convert_devanagari_to_latin_ai` +
  `validate_latin_conversion_ai`, 3 retries + confidence).

## Stage 1.5 — Context images (per-dialogue, word-timed) ⭐
This is the "relevant images to the exact words spoken" behavior.
> **Reusable recipe:** this stage IS the standalone **`dialogue-broll`** skill applied per
> line. Load `dialogue-broll` for the format-agnostic version (search-vs-generate modes,
> word-alignment, timeline placement + z-order) usable on any clip.
- **Skip if:** `dialogue.images?.length` (or explicitly `[]` meaning "decided none").
- **Step A — decide count + windows:** `POST /api/bridge/ai/text/generate` with
  `{ messages: [...] }` and the **multiple-images decision prompt** (`ai-prompts.md §3`), passing
  `dialogue.proc_word_data.text` + `dialogue.audio.duration`. Returns
  `image_decisions:[{search_query, image_start_duration, image_end_duration, reasoning}]`.
  - Rules baked in: images cover **60–90%** of the dialogue (leave gameplay gaps);
    each image visible **1–3s min**; **no overlap**; concrete concepts only;
    **never** character images (modi/rahul); short/simple (<4s) dialogues may get
    1 or 0 images.
- **Step B — search:** for each decision, `POST /api/bridge/ai/image/search`
  with `{ query: search_query + " without watermark" }`. Do not send Tavily keys;
  SkillTown injects per-user keys server-side (configure them in app Settings →
  Image Search if missing).
- **Step C — pick best:** `POST /api/bridge/ai/text/generate` with
  `{ messages: [...] }` and the **best-image prompt** (`ai-prompts.md §4`) over
  the result descriptions → chosen index.
- **Write:** `dialogue.images = [{ url, image_start, image_end, query, reason }]`
  (times **relative to the dialogue start**). If Step A/B fail → fallback single
  image `{ image_start:0.5, image_end: min(duration-0.5, 3.0) }`.
- Original engine: `enhanced_image_operator.py` (`decide_multiple_images_for_dialogue`,
  `choose_best_image_from_results`, `MultipleImagesDecision`).

## Stage 2.0 — Title hook + Instagram caption
Runs once over the **whole** combined Latin script (`proc_word_data.text` joined).
- **Skip if:** `title_data` / `captioned_data` present (separate flags).
- **2a Script analysis:** `POST /api/bridge/ai/text/generate` → `ScriptAnalysis`
  `{ main_topic, key_concepts[], target_audience, content_type, engagement_style }`
  (`ai-prompts.md §5`). Cached in `script_analysis`.
- **2b Hook title (on-screen overlay, 0–~3s):** `POST /api/bridge/ai/text/generate`
  with `{ messages: [...] }` and the **hook-title prompt** (`ai-prompts.md §6`) →
  `title_data = { text_hook_line (2–5 words), duration_to_show_text_hook_line_in_video_start (3.0–5.0s) }`.
- **2c IG caption package:** `POST /api/bridge/ai/text/generate` with
  `{ messages: [...] }` and the **caption prompt** (`ai-prompts.md §7`) →
  `captioned_data = { main_caption(150–200w), hashtags(15–25), hook_line, call_to_action, text_hook_line }`.
- Original engine: `process_caption.py` + `caption_generator.py`.

## Stage 3.0 — Compose the video (Remotion + editor commands)
- **Skip if:** timeline already built (flag `_stages.composed`).
- Open/prepare content in ContentLead, then build the 5 layers by the deterministic
  rules in `remotion-composition.md`:
  1. background gameplay video (whole timeline);
  2. **characters** — alternate L/R per dialogue, spring slide-in, via the reusable
     `DialogueCharacter` Remotion scene;
  3. **karaoke word subtitles** from `proc_word_data.words` (styled captions);
  4. **context images** placed at `dialogueStart + image_start … image_end`;
  5. **title overlay** for `title_data.duration…`.
  Then `editor.reorderTracks` to fix z-order.
- Original engine: `editor_agent.py` `DynamicVideoEditor.edit()` (MoviePy) — we
  replace it with Remotion for real springs, transitions and editability.

## Stage 4.0 — Export
- `editor.export` → `final_video`. Optionally re-host / deliver.

---

### Global rules (ported)
- **Audio is the clock.** A dialogue's start = sum of prior `audio.duration`; its
  length = its own `audio.duration`. All sub-timings are relative to that.
- **Resumability.** Presence of an output field ⇒ skip. `run.mjs` also keeps a
  `_stages` map of booleans for stages that don't have a natural output field.
- **Save often.** Write the JSON after each dialogue/stage.
- **Fail loud.** On any endpoint error, stop and print the endpoint + payload.
