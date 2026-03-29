"use client";

import { useState, useMemo } from "react";
import { precificarLtn, type LtnResult } from "@/lib/finance";
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

export function TabLtn() {
  const [taxa, setTaxa] = useState(12.50);
  const [du, setDu] = useState(252);

  const result: LtnResult = useMemo(
    () => precificarLtn(taxa / 100, du),
    [taxa, du],
  );

  // Sensitivity chart data: 100 points from 5% to 25%
  const chartData = useMemo(() => {
    const taxas: number[] = [];
    const pus: number[] = [];
    for (let t = 5; t <= 25; t += 0.2) {
      taxas.push(t);
      pus.push(precificarLtn(t / 100, du).pu);
    }
    return { taxas, pus };
  }, [du]);

  const diffTrunc = Math.abs(result.puSemTrunc - result.pu);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: LTN (Letra do Tesouro Nacional)
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            A <strong className="text-on-surface">LTN</strong> é um titulo
            prefixado zero cupom com valor de face de R$ 1.000. Seu preco
            unitario (PU) e obtido descontando o valor de face pela taxa de
            mercado, na convencao de dias uteis sobre 252.
          </p>
          <div className="mt-2">
            <p className="font-label text-on-surface mb-1">Formula de precificacao:</p>
            <KMath tex="PU = \frac{1000}{(1 + taxa)^{DU/252}}" />
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong className="text-on-surface">LTN:</strong> prefixado zero cupom, face R$ 1.000
            </li>
            <li>
              <strong className="text-on-surface">Truncamento ANBIMA:</strong> fator de desconto truncado em 6 casas decimais
            </li>
            <li>
              Relacao taxa x preco e <strong className="text-on-surface">inversa e convexa</strong>
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
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Taxa de mercado (% a.a.)
            </label>
            <input
              type="number"
              value={taxa}
              onChange={(e) => setTaxa(Number(e.target.value))}
              step={0.05}
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
          label="Duration (anos)"
          value={fmtNum(result.duration)}
          sub={`${du} dias uteis`}
        />
        <MetricCard
          label="Duration modificada"
          value={fmtNum(result.durMod)}
          sub={`Sensibilidade % por 1pp`}
        />
        <MetricCard
          label="Sensibilidade +100bps (R$)"
          value={`R$ ${fmtNum(result.sensib100bps)}`}
          sub="Variacao no PU por +1pp"
          colorClass="text-[#CC3333]"
        />
      </div>

      {/* Step-by-step calculation */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            function
          </span>
          Calculo passo a passo
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <div>
            <p className="font-label text-on-surface mb-1">1. Fator de desconto:</p>
            <KMath
              tex={`Fator = (1 + ${fmtPct(taxa / 100, 2)})^{${du}/252} = ${result.fator.toFixed(6)}`}
            />
          </div>
          <div>
            <p className="font-label text-on-surface mb-1">2. Fator truncado (ANBIMA, 6 casas):</p>
            <KMath
              tex={`Fator_{trunc} = ${result.fatorTrunc.toFixed(6)}`}
            />
          </div>
          <div>
            <p className="font-label text-on-surface mb-1">3. Preco unitario:</p>
            <KMath
              tex={`PU = \\frac{1000}{${result.fatorTrunc.toFixed(6)}} = R\\$ \\ ${fmtNum(result.pu)}`}
            />
          </div>
          <div>
            <p className="font-label text-on-surface mb-1">4. Diferenca por truncamento:</p>
            <KMath
              tex={`\\Delta_{trunc} = |${fmtNum(result.puSemTrunc)} - ${fmtNum(result.pu)}| = R\\$ \\ ${fmtNum(diffTrunc)}`}
            />
          </div>
        </div>
      </details>

      {/* Sensitivity chart */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
          Curva PU x Taxa (sensibilidade)
        </h3>
        <PlotlyChart
          className="h-[400px]"
          data={[
            {
              x: chartData.taxas,
              y: chartData.pus,
              type: "scatter" as const,
              mode: "lines" as const,
              name: "PU",
              line: { color: CHART_COLORS.primary, width: 2.5 },
            },
            {
              x: [taxa],
              y: [result.pu],
              type: "scatter" as const,
              mode: "markers" as const,
              name: "Taxa atual",
              marker: {
                color: CHART_COLORS.accent,
                symbol: "diamond",
                size: 12,
              },
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "Taxa (% a.a.)" },
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
          <strong className="text-on-surface">Nota pedagogica:</strong> A LTN e
          o titulo mais simples — zero cupom, prefixado. Sua sensibilidade a
          variacoes de taxa e proporcional a duration: quanto maior o prazo, maior
          a variacao no preco para um mesmo choque de taxa. Com duration de{" "}
          {fmtNum(result.duration)} anos, um aumento de 100 bps na taxa reduz o
          PU em aproximadamente R$ {fmtNum(result.sensib100bps)}. A curva acima
          evidencia a <strong className="text-on-surface">convexidade</strong>:
          quedas de taxa geram ganhos maiores do que perdas por altas equivalentes.
        </p>
      </div>
    </div>
  );
}
