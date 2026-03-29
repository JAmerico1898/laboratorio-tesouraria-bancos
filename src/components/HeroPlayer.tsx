"use client";

import { Player } from "@remotion/player";
import {
  HeroAnimation,
  HERO_COMP_WIDTH,
  HERO_COMP_HEIGHT,
  HERO_FPS,
  HERO_DURATION_FRAMES,
} from "./remotion/HeroAnimation";

export default function HeroPlayer() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden max-w-[100vw]">
      <Player
        component={HeroAnimation}
        compositionWidth={HERO_COMP_WIDTH}
        compositionHeight={HERO_COMP_HEIGHT}
        durationInFrames={HERO_DURATION_FRAMES}
        fps={HERO_FPS}
        autoPlay
        loop
        controls={false}
        style={{
          width: "100%",
          maxWidth: 1920,
        }}
      />
    </section>
  );
}
