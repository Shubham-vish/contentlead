---
name: canvas-and-positioning
description: Spatial positioning, alignment, rotation, z-index, coordinate guides for portrait/landscape
tags: position, align, center, rotate, z-index, layer, canvas, portrait, landscape, lower-third, split-screen
---

# Canvas and Positioning

> ⚠️ **CRITICAL — Use `positionItem` to move items, NOT `editItem`**
>
> The visual position on the canvas is controlled by `details.top` and `details.left`
> (CSS properties inside the item). The `display.x` / `display.y` fields in
> `trackItemsMap` are **timeline metadata only** — changing them via `editor.editItem`
> does NOT move the item on screen.
>
> **Always use `editor.positionItem`** to set or change x, y, width, height after creation.
> This is the only command that correctly updates both the internal CSS and the display state.

## Coordinate System

- `(0, 0)` is the top-left corner.
- `x` increases to the right.
- `y` increases downward.
- Positioning is based on the item's top-left corner.
- For centered layouts, compute `x = (canvas_width - item_width) / 2` and `y = (canvas_height - item_height) / 2`.

## Portrait Canvas Guide — 1080 x 1920

```text
(0,0)  +--------------------------------------+
       |              top-safe zone           |
       |               y: 80-260              |
       |                                      |
       |              center zone             |
       |             y: 760-1160              |
       |                                      |
       |            lower-third zone          |
       |            y: 1560-1740              |
       +--------------------------------------+  (1080,1920)
```

| Position | X | Y | Notes |
|---|---|---|---|
| Top-center | `540 - width/2` | `100-180` | Headlines and logos |
| Center | `540 - width/2` | `960 - height/2` | Primary title or hero object |
| Lower-third | `40-80` | `1600-1700` | Name bars and captions |
| Bottom CTA | `540 - width/2` | `1760-1840` | Subscribe or call-to-action |
| Full-screen | `0` | `0` | Use `width: 1080`, `height: 1920` |

## Landscape Canvas Guide — 1920 x 1080

```text
(0,0)  +------------------------------------------------------+
       |                   top-safe zone                      |
       |                    y: 50-160                         |
       |                                                      |
       |                    center zone                       |
       |                   y: 390-690                         |
       |                                                      |
       |                 lower-third zone                     |
       |                   y: 840-960                         |
       +------------------------------------------------------+  (1920,1080)
```

| Position | X | Y | Notes |
|---|---|---|---|
| Top-center | `960 - width/2` | `60-120` | Openers and labels |
| Center | `960 - width/2` | `540 - height/2` | Main focal area |
| Lower-third | `60-120` | `860-940` | Speaker names |
| Right inset | `1460-1580` | `60-120` | Picture-in-picture |
| Full-screen | `0` | `0` | Use `width: 1920`, `height: 1080` |

## Square Canvas Guide — 1080 x 1080

| Position | X | Y | Notes |
|---|---|---|---|
| Top-center | `540 - width/2` | `50-100` | Short headlines |
| Center | `540 - width/2` | `540 - height/2` | Core composition |
| Lower-third | `50-80` | `860-940` | Compact labels |
| Full-screen | `0` | `0` | Use `width: 1080`, `height: 1080` |

## `editor.positionItem`

Set exact coordinates and optional size.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | required | Target item |
| `x` | `number` | keep current | Left position |
| `y` | `number` | keep current | Top position |
| `width` | `number` | keep current | Item width |
| `height` | `number` | keep current | Item height |

Example:

```json
{
  "type": "editor.positionItem",
  "params": {
    "itemId": "image_hero",
    "x": 90,
    "y": 240,
    "width": 900,
    "height": 1440
  }
}
```

## `editor.alignItem`

Align an item relative to the canvas.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | required | Target item |
| `align` (alias: `alignment`) | `string` | required | `center`, `centerH`, `centerV`, `left`, `right`, `top`, or `bottom` |

Example:

```json
{
  "type": "editor.alignItem",
  "params": {
    "itemId": "text_title",
    "align": "centerH"
  }
}
```

## `editor.rotateItem`

Rotate an item by degrees.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | required | Target item |
| `angle` | `number` | `0` | Rotation in degrees |

Example:

```json
{
  "type": "editor.rotateItem",
  "params": {
    "itemId": "badge_01",
    "angle": -12
  }
}
```

## `editor.setZIndex`

Move an item forward or backward in layer order.

| Param | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | required | Target item |
| `direction` | `string` | required | `front`, `back`, `forward`, or `backward` |

Example:

```json
{
  "type": "editor.setZIndex",
  "params": {
    "itemId": "text_title",
    "direction": "front"
  }
}
```

## Common Patterns / Recipes

### Centered title

```json
[
  {
    "type": "editor.positionItem",
    "params": {
      "itemId": "text_title",
      "width": 900,
      "height": 220,
      "x": 90,
      "y": 840
    }
  },
  {
    "type": "editor.alignItem",
    "params": {
      "itemId": "text_title",
      "alignment": "centerH"
    }
  }
]
```

### Lower-third

```json
{
  "type": "editor.positionItem",
  "params": {
    "itemId": "text_lower_third",
    "x": 60,
    "y": 1630,
    "width": 620,
    "height": 90
  }
}
```

### Full-screen background + text

```json
[
  {
    "type": "editor.positionItem",
    "params": {
      "itemId": "image_bg",
      "x": 0,
      "y": 0,
      "width": 1080,
      "height": 1920
    }
  },
  {
    "type": "editor.setZIndex",
    "params": {
      "itemId": "image_bg",
      "direction": "back"
    }
  },
  {
    "type": "editor.setZIndex",
    "params": {
      "itemId": "text_title",
      "direction": "front"
    }
  }
]
```

### Split-screen

```json
[
  {
    "type": "editor.positionItem",
    "params": {
      "itemId": "video_left",
      "x": 0,
      "y": 0,
      "width": 960,
      "height": 1080
    }
  },
  {
    "type": "editor.positionItem",
    "params": {
      "itemId": "video_right",
      "x": 960,
      "y": 0,
      "width": 960,
      "height": 1080
    }
  }
]
```

### Picture-in-picture

```json
[
  {
    "type": "editor.positionItem",
    "params": {
      "itemId": "video_pip",
      "x": 740,
      "y": 80,
      "width": 280,
      "height": 280
    }
  },
  {
    "type": "editor.setZIndex",
    "params": {
      "itemId": "video_pip",
      "direction": "front"
    }
  }
]
```

---

## `editor.addTransition`

Add a transition between two adjacent clips on a track.

| Param | Type | Default | Description |
|---|---|---|---|
| `trackId` | `string` | required | Track that owns the transition |
| `fromId` | `string` | required | Outgoing item ID |
| `toId` | `string` | required | Incoming item ID |
| `kind` | `string` | required | Transition preset or kind |
| `duration` | `number` | required | Transition duration |
| `direction` | `string` | optional | Directional variant when supported |
| `name` | `string` | optional | Friendly transition label |
| `id` | `string` | auto-generated | Optional transition ID override |

**Returns:** `{ transitionId }`

```json
{
  "type": "editor.addTransition",
  "params": {
    "trackId": "track_video",
    "fromId": "clip_a",
    "toId": "clip_b",
    "kind": "fade",
    "duration": 500
  }
}
```
