---
name: custom-scene-authoring
description: Create custom Remotion scenes with full React/JSX freedom — multi-video, charts, animations, any layout
tags: custom, scene, tsx, react, remotion, code, create, split-screen, chart, animation, component, composition
---

# Custom Scene Authoring — Full Reference

## What Are Custom Scenes?

There are **three ways** to create custom scenes:

### 1. Timeline Sandbox Scenes (`scene.addCustomScene`) — Simplest

These are JSX code strings added directly to the editor timeline. They run in a **browser sandbox** with injected globals.

**⚠️ CRITICAL RULES for sandbox scenes:**
- Define `const Scene = () => { ... }` — the sandbox looks for a `Scene` variable
- Use JSX directly — Babel transpiles at runtime
- **NO `import` statements** — APIs are injected as globals
- **NO `export` statements**
- **NO `return Scene;` at the end** — causes "return outside of function" error
- **NO `const { ... } = Remotion;`** — use globals directly

**Available globals (no imports):** `React`, `AbsoluteFill`, `useCurrentFrame`, `useVideoConfig`, `interpolate`, `Easing`, `Sequence`, `spring`, `Img`, `staticFile`, `fadeIn`, `slideUp`, `springPop`, and 80+ animation/component helpers.

## Batch Creating Similar Scenes: Template + Substitution

For creating multiple structurally-identical scenes (e.g., 6 title cards with different text/colors), use a **template file + string substitution** approach instead of parameterized JSX. This avoids sandbox prop-passing issues and validates once for all cards.

### Recipe

**1. Write one template with `__PLACEHOLDER__` tokens:**
```js
// /tmp/scene_template.js
const Scene = () => {
  const words = __WORDS_JSON__;
  const accentColor = '__ACCENT__';
  const emoji = '__EMOJI__';
  // ... rest of JSX using these constants
};
```

**2. Substitute in Python (JSON-safe):**
```python
import json
with open('/tmp/scene_template.js') as f: tpl = f.read()

scenes = [
    ('🔥', 'THE MOMENT', ['GAME', 'CHANGING'], '#FF6B35'),
    ('⚡', 'FEATURE 1', ['INSTAGRAM', 'AUTOMATION'], '#00E5FF'),
    # ...
]

for i, (emoji, kicker, words, color) in enumerate(scenes):
    code = (tpl
        .replace('__EMOJI__', emoji)
        .replace('__KICKER__', kicker)
        .replace('__ACCENT__', color)
        .replace('__WORDS_JSON__', json.dumps(words)))
    with open(f'/tmp/scene_{i+1}.js','w') as f: f.write(code)
```

**3. Validate once, add many:**
```python
# Validate first scene (they all share structure)
r = requests.post(URL, json={'type':'scene.validateCode','params':{'code': code}})
assert r.json()['status'] == 'success'

# Then loop and add
for path in scene_files:
    with open(path) as f: code = f.read()
    requests.post(URL, json={'type':'scene.addCustomScene','params':{'code': code, ...}})
```

### Why not parameterized props?

Custom scenes in the sandbox (`scene.addCustomScene`) DON'T receive props — they use constants baked into the code. Template substitution keeps the sandbox model simple and gives you compile-time-visible values in every scene (easier debugging).

For scenes that DO accept props at runtime, use `scene.addLibraryScene` or `scene.addBundledScene` with `sceneProps`.

### 2. Bundled Scenes (`scene.addBundledScene`) — Most Powerful

Full `.tsx` source compiled via esbuild with real `import` statements. Use when you need:
- `@remotion/noise`, `@remotion/shapes`, `@remotion/captions`, or other packages
- `<OffthreadVideo>` for video with effects (Ken Burns, 3D camera, color grading)
- Importing catalog scenes from `@shubham-vish/remotion-templates` for customization

**Rules:**
- Use `export default function Scene() { ... }` — must export default
- Real `import` statements — 19 packages supported
- Build takes ~3ms (cached by content hash)
- **⚠️ NEVER embed base64 data URIs in scene source code** — they get truncated → white screen. Instead, save images to `~/Downloads/` and use media server URLs: `http://127.0.0.1:$MEDIA_PORT/media?path=/Users/shubham/Downloads/file.jpg`
- **⚠️ ALWAYS seek to the scene's time range after adding and check `editorHealth`** — scene render errors only appear when the scene is visible
- **Media server only serves from allowed paths** (~/Downloads, content dirs). Files in `~/.skilltown-desktop/` return 403.

### 3. Library Scenes (`scene.addLibraryScene`) — Fastest

