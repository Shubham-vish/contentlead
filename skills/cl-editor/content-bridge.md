---
name: content-bridge
description: Apply/remove images and captions from StoryStudio pipeline to the editor timeline
tags: apply, remove, image, captions, bridge, content, metadata
---

# Content Bridge

Content bridge commands connect StoryStudio output to the editor timeline and content metadata.

## `content.updateMetadata`

Update content-level metadata such as title or description.

| Param | Type | Default | Description |
|---|---|---|---|
| `updates` | `object` | required | Metadata patch object, e.g. `title`, `description`, `status` |

Example:

```json
{
  "type": "content.updateMetadata",
  "params": {
    "updates": {
      "title": "Weekly Product Recap",
      "description": "Fast summary of this week's launch updates"
    }
  }
}
```

## `content.getDetails`

Read the current content record and metadata.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "content.getDetails",
  "params": {}
}
```

## `content.getTranscriptWords`

Read raw transcript words.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "content.getTranscriptWords",
  "params": {}
}
```

## `content.applyImage`

Place a StoryStudio image on the timeline.

| Param | Type | Default | Description |
|---|---|---|---|
| `imageId` | `string` | required | StoryStudio image identifier |
| `url` | `string` | required | Selected image URL |
| `from` | `number` | required | Timeline start |
| `to` | `number` | required | Timeline end |

Example:

```json
{
  "type": "content.applyImage",
  "params": {
    "imageId": "sentence_03_image_01",
    "url": "https://example.com/office-team.jpg",
    "from": 4200,
    "to": 7600
  }
}
```

## `content.removeImage`

Remove a previously applied StoryStudio image.

| Param | Type | Default | Description |
|---|---|---|---|
| `imageId` | `string` | required | StoryStudio image identifier |

Example:

```json
{
  "type": "content.removeImage",
  "params": {
    "imageId": "sentence_03_image_01"
  }
}
```

## `content.applyCaptions`

Apply subtitle segments and optional word timing.

| Param | Type | Default | Description |
|---|---|---|---|
| `subtitles` | `array<object>` | required | Subtitle segments with text and timing. Accepts both `{startTime, endTime}` in seconds and `{from, to}` in ms |
| `words` | `array<object>` | optional | Word-level timing for karaoke behavior. Accepts both `{startTime, endTime}` in seconds and `{from, to}` in ms |

Accepted timing keys:
- `subtitles[]` accepts both `{ startTime, endTime }` in seconds and `{ from, to }` in ms
- `words[]` accepts both `{ startTime, endTime }` in seconds and `{ from, to }` in ms

Example:

```json
{
  "type": "content.applyCaptions",
  "params": {
    "subtitles": [
      {
        "text": "This is the first subtitle",
        "startTime": 0,
        "endTime": 1.8
      }
    ],
    "words": [
      { "word": "This", "startTime": 0, "endTime": 0.3 },
      { "word": "is", "startTime": 0.3, "endTime": 0.5 },
      { "word": "the", "from": 500, "to": 700 },
      { "word": "first", "from": 700, "to": 1200 },
      { "word": "subtitle", "from": 1200, "to": 1800 }
    ]
  }
}
```

## `content.removeCaptions`

Remove bridge-managed captions from the timeline.

| Param | Type | Default | Description |
|---|---|---|---|
| `—` | `—` | `—` | No parameters |

Example:

```json
{
  "type": "content.removeCaptions",
  "params": {}
}
```

## Workflow

Pipeline-generated images usually flow like this:

1. `storystudio.generateStrings`
2. `storystudio.searchImages`
3. `content.applyImage`
4. `content.applyCaptions`
5. `editor.save`

## Common Patterns / Recipes

### Apply one chosen image

```json
{
  "type": "content.applyImage",
  "params": {
    "imageId": "sentence_07_image_02",
    "url": "https://example.com/warehouse.jpg",
    "from": 11000,
    "to": 14500
  }
}
```

### Rebuild captions

```json
[
  {
    "type": "content.removeCaptions",
    "params": {}
  },
  {
    "type": "content.applyCaptions",
    "params": {
      "subtitles": [
        {
          "text": "Fresh captions",
          "startTime": 0,
          "endTime": 1.4
        }
      ],
      "words": [
        { "word": "Fresh", "startTime": 0, "endTime": 0.7 },
        { "word": "captions", "from": 700, "to": 1400 }
      ]
    }
  }
]
```

### Update metadata after timeline changes

```json
[
  {
    "type": "content.updateMetadata",
    "params": {
      "updates": {
        "title": "Episode 12",
        "description": "Final cut with refreshed visuals"
      }
    }
  },
  {
    "type": "editor.save",
    "params": {}
  }
]
```

---

## Additional Content Command Details

### `content.getDetails`

Returns the current content record and metadata.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | No parameters |

**Returns:** `{ id, title, description, videoUrl, videoFileName, videoSize, thumbnail, status, editingId, hasTranscript, hasVideo, createdAt, updatedAt }`

### `content.getTranscriptWords`

Returns raw transcript words and a combined text version.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | No parameters |

**Returns:** `{ words, wordCount, text, hasWordTimestamps }`

### `content.updateMetadata`

Patch content-level metadata such as title, description, or status.

| Param | Type | Default | Description |
|---|---|---|---|
| `updates` | `object` | required | Metadata patch object |

```json
{
  "type": "content.updateMetadata",
  "params": {
    "updates": {
      "title": "Weekly Product Recap",
      "description": "Fast summary of this week's launch updates"
    }
  }
}
```

### `content.applyImage`

Apply a StoryStudio-managed image to the editor timeline.

| Param | Type | Default | Description |
|---|---|---|---|
| `imageId` | `string` | required | Bridge-managed image identifier |
| `url` | `string` | required | Chosen image URL |
| `from` | `number` | required | Timeline start |
| `to` | `number` | required | Timeline end |

**Returns:** `{ trackItemId }`

### `content.removeImage`

Remove a previously applied bridge image.

| Param | Type | Default | Description |
|---|---|---|---|
| `imageId` | `string` | required | Bridge-managed image identifier |

### `content.applyCaptions`

Create caption items from subtitle segments and optional word timings.

| Param | Type | Default | Description |
|---|---|---|---|
| `subtitles` | `array<object>` | required | Subtitle segments. Accepts both `{startTime, endTime}` in seconds and `{from, to}` in ms |
| `words` | `array<object>` | optional | Word-level timing data. Accepts both `{startTime, endTime}` in seconds and `{from, to}` in ms |

Accepted timing keys:
- `subtitles[]` accepts both `{ startTime, endTime }` in seconds and `{ from, to }` in ms
- `words[]` accepts both `{ startTime, endTime }` in seconds and `{ from, to }` in ms

**Returns:** `{ captionsAdded }`

### `content.removeCaptions`

Remove all bridge-managed captions from the editor.

| Param | Type | Default | Description |
|---|---|---|---|
| *(none)* | — | — | Removes every applied caption |
