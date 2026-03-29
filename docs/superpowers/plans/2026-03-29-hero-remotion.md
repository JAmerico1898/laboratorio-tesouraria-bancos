# Hero Remotion Animation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static gradient-orb hero with a full-width Remotion animation featuring an animated yield curve and typing text effects, with a static fallback on mobile.

**Architecture:** A Remotion composition (`HeroAnimation`) renders the full hero content — background, yield curve, and text with typing/fade animations. A wrapper component (`HeroSection`) uses `@remotion/player` to play it on desktop (≥768px) and renders a static CSS fallback on mobile. The existing `hero.tsx` is replaced.

**Tech Stack:** Remotion (`useCurrentFrame`, `interpolate`, `spring`), `@remotion/player` (`<Player>`), React, Tailwind CSS, Next.js dynamic imports.

**Spec:** `docs/superpowers/specs/2026-03-29-hero-remotion-design.md`

---

### Task 1: Update subtitle in strings.ts

**Files:**
- Modify: `src/lib/strings.ts:9-10`

- [ ] **Step 1: Update the heroSubtitle string**

In `src/lib/strings.ts`, replace:

```ts
heroSubtitle:
  "Desenvolva maestria estratégica através do rigor acadêmico e da experimentação prática em tesouraria bancária",
```

with:

```ts
heroSubtitle:
  "Pratique decisões de tesouraria com dados e cenários do mercado brasileiro",
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/strings.ts
git commit -m "copy: update hero subtitle to be less formal"
```

---

### Task 2: Create the yield curve drawing component

**Files:**
- Create: `src/components/remotion/YieldCurve.tsx`

This is a sub-component used inside the Remotion composition. It draws the yield curve left-to-right with vertex dots and fading labels.

- [ ] **Step 1: Create the YieldCurve component**

Create `src/components/remotion/YieldCurve.tsx`:

```tsx
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const VERTICES = [
  { label: "6M", x: 15, y: 78 },
  { label: "1Y", x: 30, y: 65 },
  { label: "2Y", x: 50, y: 50 },
  { label: "5Y", x: 75, y: 35 },
  { label: "10Y", x: 95, y: 22 },
];

// Duration of the curve drawing phase in frames
const DRAW_DURATION = 90; // 0–3s at 30fps
const LABEL_VISIBLE_FRAMES = 15; // ~0.5s

function buildPathD(): string {
  // Build an SVG path through the vertices using quadratic curves
  const points = VERTICES.map((v) => ({ x: v.x, y: v.y }));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    const cpY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y}, ${cpX} ${cpY}`;
  }
  // Final segment to last point
  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];
  d += ` Q ${(secondLast.x + last.x) / 2 + 5} ${last.y + 5}, ${last.x} ${last.y}`;
  return d;
}

