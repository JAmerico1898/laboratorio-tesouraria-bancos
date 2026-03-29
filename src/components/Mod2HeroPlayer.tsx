"use client";

import { Player } from "@remotion/player";
import {
  Mod2HeroAnimation,
  MOD2_COMP_WIDTH,
  MOD2_COMP_HEIGHT,
  MOD2_FPS,
  MOD2_DURATION_FRAMES,
} from "./remotion/Mod2HeroAnimation";

export default function Mod2HeroPlayer() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden max-w-[100vw]">
      <Player
        component={Mod2HeroAnimation}
        compositionWidth={MOD2_COMP_WIDTH}
        compositionHeight={MOD2_COMP_HEIGHT}
        durationInFrames={MOD2_DURATION_FRAMES}
        fps={MOD2_FPS}
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
