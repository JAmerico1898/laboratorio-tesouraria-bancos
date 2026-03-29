"use client";

import { Player } from "@remotion/player";
import {
  Mod1HeroAnimation,
  MOD1_COMP_WIDTH,
  MOD1_COMP_HEIGHT,
  MOD1_FPS,
  MOD1_DURATION_FRAMES,
} from "./remotion/Mod1HeroAnimation";

export default function Mod1HeroPlayer() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden max-w-[100vw]">
      <Player
        component={Mod1HeroAnimation}
        compositionWidth={MOD1_COMP_WIDTH}
        compositionHeight={MOD1_COMP_HEIGHT}
        durationInFrames={MOD1_DURATION_FRAMES}
        fps={MOD1_FPS}
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
