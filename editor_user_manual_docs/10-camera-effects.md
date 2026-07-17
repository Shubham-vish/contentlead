# Camera Effects

> **For humans, not agents.** This document describes how a person edits video by hand using the
> on-screen controls of the SkillTown video editor. It is **not** an AI skill or an automation API.
> If you are an AI agent, do **not** treat these steps as callable commands — for programmatic
> control use the agent skills/commands documented elsewhere (see `_Agent/AGENTS.md`).

> Add cinematic camera movement to a selected clip, including 3D zoom, pan, tilt, roll, and zooming into a chosen point of interest.

## Where to find it

1. Select a supported video, image, or scene/template item on the canvas or timeline.
2. Open the properties panel for the selected item.
3. For video items, open the **Effects** tab, then use **3D Camera** or **Zoom to Spot**.
4. For image and scene/template items, look for the **3D Camera** and **Zoom to Spot** sections in the properties panel.
5. Turn on the switch in the section header. The switch shows **ON** when the effect is active and **OFF** when it is inactive.

## What you can do

- Use **3D Camera** to add preset camera movement such as **Push In**, **Pull Out**, **Ken Burns**, orbit, tilt, slide, and hover moves.
- Use **Zoom to Spot** to punch into, hold on, or pull back from a chosen point on the clip.
- Set a focus point visually with the picker, or turn on **Show Overlay Markers** and use the canvas overlay.
- Adjust movement timing with **Start**, **Duration**, **Frame**, **Hold**, and **Transition** controls.
- Adjust intensity with **Strength**, **Zoom**, **Scale**, **Pan ↔**, **Tilt ↕**, **Roll ↻**, **Pan X %**, **Pan Y %**, **Depth**, and **Default Zoom**.
- Edit individual camera keyframes in **Adjust**, **Sequence**, and **Advanced**.

## How to add a 3D camera movement preset

1. Select the clip you want to animate.
2. Open **3D Camera** and switch it **ON**.
3. Expand **Pick a movement preset**.
4. Click a preset:

| Preset | What it does |
|---|---|
| **Orbit Right** | Smooth orbit from left to right. |
| **Orbit Left** | Smooth orbit from right to left. |
| **Tilt Up** | Vertical tilt from low to high. |
| **Tilt Down** | Vertical tilt from high to low. |
| **Push In** | Dolly zoom forward with subtle tilt. |
| **Pull Out** | Dolly zoom backward, scene reveals. |
| **Dramatic** | Multi-point cinematic sweep with zoom. |
| **Hover** | Subtle floating motion loop. |
| **Ken Burns** | Slow zoom + gentle pan drift. |
| **Slide Right** | Pan from left to right. |
| **Slide Left** | Pan from right to left. |
| **Hold / Pause** | Freeze at current values for a segment. |

5. The movement appears under **Your moves** and as bars in **Animation Timeline**.
6. Expand a move in **Your moves** to adjust **Strength**, **Start**, or **Duration**.
7. Use **Clear all** to remove all preset moves from **Your moves**.

## How to adjust the camera at the current frame

1. Open **3D Camera** and choose **Adjust**.
2. Move the playhead to the frame you want to change.
3. In **Tweak the current frame**, use the visual pad:
   - Drag to pan.
   - Scroll to zoom. Use **Scroll-zoom** to turn that behavior on or off.
   - Drag the edge chips labeled **Pan**, **Tilt**, and **Roll** to rotate the camera.
   - Double-click the pad to reset pan and zoom.
   - Use arrow keys to nudge.
4. Use the sliders **Pan ↔**, **Tilt ↕**, and **Roll ↻** for precise rotation.
5. Click **Set keyframe at playhead** to save the current camera position. If a keyframe is already there, the button changes to **Keyframe set — click to remove**.
6. Use **Reset** to reset perspective rotation, or **Reset at Playhead** in **Advanced** to reset the current frame’s camera values.

The pad shows whether you are editing **on keyframe · edits update** or an **interpolated · edits add new** point.

## How to chain multiple camera movements

1. Open **3D Camera** and choose **Sequence**.
2. Under **Add step**, click one or more movement presets.
3. Change each step’s duration with its number slider.
4. Use the up/down arrows to reorder steps, or the X button to remove one.
5. Click **Even** if you want the sequence steps distributed evenly.
6. Click **Apply Sequence**.

