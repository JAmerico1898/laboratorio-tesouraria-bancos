"use client";

import { useState, useMemo } from "react";
import {
  CURVA_DEFAULT,
  truncar6,
  type CurvaVertex,
} from "@/lib/finance";
import { fmtBrl, fmtPct } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  colorClass?: string;
}

function MetricCard({ label, value, sub, colorClass }: MetricCardProps) {
  return (
    <div className="glass-card rounded-lg p-4 text-center">
      <span className="text-xs font-label text-on-surface-variant">{label}</span>
      <div className={`text-xl font-headline font-bold mt-1 ${colorClass ?? ""}`}>
        {value}
      </div>
      {sub && <span className="text-xs text-on-surface-variant">{sub}</span>}
    </div>
  );
}

function lerp(x: number, xs: number[], ys: number[]): number {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  for (let i = 0; i < xs.length - 1; i++) {
    if (x >= xs[i] && x <= xs[i + 1]) {
      const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
      return ys[i] + t * (ys[i + 1] - ys[i]);
    }
  }
  return ys[ys.length - 1];
}

function puFromRate(taxaPct: number, prazoAnos: number): number {
  const du = Math.round(prazoAnos * 252);
  if (du <= 0) return 1000;
  const fator = truncar6(Math.pow(1 + taxaPct / 100, du / 252));
  return 1000 / fator;
}

