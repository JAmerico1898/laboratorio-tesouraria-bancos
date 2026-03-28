# Exercício Integrador — Decisão de Tesouraria — Design Spec

## Summary

Interactive portfolio allocation exercise at `/modulo-1/exercicio`. Single scrollable page. Students allocate R$ 50M across 4 instruments, select a macro scenario, and see projected results with qualitative analysis. Pure client-side calculations. Loads SELIC Meta from CSV for default values.

## Decisions

- **Structure:** Single scrollable page (linear flow: case → inputs → results → analysis → reflection)
- **SELIC source:** Load latest from `selic_meta.csv` (consistent with Block 3)
- **No new lib files:** Calculation logic is exercise-specific, not reusable

## Page: `/modulo-1/exercicio`

### `src/app/modulo-1/exercicio/page.tsx`
Server component. Metadata: `"Exercício Integrador | Laboratório de Tesouraria"`. Renders client content.

### `src/app/modulo-1/exercicio/content.tsx`
Client component. Single scrollable page with 7 sections.

#### 1. Header + Case Narrative
- Title: "🧩 Exercício Integrador — Decisão de Tesouraria"
- Managerial question: "Dadas as condições de mercado, qual a melhor alocação para a carteira de tesouraria?"
- Case text (blockquote): R$ 50M allocation, COPOM maintained SELIC but signaled possible hike, IPCA 4.8% above 3% target, FX depreciated 3%, positively sloped curve
- 4 alternatives:
  - A: LTN 1A — 14,80% a.a., 252 DU
  - B: NTN-B 3A — IPCA + 7,20% a.a. (inflation projection: 3% a.a.)
  - C: Compromissada — SELIC Over, overnight
  - D: Debênture AAA — CDI + 80 bps, 2 years, medium liquidity

#### 2. Decision Panel (2-column layout)
**Left column:**
- 3 allocation sliders: LTN 1A (%), NTN-B 3A (%), Compromissada (%)
- Each: range 0-100, step 5, default 25

**Right column:**
- Debênture AAA (%): auto-calculated = 100 - sum of other 3. Display as metric card.
- Scenario dropdown: "Base (SELIC estável)", "Hawkish (alta de 100 bps em 3M)", "Dovish (corte de 100 bps em 3M)", "Estresse (alta 300 bps + abertura spread)"
- Horizon slider: 1-12 months, default 6

**Validation:** If sum of 3 sliders > 100%, show error, hide results.

#### 3. Results Table

**Scenario parameters (from Python code):**
```
Base: delta_selic=0, delta_spread=0
Hawkish: delta_selic=+1.0, delta_spread=+0.10
Dovish: delta_selic=-1.0, delta_spread=-0.05
Estresse: delta_selic=+3.0, delta_spread=+0.50
```

**Per-alternative calculations:**
- **A (LTN):** Buy PU at 14.80%, after horizon: MtM at (14.80 + delta_selic)%, remaining DU = 252 - horizon_du
- **B (NTN-B):** Nominal rate = (1+7.20%)(1+3%)-1, compound for period, MtM impact via duration approximation
- **C (Compromissada):** Average SELIC over period, compound for horizon_du/252
- **D (Debênture):** CDI (≈ SELIC - 0.10) + spread + delta_spread, compound for period

**Table columns:** Alternativa | Alocado (R$) | Resultado (R$) | Rendimento (%) | % CDI equiv.
**Total row** at bottom.

#### 4. Portfolio Composition (Pie Chart)
- Plotly pie chart with 4 alternatives (non-zero only)
- Colors: LTN `#2E75B6`, NTN-B `#2E8B57`, Compromissada `#5B8AB5`, Debênture `#C55A11`
- Text: label + percent, hover shows R$ value
- Height: 400px

#### 5. Portfolio Evolution Chart
- Line chart: total portfolio value day-by-day (0 to horizon_du)
- For each day, recalculate each alternative's value with pro-rata scenario progression
- Dashed horizontal line at R$ 50M (initial value)
- Title: "Evolução — Cenário: {selected scenario}"
- Color: `#2E75B6`, height: 400px

#### 6. Qualitative Analysis (auto-generated info boxes)
Conditional analysis based on allocation:
- If prefixed (A+B) > 50%: warn about MtM loss in rate hikes
- If repo (C) > 50%: highlight protection but limited gains in cuts
- If debenture (D) > 0%: discuss spread adequacy for liquidity risk
- If (Hawkish or Estresse) and LTN > 30%: specific warning about prefixed exposure

#### 7. Reflection Questions
5 open-ended questions (no auto-answers, for classroom discussion):
1. Qual cenário macroeconômico é mais provável? Alocação reflete convicção?
2. Se COPOM surpreender, qual alternativa sofre/beneficia?
3. Spread da debênture compensa risco de liquidez?
4. Concentração vs limites típicos de tesouraria bancária?
5. Como derivativos complementariam a alocação?

## File Map

```
Modified: (none)

Created:
  src/app/modulo-1/exercicio/page.tsx (rewrite from ComingSoon)
  src/app/modulo-1/exercicio/content.tsx
```

## Styling
Same patterns: dark theme, glass-card, mesh-bg, max-w-5xl, pt-16, consistent inputs. Sliders use `accent-primary`. Results table as glass-card table. Info boxes with border-l-4.

## Dependencies
No new dependencies. Uses existing: `puLtn` from finance.ts, `loadSelicMeta` from data.ts, `fmtBrl`/`fmtPct` from format.ts, `PlotlyChart`, `PLOTLY_LAYOUT`/`PLOTLY_CONFIG`.
