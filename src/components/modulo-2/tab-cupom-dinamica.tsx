"use client";

import { useState, useEffect, useMemo } from "react";
import { PlotlyChart } from "@/components/plotly-chart";
import { loadCupomHist, type CupomHistPoint } from "@/lib/data";
import { fmtPct, fmtBrl } from "@/lib/format";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const COLOR_CUPOM = "#059669";
const COLOR_SEM_HEDGE = "#C55A11";
const COLOR_NEGATIVE = "#CC3333";
const SOFR_REF = 5.0;

const STRESS_EVENTS: { x: string; text: string }[] = [
  { x: "2020-03-15", text: "COVID-19" },
  { x: "2022-12-28", text: "Virada 2022" },
];

export function TabCupomDinamica() {
  // --- Section 1: Historical data ---
  const [cupomHist, setCupomHist] = useState<CupomHistPoint[]>([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const [selectedPrazo, setSelectedPrazo] = useState<number>(0);

  useEffect(() => {
    setLoadingHist(true);
    loadCupomHist()
      .then((data) => {
        setCupomHist(data);
        const prazos = [...new Set(data.map((d) => d.prazoMeses))].sort(
          (a, b) => a - b
        );
        if (prazos.length > 0 && selectedPrazo === 0) {
          setSelectedPrazo(prazos[0]);
        }
      })
      .finally(() => setLoadingHist(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availablePrazos = useMemo(() => {
    return [...new Set(cupomHist.map((d) => d.prazoMeses))].sort(
      (a, b) => a - b
    );
  }, [cupomHist]);

  const filteredHist = useMemo(() => {
    if (selectedPrazo === 0) return [];
    return cupomHist
      .filter((d) => d.prazoMeses === selectedPrazo)
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [cupomHist, selectedPrazo]);

  // --- Section 2: Hedge Simulator ---
  const [posUsd, setPosUsd] = useState(5_000_000);
  const [spot, setSpot] = useState(5.45);
  const [cupom, setCupom] = useState(5.5);
  const [rendUsd, setRendUsd] = useState(5.0);
  const [prazo, setPrazo] = useState(6);
  const [varCambial, setVarCambial] = useState(5);

  const hedgeCalc = useMemo(() => {
    const fracAno = prazo / 12;
    const posBrl = posUsd * spot;

    // Com hedge: rendimento fixo menos custo do cupom
    const rendHedge = (posUsd * (rendUsd - cupom) / 100) * fracAno * spot;

    // Sem hedge: rendimento + exposicao cambial
    const dolFinal = spot * (1 + varCambial / 100);
    const valFinalSem = posUsd * (1 + (rendUsd / 100) * fracAno) * dolFinal;
    const rendSem = valFinalSem - posBrl;

    return { fracAno, posBrl, rendHedge, rendSem, dolFinal };
  }, [posUsd, spot, cupom, rendUsd, prazo, varCambial]);

  // Sensitivity data: 100 points from -20% to +20%
  const sensitivity = useMemo(() => {
    const fracAno = prazo / 12;
    const posBrl = posUsd * spot;
    const rendHedge = (posUsd * (rendUsd - cupom) / 100) * fracAno * spot;

    const points: { var_pct: number; rendSem: number }[] = [];
    for (let i = 0; i <= 100; i++) {
      const v = -20 + (40 * i) / 100;
      const dolF = spot * (1 + v / 100);
      const valF = posUsd * (1 + (rendUsd / 100) * fracAno) * dolF;
      points.push({ var_pct: v, rendSem: valF - posBrl });
    }

    // Indifference point: where rendSem crosses rendHedge
    let indiffPct: number | null = null;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1].rendSem - rendHedge;
      const curr = points[i].rendSem - rendHedge;
      if (prev * curr <= 0) {
        // Linear interpolation
        const t = Math.abs(prev) / (Math.abs(prev) + Math.abs(curr));
        indiffPct = points[i - 1].var_pct + t * (points[i].var_pct - points[i - 1].var_pct);
        break;
      }
    }

    return { points, rendHedge, indiffPct };
  }, [posUsd, spot, cupom, rendUsd, prazo]);

  // Simulated point for the sensitivity chart
  const simRendSem = hedgeCalc.rendSem;

  return (
    <div className="space-y-8">
      {/* ===== Section 1: Historical Evolution ===== */}
      <div className="glass-card rounded-xl p-5 space-y-5">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">
            timeline
          </span>
          Evolucao Historica do Cupom Cambial
        </h2>

        {loadingHist ? (
          <p className="text-sm text-on-surface-variant">
            Carregando dados historicos...
          </p>
        ) : cupomHist.length === 0 ? (
          <div className="glass-card rounded-lg p-4 border-l-4 border-primary/50">
            <p className="text-sm text-on-surface-variant">
              Dados historicos nao disponiveis.
            </p>
          </div>
        ) : (
          <>
            {/* Tenor selector */}
            <div className="max-w-xs">
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Prazo (tenor)
              </label>
              <select
                value={selectedPrazo}
                onChange={(e) => setSelectedPrazo(Number(e.target.value))}
                className={INPUT_CLASS}
              >
                {availablePrazos.map((p) => (
                  <option key={p} value={p}>
                    {p} meses
                  </option>
                ))}
              </select>
            </div>

            {/* Historical chart */}
            {filteredHist.length > 0 && (
              <PlotlyChart
                className="h-[400px]"
                data={[
                  {
                    type: "scatter" as const,
                    mode: "lines" as const,
                    x: filteredHist.map((d) => d.data),
                    y: filteredHist.map((d) => d.cupomAa),
                    name: "Cupom Cambial",
                    line: { color: COLOR_CUPOM, width: 2.5 },
                    hovertemplate:
                      "Data: %{x}<br>Cupom: %{y:.2f}% a.a.<extra></extra>",
                  },
                ]}
                layout={{
                  ...PLOTLY_LAYOUT,
                  title: {
                    text: `Cupom Cambial — ${selectedPrazo} meses`,
                    font: { color: "#aaabb0", size: 14 },
                  },
                  xaxis: {
                    ...PLOTLY_LAYOUT.xaxis,
                    title: { text: "Data" },
                  },
                  yaxis: {
                    ...PLOTLY_LAYOUT.yaxis,
                    title: { text: "Cupom (% a.a.)" },
                    ticksuffix: "%",
                  },
                  hovermode: "x unified" as const,
                  shapes: [
                    {
                      type: "line",
                      x0: filteredHist[0].data,
                      x1: filteredHist[filteredHist.length - 1].data,
                      y0: SOFR_REF,
                      y1: SOFR_REF,
                      line: { color: "#888", width: 1.5, dash: "dash" },
                    },
                  ],
                  annotations: [
                    {
                      x: filteredHist[filteredHist.length - 1].data,
                      y: SOFR_REF,
                      text: `SOFR: ${SOFR_REF.toFixed(1)}%`,
                      showarrow: false,
                      font: { size: 10, color: "#888" },
                      yshift: 14,
                      xanchor: "right" as const,
                    },
                    ...STRESS_EVENTS.map((ev) => ({
                      x: ev.x,
                      y:
                        filteredHist.find((d) => d.data >= ev.x)?.cupomAa ??
                        SOFR_REF,
                      text: ev.text,
                      showarrow: true,
                      arrowhead: 2,
                      arrowsize: 0.8,
                      arrowcolor: "#888",
                      font: { size: 10, color: "#aaabb0" },
                      bgcolor: "rgba(12,14,18,0.8)",
                      bordercolor: "#888",
                      borderwidth: 1,
                      borderpad: 3,
                      ay: -40,
                    })),
                  ],
                  showlegend: false,
                  margin: { l: 60, r: 30, t: 60, b: 50 },
                }}
                config={PLOTLY_CONFIG}
              />
            )}
          </>
        )}

        {/* Pedagogical note */}
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
          <p className="text-sm text-on-surface-variant">
            O cupom cambial e um termometro da demanda por dolar no mercado
            domestico. Picos sinalizam escassez de dolar ou demanda excessiva por
            hedge. Vales (ou cupom negativo) indicam excesso de oferta. O BCB
            frequentemente intervem via swaps cambiais quando o cupom se descola.
          </p>
        </div>
      </div>

      {/* ===== Section 2: Hedge Decision Simulator ===== */}
      <div className="glass-card rounded-xl p-5 space-y-5">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">
            shield
          </span>
          Simulador de Decisao — Hedge Cambial
        </h2>

        {/* Input grid */}
        <div className="glass-card rounded-lg p-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Posicao em USD
                </label>
                <input
                  type="number"
                  value={posUsd}
                  step={500_000}
                  onChange={(e) => setPosUsd(Number(e.target.value))}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Dolar spot (R$/US$)
                </label>
                <input
                  type="number"
                  value={spot}
                  step={0.01}
                  onChange={(e) => setSpot(Number(e.target.value))}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Cupom cambial (% a.a.)
                </label>
                <input
                  type="number"
                  value={cupom}
                  step={0.25}
                  onChange={(e) => setCupom(Number(e.target.value))}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Rendimento ativo USD (% a.a.)
                </label>
                <input
                  type="number"
                  value={rendUsd}
                  step={0.25}
                  onChange={(e) => setRendUsd(Number(e.target.value))}
                  className={INPUT_CLASS}
                />
                <span className="text-[10px] text-on-surface-variant/60 mt-0.5 block">
                  Ex.: SOFR + spread
                </span>
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Prazo (meses): {prazo}
                </label>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={prazo}
                  onChange={(e) => setPrazo(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant/60">
                  <span>1</span>
                  <span>12</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Variacao cambial simulada (%): {varCambial > 0 ? "+" : ""}
                  {varCambial}%
                </label>
                <input
                  type="range"
                  min={-20}
                  max={20}
                  step={1}
                  value={varCambial}
                  onChange={(e) => setVarCambial(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant/60">
                  <span>-20%</span>
                  <span>+20%</span>
                </div>
                <span className="text-[10px] text-on-surface-variant/60 mt-0.5 block">
                  Positivo = depreciacao do real
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-side results */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-card rounded-lg p-5 text-center">
            <span className="text-xs font-label text-on-surface-variant">
              Com hedge
            </span>
            <p
              className="text-2xl font-headline font-bold mt-2"
              style={{ color: COLOR_CUPOM }}
            >
              {fmtBrl(hedgeCalc.rendHedge)}
            </p>
            <p className="text-[11px] text-on-surface-variant/70 mt-1">
              Resultado fixo, independente do cambio
            </p>
          </div>
          <div className="glass-card rounded-lg p-5 text-center">
            <span className="text-xs font-label text-on-surface-variant">
              Sem hedge (exposicao aberta)
            </span>
            <p
              className="text-2xl font-headline font-bold mt-2"
              style={{ color: COLOR_SEM_HEDGE }}
            >
              {fmtBrl(hedgeCalc.rendSem)}
            </p>
            <p className="text-[11px] text-on-surface-variant/70 mt-1">
              Cambio final: R${" "}
              {hedgeCalc.dolFinal.toFixed(4).replace(".", ",")}
            </p>
          </div>
        </div>

        {/* Comparison box */}
        {(() => {
          const diff = hedgeCalc.rendSem - hedgeCalc.rendHedge;
          const isNoHedgeBetter = diff > 0;
          return (
            <div
              className={`glass-card rounded-lg p-4 border-l-4 ${
                isNoHedgeBetter
                  ? "border-[#2E8B57]"
                  : "border-[#CC3333]"
              }`}
            >
              <p className="text-sm text-on-surface-variant">
                {isNoHedgeBetter ? (
                  <>
                    Neste cenario, <strong className="text-[#2E8B57]">nao hedgear</strong> gera{" "}
                    <strong className="text-[#2E8B57]">{fmtBrl(Math.abs(diff))}</strong> a mais.
                  </>
                ) : (
                  <>
                    Neste cenario, o <strong className="text-[#CC3333]">hedge protege</strong>{" "}
                    <strong className="text-[#CC3333]">{fmtBrl(Math.abs(diff))}</strong>.
                  </>
                )}
              </p>
            </div>
          );
        })()}

        {/* Sensitivity chart */}
        <PlotlyChart
          className="h-[400px]"
          data={[
            // Com hedge — horizontal line
            {
              type: "scatter" as const,
              mode: "lines" as const,
              x: sensitivity.points.map((p) => p.var_pct),
              y: sensitivity.points.map(() => sensitivity.rendHedge),
              name: "Com hedge",
              line: { color: COLOR_CUPOM, width: 2.5 },
              hovertemplate:
                "Var: %{x:.1f}%<br>Resultado: R$ %{y:,.0f}<extra>Com hedge</extra>",
            },
            // Sem hedge — sloped line
            {
              type: "scatter" as const,
              mode: "lines" as const,
              x: sensitivity.points.map((p) => p.var_pct),
              y: sensitivity.points.map((p) => p.rendSem),
              name: "Sem hedge",
              line: { color: COLOR_SEM_HEDGE, width: 2.5 },
              hovertemplate:
                "Var: %{x:.1f}%<br>Resultado: R$ %{y:,.0f}<extra>Sem hedge</extra>",
            },
            // Simulated point
            {
              type: "scatter" as const,
              mode: "markers" as const,
              x: [varCambial],
              y: [simRendSem],
              name: "Cenario simulado",
              marker: {
                color: COLOR_NEGATIVE,
                size: 12,
                symbol: "diamond",
              },
              hovertemplate:
                "Var: %{x:.1f}%<br>Resultado: R$ %{y:,.0f}<extra>Simulado</extra>",
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            title: {
              text: "Sensibilidade: Hedge vs. Exposicao Aberta",
              font: { color: "#aaabb0", size: 14 },
            },
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "Variacao cambial (%)" },
              ticksuffix: "%",
            },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "Resultado (R$)" },
            },
            hovermode: "x unified" as const,
            shapes: [
              // Zero line
              {
                type: "line",
                x0: -20,
                x1: 20,
                y0: 0,
                y1: 0,
                line: { color: "#888", width: 1, dash: "dot" as const },
              },
              // Indifference vertical line
              ...(sensitivity.indiffPct !== null
                ? [
                    {
                      type: "line" as const,
                      x0: sensitivity.indiffPct,
                      x1: sensitivity.indiffPct,
                      y0: Math.min(
                        sensitivity.rendHedge,
                        ...sensitivity.points.map((p) => p.rendSem)
                      ),
                      y1: Math.max(
                        sensitivity.rendHedge,
                        ...sensitivity.points.map((p) => p.rendSem)
                      ),
                      line: { color: "#888", width: 1.5, dash: "dash" as const },
                    },
                  ]
                : []),
            ],
            annotations: [
              ...(sensitivity.indiffPct !== null
                ? [
                    {
                      x: sensitivity.indiffPct,
                      y: sensitivity.rendHedge,
                      text: `Indiferenca: ${sensitivity.indiffPct.toFixed(1).replace(".", ",")}%`,
                      showarrow: true,
                      arrowhead: 2,
                      arrowsize: 0.8,
                      arrowcolor: "#888",
                      font: { size: 10, color: "#aaabb0" },
                      bgcolor: "rgba(12,14,18,0.8)",
                      bordercolor: "#888",
                      borderwidth: 1,
                      borderpad: 3,
                      ay: -35,
                    },
                  ]
                : []),
            ],
            showlegend: true,
            legend: {
              ...PLOTLY_LAYOUT.legend,
              orientation: "h" as const,
              y: -0.35,
              x: 0.5,
              xanchor: "center" as const,
            },
            margin: { l: 70, r: 30, t: 60, b: 100 },
          }}
          config={PLOTLY_CONFIG}
        />

        {/* Pedagogical note */}
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
          <p className="text-sm text-on-surface-variant">
            A decisão de hedge não é apenas sobre expectativa de câmbio — é sobre
            tolerância ao risco. Uma tesouraria com limites de VaR apertados pode
            preferir o hedge mesmo esperando depreciação.
          </p>
        </div>
      </div>
    </div>
  );
}
