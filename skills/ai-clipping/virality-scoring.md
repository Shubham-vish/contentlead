---
name: virality-scoring
description: Detailed virality scoring criteria, content-type adaptation, and clip selection rules for the AI clipping pipeline.
tags: virality, scoring, hooks, emotional, clips, evaluation
---

# Virality Scoring — Deep Reference

> This document expands on the scoring framework in the main `ai-clipping` SKILL.md.
> Load this when you need detailed scoring guidance for specific content types.

## The 8 Virality Signals — Detailed

### 1. HOOK MOMENTS (Weight: 25%)

The opening 3 seconds determine if someone keeps watching. Look for:

- **Forbidden knowledge**: "Nobody talks about...", "The industry doesn't want you to know..."
- **Contrarian takes**: "Everyone is wrong about...", "The opposite is actually true..."
- **Cliffhangers**: "What happened next changed everything...", "And that's when I realized..."
- **Bold claims**: "This one thing will...", "The fastest way to..."
- **Personal vulnerability**: "I lost everything...", "My biggest mistake was..."
- **Pattern interrupts**: "Wait, forget everything I just said...", sudden topic shifts

**Scoring**: A clip without a strong hook in the first 3 seconds loses 30-40 points automatically.

### 2. EMOTIONAL PEAKS (Weight: 20%)

Raw, unscripted emotional moments are inherently shareable:

- Genuine laughter (not polite chuckles)
- Visible surprise or shock
- Passionate anger or frustration
- Vulnerable admissions
- Excitement about a discovery
- Empathetic moments

**Detection via transcript**: Look for exclamation patterns, interrupted speech, repeated words ("no no no", "wait wait"), sudden topic shifts, expletives.

**Detection via audio** (v2): Energy spikes, volume jumps >6dB above baseline, laughter patterns.

### 3. OPINION BOMBS (Weight: 15%)

Statements that make people want to comment "agree" or "disagree":

- "X is overrated/underrated"
- "The real problem with Y is..."
- "If you're doing Z, you're wasting your time"
- Rankings or hot takes
- Calling out popular beliefs as wrong

### 4. REVELATION MOMENTS (Weight: 12%)

Information that changes how the viewer thinks:

- Surprising statistics ("Only 2% of people know...")
- Behind-the-scenes secrets
- Personal confessions
- Myth-busting facts
- "I didn't know this until..."

### 5. CONFLICT/TENSION (Weight: 8%)

Disagreement creates engagement:

- Direct pushback ("I completely disagree...")
- Challenging the other person's premise
- Debate moments with clear opposing sides
- Problems being confronted head-on

### 6. QUOTABLE ONE-LINERS (Weight: 7%)

Sentences that work as standalone quote cards:

- Concise wisdom ("The best time to start was yesterday")
- Memorable analogies ("It's like trying to...")
- Witty observations
- Reframings ("Don't think of it as X, think of it as Y")

### 7. STORY PEAKS (Weight: 7%)

The climax or twist of an anecdote:

- "And then..." moments
- Unexpected turns in personal stories
- The punchline of an extended setup
- Resolution of tension built over previous sentences

### 8. PRACTICAL VALUE (Weight: 6%)

Concrete takeaways viewers can immediately use:

- Step-by-step tips
- Specific tools/resources mentioned
- "Here's exactly what to do..."
- Templates, frameworks, or formulas

---

## Content-Type Scoring Profiles

### Podcast (casual conversation)

```
Primary signals:  Opinion bombs (×1.5), Story peaks (×1.3), Quotable lines (×1.2)
Secondary:        Emotional peaks, Hook moments
De-emphasize:     Practical value (×0.7) — unless it's a specific actionable tip
Clip duration:    60-90s preferred (stories need room to breathe)
Hook style:       "So here's the thing..." / controversial statement openings
```

### Interview (structured Q&A)

```
Primary signals:  Revelation moments (×1.5), Emotional peaks (×1.3), Conflict (×1.3)
Secondary:        Hook moments, Opinion bombs
De-emphasize:     Practical value (×0.8) — unless the guest gives specific advice
Clip duration:    45-75s (complete question→answer arcs)
Hook style:       Strong guest statement, not the interviewer's question
Special rule:     Never start a clip with the host's question — start with the guest's answer
```

