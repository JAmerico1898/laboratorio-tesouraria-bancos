"use client";

import { useState, useMemo } from "react";
import {
  interpolarChoque,
  CURVA_DEFAULT,
  type CurvaVertex,
} from "@/lib/finance";
import { fmtPct } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const MOVIMENTOS = [
  "Paralelo",
  "Empinamento",
  "Achatamento",
  "Butterfly",
  "Combinado",
] as const;

type Movimento = (typeof MOVIMENTOS)[number];

const FONTES_RISCO = [
  {
    fonte: "Nível",
    descricao: "Deslocamento paralelo de toda a curva",
    metrica: "Duration / DV01",
  },
  {
    fonte: "Inclinação",
    descricao: "Mudança na diferença entre taxas curtas e longas",
    metrica: "Key Rate Duration",
  },
  {
    fonte: "Curvatura",
    descricao: "Mudança na forma convexa/côncava da curva",
    metrica: "Butterfly spread",
  },
  {
    fonte: "Spread",
    descricao: "Variação do prêmio de crédito sobre a curva base",
    metrica: "Spread duration",
  },
  {
    fonte: "Base",
    descricao: "Descasamento entre índice do ativo e do hedge",
    metrica: "Basis point value",
  },
];

function calcularChoques(curva: CurvaVertex[], mov: Movimento, mag: number): number[] {
  switch (mov) {
    case "Paralelo":
      return curva.map(() => mag);
    case "Empinamento":
      return interpolarChoque(curva, mag * 0.3, mag);
    case "Achatamento":
      return interpolarChoque(curva, mag, mag * 0.3);
    case "Butterfly": {
      const prazos = curva.map((v) => v.prazoAnos);
      const pMin = Math.min(...prazos);
      const pMax = Math.max(...prazos);
      const pMid = (pMin + pMax) / 2;
      return prazos.map((p) => {
        const dist = Math.abs(p - pMid) / ((pMax - pMin) / 2);
        return mag * dist - mag * 0.5 * (1 - dist);
      });
    }
    case "Combinado":
      return interpolarChoque(curva, mag, mag);
    default:
      return curva.map(() => mag);
  }
}

const SELECT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function TabFontesRisco() {
  const [movimento, setMovimento] = useState<Movimento>("Paralelo");
  const [magnitude, setMagnitude] = useState(100);

  const choques = useMemo(
    () => calcularChoques(CURVA_DEFAULT, movimento, magnitude),
    [movimento, magnitude],
  );

  const curvaChocada = useMemo(
    () =>
      CURVA_DEFAULT.map((v, i) => ({
        ...v,
        taxa: v.taxa + choques[i] / 100,
      })),
    [choques],
  );

  const vertices = CURVA_DEFAULT.map((v) => v.vertice);
  const taxasOrig = CURVA_DEFAULT.map((v) => v.taxa);
  const taxasChoc = curvaChocada.map((v) => v.taxa);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">school</span>
          Conceitos: 5 Fontes de Risco de Taxa de Juros
        </summary>
        <div className="px-5 pb-5 text-sm text-on-surface-variant">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs">
                  <th className="text-left py-2 px-3">Fonte</th>
                  <th className="text-left py-2 px-3">Descrição</th>
                  <th className="text-left py-2 px-3">Métrica</th>
                </tr>
              </thead>
              <tbody>
                {FONTES_RISCO.map((f) => (
                  <tr key={f.fonte} className="border-b border-outline-variant/10">
                    <td className="py-2 px-3 font-bold text-on-surface">{f.fonte}</td>
                    <td className="py-2 px-3">{f.descricao}</td>
                    <td className="py-2 px-3">{f.metrica}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Tipo de movimento
          </label>
          <select
            value={movimento}
            onChange={(e) => setMovimento(e.target.value as Movimento)}
            className={SELECT_CLASS}
          >
            {MOVIMENTOS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Magnitude: {magnitude >= 0 ? "+" : ""}{magnitude} bps
          </label>
          <input
            type="range"
            min={-200}
            max={200}
            step={10}
            value={magnitude}
            onChange={(e) => setMagnitude(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-on-surface-variant mt-1">
            <span>-200 bps</span>
            <span>0</span>
            <span>+200 bps</span>
          </div>
        </div>
      </div>

      {/* Curve chart */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-headline font-bold text-sm mb-4">
          Curva Original vs. Pós-Choque ({movimento} {magnitude >= 0 ? "+" : ""}{magnitude} bps)
        </h3>
        <PlotlyChart
          className="h-[400px]"
          data={[
            {
              x: vertices,
              y: taxasOrig,
              type: "scatter" as const,
              mode: "lines+markers" as const,
              name: "Curva Original",
              line: { color: "#2E75B6", width: 2.5 },
              marker: { size: 7 },
            },
            {
              x: vertices,
              y: taxasChoc,
              type: "scatter" as const,
              mode: "lines+markers" as const,
              name: "Curva Pós-Choque",
              line: { color: "#CC3333", width: 2.5, dash: "dash" as const },
              marker: { size: 7 },
            },
            {
              x: [...vertices, ...[...vertices].reverse()],
              y: [...taxasOrig, ...[...taxasChoc].reverse()],
              type: "scatter" as const,
              fill: "toself" as const,
              fillcolor: "rgba(204,51,51,0.1)",
              line: { color: "transparent" },
              showlegend: false,
              hoverinfo: "skip" as const,
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "Vértice", font: { size: 12, color: "#aaabb0" } },
            },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "Taxa (% a.a.)", font: { size: 12, color: "#aaabb0" } },
            },
            legend: { ...PLOTLY_LAYOUT.legend, x: 0, y: 1.12, orientation: "h" as const },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Shock table */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-headline font-bold text-sm mb-3">Detalhamento dos Choques</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs">
                <th className="text-left py-2 px-3">Vértice</th>
                <th className="text-right py-2 px-3">Prazo (DU)</th>
                <th className="text-right py-2 px-3">Taxa Original (%)</th>
                <th className="text-right py-2 px-3">Choque (bps)</th>
                <th className="text-right py-2 px-3">Taxa Final (%)</th>
              </tr>
            </thead>
            <tbody>
              {CURVA_DEFAULT.map((v, i) => (
                <tr key={v.vertice} className="border-b border-outline-variant/10">
                  <td className="py-2 px-3 font-bold">{v.vertice}</td>
                  <td className="text-right py-2 px-3">{v.prazoDu}</td>
                  <td className="text-right py-2 px-3">{fmtPct(v.taxa)}</td>
                  <td className="text-right py-2 px-3">
                    <span className={choques[i] >= 0 ? "text-red-400" : "text-green-400"}>
                      {choques[i] >= 0 ? "+" : ""}{choques[i].toFixed(0)}
                    </span>
                  </td>
                  <td className="text-right py-2 px-3">{fmtPct(curvaChocada[i].taxa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
