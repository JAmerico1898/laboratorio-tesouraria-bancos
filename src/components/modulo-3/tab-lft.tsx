"use client";

import { useState, useMemo } from "react";
import { precificarLft, precificarLtn, type LftResult } from "@/lib/finance";
import { fmtBrl, fmtPct, fmtNum } from "@/lib/format";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG, CHART_COLORS } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

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
      {sub && (
        <span className="text-xs text-on-surface-variant">{sub}</span>
      )}
    </div>
  );
}

export function TabLft() {
  const [vna, setVna] = useState(15234.56);
  const [spread, setSpread] = useState(0);
  const [du, setDu] = useState(504);

  const result: LftResult = useMemo(
    () => precificarLft(vna, spread, du),
    [vna, spread, du],
  );

  // Sensitivity chart: LFT vs LTN comparison across bps range
  const chartData = useMemo(() => {
    const bpsRange: number[] = [];
    const lftPus: number[] = [];
    const ltnPus: number[] = [];
    const ltnBaseTaxa = 0.1425; // 14.25% baseline

    for (let bps = -30; bps <= 30; bps += 1) {
      bpsRange.push(bps);
      lftPus.push(precificarLft(vna, bps, du).pu);
      ltnPus.push(precificarLtn(ltnBaseTaxa + bps / 10000, du).pu);
    }
    return { bpsRange, lftPus, ltnPus };
  }, [vna, du]);

  const agioDesagioColor = result.agioDesagio >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]";

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: LFT (Letra Financeira do Tesouro)
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            A <strong className="text-on-surface">LFT</strong> e um titulo
            pos-fixado indexado a taxa SELIC. Seu VNA (Valor Nominal Atualizado)
            e corrigido diariamente pela SELIC over, tornando-o praticamente
            imune ao risco de mercado.
          </p>
          <div className="mt-2">
            <p className="font-label text-on-surface mb-1">Atualizacao do VNA:</p>
            <KMath tex="VNA_t = 1000 \times \prod_{i=1}^{t} (1 + SELIC_i)^{1/252}" />
          </div>
          <div>
            <p className="font-label text-on-surface mb-1">Cotacao e PU:</p>
            <KMath tex="cota\c{c}\tilde{a}o = \frac{1}{(1 + spread)^{DU/252}}" />
            <KMath tex="PU = VNA \times cota\c{c}\tilde{a}o" />
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong className="text-on-surface">Risco minimo:</strong> VNA ajusta diariamente com a SELIC
            </li>
            <li>
              <strong className="text-on-surface">Spread:</strong> agio/desagio tipicamente entre +-5 a 20 bps
            </li>
            <li>
              Duration efetiva proxima de zero — o titulo mais seguro da curva soberana
            </li>
          </ul>
        </div>
      </details>

      {/* Inputs */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            calculate
          </span>
          Parametros de Precificacao
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              VNA atual (R$)
            </label>
            <input
              type="number"
              value={vna}
              onChange={(e) => setVna(Number(e.target.value))}
              step={0.01}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Spread agio/desagio (bps)
            </label>
            <input
              type="number"
              value={spread}
              onChange={(e) => setSpread(Number(e.target.value))}
              step={1}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Dias uteis ate vencimento
            </label>
            <input
              type="number"
              value={du}
              onChange={(e) => setDu(Number(e.target.value))}
              step={1}
              min={1}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>

      {/* 4 Metric cards */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="PU (R$)"
          value={`R$ ${fmtNum(result.pu)}`}
          sub="Preco unitario"
        />
        <MetricCard
          label="Cotacao (%)"
          value={`${fmtNum(result.cotacao)}%`}
          sub="Fator de agio/desagio"
        />
        <MetricCard
          label="Agio/Desagio vs VNA (R$)"
          value={`R$ ${fmtNum(result.agioDesagio)}`}
          sub={result.agioDesagio >= 0 ? "Desagio (PU > VNA)" : "Agio (PU < VNA)"}
          colorClass={agioDesagioColor}
        />
        <MetricCard
          label="Duration efetiva"
          value={`~${fmtNum(result.durationEfetiva)} anos`}
          sub="Praticamente zero"
        />
      </div>

      {/* Sensitivity chart: LFT vs LTN */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
          Sensibilidade: LFT vs. LTN (mesmos DU = {du})
        </h3>
        <PlotlyChart
          className="h-[400px]"
          data={[
            {
              x: chartData.bpsRange,
              y: chartData.lftPus,
              type: "scatter" as const,
              mode: "lines" as const,
              name: "LFT",
              line: { color: "#2E75B6", width: 2.5 },
              yaxis: "y",
            },
            {
              x: chartData.bpsRange,
              y: chartData.ltnPus,
              type: "scatter" as const,
              mode: "lines" as const,
              name: "LTN (base 14,25%)",
              line: { color: "#C55A11", width: 2.5, dash: "dash" },
              yaxis: "y2",
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "Variacao (bps)" },
            },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "PU LFT (R$)", font: { color: "#2E75B6" } },
              side: "left",
              tickfont: { color: "#2E75B6" },
            },
            yaxis2: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "PU LTN (R$)", font: { color: "#C55A11" } },
              side: "right",
              overlaying: "y" as const,
              tickfont: { color: "#C55A11" },
            },
            legend: { orientation: "h", y: -0.15 },
            margin: { ...PLOTLY_LAYOUT.margin, t: 20 },
          }}
          config={PLOTLY_CONFIG}
        />
        <p className="text-xs text-on-surface-variant mt-2">
          A linha azul (LFT) e praticamente horizontal: variacoes de spread
          causam impacto minimo no PU. Ja a linha laranja tracejada (LTN) mostra
          alta sensibilidade a mesma variacao em bps — evidenciando a diferenca
          fundamental entre pos-fixado e prefixado.
        </p>
      </div>

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Nota pedagogica:</strong> A LFT e
          o &quot;caixa remunerado&quot; da tesouraria. Seu risco de mercado e minimo
          porque o VNA se ajusta diariamente a SELIC. O unico risco e o spread
          (agio/desagio), que raramente ultrapassa 10-20 bps. Por isso, a LFT e
          o lastro preferencial para operacoes compromissadas.
        </p>
      </div>
    </div>
  );
}
