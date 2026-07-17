# Editor User Manual — Authoring Style Guide

This folder contains the **end-user manual** for the SkillTown video editor
(`SkillTown/app/content/[content_id]/components/video-editor-v2`). Every doc must
follow this guide so the set reads as one coherent manual.

## Audience & voice
- **Audience:** a creator using the editor in the browser. NOT a developer.
- **Voice:** second person ("you"), task-oriented, friendly, concise.
- **Never** mention file paths, component names, React, code, or internal APIs in
  the body. Describe what the user sees and clicks (buttons, panels, labels,
  menus, sliders, drag handles). Derive the user-facing labels from the source
  (button text, tooltips, aria-labels, headings) — quote the actual on-screen text.

## Every doc must have this structure
```
# <Feature Area Title>

> One-sentence summary of what this area lets the user do.

## Where to find it
Describe how the user opens/reaches this feature (which menu tab, panel, right-click,
toolbar button, or keyboard shortcut).

## What you can do
Bullet overview of the capabilities in this area.

## How to <task>  (one H2 per major task)
Numbered, step-by-step instructions. Include what the user sees at each step and
the result. Mention relevant options/sliders/toggles and what each does.

## Tips & good to know
Non-obvious behaviors, defaults, limits, gotchas, and best practices.

## Related
Links to sibling docs (relative .md links) the user may also need.
```

## Formatting rules
- Use `##`/`###` headings, numbered lists for procedures, bullets for options.
- Bold the **exact on-screen label** the first time you reference a control.
- Use tables for enumerations (e.g., a list of sliders and what they do).
- Keep paragraphs short (2–4 sentences).
- If a feature has keyboard shortcuts, list them.
- If you are unsure whether a capability is exposed to users, verify in the source
  (is there a visible button/menu entry?) before documenting it. Do not invent
  features that aren't wired to UI.

## Cross-file consistency
- Editor left rail = **menu panel** (tabs like Uploads, Images, Text, etc.).
- Right panel when an item is selected = **properties panel** (a.k.a. control panel).
- The horizontal strip at the bottom = **timeline**.
- The central preview = **canvas** / **player**.
- Use these consistent names across all docs.
