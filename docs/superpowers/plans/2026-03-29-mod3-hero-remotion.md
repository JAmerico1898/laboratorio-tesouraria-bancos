# Module 3 Hero Remotion Animation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-only Module 3 hero with a Remotion animation showing an animated NTN-F cash flow waterfall diagram with coupon bars, principal bar, and PU badge.

**Architecture:** Three Remotion sub-components (chart, text, root composition) plus a Player wrapper with mobile fallback. Same pattern as all previous module heroes. The Module 3 page replaces its hero `<section>` with the new component; everything below stays unchanged.

**Tech Stack:** Remotion (`useCurrentFrame`, `interpolate`, `spring`), `@remotion/player`, React, Tailwind CSS, Next.js dynamic imports.

**Spec:** `docs/superpowers/specs/2026-03-29-mod3-hero-remotion-design.md`

---

### Task 1: Create the NTN-F cash flow chart component

**Files:**
- Create: `src/components/remotion/Mod3CashFlow.tsx`

- [ ] **Step 1: Create the Mod3CashFlow component**

Create `src/components/remotion/Mod3CashFlow.tsx`:

```tsx
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const COUPON = 48.81;
const FINAL = 1048.81;

const FLOWS = [
  { date: "Jul/25", amount: COUPON, isFinal: false },
  { date: "Jan/26", amount: COUPON, isFinal: false },
  { date: "Jul/26", amount: COUPON, isFinal: false },
  { date: "Jan/27", amount: COUPON, isFinal: false },
  { date: "Jul/27", amount: COUPON, isFinal: false },
  { date: "Jan/28", amount: COUPON, isFinal: false },
  { date: "Jul/28", amount: COUPON, isFinal: false },
  { date: "Jan/29", amount: FINAL, isFinal: true },
];

const CHART = { left: 8, right: 96, top: 12, bottom: 85 };
const MAX_AMOUNT = 1100; // for y-axis scaling

const GRID_Y = [
  { amount: 200, label: "200" },
  { amount: 500, label: "500" },
  { amount: 1000, label: "1000" },
];

function amountToHeight(amount: number): number {
  return (amount / MAX_AMOUNT) * (CHART.bottom - CHART.top);
}

function amountToY(amount: number): number {
  return CHART.bottom - amountToHeight(amount);
}

// Bar positions evenly spaced
function barX(index: number): number {
  const totalBars = FLOWS.length;
  const usableWidth = CHART.right - CHART.left - 10; // padding
  const spacing = usableWidth / totalBars;
  return CHART.left + 5 + index * spacing;
}

const BAR_WIDTH = 7;

// Animation timing
const GRID_FADE_END = 30;
const BARS_START = 30;
const BAR_INTERVAL = 12; // frames between each bar appearing
const FINAL_BAR_START = BARS_START + 7 * BAR_INTERVAL; // after 7 coupon bars
const PU_BADGE_START = 140;

export function Mod3CashFlow() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Grid fade-in
  const gridOpacity = interpolate(frame, [0, GRID_FADE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title fade
  const titleOpacity = interpolate(frame, [5, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // PU badge fade
  const puBadgeOpacity = interpolate(frame, [PU_BADGE_START, PU_BADGE_START + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse after all bars drawn
  const allDrawn = frame > FINAL_BAR_START + 30;
  const pulseOpacity = allDrawn
    ? 0.85 + 0.15 * Math.sin((frame - FINAL_BAR_START - 30) * 0.06)
    : 1;

  // Fade-out for loop
  const fadeOut = interpolate(frame, [390, 450], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: fadeOut * pulseOpacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        style={{
          width: "96%",
          height: "90%",
          overflow: "visible",
        }}
      >
        <defs>
          <filter id="mod3Glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="mod3CouponGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#58f5d1" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#58f5d1" stopOpacity={0.5} />
          </linearGradient>
          <linearGradient id="mod3FinalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a853" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#d4a853" stopOpacity={0.6} />
          </linearGradient>
        </defs>

        {/* Grid */}
        <g opacity={gridOpacity}>
          {GRID_Y.map((g) => {
            const y = amountToY(g.amount);
            return (
              <g key={g.label}>
                <line
                  x1={CHART.left}
                  y1={y}
                  x2={CHART.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.15"
                />
                <text
                  x={CHART.left - 1}
                  y={y + 0.8}
                  fill="rgba(255,255,255,0.35)"
                  fontSize="2"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="end"
                >
                  {g.label}
                </text>
              </g>
            );
          })}
          {/* Baseline */}
          <line
            x1={CHART.left}
            y1={CHART.bottom}
            x2={CHART.right}
            y2={CHART.bottom}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.2"
          />
          {/* Y-axis label */}
          <text
            x={CHART.left - 1}
            y={CHART.top}
            fill="rgba(255,255,255,0.25)"
            fontSize="1.8"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="end"
          >
            R$
          </text>
        </g>

        {/* Chart title */}
        <text
          x={CHART.left}
          y={CHART.top - 2}
          fill="rgba(255,255,255,0.5)"
          fontSize="3"
          fontFamily="var(--font-space-grotesk), monospace"
          opacity={titleOpacity}
        >
          Fluxo de Caixa — NTN-F 2029
        </text>

        {/* Cash flow bars */}
        {FLOWS.map((flow, i) => {
          const x = barX(i);
          const barAppearFrame = flow.isFinal ? FINAL_BAR_START : BARS_START + i * BAR_INTERVAL;
          const barScale = spring({
            frame: frame - barAppearFrame,
            fps,
            config: { damping: 12, stiffness: 120 },
          });
          const h = amountToHeight(flow.amount) * barScale;
          const y = CHART.bottom - h;

          return (
            <g key={`bar-${i}`}>
              {/* Bar */}
              <rect
                x={x - BAR_WIDTH / 2}
                y={y}
                width={BAR_WIDTH}
                height={h}
                rx="0.5"
                fill={flow.isFinal ? "url(#mod3FinalGrad)" : "url(#mod3CouponGrad)"}
                filter="url(#mod3Glow)"
              />
              {/* Amount label above bar */}
              {barScale > 0.5 && (
                <text
                  x={x}
                  y={y - 1.5}
                  fill={flow.isFinal ? "#d4a853" : "#58f5d1"}
                  fontSize="2"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="middle"
                  opacity={interpolate(barScale, [0.5, 1], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })}
                >
                  {flow.amount.toFixed(0) === "49" ? "48.81" : flow.amount.toFixed(0) === "1049" ? "1048.81" : flow.amount.toFixed(2)}
                </text>
              )}
              {/* Date label below baseline */}
              <text
                x={x}
                y={CHART.bottom + 3.5}
                fill="rgba(255,255,255,0.4)"
                fontSize="1.8"
                fontFamily="var(--font-space-grotesk), monospace"
                textAnchor="middle"
                opacity={gridOpacity}
              >
                {flow.date}
              </text>
            </g>
          );
        })}

        {/* PU Result Badge */}
        <g opacity={puBadgeOpacity}>
          <rect
            x="35"
            y={CHART.top + 2}
            width="30"
            height="10"
            rx="1.5"
            fill="rgba(88,245,209,0.1)"
            stroke="rgba(88,245,209,0.35)"
            strokeWidth="0.15"
          />
          <text
            x="50"
            y={CHART.top + 7}
            fill="#58f5d1"
            fontSize="2.8"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="middle"
            fontWeight="bold"
          >
            PU = R$ 987,32
          </text>
          <text
            x="50"
            y={CHART.top + 10.5}
            fill="rgba(255,255,255,0.4)"
            fontSize="2"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="middle"
          >
            Taxa: 12.50% a.a.
          </text>
        </g>
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/Mod3CashFlow.tsx
git commit -m "feat(mod3): add Remotion NTN-F cash flow chart component"
```

