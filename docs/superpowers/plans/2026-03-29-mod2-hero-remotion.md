# Module 2 Hero Remotion Animation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-only Module 2 hero with a Remotion animation showing animated spot and forward yield curves with a crossover, representing the core ETTJ concept.

**Architecture:** Three Remotion sub-components (chart, text, root composition) plus a Player wrapper with mobile fallback. Same pattern as homepage and Module 1 heroes. The Module 2 page replaces its hero `<section>` with the new component; everything below (overview, connection card, progression bar, topic cards, exercise CTA) stays unchanged.

**Tech Stack:** Remotion (`useCurrentFrame`, `interpolate`, `spring`), `@remotion/player`, React, Tailwind CSS, Next.js dynamic imports.

**Spec:** `docs/superpowers/specs/2026-03-29-mod2-hero-remotion-design.md`

---

### Task 1: Create the Spot vs Forward chart component

**Files:**
- Create: `src/components/remotion/Mod2SpotForward.tsx`

- [ ] **Step 1: Create the Mod2SpotForward component**

Create `src/components/remotion/Mod2SpotForward.tsx`:

```tsx
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

// Maturity vertices with spot and forward rates
const VERTICES = [
  { label: "6M", x: 8, spot: 10.75, fwd: 11.50 },
  { label: "1Y", x: 28, spot: 11.50, fwd: 13.00 },
  { label: "2Y", x: 48, spot: 12.25, fwd: 13.80 },
  { label: "5Y", x: 74, spot: 13.00, fwd: 13.20 },
  { label: "10Y", x: 94, spot: 13.40, fwd: 12.80 },
];

const GRID_Y = [
  { rate: 10.5, label: "10.5%" },
  { rate: 12.0, label: "12.0%" },
  { rate: 13.5, label: "13.5%" },
];

const CHART = { left: 8, right: 96, top: 15, bottom: 88 };
const RATE_MIN = 9.5;
const RATE_MAX = 14.5;

function rateToY(rate: number): number {
  return CHART.top + ((RATE_MAX - rate) / (RATE_MAX - RATE_MIN)) * (CHART.bottom - CHART.top);
}

function buildCurvePath(key: "spot" | "fwd"): string {
  const pts = VERTICES.map((v) => ({ x: v.x, y: rateToY(v[key]) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const cp1x = p.x + (c.x - p.x) * 0.4;
    const cp2x = p.x + (c.x - p.x) * 0.6;
    d += ` C ${cp1x} ${p.y}, ${cp2x} ${c.y}, ${c.x} ${c.y}`;
  }
  return d;
}

function buildAreaPath(): string {
  const pts = VERTICES.map((v) => ({ x: v.x, y: rateToY(v.spot) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const cp1x = p.x + (c.x - p.x) * 0.4;
    const cp2x = p.x + (c.x - p.x) * 0.6;
    d += ` C ${cp1x} ${p.y}, ${cp2x} ${c.y}, ${c.x} ${c.y}`;
  }
  const last = pts[pts.length - 1];
  const first = pts[0];
  d += ` L ${last.x} ${CHART.bottom} L ${first.x} ${CHART.bottom} Z`;
  return d;
}

// Timing
const SPOT_START = 30;
const SPOT_END = 90;     // 1–3s
const FWD_START = 90;
const FWD_END = 150;     // 3–5s

export function Mod2SpotForward() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Grid fade-in
  const gridOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title + legend fade
  const titleOpacity = interpolate(frame, [5, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Spot draw progress
  const spotRaw = interpolate(frame, [SPOT_START, SPOT_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const spotProgress = 1 - Math.pow(1 - spotRaw, 2);

  // Forward draw progress
  const fwdRaw = interpolate(frame, [FWD_START, FWD_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fwdProgress = 1 - Math.pow(1 - fwdRaw, 2);

  // Forward rate bars fade in
  const barsOpacity = interpolate(frame, [FWD_START + 20, FWD_END], [0, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse after both drawn
  const pulseOpacity =
    frame > FWD_END
      ? 0.85 + 0.15 * Math.sin((frame - FWD_END) * 0.06)
      : 1;

  // Fade-out for loop
  const fadeOut = interpolate(frame, [390, 450], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const spotPath = buildCurvePath("spot");
  const fwdPath = buildCurvePath("fwd");
  const areaPath = buildAreaPath();

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
          <linearGradient id="mod2SpotArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#58f5d1" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#58f5d1" stopOpacity={0.02} />
          </linearGradient>
          <filter id="mod2Glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid */}
        <g opacity={gridOpacity}>
          {GRID_Y.map((g) => {
            const y = rateToY(g.rate);
            return (
              <g key={g.label}>
                <line
                  x1={CHART.left}
                  y1={y}
                  x2={CHART.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="0.2"
                />
                <text
                  x={CHART.left - 1.5}
                  y={y + 1}
                  fill="rgba(255,255,255,0.45)"
                  fontSize="2.5"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="end"
                >
                  {g.label}
                </text>
              </g>
            );
          })}
          {VERTICES.map((v) => (
            <g key={`grid-${v.label}`}>
              <line
                x1={v.x}
                y1={CHART.top}
                x2={v.x}
                y2={CHART.bottom}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.2"
              />
              <text
                x={v.x}
                y={CHART.bottom + 4}
                fill="rgba(255,255,255,0.45)"
                fontSize="2.5"
                fontFamily="var(--font-space-grotesk), monospace"
                textAnchor="middle"
              >
                {v.label}
              </text>
            </g>
          ))}
          <line
            x1={CHART.left}
            y1={CHART.bottom}
            x2={CHART.right}
            y2={CHART.bottom}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.2"
          />
        </g>

        {/* Chart title */}
        <text
          x={CHART.left}
          y={CHART.top - 3}
          fill="rgba(255,255,255,0.5)"
          fontSize="3"
          fontFamily="var(--font-space-grotesk), monospace"
          opacity={titleOpacity}
        >
          Spot × Forward — DI Futuro
        </text>

        {/* Legend */}
        <g opacity={titleOpacity}>
          <line x1="68" y1={CHART.top - 4} x2="74" y2={CHART.top - 4} stroke="#58f5d1" strokeWidth="0.5" />
          <text x="75.5" y={CHART.top - 2.8} fill="rgba(255,255,255,0.45)" fontSize="2.2" fontFamily="var(--font-space-grotesk), monospace">
            Spot
          </text>
          <line x1="82" y1={CHART.top - 4} x2="88" y2={CHART.top - 4} stroke="#d4a853" strokeWidth="0.5" strokeDasharray="1.5,1" />
          <text x="89.5" y={CHART.top - 2.8} fill="rgba(255,255,255,0.45)" fontSize="2.2" fontFamily="var(--font-space-grotesk), monospace">
            Forward
          </text>
        </g>

        {/* Forward rate bars between vertices */}
        {VERTICES.slice(0, -1).map((v, i) => {
          const next = VERTICES[i + 1];
          const fwdY = rateToY(next.fwd);
          const barX = v.x + (next.x - v.x) * 0.15;
          const barW = (next.x - v.x) * 0.7;
          return (
            <rect
              key={`bar-${v.label}`}
              x={barX}
              y={fwdY}
              width={barW}
              height={CHART.bottom - fwdY}
              rx="0.5"
              fill="#d4a853"
              opacity={barsOpacity * 0.08}
            />
          );
        })}

        {/* Spot curve clip */}
        <clipPath id="mod2SpotClip">
          <rect x="0" y="0" width={spotProgress * 100} height="100" />
        </clipPath>

        {/* Spot area fill */}
        <path
          d={areaPath}
          fill="url(#mod2SpotArea)"
          clipPath="url(#mod2SpotClip)"
        />

        {/* Spot curve */}
        <path
          d={spotPath}
          stroke="#58f5d1"
          strokeWidth="0.6"
          fill="none"
          strokeLinecap="round"
          filter="url(#mod2Glow)"
          style={{
            strokeDasharray: 200,
            strokeDashoffset: 200 * (1 - spotProgress),
          }}
        />

        {/* Forward curve (dashed) */}
        <path
          d={fwdPath}
          stroke="#d4a853"
          strokeWidth="0.6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="2,1.2"
          filter="url(#mod2Glow)"
          style={{
            strokeDasharray: "2,1.2",
            strokeDashoffset: frame < FWD_START ? 200 : 200 * (1 - fwdProgress),
          }}
        />

        {/* Spot vertex dots + rate badges */}
        {VERTICES.map((v) => {
          const spotY = rateToY(v.spot);
          const vertexNorm = (v.x - VERTICES[0].x) / (VERTICES[VERTICES.length - 1].x - VERTICES[0].x);
          const appearFrame = SPOT_START + vertexNorm * (SPOT_END - SPOT_START);
          const dotScale = spring({
            frame: frame - appearFrame,
            fps,
            config: { damping: 15, stiffness: 150 },
          });
          const badgeOpacity = interpolate(
            frame,
            [SPOT_END - 5, SPOT_END + 10],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <g key={`spot-${v.label}`}>
              <circle cx={v.x} cy={spotY} r={0.8 * dotScale} fill="#58f5d1" />
              <circle
                cx={v.x}
                cy={spotY}
                r={1.8 * dotScale}
                fill="none"
                stroke="#58f5d1"
                strokeWidth="0.15"
                opacity={0.3 * dotScale}
              />
              <g opacity={badgeOpacity}>
                <rect
                  x={v.x - 4.5}
                  y={spotY + 2}
                  width="9"
                  height="4"
                  rx="0.8"
                  fill="rgba(88,245,209,0.15)"
                  stroke="rgba(88,245,209,0.4)"
                  strokeWidth="0.12"
                />
                <text
                  x={v.x}
                  y={spotY + 4.8}
                  fill="#58f5d1"
                  fontSize="2.2"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="middle"
                >
                  {v.spot.toFixed(2)}
                </text>
              </g>
            </g>
          );
        })}

        {/* Forward vertex dots + rate badges */}
        {VERTICES.map((v) => {
          const fwdY = rateToY(v.fwd);
          const vertexNorm = (v.x - VERTICES[0].x) / (VERTICES[VERTICES.length - 1].x - VERTICES[0].x);
          const appearFrame = FWD_START + vertexNorm * (FWD_END - FWD_START);
          const dotScale = spring({
            frame: frame - appearFrame,
            fps,
            config: { damping: 15, stiffness: 150 },
          });
          const badgeOpacity = interpolate(
            frame,
            [FWD_END - 5, FWD_END + 10],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <g key={`fwd-${v.label}`}>
              <circle cx={v.x} cy={fwdY} r={0.8 * dotScale} fill="#d4a853" />
              <g opacity={badgeOpacity}>
                <rect
                  x={v.x - 4.5}
                  y={fwdY - 6}
                  width="9"
                  height="4"
                  rx="0.8"
                  fill="rgba(212,168,83,0.15)"
                  stroke="rgba(212,168,83,0.4)"
                  strokeWidth="0.12"
                />
                <text
                  x={v.x}
                  y={fwdY - 3.2}
                  fill="#d4a853"
                  fontSize="2.2"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="middle"
                >
                  {v.fwd.toFixed(2)}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/Mod2SpotForward.tsx
git commit -m "feat(mod2): add Remotion spot vs forward chart component"
```

