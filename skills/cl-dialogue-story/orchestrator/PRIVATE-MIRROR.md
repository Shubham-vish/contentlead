# Personal configuration — outside the public skill

This legacy filename is retained so existing links still resolve. It is not a
recipe to force-add ignored files, mirror an entire working tree, or commit/push
private assets from a public skill directory.

## Public setup

The public distribution supplies generic examples and needs no personal formula
Markdown files. Copy `config.example.json` and `scripts/example.dialogue.json`
to an existing user-owned private directory, then edit those copies. Keep voices,
art, generated URLs and working scripts outside the public skill.

From the skill root, a real run uses explicit private paths:

```bash
node orchestrator/run.mjs /absolute/private/path/story.dialogue.json \
  --config /absolute/private/path/dialogue-config.json \
  --tab-id <chosen-tab> --content-id <chosen-content>
```

`DIALOGUE_STORY_CONFIG` is the alternative config path input. The working script
is updated with generation results; it must not be the public example. Config
values fill missing voice/art/background values; explicit script values win.
Use authorized voices and absolute asset paths. Follow `../SKILL.md` for paid
action approval, target readiness, recovery, save and render review.

## Legacy compatibility, not a new storage recommendation

The helper still tries `config.local.json` as a config fallback and imports
`prompts.local.mjs` when present beside `run.mjs`. Without that prompt module it
uses `prompts.example.mjs`. There is currently **no external prompt-module path
option**; `--config` does not select prompts.

Do not delete or relocate an existing tuned prompt module as a cleanup step:
that can silently change generated output to generic prompts. Preserving tuned
runtime behavior while moving it requires a separately reviewed loader change.
The helper does not read personal formula Markdown documents.

Existing ignore patterns are retained to protect legacy files during migration;
ignoring a path neither untracks an already tracked file nor guarantees safe
publication. Back up and migrate private data only through an explicitly reviewed
private-storage workflow. Never force-add private material to public Git, rebuild
Git directories, or commit/push merely because this document is being read.
