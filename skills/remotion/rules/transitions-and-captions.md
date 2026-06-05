---
name: transitions-and-captions
description: Transition effects and caption styles for SkillTown Desktop videos
tags: transitions, captions, light-leaks, tiktok, crossfade, slide, wipe
---

# Transitions & Captions

## SkillTown Transitions

### LightLeaks (Primary Transition)

SkillTown's main transition effect. Uses WebGL shaders — **must use `mode: "evolve-only"` for transitions**.

```json
{ "type": "scene.addLibraryScene", "params": {
  "sceneId": "LightLeaks", "from": 11500, "durationMs": 1000,
  "sceneProps": {
    "preset": "warm-film", "mode": "evolve-only",
    "intensity": 0.9, "background": "transparent", "blendMode": "screen"
  }
}}
```

**Presets**: `warm-film`, `cool-blue`, `golden-hour`, `rainbow`, `pink-dream`, `subtle-flare`, `neon-glow`, `cinematic-red`

| Mode | Use For |
|------|---------|
| `"evolve-only"` | ✅ Transitions (single flash reveal) |
| `"full"` | Standalone atmospheric overlays only |
| `"retract-only"` | Disappear/fade-out effects |

**Placement**: Center each 1s leak on the scene boundary (0.5s before + 0.5s after).

### How LightLeaks Work (the logic)

The LightLeaks scene is a pure-Remotion CSS implementation (no external assets). Understanding the logic lets you create similar effects:

1. **Envelope** — An opacity curve: fade in over first 18 frames, hold, fade out over last 18 frames. The `min(inFade, outFade)` pattern creates the envelope.
2. **Pulse** — A slow sine wave (~1 cycle per 60 frames) modulates intensity by ±30%. `0.7 + 0.3 * (0.5 + 0.5 * Math.sin(frame * (PI/60)))`.
3. **Two diagonal leaks** — Warm (top-right) and cool (bottom-left) radial gradients that drift diagonally with frame. Positions use `Math.sin(frame * 0.02)` for gentle oscillation.
4. **The `evolve-only` trick** — The shader has two phases (evolve + retract). In `full` mode both play → looks like it fires twice. `evolve-only` internally doubles the shader duration so only the reveal phase is visible during your 1-second transition window.

**Creating your own leak-style effect from scratch:**
```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  
  // Envelope: fade in/out over 18 frames
  const inFade = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const outFade = interpolate(frame, [dur - 18, dur], [1, 0], { extrapolateLeft: 'clamp' });
  const envelope = Math.min(inFade, outFade);
  
  // Slow pulse: oscillates 0.7 → 1.0
  const pulse = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(frame * (Math.PI / 60)));
  const strength = 0.8 * envelope * pulse;
  
  // Diagonal drift
  const drift = (frame * 0.4) % 100;
  const cx = 85 + Math.sin(frame * 0.02) * 6 - drift * 0.15;
  const cy = 12 + Math.cos(frame * 0.018) * 4;
  
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: strength,
        background: `radial-gradient(ellipse at ${cx}% ${cy}%, rgba(251,139,36,0.6) 0%, transparent 60%)`
      }} />
    </AbsoluteFill>
  );
};
```

### Custom Transition Scenes

Build transitions as sandbox custom scenes using animation helpers:

```jsx
// Crossfade-style transition
const Scene = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = fadeIn(frame, 0, 10) * fadeOut(frame, durationInFrames, 10);
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <PurpleGradientBg intensity={opacity * 0.5} />
      <div style={{ opacity, color: '#fff', fontSize: 48, fontWeight: 700, fontFamily }}>
        Next Section
      </div>
    </AbsoluteFill>
  );
};
```

```jsx
// Slide-in reveal
const Scene = () => {
  const frame = useCurrentFrame();
  const x = slideFromRight(frame, 0, 80, 12);
  const opacity = fadeIn(frame, 0, 8);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDark }}>
      <div style={{ transform: `translateX(${x}px)`, opacity, color: '#fff', fontSize: 56, fontWeight: 800, fontFamily, textAlign: 'center' }}>
        Coming Up...
      </div>
    </AbsoluteFill>
  );
};
```

## Transition Selection Guide

When deciding which transition to use between scenes, consider the content type:

