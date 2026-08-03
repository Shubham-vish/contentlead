import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

/**
 * DialogueCharacter — reusable character layer for the dialogue-story pipeline.
 *
 * Ports the TlEditingSolution character look (editor_agent.py):
 *   - target height 1640 on a 1080x1920 canvas, sitting low (y ≈ 1130)
 *   - home x ≈ 80 (left) / right-aligned with margin (right)
 *   - slide-in entrance from the character's home edge
 * ...but as a real spring animation instead of a baked .mov, so it's parametric,
 * instant, and fully editable.
 *
 * Add it to the ContentLead timeline via `scene.addCustomScene`
 * (see contentlead skill), one instance per dialogue, at that dialogue's start
 * with duration = the dialogue's audio length. Alternate `side` each dialogue.
 */
export type DialogueCharacterProps = {
  image: string;          // character PNG (transparent). e.g. CharImages/modi.png
  side: "left" | "right"; // which edge it enters from / rests on
  name?: string;
  charHeight?: number;    // default 1640 (ported TARGET_H)
  xMargin?: number;       // default 40 (ported char_x_margin)
  slideFrames?: number;   // entrance duration; ~0.1s in original, we use a softer spring
};

export const DialogueCharacter: React.FC<DialogueCharacterProps> = ({
  image,
  side,
  name,
  charHeight = 1640,
  xMargin = 40,
  slideFrames = 12,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Ported vertical placement: y = height - charHeight + 850 (characters sit low).
  const y = height - charHeight + 850;

  // Spring 0→1 entrance.
  const t = spring({ frame, fps, durationInFrames: slideFrames, config: { damping: 14, mass: 0.6 } });

  // Off-screen start → home x, from the correct edge.
  const homeLeft = xMargin + 40;                 // ≈ 80
  const homeRight = width - xMargin;             // right anchor (Img right-aligned)
  const offset = interpolate(t, [0, 1], [side === "left" ? -width * 0.6 : width * 0.6, 0]);

  const style: React.CSSProperties = {
    position: "absolute",
    top: y,
    height: charHeight,
    width: "auto",
    transform: `translateX(${offset}px)`,
    ...(side === "left" ? { left: homeLeft } : { right: xMargin }),
    filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.45))",
  };
  void homeRight; // right anchoring handled via `right: xMargin`

  return (
    <AbsoluteFill>
      <Img src={image} style={style} alt={name ?? "character"} />
    </AbsoluteFill>
  );
};

export default DialogueCharacter;