---

### Task 2: Create the Module 3 hero text component

**Files:**
- Create: `src/components/remotion/Mod3HeroText.tsx`

- [ ] **Step 1: Create the Mod3HeroText component**

Create `src/components/remotion/Mod3HeroText.tsx`:

```tsx
import { useCurrentFrame, interpolate } from "remotion";
import { strings } from "@/lib/strings";

const TITLE_START = 180;
const SUBTITLE_START = 248;
const FADEOUT_START = 390;
const FADEOUT_END = 450;

export function Mod3HeroText() {
  const frame = useCurrentFrame();

  // Eyebrow fade
  const eyebrowOpacity = interpolate(
    frame,
    [TITLE_START, TITLE_START + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Split title: "Precificação" and "de Ativos"
  const titleWords = strings.mod3Title.split(" ");
  const line1 = titleWords[0]; // "Precificação"
  const line2 = titleWords.slice(1).join(" "); // "de Ativos"

  // Line 1 typing
  const line1Start = TITLE_START + 12;
  const line1Frames = 22;
  const line1CharCount = Math.floor(
    interpolate(frame, [line1Start, line1Start + line1Frames], [0, line1.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Line 2 typing
  const line2Start = line1Start + line1Frames + 3;
  const line2Frames = 18;
  const line2CharCount = Math.floor(
    interpolate(frame, [line2Start, line2Start + line2Frames], [0, line2.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Cursor
  const showCursor =
    frame >= line1Start && frame <= line2Start + line2Frames + 10;
  const cursorOpacity = showCursor ? (Math.sin(frame * 0.4) > 0 ? 1 : 0) : 0;

  // Subtitle fade
  const subtitleOpacity = interpolate(
    frame,
    [SUBTITLE_START, SUBTITLE_START + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Fade-out
  const fadeOut = interpolate(
    frame,
    [FADEOUT_START, FADEOUT_END],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Slide-in
  const slideIn = interpolate(
    frame,
    [TITLE_START - 10, TITLE_START + 20],
    [-30, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const containerOpacity = interpolate(
    frame,
    [TITLE_START - 10, TITLE_START],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "50%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 5%",
        gap: 8,
        zIndex: 2,
        opacity: fadeOut * containerOpacity,
        transform: `translateX(${slideIn}px)`,
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
        {strings.mod3Eyebrow}
      </span>

      {/* Title — two lines */}
      <div style={{ marginTop: 8 }}>
        <div
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {line1.slice(0, line1CharCount)}
          {frame >= line1Start && frame < line2Start && (
            <span style={{ opacity: cursorOpacity, color: "#58f5d1" }}>|</span>
          )}
        </div>
        <div
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            background: "linear-gradient(to right, #58f5d1, #1cd0ad)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {line2.slice(0, line2CharCount)}
          {frame >= line2Start && frame < line2Start + line2Frames + 10 && (
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

      {/* Subtitle */}
      <p
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 18,
          color: "rgba(255,255,255,0.5)",
          fontStyle: "italic",
          fontWeight: 300,
          lineHeight: 1.6,
          maxWidth: 480,
          marginTop: 8,
          opacity: subtitleOpacity,
        }}
      >
        {strings.mod3Subtitle}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/Mod3HeroText.tsx
git commit -m "feat(mod3): add Remotion hero text component with typing effect"
```

