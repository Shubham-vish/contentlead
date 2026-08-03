# Private full mirror — commit everything (incl. gitignored files) across PCs

This skill lives in the **public** repo `Shubham-vish/contentlead` (secrets are
`.gitignore`'d and never pushed there). To still get commit history + cross-PC sync
for the private overlay (voice IDs, character art, tuned prompts, the exact-prompt
docs), the same folder is *also* tracked by a **second git dir** that pushes to a
**private** repo: `Shubham-vish/contentlead-private`.

One working tree, two independent repos:

| Repo | Git dir | Remote | Contents |
|------|---------|--------|----------|
| Public | `.git` | `contentlead` | Everything **except** the gitignored overlay |
| Private mirror | `.private.git` | `contentlead-private` | The same tree **plus** the overlay files |

`.private.git/` is hidden from the public repo via `.git/info/exclude`, so the two
never interfere.

## The `gitp` helper (run once per shell, or add to ~/.zshrc)

```bash
# Operate the PRIVATE mirror from anywhere inside the _Agent folder:
gitp() { git --git-dir="$(git rev-parse --show-toplevel)/.private.git" --work-tree="$(git rev-parse --show-toplevel)" "$@"; }
```

## Daily workflow

```bash
# Normal PUBLIC work (secrets stay out automatically):
git add -A && git commit -m "..." && git push

# Back up EVERYTHING to the private mirror (includes the gitignored overlay):
gitp add -A                                   # all normal files
gitp add -f skills/dialogue-story/orchestrator/config.local.json \
           skills/dialogue-story/orchestrator/prompts.local.mjs \
           skills/dialogue-story/orchestrator/assets/characters \
           skills/dialogue-story/ai-prompts.md \
           skills/dialogue-story/script-schema-and-formula.md
gitp commit -m "sync overlay" && gitp push
```
(The `-f` is only needed the first time each ignored file is added; afterwards a plain
`gitp add -A` keeps already-tracked overlay files updated.)

## Setting up on another PC

```bash
# 1. Get the FULL tree (public files + private overlay) from the private mirror:
git clone https://github.com/Shubham-vish/contentlead-private.git _Agent
cd _Agent

# 2. (optional) also wire the PUBLIC remote so you can push public changes:
mv .git .private.git                          # the clone IS the private mirror
git init -b main                              # fresh public .git
git remote add origin https://github.com/Shubham-vish/contentlead.git
git fetch origin && git reset --soft origin/main
echo '.private.git/' >> .git/info/exclude     # hide mirror from public repo
```

Now `git …` drives the public repo and `gitp …` drives the private mirror, exactly as
on the first machine.