Use any of 159 pre-built scenes by name with props. No code writing needed.

📚 **For deep knowledge**, load the granular Remotion rules:
- `remotion/rules/sandbox-rules` — critical do's and don'ts
- `remotion/rules/animation-helpers` — all 30+ helper signatures
- `remotion/rules/components` — all 40+ shared components
- `remotion/rules/patterns` — complete ready-to-paste examples
- `remotion/SKILL` — index of all Remotion skill topics

### Full .tsx Scene Files (`/api/scenes`) — For Standalone Rendering

These are full TypeScript React files stored in the remotion-workspace. They support **full imports, OffthreadVideo, Audio, and all Remotion packages**. Use these for standalone rendering outside the editor.

> **Note:** For timeline integration, prefer `scene.addBundledScene` instead — it compiles the same `.tsx` code but adds it directly to the editor timeline.

## API Endpoints (Full .tsx Scenes)

### Create a Scene
```bash
curl -X POST http://127.0.0.1:$PORT/api/scenes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "split-screen",
    "description": "Side-by-side video comparison",
    "code": "import React from \"react\";\nimport { AbsoluteFill, OffthreadVideo } from \"remotion\";\n\nconst SplitScreen: React.FC<{leftUrl: string; rightUrl: string}> = ({leftUrl, rightUrl}) => (\n  <AbsoluteFill style={{display: \"flex\"}}>\n    <div style={{flex: 1, overflow: \"hidden\"}}><OffthreadVideo src={leftUrl} style={{width: \"200%\", height: \"100%\", objectFit: \"cover\"}} /></div>\n    <div style={{flex: 1, overflow: \"hidden\"}}><OffthreadVideo src={rightUrl} style={{width: \"200%\", height: \"100%\", objectFit: \"cover\", marginLeft: \"-100%\"}} /></div>\n  </AbsoluteFill>\n);\n\nexport default SplitScreen;"
  }'
```

**Response:**
```json
{"success": true, "name": "split-screen", "compositionId": "Custom_split-screen", "path": "..."}
```

### List Scenes
```bash
curl http://127.0.0.1:$PORT/api/scenes -H "Authorization: Bearer $TOKEN"
```

### Read Scene Source
```bash
curl http://127.0.0.1:$PORT/api/scenes/split-screen -H "Authorization: Bearer $TOKEN"
```

### Update Scene
```bash
curl -X PUT http://127.0.0.1:$PORT/api/scenes/split-screen \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "...updated code..."}'
```

### Delete Scene
```bash
curl -X DELETE http://127.0.0.1:$PORT/api/scenes/split-screen \
  -H "Authorization: Bearer $TOKEN"
```

---

## Scene Code Requirements

Every scene must:

1. **Export a default React component** — `export default MyScene;`
2. **Accept props** — props are passed from the render request
3. **Use Remotion APIs** for timing — `useCurrentFrame()`, `useVideoConfig()`, `interpolate()`, `spring()`

### Minimal Scene Template
```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  title?: string;
  backgroundColor?: string;
}

const MyScene: React.FC<Props> = ({ title = 'Hello', backgroundColor = '#000' }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ color: '#fff', fontSize: 80, opacity }}>{title}</h1>
    </AbsoluteFill>
  );
};

export default MyScene;
```

### Naming Rules
- Alphanumeric, hyphens, underscores only: `my-scene`, `chart_v2`, `introAnimation`
- Must start with a letter
- Max 64 characters
- The composition ID will be `Custom_<name>` (e.g., `Custom_split-screen`)

---

## Available Imports

### Remotion Core
```tsx
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { OffthreadVideo, Video, Audio, Img, staticFile } from 'remotion';
import { Series, Loop, Freeze } from 'remotion';
```

### Remotion Packages
```tsx
import { Noise2D, Noise3D } from '@remotion/noise';
import { makeCircle, makeRect, makeStar, makePie } from '@remotion/shapes';
import { TransitionSeries, springTiming, fadeTiming } from '@remotion/transitions';
import { slide, fade, wipe, flip, clockWipe } from '@remotion/transitions/presentations';
import { Trail } from '@remotion/motion-blur';
import { getLength, getPointAtLength, parsePath } from '@remotion/paths';
import { getAvailableFonts, loadFont } from '@remotion/google-fonts';
```

### Template Library
```tsx
import { TemplateRenderer, getCompositionTotalFrames } from '@shubham-vish/remotion-templates';
```

---

## Example Scenes

