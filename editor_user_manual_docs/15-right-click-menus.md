# Right-click Menus

> **For humans — and for AI helping humans.** This document describes how a person edits video by
> hand using the on-screen controls of the SkillTown video editor. It is **not** an AI skill or an
> automation API, so if you are an AI agent, do **not** treat these steps as callable commands — for
> programmatic/automated editing use the agent skills and commands documented elsewhere (see
> `_Agent/AGENTS.md`). **You may, however, read this doc to answer a user's "how do I…" questions
> and walk them, step by step, through performing these actions themselves in the editor UI.**

> Right-click a timeline or canvas item to open quick edit actions for properties, splitting, transforms, speed, volume, transitions, transcription, style copying, grouping, and deletion.

## Where to find it

Right-click an item on the **canvas** or on the **timeline**. The menu opens at your pointer and starts with the item type, such as **video**, **audio**, **image**, or **Template**. If multiple selected items are included, the header also shows **[n] items**.

Right-clicking empty canvas or timeline space does not open this item menu. To clear selection or move around the timeline, use the normal timeline controls instead.

## What you can do

- Open **Properties** for the selected item.
- Split, merge, duplicate, delete, or ripple delete timeline items.
- Turn clips on/off, mute/unmute media, and set track audio roles.
- Transform images, videos, and templates with fit/fill, centering, flips, rotation, and reset.
- Crop images and videos.
- Set **Playback Speed**, **Volume**, and quick **Transition to next** presets.
- Use **Face Track** on videos.
- **Detach audio**, **Transcribe…**, and **Reload waveform** for audio-capable clips.
- Use **Arrange** for visibility, track locking, combining, linking, style copy/paste, relinking, and saving custom scenes.
- Use **Compose to Scene** to turn selected media into animated scene layouts.

## How to use the main item menu

1. Select one item, or select multiple items if you want the action to affect a group.
2. Right-click the item on the canvas or timeline.
3. Choose a command from the menu, or hover a row with an arrow to open its submenu.
4. Press Escape or click away to close the menu.

| Menu entry | When it appears | What it does |
|---|---|---|
| **Compose to Scene** | When the selected items can be composed into a scene. | Opens scene-building options based on the selected videos, images, and templates. |
| **Properties** | Always. | Opens the properties panel for the item. Shortcut shown: **Enter**. |
| **Split at playhead** | When the playhead is inside the item and the item can be split. | Cuts the selected item at the playhead. Shortcut shown: **Q**. |
| **Merge (rejoin split)** | When selected adjacent split pieces can be rejoined. | Merges compatible split pieces back together. Shortcut shown: **G**. |
| **Duplicate** | Always. | Creates a copy after the selected item. Shortcut shown: **Ctrl+D**. |
| **Turn clip off** / **Turn clip on** | Always. | Disables or re-enables the selected clip. |
| **Mute clip** / **Unmute clip** | Video and audio items. | Mutes or unmutes the clip without changing its volume value. |
| **Track Role** | Video and audio items. | Sets the clip’s track role for audio workflows. |
| **Transform** | Images, videos, and templates. | Opens fit, fill, center, flip, rotate, and reset actions. |
| **Crop…** | Images and videos. | Opens crop controls for the selected visual item. |
| **Face Track** | Video items. | Detects faces and applies automatic follow or split framing. |
| **Playback Speed** | Video, audio, and template items. | Applies a speed preset. |
| **Transition to next** | When there is a later item on the same track. | Adds a quick transition from this item into the next item. |
| **Volume** | Video and audio items. | Applies a volume preset. |
| **Detach audio** | Video items with audio that have not already been detached. | Creates a separate audio item and mutes the original video. |
| **Detach audio ([n])** | Multiple detachable video items are selected. | Detaches audio from all eligible selected videos. |
| **Transcribe…** | Video and audio items. | Opens the transcription dialog for the clip’s source recording. |
| **Reload waveform** | Video and audio items. | Refreshes the waveform display if it did not draw correctly. |
| **Arrange** | Always. | Opens visibility, track lock, combine/link, style, relink, and save options. |
| **Link tracks** | Selected items span two or more tracks. | Links selected tracks together. |
| **Delete** | Always. | Deletes the selected item or selected items. Shortcut shown: **Del**. |
| **Ripple delete (close gap)** | Always. | Deletes the selection and pulls later items on the same track left to close the gap. Shortcut shown: **⇧Del**. |

The item menu does not show regular **Cut**, **Copy**, or **Paste** item commands. Use timeline shortcuts for item copy/paste, and use **Copy Style** / **Paste Style** inside **Arrange** for style transfer.

## How to use Compose to Scene

1. Select one or more videos, images, or templates.
2. Right-click the selection and hover **Compose to Scene**.
3. Use **Search scenes...** to filter the scene choices.
4. Click a scene option.
5. If multiple items are selected, confirm the dialog titled **Compose to Scene** by clicking **Create [n] Scenes**, or click **Cancel**.