---

### Task 2: Create the Module 2 hero text component

**Files:**
- Create: `src/components/remotion/Mod2HeroText.tsx`

- [ ] **Step 1: Create the Mod2HeroText component**

Create `src/components/remotion/Mod2HeroText.tsx`:

```tsx
import { useCurrentFrame, interpolate } from "remotion";
import { strings } from "@/lib/strings";

// Phase timing (frames at 30fps)
const TITLE_START = 180;     // 6s
const SUBTITLE_START = 240;  // 8s
const FADEOUT_START = 390;   // 13s
const FADEOUT_END = 450;     // 15s

export function Mod2HeroText() {
  const frame = useCurrentFrame();

  // Eyebrow fade
  const eyebrowOpacity = interpolate(
    frame,
    [TITLE_START, TITLE_START + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Split title: "Curva de Juros" and "(ETTJ)"
  const titleFull = strings.mod2Title; // "Curva de Juros (ETTJ)"
  const parenIdx = titleFull.indexOf("(");
  const line1 = parenIdx > 0 ? titleFull.slice(0, parenIdx).trim() : titleFull;
  const line2 = parenIdx > 0 ? titleFull.slice(parenIdx) : "";

  // Line 1 typing
  const line1Start = TITLE_START + 12;
  const line1Frames = 25;
  const line1CharCount = Math.floor(
    interpolate(frame, [line1Start, line1Start + line1Frames], [0, line1.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Line 2 typing
  const line2Start = line1Start + line1Frames + 3;
  const line2Frames = 15;
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
        {strings.mod2Eyebrow}
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
        {strings.mod2Subtitle}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/Mod2HeroText.tsx
git commit -m "feat(mod2): add Remotion hero text component with typing effect"
```

