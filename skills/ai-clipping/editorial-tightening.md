# Editorial Tightening — Post-Selection Clip Polish

After selecting a viral clip range (Phase 2) and extracting it (Phase 3), this phase tightens the clip by removing filler content, dead air, and low-value speech while preserving natural conversation flow.

**Goal:** Transform a raw clip into a punchy, engaging edit that holds attention every second.

---

## Principles

### 1. Not All Filler is Equal

| Category | Example | Action |
|----------|---------|--------|
| **Silence gaps > 0.4s** | Dead air between sentences | Cut, keep 150ms breath |
| **Verbal tics (standalone)** | "Right?" "You know?" "Like," as sentence filler | Cut if standalone (< 3 words), keep if part of a meaningful sentence |
| **Transition filler** | "And I can explain to you why" "Let me tell you" "So basically" | Cut — the explanation itself is what matters |
| **Stuttering / false starts** | "I think that— there are some— there are countries..." | Cut the stutter, keep the final clean version |
| **Verbose repetition** | "That fact has been in the existence for a long period of time" (restating what was just said) | Cut — adds no new information |
| **Pre-answer rambling** | Speaker takes 5-10s of "Well, you know, I think, like..." before the actual answer | Cut the ramp-up, start from where the real answer begins |

### 2. Speaker Cross-Talk Rules

In multi-speaker content (interviews, podcasts, panels):

| Cross-talk Type | Example | Action |
|-----------------|---------|--------|
| **Valuable reaction** | "You don't?!" (surprise), "Wait, what?!" (shock), laughter | **KEEP** — these are engagement gold |
| **Casual acknowledgment** | "Yeah", "Right", "Mm-hmm", "Sure" (2-3 words, no energy) | **CUT** if it interrupts the main speaker's flow |
| **Meaningless interjection** | "Okay so..." "I mean..." between another speaker's sentences | **CUT** — adds nothing |
| **Question that resets** | "But what about X?" (redirects conversation to less interesting topic) | **CUT** — keep the flow on the viral content |
| **Echo/agreement** | "Exactly", "That's true", "100%" (adds no new info) | **CUT** unless it's a natural pause point |

**Key rule:** If removing the cross-talk doesn't change the meaning or pacing of the main speaker's point, remove it.

### 3. Group Filler Detection (4-5 Word Minimum)

**Never cut individual words mid-sentence** — this creates jarring audio artifacts.

Only cut groups of 4+ words that form a complete removable unit:
- A full filler sentence: "I can explain to you why." (7 words)
- A throwaway phrase: "if you think about it" (5 words)
- A redundant restatement: "that's been the case for a long time" (8 words)

**Minimum cut unit:** A complete phrase/clause boundary. Never cut mid-clause.

### 4. Pre-Answer Rambling Detection

Pattern: Question asked → Speaker pauses → Starts with filler → Gets to real answer

```
QUESTION: "Is the dollar dying?"
FILLER:   "Well, you know, I think that, like, there are several ways to look at this..."  ← CUT
ANSWER:   "Countries want to move away from the dollar. That's a fact."  ← KEEP
```

**Detection heuristic:**
1. Find the question end timestamp
2. Find where the answer's CORE POINT starts (first dense/specific statement)
3. If there's > 3 seconds of low-density speech between question and core point, cut it
4. Keep a natural 0.5-1s transition gap so the cut doesn't feel abrupt

---

## Algorithm

### Step 1: Sentence Segmentation

Split the word-level transcript into sentences using punctuation (`.` `?` `!`) and speaker changes.

### Step 2: Score Each Sentence

For each sentence, evaluate:

| Factor | Score | Description |
|--------|-------|-------------|
| Contains specific fact/number | +3 | "60-70% of equity value" |
| Contains opinion/stance | +3 | "I actually don't" |
| Asks an engaging question | +2 | "Is the dollar really dying?" |
| Genuine reaction (surprise/emotion) | +3 | "You don't?!" |
| Contains only verbal tics | -5 | "Right?" (standalone) |
| Restates previous sentence | -3 | Same info, different words |
| Pure transition/filler | -4 | "Let me explain why" |
| Casual cross-talk (< 3 words, low energy) | -4 | "Yeah" "Mm-hmm" |
| Pre-answer rambling | -3 | Filler before the real point |

**Cut threshold:** Score ≤ -2 → candidate for removal.

### Step 3: Validate Cuts

Before cutting a sentence:
1. **Does removing it break the logical flow?** If sentence N+1 references something only in sentence N, keep N.
2. **Would the cut create a jarring audio transition?** (Same speaker mid-thought = jarring. Between speakers or at natural pauses = fine.)
3. **Is the cut group ≥ 4 words?** Never cut 1-3 word fragments.
4. **Does it remove a genuine reaction?** Surprise, laughter, pushback = keep even if short.

### Step 4: Build Keep Segments

Convert the keep/cut decisions into time ranges:
```python
keep_segments = []
for sentence in sentences:
    if sentence.score > CUT_THRESHOLD:
        keep_segments.append({
            "start": sentence.start_ms,
            "end": sentence.end_ms + 150,  # 150ms natural breath
        })

# Merge adjacent segments (gap < 300ms)
merged = merge_close_segments(keep_segments, gap_threshold=300)
```

### Step 5: Apply via addVideoSegments

Use the merged keep segments with `editor.addVideoSegments` (gap=0) to build the tight edit. See `transcription-and-editing` skill Phase 3.

---

## Examples

### Example: Podcast Interview

**Raw transcript (20s segment):**
```
[Speaker A] "And I can explain to you why, right?"     ← FILLER (transition)
[Speaker A] "I think that meant there are some,        ← FILLER (stutter)
             there are countries that want to move 
             away from dollar determinants."
[Speaker A] "I think that's a fact."                    ← FILLER (weak restatement)
[Speaker A] "And that fact has been in existence        ← FILLER (verbose, no new info)
             for a long period of time."
[Speaker A] "But for that to come true, you need        ← KEEP (core argument starts)
             several elements to come into play."
```

**After tightening:** Only the last sentence survives. The 4 filler sentences (14s) are cut, saving ~14s and going straight to the argument.

### Example: Reaction Cross-Talk

**Keep this:**
```
[Speaker A] "I actually don't."
[Speaker B] "You don't?!"          ← GENUINE SURPRISE — KEEP
[Speaker A] "I don't."
```

**Cut this:**
```
[Speaker A] "...the US financial system."
[Speaker B] "Right."               ← CASUAL ACKNOWLEDGMENT — CUT  
[Speaker A] "If you look at..."
```

---

## Integration with AI Clipping Pipeline

This phase runs AFTER Phase 3 (clip extraction) and BEFORE Phase 3.4 (captions):

```
Phase 1: Transcribe → Phase 2: Score virality → Phase 3: Extract clip
    → Phase 3.1: EDITORIAL TIGHTENING (this doc)
    → Phase 3.2: Reframe 9:16
    → Phase 3.3: Audio EQ
    → Phase 3.4: Captions (on tightened timeline)
    → Phase 3.5: Visual polish
Phase 4: Batch process → Phase 5: Render
```

**Critical:** Captions MUST be applied AFTER tightening, not before. Tightening changes the timeline, so any pre-applied captions will be misaligned or fragmented.
