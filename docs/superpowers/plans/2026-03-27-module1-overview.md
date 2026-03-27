# Module 1 Overview Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Module 1 landing page with hero, overview, topic cards, exercise CTA, and a secondary tab bar that persists across all module sub-pages.

**Architecture:** Next.js App Router layout at `src/app/modulo-1/layout.tsx` provides a persistent secondary tab bar. The landing page (`page.tsx`) is a server component with hardcoded Portuguese content. Three new reusable components: `ModuleTabBar`, `TopicCard`, `ExerciseCTA`. Sub-routes for each block render `ComingSoon` placeholders.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4

**Note on testing:** No test framework is installed in this project. These components are pure static UI with zero business logic. Tests will be introduced when the first interactive block (with financial calculations) is built. Verification for this plan is `npm run build` + `npm run lint` + visual inspection.

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/components/module-tab-bar.tsx` | Client component: secondary navigation bar with active state |
| Create | `src/components/topic-card.tsx` | Server component: clickable card with icon, title, question |
| Create | `src/components/exercise-cta.tsx` | Server component: accent CTA bar for integrated exercise |
| Create | `src/app/modulo-1/layout.tsx` | Module 1 layout: renders tab bar, wraps children |
| Modify | `src/app/modulo-1/page.tsx` | Rewrite: from ComingSoon to full landing page |
| Create | `src/app/modulo-1/matematica-financeira/page.tsx` | ComingSoon placeholder |
| Create | `src/app/modulo-1/mercado-monetario/page.tsx` | ComingSoon placeholder |
| Create | `src/app/modulo-1/cenario-economico/page.tsx` | ComingSoon placeholder |
| Create | `src/app/modulo-1/risco-financeiro/page.tsx` | ComingSoon placeholder |
| Create | `src/app/modulo-1/exercicio/page.tsx` | ComingSoon placeholder |
| Modify | `src/components/navbar.tsx:29` | Fix active state to use `startsWith` for module sub-routes |
| Modify | `src/lib/strings.ts` | Add Module 1 landing page strings |

---

### Task 1: Add Module 1 strings to `lib/strings.ts`

**Files:**
- Modify: `src/lib/strings.ts`

- [ ] **Step 1: Add strings for Module 1 landing page**

Open `src/lib/strings.ts` and add the following entries to the `strings` object, before the closing `} as const;`:

```typescript
  // Module 1 landing
  mod1Eyebrow: "Módulo 01",
  mod1Title: "Operações Fundamentais",
  mod1Subtitle: "Captação, Aplicação e Gestão de Caixa",
  mod1Overview:
    "A tesouraria é o centro nevrálgico da gestão financeira de um banco. " +
    "É nela que se gerenciam as posições de liquidez, se precificam operações, " +
    "se monitoram riscos de mercado e se tomam decisões de alocação que impactam " +
    "diretamente o resultado da instituição. Este módulo oferece ferramentas " +
    "interativas para desenvolver a intuição gerencial necessária a esse papel.",
  mod1OverviewLabel: "Visão Geral",
  mod1ExerciseTitle: "Exercício Integrador — Decisão de Tesouraria",
  mod1ExerciseDescription:
    "Sintetize todos os blocos em uma decisão de alocação de R$ 50 milhões",
  explore: "Explorar",
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/strings.ts
git commit -m "feat: add Module 1 landing page strings"
```

---

### Task 2: Create `ModuleTabBar` component

**Files:**
- Create: `src/components/module-tab-bar.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/module-tab-bar.tsx` with the following content:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  label: string;
  href: string;
  icon?: string;
}

interface ModuleTabBarProps {
  tabs: Tab[];
}

export function ModuleTabBar({ tabs }: ModuleTabBarProps) {
  const pathname = usePathname();

  return (
    <div className="sticky top-[57px] z-40 bg-surface-container-low border-b border-outline-variant/30 overflow-x-auto">
      <div className="max-w-7xl mx-auto flex gap-0 px-6">
        {tabs.map((tab) => {
          const isActive =
            tab.href === pathname ||
            (tab.href !== tabs[0].href && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap px-4 py-3 text-xs font-label font-medium tracking-wide transition-colors duration-200 border-b-2 ${
                isActive
                  ? "text-primary border-primary"
                  : "text-on-surface-variant border-transparent hover:text-on-surface hover:border-outline-variant/50"
              }`}
            >
              {tab.icon ? `${tab.icon} ${tab.label}` : tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

**Design notes:**
- `sticky top-[57px]` pins the tab bar below the main navbar (57px = navbar height).
- Active detection: exact match for the first tab (overview), `startsWith` for all others. This ensures `/modulo-1` only highlights "Visão Geral" and not every tab.
- `font-label` uses Space Grotesk, matching the existing label typography.

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/module-tab-bar.tsx
git commit -m "feat: add ModuleTabBar component"
```

---

### Task 3: Create `TopicCard` component

**Files:**
- Create: `src/components/topic-card.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/topic-card.tsx` with the following content:

```tsx
import Link from "next/link";
import { strings } from "@/lib/strings";

interface TopicCardProps {
  icon: string;
  title: string;
  question: string;
  href: string;
}

export function TopicCard({ icon, title, question, href }: TopicCardProps) {
  return (
    <Link
      href={href}
      className="glass-card rounded-xl p-6 hover:border-primary/40 transition-all duration-300 group flex flex-col"
    >
      <span className="text-3xl mb-3">{icon}</span>
      <h3 className="font-headline text-sm md:text-base font-bold mb-2">
        {title}
      </h3>
      <p className="text-on-surface-variant text-xs md:text-sm italic leading-relaxed mb-4 flex-1">
        &ldquo;{question}&rdquo;
      </p>
      <span className="text-primary font-headline font-bold text-xs group-hover:gap-3 flex items-center gap-1.5 transition-all duration-300">
        {strings.explore}
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </span>
    </Link>
  );
}
```

**Design notes:**
- Uses `glass-card` utility from existing `globals.css` for consistent glassmorphism.
- `flex-1` on the question paragraph ensures cards with different question lengths still align the "Explorar" link at the bottom.
- Hover shifts border toward primary color, matching existing module-cards pattern.

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/topic-card.tsx
git commit -m "feat: add TopicCard component"
```

---

### Task 4: Create `ExerciseCTA` component

**Files:**
- Create: `src/components/exercise-cta.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/exercise-cta.tsx` with the following content:

```tsx
import Link from "next/link";

interface ExerciseCTAProps {
  title: string;
  description: string;
  href: string;
}

export function ExerciseCTA({ title, description, href }: ExerciseCTAProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl p-5 md:p-6 text-center bg-gradient-to-r from-primary to-primary-container hover:opacity-90 transition-opacity duration-300"
    >
      <h3 className="font-headline text-on-primary-container text-base md:text-lg font-extrabold">
        {title}
      </h3>
      <p className="text-on-primary-container/80 text-xs md:text-sm mt-1">
        {description}
      </p>
    </Link>
  );
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/exercise-cta.tsx
git commit -m "feat: add ExerciseCTA component"
```

---

### Task 5: Create Module 1 layout with tab bar

**Files:**
- Create: `src/app/modulo-1/layout.tsx`

- [ ] **Step 1: Create the layout file**

Create `src/app/modulo-1/layout.tsx` with the following content:

```tsx
import type { ReactNode } from "react";
import { ModuleTabBar } from "@/components/module-tab-bar";

const MODULE_1_TABS = [
  { label: "Visão Geral", href: "/modulo-1" },
  { label: "Matemática Financeira", href: "/modulo-1/matematica-financeira", icon: "📐" },
  { label: "Mercado Monetário", href: "/modulo-1/mercado-monetario", icon: "💰" },
  { label: "Cenário Econômico", href: "/modulo-1/cenario-economico", icon: "🌎" },
  { label: "Risco Financeiro", href: "/modulo-1/risco-financeiro", icon: "⚠️" },
  { label: "Exercício", href: "/modulo-1/exercicio", icon: "🧩" },
];

export default function Module1Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <ModuleTabBar tabs={MODULE_1_TABS} />
      {children}
    </>
  );
}
```

**Design notes:**
- This is a server component — it only passes static data to the client `ModuleTabBar`.
- The tab bar renders between the root layout's `<Navbar />` and the page content.
- No `<main>` wrapper here — let each page control its own outer element.

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/modulo-1/layout.tsx
git commit -m "feat: add Module 1 layout with secondary tab bar"
```

---

### Task 6: Rewrite Module 1 landing page

**Files:**
- Modify: `src/app/modulo-1/page.tsx`

- [ ] **Step 1: Replace the ComingSoon page with the full landing page**

Replace the entire content of `src/app/modulo-1/page.tsx` with:

```tsx
import { strings } from "@/lib/strings";
import { TopicCard } from "@/components/topic-card";
import { ExerciseCTA } from "@/components/exercise-cta";

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
      {/* Hero */}
      <section className="relative text-center px-6 pt-12 pb-10 max-w-4xl mx-auto">
        <div className="pointer-events-none absolute top-4 right-8 w-[180px] h-[180px] rounded-full bg-primary/[0.06] blur-[80px]" />
        <span className="font-label text-primary tracking-[0.3em] text-xs uppercase font-medium">
          {strings.mod1Eyebrow}
        </span>
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold mt-3 mb-2 tracking-tight">
          {strings.mod1Title}
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg">
          {strings.mod1Subtitle}
        </p>
      </section>

      {/* Overview */}
      <section className="px-6 max-w-4xl mx-auto mb-10">
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

**Design notes:**
- `mesh-bg` reuses the main landing page's radial gradient background.
- `max-w-4xl` constrains the content width — narrower than the main landing (which uses `max-w-7xl`) since this is a module-level hub with less content.
- `pt-8` instead of `pt-20` because the tab bar occupies the space the main landing's hero padding would.
- `glass-card` on overview box matches the existing card aesthetic.

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/modulo-1/page.tsx
git commit -m "feat: build Module 1 landing page with hero, overview, topic cards, and exercise CTA"
```

---

### Task 7: Create sub-route placeholder pages

**Files:**
- Create: `src/app/modulo-1/matematica-financeira/page.tsx`
- Create: `src/app/modulo-1/mercado-monetario/page.tsx`
- Create: `src/app/modulo-1/cenario-economico/page.tsx`
- Create: `src/app/modulo-1/risco-financeiro/page.tsx`
- Create: `src/app/modulo-1/exercicio/page.tsx`

- [ ] **Step 1: Create all 5 placeholder pages**

Create `src/app/modulo-1/matematica-financeira/page.tsx`:
```tsx
import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Matemática Financeira | Laboratório de Tesouraria",
};

