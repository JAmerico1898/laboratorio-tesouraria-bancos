# Block 2: Mercado Monetário e Taxas de Juros — Design Spec

## Summary

Interactive content page at `/modulo-1/mercado-monetario`. Single scrollable page (no tabs — ETTJ skipped, belongs to Module 2). Four sections: concept expander, historical SELIC/CDI panel with multi-series chart, spread analysis with statistics, and CDI accumulation calculator. First block to load CSV data from `public/data/`.

## Decisions

- **Tab 2.2 (ETTJ/DI Futures):** Skipped — belongs to Module 2 (Curva de Juros). Will be built in its own design cycle.
- **Page structure:** Single page, no tabs. All content on one scrollable view.
- **Data loading:** Client-side fetch from `/data/*.csv`, parsed with a simple string-split CSV parser. No external dependency.
- **Date inputs:** Same native HTML date inputs as Block 1.

## Shared Library

### `src/lib/csv.ts`

Generic CSV fetcher and parser:

```typescript
interface CsvRow { [key: string]: string }
async function fetchCsv(filename: string): Promise<CsvRow[]>
```

- Fetches from `/data/{filename}` using browser `fetch`
- Parses: splits by `\n`, first row as headers, returns array of `{ header: value }` objects
- No external dependency — CSVs are clean (no quoted fields, no escaping needed)

### `src/lib/data.ts`

Typed data loaders wrapping `fetchCsv`:

```typescript
interface RateDataPoint {
  data: string   // ISO date string "YYYY-MM-DD"
  valor: number  // rate as percentage (e.g., 13.75)
}

async function loadSelicMeta(): Promise<RateDataPoint[]>
async function loadSelicOver(): Promise<RateDataPoint[]>
async function loadCdiDiario(): Promise<RateDataPoint[]>
```

Each function: calls `fetchCsv`, parses `valor` to `parseFloat`, sorts by `data` ascending, returns typed array.

Also exports:

```typescript
function fatorCdiAcumulado(
  cdiSeries: RateDataPoint[],  // daily CDI rates (% a.a.)
  pctCdi: number               // percentage of CDI (e.g., 100)
): { data: string; fator: number }[]
```

Ported from Python's `fator_cdi_acumulado`: for each day, computes `((1 + cdi/100)^(1/252) - 1) * (pct/100) + 1`, then cumulative product. Returns array of `{ data, fator }` pairs.

## Page Structure

### `src/app/modulo-1/mercado-monetario/page.tsx`

Server component. Exports metadata:
```typescript
metadata = { title: "Mercado Monetário | Laboratório de Tesouraria" }
```
Renders `MercadoMonetarioContent` client component.

### `src/app/modulo-1/mercado-monetario/content.tsx`

Client component. Single scrollable page with 4 sections:

#### 1. Concept Expander (collapsible, starts closed)

Text about SELIC Meta, SELIC Over, CDI:
- SELIC Meta: taxa básica definida pelo COPOM a cada ~45 dias
- SELIC Over: taxa efetiva das compromissadas com títulos públicos
- CDI: taxa das operações interbancárias sem lastro em títulos públicos
- Relationship: SELIC Over e CDI caminham próximas (diferença < 0.10 p.p.) mas podem se descolar em momentos de estresse
- CDI é o benchmark mais utilizado para renda fixa privada no Brasil

No formulas — conceptual section only.

#### 2. Historical Panel (SELIC & CDI)

**Data loading:** On mount, loads 3 CSVs via `loadSelicMeta()`, `loadSelicOver()`, `loadCdiDiario()`. Shows "Carregando dados..." while loading. Shows info message if all CSVs fail.

**Inputs:**
- Date range: start date + end date (native date pickers). Defaults: start = max date minus ~9 years (3285 days), end = max date from data.
- Series selection: 3 checkboxes (SELIC Meta, SELIC Over, CDI), all checked by default.

**Chart 1 — Historical rates:**
- Multi-trace Plotly line chart
- X-axis: dates. Y-axis: rate (% a.a.)
- Trace colors: SELIC Meta `#1B3A5C` (solid), SELIC Over `#2E75B6` (solid), CDI `#C55A11` (dashed)
- Hover mode: `x unified`
- Title: "SELIC e CDI — Histórico"
- Data filtered by selected date range

#### 3. Spread Chart + Statistics Table

**Chart 2 — Spread (SELIC Over - CDI):**
- Merge SELIC Over and CDI by date (inner join)
- Calculate spread = selic_over - cdi
- Filled area chart: gray line (`#888888`, width 1.5), blue fill (`rgba(46,117,182,0.15)`)
- Horizontal dashed zero line
- Title: "Spread SELIC Over − CDI"
- Height: 300px
- Only shown if both SELIC Over and CDI data are available

**Statistics table:**
- For each selected series in the filtered date range
- Columns: Série, Média (%), Mín (%), Máx (%), Desvio (%)
- Values formatted to 2 decimal places
- Styled as a glass-card table

#### 4. CDI Accumulation Calculator

**Inputs (2-column layout):**
- Start date (default: max date - 180 days)
- End date (default: max date from CDI data)
- Investment amount (R$, default 1,000,000, step 100,000)
- CDI percentage (%, default 100, step 5)

**Validation:** End date must be after start date. Show warning if not, or if no CDI data for selected range.

**Metric cards (5):**
- CDI Factor 100%: `fmtNum` with 8 decimal-like precision (use `toFixed(8)`)
- CDI Factor at selected %: same format
- Return (R$): `fmtBrl(valor * (fator - 1))`
- Period rate (%): `fmtPct((fator - 1) * 100)`
- Annualized rate (%): `fmtPct(((fator)^(252/du) - 1) * 100)`

**Chart 3 — Investment evolution:**
- Line chart: X-axis dates, Y-axis value (R$)
- Trace 1: 100% CDI (solid, `#2E75B6`)
- Trace 2: selected % CDI (dashed, `#C55A11`) — only if pctCdi !== 100
- Title: "Evolução da Aplicação"
- Hover mode: `x unified`

## Styling

Same patterns as Block 1:
- Dark theme, `glass-card` for sections
- `mesh-bg` page background
- `max-w-5xl` container
- Input styling: `bg-surface-container border border-outline-variant/30 rounded-lg`
- Info boxes: `glass-card` with `border-l-4 border-primary`
- Concept expander: `<details>/<summary>` with `glass-card`

## Responsive Behavior

- **Desktop:** Inputs side by side, charts full width, metric cards in a row
- **Mobile:** Inputs stack, metric cards wrap to 2-3 per row

## What This Design Does NOT Include

- Tab 2.2 (ETTJ/DI Futures curve) — deferred to Module 2
- API calls to BCB/B3 — CSV offline data only
- Multi-select dropdown (uses checkboxes instead)
