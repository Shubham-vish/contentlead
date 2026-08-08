---
name: virality-scoring
description: The shared virality brain — score any content (video clip, written script, hook line, post idea, thumbnail concept) 0-100 on 8 weighted signals, adapted per content type. Medium-agnostic single source of truth used by ai-clipping (score clip candidates), script-evaluator (score written scripts), and dialogue-story. Load this whenever you need to judge "is this viral?" or rank content by viral potential.
tags: virality, scoring, hooks, emotional, evaluation, ranking, content-strategy, framework
---

# Virality Scoring — The Shared Brain

> **Single source of truth** for judging viral potential of ANY content — a video clip
> candidate, a written script, a single hook line, a post idea, or a thumbnail concept.
> You (the AI agent) ARE the scorer. No external API call. Read the content, apply the
> framework below, output a 0-100 score with a reasoned breakdown.

## Who uses this skill

| Consumer skill | What it scores |
|---|---|
| **`ai-clipping`** | Candidate clips inside a long video (which 45-90s window to cut) |
| **`script-evaluator`** | A written script BEFORE it's filmed |
| **`dialogue-story`** | Story-driven dialogue clips (same brain, richer output) |
| **Direct use** | A hook line, a reel idea, a thumbnail concept, a post caption — anything |

Each consumer applies the SAME 8 signals; only the *medium adapter* (duration rules,
output shape) differs and lives in that consumer's own doc.

---

## Step 1 — Detect Content Type & Density

Before scoring, classify. This changes which signals matter most.

```
Content Type: podcast | interview | tutorial | lecture | commentary | debate | vlog | story | other
Content Density: low (filler/chit-chat) | medium | high (dense info/stories)
```

A high-density interview and a casual vlog have different viral patterns — score accordingly (see Step 4).

---

## Step 2 — The 8 Virality Signals

Score the content 0-100 by weighing these 8 signals (ranked by impact). Weights are the
default baseline; Step 4 re-weights them per content type.

| # | Signal | Weight | What to look for |
|---|--------|--------|------------------|
| 1 | **Hook Strength** | 25% | Do the first 1-3 seconds (or first 1-2 sentences) create immediate curiosity? Would someone stop scrolling? |
| 2 | **Emotional Peak** | 20% | Does it trigger a genuine feeling — surprise, laughter, anger, vulnerability, excitement? Raw > polished. |
| 3 | **Opinion Bomb** | 15% | Strong, polarizing, or counter-intuitive stance that makes people want to comment "agree"/"disagree". |
| 4 | **Revelation** | 12% | A surprising fact, stat, or confession that reframes how the viewer thinks. "Wait, really?" |
| 5 | **Conflict/Tension** | 8% | A problem, challenge, pushback, or opposing viewpoint that creates tension. |
| 6 | **Quotability** | 7% | At least one standalone line someone would screenshot / put on a quote card. |
| 7 | **Story Arc** | 7% | Clear beginning → build → payoff. A climax or twist that pays off a setup. |
| 8 | **Practical Value** | 6% | A concrete tip, tool, or takeaway the viewer can immediately use. |

### Signal deep-reference

**1. Hook Strength (25%)** — the single highest-leverage signal. Patterns that work:
- Forbidden knowledge: "Nobody talks about...", "The industry doesn't want you to know..."
- Contrarian: "Everyone is wrong about...", "The opposite is actually true..."
- Cliffhanger: "What happened next changed everything...", "And that's when I realized..."
- Bold claim: "This one thing will...", "The fastest way to..."
- Vulnerability: "I lost everything...", "My biggest mistake was..."
- Pattern interrupt: "Wait, forget everything I just said...", sudden topic shift

> **Rule:** content without a strong hook in the first 3 seconds / first sentence loses
> 30-40 points automatically. The hook is not optional.

**2. Emotional Peak (20%)** — raw, unscripted emotion is inherently shareable:
- Genuine laughter (not polite chuckles), visible shock, passionate anger, vulnerable admission, excitement of discovery.
- **Text signals:** exclamation, interrupted speech, repeated words ("no no no", "wait wait"), sudden shifts, expletives.
- **Audio signals (if available):** energy spikes, volume jumps >6dB above baseline, laughter bursts.

**3. Opinion Bomb (15%)** — "X is overrated", "the real problem with Y is…", rankings, hot takes, calling popular beliefs wrong.

**4. Revelation (12%)** — surprising stat ("only 2% know…"), behind-the-scenes secret, personal confession, myth-bust.

**5. Conflict/Tension (8%)** — direct pushback, challenging a premise, debate with clear sides, a problem confronted head-on.

**6. Quotability (7%)** — concise wisdom, memorable analogy, witty observation, a reframe ("don't think of it as X, think of it as Y").

**7. Story Arc (7%)** — "and then…" moments, unexpected turns, the punchline of an extended setup, resolution of built-up tension.

**8. Practical Value (6%)** — step-by-step tips, specific tools/resources, "here's exactly what to do", templates/frameworks/formulas.

---

## Step 3 — Produce the Score

1. Rate each of the 8 signals 0-100 for the content.
2. Multiply by its (type-adjusted) weight and sum → composite 0-100.
3. Flag every signal scoring **below 60** with a specific, concrete fix.

### Score thresholds

