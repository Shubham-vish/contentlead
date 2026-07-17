# Timeline & Selection

> **For humans, not agents.** This document describes how a person edits video by hand using the
> on-screen controls of the SkillTown video editor. It is **not** an AI skill or an automation API.
> If you are an AI agent, do **not** treat these steps as callable commands — for programmatic
> control use the agent skills/commands documented elsewhere (see `_Agent/AGENTS.md`).

> Use the timeline to read your edit, select clips, move them together, trim timing, split cuts, manage tracks, and copy or paste timeline items.

## Where to find it

The **timeline** is the horizontal strip at the bottom of the editor, under the canvas/player. It contains the time ruler, playhead, track lanes, clip blocks, track controls, and the timeline toolbar.

Use the timeline directly with your mouse, trackpad, and keyboard. Click **Keyboard shortcuts (?)** in the timeline toolbar to view or change shortcuts; the dialog is titled **Keyboard shortcuts** and includes **Search shortcuts…**, **Change shortcut**, **Save**, **Replace**, and **Reset to default**.

## What you can do

- Read your edit using the ruler, playhead, current time, total duration, tracks, markers, waveforms, keyframes, and deletion overlays.
- Select one clip, add/remove individual clips from the selection, select a range, select all items, or box-select clips.
- Drag one selected clip or move multiple selected clips together while preserving their spacing.
- Trim clip edges by dragging handles, or trim selected clips to the playhead with shortcuts.
- Use **Split** and **Split+Cut** at the playhead with selectable split modes.
- Delete, ripple delete, duplicate, copy, cut, and paste timeline items.
- Drag clips across tracks, drop into gaps to create new tracks, reorder tracks, resize track rows, and delete tracks.
- Turn magnetic snapping on/off, zoom the timeline, scroll around long edits, and jump back to the playhead.

## How to read the timeline

1. Look at the ruler at the top of the timeline.
   - The tick labels show timeline time at the current zoom level.
   - Click the ruler to seek the playhead to that time.
   - Drag the ruler left or right to scroll through the edit.

2. Use the pink playhead to see the current frame.
   - Drag the playhead line or knob to scrub.
   - Click the current timecode in the toolbar to type a precise time, then press Enter. Press Escape to cancel.

3. Read the duration display beside the current time.
   - It shows current time, a divider, and the full project duration.

4. Read tracks from top to bottom.
   - Higher tracks visually sit above lower tracks in the final video.
   - Track rows can show clips, audio waveforms, disabled/muted clip badges, transition handles, keyframe diamonds, and overlays.

5. Use markers and overlays.
   - **Add marker at playhead (Shift+M)** adds a marker on the ruler.
   - Double-click the ruler to add a marker at that time.
   - Click a marker to seek to it.
   - Right-click a marker to open **Edit marker label (leave blank to delete):**.
   - Keyframe diamonds show **Keyframe at frame [number] - Click to seek**.
   - Deleted transcript ranges can appear as **Applied deletion (removed from editor)** or **Pending deletion (not yet applied)**.

## How to zoom and scroll

1. Use the zoom controls at the right side of the toolbar.
   - **Zoom timeline out** reduces detail.
   - **Zoom timeline in** increases detail.
   - **Zoom to fit all content** fits the whole edit into view.
   - Drag the zoom slider for continuous zoom changes.

2. Use shortcuts from **Keyboard shortcuts**.

   | Action label | Default shortcut |
   |---|---:|
   | **Zoom timeline in** | Mod+= |
   | **Zoom timeline out** | Mod+- |
   | **Zoom to fit all content** | Shift+Z |

3. Use the mouse or trackpad on the timeline.
   - Plain scroll moves through tracks vertically. If there is no vertical overflow, it scrolls through time.
   - Shift+scroll moves horizontally through time.
   - Ctrl/Command+scroll zooms around the cursor position.

4. If you manually scroll away during playback, click **Jump to playhead** to re-center and resume playhead follow.

## How to select one item

1. Click a clip in the timeline.
2. The selected clip receives a highlighted outline.
3. The properties panel updates for that clip.
4. Click empty timeline space to clear the selection, or press Escape for **Deselect all**.

If the clip is on a locked or hidden track, it cannot be selected or moved until the track is unlocked or shown.

## How to select multiple items

