"use client";

import { Player } from "@remotion/player";
import {
  Mod4HeroAnimation,
  MOD4_COMP_WIDTH,
  MOD4_COMP_HEIGHT,
  MOD4_FPS,
  MOD4_DURATION_FRAMES,
} from "./remotion/Mod4HeroAnimation";

export default function Mod4HeroPlayer() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden max-w-[100vw]">
      <Player
        component={Mod4HeroAnimation}
        compositionWidth={MOD4_COMP_WIDTH}
        compositionHeight={MOD4_COMP_HEIGHT}
        durationInFrames={MOD4_DURATION_FRAMES}
        fps={MOD4_FPS}
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
