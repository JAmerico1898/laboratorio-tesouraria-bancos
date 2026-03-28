# Block 1: Matemática Financeira — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first interactive content block — rate conversion, counting convention comparison, LTN pricing with charts, and sensitivity analysis — plus shared financial math infrastructure.

**Architecture:** Shared pure-function libraries (`src/lib/`) for finance math, Brazilian formatting, ANBIMA holidays, and chart config. Two tab components for the UI. Plotly charts loaded via dynamic import. KaTeX for LaTeX formulas. TDD for all lib functions via Vitest.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, react-plotly.js, KaTeX, Vitest

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `vitest.config.ts` | Vitest configuration with path aliases |
| Create | `src/lib/format.ts` | Brazilian locale formatting (fmtBrl, fmtPct, fmtNum) |
| Create | `src/lib/format.test.ts` | Tests for format functions |
| Create | `src/lib/holidays.ts` | ANBIMA holiday set + diasUteis + diasCorridos |
| Create | `src/lib/holidays.test.ts` | Tests for business day functions |
| Create | `src/lib/finance.ts` | Financial math (puLtn, taxaEquivalente, durationModificada, taxaForward) |
| Create | `src/lib/finance.test.ts` | Tests for finance functions |
| Create | `src/lib/chart-config.ts` | Plotly layout defaults and color constants |
| Create | `src/components/math.tsx` | KaTeX rendering component |
| Create | `src/components/plotly-chart.tsx` | Dynamic import wrapper for react-plotly.js |
| Create | `src/components/modulo-1/tab-capitalizacao.tsx` | Tab 1: rate converter + convention comparison |
| Create | `src/components/modulo-1/tab-precificacao.tsx` | Tab 2: LTN pricer + charts + sensitivity |
| Modify | `src/app/modulo-1/matematica-financeira/page.tsx` | Rewrite: from ComingSoon to tab container |
| Modify | `package.json` | Add dependencies |

---

### Task 1: Install dependencies and set up Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install runtime dependencies**

```bash
cd C:/jose_americo/laboratorio-tesouraria-bancos
npm install react-plotly.js plotly.js katex
```

- [ ] **Step 2: Install dev dependencies for testing and types**

```bash
npm install -D vitest @types/katex
```

- [ ] **Step 3: Create vitest.config.ts**

Create `vitest.config.ts` at project root:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify vitest runs (no tests yet)**

Run: `npx vitest run`
Expected: "No test files found" or similar (no error).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add plotly, katex, vitest dependencies and test config"
```

---

### Task 2: TDD — `src/lib/format.ts`

**Files:**
- Create: `src/lib/format.test.ts`
- Create: `src/lib/format.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/format.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { fmtBrl, fmtPct, fmtNum } from "./format";

describe("fmtBrl", () => {
  it("formats small values with R$ prefix", () => {
    expect(fmtBrl(1234.5678)).toBe("R$ 1.234,5678");
  });

  it("formats millions with mi suffix", () => {
    expect(fmtBrl(10_000_000)).toBe("R$ 10,0000 mi");
  });

  it("formats billions with bi suffix", () => {
    expect(fmtBrl(1_500_000_000)).toBe("R$ 1,5000 bi");
  });

  it("formats negative values", () => {
    expect(fmtBrl(-50000)).toBe("R$ -50.000,0000");
  });

  it("formats zero", () => {
    expect(fmtBrl(0)).toBe("R$ 0,0000");
  });
});

describe("fmtPct", () => {
  it("formats with default 2 decimals", () => {
    expect(fmtPct(13.75)).toBe("13,75%");
  });

  it("formats with custom decimals", () => {
    expect(fmtPct(0.049876, 4)).toBe("0,0499%");
  });

  it("formats large percentages with thousands separator", () => {
    expect(fmtPct(1234.5)).toBe("1.234,50%");
  });
});

