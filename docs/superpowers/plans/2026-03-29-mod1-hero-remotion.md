# Module 1 Hero Remotion Animation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-only Module 1 hero with a Remotion animation showing animated PU discount curves at 3 rates, with text overlay appearing after the chart draws.

**Architecture:** Three Remotion sub-components (chart, text, root composition) plus a Player wrapper with mobile fallback. Follows the exact same pattern as the homepage hero (`HeroSection.tsx` / `HeroPlayer.tsx` / `remotion/HeroAnimation.tsx`). The Module 1 page replaces its hero `<section>` with the new component; everything below (overview card, topic cards, exercise CTA) stays unchanged.

**Tech Stack:** Remotion (`useCurrentFrame`, `interpolate`, `spring`), `@remotion/player`, React, Tailwind CSS, Next.js dynamic imports.

**Spec:** `docs/superpowers/specs/2026-03-29-mod1-hero-remotion-design.md`

---

### Task 1: Create the PU pricing curves chart component

**Files:**
- Create: `src/components/remotion/Mod1PricingCurves.tsx`

- [ ] **Step 1: Create the Mod1PricingCurves component**

Create `src/components/remotion/Mod1PricingCurves.tsx`:

```tsx
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

// PU = 1000 / (1 + rate)^(du/252)
function calcPU(rate: number, du: number): number {
  return 1000 / Math.pow(1 + rate, du / 252);
}

const RATES = [
  { rate: 0.07, color: "#2E8B57", label: "7%" },
  { rate: 0.10, color: "#58f5d1", label: "10%" },
  { rate: 0.13, color: "#d4a853", label: "13%" },
];

const DU_POINTS = [0, 63, 126, 189, 252, 378, 504, 630, 756];

const GRID_X_LABELS = [
  { du: 0, label: "0" },
  { du: 126, label: "126" },
  { du: 252, label: "252" },
  { du: 504, label: "504" },
  { du: 756, label: "756" },
];

const GRID_Y = [
  { pu: 1000, label: "1000" },
  { pu: 850, label: "850" },
  { pu: 700, label: "700" },
];

// Chart area bounds in SVG viewBox units (0-100)
const CHART = { left: 8, right: 96, top: 15, bottom: 88 };

// Map DU to x position
function duToX(du: number): number {
  return CHART.left + ((du / 756) * (CHART.right - CHART.left));
}

// Map PU to y position (1000 at top, 650 at bottom)
function puToY(pu: number): number {
  const puMax = 1050;
  const puMin = 650;
  return CHART.top + ((puMax - pu) / (puMax - puMin)) * (CHART.bottom - CHART.top);
}

function buildCurvePath(rate: number): string {
  const points = DU_POINTS.map((du) => ({
    x: duToX(du),
    y: puToY(calcPU(rate, du)),
  }));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const c = points[i];
    const cp1x = p.x + (c.x - p.x) * 0.4;
    const cp2x = p.x + (c.x - p.x) * 0.6;
    d += ` C ${cp1x} ${p.y}, ${cp2x} ${c.y}, ${c.x} ${c.y}`;
  }
  return d;
}

function buildAreaPath(rate: number): string {
  const points = DU_POINTS.map((du) => ({
    x: duToX(du),
    y: puToY(calcPU(rate, du)),
  }));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const c = points[i];
    const cp1x = p.x + (c.x - p.x) * 0.4;
    const cp2x = p.x + (c.x - p.x) * 0.6;
    d += ` C ${cp1x} ${p.y}, ${cp2x} ${c.y}, ${c.x} ${c.y}`;
  }
  const last = points[points.length - 1];
  const first = points[0];
  d += ` L ${last.x} ${CHART.bottom} L ${first.x} ${CHART.bottom} Z`;
  return d;
}

const DRAW_START = 30;    // frames — after grid fades in
const DRAW_END = 150;     // 5s total
const DRAW_DURATION = DRAW_END - DRAW_START;

export function Mod1PricingCurves() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Grid fade-in (first 30 frames)
  const gridOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chart title fade
  const titleOpacity = interpolate(frame, [5, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Draw progress
  const rawProgress = interpolate(frame, [DRAW_START, DRAW_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drawProgress = 1 - Math.pow(1 - rawProgress, 2); // ease-out

  // Crosshair follows the 10% curve
  const crosshairDU = drawProgress * 756;
  const crosshairX = duToX(crosshairDU);
  const crosshairPU = calcPU(0.10, crosshairDU);
  const crosshairY = puToY(crosshairPU);
  const crosshairVisible = frame >= DRAW_START && frame <= DRAW_END + 15;
  const crosshairFade = crosshairVisible
    ? interpolate(
        frame,
        [DRAW_END, DRAW_END + 15],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  // Pulse after drawing
  const pulseOpacity =
    frame > DRAW_END
      ? 0.85 + 0.15 * Math.sin((frame - DRAW_END) * 0.06)
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
          {/* Area gradient fill for 10% curve */}
          <linearGradient id="mod1AreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#58f5d1" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#58f5d1" stopOpacity={0.02} />
          </linearGradient>
          {/* Glow filter */}
          <filter id="mod1Glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid */}
        <g opacity={gridOpacity}>
          {/* Horizontal grid lines */}
          {GRID_Y.map((g) => {
            const y = puToY(g.pu);
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
          {/* Vertical grid lines */}
          {GRID_X_LABELS.map((g) => {
            const x = duToX(g.du);
            return (
              <g key={g.label}>
                <line
                  x1={x}
                  y1={CHART.top}
                  x2={x}
                  y2={CHART.bottom}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.2"
                />
                <text
                  x={x}
                  y={CHART.bottom + 4}
                  fill="rgba(255,255,255,0.45)"
                  fontSize="2.5"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="middle"
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
          {/* X-axis label */}
          <text
            x={(CHART.left + CHART.right) / 2}
            y={CHART.bottom + 8}
            fill="rgba(255,255,255,0.3)"
            fontSize="2.2"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="middle"
          >
            Dias Úteis (DU)
          </text>
        </g>

        {/* Chart title (formula) */}
        <text
          x={CHART.left}
          y={CHART.top - 3}
          fill="rgba(255,255,255,0.5)"
          fontSize="3"
          fontFamily="var(--font-space-grotesk), monospace"
          opacity={titleOpacity}
        >
          {"PU = 1000 / (1 + taxa)"}
          <tspan dy="-2" fontSize="2">(DU/252)</tspan>
        </text>

        {/* Clip for draw progress */}
        <clipPath id="mod1DrawClip">
          <rect x="0" y="0" width={drawProgress * 100} height="100" />
        </clipPath>

        {/* Area fill for 10% curve only */}
        <path
          d={buildAreaPath(0.10)}
          fill="url(#mod1AreaGrad)"
          clipPath="url(#mod1DrawClip)"
        />

        {/* All 3 curves */}
        {RATES.map((r) => (
          <path
            key={r.label}
            d={buildCurvePath(r.rate)}
            stroke={r.color}
            strokeWidth="0.6"
            fill="none"
            strokeLinecap="round"
            filter="url(#mod1Glow)"
            style={{
              strokeDasharray: 200,
              strokeDashoffset: 200 * (1 - drawProgress),
            }}
          />
        ))}

        {/* Rate labels at curve ends */}
        {RATES.map((r) => {
          const endX = duToX(756);
          const endY = puToY(calcPU(r.rate, 756));
          const labelOpacity = interpolate(
            frame,
            [DRAW_END - 10, DRAW_END + 5],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <g key={`label-${r.label}`} opacity={labelOpacity}>
              <rect
                x={endX + 1}
                y={endY - 2.5}
                width="6"
                height="4.5"
                rx="0.8"
                fill="rgba(0,0,0,0.4)"
                stroke={r.color}
                strokeWidth="0.15"
                strokeOpacity={0.5}
              />
              <text
                x={endX + 4}
                y={endY + 0.5}
                fill={r.color}
                fontSize="2.5"
                fontFamily="var(--font-space-grotesk), monospace"
                textAnchor="middle"
              >
                {r.label}
              </text>
            </g>
          );
        })}

        {/* Crosshair on 10% curve */}
        {crosshairVisible && (
          <g opacity={crosshairFade}>
            {/* Vertical dashed line */}
            <line
              x1={crosshairX}
              y1={CHART.top}
              x2={crosshairX}
              y2={CHART.bottom}
              stroke="#58f5d1"
              strokeWidth="0.2"
              strokeDasharray="1,1"
              opacity={0.4}
            />
            {/* Horizontal dashed line */}
            <line
              x1={CHART.left}
              y1={crosshairY}
              x2={CHART.right}
              y2={crosshairY}
              stroke="#58f5d1"
              strokeWidth="0.2"
              strokeDasharray="1,1"
              opacity={0.3}
            />
            {/* Dot with ring */}
            <circle
              cx={crosshairX}
              cy={crosshairY}
              r="1.5"
              fill="none"
              stroke="#58f5d1"
              strokeWidth="0.2"
              opacity={0.4}
            />
            <circle
              cx={crosshairX}
              cy={crosshairY}
              r="0.7"
              fill="#58f5d1"
            />
            {/* Tooltip */}
            <rect
              x={crosshairX + 1.5}
              y={crosshairY - 4}
              width="12"
              height="4.5"
              rx="0.8"
              fill="rgba(88,245,209,0.15)"
              stroke="rgba(88,245,209,0.4)"
              strokeWidth="0.15"
            />
            <text
              x={crosshairX + 7.5}
              y={crosshairY - 1}
              fill="#58f5d1"
              fontSize="2.5"
              fontFamily="var(--font-space-grotesk), monospace"
              textAnchor="middle"
            >
              {`R$ ${crosshairPU.toFixed(0)}`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/Mod1PricingCurves.tsx
git commit -m "feat(mod1): add Remotion PU pricing curves chart component"
```

