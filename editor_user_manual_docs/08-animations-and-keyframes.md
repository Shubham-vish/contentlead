# Animations & Keyframes

> **For humans, not agents.** This document describes how a person edits video by hand using the
> on-screen controls of the SkillTown video editor. It is **not** an AI skill or an automation API.
> If you are an AI agent, do **not** treat these steps as callable commands — for programmatic
> control use the agent skills/commands documented elsewhere (see `_Agent/AGENTS.md`).

> Add preset motion to selected items, then fine-tune movement, appearance, speed, and audio changes over time with keyframes.

## Where to find it

Select an item on the canvas or timeline, then open the **Properties** panel. Most editable items show an **Animations** section and a **Keyframes** section.

For images, the motion workflow is expanded into **Style Template**, **Entry Animation**, **Exit Animation**, **Animations**, and **Keyframes** sections. For shapes and scene/template items, keyframes appear in the **Effects** tab. Keyframe markers also appear as yellow diamonds directly on the timeline.

## What you can do

- Apply quick animation presets from **In**, **Loop**, and **Out** tabs.
- Adjust **Animation In Duration**, **Animation Loop Duration**, and **Animation Out Duration** after choosing a quick preset.
- Choose image-focused **Entry Animation** and **Exit Animation** keyframe presets.
- Apply a complete **Style Template** such as **Documentary**, **Social Media**, **Cinematic**, **Dynamic**, **Elegant**, or **Energetic**.
- Turn **Sound Effects** **ON** so matching sounds are added with animation presets.
- Add keyframes to supported properties such as **Position X**, **Position Y**, **Scale**, **Opacity**, **Rotation**, **Blur**, **Brightness**, **Speed**, and **Volume**.
- Edit keyframe values, delete keyframes, and choose easing from the **Keyframe List**.
- Use timeline diamond markers to jump to keyframed moments.

## How to apply quick item animations

1. Select the item you want to animate.
2. In **Properties**, expand **Animations**.
3. Click the **Animation** dropdown. A floating **Animations** picker opens.
4. Choose a tab:
   - **In** controls how the item appears.
   - **Loop** controls motion while the item remains visible.
   - **Out** controls how the item leaves.
5. Click a preset tile. The selected tile is highlighted, and the item animates in the player.
6. If duration controls appear, drag **Animation In Duration**, **Animation Loop Duration**, or **Animation Out Duration** to change how long that part of the animation lasts.

Common quick preset labels include:

| Tab | Presets you may see |
|---|---|
| **In** | **Fade**, **Scale**, **Slide Right**, **Slide Left**, **Slide Top**, **Slide Bottom**, **Rotate**, **Flip**, **Shake Horizontal**, **Shake Vertical**, **Type Writer**, **Animated Text**, **Sunny Mornings**, **Domino Dreams**, **Great Thinkers**, **Beatiful Questions**, **Made With Love**, **Reality is Broken**, **Drop Animation In**, **Descompress Animation In**, **Count Down Animation In**, **Sound Wave Animation In**, **Background Animation In** |
| **Loop** | **Pulse Animation Loop**, **Glitch Animation Loop**, **Font Change Animation Loop**, **Vintage Animation Loop**, **Shaky Letters Animation Loop**, **Shake Text Animation Loop**, **Rotate 3D Animation Loop**, **Heartbeat Animation Loop**, **Spin Animation Loop**, **Wave Animation Loop**, **Vogue Animation Loop**, **Dragon Fly Animation Loop**, **Billboard Animation Loop** |
| **Out** | **Fade**, **Scale**, **Slide Right**, **Slide Left**, **Slide Top**, **Slide Bottom**, **Shake Horizontal**, **Shake Vertical**, **Type Writer**, **Animated Text**, **Sunny Mornings**, **Domino Dreams**, **Great Thinkers**, **Beautiful Questions**, **Made With Love**, **Reality is Broken**, **Drop Animation Out**, **Descompress Animation Out**, **Background Animation Out** |

## How to use image animation presets

1. Select an image.
2. Open **Properties** and expand **Style Template** if you want a one-click combination.
3. Open the **Choose a style...** menu and choose:

| Style | What it does |
|---|---|
| **Custom (manual)** | Leaves entry and exit choices under your control. |
| **Documentary** | Slow Ken Burns zoom with gentle fade out. Classic documentary feel. |
| **Social Media** | Punchy scale in/out with quick timing. Attention-grabbing. |
| **Cinematic** | Elegant fade with blur transitions. Film-like quality. |
| **Dynamic** | Slide in from left, slide out to right. High-energy transitions. |
| **Elegant** | Subtle scale & fade entrance with soft fade exit. Refined look. |
| **Energetic** | Rotate in with slide out. Bold and playful. |