---

### Task 3: Create the Module 2 hero animation composition

**Files:**
- Create: `src/components/remotion/Mod2HeroAnimation.tsx`

- [ ] **Step 1: Create the Mod2HeroAnimation composition**

Create `src/components/remotion/Mod2HeroAnimation.tsx`:

```tsx
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Mod2SpotForward } from "./Mod2SpotForward";
import { Mod2HeroText } from "./Mod2HeroText";

export const MOD2_COMP_WIDTH = 1920;
export const MOD2_COMP_HEIGHT = 800;
export const MOD2_FPS = 30;
export const MOD2_DURATION_FRAMES = 450; // 15 seconds

export function Mod2HeroAnimation() {
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
      <Mod2SpotForward />

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

      <Mod2HeroText />
    </AbsoluteFill>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/Mod2HeroAnimation.tsx
git commit -m "feat(mod2): add Remotion hero animation composition"
```

---

### Task 4: Create Module 2 hero section with Player and mobile fallback

**Files:**
- Create: `src/components/Mod2HeroSection.tsx`
- Create: `src/components/Mod2HeroPlayer.tsx`

- [ ] **Step 1: Create the Mod2HeroSection component**

Create `src/components/Mod2HeroSection.tsx`:

```tsx
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
```

- [ ] **Step 2: Create the Mod2HeroPlayer component**