export function TabRiding() {
  const [prazoCompra, setPrazoCompra] = useState(5);
  const [horizonte, setHorizonte] = useState(12);
  const [deslocamento, setDeslocamento] = useState(0);

  const prazos = useMemo(() => CURVA_DEFAULT.map((v) => v.prazoAnos), []);
  const taxas = useMemo(() => CURVA_DEFAULT.map((v) => v.taxa), []);

  const calc = useMemo(() => {
    const prazoVenda = Math.max(0.25, prazoCompra - horizonte / 12);

    // Rates from original curve
    const taxaCompra = lerp(prazoCompra, prazos, taxas);
    const taxaVendaOriginal = lerp(prazoVenda, prazos, taxas);
    const taxaVendaDeslocada = taxaVendaOriginal + deslocamento / 100;

    const puCompra = puFromRate(taxaCompra, prazoCompra);
    const puVenda = puFromRate(taxaVendaDeslocada, prazoVenda);

    const ganhoTotal = puVenda - puCompra;
    const ganhoPorMil = ganhoTotal;

    // Rolldown in bps: difference between purchase rate and sale rate on original curve
    const rolldownBps = (taxaCompra - taxaVendaOriginal) * 100;

    // Rolldown R$/1000: PU at sale (original curve) minus PU at purchase
    const puVendaSemDesloc = puFromRate(taxaVendaOriginal, prazoVenda);
    const rolldownReais = puVendaSemDesloc - puCompra;

    // Loss from displacement
    const perdaDesloc = puVendaSemDesloc - puVenda;

    // Breakeven: find displacement where gain = 0
    // Binary search for breakeven
    let beMin = 0;
    let beMax = 500;
    for (let iter = 0; iter < 50; iter++) {
      const mid = (beMin + beMax) / 2;
      const txV = taxaVendaOriginal + mid / 100;
      const puV = puFromRate(txV, prazoVenda);
      if (puV - puCompra > 0) {
        beMin = mid;
      } else {
        beMax = mid;
      }
    }
    const breakevenBps = Math.round((beMin + beMax) / 2);

    return {
      prazoVenda,
      taxaCompra,
      taxaVendaOriginal,
      taxaVendaDeslocada,
      puCompra,
      puVenda,
      rolldownBps,
      rolldownReais,
      perdaDesloc,
      resultadoLiquido: ganhoPorMil,
      breakevenBps,
    };
  }, [prazoCompra, horizonte, deslocamento, prazos, taxas]);

  // Breakeven chart data
  const breakevenChart = useMemo(() => {
    const deslocamentos: number[] = [];
    const resultados: number[] = [];
    const taxaVendaOrig = lerp(calc.prazoVenda, prazos, taxas);
    for (let d = -200; d <= 200; d += 5) {
      const txV = taxaVendaOrig + d / 100;
      const puV = puFromRate(txV, calc.prazoVenda);
      deslocamentos.push(d);
      resultados.push(puV - calc.puCompra);
    }
    return { deslocamentos, resultados };
  }, [calc.prazoVenda, calc.puCompra, prazos, taxas]);

  // Curve chart data
  const curveXFine = useMemo(() => {
    const pts: number[] = [];
    for (let p = prazos[0]; p <= prazos[prazos.length - 1]; p += 0.1) {
      pts.push(Math.round(p * 10) / 10);
    }
    return pts;
  }, [prazos]);

  const curveYOriginal = useMemo(() => curveXFine.map((p) => lerp(p, prazos, taxas)), [curveXFine, prazos, taxas]);
  const curveYDeslocada = useMemo(
    () => curveXFine.map((p) => lerp(p, prazos, taxas) + deslocamento / 100),
    [curveXFine, prazos, taxas, deslocamento],
  );

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">school</span>
          Conceitos: Riding the Yield Curve
        </summary>
        <div className="px-5 pb-5 space-y-3 text-sm text-on-surface-variant">
          <p>
            <strong className="text-on-surface">Riding the yield curve</strong> consiste em comprar
            um título com prazo mais longo que o horizonte de investimento e vendê-lo antes do
            vencimento. Se a curva for positivamente inclinada e as taxas permanecerem estáveis,
            o título &ldquo;desliza&rdquo; pela curva para taxas menores (e preços maiores),
            gerando um ganho adicional chamado <strong className="text-on-surface">rolldown</strong>.
          </p>
          <p>
            O risco principal é que as taxas subam durante o período de carregamento, anulando ou
            superando o ganho de rolldown. O <strong className="text-on-surface">breakeven</strong> mede
            quantos bps a curva pode subir antes que o resultado se torne negativo.
          </p>
        </div>
      </details>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Prazo título: {prazoCompra.toFixed(1)} anos
          </label>
          <input
            type="range" min={1} max={10} step={0.5} value={prazoCompra}
            onChange={(e) => setPrazoCompra(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-on-surface-variant mt-1">
            <span>1 ano</span>
            <span>10 anos</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Horizonte: {horizonte} meses
          </label>
          <input
            type="range" min={3} max={24} step={3} value={horizonte}
            onChange={(e) => setHorizonte(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-on-surface-variant mt-1">
            <span>3 meses</span>
            <span>24 meses</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Deslocamento paralelo: {deslocamento >= 0 ? "+" : ""}{deslocamento} bps
          </label>
          <input
            type="range" min={-200} max={200} step={10} value={deslocamento}
            onChange={(e) => setDeslocamento(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-on-surface-variant mt-1">
            <span>-200 bps</span>
            <span>+200 bps</span>
          </div>
        </div>
      </div>

      {/* Curve chart */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-headline font-bold text-sm mb-4">Curva de Juros e Rolldown</h3>
        <PlotlyChart
          className="h-[400px]"
          data={[
            // Original curve
            {
              x: curveXFine,
              y: curveYOriginal,
              type: "scatter" as const,
              mode: "lines" as const,
              name: "Curva original",
              line: { color: "#2E75B6", width: 2.5 },
            },
            // Displaced curve (if any)
            ...(deslocamento !== 0
              ? [
                  {
                    x: curveXFine,
                    y: curveYDeslocada,
                    type: "scatter" as const,
                    mode: "lines" as const,
                    name: `Curva deslocada (${deslocamento >= 0 ? "+" : ""}${deslocamento} bps)`,
                    line: { color: "#888888", width: 2, dash: "dash" as const },
                  },
                ]
              : []),
            // Purchase marker
            {
              x: [prazoCompra],
              y: [calc.taxaCompra],
              type: "scatter" as const,
              mode: "text+markers" as const,
              name: "Compra",
              marker: { color: "#8B5CF6", size: 14, symbol: "circle" },
              text: [`Compra: ${calc.taxaCompra.toFixed(2)}%`],
              textposition: "top center" as const,
              textfont: { color: "#8B5CF6", size: 11 },
            },
            // Sale marker
            {
              x: [calc.prazoVenda],
              y: [calc.taxaVendaDeslocada],
              type: "scatter" as const,
              mode: "text+markers" as const,
              name: "Venda",
              marker: { color: "#2E8B57", size: 14, symbol: "diamond" },
              text: [`Venda: ${calc.taxaVendaDeslocada.toFixed(2)}%`],
              textposition: "bottom center" as const,
              textfont: { color: "#2E8B57", size: 11 },
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "Prazo (anos)", font: { size: 12, color: "#aaabb0" } },
            },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "Taxa (% a.a.)", font: { size: 12, color: "#aaabb0" } },
            },
            legend: { ...PLOTLY_LAYOUT.legend, x: 0, y: 1.15, orientation: "h" as const },
            annotations: [
              {
                x: (prazoCompra + calc.prazoVenda) / 2,
                y: (calc.taxaCompra + calc.taxaVendaDeslocada) / 2,
                text: `Rolldown: ${calc.rolldownBps.toFixed(0)} bps`,
                showarrow: false,
                font: { color: "#ff9f4a", size: 12, family: "Segoe UI" },
                bgcolor: "rgba(12,14,18,0.8)",
                borderpad: 4,
              },
            ],
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          label="Rolldown"
          value={`${calc.rolldownBps.toFixed(0)} bps`}
          colorClass="text-[#ff9f4a]"
        />
        <MetricCard
          label="Rolldown (R$/1000)"
          value={fmtBrl(calc.rolldownReais)}
          colorClass={calc.rolldownReais >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}
        />
        <MetricCard
          label="Perda deslocamento"
          value={fmtBrl(calc.perdaDesloc)}
          colorClass={calc.perdaDesloc >= 0 ? "text-[#CC3333]" : "text-[#2E8B57]"}
        />
        <MetricCard
          label="Resultado líquido"
          value={fmtBrl(calc.resultadoLiquido)}
          sub="R$/1000 face"
          colorClass={calc.resultadoLiquido >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}
        />
        <MetricCard
          label="Breakeven"
          value={`+${calc.breakevenBps} bps`}
          sub="desloc. máximo"
          colorClass="text-[#D4A012]"
        />
      </div>

      {/* Breakeven chart */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-headline font-bold text-sm mb-4">Resultado vs. Deslocamento da Curva</h3>
        <PlotlyChart
          className="h-[350px]"
          data={[
            {
              x: breakevenChart.deslocamentos,
              y: breakevenChart.resultados,
              type: "scatter" as const,
              mode: "lines" as const,
              name: "Resultado (R$/1000)",
              line: { color: "#2E75B6", width: 2.5 },
              fill: "tozeroy" as const,
              fillcolor: "rgba(46,117,182,0.15)",
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "Deslocamento (bps)", font: { size: 12, color: "#aaabb0" } },
            },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "Resultado (R$/1000)", font: { size: 12, color: "#aaabb0" } },
            },
            shapes: [
              {
                type: "line",
                x0: -200, x1: 200, y0: 0, y1: 0,
                line: { color: "rgba(255,255,255,0.3)", width: 1, dash: "dot" },
              },
              {
                type: "line",
                x0: calc.breakevenBps, x1: calc.breakevenBps,
                y0: Math.min(...breakevenChart.resultados) * 1.1,
                y1: Math.max(...breakevenChart.resultados) * 1.1,
                line: { color: "#D4A012", width: 2, dash: "dash" },
              },
            ],
            annotations: [
              {
                x: calc.breakevenBps,
                y: 0,
                text: `BE: +${calc.breakevenBps} bps`,
                showarrow: true,
                arrowhead: 2,
                ax: 40,
                ay: -30,
                font: { color: "#D4A012", size: 12 },
                arrowcolor: "#D4A012",
              },
            ],
          }}
          config={PLOTLY_CONFIG}
        />
      </div>
    </div>
  );
}
