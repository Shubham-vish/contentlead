---
name: skills-map
description: Plain-language map of every skill grouped by pipeline stage, with the "shared brains" and how the scripting skills relate. Read this first to understand what exists and which skill to load for a task.
tags: overview, index, map, scripting, relationships, help, start
---

# Skills Map — What We Have & How They Relate

> One content pipeline. Every skill plugs into one stage.
> Two skills are **shared brains** that other skills call — don't re-implement them.

```
IDEA → RESEARCH → SCRIPT → PRODUCE (edit / voice / media) → CLIP → PUBLISH
```

---

## 🧠 Shared brains (load these; never re-implement their logic)

| Skill | What it is | Who calls it |
|-------|------------|--------------|
| **`cl-virality-scoring`** | The single 0–100 virality rubric (8 signals). Medium-agnostic — judges "is this viral?" for a clip, a written script, a hook line, a post idea, or a thumbnail. | `cl-ai-clipping`, `cl-script-evaluator`, `cl-dialogue-story`, `cl-content-style` |
| **`cl-editor`** | Master router for the ContentLead desktop video editor. Load first before any editor command; it explains the local HTTP API. | every skill that touches the editor |
| **`cl-board`** | Master router for the ContentLead Whiteboard (Boards). Same desktop bridge as `cl-editor` but a different command surface — diagrams, mind maps, flowcharts, slide decks, sticky-note brainstorms. Do NOT use for video editing. | any skill that needs to draw or arrange on a canvas |

**Rule:** if you need to score how viral something is, load `cl-virality-scoring`. Do NOT write ad-hoc scoring heuristics anywhere else.

---

## ✍️ Scripting cluster (READ THIS — for the scripting agent)

These three chain together. They do **not** overlap — each owns a different question:

| Skill | Owns the question | What it does |
|-------|-------------------|--------------|
| **`cl-content-style`** | *Whose voice?* | Stores a creator's personal voice (extracted from their sample scripts, saved in Cosmos). **Remixes** any inspiration content into that voice. |
| **`cl-script-evaluator`** | *How good is the craft?* | Two modes — **write** a viral script from scratch, and **score/rewrite** an existing script. |
| **`cl-virality-scoring`** | *Will it pop?* | The shared 0–100 verdict both of the above call. |

### The scripting flow

```
cl-content-style (voice)  →  cl-script-evaluator (craft polish)  →  cl-virality-scoring (verdict)
       │                                                            ▲
       └──────────────── scores its own remix output ──────────────┘
```

- `cl-content-style.remix` produces a draft in the user's voice → scores it with `cl-virality-scoring` → if weak, iterates the hook once → hands the draft to `cl-script-evaluator` (write/polish mode) for line-level craft.
- `cl-script-evaluator` writing a fresh script also calls `cl-virality-scoring` at Step 1.
- **`cl-dialogue-story`** is the special case: two-character dialogue reels (Modi–Rahul format) for any topic. It also scores via `cl-virality-scoring`.

**One-paragraph brief for the scripting agent:**
> We have a shared virality brain (`cl-virality-scoring`) — never write your own scoring logic, load it. For scripting: `cl-script-evaluator` both **writes** and **scores** scripts; `cl-content-style` captures a specific creator's **voice** and **remixes** inspiration into it, then scores via `cl-virality-scoring` and hands drafts to `cl-script-evaluator` for polish. So the flow is **cl-content-style (voice) → cl-script-evaluator (craft) → cl-virality-scoring (verdict)**. `cl-dialogue-story` is the two-character-reel special case.

---

## 🔎 Research / Inspiration

| Skill | Use it to |
|-------|-----------|
| **`cl-content-inspiration`** | Research trends; scrape/analyze competitor content across IG, YouTube, X, Reddit; transcribe/download source videos. Feeds ideas + transcripts into scripting. |
| **`cl-ad-intelligence`** | Search & analyze competitor ads from the Meta Ad Library; track brands; save ads to folders. |

---

## 🎬 Production (turn a script into a video)