### Tutorial (instructional)

```
Primary signals:  Practical value (×2.0), Revelation moments (×1.3)
Secondary:        Hook moments ("Most people do this wrong...")
De-emphasize:     Emotional peaks (×0.5), Conflict (×0.3)
Clip duration:    30-60s (concise, actionable)
Hook style:       "Stop doing X, do Y instead" / "The trick nobody shows you"
Special rule:     Clip must be self-contained — viewer shouldn't need prior context
```

### Lecture (educational)

```
Primary signals:  Revelation moments (×1.5), Quotable lines (×1.3)
Secondary:        Hook moments (counter-intuitive openings), Practical value
De-emphasize:     Emotional peaks (×0.6), Conflict (×0.4)
Clip duration:    45-90s
Hook style:       Counter-intuitive fact or surprising analogy
```

### Commentary/Reaction

```
Primary signals:  Opinion bombs (×1.8), Emotional peaks (×1.5), Hook moments (×1.3)
Secondary:        Quotable lines, Conflict
De-emphasize:     Practical value (×0.5)
Clip duration:    30-60s (punchy, opinionated)
Hook style:       Strong reaction or hot take
```

### Debate

```
Primary signals:  Conflict (×2.0), Opinion bombs (×1.5), Emotional peaks (×1.3)
Secondary:        Quotable lines (zingers), Revelation moments
De-emphasize:     Practical value (×0.3)
Clip duration:    45-75s (full exchange, not one-sided)
Hook style:       The strongest rebuttal or most surprising concession
Special rule:     Include both sides of the exchange — don't clip just one person
```

---

## Overlap Deduplication Algorithm

When scoring produces multiple candidates, deduplicate:

```
1. Sort all highlights by score (highest first)
2. Initialize kept = []
3. For each highlight h:
   a. Calculate h_duration = h.end_time - h.start_time
   b. For each k in kept:
      - overlap = min(h.end, k.end) - max(h.start, k.start)
      - if overlap > 0 AND overlap > 0.5 × h_duration:
          → SKIP h (it's a duplicate of a higher-scored clip)
          → break
   c. If not skipped: append h to kept
4. Return kept
```

---

## Audio Energy Signals (✅ Implemented)

Use `POST /api/media/analyze` with `detectEnergy: true` to get these signals:

| Audio Pattern | Virality Signal | Score Boost |
|---|---|---|
| Volume spike >6dB above baseline | Emotional peak / emphasis | +10 |
| Laughter pattern (short energy bursts) | Genuine reaction | +15 |
| Silence >2s followed by speech | Dramatic pause → revelation | +8 |
| Rapid speech (>180 wpm) | Excitement / passion | +5 |
| Overlapping speech | Active engagement / debate | +5 |
| Volume drop to near-silence | Vulnerable moment | +7 |

### How to extract (implemented via /api/media/analyze)

```bash
# Pass detectEnergy: true to get silence segments + energy profile + peak moments
curl -s -X POST "http://127.0.0.1:$PORT/api/media/analyze" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"path": "/path/to/video.mp4", "detectEnergy": true}'

# Response includes:
# - silenceSegments[]: {startSec, endSec, durationSec}
# - energy.profile[]: {windowIndex, startSec, endSec, rmsDb} per 5s window
# - energy.peakMoments[]: windows with RMS >6dB above mean
# - energy.meanRmsDb: baseline energy level
```

---

## Quality Checklist

Before finalizing clip selection, verify each clip passes:

- [ ] **Hook test**: First 3 seconds have a clear attention-grabber
- [ ] **Completeness test**: No mid-sentence cuts; clip is self-contained
- [ ] **Context test**: Viewer doesn't need prior context to understand
- [ ] **Length test**: Within 20-180s (sweet spot 45-90s)
- [ ] **Overlap test**: <50% overlap with any other selected clip
- [ ] **Virality test**: Score ≥60 (below 60 = probably not viral-worthy)
- [ ] **Audio test**: Speaker is audible, no dead silence >3s at clip boundaries
