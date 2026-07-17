# Item Properties

> **For humans, not agents.** This document describes how a person edits video by hand using the
> on-screen controls of the SkillTown video editor. It is **not** an AI skill or an automation API.
> If you are an AI agent, do **not** treat these steps as callable commands — for programmatic
> control use the agent skills/commands documented elsewhere (see `_Agent/AGENTS.md`).

> The properties panel lets you adjust the selected item’s layout, appearance, media behavior, layers, and crop settings.

## Where to find it

1. Select an item on the canvas or timeline.
2. The right-hand properties panel opens automatically. Its title changes by item type, such as **Image Settings**, **Video Settings**, **Audio Settings**, **Shape Settings**, **Progress Bar Settings**, or **Progress Frame Settings**.
3. If nothing is selected, the panel shows **No item selected**.
4. To close the panel, use the **Close panel** button in the panel header.

When you select several items of the same type, the panel shows bulk-edit indicators such as **Bulk editing 3 images**, **Images (3 selected)**, or **Editing all 3 images**. When you select mixed item types, the panel shows shared controls only.

## What you can do

- Align selected visual items to the canvas or to each other.
- Change common appearance controls such as **Opacity**, **Radius**, **Blur**, and **Brightness**.
- Set image and video **Scale** to **Fill**, **Fit**, **Original**, or view **Custom** scale when applicable.
- Crop images, videos, and template scenes with numeric edge controls or the visual **Crop** dialog.
- Adjust video and audio **Volume**, **Playback rate**, **Custom** speed, and **Reverse** playback.
- Change shape **Fill Color**, **Stroke**, **Stroke Color**, **Stroke Width**, **Size**, and **Change Shape**.
- Edit template scene **Content**, **Settings**, **Effects**, **Scene Orientation**, **Size & Crop**, and scene-specific fields.
- Edit nested scene layers with **Quick Edit** or **Full Settings**.
- Use floating pickers such as **Fonts**, **Animations**, and **Presets** for text, captions, and animation styling.

## How to open and navigate the properties panel

1. Click one item on the canvas or timeline.
2. Use the tabs at the top of the panel. Common tabs include **Design**, **Animate**, **Effects**, **Camera**, **Auto-Captions**, **Basic**, **Content**, and **Settings**, depending on the selected item.
3. Use the search box when available, for example **Search image settings...**, **Search video settings...**, or **Search audio settings...**.
4. Open a section by clicking its heading, such as **Basic**, **Border & Shadow**, **Color & Filters**, **Speed**, or **Keyframes**.

## How to adjust common transform and appearance controls

Use these controls for most visual items. Some controls appear only for item types that support them.

| Control label | Where it appears | What it does |
|---|---|---|
| **Align** | Top of the properties panel for supported visual items | Shows alignment buttons for the selected item or selection. |
| **Align left to canvas** / **Align left to selection** | **Align** toolbar tooltip | Moves the item to the left edge of the canvas, or aligns multiple selected items to the selection’s left edge. |
| **Center horizontally** | **Align** toolbar tooltip | Centers the item horizontally. |
| **Align right to canvas** / **Align right to selection** | **Align** toolbar tooltip | Moves the item to the right edge of the canvas, or aligns multiple selected items to the selection’s right edge. |
| **Align top to canvas** / **Align top to selection** | **Align** toolbar tooltip | Moves the item to the top edge of the canvas, or aligns multiple selected items to the selection’s top edge. |
| **Center vertically** | **Align** toolbar tooltip | Centers the item vertically. |
| **Align bottom to canvas** / **Align bottom to selection** | **Align** toolbar tooltip | Moves the item to the bottom edge of the canvas, or aligns multiple selected items to the selection’s bottom edge. |
| **Distribute horizontally** | **Align** toolbar tooltip for 3+ selected items | Spaces selected items evenly from left to right. |
| **Distribute vertically** | **Align** toolbar tooltip for 3+ selected items | Spaces selected items evenly from top to bottom. |
| **Need 3+ items** | **Align** toolbar tooltip | Appears when distribute controls are unavailable. |
| **Opacity** | **Basic**, **Appearance**, **Scene Orientation**, progress **Settings**, nested layer **Quick Edit** | Changes transparency. |
| **Radius** / **Rounded** / **Round** | Image, video, shape, progress, nested layer controls | Rounds item corners. |
| **Blur** | Image, video, shape, progress, template video, nested layer controls | Softens the selected item. |
| **Brightness** / **Bright** | Image, video, shape, progress, template video, nested layer controls | Darkens or brightens the selected item. |
| **Width** / **Height** / **W** / **H** | Shape and template size controls; keyframe transform controls | Changes item dimensions where exposed. |
| **Scale** | Image and video **Basic**; mixed selection controls; keyframe transform controls | Resizes the item without changing its original dimensions. |
| **Rotation** | Mixed selection controls; keyframe transform controls | Rotates selected items. |
| **Flip X** / **Flip Y** | Progress frame controls and supported flip controls | Mirrors an item horizontally or vertically. |
| **Position X** / **Position Y** | Keyframe transform controls | Adjusts position values when editing transform/keyframe properties. See the animation/keyframe manual for detailed keyframing. |