1. Ctrl-click or Command-click clips to add or remove individual clips from the selection.
2. Shift-click another clip to select the range between the last selected clip and the clicked clip.
3. Ctrl+Shift-click or Command+Shift-click to add a range to the current selection.
4. Drag a box/marquee over timeline clips to select multiple clips at once.
5. Use **Select all timeline items** to select every selectable timeline item.

Useful selection shortcuts:

| Action label | Default shortcut |
|---|---:|
| **Select all timeline items** | Mod+A |
| **Deselect all** | Escape |
| **Select previous item on track** | Alt+ArrowLeft |
| **Select next item on track** | Alt+ArrowRight |

You can also use a track’s select button. Its tooltip changes between **Select all [n] item(s)** and **Deselect all items**, and notes **(Ctrl+click to add)**.

## How to move items

1. Select one clip, then drag it left or right to change its time.
2. Drag it up or down to move it to another compatible track.
3. If the target time is open, the clip lands there.
4. If the target track would overlap another clip, the editor creates or uses a nearby compatible track instead of overwriting existing clips.
5. If a green drop preview appears in a valid gap, release to place the clip there. If the preview is red, that lane cannot accept the clip at that time.

To move multiple clips together:

1. Select all clips you want to move.
2. Drag any selected clip.
3. The whole selection moves together, keeping the spacing between selected clips.
4. If the group overlaps existing clips on the destination track, the moved group is kept together and placed on a new compatible track.

To duplicate by dragging, hold Alt/Option while dragging a selected clip or multi-selection. The original stays in place and the dragged copy lands where you release.

## How to trim and resize clips

1. Select a clip once.
2. After it is selected, drag its left or right edge handle.
3. Drag the left edge to change the start.
4. Drag the right edge to change the end.
5. Release to commit the trim.

For video and audio clips, trimming changes which part of the source media is used. For visual/timeline-only items, resizing changes how long the item stays on the timeline. The trim is clamped so you cannot trim through neighboring clips on the same track.

Keyboard trim shortcuts:

| Action label | Default shortcut |
|---|---:|
| **Trim start of selected item(s) to playhead** | [ |
| **Trim end of selected item(s) to playhead** | ] |
| **Nudge selected items left by 1 frame** | , |
| **Nudge selected items right by 1 frame** | . |

## How to split, split-cut, and merge

1. Select the clip or clips you want to cut.
2. Move the playhead inside the selected clip range.
3. Click **Split** to cut at the playhead.
4. Use **Choose split selection mode** to open **Split Selection Mode**.
5. Pick one of the split selection results:

   | Mode | What it means |
   |---|---|
   | **Select Both** | Keep both new segments selected. |
   | **Select Right** | Select only the new right segment. |
   | **Select Left** | Keep only the left segment selected. |

6. Click **Split+Cut** when you want to split and immediately delete one side.
7. Use **Choose split + cut mode** to open **Split + Cut Mode**.
8. Pick **Keep Left** or **Keep Right**.

Related shortcut labels:

| Action label | Default shortcut |
|---|---:|
| **Split at playhead (current mode)** | Q |
| **Split — keep Left segment selected** | A |
| **Split — keep Right segment selected** | R |
| **Split — keep Both segments selected** | B |
| **Split + cut at playhead (current cut mode)** | W |
| **Split + keep LEFT — delete right segment after split** | Shift+A |
| **Split + keep RIGHT — delete left segment after split** | Shift+R |
| **Blade — split ALL items at playhead** | Shift+B |
| **Merge adjacent split clips (rejoin)** | G |

If splitting fails, the editor explains whether the playhead is outside the clip or exactly on a clip edge. Move the playhead at least one frame inside the clip and try again.

## How to delete and ripple delete

1. Select one or more clips.
2. Click the delete button; its tooltip is **Delete selected clip(s) (Del / Backspace)**.
3. Or press the shortcut for **Delete selected items**.

Use **Ripple delete (close the gap)** when you want to remove selected clips and pull later clips on the same track left to close the empty space.

| Action label | Default shortcut |
|---|---:|
| **Delete selected items** | Delete / Backspace |
| **Ripple delete (close the gap)** | Shift+Delete / Shift+Backspace |

Locked tracks are skipped, so locked items are protected from delete and ripple delete.

## How to duplicate, copy, cut, and paste

