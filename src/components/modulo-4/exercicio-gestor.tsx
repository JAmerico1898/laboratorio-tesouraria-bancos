"use client";

import { useState, useMemo } from "react";
import {
  durationZeroCupom,
  calcularPesosImunizacao,
  simularImunizacao,
  montarEstrategia,
  calcularMetricasCarteira,
  simularRetornoEstrategia,
  CURVA_DEFAULT,
  COR_ESTRATEGIA,
  type CurvaVertex,
} from "@/lib/finance";
import { fmtPct, fmtBrl } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const SELECT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const ESTRATEGIAS = ["Bullet", "Barbell", "Ladder", "Riding the Yield Curve"] as const;

interface CenarioConfig {
  label: string;
  selic: number;
  descricao: string;
  editavel: boolean;
}

const CENARIOS_MACRO: CenarioConfig[] = [
  {
    label: "Ciclo de cortes (SELIC em queda)",
    selic: 11.75,
    descricao:
      "Mercado precifica cortes de 200 bps nos próximos 12 meses. Curva invertida sugere afrouxamento monetário iminente.",
    editavel: false,
  },
  {
    label: "Ciclo de alta (SELIC subindo)",
    selic: 14.25,
    descricao:
      "BCB em ciclo de aperto. Expectativa de mais 100 bps de alta. Curva positivamente inclinada com prêmio de risco.",
    editavel: false,
  },
  {
    label: "Incerteza (curva flat)",
    selic: 13.0,
    descricao:
      "Mercado dividido sobre próximos passos do COPOM. Curva relativamente flat, sem direção clara.",
    editavel: false,
  },
  {
    label: "Personalizado",
    selic: 13.0,
    descricao: "Cenário definido pelo usuário.",
    editavel: true,
  },
];

const STRESS_SCENARIOS = [
  { nome: "Paralelo +100 bps", curto: 100, longo: 100 },
  { nome: "Paralelo +200 bps", curto: 200, longo: 200 },
  { nome: "Paralelo -100 bps", curto: -100, longo: -100 },
  { nome: "Empinamento (curto +50, longo +150)", curto: 50, longo: 150 },
  { nome: "Achatamento (curto +150, longo +50)", curto: 150, longo: 50 },
];

const VOLUME_TOTAL = 100_000_000;
const VOLUME_IMUN = 30_000_000;
const VOLUME_DIR = 70_000_000;
const LIMITE_DV01 = 50_000;
const DURATION_MAX = 4.0;
const HORIZONTE_IMUN = 2.0;
const LIMITE_PERDA = 5_000_000;

// Short / long titles for immunization
const DU_CURTO = 252; // LTN 1A
const DU_LONGO = 1260; // LTN 5A

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ComplianceIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="text-green-400 font-bold ml-1">&#10003;</span>
  ) : (
    <span className="text-red-400 font-bold ml-1">&#10007;</span>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  ok?: boolean;
  sub?: string;
}

