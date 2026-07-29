# Text Match Cut

A **text match cut** holds one word in the exact same screen position while
everything around it is replaced. Here a keyword stays pinned while newspaper
after newspaper cuts behind it, each headline using that same word. It's the
"…so they're calling it a **RECESSION**" beat — rapid-fire front pages that all
land on your word.

Source: `SkillTown/scripts/community-scenes/text-match-cut.tsx`

This is a **bundled scene**, not a catalog scene. Add it with
`scene.addBundledScene` (read the file and pass its contents as the source), or
publish it once to the Community library and reuse it with
`scene.addCommunityScene`. Either way there is **no package release** involved —
see [scene-commands.md](scene-commands.md).

## Configuring it

Everything you'd normally change is in the `CONFIG` object and the `PAPERS`
array at the top of the file. There is no props panel — bundled scenes bake
their values into the source, so **edit the code, then add it**.

| `CONFIG` key | What it does |
|---|---|
| `keyword` | The word that stays pinned. Must appear in every headline. |
| `anchor` | Where the keyword's centre sits, as fractions of the frame. |
| `holdFrames` | Frames per newspaper before the cut. 3–8 works; lower = more frantic. |
| `maxKeywordScale` | Ceiling on keyword size vs width. Auto-fit may go smaller. |
| `flankRatio` | Size of the surrounding words, relative to the keyword. |
| `tiltDegrees` / `scaleJitter` | Non-zero adds a scrappier, hand-held feel. |
| `flashStrength` | White flash on each cut. `0` disables. |
| `highlight` | Highlighter sweep across the keyword on the final hold. |

`PAPERS` is one entry per newspaper: `masthead`, `kicker`, `deck`, and the words
`before` / `after` the keyword. Either flank may be `""`.

**Scene duration:** `PAPERS.length * holdFrames` frames of cutting, then it rests
on the last paper. Give it that plus ~30 frames so the final hold and the
highlighter sweep have room. Seven papers at 6 frames = 42, so ~90 frames total.

## Things that will bite you

- **Keep `before` / `after` short.** The keyword size is solved once for the
  *longest* headline in the set and then used for all of them, because resizing
  per paper would make the keyword breathe between cuts — exactly what a match
  cut must not do. One long flank therefore shrinks the keyword on *every* paper.
- **Don't centre the headline.** The keyword is centred on the anchor, not the
  sentence. Only the keyword is in normal flow; the flanks are absolutely
  positioned off its edges. Rendering the headline as one centred line is the
  obvious "simplification" and it breaks the effect completely — the word slides
  as the surrounding words change length.
- **Vary the layout, not just the words.** Column bars sit on a grid, so papers
  sharing a line height and column count overlap on most of their pixels and the
  cut reads as a jiggle. The scene varies line height, column count, masthead
  size and paper shade per paper. Measured: page turnover went 20% → 79% once
  the grid itself varied.
- **Type sizes come from `pageScale(width, height)`, not `width`.** A wide-short
  frame sized off width alone oversizes the masthead until it collides with the
  columns beneath it.

## Verifying a change

```bash
cd /Users/shubham/Codes/SkillTown-Desktop
node tests/visual/render-bundled.cjs \
  --source ../SkillTown/scripts/community-scenes/text-match-cut.tsx \
  --out /tmp/tmc.mp4 --width 1080 --height 1920 --durationMs 3000
python3 tests/visual/match-cut-check.py /tmp/tmc.mp4
```

`match-cut-check.py` locates the pinned word empirically and fails if it drifts
off the anchor, if the page stops turning over, or if a headline runs off the
frame. Verified on both 1080x1920 and 1920x1080.
