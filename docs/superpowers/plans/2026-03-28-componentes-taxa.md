# Componentes da Taxa de Juros — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Componentes da Taxa de Juros" topic page for Módulo 2 with two interactive tabs: rate decomposition simulator and breakeven inflation calculator.

**Architecture:** Client-side React components with Plotly charts. Tab 1 is fully client-side math (no data loading). Tab 2 has dual mode: manual inputs (client-side) and preloaded data (async CSV fetch). Each tab is a self-contained client component under `src/components/modulo-2/`. A thin content wrapper provides the page shell with tab switching.

**Tech Stack:** Next.js 16, React 19, TypeScript, Plotly.js, KaTeX, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-03-28-componentes-taxa-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/finance.ts` | Modify | Add `calcularBreakeven`, `premioPrazo`, `SPREADS_CREDITO_MOD2`, `PREMIO_LIQUIDEZ_MOD2` |
| `src/lib/data.ts` | Modify | Add `loadCurvasDi`, `loadNtnbTaxas`, `loadFocusIpca` + interfaces |
| `src/tests/finance.test.ts` | Create | Unit tests for new finance functions |
| `src/tests/data.test.ts` | Create | Unit tests for new data loaders |
| `src/components/modulo-2/tab-anatomia-taxa.tsx` | Create | Tab 1 — rate decomposition simulator |
| `src/components/modulo-2/tab-breakeven.tsx` | Create | Tab 2 — breakeven calculator |
| `src/app/modulo-2/componentes-taxa/content.tsx` | Create | Page shell with tab switcher |
| `src/app/modulo-2/componentes-taxa/page.tsx` | Modify | Replace ComingSoon import with content |

---

### Task 1: Add finance functions and constants

**Files:**
- Modify: `src/lib/finance.ts`
- Create: `src/tests/finance.test.ts`

- [ ] **Step 1: Write failing tests for calcularBreakeven and premioPrazo**

Create `src/tests/finance.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { calcularBreakeven, premioPrazo } from "@/lib/finance";

describe("calcularBreakeven", () => {
  it("computes breakeven from nominal and real rates (decimal inputs)", () => {
    // LTN 12.80%, NTN-B 6.50% → breakeven ≈ 5.915%
    const be = calcularBreakeven(0.128, 0.065);
    expect(be).toBeCloseTo(0.05915, 4);
  });

  it("returns 0 when real rate is -100%", () => {
    expect(calcularBreakeven(0.1, -1)).toBe(0);
  });

  it("handles zero rates", () => {
    expect(calcularBreakeven(0, 0)).toBe(0);
  });
});

