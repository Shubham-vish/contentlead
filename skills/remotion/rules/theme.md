---
name: theme
description: Theme tokens and style helpers available inside sandbox scenes
tags: remotion, theme, colors, fonts, tokens
---

# Theme

## Fonts
- `fontFamily` → Montserrat (`headingFont` alias)
- `primaryFont` → Montserrat
- `headingFont` → Montserrat
- `bodyFont` → Poppins
- `handwrittenFont` → Patrick Hand
- `sansFont` → Open Sans
- `scriptFont` → Caveat
- `codeFont` → `'Fira Code', 'Consolas', 'Courier New', monospace`
- `impactFont` → `Impact, 'Arial Black', sans-serif`

## `COLORS`
Common keys: `bgPrimary`, `bgDark`, `bgPanel`, `accentPurple`, `accentPurpleLight`, `accentPurpleBright`, `textAccent`, `glowPurple`, `cardPurple`, `accentCyan`, `accentGold`, `accentOrange`, `accentBlue`, `textPrimary`, `textSecondary`, `textDimmed`, `textWhite`, `textYellow`, `subtitleBg`, `captionBg`, `overlayDark`, `overlayLight`, `bubbleBg`, `bubbleBorder`, `zoneShadow`.

## `SHADOWS`
Useful keys: `panel`, `panelLg`, `glowOrange`, `glowOrangeSubtle`, `glowBlue`, `glowFire`, `glowGold`, `glowCyan`, `textGlow`, `cardFloat`.

## `LAYOUT`
Useful keys: `width`, `height`, `fps`, `borderRadius`, `padding`, `splitRatio`, `subtitleBarHeight`, `pipRadius`, `pipBorderWidth`, `zoneRadius`, `zonePadding`, `topZoneHeight`, `middleZoneHeight`, `bottomZoneHeight`.

## Helper functions
### `mergeColors(overrides?)`
Actual sandbox signature:
```jsx
const c = mergeColors({ accentPurple: '#FF00AA', textPrimary: '#F8FAFC' });
```
This merges a partial theme override object into the full `COLORS` palette.

> The current sandbox does **not** inject a `mergeColors(color1, color2, ratio)` blend helper.

### `s(override, defaultValue)`
```jsx
const titleSize = s(undefined, 84);
```
Returns `override` when defined, otherwise `defaultValue`.

## Theme example

```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const c = mergeColors({ accentPurple: '#A855F7' });
  const opacity = fadeIn(frame, 0, 12);
  return <AbsoluteFill style={{ backgroundColor: c.bgDark, justifyContent: 'center', alignItems: 'center' }}><PurpleGradientBg intensity={0.35} /><div style={{ textAlign: 'center', opacity }}><div style={{ color: c.textPrimary, fontFamily: headingFont, fontSize: 88, fontWeight: 900 }}>Theme Tokens</div><div style={{ color: c.accentPurpleLight, fontFamily: bodyFont, fontSize: 34, marginTop: 18 }}>Montserrat + Poppins + shared palette</div></div></AbsoluteFill>;
};
```
