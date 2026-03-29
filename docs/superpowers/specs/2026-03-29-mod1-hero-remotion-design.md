# Module 1 Hero — Remotion PU Pricing Animation

**Date:** 2026-03-29
**Status:** Approved

## Overview

Replace the text-only hero section on the Module 1 landing page with a Remotion animation showing animated PU discount curves at different rates. Same pattern as the homepage hero: widescreen composition, full-screen chart first, text overlays after. The overview card and everything below remains unchanged.

## Components

### `src/components/remotion/Mod1PricingCurves.tsx` — Chart Sub-Component

Renders an SVG chart with 3 PU discount curves showing `PU = 1000 / (1 + taxa)^(DU/252)`.

**Chart elements:**
- Title: `PU = 1000 / (1 + taxa)^(DU/252)` (monospace, fades in)
- Grid: horizontal lines at PU 1000, 850, 700; vertical lines at DU 0, 126, 252, 504, 756
- X-axis labels: business days (0, 126, 252, 504, 756)
- Y-axis labels: PU values (1000, 850, 700)
- Baseline at bottom

**3 Curves:**
- 7% — green `#2E8B57`, highest PU values (least discount)
- 10% — teal `#58f5d1`, middle curve, has area gradient fill below
- 13% — amber `#d4a853`, lowest PU values (most discount)

All curves start at PU=1000 (DU=0) and decrease with maturity.

**Animation:**
- Grid and title fade in: frames 0–30
- All 3 curves draw simultaneously left-to-right: frames 30–150 (1–5s), cubic bezier, glow filter
- Animated crosshair follows the 10% curve as it draws: vertical dashed line + horizontal dashed line + tooltip showing PU value (e.g., "R$ 905")
- Rate labels (7%, 10%, 13%) appear at the end of each curve with spring animation as drawing completes
- After draw: curves pulse gently, crosshair fades out
- Fade-out: frames 390–450

**Sizing:** SVG fills the composition — `width: 96%, height: 90%`, centered

### `src/components/remotion/Mod1HeroText.tsx` — Text Sub-Component

Renders animated text for Module 1: eyebrow, title, subtitle.

**Text content (from strings.ts):**
- Eyebrow: `mod1Eyebrow` ("Módulo 01")
- Title: `mod1Title` ("Operações Fundamentais")
- Subtitle: `mod1Subtitle` ("Captação, Aplicação e Gestão de Caixa")

**Timing:**
- Container slides in from left, opacity fades in: frames 170–180 (starts ~5.7s)
- Eyebrow fades in: frames 180–195
- Title types letter-by-letter: frames 192–225
- Subtitle fades in (no word-by-word, it's short): frames 230–245
- Hold: frames 245–390
- Fade-out: frames 390–450

**Layout:** Positioned absolute, left 0, width 50%, vertically centered, padding 5%, z-index 2

**Styling:**
- Eyebrow: teal `#58f5d1`, uppercase, letter-spacing 0.3em, font-label (Space Grotesk), 14px
- Title: white, font-headline (Manrope), 64px, bold 800
- Subtitle: `rgba(255,255,255,0.5)`, italic, font-body (Inter), 18px

### `src/components/remotion/Mod1HeroAnimation.tsx` — Root Composition

Combines background, chart, and text.

**Constants:**
- `MOD1_COMP_WIDTH = 1920`
- `MOD1_COMP_HEIGHT = 800`
- `MOD1_FPS = 30`
- `MOD1_DURATION_FRAMES = 450` (15 seconds)

**Background:** Dark gradient shifting slowly (same HSL animation as homepage hero)

**Layers (bottom to top):**
1. Background gradient
2. `Mod1PricingCurves` (full-screen chart)
3. Gradient mask (fades in at frame 140–165, darkens left 55% for text readability)
4. `Mod1HeroText` (text overlay)

### `src/components/Mod1HeroSection.tsx` — Player Wrapper

**Desktop (≥768px):**
- Dynamic import of `Mod1HeroPlayer` with `ssr: false`
- `<Player>` with autoPlay, loop, controls=false, width 100%

**Mobile (<768px):**
- Static fallback: "Módulo 01", "Operações Fundamentais", "Captação, Aplicação e Gestão de Caixa"
- Dark gradient background via CSS
- Same typography as animated version's final frame

### `src/components/Mod1HeroPlayer.tsx` — Dynamic Import Target

Default export wrapping `<Player>` with Mod1HeroAnimation composition and constants.

## Changes to Existing Files

**`src/app/modulo-1/page.tsx`:**
- Replace the hero `<section>` (eyebrow + h1 + subtitle) with `<Mod1HeroSection />`
- Keep the overview card, topic cards, and exercise CTA sections unchanged

## PU Curve Math

The curves follow `PU = 1000 / (1 + rate)^(du/252)` exactly:

| DU | 7% PU | 10% PU | 13% PU |
|----|-------|--------|--------|
| 0 | 1000 | 1000 | 1000 |
| 126 | 966.6 | 953.0 | 939.6 |
| 252 | 934.6 | 909.1 | 884.9 |
| 504 | 873.4 | 826.4 | 783.5 |
| 756 | 816.3 | 751.3 | 693.5 |

These values should be computed from the formula, not hardcoded.

## Mobile Fallback

Static layout preserving text content without animation:
- Dark gradient background via CSS
- Static text (no typing effect)
- Same spacing and typography
- Detected via `useIsDesktop()` hook (matchMedia 768px)