You can also drag an item on the canvas to reposition it and use its canvas handles to resize or rotate it. For multiple mixed item types, the shared panel provides **Position (Relative)** with **Move X**, **Move Y**, **Scale**, **Rotation**, and **Appearance** controls.

## How to edit image properties

1. Select an image.
2. Open the **Design** tab, then **Basic**.
3. Use the available controls:

| Control label | What it does |
|---|---|
| **Scale** | Chooses how the image fits the canvas. |
| **Fill** | Scales the image to cover the canvas area, cropping overflow if needed. |
| **Fit** | Scales the full image inside the canvas without cropping. |
| **Original** | Resets to the image’s original scale. |
| **Crop** | Opens crop tools for the selected image. |
| **Lock Ratio** | Shows **Yes** and **No** options for ratio locking. |
| **Opacity** | Changes transparency. |
| **Radius** | Rounds the image corners. |
| **Blur** | Applies blur. |
| **Brightness** | Adjusts brightness. |
| **Left**, **Right**, **Top**, **Bottom** | Crops each edge numerically. |
| **Reset crop** | Clears numeric crop values. |
| **Visual crop editor** | Opens the visual crop dialog. |

4. Open **Border & Shadow** for **Border**, **Color**, **Size**, **Shadow**, **X**, **Y**, and **Blur** shadow controls.
5. Open **Color & Filters** for filter adjustments.
6. Use **Blend Mode**, **Clip Mask**, **Remove Background**, **3D Camera**, and **Zoom to Spot** only when those sections are visible.

## How to edit video properties

1. Select a video.
2. In **Design**, open **Basic**.
3. Use these controls:

| Control label | What it does |
|---|---|
| **Scale** | Sets video sizing. |
| **Fill** | Covers the canvas area. |
| **Fit** | Shows the full video inside the canvas. |
| **Original** | Resets original sizing. |
| **Custom** | Appears when the video has a custom scale. |
| **Crop** | Opens crop controls. |
| **Active** / **Off** | Turns the clip on or off for preview/export. |
| **Audio** / **Muted** | Mutes or unmutes the clip’s audio. |
| **Left**, **Right**, **Top**, **Bottom** | Crops video edges numerically. |
| **Volume** | Adjusts video audio level. |
| **Opacity** | Changes video transparency. |
| **Radius** | Rounds video corners. |
| **Blur** | Applies blur. |
| **Brightness** | Adjusts brightness. |

4. Open **Audio** for expanded audio controls.
5. Open **Speed** to change playback.

| Speed control | What it does |
|---|---|
| **Playback rate** | Shows the current speed. |
| **0.25x**, **0.5x**, **0.75x**, **1x**, **1.5x**, **2x**, **3x**, **4x** | Applies a preset speed. |
| **Custom** | Fine-tunes speed from 0.1x to 4x. |
| **Reverse** | Plays the selected clip backward. |

## How to edit audio properties

1. Select an audio item.
2. The panel title shows **Audio** and tabs such as **Basic**, **Effects**, and **Auto-Captions**.
3. In **Basic**, use these controls:

| Control label | What it does |
|---|---|
| **Source** | Shows the audio file name, source path, and item ID. |
| **Copy full path** | Copies the full source path. |
| **Volume** | Adjusts audio level. Audio items support boosted values above 100. |
| **Active** / **Off** | Includes or excludes the clip from preview/export. |
| **Audio** / **Muted** | Mutes or unmutes the clip. |
| **Track role (auto-duck)** | Sets how the track is treated for automatic ducking. |
| **Default** | Uses normal track behavior. |
| **Voice** | Marks the track as voice. |
| **Music** | Marks the track as music. |
| **Live meter** | Shows real-time left/right audio levels when enabled. |
| **Enable live meter** / **Disable live meter (saves CPU)** | Turns the live meter on or off. |
| **Loudness** | Shows analysis values such as **Peak**, **RMS**, **source**, and **after volume**. |

