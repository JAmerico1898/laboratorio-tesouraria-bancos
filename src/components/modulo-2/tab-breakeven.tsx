"use client";

import { useState, useEffect, useMemo } from "react";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { calcularBreakeven } from "@/lib/finance";
import {
  loadCurvasDi,
  loadNtnbTaxas,
  loadFocusIpca,
  META_INFLACAO,
  type CurvaDiPoint,
  type NtnbTaxaPoint,
  type FocusIpcaPoint,
} from "@/lib/data";
import { fmtPct } from "@/lib/format";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const COLOR_BREAKEVEN = "#8B5CF6";

interface MergedPoint {
  prazoDu: number;
  prazoAnos: number;
  di: number;
  ntnb: number;
  breakeven: number;
}

function getDiffColor(diff: number): string {
  const abs = Math.abs(diff);
  if (abs < 0.3) return "text-[#2E8B57]";
  if (diff > 0.8) return "text-[#CC3333]";
  return "text-[#D4A012]";
}

function getInterpretation(diff: number): { text: string; borderColor: string } {
  if (Math.abs(diff) < 0.3) {
    return {
      text: "Inflação implícita alinhada com o consenso Focus. Prêmio de risco de inflação neutro.",
      borderColor: "border-[#2E8B57]",
    };
  }
  if (diff > 0.8) {
    return {
      text: "Breakeven significativamente acima do Focus — prêmio de risco inflacionário elevado. O mercado exige compensação adicional pela incerteza inflacionária.",
      borderColor: "border-[#CC3333]",
    };
  }
  if (diff > 0) {
    return {
      text: "Breakeven acima do Focus — possível prêmio de risco de inflação. O mercado precifica inflação ligeiramente acima do consenso.",
      borderColor: "border-[#D4A012]",
    };
  }
  return {
    text: "Breakeven abaixo do Focus — pode indicar forte demanda por proteção inflacionária (NTN-B) ou expectativa de desaceleração econômica.",
    borderColor: "border-[#2E75B6]",
  };
}