Create `src/components/Mod2HeroPlayer.tsx`:

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Mod2HeroSection.tsx src/components/Mod2HeroPlayer.tsx
git commit -m "feat(mod2): add hero section with Remotion Player and mobile fallback"
```

---

### Task 5: Wire up Module 2 page

**Files:**
- Modify: `src/app/modulo-2/page.tsx`

- [ ] **Step 1: Update page.tsx to use Mod2HeroSection**

In `src/app/modulo-2/page.tsx`:

Add import at top (after existing imports):
```tsx
import { Mod2HeroSection } from "@/components/Mod2HeroSection";
```

Replace the hero section (lines 52–64):
```tsx
      {/* Hero */}
      <section className="relative text-center px-6 pt-12 pb-10 max-w-4xl mx-auto">
        <div className="pointer-events-none absolute top-4 right-8 w-[180px] h-[180px] rounded-full bg-primary/[0.06] blur-[80px]" />
        <span className="font-label text-primary tracking-[0.3em] text-xs uppercase font-medium">
          {strings.mod2Eyebrow}
        </span>
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold mt-3 mb-2 tracking-tight">
          {strings.mod2Title}
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg">
          {strings.mod2Subtitle}
        </p>
      </section>
```

With:
```tsx
      {/* Remotion Hero */}
      <Mod2HeroSection />
```

Change the overview section class from `mb-6` to `mb-6 mt-10` for spacing after animation.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/modulo-2/page.tsx
git commit -m "feat(mod2): wire Remotion hero into Module 2 page, remove old hero"
```

---

### Task 6: Manual visual verification

No code changes — verification only.

- [ ] **Step 1: Verify desktop at http://localhost:3000/modulo-2**

1. Grid and "Spot × Forward — DI Futuro" title + legend fade in (0–1s)
2. Spot curve (solid teal) draws left-to-right with area fill (1–3s)
3. Forward curve (dashed amber) draws, forward rate bars fade in (3–5s)
4. Forward curve crosses below spot near the 10Y vertex
5. Rate badges visible on both curves
6. Gradient mask fades in, "Módulo 02" + "Curva de Juros" / "(ETTJ)" type (6–8s)
7. Subtitle fades in, holds for reading (8–13s)
8. Fade-out and loop (13–15s)
9. Overview, connection card, progression bar, topic cards, exercise CTA unchanged below

- [ ] **Step 2: Verify mobile (<768px) — static fallback**

- [ ] **Step 3: Verify production build**
