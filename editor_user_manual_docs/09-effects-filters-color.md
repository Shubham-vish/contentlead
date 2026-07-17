# Visual Effects, Filters, Chroma Key & Color

> **For humans, not agents.** This document describes how a person edits video by hand using the
> on-screen controls of the SkillTown video editor. It is **not** an AI skill or an automation API.
> If you are an AI agent, do **not** treat these steps as callable commands — for programmatic
> control use the agent skills/commands documented elsewhere (see `_Agent/AGENTS.md`).

> Add stylized effects, tune image/video color, remove green or blue screens, and choose exact solid or gradient colors.

## Where to find it

Select an image, video, text, caption, shape, or scene on the canvas or timeline to open the properties panel. Visual presets are in **Effects**.

For images, open **Remove Background** for chroma key controls. For videos, open **Color Keying (Chroma)**. For image and video color grading, open **Color & Filters**; basic image/video controls also include **Blur** and **Brightness**.

Color pickers appear anywhere you click a color field, such as **Color**, **Fill**, **Background Color**, **Stroke Color**, **Shadow Color**, **Color 1**, or **Color 2**.

## What you can do

- Apply stackable effect presets from **Color**, **Visual**, **Glow & Shadow**, and **Motion** groups.
- Search presets with **Search effects...**, reuse items from **Recently Used**, and manage **Applied** effects.
- Adjust effect timing with **Start**, **End**, **Fade In**, **Fade Out**, and **Easing**.
- Use image/video filter presets such as **Cinematic**, **Vintage**, **B&W Film**, **Warm**, **Cool**, and **Vivid**.
- Tune **Blur**, **Brightness**, **Contrast**, **Saturation**, **Hue**, **Sepia**, and **Grayscale** manually.
- Remove a keyed background with **Remove Background**, **Key Colors (Max 5)**, **Tolerance**, **Edge Softness**, **Spill Removal**, and **Denoise (clean edges)**.
- Pick colors with **Solid**, **Gradient**, **Hex**, opacity **%**, and **Pick color from screen**.

## How to apply visual effect presets

1. Select the item you want to stylize.
2. In the properties panel, open **Effects**.
3. Use **Search effects...** if you know the look you want, or browse the groups:

   | Group | Presets |
   |---|---|
   | **Color** | **Black & White**, **Desaturated**, **Noir**, **Vintage Sepia**, **Warm Tone**, **Retro Film**, **Negative**, **X-Ray**, **Hue Shift 90°**, **Hue Shift 180°**, **Hue Shift 270°**, **Rainbow Shift**, **Vivid Colors**, **Muted Colors**, **Color Pop**, **High Contrast**, **Low Contrast**, **Dramatic**, **Washed Out** |
   | **Visual** | **Soft Focus**, **Heavy Blur**, **Dreamy**, **Motion Blur**, **Flash**, **Dimmed**, **Blackout**, **Overexposed**, **Subtle Vignette**, **Dramatic Vignette**, **Spotlight**, **Light Grain**, **Heavy Grain**, **8mm Film** |
   | **Glow & Shadow** | **Soft Shadow**, **Hard Shadow**, **Long Shadow**, **Colored Shadow**, **White Glow**, **Neon Blue**, **Neon Pink**, **Neon Green**, **Neon Red**, **Neon Orange**, **Golden Glow**, **Soft Glow** |
   | **Motion** | **Light Shake**, **Heavy Shake**, **Earthquake**, **Slow Pulse**, **Fast Pulse**, **Breathing**, **Subtle Glitch**, **Heavy Glitch**, **VHS Tracking** |

4. Click a preset to apply it. It appears under **Applied (1)**, **Applied (2)**, and so on.
5. Expand an applied effect to edit it, or use **Disable**, **Enable**, or **Delete** from the effect row.

## How to adjust an applied effect

1. Open **Effects** and expand an item under **Applied**.
2. Under **Timing**, set **Start** and **End**. Values display in frames, such as `0f` or `end`.
3. Under **Transitions**, set **Fade In** and **Fade Out** to blend the effect in or out.
4. Choose **Easing**. Available labels include **Linear**, **Ease**, **Ease In**, **Ease Out**, **Ease In Out**, **Ease In Quad**, **Ease Out Quad**, **Ease In Out Quad**, **Ease In Cubic**, **Ease Out Cubic**, and **Ease In Out Cubic**.
5. Under **Parameters**, tune the controls shown for that effect:

   | Control | What it changes |
   |---|---|
   | **Intensity** | Overall strength for most color and visual effects. |
   | **Hue** | Color rotation for hue-based effects. |
   | **Blur** | Shadow or glow softness when editing glow/shadow effects. |
   | **Color** | Glow or shadow color. |
   | **Amount** | Shake distance. |
   | **Scale** | Pulse size. |
   | **Speed** | Pulse speed. |
   | **Frequency** | How often a glitch appears. |
   | **Amplitude** | Glitch offset strength. |

## How to use image and video filters

