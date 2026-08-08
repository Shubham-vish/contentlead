---
name: cl-content-style
description: Define, manage, and apply personal content styles. AI analyzes sample scripts/content to extract voice patterns, then remixes any inspiration content into the user's unique style. All data stored in Cosmos DB via API routes.
tags: style, voice, remix, content-strategy, inspiration, scripts, hooks, tone
---

# Content Style — Define Your Voice, Remix Any Content

> "Watch a viral reel → adapt it to YOUR voice → publish in YOUR style."

## Overview

This skill lets the AI agent manage a user's **content styles** — their unique voice, hook patterns, script structure, and tone. It bridges **Content Inspiration** (discover great content) with **Content Creation** (make your own version).

**No UI needed.** The AI orchestrates everything:
1. User provides sample scripts/content → AI extracts their style
2. User finds inspiration content → AI remixes it into their style
3. All style definitions stored in Cosmos DB, retrievable anytime

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Cosmos DB: "ContentStyles" container               │
│  Partition key: /userId                             │
│                                                     │
│  Document types:                                    │
│  - StyleProfile   (the extracted style definition)  │
│  - SampleScript   (reference scripts per style)     │
│  - RemixedContent (outputs from remix operations)   │
└─────────────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
    ┌────┴────┐         ┌────┴────┐
    │ API     │         │ Bridge  │
    │ Routes  │         │ Routes  │
    │ (Next)  │         │ (Elect) │
    └─────────┘         └─────────┘
```

---

## Data Model

### StyleProfile

```typescript
interface StyleProfile {
  id: string;                    // UUID
  userId: string;                // partition key
  type: "style-profile";
  name: string;                  // "My Hinglish Tech Style"
  description?: string;
  createdAt: string;
  updatedAt: string;

  // Core style attributes (AI-extracted from samples)
  voice: {
    tone: string[];              // ["casual", "authoritative", "witty"]
    language: string;            // "hinglish" | "english" | "hindi"
    vocabulary: string;          // "technical but accessible"
    perspective: string;         // "first-person educator"
    signature_phrases: string[]; // ["let me show you", "this is insane"]
  };

  hooks: {
    patterns: string[];          // ["question-hook", "bold-claim", "story-open"]
    examples: string[];          // actual hook lines from samples
    avg_length_words: number;    // typical hook length
  };

  structure: {
    format: string;              // "hook → problem → solution → CTA"
    avg_duration_sec: number;    // typical content duration
    pacing: string;              // "fast" | "medium" | "slow"
    segments: string[];          // ["hook", "context", "demo", "results", "cta"]
  };

  cta: {
    style: string;               // "soft" | "direct" | "embedded"
    examples: string[];          // actual CTA lines
  };

  // Metadata
  sampleCount: number;
  lastAnalyzedAt: string;
  tags: string[];
}
```

### SampleScript

```typescript
interface SampleScript {
  id: string;
  userId: string;
  type: "sample-script";
  styleProfileId: string;        // links to StyleProfile
  createdAt: string;

  // The actual content
  title: string;
  transcript: string;            // full script text
  source: "manual" | "cl-content-inspiration" | "content-editor";
  sourceUrl?: string;            // if from inspiration
  sourceContentId?: string;      // if from editor

  // AI analysis of this sample
  analysis?: {
    hookType: string;
    structure: string[];
    toneMarkers: string[];
    duration_sec?: number;
    virality_score?: number;
  };
}
```

### RemixedContent

```typescript
interface RemixedContent {
  id: string;
  userId: string;
  type: "remixed-content";
  styleProfileId: string;
  createdAt: string;

  // Source inspiration
  inspiration: {
    source: "instagram" | "youtube" | "x" | "reddit" | "manual";
    creatorHandle?: string;
    url?: string;
    originalTranscript: string;
    originalHook?: string;
  };

  // Generated output
  output: {
    script: string;              // the remixed script
    hook: string;                // the adapted hook
    structure: string[];         // segment breakdown
    estimated_duration_sec: number;
    notes: string;               // AI reasoning about adaptations
  };
}
```

---

## API Routes

### Base: `/api/cl-content-style`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cl-content-style/profiles` | List all style profiles |
| POST | `/api/cl-content-style/profiles` | Create a new style profile |
| GET | `/api/cl-content-style/profiles/[id]` | Get a specific profile |
| PUT | `/api/cl-content-style/profiles/[id]` | Update a profile |
| DELETE | `/api/cl-content-style/profiles/[id]` | Delete a profile |
| POST | `/api/cl-content-style/profiles/[id]/analyze` | Re-analyze samples → update style |
| GET | `/api/cl-content-style/profiles/[id]/samples` | List samples for a style |
| POST | `/api/cl-content-style/profiles/[id]/samples` | Add a sample script |
| DELETE | `/api/cl-content-style/profiles/[id]/samples/[sampleId]` | Remove a sample |
| POST | `/api/cl-content-style/remix` | Remix inspiration → user's style |
| GET | `/api/cl-content-style/remixes` | List past remixes |
| GET | `/api/cl-content-style/remixes/[id]` | Get a specific remix |

