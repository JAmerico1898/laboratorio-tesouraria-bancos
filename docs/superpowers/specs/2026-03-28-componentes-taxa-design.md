# Componentes da Taxa de Juros — Design Spec

## Context

Tópico 1 of Módulo 2 (Curva de Juros / ETTJ). Two interactive tabs teaching rate decomposition and breakeven inflation — foundational concepts before students work with the full yield curve.

**Route:** `/modulo-2/componentes-taxa`
**Source spec:** `spec/spec_app_modulo2_ettj.md` (section `<pagina id="mod1">`)
**Python reference:** `code/module_02_ettj_brasil.py` lines 596–830

## Tab 1: Anatomia da Taxa de Juros

### Concept Block (collapsible `<details>`)

LaTeX equation rendered via `<Math>`:

```
i_{nominal} = i_{real} + \pi^e + \phi_{crédito} + \phi_{liquidez} + \phi_{prazo}
```

Five components explained in managerial language: real risk-free rate, inflation expectations, credit premium, liquidity premium, term premium.

### Interactive Decomposition Simulator

**Inputs (2-column grid):**

| Input | Type | Default | Step | Range |
|-------|------|---------|------|-------|
| Taxa real livre de risco (% a.a.) | number | 5.00 | 0.25 | — |
| Expectativa de inflação — IPCA (% a.a.) | number | 4.50 | 0.25 | — |
| Risco de crédito | select | Soberano | — | Soberano(0), AAA(45), AA(90), A(160), BBB(275) bps |
| Liquidez do instrumento | select | Alta | — | Alta(5), Média(40), Baixa(105) bps |
| Prazo do instrumento (anos) | slider | 3.0 | 0.25 | 0.25–10 |

Left column: base components (real rate, inflation).
Right column: premiums (credit, liquidity, maturity slider).

**Term premium formula:** `φ_prazo = (α / 100) × ln(1 + prazo)` where α = 30 bps.

Credit and liquidity use midpoint of range in bps, divided by 100 to convert to pp.

**Outputs:**

1. **3 metric cards:** Total nominal rate (% a.a.), spread over risk-free (bps), term premium at selected maturity (% a.a.)

