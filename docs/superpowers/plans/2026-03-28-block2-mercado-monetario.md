# Block 2: Mercado Monetário — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Mercado Monetário page with historical SELIC/CDI panel, spread analysis, statistics, and CDI accumulation calculator — all powered by CSV data from `public/data/`.

**Architecture:** Shared CSV fetch/parse utility in `src/lib/csv.ts`. Typed data loaders + CDI accumulation function in `src/lib/data.ts`. Single client content component renders all 4 sections on one scrollable page (no tabs). Reuses existing PlotlyChart, chart-config, and format libs from Block 1.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Plotly (already installed)

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/lib/csv.ts` | Generic CSV fetcher and parser |
| Create | `src/lib/csv.test.ts` | Tests for CSV parser |
| Create | `src/lib/data.ts` | Typed data loaders (SELIC/CDI) + fatorCdiAcumulado |
| Create | `src/lib/data.test.ts` | Tests for fatorCdiAcumulado |
| Modify | `src/app/modulo-1/mercado-monetario/page.tsx` | Rewrite: from ComingSoon to server wrapper |
| Create | `src/app/modulo-1/mercado-monetario/content.tsx` | Client component: all 4 sections |

---

### Task 1: TDD — `src/lib/csv.ts`

**Files:**
- Create: `src/lib/csv.test.ts`
- Create: `src/lib/csv.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/csv.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses simple CSV text into array of objects", () => {
    const text = "data,valor\n2024-01-01,13.75\n2024-01-02,13.50";
    const result = parseCsv(text);
    expect(result).toEqual([
      { data: "2024-01-01", valor: "13.75" },
      { data: "2024-01-02", valor: "13.50" },
    ]);
  });

  it("handles trailing newline", () => {
    const text = "data,valor\n2024-01-01,13.75\n";
    const result = parseCsv(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ data: "2024-01-01", valor: "13.75" });
  });

  it("handles Windows line endings", () => {
    const text = "data,valor\r\n2024-01-01,13.75\r\n2024-01-02,13.50\r\n";
    const result = parseCsv(text);
    expect(result).toHaveLength(2);
    expect(result[0].data).toBe("2024-01-01");
  });

  it("returns empty array for header-only CSV", () => {
    const text = "data,valor\n";
    const result = parseCsv(text);
    expect(result).toEqual([]);
  });

  it("trims whitespace from values", () => {
    const text = "data, valor\n 2024-01-01 , 13.75 ";
    const result = parseCsv(text);
    expect(result[0]).toEqual({ data: "2024-01-01", valor: "13.75" });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/csv.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement csv.ts**

Create `src/lib/csv.ts`:

```typescript
/** Parse CSV text into an array of objects keyed by header names. */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

/** Fetch a CSV file from /data/ and parse it. */
export async function fetchCsv(filename: string): Promise<Record<string, string>[]> {
  const response = await fetch(`/data/${filename}`);
  if (!response.ok) return [];
  const text = await response.text();
  return parseCsv(text);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/csv.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/csv.ts src/lib/csv.test.ts
git commit -m "feat: add CSV fetch and parse utility"
```

---

### Task 2: TDD — `src/lib/data.ts`

**Files:**
- Create: `src/lib/data.test.ts`
- Create: `src/lib/data.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/data.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { fatorCdiAcumulado, type RateDataPoint } from "./data";

describe("fatorCdiAcumulado", () => {
  it("calculates accumulated factor for 100% CDI", () => {
    const series: RateDataPoint[] = [
      { data: "2024-01-02", valor: 11.65 },
      { data: "2024-01-03", valor: 11.65 },
      { data: "2024-01-04", valor: 11.65 },
    ];
    const result = fatorCdiAcumulado(series, 100);
    expect(result).toHaveLength(3);
    // Each daily factor = ((1 + 11.65/100)^(1/252) - 1) * 1 + 1
    // ≈ 1.000437 per day
    expect(result[0].fator).toBeCloseTo(1.000437, 4);
    expect(result[2].fator).toBeGreaterThan(result[1].fator);
  });

  it("scales factor by CDI percentage", () => {
    const series: RateDataPoint[] = [
      { data: "2024-01-02", valor: 11.65 },
      { data: "2024-01-03", valor: 11.65 },
    ];
    const f100 = fatorCdiAcumulado(series, 100);
    const f50 = fatorCdiAcumulado(series, 50);
    // 50% CDI should accumulate less
    expect(f50[1].fator).toBeLessThan(f100[1].fator);
    expect(f50[1].fator).toBeGreaterThan(1);
  });

  it("returns empty array for empty input", () => {
    expect(fatorCdiAcumulado([], 100)).toEqual([]);
  });

  it("preserves date strings in output", () => {
    const series: RateDataPoint[] = [
      { data: "2024-06-15", valor: 10.50 },
    ];
    const result = fatorCdiAcumulado(series, 100);
    expect(result[0].data).toBe("2024-06-15");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/data.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement data.ts**

Create `src/lib/data.ts`:

```typescript
import { fetchCsv } from "./csv";

export interface RateDataPoint {
  data: string;
  valor: number;
}

/** Parse CSV rows into typed RateDataPoint array, sorted by date. */
function toRateData(rows: Record<string, string>[]): RateDataPoint[] {
  return rows
    .map((r) => ({ data: r.data, valor: parseFloat(r.valor) }))
    .filter((r) => !isNaN(r.valor))
    .sort((a, b) => a.data.localeCompare(b.data));
}

export async function loadSelicMeta(): Promise<RateDataPoint[]> {
  return toRateData(await fetchCsv("selic_meta.csv"));
}

export async function loadSelicOver(): Promise<RateDataPoint[]> {
  return toRateData(await fetchCsv("selic_over.csv"));
}

export async function loadCdiDiario(): Promise<RateDataPoint[]> {
  return toRateData(await fetchCsv("cdi_diario.csv"));
}

/**
 * Calculate accumulated CDI factor from daily rate series.
 * Each day: daily_factor = ((1 + cdi/100)^(1/252) - 1) * (pct/100) + 1
 * Result is cumulative product of daily factors.
 */
export function fatorCdiAcumulado(
  cdiSeries: RateDataPoint[],
  pctCdi: number
): { data: string; fator: number }[] {
  if (cdiSeries.length === 0) return [];

  const result: { data: string; fator: number }[] = [];
  let cumFactor = 1;

  for (const point of cdiSeries) {
    const dailyBase = Math.pow(1 + point.valor / 100, 1 / 252) - 1;
    const dailyAdj = dailyBase * (pctCdi / 100) + 1;
    cumFactor *= dailyAdj;
    result.push({ data: point.data, fator: cumFactor });
  }

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/data.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data.ts src/lib/data.test.ts
git commit -m "feat: add typed data loaders and CDI accumulation function"
```

---

### Task 3: Build the Mercado Monetário page

**Files:**
- Modify: `src/app/modulo-1/mercado-monetario/page.tsx`
- Create: `src/app/modulo-1/mercado-monetario/content.tsx`

- [ ] **Step 1: Replace page.tsx with server wrapper**

Replace `src/app/modulo-1/mercado-monetario/page.tsx`:

```tsx
import { MercadoMonetarioContent } from "./content";

export const metadata = {
  title: "Mercado Monetário | Laboratório de Tesouraria",
};

export default function MercadoMonetarioPage() {
  return <MercadoMonetarioContent />;
}
```

- [ ] **Step 2: Create content.tsx**

Create `src/app/modulo-1/mercado-monetario/content.tsx`:

```tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { PlotlyChart } from "@/components/plotly-chart";
import { loadSelicMeta, loadSelicOver, loadCdiDiario, fatorCdiAcumulado, type RateDataPoint } from "@/lib/data";
import { fmtBrl, fmtPct, fmtNum } from "@/lib/format";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

interface SeriesState {
  selicMeta: RateDataPoint[];
  selicOver: RateDataPoint[];
  cdi: RateDataPoint[];
  loading: boolean;
}

const SERIES_CONFIG = {
  selicMeta: { label: "SELIC Meta", color: "#1B3A5C", dash: "solid" as const },
  selicOver: { label: "SELIC Over", color: "#2E75B6", dash: "solid" as const },
  cdi: { label: "CDI", color: "#C55A11", dash: "dash" as const },
} as const;

type SeriesKey = keyof typeof SERIES_CONFIG;

function getDateRange(series: SeriesState): { min: string; max: string } {
  const allDates: string[] = [];
  for (const s of [series.selicMeta, series.selicOver, series.cdi]) {
    if (s.length > 0) {
      allDates.push(s[0].data, s[s.length - 1].data);
    }
  }
  if (allDates.length === 0) return { min: "2020-01-01", max: "2025-01-01" };
  allDates.sort();
  return { min: allDates[0], max: allDates[allDates.length - 1] };
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function filterByRange(data: RateDataPoint[], start: string, end: string): RateDataPoint[] {
  return data.filter((d) => d.data >= start && d.data <= end);
}

export function MercadoMonetarioContent() {
  const [series, setSeries] = useState<SeriesState>({
    selicMeta: [], selicOver: [], cdi: [], loading: true,
  });

  // Historical panel state
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selectedSeries, setSelectedSeries] = useState<Record<SeriesKey, boolean>>({
    selicMeta: true, selicOver: true, cdi: true,
  });

  // CDI calculator state
  const [cdiStart, setCdiStart] = useState("");
  const [cdiEnd, setCdiEnd] = useState("");
  const [cdiAmount, setCdiAmount] = useState(1_000_000);
  const [cdiPct, setCdiPct] = useState(100);

  // Load data on mount
  useEffect(() => {
    async function load() {
      const [meta, over, cdi] = await Promise.all([
        loadSelicMeta(), loadSelicOver(), loadCdiDiario(),
      ]);
      setSeries({ selicMeta: meta, selicOver: over, cdi, loading: false });

      // Set default dates after data loads
      const allDates = [...meta, ...over, ...cdi].map((d) => d.data).sort();
      if (allDates.length > 0) {
        const maxDate = allDates[allDates.length - 1];
        setDateStart(subtractDays(maxDate, 3285));
        setDateEnd(maxDate);
        setCdiStart(subtractDays(maxDate, 180));
        setCdiEnd(maxDate);
      }
    }
    load();
  }, []);

  const dateRange = getDateRange(series);

  // Historical chart data
  const historicalTraces = useMemo(() => {
    const traces: Plotly.Data[] = [];
    for (const key of Object.keys(SERIES_CONFIG) as SeriesKey[]) {
      if (!selectedSeries[key]) continue;
      const data = filterByRange(series[key], dateStart, dateEnd);
      if (data.length === 0) continue;
      traces.push({
        x: data.map((d) => d.data),
        y: data.map((d) => d.valor),
        mode: "lines",
        name: SERIES_CONFIG[key].label,
        line: { color: SERIES_CONFIG[key].color, width: 2, dash: SERIES_CONFIG[key].dash },
      });
    }
    return traces;
  }, [series, dateStart, dateEnd, selectedSeries]);

  // Spread data
  const spreadData = useMemo(() => {
    const overFiltered = filterByRange(series.selicOver, dateStart, dateEnd);
    const cdiFiltered = filterByRange(series.cdi, dateStart, dateEnd);
    if (overFiltered.length === 0 || cdiFiltered.length === 0) return null;

    const cdiMap = new Map(cdiFiltered.map((d) => [d.data, d.valor]));
    const merged: { data: string; spread: number }[] = [];
    for (const o of overFiltered) {
      const cdiVal = cdiMap.get(o.data);
      if (cdiVal !== undefined) {
        merged.push({ data: o.data, spread: o.valor - cdiVal });
      }
    }
    return merged;
  }, [series.selicOver, series.cdi, dateStart, dateEnd]);

  // Statistics
  const stats = useMemo(() => {
    const result: { serie: string; media: number; min: number; max: number; desvio: number }[] = [];
    for (const key of Object.keys(SERIES_CONFIG) as SeriesKey[]) {
      if (!selectedSeries[key]) continue;
      const data = filterByRange(series[key], dateStart, dateEnd);
      if (data.length === 0) continue;
      const vals = data.map((d) => d.valor);
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
      result.push({
        serie: SERIES_CONFIG[key].label,
        media: mean,
        min: Math.min(...vals),
        max: Math.max(...vals),
        desvio: std,
      });
    }
    return result;
  }, [series, dateStart, dateEnd, selectedSeries]);

  // CDI calculator
  const cdiCalc = useMemo(() => {
    if (!cdiStart || !cdiEnd || cdiEnd <= cdiStart) return null;
    const filtered = filterByRange(series.cdi, cdiStart, cdiEnd);
    if (filtered.length === 0) return null;

    const f100 = fatorCdiAcumulado(filtered, 100);
    const fPct = fatorCdiAcumulado(filtered, cdiPct);
    const ft100 = f100[f100.length - 1].fator;
    const ftPct = fPct[fPct.length - 1].fator;
    const rend = cdiAmount * (ftPct - 1);
    const txPer = (ftPct - 1) * 100;
    const du = filtered.length;
    const txAa = du > 0 ? (Math.pow(ftPct, 252 / du) - 1) * 100 : 0;

    return { f100, fPct, ft100, ftPct, rend, txPer, txAa, du };
  }, [series.cdi, cdiStart, cdiEnd, cdiAmount, cdiPct]);

  if (series.loading) {
    return (
      <main className="mesh-bg pt-8 pb-20">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-center min-h-[50vh]">
          <p className="text-on-surface-variant">Carregando dados...</p>
        </div>
      </main>
    );
  }

  const hasData = series.selicMeta.length > 0 || series.selicOver.length > 0 || series.cdi.length > 0;

  return (
    <main className="mesh-bg pt-8 pb-20">
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
            💰 Mercado Monetário e Principais Taxas de Juros
          </h1>
          <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
            <p className="text-on-surface-variant text-sm">
              <strong>Pergunta gerencial:</strong> &ldquo;Qual benchmark devo usar nesta operação?
              Como se comparam as taxas que pratico com as referências do mercado?&rdquo;
            </p>
          </div>
        </div>

        {/* Concept Expander */}
        <details className="glass-card rounded-xl">
          <summary className="cursor-pointer px-6 py-4 font-headline font-bold text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">menu_book</span>
            Conceito — SELIC, CDI e Mercado Interbancário
          </summary>
          <div className="px-6 pb-6 text-on-surface-variant text-sm leading-relaxed space-y-3">
            <p>
              <strong>SELIC Meta:</strong> taxa básica definida pelo COPOM a cada ~45 dias.
            </p>
            <p>
              <strong>SELIC Over:</strong> taxa efetiva das compromissadas com títulos públicos no SELIC.
            </p>
            <p>
              <strong>CDI:</strong> taxa das operações interbancárias sem lastro em títulos públicos.
              SELIC Over e CDI caminham muito próximas (diferença &lt; 0,10 p.p.), mas podem se
              descolar em momentos de estresse. O CDI é o benchmark mais utilizado para renda fixa
              privada no Brasil.
            </p>
          </div>
        </details>

        {!hasData ? (
          <div className="glass-card rounded-lg p-4 border-l-4 border-tertiary text-sm text-on-surface-variant">
            Nenhum dado encontrado. Verifique se os arquivos CSV estão em <code>/public/data/</code>.
          </div>
        ) : (
          <>
            {/* Historical Panel */}
            <section>
              <h3 className="font-headline font-bold text-lg mb-4">Painel Histórico SELIC e CDI</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-on-surface-variant text-xs font-label mb-1">Data início</label>
                    <input
                      type="date"
                      value={dateStart}
                      min={dateRange.min}
                      max={dateRange.max}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant text-xs font-label mb-1">Data fim</label>
                    <input
                      type="date"
                      value={dateEnd}
                      min={dateRange.min}
                      max={dateRange.max}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-on-surface-variant text-xs font-label mb-1">Séries</label>
                  <div className="flex gap-4 pt-1">
                    {(Object.keys(SERIES_CONFIG) as SeriesKey[]).map((key) => (
                      <label key={key} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSeries[key]}
                          onChange={(e) =>
                            setSelectedSeries((prev) => ({ ...prev, [key]: e.target.checked }))
                          }
                          className="accent-primary"
                        />
                        {SERIES_CONFIG[key].label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {historicalTraces.length > 0 && (
                <PlotlyChart
                  data={historicalTraces}
                  layout={{
                    ...PLOTLY_LAYOUT,
                    title: "SELIC e CDI — Histórico",
                    xaxis: { ...PLOTLY_LAYOUT.xaxis, title: "Data" },
                    yaxis: { ...PLOTLY_LAYOUT.yaxis, title: "Taxa (% a.a.)" },
                    hovermode: "x unified",
                  }}
                  config={PLOTLY_CONFIG}
                  className="h-[450px]"
                />
              )}
            </section>

            {/* Spread + Statistics */}
            <section>
              {spreadData && spreadData.length > 0 && (
                <PlotlyChart
                  data={[
                    {
                      x: spreadData.map((d) => d.data),
                      y: spreadData.map((d) => d.spread),
                      mode: "lines",
                      name: "Spread",
                      line: { color: "#888888", width: 1.5 },
                      fill: "tozeroy",
                      fillcolor: "rgba(46,117,182,0.15)",
                    },
                  ]}
                  layout={{
                    ...PLOTLY_LAYOUT,
                    title: "Spread SELIC Over − CDI",
                    xaxis: { ...PLOTLY_LAYOUT.xaxis, title: "Data" },
                    yaxis: { ...PLOTLY_LAYOUT.yaxis, title: "Spread (p.p.)" },
                    height: 300,
                    shapes: [
                      { type: "line", x0: 0, x1: 1, xref: "paper", y0: 0, y1: 0, line: { dash: "dash", color: "gray" } },
                    ],
                  }}
                  config={PLOTLY_CONFIG}
                  className="h-[300px] mb-6"
                />
              )}

              {stats.length > 0 && (
                <>
                  <h4 className="font-headline font-bold text-base mb-3">Estatísticas do Período</h4>
                  <div className="glass-card rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-outline-variant/20">
                          <th className="text-left px-4 py-2 font-label text-on-surface-variant text-xs">Série</th>
                          <th className="text-right px-4 py-2 font-label text-on-surface-variant text-xs">Média (%)</th>
                          <th className="text-right px-4 py-2 font-label text-on-surface-variant text-xs">Mín (%)</th>
                          <th className="text-right px-4 py-2 font-label text-on-surface-variant text-xs">Máx (%)</th>
                          <th className="text-right px-4 py-2 font-label text-on-surface-variant text-xs">Desvio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map((s) => (
                          <tr key={s.serie} className="border-b border-outline-variant/10">
                            <td className="px-4 py-2">{s.serie}</td>
                            <td className="px-4 py-2 text-right font-mono">{s.media.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-mono">{s.min.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-mono">{s.max.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-mono">{s.desvio.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            {/* CDI Calculator */}
            <section>
              <h3 className="font-headline font-bold text-lg mb-4">Calculadora de CDI Acumulado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <label className="block text-on-surface-variant text-xs font-label mb-1">Data início</label>
                    <input
                      type="date"
                      value={cdiStart}
                      onChange={(e) => setCdiStart(e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant text-xs font-label mb-1">Valor aplicado (R$)</label>
                    <input
                      type="number"
                      value={cdiAmount}
                      onChange={(e) => setCdiAmount(parseFloat(e.target.value) || 0)}
                      step={100000}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-on-surface-variant text-xs font-label mb-1">Data fim</label>
                    <input
                      type="date"
                      value={cdiEnd}
                      onChange={(e) => setCdiEnd(e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant text-xs font-label mb-1">% do CDI</label>
                    <input
                      type="number"
                      value={cdiPct}
                      onChange={(e) => setCdiPct(parseFloat(e.target.value) || 0)}
                      step={5}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {!cdiCalc ? (
                <div className="glass-card rounded-lg p-4 border-l-4 border-tertiary text-sm text-on-surface-variant">
                  {cdiEnd <= cdiStart
                    ? "A data de fim deve ser posterior à data de início."
                    : "Sem dados de CDI para o período selecionado."}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <div className="glass-card rounded-lg p-4">
                      <div className="text-on-surface-variant text-xs font-label mb-1">Fator CDI 100%</div>
                      <div className="font-headline font-bold text-sm">{cdiCalc.ft100.toFixed(8).replace(".", ",")}</div>
                    </div>
                    <div className="glass-card rounded-lg p-4">
                      <div className="text-on-surface-variant text-xs font-label mb-1">Fator {fmtPct(cdiPct, 0)} CDI</div>
                      <div className="font-headline font-bold text-sm">{cdiCalc.ftPct.toFixed(8).replace(".", ",")}</div>
                    </div>
                    <div className="glass-card rounded-lg p-4">
                      <div className="text-on-surface-variant text-xs font-label mb-1">Rendimento</div>
                      <div className="font-headline font-bold text-sm">{fmtBrl(cdiCalc.rend)}</div>
                    </div>
                    <div className="glass-card rounded-lg p-4">
                      <div className="text-on-surface-variant text-xs font-label mb-1">Taxa período</div>
                      <div className="font-headline font-bold text-sm">{fmtPct(cdiCalc.txPer)}</div>
                    </div>
                    <div className="glass-card rounded-lg p-4">
                      <div className="text-on-surface-variant text-xs font-label mb-1">Taxa a.a.</div>
                      <div className="font-headline font-bold text-sm">{fmtPct(cdiCalc.txAa)}</div>
                    </div>
                  </div>

                  <PlotlyChart
                    data={[
                      {
                        x: cdiCalc.f100.map((d) => d.data),
                        y: cdiCalc.f100.map((d) => cdiAmount * d.fator),
                        mode: "lines",
                        name: "100% CDI",
                        line: { color: "#2E75B6", width: 2 },
                      },
                      ...(cdiPct !== 100
                        ? [
                            {
                              x: cdiCalc.fPct.map((d) => d.data),
                              y: cdiCalc.fPct.map((d) => cdiAmount * d.fator),
                              mode: "lines" as const,
                              name: `${fmtPct(cdiPct, 0)} CDI`,
                              line: { color: "#C55A11", width: 2, dash: "dash" as const },
                            },
                          ]
                        : []),
                    ]}
                    layout={{
                      ...PLOTLY_LAYOUT,
                      title: "Evolução da Aplicação",
                      xaxis: { ...PLOTLY_LAYOUT.xaxis, title: "Data" },
                      yaxis: { ...PLOTLY_LAYOUT.yaxis, title: "Valor (R$)" },
                      hovermode: "x unified",
                    }}
                    config={PLOTLY_CONFIG}
                    className="h-[400px]"
                  />
                </>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/modulo-1/mercado-monetario/page.tsx src/app/modulo-1/mercado-monetario/content.tsx
git commit -m "feat: build Mercado Monetário page with historical panel, spread, and CDI calculator"
```

---

### Task 4: Build verification

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass (format, holidays, finance, csv, data).

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds. Route `/modulo-1/mercado-monetario` renders.

- [ ] **Step 4: Visual verification**

Run: `npm run dev`

Check at `http://localhost:3000/modulo-1/mercado-monetario`:
1. Data loads — "Carregando dados..." disappears, charts appear
2. Concept expander opens/closes
3. Historical chart shows 3 series (SELIC Meta, SELIC Over, CDI)
4. Date range changes filter the charts
5. Checkboxes toggle series visibility
6. Spread chart shows below historical chart
7. Statistics table shows mean, min, max, std dev
8. CDI calculator computes correct metrics and shows evolution chart
9. Changing CDI % to non-100 shows second dashed line
10. Module tab bar highlights "Mercado Monetário"
