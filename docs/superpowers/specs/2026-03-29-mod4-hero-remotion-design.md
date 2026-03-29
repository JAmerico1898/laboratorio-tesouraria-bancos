# Module 4 Hero — Remotion Duration/Convexity Sensitivity

**Date:** 2026-03-29
**Status:** Approved

## Overview

Replace the text-only hero section on the Module 4 landing page with a Remotion animation showing a duration vs convexity sensitivity chart (ΔPU vs Δrate). Same pattern as all previous module heroes. Everything below the hero remains unchanged.

## Components

### `src/components/remotion/Mod4Sensitivity.tsx` — Chart Sub-Component

Renders an SVG sensitivity chart showing the difference between linear duration approximation and actual convex price behavior.

**Chart elements:**
- Title: `Sensibilidade — ΔPU vs ΔTaxa` (monospace, fades in)
- X-axis: rate change from -200bps to +200bps, centered at 0, labels at -200, -100, 0, +100, +200
- Y-axis: ΔPU percentage from -15% to +15%, centered at 0
- Center cross lines at (0, 0) — slightly brighter than grid
- Horizontal grid lines at ±5%, ±10%, ±15%

**Duration line (dashed teal `#58f5d1`):**
- Straight line through origin with negative slope
- At -200bps: ΔPU ≈ +12%, at +200bps: ΔPU ≈ -12%
- Dashed stroke, glow filter
- Draws from center outward in both directions simultaneously

**Convexity curve (solid amber `#d4a853`):**
- Parabolic curve that bows ABOVE the duration line on both sides
- At -200bps: ΔPU ≈ +14%, at +200bps: ΔPU ≈ -10%
- The gap between curve and line is the "convexity advantage"
- Solid stroke, glow filter

**Convexity gain area:**
- Semi-transparent amber fill between duration line and convexity curve
- Fades in after both are drawn

**Labels:**
- "Duration" near the end of the dashed line
- "Duration + Convexidade" near the end of the curve

**Animation:**
- Grid, title, axis labels fade in: frames 0–30
- Duration line draws from center outward: frames 30–90 (1–3s)
- Convexity curve draws from center outward: frames 90–150 (3–5s)
- Convexity gain area fades in: frames 140–160
- Labels fade in: frames 145–165
- Gentle pulse after complete
- Fade-out: frames 390–450

**Sizing:** SVG `width: 96%, height: 90%`, centered

### `src/components/remotion/Mod4HeroText.tsx` — Text Sub-Component

**Text content (from strings.ts):**
- Eyebrow: `mod4Eyebrow` ("Módulo 04")
- Title line 1: "Gestão de" (first two words of `mod4Title`)
- Title line 2: "Carregamento" (last word of `mod4Title`)
- Subtitle: `mod4Subtitle` ("Estratégias, Duration e Imunização")

**Timing:** Same as other modules — title starts at frame 180, subtitle at 248, fade-out 390–450.

### `src/components/remotion/Mod4HeroAnimation.tsx` — Root Composition

Constants:
- `MOD4_COMP_WIDTH = 1920`
- `MOD4_COMP_HEIGHT = 800`
- `MOD4_FPS = 30`
- `MOD4_DURATION_FRAMES = 450`

Layers: background gradient → Mod4Sensitivity → gradient mask (fades in frame 160–185) → Mod4HeroText

### `src/components/Mod4HeroSection.tsx` — Player Wrapper

Desktop: dynamic import of Mod4HeroPlayer, autoPlay/loop/no controls.
Mobile (<768px): static fallback.

### `src/components/Mod4HeroPlayer.tsx` — Dynamic Import Target

Default export wrapping `<Player>` with Mod4HeroAnimation.

## Changes to Existing Files

**`src/app/modulo-4/page.tsx`:**
- Import `Mod4HeroSection`
- Replace hero `<section>` with `<Mod4HeroSection />`
- Add `mt-10` to overview section
- Keep everything else unchanged

## Sensitivity Chart Math

The duration line is linear through origin:
- Slope: -6 (modified duration ≈ 6 years)
- ΔPU = -duration × Δrate → at Δrate = ±2%: ΔPU = ∓12%

The convexity curve adds the second-order term:
- ΔPU = -duration × Δrate + 0.5 × convexity × Δrate²
- Convexity ≈ 50 → 0.5 × 50 × (0.02)² = +1% at ±200bps
- At -200bps: -(-6)(0.02) + 0.5(50)(0.02²) = +12% + 1% = +13%
- At +200bps: -(-6)(-0.02) + 0.5(50)(0.02²) = -12% + 1% = -11%

These are approximate values for visual purposes.

## Mobile Fallback

Static layout: dark gradient background, "Módulo 04" eyebrow, title, subtitle. No animation.
