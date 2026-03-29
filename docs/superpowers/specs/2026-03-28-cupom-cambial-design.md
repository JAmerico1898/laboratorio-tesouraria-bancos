# Cupom Cambial — Design Spec

## Context

Tópico 4 of Módulo 2. Two tabs: cupom cambial calculator from CIP, and curve dynamics with historical data + hedge decision simulator.

**Route:** `/modulo-2/cupom-cambial`
**Source spec:** `spec/spec_app_modulo2_ettj.md` (section `<pagina id="mod4">`)
**Python reference:** `code/module_02_ettj_brasil.py` lines 1192–1464

## Tab 1: Paridade Coberta e Cálculo do Cupom

### Concept Block

CIP formula (LaTeX):
```
(1 + i_{BRL})^{DU/252} = (1 + cupom \times DC/360) \times \frac{F}{S}
```

Isolated cupom:
```
cupom = \left[\frac{(1 + i_{DI})^{DU/252}}{F/S} - 1\right] \times \frac{360}{DC}
```

Key points: DC/360 linear convention (different from DI's DU/252 compound), cupom ≠ SOFR (reflects onshore conditions).

### Source Toggle

Default: "Dados pré-carregados". Alternative: "Inserir manualmente".

**Manual inputs (2-column):**

| Input | Default | Step |
|-------|---------|------|
| Dólar spot PTAX (R$/US$) | 5.45 | 0.01 |
| Dólar futuro (R$/US$) | 5.52 | 0.01 |
| Taxa DI (% a.a.) | 13.25 | 0.10 |
| Dias úteis (DU) | 126 | 1 |
| Dias corridos (DC) | 183 | 1 |
| SOFR referência (% a.a.) | 5.00 | 0.25 |

**Preloaded mode:**
- Date selector from dolar_futuro.csv dates
- Load dolar_futuro.csv + curvas_di.csv + dolar_spot_ptax.csv
- Merge dolar_futuro and curvas_di on prazo_du
- Get PTAX for selected date from dolar_spot_ptax.csv
- Compute cupom for each vertex using `calcularCupomCambial()`
- SOFR: hardcoded reference (5.00%) or loaded if available

### Calculation

```typescript
function calcularCupomCambial(
  taxaDi: number,  // decimal (0.1325)
  du: number,
  dc: number,
  dolarSpot: number,
  dolarFuturo: number
): number {
  if (dolarSpot === 0 || dc === 0) return 0;
  const fatorDi = Math.pow(1 + taxaDi, du / 252);
  const razaoCambio = dolarFuturo / dolarSpot;
  if (razaoCambio === 0) return 0;
  const fatorCupom = fatorDi / razaoCambio;
  return (fatorCupom - 1) * (360 / dc);
}
```

### Outputs

**4 metric cards:** Cupom implícito (% a.a.), SOFR referência, spread cupom-SOFR (bps), forward points (F-S)

**Step-by-step calculation** (collapsible details): Shows each step with actual values:
1. Fator DI = (1 + taxa)^(DU/252)
2. Razão câmbio = F/S
3. Fator cupom = Fator DI / Razão
4. Cupom linear = (Fator - 1) × 360/DC

**Data table (preloaded only):** Prazo DU | DC | DI (%) | Dólar futuro | Cupom (%)

**Pedagogical note:** Cupom = "preço do hedge cambial".

## Tab 2: Curva de Cupom e Dinâmica

### Section 1: Cupom Curve Visualization

Same date selector as Tab 1. Chart: cupom curve (#059669 green, lines+markers) + SOFR dashed reference. X: prazo (months = DU/21). Y: cupom % a.a. Table with all vertices.

### Section 2: Historical Evolution

Data: `cupom_cambial_hist.csv` (9,167 records). Columns: data, prazo_meses, cupom_aa.

**Inputs:** Tenor selector (dynamic from unique prazo_meses values).

**Chart:** Time series line (#059669 green), SOFR reference (dashed gray). Annotated stress events:
- "2020-03-15": "COVID-19 — cupom negativo"
- "2022-12-28": "Virada 2022 — pico de demanda por hedge"

### Section 3: Hedge Decision Simulator

**Inputs (2-column):**

| Input | Default | Step | Range |
|-------|---------|------|-------|
| Posição USD | 5,000,000 | 500,000 | — |
| Dólar spot (R$/US$) | 5.45 | 0.01 | — |
| Cupom cambial (% a.a.) | 5.50 | 0.25 | — |
| Rendimento ativo USD (% a.a.) | 5.00 | 0.25 | — |
| Prazo (meses) | 6 | 1 | 1–12 slider |
| Variação cambial (%) | 5 | 1 | -20 to +20 slider |

**Calculation:**
```
fracAno = prazo / 12
posBrl = posUsd × spot

// Com hedge: fixed return, cost = cupom
rendHedge = posUsd × (rendUsd - cupom) / 100 × fracAno × spot

// Sem hedge: return + FX exposure
dolFinal = spot × (1 + varCambial / 100)
valFinalSem = posUsd × (1 + rendUsd/100 × fracAno) × dolFinal
rendSem = valFinalSem - posBrl
```

**Side-by-side display:** "Com hedge" result (R$) vs "Sem hedge" result (R$) with comparison text.

**Sensitivity chart (Plotly):**
- Green line (#059669): hedged result (horizontal — constant across FX scenarios)
- Orange line (#C55A11): unhedged result (sloped)
- Diamond marker at simulated FX point
- Indifference point: vertical dashed line where lines cross
- X: variação cambial (-20% to +20%), Y: resultado (R$)

**Pedagogical note:** Hedge decision = risk tolerance, not just FX expectation.

## File Architecture

### New files

| File | Type |
|------|------|
| `src/components/modulo-2/tab-cupom-calculo.tsx` | Tab 1 — cupom calculator |
| `src/components/modulo-2/tab-cupom-dinamica.tsx` | Tab 2 — curve + history + hedge |
| `src/app/modulo-2/cupom-cambial/content.tsx` | Page shell |

### Modified files

| File | Changes |
|------|---------|
| `src/lib/finance.ts` | Add `calcularCupomCambial()` |
| `src/lib/data.ts` | Add `loadDolarFuturo()`, `loadDolarSpot()`, `loadCupomHist()` + interfaces |
| `src/app/modulo-2/cupom-cambial/page.tsx` | Replace ComingSoon |

## Data Files

| CSV | Records | Columns | Dates |
|-----|---------|---------|-------|
| dolar_futuro.csv | 26 | data, prazo_du, dc, cotacao | 1 date |
| dolar_spot_ptax.csv | 2,281 | data, valor | 2016–2026 |
| cupom_cambial_hist.csv | 9,167 | data, prazo_meses, cupom_aa | multi-year |
| curvas_di.csv | 29 | data, prazo_du, taxa | 1 date |

## Verification

1. `npm run build` — no errors
2. Tab 1 manual: enter values → cupom computed, step-by-step shown
3. Tab 1 preloaded: select date → table with cupom for all vertices
4. Tab 2 curve: chart with cupom curve + SOFR reference
5. Tab 2 historical: time series with annotations, tenor selector
6. Tab 2 hedge: adjust sliders → results update, sensitivity chart shows indifference point
