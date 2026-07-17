# Text & Captions

> **For humans, not agents.** This document describes how a person edits video by hand using the
> on-screen controls of the SkillTown video editor. It is **not** an AI skill or an automation API.
> If you are an AI agent, do **not** treat these steps as callable commands — for programmatic
> control use the agent skills/commands documented elsewhere (see `_Agent/AGENTS.md`).

> Add editable text overlays and generate, edit, style, and export captions for speech in your video.

## Where to find it

Open the menu panel and choose **Text** to add a text overlay. Choose **Captions** to generate captions from video/audio or from an existing transcript.

When you select a text or caption item on the canvas or timeline, its settings open in the properties panel. Text items use the **Design**, **Animate**, and **Effects** tabs. Caption items use **Transcript**, **Content**, **Design**, **Animate**, and **Effects**.

## What you can do

- Add a text layer at the current playhead position with **Add text**.
- Drag text from the menu panel to the timeline.
- Apply text presets, font choices, color, fill, gradient, alignment, case, decoration, opacity, typography, stroke, shadow, word colors, animations, keyframes, and effects.
- Generate captions from selected video/audio with **Quick Generate**.
- Add captions from an existing editor transcript with **From Transcript**.
- Edit caption text in the **Transcript** tab with find/replace, split, merge, add, delete, and export tools.
- Style captions with **Words** and **Lines** presets, including per-word active highlighting.

## How to add a text element

1. Open the **Text** menu panel.
2. Click **Add text** to place a new text item at the current playhead position, or drag **Add text** onto the timeline.
3. Select the text item on the canvas or timeline.
4. Use the properties panel to style it. If you previously styled text, new text uses the remembered text style until you use **Reset Style**.

## How to style text

1. Select a text item.
2. In the properties panel, use **Design** for appearance, **Animate** for motion, and **Effects** for effects/keyframes.
3. Use **Search text settings...** if you want to find a section quickly.

| Section or control | What it does |
|---|---|
| **Text** | Opens text preset controls. The **Preset** picker defaults to **None** and preset cards preview the word **Text**. |
| **Text Style** | Main typography and fill controls. Includes **Reset Style** to return the selected text to the default add-text style. |
| **Font** | Chooses the font family. Use **Search fonts...** in the font picker. |
| **Weight** | Chooses the selected font’s style, such as regular or bold variants when available. |
| **Size** | Changes text size. |
| **Color** | Changes solid text color. Disabled while **Gradient** is on. |
| **Fill** | Sets the text background/fill color. |
| **Gradient** | Uses a text gradient instead of a solid color. Adjust **Color 1**, **Color 2**, and **Direction**. |
| **Align** | Sets text alignment: **Left**, **Center**, or **Right**. |
| **Case** | Sets text case: **As typed**, **Uppercase**, or **Lowercase**. |
| **Decoration** | Toggles underline, strikethrough, or overline decoration. |
| **Opacity** | Changes text transparency. |
| **Typography** | Groups detailed spacing and shape controls. |
| **Line Height** | Changes vertical spacing between text lines. |
| **Letter Spacing** | Changes spacing between letters. |
| **Border Radius** | Rounds the text background/fill corners. |
| **Rotation** | Rotates the text item. |
| **Word Spacing** | Changes spacing between words. |
| **Blend Mode** | Changes how text blends with layers underneath. Options include **Normal**, **Multiply**, **Screen**, **Overlay**, **Darken**, **Lighten**, **Color Dodge**, **Color Burn**, **Hard Light**, **Soft Light**, **Difference**, **Exclusion**, **Hue**, **Saturation**, and **Luminosity**. |
| **Padding** | Adds space inside the text background/fill. Use the link button to edit all sides together or unlock **Top**, **Right**, **Bottom**, and **Left** separately. |
| **Stroke & Shadow** | Controls outline and shadow styling. |
| **Stroke** | Sets stroke **Color** and **Size** or **Width**. |
| **Extra Strokes** | Adds additional stroke layers with **Add Stroke**. |
| **Shadow** | Sets shadow **Color**, **X**, **Y**, and **Blur**. |
| **Extra Shadows** | Adds additional shadow layers with **Add Shadow**. |
| **Word Colors** | Pick colors for individual words. Use **Reset All** to remove word-specific colors. |
| **Animations** | Adds text animation presets. |
| **Keyframes** | Animates text properties over time. |
| **Effects** | Applies available visual effects to the text item. |

