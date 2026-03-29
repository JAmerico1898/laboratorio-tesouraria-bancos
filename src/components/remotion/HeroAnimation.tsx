import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { YieldCurve } from "./YieldCurve";
import { HeroText } from "./HeroText";

export const HERO_COMP_WIDTH = 1920;
export const HERO_COMP_HEIGHT = 800;
export const HERO_FPS = 30;
export const HERO_DURATION_FRAMES = 300; // 10 seconds

export function HeroAnimation() {
  const frame = useCurrentFrame();

  // Slow gradient shift over the full duration
  const gradientAngle = interpolate(frame, [0, 300], [135, 155], {
    extrapolateRight: "clamp",
  });

  const bgShift = interpolate(frame, [0, 300], [0, 10], {
    extrapolateRight: "clamp",
  });

  // Gradient mask fades in at ~5.7s to create space for text
  const maskOpacity = interpolate(frame, [170, 195], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg,
          hsl(${220 + bgShift}, 60%, ${8 + bgShift * 0.3}%) 0%,
          hsl(${230 + bgShift}, 30%, ${12 + bgShift * 0.2}%) 60%,
          hsl(${210 + bgShift}, 50%, ${6 + bgShift * 0.1}%) 100%)`,
        overflow: "hidden",
      }}
    >
      {/* Full-screen yield curve chart */}
      <YieldCurve />

      {/* Gradient mask — fades in before text appears to darken left side */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "55%",
          height: "100%",
          background: `linear-gradient(to right,
            hsl(${220 + bgShift}, 60%, ${8 + bgShift * 0.3}%) 50%,
            transparent)`,
          zIndex: 1,
          opacity: maskOpacity,
        }}
      />

      {/* Text overlay — appears from 6s onward */}
      <HeroText />
    </AbsoluteFill>
  );
}
