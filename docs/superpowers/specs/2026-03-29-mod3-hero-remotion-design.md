# Module 3 Hero — Remotion NTN-F Cash Flow Animation

**Date:** 2026-03-29
**Status:** Approved

## Overview

Replace the text-only hero section on the Module 3 landing page with a Remotion animation showing an animated NTN-F bond cash flow waterfall diagram. Same pattern as homepage, Module 1, and Module 2 heroes: widescreen composition, full-screen chart first, text overlays after. Everything below the hero remains unchanged.

## Components

### `src/components/remotion/Mod3CashFlow.tsx` — Chart Sub-Component

Renders an animated SVG cash flow waterfall for an NTN-F bond.

**Chart elements:**
- Title: `Fluxo de Caixa — NTN-F 2029` (monospace, fades in)
- X-axis: 8 coupon dates (Jul/25, Jan/26, Jul/26, Jan/27, Jul/27, Jan/28, Jul/28, Jan/29)
- Y-axis: R$ values
- Baseline at bottom
- Grid lines at R$ 200, R$ 500, R$ 1000

**Cash flow bars:**
- 7 coupon bars at R$ 48.81 each — teal `#58f5d1`, moderate height
- 1 final bar (coupon + principal) at R$ 1,048.81 — amber `#d4a853`, much taller
- Each bar grows upward from the baseline with spring animation

**PU result badge:**
- Appears after all bars are drawn
- Shows `PU = R$ 987,32` and `Taxa: 12.50% a.a.`
- Positioned in the upper area of the chart
- Semi-transparent background with teal border

**Animation:**
- Grid, title fade in: frames 0–30
- Coupon bars 1–7 grow sequentially: frames 30–120 (~0.35s each, spring animation)
- Final bar grows: frames 120–150 (amber color, taller)
- PU badge fades in: frames 140–160
- Gentle pulse after completion
- Fade-out: frames 390–450

**Sizing:** SVG fills composition — `width: 96%, height: 90%`, centered

### `src/components/remotion/Mod3HeroText.tsx` — Text Sub-Component

**Text content (from strings.ts):**
- Eyebrow: `mod3Eyebrow` ("Módulo 03")
- Title line 1: "Precificação" (first word of `mod3Title`)
- Title line 2: "de Ativos" (remaining of `mod3Title`)
- Subtitle: `mod3Subtitle` ("Títulos Públicos, Bancários e Corporativos")

**Timing:**
- Container slides in: frames 170–180
- Eyebrow fades in: frames 180–195
- "Precificação" types letter-by-letter: frames 192–220
- "de Ativos" types on second line (teal gradient): frames 225–245
- Subtitle fades in: frames 248–263
- Hold: frames 263–390
- Fade-out: frames 390–450

### `src/components/remotion/Mod3HeroAnimation.tsx` — Root Composition

Constants:
- `MOD3_COMP_WIDTH = 1920`
- `MOD3_COMP_HEIGHT = 800`
- `MOD3_FPS = 30`
- `MOD3_DURATION_FRAMES = 450`

Layers: background gradient → Mod3CashFlow → gradient mask (fades in frame 160–185) → Mod3HeroText

### `src/components/Mod3HeroSection.tsx` — Player Wrapper

Desktop: dynamic import of Mod3HeroPlayer, `<Player>` autoPlay/loop/no controls.
Mobile (<768px): static fallback with "Módulo 03", "Precificação de Ativos", subtitle.

### `src/components/Mod3HeroPlayer.tsx` — Dynamic Import Target

Default export wrapping `<Player>` with Mod3HeroAnimation.

## Changes to Existing Files

**`src/app/modulo-3/page.tsx`:**
- Import `Mod3HeroSection`
- Replace hero `<section>` with `<Mod3HeroSection />`
- Add `mt-10` to overview section
- Keep everything else unchanged

## NTN-F Cash Flow Data

NTN-F 2029 with 10% annual coupon (semi-annual payments):
- Coupon = 1000 × (1.10^(1/2) − 1) ≈ R$ 48.81
- 7 coupon-only payments
- 1 final payment: R$ 48.81 + R$ 1,000.00 = R$ 1,048.81

Bar positions computed from these values. The chart does NOT need to compute PV — it just shows the nominal cash flows and displays a pre-computed PU.

## Mobile Fallback

Static layout: dark gradient background, "Módulo 03" eyebrow, title, subtitle. No animation.
