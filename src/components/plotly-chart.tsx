"use client";

import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import type { Layout, Config } from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px] text-on-surface-variant text-sm">
      Carregando gráfico...
    </div>
  ),
});

interface PlotlyChartProps {
  data: PlotParams["data"];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  className?: string;
}

export function PlotlyChart({ data, layout, config, className }: PlotlyChartProps) {
  return (
    <div className={className}>
      <Plot
        data={data}
        layout={{
          autosize: true,
          ...layout,
        }}
        config={config}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