## How to generate captions

### Generate from video or audio

1. Add video or audio to the timeline first.
2. Open the **Captions** menu panel.
3. Choose **Quick Generate**.
4. Open **Select media** and choose the video or audio item.
5. Click **Generate**. While speech recognition runs, the button shows **Generating...**.
6. When captions are created, they appear on a new **Captions** track. The caption list shows each segment’s time range and text; clicking a segment seeks the player to that caption.

If there is no video or audio yet, the panel says **Add video or audio and generate captions automatically.** If media exists but none is selected, it says **Select video or audio and generate captions automatically.**

### Generate from an existing transcript

1. Open the **Captions** menu panel.
2. Choose **From Transcript**.
3. If the panel shows **No Editor Transcript**, generate a transcript from your timeline audio first, then return to captions.
4. When the panel shows **Editor Transcript Ready**, click **Generate Captions from Transcript**.
5. Captions are added with word-level timing on a new track.

## How to edit caption text and timing

1. Select any caption item.
2. Open the **Transcript** tab in the properties panel.
3. Click a caption row to select it and seek to its start time. The active row follows the playhead.
4. Click the caption text field, shown as **Edit caption text**, and type your correction. Edits save automatically shortly after you stop typing or when you leave the field.
5. Use **Find captions** to search caption text. Press Enter for the next match or Shift+Enter for the previous match.
6. Use the replace toggle to show **Replace with**, then click **Replace** or **Replace All**.
7. Hover a caption row for timing/edit tools:
   - **Play from here** starts playback at that caption.
   - **Split at cursor** divides the caption at the text cursor and splits the available time between the two captions.
   - **Merge with next** combines the selected caption with the next caption and extends the timing to cover both.
   - **Add caption after** creates a blank caption after the current one.
   - **Delete caption** removes that caption.
8. Use **Select All** to select all visible captions.
9. Use **Export captions** to choose **Export as SRT** or **Export as VTT**.

Keyboard shortcuts in caption text fields:

| Shortcut | Result |
|---|---|
| Enter | Move to the next caption. |
| Shift+Enter | Move to the previous caption. |
| Alt+Enter | Split at the cursor, or add a caption after if the cursor is at the end. |
| Alt+Backspace | Merge with the previous caption when the cursor is at the start. |
| Arrow Up | Move to the previous caption when the cursor is at the start. |
| Arrow Down | Move to the next caption when the cursor is at the end. |
| Escape | Leave the caption text field. |
| Cmd/Ctrl+H | Show or hide replace controls while searching. |

For exact placement on the timeline, you can also drag or trim caption items directly in the timeline.

## How to choose caption styles

1. Select a caption item.
2. Open **Content** and expand **Preset**.
3. Choose **Words** for word-by-word animated styles or **Lines** for line-based caption styles.
4. Use **Search presets...** to filter styles.
5. Use the preview background button labeled **Change preview background — preview how captions look on your video** to test contrast. Built-in preview backgrounds are **Dark**, **White**, **Gray**, **Green**, **Blue**, and **Red**. Use **Pick custom color** for your own color, or **Reset** to clear it.
6. Use **Preview with your own text...** to test a style with your wording.
7. Click a preset card to apply it. If you change a styled caption afterward, the preset badge can show **Modified**; click it to reset to the original preset.

