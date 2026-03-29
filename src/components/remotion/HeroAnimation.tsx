import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { YieldCurve } from "./YieldCurve";
import { HeroText } from "./HeroText";

export const HERO_COMP_WIDTH = 1920;
export const HERO_COMP_HEIGHT = 1080;
export const HERO_FPS = 30;
export const HERO_DURATION_FRAMES = 300; // 10 seconds

export function HeroAnimation() {
  const frame = useCurrentFrame();

  const gradientAngle = interpolate(frame, [0, 300], [135, 155], {
    extrapolateRight: "clamp",
  });

  const bgShift = interpolate(frame, [0, 300], [0, 10], {
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
      {/* Gradient fade from left — masks curve behind text */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "50%",
          height: "100%",
          background: `linear-gradient(to right,
            hsl(${220 + bgShift}, 60%, ${8 + bgShift * 0.3}%) 40%,
            transparent)`,
          zIndex: 1,
        }}
      />

      <YieldCurve />
      <HeroText />
    </AbsoluteFill>
  );
}