1. Select the timeline items you want.
2. Use these shortcuts from **Keyboard shortcuts**:

   | Action label | Default shortcut |
   |---|---:|
   | **Duplicate selected items** | Mod+D |
   | **Copy selected items** | Mod+C |
   | **Cut selected items** | Mod+X |
   | **Paste (items or clipboard image/video)** | Mod+V |

3. Or click the toolbar clone button. Its tooltip is **Clone selected clip(s)** when clips are selected, and **Select a clip to clone** when nothing is selected.
4. Pasted timeline items keep their relative timing from the copied items and are selected after paste.
5. If the original track can accept the pasted items without conflict, they are placed there. Otherwise, the editor creates or uses a compatible track.

You can also paste image/video media from your system clipboard into the editor, unless your cursor is inside a text field.

## How to reorder and manage tracks

1. Use the left-side track controls beside each track.
2. Click **Pick track color** to color-code a track.
3. Click **Hide track** / **Show track** to hide or show all items in a track.
4. Click **Mute track** / **Unmute track** for audio-capable tracks.
5. Click **Solo track (mute others)** / **Unsolo track** for audio-capable tracks.
6. Click **Lock track (prevent edits)** / **Unlock track** to protect a track from selection, drag, trim, and delete edits.
7. Open the three-dot track menu for:
   - **Rename track**
   - **Select all items ([n])** / **Deselect all items**
   - **Track role: Default**, **Track role: 🎤 Voice**, or **Track role: 🎵 Music**
   - **Move track up** and **Move track down**
   - **Link with...**, **No other tracks available**, **Unlink track**, and **Unlink all**
   - **Select for transcription**
   - **Show audio waveform** / **Hide audio waveform**
   - **Delete track**
8. Drag the **Drag to reorder track** handle to reorder tracks directly.
9. Drag **Resize track controls panel** to change the width of the track controls. Double-click it for **Drag to resize · double-click to auto-fit** behavior.
10. Click **Collapse track controls** or **Expand track controls** to show or hide the full track-control panel.

To add a new track, drag a clip between tracks, above the first track, or below the last track until the green horizontal line appears, then release. The editor creates a new compatible track at that position and moves the clip into it.

## How to use snapping

1. Click the magnet button in the timeline toolbar.
2. The tooltip shows either **Magnetic snapping: ON — click to disable** or **Magnetic snapping: OFF — click to enable**.
3. When snapping is on, dragged clip edges snap to nearby clip edges and valid gaps.
4. Single clips can snap into open spaces on a compatible track.
5. Multi-item drags snap as a group, so the selected items keep their spacing.

If a drop would overlap, the editor avoids damaging existing layout by placing the dragged item or group on a new compatible track.

## How to change track display and playback feel

1. Click **Track size: [size]** to open **Track Size**.
2. Choose **Small**, **Normal**, **Large**, or **X-Large**.
3. Click **Waveforms on video clips: ON — click to hide** or **Waveforms on video clips: OFF — click to show** to show or hide video clip waveforms globally.
4. For an individual track, use **Show audio waveform** or **Hide audio waveform** in the track menu.
5. Click **Playback feel** to tune arrow-key scrubbing.
6. In **Playback feel**, use **Ramp speed**, **Max step (Arrow)**, and **Max step (Shift+Arrow)**. Click **Reset** to restore defaults.

## Tips & good to know

- The top track is visually in front. Put text and captions above background video/image/scene tracks when you need them visible.
- Press **?** to open **Keyboard shortcuts**. The footer says: **Tip: bindings are saved to this browser. Press ? anywhere to reopen.**
- The toolbar shows **Select a clip to delete** and **Select a clip to clone** when no clip is selected.
- **Split** and **Split+Cut** require the playhead to be inside the selected clip, not exactly on its start or end.
- Use Alt/Option while dragging to duplicate by drag. Use Shift+Alt/Option-click on a track area to select clips to the right on that track.
- Locked tracks protect items from timeline edits. Hidden tracks are also not directly editable.
- Empty tracks may disappear automatically after their last item is moved or deleted.
- Paste preserves copied item timing; use duplicate or drag after paste if you need a different position.

## Related

- [Overview & Navigation](01-overview-and-navigation.md)
- [Media Library](02-media-library.md)
- [Text & Captions](05-text-and-captions.md)
