"use client";

import { useState, useMemo } from "react";
import { precificarCdbPos, type CdbPosResult } from "@/lib/finance";
import { fmtBrl, fmtNum } from "@/lib/format";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const BANKING_TEAL = "#0E7C7B";

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

export function TabCdbPos() {
  const [face, setFace] = useState(1000000);
  const [pctEmissao, setPctEmissao] = useState(100);
  const [duTotal, setDuTotal] = useState(504);
  const [duDecorridos, setDuDecorridos] = useState(126);
  const [pctMercado, setPctMercado] = useState(105);

  const result: CdbPosResult = useMemo(
    () => precificarCdbPos(face, pctEmissao, pctMercado, duTotal, duDecorridos),
    [face, pctEmissao, pctMercado, duTotal, duDecorridos],
  );

  // Sensitivity chart: PU MtM vs %CDI mercado (80-130%)
  const chartData = useMemo(() => {
    const pcts: number[] = [];
    const pus: number[] = [];
    for (let p = 80; p <= 130; p += 0.5) {
      pcts.push(p);
      const r = precificarCdbPos(face, pctEmissao, p, duTotal, duDecorridos);
      pus.push(r.puMtm);
    }
    return { pcts, pus };
  }, [face, pctEmissao, duTotal, duDecorridos]);

  const diffColor = result.diferenca >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]";

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: CDB Pos-fixado (% do CDI)
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            O <strong className="text-on-surface">CDB pos-fixado</strong> rende
            um percentual do CDI. Quando o mercado exige um percentual diferente
            do contratado na emissao, o titulo sofre marcacao a mercado (MtM).
          </p>
          <div className="mt-2">
            <p className="font-label text-on-surface mb-1">Logica de MtM:</p>
            <KMath tex="PU_{MtM} = \frac{VF_{esperado}}{(1 + CDI \times \%_{mercado}/100)^{DU_{rest}/252}}" />
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Se <strong className="text-on-surface">%CDI mercado &gt; %CDI emissao</strong>,
              o PU MtM fica abaixo da curva (perda)
            </li>
            <li>
              Se <strong className="text-on-surface">%CDI mercado &lt; %CDI emissao</strong>,
              o PU MtM fica acima da curva (ganho)
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
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Dados da emissao */}
          <div className="space-y-3">
            <h3 className="text-sm font-label text-on-surface font-bold">Dados da emissao</h3>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Face (R$)
              </label>
              <input
                type="number"
                value={face}
                onChange={(e) => setFace(Number(e.target.value))}
                step={100000}
                min={0}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                % CDI emissao
              </label>
              <input
                type="number"
                value={pctEmissao}
                onChange={(e) => setPctEmissao(Number(e.target.value))}
                step={1}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                DU total
              </label>
              <input
                type="number"
                value={duTotal}
                onChange={(e) => setDuTotal(Number(e.target.value))}
                step={1}
                min={1}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                DU decorridos
              </label>
              <input
                type="number"
                value={duDecorridos}
                onChange={(e) => setDuDecorridos(Number(e.target.value))}
                step={1}
                min={0}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Right: Condicoes de mercado */}
          <div className="space-y-3">
            <h3 className="text-sm font-label text-on-surface font-bold">Condicoes de mercado</h3>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                % CDI mercado
              </label>
              <input
                type="number"
                value={pctMercado}
                onChange={(e) => setPctMercado(Number(e.target.value))}
                step={1}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric cards */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="PU na curva"
          value={`R$ ${fmtNum(result.puCurva)}`}
          sub="Valor contabil"
        />
        <MetricCard
          label="PU a mercado"
          value={`R$ ${fmtNum(result.puMtm)}`}
          sub="MtM atual"
        />
        <MetricCard
          label="Diferenca (R$)"
          value={`R$ ${fmtNum(result.diferenca)}`}
          sub="MtM - Curva"
          colorClass={diffColor}
        />
        <MetricCard
          label="Spread (pp CDI)"
          value={`${result.spreadPp >= 0 ? "+" : ""}${fmtNum(result.spreadPp)} pp`}
          sub="Mercado - Emissao"
        />
      </div>

      {/* Sensitivity chart */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
          PU MtM vs % CDI mercado (sensibilidade)
        </h3>
        <PlotlyChart
          className="h-[400px]"
          data={[
            {
              x: chartData.pcts,
              y: chartData.pus,
              type: "scatter" as const,
              mode: "lines" as const,
              name: "PU MtM",
              line: { color: BANKING_TEAL, width: 2.5 },
            },
            {
              x: [pctEmissao],
              y: [result.puCurva],
              type: "scatter" as const,
              mode: "markers" as const,
              name: "% CDI emissao",
              marker: {
                color: "#2E75B6",
                symbol: "diamond",
                size: 12,
              },
            },
            {
              x: [pctMercado],
              y: [result.puMtm],
              type: "scatter" as const,
              mode: "markers" as const,
              name: "% CDI mercado",
              marker: {
                color: "#C55A11",
                symbol: "circle",
                size: 12,
              },
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "% CDI mercado" },
            },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "PU (R$)" },
            },
            legend: { orientation: "h", y: -0.15 },
            margin: { ...PLOTLY_LAYOUT.margin, t: 20 },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Nota pedagogica:</strong> O CDB
          pos-fixado e o instrumento mais comum na tesouraria bancaria. Quando o
          mercado passa a exigir um percentual do CDI diferente do contratado, o
          titulo sofre ganho ou perda de MtM. Quanto maior o prazo restante
          ({duTotal - duDecorridos} DU), maior a sensibilidade a mudancas no
          spread de mercado. A curva acima mostra como o PU varia com o
          percentual do CDI exigido pelo mercado.
        </p>
      </div>
    </div>
  );
}
