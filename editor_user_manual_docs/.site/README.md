# Manual → HTML site generator

Builds a themed, self-contained static documentation site from the markdown
files in `editor_user_manual_docs/*.md`. The markdown remains the single source
of truth; this only renders it.

## Build

```bash
cd editor_user_manual_docs
python3 .site/build.py
```

Output goes to `editor_user_manual_docs/site/` (regenerated fresh each run):

- `index.html` + one `.html` per doc
- `styles.css`, `app.js` (client-side search + TOC scrollspy)
- `search-index.json`
- `images/` (copied from `../images`, excluding work-in-progress `_*.png`)

Open `site/index.html` in a browser, or host the `site/` folder anywhere
(it is fully static and relative-linked — suitable for the website Hub section).

## What it does

- Converts each markdown doc with the `extra`, `toc`, `codehilite`,
  `sane_lists`, and `admonition` extensions.
- Wraps output in a SkillTown-branded dark (indigo-navy) template with a
  sidebar, per-page table of contents, and a search box.
- Rewrites `*.md` links to `*.html` (`README.md` → `index.html`).
- The sidebar order/labels are defined by `NAV` in `build.py`; any new markdown
  file is auto-appended.

## Requirements

`markdown` and `pygments` (already available in the capture toolchain).
