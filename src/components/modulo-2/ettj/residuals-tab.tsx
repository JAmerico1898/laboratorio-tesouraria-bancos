"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ResidualsTabProps {
  xData: number[];
  residuals: number[];
}

export default function ResidualsTab({ xData, residuals }: ResidualsTabProps) {
  const residualsPP = useMemo(() => residuals.map((r) => r * 100), [residuals]);

  const stats = useMemo(() => {
    const n = residualsPP.length;
    if (n === 0) return { mean: 0, std: 0, min: 0, max: 0 };
    const mean = residualsPP.reduce((a, b) => a + b, 0) / n;
    const variance = residualsPP.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);
    const min = Math.min(...residualsPP);
    const max = Math.max(...residualsPP);
    return { mean, std, min, max };
  }, [residualsPP]);

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl overflow-hidden">
        <Plot
          data={[
            {
              x: xData,
              y: residualsPP,
              type: "scatter",
              mode: "markers",
              marker: { color: "#ff9800", size: 8 },
              name: "Resíduos",
              hovertemplate: "DU: %{x}<br>Resíduo: %{y:.4f} p.p.<extra></extra>",
            },
            {
              x: [Math.min(...xData), Math.max(...xData)],
              y: [0, 0],
              type: "scatter",
              mode: "lines",
              line: { color: "#849495", dash: "dash", width: 1 },
              showlegend: false,
              hoverinfo: "skip" as const,
            },
          ]}
          layout={{
            autosize: true,
            height: 350,
            margin: { t: 20, r: 30, b: 50, l: 60 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#aaabb0" },
            xaxis: {
              title: { text: "Dias Úteis", font: { size: 12 } },
              gridcolor: "#2a2d31",
              zerolinecolor: "#2a2d31",
            },
            yaxis: {
              title: { text: "Resíduos (p.p.)", font: { size: 12 } },
              gridcolor: "#2a2d31",
              zerolinecolor: "#849495",
            },
            showlegend: false,
          }}
          config={{ responsive: true, displayModeBar: false }}
          className="w-full"
          useResizeHandler
          style={{ width: "100%" }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Média", value: stats.mean.toFixed(6) },
          { label: "Desvio Padrão", value: stats.std.toFixed(3) },
          { label: "Mínimo", value: stats.min.toFixed(3) },
          { label: "Máximo", value: stats.max.toFixed(3) },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-lg p-3 text-center">
            <div className="text-on-surface-variant text-xs uppercase tracking-wider mb-1">
              {s.label}
            </div>
            <div className="text-on-surface text-lg font-mono">
              {s.value} <span className="text-xs text-on-surface-variant">p.p.</span>
            </div>
          </div>
        ))}
      </div>

      <details className="glass-card rounded-lg">
        <summary className="px-4 py-3 cursor-pointer text-on-surface text-sm font-medium hover:text-primary transition-colors">
          ℹ️ O que são resíduos?
        </summary>
        <div className="px-4 pb-4 text-on-surface-variant text-sm leading-relaxed space-y-2">
          <p>
            <strong className="text-on-surface">Resíduos</strong> são as diferenças entre as taxas
            observadas no mercado e as taxas estimadas pelo método de interpolação em cada ponto
            observado.
          </p>
          <p>
            Idealmente, os resíduos devem ser pequenos e distribuídos aleatoriamente em torno de
            zero. Se houver padrões sistemáticos (por exemplo, resíduos sempre positivos em prazos
            longos), isso indica que o modelo não está capturando bem a forma da curva naquela região.
          </p>
          <p>
            Um bom ajuste apresenta média próxima de zero e desvio padrão baixo.
          </p>
        </div>
      </details>
    </div>
  );
}
