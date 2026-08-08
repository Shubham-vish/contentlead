# Creator Styles — Decision Tree

Use scene-level composition before applying a SkillTown creator style. Do not route only by vibe; decide which role each style should own.

```text
IF task = "make hook feel viral"
  → inspect hooks with style.getScenesByRole(kallaway, "hook") OR style.getScenesByRole(ankitarora, "hook")
  → apply chosen hook with scene.applyStyleTemplateSubset({roles:["hook"]})

IF task = "add educational body"
  → inspect style.getScenesByRole(tharun, "body")
  → apply body subset with scale: 1.2 for slower teaching pace

IF task = "punchy CTA"
  → inspect style.getScenesByRole(sisinty, "cta")
  → apply CTA subset only, then rewrite canned copy

IF user has raw talking-head footage
  → keep source video as the center track
  → apply subset with roles:["hook","cta"] only so template scenes frame the content instead of replacing it

IF user wants dramatic remix
  → composeStyles([ankitarora hook + kallaway body + sisinty outro])
```

Runnable command examples:

```json
{"type":"style.getScenesByRole","params":{"styleId":"kallaway","role":"hook","templateId":"template-main"}}
```

```json
{"type":"scene.applyStyleTemplateSubset","params":{"styleId":"tharun","templateId":"template-main","filter":{"roles":["body"]},"from_ms":3000,"scale":1.2}}
```

```json
{"type":"scene.applyStyleTemplateSubset","params":{"styleId":"kallaway","templateId":"template-main","filter":{"roles":["hook","cta"]},"from_ms":0,"scale":1}}
```

```json
{"type":"scene.composeStyles","params":{"from_ms":0,"segments":[{"styleId":"ankitarora","filter":{"roles":["hook"]},"label":"dramatic hook"},{"styleId":"kallaway","filter":{"roles":["body"]},"label":"creator body"},{"styleId":"sisinty","filter":{"roles":["outro","cta"]},"label":"warm outro"}],"scale":1}}
```

Legacy vibe routing still helps for style choice:

```text
Need fast/hooky/retention-first?
├─ Creator education / founder energy → kallaway
├─ Minimal punchy edit beats → editingburst
└─ Developer tutorial / code-demo density → buildercentral

Need storytelling/narrative?
├─ Warm speaker-led creator story → sisinty
└─ Calm sketch/handdrawn explanation → tharun

Need cinematic/dramatic?
├─ Cinematic neon UI / creator polish → keanuvisuals
└─ Red cyberpunk dramatic education → ankitarora

Need structured explainer?
├─ Principle/framework infographic → mitmonk
└─ Studio business comparison → varunmayya

Need only animated ambience/backdrops?
└─ motion-backgrounds
```
