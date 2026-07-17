# Custom Scenes & AI Assistance

> **For humans, not agents.** This document describes how a person edits video by hand using the
> on-screen controls of the SkillTown video editor. It is **not** an AI skill or an automation API.
> If you are an AI agent, do **not** treat these steps as callable commands — for programmatic
> control use the agent skills/commands documented elsewhere (see `_Agent/AGENTS.md`).

> Create custom animated scenes with AI, preview them live, add them to the timeline, and use the editor-wide assistant to request video edits.

## Where to find it

Open the menu panel and click **Scenes**. In the Scenes panel, choose **AI Generate** to open the custom scene workspace. Use **Library** if you want to browse existing scenes first, then switch back to **AI Generate** when you want to create or edit a custom scene.

For whole-video help, click **AI Edit** in the menu panel, or use the edge button labeled **Open AI Editor**. This opens the **AI Editor** assistant panel.

## What you can do

- Generate a scene from a natural-language prompt with **AI Chat**.
- Build a prompt for an outside assistant with **External AI**, then paste the generated result back into the editor.
- Preview a scene live in **Preview**, **Full**, or a floating preview window.
- Edit the generated source in **Code**, use **Auto** compile, or click **Run** manually.
- Set scene **Name**, **Frames**, **Landscape**, **Portrait**, and **Speed**.
- Add the finished scene with **Add to Timeline** or export it with **Render MP4**.
- Use **AI Edit** / **AI Editor** to ask the editor-wide assistant for timeline-aware video edits.

## How to open the custom scene workspace

1. Click **Scenes** in the menu panel.
2. Click **AI Generate** at the top of the Scenes panel.
3. The custom scene workspace opens with controls for **AI Chat**, **External AI**, **Templates**, **Preview**, **Code**, **Add to Timeline**, and **Render MP4**.
4. Optional: click **Templates**, search with **Search templates...**, then choose a starter under **Starters** or a saved item under **Saved**.

## How to generate a scene with AI Chat

1. In **AI Generate**, click **AI Chat**.
2. If the assistant is new, you may see **Remotion Scene Creator** with the description “Describe the animated scene you want and the AI will generate Remotion code you can preview and add to the timeline.”
3. Click **Create a Scene** or type in the chat box.
4. Describe the scene you want. The built-in tips are: “Describe the animation or visual you want,” “Mention colours, fonts, or layout preferences,” and “Ask for charts, motion backgrounds, text reveals, and more.”
5. When the AI updates the scene, review the **Preview** and **Code** areas.
6. Use **Float** if you want the chat to float freely, or **Dock** to return it to the panel.

## How to generate with External AI

1. Click **External AI**.
2. Choose a size preset such as **Landscape — 16:9**, **Portrait / Reel — 9:16**, **Square — 1:1**, **Half Screen Side — 960×1080**, **Half Screen Stack — 1080×960**, or **HD — 1280×720**.
3. Choose a duration preset: **3s**, **5s**, **8s**, **10s**, or **15s**.
4. In **Describe the scene**, type your request. The placeholder example is: “e.g. A staggered list of 5 benefits of meditation with purple gradient background, spring animations”.
5. Optionally open **Scene Type: Auto-detect** and pick scene types, then choose **Complexity:** **Simple**, **Medium**, or **Advanced**.
6. Click **Copy Prompt**. The panel shows **Prompt** and lets you **Re-copy** it.
7. Paste the prompt into ChatGPT, Claude, or Gemini, then paste the result into **Paste AI-generated code**.
8. If the result shows **✓ Valid**, click **Use This Code**. If it shows **✕ Errors** or **Errors found**, click **Copy Fix Prompt** and ask the external assistant to fix it.

## How to preview and edit a custom scene

| Control | What it does |
|---|---|
| **Name** | Renames the scene before you add it. |
| **Frames** | Sets the scene duration in frames. |
| **Landscape** / **Portrait** | Switches the preview shape. |
| **Speed** | Changes preview playback speed. |
| **Auto** | Rebuilds the preview automatically after edits. |
| **Run** | Rebuilds manually when **Auto** is off. |

1. Use **Name** to rename the scene.
2. Use **Frames** to set duration in frames. The time summary at the bottom shows frames, seconds, orientation, and size.
3. Use **Landscape** or **Portrait** to switch the preview shape.
4. Use **Speed** to adjust playback speed.
5. Open **Preview** to play the scene. If there is no valid scene yet, you may see **Write code to see preview** or an error message.
6. Click **Float** in the preview header to undock it. The panel then says **Preview is floating — drag it anywhere** and **Click here to dock back**.
7. Click **Full** for fullscreen preview. Use **Close** to exit.
8. Edit the generated source in **Code**. Keep **Auto** on for automatic updates, or turn it off and click **Run**.
9. Use **Copy** to copy the current source, or **Expand editor** for a larger editor with **Code Editor** and **Live Preview** side by side.

## How to add or render the scene

1. Move the playhead to where you want the scene to start.
2. Make sure the preview is valid. The status badge may show **Ready** or **Error**.
3. Click **Add to Timeline**. While it is working, the button shows **Adding...**.
4. In the expanded editor, you can use **Add to Timeline & Close**.
5. To export only the scene, click **Render MP4**. During export you may see **Checking browser support…** and **Rendering…**.
6. When rendering finishes, click **Download MP4**. If rendering fails, use **Retry** or **Dismiss**.

## How to use the editor-wide AI assistant

1. Click **AI Edit** in the menu panel, or click **Open AI Editor** on the left edge.
2. The **AI Editor** panel opens. Use **Float** to undock it, **Dock** to return it, or **Close AI Editor** / **Close AI Panel** to close it.
3. Type in the box labeled **Type a message...** and click the **Send message** button.
4. Use **Upload file** to attach a file, **Add state property** to insert a `#` context reference, **Mention agent** to insert an `@` agent mention, and **Insert custom prompt** to insert a saved prompt.
5. Use **Show settings** for model, workflow, and assistant controls. Use **Hide settings** to collapse them.
6. Use **Thread history** to return to earlier conversations, **Start new chat** for a fresh thread, and **Delete current thread** only when you no longer need that conversation.
7. Use **Enter fullscreen** when you want a larger assistant view.

## Tips & good to know

- **Add to Timeline** places the custom scene at the current playhead position.
- **AI Chat** and **External AI** are mutually exclusive side panels; opening one hides the other.
- If **Auto** is on, edits update after a short pause. If you want more control, turn **Auto** off and use **Run**.
- The **AI Editor** assistant is separate from **AI Chat** in custom scenes: use **AI Chat** for one scene, and **AI Edit** for the whole video.
- If you see an error, copy it with the error copy control or use **Copy Fix Prompt**, then ask the assistant to repair the scene before adding it.

## Related

- [Scenes & Templates](03-scenes-and-templates.md)
- [Timeline Editing](02-timeline-editing.md)
- [Exporting & Rendering](05-exporting-and-rendering.md)
