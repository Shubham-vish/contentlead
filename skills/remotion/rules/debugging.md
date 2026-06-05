---
name: debugging
description: Common sandbox scene failures and the exact fixes for SkillTown Desktop
tags: debugging, errors, sandbox, preview, troubleshooting
---

# Debugging

## "No `Scene` component found"
Cause: you did not define `const Scene = () => { ... }`.

Fix:
```jsx
const Scene = () => <AbsoluteFill />;
```

## "return outside of function"
Cause: you added `return Scene;` at the bottom of the code string.

Fix: remove it. The compiler returns `Scene` automatically.

## "X is not defined"
Cause: you referenced something not injected into the sandbox.

Common examples:
- `OffthreadVideo`
- `Remotion`
- custom imports

Fix: use only the globals listed in `sandbox-rules.md`.

## "Syntax error"
Cause: malformed JSX or a Babel parse failure.

Fixes:
- close every tag,
- close every object literal,
- avoid partial fragments like `<div>{text}</span>`.

## Scene renders blank
Usual causes:
- everything is fully transparent,
- everything is off-screen,
- dark text on dark background,
- forgot to return content.

Good baseline:
```jsx
const Scene = () => <AbsoluteFill style={{ backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}><div style={{ color: '#fff', fontSize: 72, fontWeight: 800 }}>Visible</div></AbsoluteFill>;
```

## Scene flickers
Cause: you used CSS animation / transition instead of frame math.

Fix:
```jsx
const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
```

## Performance issues
Typical causes:
- too many DOM nodes,
- huge SVGs updated every frame,
- rebuilding large arrays every render,
- too many particles.

Fixes:
- lower particle counts,
- simplify SVG paths,
- memoize heavy arrays with `useMemo()`.

## Best test flow
1. Start with `scene.previewCode`.
2. Fix syntax / runtime errors in the preview UI.
3. Only then call `scene.addCustomScene`.
