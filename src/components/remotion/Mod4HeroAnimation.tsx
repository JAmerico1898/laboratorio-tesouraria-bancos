import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Mod4Sensitivity } from "./Mod4Sensitivity";
import { Mod4HeroText } from "./Mod4HeroText";

export const MOD4_COMP_WIDTH = 1920;
export const MOD4_COMP_HEIGHT = 800;
export const MOD4_FPS = 30;
export const MOD4_DURATION_FRAMES = 450;

export function Mod4HeroAnimation() {
  const frame = useCurrentFrame();

  const gradientAngle = interpolate(frame, [0, 450], [135, 155], {
    extrapolateRight: "clamp",
  });

  const bgShift = interpolate(frame, [0, 450], [0, 10], {
    extrapolateRight: "clamp",
  });

  const maskOpacity = interpolate(frame, [160, 185], [0, 1], {
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
      <Mod4Sensitivity />

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

      <Mod4HeroText />
    </AbsoluteFill>
  );
}