4. To choose manually, expand **Entry Animation** or **Exit Animation**.
5. Open the preset menu and choose a preset, or choose **None** to clear that side.
6. The preset description appears below the menu.
7. Click **Tweak Parameters** if you want to customize it.
8. If you changed values and want to apply the same choices again, click **Re-apply with current settings**.

Available **Entry Animation** presets:

| Preset | Description |
|---|---|
| **Scale In** | Item scales from 50% to 100% with smooth easing |
| **Scale In (Bounce)** | Item scales from small with a bouncy overshoot |
| **Fade In** | Item fades in from transparent |
| **Scale & Fade In** | Item scales and fades in simultaneously |
| **Zoom In** | Dramatic zoom from very small size |
| **Slide Up** | Item slides up from below |
| **Slide In Left** | Item slides in from the left with a fade |
| **Slide In Right** | Item slides in from the right with a fade |
| **Slide Down** | Item slides down from above |
| **Blur In** | Item starts blurry and comes into focus |
| **Rotate In** | Item rotates and scales up into view |
| **Draw On (Shape)** | Stroke-based shape draws itself from start to end |
| **Fill Fade In (Shape)** | Shape fill fades in while stroke stays visible |
| **Grow (Shape)** | Shape width and height animate from small to full size |

Available **Exit Animation** presets:

| Preset | Description |
|---|---|
| **Scale Out** | Item scales down and disappears |
| **Fade Out** | Item fades out to transparent |
| **Scale & Fade Out** | Item scales down and fades out simultaneously |
| **Slide Out Left** | Item slides off to the left |
| **Slide Out Right** | Item slides off to the right |
| **Slide Up Out** | Item slides up out of view |
| **Slide Down Out** | Item slides down out of view |
| **Blur Out** | Item blurs and fades away |
| **Rotate Out** | Item rotates and scales down to disappear |


## How to tweak preset parameters

1. Choose an **Entry Animation** or **Exit Animation** preset.
2. Click **Tweak Parameters**.
3. Edit the property cards shown for that preset.

| Control | What it changes |
|---|---|
| **Start** | The first value in the preset motion. |
| **End** | The final value in the preset motion. |
| **Duration (frames)** | How many frames the preset takes. The displayed value ends in **f**. |
| **Easing** | The acceleration curve used by the preset. |

When you change a parameter, **(modified)** appears. Click **Reset to Defaults** to return that preset to its original values.

## How to add keyframes to a property

A keyframe stores a property value at a specific frame. Two or more keyframes on the same property create a smooth change between those values.

1. Select the item you want to animate.
2. Move the playhead to the frame where the change should start.
3. Open **Keyframes**.
4. Find the property you want under **Transform**, **Appearance**, **Speed**, **Volume**, or **Shape**.
5. Click the diamond beside the property. The tooltip changes based on state:
   - **Add keyframe (enables keyframing)** means the property has no keyframes yet.
   - **Add keyframe at current frame** means the property is already keyframed, but not at the current frame.
   - **Remove keyframe** means the current frame already has a keyframe.
6. Adjust the property value with the slider or number field.
7. Move the playhead to another frame.
8. Change the value again. If the property is already keyframed, the editor adds or updates the keyframe at that frame.

Supported property groups:

| Group | Properties |
|---|---|
| **Transform** | **Position X**, **Position Y**, **Scale**, **Scale X**, **Scale Y**, **Width**, **Height**, **Rotation** |
| **Appearance** | **Opacity**, **Blur**, **Brightness** |
| **Speed** | **Speed** |
| **Volume** | **Volume** |
| **Shape** | **Stroke Width**, **Fill Opacity**, **Dash Offset** |

If a text-like item uses automatic height, the height control may show **Auto** and the tooltip **Unavailable for auto sizing**.

## How to edit and remove keyframes

1. Open **Keyframes** on the selected item.
2. If the item has keyframes, yellow property chips appear, such as **Opacity (2)** or **Position X (3)**.
3. Click a property chip to show its **Keyframe List**.
4. In the list, click a row to jump the playhead to that keyframe.
5. Use the left and right arrow buttons to jump to the previous or next keyframe for that property.
6. Edit the number field in a row to change the keyframe value.
7. Use the easing dropdown in the row to change motion into the next keyframe.
8. Click the trash button to delete a keyframe.

If the selected property has no keyframes, the list says **No keyframes**.

