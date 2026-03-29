"use client";

import { useState, useMemo } from "react";
import { CURVA_DEFAULT } from "@/lib/finance";
import { fmtPct, fmtBrl } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { Math as KMath } from "@/components/math";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

interface PortfolioItem {
  titulo: string;
  pu: number;
  qtd: number;
  durMod: number;
  conv: number;
}

const DEFAULT_PORTFOLIO: PortfolioItem[] = [
  { titulo: "LTN 1A", pu: 888.49, qtd: 50000, durMod: 0.88, conv: 1.65 },
  { titulo: "NTN-F 3A", pu: 950.0, qtd: 30000, durMod: 2.5, conv: 8.5 },
  { titulo: "LTN 5A", pu: 730.0, qtd: 20000, durMod: 4.42, conv: 24.0 },
  { titulo: "NTN-B 5A", pu: 4200.0, qtd: 5000, durMod: 4.1, conv: 21.0 },
];

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

// Map titles to nearest CURVA_DEFAULT vertices for KRD
function mapToVertex(titulo: string): string {
  if (titulo.includes("1A")) return "1A";
  if (titulo.includes("3A")) return "3A";
  if (titulo.includes("5A")) return "5A";
  return "3A";
}

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  indicator?: "ok" | "warn" | "danger";
}

function MetricCard({ label, value, sub, indicator }: MetricCardProps) {
  const indicatorIcon =
    indicator === "ok" ? "\u2705" : indicator === "warn" ? "\u26A0\uFE0F" : indicator === "danger" ? "\u274C" : "";
  return (
    <div className="glass-card rounded-lg p-4 text-center">
      <span className="text-xs font-label text-on-surface-variant">{label}</span>
      <div className="text-xl font-headline font-bold mt-1">
        {indicatorIcon && <span className="mr-1">{indicatorIcon}</span>}
        {value}
      </div>
      {sub && <span className="text-xs text-on-surface-variant">{sub}</span>}
    </div>
  );
}

