"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { strings } from "@/lib/strings";

const Mod2HeroPlayer = dynamic(() => import("./Mod2HeroPlayer"), { ssr: false });

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}

function MobileFallback() {
  return (
    <section
      className="relative text-center px-6 pt-12 pb-10 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, hsl(220,60%,8%) 0%, hsl(230,30%,12%) 60%, hsl(210,50%,6%) 100%)",
      }}
    >
      <div className="relative z-10 max-w-4xl mx-auto">
        <span className="font-label text-primary tracking-[0.3em] text-xs uppercase font-medium">
          {strings.mod2Eyebrow}
        </span>
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold mt-3 mb-2 tracking-tight">
          {strings.mod2Title}
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg">
          {strings.mod2Subtitle}
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[20%] right-[-5%] w-[300px] h-[300px] rounded-full bg-primary/[0.08] blur-[60px]" />
      </div>
    </section>
  );
}

export function Mod2HeroSection() {
  const isDesktop = useIsDesktop();

  return isDesktop ? <Mod2HeroPlayer /> : <MobileFallback />;
}
