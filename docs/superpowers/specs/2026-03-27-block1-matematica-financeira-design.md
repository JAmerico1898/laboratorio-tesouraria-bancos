# Block 1: Matemática Financeira Aplicada — Design Spec

## Summary

Interactive content page at `/modulo-1/matematica-financeira`. Two client-side tabs with 6 interactive tools covering rate conversion, counting convention comparison, LTN bond pricing, and sensitivity analysis. First block to introduce shared financial math infrastructure, Plotly charts, KaTeX formulas, and Brazilian formatting.

## Decisions

- **Chart library:** react-plotly.js (1:1 compatibility with Python Plotly code)
- **Business days:** Pre-computed ANBIMA holiday lookup table (2015-2030) in TypeScript
- **Tab structure:** Client-side tabs on one page (no URL change)
- **LaTeX:** KaTeX via `renderToString()` in a utility component
- **Concept sections:** Collapsible accordions, starts closed
- **Shared lib:** Built from the start in `src/lib/` (finance, format, holidays, chart-config)

## New Dependencies

| Package | Purpose |
|---------|---------|
| `react-plotly.js` | React wrapper for Plotly.js charting |
| `plotly.js` | Charting engine (peer dep of react-plotly.js) |
| `katex` | LaTeX formula rendering |

## Shared Library

### `src/lib/holidays.ts`

- `ANBIMA_HOLIDAYS: Set<string>` — ISO date strings (`YYYY-MM-DD`) for all Brazilian financial holidays 2015-2030. Includes fixed holidays (Jan 1, Apr 21, May 1, Sep 7, Oct 12, Nov 2, Nov 15, Dec 25) and pre-computed moveable holidays (Carnival Mon/Tue, Good Friday, Corpus Christi).
- `diasUteis(d1: Date, d2: Date): number` — counts weekdays between d1 (exclusive) and d2 (inclusive) excluding holidays in the set.
- `diasCorridos(d1: Date, d2: Date): number` — `(d2 - d1)` in calendar days.

### `src/lib/finance.ts`

Pure functions porting the Python math with identical numerical behavior:

| Function | Signature | Formula |
|----------|-----------|---------|
| `puLtn` | `(taxaAa: number, du: number) => number` | `1000 / (1 + taxa)^(du/252)`. Returns 1000 if `du <= 0`. |
| `taxaEquivalente` | `(taxa: number, de: Base, para: Base) => number` | Converts via daily rate: `td = (1+taxa)^(1/n_de) - 1`, then `(1+td)^n_para - 1`. Bases: `anual_252` (n=252), `anual_360` (n=360), `mensal` (n=21), `diaria` (n=1). |
| `durationModificada` | `(taxa: number, du: number) => number` | `(du / 252) / (1 + taxa)` |
| `taxaForward` | `(sc: number, pc: number, sl: number, pl: number) => number` | Forward rate from two spot rates. `fc = (1+sc)^(pc/252)`, `fl = (1+sl)^(pl/252)`, `f = (fl/fc)^(252/(pl-pc)) - 1`. Returns 0 if degenerate. |

`Base` type: `"anual_252" | "anual_360" | "mensal" | "diaria"`

### `src/lib/format.ts`

Brazilian locale number formatting:

| Function | Signature | Output example |
|----------|-----------|----------------|
| `fmtBrl` | `(v: number) => string` | `R$ 1.234.567,89`. Auto-scales: `bi` for >=1e9, `mi` for >=1e6. Uses 4 decimal places for precision. Period as thousands separator, comma as decimal. |
| `fmtPct` | `(v: number, decimals?: number) => string` | `13,75%`. Default 2 decimal places, configurable. |
| `fmtNum` | `(v: number) => string` | `1.234,57`. Fixed 2 decimal places. Brazilian convention (period thousands, comma decimal). |

### `src/lib/chart-config.ts`

Shared Plotly configuration:

```typescript
PLOTLY_LAYOUT: {
  template: "plotly_white",
  font: { family: "Segoe UI, Arial, sans-serif", size: 13 },
  margin: { l: 60, r: 30, t: 50, b: 50 },
  hoverlabel: { bgcolor: "white", font_size: 12 },
}

PLOTLY_CONFIG: { displayModeBar: false }

CHART_COLORS: {
  primary: "#2E75B6",
  accent: "#C55A11",
  positive: "#2E8B57",
  negative: "#CC3333",
}
```

## Shared Components

### `src/components/plotly-chart.tsx`

Dynamic import wrapper for react-plotly.js. Uses `next/dynamic` with `ssr: false` since Plotly.js requires `window`. Accepts standard Plotly `data`, `layout`, and `config` props. Renders a loading placeholder until the library loads.

### `src/components/math.tsx`

KaTeX rendering component. Takes a `tex` string prop and renders via `katex.renderToString()` with `dangerouslySetInnerHTML`. Imports KaTeX CSS. Supports both inline and display mode.

## Page: `src/app/modulo-1/matematica-financeira/page.tsx`

Server component that exports metadata and renders a client component container.

```typescript
metadata = { title: "Matemática Financeira | Laboratório de Tesouraria" }
```

The client component (`MatematicaFinanceiraContent`) manages tab state and renders:
1. Page header: "📐 Matemática Financeira Aplicada à Tesouraria"
2. Managerial question callout: "Qual é o preço justo deste título? Qual taxa estou realmente praticando nesta operação?"
3. Tab switcher with two tabs
4. Active tab's component

## Tab 1: `src/components/modulo-1/tab-capitalizacao.tsx`

Client component. Contains:

### 1. Concept Expander (collapsible, starts closed)

