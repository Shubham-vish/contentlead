# Text and Captions

Use these commands to manually add text overlays, titles, lower thirds, and manual karaoke-style captions to the timeline.

> **Disambiguation:** 
> - If you want **automatic, transcription-driven subtitles**, use `content.applyCaptions` (see `transcription-and-editing` skill).
> - If you want to fix a typo in an existing auto-caption, use `editor.editCaptionWord` (see `transcription-and-editing`).
> - Use the commands below for **manual** text elements.

## ⚠️ CRITICAL: Track Z-Order (Layer Visibility)

**Track 0 = TOP/front-most layer.** Caption and text tracks must be above all video/image/background tracks.
After adding ANY caption/text item, immediately call `editor.reorderTracks` (unless you passed `autoReorder: true` or relied on the default). If text ends up below scene tracks, it will be invisible.

## Commands

### `editor.addText`
Add a manual text overlay (titles, lower thirds, callouts).

```json
{ "type": "editor.addText", "params": {
  "text": "Breaking News",
  "from": 2000,
  "durationMs": 4000,
  "details": {
    "fontSize": 72,
    "color": "#FFFFFF",
    "fontFamily": "Inter",
    "fontWeight": 700,
    "textAlign": "center"
  },
  "autoReorder": true 
}}
```

**Positioning Note:** Newly added text centers automatically. To move it, use `editor.positionItem` (see `canvas-and-positioning`) or update `details.top` / `details.left` via `editor.editItem`.
**Height Note:** Text rendered height is ~ `fontSize * 1.5`. Leave enough gap when stacking.

### `editor.addCaption`
Add a manual karaoke-style caption track using word-level timing arrays.

```json
{ "type": "editor.addCaption", "params": {
  "from": 0,
  "durationMs": 5000,
  "details": {
    "words": [
      {"word": "Hello", "start": 0, "end": 500},
      {"word": "world", "start": 500, "end": 1000}
    ]
  },
  "autoReorder": true
}}
```
*Note: `words` timings are in milliseconds, relative to the clip start (0).*

### `editor.editItem` (for styling Text)
Update the style of an existing text item.

```json
{ "type": "editor.editItem", "params": {
  "itemId": "text_abc",
  "details": {
    "color": "#FF0000",
    "borderWidth": 2,
    "borderColor": "#000000",
    "borderRadius": 8,
    "backgroundColor": "rgba(0,0,0,0.5)"
  }
}}
```

### `bulk.styleByType`
Apply styling to all text or caption items at once.

```json
{ "type": "bulk.styleByType", "params": {
  "type": "text",
  "details": { "fontFamily": "Montserrat", "color": "#EAEAEA" }
}}
```

### `editor.editCaptionWord`
Edit a specific word in a caption item (fix typos, change individual words).
```json
{ "type": "editor.editCaptionWord", "params": {
  "itemId": "caption_abc",
  "wordIndex": 2,
  "newText": "corrected"
}}
```

### `editor.bulkReplaceText`
Find and replace text across all text/caption items on the timeline.
```json
{ "type": "editor.bulkReplaceText", "params": {
  "find": "old text",
  "replace": "new text",
  "caseSensitive": false
}}
```
**Returns:** `{ replacedCount, items }` — number of items modified.

## Caption inline-edit keyboard shortcuts

When a caption is in inline edit mode (double-click a selected caption), each word is a
separate editable token (green outline = focused word). Shortcuts:

| Key | Action |
|-----|--------|
| **Enter** | **Commit / finish editing** (saves text + timing, exits edit mode). IME-safe: while composing Devanagari/other scripts, Enter confirms the IME candidate instead. |
| **⌘/Ctrl+Enter** | Also commits (same as Enter). |
| **Esc** | Cancel — discard edits, exit edit mode. |
| **Tab** / **Shift+Tab** | Move to next / previous word. From the last word, Tab jumps to the Done button. |
| **→ / ←** | Move to next/prev word only when the caret is at the end/start of the current word; otherwise normal caret movement. |
| **Backspace** (empty word) | Delete that word token, focus the previous one. |
| **Space** | Split the current word into two tokens at the caret. |
| Click outside / **Done** button | Commit (same as Enter). |

