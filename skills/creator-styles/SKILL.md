---
name: creator-styles
description: Browse, inspect, subset, and compose SkillTown creator style templates. Use honest style-template operations: these insert template scenes; they do not automatically adapt user footage or transcripts.
tags: styles, creator-styles, templates, kallaway, storytelling, cinematic, editing, scenes, compose-styles
---

# Creator Styles — SkillTown Style Templates

> Use creator styles as editable scene templates. Be explicit: applying a style inserts styled template scenes on the timeline; it does **not** transform raw footage into that creator's edit.

## What exists today

Source of truth: `_EditingStyleDetails/_Style/index.json` and each `_EditingStyleDetails/_Style/{styleId}/template-main.json`. Do **not** use the old local `style-catalog.json` duplicate.

Available styles: `ankitarora`, `buildercentral`, `editingburst`, `kallaway`, `keanuvisuals`, `mitmonk`, `motion-backgrounds`, `sisinty`, `tharun`, `varunmayya`.

Use this skill when the user asks for a creator/editing style:
- “Make this feel like Kallaway.”
- “Give me a cinematic hook but an educational body.”
- “Show me hook variants.”
- “Apply a punchy CTA style.”

Avoid full-template application when the timeline already has important edits. Prefer subset or composition commands so you do not bury the user’s source media under canned scenes.

## Style data and previews

- Local catalog: `_EditingStyleDetails/_Style/index.json`
- Local template: `_EditingStyleDetails/_Style/{styleId}/template-main.json`
- Local notes: `_EditingStyleDetails/_Style/{styleId}/look.md`
- Blob catalog: `https://prepwithai.blob.core.windows.net/style-catalog/index.json`
- Blob template: `https://prepwithai.blob.core.windows.net/style-catalog/{styleId}/template-main.json`
- Preview page: `/styles/{styleId}`

## Commands

### Browse styles

```json
{"type":"scene.listStyles","params":{}}
```

```json
{"type":"scene.getStyle","params":{"styleId":"kallaway"}}
```

### Get the full template without applying it

Use this before cherry-picking or composing. It returns the full template JSON for inspection, including scene order, roles, scene types, timings, and default props.

```json
{"type":"scene.getStyleTemplate","params":{"styleId":"kallaway","templateId":"template-main"}}
```

`templateId` is optional; omit it to use the style default.

```json
{"type":"scene.getStyleTemplate","params":{"styleId":"keanuvisuals"}}
```

### Apply a full style template

This inserts the full canned sequence. Use mostly for empty/new projects or previews.

```json
{"type":"scene.applyStyleTemplate","params":{"styleId":"kallaway","templateId":"template-main","from_ms":0,"scale":1,"trackHint":"Style: Kallaway full template"}}
```

### Apply only a subset of a template

Use `scene.applyStyleTemplateSubset` when the user wants structural pieces without a full canned video. Filter by `roles`, `orders`, and/or `sceneTypes`.

```json
{"type":"scene.applyStyleTemplateSubset","params":{"styleId":"kallaway","templateId":"template-main","filter":{"roles":["hook","cta"]},"from_ms":0,"scale":1,"trackHint":"Kallaway hook+cta overlays"}}
```

```json
{"type":"scene.applyStyleTemplateSubset","params":{"styleId":"tharun","filter":{"roles":["body"],"sceneTypes":["explainer","framework"]},"from_ms":4000,"scale":1.2}}
```

```json
{"type":"scene.applyStyleTemplateSubset","params":{"styleId":"sisinty","filter":{"orders":[0,1,2],"roles":["hook"]},"from_ms":0}}
```

### Compose multiple styles in one sequence

Use `scene.composeStyles` for mixed-style decisions. Each segment can point at a style and subset filter. This is better than stacking full templates.