| Compose entry | What it creates |
|---|---|
| **⭐ Segmented Video (Gap-Aware)** | Turns two or more video clips into one gap-aware sequence that skips removed parts. |
| **Picture in Picture** | Uses one video as the main clip and another as a picture-in-picture overlay. |
| **Picture in Picture (Swapped)** | Same layout as picture-in-picture, with the main and overlay sources reversed. |
| **Split Compare (Side by Side)** | Places two video sources side by side for comparison. |
| **Ken Burns (Cinematic Pan/Zoom)** | Adds cinematic pan/zoom motion to a video clip. |
| **Spotlight Focus** | Adds a spotlight-style focus effect to a video. |
| **Text Callout (Annotated)** | Adds callout annotation styling over a video. |
| **Smart Camera (Video)** | Adds camera keyframe motion to a video. |
| **📱 Handheld Camera (Video)** | Adds organic handheld-style motion to a video. |
| **Smart Camera (Pan/Zoom Image)** | Adds animated camera movement to an image. |
| **Ken Burns (Image)** | Adds cinematic floating zoom/pan to an image. |
| **📱 Handheld Camera (Realistic)** | Adds realistic floating motion and depth to an image. |
| **Image Highlight (Marker)** | Highlights regions on an image with marker-style emphasis. |
| **Image Underline (Focus)** | Underlines image regions while dimming the rest. |
| **Image Underline (Light Fade)** | Underlines regions while fading non-highlighted areas toward white. |
| **Image Focus (Blur)** | Focuses image regions by blurring everything else. |
| **Image Focus (Grayscale)** | Focuses image regions by turning everything else grayscale. |
| **Video + Image PIP** | Combines a video with an image overlay. |
| **🎬 Nested Composition** | Combines selected videos, images, and templates into one layered scene. |

## How to transform an item

1. Right-click an image, video, or template.
2. Hover **Transform**.
3. Choose the transform you want.

| Transform entry | What it does |
|---|---|
| **Fit to canvas** | Scales the item so the whole item fits inside the canvas. |
| **Fill canvas** | Scales the item so it covers the canvas. Some edges may crop visually. |
| **Original size** | Returns the item to its original scale. |
| **Center on canvas** | Moves the item to the center without changing its scale or rotation. |
| **Flip horizontal** | Toggles horizontal flip. A checkmark appears when active. |
| **Flip vertical** | Toggles vertical flip. A checkmark appears when active. |
| **Rotate 90° CW** | Rotates clockwise in 90-degree steps. |
| **Rotate 90° CCW** | Rotates counterclockwise in 90-degree steps. |
| **Reset transform** | Resets flip, rotation, and scale to defaults. Disabled when there is nothing to reset. |

## How to change speed, volume, role, and transitions

Use these submenus when you need quick media changes without opening the properties panel.

| Submenu | Entries |
|---|---|
| **Playback Speed** | **0.25×**, **0.5×**, **0.75×**, **1× (Normal)**, **1.25×**, **1.5×**, **2×**, **3×**, **4×** |
| **Volume** | **0% (Mute)**, **25%**, **50%**, **75%**, **100%**, **150%**, **200%** |
| **Track Role** | **Default**, **🎤 Voice**, **🎵 Music** |
| **Transition to next** | **fade**, **slide up**, **slide down**, **slide left**, **slide right**, **wipe up**, **wipe down**, **wipe left** |

**Transition to next** only appears when the selected item has a next item on the same track. Each quick transition shows its duration in seconds.

## How to use Face Track

1. Right-click a video item.
2. Hover **Face Track**.
3. Choose how the editor should detect and apply face framing.

| Face Track entry | What it does |
|---|---|
| **Detect & Apply (Auto)** | Detects faces and can auto-split framing if two faces are found. |
| **Re-detect (Auto)** | Re-runs automatic detection after face tracking already exists. |
| **Detect & Apply (Follow)** | Applies single-face panning only. |
| **Regenerate Keyframes** | Rebuilds the movement keyframes from the current face-track data. |
| **Sensitivity** | Opens sensitivity choices. |
| **Tight** | Uses denser detection and follows small movements. |
| **Normal** | Uses balanced tracking. |
| **Loose** | Uses minimal panning. |
| **Toggle Preview Overlay** | Shows or hides face-region preview overlays. |
| **Remove Face Track** | Removes face tracking from the clip. |

While detection is running, the menu label changes to **Detecting faces…**. A dot appears beside **Face Track** when face tracking is already applied.

## How to use Arrange

1. Right-click an item.
2. Hover **Arrange**.
3. Choose the management action you need.