| Skill | Use it to |
|-------|-----------|
| **`cl-content-direction`** | Creative strategy, storyboarding, narrative arcs, SFX/audio-layering plan, track management. The "director" layer. |
| **`cl-ai-media`** | AI image search / generation / compose / vision analysis; text generation. Sources visuals. |
| **`cl-ai-generate`** | Generate NEW footage/stills *inside the editor* via `aiVideo.*` commands — Veo 3.1 video, Gemini Omni, NanoBanana images, with start/end frames, reference images, and bring-your-own-key Google Cloud quota. The *in-app* generation command surface (vs. `my-veo-reel-gen`/`my-omni-video-gen` which shell out to gcloud). |
| **`cl-voice`** | Clone a voice from an audio sample + text-to-speech generation. |
| **`cl-audio`** | Local audio processing — vocal/music stem separation, cleanup. |
| **`cl-dialogue-broll`** | Add word-timed B-roll images/scenes that pop in as concepts are spoken (any clip). Reuses word-level transcript + `cl-ai-media`. |
| **`cl-creator-styles`** | Browse / inspect / subset / compose the SkillTown visual style templates (10 creator styles). The *visual* look — distinct from `cl-content-style` (which is the *voice*). |
| **`cl-remotion`** | Author custom Remotion scenes (animations, effects, charts, transitions) to add to the editor timeline. |

---

## ✂️ Clipping

| Skill | Use it to |
|-------|-----------|
| **`cl-ai-clipping`** | Turn a long video (podcast/interview) into viral vertical clips: transcribe → score with `cl-virality-scoring` → extract → reframe 9:16 → caption → render. |

---

## 📤 Publishing

| Skill | Use it to |
|-------|-----------|
| **`cl-content-publishing`** | End-to-end publish: create content, set metadata, upload video, configure channels, set CTA, post to Instagram / YouTube / LinkedIn, poll status. |

---

## 💸 Offers (sales pages, checkout, thank-you, email)

| Skill | Use it to |
|-------|-----------|
| **`cl-offers`** | Build and edit ContentLead Offer Studio surfaces — paid offers AND free lead-magnets: offer sales page, checkout, thank-you, buyer emails. Sections + templates + page presets + themes + coupons + products + custom actions, PLUS full checkout/thank-you branding (colors, fonts, copy, custom CSS, 6 style presets, default phone country) and lead-capture forms — all via `/api/offer-studio/commands/*`. |
| **`cl-creator-biopage`** | Build, theme, and publish a creator's personalized public bio page at `contentlead.in/<handle>` (link-in-bio / storefront) — typed allowlisted sections + starter kits + theme vibes + AI generate-from-profile + draft/publish, all via `/api/storefront/commands/*`. Sibling to `cl-offers`; `shopOffers` surfaces the creator's offers. |

---

## 🛠️ Ops / Entry docs

| Doc / Skill | Purpose |
|-------------|---------|
| **`overview.md`** | All editor capabilities by category + how the local HTTP API works. Load first for editor control. |
| **`getting-started.md`** | Quick-start walkthrough. |
| **`orchestration-e2e.md`** | Full end-to-end orchestration example across skills. |
| **`cl-testing`** | Agent-run testing of the ContentLead desktop editor. |

---

## Quick "which skill do I load?" cheat sheet

| I want to… | Load |
|------------|------|
| Score how viral anything is | `cl-virality-scoring` |
| Write / rate a script | `cl-script-evaluator` (+ `cl-virality-scoring`) |
| Write in a specific creator's voice / remix a reel | `cl-content-style` |
| Make a two-character dialogue reel | `cl-dialogue-story` |
| Research trends / competitors | `cl-content-inspiration`, `cl-ad-intelligence` |
| Talk to the editor at all | `cl-editor` (first), then `overview.md` |
| Draw on a whiteboard / build a diagram, mind map, or slide deck | `cl-board` |
| Add images / generate visuals | `cl-ai-media`, `cl-dialogue-broll` |
| Clone a voice / TTS | `cl-voice` |
| Split stems / clean audio | `cl-audio` |
| Apply a visual style template | `cl-creator-styles` |
| Build a custom animated scene | `cl-remotion` |
| Cut a long video into clips | `cl-ai-clipping` |
| Publish to IG / YT / LinkedIn | `cl-content-publishing` |
| Plan the creative / storyboard | `cl-content-direction` |
