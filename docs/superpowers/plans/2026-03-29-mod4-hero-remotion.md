# Module 4 Hero Remotion Animation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-only Module 4 hero with a Remotion animation showing a duration vs convexity sensitivity chart (ΔPU vs Δrate).

**Architecture:** Three Remotion sub-components (chart, text, root composition) plus a Player wrapper with mobile fallback. Same pattern as all previous module heroes.

**Tech Stack:** Remotion (`useCurrentFrame`, `interpolate`), `@remotion/player`, React, Tailwind CSS, Next.js dynamic imports.

**Spec:** `docs/superpowers/specs/2026-03-29-mod4-hero-remotion-design.md`

---

### Task 1: Create the sensitivity chart component

**Files:**
- Create: `src/components/remotion/Mod4Sensitivity.tsx`

- [ ] **Step 1: Create the Mod4Sensitivity component**

Create `src/components/remotion/Mod4Sensitivity.tsx`:

```tsx
import { useCurrentFrame, interpolate } from "remotion";

// Chart area in SVG viewBox units (0–100)
const CHART = { left: 10, right: 96, top: 10, bottom: 90 };

// Axis ranges
const RATE_MIN = -0.02; // -200bps
const RATE_MAX = 0.02;  // +200bps
const PU_MIN = -0.15;   // -15%
const PU_MAX = 0.15;    // +15%

// Duration and convexity parameters
const DURATION = 6;
const CONVEXITY = 50;

function rateToX(rate: number): number {
  return CHART.left + ((rate - RATE_MIN) / (RATE_MAX - RATE_MIN)) * (CHART.right - CHART.left);
}

function puToY(pu: number): number {
  return CHART.top + ((PU_MAX - pu) / (PU_MAX - PU_MIN)) * (CHART.bottom - CHART.top);
}

// Duration line: ΔPU = -duration × Δrate
function durationPU(rate: number): number {
  return -DURATION * rate;
}

// Convexity curve: ΔPU = -duration × Δrate + 0.5 × convexity × Δrate²
function convexityPU(rate: number): number {
  return -DURATION * rate + 0.5 * CONVEXITY * rate * rate;
}

// Build SVG path from a function sampled at many points
function buildFnPath(fn: (rate: number) => number, steps: number): string {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const rate = RATE_MIN + (i / steps) * (RATE_MAX - RATE_MIN);
    pts.push({ x: rateToX(rate), y: puToY(fn(rate)) });
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

// Build area path between duration line and convexity curve
function buildGainArea(steps: number): string {
  const convPts: { x: number; y: number }[] = [];
  const durPts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const rate = RATE_MIN + (i / steps) * (RATE_MAX - RATE_MIN);
    convPts.push({ x: rateToX(rate), y: puToY(convexityPU(rate)) });
    durPts.push({ x: rateToX(rate), y: puToY(durationPU(rate)) });
  }
  // Forward along convexity curve, backward along duration line
  let d = `M ${convPts[0].x} ${convPts[0].y}`;
  for (let i = 1; i < convPts.length; i++) {
    d += ` L ${convPts[i].x} ${convPts[i].y}`;
  }
  for (let i = durPts.length - 1; i >= 0; i--) {
    d += ` L ${durPts[i].x} ${durPts[i].y}`;
  }
  d += " Z";
  return d;
}

const GRID_RATES = [-0.02, -0.01, 0, 0.01, 0.02];
const GRID_RATE_LABELS = ["-200", "-100", "0", "+100", "+200"];
const GRID_PU = [-0.15, -0.10, -0.05, 0, 0.05, 0.10, 0.15];
const GRID_PU_LABELS = ["-15%", "-10%", "-5%", "0%", "+5%", "+10%", "+15%"];

// Animation timing
const DUR_START = 30;
const DUR_END = 90;
const CONV_START = 90;
const CONV_END = 150;

export function Mod4Sensitivity() {
  const frame = useCurrentFrame();

  // Grid fade-in
  const gridOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title fade
  const titleOpacity = interpolate(frame, [5, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Duration line draw (from center outward)
  const durProgress = interpolate(frame, [DUR_START, DUR_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const durEased = 1 - Math.pow(1 - durProgress, 2);

  // Convexity curve draw (from center outward)
  const convProgress = interpolate(frame, [CONV_START, CONV_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const convEased = 1 - Math.pow(1 - convProgress, 2);

  // Gain area fade
  const gainOpacity = interpolate(frame, [CONV_START + 30, CONV_END + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Labels fade
  const labelOpacity = interpolate(frame, [CONV_END - 10, CONV_END + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse after drawn
  const pulseOpacity =
    frame > CONV_END
      ? 0.85 + 0.15 * Math.sin((frame - CONV_END) * 0.06)
      : 1;

  // Fade-out for loop
  const fadeOut = interpolate(frame, [390, 450], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const durationPath = buildFnPath(durationPU, 50);
  const convexityPath = buildFnPath(convexityPU, 50);
  const gainAreaPath = buildGainArea(50);

  // Center coordinates
  const centerX = rateToX(0);
  const centerY = puToY(0);

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
          <filter id="mod4Glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="mod4GainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a853" stopOpacity={0.2} />
            <stop offset="50%" stopColor="#d4a853" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#d4a853" stopOpacity={0.2} />
          </linearGradient>
        </defs>

        {/* Grid */}
        <g opacity={gridOpacity}>
          {/* Horizontal grid lines */}
          {GRID_PU.map((pu, i) => {
            const y = puToY(pu);
            const isCenter = pu === 0;
            return (
              <g key={`gy-${i}`}>
                <line
                  x1={CHART.left}
                  y1={y}
                  x2={CHART.right}
                  y2={y}
                  stroke={isCenter ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}
                  strokeWidth={isCenter ? "0.25" : "0.15"}
                />
                <text
                  x={CHART.left - 1.5}
                  y={y + 0.8}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="2"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="end"
                >
                  {GRID_PU_LABELS[i]}
                </text>
              </g>
            );
          })}
          {/* Vertical grid lines */}
          {GRID_RATES.map((rate, i) => {
            const x = rateToX(rate);
            const isCenter = rate === 0;
            return (
              <g key={`gx-${i}`}>
                <line
                  x1={x}
                  y1={CHART.top}
                  x2={x}
                  y2={CHART.bottom}
                  stroke={isCenter ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}
                  strokeWidth={isCenter ? "0.25" : "0.15"}
                />
                <text
                  x={x}
                  y={CHART.bottom + 3.5}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="2"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="middle"
                >
                  {GRID_RATE_LABELS[i]}
                </text>
              </g>
            );
          })}
          {/* Axis labels */}
          <text
            x={(CHART.left + CHART.right) / 2}
            y={CHART.bottom + 7}
            fill="rgba(255,255,255,0.3)"
            fontSize="2.2"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="middle"
          >
            Δ Taxa (bps)
          </text>
          <text
            x={CHART.left - 1}
            y={CHART.top - 2}
            fill="rgba(255,255,255,0.3)"
            fontSize="2.2"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="end"
          >
            ΔPU
          </text>
        </g>

        {/* Chart title */}
        <text
          x={CHART.left}
          y={CHART.top - 5}
          fill="rgba(255,255,255,0.5)"
          fontSize="3"
          fontFamily="var(--font-space-grotesk), monospace"
          opacity={titleOpacity}
        >
          {"Sensibilidade — ΔPU vs ΔTaxa"}
        </text>

        {/* Convexity gain area (between the two curves) */}
        <path
          d={gainAreaPath}
          fill="url(#mod4GainGrad)"
          opacity={gainOpacity}
        />

        {/* Duration line (dashed teal) — clip from center outward */}
        <clipPath id="mod4DurClip">
          <rect
            x={centerX - durEased * (centerX - CHART.left)}
            y="0"
            width={durEased * (CHART.right - CHART.left)}
            height="100"
          />
        </clipPath>
        <path
          d={durationPath}
          stroke="#58f5d1"
          strokeWidth="0.5"
          fill="none"
          strokeDasharray="1.5,1"
          filter="url(#mod4Glow)"
          clipPath="url(#mod4DurClip)"
        />

        {/* Convexity curve (solid amber) — clip from center outward */}
        <clipPath id="mod4ConvClip">
          <rect
            x={centerX - convEased * (centerX - CHART.left)}
            y="0"
            width={convEased * (CHART.right - CHART.left)}
            height="100"
          />
        </clipPath>
        <path
          d={convexityPath}
          stroke="#d4a853"
          strokeWidth="0.6"
          fill="none"
          strokeLinecap="round"
          filter="url(#mod4Glow)"
          clipPath="url(#mod4ConvClip)"
        />

        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r="0.8"
          fill="white"
          opacity={gridOpacity * 0.6}
        />

        {/* Labels */}
        <g opacity={labelOpacity}>
          <text
            x={rateToX(0.019)}
            y={puToY(durationPU(0.02)) + 3}
            fill="#58f5d1"
            fontSize="2.2"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="end"
            opacity={0.8}
          >
            Duration
          </text>
          <text
            x={rateToX(0.019)}
            y={puToY(convexityPU(0.02)) - 2}
            fill="#d4a853"
            fontSize="2.2"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="end"
          >
            Duration + Convexidade
          </text>
        </g>
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/Mod4Sensitivity.tsx
git commit -m "feat(mod4): add Remotion duration/convexity sensitivity chart"
```

