"use client";

import { useState, useMemo } from "react";
import {
  montarEstrategia,
  calcularMetricasCarteira,
  simularRetornoEstrategia,
  CURVA_DEFAULT,
  CENARIOS_CURVA,
  COR_ESTRATEGIA,
} from "@/lib/finance";
import { fmtPct, fmtBrl } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const ESTRATEGIAS = ["Bullet", "Barbell", "Ladder", "Riding the Yield Curve"] as const;
const CENARIO_KEYS = Object.keys(CENARIOS_CURVA);

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

export function TabEstrategiaCenario() {
  const [durAlvo, setDurAlvo] = useState(3);
  const [volume, setVolume] = useState(100);
  const [cenarioKey, setCenarioKey] = useState(CENARIO_KEYS[0]);
  const [customCurto, setCustomCurto] = useState(0);
  const [customLongo, setCustomLongo] = useState(0);
  const [horizonte, setHorizonte] = useState(12);

  const isCustom = cenarioKey === "Personalizado";
  const choqueCurto = isCustom ? customCurto : CENARIOS_CURVA[cenarioKey]?.curto ?? 0;
  const choqueLongo = isCustom ? customLongo : CENARIOS_CURVA[cenarioKey]?.longo ?? 0;

  const volScale = volume * 1e6 / 1000; // functions return per-1000-face

  const results = useMemo(() => {
    return ESTRATEGIAS.map((nome) => {
      const cart = montarEstrategia(nome, CURVA_DEFAULT, durAlvo);
      const m = calcularMetricasCarteira(cart);
      const sim = simularRetornoEstrategia(cart, choqueCurto, choqueLongo, horizonte);
      return {
        nome,
        duration: m.duration,
        convexidade: m.convexidade,
        carry: sim.carry * volScale,
        mtm: sim.mtm * volScale,
        total: sim.total * volScale,
        totalPct: (sim.total / 1000) * 100,
      };
    });
  }, [durAlvo, choqueCurto, choqueLongo, horizonte, volScale]);

  const ranked = useMemo(() => {
    const sorted = [...results].sort((a, b) => b.totalPct - a.totalPct);
    return results.map((r) => ({
      ...r,
      ranking: sorted.findIndex((s) => s.nome === r.nome) + 1,
    }));
  }, [results]);

  const winner = ranked.find((r) => r.ranking === 1)!;
  const loser = ranked.find((r) => r.ranking === ranked.length)!;

  // Heatmap: all 6 scenarios x 4 strategies
  const heatmapData = useMemo(() => {
    const scenarioNames = CENARIO_KEYS;
    const zValues: number[][] = [];
    const textValues: string[][] = [];

    for (const sk of scenarioNames) {
      const cen = CENARIOS_CURVA[sk];
      const row: number[] = [];
      const textRow: string[] = [];
      for (const est of ESTRATEGIAS) {
        const cart = montarEstrategia(est, CURVA_DEFAULT, durAlvo);
        const sim = simularRetornoEstrategia(cart, cen.curto, cen.longo, horizonte);
        const pct = (sim.total / 1000) * 100;
        row.push(pct);
        textRow.push(pct.toFixed(2) + "%");
      }
      zValues.push(row);
      textValues.push(textRow);
    }

    return { scenarioNames, zValues, textValues };
  }, [durAlvo, horizonte]);

  return (
    <div className="space-y-8">
      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Duration alvo: {durAlvo.toFixed(1)} anos
          </label>
          <input
            type="range" min={1} max={7} step={0.5} value={durAlvo}
            onChange={(e) => setDurAlvo(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Volume: R$ {volume} mi
          </label>
          <input
            type="range" min={10} max={500} step={10} value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Cenário
          </label>
          <select
            value={cenarioKey}
            onChange={(e) => setCenarioKey(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {CENARIO_KEYS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
            <option value="Personalizado">Personalizado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Horizonte: {horizonte} meses
          </label>
          <input
            type="range" min={1} max={24} step={1} value={horizonte}
            onChange={(e) => setHorizonte(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>

      {isCustom && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Choque curto: {customCurto >= 0 ? "+" : ""}{customCurto} bps
            </label>
            <input
              type="range" min={-300} max={300} step={25} value={customCurto}
              onChange={(e) => setCustomCurto(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Choque longo: {customLongo >= 0 ? "+" : ""}{customLongo} bps
            </label>
            <input
              type="range" min={-300} max={300} step={25} value={customLongo}
              onChange={(e) => setCustomLongo(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      )}

      {/* Comparison table */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-headline font-bold text-sm mb-3">Comparativo de Estratégias</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs">
                <th className="text-left py-2 px-3">Estratégia</th>
                <th className="text-right py-2 px-3">Duration</th>
                <th className="text-right py-2 px-3">Convexidade</th>
                <th className="text-right py-2 px-3">Carry (R$)</th>
                <th className="text-right py-2 px-3">MtM (R$)</th>
                <th className="text-right py-2 px-3">Retorno total (%)</th>
                <th className="text-center py-2 px-3">Ranking</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => {
                const isBest = r.ranking === 1;
                const isWorst = r.ranking === ranked.length;
                const rowColor = isBest
                  ? "text-[#2E8B57]"
                  : isWorst
                    ? "text-[#CC3333]"
                    : "";
                return (
                  <tr key={r.nome} className="border-b border-outline-variant/10">
                    <td className="py-2 px-3 font-bold" style={{ color: COR_ESTRATEGIA[r.nome] }}>
                      {r.nome}
                    </td>
                    <td className="text-right py-2 px-3">{r.duration.toFixed(2)}</td>
                    <td className="text-right py-2 px-3">{r.convexidade.toFixed(4)}</td>
                    <td className="text-right py-2 px-3">{fmtBrl(r.carry)}</td>
                    <td className="text-right py-2 px-3">{fmtBrl(r.mtm)}</td>
                    <td className={`text-right py-2 px-3 font-bold ${rowColor}`}>
                      {r.totalPct.toFixed(2)}%
                    </td>
                    <td className="text-center py-2 px-3">
                      <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold leading-6 ${
                        isBest ? "bg-[#2E8B57]/20 text-[#2E8B57]" : isWorst ? "bg-[#CC3333]/20 text-[#CC3333]" : "bg-surface-container text-on-surface-variant"
                      }`}>
                        {r.ranking}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar chart: Retorno total */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-3">Retorno Total por Estratégia</h3>
          <PlotlyChart
            className="h-[350px]"
            data={[
              {
                x: results.map((r) => r.nome),
                y: results.map((r) => r.totalPct),
                type: "bar" as const,
                marker: {
                  color: results.map((r) => COR_ESTRATEGIA[r.nome] ?? "#2E75B6"),
                },
                text: results.map((r) => r.totalPct.toFixed(2) + "%"),
                textposition: "outside" as const,
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "Retorno (%)", font: { size: 12, color: "#aaabb0" } } },
              xaxis: { ...PLOTLY_LAYOUT.xaxis },
            }}
            config={PLOTLY_CONFIG}
          />
        </div>

        {/* Stacked bar: Carry + MtM */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-3">Decomposição: Carry + MtM</h3>
          <PlotlyChart
            className="h-[350px]"
            data={[
              {
                x: results.map((r) => r.nome),
                y: results.map((r) => r.carry),
                type: "bar" as const,
                name: "Carry",
                marker: { color: "#2E8B57" },
              },
              {
                x: results.map((r) => r.nome),
                y: results.map((r) => r.mtm),
                type: "bar" as const,
                name: "MtM",
                marker: { color: "#CC3333" },
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              barmode: "relative" as const,
              yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "R$", font: { size: 12, color: "#aaabb0" } } },
              legend: { ...PLOTLY_LAYOUT.legend, x: 0, y: 1.12, orientation: "h" as const },
            }}
            config={PLOTLY_CONFIG}
          />
        </div>
      </div>

      {/* Interpretation box */}
      <div className="glass-card rounded-lg p-5 border-l-4 border-primary">
        <h3 className="font-headline font-bold text-sm mb-2">Interpretação</h3>
        <p className="text-sm text-on-surface-variant">
          No cenário <strong className="text-on-surface">{isCustom ? "personalizado" : cenarioKey}</strong> com
          horizonte de <strong className="text-on-surface">{horizonte} meses</strong>,
          a estratégia vencedora é{" "}
          <strong style={{ color: COR_ESTRATEGIA[winner.nome] }}>{winner.nome}</strong> com
          retorno total de <strong className="text-on-surface">{winner.totalPct.toFixed(2)}%</strong>.
          A pior performance é de{" "}
          <strong style={{ color: COR_ESTRATEGIA[loser.nome] }}>{loser.nome}</strong> com{" "}
          <strong className="text-on-surface">{loser.totalPct.toFixed(2)}%</strong>.
          {winner.convexidade > loser.convexidade && winner.totalPct > loser.totalPct
            ? " A maior convexidade da carteira vencedora contribuiu para a proteção em cenários de estresse."
            : " O resultado reflete a combinação de carry e sensibilidade (duration x choque) de cada estratégia."}
        </p>
      </div>

      {/* Heatmap: scenarios x strategies */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-headline font-bold text-sm mb-3">Mapa de Retornos: Cenários x Estratégias</h3>
        <PlotlyChart
          className="h-[450px]"
          data={[
            {
              z: heatmapData.zValues,
              x: ESTRATEGIAS.map((e) => e),
              y: heatmapData.scenarioNames,
              type: "heatmap" as const,
              colorscale: [
                [0, "#CC3333"],
                [0.5, "#D4A012"],
                [1, "#2E8B57"],
              ],
              text: heatmapData.textValues as unknown as string[],
              texttemplate: "%{text}",
              hovertemplate: "Estratégia: %{x}<br>Cenário: %{y}<br>Retorno: %{text}<extra></extra>",
              showscale: true,
              colorbar: {
                title: { text: "Retorno (%)", font: { size: 11, color: "#aaabb0" } },
                tickfont: { color: "#aaabb0" },
              },
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            margin: { l: 200, r: 80, t: 50, b: 80 },
            xaxis: { ...PLOTLY_LAYOUT.xaxis, tickangle: -25 },
            yaxis: { ...PLOTLY_LAYOUT.yaxis, autorange: "reversed" as const },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>
    </div>
  );
}
