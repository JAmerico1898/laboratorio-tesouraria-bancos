import type { Layout, Config, Template } from "plotly.js";

export const PLOTLY_LAYOUT: Partial<Layout> = {
  template: "plotly_white" as unknown as Template,
  font: { family: "Segoe UI, Arial, sans-serif", size: 13, color: "#aaabb0" },
  margin: { l: 60, r: 30, t: 50, b: 50 },
  hoverlabel: { bgcolor: "white", font: { size: 12, color: "#333" } },
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  xaxis: { gridcolor: "rgba(255,255,255,0.08)", zerolinecolor: "rgba(255,255,255,0.12)" },
  yaxis: { gridcolor: "rgba(255,255,255,0.08)", zerolinecolor: "rgba(255,255,255,0.12)" },
  legend: { font: { color: "#aaabb0" } },
};

export const PLOTLY_CONFIG: Partial<Config> = {
  displayModeBar: false,
};

export const CHART_COLORS = {
  primary: "#2E75B6",
  accent: "#C55A11",
  positive: "#2E8B57",
  negative: "#CC3333",
} as const;