| From → To | Recommended Approach |
|-----------|---------------------|
| Video → Video (same topic) | LightLeaks `warm-film` or custom crossfade scene |
| Video → Video (topic change) | Custom scene with topic text + LightLeaks |
| Scene → Video | LightLeaks `cool-blue` or `golden-hour` |
| Any → Outro | LightLeaks `cinematic-red` or custom CTA scene |
| Speaker → Code/Demo | Custom "slide" scene with label |
| Code → Speaker | LightLeaks `subtle-flare` |

> **Reference**: The editor supports 9 transition types (crossfade, slide-left/right/up/down, zoom-in/out, wipe, glitch) with automatic content-type→transition mapping. See `_Pipelines/pipeline/transition_planner.py` for the decision logic and `_Agent/skills/remotion/rules/transitions-and-captions.md` for usage in SkillTown.

## TikTok-Style Captions

The `TikTokCaptions` component is available as a sandbox global.

### 7 Caption Styles

| Style | Visual | Best For |
|-------|--------|----------|
| `karaoke` | Progressive word highlight, dimmed unread | Fast narration |
| `pop` | Active word scales up 1.25x with spring | Emphasis content |
| `glow` | Active word gets neon glow shadow | Tech/gaming |
| `bounce` | Words bounce in from below | Energetic/fun |
| `classic` | Simple black background bar | Professional |
| `boxed` | Active word gets colored background box | Headlines |
| `outline` | Bold with text stroke | High contrast over video |

### Usage in Sandbox Scene

```jsx
const Scene = () => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    <TikTokCaptions
      captions={[
        { text: 'Build', startMs: 0, endMs: 500, timestampMs: 0, confidence: 1 },
        { text: 'faster', startMs: 500, endMs: 1000, timestampMs: 500, confidence: 1 },
        { text: 'with', startMs: 1000, endMs: 1300, timestampMs: 1000, confidence: 1 },
        { text: 'AI', startMs: 1300, endMs: 1800, timestampMs: 1300, confidence: 1 }
      ]}
      style="karaoke"
      verticalPosition={75}
      combineTokensWithinMs={800}
    />
  </AbsoluteFill>
);
```

### Caption Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `captions` | Caption[] | required | Word-level caption data |
| `style` | string | `"karaoke"` | One of the 7 styles above |
| `styleOverrides` | object | `{}` | Custom style overrides |
| `combineTokensWithinMs` | number | 800 | Word grouping threshold |
| `verticalPosition` | number | 75 | Position as % from top |
| `maxCharsPerLine` | number | auto | Line break threshold |
| `timeOffsetMs` | number | 0 | Time offset for mid-video scenes |

### Caption Data Format

```typescript
interface Caption {
  text: string;        // The word
  startMs: number;     // Start time in milliseconds
  endMs: number;       // End time in milliseconds
  timestampMs: number; // Reference timestamp
  confidence: number;  // 0–1
}
```

### Generating Captions from Audio

Use PrepWithAI TTS + transcription workflow:
1. Generate voiceover: `prepwithai_speech_generate` → audio URL
2. Transcribe for word timestamps: `prepwithai_text_generate` or Whisper
3. Convert timestamps to Caption[] format
4. Add TikTokCaptions scene to timeline

> **Reference**: The editor uses `@remotion/captions` and `createTikTokStyleCaptions()` for word-level animated captions. See `_Pipelines/pipeline/transcript.py` for transcript processing patterns.

### Using @remotion/captions in Bundled Scenes

`@remotion/captions` is now available as a supported import for bundled scenes. Use it for word-level animated captions:

```tsx
import { createTikTokStyleCaptions, Caption } from '@remotion/captions';

// Convert word timings from transcription to Caption objects
const captions: Caption[] = words.map(w => ({
  text: w.word,
  startMs: w.start,
  endMs: w.end,
  timestampMs: w.start,
  confidence: 1,
}));

// Create TikTok-style caption pages
const pages = createTikTokStyleCaptions({ captions });
```

**Full caption workflow:**
1. Generate voiceover: `prepwithai_speech_generate` → audio URL
2. Transcribe with word timestamps (Whisper or similar)
3. Create bundled scene using `@remotion/captions` to render animated subtitles
4. Add as overlay on the timeline above video/content tracks

## Audio + Caption Timing Tips

- **No timeline gaps**: Ensure background scenes cover full duration — gaps = white/empty frames
- **Caption placement**: `verticalPosition: 75` puts captions in lower third (standard)
- **Volume balancing**: Keep voiceover at volume 80-100, background music at 20-30
- **SFX at transitions**: Place short whoosh/hit SFX at scene boundaries for polish
