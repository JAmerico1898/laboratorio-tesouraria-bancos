"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { calcularForwards, type ForwardPoint } from "@/lib/finance";
import { loadCurvasDi, loadSelicMeta, type CurvaDiPoint } from "@/lib/data";
import { fmtPct } from "@/lib/format";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

interface Vertex {
  label: string;
  du: number;
  rate: number;
}

const DEFAULT_VERTICES: Vertex[] = [
  { label: "3M", du: 63, rate: 14.25 },
  { label: "6M", du: 126, rate: 14.50 },
  { label: "1A", du: 252, rate: 14.80 },
  { label: "18M", du: 378, rate: 14.60 },
  { label: "2A", du: 504, rate: 14.30 },
  { label: "3A", du: 756, rate: 13.80 },
  { label: "5A", du: 1260, rate: 13.20 },
];

type ForwardPattern = "alta" | "queda" | "pico" | "mista";

function detectPattern(forwards: ForwardPoint[]): ForwardPattern {
  if (forwards.length < 2) return "mista";

  const fwds = forwards.map((f) => f.forwardAa);
  let increasing = true;
  let decreasing = true;
  let peakIdx = 0;
  let maxVal = -Infinity;

  for (let i = 0; i < fwds.length; i++) {
    if (fwds[i] > maxVal) {
      maxVal = fwds[i];
      peakIdx = i;
    }
    if (i > 0) {
      if (fwds[i] <= fwds[i - 1]) increasing = false;
      if (fwds[i] >= fwds[i - 1]) decreasing = false;
    }
  }

  if (increasing) return "alta";
  if (decreasing) return "queda";
  if (peakIdx > 0 && peakIdx < fwds.length - 1) return "pico";
  return "mista";
}

function getPatternInterpretation(pattern: ForwardPattern): {
  icon: string;
  title: string;
  text: string;
  borderColor: string;
  textColor: string;
} {
  switch (pattern) {
    case "alta":
      return {
        icon: "trending_up",
        title: "Forwards crescentes — mercado precifica ALTA de juros",
        text: "As taxas forward sobem ao longo da curva, indicando que o mercado espera que o CDI suba nos periodos futuros. Isso e tipico de ciclos de aperto monetario, com expectativa de elevacao da SELIC pelo COPOM. Para a tesouraria, posicoes prefixadas longas carregam risco de marcacao a mercado negativa.",
        borderColor: "border-[#C55A11]",
        textColor: "text-[#C55A11]",
      };
    case "queda":
      return {
        icon: "trending_down",
        title: "Forwards decrescentes — mercado precifica QUEDA de juros",
        text: "As taxas forward caem ao longo da curva, sinalizando expectativa de cortes na SELIC. Tipico de ciclos de afrouxamento monetario. Para a tesouraria, posicoes aplicadas (compradas em prefixados) tendem a gerar ganho de marcacao a mercado se os cortes se confirmarem.",
        borderColor: "border-[#2E8B57]",
        textColor: "text-[#2E8B57]",
      };
    case "pico":
      return {
        icon: "change_history",
        title: "Forwards com pico intermediario — possivel fim de ciclo de aperto",
        text: "As forwards sobem ate um ponto e depois recuam, sugerindo que o mercado preve que os juros atingirao um teto e comecarao a cair. E um cenario tipico de transicao — o aperto monetario atual deve ceder lugar a afrouxamento futuro.",
        borderColor: "border-[#2E75B6]",
        textColor: "text-[#2E75B6]",
      };
    default:
      return {
        icon: "swap_vert",
        title: "Padrao misto — sem direcao clara",
        text: "A curva de forwards nao apresenta padrao monotono. Isso pode refletir incerteza elevada, premia de risco irregulares, ou pontos especificos de liquidez. Analise com cautela os vertices individuais.",
        borderColor: "border-outline-variant",
        textColor: "text-on-surface-variant",
      };
  }
}

interface TabForwardCalculatorProps {
  onForwardsChange?: (fwds: ForwardPoint[]) => void;
  onSelicChange?: (selic: number) => void;
}