Common preset names include **None**, **Dynamic 1**, **Dynamic 2**, **Dynamic 3**, **Typewriter Classic**, **Fire Bold**, **Golden Glow**, **Neon Yellow**, **Hormozi Style**, **Blue Karaoke**, **Colorful Pop**, **Green Word Effect**, **Classic Black**, **Cyan Pop**, **White Motion**, **Knewave Word**, **White Word Flash**, **Lime Motion**, **Yellow Keyword**, **White Outline**, **Green Block**, **Purple Glow**, **White Left**, **Purple Left**, and **Black Outline**.

## How to tune caption words and highlighting

1. Select a caption item.
2. Open **Content** and expand **Caption Words**.
3. Adjust the grouping and display behavior:

| Control | Options | What it does |
|---|---|---|
| **Lines per Page** | **One**, **Two**, **Three**, **Four**, **Five** | Regroups caption words into larger or smaller caption blocks. |
| **Words per line** | **Punctuation**, **Time**, **Single Word** | Splits captions by punctuation/pauses, short timed chunks, or one word at a time. |
| **Words in line** | **Page**, **Line**, **Word** | Controls whether captions reveal by the full page, by line, or by individual word. |
| **Position** | **Auto**, **Top**, **Center**, **Bottom** | Repositions caption text vertically on the canvas. |
| **Transition** | **None**, **Fade**, **Scale**, **Slide**, **Zoom**, **Pop**, **Jump**, **Pulse** | Sets the caption word transition style. |

4. Open **Caption Colors** to adjust word states:

| Control | What it affects |
|---|---|
| **Appeared** | Color for words that have already appeared. |
| **Active** | Color for the word currently being spoken. |
| **Active Fill** | Highlight fill behind the active word. |
| **Emphasize** | Color used for emphasized keyword words. |
| **Preserved Color** | Keeps keyword color after the word has appeared. |

## How to style captions manually

Caption styling shares many controls with text, plus caption-specific word behavior.

| Tab or section | Controls |
|---|---|
| **Transcript** | Caption text editing, **Find captions**, **Replace with**, **Replace**, **Replace All**, track filter **All tracks**, **Export captions**, **Export as SRT**, **Export as VTT**, **Select All**. |
| **Content** | **Preset**, **Caption Words**, **Animations**, and **Caption Colors**. |
| **Design** | **Text Style** and **Stroke & Shadow**. Caption **Text Style** includes **Font**, **Size**, **Color**, **Fill**, **Gradient**, **Align**, **Case**, **Decoration**, **Opacity**, **Line Height**, **Letter Spacing**, **Border Radius**, **Rotation**, **Word Spacing**, **Blend Mode**, and **Padding**. |
| **Animate** | Caption **Animations**. |
| **Effects** | **Keyframes** and **Effects**. |

The caption font picker includes **Bangers**, **Bebas Neue**, **Anton**, **Oswald**, **Righteous**, **Bungee**, **Lilita One**, **Passion One**, **Black Ops One**, **Fredoka One**, **Inter**, **Roboto**, **Poppins**, **Montserrat**, **Open Sans**, **Lato**, **Nunito**, **Raleway**, **Playfair Display**, **Merriweather**, **Lora**, **Kalam**, **Caveat**, **Dancing Script**, **Permanent Marker**, **Patrick Hand**, **Fira Code**, and **JetBrains Mono**.

## Tips & good to know

- Text and captions are added on top tracks so they stay visible above video, image, and scene layers.
- Captions need word timing to render. If a selected caption has no words, the panel shows **No caption text yet** and **This caption has no words. Add captions to get started.**
- Double-click a selected caption on the canvas to edit it inline. The hint says **Double-click to edit**.
- Generated captions use word-level timing, so **Active** and **Active Fill** can highlight the currently spoken word.
- **Quick Generate** works only after you add video or audio.
- **From Transcript** works only after an editor transcript exists.
- Use **Preview background — see how captions look on your video color** before applying caption presets to check contrast.
- If captions are hard to read, start with stronger **Stroke**, **Shadow**, or **Active Fill** before increasing **Size**.

## Related

- [Timeline editing](04-timeline-editing.md)
- [Media & audio](03-media-and-audio.md)
- [Animations & effects](06-animations-and-effects.md)
