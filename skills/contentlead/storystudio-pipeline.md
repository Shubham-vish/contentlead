---
name: storystudio-pipeline
description: The 5-step AI content pipeline — transcript to groupings to decisions to stock images to timeline
tags: storystudio, pipeline, ai, transcript, groupings, decisions, images, assets, workflow, automation
---

# StoryStudio Pipeline

Run StoryStudio in order. Each step depends on the previous one.

```text
Transcript → Groupings → Decisions → Strings → Images → Apply
```

## Mode and Track Rules

- `mode` is `standard` by default.
- Use `mode: "editor"` when you want editor-focused behavior.
- Use `track_id` when the project has multiple relevant tracks.
- Always start with `storystudio.getPipelineState`.

## Step 0 — `storystudio.getPipelineState`

ALWAYS check pipeline state first.

| Param | Type | Default | Description |
|---|---|---|---|
| `mode` | `string` | `"standard"` | `standard` or `editor` |
| `track_id` | `string` | current/default track | Optional track scope |

Example:

```json
{
  "type": "storystudio.getPipelineState",
  "params": {
    "mode": "standard",
    "track_id": "track_voiceover"
  }
}
```

## Step 1 — `storystudio.generateGroupings`

Create transcript groupings that define visual chunks.

| Param | Type | Default | Description |
|---|---|---|---|
| `mode` | `string` | `"standard"` | `standard` or `editor` |
| `track_id` | `string` | current/default track | Optional track scope |

Example:

```json
{
  "type": "storystudio.generateGroupings",
  "params": {
    "mode": "standard",
    "track_id": "track_voiceover"
  }
}
```

## Step 2 — `storystudio.generateDecisions`

Turn groupings into editorial decisions.

| Param | Type | Default | Description |
|---|---|---|---|
| `mode` | `string` | `"standard"` | `standard` or `editor` |
| `track_id` | `string` | current/default track | Optional track scope |

Example:

```json
{
  "type": "storystudio.generateDecisions",
  "params": {
    "mode": "standard",
    "track_id": "track_voiceover"
  }
}
```

## Step 3 — `storystudio.generateStrings`

Create image search strings from decisions.

| Param | Type | Default | Description |
|---|---|---|---|
| `mode` | `string` | `"standard"` | `standard` or `editor` |
| `track_id` | `string` | current/default track | Optional track scope |

Example:

```json
{
  "type": "storystudio.generateStrings",
  "params": {
    "mode": "standard",
    "track_id": "track_voiceover"
  }
}
```

## Step 4 — `storystudio.searchImages`

Find images for the generated strings.

| Param | Type | Default | Description |
|---|---|---|---|
| `mode` | `string` | `"standard"` | `standard` or `editor` |
| `track_id` | `string` | current/default track | Optional track scope |

Example:

```json
{
  "type": "storystudio.searchImages",
  "params": {
    "mode": "standard",
    "track_id": "track_voiceover"
  }
}
```

## Step 5 — `storystudio.applyAssets`

Apply the chosen assets to the timeline.

| Param | Type | Default | Description |
|---|---|---|---|
| `mode` | `string` | `"standard"` | `standard` or `editor` |
| `track_id` | `string` | current/default track | Optional track scope |

Example:

```json
{
  "type": "storystudio.applyAssets",
  "params": {
    "mode": "standard",
    "track_id": "track_voiceover"
  }
}
```

## Read Tools

### `storystudio.getGroupings`

Inspect current groupings after step 1.

| Param | Type | Default | Description |
|---|---|---|---|
| `mode` | `string` | `"standard"` | `standard` or `editor` |
| `track_id` | `string` | current/default track | Optional track scope |

Example:

```json
{
  "type": "storystudio.getGroupings",
  "params": {
    "mode": "standard",
    "track_id": "track_voiceover"
  }
}
```

### `storystudio.getDecisions`

Inspect generated decisions.

| Param | Type | Default | Description |
|---|---|---|---|
| `sentence_index` | `number` | all or implementation default | Optional sentence focus |
| `mode` | `string` | `"standard"` | `standard` or `editor` |
| `track_id` | `string` | current/default track | Optional track scope |

Example:

```json
{
  "type": "storystudio.getDecisions",
  "params": {
    "sentence_index": 0,
    "mode": "standard",
    "track_id": "track_voiceover"
  }
}
```

## Full Workflow Example

```json
[
  {
    "type": "storystudio.getPipelineState",
    "params": {
      "mode": "standard",
      "track_id": "track_voiceover"
    }
  },
  {
    "type": "storystudio.generateGroupings",
    "params": {
      "mode": "standard",
      "track_id": "track_voiceover"
    }
  },
  {
    "type": "storystudio.generateDecisions",
    "params": {
      "mode": "standard",
      "track_id": "track_voiceover"
    }
  },
  {
    "type": "storystudio.generateStrings",
    "params": {
      "mode": "standard",
      "track_id": "track_voiceover"
    }
  },
  {
    "type": "storystudio.searchImages",
    "params": {
      "mode": "standard",
      "track_id": "track_voiceover"
    }
  },
  {
    "type": "storystudio.applyAssets",
    "params": {
      "mode": "standard",
      "track_id": "track_voiceover"
    }
  }
]
```

## Common Patterns / Recipes

