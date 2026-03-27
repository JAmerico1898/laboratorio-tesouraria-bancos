# Module 1 Overview Page — Design Spec

## Summary

Design for the Module 1 landing page at `/modulo-1`. This is a static, informational page that serves as a hub for the 4 content blocks + integrated exercise within Module 1 (Operações Fundamentais).

## Architecture Decision

**Hub-and-spoke navigation model:**
- The main app landing page (`/`) has cards linking to each of the 4 modules.
- Each module landing page (e.g., `/modulo-1`) has cards linking to its topics/blocks.
- Each topic/block lives at its own sub-route (e.g., `/modulo-1/matematica-financeira`).

This mirrors the main landing page pattern — module landings are "second-order landing pages."

## Route & File Structure

```
src/app/modulo-1/
├── layout.tsx                        ← Secondary tab bar (persistent across all module pages)
├── page.tsx                          ← Module landing: hero + overview + cards + exercise CTA
├── matematica-financeira/
│   └── page.tsx                      ← Block 1 (ComingSoon for now)
├── mercado-monetario/
│   └── page.tsx                      ← Block 2 (ComingSoon for now)
├── cenario-economico/
│   └── page.tsx                      ← Block 3 (ComingSoon for now)
├── risco-financeiro/
│   └── page.tsx                      ← Block 4 (ComingSoon for now)
└── exercicio/
    └── page.tsx                      ← Integrated exercise (ComingSoon for now)
```

## Components

### 1. `ModuleTabBar` (Client Component)

**Location:** `src/components/module-tab-bar.tsx`

**Purpose:** Secondary horizontal navigation bar rendered below the main navbar. Persistent across all pages within a module.

**Behavior:**
- Reads current pathname via `usePathname()` to highlight the active tab
- Each tab is a Next.js `<Link>` element
- Active tab: `#58f5d1` text color + 2px bottom border
- Inactive tabs: `#888` text color
- Scrollable on mobile (`overflow-x: auto`, no wrapping)

**Styling:**
- Background: `#111318`
- Border-bottom: `1px solid #2a2f3a`
- Padding: `0 20px`

**Props:**
```typescript
interface ModuleTabBarProps {
  tabs: Array<{
    label: string
    href: string
    icon?: string  // emoji
  }>
}
```

**Tab items for Module 1:**

| Label | Route | Icon |
|-------|-------|------|
| Visão Geral | `/modulo-1` | — |
| Matemática Financeira | `/modulo-1/matematica-financeira` | 📐 |
| Mercado Monetário | `/modulo-1/mercado-monetario` | 💰 |
| Cenário Econômico | `/modulo-1/cenario-economico` | 🌎 |
| Risco Financeiro | `/modulo-1/risco-financeiro` | ⚠️ |
| Exercício | `/modulo-1/exercicio` | 🧩 |

### 2. `TopicCard` (Server Component)

**Location:** `src/components/topic-card.tsx`

**Purpose:** A clickable card representing a content block on the module landing page.

**Props:**
```typescript
interface TopicCardProps {
  icon: string      // emoji
  title: string
  question: string  // managerial decision question (italic)
  href: string
}
```

**Styling:**
- Background: `#161a22`, border: `1px solid #2a2f3a`, border-radius: `10px`
- Hover: border color transitions to `#58f5d1`
- "Explorar →" link text in `#58f5d1` at bottom
- Entire card is wrapped in `<Link>`

### 3. `ExerciseCTA` (Server Component)

**Location:** `src/components/exercise-cta.tsx`

**Purpose:** Full-width call-to-action bar for the integrated exercise.

**Props:**
```typescript
interface ExerciseCTAProps {
  title: string
  description: string
  href: string
}
```

**Styling:**
- Background: `linear-gradient(135deg, #58f5d1, #1cd0ad)`
- Text color: `#0c0e12` (dark on accent)
- Border-radius: `10px`
- Centered text, clickable (wraps in `<Link>`)

## Layout: `src/app/modulo-1/layout.tsx`

Server component that wraps children with the `ModuleTabBar`. Defines the tab configuration for Module 1 and passes it as props.

```tsx
// Pseudocode structure
export default function Module1Layout({ children }) {
  return (
    <>
      <ModuleTabBar tabs={MODULE_1_TABS} />
      <main>{children}</main>
    </>
  )
}
```

## Page: `src/app/modulo-1/page.tsx`

Server component. No data fetching, no client-side interactivity. All content is hardcoded in Portuguese.

### Sections (top to bottom):

**1. Hero Section**
- Label: `MÓDULO 01` (teal, uppercase, letter-spacing)
- Title: `Operações Fundamentais` (large, bold)
- Subtitle: `Captação, Aplicação e Gestão de Caixa` (muted)
- Background: gradient from `#0c0e12` to `#111622`
- Decorative radial gradient orb (subtle, top-right)

**2. Overview Box**
- Section label: `VISÃO GERAL` (teal, uppercase, small)
- Text (from Python `render_home()`):
  > "A tesouraria é o centro nevrálgico da gestão financeira de um banco. É nela que se gerenciam as posições de liquidez, se precificam operações, se monitoram riscos de mercado e se tomam decisões de alocação que impactam diretamente o resultado da instituição. Este módulo oferece ferramentas interativas para desenvolver a intuição gerencial necessária a esse papel."
- Background: `#161a22`, border: `1px solid #2a2f3a`, border-radius: `10px`

**3. Topic Cards Grid (2×2)**

| Icon | Title | Managerial Question | Route |
|------|-------|---------------------|-------|
| 📐 | Matemática Financeira Aplicada | "Qual o preço justo deste título? Que taxa estou realmente praticando?" | `/modulo-1/matematica-financeira` |
| 💰 | Mercado Monetário e Taxas de Juros | "Qual benchmark devo usar? Como minhas taxas se comparam às referências?" | `/modulo-1/mercado-monetario` |
| 🌎 | Cenário Econômico e Taxa de Juros | "Dado o cenário macro, para onde vão os juros? Como posicionar meu portfólio?" | `/modulo-1/cenario-economico` |
| ⚠️ | Risco Financeiro e Taxa de Juros | "Quanto risco estou correndo? O spread capturado compensa adequadamente?" | `/modulo-1/risco-financeiro` |

- Grid: `grid-template-columns: 1fr 1fr` on desktop, `1fr` on mobile
- Gap: `16px`

**4. Exercise CTA**
- Title: `🧩 Exercício Integrador — Decisão de Tesouraria`
- Description: `Sintetize todos os blocos em uma decisão de alocação de R$ 50 milhões`
- Route: `/modulo-1/exercicio`

## Responsive Behavior

- **Desktop (≥768px):** Cards in 2×2 grid, tab bar shows all items
- **Mobile (<768px):** Cards stack to single column, tab bar scrolls horizontally

## Theme

Dark theme consistent with the main landing page:
- Surface: `#0c0e12`
- Card background: `#161a22`
- Card border: `#2a2f3a`
- Primary accent: `#58f5d1`
- Text: `#e0e0e0` (primary), `#999` (muted)
- Glassmorphism effects reused from existing `globals.css`

## Sub-route Pages (Placeholder)

Each block sub-route (`matematica-financeira`, `mercado-monetario`, `cenario-economico`, `risco-financeiro`, `exercicio`) renders the existing `<ComingSoon>` component with the appropriate `moduleName` prop. These will be replaced in subsequent design cycles.

## What This Design Does NOT Include

- No data fetching or API calls
- No interactive elements (sliders, inputs, charts)
- No financial calculations
- No shared utilities or lib extensions
- No test setup (will be addressed per-block)