### Split-Screen (2 Videos)
```tsx
import React from 'react';
import { AbsoluteFill, OffthreadVideo } from 'remotion';

interface Props {
  leftUrl: string;
  rightUrl: string;
  dividerWidth?: number;
  dividerColor?: string;
}

const SplitScreen: React.FC<Props> = ({ leftUrl, rightUrl, dividerWidth = 4, dividerColor = '#fff' }) => (
  <AbsoluteFill>
    <div style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', overflow: 'hidden' }}>
      <OffthreadVideo src={leftUrl} style={{ width: '200%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', overflow: 'hidden' }}>
      <OffthreadVideo src={rightUrl} style={{ width: '200%', height: '100%', objectFit: 'cover', marginLeft: '-100%' }} />
    </div>
    <div style={{ position: 'absolute', left: '50%', top: 0, width: dividerWidth, height: '100%', backgroundColor: dividerColor, transform: 'translateX(-50%)' }} />
  </AbsoluteFill>
);

export default SplitScreen;
```

### Animated Counter
```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  startValue?: number;
  endValue?: number;
  prefix?: string;
  suffix?: string;
  color?: string;
}

const Counter: React.FC<Props> = ({ startValue = 0, endValue = 100, prefix = '', suffix = '', color = '#fff' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const value = Math.round(interpolate(frame, [0, durationInFrames - 1], [startValue, endValue], { extrapolateRight: 'clamp' }));

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
      <span style={{ fontSize: 120, fontWeight: 'bold', color, fontFamily: 'monospace' }}>
        {prefix}{value.toLocaleString()}{suffix}
      </span>
    </AbsoluteFill>
  );
};

export default Counter;
```

### Triple Stack (3 Images/Videos)
```tsx
import React from 'react';
import { AbsoluteFill, Img, Sequence, useVideoConfig } from 'remotion';

interface Props {
  images: string[];
  labels?: string[];
}

const TripleStack: React.FC<Props> = ({ images, labels = [] }) => {
  const { height } = useVideoConfig();
  const rowHeight = height / 3;

  return (
    <AbsoluteFill>
      {images.slice(0, 3).map((src, i) => (
        <div key={i} style={{ position: 'absolute', top: i * rowHeight, left: 0, width: '100%', height: rowHeight, overflow: 'hidden' }}>
          <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {labels[i] && (
            <div style={{ position: 'absolute', bottom: 10, left: 20, color: '#fff', fontSize: 32, textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {labels[i]}
            </div>
          )}
        </div>
      ))}
    </AbsoluteFill>
  );
};

export default TripleStack;
```

### Kinetic Typography
```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, Sequence } from 'remotion';

interface Props {
  words: string[];
  backgroundColor?: string;
  textColor?: string;
}

const KineticType: React.FC<Props> = ({ words, backgroundColor = '#000', textColor = '#fff' }) => {
  const { fps } = useVideoConfig();
  const framesPerWord = 20;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {words.map((word, i) => (
        <Sequence key={i} from={i * framesPerWord} durationInFrames={framesPerWord}>
          <WordReveal word={word} color={textColor} fps={fps} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const WordReveal: React.FC<{ word: string; color: string; fps: number }> = ({ word, color, fps }) => {
  const frame = useCurrentFrame();
  const scale = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <span style={{ fontSize: 100, fontWeight: 900, color, transform: `scale(${scale})` }}>
        {word}
      </span>
    </AbsoluteFill>
  );
};

export default KineticType;
```

---

## Rendering Custom Scenes

After creating a scene, render it:

```bash
curl -X POST http://127.0.0.1:$PORT/api/render \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "renderType": "custom",
    "data": {
      "sceneName": "split-screen",
      "props": {
        "leftUrl": "https://example.com/video1.mp4",
        "rightUrl": "https://example.com/video2.mp4",
        "durationInFrames": 300,
        "fps": 30,
        "width": 1920,
        "height": 1080
      }
    }
  }'
```

The `durationInFrames`, `fps`, `width`, `height` in props control the composition metadata.

---

## Tips

1. **Always `export default`** — the registry imports the default export
2. **Use `OffthreadVideo` not `Video`** — better rendering performance
3. **Use `Img` not `<img>`** — Remotion's `Img` waits for loading
4. **`useCurrentFrame()`** — returns the current frame number (starts at 0)
5. **`interpolate(frame, inputRange, outputRange)`** — animate any value
6. **`spring({frame, fps})`** — physics-based animation (0 → 1)
7. **`<Sequence from={30} durationInFrames={60}>`** — time-offset child content
8. **Test with Remotion Studio** — run `cd remotion-workspace && npx remotion studio` to preview
