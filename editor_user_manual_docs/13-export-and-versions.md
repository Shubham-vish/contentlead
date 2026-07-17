# Exporting, Rendering & Versions

> **For humans, not agents.** This document describes how a person edits video by hand using the
> on-screen controls of the SkillTown video editor. It is **not** an AI skill or an automation API.
> If you are an AI agent, do **not** treat these steps as callable commands — for programmatic
> control use the agent skills/commands documented elsewhere (see `_Agent/AGENTS.md`).

> Save your project, render the finished video, download or open the result, and restore earlier snapshots when you need to go back.

## Where to find it

Use the top bar above the canvas:

- **Auto** and **Save** sit near the right side of the top bar.
- **Version Snapshots** is the clock/history button next to **Save**.
- **Export** is the download button near the far right.
- **Resize** is also in the top bar; use it before exporting when you need a different orientation.

## What you can do

- Save manually with **Save** or the **Ctrl+S** shortcut.
- Turn automatic saving on or off with **Auto**.
- Export as **MP4** or **JSON**.
- Pick an MP4 resolution preset before rendering.
- In the desktop app, choose **Local** or **Cloud** under **Render With**.
- Watch export progress, cancel a render, and download or open the finished video.
- Save up to 5 version snapshots and restore, rename, or delete them.

## How to save the project

1. Check the save area in the top bar. The button can show **Save**, **Saving...**, **Saved!**, or **Saved**.
2. Click **Save** when you have unsaved changes, or press **Ctrl+S**.
3. Wait for **Saved!** or the tooltip **All changes saved!**.
4. Leave **Auto** on if you want automatic saving while you work. While autosave is running, you may see **Saving...** and the tooltip **Autosaving your changes...**.

If the project is sample content, saving is blocked with **Sample content cannot be saved — duplicate it first**.

## How to choose export settings

1. Click **Export** in the top bar.
2. In **Export Video**, choose your settings.
3. For MP4 exports, use **Resize** before exporting if you need to change the video's orientation or canvas shape.
4. Click **Start Export** when the settings are ready.

| Setting | Options shown | What it does |
|---|---|---|
| **Format** | **MP4**, **JSON** | **MP4** renders a video. **JSON** downloads the project design data instead of rendering a video. |
| **Resolution** | **Source (no resize)** — **Authored canvas size** | Keeps the current canvas size. This is the default and preserves the size you built in the editor. |
| **Resolution** | **4K (2160p)** — **Largest — slow render** | Exports a larger MP4 while preserving the video's aspect ratio. |
| **Resolution** | **Full HD (1080p)** — **Recommended** | A good default for high-quality sharing. |
| **Resolution** | **HD (720p)** — **Smaller file** | Exports a smaller file for faster sharing or review. |
| **Resolution** | **SD (480p)** — **Quick preview** | Fastest low-resolution preview export. |
| **Render With** | **Local**, **Cloud** | Available in the desktop app for **MP4**. **Local** renders on your computer; **Cloud** uses the online renderer. |
| Quality / FPS | No separate picker is shown | The export uses the project frame rate. After export, the details show the final size and FPS, such as **30fps**. |
| Orientation | **16:9**, **9:16**, **1:1** from **Resize** | Orientation is controlled by the canvas size before export, not by a separate export-only setting. |

You may also see **⚡ Fast Export available**. If it says **Browser ready**, simple video, image, and caption timelines can encode directly in your browser. If it says **Fallback to standard**, the normal export path is used.

## How to export and download the finished video

1. Click **Export**.
2. Choose **MP4** under **Format**.
3. Choose a **Resolution** preset.
4. If you are in the desktop app, choose **Local** or **Cloud** under **Render With**.
5. Click **Start Export**.
6. The **Export Video** window opens and shows progress.
7. When you see **Export Complete**, use the available completion buttons:
   - **Download Video** downloads a browser/cloud result.
   - **Show in Finder** opens the local file location for a desktop local render.
   - **Copy URL**, **Open in browser**, and **Download** appear when a cloud video URL is available.

If files are still uploading, the export button shows **Waiting for 1 upload...** or **Waiting for 2 uploads...** and export is disabled until uploads finish.

## How to track render progress

1. After you click **Start Export**, watch the **Export Video** window.
2. The status badge can show **Starting New Export...**, **Connecting...**, **Starting...**, **In Queue**, **Processing**, **Rendering**, **Uploading**, **Fast Export (Browser)**, **Completed**, **Failed**, or **Cancelled**.
3. Use the large percentage and progress bar to track completion.
4. For detailed renders, the window can show **Rendered**, **Encoded**, **Stage**, **Elapsed**, and an estimated **remaining** time.
5. You can close the window when you see **You can close this window. The video will continue rendering.**
6. Reopen **Export** and click **View Progress** to return to the active render.
7. To stop a render, click **Cancel render**. If prompted, choose **Keep rendering** or **Yes, cancel**.

If export fails, the window shows **Export Failed** with **Close** and **Try Again**. If you cancelled it, it shows **Export Cancelled** and **This render was cancelled and no output was generated.**

## How to use recent renders

1. Click **Export**.
2. Look under **Recent** for earlier renders. If there are none, you see **No previous renders**.
3. Click a render row to open **Render Details**.
4. Use **Download Video**, **Show in Finder**, **Copy URL**, **Open in browser**, or **Download** when available.
5. Hover a render row and click the delete icon if you want to remove it from the recent list. The delete control is labeled **Delete render** or **Delete this render**.

## How to browse and restore versions

1. Click **Version Snapshots** in the top bar.
2. The **Snapshots** panel opens.
3. Click **+ Save Current** before a major change. While it is saving, the button reads **Saving...**.
4. If there are no saved snapshots, the panel says **No snapshots yet. Save one before a big change.**
5. Hover a snapshot to reveal actions:
   - **Restore** opens a confirmation dialog.
   - **Rename** lets you edit the snapshot label. Press Enter to save the name, or Escape to cancel editing.
   - **Delete** removes the snapshot.
6. When restoring, read **Restore Snapshot?** carefully. It warns: **Your current state will be lost unless you save a snapshot first.**
7. Click **Restore** to replace the current design, or **Cancel** to leave everything unchanged.

The footer shows how many snapshot slots are used, such as **3 of 5 snapshots used**.

## Tips & good to know

- Save before exporting so the render uses the latest project state.
- Use **Source (no resize)** when your canvas already matches the destination, such as a portrait short or square post.
- Use **Full HD (1080p)** for most final exports unless you specifically need **4K (2160p)**.
- If your project uses Remove Background, you may see **Remove Background needs the desktop app**. In the desktop app, switch **Render With** to **Local**; in the browser, use **Get Desktop App**.
- If **Export** shows a percentage or **Starting...**, a render is already active. Click the export menu and use **View Progress** instead of starting another render.
- Save a snapshot before large edits, restructures, or experimental changes.

## Related

- [Overview & Navigation](01-overview-and-navigation.md)
- [Media Library](02-media-library.md)
- [Timeline & Selection](06-timeline-and-selection.md)
- [Item Properties](07-item-properties.md)
- [Keyboard Shortcuts](14-keyboard-shortcuts.md)
