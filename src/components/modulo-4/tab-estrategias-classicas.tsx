"use client";

import { useState, useMemo } from "react";
import {
  montarEstrategia,
  calcularMetricasCarteira,
  durationZeroCupom,
  CURVA_DEFAULT,
  COR_ESTRATEGIA,
  type CurvaVertex,
} from "@/lib/finance";
import { fmtPct } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const SELECT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const ESTRATEGIAS = ["Bullet", "Barbell", "Ladder", "Riding the Yield Curve"] as const;

const DESCRICOES: Record<string, { definicao: string; quando: string; vantagem: string; risco: string }> = {
  Bullet: {
    definicao: "Concentra toda a alocação em um único vértice próximo à duration alvo.",
    quando: "Quando se tem alta convicção sobre a direção de um ponto específico da curva.",
    vantagem: "Simplicidade e exposição direcional precisa ao vértice escolhido.",
    risco: "Concentração total — sem diversificação de vértices.",
  },
  Barbell: {
    definicao: "Distribui a alocação entre os extremos da curva (curto e longo) para atingir a duration alvo.",
    quando: "Quando se espera movimentos não paralelos (flattening ou steepening) na curva.",
    vantagem: "Maior convexidade que bullet — beneficia-se de movimentos grandes em qualquer direção.",
    risco: "Exposição a twist risk — movimentos opostos nos extremos da curva.",
  },
  Ladder: {
    definicao: "Distribui igualmente entre todos os vértices disponíveis da curva.",
    quando: "Quando não há convicção direcional forte e se busca diversificação máxima.",
    vantagem: "Diversificação total, reinvestimento natural e menor risco de concentração.",
    risco: "Desempenho medíocre em cenários direcionais fortes — nunca é a melhor nem a pior.",
  },
  "Riding the Yield Curve": {
    definicao: "Compra títulos mais longos que o horizonte de investimento, lucrando com o rolldown na curva.",
    quando: "Quando a curva é positivamente inclinada e se espera estabilidade nas taxas.",
    vantagem: "Ganho extra via rolldown além do carry — potencializa retorno em curva estável.",
    risco: "Se a curva se desloca para cima, o ganho de rolldown pode ser eliminado ou superado pela perda de MtM.",
  },
};

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

export function TabEstrategiasClassicas() {
  const [estrategia, setEstrategia] = useState<string>("Bullet");
  const [durAlvo, setDurAlvo] = useState(3);

  const cart = useMemo(
    () => montarEstrategia(estrategia, CURVA_DEFAULT, durAlvo),
    [estrategia, durAlvo],
  );
  const metrics = useMemo(() => calcularMetricasCarteira(cart), [cart]);

  const activeRows = useMemo(() => {
    return cart
      .filter((v) => v.peso > 0.01)
      .map((v) => {
        const r = durationZeroCupom(v.taxa / 100, v.prazoDu);
        return {
          vertice: v.vertice,
          du: v.prazoDu,
          taxa: v.taxa,
          peso: v.peso,
          contribDur: (v.peso / 100) * r.durMod,
        };
      });
  }, [cart]);

  const cor = COR_ESTRATEGIA[estrategia] ?? "#2E75B6";
  const desc = DESCRICOES[estrategia];

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">school</span>
          Conceitos: Estratégias Clássicas de Carteira
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          {ESTRATEGIAS.map((e) => {
            const d = DESCRICOES[e];
            return (
              <div key={e} className="border-l-4 pl-3 py-1" style={{ borderColor: COR_ESTRATEGIA[e] }}>
                <p className="font-bold text-on-surface">{e}</p>
                <p>{d.definicao}</p>
                <p><strong className="text-on-surface">Quando usar:</strong> {d.quando}</p>
                <p><strong className="text-on-surface">Vantagem:</strong> {d.vantagem}</p>
                <p><strong className="text-on-surface">Risco:</strong> {d.risco}</p>
              </div>
            );
          })}
        </div>
      </details>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Estratégia
          </label>
          <select
            value={estrategia}
            onChange={(e) => setEstrategia(e.target.value)}
            className={SELECT_CLASS}
          >
            {ESTRATEGIAS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Duration alvo: {durAlvo.toFixed(1)} anos
          </label>
          <input
            type="range"
            min={1}
            max={7}
            step={0.5}
            value={durAlvo}
            onChange={(e) => setDurAlvo(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-on-surface-variant mt-1">
            <span>1 ano</span>
            <span>7 anos</span>
          </div>
        </div>
      </div>

      {/* Dual-axis chart */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-headline font-bold text-sm mb-4">Curva Spot e Pesos da Carteira</h3>
        <PlotlyChart
          className="h-[400px]"
          data={[
            {
              x: CURVA_DEFAULT.map((v) => v.vertice),
              y: CURVA_DEFAULT.map((v) => v.taxa),
              type: "scatter" as const,
              mode: "lines+markers" as const,
              name: "Curva Spot (% a.a.)",
              line: { color: "#2E75B6", width: 2.5 },
              marker: { size: 7 },
              yaxis: "y",
            },
            {
              x: cart.map((v) => v.vertice),
              y: cart.map((v) => v.peso),
              type: "bar" as const,
              name: "Peso (%)",
              marker: { color: cor, opacity: 0.7 },
              yaxis: "y2",
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            title: { text: `${estrategia} — Duration alvo ${durAlvo.toFixed(1)}A`, font: { size: 14, color: "#aaabb0" } },
            xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: "Vértice", font: { size: 12, color: "#aaabb0" } } },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "Taxa (% a.a.)", font: { size: 12, color: "#2E75B6" } },
              side: "left",
              showgrid: true,
            },
            yaxis2: {
              title: { text: "Peso (%)", font: { size: 12, color: cor } },
              side: "right",
              overlaying: "y",
              showgrid: false,
              range: [0, 110],
              gridcolor: "rgba(255,255,255,0.08)",
              zerolinecolor: "rgba(255,255,255,0.12)",
            },
            legend: { ...PLOTLY_LAYOUT.legend, x: 0, y: 1.12, orientation: "h" as const },
            barmode: "overlay" as const,
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Duration efetiva"
          value={metrics.duration.toFixed(2)}
          sub="anos (mod.)"
        />
        <MetricCard
          label="Convexidade"
          value={metrics.convexidade.toFixed(4)}
        />
        <MetricCard
          label="Vértices"
          value={String(metrics.nVertices)}
          sub={`de ${CURVA_DEFAULT.length} disponíveis`}
        />
        <MetricCard
          label="Yield médio"
          value={fmtPct(metrics.yieldMedio)}
          sub="% a.a."
        />
      </div>

      {/* Composition table */}
      {activeRows.length > 0 && (
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-3">Composição da Carteira</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs">
                  <th className="text-left py-2 px-3">Vértice</th>
                  <th className="text-right py-2 px-3">DU</th>
                  <th className="text-right py-2 px-3">Taxa (% a.a.)</th>
                  <th className="text-right py-2 px-3">Peso (%)</th>
                  <th className="text-right py-2 px-3">Contrib. Duration</th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map((r) => (
                  <tr key={r.vertice} className="border-b border-outline-variant/10">
                    <td className="py-2 px-3 font-bold" style={{ color: cor }}>{r.vertice}</td>
                    <td className="text-right py-2 px-3">{r.du}</td>
                    <td className="text-right py-2 px-3">{fmtPct(r.taxa)}</td>
                    <td className="text-right py-2 px-3">{r.peso.toFixed(2)}%</td>
                    <td className="text-right py-2 px-3">{r.contribDur.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
