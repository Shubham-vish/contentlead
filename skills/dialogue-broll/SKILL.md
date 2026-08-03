---
name: dialogue-broll
description: Add relevant background B-roll images/scenes driven by what is being said — for ANY clip, dialogue, or transcript. Ports the proven TlEditingSolution image logic: per-segment AI decides HOW MANY images + a search query each, sources them (stock search OR AI-generate), an AI picks the best result, then each image is aligned to word-level timestamps and placed on the timeline with gaps so the base video shows through. Format-agnostic — use it for viral clips, talking-head reels, dialogue-story reels, explainers, or any video where visuals should match the spoken words. Routes entirely through the SkillTown Desktop MCP proxy + editor commands (no manual JWT).
tags: broll, b-roll, background, background-images, context-images, scenes, background-scenes, dialogue, dialogue-driven, transcript, word-timed, word-timing, timing, image-search, image-generate, stock, tavily, gemini, relevant-images, viral, reel, short, overlay, tlediting, tleditingsolution, ai-media, place-images, auto-broll
---

# Dialogue-Driven B-roll — relevant images/scenes timed to the spoken words

Given a clip (or a single dialogue) plus its **word-level timestamps**, this skill drops
**relevant background images / B-roll onto the timeline at the exact moment the related
word is spoken**, leaving small gaps so the base video (talking head, gameplay, etc.)
stays visible. This is the "how do I get the right images based on the dialogue" recipe —
a faithful, generalized port of the **TlEditingSolution** `enhanced_image_operator.py`
flow (5M+ views), rebuilt on ContentLead's desktop-routed AI tools.

> **This skill orchestrates existing primitives — it does not add new backend APIs.**
> Sourcing/analysis = the **`ai-media`** skill (via `POST /api/mcp/call`). Placement =
> the **`images`** / **`item-editing`** editor commands. Word timing = the
> **`transcription-and-editing`** / **`ai-clipping`** skills. Load those for full arg
> schemas; this file is the *recipe that chains them*.

## When to use
- You have a clip/reel and want **contextual images to pop in as concepts are mentioned**.
- You're building a **dialogue-story** reel (that skill calls this same logic per line).
- You're finishing a **viral clip** (`ai-clipping`) and want B-roll over the talking head.
- Any "show a picture of X when they say X" requirement.

## When NOT to use
- Pure full-screen slideshow (no base video to preserve) — just add images back-to-back.
- Manual, hand-picked single overlay — use `editor.addImage` directly.

---

## Prerequisites — you MUST have word-level timing

The whole point is **word alignment**, so never estimate timing proportionally. Get real
`words[]` first (each `{ word, start, end }` in seconds):

- Whole clip already transcribed → reuse it (`ai-clipping` Phase 1 /
  `query.transcribeWithSpeakers`).
- Otherwise, per audio/segment: **`prepwithai_transcribe_with_speakers`** (diarized,
  returns `speakerTranscript.words[]`) or `prepwithai_transcribe_short` (≤90s).
