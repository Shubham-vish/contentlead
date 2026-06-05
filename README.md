# AI Video Editing Agent — Knowledge Base

This folder contains everything an AI agent needs to control the SkillTown Desktop video editor and perform advanced video editing operations.

## Structure

```
_Agent/
├── AGENTS.md              # Master guide: API endpoints, commands, workflows
├── scene-catalog.json     # 159 pre-built scene components (metadata)
├── scene-props.json       # Machine-readable prop schemas for all scenes
├── skills/                # Modular skill docs (loaded on demand via API)
│   ├── overview.md
│   ├── scenes-and-templates.md
│   ├── custom-scene-authoring.md
│   ├── animations-and-effects.md
│   ├── text-and-captions.md
│   ├── media-and-audio.md
│   ├── timeline-operations.md
│   ├── rendering.md
│   ├── ai-content-generation.md
│   ├── remotion/           # Deep Remotion knowledge
│   │   ├── SKILL.md        # Index
│   │   └── rules/          # Topic-specific rules
│   └── ...
└── reference/             # Archived planning docs and code samples
```

## How AI Agents Use This

1. **AGENTS.md** — Read first. Contains API connection, all commands, architecture.
2. **skills/** — Load specific skills based on the task (via `/api/skills/:name` endpoint).
3. **scene-catalog.json** — Browse 159 scenes by category, tags, description.
4. **skills/remotion/** — Deep Remotion knowledge (SKILL.md index + rules/ folder with 19 topic files).

## Relationship to Other Repos

| Repo | Role |
|------|------|
| `SkillTown` | Next.js video editor (the app UI + command executor) |
| `SkillTown-Desktop` | Electron wrapper (API server, media server, scene bundler) |
| `remotion-projects` | Advanced Remotion platform (scene components, templates) |
| `_EditingStyleDetails` | **This repo** — AI knowledge base + style reference |

The `_Pipelines/` folder (at repo root) contains Python orchestration code (reference implementations).
These show HOW to chain MCP tools + editor commands into automated workflows.
**Do not run the Python directly** — translate the patterns into MCP tool calls.
