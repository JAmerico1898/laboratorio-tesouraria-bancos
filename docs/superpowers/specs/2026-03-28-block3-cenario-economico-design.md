# Block 3: Cenário Econômico e Taxa de Juros — Design Spec & Plan

## Summary

Interactive content page at `/modulo-1/cenario-economico`. Two client-side tabs: (1) Macro indicators dashboard with 4 key metrics, 4 mini charts, and Focus expectations panel; (2) Scenario builder with side-by-side scenario comparison, pressure calculation, gauge charts, and curve implication. Extends the shared CSV/data layer with new loaders and pure calculation functions.

## Decisions

- **Page structure:** Client-side tabs (2 tabs — dashboard vs. simulation serve different purposes)
- **Period selector:** Quick toggle buttons (1A, 3A, 5A, 9A) for mini charts
- **Pressure visualization:** Plotly gauge/indicator charts (-400 to +400 bps)
- **Data loading:** Client-side CSV fetch, extending existing csv.ts and data.ts

## Data Layer Extensions

### `src/lib/csv.ts` — extend `parseCsv`

Add optional `separator` parameter (default `","`). This handles `cds_brasil.csv` which uses semicolons. Also strip BOM character from the first line.

### `src/lib/data.ts` — new loaders and functions

**New loaders:**
- `loadIpca(): Promise<RateDataPoint[]>` — loads `ipca_mensal.csv`
- `loadCambio(): Promise<RateDataPoint[]>` — loads `cambio_usd.csv`
- `loadCds(): Promise<RateDataPoint[]>` — loads `cds_brasil.csv` (semicolon sep, US date format MM/DD/YYYY, BOM)
- `loadFocus(): Promise<FocusDataPoint[]>` — loads `focus_expectativas.csv`, type `{ dataColeta: string; variavel: string; mediana: number }`

**New pure functions:**
- `calcIpca12m(monthly: RateDataPoint[]): RateDataPoint[]` — 12-month rolling product: `fator = 1 + valor/100`, rolling window 12, `resultado = (product - 1) * 100`
- `calcPressao(ipca, pib, cambio, fiscal, fed): { total: number; detail: Record<string, number> }` — scenario pressure calculation using constants: META_INFLACAO=3.0, PIB_POTENCIAL=2.5, and CENARIO_DELTAS from Python code

**Scenario constants (exported):**
```typescript
CENARIO_DELTAS = {
  ipca_pp: 75, pib_pp: 50,
  cambio: { "Estável": 0, "Depreciação moderada": 50, "Depreciação forte": 100, "Apreciação moderada": -25 },
  fiscal: { "Neutro": 0, "Expansionista": 75, "Contracionista": -50 },
  fed: { "Manutenção": 0, "Alta de juros": 50, "Corte de juros": -25 },
}
META_INFLACAO = 3.0
PIB_POTENCIAL = 2.5
```

## Tab 1: `src/components/modulo-1/tab-painel-macro.tsx`

Client component. Loads SELIC Meta, IPCA, Câmbio, CDS, and Focus CSVs on mount.

### Section 1: Key Indicators (4 metric cards)
- SELIC Meta (% a.a.), IPCA 12M (% a.a.), Câmbio R$/USD, CDS (bps)
- Each shows latest value + delta from previous observation
- Loading state while CSVs load

### Section 2: Period Selector
- 4 toggle buttons: 1A (365d), 3A (1095d), 5A (1825d), 9A (3285d)
- Default: 9A
- Filters mini charts below

### Section 3: Mini Charts (2×2 grid)
- IPCA 12M: line chart with 3% inflation target dashed line, color `#C55A11`
- Câmbio R$/USD: line chart, color `#2E75B6`
- CDS Brasil: line chart, color `#CC3333`
- SELIC Meta: line chart, color `#1B3A5C` (use lighter `#5B8AB5` for visibility)
- Each chart: 300px height, filtered by period, no legend

### Section 4: Focus Expectations
- Variable dropdown: IPCA corrente/seguinte, SELIC corrente/seguinte, PIB corrente, Câmbio corrente
- Observation period slider: 3-24 months, default 12
- Line chart: median expectations over time

## Tab 2: `src/components/modulo-1/tab-cenarios.tsx`

Client component. No data loading (pure calculation from user inputs).

### Section 1: Current SELIC input
- Number input, default 14.25, step 0.25

### Section 2: Side-by-side scenarios (Base + Alternativo)
Each column has 5 inputs:
- IPCA esperado 12M (%, default 4.5, step 0.5)
- Crescimento PIB (%, default 2.0, step 0.5)
- Câmbio (dropdown: Estável, Depreciação moderada, Depreciação forte, Apreciação moderada)
- Fiscal (dropdown: Neutro, Expansionista, Contracionista)
- Externo/FED (dropdown: Manutenção, Alta de juros, Corte de juros)

### Section 3: Comparison table
- Rows: Inflação (IPCA), Atividade (PIB), Câmbio, Fiscal, Externo (FED), **TOTAL**
- Columns: Factor, Base (bps), Alternativo (bps)
- Values formatted as +/- bps

### Section 4: SELIC projection metrics
- Two cards: SELIC proj. Base, SELIC proj. Alternativo
- Value = current SELIC + pressure/100

### Section 5: Gauge charts (side by side)
- Plotly `go.Indicator` with `mode: "gauge+number"`
- Range: -400 to +400 bps
- Steps: [-400,-100] green 20%, [-100,100] gray 20%, [100,400] red 20%
- Bar color based on pressure level:
  - >100 bps: red (#CC3333) "Forte pressão de alta"
  - >25 bps: orange (#C55A11) "Pressão de alta"
  - -25 to 25: gray (#888888) "Neutro"
  - <-25: green-ish (#2E75B6) "Pressão de queda"
  - <-100: green (#2E8B57) "Forte pressão de queda"
- Height: 280px

### Section 6: Curve implication
- Two info boxes describing curve shape based on pressure:
  - >75 bps: "Normal (positivamente inclinada) — mercado espera mais altas"
  - <-75 bps: "Invertida — mercado espera cortes significativos"
  - else: "Relativamente flat — expectativa de estabilidade"

### Section 7: Disclaimer
- Info box: "Este modelo é uma simplificação didática..."

## Page Files

### `src/app/modulo-1/cenario-economico/page.tsx`
Server component. Metadata: `"Cenário Econômico | Laboratório de Tesouraria"`. Renders client content.

### `src/app/modulo-1/cenario-economico/content.tsx`
Client component. Tab container with tabs "📊 Painel Macroeconômico" | "🔮 Simulador de Cenários". Uses `pt-16` for tab bar clearance.

## File Map

```
Modified:
  src/lib/csv.ts           ← Add separator param + BOM stripping
  src/lib/csv.test.ts      ← Add semicolon/BOM tests
  src/lib/data.ts          ← Add 4 loaders + calcIpca12m + calcPressao + constants
  src/lib/data.test.ts     ← Add tests for calcIpca12m, calcPressao

Created:
  src/components/modulo-1/tab-painel-macro.tsx
  src/components/modulo-1/tab-cenarios.tsx
  src/app/modulo-1/cenario-economico/page.tsx (rewrite)
  src/app/modulo-1/cenario-economico/content.tsx
```

## Styling
Same patterns as Blocks 1-2: dark theme, glass-card, mesh-bg, max-w-5xl, consistent input styling. Period buttons styled as toggle group with primary highlight on active.

## What This Design Does NOT Include
- API calls to BCB/B3 — CSV offline data only
- Econometric models — simplified didactic pressure model only
- COPOM decision markers on charts (mentioned in spec but not in Python code for this block)