| Arrange entry | When it appears | What it does |
|---|---|---|
| **Hide** / **Show** | Visual items. | Hides or shows the selected item or selected items. |
| **Lock track** / **Unlock track** | Items that are on a track. | Locks or unlocks the item’s whole track. |
| **Combine [n] items** | Two or more items are selected. | Combines selected items into a nested scene. |
| **Link [n] items** | Two or more items are selected. | Links selected items so they can move/delete together. |
| **Unlink** | The item is linked. | Removes item linking. |
| **Uncombine layers** | A nested scene is selected. | Breaks a nested scene back into layers. |
| **Copy Style** | Always. | Opens the style-copy dialog. |
| **Paste Style** | After a style has been copied. | Applies the copied style categories to the selected item or items. |
| **Relink media…** | Video, audio, and image items. | Lets you reconnect the item to a media file. |
| **Save to Library** | Custom template scenes. | Saves the custom scene for reuse. |

Layer-order commands such as bring forward or send backward are not part of this right-click menu. Use the timeline’s track order and item properties when you need to control what appears in front.

## How to copy and paste style

1. Right-click the source item.
2. Hover **Arrange** and choose **Copy Style**.
3. In the **Copy Style** dialog, select which style categories to copy.
4. Click **Copy [n] Style** or **Copy [n] Styles**.
5. Right-click the target item or selected targets.
6. Hover **Arrange** and choose **Paste Style**.

| Copy Style control | What it does |
|---|---|
| **All** | Selects all style categories. |
| **None** | Clears all selected categories. |
| **Cancel** | Closes without copying. |
| **Copy [n] Style** / **Copy [n] Styles** | Copies the selected categories. |
| **All properties are at defaults — paste will apply default values** | Indicates the source has no custom style values. |
| **[n] of [n] properties have custom values** | Shows how many style categories have custom values. |

| Style category | What it transfers |
|---|---|
| **Scene Settings** | Compatible template scene settings. |
| **Opacity** | Transparency. |
| **Blur** | Blur amount. |
| **Brightness** | Brightness level. |
| **Border Radius** | Rounded corners. |
| **Border** | Border width and color. |
| **Shadow** | Box shadow or drop shadow. |
| **Playback Speed** | Speed setting. |
| **Animations** | Enter and exit animations. |
| **Transform** | Scale and rotation-related transform settings. |
| **Volume** | Clip volume. |
| **Crop** | Crop region. |
| **Flip** | Horizontal and vertical flip settings. |

**Scene Settings** paste only applies between compatible scene types, and media-source fields are not copied.

## How to transcribe a clip

1. Right-click a video or audio item.
2. Choose **Transcribe…**.
3. Review the **Transcribe Clip** dialog.
4. Adjust **Audio Analysis Settings** if needed.
5. Click **Transcribe**, or click **Cancel** to close.

The **Selected Clip** section shows **Name**, **Duration**, **Range**, **Track**, and, when available, **Source**.

| Transcription option | Choices or behavior |
|---|---|
| **Analysis Granularity** | **Word Level (More detailed)** or **Segment Level (Faster)**. |
| **Window Duration (seconds)** | Processing window size. Valid range is 10–400 seconds; the default is 120 seconds. |
| **Transliterate to English** | Toggle between **Enabled** and **Disabled**. Converts non-English scripts, such as Hindi Devanagari, to Latin/English text. |
| **Number of Passes** | **1 Pass (Fastest)**, **2 Passes**, **3 Passes**, **4 Passes**, or **5 Passes (Most Accurate)**. |
| **Quick presets:** | **Fast**, **Balanced**, or **Detailed**. |

If the same source recording already has a transcript, the editor asks: **Replace the existing transcription for this recording ("[clip name]")?** The warning explains that saved transcript data is overwritten, but captions already added to the timeline are not removed automatically.


## How to right-click empty canvas or timeline space

Right-clicking empty editor space does not open a separate empty-area menu. The right-click menu is item-based: it opens only when the pointer is over a canvas item or a timeline item.

| Right-click target | What happens |
|---|---|
| Empty canvas/player area | No right-click menu opens. |
| Empty timeline canvas area | No right-click menu opens. |
| Timeline track item | Opens the item menu for that item, or for the current multi-selection if that item is already selected. |
| Canvas item | Opens the item menu for that item, or for the current multi-selection if that item is already selected. |

## Tips & good to know

- The right-click menu uses the current selection if you right-click an already-selected item. If you right-click an unselected item, the menu acts on that item only.
- Some commands appear only for certain item types: **Face Track** is video-only; **Volume**, **Track Role**, **Transcribe…**, and **Reload waveform** are for video/audio; **Crop…** is for images/videos.
- **Playback Speed** also appears for templates.
- **Transition to next** needs a next item later on the same track.
- **Split at playhead** only appears when the playhead is inside the item, not on its edge.
- **Detach audio** creates a separate audio item and mutes the video so you do not hear doubled audio.
- **Ripple delete (close gap)** shifts later items on the same track left after deleting.
- Right-clicking empty canvas or empty timeline space does not open an empty-area menu.

## Related

- [Scenes, Templates & Styles](03-scenes-templates-styles.md)
- [Custom Scenes & AI](04-custom-scenes-and-ai.md)
- [Timeline & Selection](06-timeline-and-selection.md)
- [Item Properties](07-item-properties.md)
- [Transitions](12-transitions.md)