## How easing and interpolation work

Easing controls how the value travels from one keyframe to the next. For example, a position change can move at a steady pace, accelerate, overshoot, bounce, or ease gently into place.

The **Keyframe List** easing menu includes:

| Easing labels |
|---|
| **Linear**, **Ease**, **Ease In**, **Ease Out**, **Ease In Out** |
| **In Quad**, **Out Quad**, **InOut Quad** |
| **In Cubic**, **Out Cubic**, **InOut Cubic** |
| **In Back**, **Out Back**, **InOut Back** |
| **In Elastic**, **Out Elastic** |
| **In Bounce**, **Out Bounce** |

Preset parameter editors use the expanded labels **Ease In Quad**, **Ease Out Quad**, **Ease In Out Quad**, **Ease In Cubic**, **Ease Out Cubic**, **Ease In Out Cubic**, **Ease Out Back**, **Ease In Back**, **Ease Out Expo**, **Ease In Expo**, **Ease Out Bounce**, **Ease In Bounce**, **Ease Out Elastic**, and **Ease In Elastic**.

## How to use keyframes on the timeline

1. Add keyframes from the **Keyframes** section.
2. Look at the timeline: each keyframed moment appears as a yellow diamond marker on the item or track row.
3. Click a marker to seek to that frame and select the item. The marker tooltip reads **Keyframe at frame [frame] - Click to seek**.
4. Open **Properties** to continue editing the selected item’s **Keyframes**.

## How to add sound effects with presets

1. Select an image and open **Style Template**.
2. Click **Sound Effects** to switch it **ON**.
3. Apply a **Style Template**, **Entry Animation**, or **Exit Animation**.
4. The editor adds matching audio items on a **Preset SFX** track. When sound effects are active, the section can show **(N SFX applied)**.
5. Click **Sound Effects** again to switch it **OFF** before applying presets if you want silent motion.

When **Vary** is **ON** for multiple selected images, the editor can alternate both motion choices and matching sounds. Presets with mapped sounds include **Scale In**, **Scale In (Bounce)**, **Fade In**, **Scale & Fade In**, **Zoom In**, **Slide Up**, **Slide Down**, **Slide In Left**, **Slide In Right**, **Blur In**, **Rotate In**, **Scale Out**, **Fade Out**, **Scale & Fade Out**, **Slide Out Left**, **Slide Out Right**, **Slide Up Out**, **Slide Down Out**, **Blur Out**, and **Rotate Out**.

## How to work with multiple selected items

1. Select multiple images or items that support bulk animation controls.
2. In **Animations**, the label can show **(All N)** to indicate all selected items are targeted.
3. Use **Stagger (frames between items)** to delay each selected item by a small number of frames.
4. Turn **Vary** **ON** to give each image a different animation.
5. Use **Copy** to copy animation settings from the first selected item.
6. Use **Paste to All** to apply the copied animation to the full selection.

## How to clear animations, keyframes, and effects

1. Open the selected item’s properties.
2. Click **Remove All Keyframes & Effects**. In bulk mode, the button reads **Remove All Keyframes & Effects (N)**.
3. Review the warning dialog **Remove All Keyframes & Effects?**.
4. The dialog summarizes **Content to be removed:** and may list **Keyframes: N/N items**, **Effects: N/N items**, or **Animations: N/N items**.
5. Click **Remove All** to confirm, or **Cancel** to keep everything.

The confirmation text notes that **You can undo this action with Ctrl+Z.**

## Tips & good to know

- Quick **Animations** presets and **Keyframes** can both affect the same item. If motion becomes hard to reason about, simplify one system first.
- **Entry Animation** keyframes start near the beginning of the item. **Exit Animation** keyframes are placed near the end of the item.
- Some preset durations are automatically shortened for very short clips so the animation does not take over the whole item.
- Slide-style presets adapt to the current canvas size, so the same preset works on portrait and landscape projects.
- In the **Keyframe List**, easing belongs to the keyframe you are leaving; it controls the movement into the next keyframe.
- Use **Linear** for constant motion, **Ease Out** for natural settling, **Out Back** for overshoot, and **Out Bounce** for playful motion.
- Timeline diamonds are navigation markers. To change values, open the item’s **Keyframes** controls.
- **Sound Effects** are applied when you apply or re-apply animation presets while the toggle is **ON**.
- If you remove all keyframes and effects, linked preset SFX are removed too.

## Related

- [Item Properties](07-item-properties.md)
- [Camera Effects](10-camera-effects.md)
- [Keyboard Shortcuts](14-keyboard-shortcuts.md)
