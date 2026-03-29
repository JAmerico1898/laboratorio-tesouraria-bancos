"use client";

import { Player } from "@remotion/player";
import {
  Mod3HeroAnimation,
  MOD3_COMP_WIDTH,
  MOD3_COMP_HEIGHT,
  MOD3_FPS,
  MOD3_DURATION_FRAMES,
} from "./remotion/Mod3HeroAnimation";

export default function Mod3HeroPlayer() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden max-w-[100vw]">
      <Player
        component={Mod3HeroAnimation}
        compositionWidth={MOD3_COMP_WIDTH}
        compositionHeight={MOD3_COMP_HEIGHT}
        durationInFrames={MOD3_DURATION_FRAMES}
        fps={MOD3_FPS}
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