export default function MatematicaFinanceiraPage() {
  return <ComingSoon moduleName="Matemática Financeira Aplicada" />;
}
```

Create `src/app/modulo-1/mercado-monetario/page.tsx`:
```tsx
import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Mercado Monetário | Laboratório de Tesouraria",
};

export default function MercadoMonetarioPage() {
  return <ComingSoon moduleName="Mercado Monetário e Taxas de Juros" />;
}
```

Create `src/app/modulo-1/cenario-economico/page.tsx`:
```tsx
import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Cenário Econômico | Laboratório de Tesouraria",
};

export default function CenarioEconomicoPage() {
  return <ComingSoon moduleName="Cenário Econômico e Taxa de Juros" />;
}
```

Create `src/app/modulo-1/risco-financeiro/page.tsx`:
```tsx
import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Risco Financeiro | Laboratório de Tesouraria",
};

export default function RiscoFinanceiroPage() {
  return <ComingSoon moduleName="Risco Financeiro e Taxa de Juros" />;
}
```

Create `src/app/modulo-1/exercicio/page.tsx`:
```tsx
import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Exercício Integrador | Laboratório de Tesouraria",
};

export default function ExercicioPage() {
  return <ComingSoon moduleName="Exercício Integrador — Decisão de Tesouraria" />;
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/modulo-1/matematica-financeira/page.tsx \
        src/app/modulo-1/mercado-monetario/page.tsx \
        src/app/modulo-1/cenario-economico/page.tsx \
        src/app/modulo-1/risco-financeiro/page.tsx \
        src/app/modulo-1/exercicio/page.tsx
git commit -m "feat: add ComingSoon placeholder pages for Module 1 blocks"
```

---

### Task 8: Fix navbar active state for module sub-routes

**Files:**
- Modify: `src/components/navbar.tsx:29`

- [ ] **Step 1: Update active state detection**

In `src/components/navbar.tsx`, find line 29:

```tsx
            const isActive = pathname === item.href;
```

Replace with:

```tsx
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");
```

This ensures:
- Home (`/`) only highlights on exact match (not every page).
- Module routes (e.g., `/modulo-1`) highlight for all sub-routes (e.g., `/modulo-1/matematica-financeira`).

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/navbar.tsx
git commit -m "fix: navbar highlights module for all sub-route pages"
```

---

### Task 9: Build verification and lint

**Files:** None (verification only)

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Build succeeds. Check output for:
- Route `/modulo-1` renders as static page
- Routes `/modulo-1/matematica-financeira`, `/modulo-1/mercado-monetario`, `/modulo-1/cenario-economico`, `/modulo-1/risco-financeiro`, `/modulo-1/exercicio` all render

- [ ] **Step 3: Visual verification**

Run: `npm run dev`

Check in browser:
1. Navigate to `/modulo-1` — verify hero, overview box, 4 topic cards, exercise CTA render correctly
2. Click each topic card — verify it navigates to the sub-route and shows ComingSoon
3. Verify the secondary tab bar appears on all module pages and highlights the correct tab
4. Verify the main navbar highlights "Operações Fundamentais" on all module sub-routes
5. Check responsive: resize to mobile width — cards should stack, tab bar should scroll horizontally
6. Navigate back to `/` — verify the main landing page still works correctly