Text about compound capitalization, DU/252, DC/360 conventions. KaTeX formulas:
- `VF = VP \times (1 + i)^n`
- `i_{eq} = (1 + i_{orig})^{n_{eq}/n_{orig}} - 1`
- `\text{Fator}_{DU} = (1 + i_{aa})^{DU/252}`
- `\text{Fator}_{DC} = 1 + i_{aa} \times DC/360`

### 2. Rate Converter

**Inputs (3-column layout):**
- Rate (% number input, default 13.75, step 0.25)
- Source base (dropdown: "% ao ano (252 DU)", "% ao ano (360 DC)", "% ao mês", "% ao dia (over)")
- Target base (same options + "Todas")

**Output when "Todas":**
- 4 metric cards showing each base's equivalent rate (source marked with checkmark)
- Table with Base and Taxa (%) columns

**Output when single target:**
- 2 metric cards: original rate, equivalent rate
- Step-by-step expander showing daily rate intermediate calculation

**Calculations:** `taxaEquivalente()` from `src/lib/finance.ts`

### 3. Counting Convention Comparison

**Inputs (2-column layout):**
- Principal (R$, default 1,000,000, step 100,000)
- Annual rate (%, default 13.75, step 0.25)
- Start date (date picker, default 2024-07-01)
- End date (date picker, default 2025-01-02)

**Validation:** End date must be after start date. Show warning if not.

**Output (2 columns side by side):**

| | DU/252 (composta) | DC/360 (linear) |
|---|---|---|
| Dias | `diasUteis(d1, d2)` | `diasCorridos(d1, d2)` |
| Fator | `(1+taxa)^(du/252)` | `1 + taxa * (dc/360)` |
| Valor Futuro | `principal * fator_du` | `principal * fator_dc` |

**Info box:** Difference in R$ and bps between the two methods. Scaled note: "Em uma carteira de R$ 10 bilhões, representaria R$ X."

**Calculations:** `diasUteis()`, `diasCorridos()` from `src/lib/holidays.ts`, `fmtBrl()`, `fmtNum()` from `src/lib/format.ts`

## Tab 2: `src/components/modulo-1/tab-precificacao.tsx`

Client component. Contains:

### 1. Concept Expander (collapsible, starts closed)

Text about PU (unit price), rate-price inverse relationship, duration. KaTeX formulas:
- `PU_{LTN} = \frac{1.000}{(1 + i)^{DU/252}}`
- `D^* = \frac{DU/252}{1+i}`

### 2. LTN Pricer

**Inputs:**
- Market rate (% a.a., number input, default 12.50, step 0.10)
- Maturity (DU, range slider 1-504, default 252)

**Metric cards:** PU (R$), Modified Duration (years), Maturity (years)

**Chart 1 — PU vs Rate:**
- X-axis: rates 5%-25% (100 points)
- Y-axis: PU calculated via `puLtn(rate, maturity)` for each rate
- Line trace in `#2E75B6`
- Current rate marked as orange diamond marker (`#C55A11`)
- Title: "PU da LTN vs. Taxa"

**Chart 2 — PU vs Maturity (Duration Effect):**
- X-axis: maturity 1-504 DU
- Two line traces:
  - Current rate (solid, `#2E75B6`)
  - Current rate + 2pp (dashed, `#C55A11`)
- Title: "PU vs. Prazo — Efeito Duration"
- Pedagogical info box: "A distância entre as curvas aumenta com o prazo — títulos mais longos sofrem variações de preço maiores para um mesmo choque de taxa (efeito duration)."

### 3. Sensitivity Analysis

**Inputs (2-column layout):**
- Position value (R$, default 10,000,000, step 1,000,000)
- Current rate (% a.a., default 12.50, step 0.10)
- Maturity (DU, slider 21-504, default 252)
- Rate shock (bps, slider -200 to +200, step 10, default 50)

**Metric cards:** PU before, PU after, P&L (R$, with +/- sign), Modified Duration

**Chart 3 — P&L by Shock:**
- Horizontal bar chart
- Y-axis: shocks from -200 to +200 bps in 25 bps increments (labels as "+50 bps" etc.)
- X-axis: P&L in R$
- Bar colors: green (`#2E8B57`) for positive, red (`#CC3333`) for negative
- Current shock highlighted with black border
- Title: "P&L por Choque de Taxa"
- Height: 600px

**Info box:** "Choque de +X bps → perda/ganho de R$ Y (Z%) em posição de R$ W com N DU. Aproximação por D* (V): ΔP ≈ A% vs. exato B%."

**Calculations:** `puLtn()`, `durationModificada()` from `src/lib/finance.ts`, all formatting functions from `src/lib/format.ts`

## Styling

- **Page theme:** Dark theme (same as landing page). Content sections use glass-card styling for groupings.
- **Charts:** Plotly `plotly_white` template (light chart backgrounds within dark page)
- **Inputs:** HTML inputs styled with Tailwind. Dark input backgrounds (`bg-surface-container`), light text, primary accent on focus.
- **Metric cards:** Dark background cards with label above and value below, matching the existing `glass-card` aesthetic.
- **Info boxes:** Styled callout with left border in primary color, dark background.
- **Concept expanders:** `<details>/<summary>` HTML elements styled with Tailwind.

## Responsive Behavior

- **Desktop (>=768px):** Input columns side by side (2-3 columns), charts full width
- **Mobile (<768px):** Inputs stack to single column, charts full width, tabs scroll if text overflows

## What This Design Does NOT Include

- No data fetching or CSV loading (all calculations are client-side from user inputs)
- No server-side computation
- No test framework setup (will be included in the implementation plan)
- No content from Tabs 2.1/2.2 (Mercado Monetário) or other blocks
