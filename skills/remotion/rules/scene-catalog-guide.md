---
name: scene-catalog-guide
description: Scene selection strategy and catalog browsing for SkillTown Desktop
tags: scenes, catalog, selection, pairing, categories, browse
---

# Scene Catalog & Selection Guide

## Browsing SkillTown Scenes

Use `scene.listScenes` to browse available scenes:

```json
{ "type": "scene.listScenes", "params": { "category": "opener", "limit": 10 } }
{ "type": "scene.listScenes", "params": { "search": "chart" } }
{ "type": "scene.listScenes", "params": {} }
```

### Available Categories

| Category | Use For | Examples |
|----------|---------|---------|
| `opener` | Video intros, title cards | ImpactText, TitleCard |
| `closer` | Outros, CTAs, end cards | CTA scenes |
| `chart` | Data visualization | AnimatedBar, LineChart, Donut |
| `data-viz` | Stats, counters, metrics | StatsGrid, Counter |
| `text` | Text reveals, quotes, callouts | Quote, KeyPoint, Insight |
| `motion-bg` | Animated backgrounds | Gradient, Particles, Noise |
| `layout` | Multi-section layouts | Split, Grid, Timeline |
| `comparison` | Before/after, A/B | BeforeAfter, SideBySide |
| `effect` | Visual effects, overlays | LightLeaks, FilmGrain |
| `structural` | Section dividers, transitions | Divider, SectionBreak |
| `speaker` | Speaker segments | PIP, SpeakerZone |

## Scene Selection Strategy

### 1. Match scene to content purpose

| Purpose | Scene Type | Duration |
|---------|-----------|----------|
| Hook / first impression | `opener` category, bold text | 3–5s |
| Explain a concept | Custom scene with text + animation | 4–6s |
| Show data/results | `chart` or `data-viz` category | 5–8s |
| Compare options | `comparison` category | 4–6s |
| Process/steps | Custom staggered list | 5–8s |
| Transition between topics | `effect` (LightLeaks) or custom | 1–2s |
| Call to action | `closer` category | 3–5s |
| Background behind video | `motion-bg` or custom gradient | match video duration |

### 2. Use pairing logic

Build coherent sequences by following this pattern:

```
Opener → Content → Data → Transition → Content → CTA
```

Specific pairings that work well:

| After This | Use This |
|-----------|----------|
| Title/Impact text | Chart or data scene |
| Chart | Insight/key-point text |
| Video segment | Text overlay summarizing content |
| Comparison | CTA or conclusion |
| Any content scene | LightLeaks transition before next section |

### 3. Check scene props before adding

```json
{ "type": "scene.getSceneProps", "params": { "sceneId": "AnimatedBarScene" } }
```

Returns required and optional props. Always customize `title`, `subtitle`, `accentColor` to match your video's theme.

## Custom Scene vs Library Scene vs Bundled Scene

| When to use | Library (`scene.addLibraryScene`) | Custom (`scene.addCustomScene`) | Bundled (`scene.addBundledScene`) |
|-------------|------|--------|---------|
| Standard data viz (chart, stats) | ✅ Use directly with props | Overkill | Overkill |
| Simple text/shape animation | Possible | ✅ Fast, no imports needed | Overkill |
| Need `@remotion/noise`, shapes, paths | ❌ | ❌ No imports allowed | ✅ Full import support |
| Video with effects (Ken Burns, 3D) | ❌ | ❌ No `<OffthreadVideo>` | ✅ Embed video + effects |
| Customize a catalog scene | ❌ Props only | ❌ | ✅ Import + modify |
| Word-level animated captions | ❌ | ❌ | ✅ `@remotion/captions` |
| Branded intro with unique animations | Limited | ✅ Full control | ✅ More packages available |
| Quick prototyping | ✅ Fastest | ✅ Fast | Slightly slower (esbuild) |

### Importing catalog scenes in bundled scenes
Any of the 159 catalog scenes can be imported and customized:
```tsx
import { AnimatedBarScene, PieChartScene } from '@shubham-vish/remotion-templates';

export default function CustomDashboard() {
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '50%' }}>
        <AnimatedBarScene title="KPIs" metrics={[...]} />
      </div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: '50%', height: '50%' }}>
        <PieChartScene title="Split" segments={[...]} />
      </div>
    </AbsoluteFill>
  );
}
```

## Default Orientation

| Category | Default | Override with |
|----------|---------|---------------|
| `chart`, `comparison`, `layout`, `data-viz`, `ui` | landscape | `orientation: "portrait"` |
| Everything else | portrait | `orientation: "landscape"` |

## Validation Workflow

1. **Browse**: `scene.listScenes` → find candidates
2. **Inspect**: `scene.getSceneProps` → understand required props
3. **For custom scenes**: `scene.validateCode` → catch errors before adding
4. **Add**: `scene.addLibraryScene` (as-is) or `scene.addBundledScene` (customized) or `scene.addCustomScene` (sandbox)
5. **Reorder**: `editor.reorderTracks` → fix z-order after all scenes added

> **Reference files**: `_Agent/scene-catalog.json` (159 scenes with full metadata) and `_Agent/scene-props.json` (machine-readable field schemas) are available for browsing offline.
