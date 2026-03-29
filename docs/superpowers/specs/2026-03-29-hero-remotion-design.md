# Hero Section — Remotion Animation Upgrade

**Date:** 2026-03-29
**Status:** Approved

## Overview

Replace the static gradient-orb hero section with a full Remotion animation composition. The animation owns the entire hero area — background, yield curve, and all text with typing effects. Mobile gets a static fallback (no Remotion loaded).

## Components

### `src/components/HeroAnimation.tsx` — Remotion Composition

- **Dimensions:** 1920×1080, 30fps, 10 seconds (300 frames), looping
- **Export:** Named export usable with `@remotion/player`'s `<Player>`

**Layout within composition:**
- Text occupies ~55% left side
- Yield curve occupies ~65% right side (overlapping behind text ~15%)
- Gradient fade from left masks the overlap zone
- Background: dark gradient shifting slowly from deep navy (`#0a1628`) to charcoal (`#1a1a2e`)

**Animation timeline:**

| Phase | Frames | Seconds | Description |
|-------|--------|---------|-------------|
| 1 — Curve Draw | 0–90 | 0–3s | Background gradient shifts. Golden/amber yield curve draws itself left-to-right. Vertices light up sequentially at 6M, 1Y, 2Y, 5Y, 10Y — each shows a label that fades after ~0.5s |
| 2 — Title Types | 90–150 | 3–5s | Eyebrow "LABORATÓRIO DE TESOURARIA DE BANCOS" fades in. "Sua Janela para a" types letter-by-letter, then "Inteligência Financeira" types with teal gradient. Curve pulses gently |
| 3 — Subtitle | 150–195 | 5–6.5s | Subtitle fades in word-by-word: "Pratique decisões de tesouraria com dados e cenários do mercado brasileiro" |
| 4 — Hold & Loop | 195–300 | 6.5–10s | Everything visible, curve pulses. Soft fade-out of text in final ~1s for seamless loop back to Phase 1 |

**Yield curve details:**
- Color: golden/amber (`#d4a853`)
- Shape: upward-sloping (normal yield curve)
- Vertices: 5 points at 6M, 1Y, 2Y, 5Y, 10Y
- Each vertex has a small dot that lights up as the line reaches it
- Labels appear briefly above each dot then fade
- After complete, curve gently pulses (subtle opacity/glow animation)

**Text styling within composition:**
- Eyebrow: teal (`#58f5d1`), uppercase, letter-spacing 3px, small font
- Headline line 1: white, bold, large
- Headline line 2: teal gradient (`#58f5d1` → `#1cd0ad`), bold, large
- Subtitle: muted white (`rgba(255,255,255,0.5)`), italic, smaller font

**Text content source:** Import from `@/lib/strings` — `eyebrow`, `heroHeadline1`, `heroHeadline2`, `heroSubtitle`

### `src/components/HeroSection.tsx` — Player Wrapper

**Desktop (≥768px):**
- Renders `<Player>` from `@remotion/player`
- Props: `component={HeroAnimation}`, `durationInFrames={300}`, `fps={30}`, `compositionWidth={1920}`, `compositionHeight={1080}`
- `autoPlay`, `loop`, `controls={false}`, `style={{ width: '100%' }}`
- Wrapped in a container matching the current hero's `min-h-[70vh]` and `max-w-7xl` layout

**Mobile (<768px):**
- No Remotion Player loaded (save bundle)
- Static fallback: same text content from `strings.ts` with CSS gradient background
- Layout similar to current `hero.tsx` text section but without the orb

### Changes to existing files

**`src/lib/strings.ts`:**
- Update `heroSubtitle` to: `"Pratique decisões de tesouraria com dados e cenários do mercado brasileiro"`

**`src/app/page.tsx`:**
- Replace `import { Hero } from "@/components/hero"` with `import { HeroSection } from "@/components/HeroSection"`
- Render `<HeroSection />` instead of `<Hero />`

**`src/components/hero.tsx`:**
- Can be deleted after migration (all content moves into HeroSection/HeroAnimation)

## Technical Notes

- Remotion packages already installed: `remotion@^4.0.441`, `@remotion/player@^4.0.441`, `@remotion/tailwind@^4.0.388`
- No separate Remotion project — compositions live inside the Next.js app
- Use `useCurrentFrame()` and `interpolate()` from Remotion for all animations
- Use `spring()` for organic motion on the curve drawing
- Tailwind classes for styling within the composition where possible

## Mobile Fallback

The static mobile fallback preserves the hero's text content and visual identity without the animation overhead:
- Dark gradient background via CSS
- Static text (no typing effect)
- Same spacing and typography as the animated version's final frame
- Detected via CSS media query or React hook (`useMediaQuery` or similar)