export function TabBreakeven() {
  const [modo, setModo] = useState<"preloaded" | "manual">("manual");

  // Manual mode state
  const [txLtn, setTxLtn] = useState(12.80);
  const [txNtnb, setTxNtnb] = useState(6.50);
  const [focusManual, setFocusManual] = useState(4.50);

  // Preloaded mode state
  const [diData, setDiData] = useState<CurvaDiPoint[]>([]);
  const [ntnbData, setNtnbData] = useState<NtnbTaxaPoint[]>([]);
  const [focusData, setFocusData] = useState<FocusIpcaPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPrazoDu, setSelectedPrazoDu] = useState(0);

  // Load preloaded data on mode switch
  useEffect(() => {
    if (modo !== "preloaded") return;
    setLoading(true);
    Promise.all([loadCurvasDi(), loadNtnbTaxas(), loadFocusIpca()])
      .then(([di, ntnb, focus]) => {
        setDiData(di);
        setNtnbData(ntnb);
        setFocusData(focus);
        const dates = [...new Set(di.map((d) => d.data))].sort();
        if (dates.length > 0) setSelectedDate(dates[dates.length - 1]);
      })
      .finally(() => setLoading(false));
  }, [modo]);

  // Available dates
  const availableDates = useMemo(() => {
    return [...new Set(diData.map((d) => d.data))].sort();
  }, [diData]);

  // Merged data for selected date
  const merged = useMemo((): MergedPoint[] => {
    if (!selectedDate) return [];
    const diForDate = diData.filter((d) => d.data === selectedDate);
    const ntnbForDate = ntnbData.filter((d) => d.data === selectedDate);
    const result: MergedPoint[] = [];
    for (const nb of ntnbForDate) {
      const di = diForDate.find((d) => d.prazoDu === nb.prazoDu);
      if (di) {
        const be = calcularBreakeven(di.taxa, nb.taxa) * 100;
        result.push({
          prazoDu: nb.prazoDu,
          prazoAnos: Math.round((nb.prazoDu / 252) * 10) / 10,
          di: di.taxa * 100,
          ntnb: nb.taxa * 100,
          breakeven: be,
        });
      }
    }
    return result.sort((a, b) => a.prazoDu - b.prazoDu);
  }, [selectedDate, diData, ntnbData]);

  // Set default prazo when merged changes
  useEffect(() => {
    if (merged.length > 0 && (selectedPrazoDu === 0 || !merged.find((m) => m.prazoDu === selectedPrazoDu))) {
      setSelectedPrazoDu(merged[0].prazoDu);
    }
  }, [merged, selectedPrazoDu]);

  // Focus value for selected date
  const focusValue = useMemo(() => {
    if (focusData.length === 0) return META_INFLACAO;
    const ipca12m = focusData
      .filter((f) => f.variavel === "IPCA_12m")
      .sort((a, b) => a.dataColeta.localeCompare(b.dataColeta));
    if (ipca12m.length === 0) return META_INFLACAO;
    const beforeDate = ipca12m.filter((f) => f.dataColeta <= selectedDate);
    if (beforeDate.length > 0) return beforeDate[beforeDate.length - 1].mediana;
    return ipca12m[ipca12m.length - 1].mediana;
  }, [focusData, selectedDate]);

  // Manual mode breakeven
  const manualBe = calcularBreakeven(txLtn / 100, txNtnb / 100) * 100;
  const manualDiff = manualBe - focusManual;

  // Preloaded selected point
  const selectedPoint = merged.find((m) => m.prazoDu === selectedPrazoDu);
  const preloadedBe = selectedPoint?.breakeven ?? 0;
  const preloadedDiff = preloadedBe - focusValue;

  // Active values
  const activeBe = modo === "manual" ? manualBe : preloadedBe;
  const activeFocus = modo === "manual" ? focusManual : focusValue;
  const activeDiff = modo === "manual" ? manualDiff : preloadedDiff;
  const interp = getInterpretation(activeDiff);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-xl">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">school</span>
          Conceito — Inflação Implícita (Breakeven)
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p><strong className="text-on-surface">Relação de Fisher:</strong></p>
          <div className="text-center">
            <KMath tex={"(1 + i_{nominal}) = (1 + i_{real}) \\times (1 + \\pi^{\\text{implícita}})"} display />
          </div>
          <div className="text-center">
            <KMath tex={"\\pi^{\\text{implícita}} = \\frac{1 + i_{LTN}}{1 + i_{NTN\\text{-}B}} - 1"} display />
          </div>
          <p>
            A inflação implícita <strong className="text-on-surface">não</strong> é igual à
            expectativa de inflação pura — ela inclui um prêmio de risco de inflação. Se breakeven
            &gt; Focus, pode significar que o mercado exige prêmio adicional pela incerteza
            inflacionária.
          </p>
        </div>
      </details>

      {/* Mode toggle + inputs */}
      <div className="glass-card rounded-xl p-5 space-y-5">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">calculate</span>
          Calculadora de Inflação Implícita
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
            Dados pré-carregados
          </button>
        </div>

        {modo === "manual" && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">Taxa LTN — prefixado (% a.a.)</label>
              <input type="number" value={txLtn} step={0.05} onChange={(e) => setTxLtn(Number(e.target.value))} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">Taxa NTN-B — IPCA+ (% a.a.)</label>
              <input type="number" value={txNtnb} step={0.05} onChange={(e) => setTxNtnb(Number(e.target.value))} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">Expectativa Focus — IPCA (% a.a.)</label>
              <input type="number" value={focusManual} step={0.1} onChange={(e) => setFocusManual(Number(e.target.value))} className={INPUT_CLASS} />
            </div>
          </div>
        )}

        {modo === "preloaded" && (
          loading ? (
            <p className="text-sm text-on-surface-variant">Carregando dados...</p>
          ) : availableDates.length === 0 ? (
            <p className="text-sm text-on-surface-variant">📂 Nenhuma data disponível nos datasets.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">Data de referência</label>
                <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={INPUT_CLASS}>
                  {availableDates.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">Prazo</label>
                <select value={selectedPrazoDu} onChange={(e) => setSelectedPrazoDu(Number(e.target.value))} className={INPUT_CLASS}>
                  {merged.map((m) => (<option key={m.prazoDu} value={m.prazoDu}>{m.prazoAnos} ano(s) ({m.prazoDu} DU)</option>))}
                </select>
              </div>
            </div>
          )
        )}
      </div>

      {/* Metrics + interpretation */}
      {(modo === "manual" || (modo === "preloaded" && merged.length > 0)) && (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="glass-card rounded-lg p-4 text-center">
              <span className="text-xs font-label text-on-surface-variant">Breakeven (inflação implícita)</span>
              <p className="text-2xl font-headline font-bold mt-1" style={{ color: COLOR_BREAKEVEN }}>{fmtPct(activeBe)}</p>
            </div>
            <div className="glass-card rounded-lg p-4 text-center">
              <span className="text-xs font-label text-on-surface-variant">Focus IPCA</span>
              <p className="text-2xl font-headline font-bold mt-1">{fmtPct(activeFocus)}</p>
            </div>
            <div className="glass-card rounded-lg p-4 text-center">
              <span className="text-xs font-label text-on-surface-variant">Diferença</span>
              <p className={`text-2xl font-headline font-bold mt-1 ${getDiffColor(activeDiff)}`}>
                {activeDiff >= 0 ? "+" : ""}{fmtPct(activeDiff)} pp
              </p>
            </div>
          </div>

          <div className={`glass-card rounded-lg p-4 border-l-4 ${interp.borderColor}`}>
            <p className="text-sm text-on-surface-variant">{interp.text}</p>
            <p className="text-sm text-on-surface-variant mt-2">
              <strong className="text-on-surface">Implicação para a tesouraria:</strong> Se você
              acredita que a inflação ficará <strong>abaixo</strong> do breakeven, prefixados
              oferecem melhor retorno. Se acredita que ficará <strong>acima</strong>, indexados
              (IPCA+) são mais atrativos.
            </p>
          </div>
        </>
      )}

      {/* Bar chart — preloaded only */}
      {modo === "preloaded" && merged.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <PlotlyChart
            className="h-[400px]"
            data={[{
              type: "bar" as const,
              x: merged.map((m) => `${m.prazoAnos}A`),
              y: merged.map((m) => m.breakeven),
              name: "Breakeven",
              marker: { color: COLOR_BREAKEVEN, opacity: 0.8 },
              hovertemplate: "Prazo: %{x}<br>Breakeven: %{y:.2f}%<extra></extra>",
            }]}
            layout={{
              ...PLOTLY_LAYOUT,
              title: { text: "Inflação Implícita por Prazo", font: { color: "#aaabb0", size: 14 } },
              xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: "Prazo" } },
              yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "Breakeven (% a.a.)" }, ticksuffix: "%" },
              shapes: [
                { type: "line", x0: -0.5, x1: merged.length - 0.5, y0: focusValue, y1: focusValue, line: { color: "#888", width: 1.5, dash: "dash" } },
                { type: "line", x0: -0.5, x1: merged.length - 0.5, y0: META_INFLACAO, y1: META_INFLACAO, line: { color: "#666", width: 1, dash: "dot" } },
              ],
              annotations: [
                { x: merged.length - 0.8, y: focusValue, text: `Focus: ${focusValue.toFixed(1)}%`, showarrow: false, font: { size: 10, color: "#888" }, yshift: 12 },
                { x: merged.length - 0.8, y: META_INFLACAO, text: `Meta: ${META_INFLACAO}%`, showarrow: false, font: { size: 10, color: "#666" }, yshift: -12 },
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
                <th className="text-left px-4 py-3 font-label text-on-surface-variant">Prazo (anos)</th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">DI (%)</th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">NTN-B (%)</th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">Breakeven (%)</th>
              </tr>
            </thead>
            <tbody>
              {merged.map((m, i) => (
                <tr key={m.prazoDu} className={`border-b border-outline-variant/20 ${m.prazoDu === selectedPrazoDu ? "bg-primary/5 font-bold" : i % 2 === 0 ? "bg-surface-container/40" : ""}`}>
                  <td className="px-4 py-2 font-label">{m.prazoAnos}</td>
                  <td className="px-4 py-2 text-right">{fmtPct(m.di)}</td>
                  <td className="px-4 py-2 text-right">{fmtPct(m.ntnb)}</td>
                  <td className="px-4 py-2 text-right font-headline font-bold" style={{ color: COLOR_BREAKEVEN }}>{fmtPct(m.breakeven)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Historical — graceful empty state */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-headline font-bold text-sm mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">timeline</span>
          Evolução Histórica da Inflação Implícita
        </h3>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary/50">
          <p className="text-sm text-on-surface-variant">
            📊 Evolução histórica ficará disponível quando houver múltiplas datas nos datasets de
            curvas DI e NTN-B. Atualmente os dados contêm apenas uma data de referência.
          </p>
        </div>
      </div>
    </div>
  );
}