- Break the transcript into **segments** = one sentence / one speaker-turn / one dialogue.
  Run the recipe below **per segment** (times are relative to that segment's start).

See `ai-media` §Transcription and `ai-clipping` "Caption timing" for exact calls.

---

## The recipe (per segment)

```
for each segment (sentence / dialogue / speaker-turn):
  A. DECIDE   how many images + a search query + a rough time window for each   (LLM)
  B. SOURCE   fetch candidates for each query  (stock search OR AI-generate)
  C. PICK     choose the single best candidate per query                        (LLM)
  D. ALIGN    snap each image's start/end onto word timestamps; add gaps
  E. PLACE    add each image to the timeline at [segStart+start … segStart+end]
```

All LLM steps use **`prepwithai_text_generate`** (from `ai-media`) with the prompts in the
[Prompts](#prompts) section. All are JSON-in / JSON-out (`messages` is a JSON-encoded
string — see `ai-media` gotcha #2).

### A. Decide count + windows + queries  (LLM)
Call `prepwithai_text_generate` with **[Prompt §A](#a-decide-images-per-segment)**, passing
the segment text + its duration. Returns:
```json
{ "images_needed": 2,
  "image_decisions": [
    { "search_query": "...", "image_start_duration": 0.5, "image_end_duration": 2.8, "reasoning": "..." }
  ],
  "overall_reasoning": "..." }
```
Baked-in rules: images cover **60–90%** of the segment (leave base-video gaps), each
visible **1–3 s min**, **no overlap**, **concrete concepts only**, and (optional) **skip
person/character shots**. Short/simple (<4 s) segments may get **1 or 0** images.
**Fallback on error:** one image `{ search_query: text[:50], start: 0.5, end: min(dur-0.5, 3.0) }`.

### B. Source candidates — pick ONE mode (or hybrid)
| Mode | Tool | Best for |
|------|------|----------|
| **Stock search** (default, = TlEditingSolution) | `prepwithai_image_search` `{ query: search_query + " without watermark" }` | Real things, places, people, products, logos, screenshots |
| **AI-generate** | `prepwithai_image_generate` `{ prompt: search_query }` (or `_batch` for all queries) | Abstract ideas, stylized/branded looks, when stock is weak or watermarked |
| **Hybrid (recommended)** | try `image_search`; if 0 good candidates or all watermarked → `image_generate` | Highest hit-rate |

> Requires API keys: `image_search` → Tavily, `image_generate` → Gemini. Manage via the
> `web`/`psearch` domain `apikey_status`/`apikey_update` (see `ai-media` §7).

### C. Pick the best candidate  (LLM — search mode only)
For stock results, call `prepwithai_text_generate` with **[Prompt §C](#c-pick-best-image)**,
passing the segment text, the query, and the candidate `descriptions[]`. Returns
`{ "index": n, "reason": "..." }`. Optionally sanity-check the chosen image with
`prepwithai_image_analyze` (GPT-4o vision) before committing.
*(Generate mode skips this — you already have exactly one image per prompt.)*

### D. Align to word timestamps + add gaps
This is what makes images feel "synced to the words":
1. For each decision, find the **word(s) whose text matches the search concept**; set the
   image `start` to that word's `start` (so the picture appears as the keyword is said).
2. Set `end` when the concept stops being mentioned, respecting **min 1–3 s** and the
   segment's 60–90% coverage budget.
3. Insert **0.5–1 s gaps** between consecutive images so the base video peeks through.
4. Never overlap; clamp within the segment.
> Optional LLM pass: feed the current windows + the full `words[]` to
> `prepwithai_text_generate` with a "re-align to word timings and add gaps" instruction
> (ported from `optimize_images_timing_with_gaps`) for a cleaner result on dense segments.

### E. Place on the timeline
Convert to **absolute timeline time**: `imageStartAbs = segmentStartOnTimeline + start`.
Then per image:
```json
{"type": "editor.addImage", "params": {
  "src": "<downloaded/rehosted url>",
  "from": <imageStartAbs_ms>,
  "to":   <imageEndAbs_ms>,
  "track": 1
}}
```
- **Re-host first** if the URL is a temporary SAS/stock link:
  `prepwithai_asset_rehost` → permanent Azure URL (see `ai-media` gotcha #4).
- **Z-ORDER:** B-roll must sit **in front of** the base video but **behind** captions/titles.
  Add images on a mid track, then **always** call `editor.reorderTracks` so captions (front)
  > images > base video. See `contentlead` "Track Z-Order" + `track-management`.
- **Sizing/position:** for a picture-in-picture look, `editor.positionItem`/`editor.resize`;
  for full-cover B-roll, size to canvas. See `canvas-and-positioning`.
- **Entrance polish (optional):** a quick fade/scale via `editor.setAnimation`
  (`animations-and-effects`) makes pop-ins feel intentional.

Repeat for every segment. Then verify with `query.getTimelineItems` and preview.

---

## Prompts

### §A. Decide images per segment
Output JSON: `{ "images_needed", "image_decisions":[{"search_query","image_start_duration","image_end_duration","reasoning"}], "overall_reasoning" }`.
```
Analyze the following dialogue/segment and decide how many images should be shown during
it in an Instagram reel / YouTube short.

Text: "{segment_text}"
Duration: {duration} seconds

Consider:
1. Content complexity and the visual concepts mentioned.
2. Duration (longer segments may benefit from multiple images).
3. Visual storytelling — different concepts may need different images.
4. Engagement — multiple images keep viewers watching.
5. Balance — don't overwhelm; leave room for the base video to show through, but whenever
   possible show relevant images that explain the content and hook the audience.
6. Show each image long enough for the viewer to understand the concept.
7. Match image content with the exact words being spoken at that time.

For each image, provide: a specific search query, a start time, an end time, and reasoning.

Ensure:
- Images cover 60-90% of the total duration (leave gaps for the base video).
- Each image is visible at least 1-3 seconds.
- Images do not overlap in time.
- Focus on concrete concepts / objects / scenes mentioned.
- Avoid person/character-specific shots unless the person IS the subject — focus on content.

If the segment is simple or short (under 4 seconds), 1 image or even 0 images may be enough.
For longer/richer segments, use as many as align with timing, detail, and engagement.
Return JSON exactly as specified above.
```

### §C. Pick best image
Input: the segment text, the specific search query, and `[{index, description}]`.
Output JSON: `{ "index", "reason" }`.
```
Choose the best image from the search results for this context:
Original Text: "{segment_text}"
Specific Search Query: "{search_query}"
Available Images with Index:
{images_description_index}
Pick the single most relevant, high-quality, non-watermarked image that matches the words
being spoken. Return JSON: {"index": <n>, "reason": "<why>"}.
```

---

## End-to-end skeleton (one clip)
```
1. Ensure word timing (transcribe_with_speakers or reuse ai-clipping transcript).
2. Split transcript into segments (sentence / speaker-turn).
3. For each segment: run A→E above.
4. editor.reorderTracks  (captions front > B-roll > base video).
5. query.getTimelineItems to verify; preview; then project-and-export.
```

## Pitfalls
- **No word timing → don't proceed.** Proportional guesses look off; always transcribe first.
- **Temporary URLs expire.** `asset_rehost` (or download locally) before `editor.addImage`.
- **Watermarks.** Always append `" without watermark"` to search queries; if all candidates
  are watermarked, switch that decision to `image_generate`.
- **Coverage creep.** Respect 60–90% coverage + gaps, or the base video disappears.
- **Z-order.** Forgetting `editor.reorderTracks` hides B-roll behind the base video or
  hides captions behind B-roll.
- **Overlap.** Clamp/space windows; never let two images share time on the same track.

## Cross-references
- `ai-media` — the actual `prepwithai_image_search` / `image_generate` / `image_analyze` /
  `text_generate` / `transcribe_*` / `asset_rehost` calls (arg schemas + setup).
- `dialogue-story` — full two-character reel pipeline; its Stage 1.5 IS this recipe wired
  into that format (ports the same TlEditingSolution engine).
- `ai-clipping` — viral clip pipeline + caption presets; use this skill to add B-roll to a
  finished clip.
- `images` / `item-editing` / `canvas-and-positioning` / `track-management` /
  `animations-and-effects` — editor commands for placing, sizing, layering, animating.
- `transcription-and-editing` — captions + word-level timing details.
- Original engine: TlEditingSolution `Tools/enhanced_image_operator.py`
  (`decide_multiple_images_for_dialogue`, `choose_best_image_from_results`,
  `optimize_images_timing_with_gaps`, `smart_multiple_images_search_and_download`).