---

### Task 3: Create the Module 3 hero animation composition

**Files:**
- Create: `src/components/remotion/Mod3HeroAnimation.tsx`

- [ ] **Step 1: Create the Mod3HeroAnimation composition**

Create `src/components/remotion/Mod3HeroAnimation.tsx`:

```tsx
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Mod3CashFlow } from "./Mod3CashFlow";
import { Mod3HeroText } from "./Mod3HeroText";

export const MOD3_COMP_WIDTH = 1920;
export const MOD3_COMP_HEIGHT = 800;
export const MOD3_FPS = 30;
export const MOD3_DURATION_FRAMES = 450;

export function Mod3HeroAnimation() {
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
      <Mod3CashFlow />

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

      <Mod3HeroText />
    </AbsoluteFill>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/Mod3HeroAnimation.tsx
git commit -m "feat(mod3): add Remotion hero animation composition"
```

---

### Task 4: Create Module 3 hero section with Player and mobile fallback

**Files:**
- Create: `src/components/Mod3HeroSection.tsx`
- Create: `src/components/Mod3HeroPlayer.tsx`

- [ ] **Step 1: Create the Mod3HeroSection component**

Create `src/components/Mod3HeroSection.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { strings } from "@/lib/strings";

const Mod3HeroPlayer = dynamic(() => import("./Mod3HeroPlayer"), { ssr: false });

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
          {strings.mod3Eyebrow}
        </span>
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold mt-3 mb-2 tracking-tight">
          {strings.mod3Title}
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg">
          {strings.mod3Subtitle}
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[20%] right-[-5%] w-[300px] h-[300px] rounded-full bg-primary/[0.08] blur-[60px]" />
      </div>
    </section>
  );
}

export function Mod3HeroSection() {
  const isDesktop = useIsDesktop();

  return isDesktop ? <Mod3HeroPlayer /> : <MobileFallback />;
}
```