describe("premioPrazo", () => {
  it("returns 0 for zero maturity", () => {
    expect(premioPrazo(0)).toBeCloseTo(0, 6);
  });

  it("computes term premium with default alpha=30 bps", () => {
    // premioPrazo(3) = 30/100 * ln(1+3) = 0.3 * ln(4) ≈ 0.4159
    expect(premioPrazo(3)).toBeCloseTo(0.3 * Math.log(4), 4);
  });

  it("accepts custom alpha", () => {
    // premioPrazo(5, 50) = 50/100 * ln(6) ≈ 0.8959
    expect(premioPrazo(5, 50)).toBeCloseTo(0.5 * Math.log(6), 4);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tests/finance.test.ts`
Expected: FAIL — `calcularBreakeven` and `premioPrazo` are not exported

- [ ] **Step 3: Implement the functions and constants**

Add to end of `src/lib/finance.ts`:

```typescript
export function calcularBreakeven(taxaNominal: number, taxaReal: number): number {
  if (1 + taxaReal === 0) return 0;
  return (1 + taxaNominal) / (1 + taxaReal) - 1;
}

export function premioPrazo(prazoAnos: number, alphaBps: number = 30): number {
  return (alphaBps / 100) * Math.log(1 + prazoAnos);
}

export const SPREADS_CREDITO_MOD2: Record<string, number> = {
  "Soberano (0 bps)": 0,
  "AAA (30–60 bps)": 45,
  "AA (60–120 bps)": 90,
  "A (120–200 bps)": 160,
  "BBB (200–350 bps)": 275,
};

export const PREMIO_LIQUIDEZ_MOD2: Record<string, number> = {
  "Alta — DI/Títulos Públicos (0–10 bps)": 5,
  "Média — Debêntures IG (20–60 bps)": 40,
  "Baixa — Crédito ilíquido (60–150 bps)": 105,
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/finance.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/finance.ts src/tests/finance.test.ts
git commit -m "feat(mod2): add calcularBreakeven, premioPrazo, and mod2 credit/liquidity constants"
```

---

### Task 2: Add data loaders for DI curve, NTN-B, and Focus IPCA

**Files:**
- Modify: `src/lib/data.ts`
- Create: `src/tests/data.test.ts`

- [ ] **Step 1: Write failing tests for new loaders**

Create `src/tests/data.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { loadCurvasDi, loadNtnbTaxas, loadFocusIpca } from "@/lib/data";

describe("loadCurvasDi", () => {
  it("loads and parses curvas_di.csv with correct shape", async () => {
    const data = await loadCurvasDi();
    expect(data.length).toBeGreaterThan(0);
    const first = data[0];
    expect(first).toHaveProperty("data");
    expect(first).toHaveProperty("prazoDu");
    expect(first).toHaveProperty("taxa");
    expect(typeof first.prazoDu).toBe("number");
    expect(typeof first.taxa).toBe("number");
  });
});

describe("loadNtnbTaxas", () => {
  it("loads and parses ntnb_taxas.csv with correct shape", async () => {
    const data = await loadNtnbTaxas();
    expect(data.length).toBeGreaterThan(0);
    const first = data[0];
    expect(first).toHaveProperty("data");
    expect(first).toHaveProperty("prazoDu");
    expect(first).toHaveProperty("taxa");
    expect(typeof first.taxa).toBe("number");
  });
});

describe("loadFocusIpca", () => {
  it("loads and parses focus_ipca.csv with correct shape", async () => {
    const data = await loadFocusIpca();
    expect(data.length).toBeGreaterThan(0);
    const first = data[0];
    expect(first).toHaveProperty("dataColeta");
    expect(first).toHaveProperty("variavel");
    expect(first).toHaveProperty("mediana");
    expect(typeof first.mediana).toBe("number");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tests/data.test.ts`
Expected: FAIL — functions not exported

- [ ] **Step 3: Implement the loaders**

Add to `src/lib/data.ts` — interfaces first, then functions:

```typescript
export interface CurvaDiPoint {
  data: string;
  prazoDu: number;
  taxa: number;
}

export interface NtnbTaxaPoint {
  data: string;
  prazoDu: number;
  taxa: number;
}

export interface FocusIpcaPoint {
  dataColeta: string;
  variavel: string;
  mediana: number;
}

export async function loadCurvasDi(): Promise<CurvaDiPoint[]> {
  const rows = await fetchCsv("curvas_di.csv");
  return rows
    .map((r) => ({
      data: r.data,
      prazoDu: parseInt(r.prazo_du, 10),
      taxa: parseFloat(r.taxa),
    }))
    .filter((r) => !isNaN(r.prazoDu) && !isNaN(r.taxa))
    .sort((a, b) => a.data.localeCompare(b.data) || a.prazoDu - b.prazoDu);
}

export async function loadNtnbTaxas(): Promise<NtnbTaxaPoint[]> {
  const rows = await fetchCsv("ntnb_taxas.csv");
  return rows
    .map((r) => ({
      data: r.data,
      prazoDu: parseInt(r.prazo_du, 10),
      taxa: parseFloat(r.taxa),
    }))
    .filter((r) => !isNaN(r.prazoDu) && !isNaN(r.taxa))
    .sort((a, b) => a.data.localeCompare(b.data) || a.prazoDu - b.prazoDu);
}

export async function loadFocusIpca(): Promise<FocusIpcaPoint[]> {
  const rows = await fetchCsv("focus_ipca.csv");
  return rows
    .map((r) => ({
      dataColeta: r.data_coleta,
      variavel: r.variavel,
      mediana: parseFloat(r.mediana),
    }))
    .filter((r) => !isNaN(r.mediana))
    .sort((a, b) => a.dataColeta.localeCompare(b.dataColeta));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/data.test.ts`
Expected: All 3 tests PASS

Note: These tests require `fetch` to be available. If vitest environment doesn't support `fetch` by default, the tests may need `environment: "jsdom"` in vitest config or use a polyfill. If tests fail because `fetch` is not defined, add to `vitest.config.ts`: `test: { globals: true, environment: "jsdom" }` and `npm install -D jsdom`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data.ts src/tests/data.test.ts
git commit -m "feat(mod2): add loadCurvasDi, loadNtnbTaxas, loadFocusIpca data loaders"
```

---

### Task 3: Build Tab 1 — Anatomia da Taxa (rate decomposition simulator)

**Files:**
- Create: `src/components/modulo-2/tab-anatomia-taxa.tsx`

- [ ] **Step 1: Create the component directory**

Run: `mkdir -p src/components/modulo-2`

- [ ] **Step 2: Write the full tab component**

Create `src/components/modulo-2/tab-anatomia-taxa.tsx`:

```typescript
"use client";

import { useState, useMemo } from "react";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { premioPrazo, SPREADS_CREDITO_MOD2, PREMIO_LIQUIDEZ_MOD2 } from "@/lib/finance";
import { fmtPct } from "@/lib/format";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const CREDITO_KEYS = Object.keys(SPREADS_CREDITO_MOD2);
const LIQUIDEZ_KEYS = Object.keys(PREMIO_LIQUIDEZ_MOD2);

const DECOMP_COLORS = {
  real: "#1B3A5C",
  inflacao: "#8B5CF6",
  credito: "#C55A11",
  liquidez: "#D4A012",
  prazo: "#888888",
  total: "#2E75B6",
};

export function TabAnatomiaTaxa() {
  const [txReal, setTxReal] = useState(5.0);
  const [expInflacao, setExpInflacao] = useState(4.5);
  const [credito, setCredito] = useState(CREDITO_KEYS[0]); // Soberano
  const [liquidez, setLiquidez] = useState(LIQUIDEZ_KEYS[0]); // Alta
  const [prazoAnos, setPrazoAnos] = useState(3.0);

  const { spCred, spLiq, spPrazo, taxaTotal, spreadRf } = useMemo(() => {
    const spCredPp = SPREADS_CREDITO_MOD2[credito] / 100;
    const spLiqPp = PREMIO_LIQUIDEZ_MOD2[liquidez] / 100;
    const spPrazoPp = premioPrazo(prazoAnos);
    const total = txReal + expInflacao + spCredPp + spLiqPp + spPrazoPp;
    const spread = (total - txReal) * 100; // bps
    return {
      spCred: spCredPp,
      spLiq: spLiqPp,
      spPrazo: spPrazoPp,
      taxaTotal: total,
      spreadRf: spread,
    };
  }, [txReal, expInflacao, credito, liquidez, prazoAnos]);

  // Waterfall data
  const waterfallData = useMemo(() => {
    const labels = ["Taxa Real", "Inflação Esperada", "Prêmio Crédito", "Prêmio Liquidez", "Prêmio Prazo", "Total"];
    const vals = [txReal, expInflacao, spCred, spLiq, spPrazo, 0];
    const measures: string[] = ["relative", "relative", "relative", "relative", "relative", "total"];
    const texts = [
      ...vals.slice(0, 5).map((v) => fmtPct(v)),
      fmtPct(taxaTotal),
    ];
    return { labels, vals, measures, texts };
  }, [txReal, expInflacao, spCred, spLiq, spPrazo, taxaTotal]);

  // Stacked area data
  const areaData = useMemo(() => {
    const prazos: number[] = [];
    for (let p = 0.25; p <= 10.0; p += 0.25) prazos.push(Math.round(p * 100) / 100);
    return {
      prazos,
      real: prazos.map(() => txReal),
      inflacao: prazos.map(() => expInflacao),
      credito: prazos.map(() => spCred),
      liquidez: prazos.map(() => spLiq),
      prazo: prazos.map((p) => premioPrazo(p)),
    };
  }, [txReal, expInflacao, spCred, spLiq]);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-xl">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">school</span>
          Conceito — Componentes da Taxa de Juros
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            A taxa de juros de qualquer instrumento pode ser decomposta em cinco componentes:
          </p>
          <div className="text-center">
            <KMath
              tex="i_{nominal} = i_{real} + \pi^e + \phi_{crédito} + \phi_{liquidez} + \phi_{prazo}"
              display
            />
          </div>
          <ul className="space-y-1 list-disc pl-5">
            <li><strong className="text-on-surface">Taxa real livre de risco:</strong> remuneração pelo uso do capital no tempo, sem risco. Proxy: NTN-B curta.</li>
            <li><strong className="text-on-surface">Expectativa de inflação (πᵉ):</strong> compensação pela perda de poder de compra.</li>
            <li><strong className="text-on-surface">Prêmio de crédito:</strong> compensação pelo risco de default do emissor.</li>
            <li><strong className="text-on-surface">Prêmio de liquidez:</strong> compensação pela dificuldade de vender o ativo.</li>
            <li><strong className="text-on-surface">Prêmio de prazo (term premium):</strong> compensação adicional por imobilizar capital por mais tempo.</li>
          </ul>
        </div>
      </details>

      {/* Inputs — 2-column */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">tune</span>
          Decompositor Interativo por Prazo
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {/* Left: base components */}
          <div className="space-y-3">
            <p className="font-label text-primary text-xs tracking-widest uppercase font-semibold">
              Componentes Base
            </p>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Taxa real livre de risco (% a.a.)
              </label>
              <input
                type="number"
                value={txReal}
                step={0.25}
                onChange={(e) => setTxReal(Number(e.target.value))}
                className={INPUT_CLASS}
              />
              <p className="text-[10px] text-on-surface-variant mt-1">Proxy: juro real da NTN-B curta ou SELIC real ex-ante</p>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Expectativa de inflação — IPCA (% a.a.)
              </label>
              <input
                type="number"
                value={expInflacao}
                step={0.25}
                onChange={(e) => setExpInflacao(Number(e.target.value))}
                className={INPUT_CLASS}
              />
              <p className="text-[10px] text-on-surface-variant mt-1">Mediana Focus ou inflação implícita</p>
            </div>
          </div>
          {/* Right: premiums */}
          <div className="space-y-3">
            <p className="font-label text-primary text-xs tracking-widest uppercase font-semibold">
              Prêmios
            </p>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Risco de crédito
              </label>
              <select
                value={credito}
                onChange={(e) => setCredito(e.target.value)}
                className={INPUT_CLASS}
              >
                {CREDITO_KEYS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Liquidez do instrumento
              </label>
              <select
                value={liquidez}
                onChange={(e) => setLiquidez(e.target.value)}
                className={INPUT_CLASS}
              >
                {LIQUIDEZ_KEYS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Prazo do instrumento: <strong>{prazoAnos.toFixed(2).replace(".", ",")} anos</strong>
              </label>
              <input
                type="range"
                min={0.25}
                max={10}
                step={0.25}
                value={prazoAnos}
                onChange={(e) => setPrazoAnos(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                <span>0,25</span>
                <span>10,0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="glass-card rounded-lg p-4 text-center">
          <span className="text-xs font-label text-on-surface-variant">Taxa nominal total</span>
          <p className="text-2xl font-headline font-bold mt-1">{fmtPct(taxaTotal)}</p>
        </div>
        <div className="glass-card rounded-lg p-4 text-center">
          <span className="text-xs font-label text-on-surface-variant">Spread sobre taxa real</span>
          <p className="text-2xl font-headline font-bold mt-1">{spreadRf.toFixed(0)} bps</p>
        </div>
        <div className="glass-card rounded-lg p-4 text-center">
          <span className="text-xs font-label text-on-surface-variant">Prêmio de prazo</span>
          <p className="text-2xl font-headline font-bold mt-1">{fmtPct(spPrazo)}</p>
        </div>
      </div>

      {/* Waterfall chart */}
      <div className="glass-card rounded-xl p-4">
        <PlotlyChart
          className="h-[420px]"
          data={[
            {
              type: "waterfall" as const,
              x: waterfallData.labels,
              y: waterfallData.vals,
              measure: waterfallData.measures,
              connector: { line: { color: "gray", width: 1, dash: "dot" } },
              increasing: { marker: { color: DECOMP_COLORS.real } },
              decreasing: { marker: { color: "#CC3333" } },
              totals: { marker: { color: DECOMP_COLORS.total } },
              text: waterfallData.texts,
              textposition: "outside",
              textfont: { color: "#aaabb0" },
            } as any,
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            title: { text: "Decomposição da Taxa (Waterfall)", font: { color: "#aaabb0", size: 14 } },
            yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "% a.a." }, ticksuffix: "%" },
            showlegend: false,
            margin: { l: 60, r: 30, t: 60, b: 50 },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Stacked area chart */}
      <div className="glass-card rounded-xl p-4">
        <PlotlyChart
          className="h-[420px]"
          data={[
            { x: areaData.prazos, y: areaData.real, name: "Taxa Real", stackgroup: "one", fillcolor: DECOMP_COLORS.real, line: { width: 0.5, color: DECOMP_COLORS.real }, mode: "lines" as const },
            { x: areaData.prazos, y: areaData.inflacao, name: "Inflação Esperada", stackgroup: "one", fillcolor: DECOMP_COLORS.inflacao, line: { width: 0.5, color: DECOMP_COLORS.inflacao }, mode: "lines" as const },
            { x: areaData.prazos, y: areaData.credito, name: "Prêmio Crédito", stackgroup: "one", fillcolor: DECOMP_COLORS.credito, line: { width: 0.5, color: DECOMP_COLORS.credito }, mode: "lines" as const },
            { x: areaData.prazos, y: areaData.liquidez, name: "Prêmio Liquidez", stackgroup: "one", fillcolor: DECOMP_COLORS.liquidez, line: { width: 0.5, color: DECOMP_COLORS.liquidez }, mode: "lines" as const },
            { x: areaData.prazos, y: areaData.prazo, name: "Prêmio Prazo", stackgroup: "one", fillcolor: DECOMP_COLORS.prazo, line: { width: 0.5, color: DECOMP_COLORS.prazo }, mode: "lines" as const },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            title: { text: "Composição da Taxa por Prazo", font: { color: "#aaabb0", size: 14 } },
            xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: "Prazo (anos)" } },
            yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "Taxa (% a.a.)" }, ticksuffix: "%" },
            hovermode: "x unified" as const,
            margin: { l: 60, r: 30, t: 60, b: 50 },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          💡 Na prática, os componentes não são diretamente observáveis — o mercado negocia a taxa
          total. Decompor é um exercício analítico que ajuda o gestor a avaliar se a taxa oferecida
          compensa adequadamente cada fonte de risco.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to `tab-anatomia-taxa.tsx`

- [ ] **Step 4: Commit**

```bash
git add src/components/modulo-2/tab-anatomia-taxa.tsx
git commit -m "feat(mod2): add Tab 1 — Anatomia da Taxa (rate decomposition simulator)"
```

---

### Task 4: Build Tab 2 — Breakeven Calculator

**Files:**
- Create: `src/components/modulo-2/tab-breakeven.tsx`

- [ ] **Step 1: Write the full tab component**

Create `src/components/modulo-2/tab-breakeven.tsx`:

```typescript
"use client";

import { useState, useEffect, useMemo } from "react";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { calcularBreakeven } from "@/lib/finance";
import {
  loadCurvasDi,
  loadNtnbTaxas,
  loadFocusIpca,
  META_INFLACAO,
  type CurvaDiPoint,
  type NtnbTaxaPoint,
  type FocusIpcaPoint,
} from "@/lib/data";
import { fmtPct } from "@/lib/format";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const COLOR_BREAKEVEN = "#8B5CF6";

interface MergedPoint {
  prazoDu: number;
  prazoAnos: number;
  di: number;
  ntnb: number;
  breakeven: number;
}

function getDiffColor(diff: number): string {
  const abs = Math.abs(diff);
  if (abs < 0.3) return "text-[#2E8B57]";
  if (diff > 0.8) return "text-[#CC3333]";
  return "text-[#D4A012]";
}

function getInterpretation(diff: number): { text: string; borderColor: string } {
  if (Math.abs(diff) < 0.3) {
    return {
      text: "Inflação implícita alinhada com o consenso Focus. Prêmio de risco de inflação neutro.",
      borderColor: "border-[#2E8B57]",
    };
  }
  if (diff > 0.8) {
    return {
      text: "Breakeven significativamente acima do Focus — prêmio de risco inflacionário elevado. O mercado exige compensação adicional pela incerteza inflacionária.",
      borderColor: "border-[#CC3333]",
    };
  }
  if (diff > 0) {
    return {
      text: "Breakeven acima do Focus — possível prêmio de risco de inflação. O mercado precifica inflação ligeiramente acima do consenso.",
      borderColor: "border-[#D4A012]",
    };
  }
  return {
    text: "Breakeven abaixo do Focus — pode indicar forte demanda por proteção inflacionária (NTN-B) ou expectativa de desaceleração econômica.",
    borderColor: "border-[#2E75B6]",
  };
}

export function TabBreakeven() {
  const [modo, setModo] = useState<"preloaded" | "manual">("manual");

  // Manual mode state
  const [txLtn, setTxLtn] = useState(12.80);
  const [txNtnb, setTxNtnb] = useState(6.50);
  const [focusManual, setFocusManual] = useState(4.50);

  // Preloaded mode state
  const [diData, setDiData] = useState<CurvaDiPoint[]>([]);
  const [ntnbData, setNtnbData] = useState<NtnbTaxaPoint[]>([]);
  const [focusData, setFocusData] = useState<FocusIpcaPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPrazoDu, setSelectedPrazoDu] = useState(0);

  // Load preloaded data on mode switch
  useEffect(() => {
    if (modo !== "preloaded") return;
    setLoading(true);
    Promise.all([loadCurvasDi(), loadNtnbTaxas(), loadFocusIpca()])
      .then(([di, ntnb, focus]) => {
        setDiData(di);
        setNtnbData(ntnb);
        setFocusData(focus);
        // Set default date
        const dates = [...new Set(di.map((d) => d.data))].sort();
        if (dates.length > 0) {
          setSelectedDate(dates[dates.length - 1]);
        }
      })
      .finally(() => setLoading(false));
  }, [modo]);

  // Available dates
  const availableDates = useMemo(() => {
    return [...new Set(diData.map((d) => d.data))].sort();
  }, [diData]);

  // Merged data for selected date
  const merged = useMemo((): MergedPoint[] => {
    if (!selectedDate) return [];
    const diForDate = diData.filter((d) => d.data === selectedDate);
    const ntnbForDate = ntnbData.filter((d) => d.data === selectedDate);
    const result: MergedPoint[] = [];
    for (const nb of ntnbForDate) {
      const di = diForDate.find((d) => d.prazoDu === nb.prazoDu);
      if (di) {
        const be = calcularBreakeven(di.taxa, nb.taxa) * 100;
        result.push({
          prazoDu: nb.prazoDu,
          prazoAnos: Math.round((nb.prazoDu / 252) * 10) / 10,
          di: di.taxa * 100,
          ntnb: nb.taxa * 100,
          breakeven: be,
        });
      }
    }
    return result.sort((a, b) => a.prazoDu - b.prazoDu);
  }, [selectedDate, diData, ntnbData]);

  // Set default prazo when merged changes
  useEffect(() => {
    if (merged.length > 0 && (selectedPrazoDu === 0 || !merged.find((m) => m.prazoDu === selectedPrazoDu))) {
      setSelectedPrazoDu(merged[0].prazoDu);
    }
  }, [merged, selectedPrazoDu]);

  // Focus value for selected date
  const focusValue = useMemo(() => {
    if (focusData.length === 0) return META_INFLACAO;
    const ipca12m = focusData
      .filter((f) => f.variavel === "IPCA_12m")
      .sort((a, b) => a.dataColeta.localeCompare(b.dataColeta));
    if (ipca12m.length === 0) return META_INFLACAO;
    // Find latest Focus entry on or before selected date
    const beforeDate = ipca12m.filter((f) => f.dataColeta <= selectedDate);
    if (beforeDate.length > 0) return beforeDate[beforeDate.length - 1].mediana;
    return ipca12m[ipca12m.length - 1].mediana;
  }, [focusData, selectedDate]);

  // Manual mode breakeven
  const manualBe = calcularBreakeven(txLtn / 100, txNtnb / 100) * 100;
  const manualDiff = manualBe - focusManual;

  // Preloaded selected point
  const selectedPoint = merged.find((m) => m.prazoDu === selectedPrazoDu);
  const preloadedBe = selectedPoint?.breakeven ?? 0;
  const preloadedDiff = preloadedBe - focusValue;

  // Active values (for display)
  const activeBe = modo === "manual" ? manualBe : preloadedBe;
  const activeFocus = modo === "manual" ? focusManual : focusValue;
  const activeDiff = modo === "manual" ? manualDiff : preloadedDiff;
  const interp = getInterpretation(activeDiff);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-xl">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">school</span>
          Conceito — Inflação Implícita (Breakeven)
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p><strong className="text-on-surface">Relação de Fisher:</strong></p>
          <div className="text-center">
            <KMath tex="(1 + i_{nominal}) = (1 + i_{real}) \times (1 + \pi^{implícita})" display />
          </div>
          <div className="text-center">
            <KMath tex="\pi^{implícita} = \frac{1 + i_{LTN}}{1 + i_{NTN\text{-}B}} - 1" display />
          </div>
          <p>
            A inflação implícita <strong className="text-on-surface">não</strong> é igual à
            expectativa de inflação pura — ela inclui um prêmio de risco de inflação. Se breakeven
            &gt; Focus, pode significar que o mercado exige prêmio adicional pela incerteza
            inflacionária.
          </p>
        </div>
      </details>

      {/* Mode toggle */}
      <div className="glass-card rounded-xl p-5 space-y-5">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">calculate</span>
          Calculadora de Inflação Implícita
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setModo("manual")}
            className={`px-4 py-2 text-sm font-headline font-bold rounded-lg transition-colors cursor-pointer ${
              modo === "manual"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-white/[0.04] text-on-surface-variant border border-transparent hover:border-white/10"
            }`}
          >
            Inserir manualmente
          </button>
          <button
            onClick={() => setModo("preloaded")}
            className={`px-4 py-2 text-sm font-headline font-bold rounded-lg transition-colors cursor-pointer ${
              modo === "preloaded"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-white/[0.04] text-on-surface-variant border border-transparent hover:border-white/10"
            }`}
          >
            Dados pré-carregados
          </button>
        </div>

        {/* Manual mode inputs */}
        {modo === "manual" && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Taxa LTN — prefixado (% a.a.)
              </label>
              <input
                type="number"
                value={txLtn}
                step={0.05}
                onChange={(e) => setTxLtn(Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Taxa NTN-B — IPCA+ (% a.a.)
              </label>
              <input
                type="number"
                value={txNtnb}
                step={0.05}
                onChange={(e) => setTxNtnb(Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Expectativa Focus — IPCA (% a.a.)
              </label>
              <input
                type="number"
                value={focusManual}
                step={0.1}
                onChange={(e) => setFocusManual(Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        )}

        {/* Preloaded mode inputs */}
        {modo === "preloaded" && (
          loading ? (
            <p className="text-sm text-on-surface-variant">Carregando dados...</p>
          ) : availableDates.length === 0 ? (
            <p className="text-sm text-on-surface-variant">📂 Nenhuma data disponível nos datasets.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Data de referência
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Prazo
                </label>
                <select
                  value={selectedPrazoDu}
                  onChange={(e) => setSelectedPrazoDu(Number(e.target.value))}
                  className={INPUT_CLASS}
                >
                  {merged.map((m) => (
                    <option key={m.prazoDu} value={m.prazoDu}>
                      {m.prazoAnos} ano(s) ({m.prazoDu} DU)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )
        )}
      </div>

      {/* Metric cards */}
      {(modo === "manual" || (modo === "preloaded" && merged.length > 0)) && (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="glass-card rounded-lg p-4 text-center">
              <span className="text-xs font-label text-on-surface-variant">Breakeven (inflação implícita)</span>
              <p className="text-2xl font-headline font-bold mt-1" style={{ color: COLOR_BREAKEVEN }}>{fmtPct(activeBe)}</p>
            </div>
            <div className="glass-card rounded-lg p-4 text-center">
              <span className="text-xs font-label text-on-surface-variant">Focus IPCA</span>
              <p className="text-2xl font-headline font-bold mt-1">{fmtPct(activeFocus)}</p>
            </div>
            <div className="glass-card rounded-lg p-4 text-center">
              <span className="text-xs font-label text-on-surface-variant">Diferença</span>
              <p className={`text-2xl font-headline font-bold mt-1 ${getDiffColor(activeDiff)}`}>
                {activeDiff >= 0 ? "+" : ""}{fmtPct(activeDiff)} pp
              </p>
            </div>
          </div>

          {/* Interpretation box */}
          <div className={`glass-card rounded-lg p-4 border-l-4 ${interp.borderColor}`}>
            <p className="text-sm text-on-surface-variant">
              {interp.text}
            </p>
            <p className="text-sm text-on-surface-variant mt-2">
              <strong className="text-on-surface">Implicação para a tesouraria:</strong> Se você
              acredita que a inflação ficará <strong>abaixo</strong> do breakeven, prefixados
              oferecem melhor retorno. Se acredita que ficará <strong>acima</strong>, indexados
              (IPCA+) são mais atrativos.
            </p>
          </div>
        </>
      )}

      {/* Bar chart — preloaded mode only */}
      {modo === "preloaded" && merged.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <PlotlyChart
            className="h-[400px]"
            data={[
              {
                type: "bar" as const,
                x: merged.map((m) => `${m.prazoAnos}A`),
                y: merged.map((m) => m.breakeven),
                name: "Breakeven",
                marker: { color: COLOR_BREAKEVEN, opacity: 0.8 },
                hovertemplate: "Prazo: %{x}<br>Breakeven: %{y:.2f}%<extra></extra>",
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              title: { text: "Inflação Implícita por Prazo", font: { color: "#aaabb0", size: 14 } },
              xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: "Prazo" } },
              yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "Breakeven (% a.a.)" }, ticksuffix: "%" },
              shapes: [
                { type: "line", x0: -0.5, x1: merged.length - 0.5, y0: focusValue, y1: focusValue, line: { color: "#888", width: 1.5, dash: "dash" } },
                { type: "line", x0: -0.5, x1: merged.length - 0.5, y0: META_INFLACAO, y1: META_INFLACAO, line: { color: "#666", width: 1, dash: "dot" } },
              ],
              annotations: [
                { x: merged.length - 0.8, y: focusValue, text: `Focus: ${focusValue.toFixed(1)}%`, showarrow: false, font: { size: 10, color: "#888" }, yshift: 12 },
                { x: merged.length - 0.8, y: META_INFLACAO, text: `Meta: ${META_INFLACAO}%`, showarrow: false, font: { size: 10, color: "#666" }, yshift: -12 },
              ],
              showlegend: false,
              margin: { l: 60, r: 30, t: 60, b: 50 },
            }}
            config={PLOTLY_CONFIG}
          />
        </div>
      )}

      {/* Data table — preloaded mode only */}
      {modo === "preloaded" && merged.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container">
                <th className="text-left px-4 py-3 font-label text-on-surface-variant">Prazo (anos)</th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">DI (%)</th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">NTN-B (%)</th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">Breakeven (%)</th>
              </tr>
            </thead>
            <tbody>
              {merged.map((m, i) => (
                <tr
                  key={m.prazoDu}
                  className={`border-b border-outline-variant/20 ${
                    m.prazoDu === selectedPrazoDu
                      ? "bg-primary/5 font-bold"
                      : i % 2 === 0
                      ? "bg-surface-container/40"
                      : ""
                  }`}
                >
                  <td className="px-4 py-2 font-label">{m.prazoAnos}</td>
                  <td className="px-4 py-2 text-right">{fmtPct(m.di)}</td>
                  <td className="px-4 py-2 text-right">{fmtPct(m.ntnb)}</td>
                  <td className="px-4 py-2 text-right font-headline font-bold" style={{ color: COLOR_BREAKEVEN }}>{fmtPct(m.breakeven)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Historical evolution — graceful empty state */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-headline font-bold text-sm mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">timeline</span>
          Evolução Histórica da Inflação Implícita
        </h3>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary/50">
          <p className="text-sm text-on-surface-variant">
            📊 Evolução histórica ficará disponível quando houver múltiplas datas nos datasets de
            curvas DI e NTN-B. Atualmente os dados contêm apenas uma data de referência.
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to `tab-breakeven.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/modulo-2/tab-breakeven.tsx
git commit -m "feat(mod2): add Tab 2 — Breakeven calculator (manual + preloaded modes)"
```

---

### Task 5: Wire up page shell and route

**Files:**
- Create: `src/app/modulo-2/componentes-taxa/content.tsx`
- Modify: `src/app/modulo-2/componentes-taxa/page.tsx`

- [ ] **Step 1: Create the content wrapper with tab switcher**

Create `src/app/modulo-2/componentes-taxa/content.tsx`:

```typescript
"use client";

import { useState } from "react";
import { TabAnatomiaTaxa } from "@/components/modulo-2/tab-anatomia-taxa";
import { TabBreakeven } from "@/components/modulo-2/tab-breakeven";

const TABS = [
  { label: "🔬 Anatomia da Taxa", key: "anatomia" },
  { label: "📊 Inflação Implícita (Breakeven)", key: "breakeven" },
];

export function ComponentesTaxaContent() {
  const [activeTab, setActiveTab] = useState("anatomia");

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          🧩 Componentes da Taxa de Juros
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Por que um título de 5 anos paga mais que
            um de 1 ano? De onde vem cada pedaço dessa taxa?&rdquo;
          </p>
        </div>

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

        {activeTab === "anatomia" && <TabAnatomiaTaxa />}
        {activeTab === "breakeven" && <TabBreakeven />}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Update page.tsx to import content component**

Replace `src/app/modulo-2/componentes-taxa/page.tsx` with:

```typescript
import { ComponentesTaxaContent } from "./content";

export const metadata = {
  title: "Componentes da Taxa de Juros | Laboratório de Tesouraria",
};

export default function ComponentesTaxaPage() {
  return <ComponentesTaxaContent />;
}
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Successful build with `/modulo-2/componentes-taxa` route listed

Run: `npm run lint`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add src/app/modulo-2/componentes-taxa/content.tsx src/app/modulo-2/componentes-taxa/page.tsx
git commit -m "feat(mod2): wire up Componentes da Taxa page with tab switcher"
```

---

### Task 6: Manual verification

- [ ] **Step 1: Start dev server and test Tab 1**

Run: `npm run dev`

Navigate to `http://localhost:3000/modulo-2/componentes-taxa`

Verify Tab 1 (Anatomia da Taxa):
- Concept expander opens/closes
- Number inputs change metrics reactively
- Credit/liquidity selects update waterfall
- Maturity slider changes term premium and area chart
- Waterfall chart shows 5 components + total bar
- Stacked area chart shows increasing total with maturity
- Pedagogical note is visible

- [ ] **Step 2: Test Tab 2 manual mode**

Switch to "📊 Inflação Implícita (Breakeven)" tab

In manual mode:
- Enter LTN=12.80, NTN-B=6.50, Focus=4.50
- Breakeven should show ~5,91%
- Difference should be red (>0.8pp)
- Interpretation box should say "significativamente acima"
- Change NTN-B to 8.00 → breakeven drops, difference changes color

- [ ] **Step 3: Test Tab 2 preloaded mode**

Click "Dados pré-carregados":
- Date selector shows "2026-02-18"
- Maturity selector shows available DU terms (as years)
- Bar chart appears with breakeven bars and Focus/Meta reference lines
- Data table shows DI, NTN-B, and breakeven columns
- Selected row is highlighted

- [ ] **Step 4: Test Tab 2 historical section**

Scroll to "Evolução Histórica":
- Should show graceful info message about insufficient data

- [ ] **Step 5: Test mobile responsiveness**

Resize browser to mobile width:
- Inputs stack to single column
- Charts resize properly
- Tab buttons remain tappable

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(mod2): address manual verification feedback"
```