2. **Waterfall chart (Plotly):** Horizontal bars showing cumulative rate construction.
   - Components: Taxa Real (#1B3A5C), Inflação (#8B5CF6), Crédito (#C55A11), Liquidez (#D4A012), Prazo (#888888)
   - Final "Total" bar with border highlight
   - measure: `["relative", "relative", "relative", "relative", "relative", "total"]`
   - Text labels outside bars showing `fmtPct(value)`

3. **Stacked area chart (Plotly):** Rate composition across maturities (0.25–10Y, step 0.25Y).
   - Real rate, inflation, credit, liquidity are flat lines (constant across maturities)
   - Term premium increases with maturity (log curve)
   - Same color mapping as waterfall
   - `stackgroup: "one"`, `hovermode: "x unified"`

4. **Pedagogical note:** Info box: "Na prática, os componentes não são diretamente observáveis — o mercado negocia a taxa total. Decompor é um exercício analítico que ajuda o gestor a avaliar se a taxa oferecida compensa adequadamente cada fonte de risco."

## Tab 2: Inflação Implícita (Breakeven)

### Concept Block (collapsible `<details>`)

Two LaTeX equations:
```
(1 + i_{nominal}) = (1 + i_{real}) \times (1 + \pi^{implícita})
```
```
\pi^{implícita} = \frac{1 + i_{LTN}}{1 + i_{NTN\text{-}B}} - 1
```

Key point: breakeven ≠ pure inflation expectation — includes inflation risk premium.

### Breakeven Calculator

**Mode toggle:** Two buttons (styled like tab-cenarios.tsx scenario toggle) switching between "Dados pré-carregados" and "Inserir manualmente".

**Manual mode inputs (3-column):**

| Input | Default | Step |
|-------|---------|------|
| Taxa LTN — prefixado (% a.a.) | 12.80 | 0.05 |
| Taxa NTN-B — IPCA+ (% a.a.) | 6.50 | 0.05 |
| Expectativa Focus — IPCA (% a.a.) | 4.50 | 0.10 |

**Preloaded mode inputs (2-column):**

| Input | Source |
|-------|--------|
| Data de referência | Unique dates from curvas_di.csv (currently: 2026-02-18) |
| Prazo | Matched maturities between curvas_di and ntnb_taxas (in DU, displayed as years) |

Data merging: join `curvas_di` and `ntnb_taxas` on `prazo_du` for the selected date. Compute breakeven for each matched maturity using `calcularBreakeven()`. Focus value loaded from `focus_ipca.csv` (latest IPCA_12m mediana for the selected date).

**Outputs:**

1. **3 metric cards:**
   - Breakeven (% a.a.) — colored #8B5CF6
   - Focus IPCA (% a.a.)
   - Difference (pp) — color-coded: green < 0.3pp, yellow 0.3–0.8pp, red > 0.8pp

2. **Interpretation box:** Auto-generated text based on difference thresholds:
   - |diff| < 0.3: success (green) — "alinhada com consenso"
   - diff > 0.8: error (red) — "prêmio de risco inflacionário elevado"
   - 0 < diff ≤ 0.8: warning (yellow) — "possível prêmio de risco"
   - diff < 0: info (blue) — "demanda por proteção inflacionária"
   - Always includes treasury implication text

3. **Bar chart by maturity (Plotly, preloaded mode only):**
   - Breakeven bars (#8B5CF6) for each available maturity
   - Horizontal reference lines: Focus (dashed gray), Meta 3.0% (dotted gray)
   - X-axis: maturity in years, Y-axis: % a.a.

4. **Data table (preloaded mode only):** Columns: Prazo (anos) | DI (%) | NTN-B (%) | Breakeven (%)

### Historical Breakeven Evolution

**Graceful empty state:** Since curvas_di.csv and ntnb_taxas.csv have only 1 date, display an info card:
> "📊 Evolução histórica ficará disponível quando houver múltiplas datas nos datasets de curvas DI e NTN-B."

**When data is available** (future): maturity selector + date range picker, line chart with breakeven (#8B5CF6), IPCA 12M (#C55A11), and inflation target (dashed gray) with tolerance band shading.

## File Architecture

### New files

| File | Type | Description |
|------|------|-------------|
| `src/components/modulo-2/tab-anatomia-taxa.tsx` | Client component | Tab 1 — decomposition simulator |
| `src/components/modulo-2/tab-breakeven.tsx` | Client component | Tab 2 — breakeven calculator |
| `src/app/modulo-2/componentes-taxa/content.tsx` | Client component | Page shell: question banner + tab switcher wrapping both tabs |

### Modified files

| File | Changes |
|------|---------|
| `src/lib/finance.ts` | Add `calcularBreakeven(taxaNominal, taxaReal)` and `premioPrazo(prazoAnos, alphaBps?)`. Add module-2 constants: `SPREADS_CREDITO_MOD2` and `PREMIO_LIQUIDEZ_MOD2` with spec values including Soberano |
| `src/lib/data.ts` | Add `loadCurvasDi()`, `loadNtnbTaxas()`, `loadFocusIpca()` loaders |
| `src/app/modulo-2/componentes-taxa/page.tsx` | Replace ComingSoon with metadata + content import |

### Reused (no changes)

- `PlotlyChart` — chart rendering
- `Math` (KMath) — LaTeX formulas
- `PLOTLY_LAYOUT`, `PLOTLY_CONFIG`, `CHART_COLORS` from chart-config.ts
- `fmtPct`, `fmtNum` from format.ts

## New Finance Functions

```typescript
// Fisher-based breakeven inflation
// Inputs in decimal (e.g., 0.128 for 12.8%)
// Returns decimal (e.g., 0.0591 for 5.91%)
function calcularBreakeven(taxaNominal: number, taxaReal: number): number {
  if (1 + taxaReal === 0) return 0;
  return (1 + taxaNominal) / (1 + taxaReal) - 1;
}

// Term premium: α × ln(1 + prazo)
// Returns in percentage points (e.g., 0.42 for 0.42%)
function premioPrazo(prazoAnos: number, alphaBps: number = 30): number {
  return (alphaBps / 100) * Math.log(1 + prazoAnos);
}
```

## New Data Loaders

```typescript
interface CurvaDiPoint { data: string; prazoDu: number; taxa: number }
interface NtnbTaxaPoint { data: string; prazoDu: number; taxa: number }
interface FocusIpcaPoint { dataColeta: string; variavel: string; mediana: number }

function loadCurvasDi(): Promise<CurvaDiPoint[]>    // curvas_di.csv
function loadNtnbTaxas(): Promise<NtnbTaxaPoint[]>   // ntnb_taxas.csv
function loadFocusIpca(): Promise<FocusIpcaPoint[]>   // focus_ipca.csv
```

## Module-2 Specific Constants

```typescript
const SPREADS_CREDITO_MOD2: Record<string, number> = {
  "Soberano (0 bps)": 0,
  "AAA (30–60 bps)": 45,
  "AA (60–120 bps)": 90,
  "A (120–200 bps)": 160,
  "BBB (200–350 bps)": 275,
};

const PREMIO_LIQUIDEZ_MOD2: Record<string, number> = {
  "Alta — DI/Títulos Públicos (0–10 bps)": 5,
  "Média — Debêntures IG (20–60 bps)": 40,
  "Baixa — Crédito ilíquido (60–150 bps)": 105,
};
```

These differ from módulo 1's `SPREADS_CREDITO` (which uses [min, max] tuples and different ratings). Define in `finance.ts` alongside existing constants.

## Chart Color Mapping

| Component | Hex | Usage |
|-----------|-----|-------|
| Taxa real | #1B3A5C | Waterfall + area — dark blue |
| Inflação esperada | #8B5CF6 | Waterfall + area + breakeven bars — purple |
| Prêmio crédito | #C55A11 | Waterfall + area — orange |
| Prêmio liquidez | #D4A012 | Waterfall + area — yellow |
| Prêmio prazo | #888888 | Waterfall + area — gray |
| Total bar | #2E75B6 | Waterfall total — blue with border |
| IPCA 12M historical | #C55A11 | Historical chart — orange |
| Focus / Meta reference | #888888 | Dashed/dotted reference lines |

## Verification

1. `npm run build` — no compilation errors
2. `npm run lint` — no new lint errors
3. Navigate to `/modulo-2/componentes-taxa`:
   - Tab 1: adjust inputs → metrics/charts update reactively
   - Tab 1: waterfall shows correct cumulative bars
   - Tab 1: area chart shows increasing total with maturity
   - Tab 2 manual: enter rates → breakeven computed, interpretation shown
   - Tab 2 preloaded: select date → bar chart shows breakeven by maturity
   - Tab 2 historical: shows graceful empty state message
   - Mobile: inputs stack to 1 column, charts resize
