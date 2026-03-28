# Block 4: Risco Financeiro e Taxa de Juros — Design Spec

## Summary

Interactive content page at `/modulo-1/risco-financeiro`. Two client-side tabs: (1) Rate decomposition with waterfall chart; (2) MtM simulator with accrual vs market-value curves. Pure client-side calculations — no CSV data loading.

## Decisions

- **Page structure:** Client-side tabs (2 tabs)
- **Before/after comparison:** Skipped (relies on session state, waterfall already clear)
- **Area fill:** Simplified two-trace fill instead of segment-by-segment (performance)

## Data Layer

Add to `src/lib/finance.ts`:

```typescript
export const SPREADS_CREDITO: Record<string, [number, number]> = {
  "AAA": [30, 60], "AA": [60, 120], "A": [120, 200], "BBB": [150, 250],
  "BB": [250, 400], "B": [400, 700], "CCC": [700, 1200],
};

export const PREMIO_LIQUIDEZ: Record<string, [number, number]> = {
  "Alta (títulos públicos, DI)": [0, 10],
  "Média (debêntures investment grade)": [15, 40],
  "Baixa (crédito privado ilíquido)": [50, 120],
};
```

No new functions — `puLtn` already available.

## Tab 1: `src/components/modulo-1/tab-decomposicao.tsx`

Client component.

### Concept Expander
- Formula: `i_operação = i_livre_de_risco + spread_crédito + prêmio_liquidez + prêmio_prazo`
- Definitions of each component

### Inputs (2-column layout)
- Operation rate (% a.a., default 15.50, step 0.10)
- Risk-free rate / SELIC (% a.a., default from CSV via loadSelicMeta, fallback 14.25)
- Rating dropdown (AAA through CCC)
- Liquidity dropdown (Alta, Média, Baixa)
- Maturity slider (0.5-10 years, step 0.5, default 3.0)

### Calculation
- Credit spread = mean of SPREADS_CREDITO[rating] range / 100 (bps → pp)
- Liquidity premium = mean of PREMIO_LIQUIDEZ[liquidity] range / 100
- Term premium = (operation rate - risk-free rate) - credit spread - liquidity premium
- Warning if term premium < 0

### Waterfall Chart
- Plotly waterfall: 4 relative bars (risk-free, credit, liquidity, term) + 1 total
- Increasing: green (`#2E8B57`), Decreasing: red (`#CC3333`), Total: blue (`#2E75B6`)
- Text labels: `fmtPct(value)`, position outside
- Connector: gray dotted line
- Height: 450px

### Detail Table
| Componente | Valor (% a.a.) | Faixa indicativa |
|---|---|---|
| Taxa Livre de Risco | value | — |
| Spread de Crédito | value | X-Y bps |
| Prêmio de Liquidez | value | X-Y bps |
| Prêmio de Prazo | value | Residual |

### Pedagogical Info Box
"Quando um gestor avalia uma operação, precisa entender se o spread compensa cada fonte de risco..."

## Tab 2: `src/components/modulo-1/tab-mtm.tsx`

Client component.

### Concept Expander
- MtM definition, accrual vs market value, BCB/ANBIMA regulation
- Temporary vs materialized loss

### Inputs (2-column layout)
- Purchase value (R$, default 10,000,000, step 1,000,000)
- Purchase rate (% a.a., default 12.00, step 0.10)
- Total maturity (DU, slider 63-504, default 252)
- Rate trajectory (dropdown):
  - "Estável (taxa constante)"
  - "Alta gradual (+bps em 6M)"
  - "Queda gradual (-bps em 6M)"
  - "Choque de alta (+bps no dia 30)"
  - "Choque de queda (-bps no dia 30)"
- Magnitude (bps, slider 50-400, step 25, default 200 for gradual / 150 for shock)

### Calculation (for each day 0 to maturity)
- Rate trajectory logic:
  - Stable: constant purchase rate
  - Gradual up/down: linear progress over 126 DU (6 months), ± magnitude
  - Shock up/down: constant until day 30, then jumps ± magnitude
- Accrual: `qty * puLtn(purchaseRate, remainingDU)` — grows smoothly to face value
- MtM: `qty * puLtn(marketRate[day], remainingDU)` — volatile
- Quantity = purchaseValue / puLtn(purchaseRate, totalMaturity)

### Chart — Accrual vs MtM
- Two main lines: accrual (blue `#2E75B6`, solid), MtM (orange `#C55A11`, solid)
- Two filled traces for area between: green (`rgba(46,139,87,0.15)`) when MtM >= accrual, red (`rgba(204,51,51,0.15)`) when MtM < accrual
- X-axis: Dias Úteis, Y-axis: Valor (R$)
- Height: 500px, hover mode x unified

### Metric Cards (4)
- Resultado na Curva (R$): accrual final - purchase value
- Resultado MtM (R$): MtM final - purchase value
- Diferença (R$): MtM result - accrual result
- Pior momento MtM: min(MtM - accrual) with DU label

### Pedagogical Info Box
"A diferença entre resultado na curva e MtM é temporária se o título for carregado até o vencimento..."

## Page Files

- `src/app/modulo-1/risco-financeiro/page.tsx` — server component, metadata
- `src/app/modulo-1/risco-financeiro/content.tsx` — client tab container, tabs "📊 Decomposição da Taxa" | "📉 Risco de Mercado (MtM)", `pt-16`

## File Map

```
Modified:
  src/lib/finance.ts    ← Add SPREADS_CREDITO, PREMIO_LIQUIDEZ

Created:
  src/components/modulo-1/tab-decomposicao.tsx
  src/components/modulo-1/tab-mtm.tsx
  src/app/modulo-1/risco-financeiro/page.tsx (rewrite)
  src/app/modulo-1/risco-financeiro/content.tsx
```

No new dependencies. No CSV loading (except SELIC Meta for default in Tab 1). Pure client-side.