- [ ] **Step 2: Create the Mod3HeroPlayer component**

Create `src/components/Mod3HeroPlayer.tsx`:

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Mod3HeroSection.tsx src/components/Mod3HeroPlayer.tsx
git commit -m "feat(mod3): add hero section with Remotion Player and mobile fallback"
```

---

### Task 5: Wire up Module 3 page

**Files:**
- Modify: `src/app/modulo-3/page.tsx`

- [ ] **Step 1: Update page.tsx to use Mod3HeroSection**

In `src/app/modulo-3/page.tsx`:

Add import after existing imports:
```tsx
import { Mod3HeroSection } from "@/components/Mod3HeroSection";
```

Replace the hero section (lines 44–56):
```tsx
      {/* Hero */}
      <section className="relative text-center px-6 pt-12 pb-10 max-w-4xl mx-auto">
        <div className="pointer-events-none absolute top-4 right-8 w-[180px] h-[180px] rounded-full bg-primary/[0.06] blur-[80px]" />
        <span className="font-label text-primary tracking-[0.3em] text-xs uppercase font-medium">
          {strings.mod3Eyebrow}
        </span>
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold mt-3 mb-2 tracking-tight">
          {strings.mod3Title}
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg">
          {strings.mod3Subtitle}
        </p>
      </section>
```

With:
```tsx
      {/* Remotion Hero */}
      <Mod3HeroSection />
```

Change the overview section class from `mb-6` to `mb-6 mt-10`.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/modulo-3/page.tsx
git commit -m "feat(mod3): wire Remotion hero into Module 3 page, remove old hero"
```

---

### Task 6: Manual visual verification

- [ ] **Step 1: Verify desktop at http://localhost:3000/modulo-3**

1. Grid and "Fluxo de Caixa — NTN-F 2029" title fade in (0–1s)
2. Seven teal coupon bars grow up sequentially with spring animation (1–4s)
3. Final amber bar (1048.81) grows tall (4–5s)
4. PU badge "PU = R$ 987,32 / Taxa: 12.50% a.a." fades in
5. Chart holds full-screen (5–6s)
6. Gradient mask fades, "Módulo 03" + "Precificação" / "de Ativos" type (6–8s)
7. Subtitle fades, holds (8–13s), fade-out and loop (13–15s)
8. Overview, connection, progression, topic cards, exercise CTA unchanged below

- [ ] **Step 2: Verify mobile — static fallback**

- [ ] **Step 3: Verify production build**