---

### Task 2: Create the Module 1 hero text component

**Files:**
- Create: `src/components/remotion/Mod1HeroText.tsx`

- [ ] **Step 1: Create the Mod1HeroText component**

Create `src/components/remotion/Mod1HeroText.tsx`:

```tsx
import { useCurrentFrame, interpolate } from "remotion";
import { strings } from "@/lib/strings";

// Phase timing (frames at 30fps)
const TITLE_START = 180;     // 6s — after chart has been on screen
const SUBTITLE_START = 230;  // ~7.7s
const FADEOUT_START = 390;   // 13s
const FADEOUT_END = 450;     // 15s

export function Mod1HeroText() {
  const frame = useCurrentFrame();

  // --- Eyebrow: fade in ---
  const eyebrowOpacity = interpolate(
    frame,
    [TITLE_START, TITLE_START + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // --- Title: type letter by letter ---
  const titleText = strings.mod1Title; // "Operações Fundamentais"
  const titleStart = TITLE_START + 12;
  const titleTotalFrames = 35;
  const titleCharCount = Math.floor(
    interpolate(frame, [titleStart, titleStart + titleTotalFrames], [0, titleText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // --- Typing cursor blink ---
  const showCursor =
    frame >= titleStart && frame <= titleStart + titleTotalFrames + 10;
  const cursorOpacity = showCursor ? (Math.sin(frame * 0.4) > 0 ? 1 : 0) : 0;

  // --- Subtitle: fade in (short text, no word-by-word) ---
  const subtitleOpacity = interpolate(
    frame,
    [SUBTITLE_START, SUBTITLE_START + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // --- Global fade-out for loop ---
  const fadeOut = interpolate(
    frame,
    [FADEOUT_START, FADEOUT_END],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // --- Container slide-in from left ---
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
        {strings.mod1Eyebrow}
      </span>

      {/* Title — types letter by letter */}
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
          {titleText.slice(0, titleCharCount)}
          {showCursor && (
            <span style={{ opacity: cursorOpacity, color: "#58f5d1" }}>|</span>
          )}
        </div>
      </div>

      {/* Subtitle — fades in */}
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
        {strings.mod1Subtitle}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/Mod1HeroText.tsx
git commit -m "feat(mod1): add Remotion hero text component with typing effect"
```