---

### Task 2: Create the Module 4 hero text component

**Files:**
- Create: `src/components/remotion/Mod4HeroText.tsx`

- [ ] **Step 1: Create the Mod4HeroText component**

Create `src/components/remotion/Mod4HeroText.tsx`:

```tsx
import { useCurrentFrame, interpolate } from "remotion";
import { strings } from "@/lib/strings";

const TITLE_START = 180;
const SUBTITLE_START = 248;
const FADEOUT_START = 390;
const FADEOUT_END = 450;

export function Mod4HeroText() {
  const frame = useCurrentFrame();

  const eyebrowOpacity = interpolate(
    frame,
    [TITLE_START, TITLE_START + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Split title: "Gestão de" and "Carregamento"
  const titleWords = strings.mod4Title.split(" ");
  const line1 = titleWords.slice(0, 2).join(" "); // "Gestão de"
  const line2 = titleWords.slice(2).join(" "); // "Carregamento"

  const line1Start = TITLE_START + 12;
  const line1Frames = 18;
  const line1CharCount = Math.floor(
    interpolate(frame, [line1Start, line1Start + line1Frames], [0, line1.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const line2Start = line1Start + line1Frames + 3;
  const line2Frames = 22;
  const line2CharCount = Math.floor(
    interpolate(frame, [line2Start, line2Start + line2Frames], [0, line2.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const showCursor =
    frame >= line1Start && frame <= line2Start + line2Frames + 10;
  const cursorOpacity = showCursor ? (Math.sin(frame * 0.4) > 0 ? 1 : 0) : 0;

  const subtitleOpacity = interpolate(
    frame,
    [SUBTITLE_START, SUBTITLE_START + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const fadeOut = interpolate(
    frame,
    [FADEOUT_START, FADEOUT_END],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

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
        {strings.mod4Eyebrow}
      </span>

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
        {strings.mod4Subtitle}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/Mod4HeroText.tsx
git commit -m "feat(mod4): add Remotion hero text component with typing effect"
```