---

## Bridge Commands (Desktop)

These commands are available via the SkillTown Desktop bridge for AI agents:

| Command | Description |
|---------|-------------|
| `style.listProfiles` | List all user's content style profiles |
| `style.getProfile` | Get a specific profile with full details |
| `style.createProfile` | Create a new style profile (name, optional description/tags) |
| `style.deleteProfile` | Delete a style profile |
| `style.addSample` | Add a sample script to a profile |
| `style.removeSample` | Remove a sample from a profile |
| `style.listSamples` | List all samples for a profile |
| `style.analyze` | Re-run AI analysis on all samples → extract/update style |
| `style.remix` | Remix an inspiration transcript into the user's style |
| `style.listRemixes` | List past remixes |
| `style.getRemix` | Get a specific remix |

---

## Workflow: Creating a Style from Scratch

The AI performs these steps when a user says "create my content style":

### Step 1: Create Profile

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/cl-content-style/profiles" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "My Hinglish AI Style", "tags": ["tech", "education", "hinglish"]}'
# → {id: "abc-123", name: "My Hinglish AI Style", ...}
```

### Step 2: Add Sample Scripts

User provides 3-5 sample scripts (their best-performing content):

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/cl-content-style/profiles/abc-123/samples" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "title": "Comment Automation Reel",
    "transcript": "Ye dekho... ek button click karo aur sab automate ho jayega. No coding needed. Let me show you step by step...",
    "source": "manual"
  }'
```

Or pull from Content Inspiration (already-transcribed content):

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/cl-content-style/profiles/abc-123/samples" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "title": "Best performing reel from last week",
    "source": "cl-content-inspiration",
    "sourceUrl": "https://www.instagram.com/reel/ABC123/",
    "transcript": "..."
  }'
```

### Step 3: Analyze (AI Extracts Style)

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/cl-content-style/profiles/abc-123/analyze" \
  -H "Authorization: $TOKEN"
```

**This is where the AI agent does the heavy lifting.** It reads all samples and extracts:
- **Voice patterns**: tone, language mix, perspective, signature phrases
- **Hook patterns**: what types of hooks they use, average length
- **Structure patterns**: typical format, pacing, segments
- **CTA patterns**: how they close content

The AI writes these back to the profile.

### Step 4: Review & Refine

The AI presents the extracted style to the user. User can tweak:
- "Actually I want to be more casual"
- "Add this signature phrase: 'samjhe?'"
- "My hooks should always be under 5 words"

---

## Workflow: Remixing Inspiration Content

When user finds content they like in Content Inspiration:

### Step 1: Get the inspiration transcript

```bash
# From Content Inspiration — already transcribed
curl -s "http://127.0.0.1:$PORT/api/bridge/inspiration/transcript?contentId=xyz" \
  -H "Authorization: $TOKEN"
```

### Step 2: Remix it

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/cl-content-style/remix" \
  -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "styleProfileId": "abc-123",
    "inspiration": {
      "source": "instagram",
      "creatorHandle": "garyvee",
      "originalTranscript": "Stop overthinking and just post. The algorithm rewards...",
      "url": "https://www.instagram.com/reel/XYZ/"
    }
  }'