export function TabMetricasRisco() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(
    DEFAULT_PORTFOLIO.map((p) => ({ ...p })),
  );
  const [limiteDv01, setLimiteDv01] = useState(50000);
  const [durationMax, setDurationMax] = useState(4.0);

  const updateField = (idx: number, field: "pu" | "qtd", val: number) => {
    setPortfolio((prev) => {
      const next = prev.map((p) => ({ ...p }));
      next[idx][field] = val;
      return next;
    });
  };

  const metrics = useMemo(() => {
    const rows = portfolio.map((p) => {
      const valor = p.pu * p.qtd;
      const dv01 = p.durMod * p.pu * p.qtd * 0.0001;
      return { ...p, valor, dv01 };
    });

    const dv01Total = rows.reduce((s, r) => s + r.dv01, 0);
    const valorTotal = rows.reduce((s, r) => s + r.valor, 0);
    const durationMedia =
      valorTotal > 0
        ? rows.reduce((s, r) => s + r.durMod * r.valor, 0) / valorTotal
        : 0;
    const var95 = dv01Total * 15 * 1.645;

    const decomp = rows.map((r) => ({
      titulo: r.titulo,
      peso: valorTotal > 0 ? (r.valor / valorTotal) * 100 : 0,
      duration: r.durMod,
      dv01: r.dv01,
      contrib: dv01Total > 0 ? (r.dv01 / dv01Total) * 100 : 0,
    }));

    return { rows, dv01Total, valorTotal, durationMedia, var95, decomp };
  }, [portfolio]);

  // DV01 indicator
  const dv01Indicator: "ok" | "warn" | "danger" =
    metrics.dv01Total <= limiteDv01 * 0.8
      ? "ok"
      : metrics.dv01Total <= limiteDv01
        ? "warn"
        : "danger";

  // Duration indicator
  const durIndicator: "ok" | "warn" | "danger" =
    metrics.durationMedia <= durationMax * 0.8
      ? "ok"
      : metrics.durationMedia <= durationMax
        ? "warn"
        : "danger";

  // KRD data: aggregate DV01 per vertex
  const krdMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const v of CURVA_DEFAULT) m[v.vertice] = 0;
    for (const r of metrics.rows) {
      const vKey = mapToVertex(r.titulo);
      if (m[vKey] !== undefined) m[vKey] += r.dv01;
    }
    return m;
  }, [metrics.rows]);

  const krdVertices = CURVA_DEFAULT.map((v) => v.vertice);
  const krdValues = krdVertices.map((v) => krdMap[v] ?? 0);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">school</span>
          Conceitos: DV01, KRD e VaR
        </summary>
        <div className="px-5 pb-5 space-y-3 text-sm text-on-surface-variant">
          <div>
            <p className="font-bold text-on-surface mb-1">DV01 (Dollar Value of 01)</p>
            <KMath tex="DV01 = Duration_{mod} \times PU \times Qtd \times 0{,}0001" />
            <p>Variação no valor da posição para 1 bp de choque paralelo.</p>
          </div>
          <div>
            <p className="font-bold text-on-surface mb-1">Key Rate Duration (KRD)</p>
            <KMath tex="KRD_k = \frac{\partial P}{\partial y_k} \times \frac{1}{P}" />
            <p>Sensibilidade a movimentos em vértices específicos da curva.</p>
          </div>
          <div>
            <p className="font-bold text-on-surface mb-1">VaR Parametrico 95%</p>
            <KMath tex="VaR_{95\%} = DV01_{total} \times \sigma_{bps/dia} \times 1{,}645" />
            <p>Perda máxima esperada em 1 dia com 95% de confiança.</p>
          </div>
        </div>
      </details>

      {/* Editable portfolio */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-headline font-bold text-sm mb-3">Carteira</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs">
                <th className="text-left py-2 px-3">Título</th>
                <th className="text-right py-2 px-3">PU (R$)</th>
                <th className="text-right py-2 px-3">Quantidade</th>
                <th className="text-right py-2 px-3">Dur. Mod.</th>
                <th className="text-right py-2 px-3">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((p, i) => (
                <tr key={p.titulo} className="border-b border-outline-variant/10">
                  <td className="py-2 px-3 font-bold">{p.titulo}</td>
                  <td className="text-right py-2 px-3">
                    <input
                      type="number"
                      value={p.pu}
                      step={0.01}
                      onChange={(e) => updateField(i, "pu", Number(e.target.value))}
                      className={`${INPUT_CLASS} w-28 text-right`}
                    />
                  </td>
                  <td className="text-right py-2 px-3">
                    <input
                      type="number"
                      value={p.qtd}
                      step={1000}
                      onChange={(e) => updateField(i, "qtd", Number(e.target.value))}
                      className={`${INPUT_CLASS} w-28 text-right`}
                    />
                  </td>
                  <td className="text-right py-2 px-3">{p.durMod.toFixed(2)}</td>
                  <td className="text-right py-2 px-3">{p.conv.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Limite DV01: {fmtBrl(limiteDv01)}
          </label>
          <input
            type="number"
            value={limiteDv01}
            step={5000}
            onChange={(e) => setLimiteDv01(Number(e.target.value))}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Duration máxima: {durationMax.toFixed(1)} anos
          </label>
          <input
            type="range"
            min={1}
            max={8}
            step={0.5}
            value={durationMax}
            onChange={(e) => setDurationMax(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-on-surface-variant mt-1">
            <span>1 ano</span>
            <span>8 anos</span>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="DV01 Total"
          value={fmtBrl(metrics.dv01Total)}
          indicator={dv01Indicator}
          sub={`Limite: ${fmtBrl(limiteDv01)}`}
        />
        <MetricCard
          label="Duration Média"
          value={metrics.durationMedia.toFixed(2)}
          indicator={durIndicator}
          sub={`Max: ${durationMax.toFixed(1)} anos`}
        />
        <MetricCard
          label="VaR 95% 1 dia"
          value={fmtBrl(metrics.var95)}
          sub="\u03C3 = 15 bps/dia"
        />
        <MetricCard
          label="Valor Total"
          value={fmtBrl(metrics.valorTotal)}
        />
      </div>

      {/* Decomposition table */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-headline font-bold text-sm mb-3">Decomposição de Risco</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs">
                <th className="text-left py-2 px-3">Título</th>
                <th className="text-right py-2 px-3">Peso (%)</th>
                <th className="text-right py-2 px-3">Duration</th>
                <th className="text-right py-2 px-3">DV01 (R$)</th>
                <th className="text-right py-2 px-3">Contrib. risco (%)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.decomp.map((d) => (
                <tr key={d.titulo} className="border-b border-outline-variant/10">
                  <td className="py-2 px-3 font-bold">{d.titulo}</td>
                  <td className="text-right py-2 px-3">{fmtPct(d.peso)}</td>
                  <td className="text-right py-2 px-3">{d.duration.toFixed(2)}</td>
                  <td className="text-right py-2 px-3">{fmtBrl(d.dv01)}</td>
                  <td className="text-right py-2 px-3">{fmtPct(d.contrib)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KRD bar chart */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-4">Key Rate Duration (KRD)</h3>
          <PlotlyChart
            className="h-[350px]"
            data={[
              {
                x: krdVertices,
                y: krdValues,
                type: "bar" as const,
                marker: { color: "#2E75B6" },
                hovertemplate: "%{x}: R$ %{y:,.0f}<extra></extra>",
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
                title: { text: "DV01 parcial (R$)", font: { size: 12, color: "#aaabb0" } },
              },
            }}
            config={PLOTLY_CONFIG}
          />
        </div>

        {/* Risk contribution donut */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-4">Contribuição ao Risco</h3>
          <PlotlyChart
            className="h-[350px]"
            data={[
              {
                labels: metrics.decomp.map((d) => d.titulo),
                values: metrics.decomp.map((d) => d.dv01),
                type: "pie" as const,
                hole: 0.5,
                marker: {
                  colors: ["#2E75B6", "#C55A11", "#2E8B57", "#8B5CF6"],
                },
                textinfo: "label+percent" as const,
                hovertemplate: "%{label}: R$ %{value:,.0f} (%{percent})<extra></extra>",
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              showlegend: false,
            }}
            config={PLOTLY_CONFIG}
          />
        </div>
      </div>
    </div>
  );
}
