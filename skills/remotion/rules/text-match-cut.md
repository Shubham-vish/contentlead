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
| `holdFrames` | Frames per newspaper. **3 at 30fps = 10 cuts/sec — stay in the 8–12 band.** |
| `maxKeywordScale` | Ceiling on keyword size vs width. Auto-fit may go smaller. |
| `flankRatio` | Size of the surrounding words, relative to the keyword. |
| `tiltDegrees` | Non-zero adds a scrappier, hand-held feel. |
| `flashStrength` | White flash on each cut. `0` disables. |
| `grainStrength` | Paper grain. This is most of what sells it as a scan. `0` disables. |

`PAPERS` is one entry per newspaper: `masthead`, `kicker`, `deck`, and the
headline lines `before` / `after` the keyword. Either may be `""`. They stack
**above and below** the keyword, the way real headlines are set.

**Scene duration:** `PAPERS.length * holdFrames` frames of cutting, then it rests
on the last paper as the payoff. Twelve papers at 3 frames = 36, so ~90 frames
total gives roughly a second of cutting and a beat to land on.

## The four constraints that do all the work

This is the whole effect; get these right and the rest is decoration.

1. **One focal word** — not a phrase. The eye needs a single thing to lock to.
2. **Locked position** — drift of a few pixels destroys the illusion instantly.
3. **High contrast between clippings** — vary typeface, column grid, masthead and
   paper stock so each cut registers as a *new publication*.
4. **Rapid pacing** — 8–12 cuts per second. Slower is a slideshow, faster strobes.

## Things that will bite you

- **Stack the headline, don't set it inline.** With the flanks beside the
  keyword it has to share the frame width with them, and a ten-character flank
  roughly halves it (measured: 82px inline vs 168px stacked). Stacked, the
  keyword is limited only by its own width — and it's how headlines are really
  set.
- **Body copy must be real text, not grey bars.** Bars are cheap and stay crisp,
  but they read as a *wireframe* the second you look at them. Actual glyphs at
  9–13px are what makes a page look like newsprint.
- **Don't centre the headline.** The keyword is centred on the anchor, not the
  sentence. Only the keyword is in normal flow; the other lines are absolutely
  positioned off its edges. Rendering the headline as one centred line is the
  obvious "simplification" and it breaks the effect completely — the word slides
  as the surrounding words change length.
- **The keyword keeps ONE face and ONE size.** Everything else may vary; the
  keyword is the constant the effect is built on. Its size is solved once for the
  whole set, because resizing per paper makes it breathe between cuts.
- **Vary the layout, not just the words.** Papers sharing a grid overlap on most
  of their pixels and the cut reads as a jiggle. The scene varies body size,
  column count, typeface, masthead size and paper stock per paper.
- **Halftone plates need a tiled dot pattern.** `repeating-radial-gradient`
  draws arcs radiating from one corner, which reads as concentric rings; use a
  `radial-gradient` dot with a small `background-size` instead.
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
frame. Verified on both 1080x1920 and 1920x1080: pinned centre x = 0.500,
change inside the word ~2.5 vs ~25 outside (10x), turnover ~79% portrait /
~61% landscape, zero clipping.

**Turnover is measured at glyph level (`INK_CUT`), not paper level.** Grain and
a vignette push 85–95% of every frame below the paper threshold, so the union
becomes the whole frame and the ratio collapses no matter how much changed —
at paper level a static frame scored 8.2% against a real cut's 11.9%, which
cannot discriminate at all. At glyph level the same pair reads 13.8% vs 78.5%.
