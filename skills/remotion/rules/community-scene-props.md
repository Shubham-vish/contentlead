# Community Scene Props (`propsSchema`)

How a **bundled community scene** exposes editable fields, so users can change a
headline or a colour without forking the code.

Applies to scenes in `SkillTown/scripts/community-scenes/*.tsx` published with
`scripts/seed-community-scene.cjs`. Catalog scenes in
`@shubham-vish/remotion-templates` use `scene-props-registry.ts` instead — a
different mechanism entirely.

---

## Declare the schema

Export a `propsSchema` alongside the component. This is the whole contract:

```tsx
export const propsSchema = [
  { key: "keyword", label: "Keyword", type: "text", default: CONFIG.keyword,
    help: "The word that stays locked in place." },
  { key: "ink", label: "Ink", type: "color", default: CONFIG.ink },
  { key: "holdFrames", label: "Frames per cut", type: "number",
    default: CONFIG.holdFrames, min: 1, max: 12, step: 1 },
];
```

Types: `text` | `textarea` | `color` | `number` | `select` (`select` also needs
`options: [{label, value}]`; `number` takes `min`/`max`/`step`). Every field
needs a `default` that **matches the scene's own `CONFIG`** — see below.

## Consume the props

The player already spreads `sceneProps` onto the component
(`player/items/template.tsx`), so the component just merges them over `CONFIG`:

```tsx
function resolveCfg(props: SceneProps) {
  return {
    ...CONFIG,
    ...(props.keyword ? { keyword: props.keyword } : {}),
    ...(Number(props.holdFrames) > 0 ? { holdFrames: Number(props.holdFrames) } : {}),
  };
}
```

### ⚠️ Fall back on empty, not just `undefined`
`props.keyword ?? CONFIG.keyword` is **wrong**. Clearing the input yields `""`,
which is defined, so `??` keeps it and the scene renders a blank headline.
Guard with truthiness for strings and `Number(x) > 0` for numbers.

### ⚠️ Use context, never a module-level mutable
If sub-components need the config, do **not** stash it in a module-level
`let ACTIVE = cfg`. The same scene can sit on the timeline twice with different
keywords; both instances share the module, so the last one to render wins and
the first silently shows the wrong text.

```tsx
const CfgContext = React.createContext(CONFIG);
const useCfg = () => React.useContext(CfgContext);

export default function Scene(props: SceneProps) {
  return <CfgContext.Provider value={resolveCfg(props)}><SceneBody /></CfgContext.Provider>;
}
```

**Every scope that reads `cfg` must call `useCfg()`.** A blanket
`CONFIG.` → `cfg.` rewrite will silently miss components you forgot, and the
build still succeeds — it fails at **render** with `ReferenceError: cfg is not
defined`. Verify with a script that walks each component and checks it declares
`cfg` before using it; do not eyeball it. Watch for arrow components with an
implicit return — they need a body added before you can insert the hook.

## Publishing

`seed-community-scene.cjs` reads the schema by **evaluating the built CJS
bundle** and reading its `propsSchema` export, not by parsing the source. React
and Remotion stay external and resolve from the repo, so it runs in plain Node.
Whatever the bundle exports is exactly what the player will see, so the two
cannot drift.

The schema is validated at publish time (bad `type`, missing `key`/`default`,
`select` without `options` all throw) and stored on the Cosmos document.
It is **also embedded on the timeline item** at insert time, like `bundledCode`,
so the settings panel works without re-fetching the library document.

## Only changed values are stored

`pruneSceneProps` omits any field still equal to its schema default. Baking every
default into `sceneProps` would freeze the scene at the values it had the day it
was added — a later republish that improves a default could never reach items
already on a timeline. This is why the schema `default` **must** match `CONFIG`:
if they disagree, the field is written out unnecessarily and pins itself.

## Verify through a real render, not the preview

```bash
cd SkillTown-Desktop && node tests/visual/render-bundled.cjs \
  --source ../SkillTown/scripts/community-scenes/<scene>.tsx \
  --out /tmp/x.mp4 --width 1080 --height 1920 --durationMs 1400 \
  --props '{"keyword":"MOMENTUM","ink":"#1a2b4a"}'
```