1. Select an image or video.
2. Open **Color & Filters**.
3. Under **Presets**, click a quick look:

   | Preset | Result |
   |---|---|
   | **Reset** | Returns the color grade to neutral. |
   | **Cinematic** | Adds a lower-saturation, higher-contrast film look. |
   | **Vintage** | Adds softer contrast, warmer sepia, and reduced saturation. |
   | **B&W Film** | Converts to black-and-white with stronger contrast. |
   | **Warm** | Adds warmer color and saturation. |
   | **Cool** | Shifts the look cooler. |
   | **Noir** | High-contrast black-and-white. |
   | **Faded** | Bright, low-contrast faded look. |
   | **Vivid** | Bright, saturated color. |
   | **Sunset** | Warm orange tint. |
   | **Moody** | Darker, higher-contrast look. |
   | **Pastel** | Bright, soft, low-saturation look. |
   | **Teal & Orange** | Teal/orange-style color grade. |
   | **Dream** | Bright, soft, warm look. |
   | **Hi Contrast** | Very strong contrast. |
   | **Matte** | Soft matte finish. |

4. Under **Adjust**, use the manual sliders:

   | Slider | Range shown | What it does |
   |---|---:|---|
   | **Blur** | 0–100 | Softens the selected image or video. Found in the basic image/video controls. |
   | **Brightness** | 0–200 | Darkens below 100 or brightens above 100. Found in the basic image/video controls. |
   | **Contrast** | 0–200% | Reduces or increases separation between dark and light areas. |
   | **Saturation** | 0–200% | Removes color at low values or boosts color at high values. |
   | **Hue** | -180°–180° | Rotates all colors around the color wheel. |
   | **Sepia** | 0–100% | Adds a brown vintage tone. |
   | **Grayscale** | 0–100% | Converts the image or video toward black-and-white. |

## How to remove a green screen or blue screen with chroma key

1. Select the image or video with the colored background.
2. For an image, open **Remove Background**. For a video, open **Color Keying (Chroma)**.
3. Turn on **Remove Background**.
4. Under **Key Colors (Max 5)**, choose the color to remove:
   - Click **Green** for a green screen.
   - Click **Blue** for a blue screen.
   - Click **+** to add another key color.
   - Click **Eyedropper** to sample a color from the preview. While active, it shows **Picking…**.
5. Click a color swatch to expand its controls.
6. Tune each color separately:

   | Control | What it does |
   |---|---|
   | **Tolerance** | Expands or narrows the range of colors removed around the key color. Increase it when the backdrop remains visible. Decrease it if the subject starts disappearing. |
   | **Edge Softness** | Feathers the transparent edge. Increase it for smoother hair, fabric, or motion edges. |
   | **Spill Removal** | Reduces green/blue color reflected on the subject. Increase it if edges look tinted. |
   | **Reset** | Restores that color’s chroma settings to the default values. |

7. Use **Denoise (clean edges)** if compressed footage leaves blocky or noisy edges. The note **Global — smooths chroma for all colors** means this one slider affects every key color.
8. If you added the wrong color, hover the swatch and use **Remove this color**.

## How to use the color picker, gradients, and eyedropper

1. Click any visible color field, such as **Color**, **Fill**, **Stroke Color**, or **Shadow Color**.
2. Choose **Solid** for one color or **Gradient** when both tabs are available.
3. For a solid color:
   - Drag in the color board to choose the shade.
   - Use the hue ribbon to change the base color.
   - Use the alpha ribbon or the **%** field to set transparency.
   - Type a value in **Hex** and press Enter or click away.
   - Use **Pick color from screen** to sample any visible pixel.
4. For a gradient:
   - Use the same color controls to edit the selected stop.
   - Click the gradient stop bar to add a stop when adding stops is available.
   - Drag stops to reposition them; double-click a stop to remove it.
   - Click the gradient mode control to switch between linear and radial styles.
   - Drag the angle handle to change the gradient direction.
5. For text gradients, turn on **Gradient**, then set **Color 1**, **Color 2**, and **Direction**. The helper text says **Use a text gradient instead of a solid color**.

## Tips & good to know

- Effects can stack. For example, a color preset, a glow, and a motion effect can all be applied to the same item.
- **End** shows `end` when the effect runs until the item finishes.
- **Recently Used** appears after you have applied effects before.
- Chroma key supports up to five key colors, which helps with uneven screens, shadows, or mixed green/blue backgrounds.
- If chroma key removes parts of your subject, lower **Tolerance** before changing other settings.
- If the background is gone but the edge looks harsh, raise **Edge Softness** slightly.
- If the subject has a green or blue fringe, raise **Spill Removal**.
- Use **Reset** in **Color & Filters** before trying a new grade if you want to start from neutral.

## Related

- [Timeline editing](02-timeline.md)
- [Text, captions, and typography](05-text-captions.md)
- [Images, video, and media](06-media.md)
- [Transitions and motion](08-transitions-motion.md)
