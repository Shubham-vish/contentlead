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
| **`virality-scoring`** | The single 0–100 virality rubric (8 signals). Medium-agnostic — judges "is this viral?" for a clip, a written script, a hook line, a post idea, or a thumbnail. | `ai-clipping`, `script-evaluator`, `dialogue-story`, `content-style` |
| **`contentlead`** | Master router for the ContentLead desktop video editor. Load first before any editor command; it explains the local HTTP API. | every skill that touches the editor |

**Rule:** if you need to score how viral something is, load `virality-scoring`. Do NOT write ad-hoc scoring heuristics anywhere else.

---

## ✍️ Scripting cluster (READ THIS — for the scripting agent)

These three chain together. They do **not** overlap — each owns a different question:

| Skill | Owns the question | What it does |
|-------|-------------------|--------------|
| **`content-style`** | *Whose voice?* | Stores a creator's personal voice (extracted from their sample scripts, saved in Cosmos). **Remixes** any inspiration content into that voice. |
| **`script-evaluator`** | *How good is the craft?* | Two modes — **write** a viral script from scratch, and **score/rewrite** an existing script. |
| **`virality-scoring`** | *Will it pop?* | The shared 0–100 verdict both of the above call. |

### The scripting flow

```
content-style (voice)  →  script-evaluator (craft polish)  →  virality-scoring (verdict)
       │                                                            ▲
       └──────────────── scores its own remix output ──────────────┘
```

- `content-style.remix` produces a draft in the user's voice → scores it with `virality-scoring` → if weak, iterates the hook once → hands the draft to `script-evaluator` (write/polish mode) for line-level craft.
- `script-evaluator` writing a fresh script also calls `virality-scoring` at Step 1.
- **`dialogue-story`** is the special case: two-character dialogue reels (Modi–Rahul format) for any topic. It also scores via `virality-scoring`.

**One-paragraph brief for the scripting agent:**
> We have a shared virality brain (`virality-scoring`) — never write your own scoring logic, load it. For scripting: `script-evaluator` both **writes** and **scores** scripts; `content-style` captures a specific creator's **voice** and **remixes** inspiration into it, then scores via `virality-scoring` and hands drafts to `script-evaluator` for polish. So the flow is **content-style (voice) → script-evaluator (craft) → virality-scoring (verdict)**. `dialogue-story` is the two-character-reel special case.

---

## 🔎 Research / Inspiration

| Skill | Use it to |
|-------|-----------|
| **`content-inspiration`** | Research trends; scrape/analyze competitor content across IG, YouTube, X, Reddit; transcribe/download source videos. Feeds ideas + transcripts into scripting. |
| **`ad-intelligence`** | Search & analyze competitor ads from the Meta Ad Library; track brands; save ads to folders. |

---

## 🎬 Production (turn a script into a video)

| Skill | Use it to |
|-------|-----------|
| **`content-direction`** | Creative strategy, storyboarding, narrative arcs, SFX/audio-layering plan, track management. The "director" layer. |
| **`ai-media`** | AI image search / generation / compose / vision analysis; text generation. Sources visuals. |
| **`voice`** | Clone a voice from an audio sample + text-to-speech generation. |
| **`audio`** | Local audio processing — vocal/music stem separation, cleanup. |
| **`dialogue-broll`** | Add word-timed B-roll images/scenes that pop in as concepts are spoken (any clip). Reuses word-level transcript + `ai-media`. |
| **`creator-styles`** | Browse / inspect / subset / compose the SkillTown visual style templates (10 creator styles). The *visual* look — distinct from `content-style` (which is the *voice*). |
| **`remotion`** | Author custom Remotion scenes (animations, effects, charts, transitions) to add to the editor timeline. |

---

## ✂️ Clipping

| Skill | Use it to |
|-------|-----------|
| **`ai-clipping`** | Turn a long video (podcast/interview) into viral vertical clips: transcribe → score with `virality-scoring` → extract → reframe 9:16 → caption → render. |

---

## 📤 Publishing

| Skill | Use it to |
|-------|-----------|
| **`content-publishing`** | End-to-end publish: create content, set metadata, upload video, configure channels, set CTA, post to Instagram / YouTube / LinkedIn, poll status. |

---

## 🛠️ Ops / Entry docs

| Doc / Skill | Purpose |
|-------------|---------|
| **`overview.md`** | All editor capabilities by category + how the local HTTP API works. Load first for editor control. |
| **`getting-started.md`** | Quick-start walkthrough. |
| **`orchestration-e2e.md`** | Full end-to-end orchestration example across skills. |
| **`testing`** | Agent-run testing of the ContentLead desktop editor. |

---

## Quick "which skill do I load?" cheat sheet

| I want to… | Load |
|------------|------|
| Score how viral anything is | `virality-scoring` |
| Write / rate a script | `script-evaluator` (+ `virality-scoring`) |
| Write in a specific creator's voice / remix a reel | `content-style` |
| Make a two-character dialogue reel | `dialogue-story` |
| Research trends / competitors | `content-inspiration`, `ad-intelligence` |
| Talk to the editor at all | `contentlead` (first), then `overview.md` |
| Add images / generate visuals | `ai-media`, `dialogue-broll` |
| Clone a voice / TTS | `voice` |
| Split stems / clean audio | `audio` |
| Apply a visual style template | `creator-styles` |
| Build a custom animated scene | `remotion` |
| Cut a long video into clips | `ai-clipping` |
| Publish to IG / YT / LinkedIn | `content-publishing` |
| Plan the creative / storyboard | `content-direction` |