describe("fmtNum", () => {
  it("formats with 2 decimal places", () => {
    expect(fmtNum(1234.5678)).toBe("1.234,57");
  });

  it("formats integers with .00", () => {
    expect(fmtNum(100)).toBe("100,00");
  });

  it("formats zero", () => {
    expect(fmtNum(0)).toBe("0,00");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/format.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement format.ts**

Create `src/lib/format.ts`:

```typescript
/**
 * Brazilian locale number formatting utilities.
 * Convention: period as thousands separator, comma as decimal separator.
 */

function toBrazilian(formatted: string): string {
  return formatted.replace(/,/g, "X").replace(/\./g, ",").replace(/X/g, ".");
}

/** Format as Brazilian Real: R$ 1.234,5678. Auto-scales to mi/bi. */
export function fmtBrl(v: number): string {
  const abs = Math.abs(v);
  let s: string;
  if (abs >= 1e9) {
    s = `R$ ${(v / 1e9).toFixed(4)}`;
    return toBrazilian(s.replace(/\B(?=(\d{3})+(?!\d))/g, ",")) + " bi";
  }
  if (abs >= 1e6) {
    s = `R$ ${(v / 1e6).toFixed(4)}`;
    return toBrazilian(s.replace(/\B(?=(\d{3})+(?!\d))/g, ",")) + " mi";
  }
  const parts = v.toFixed(4).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  s = `R$ ${intPart}.${parts[1]}`;
  return toBrazilian(s);
}

/** Format as percentage: 13,75%. Default 2 decimal places. */
export function fmtPct(v: number, decimals: number = 2): string {
  const parts = v.toFixed(decimals).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const s = decimals > 0 ? `${intPart}.${parts[1]}%` : `${intPart}%`;
  return toBrazilian(s);
}

/** Format number with Brazilian convention. Fixed 2 decimal places. */
export function fmtNum(v: number): string {
  const parts = v.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return toBrazilian(`${intPart}.${parts[1]}`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/format.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts src/lib/format.test.ts
git commit -m "feat: add Brazilian locale formatting functions (fmtBrl, fmtPct, fmtNum)"
```

---

### Task 3: TDD — `src/lib/holidays.ts`

**Files:**
- Create: `src/lib/holidays.test.ts`
- Create: `src/lib/holidays.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/holidays.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ANBIMA_HOLIDAYS, diasUteis, diasCorridos } from "./holidays";

describe("ANBIMA_HOLIDAYS", () => {
  it("contains known fixed holidays", () => {
    expect(ANBIMA_HOLIDAYS.has("2024-01-01")).toBe(true); // New Year
    expect(ANBIMA_HOLIDAYS.has("2024-12-25")).toBe(true); // Christmas
    expect(ANBIMA_HOLIDAYS.has("2024-04-21")).toBe(true); // Tiradentes
    expect(ANBIMA_HOLIDAYS.has("2024-11-15")).toBe(true); // Republic
  });

  it("contains known moveable holidays for 2024", () => {
    expect(ANBIMA_HOLIDAYS.has("2024-02-12")).toBe(true); // Carnival Mon
    expect(ANBIMA_HOLIDAYS.has("2024-02-13")).toBe(true); // Carnival Tue
    expect(ANBIMA_HOLIDAYS.has("2024-03-29")).toBe(true); // Good Friday
    expect(ANBIMA_HOLIDAYS.has("2024-05-30")).toBe(true); // Corpus Christi
  });

  it("contains known moveable holidays for 2025", () => {
    expect(ANBIMA_HOLIDAYS.has("2025-03-03")).toBe(true); // Carnival Mon
    expect(ANBIMA_HOLIDAYS.has("2025-03-04")).toBe(true); // Carnival Tue
    expect(ANBIMA_HOLIDAYS.has("2025-04-18")).toBe(true); // Good Friday
    expect(ANBIMA_HOLIDAYS.has("2025-06-19")).toBe(true); // Corpus Christi
  });

  it("does not contain regular business days", () => {
    expect(ANBIMA_HOLIDAYS.has("2024-03-15")).toBe(false); // Regular Friday
  });
});

describe("diasUteis", () => {
  it("counts business days between two dates (exclusive start, inclusive end)", () => {
    // 2024-07-01 (Mon) to 2024-07-05 (Fri) = 4 business days
    const d1 = new Date(2024, 6, 1); // Jul 1
    const d2 = new Date(2024, 6, 5); // Jul 5
    expect(diasUteis(d1, d2)).toBe(4);
  });

  it("excludes weekends", () => {
    // 2024-07-01 (Mon) to 2024-07-08 (Mon) = 5 business days (skip Sat/Sun)
    const d1 = new Date(2024, 6, 1);
    const d2 = new Date(2024, 6, 8);
    expect(diasUteis(d1, d2)).toBe(5);
  });

  it("excludes holidays", () => {
    // 2024-09-06 (Fri) to 2024-09-09 (Mon) = 0 business days (Sep 7 is holiday, Sep 8-9 is weekend, wait — Sep 9 is Monday)
    // Actually: Sep 7 (Sat, holiday), Sep 8 (Sun), Sep 9 (Mon) => 1 business day (Mon Sep 9)
    const d1 = new Date(2024, 8, 6); // Sep 6 Fri
    const d2 = new Date(2024, 8, 9); // Sep 9 Mon
    expect(diasUteis(d1, d2)).toBe(1);
  });

  it("returns 0 for same date", () => {
    const d = new Date(2024, 6, 1);
    expect(diasUteis(d, d)).toBe(0);
  });

  it("matches known ANBIMA count for Jul 1 to Jan 2 2025", () => {
    // This is the default in the Python app: ~127 DU
    const d1 = new Date(2024, 6, 1);  // Jul 1 2024
    const d2 = new Date(2025, 0, 2);  // Jan 2 2025
    const du = diasUteis(d1, d2);
    expect(du).toBeGreaterThan(120);
    expect(du).toBeLessThan(135);
  });
});

describe("diasCorridos", () => {
  it("counts calendar days", () => {
    const d1 = new Date(2024, 6, 1);  // Jul 1
    const d2 = new Date(2025, 0, 2);  // Jan 2
    expect(diasCorridos(d1, d2)).toBe(185);
  });

  it("returns 0 for same date", () => {
    const d = new Date(2024, 6, 1);
    expect(diasCorridos(d, d)).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/holidays.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement holidays.ts**

Create `src/lib/holidays.ts`:

```typescript
/**
 * ANBIMA holiday calendar for Brazilian financial market.
 * Pre-computed holidays 2015-2030. Moveable holidays derived from Easter dates.
 */

// Easter dates 2015-2030 (month is 0-indexed for JS Date)
const EASTER_DATES: [number, number, number][] = [
  [2015, 3, 5], [2016, 2, 27], [2017, 3, 16], [2018, 3, 1],
  [2019, 3, 21], [2020, 3, 12], [2021, 3, 4], [2022, 3, 17],
  [2023, 3, 9], [2024, 2, 31], [2025, 3, 20], [2026, 3, 5],
  [2027, 2, 28], [2028, 3, 16], [2029, 3, 1], [2030, 3, 21],
];

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildHolidaySet(): Set<string> {
  const holidays = new Set<string>();

  for (let year = 2015; year <= 2030; year++) {
    // Fixed holidays
    for (const md of ["01-01","04-21","05-01","09-07","10-12","11-02","11-15","12-25"]) {
      holidays.add(`${year}-${md}`);
    }
  }

  // Moveable holidays from Easter
  for (const [y, m, d] of EASTER_DATES) {
    const easter = new Date(y, m, d);
    holidays.add(isoDate(addDays(easter, -48))); // Carnival Monday
    holidays.add(isoDate(addDays(easter, -47))); // Carnival Tuesday
    holidays.add(isoDate(addDays(easter, -2)));  // Good Friday
    holidays.add(isoDate(addDays(easter, 60)));  // Corpus Christi
  }

  return holidays;
}

export const ANBIMA_HOLIDAYS = buildHolidaySet();

/** Count business days between d1 (exclusive) and d2 (inclusive). */
export function diasUteis(d1: Date, d2: Date): number {
  let count = 0;
  const current = new Date(d1);
  current.setDate(current.getDate() + 1); // start day after d1

  while (current <= d2) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6 && !ANBIMA_HOLIDAYS.has(isoDate(current))) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/** Count calendar days between d1 and d2. */
export function diasCorridos(d1: Date, d2: Date): number {
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/holidays.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/holidays.ts src/lib/holidays.test.ts
git commit -m "feat: add ANBIMA holiday calendar with business day counting"
```

---

### Task 4: TDD — `src/lib/finance.ts`

**Files:**
- Create: `src/lib/finance.test.ts`
- Create: `src/lib/finance.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/finance.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { puLtn, taxaEquivalente, durationModificada, taxaForward } from "./finance";

describe("puLtn", () => {
  it("prices a 1-year LTN at 12.5%", () => {
    // PU = 1000 / (1.125)^(252/252) = 1000 / 1.125 = 888.8889
    const pu = puLtn(0.125, 252);
    expect(pu).toBeCloseTo(888.8889, 2);
  });

  it("returns 1000 for du=0", () => {
    expect(puLtn(0.125, 0)).toBe(1000);
  });

  it("returns 1000 for negative du", () => {
    expect(puLtn(0.125, -10)).toBe(1000);
  });

  it("prices a 2-year LTN at 13%", () => {
    // PU = 1000 / (1.13)^(504/252) = 1000 / (1.13)^2 = 1000 / 1.2769 = 783.15
    const pu = puLtn(0.13, 504);
    expect(pu).toBeCloseTo(783.15, 0);
  });

  it("higher rate means lower price", () => {
    expect(puLtn(0.15, 252)).toBeLessThan(puLtn(0.10, 252));
  });
});

describe("taxaEquivalente", () => {
  it("converts annual_252 to daily", () => {
    // daily = (1 + 0.1375)^(1/252) - 1
    const daily = taxaEquivalente(0.1375, "anual_252", "diaria");
    expect(daily).toBeCloseTo(0.000511, 4);
  });

  it("converts daily to annual_252", () => {
    const daily = taxaEquivalente(0.1375, "anual_252", "diaria");
    const annual = taxaEquivalente(daily, "diaria", "anual_252");
    expect(annual).toBeCloseTo(0.1375, 6);
  });

  it("returns same rate when bases are equal", () => {
    expect(taxaEquivalente(0.1375, "anual_252", "anual_252")).toBeCloseTo(0.1375, 10);
  });

  it("converts annual_252 to monthly", () => {
    // monthly = (1 + 0.1375)^(21/252) - 1
    const monthly = taxaEquivalente(0.1375, "anual_252", "mensal");
    expect(monthly).toBeCloseTo(0.01079, 3);
  });

  it("converts annual_252 to annual_360", () => {
    const a360 = taxaEquivalente(0.1375, "anual_252", "anual_360");
    expect(a360).toBeGreaterThan(0.1375); // 360 > 252 days compounding
  });
});

describe("durationModificada", () => {
  it("calculates for 1-year bond at 12.5%", () => {
    // D* = (252/252) / (1 + 0.125) = 1 / 1.125 = 0.8889
    expect(durationModificada(0.125, 252)).toBeCloseTo(0.8889, 3);
  });

  it("longer maturity means higher duration", () => {
    expect(durationModificada(0.125, 504)).toBeGreaterThan(durationModificada(0.125, 252));
  });
});

describe("taxaForward", () => {
  it("calculates forward rate between two vertices", () => {
    // Spot 1Y = 12%, Spot 2Y = 13%
    // (1.13)^(504/252) = (1.12)^(252/252) * (1+f)^(252/252)
    // (1.13)^2 = 1.12 * (1+f)
    // f = (1.13)^2 / 1.12 - 1 = 1.2769 / 1.12 - 1 = 0.14009
    const f = taxaForward(0.12, 252, 0.13, 504);
    expect(f).toBeCloseTo(0.14009, 3);
  });

  it("returns 0 for degenerate input", () => {
    expect(taxaForward(0.12, 252, 0.13, 252)).toBe(0); // same maturity
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/finance.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement finance.ts**

Create `src/lib/finance.ts`:

```typescript
/**
 * Financial math functions for Brazilian fixed income.
 * All rates are in decimal (0.1375 = 13.75%).
 * Day count convention: DU/252 (business days over 252).
 */

export type Base = "anual_252" | "anual_360" | "mensal" | "diaria";

const BASE_DAYS: Record<Base, number> = {
  anual_252: 252,
  anual_360: 360,
  mensal: 21,
  diaria: 1,
};

/** Zero-coupon bond (LTN) pricing: PU = 1000 / (1 + taxa)^(du/252) */
export function puLtn(taxaAa: number, du: number): number {
  if (du <= 0) return 1000;
  return 1000 / Math.pow(1 + taxaAa, du / 252);
}

/** Convert rate between bases via daily rate intermediate. */
export function taxaEquivalente(taxa: number, de: Base, para: Base): number {
  const nDe = BASE_DAYS[de];
  const nPara = BASE_DAYS[para];
  const daily = Math.pow(1 + taxa, 1 / nDe) - 1;
  return Math.pow(1 + daily, nPara) - 1;
}

/** Modified duration for zero-coupon bond: D* = (DU/252) / (1 + taxa) */
export function durationModificada(taxa: number, du: number): number {
  return (du / 252) / (1 + taxa);
}

/** Forward rate from two spot rates.
 * sc = short spot rate, pc = short maturity (DU)
 * sl = long spot rate, pl = long maturity (DU)
 */
export function taxaForward(
  sc: number,
  pc: number,
  sl: number,
  pl: number
): number {
  const pf = pl - pc;
  if (pf <= 0) return 0;
  const fc = Math.pow(1 + sc, pc / 252);
  const fl = Math.pow(1 + sl, pl / 252);
  if (fc === 0) return 0;
  return Math.pow(fl / fc, 252 / pf) - 1;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/finance.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/finance.ts src/lib/finance.test.ts
git commit -m "feat: add financial math functions (puLtn, taxaEquivalente, durationModificada, taxaForward)"
```

---

### Task 5: Create `src/lib/chart-config.ts`

**Files:**
- Create: `src/lib/chart-config.ts`

- [ ] **Step 1: Create chart configuration file**

Create `src/lib/chart-config.ts`:

```typescript
/** Shared Plotly chart configuration matching the Python app's plotly_white template. */

export const PLOTLY_LAYOUT: Partial<Plotly.Layout> = {
  template: "plotly_white" as unknown as Plotly.Template,
  font: { family: "Segoe UI, Arial, sans-serif", size: 13 },
  margin: { l: 60, r: 30, t: 50, b: 50 },
  hoverlabel: { bgcolor: "white", font: { size: 12 } },
  paper_bgcolor: "rgba(0,0,0,0)",
};

export const PLOTLY_CONFIG: Partial<Plotly.Config> = {
  displayModeBar: false,
};

export const CHART_COLORS = {
  primary: "#2E75B6",
  accent: "#C55A11",
  positive: "#2E8B57",
  negative: "#CC3333",
} as const;
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/chart-config.ts
git commit -m "feat: add shared Plotly chart configuration and color constants"
```

---

### Task 6: Create `src/components/math.tsx`

**Files:**
- Create: `src/components/math.tsx`

- [ ] **Step 1: Create KaTeX rendering component**

Create `src/components/math.tsx`:

```tsx
"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

interface MathProps {
  tex: string;
  display?: boolean;
}

export function Math({ tex, display = true }: MathProps) {
  const html = katex.renderToString(tex, {
    throwOnError: false,
    displayMode: display,
  });

  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      className={display ? "block my-2 text-center" : "inline"}
    />
  );
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/math.tsx
git commit -m "feat: add KaTeX rendering component"
```

---

### Task 7: Create `src/components/plotly-chart.tsx`

**Files:**
- Create: `src/components/plotly-chart.tsx`

- [ ] **Step 1: Create dynamic Plotly wrapper**

Create `src/components/plotly-chart.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px] text-on-surface-variant text-sm">
      Carregando gráfico...
    </div>
  ),
});

interface PlotlyChartProps {
  data: PlotParams["data"];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  className?: string;
}

export function PlotlyChart({ data, layout, config, className }: PlotlyChartProps) {
  return (
    <div className={className}>
      <Plot
        data={data}
        layout={{
          autosize: true,
          ...layout,
        }}
        config={config}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors (or minor type warnings from plotly — acceptable).

- [ ] **Step 3: Commit**

```bash
git add src/components/plotly-chart.tsx
git commit -m "feat: add dynamic Plotly chart wrapper component"
```

---

### Task 8: Create `src/components/modulo-1/tab-capitalizacao.tsx`

**Files:**
- Create: `src/components/modulo-1/tab-capitalizacao.tsx`

- [ ] **Step 1: Create Tab 1 component**

Create directory first: `src/components/modulo-1/` (may already exist from topic-card).

Create `src/components/modulo-1/tab-capitalizacao.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Math as KMath } from "@/components/math";
import { taxaEquivalente, type Base } from "@/lib/finance";
import { diasUteis, diasCorridos } from "@/lib/holidays";
import { fmtBrl, fmtPct, fmtNum } from "@/lib/format";

const BASES: { label: string; key: Base }[] = [
  { label: "% ao ano (252 DU)", key: "anual_252" },
  { label: "% ao ano (360 DC)", key: "anual_360" },
  { label: "% ao mês", key: "mensal" },
  { label: "% ao dia (over)", key: "diaria" },
];

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function TabCapitalizacao() {
  // Rate converter state
  const [txIn, setTxIn] = useState(13.75);
  const [baseDe, setBaseDe] = useState(0); // index into BASES
  const [basePara, setBasePara] = useState<number | "todas">("todas");

  // Convention comparison state
  const [principal, setPrincipal] = useState(1_000_000);
  const [txAnual, setTxAnual] = useState(13.75);
  const [dataIni, setDataIni] = useState("2024-07-01");
  const [dataFim, setDataFim] = useState("2025-01-02");

  const txDec = txIn / 100;
  const bkDe = BASES[baseDe].key;

  // Rate converter results
  const converterResults = BASES.map((b) => ({
    label: b.label,
    key: b.key,
    value: b.key === bkDe ? txDec : taxaEquivalente(txDec, bkDe, b.key),
    isSrc: b.key === bkDe,
  }));

  const singleTarget = basePara !== "todas" ? BASES[basePara as number] : null;
  const singleResult = singleTarget
    ? singleTarget.key === bkDe
      ? txDec
      : taxaEquivalente(txDec, bkDe, singleTarget.key)
    : null;
  const dailyRate = taxaEquivalente(txDec, bkDe, "diaria");

  // Convention comparison
  const d1 = new Date(dataIni + "T00:00:00");
  const d2 = new Date(dataFim + "T00:00:00");
  const datesValid = d2 > d1;
  const du = datesValid ? diasUteis(d1, d2) : 0;
  const dc = datesValid ? diasCorridos(d1, d2) : 0;
  const txConv = txAnual / 100;
  const fatorDu = Math.pow(1 + txConv, du / 252);
  const fatorDc = 1 + txConv * (dc / 360);
  const vfDu = principal * fatorDu;
  const vfDc = principal * fatorDc;
  const dif = vfDu - vfDc;
  const difBps = fatorDc !== 0 ? ((fatorDu - fatorDc) / fatorDc) * 10000 : 0;

  return (
    <div className="space-y-8">
      {/* Concept Expander */}
      <details className="glass-card rounded-xl">
        <summary className="cursor-pointer px-6 py-4 font-headline font-bold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">menu_book</span>
          Conceito — Capitalização e Taxas Equivalentes
        </summary>
        <div className="px-6 pb-6 text-on-surface-variant text-sm leading-relaxed space-y-3">
          <p>
            <strong>Capitalização composta</strong> é o regime padrão do mercado financeiro brasileiro.
            Diferentemente da simples (linear), os juros incidem sobre o montante acumulado.
          </p>
          <p><strong>Convenções brasileiras:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>DU/252</strong>: dias úteis, base 252 — padrão para renda fixa.</li>
            <li><strong>DC/360</strong>: dias corridos, base 360 — usado em algumas operações de crédito.</li>
          </ul>
          <KMath tex="VF = VP \times (1 + i)^n" />
          <KMath tex="i_{eq} = (1 + i_{orig})^{\,n_{eq}/n_{orig}} - 1" />
          <KMath tex="\text{Fator}_{DU} = (1 + i_{aa})^{DU/252}" />
          <KMath tex="\text{Fator}_{DC} = 1 + i_{aa} \times DC/360" />
        </div>
      </details>

      {/* Rate Converter */}
      <section>
        <h3 className="font-headline font-bold text-lg mb-4">Conversor de Taxas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-on-surface-variant text-xs font-label mb-1">Taxa de entrada (%)</label>
            <input
              type="number"
              value={txIn}
              onChange={(e) => setTxIn(parseFloat(e.target.value) || 0)}
              step={0.25}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-on-surface-variant text-xs font-label mb-1">Base da taxa</label>
            <select
              value={baseDe}
              onChange={(e) => setBaseDe(Number(e.target.value))}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {BASES.map((b, i) => (
                <option key={b.key} value={i}>{b.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-on-surface-variant text-xs font-label mb-1">Converter para</label>
            <select
              value={basePara === "todas" ? "todas" : basePara}
              onChange={(e) =>
                setBasePara(e.target.value === "todas" ? "todas" : Number(e.target.value))
              }
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {BASES.map((b, i) => (
                <option key={b.key} value={i}>{b.label}</option>
              ))}
              <option value="todas">Todas</option>
            </select>
          </div>
        </div>

        {basePara === "todas" ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {converterResults.map((r) => (
                <div key={r.key} className="glass-card rounded-lg p-4">
                  <div className="text-on-surface-variant text-xs font-label mb-1">
                    {r.label}{r.isSrc ? " ✅" : ""}
                  </div>
                  <div className="font-headline font-bold text-sm">{fmtPct(r.value * 100, 4)}</div>
                </div>
              ))}
            </div>
            <div className="glass-card rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-left px-4 py-2 font-label text-on-surface-variant text-xs">Base</th>
                    <th className="text-right px-4 py-2 font-label text-on-surface-variant text-xs">Taxa (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {converterResults.map((r) => (
                    <tr key={r.key} className="border-b border-outline-variant/10">
                      <td className="px-4 py-2">{r.label}</td>
                      <td className="px-4 py-2 text-right font-mono">{(r.value * 100).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="glass-card rounded-lg p-4">
                <div className="text-on-surface-variant text-xs font-label mb-1">
                  Taxa original ({BASES[baseDe].label})
                </div>
                <div className="font-headline font-bold">{fmtPct(txIn, 4)}</div>
              </div>
              <div className="glass-card rounded-lg p-4">
                <div className="text-on-surface-variant text-xs font-label mb-1">
                  Taxa equivalente ({singleTarget!.label})
                </div>
                <div className="font-headline font-bold">{fmtPct(singleResult! * 100, 4)}</div>
              </div>
            </div>
            <details className="glass-card rounded-xl">
              <summary className="cursor-pointer px-4 py-3 text-sm font-headline font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">calculate</span>
                Cálculo passo a passo
              </summary>
              <div className="px-4 pb-4 text-on-surface-variant text-sm space-y-1">
                <p><strong>Passo 1:</strong> Taxa diária = {fmtPct(dailyRate * 100, 6)}</p>
                <p><strong>Passo 2:</strong> Taxa equivalente ({singleTarget!.label}) = {fmtPct(singleResult! * 100, 4)}</p>
              </div>
            </details>
          </>
        )}
      </section>

      {/* Convention Comparison */}
      <section>
        <h3 className="font-headline font-bold text-lg mb-2">Impacto da Convenção de Contagem</h3>
        <p className="text-on-surface-variant text-sm mb-4">
          Compare o resultado de uma mesma operação em DU/252 vs. DC/360.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div>
              <label className="block text-on-surface-variant text-xs font-label mb-1">Principal (R$)</label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                step={100000}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-on-surface-variant text-xs font-label mb-1">Taxa anual (%)</label>
              <input
                type="number"
                value={txAnual}
                onChange={(e) => setTxAnual(parseFloat(e.target.value) || 0)}
                step={0.25}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-on-surface-variant text-xs font-label mb-1">Data início</label>
              <input
                type="date"
                value={dataIni}
                onChange={(e) => setDataIni(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-on-surface-variant text-xs font-label mb-1">Data vencimento</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {!datesValid ? (
          <div className="glass-card rounded-lg p-4 border-l-4 border-error text-sm text-on-surface-variant">
            A data de vencimento deve ser posterior à data de início.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="glass-card rounded-xl p-5">
                <h4 className="font-headline font-bold text-sm mb-3 text-primary">DU/252 (composta)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Dias Úteis</span>
                    <span className="font-mono">{du}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Fator</span>
                    <span className="font-mono">{fatorDu.toFixed(8).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Valor Futuro</span>
                    <span className="font-mono font-bold">{fmtBrl(vfDu)}</span>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-xl p-5">
                <h4 className="font-headline font-bold text-sm mb-3 text-tertiary">DC/360 (linear)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Dias Corridos</span>
                    <span className="font-mono">{dc}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Fator</span>
                    <span className="font-mono">{fatorDc.toFixed(8).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Valor Futuro</span>
                    <span className="font-mono font-bold">{fmtBrl(vfDc)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg p-4 border-l-4 border-primary text-sm text-on-surface-variant leading-relaxed">
              <strong>Diferença:</strong> {fmtBrl(Math.abs(dif))} ({fmtNum(Math.abs(difBps))} bps).
              Em uma carteira de R$ 10 bilhões, representaria {fmtBrl(Math.abs(dif) * 10000)}.
            </div>
          </>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/modulo-1/tab-capitalizacao.tsx
git commit -m "feat: add Tab 1 — rate converter and convention comparison"
```

---

### Task 9: Create `src/components/modulo-1/tab-precificacao.tsx`

**Files:**
- Create: `src/components/modulo-1/tab-precificacao.tsx`

- [ ] **Step 1: Create Tab 2 component**

Create `src/components/modulo-1/tab-precificacao.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { puLtn, durationModificada } from "@/lib/finance";
import { fmtBrl, fmtPct, fmtNum } from "@/lib/format";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG, CHART_COLORS } from "@/lib/chart-config";

export function TabPrecificacao() {
  // LTN Pricer state
  const [txMercado, setTxMercado] = useState(12.5);
  const [prazo, setPrazo] = useState(252);

  // Sensitivity state
  const [valPos, setValPos] = useState(10_000_000);
  const [txSens, setTxSens] = useState(12.5);
  const [prazoSens, setPrazoSens] = useState(252);
  const [choque, setChoque] = useState(50);

  // LTN Pricer calculations
  const tx = txMercado / 100;
  const pu = puLtn(tx, prazo);
  const dm = durationModificada(tx, prazo);

  // Chart 1: PU vs Rate
  const chart1Data = useMemo(() => {
    const taxas = Array.from({ length: 100 }, (_, i) => 0.05 + i * 0.002);
    const pus = taxas.map((t) => puLtn(t, prazo));
    return [
      {
        x: taxas.map((t) => t * 100),
        y: pus,
        mode: "lines" as const,
        name: "PU vs Taxa",
        line: { color: CHART_COLORS.primary, width: 2.5 },
      },
      {
        x: [txMercado],
        y: [pu],
        mode: "markers" as const,
        name: "Taxa atual",
        marker: { color: CHART_COLORS.accent, size: 12, symbol: "diamond" },
      },
    ];
  }, [txMercado, prazo, pu]);

  // Chart 2: PU vs Maturity (duration effect)
  const chart2Data = useMemo(() => {
    const prazos = Array.from({ length: 504 }, (_, i) => i + 1);
    return [
      {
        x: prazos,
        y: prazos.map((p) => puLtn(tx, p)),
        mode: "lines" as const,
        name: `Taxa: ${fmtPct(txMercado)}`,
        line: { color: CHART_COLORS.primary, width: 2 },
      },
      {
        x: prazos,
        y: prazos.map((p) => puLtn(tx + 0.02, p)),
        mode: "lines" as const,
        name: `Taxa: ${fmtPct(txMercado + 2)}`,
        line: { color: CHART_COLORS.accent, width: 2, dash: "dash" as const },
      },
    ];
  }, [tx, txMercado]);

  // Sensitivity calculations
  const txS = txSens / 100;
  const chqD = choque / 10000;
  const puAntes = puLtn(txS, prazoSens);
  const puDepois = puLtn(txS + chqD, prazoSens);
  const dmS = durationModificada(txS, prazoSens);
  const qtd = valPos / puAntes;
  const varRs = qtd * puDepois - valPos;
  const varPct = (varRs / valPos) * 100;

  // Chart 3: P&L by shock
  const chart3Data = useMemo(() => {
    const choques: number[] = [];
    for (let c = -200; c <= 200; c += 25) choques.push(c);
    const pnls = choques.map((c) => qtd * puLtn(txS + c / 10000, prazoSens) - valPos);
    const colors = pnls.map((p) => (p >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative));
    const borders = choques.map((c) =>
      c === choque ? "black" : "rgba(0,0,0,0)"
    );

    return [
      {
        y: choques.map((c) => `${c >= 0 ? "+" : ""}${c} bps`),
        x: pnls,
        orientation: "h" as const,
        type: "bar" as const,
        marker: {
          color: colors,
          line: { color: borders, width: 2 },
        },
        hovertemplate: "Choque: %{y}<br>P&L: R$ %{x:,.0f}<extra></extra>",
      },
    ];
  }, [txS, prazoSens, valPos, qtd, choque]);

  const direcao = varRs < 0 ? "perda" : "ganho";

  return (
    <div className="space-y-8">
      {/* Concept Expander */}
      <details className="glass-card rounded-xl">
        <summary className="cursor-pointer px-6 py-4 font-headline font-bold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">menu_book</span>
          Conceito — Precificação de Títulos
        </summary>
        <div className="px-6 pb-6 text-on-surface-variant text-sm leading-relaxed space-y-3">
          <p>
            O <strong>PU</strong> de um título é o valor presente dos fluxos futuros. Para uma{" "}
            <strong>LTN</strong> (prefixado sem cupom), o único fluxo é R$ 1.000 no vencimento.{" "}
            <strong>Relação fundamental:</strong> taxa sobe → preço cai. Títulos mais longos são
            mais sensíveis (<strong>duration</strong>).
          </p>
          <KMath tex="PU_{LTN} = \frac{1.000}{(1 + i)^{DU/252}}" />
          <KMath tex="D^* = \frac{DU/252}{1+i}" />
        </div>
      </details>

      {/* LTN Pricer */}
      <section>
        <h3 className="font-headline font-bold text-lg mb-4">Precificador de LTN</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-on-surface-variant text-xs font-label mb-1">Taxa de mercado (% a.a.)</label>
            <input
              type="number"
              value={txMercado}
              onChange={(e) => setTxMercado(parseFloat(e.target.value) || 0)}
              step={0.1}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-on-surface-variant text-xs font-label mb-1">
              Prazo até vencimento (DU): {prazo}
            </label>
            <input
              type="range"
              min={1}
              max={504}
              value={prazo}
              onChange={(e) => setPrazo(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass-card rounded-lg p-4">
            <div className="text-on-surface-variant text-xs font-label mb-1">PU (R$)</div>
            <div className="font-headline font-bold">{fmtNum(pu)}</div>
          </div>
          <div className="glass-card rounded-lg p-4">
            <div className="text-on-surface-variant text-xs font-label mb-1">Duration Mod. (anos)</div>
            <div className="font-headline font-bold">{dm.toFixed(4).replace(".", ",")}</div>
          </div>
          <div className="glass-card rounded-lg p-4">
            <div className="text-on-surface-variant text-xs font-label mb-1">Prazo (anos)</div>
            <div className="font-headline font-bold">{fmtNum(prazo / 252)}</div>
          </div>
        </div>

        <PlotlyChart
          data={chart1Data}
          layout={{
            ...PLOTLY_LAYOUT,
            title: "PU da LTN vs. Taxa",
            xaxis: { title: "Taxa (% a.a.)" },
            yaxis: { title: "PU (R$)" },
          }}
          config={PLOTLY_CONFIG}
          className="h-[400px] mb-6"
        />

        <PlotlyChart
          data={chart2Data}
          layout={{
            ...PLOTLY_LAYOUT,
            title: "PU vs. Prazo — Efeito Duration",
            xaxis: { title: "Prazo (DU)" },
            yaxis: { title: "PU (R$)" },
          }}
          config={PLOTLY_CONFIG}
          className="h-[400px] mb-4"
        />

        <div className="glass-card rounded-lg p-4 border-l-4 border-primary text-sm text-on-surface-variant leading-relaxed">
          A distância entre as curvas aumenta com o prazo — títulos mais longos sofrem variações de
          preço maiores para um mesmo choque de taxa (<strong>efeito duration</strong>).
        </div>
      </section>

      {/* Sensitivity Analysis */}
      <section>
        <h3 className="font-headline font-bold text-lg mb-2">Sensibilidade: Impacto de um Choque de Taxa</h3>
        <p className="text-on-surface-variant text-sm italic mb-4">
          &ldquo;Se a taxa subir X bps, quanto minha posição perde?&rdquo;
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            <div>
              <label className="block text-on-surface-variant text-xs font-label mb-1">Valor da posição (R$)</label>
              <input
                type="number"
                value={valPos}
                onChange={(e) => setValPos(parseFloat(e.target.value) || 0)}
                step={1_000_000}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-on-surface-variant text-xs font-label mb-1">Taxa atual (% a.a.)</label>
              <input
                type="number"
                value={txSens}
                onChange={(e) => setTxSens(parseFloat(e.target.value) || 0)}
                step={0.1}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-on-surface-variant text-xs font-label mb-1">
                Prazo (DU): {prazoSens}
              </label>
              <input
                type="range"
                min={21}
                max={504}
                value={prazoSens}
                onChange={(e) => setPrazoSens(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="block text-on-surface-variant text-xs font-label mb-1">
                Choque de taxa (bps): {choque >= 0 ? "+" : ""}{choque}
              </label>
              <input
                type="range"
                min={-200}
                max={200}
                step={10}
                value={choque}
                onChange={(e) => setChoque(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="glass-card rounded-lg p-4">
            <div className="text-on-surface-variant text-xs font-label mb-1">PU antes</div>
            <div className="font-headline font-bold text-sm">{fmtNum(puAntes)}</div>
          </div>
          <div className="glass-card rounded-lg p-4">
            <div className="text-on-surface-variant text-xs font-label mb-1">PU depois</div>
            <div className="font-headline font-bold text-sm">{fmtNum(puDepois)}</div>
          </div>
          <div className="glass-card rounded-lg p-4">
            <div className="text-on-surface-variant text-xs font-label mb-1">Variação (R$)</div>
            <div className={`font-headline font-bold text-sm ${varRs >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}`}>
              {varRs >= 0 ? "+" : ""}{fmtBrl(varRs)}
            </div>
          </div>
          <div className="glass-card rounded-lg p-4">
            <div className="text-on-surface-variant text-xs font-label mb-1">Duration Mod.</div>
            <div className="font-headline font-bold text-sm">{dmS.toFixed(4).replace(".", ",")}</div>
          </div>
        </div>

        <PlotlyChart
          data={chart3Data}
          layout={{
            ...PLOTLY_LAYOUT,
            title: "P&L por Choque de Taxa",
            xaxis: { title: "P&L (R$)" },
            yaxis: { title: "" },
            height: 600,
          }}
          config={PLOTLY_CONFIG}
          className="h-[600px] mb-4"
        />

        <div className="glass-card rounded-lg p-4 border-l-4 border-primary text-sm text-on-surface-variant leading-relaxed">
          Choque de <strong>{choque >= 0 ? "+" : ""}{choque} bps</strong> →{" "}
          <strong>{direcao}</strong> de <strong>{fmtBrl(Math.abs(varRs))}</strong> (
          {fmtPct(Math.abs(varPct))}) em posição de {fmtBrl(valPos)} com {prazoSens} DU.
          <br />
          Aproximação por D* ({dmS.toFixed(4).replace(".", ",")}): ΔP ≈{" "}
          {fmtPct(dmS * Math.abs(chqD) * 100)} vs. exato {fmtPct(Math.abs(varPct))}.
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/modulo-1/tab-precificacao.tsx
git commit -m "feat: add Tab 2 — LTN pricer, charts, and sensitivity analysis"
```

---

### Task 10: Rewrite `src/app/modulo-1/matematica-financeira/page.tsx`

**Files:**
- Modify: `src/app/modulo-1/matematica-financeira/page.tsx`

- [ ] **Step 1: Replace ComingSoon with tab container page**

Replace the entire content of `src/app/modulo-1/matematica-financeira/page.tsx`:

```tsx
import { MatematicaFinanceiraContent } from "./content";

export const metadata = {
  title: "Matemática Financeira | Laboratório de Tesouraria",
};

export default function MatematicaFinanceiraPage() {
  return <MatematicaFinanceiraContent />;
}
```

- [ ] **Step 2: Create the client content component**

Create `src/app/modulo-1/matematica-financeira/content.tsx`:

```tsx
"use client";

import { useState } from "react";
import { TabCapitalizacao } from "@/components/modulo-1/tab-capitalizacao";
import { TabPrecificacao } from "@/components/modulo-1/tab-precificacao";

const TABS = [
  { label: "📊 Capitalização e Taxas Equivalentes", key: "cap" },
  { label: "💵 Precificação de Títulos", key: "prec" },
];

export function MatematicaFinanceiraContent() {
  const [activeTab, setActiveTab] = useState("cap");

  return (
    <main className="mesh-bg pt-8 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          📐 Matemática Financeira Aplicada à Tesouraria
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Qual é o preço justo deste título? Qual taxa
            estou realmente praticando nesta operação?&rdquo;
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-0 mb-8 border-b border-outline-variant/30">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-headline font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? "text-primary border-primary"
                  : "text-on-surface-variant border-transparent hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        {activeTab === "cap" && <TabCapitalizacao />}
        {activeTab === "prec" && <TabPrecificacao />}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/modulo-1/matematica-financeira/page.tsx src/app/modulo-1/matematica-financeira/content.tsx
git commit -m "feat: build Matemática Financeira page with tab container"
```

---

### Task 11: Build verification

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass (format, holidays, finance).

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds. Route `/modulo-1/matematica-financeira` renders.

- [ ] **Step 4: Visual verification**

Run: `npm run dev`

Check in browser at `http://localhost:3000/modulo-1/matematica-financeira`:
1. Tab bar shows "Capitalização e Taxas Equivalentes" and "Precificação de Títulos"
2. Tab 1: concept expander opens/closes, rate converter works with all base options, convention comparison shows side-by-side results
3. Tab 2: LTN pricer shows metrics and 2 charts, sensitivity analysis shows metrics, P&L bar chart, and info box
4. All LaTeX formulas render in concept expanders
5. Tab switching works without page reload
6. Module tab bar highlights "Matemática Financeira" correctly
7. Main navbar highlights "Operações Fundamentais"
8. Responsive: charts resize, inputs stack on mobile
