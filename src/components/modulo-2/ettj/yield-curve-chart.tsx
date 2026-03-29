"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface YieldCurveChartProps {
  xObserved: number[];
  yObserved: number[];
  xSmooth: number[];
  ySmooth: number[];
  date: string;
  methodLabel: string;
}

export default function YieldCurveChart({
  xObserved,
  yObserved,
  xSmooth,
  ySmooth,
  date,
  methodLabel,
}: YieldCurveChartProps) {
  return (
    <Plot
      data={[
        {
          x: xObserved,
          y: yObserved,
          type: "scatter" as const,
          mode: "markers" as const,
          marker: { color: "royalblue", size: 8 },
          name: "Taxas Observadas",
        },
        {
          x: xSmooth,
          y: ySmooth,
          type: "scatter" as const,
          mode: "lines" as const,
          line: { color: "crimson", width: 3 },
          name: methodLabel,
        },
      ]}
      layout={{
        title: {
          text: `ETTJ — ${methodLabel} — ${date}`,
          font: { color: "#aaabb0" },
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#aaabb0" },
        height: 500,
        hovermode: "closest" as const,
        xaxis: {
          title: { text: "Dias Úteis até o Vencimento" },
          gridcolor: "rgba(255,255,255,0.08)",
        },
        yaxis: {
          title: { text: "Taxa de Juros (%)" },
          hoverformat: ".4f",
          gridcolor: "rgba(255,255,255,0.08)",
        },
        legend: {
          x: 1,
          y: 1,
          xanchor: "right" as const,
        },
        margin: { l: 60, r: 30, t: 50, b: 50 },
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%" }}
    />
  );
}
