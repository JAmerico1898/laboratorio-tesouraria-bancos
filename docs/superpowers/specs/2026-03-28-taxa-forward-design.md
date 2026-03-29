# Taxa Forward (FRA) — Design Spec

## Context

Tópico 3 of Módulo 2. Two tabs: forward rates calculator from spot curve, and FRA strategy simulator with vision comparison tool.

**Route:** `/modulo-2/taxa-forward`
**Source spec:** `spec/spec_app_modulo2_ettj.md` (section `<pagina id="mod3">`)
**Python reference:** `code/module_02_ettj_brasil.py` lines 876–1186

## Tab 1: Calculadora de Forwards Implícitas

### Concept Block (collapsible `<details>`)

Forward rate formula (LaTeX):
```
f_{1,2} = \left[\frac{(1 + s_2)^{DU_2/252}}{(1 + s_1)^{DU_1/252}}\right]^{252/(DU_2 - DU_1)} - 1
```

Interpretation: forward ≈ expected CDI + term premium.

### Source Toggle

Two modes: "Dados pré-carregados" / "Inserir manualmente" (same button pattern as tab-breakeven).

**Manual mode**: Editable HTML table with 7 default vertices:

| Vértice | Prazo (DU) | Taxa Spot (% a.a.) |
|---------|-----------|-------------------|
| 3M | 63 | 14,25 |
| 6M | 126 | 14,50 |
| 1A | 252 | 14,80 |
| 18M | 378 | 14,60 |
| 2A | 504 | 14,30 |
| 3A | 756 | 13,80 |
| 5A | 1260 | 13,20 |

Plus a SELIC Meta input (default 14.25%).

**Preloaded mode**: Date selector from `curvas_di.csv` unique dates. SELIC loaded from `selic_meta.csv`.

### Forwards Calculation

Use `calcularForwards(curva)` — new function to add to `finance.ts`:
- Input: `Record<number, number>` mapping DU → rate (decimal)
- Returns array of `{ deDu, ateDu, spotIni, spotFim, forwardAa, forwardMensal }`
- First vertex: forward = spot
- Subsequent: uses existing `taxaForward(sc, pc, sl, pl)`
- Monthly equiv: `(1 + fwd)^(21/252) - 1`

### Forwards Table

Columns: Período | DU início | DU fim | Spot início | Spot fim | Forward (% a.a.) | CDI mensal equiv.

Cell color: forward > SELIC → orange text, forward < SELIC → green text.

### Spot + Forwards Chart (Plotly)

- Blue line (#2E75B6): spot curve (continuous, with markers)
- Orange step bars (#C55A11): forwards between vertices (step/staircase pattern using x0,x1,None segments)
- Dashed gray (#888888): SELIC reference horizontal line with annotation
- X-axis: prazo in years (DU/252), Y-axis: taxa % a.a.

### Automatic Interpretation

Pattern detection on forward values:
- All increasing → "ALTA de juros"
- All decreasing → "QUEDA de juros"
- Peak in middle → "fim de ciclo de aperto" with peak period identified
- Max forward value and spread vs SELIC displayed

## Tab 2: FRA e Estratégias

### Concept Block

FRA = combination of two DI futures legs. Terminology: tomador (bet on rise) vs doador (bet on fall). Use cases in treasury.

### FRA Strategy Simulator

**Inputs:**
- Period selector (dynamic from calculated forwards)
- Position: Tomador / Doador
- Notional: R$ 10,000,000 (step 1M)
- CDI slider: 5%–25%, step 0.25%, default = forward of selected period

**Calculation:**
```
fator_fwd = (1 + forward/100)^(du_periodo/252)
fator_cdi = (1 + cdi/100)^(du_periodo/252)
resultado_tomador = nocional × (fator_cdi/fator_fwd - 1)
resultado_doador = nocional × (fator_fwd/fator_cdi - 1)
```

**4 metric cards:** Forward contratada, CDI realizado, Diferença (bps), Resultado (R$)

**Payoff chart (Plotly):**
- X: CDI range 5%–25% (100 points), Y: P&L in R$
- Line with `fill: "tozeroy"`, green fill for positive area
- Vertical dashed red line at forward (breakeven)
- Diamond marker at simulated CDI point
- Horizontal gray line at y=0

### Vision Comparison Tool

**Editable table:**
- Período (readonly) | Forward mercado % (readonly) | Sua visão CDI % (editable, starts = forward)

**On recalculate:**
- Compute divergence (bps) = (visão - forward) × 100
- Strategy: >+25bps → "Tomar FRA", <-25bps → "Dar FRA", else "Neutro"

**Overlay chart (Plotly):**
- Blue step line: market forwards
- Orange dashed step line: student vision
- Divergence shading: green where visão < forward (dar), red where visão > forward (tomar)

**Opportunities table:** Período | Forward | Sua visão | Divergência | Estratégia sugerida

**Pedagogical note:** Warning about cost of diverging from market consensus.

## File Architecture

### New files

| File | Type | Description |
|------|------|-------------|
| `src/components/modulo-2/tab-forward-calculator.tsx` | Client component | Tab 1 — forward calculator |
| `src/components/modulo-2/tab-fra-strategy.tsx` | Client component | Tab 2 — FRA simulator + vision |
| `src/app/modulo-2/taxa-forward/content.tsx` | Client component | Page shell with tab switcher |

### Modified files

| File | Changes |
|------|---------|
| `src/lib/finance.ts` | Add `calcularForwards()` and `ForwardPoint` interface |
| `src/app/modulo-2/taxa-forward/page.tsx` | Replace ComingSoon with content import |

### Reused (no changes)

- `taxaForward` from finance.ts
- `loadCurvasDi`, `loadSelicMeta` from data.ts
- `PlotlyChart`, `Math`, `fmtPct`, `fmtBrl`, `PLOTLY_LAYOUT`, `PLOTLY_CONFIG`, `CHART_COLORS`

## Verification

1. `npm run build` — no errors
2. Navigate to `/modulo-2/taxa-forward`:
   - Tab 1 manual: edit rates → forwards table + chart update
   - Tab 1 preloaded: select date → loads curve, computes forwards
   - Tab 1: interpretation box shows correct pattern
   - Tab 2: select FRA period → slider defaults to forward rate
   - Tab 2: adjust CDI slider → metrics and payoff chart update
   - Tab 2: vision comparison table editable, recalculate shows strategies
   - Mobile responsive