4. Open **Speed** for **Playback rate**, speed presets, **Custom**, and **Reverse**.
5. Use **Auto-Captions** when you want to generate captions from the audio source. Caption editing is covered in [Text and Captions](05-text-and-captions.md).

## How to edit shape properties

1. Select a shape.
2. Use **Design** for shape styling.

| Section or control label | What it does |
|---|---|
| **Fill Color** | Changes the shape fill. |
| **Stroke** | Opens border/stroke controls. |
| **Stroke Color** | Changes outline color. |
| **Stroke Width** | Changes outline thickness. |
| **Appearance** | Contains **Opacity**, **Blur**, and **Brightness**. |
| **Size** | Contains **Width** and **Height** inputs. |
| **Shadow** | Edits shadow **Color**, **X**, **Y**, and **Blur**. |
| **Change Shape** | Swaps the current shape for another shape thumbnail. |

3. Use **Effects** for **Keyframes** if you need motion or animated property changes. See the animation/keyframe manual rather than duplicating that workflow here.

## How to edit template scene properties

1. Select a template scene. The panel uses **Content**, **Settings**, and **Effects** tabs.
2. In **Content**, use these sections:

| Section or control label | What it does |
|---|---|
| **Code** | Opens advanced scene editing when available. |
| **Scene Orientation** | Sets scene orientation, size, playback speed, and opacity. |
| **Landscape** | Uses landscape orientation. |
| **Portrait** | Uses portrait orientation. |
| **1080p**, **720p**, **Square**, **4:5**, **9:16** | Applies common scene dimensions. |
| **Width** / **Height** | Sets custom scene dimensions. |
| **Speed** | Sets template playback speed. |
| **Opacity** | Changes the scene’s opacity. |
| **Live Preview** | Shows a preview when available. |
| **Content** | Shows scene-specific fields. Labels vary by template and are taken from that template’s schema. |
| **Style Overrides** | Edits style fields such as **Effects**, **Typography**, **Theme Colors**, and **Layout**. |
| **Raw JSON (advanced)** | Lets advanced users edit style JSON directly. |

3. In **Settings**, use these sections:

| Section or control label | What it does |
|---|---|
| **Background & Effects** | Edits scene background styling. |
| **Background** | Changes the main background color. |
| **Gradient** | Adjusts gradient intensity. |
| **Vignette** | Adjusts vignette strength. |
| **Size & Crop** | Edits scene size and crop. |
| **W** / **H** | Changes item width and height. |
| **Full**, **Half**, **Square**, **Wide**, **Banner** | Applies preset item sizes. |
| **Layout Presets** | Applies position-and-size presets. |
| **Crop Edges** | Opens edge crop sliders. |
| **Left**, **Right**, **Top**, **Bottom** | Crops each edge. |
| **Reset**, **Center 50%**, **Top Half** | Applies quick crop presets. |
| **Video Settings** | Shows **Volume**, **Speed**, **Blur**, **Brightness**, and **Radius** for video-based scenes. |
| **Audio** | Opens expanded audio controls for template video audio. |

4. In **Effects**, use **Effects**, **3D Camera**, **Zoom to Spot**, and **Keyframes** when those sections are visible.

## How to edit progress bars and progress frames

1. Select a progress item. The title shows **Progress Bar Settings** or **Progress Frame Settings**.
2. Use **Design** for style and color.