Source: `player/caption-inline-editor/` — `CaptionInlineEditor.tsx` (root `onKeyDownCapture`
handles Enter=commit + Esc=cancel), `CaptionWordToken.tsx` (Tab/arrow word navigation),
`CaptionEditToolbar.tsx` (Done ↵ / Cancel buttons).

### ⚠️ Caption width is AUTHORED — never auto-grow it

Caption **width is a fixed, authored value** (`details.width`, e.g. 920). The inline editor
and the on-commit measurement must wrap text within that width exactly like the normal render.
**Never grow the width to fit content.**

- Root cause of past "caption box explodes on double-click / after edit" bugs (widths like 4095,
  18234): the edit UI content (`w-full` / `width:100%`) had **no definite wrap basis** inside the
  `BoxAnim { width:"auto" }` container, so every word laid out on one line and the box ballooned;
  the moveable + on-commit `measureCaptionDimensions` then persisted that runaway width, which also
  shifted the top-left-anchored box's visual center (apparent X/Y drift).
- Fix invariant: pin the editor root **and** content div to `detailsWidth`; on commit, keep width =
  authored `detailsWidth` and only re-measure the **wrapped height** at that fixed width.
- If a caption's `details.width` is already corrupted (query `getTimelineItems`, look for width
  ≫ 1000 on a caption), repair it: `editor.editItem {itemId, updates:{details:{width:920,height:180}}}`
  then `editor.save`.

Source: `player/caption-inline-editor/CaptionInlineEditor.tsx` (`measureCaptionDimensions` keeps
width, measures height only; root + `contentRef` pinned to `detailsWidth`), `player/items/caption.tsx`
(`BoxAnim { width:"auto" }`), `player/styles.ts` `calculateTextStyles` (emits no width/whiteSpace).

## Scene-backed text templates (high-fidelity styling)

Text items stay editable (`type:"text"` — inline edit, toolbar, timeline, `setAnimation` all
still work), but when `details.sceneTemplate` is set they render through a parameterized,
high-fidelity Remotion text-scene template instead of the flat text box. Use this whenever
plain text looks basic and you want scene-quality typography + animation.

Set via `editor.addText` or `editor.editItem` on `details`:
```json
{ "type": "editor.editItem", "params": {
  "itemId": "text_abc",
  "updates": { "details": {
    "sceneTemplate": "heroStack",
    "accentColor": "#e0783f",
    "sceneParams": { "stagger": 3, "scrim": true }
  }}
}}
```

### Templates
- **`heroStack`** — stacked multi-size italic serif (white by default, `color`), word-by-word
  spring rise + blur-in. Signature "sky-serif" hero look: use `textAlign:"left"` + lower-left
  `top`/`left` placement, mixed `fontSize` per item, and time overlapping items to build an
  accumulating stack. Params: `scales[]`, `stagger`, `scrim`(bool, default OFF), `scrimColor`.
- **`keywordCallout`** — phrase in a solid rounded box, spring pop-in + slight rotate, optional
  kicker label. Params: `label`, `boxColor`, `useAccentBox`(bool), `radius`, `rotate`.
  Best for punchy keywords ("1 prompt").
- **`wordReveal`** — words rise one-by-one from a clip mask on a spring stagger, optional
  accent-colored highlighted words. Params: `stagger`, `highlight[]` (words to accent), `rise`.
  Best for phrase reveals ("to do this", 'comment "Brain"').

### Notes
- `accentColor` (top-level detail) drives highlights / accent box; item `color` is the base.
- Editing text inline temporarily falls back to plain MotionText; template resumes on blur.
- Only items WITH `sceneTemplate` change behavior — zero impact on existing text items.
- Source module: `player/text-scenes/` (registry.ts, HeroStack/KeywordCallout/WordReveal.tsx,
  TextSceneRenderer.tsx). Add new templates by registering in `registry.ts`.
