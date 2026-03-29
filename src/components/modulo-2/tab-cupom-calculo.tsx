"use client";

import { useState, useEffect, useMemo } from "react";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { calcularCupomCambial } from "@/lib/finance";
import {
  loadDolarFuturo,
  loadDolarSpot,
  loadCurvasDi,
  loadSelicMeta,
  type DolarFuturoPoint,
  type DolarSpotPoint,
  type CurvaDiPoint,
} from "@/lib/data";
import { fmtPct, fmtNum } from "@/lib/format";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const COLOR_CUPOM = "#059669";

interface MergedCupomPoint {
  prazoDu: number;
  dc: number;
  taxaDi: number;
  dolarFuturo: number;
  cupomAa: number;
}

function getSpreadColor(spreadBps: number): string {
  if (spreadBps <= 200) return "text-[#2E8B57]";
  return "text-[#CC3333]";
}

export function TabCupomCalculo() {
  const [modo, setModo] = useState<"preloaded" | "manual">("preloaded");

  // Manual mode state
  const [dolarSpotManual, setDolarSpotManual] = useState(5.45);
  const [dolarFuturoManual, setDolarFuturoManual] = useState(5.52);
  const [taxaDiManual, setTaxaDiManual] = useState(13.25);
  const [duManual, setDuManual] = useState(126);
  const [dcManual, setDcManual] = useState(183);
  const [sofrManual, setSofrManual] = useState(5.0);

  // Preloaded mode state
  const [dolarFutData, setDolarFutData] = useState<DolarFuturoPoint[]>([]);
  const [dolarSpotData, setDolarSpotData] = useState<DolarSpotPoint[]>([]);
  const [diData, setDiData] = useState<CurvaDiPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const SOFR_REF = 5.0;

  // Load preloaded data on mode switch
  useEffect(() => {
    if (modo !== "preloaded") return;
    setLoading(true);
    Promise.all([loadDolarFuturo(), loadDolarSpot(), loadCurvasDi()])
      .then(([fut, spot, di]) => {
        setDolarFutData(fut);
        setDolarSpotData(spot);
        setDiData(di);
        const dates = [...new Set(fut.map((d) => d.data))].sort();
        if (dates.length > 0) setSelectedDate(dates[dates.length - 1]);
      })
      .finally(() => setLoading(false));
  }, [modo]);

  // Available dates (from dolar_futuro)
  const availableDates = useMemo(() => {
    return [...new Set(dolarFutData.map((d) => d.data))].sort();
  }, [dolarFutData]);

  // PTAX for selected date (latest value <= selectedDate)
  const ptaxForDate = useMemo((): number => {
    if (!selectedDate || dolarSpotData.length === 0) return 0;
    const before = dolarSpotData.filter((d) => d.data <= selectedDate);
    if (before.length === 0) return dolarSpotData[0].valor;
    return before[before.length - 1].valor;
  }, [selectedDate, dolarSpotData]);

  // Merged data for selected date
  const merged = useMemo((): MergedCupomPoint[] => {
    if (!selectedDate || ptaxForDate === 0) return [];
    const futForDate = dolarFutData.filter((d) => d.data === selectedDate);
    const diForDate = diData.filter((d) => d.data === selectedDate);
    const result: MergedCupomPoint[] = [];
    for (const fut of futForDate) {
      const di = diForDate.find((d) => d.prazoDu === fut.prazoDu);
      if (di) {
        const cupom =
          calcularCupomCambial(di.taxa, fut.prazoDu, fut.dc, ptaxForDate, fut.cotacao) * 100;
        result.push({
          prazoDu: fut.prazoDu,
          dc: fut.dc,
          taxaDi: di.taxa * 100,
          dolarFuturo: fut.cotacao,
          cupomAa: cupom,
        });
      }
    }
    return result.sort((a, b) => a.prazoDu - b.prazoDu);
  }, [selectedDate, dolarFutData, diData, ptaxForDate]);

  // Manual mode calculation
  const manualCupom =
    calcularCupomCambial(taxaDiManual / 100, duManual, dcManual, dolarSpotManual, dolarFuturoManual) * 100;
  const manualFwdPoints = dolarFuturoManual - dolarSpotManual;
  const manualSpreadBps = (manualCupom - sofrManual) * 100;

  // Manual mode intermediate steps
  const manualFatorDi = Math.pow(1 + taxaDiManual / 100, duManual / 252);
  const manualRazaoCambio = dolarSpotManual !== 0 ? dolarFuturoManual / dolarSpotManual : 0;
  const manualFatorCupom = manualRazaoCambio !== 0 ? manualFatorDi / manualRazaoCambio : 0;

  // Preloaded: metrics for shortest maturity
  const shortestPoint = merged.length > 0 ? merged[0] : null;
  const preloadedCupom = shortestPoint?.cupomAa ?? 0;
  const preloadedSpreadBps = (preloadedCupom - SOFR_REF) * 100;
  const preloadedFwdPoints = shortestPoint ? shortestPoint.dolarFuturo - ptaxForDate : 0;

  // Preloaded intermediate steps (shortest maturity)
  const preloadedFatorDi = shortestPoint
    ? Math.pow(1 + shortestPoint.taxaDi / 100, shortestPoint.prazoDu / 252)
    : 0;
  const preloadedRazaoCambio =
    shortestPoint && ptaxForDate !== 0 ? shortestPoint.dolarFuturo / ptaxForDate : 0;
  const preloadedFatorCupom =
    preloadedRazaoCambio !== 0 ? preloadedFatorDi / preloadedRazaoCambio : 0;

  // Active values
  const activeCupom = modo === "manual" ? manualCupom : preloadedCupom;
  const activeSofr = modo === "manual" ? sofrManual : SOFR_REF;
  const activeSpreadBps = modo === "manual" ? manualSpreadBps : preloadedSpreadBps;
  const activeFwdPoints = modo === "manual" ? manualFwdPoints : preloadedFwdPoints;

  const activeFatorDi = modo === "manual" ? manualFatorDi : preloadedFatorDi;
  const activeRazaoCambio = modo === "manual" ? manualRazaoCambio : preloadedRazaoCambio;
  const activeFatorCupom = modo === "manual" ? manualFatorCupom : preloadedFatorCupom;
  const activeDc = modo === "manual" ? dcManual : (shortestPoint?.dc ?? 0);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-xl">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">school</span>
          Conceito — Cupom Cambial (Paridade Coberta de Juros)
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            <strong className="text-on-surface">Paridade Coberta de Juros (CIP):</strong>
          </p>
          <div className="text-center">
            <KMath
              tex="(1 + i_{BRL})^{DU/252} = (1 + cupom \times DC/360) \times \frac{F}{S}"
              display
            />
          </div>
          <p>
            <strong className="text-on-surface">Cupom cambial isolado:</strong>
          </p>
          <div className="text-center">
            <KMath
              tex="cupom = \left[\frac{(1 + i_{DI})^{DU/252}}{F/S} - 1\right] \times \frac{360}{DC}"
              display
            />
          </div>
          <ul className="space-y-1 list-disc pl-5">
            <li>
              <strong className="text-on-surface">Convencao DC/360:</strong> o cupom cambial usa dias
              corridos sobre 360 (convencao linear), diferente da taxa DI que usa DU/252 (composta).
            </li>
            <li>
              <strong className="text-on-surface">Cupom != SOFR:</strong> o cupom cambial reflete
              condicoes <em>onshore</em> — risco-pais, demanda por hedge cambial e fluxo de capitais.
              Nao e equivalente a taxa de juros americana (SOFR).
            </li>
            <li>
              <strong className="text-on-surface">Aplicacao:</strong> o spread entre cupom e SOFR
              captura o custo adicional do hedge cambial no mercado brasileiro, influenciado por CDS,
              fluxo comercial e demanda institucional por protecao.
            </li>
          </ul>
        </div>
      </details>

      {/* Mode toggle + inputs */}
      <div className="glass-card rounded-xl p-5 space-y-5">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">calculate</span>
          Calculadora de Cupom Cambial
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setModo("manual")}
            className={`px-4 py-2 text-sm font-headline font-bold rounded-lg transition-colors cursor-pointer ${
              modo === "manual"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-white/[0.04] text-on-surface-variant border border-transparent hover:border-white/10"
            }`}
          >
            Inserir manualmente
          </button>
          <button
            onClick={() => setModo("preloaded")}
            className={`px-4 py-2 text-sm font-headline font-bold rounded-lg transition-colors cursor-pointer ${
              modo === "preloaded"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-white/[0.04] text-on-surface-variant border border-transparent hover:border-white/10"
            }`}
          >
            Dados pre-carregados
          </button>
        </div>

        {modo === "manual" && (
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Dolar spot PTAX (R$/US$)
                </label>
                <input
                  type="number"
                  value={dolarSpotManual}
                  step={0.01}
                  onChange={(e) => setDolarSpotManual(Number(e.target.value))}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Dolar futuro (R$/US$)
                </label>
                <input
                  type="number"
                  value={dolarFuturoManual}
                  step={0.01}
                  onChange={(e) => setDolarFuturoManual(Number(e.target.value))}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Taxa DI (% a.a.)
                </label>
                <input
                  type="number"
                  value={taxaDiManual}
                  step={0.1}
                  onChange={(e) => setTaxaDiManual(Number(e.target.value))}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            {/* Right column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Dias uteis (DU)
                </label>
                <input
                  type="number"
                  value={duManual}
                  step={1}
                  onChange={(e) => setDuManual(Number(e.target.value))}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Dias corridos (DC)
                </label>
                <input
                  type="number"
                  value={dcManual}
                  step={1}
                  onChange={(e) => setDcManual(Number(e.target.value))}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  SOFR referencia (% a.a.)
                </label>
                <input
                  type="number"
                  value={sofrManual}
                  step={0.25}
                  onChange={(e) => setSofrManual(Number(e.target.value))}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>
        )}

        {modo === "preloaded" &&
          (loading ? (
            <p className="text-sm text-on-surface-variant">Carregando dados...</p>
          ) : availableDates.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              Nenhuma data disponivel nos datasets.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Data de referencia
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  PTAX (R$/US$)
                </label>
                <p className="text-sm font-headline font-bold mt-1">
                  {fmtNum(ptaxForDate)}
                </p>
              </div>
            </div>
          ))}
      </div>

      {/* Metric cards */}
      {(modo === "manual" || (modo === "preloaded" && merged.length > 0)) && (
        <>
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="glass-card rounded-lg p-4 text-center">
              <span className="text-xs font-label text-on-surface-variant">
                Cupom implicito (% a.a.)
              </span>
              <p
                className="text-2xl font-headline font-bold mt-1"
                style={{ color: COLOR_CUPOM }}
              >
                {fmtPct(activeCupom)}
              </p>
            </div>
            <div className="glass-card rounded-lg p-4 text-center">
              <span className="text-xs font-label text-on-surface-variant">
                SOFR referencia
              </span>
              <p className="text-2xl font-headline font-bold mt-1">
                {fmtPct(activeSofr)}
              </p>
            </div>
            <div className="glass-card rounded-lg p-4 text-center">
              <span className="text-xs font-label text-on-surface-variant">
                Spread cupom-SOFR (bps)
              </span>
              <p
                className={`text-2xl font-headline font-bold mt-1 ${getSpreadColor(activeSpreadBps)}`}
              >
                {activeSpreadBps >= 0 ? "+" : ""}
                {activeSpreadBps.toFixed(0)} bps
              </p>
            </div>
            <div className="glass-card rounded-lg p-4 text-center">
              <span className="text-xs font-label text-on-surface-variant">
                Forward points (F-S)
              </span>
              <p className="text-2xl font-headline font-bold mt-1">
                R$ {fmtNum(activeFwdPoints)}
              </p>
            </div>
          </div>

          {/* Step-by-step calculation */}
          <details className="glass-card rounded-xl">
            <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-primary text-base">functions</span>
              Calculo passo a passo
            </summary>
            <div className="px-5 pb-5 space-y-3 text-sm text-on-surface-variant">
              <div className="glass-card rounded-lg p-3 space-y-2">
                <p>
                  <strong className="text-on-surface">1. Fator DI:</strong>
                </p>
                <div className="text-center">
                  <KMath
                    tex={`(1 + ${modo === "manual" ? (taxaDiManual / 100).toFixed(4) : ((shortestPoint?.taxaDi ?? 0) / 100).toFixed(4)})^{${modo === "manual" ? duManual : (shortestPoint?.prazoDu ?? 0)}/252} = ${activeFatorDi.toFixed(6)}`}
                    display
                  />
                </div>
              </div>
              <div className="glass-card rounded-lg p-3 space-y-2">
                <p>
                  <strong className="text-on-surface">2. Razao cambio (F/S):</strong>
                </p>
                <div className="text-center">
                  <KMath
                    tex={`\\frac{F}{S} = \\frac{${modo === "manual" ? dolarFuturoManual.toFixed(4) : (shortestPoint?.dolarFuturo ?? 0).toFixed(4)}}{${modo === "manual" ? dolarSpotManual.toFixed(4) : ptaxForDate.toFixed(4)}} = ${activeRazaoCambio.toFixed(6)}`}
                    display
                  />
                </div>
              </div>
              <div className="glass-card rounded-lg p-3 space-y-2">
                <p>
                  <strong className="text-on-surface">3. Fator cupom:</strong>
                </p>
                <div className="text-center">
                  <KMath
                    tex={`\\frac{Fator\\ DI}{F/S} = \\frac{${activeFatorDi.toFixed(6)}}{${activeRazaoCambio.toFixed(6)}} = ${activeFatorCupom.toFixed(6)}`}
                    display
                  />
                </div>
              </div>
              <div className="glass-card rounded-lg p-3 space-y-2">
                <p>
                  <strong className="text-on-surface">4. Cupom cambial (linear):</strong>
                </p>
                <div className="text-center">
                  <KMath
                    tex={`(${activeFatorCupom.toFixed(6)} - 1) \\times \\frac{360}{${activeDc}} = ${(activeCupom / 100).toFixed(6)} = ${fmtPct(activeCupom).replace("%", "\\%")}\\ \\text{a.a.}`}
                    display
                  />
                </div>
              </div>
            </div>
          </details>
        </>
      )}

      {/* Chart — preloaded only */}
      {modo === "preloaded" && merged.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <PlotlyChart
            className="h-[400px]"
            data={[
              {
                type: "bar" as const,
                x: merged.map((m) => `${m.prazoDu} DU`),
                y: merged.map((m) => m.cupomAa),
                name: "Cupom Cambial",
                marker: { color: COLOR_CUPOM, opacity: 0.8 },
                hovertemplate:
                  "Prazo: %{x}<br>Cupom: %{y:.2f}%<extra></extra>",
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              title: {
                text: "Cupom Cambial Implicito por Prazo",
                font: { color: "#aaabb0", size: 14 },
              },
              xaxis: {
                ...PLOTLY_LAYOUT.xaxis,
                title: { text: "Prazo" },
              },
              yaxis: {
                ...PLOTLY_LAYOUT.yaxis,
                title: { text: "Cupom (% a.a.)" },
                ticksuffix: "%",
              },
              shapes: [
                {
                  type: "line",
                  x0: -0.5,
                  x1: merged.length - 0.5,
                  y0: SOFR_REF,
                  y1: SOFR_REF,
                  line: { color: "#888", width: 1.5, dash: "dash" },
                },
              ],
              annotations: [
                {
                  x: merged.length - 0.8,
                  y: SOFR_REF,
                  text: `SOFR: ${SOFR_REF.toFixed(1)}%`,
                  showarrow: false,
                  font: { size: 10, color: "#888" },
                  yshift: 12,
                },
              ],
              showlegend: false,
              margin: { l: 60, r: 30, t: 60, b: 50 },
            }}
            config={PLOTLY_CONFIG}
          />
        </div>
      )}

      {/* Data table — preloaded only */}
      {modo === "preloaded" && merged.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container">
                <th className="text-left px-4 py-3 font-label text-on-surface-variant">
                  Prazo (DU)
                </th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">DC</th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                  DI (%)
                </th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                  Dolar Futuro
                </th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                  Cupom (% a.a.)
                </th>
              </tr>
            </thead>
            <tbody>
              {merged.map((m, i) => (
                <tr
                  key={m.prazoDu}
                  className={`border-b border-outline-variant/20 ${
                    i === 0
                      ? "bg-primary/5 font-bold"
                      : i % 2 === 0
                        ? "bg-surface-container/40"
                        : ""
                  }`}
                >
                  <td className="px-4 py-2 font-label">{m.prazoDu}</td>
                  <td className="px-4 py-2 text-right">{m.dc}</td>
                  <td className="px-4 py-2 text-right">{fmtPct(m.taxaDi)}</td>
                  <td className="px-4 py-2 text-right">{fmtNum(m.dolarFuturo)}</td>
                  <td
                    className="px-4 py-2 text-right font-headline font-bold"
                    style={{ color: COLOR_CUPOM }}
                  >
                    {fmtPct(m.cupomAa)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-[#059669]">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">O cupom cambial e o &quot;preco&quot; do hedge cambial.</strong>{" "}
          Quando uma tesouraria precisa proteger uma posicao em dolares, o custo dessa protecao
          e determinado pelo cupom cambial implicito no mercado de derivativos. Um cupom elevado
          em relacao ao SOFR indica que o custo de hedge esta caro — reflexo de demanda por
          protecao, percepcao de risco-pais ou restricoes de fluxo de capitais. Para decisoes
          de ALM e gestao de descasamento cambial, o diferencial cupom-SOFR e a metrica central.
        </p>
      </div>
    </div>
  );
}