function MetricCard({ label, value, ok, sub }: MetricCardProps) {
  return (
    <div className="glass-card rounded-lg p-4 text-center">
      <span className="text-xs font-label text-on-surface-variant">{label}</span>
      <div className="text-lg font-headline font-bold mt-1 flex items-center justify-center gap-1">
        {value}
        {ok !== undefined && <ComplianceIcon ok={ok} />}
      </div>
      {sub && <span className="text-xs text-on-surface-variant">{sub}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ExercicioGestor() {
  // --- State ---
  const [cenarioIdx, setCenarioIdx] = useState(0);
  const [selicCustom, setSelicCustom] = useState(13.0);
  const [estrategia, setEstrategia] = useState<string>("Bullet");
  const [justificativa, setJustificativa] = useState("");

  const cenario = CENARIOS_MACRO[cenarioIdx];
  const selic = cenario.editavel ? selicCustom : cenario.selic;

  // =========================================================================
  // Section 3A: Immunized portfolio
  // =========================================================================
  const imunCalc = useMemo(() => {
    // Find rates from CURVA_DEFAULT for the short/long vertices
    const vCurto = CURVA_DEFAULT.find((v) => v.prazoDu === DU_CURTO);
    const vLongo = CURVA_DEFAULT.find((v) => v.prazoDu === DU_LONGO);
    const txC = (vCurto?.taxa ?? 13.0) / 100;
    const txL = (vLongo?.taxa ?? 12.5) / 100;

    const rC = durationZeroCupom(txC, DU_CURTO);
    const rL = durationZeroCupom(txL, DU_LONGO);
    const [wC, wL] = calcularPesosImunizacao(HORIZONTE_IMUN, rC.durMod, rL.durMod);

    const invC = VOLUME_IMUN * wC;
    const invL = VOLUME_IMUN * wL;
    const durCart = wC * rC.durMod + wL * rL.durMod;
    const dv01C = rC.durMod * invC * 0.0001;
    const dv01L = rL.durMod * invL * 0.0001;
    const dv01 = dv01C + dv01L;

    return { rC, rL, wC, wL, invC, invL, durCart, txC, txL, dv01 };
  }, []);

  // =========================================================================
  // Section 3B: Directional portfolio
  // =========================================================================
  const dirCalc = useMemo(() => {
    const cart = montarEstrategia(estrategia, CURVA_DEFAULT, 3.0);
    const metrics = calcularMetricasCarteira(cart);

    // Scale weights to R$ 70M
    const allocations = cart
      .filter((v) => v.peso > 0.01)
      .map((v) => {
        const r = durationZeroCupom(v.taxa / 100, v.prazoDu);
        const valor = (v.peso / 100) * VOLUME_DIR;
        return {
          vertice: v.vertice,
          prazoDu: v.prazoDu,
          taxa: v.taxa,
          peso: v.peso,
          valor,
          durMod: r.durMod,
          dv01Item: r.durMod * valor * 0.0001,
        };
      });

    const dv01Dir = metrics.duration * VOLUME_DIR * 0.0001;

    return { cart, metrics, allocations, dv01Dir };
  }, [estrategia]);

  // =========================================================================
  // Section 4: Dashboard metrics
  // =========================================================================
  const dashboard = useMemo(() => {
    const dv01Total = imunCalc.dv01 + dirCalc.dv01Dir;

    // Weighted duration
    const durMedia =
      (imunCalc.durCart * VOLUME_IMUN + dirCalc.metrics.duration * VOLUME_DIR) /
      VOLUME_TOTAL;

    // Immunized duration gap
    const imunGap = Math.abs(imunCalc.durCart - HORIZONTE_IMUN);

    // Max concentration: biggest single allocation as % of total
    const allVals = [
      { label: "Imun. Curto", valor: imunCalc.invC },
      { label: "Imun. Longo", valor: imunCalc.invL },
      ...dirCalc.allocations.map((a) => ({
        label: `Dir. ${a.vertice}`,
        valor: a.valor,
      })),
    ];
    const maxConc = Math.max(...allVals.map((v) => v.valor)) / VOLUME_TOTAL;

    return { dv01Total, durMedia, imunGap, maxConc, allPositions: allVals };
  }, [imunCalc, dirCalc]);

  // =========================================================================
  // Section 5: Stress test
  // =========================================================================
  const stressResults = useMemo(() => {
    return STRESS_SCENARIOS.map((sc) => {
      // Immunized sub-portfolio
      const imunSim = simularImunizacao(
        imunCalc.rC.durMod,
        imunCalc.rL.durMod,
        imunCalc.txC,
        imunCalc.txL,
        imunCalc.wC,
        VOLUME_IMUN,
        HORIZONTE_IMUN,
        (sc.curto + sc.longo) / 2, // parallel shock approximation
      );
      const imunPL = imunSim.mtm; // P&L from MtM effect

      // Directional sub-portfolio
      const dirSim = simularRetornoEstrategia(
        dirCalc.cart,
        sc.curto,
        sc.longo,
        12,
      );
      const dirPL = dirSim.mtm * VOLUME_DIR / 1000; // scale: simularRetornoEstrategia uses normalized PU

      // Better approach: compute directional P&L directly from allocations
      const dirPLDirect = dirCalc.allocations.reduce((sum, a) => {
        const choque =
          sc.curto +
          ((a.prazoDu / 252 - 0.5) / (10 - 0.5)) * (sc.longo - sc.curto);
        const di = choque / 10000;
        const r = durationZeroCupom(a.taxa / 100, a.prazoDu);
        return sum + (-r.durMod * a.valor * di + 0.5 * r.convexidade * a.valor * di * di);
      }, 0);

      // Immunized P&L: use duration-based approximation directly
      const choqueImun = ((sc.curto + sc.longo) / 2) / 10000;
      const imunPLDirect =
        -imunCalc.rC.durMod * imunCalc.invC * choqueImun / (1 + imunCalc.txC) +
        -imunCalc.rL.durMod * imunCalc.invL * choqueImun / (1 + imunCalc.txL) +
        // reinvestment offset (approximate)
        imunCalc.invC * imunCalc.txC * HORIZONTE_IMUN * choqueImun * 0.5 +
        imunCalc.invL * imunCalc.txL * HORIZONTE_IMUN * choqueImun * 0.5;

      const totalPL = imunPLDirect + dirPLDirect;
      const totalPct = (totalPL / VOLUME_TOTAL) * 100;

      return {
        nome: sc.nome,
        imunPL: imunPLDirect,
        dirPL: dirPLDirect,
        totalPL,
        totalPct,
      };
    });
  }, [imunCalc, dirCalc]);

  const hasLimitBreach = stressResults.some(
    (r) => r.totalPL < -LIMITE_PERDA,
  );

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="space-y-12">
      {/* ================================================================ */}
      {/* SECTION 1: BRIEFING                                              */}
      {/* ================================================================ */}
      <section>
        <h2 className="font-headline text-xl font-bold mb-4 flex items-center gap-2">
          <span>&#x1F4CB;</span> Briefing do Gestor
        </h2>

        {/* Scenario select */}
        <div className="glass-card rounded-lg p-4 mb-4">
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Cenário macroeconômico
          </label>
          <select
            value={cenarioIdx}
            onChange={(e) => setCenarioIdx(Number(e.target.value))}
            className={SELECT_CLASS}
          >
            {CENARIOS_MACRO.map((c, i) => (
              <option key={c.label} value={i}>
                {c.label}
              </option>
            ))}
          </select>

          {cenario.editavel && (
            <div className="mt-3">
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                SELIC Meta (% a.a.)
              </label>
              <input
                type="number"
                value={selicCustom}
                step={0.25}
                min={2}
                max={30}
                onChange={(e) => setSelicCustom(Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>
          )}

          <p className="text-sm text-on-surface-variant mt-3 italic">
            {cenario.descricao}
          </p>
        </div>

        {/* Manager brief card */}
        <div className="glass-card rounded-lg p-5">
          <h3 className="font-headline font-bold text-sm border-b border-outline-variant/30 pb-2 mb-4">
            Ficha do Gestor
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-on-surface-variant block text-xs">Volume</span>
              <span className="font-bold">R$ 100.000.000</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-xs">Limite DV01</span>
              <span className="font-bold">R$ 50.000</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-xs">Duration max.</span>
              <span className="font-bold">4,0 anos</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-xs">Obrigação funding</span>
              <span className="font-bold">R$ 30M em 2 anos</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-xs">SELIC Meta</span>
              <span className="font-bold">{fmtPct(selic)}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-xs">Curva referência</span>
              <span className="font-bold text-xs">CURVA_DEFAULT (7 vértices)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 2: STRATEGY CHOICE                                       */}
      {/* ================================================================ */}
      <section>
        <h2 className="font-headline text-xl font-bold mb-4 flex items-center gap-2">
          1&#xFE0F;&#x20E3; Escolha Sua Estratégia
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Estratégia principal (R$ 70M livres)
            </label>
            <select
              value={estrategia}
              onChange={(e) => setEstrategia(e.target.value)}
              className={SELECT_CLASS}
            >
              {ESTRATEGIAS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Justificativa (opcional)
            </label>
            <textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Ex.: Espero corte de 200 bps em 12 meses..."
              rows={3}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 3: PORTFOLIO CONSTRUCTION                                */}
      {/* ================================================================ */}
      <section>
        <h2 className="font-headline text-xl font-bold mb-4 flex items-center gap-2">
          2&#xFE0F;&#x20E3; Monte Sua Carteira
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* A) Immunized */}
          <div className="glass-card rounded-lg p-5">
            <h3 className="font-headline font-bold text-sm border-b border-outline-variant/30 pb-2 mb-4">
              A) Carteira Imunizada (R$ 30M)
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Horizonte: {HORIZONTE_IMUN} anos. Títulos: LTN 1A (DU={DU_CURTO})
              + LTN 5A (DU={DU_LONGO}).
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">
                  D<sub>mod</sub> LTN 1A
                </span>
                <span className="font-bold">
                  {imunCalc.rC.durMod.toFixed(4)} anos
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">
                  D<sub>mod</sub> LTN 5A
                </span>
                <span className="font-bold">
                  {imunCalc.rL.durMod.toFixed(4)} anos
                </span>
              </div>
              <div className="border-t border-outline-variant/20 pt-2 flex justify-between">
                <span className="text-on-surface-variant">
                  Peso LTN 1A (w<sub>C</sub>)
                </span>
                <span className="font-bold">{fmtPct(imunCalc.wC * 100)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">
                  Peso LTN 5A (w<sub>L</sub>)
                </span>
                <span className="font-bold">{fmtPct(imunCalc.wL * 100)}</span>
              </div>
              <div className="border-t border-outline-variant/20 pt-2 flex justify-between">
                <span className="text-on-surface-variant">Investimento LTN 1A</span>
                <span className="font-bold">{fmtBrl(imunCalc.invC)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Investimento LTN 5A</span>
                <span className="font-bold">{fmtBrl(imunCalc.invL)}</span>
              </div>
              <div className="border-t border-outline-variant/20 pt-2 flex justify-between items-center">
                <span className="text-on-surface-variant">
                  D<sub>cart</sub> vs Horizonte
                </span>
                <span className="font-bold">
                  {imunCalc.durCart.toFixed(4)} &asymp; {HORIZONTE_IMUN.toFixed(2)}
                  <ComplianceIcon
                    ok={Math.abs(imunCalc.durCart - HORIZONTE_IMUN) < 0.25}
                  />
                </span>
              </div>
            </div>
          </div>

          {/* B) Directional */}
          <div className="glass-card rounded-lg p-5">
            <h3 className="font-headline font-bold text-sm border-b border-outline-variant/30 pb-2 mb-4">
              B) Carteira Direcional (R$ 70M) &mdash;{" "}
              <span style={{ color: COR_ESTRATEGIA[estrategia] ?? "#2E75B6" }}>
                {estrategia}
              </span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs">
                    <th className="text-left py-2 px-2">Vértice</th>
                    <th className="text-right py-2 px-2">Taxa</th>
                    <th className="text-right py-2 px-2">Peso %</th>
                    <th className="text-right py-2 px-2">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {dirCalc.allocations.map((a) => (
                    <tr
                      key={a.vertice}
                      className="border-b border-outline-variant/10"
                    >
                      <td
                        className="py-2 px-2 font-bold"
                        style={{
                          color: COR_ESTRATEGIA[estrategia] ?? "#2E75B6",
                        }}
                      >
                        {a.vertice}
                      </td>
                      <td className="text-right py-2 px-2">
                        {fmtPct(a.taxa)}
                      </td>
                      <td className="text-right py-2 px-2">
                        {a.peso.toFixed(2)}%
                      </td>
                      <td className="text-right py-2 px-2">
                        {fmtBrl(a.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Duration efetiva</span>
                <span className="font-bold">
                  {dirCalc.metrics.duration.toFixed(2)} anos
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Yield médio</span>
                <span className="font-bold">
                  {fmtPct(dirCalc.metrics.yieldMedio)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 4: DASHBOARD                                             */}
      {/* ================================================================ */}
      <section>
        <h2 className="font-headline text-xl font-bold mb-4 flex items-center gap-2">
          3&#xFE0F;&#x20E3; Dashboard da Carteira
        </h2>

        {/* 4 metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="DV01 Total"
            value={fmtBrl(dashboard.dv01Total)}
            ok={dashboard.dv01Total < LIMITE_DV01}
            sub={`Limite: R$ ${(LIMITE_DV01).toLocaleString("pt-BR")}`}
          />
          <MetricCard
            label="Duration Média"
            value={`${dashboard.durMedia.toFixed(2)} anos`}
            ok={dashboard.durMedia < DURATION_MAX}
            sub={`Max: ${DURATION_MAX.toFixed(1)} anos`}
          />
          <MetricCard
            label="Imun. vs Horizonte"
            value={`Gap: ${dashboard.imunGap.toFixed(4)}`}
            ok={dashboard.imunGap < 0.25}
            sub={`D=${imunCalc.durCart.toFixed(2)} vs H=${HORIZONTE_IMUN.toFixed(1)}`}
          />
          <MetricCard
            label="Concentração Max."
            value={fmtPct(dashboard.maxConc * 100)}
            sub="Maior posição individual"
          />
        </div>

        {/* Consolidated table */}
        <div className="glass-card rounded-lg p-4 mb-6">
          <h3 className="font-headline font-bold text-sm mb-3">
            Posições Consolidadas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs">
                  <th className="text-left py-2 px-3">Título</th>
                  <th className="text-left py-2 px-3">Sub-carteira</th>
                  <th className="text-right py-2 px-3">Valor (R$)</th>
                  <th className="text-right py-2 px-3">Peso (%)</th>
                </tr>
              </thead>
              <tbody>
                {/* Immunized positions */}
                <tr className="border-b border-outline-variant/10">
                  <td className="py-2 px-3 font-bold text-primary">LTN 1A</td>
                  <td className="py-2 px-3">Imunizada</td>
                  <td className="text-right py-2 px-3">{fmtBrl(imunCalc.invC)}</td>
                  <td className="text-right py-2 px-3">
                    {((imunCalc.invC / VOLUME_TOTAL) * 100).toFixed(2)}%
                  </td>
                </tr>
                <tr className="border-b border-outline-variant/10">
                  <td className="py-2 px-3 font-bold text-primary">LTN 5A</td>
                  <td className="py-2 px-3">Imunizada</td>
                  <td className="text-right py-2 px-3">{fmtBrl(imunCalc.invL)}</td>
                  <td className="text-right py-2 px-3">
                    {((imunCalc.invL / VOLUME_TOTAL) * 100).toFixed(2)}%
                  </td>
                </tr>
                {/* Directional positions */}
                {dirCalc.allocations.map((a) => (
                  <tr
                    key={a.vertice}
                    className="border-b border-outline-variant/10"
                  >
                    <td
                      className="py-2 px-3 font-bold"
                      style={{
                        color: COR_ESTRATEGIA[estrategia] ?? "#2E75B6",
                      }}
                    >
                      {a.vertice}
                    </td>
                    <td className="py-2 px-3">Direcional</td>
                    <td className="text-right py-2 px-3">{fmtBrl(a.valor)}</td>
                    <td className="text-right py-2 px-3">
                      {((a.valor / VOLUME_TOTAL) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="border-t-2 border-outline-variant/30 font-bold">
                  <td className="py-2 px-3" colSpan={2}>
                    Total
                  </td>
                  <td className="text-right py-2 px-3">
                    {fmtBrl(VOLUME_TOTAL)}
                  </td>
                  <td className="text-right py-2 px-3">100,00%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Two charts side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donut */}
          <div className="glass-card rounded-lg p-4">
            <h3 className="font-headline font-bold text-sm mb-3">
              Composição por Sub-carteira
            </h3>
            <PlotlyChart
              className="h-[320px]"
              data={[
                {
                  labels: ["Imunizada (30%)", "Direcional (70%)"],
                  values: [VOLUME_IMUN, VOLUME_DIR],
                  type: "pie" as const,
                  hole: 0.5,
                  marker: { colors: ["#2E75B6", COR_ESTRATEGIA[estrategia] ?? "#C55A11"] },
                  textinfo: "label+percent",
                  hovertemplate:
                    "%{label}<br>R$ %{value:,.0f}<extra></extra>",
                },
              ]}
              layout={{
                ...PLOTLY_LAYOUT,
                showlegend: true,
                legend: {
                  font: { color: "#aaabb0", size: 11 },
                  orientation: "h" as const,
                  x: 0.5,
                  xanchor: "center" as const,
                  y: -0.1,
                },
                margin: { l: 20, r: 20, t: 20, b: 40 },
              }}
              config={PLOTLY_CONFIG}
            />
          </div>

          {/* Bar: allocation by vertex */}
          <div className="glass-card rounded-lg p-4">
            <h3 className="font-headline font-bold text-sm mb-3">
              Alocação por Vértice
            </h3>
            <PlotlyChart
              className="h-[320px]"
              data={[
                {
                  x: ["1A", "5A"],
                  y: [imunCalc.invC / 1e6, imunCalc.invL / 1e6],
                  type: "bar" as const,
                  name: "Imunizada",
                  marker: { color: "#2E75B6", opacity: 0.8 },
                  hovertemplate: "%{x}: R$ %{y:.1f}M<extra>Imunizada</extra>",
                },
                {
                  x: dirCalc.allocations.map((a) => a.vertice),
                  y: dirCalc.allocations.map((a) => a.valor / 1e6),
                  type: "bar" as const,
                  name: "Direcional",
                  marker: {
                    color: COR_ESTRATEGIA[estrategia] ?? "#C55A11",
                    opacity: 0.8,
                  },
                  hovertemplate:
                    "%{x}: R$ %{y:.1f}M<extra>Direcional</extra>",
                },
              ]}
              layout={{
                ...PLOTLY_LAYOUT,
                barmode: "group" as const,
                xaxis: {
                  ...PLOTLY_LAYOUT.xaxis,
                  title: {
                    text: "Vértice",
                    font: { size: 12, color: "#aaabb0" },
                  },
                },
                yaxis: {
                  ...PLOTLY_LAYOUT.yaxis,
                  title: {
                    text: "R$ (milhões)",
                    font: { size: 12, color: "#aaabb0" },
                  },
                },
                legend: {
                  font: { color: "#aaabb0", size: 11 },
                  orientation: "h" as const,
                  x: 0.5,
                  xanchor: "center" as const,
                  y: 1.12,
                },
                margin: { l: 60, r: 20, t: 30, b: 50 },
              }}
              config={PLOTLY_CONFIG}
            />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 5: STRESS TEST                                           */}
      {/* ================================================================ */}
      <section>
        <h2 className="font-headline text-xl font-bold mb-4 flex items-center gap-2">
          4&#xFE0F;&#x20E3; Stress Test
        </h2>

        {/* Stress table */}
        <div className="glass-card rounded-lg p-4 mb-6">
          <h3 className="font-headline font-bold text-sm mb-3">
            Resultado por Cenário
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs">
                  <th className="text-left py-2 px-3">Cenário</th>
                  <th className="text-right py-2 px-3">Imunizada (R$)</th>
                  <th className="text-right py-2 px-3">Direcional (R$)</th>
                  <th className="text-right py-2 px-3">Total (R$)</th>
                  <th className="text-right py-2 px-3">Total (%)</th>
                </tr>
              </thead>
              <tbody>
                {stressResults.map((r) => (
                  <tr
                    key={r.nome}
                    className="border-b border-outline-variant/10"
                  >
                    <td className="py-2 px-3 font-bold">{r.nome}</td>
                    <td
                      className={`text-right py-2 px-3 ${
                        r.imunPL >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {fmtBrl(r.imunPL)}
                    </td>
                    <td
                      className={`text-right py-2 px-3 ${
                        r.dirPL >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {fmtBrl(r.dirPL)}
                    </td>
                    <td
                      className={`text-right py-2 px-3 font-bold ${
                        r.totalPL >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {fmtBrl(r.totalPL)}
                    </td>
                    <td
                      className={`text-right py-2 px-3 ${
                        r.totalPct >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {fmtPct(r.totalPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grouped bar chart */}
        <div className="glass-card rounded-lg p-4 mb-6">
          <h3 className="font-headline font-bold text-sm mb-3">
            P&amp;L por Cenário (Imunizada vs Direcional)
          </h3>
          <PlotlyChart
            className="h-[400px]"
            data={[
              {
                x: stressResults.map((r) => r.nome),
                y: stressResults.map((r) => r.imunPL / 1e6),
                type: "bar" as const,
                name: "Imunizada",
                marker: { color: "#2E75B6", opacity: 0.85 },
                hovertemplate: "%{x}<br>R$ %{y:.2f}M<extra>Imunizada</extra>",
              },
              {
                x: stressResults.map((r) => r.nome),
                y: stressResults.map((r) => r.dirPL / 1e6),
                type: "bar" as const,
                name: "Direcional",
                marker: {
                  color: COR_ESTRATEGIA[estrategia] ?? "#C55A11",
                  opacity: 0.85,
                },
                hovertemplate:
                  "%{x}<br>R$ %{y:.2f}M<extra>Direcional</extra>",
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              barmode: "group" as const,
              xaxis: {
                ...PLOTLY_LAYOUT.xaxis,
                tickangle: -25,
              },
              yaxis: {
                ...PLOTLY_LAYOUT.yaxis,
                title: {
                  text: "P&L (R$ milhões)",
                  font: { size: 12, color: "#aaabb0" },
                },
              },
              legend: {
                font: { color: "#aaabb0", size: 11 },
                orientation: "h" as const,
                x: 0.5,
                xanchor: "center" as const,
                y: 1.12,
              },
              margin: { l: 70, r: 20, t: 30, b: 110 },
            }}
            config={PLOTLY_CONFIG}
          />
        </div>

        {/* Alert box */}
        {hasLimitBreach && (
          <div className="glass-card rounded-lg p-4 border-l-4 border-red-500 mb-4">
            <p className="text-sm text-red-400">
              <strong>&#9888;&#65039; Alerta de limite:</strong>{" "}
              {stressResults
                .filter((r) => r.totalPL < -LIMITE_PERDA)
                .map(
                  (r) =>
                    `No cenário "${r.nome}", a perda total é de ${fmtBrl(
                      r.totalPL,
                    )}, ultrapassando o limite de R$ ${(
                      LIMITE_PERDA / 1e6
                    ).toFixed(0)}M.`,
                )
                .join(" ")}{" "}
              Considere reduzir a duration da carteira direcional ou adicionar
              hedge.
            </p>
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/* SECTION 6: REFLECTION QUESTIONS                                  */}
      {/* ================================================================ */}
      <section>
        <h2 className="font-headline text-xl font-bold mb-4 flex items-center gap-2">
          <span>&#x1F4AC;</span> Questões para Reflexão
        </h2>

        <div className="space-y-3">
          <details className="glass-card rounded-lg">
            <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm select-none">
              1. Coerência estratégia vs cenário
            </summary>
            <div className="px-5 pb-4 text-sm text-on-surface-variant">
              <p>
                Sua estratégia direcional é coerente com o cenário apresentado?
                Se o cenário se invertesse, quanto perderia?
              </p>
            </div>
          </details>

          <details className="glass-card rounded-lg">
            <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm select-none">
              2. Eficácia da imunização
            </summary>
            <div className="px-5 pb-4 text-sm text-on-surface-variant">
              <p>
                A carteira imunizada está de fato protegida? O que aconteceria
                em um cenário de empinamento (não paralelo)?
              </p>
            </div>
          </details>

          <details className="glass-card rounded-lg">
            <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm select-none">
              3. Restrição de DV01 mais apertada
            </summary>
            <div className="px-5 pb-4 text-sm text-on-surface-variant">
              <p>
                Se o limite de DV01 fosse reduzido para R$ 30.000, quais
                ajustes faria na carteira? Onde cortaria risco?
              </p>
            </div>
          </details>

          <details className="glass-card rounded-lg">
            <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm select-none">
              4. Convexidade comparada
            </summary>
            <div className="px-5 pb-4 text-sm text-on-surface-variant">
              <p>
                A convexidade da sua carteira é maior ou menor que a de um
                colega que escolheu outra estratégia? Isso importa?
              </p>
            </div>
          </details>

          <details className="glass-card rounded-lg">
            <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm select-none">
              5. Risco de crédito
            </summary>
            <div className="px-5 pb-4 text-sm text-on-surface-variant">
              <p>
                Se um título da sua carteira fosse rebaixado (downgrade), como
                isso afetaria o risco total? (Conexão com Módulo 3.)
              </p>
            </div>
          </details>

          <details className="glass-card rounded-lg">
            <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm select-none">
              6. Rebalanceamento futuro
            </summary>
            <div className="px-5 pb-4 text-sm text-on-surface-variant">
              <p>
                Daqui a 6 meses, sua carteira imunizada precisara de
                rebalanceamento? Como estimaria o custo desse
                rebalanceamento?
              </p>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