| Section or control label | What it does |
|---|---|
| **Style** | Chooses the progress visual style. |
| **Solid**, **Segmented**, **Gradient**, **Glow**, **Striped**, **Outline**, **Dual** | Progress bar styles. |
| **Corner**, **Full Border** | Progress frame styles. |
| **Segments** | Sets the number of segments for **Segmented** style. |
| **Gap** | Sets segment spacing. |
| **Border** | Sets outline width for **Outline** style. |
| **Gradient End** | Sets the ending color for **Gradient** style. |
| **Colors** | Edits **Progress Color** and **Track Color**. |
| **Settings** | Opens behavior and appearance controls. |
| **Inverted** | Reverses the fill direction/behavior. |
| **Height** | Changes progress bar height. |
| **Radius** | Rounds progress bar corners. |
| **Direction** | Chooses **Horizontal** or **Vertical**. |
| **Thickness** | Changes progress frame thickness. |
| **Flip X** / **Flip Y** | Mirrors a progress frame. |
| **Opacity**, **Blur**, **Brightness** | Adjust progress appearance. |
| **Quick Presets** | Applies color presets such as **Pink**, **Blue**, **Green**, **Purple**, **Orange**, **Red**, **Yellow**, **Teal**, **Indigo**, **Rose**, **Lime**, and **White**. |

3. Use **Effects** for **Animations** when visible.

## How to edit nested scene layers

Nested scenes show a layer list and layer-level editing tools.

| Control label | What it does |
|---|---|
| **Nested Scene (n layers)** | Shows how many layers are inside the nested scene. |
| **Uncombine** | Breaks the nested scene back into separate items. |
| **Select All** | Selects every layer in the nested scene. |
| **Quick Edit** | Shows compact controls for the selected layer. |
| **Full Settings** | Opens the full native settings for that layer type. |
| **Position & Size** | Lets you edit layer x/y/width/height values. |
| **Opacity** | Changes layer transparency. |
| **Round** | Rounds the layer. |
| **Vol** | Adjusts layer volume for video layers. |
| **Speed** | Adjusts layer playback speed for video layers. |
| **Blur** / **Bright** | Changes layer blur and brightness. |
| **Editing n layers** | Shows batch controls for selected nested layers. |
| **Opacity (all)** | Changes opacity for all selected nested layers. |
| **Visibility** | Shows **Show** and **Hide** buttons for selected nested layers. |

Use the arrow controls in each layer row to move a layer up or down in the nested scene. Use the eye control to show or hide a layer, and the trash control to remove a layer. You cannot remove the last layer.

## How to use on-canvas floating controls

Floating controls appear as small popovers on the canvas when you open specific style pickers from an item’s properties.

| Floating panel label | What it does |
|---|---|
| **Fonts** | Lets you search fonts with **Search font...** and apply a font to the selected text item. If no match is found, it shows **No font found**. |
| **Animations** | Shows animation preset thumbnails under **In**, **Loop**, and **Out** tabs. |
| **Presets** | Shows text or caption style presets. In caption bulk mode it shows **Bulk (n)**. |

Click outside the floating control or use the close icon to dismiss it.

## How to arrange layers

1. For normal timeline items, arrange front-to-back order by moving items between tracks in the timeline. Items on higher/front tracks render above items behind them.
2. For selected visual items, use **Align** controls to line them up precisely.
3. For nested scenes, use the layer row arrow controls to move layers up or down.
4. In nested scenes, use **Show**, **Hide**, and the eye control to control visibility.
5. Use **Uncombine** if you need to return nested layers to separate timeline items.

## How to crop an image or video

1. Select an image or video.
2. In **Basic**, click **Crop** or **Visual crop editor**.
3. In the **Crop** dialog, choose **Aspect Ratio**.
4. Pick **Free**, **1:1**, **2:3**, **3:2**, **3:4**, **4:3**, **9:16**, or **16:9**.
5. Drag the crop box or its handles in the preview.
6. Click **Apply** to save the crop, or **Reset** to restore the full image/video.

You can also use the numeric **Left**, **Right**, **Top**, and **Bottom** crop controls directly in the panel. The panel tip says: **Tip: Hold Alt + drag a resize handle on canvas for visual crop**.

## Tips & good to know

- Not every selected item shows every section. The panel only shows controls that apply to the current item type.
- **Auto-Captions** and caption styling are documented in [Text and Captions](05-text-and-captions.md).
- **Animations** and **Keyframes** appear in this panel, but detailed animation workflows are covered separately.
- Template **Content** fields vary by scene. Use the labels shown in the selected template’s panel.
- **Custom** appears in video **Scale** only when the current scale does not match **Fill**, **Fit**, or **Original**.
- **Distribute horizontally** and **Distribute vertically** require at least three selected items.
- Audio **Live meter** uses extra CPU while enabled.

## Related

- [Media Library](02-media-library.md)
- [Scenes, Templates, and Styles](03-scenes-templates-styles.md)
- [Text and Captions](05-text-and-captions.md)