```json
{"type":"scene.composeStyles","params":{"from_ms":0,"scale":1,"segments":[{"styleId":"keanuvisuals","templateId":"template-main","filter":{"roles":["hook"]},"label":"cinematic hook"},{"styleId":"kallaway","templateId":"template-main","filter":{"roles":["body"]},"label":"creator-education body"},{"styleId":"sisinty","templateId":"template-main","filter":{"roles":["cta","outro"]},"label":"warm CTA"}]}}
```

### Enumerate scenes by role

Use `style.getScenesByRole` to inspect matching variants before applying. This is the right command for “show me all hooks” or “pick a CTA.”

```json
{"type":"style.getScenesByRole","params":{"styleId":"kallaway","role":"hook","templateId":"template-main"}}
```

```json
{"type":"style.getScenesByRole","params":{"styleId":"ankitarora","role":"hook"}}
```

## Realistic workflows

### 1. “Edit my talking-head in Kallaway style”

Honest warning: this does **not** transform the talking-head footage. It inserts Kallaway-styled scenes as overlays/template scenes on a new style track. Keep the original talking-head video on its own track and use only Kallaway structural framing, usually `hook` and `cta`.

```json
{"type":"scene.applyStyleTemplateSubset","params":{"styleId":"kallaway","templateId":"template-main","filter":{"roles":["hook","cta"]},"from_ms":0,"scale":1,"trackHint":"Kallaway structural overlays"}}
```

After applying, replace canned text with the user’s real words:

```json
{"type":"scene.updateSceneProps","params":{"itemId":"STYLE_SCENE_ITEM_ID","sceneProps":{"title":"Your real hook goes here","subtitle":"Use the actual transcript, not template copy"}}}
```

### 2. “Give me a hook from KeanuVisuals + body from Kallaway”

Compose at scene level instead of applying two full templates on top of each other.

```json
{"type":"scene.composeStyles","params":{"from_ms":0,"segments":[{"styleId":"keanuvisuals","templateId":"template-main","filter":{"roles":["hook"]},"label":"Keanu Visuals hook"},{"styleId":"kallaway","templateId":"template-main","filter":{"roles":["body"]},"label":"Kallaway body"}],"scale":1}}
```

Then update each inserted scene’s props to match the user’s actual topic.

### 3. “Just show me all the hook variants across styles”

Loop over style IDs and call `style.getScenesByRole`. Present the returned variants; do not apply anything until the user chooses.

```json
{"type":"style.getScenesByRole","params":{"styleId":"ankitarora","role":"hook","templateId":"template-main"}}
```

```json
{"type":"style.getScenesByRole","params":{"styleId":"kallaway","role":"hook","templateId":"template-main"}}
```

```json
{"type":"style.getScenesByRole","params":{"styleId":"keanuvisuals","role":"hook","templateId":"template-main"}}
```

## Decision guide

- Fast creator-education hook: `kallaway` or `ankitarora`.
- Cinematic opener: `keanuvisuals`.
- Educational body/explainer: `tharun`, `mitmonk`, or `buildercentral` depending on tone.
- Warm story/CTA: `sisinty`.
- Punchy minimalist inserts: `editingburst`.
- Background-only ambience: `motion-backgrounds`.

For mixed requests, use `style.getScenesByRole` first, then `scene.applyStyleTemplateSubset` or `scene.composeStyles`. Do not stack full templates unless the user explicitly wants a chaotic remix.

## Known limitations

- Default props are canned marketing/demo content. The agent must override them with `scene.updateSceneProps` after apply.
- There is no automatic adaptation to the user’s actual footage, transcript, brand, or pacing yet.
- Style diff/evaluation is not implemented. The agent has no reliable way to verify “this now feels like Kallaway” beyond inspecting what template scenes were inserted.
- A style template is not a trained editor. It is a reusable scene sequence with defaults.
- Full template application can visually bury existing footage. Use subset/compose for existing timelines.

## Safe operating rules

1. Inspect first: `scene.getStyleTemplate` or `style.getScenesByRole`.
2. Prefer subset/compose for real user timelines.
3. Keep source video on a separate track.
4. Replace canned props immediately with `scene.updateSceneProps`.
5. Run diagnostics after applying scenes.