Applying a sequence replaces the current 3D camera moves on the selected clip.

## How to zoom to a point of interest

1. Select the clip.
2. Open **Zoom to Spot** and switch it **ON**.
3. In **Zoom Targets**, click the large picker to place the blue target dot on the area you want viewers to focus on.
4. Scroll on the picker to adjust zoom. The helper text explains: **1×** = no zoom, **<1×** = pull back (reveal), and **>1×** = punch in.
5. Set the new target controls:

| Control | What it changes |
|---|---|
| **Zoom** | How far the camera punches in or pulls back. |
| **Hold** | How long the camera stays on the target. |
| **Transition** | How long the move takes to enter and exit the target. |

6. Click **Add zoom at playhead** to create the zoom target at the current playhead time.
7. Use **Animation Timeline** to preview the target’s timing. Click a bar to edit it, drag the body to move it, or drag the edges to change its start/end timing.
8. Expand a target row to edit **Frame**, **Zoom**, **X %**, **Y %**, **Hold**, **Transition**, and **Easing**.

## How to set a focus point on the canvas

1. In **3D Camera** > **Advanced**, turn on **Show Overlay Markers**.
2. The canvas can show focus point and rotation indicators for the selected item.
3. Hold Alt while the item is selected. The canvas shows **Click to place focus point**.
4. Click the canvas where you want the focus point.
5. If a zoom is active at the current time, the click moves that focus point. Otherwise, it creates a new focus point with the default zoom behavior.

You can also set the same point from **Zoom to Spot** with the large picker. That is usually the most direct workflow because it shows the target, zoom amount, and timing controls together.

## How to fine-tune keyframes and easing

1. Open **3D Camera** and choose **Advanced**.
2. Use **Scale** for zoom keyframes, **Rotation** for 3D orientation, and **Position** for pan keyframes.
3. Click **Add keyframe** in a channel to add a keyframe at the playhead. Click **Remove** to remove one at the same playhead position.
4. Use **Previous keyframe** and **Next keyframe** to jump between keyframes.
5. Edit **Easing** to change how the camera accelerates between keyframes.

| Easing option | Feel |
|---|---|
| **Linear** | Constant speed. |
| **Ease In** | Starts slow. |
| **Ease Out** | Ends slow. |
| **Ease In Out** | Smooth start and end. |
| **Cubic In** | Aggressive slow start. |
| **Cubic Out** | Aggressive slow end. |
| **Quart In** | Very slow start. |
| **Quart Out** | Very slow end. |
| **Overshoot** | Overshoots then settles. |
| **Bounce** | Overshoot both ends. |
| **Spring** | Elastic spring effect. |
| **Snap** | Quick stop. |

6. Use **Animation Timeline** and the keyframe list to select, drag, duplicate, mute, or delete keyframes.
7. Use **Mute (keep values)** when you want to temporarily disable a keyframe or zoom without losing its settings. Use **Enable** to restore it.
8. Use **Clear All** to remove all camera keyframes for the selected clip.

## Tips & good to know

- **3D Camera** and **Zoom to Spot** are separate switches. You can use either one alone or combine them.
- **Zoom to Spot** creates focus-point zooms. It targets a point, not a draggable rectangular zoom region. **3D Camera** creates scale, rotation, and position keyframes.
- The editor currently exposes zoom, pan, tilt, roll, focus points, preset movement, sequences, and easing. It does not expose a separate named Shake preset or BREATHE control in this UI.
- Lower **Depth** values make perspective feel stronger; higher values feel flatter and more subtle.
- **Default Zoom** changes the base zoom before other camera keyframes are added on top.
- **Animation Timeline** uses clip-relative time. Moving the clip on the main timeline does not change where camera keyframes sit inside that clip.
- Keyboard shortcuts in this area: Escape deselects an active zoom target; Delete or Backspace deletes the selected zoom target; arrow keys nudge inside the camera pad.

## Related

- [Scenes, Templates & Styles](03-scenes-templates-styles.md)
- [Timeline editing](04-timeline-editing.md)
- [Effects](09-effects.md)