---

### Task 3: Create the Module 4 hero animation composition

**Files:**
- Create: `src/components/remotion/Mod4HeroAnimation.tsx`

- [ ] **Step 1: Create the Mod4HeroAnimation composition**

Create `src/components/remotion/Mod4HeroAnimation.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/Mod4HeroAnimation.tsx
git commit -m "feat(mod4): add Remotion hero animation composition"
```

---

### Task 4: Create Module 4 hero section with Player and mobile fallback

**Files:**
- Create: `src/components/Mod4HeroSection.tsx`
- Create: `src/components/Mod4HeroPlayer.tsx`

- [ ] **Step 1: Create the Mod4HeroSection component**

Create `src/components/Mod4HeroSection.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { strings } from "@/lib/strings";

const Mod4HeroPlayer = dynamic(() => import("./Mod4HeroPlayer"), { ssr: false });

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
          {strings.mod4Eyebrow}
        </span>
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold mt-3 mb-2 tracking-tight">
          {strings.mod4Title}
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg">
          {strings.mod4Subtitle}
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[20%] right-[-5%] w-[300px] h-[300px] rounded-full bg-primary/[0.08] blur-[60px]" />
      </div>
    </section>
  );
}

export function Mod4HeroSection() {
  const isDesktop = useIsDesktop();

  return isDesktop ? <Mod4HeroPlayer /> : <MobileFallback />;
}
```

- [ ] **Step 2: Create the Mod4HeroPlayer component**

Create `src/components/Mod4HeroPlayer.tsx`:

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Mod4HeroSection.tsx src/components/Mod4HeroPlayer.tsx
git commit -m "feat(mod4): add hero section with Remotion Player and mobile fallback"
```

---

### Task 5: Wire up Module 4 page

**Files:**
- Modify: `src/app/modulo-4/page.tsx`

- [ ] **Step 1: Update page.tsx to use Mod4HeroSection**

In `src/app/modulo-4/page.tsx`:

Add import after existing imports:
```tsx
import { Mod4HeroSection } from "@/components/Mod4HeroSection";
```

Replace the hero section (lines 52–64):
```tsx
      {/* Hero */}
      <section className="relative text-center px-6 pt-12 pb-10 max-w-4xl mx-auto">
        <div className="pointer-events-none absolute top-4 right-8 w-[180px] h-[180px] rounded-full bg-primary/[0.06] blur-[80px]" />
        <span className="font-label text-primary tracking-[0.3em] text-xs uppercase font-medium">
          {strings.mod4Eyebrow}
        </span>
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold mt-3 mb-2 tracking-tight">
          {strings.mod4Title}
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg">
          {strings.mod4Subtitle}
        </p>
      </section>
```

With:
```tsx
      {/* Remotion Hero */}
      <Mod4HeroSection />
```

Change the overview section class from `mb-6` to `mb-6 mt-10`.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/modulo-4/page.tsx
git commit -m "feat(mod4): wire Remotion hero into Module 4 page, remove old hero"
```