### Resume an in-progress pipeline

```json
[
  {
    "type": "storystudio.getPipelineState",
    "params": {
      "mode": "standard",
      "track_id": "track_voiceover"
    }
  },
  {
    "type": "storystudio.getGroupings",
    "params": {
      "mode": "standard",
      "track_id": "track_voiceover"
    }
  },
  {
    "type": "storystudio.getDecisions",
    "params": {
      "mode": "standard",
      "track_id": "track_voiceover"
    }
  }
]
```

### Editor-focused pass

```json
{
  "type": "storystudio.generateGroupings",
  "params": {
    "mode": "editor",
    "track_id": "track_voiceover"
  }
}
```

### Important ordering rule

Never run steps out of order. If groupings are stale, regenerate groupings first, then regenerate everything that depends on them.

---

## Additional StoryStudio Command Details

### `storystudio.getPipelineState`

Returns a quick summary of transcript, grouping, decision, prompt, image, and SFX progress.

| Param | Type | Default | Description |
|---|---|---|---|
| `mode` | `string` | `"standard"` | Pipeline mode |
| `trackId` | `string` | current/default track | Optional track scope |

### `storystudio.getGroupings`

Return grouped transcript sentences with timing, word counts, and decision summaries.

| Param | Type | Default | Description |
|---|---|---|---|
| `mode` | `string` | `"standard"` | Pipeline mode |
| `trackId` | `string` | current/default track | Optional track scope |

### `storystudio.getDecisions`

Return the full decision payload for one sentence.

| Param | Type | Default | Description |
|---|---|---|---|
| `sentenceId` | `string` | required | Sentence/group identifier |
| `mode` | `string` | `"standard"` | Pipeline mode |
| `trackId` | `string` | current/default track | Optional track scope |

```json
{
  "type": "storystudio.getDecisions",
  "params": {
    "sentenceId": "sent_1",
    "mode": "standard"
  }
}
```

### `storystudio.generateGroupings`

Generate sentence groupings from transcript words.

| Param | Type | Default | Description |
|---|---|---|---|
| `mode` | `string` | `"standard"` | Pipeline mode |
| `trackId` | `string` | current/default track | Optional track scope |
| `config.min_duration` | `number` | `2` | Minimum grouping duration |
| `config.max_duration` | `number` | `8` | Maximum grouping duration |
| `config.target_duration` | `number` | `5` | Preferred grouping duration |
| `config.window_size` | `number` | `3` | Transcript window size |
| `config.user_prompt` | `string` | empty | Optional grouping guidance |

### `storystudio.generateDecisions`

Generate visual decisions for one or more grouped sentences.

| Param | Type | Default | Description |
|---|---|---|---|
| `sentenceIds` | `string[]` | all sentences | Optional sentence filter |
| `mode` | `string` | `"standard"` | Pipeline mode |
| `trackId` | `string` | current/default track | Optional track scope |
| `config.decision_types` | `string[]` | `['image']` | Allowed decision types |
| `config.min_duration` | `number` | `1` | Minimum decision duration |
| `config.max_duration` | `number` | `8` | Maximum decision duration |
| `config.coverage_percentage` | `number` | `80` | Target coverage percentage |
| `config.user_prompt` | `string` | empty | Optional decision guidance |
| `config.max_parallel_sentences` | `number` | `5` | Parallel processing limit |

### `storystudio.generateStrings`

Generate prompt strings or search queries from decisions.

| Param | Type | Default | Description |
|---|---|---|---|
| `outputType` | `string` | required | `search_query`, `image_prompt`, `video_prompt`, `edit_instruction`, or `sfx_query` |
| `sentenceIds` | `string[]` | all sentences | Optional sentence filter |
| `mode` | `string` | `"standard"` | Pipeline mode |
| `trackId` | `string` | current/default track | Optional track scope |
| `config.user_prompt` | `string` | empty | Optional generation guidance |

```json
{
  "type": "storystudio.generateStrings",
  "params": {
    "outputType": "search_query",
    "sentenceIds": ["sent_1"]
  }
}
```

### `storystudio.searchImages`

Search stock images for one or more sentences.

| Param | Type | Default | Description |
|---|---|---|---|
| `sentenceIds` | `string[]` | all sentences | Optional sentence filter |
| `mode` | `string` | `"standard"` | Pipeline mode |
| `trackId` | `string` | current/default track | Optional track scope |
| `maxResults` | `number` | `5` | Maximum images per decision |
| `tavilyApiKey` | `string` | current env/config | Optional Tavily override |

### `storystudio.applyAssets`

Apply searched or generated assets to the timeline.

| Param | Type | Default | Description |
|---|---|---|---|
| `mode` | `string` | `"search_images"` | Apply mode: `search_images`, `ai_images`, `sfx`, or `images_and_sfx` |
| `studioMode` | `string` | `"standard"` | StoryStudio data source mode |
| `trackId` | `string` | current/default track | Optional track scope |
| `sentenceIds` | `string[]` | all sentences | Optional sentence filter |

**Returns:** `{ applied, sentencesProcessed }`

```json
{
  "type": "storystudio.applyAssets",
  "params": {
    "mode": "images_and_sfx",
    "studioMode": "standard",
    "sentenceIds": ["sent_1", "sent_2"]
  }
}
```
