# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Laboratório de Operações de Tesouraria** — an interactive educational platform for FGV's MBA in Banking and Financial Institutions. The project is being refactored from Python/Streamlit into a Next.js/Vercel application.

The repository currently contains **source materials only** (Python code, specifications, CSV data, landing page mockup). The Next.js application is being built from these materials.

## Repository Layout

| Directory | Purpose |
|-----------|---------|
| `spec/` | Detailed specifications for each module (XML-structured markdown). Start here to understand requirements. |
| `spec/estrutura_app.md` | Mermaid diagram showing the 4-module architecture and 23 topics |
| `code/` | Original Python/Streamlit modules — the reference implementations to port |
| `public/data/` | 17 CSV files with Brazilian financial market data (offline fallback for classroom use) |
| `landing_page/` | HTML mockup of the landing page (Tailwind CSS, dark theme, Material Design 3) |

## Module Architecture

The app has 4 sequential modules with pedagogical progression — each builds on the previous:

1. **Operações Fundamentais** (`module_01`) — Financial math, money market, CDI/SELIC, economic scenarios, risk components. Foundation for everything.
2. **Curva de Juros / ETTJ** (`module_02`) — Rate decomposition, spot curve construction, forward rates (FRA), FX carry (cupom cambial). Most complex module.
3. **Precificação de Ativos** (`module_03`) — Pricing LTN, NTN-F, NTN-B, LFT (public titles), CDB/LCI (bank titles), corporate debt. Requires ANBIMA formula compliance.
4. **Gestão de Carregamento** (`module_04`) — Portfolio strategies (bullet, barbell, ladder, riding), duration/convexity, immunization, stress testing.

Each module has 6 sections: Overview, 4 content blocks, and an integrated exercise. Each spec file (`spec/spec_app_modulo{N}_*.md`) is the authoritative source for that module's requirements.

## Brazilian Financial Domain Conventions

These conventions are **non-negotiable** — they appear throughout all modules and specs:

- **Day count**: Business days over 252 (DU/252) for prefixed instruments. Use ANBIMA holiday calendar.
- **Rate convention**: Annual rates compounded on DU/252 basis: `PU = VF / (1 + taxa)^(DU/252)`
- **Number formatting**: Brazilian locale — `R$ 1.234,56` for currency, `13,75%` for rates, period as thousands separator, comma as decimal.
- **IR Tax Table** (progressive): 22.5% (<=180 DC), 20% (181-360), 17.5% (361-720), 15% (>720 DC)
- **ANBIMA truncation**: 6 decimal places for intermediate pricing calculations
- **Coupon dates**: Semi-annual on Jan 1 and Jul 1 for NTN-F and NTN-B
- **Key rates/indices**: CDI, SELIC (meta and over), IPCA, PTAX, DI futures (B3)
- **Key institutions**: BCB (Central Bank), B3 (exchange), ANBIMA (pricing conventions), COPOM (monetary policy)

## Data Layer

**Primary sources** (Python code uses these via APIs):
- BCB SGS API: SELIC meta (432), SELIC over (1178), CDI (4391), IPCA (13522), USD/BRL (1)
- BCB Focus API: Market expectations (IPCA, SELIC)
- B3 via `pyield` library: DI futures curve, NTN-B yields
- INVESTING.com: CDS Brazil

**Offline fallback**: All data cached as CSV in `public/data/`. The Next.js app should load from CSV when APIs are unavailable (classroom use without internet).

## Color System

**Landing page** (dark theme — see `landing_page/landing_page.html`):
- Primary: `#58f5d1` (teal), Surface: `#0c0e12`, Error: `#ff716c`, Tertiary: `#ff9f4a`

**Module charts** (light theme — Plotly `plotly_white` template):
- Primary: `#1B3A5C`, Secondary: `#2E75B6`, Accent: `#C55A11`
- Green: `#2E8B57`, Red: `#CC3333`
- Domain-specific: Inflation `#8B5CF6`, USD `#059669`, Forward `#555555`, Banking `#0E7C7B`
- Module 4 strategies: Bullet `#2E75B6`, Barbell `#C55A11`, Ladder `#2E8B57`, Riding `#7B2D8B`

## Key Financial Functions to Port

These are the core computations in the Python code that must be ported with numerical accuracy:

| Function | Module | What it does |
|----------|--------|-------------|
| `pu_ltn(taxa, du)` | 01, 03 | Zero-coupon pricing: `1000 / (1+taxa)^(du/252)` |
| `taxa_equivalente()` | 01 | Rate conversion between bases (annual_252, annual_360, monthly, daily) |
| `taxa_forward(sc, pc, sl, pl)` | 01, 02 | Forward rate from two spot rates |
| `calcular_breakeven()` | 02 | Inflation implied from nominal vs. real rates |
| `calcular_forwards()` | 02 | Forward curve from spot curve vertices |
| `calcular_cupom_cambial()` | 02 | FX carry via interest rate parity |
| `gerar_diagnostico()` | 02 | Auto-generated curve shape/stance analysis |
| `precificar_ntnf()` | 03 | Fixed-coupon bond with semi-annual flows |
| `precificar_ntnb()` | 03 | Inflation-linked bond pricing over VNA |
| `precificar_lft()` | 03 | SELIC-floating bond (VNA x cotation) |
| `duration_modificada()` | 03, 04 | Modified duration and DV01 |
| `montar_bullet/barbell/ladder/riding()` | 04 | Portfolio strategy constructors |
| `calcular_metricas_carteira()` | 04 | Aggregated portfolio duration, convexity, yield |
| `dias_uteis()` | all | Business day count using ANBIMA calendar |
| `truncar6()` | 03 | ANBIMA-compliant 6-decimal truncation |
| `aliquota_ir()` | 03 | Progressive IR tax rate lookup |

## Development Commands

The Next.js application has not yet been scaffolded. Once created, expected commands:

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run test suite
npm run test:watch   # Watch mode for single test iteration
```

**Update this section** once `package.json` is created with actual scripts.

## Working Principles

- Every interactive feature must answer a **managerial decision question** (pedagogical intent from the specs)
- Specs are authoritative for requirements; Python code is the reference implementation for formulas
- Maintain **offline capability** — the app must work in a classroom with no internet using CSV data
- Charts use **Plotly.js** (porting from Python Plotly) with interactive controls (sliders, inputs)
- All UI text is in **Brazilian Portuguese**