```

### Step 3: AI Generates Remixed Script

The AI agent:
1. Reads the user's style profile (voice, hooks, structure, CTA)
2. Extracts the **core idea/message** from the inspiration (not the words)
3. Rewrites in the user's voice, applying:
   - Their hook style (question? bold claim? story?)
   - Their language (hinglish, english, etc.)
   - Their structure (hook → demo → results → CTA)
   - Their pacing and duration target
   - Their CTA style

**Output:**

```json
{
  "id": "remix-456",
  "script": "Bhai ek second ruko. Aaj main tumhe dikhata hoon...",
  "hook": "Bhai ek second ruko.",
  "structure": ["hook", "problem-statement", "demo-walkthrough", "results", "cta"],
  "estimated_duration_sec": 55,
  "notes": "Adapted Gary's 'stop overthinking' message into a demo-first approach. Used your signature 'dikhata hoon' opener. Shortened from 90s to ~55s matching your fast-paced style."
}
```

### Step 4: Score the remix (use the shared brain — do NOT re-invent scoring)

Before saving/returning a remix, score it. **Do not write ad-hoc virality heuristics here** —
load the **`cl-virality-scoring`** skill (the single source of truth for the 8-signal 0–100 rubric)
and apply it to the remixed script. This keeps cl-content-style, `cl-ai-clipping`, and
`cl-script-evaluator` all scoring against the same framework.

- If the remix scores **< 70**, iterate the hook/structure once and re-score before returning.
- For a full line-by-line rewrite pass (not just a score), hand the draft to **`cl-script-evaluator`**
  Mode 2 — cl-content-style owns *voice fidelity*, cl-script-evaluator owns *craft polish*.

Persist the score on the `RemixedContent` doc (`virality_score`, `virality_reason`) so past
remixes are comparable.

---

## AI Agent: Style Analysis Algorithm

When `style.analyze` is called, the AI reads all samples and extracts patterns:

```
FOR each sample_script in profile.samples:
  1. Identify hook (first 1-2 sentences)
  2. Classify hook type (question/bold-claim/story/contrarian/etc.)
  3. Identify structure segments
  4. Extract tone markers (casual phrases, technical terms, humor)
  5. Note language distribution (% english vs hindi vs mixed)
  6. Identify signature phrases (repeated across samples)
  7. Measure pacing (words per minute approximation)
  8. Identify CTA pattern

AGGREGATE across all samples:
  - Most common hook type(s)
  - Structural pattern (what segment order appears most)
  - Consistent tone markers
  - Language preference
  - Signature phrases (appear in 2+ samples)
  - Average duration
  - CTA style

WRITE to profile.voice, profile.hooks, profile.structure, profile.cta
```

**Important:** The AI agent IS the intelligence here. No external LLM API call is needed. The agent reads the samples, reasons about patterns, and writes the extracted style directly.

---

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| `cl-virality-scoring` | **The scoring authority.** cl-content-style does NOT define its own rubric — it calls this skill to score every remix (Step 4). Single source of truth. |
| `cl-script-evaluator` | Craft polish + line-by-line rewrite of a remix draft (Mode 2). cl-content-style owns voice fidelity; cl-script-evaluator owns craft. |
| `cl-content-inspiration` | Source of inspiration content to remix |
| `cl-ai-clipping` | After filming the remixed script, clip it (shares the same `cl-virality-scoring` brain) |
| `cl-editor` | Create a video project from the remixed script |
| `cl-content-direction` | Plan the visual treatment for the remix |

---

## Example: Full E2E Flow

```
User: "I like this reel from @levelsio about building in public. Make a version in my style."

Agent:
1. style.getProfile → loads user's "Hinglish AI Style"
2. Fetches transcript of @levelsio's reel from Content Inspiration
3. Extracts core message: "share your building journey publicly for accountability and audience"
4. Reads user's style: hinglish, fast-paced, demo-first, signature "dikhata hoon"
5. Generates remix:
   "Ek minute. Main tumhe dikhata hoon kaise main apna building journey share karta hoon 
    aur kaise isse mere audience 3x grow hui. Step 1: Har din ek screenshot..."
6. Saves to RemixedContent in Cosmos
7. Scores it with the `cl-virality-scoring` rubric (e.g. 72/100); if < 70, iterates the hook once and re-scores
8. Optionally: hands the draft to cl-script-evaluator for a craft-polish rewrite pass
9. Optionally: creates ContentLead project with the script pre-loaded
```

---

## Commands Quick Reference

```bash
# Profile management
style.listProfiles
style.createProfile {name, description?, tags?}
style.getProfile {profileId}
style.deleteProfile {profileId}

# Sample management
style.addSample {profileId, title, transcript, source, sourceUrl?}
style.removeSample {profileId, sampleId}
style.listSamples {profileId}

# Analysis
style.analyze {profileId}  → AI extracts style from samples

# Remix
style.remix {styleProfileId, inspiration: {source, creatorHandle?, url?, originalTranscript}}
style.listRemixes {styleProfileId?, limit?}
style.getRemix {remixId}
```

---

## Notes

- **No UI required** — the AI agent handles all interaction
- **Data persists** in Cosmos DB — styles survive sessions
- **Composable** — remix output feeds into cl-script-evaluator, contentlead, etc.
- **Iterative** — add more samples over time to refine the style
- **Multiple profiles** — user can have different styles for different content types (e.g., "Tech Tutorial Style" vs "Motivational Style")