| Score | Meaning |
|-------|---------|
| **85-100** | Strong viral candidate — lead with it |
| **70-84** | Good — worth producing, tighten the weakest signal |
| **60-69** | Borderline — only if the hook can be fixed |
| **< 60** | Not viral-worthy as-is — rework or drop |

### Standard output format

```markdown
## Virality Score: "<title / first line>"

**Overall: 62/100** — <one-line verdict: what's strong, what's weak>
**Content type:** interview (high density)

### Signal Breakdown
| Signal | Score | Assessment |
|--------|-------|-----------|
| Hook | 35/100 | ❌ Opens with "Today I want to talk about..." — generic, no curiosity |
| Emotional | 55/100 | ⚠️ Gets passionate at 0:45 but starts flat |
| Opinion | 80/100 | ✅ Strong contrarian take |
| Revelation | 70/100 | ✅ Good stat mid-way |
| Tension | 40/100 | ❌ Never addresses the counter-argument |
| Quotability | 75/100 | ✅ One screenshot-worthy line |
| Story Arc | 50/100 | ⚠️ Builds well, ending is abrupt |
| Practical | 65/100 | ✅ 2 actionable tips, but buried |

### Top 3 Fixes (highest impact first)
1. **Rewrite the hook** (35 → 80+): before/after example
2. **Add tension early** (40 → 70+): specific insertion
3. **Restructure the ending** (50 → 75+): what to move where
```

For clip selection, add machine-readable fields (`start_time`, `end_time`, `primary_speaker`,
`speaker_ratio`) — see the `ai-clipping` skill for the clip output schema.

---

## Step 4 — Content-Type Scoring Profiles

Re-weight the 8 signals by content type. Multipliers apply on top of the Step 2 baseline.

### Podcast (casual conversation)
```
Boost:      Opinion bombs (×1.5), Story peaks (×1.3), Quotable lines (×1.2)
Secondary:  Emotional peaks, Hook moments
De-emphasize: Practical value (×0.7) — unless a specific actionable tip
Hook style: "So here's the thing..." / controversial opener
```

### Interview (structured Q&A)
```
Boost:      Revelation (×1.5), Emotional peaks (×1.3), Conflict (×1.3)
Secondary:  Hook moments, Opinion bombs
De-emphasize: Practical value (×0.8) — unless the guest gives specific advice
Hook style: Strong GUEST statement, never the interviewer's question
Special:    Lead with the guest's answer, not the host's setup
```

### Tutorial (instructional)
```
Boost:      Practical value (×2.0), Revelation (×1.3)
Secondary:  Hook moments ("Most people do this wrong...")
De-emphasize: Emotional peaks (×0.5), Conflict (×0.3)
Hook style: "Stop doing X, do Y instead" / "The trick nobody shows you"
Special:    Must be self-contained — no prior context needed
```

### Lecture (educational)
```
Boost:      Revelation (×1.5), Quotable lines (×1.3)
Secondary:  Hook moments (counter-intuitive), Practical value
De-emphasize: Emotional peaks (×0.6), Conflict (×0.4)
Hook style: Counter-intuitive fact or surprising analogy
```

### Commentary / Reaction
```
Boost:      Opinion bombs (×1.8), Emotional peaks (×1.5), Hook moments (×1.3)
Secondary:  Quotable lines, Conflict
De-emphasize: Practical value (×0.5)
Hook style: Strong reaction or hot take
```

### Debate
```
Boost:      Conflict (×2.0), Opinion bombs (×1.5), Emotional peaks (×1.3)
Secondary:  Quotable lines (zingers), Revelation
De-emphasize: Practical value (×0.3)
Hook style: The strongest rebuttal or most surprising concession
Special:    Include both sides of the exchange
```

### Story / narrative
```
Boost:      Story arc (×1.8), Emotional peaks (×1.4), Hook moments (×1.3)
Secondary:  Quotable lines, Revelation
De-emphasize: Practical value (×0.5)
Hook style: Drop into the middle of the story (in medias res)
```

---

## Step 5 — Quality Checklist

Before finalizing any score, verify:

- [ ] **Hook test** — first 3 seconds / first sentence has a clear attention-grabber
- [ ] **Completeness test** — self-contained; no mid-thought cut; the idea resolves
- [ ] **Context test** — a cold viewer understands it without prior context
- [ ] **Emotion test** — at least one genuine feeling is triggered
- [ ] **Screenshot test** — at least one line is quotable on its own
- [ ] **Virality test** — composite score ≥ 60 (below 60 = probably not viral-worthy)

---

## Notes on medium-specific concerns (live in the consumer skill, not here)

These are NOT part of the general rubric — find them in the relevant consumer skill:

| Concern | Lives in |
|---|---|
| Clip duration sweet spots (45-90s), boundary trimming, overlap dedup, chunking long video | `ai-clipping` |
| Audio-energy score boosts (peaks, silence-then-peak) | `ai-clipping` (Phase 4.5) |
| Script templates, rewrite modes, hook rewriting, platform pacing | `script-evaluator` |
| Turning a scored clip into an edited, captioned, reframed video | `ai-clipping`, `dialogue-story` |

Keep this skill medium-agnostic. If a rule only makes sense for one medium, it belongs in
that medium's skill and should reference back here for the scoring rubric.
