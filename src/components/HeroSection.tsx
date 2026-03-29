"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { strings } from "@/lib/strings";

const HeroPlayer = dynamic(() => import("./HeroPlayer"), { ssr: false });

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
      className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, hsl(220,60%,8%) 0%, hsl(230,30%,12%) 60%, hsl(210,50%,6%) 100%)",
      }}
    >
      <div className="relative z-10 flex flex-col items-start w-full max-w-lg gap-3">
        <span className="font-label text-primary tracking-[0.3em] text-xs uppercase font-medium">
          {strings.eyebrow}
        </span>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight leading-[1.05]">
          {strings.heroHeadline1}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dim to-primary-container">
            {strings.heroHeadline2}
          </span>
        </h1>
        <p className="text-on-surface-variant text-base italic font-light leading-relaxed max-w-md">
          {strings.heroSubtitle}
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[20%] right-[-5%] w-[300px] h-[300px] rounded-full bg-primary/[0.08] blur-[60px]" />
      </div>
    </section>
  );
}

export function HeroSection() {
  const isDesktop = useIsDesktop();

  return isDesktop ? <HeroPlayer /> : <MobileFallback />;
}
