# Keyboard Shortcuts

> **For humans — and for AI helping humans.** This document describes how a person edits video by
> hand using the on-screen controls of the SkillTown video editor. It is **not** an AI skill or an
> automation API, so if you are an AI agent, do **not** treat these steps as callable commands — for
> programmatic/automated editing use the agent skills and commands documented elsewhere (see
> `_Agent/AGENTS.md`). **You may, however, read this doc to answer a user's "how do I…" questions
> and walk them, step by step, through performing these actions themselves in the editor UI.**

> Use keyboard shortcuts to move faster through playback, selection, editing, timeline navigation, project saving, and shortcut help.

## Where to find it

Open the editor and look in the timeline toolbar for the button with the tooltip **Keyboard shortcuts (?)**. Click it to open **Keyboard shortcuts**.

You can also press `?` anywhere in the editor, as long as you are not typing in a text field, to open or close **Keyboard shortcuts**. The dialog includes **Search shortcuts…**, shortcut rows, and customization controls such as **Change shortcut**, **Save**, **Cancel**, **Reset to default**, and **Reset all**.

## What you can do

- View all 45 registered shortcut actions in **Keyboard shortcuts**.
- Search by action name, description, or key combo with **Search shortcuts…**.
- Customize a shortcut with **Change shortcut**.
- Resolve a duplicate binding when the dialog shows **Conflicts with** and **Replace**.
- Return one shortcut to its default with **Reset to default**.
- Return every customized shortcut to its default with **Reset all**.

## How to open the in-app shortcuts help

1. In the timeline toolbar, click **Keyboard shortcuts (?)**.
2. Or press `?` while you are not typing.
3. The **Keyboard shortcuts** dialog opens.
4. Use **Search shortcuts…** to filter the list.
5. Press `?` again, click outside the dialog, or use the dialog close control to return to editing.

## How to read shortcut keys

The shortcut dialog adapts modifier labels to your computer:

| Source key | Mac label | Windows/Linux label |
|---|---|---|
| `Mod` | `⌘` | `Ctrl` |
| `Alt` | `⌥` | `Alt` |
| `Shift` | `⇧` | `Shift` |
| `Ctrl` | `⌃` | `Ctrl` |
| `ArrowLeft` | `←` | `←` |
| `ArrowRight` | `→` | `→` |

In the tables below, `⌘ Z / Ctrl+Z` means press `⌘ Z` on Mac or `Ctrl+Z` on Windows/Linux. Alternate shortcuts are shown in the same row when the editor accepts more than one key combo.

## How to use History & Selection shortcuts

| Shortcut | Action |
|---|---|
| `⌘ Z` / `Ctrl+Z` | **Undo** |
| `⌘ ⇧ Z`, `⌘ Y`, or `⌃ Y` / `Ctrl+Shift+Z` or `Ctrl+Y` | **Redo** |
| `⌘ A` / `Ctrl+A` | **Select all timeline items** |
| `Escape` | **Deselect all** |
| `⌥ ←` / `Alt+←` | **Select previous item on track** |
| `⌥ →` / `Alt+→` | **Select next item on track** |
| `⌘ D` / `Ctrl+D` | **Duplicate selected items** |
| `⌘ C` / `Ctrl+C` | **Copy selected items** |
| `⌘ X` / `Ctrl+X` | **Cut selected items** |
| `⌘ V` / `Ctrl+V` | **Paste (items or clipboard image/video)** |
| `Delete` or `Backspace` | **Delete selected items** |
| `⇧ Delete` or `⇧ Backspace` / `Shift+Delete` or `Shift+Backspace` | **Ripple delete (close the gap)**<br>Delete selected clip(s) AND shift every later clip on the same track left by the deleted duration so no gap remains. |

## How to use Playback shortcuts

