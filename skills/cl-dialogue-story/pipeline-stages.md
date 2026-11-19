# Pipeline Stages — exact flow, endpoints, resumability

Ported from `TlEditingSolution/final_flow.py` (`process_script`). Each stage:
1. **checks its output field** — if present, **skips** (not an API idempotency guarantee);
2. otherwise calls the live capability and **writes the field back into the script JSON**;
3. saves the JSON after every dialogue so a crash never loses work.

Real runs require `--tab-id <chosen-tab> --content-id <chosen-content>` and
matching renderer readiness; the helper never chooses an arbitrary target.
`--plan` is offline, ignores private overlays and does not write the script.
Composition requires the advertised fresh-track feature, creates owned role
tracks and reuses their exact IDs with native layer priorities.

Composition is non-atomic: inspect actual timeline state after a failure rather
than deleting a flag and blindly replaying inserts. Obtain paid-action approval
before real API stages. See `SKILL.md` and `cl-editor/workflow-readiness.md` for
the current safe invocation, save receipt and render handoff.

Use an external private config via `--config <path>` (or
`DIALOGUE_STORY_CONFIG`) and keep the working script outside this public directory.
The generic prompt builders below are exported by `orchestrator/prompts.example.mjs`.
Legacy local prompt overrides still take precedence in real runs; the helper has
no external prompt-module option. Personal formula Markdown is not a runtime
dependency. Do not move an existing override without preserving its loader.

All endpoints below are the ones the **voice**, **cl-ai-media** and **contentlead**
skills already document. This skill only calls them in the proven order.

---

## Stage 0.5 — Script normalization (Hinglish → clean mixed script)
- **Skip if:** dialogue already normalized (tracked via `_stages.norm` flag).
- **Call:** `POST /api/bridge/ai/text/generate` with a real JSON body
  `{ messages: [...] }` containing the *normalization* system prompt (see
  `orchestrator/prompts.example.mjs`, `PROMPTS.normalize`). The response is backend JSON directly
  (single parse; no envelope wrapper).
- **Write:** replaces `sentence` with the cleaned version.
- Original engine: `sentence_ai_processor.py` (3 retries + confidence).

## Stage 1.0 — Per-character voices (TTS)  ⭐ CRITICAL — verified recipe

> Discover supported speech settings and choose an authorized voice through
> `cl-voice`. The public example does not supply personal clone IDs or permission
> to reproduce another person's voice.

### The two rules that make or break the audio
1. **Use authorized voices**, supplied through the external config's
   `characters[*].voiceId`. If using clones, list available authorized choices
   with `GET /api/bridge/voice/voices?voice_type=voice_cloning`; a public character
   label is not a reusable provider ID. Preset voices are also valid choices.
2. **Send the Devanagari `sentence` field DIRECTLY to TTS.** Hindi words must be in
   देवनागरी; only genuinely English/tech terms stay Latin (`free`, `Pro subscription`,
   `Business model`, `cup`). Minimax pronounces Devanagari correctly; romanized Hindi
   sounds bad. **Never romanize the TTS input.** (`latin` is a *separate* field used only
   for on-screen captions — see Stage 1.2.)

### Endpoint (direct voice bridge)
`POST /api/bridge/voice/generate` with `Authorization: Bearer <token>` from
`~/.skilltown-desktop/api.json`.

```bash
# Example — choose an authorized voice and approve generation first:
curl -sX POST "http://127.0.0.1:$PORT/api/bridge/voice/generate" \
  -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
  -d '{
    "text": "राहुल, free तो सिर्फ पहला चाय का cup है। असली कमाई तो Pro subscription में छुपी है।",
    "voice_id": "<authorized-speaker-a-voice-id>",
    "speed": 1.0,
    "format": "mp3"
  }'
# → { "status":"success", "audio_url":"…", "duration_seconds": 7.92 }
```

Second speaker example (same shape, independently authorized voice):
```jsonc
{ "text": "मोदी जी, ये ContentLead तो बिल्कुल free है... फिर पैसा कहाँ से आएगा? Business model ही नहीं है इसमें!",
  "voice_id": "<authorized-speaker-b-voice-id>", "speed": 1.0, "format": "mp3" }
```

### Fields
- `text` — the **Devanagari `sentence`** (≤5000 chars). Mixed Devanagari+Latin is fine.
- `voice_id` — the character's authorized voice ID (from external config).
- `speed` — `1.0` (normal). `format` — `mp3`.
- Read `GET /api/bridge/voice/options` first. The backend owns supported models,
  emotions, reaction tags and limits. Missing options blocks the voice stage.