---

### Task 3: Create the Module 1 hero animation composition

**Files:**
- Create: `src/components/remotion/Mod1HeroAnimation.tsx`

- [ ] **Step 1: Create the Mod1HeroAnimation composition**

Create `src/components/remotion/Mod1HeroAnimation.tsx`:

```tsx
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Mod1PricingCurves } from "./Mod1PricingCurves";
import { Mod1HeroText } from "./Mod1HeroText";

export const MOD1_COMP_WIDTH = 1920;
export const MOD1_COMP_HEIGHT = 800;
export const MOD1_FPS = 30;
export const MOD1_DURATION_FRAMES = 450; // 15 seconds

export function Mod1HeroAnimation() {
  const frame = useCurrentFrame();

  const gradientAngle = interpolate(frame, [0, 450], [135, 155], {
    extrapolateRight: "clamp",
  });

  const bgShift = interpolate(frame, [0, 450], [0, 10], {
    extrapolateRight: "clamp",
  });

  // Gradient mask fades in before text appears
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
      {/* Full-screen PU pricing chart */}
      <Mod1PricingCurves />

      {/* Gradient mask — darkens left side for text */}
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

      {/* Text overlay */}
      <Mod1HeroText />
    </AbsoluteFill>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/remotion/Mod1HeroAnimation.tsx
git commit -m "feat(mod1): add Remotion hero animation composition"
```

---

### Task 4: Create Module 1 hero section with Player and mobile fallback

**Files:**
- Create: `src/components/Mod1HeroSection.tsx`
- Create: `src/components/Mod1HeroPlayer.tsx`

- [ ] **Step 1: Create the Mod1HeroSection component**

Create `src/components/Mod1HeroSection.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { strings } from "@/lib/strings";

const Mod1HeroPlayer = dynamic(() => import("./Mod1HeroPlayer"), { ssr: false });

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
          {strings.mod1Eyebrow}
        </span>
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold mt-3 mb-2 tracking-tight">
          {strings.mod1Title}
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg">
          {strings.mod1Subtitle}
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[20%] right-[-5%] w-[300px] h-[300px] rounded-full bg-primary/[0.08] blur-[60px]" />
      </div>
    </section>
  );
}

export function Mod1HeroSection() {
  const isDesktop = useIsDesktop();

  return isDesktop ? <Mod1HeroPlayer /> : <MobileFallback />;
}
```

