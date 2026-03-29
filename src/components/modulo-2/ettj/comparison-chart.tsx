"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface CurveData {
  xObs: number[];
  yObs: number[];
  xSmooth: number[];
  ySmooth: number[];
  date: string;
}

interface ComparisonChartProps {
  dataA: CurveData;
  dataB: CurveData;
  methodLabel: string;
}

export default function ComparisonChart({
  dataA,
  dataB,
  methodLabel,
}: ComparisonChartProps) {
  // Compute difference (B - A) at each smooth point
  const diff = dataB.ySmooth.map((v, i) => v - dataA.ySmooth[i]);

  return (
    <div className="glass-card rounded-xl p-4">
      <Plot
        data={[
          // Top chart — Data A observed
          {
            x: dataA.xObs,
            y: dataA.yObs,
            mode: "markers" as const,
            type: "scatter" as const,
            name: `Data A (${dataA.date})`,
            marker: { color: "#3b82f6", size: 6, opacity: 0.5 },
            yaxis: "y",
          },
          // Top chart — Data A fitted
          {
            x: dataA.xSmooth,
            y: dataA.ySmooth,
            mode: "lines" as const,
            type: "scatter" as const,
            name: `Curva A (${dataA.date})`,
            line: { color: "#3b82f6", width: 2 },
            yaxis: "y",
          },
          // Top chart — Data B observed
          {
            x: dataB.xObs,
            y: dataB.yObs,
            mode: "markers" as const,
            type: "scatter" as const,
            name: `Data B (${dataB.date})`,
            marker: { color: "#dc143c", size: 6, opacity: 0.5 },
            yaxis: "y",
          },
          // Top chart — Data B fitted
          {
            x: dataB.xSmooth,
            y: dataB.ySmooth,
            mode: "lines" as const,
            type: "scatter" as const,
            name: `Curva B (${dataB.date})`,
            line: { color: "#dc143c", width: 2 },
            yaxis: "y",
          },
          // Bottom chart — Difference
          {
            x: dataA.xSmooth,
            y: diff,
            mode: "lines" as const,
            type: "scatter" as const,
            name: "Diferença (B − A)",
            line: { color: "#f97316", width: 2 },
            fill: "tozeroy" as const,
            fillcolor: "rgba(249,115,22,0.15)",
            yaxis: "y2",
          },
          // Bottom chart — zero reference line
          {
            x: [dataA.xSmooth[0], dataA.xSmooth[dataA.xSmooth.length - 1]],
            y: [0, 0],
            mode: "lines" as const,
            type: "scatter" as const,
            line: { color: "#6b7280", width: 1, dash: "dash" as const },
            showlegend: false,
            yaxis: "y2",
          },
        ]}
        layout={{
          height: 700,
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          font: { color: "#aaabb0" },
          hovermode: "x unified" as const,
          margin: { t: 140, r: 30, b: 50, l: 60 },
          legend: {
            orientation: "h" as const,
            y: 1.12,
            x: 0.5,
            xanchor: "center" as const,
            font: { size: 11 },
            tracegroupgap: 20,
          },
          annotations: [
            {
              text: `Comparação — ${methodLabel}`,
              xref: "paper" as const,
              yref: "paper" as const,
              x: 0.5,
              y: 1.22,
              showarrow: false,
              font: { size: 16, color: "#aaabb0" },
              xanchor: "center" as const,
            },
          ],
          xaxis: {
            title: { text: "Dias Úteis" },
            gridcolor: "rgba(255,255,255,0.06)",
            zeroline: false,
          },
          yaxis: {
            title: { text: "Taxa (%)" },
            domain: [0.35, 1],
            gridcolor: "rgba(255,255,255,0.06)",
            zeroline: false,
          },
          yaxis2: {
            title: { text: "Diferença (p.p.)" },
            domain: [0, 0.3],
            gridcolor: "rgba(255,255,255,0.06)",
            zeroline: false,
            anchor: "x" as const,
          },
        }}
        config={{ responsive: true, displayModeBar: false }}
        useResizeHandler
        style={{ width: "100%" }}
      />
    </div>
  );
}
