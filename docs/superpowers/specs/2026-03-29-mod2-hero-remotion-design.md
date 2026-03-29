# Module 2 Hero — Remotion Spot vs Forward Curves

**Date:** 2026-03-29
**Status:** Approved

## Overview

Replace the text-only hero section on the Module 2 landing page with a Remotion animation showing animated spot and forward yield curves. Same pattern as homepage and Module 1 heroes: widescreen composition, full-screen chart first, text overlays after. Everything below the hero (overview card, connection card, progression bar, topic cards, exercise CTA) remains unchanged.

## Components

### `src/components/remotion/Mod2SpotForward.tsx` — Chart Sub-Component

Renders an SVG chart with two curves: spot (solid teal) and forward (dashed amber), plus forward rate bars.

**Chart elements:**
- Title: `Spot × Forward — DI Futuro` (monospace, fades in)
- Grid: horizontal lines at 10.5%, 12.0%, 13.5%; vertical lines at 6M, 1Y, 2Y, 5Y, 10Y
- X-axis labels: maturities (6M, 1Y, 2Y, 5Y, 10Y)
- Y-axis labels: rates (10.5%, 12.0%, 13.5%)
- Legend: Spot (solid teal line) / Forward (dashed amber line)
- Baseline at bottom

**Spot curve (solid teal `#58f5d1`):**
- Upward-sloping, normal shape
- Vertices: 6M: 10.75%, 1Y: 11.50%, 2Y: 12.25%, 5Y: 13.00%, 10Y: 13.40%
- Area gradient fill below
- Glow filter

**Forward curve (dashed amber `#d4a853`):**
- Starts above spot, crosses below near the long end
- Vertices: 6M: 11.50%, 1Y: 13.00%, 2Y: 13.80%, 5Y: 13.20%, 10Y: 12.80%
- No area fill, dashed stroke
- Glow filter

**Forward rate bars:**
- Semi-transparent amber rectangles between vertex pairs
- Represent the implied forward rate for each period
- Fade in after forward curve draws

**Animation:**
- Grid, title, legend fade in: frames 0–30
- Spot curve draws left-to-right: frames 30–90 (1–3s), with area fill, vertex dots spring in
- Forward curve draws: frames 90–150 (3–5s), forward rate bars fade in as curve reaches each segment
- Rate badges appear at key vertices (spot and forward) after each curve completes
- Both curves pulse gently after drawing
- Fade-out: frames 390–450

**Sizing:** SVG fills composition — `width: 96%, height: 90%`, centered

### `src/components/remotion/Mod2HeroText.tsx` — Text Sub-Component

Renders animated text for Module 2.

**Text content (from strings.ts):**
- Eyebrow: `mod2Eyebrow` ("Módulo 02")
- Title line 1: "Curva de Juros" (first two words of `mod2Title`)
- Title line 2: "(ETTJ)" (remaining part of `mod2Title`)
- Subtitle: `mod2Subtitle` ("Construção, Interpolação e Cenários")

**Timing:**
- Container slides in from left: frames 170–180
- Eyebrow fades in: frames 180–195
- "Curva de Juros" types letter-by-letter: frames 192–215
- "(ETTJ)" types on second line (teal gradient): frames 220–235
- Subtitle fades in: frames 240–255
- Hold: frames 255–390
- Fade-out: frames 390–450

**Layout:** Same as Mod1HeroText — positioned absolute, left 0, width 50%, vertically centered, z-index 2

### `src/components/remotion/Mod2HeroAnimation.tsx` — Root Composition

Constants:
- `MOD2_COMP_WIDTH = 1920`
- `MOD2_COMP_HEIGHT = 800`
- `MOD2_FPS = 30`
- `MOD2_DURATION_FRAMES = 450`

Layers: background gradient → Mod2SpotForward → gradient mask (fades in frame 160–185) → Mod2HeroText

### `src/components/Mod2HeroSection.tsx` — Player Wrapper

Desktop: dynamic import of Mod2HeroPlayer with `ssr: false`, `<Player>` autoPlay/loop/no controls.

Mobile (<768px): static fallback with "Módulo 02", "Curva de Juros (ETTJ)", "Construção, Interpolação e Cenários" + dark gradient background.

### `src/components/Mod2HeroPlayer.tsx` — Dynamic Import Target

Default export wrapping `<Player>` with Mod2HeroAnimation.

## Changes to Existing Files

**`src/app/modulo-2/page.tsx`:**
- Import `Mod2HeroSection`
- Replace hero `<section>` with `<Mod2HeroSection />`
- Add `mt-10` to overview section for spacing
- Keep everything else: overview card, connection card, progression bar, topic cards, exercise CTA

## Curve Data

Spot curve vertices (rate → y position mapping):

| Maturity | Spot Rate | Forward Rate |
|----------|-----------|--------------|
| 6M | 10.75% | 11.50% |
| 1Y | 11.50% | 13.00% |
| 2Y | 12.25% | 13.80% |
| 5Y | 13.00% | 13.20% |
| 10Y | 13.40% | 12.80% |

The forward curve crosses below the spot curve between 5Y and 10Y, representing expectations of future rate cuts at the long end — a realistic Brazilian market scenario.

## Mobile Fallback

Static layout: dark gradient background, "Módulo 02" eyebrow, title, subtitle. No animation. Detected via `useIsDesktop()` hook.