- [ ] **Step 2: Create the Mod1HeroPlayer component**

Create `src/components/Mod1HeroPlayer.tsx`:

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Mod1HeroSection.tsx src/components/Mod1HeroPlayer.tsx
git commit -m "feat(mod1): add hero section with Remotion Player and mobile fallback"
```

---

### Task 5: Wire up Module 1 page

**Files:**
- Modify: `src/app/modulo-1/page.tsx`

- [ ] **Step 1: Update page.tsx to use Mod1HeroSection**

Replace the full contents of `src/app/modulo-1/page.tsx` with:

```tsx
import { strings } from "@/lib/strings";
import { TopicCard } from "@/components/topic-card";
import { ExerciseCTA } from "@/components/exercise-cta";
import { Mod1HeroSection } from "@/components/Mod1HeroSection";

export const metadata = {
  title: "Operações Fundamentais | Laboratório de Tesouraria",
};

const TOPICS = [
  {
    icon: "📐",
    title: "Matemática Financeira Aplicada",
    question:
      "Qual o preço justo deste título? Que taxa estou realmente praticando?",
    href: "/modulo-1/matematica-financeira",
  },
  {
    icon: "💰",
    title: "Mercado Monetário e Taxas de Juros",
    question:
      "Qual benchmark devo usar? Como minhas taxas se comparam às referências?",
    href: "/modulo-1/mercado-monetario",
  },
  {
    icon: "🌎",
    title: "Cenário Econômico e Taxa de Juros",
    question:
      "Dado o cenário macro, para onde vão os juros? Como posicionar meu portfólio?",
    href: "/modulo-1/cenario-economico",
  },
  {
    icon: "⚠️",
    title: "Risco Financeiro e Taxa de Juros",
    question:
      "Quanto risco estou correndo? O spread capturado compensa adequadamente?",
    href: "/modulo-1/risco-financeiro",
  },
];

export default function Module1Page() {
  return (
    <main className="mesh-bg pt-8 pb-20">
      {/* Remotion Hero */}
      <Mod1HeroSection />

      {/* Overview */}
      <section className="px-6 max-w-4xl mx-auto mb-10 mt-10">
        <div className="glass-card rounded-xl p-6 md:p-8">
          <span className="font-label text-primary tracking-[0.15em] text-[10px] uppercase font-semibold block mb-3">
            {strings.mod1OverviewLabel}
          </span>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
            {strings.mod1Overview}
          </p>
        </div>
      </section>

      {/* Topic Cards */}
      <section className="px-6 max-w-4xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOPICS.map((topic) => (
            <TopicCard key={topic.href} {...topic} />
          ))}
        </div>
      </section>

      {/* Exercise CTA */}
      <section className="px-6 max-w-4xl mx-auto">
        <ExerciseCTA
          title={`🧩 ${strings.mod1ExerciseTitle}`}
          description={strings.mod1ExerciseDescription}
          href="/modulo-1/exercicio"
        />
      </section>
    </main>
  );
}
```

Note: Added `mt-10` to the overview section to give spacing after the animation, and removed the old hero `<section>`.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/modulo-1/page.tsx
git commit -m "feat(mod1): wire Remotion hero into Module 1 page, remove old hero"
```

---

### Task 6: Manual visual verification

No code changes — verification only.

- [ ] **Step 1: Start dev server and verify desktop**

```bash
npm run dev
```

Open `http://localhost:3000/modulo-1` in a desktop browser (≥768px). Verify:

1. Grid and formula title fade in (0–1s)
2. Three PU curves draw simultaneously left-to-right (1–5s) — green (7%), teal (10%), amber (13%)
3. Crosshair follows the 10% curve with PU tooltip
4. Rate labels appear at curve ends as drawing completes
5. Chart holds full-screen (5–6s)
6. Gradient mask fades in, "Módulo 01" eyebrow fades, "Operações Fundamentais" types (6–8s)
7. "Captação, Aplicação e Gestão de Caixa" subtitle fades in
8. Hold for reading (8–13s)
9. Fade-out and loop (13–15s)
10. Overview card, topic cards, and exercise CTA below are unchanged

- [ ] **Step 2: Verify mobile fallback**

Resize browser to <768px. Verify static text with dark gradient background, no Remotion.

- [ ] **Step 3: Verify production build**

```bash
npm run build && npm run start
```

Open `http://localhost:3000/modulo-1`. Verify animation works in production.