export function TabForwardCalculator({ onForwardsChange, onSelicChange }: TabForwardCalculatorProps) {
  const [modo, setModo] = useState<"manual" | "preloaded">("preloaded");

  // Manual mode state
  const [vertices, setVertices] = useState<Vertex[]>(DEFAULT_VERTICES);
  const [selic, setSelic] = useState(14.25);

  // Preloaded mode state
  const [diData, setDiData] = useState<CurvaDiPoint[]>([]);
  const [selicData, setSelicData] = useState<number>(14.25);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  // Load preloaded data on mode switch
  useEffect(() => {
    if (modo !== "preloaded") return;
    setLoading(true);
    Promise.all([loadCurvasDi(), loadSelicMeta()])
      .then(([di, selicSeries]) => {
        setDiData(di);
        const dates = [...new Set(di.map((d) => d.data))].sort();
        if (dates.length > 0) setSelectedDate(dates[dates.length - 1]);
        // Use latest SELIC meta
        if (selicSeries.length > 0) {
          setSelicData(selicSeries[selicSeries.length - 1].valor);
        }
      })
      .finally(() => setLoading(false));
  }, [modo]);

  // Available dates
  const availableDates = useMemo(() => {
    return [...new Set(diData.map((d) => d.data))].sort();
  }, [diData]);

  // Build preloaded vertices from CSV
  const preloadedVertices = useMemo((): Vertex[] => {
    if (!selectedDate) return [];
    const pts = diData.filter((d) => d.data === selectedDate).sort((a, b) => a.prazoDu - b.prazoDu);
    return pts.map((p) => {
      const anos = p.prazoDu / 252;
      let label: string;
      if (anos < 1) label = `${Math.round(anos * 12)}M`;
      else if (anos % 1 === 0) label = `${anos}A`;
      else label = `${anos.toFixed(1)}A`;
      return { label, du: p.prazoDu, rate: p.taxa * 100 };
    });
  }, [selectedDate, diData]);

  // Active vertices and selic
  const activeVertices = modo === "manual" ? vertices : preloadedVertices;
  const activeSelic = modo === "manual" ? selic : selicData;

  // Build curva and compute forwards
  const forwards = useMemo((): ForwardPoint[] => {
    if (activeVertices.length === 0) return [];
    const curva: Record<number, number> = {};
    for (const v of activeVertices) {
      curva[v.du] = v.rate / 100;
    }
    return calcularForwards(curva);
  }, [activeVertices]);

  // Propagate forwards and selic to parent
  useEffect(() => {
    onForwardsChange?.(forwards);
  }, [forwards, onForwardsChange]);

  useEffect(() => {
    onSelicChange?.(activeSelic);
  }, [activeSelic, onSelicChange]);

  // Pattern detection
  const pattern = useMemo(() => detectPattern(forwards), [forwards]);
  const interp = getPatternInterpretation(pattern);

  // Summary metrics
  const metrics = useMemo(() => {
    if (forwards.length === 0) return { maxFwd: 0, minFwd: 0, avgFwd: 0 };
    const fwds = forwards.map((f) => f.forwardAa * 100);
    return {
      maxFwd: Math.max(...fwds),
      minFwd: Math.min(...fwds),
      avgFwd: fwds.reduce((s, v) => s + v, 0) / fwds.length,
    };
  }, [forwards]);

  // Handlers for manual mode
  const updateVertex = useCallback((idx: number, field: keyof Vertex, value: string | number) => {
    setVertices((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: field === "label" ? value : Number(value) } : v))
    );
  }, []);

  const addVertex = useCallback(() => {
    const last = vertices[vertices.length - 1];
    const newDu = last ? last.du + 252 : 252;
    const anos = newDu / 252;
    setVertices((prev) => [...prev, { label: `${anos.toFixed(0)}A`, du: newDu, rate: last ? last.rate : 13.0 }]);
  }, [vertices]);

  const removeVertex = useCallback((idx: number) => {
    setVertices((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const resetVertices = useCallback(() => {
    setVertices(DEFAULT_VERTICES);
    setSelic(14.25);
  }, []);

  // Forward color based on selic comparison
  const fwdColor = (fwd: number): string => {
    const selicDecimal = activeSelic / 100;
    if (fwd > selicDecimal + 0.001) return "text-[#C55A11]";
    if (fwd < selicDecimal - 0.001) return "text-[#2E8B57]";
    return "text-on-surface";
  };

  // Build Plotly chart data
  const chartData = useMemo(() => {
    if (activeVertices.length === 0 || forwards.length === 0) return { traces: [], shapes: [], annotations: [] };

    // Trace 1: Spot curve
    const spotX = activeVertices.map((v) => v.du / 252);
    const spotY = activeVertices.map((v) => v.rate);

    // Trace 2: Forward steps
    const fwdX: (number | null)[] = [];
    const fwdY: (number | null)[] = [];
    for (const f of forwards) {
      fwdX.push(f.deDu / 252, f.ateDu / 252, null);
      fwdY.push(f.forwardAa * 100, f.forwardAa * 100, null);
    }

    // Max x for SELIC line
    const maxX = Math.max(...spotX) * 1.05;

    const traces = [
      {
        x: spotX,
        y: spotY,
        mode: "lines+markers" as const,
        name: "Curva Spot (DI)",
        line: { color: "#2E75B6", width: 2.5 },
        marker: { size: 7, color: "#2E75B6" },
        hovertemplate: "Prazo: %{x:.1f} anos<br>Spot: %{y:.2f}%<extra></extra>",
      },
      {
        x: fwdX,
        y: fwdY,
        mode: "lines" as const,
        name: "Forward (impl\u00edcita)",
        line: { color: "#C55A11", width: 2, shape: "hv" as const },
        hovertemplate: "Forward: %{y:.2f}%<extra></extra>",
        connectgaps: false,
      },
    ];

    const shapes = [
      {
        type: "line" as const,
        x0: 0,
        x1: maxX,
        y0: activeSelic,
        y1: activeSelic,
        line: { color: "#888", width: 1.5, dash: "dash" as const },
      },
    ];

    const annotations = [
      {
        x: maxX,
        y: activeSelic,
        text: `SELIC: ${activeSelic.toFixed(2).replace(".", ",")}%`,
        showarrow: false,
        font: { size: 10, color: "#888" },
        xanchor: "right" as const,
        yshift: 12,
      },
    ];

    return { traces, shapes, annotations };
  }, [activeVertices, forwards, activeSelic]);

  // Labels for forward table
  const forwardLabels = useMemo(() => {
    return forwards.map((f) => {
      const deLabel = f.deDu === 0 ? "Hoje" : `${f.deDu} DU`;
      const ateLabel = `${f.ateDu} DU`;
      return `${deLabel} \u2192 ${ateLabel}`;
    });
  }, [forwards]);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-xl">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">school</span>
          Conceito — Taxas Forward (Taxas a Termo)
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            <strong className="text-on-surface">Taxa forward</strong> e a taxa que o mercado hoje
            trava para um periodo que comeca no futuro. Na pratica, forward{" "}
            <KMath tex="\approx" display={false} /> CDI esperado + premio de prazo.
          </p>
          <div className="text-center">
            <KMath
              tex="f_{1,2} = \left[\frac{(1 + s_2)^{DU_2/252}}{(1 + s_1)^{DU_1/252}}\right]^{252/(DU_2 - DU_1)} - 1"
              display
            />
          </div>
          <ul className="space-y-1 list-disc pl-5">
            <li>
              <strong className="text-on-surface">Se forward &gt; SELIC:</strong> mercado espera
              alta de juros naquele periodo — premio de alta embutido.
            </li>
            <li>
              <strong className="text-on-surface">Se forward &lt; SELIC:</strong> mercado espera
              queda de juros — precifica cortes futuros.
            </li>
            <li>
              <strong className="text-on-surface">Aplicacao:</strong> comparar forwards com sua
              propria projecao de CDI para identificar oportunidades taticas.
            </li>
          </ul>
        </div>
      </details>

      {/* Mode toggle + inputs */}
      <div className="glass-card rounded-xl p-5 space-y-5">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">calculate</span>
          Calculadora de Taxas Forward
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
          <div className="space-y-4">
            {/* SELIC input */}
            <div className="max-w-xs">
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                SELIC Meta (% a.a.)
              </label>
              <input
                type="number"
                value={selic}
                step={0.25}
                onChange={(e) => setSelic(Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>

            {/* Editable table */}
            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container">
                    <th className="text-left px-4 py-3 font-label text-on-surface-variant">Vertice</th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">DU</th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">Taxa (% a.a.)</th>
                    <th className="text-center px-4 py-3 font-label text-on-surface-variant w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {vertices.map((v, i) => (
                    <tr
                      key={i}
                      className={`border-b border-outline-variant/20 ${i % 2 === 0 ? "bg-surface-container/40" : ""}`}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={v.label}
                          onChange={(e) => updateVertex(i, "label", e.target.value)}
                          className="bg-transparent border-b border-outline-variant/30 px-1 py-0.5 text-sm w-16 focus:border-primary focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          value={v.du}
                          onChange={(e) => updateVertex(i, "du", e.target.value)}
                          className="bg-transparent border-b border-outline-variant/30 px-1 py-0.5 text-sm w-20 text-right focus:border-primary focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          value={v.rate}
                          step={0.05}
                          onChange={(e) => updateVertex(i, "rate", e.target.value)}
                          className="bg-transparent border-b border-outline-variant/30 px-1 py-0.5 text-sm w-20 text-right focus:border-primary focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        {vertices.length > 2 && (
                          <button
                            onClick={() => removeVertex(i)}
                            className="text-on-surface-variant hover:text-[#CC3333] transition-colors cursor-pointer"
                            title="Remover vertice"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <button
                onClick={addVertex}
                className="px-3 py-1.5 text-xs font-headline font-bold rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Adicionar vertice
              </button>
              <button
                onClick={resetVertices}
                className="px-3 py-1.5 text-xs font-headline font-bold rounded-lg bg-white/[0.04] text-on-surface-variant border border-transparent hover:border-white/10 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Resetar
              </button>
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
                  SELIC Meta (% a.a.)
                </label>
                <p className="text-sm font-headline font-bold mt-1">
                  {fmtPct(selicData)}
                </p>
              </div>
            </div>
          ))}
      </div>

      {/* Metric cards */}
      {forwards.length > 0 && (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="glass-card rounded-lg p-4 text-center">
              <span className="text-xs font-label text-on-surface-variant">Forward maxima</span>
              <p className="text-2xl font-headline font-bold mt-1 text-[#C55A11]">
                {fmtPct(metrics.maxFwd)}
              </p>
            </div>
            <div className="glass-card rounded-lg p-4 text-center">
              <span className="text-xs font-label text-on-surface-variant">Forward minima</span>
              <p className="text-2xl font-headline font-bold mt-1 text-[#2E8B57]">
                {fmtPct(metrics.minFwd)}
              </p>
            </div>
            <div className="glass-card rounded-lg p-4 text-center">
              <span className="text-xs font-label text-on-surface-variant">Forward media</span>
              <p className="text-2xl font-headline font-bold mt-1">
                {fmtPct(metrics.avgFwd)}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="glass-card rounded-xl p-4">
            <PlotlyChart
              className="h-[420px]"
              data={chartData.traces}
              layout={{
                ...PLOTLY_LAYOUT,
                title: {
                  text: "Curva Spot vs. Forwards Implicitas",
                  font: { color: "#aaabb0", size: 14 },
                },
                xaxis: {
                  ...PLOTLY_LAYOUT.xaxis,
                  title: { text: "Prazo (anos)" },
                },
                yaxis: {
                  ...PLOTLY_LAYOUT.yaxis,
                  title: { text: "Taxa (% a.a.)" },
                  ticksuffix: "%",
                },
                shapes: chartData.shapes,
                annotations: chartData.annotations,
                hovermode: "closest" as const,
                margin: { l: 60, r: 30, t: 60, b: 50 },
              }}
              config={PLOTLY_CONFIG}
            />
          </div>

          {/* Forwards table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container">
                  <th className="text-left px-4 py-3 font-label text-on-surface-variant">
                    Periodo
                  </th>
                  <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                    DU inicio
                  </th>
                  <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                    DU fim
                  </th>
                  <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                    Spot inicio
                  </th>
                  <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                    Spot fim
                  </th>
                  <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                    Forward (% a.a.)
                  </th>
                  <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                    CDI mensal equiv.
                  </th>
                </tr>
              </thead>
              <tbody>
                {forwards.map((f, i) => (
                  <tr
                    key={i}
                    className={`border-b border-outline-variant/20 ${i % 2 === 0 ? "bg-surface-container/40" : ""}`}
                  >
                    <td className="px-4 py-2 font-label">{forwardLabels[i]}</td>
                    <td className="px-4 py-2 text-right">{f.deDu}</td>
                    <td className="px-4 py-2 text-right">{f.ateDu}</td>
                    <td className="px-4 py-2 text-right">
                      {f.spotIni !== null ? fmtPct(f.spotIni * 100) : "\u2014"}
                    </td>
                    <td className="px-4 py-2 text-right">{fmtPct(f.spotFim * 100)}</td>
                    <td className={`px-4 py-2 text-right font-headline font-bold ${fwdColor(f.forwardAa)}`}>
                      {fmtPct(f.forwardAa * 100)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {(f.forwardMensal * 100).toFixed(4).replace(".", ",")}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interpretation box */}
          <div className={`glass-card rounded-lg p-4 border-l-4 ${interp.borderColor}`}>
            <h3 className={`font-headline font-bold text-sm flex items-center gap-2 ${interp.textColor}`}>
              <span className="material-symbols-outlined text-base">{interp.icon}</span>
              {interp.title}
            </h3>
            <p className="text-sm text-on-surface-variant mt-2">{interp.text}</p>
            <p className="text-sm text-on-surface-variant mt-2">
              <strong className="text-on-surface">Para a tesouraria:</strong> Compare as forwards
              implicitas com sua projecao de CDI. Se voce espera juros <strong>abaixo</strong> das
              forwards, o mercado esta precificando premio — posicoes aplicadas (compra de prefixado)
              podem gerar ganho. Se espera juros <strong>acima</strong>, posicoes tomadas sao mais
              defensivas.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