Then **look at a frame and measure it** — confirm the word changed *and* that a
colour override actually appears in the pixels (cluster the dark pixels; a
custom ink shows up as a cluster absent from the default palette). Also re-run
the scene's checker with **default** props to prove the refactor did not regress
the effect itself.

## Where the UI lives

| File | Role |
|---|---|
| `custom-scene/scene-props-form.tsx` | The form + `pruneSceneProps` / `defaultsFromSchema` / `valuesFromStored` |
| `menu-item/templates/BundledLibrary.tsx` | Set props **before** adding; live preview is debounced 400 ms because `<Player>` remounts when `inputProps` change identity |
| `control-item/basicTemplate/basic-template.tsx` | Edit props **after** placement, from `metadata.propsSchema` |
| `AgentCommandQueue/.../communityScenes.ts` | Agent path; rejects unknown keys |

## One dialog for every scene source

There is a single code/preview/settings dialog — `control-item/template/scene-code-editor.tsx`.
Library scenes, placed bundled scenes and community scenes all open the same
component, so a fix to the fork experience reaches every entry point at once.
Two flags adapt it:

| Flag | Effect |
|---|---|
| `dialogOnly` | Render only the dialog, no inline section. Community cards already show their own preview, so the inline copy would be a duplicate. |
| `primaryAction` | The footer's main button. The library uses *Fork*; the community card passes *Add to Timeline*. |

Pass `propsSchema` / `propValues` / `onPropValuesChange` and the settings form
appears beside the preview, driving `inputProps` live. Do **not** reuse
`mode="library"` to get dialog-only rendering: `mode` selects the *compiler*
(`compileScene` for sandbox JSX vs `loadBundledScene` for a bundle), not the
layout. A community scene needs bundled compilation with dialog-only layout.

## Settings are collapsed until asked for

Expanding a community card already shows a preview, description, imports and the
action buttons. Rendering the fields open pushed the buttons below the fold, so
the panel is collapsed by default with an `N options` count on the header and a
Maximize button that opens the shared dialog. The open/closed state resets when
a different card is expanded.

## Typography: beat `!important` with a doubled class

The panel is mounted inside a thin-scrollbar container, which carries
`[style*="scrollbar-width: thin"] input[type="text"] { font-size: 11px !important }`
— specificity (0,2,1) **with** `!important`. A plain `.scene-settings-form input`
(0,1,1) loses no matter where it sits in the file. Repeating the class —
`.scene-settings-form.scene-settings-form input[type]` (0,3,1) — wins
deterministically. Sizes must then be **removed** from the elements (no
`text-[Npx]` utilities), or the intent is split across two places.

Measured, not assumed: compile `globals.css` through the repo's own Tailwind
config, load it in headless Chrome with the competing container reproduced, and
read `getComputedStyle().fontSize`. Inside the form every element must report
13px while a control input in the same container still reports 11px.

## An empty `compiledBundle` is a silent, total failure

Five published scenes carried `compiledBundle: ""`. The document looked complete
— name, source, imports, dimensions all present — but the scene could neither
preview nor be added, and the card said "No preview available" as if that were
a normal state. They had been written straight to Cosmos, bypassing the POST
route's check, so the durable guard belongs in the **script** layer:
`scripts/lib/community-scene-build.cjs` refuses to return an empty bundle, and
both the seeder and `scripts/repair-community-bundles.cjs` go through it.

`scripts/verify-community-bundles.cjs` is the check that matters. It fetches
every published scene and **renders** it to static markup at several frames with
a stubbed `remotion`. Loading a bundle only proves it parses; rendering proves
it paints, and comparing frames proves it animates:

```bash
node scripts/verify-community-bundles.cjs     # exits non-zero on any failure
```

It must live inside the repo, not `/tmp`, or `require("react")` cannot resolve.

## A broken `globals.css` takes down every route

A stylesheet syntax error is not a styling bug — Next returns **500 for the whole
app**, API routes included, and the message points at a line number in the
*compiled* CSS that does not exist in the source file. It is easy to cause by
inserting a block on top of a multi-line comment's opening line. `app/__tests__/globals-css-parses.test.ts`
parses the file with postcss and checks the comment delimiters balance.