| Shortcut | Action |
|---|---|
| `Space` | **Play / Pause** |
| `J` | **Play backward (J)**<br>Press again to speed up reverse (2x, 3x, 4x) |
| `K` | **Pause (K)** |
| `L` | **Play forward (L)**<br>Press again to speed up (2x, 3x, 4x). Standard JKL shuttle. |
| `←` | **Step 1 frame back** |
| `→` | **Step 1 frame forward** |
| `⇧ ←` / `Shift+←` | **Step 10 frames back** |
| `⇧ →` / `Shift+→` | **Step 10 frames forward** |
| `Home` | **Jump to start** |
| `End` | **Jump to end** |
| `⇧ L` / `Shift+L` | **Toggle loop playback** |

## How to use Editing shortcuts

| Shortcut | Action |
|---|---|
| `Q`, `⌘ B`, or `⌘ \` / `Q`, `Ctrl+B`, or `Ctrl+\` | **Split at playhead (current mode)** |
| `A` | **Split — keep Left segment selected** |
| `R` | **Split — keep Right segment selected** |
| `B` | **Split — keep Both segments selected** |
| `G` | **Merge adjacent split clips (rejoin)**<br>Rejoin the selected clip(s) with a touching same-source neighbour created by a previous Split, back into a single clip. |
| `W` or `⇧ Q` / `W` or `Shift+Q` | **Split + cut at playhead (current cut mode)**<br>Splits the selected clip(s) at the playhead and deletes one side of the cut (only the segments just generated, scoped to the current selection). Side is set by the Split + Cut mode dropdown. |
| `⇧ A` / `Shift+A` | **Split + keep LEFT — delete right segment after split** |
| `⇧ R` / `Shift+R` | **Split + keep RIGHT — delete left segment after split** |
| `⇧ B` / `Shift+B` | **Blade — split ALL items at playhead** |
| `[` | **Trim start of selected item(s) to playhead** |
| `]` | **Trim end of selected item(s) to playhead** |
| `,` | **Nudge selected items left by 1 frame** |
| `.` | **Nudge selected items right by 1 frame** |
| `S` | **Toggle magnetic snapping** |
| `M` | **Mute / unmute track of selected item** |
| `⇧ M` / `Shift+M` | **Add marker at playhead** |
| `⇧ F` / `Shift+F` | **Freeze frame — insert still image at playhead** |

## How to use Timeline & View shortcuts

| Shortcut | Action |
|---|---|
| `⌘ =` or `⌘ +` / `Ctrl+=` or `Ctrl++` | **Zoom timeline in** |
| `⌘ -` / `Ctrl+-` | **Zoom timeline out** |
| `⇧ Z` / `Shift+Z` | **Zoom to fit all content** |
| `⌘ S` / `Ctrl+S` | **Save project** |

## How to use Help shortcuts

| Shortcut | Action |
|---|---|
| `?` | **Open keyboard shortcuts dialog** |

## How to customize a shortcut

1. Open **Keyboard shortcuts**.
2. Find the action you want, or use **Search shortcuts…**.
3. Click **Change shortcut** on that row.
4. When you see **Press shortcut…**, press the new key combo.
5. If there is no conflict, click **Save**.
6. If the dialog shows **Conflicts with**, either choose another key combo or click **Replace**.
7. To undo a custom shortcut later, click **Reset to default** on that row. To clear all custom shortcuts, click **Reset all**.

## Tips & good to know

- Most editor shortcuts do not run while you are typing in text fields, caption editors, or other editable text areas.
- `Space` is reserved for **Play / Pause** when you are not typing, so it does not scroll panels or toggle focused buttons.
- Holding `←` or `→` can accelerate frame stepping. Holding `Shift` uses the larger frame-step shortcut.
- If you customize an action, its alternate default shortcuts are replaced by your custom shortcut until you reset it.
- Shortcut customizations are saved in your browser, so another browser or device can still use the defaults.

## Related

- [Media Library](02-media-library.md)
- [Scenes, Templates & Styles](03-scenes-templates-styles.md)
- [Text & Captions](05-text-and-captions.md)