- `model` — optional script override, otherwise the advertised default.
- `emotion` — optional supported mood per line; absent/null is Auto. Unknown moods
  and incompatible models fail before generation, not silently.
- `reaction` — optional script field containing an advertised tag name (for example
  `sighs`). The orchestrator prepends `(sighs)` to provider text, leaving `sentence`
  and its caption text free of provider instructions. Visual directions are not sent.
- The bridge forwards `model` and `emotion`; the helper verifies returned settings
  and saved history identity. It does not expose arbitrary provider parameters.

### Add the returned audio to the timeline
Download `audio_url` to a local mp3 for local transcription; prefer its authorized
playback URL for timeline audio. Insert with deliberate `trackId` or
`createNewTrack:true`, timing and `volume:95`; the helper retains its own audio
role track. Validate source accessibility before final save/render.
The **first** line starts at `from:0`; each subsequent line starts at the running sum of
prior `duration_seconds` (× 1000). `duration_seconds` **is the clock** for all later
stages (captions/images are timed relative to it).

### Single-line manual smoke test (recommended before a full run)
Generate ONE Modi line, add it at `from:0`, screenshot/scrub to confirm it sounds right,
THEN batch the rest. This is exactly how the good audio was validated.

- **Skip if:** `dialogue.audio?.file` exists and recorded synthesis settings still
  match. Unrecorded older audio cannot satisfy newly requested expression settings.
- **Write:** `dialogue.audio = { url, file, duration, request, historyId, synthesis }`.
  Save paid output before downloading; a download retry reuses it, not another TTS
  call. `audioAttempt` guards uncertain paid attempts. Retained `needsReview` audio
  must be reconciled before continuing. A structured pre-generation validation
  rejection is marked `rejected`; correct the input before explicitly running again.
- Orchestrator: `run.mjs stage10_voices` (resolves `charVoice()` → config voiceId → the
  call above → `downloadTo()` → stores `d.audio`).
- The original engine used `speech-2.5-hd-preview`; current model selection is
  deliberately owned by the speech-options API instead of that historical default.
- Measure actual file duration, listen for natural reactions, and inspect ASR word
  timings. ASR can emit "ha" or "ah" for reactions; review caption alignment instead
  of treating a provider tag as a spoken caption or trimming the reaction away.

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
  `{ messages: [...] }` and `PROMPTS.transliterate` from the public prompt template —
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
> **Reusable recipe:** this stage IS the standalone **`cl-dialogue-broll`** skill applied per
> line. Load `cl-dialogue-broll` for the format-agnostic version (search-vs-generate modes,
> word-alignment, timeline placement + z-order) usable on any clip.
- **Skip if:** `dialogue.images?.length` (or explicitly `[]` meaning "decided none").
- **Step A — decide count + windows:** `POST /api/bridge/ai/text/generate` with
  `{ messages: [...] }` and `PROMPTS.imageDecision` from the public prompt template, passing
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
  `{ messages: [...] }` and `PROMPTS.imagePick` from the public prompt template over
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
  (`PROMPTS.scriptAnalysis` in the public prompt template). Cached in `script_analysis`.
- **2b Hook title (on-screen overlay, 0–~3s):** `POST /api/bridge/ai/text/generate`
  with `{ messages: [...] }` and the public template's `PROMPTS.hookTitle` →
  `title_data = { text_hook_line (2–5 words), duration_to_show_text_hook_line_in_video_start (3.0–5.0s) }`.
- **2c IG caption package:** `POST /api/bridge/ai/text/generate` with
  `{ messages: [...] }` and the public template's `PROMPTS.igCaption` →
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
- This is a manual command handoff after the helper's final composition stage.
  Follow `cl-editor/workflow-readiness.md`: stabilized preview, current-design
  cloud-save receipt, immutable design, actual HTTP `/api/render` job/status,
  and `render.verifyOutput({jobId})`. `editor.export` is not the helper's
  pollable export implementation, and `final_video` is not populated by it.

---

### Global rules (ported)
- **Audio is the clock.** A dialogue's start = sum of prior `audio.duration`; its
  length = its own `audio.duration`. All sub-timings are relative to that.
- **Resumability.** Presence of an output field ⇒ skip. `run.mjs` also keeps a
  `_stages` map of booleans for stages that don't have a natural output field.
- **Save often.** Write the JSON after each dialogue/stage.
- **Fail loud.** On any endpoint error, stop and print the endpoint + payload.