export function YieldCurve() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Draw progress: 0 → 1 over DRAW_DURATION frames
  const drawProgress = interpolate(frame, [0, DRAW_DURATION], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Pulse after drawing completes (subtle opacity oscillation)
  const pulseOpacity =
    frame > DRAW_DURATION
      ? 0.7 + 0.3 * Math.sin((frame - DRAW_DURATION) * 0.08)
      : 1;

  const pathD = buildPathD();

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        width: "65%",
        height: "100%",
        opacity: pulseOpacity,
      }}
    >
      {/* The curve path with stroke-dasharray animation */}
      <path
        d={pathD}
        stroke="#d4a853"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
        style={{
          strokeDasharray: 300,
          strokeDashoffset: 300 * (1 - drawProgress),
        }}
      />

      {/* Vertices: dot + label */}
      {VERTICES.map((v, i) => {
        // Each vertex appears when the curve reaches it
        const vertexProgress = (i + 1) / VERTICES.length;
        const appearFrame = vertexProgress * DRAW_DURATION;

        const dotScale = spring({
          frame: frame - appearFrame,
          fps,
          config: { damping: 12, stiffness: 200 },
        });

        // Label fades in then out
        const labelOpacity = interpolate(
          frame,
          [
            appearFrame,
            appearFrame + 5,
            appearFrame + LABEL_VISIBLE_FRAMES,
            appearFrame + LABEL_VISIBLE_FRAMES + 10,
          ],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <g key={v.label}>
            {/* Dot */}
            <circle
              cx={v.x}
              cy={v.y}
              r={1.2 * dotScale}
              fill="#d4a853"
            />
            {/* Glow behind dot */}
            <circle
              cx={v.x}
              cy={v.y}
              r={2.5 * dotScale}
              fill="#d4a853"
              opacity={0.2 * dotScale}
            />
            {/* Label */}
            <text
              x={v.x}
              y={v.y - 4}
              textAnchor="middle"
              fill="#d4a853"
              fontSize="3.5"
              fontFamily="var(--font-space-grotesk), monospace"
              opacity={labelOpacity}
            >
              {v.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/YieldCurve.tsx
git commit -m "feat(hero): add Remotion YieldCurve sub-component"
```

---

### Task 3: Create the animated text component

**Files:**
- Create: `src/components/remotion/HeroText.tsx`

This sub-component renders the eyebrow, headline (typing effect), and subtitle (word-by-word fade).

- [ ] **Step 1: Create the HeroText component**

Create `src/components/remotion/HeroText.tsx`:

```tsx
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { strings } from "@/lib/strings";

// Phase timing (frames at 30fps)
const TITLE_START = 90;   // 3s — after curve draws
const TITLE_END = 150;    // 5s
const SUBTITLE_START = 150; // 5s
const SUBTITLE_END = 195;   // 6.5s
const FADEOUT_START = 270;   // 9s
const FADEOUT_END = 300;     // 10s

export function HeroText() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Eyebrow: fade in at TITLE_START ---
  const eyebrowOpacity = interpolate(
    frame,
    [TITLE_START, TITLE_START + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // --- Headline 1: type letter by letter ---
  const h1Text = strings.heroHeadline1;
  const h1TotalFrames = 30; // 1 second to type
  const h1Start = TITLE_START + 15;
  const h1CharCount = Math.floor(
    interpolate(frame, [h1Start, h1Start + h1TotalFrames], [0, h1Text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // --- Headline 2: type letter by letter after h1 ---
  const h2Text = strings.heroHeadline2;
  const h2Start = h1Start + h1TotalFrames + 5;
  const h2TotalFrames = 35;
  const h2CharCount = Math.floor(
    interpolate(frame, [h2Start, h2Start + h2TotalFrames], [0, h2Text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // --- Typing cursor blink ---
  const showCursor =
    frame >= h1Start && frame <= h2Start + h2TotalFrames + 10;
  const cursorOpacity = showCursor ? (Math.sin(frame * 0.4) > 0 ? 1 : 0) : 0;

  // --- Subtitle: word by word ---
  const subtitleWords = strings.heroSubtitle.split(" ");
  const wordDuration = (SUBTITLE_END - SUBTITLE_START) / subtitleWords.length;

  // --- Global fade-out for loop ---
  const fadeOut = interpolate(
    frame,
    [FADEOUT_START, FADEOUT_END],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "55%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 5%",
        gap: 8,
        zIndex: 1,
        opacity: fadeOut,
      }}
    >
      {/* Eyebrow */}
      <span
        style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          color: "#58f5d1",
          letterSpacing: "0.3em",
          fontSize: 14,
          textTransform: "uppercase",
          fontWeight: 500,
          opacity: eyebrowOpacity,
        }}
      >
        {strings.eyebrow}
      </span>

      {/* Headline */}
      <div style={{ marginTop: 8 }}>
        <div
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {h1Text.slice(0, h1CharCount)}
          {frame >= h1Start && frame < h2Start && (
            <span style={{ opacity: cursorOpacity, color: "#58f5d1" }}>|</span>
          )}
        </div>
        <div
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            background: "linear-gradient(to right, #58f5d1, #1cd0ad)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {h2Text.slice(0, h2CharCount)}
          {frame >= h2Start && frame < h2Start + h2TotalFrames + 10 && (
            <span
              style={{
                opacity: cursorOpacity,
                WebkitTextFillColor: "#58f5d1",
              }}
            >
              |
            </span>
          )}
        </div>
      </div>

      {/* Subtitle — word by word */}
      <p
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 18,
          color: "rgba(255,255,255,0.5)",
          fontStyle: "italic",
          fontWeight: 300,
          lineHeight: 1.6,
          maxWidth: 480,
          marginTop: 12,
        }}
      >
        {subtitleWords.map((word, i) => {
          const wordStart = SUBTITLE_START + i * wordDuration;
          const wordOpacity = interpolate(
            frame,
            [wordStart, wordStart + 8],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <span key={i} style={{ opacity: wordOpacity }}>
              {word}{" "}
            </span>
          );
        })}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/HeroText.tsx
git commit -m "feat(hero): add Remotion HeroText sub-component with typing effects"
```

---

### Task 4: Create the HeroAnimation Remotion composition

**Files:**
- Create: `src/components/remotion/HeroAnimation.tsx`

This is the root Remotion composition that combines background, YieldCurve, and HeroText.

- [ ] **Step 1: Create the HeroAnimation composition**

Create `src/components/remotion/HeroAnimation.tsx`:

```tsx
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { YieldCurve } from "./YieldCurve";
import { HeroText } from "./HeroText";

export const HERO_COMP_WIDTH = 1920;
export const HERO_COMP_HEIGHT = 1080;
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/HeroAnimation.tsx
git commit -m "feat(hero): add HeroAnimation Remotion composition"
```

---

### Task 5: Create the HeroSection wrapper with Player and mobile fallback

**Files:**
- Create: `src/components/HeroSection.tsx`

This component renders the Remotion `<Player>` on desktop and a static fallback on mobile. Uses Next.js dynamic import to avoid SSR issues with Remotion.

- [ ] **Step 1: Create the HeroSection component**

Create `src/components/HeroSection.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { strings } from "@/lib/strings";

// Dynamic import to avoid SSR — Remotion requires browser APIs
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

      {/* Subtle background glow */}
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
```

- [ ] **Step 2: Create the HeroPlayer component (dynamic import target)**

Create `src/components/HeroPlayer.tsx`:

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/HeroSection.tsx src/components/HeroPlayer.tsx
git commit -m "feat(hero): add HeroSection with Player wrapper and mobile fallback"
```

---

### Task 6: Wire up page.tsx and remove old hero

**Files:**
- Modify: `src/app/page.tsx`
- Delete: `src/components/hero.tsx`

- [ ] **Step 1: Update page.tsx to use HeroSection**

Replace the full contents of `src/app/page.tsx` with:

```tsx
import { HeroSection } from "@/components/HeroSection";
import { ModuleCards } from "@/components/module-cards";

export default function HomePage() {
  return (
    <main className="mesh-bg pt-20">
      <HeroSection />
      <ModuleCards />
    </main>
  );
}
```

- [ ] **Step 2: Delete the old hero.tsx**

```bash
git rm src/components/hero.tsx
```

- [ ] **Step 3: Verify no other files import the old hero**

```bash
grep -r "from.*['\"]@/components/hero['\"]" src/ --include="*.tsx" --include="*.ts"
```

Expected: no results (only `page.tsx` used it, and it's been updated).

- [ ] **Step 4: Run the build to verify everything compiles**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(hero): wire HeroSection into homepage, remove old hero"
```

---

### Task 7: Manual visual verification

This task has no code changes — it's a verification step.

- [ ] **Step 1: Start dev server and verify desktop**

```bash
npm run dev
```

Open `http://localhost:3000` in a desktop browser (≥768px wide). Verify:

1. Dark gradient background shifts slowly
2. Yield curve draws left-to-right in golden color (~0–3s)
3. Vertex dots light up with labels (6M, 1Y, 2Y, 5Y, 10Y) that fade
4. Curve pulses gently after completing
5. Eyebrow fades in, then headline types letter-by-letter (~3–5s)
6. "Inteligência Financeira" has teal gradient
7. Subtitle appears word-by-word (~5–6.5s)
8. Everything holds, then fades for loop transition (~9–10s)
9. Loop is seamless

- [ ] **Step 2: Verify mobile fallback**

Resize browser to <768px or use DevTools mobile view. Verify:

1. No Remotion Player rendered (check React DevTools or Network tab — no remotion chunks loaded)
2. Static text displayed: eyebrow, headline, subtitle
3. Dark gradient background
4. Text is readable and well-spaced

- [ ] **Step 3: Verify production build**

```bash
npm run build && npm run start
```

Open `http://localhost:3000`. Verify animation works in production mode.

- [ ] **Step 4: Commit any fixes needed**

If visual adjustments are needed (timing, sizing, colors), make them and commit.
