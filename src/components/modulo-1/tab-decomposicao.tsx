"use client";

import { useState, useEffect, useMemo } from "react";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { SPREADS_CREDITO, PREMIO_LIQUIDEZ } from "@/lib/finance";
import { loadSelicMeta } from "@/lib/data";
import { fmtPct } from "@/lib/format";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const RATING_KEYS = Object.keys(SPREADS_CREDITO);
const LIQUIDITY_KEYS = Object.keys(PREMIO_LIQUIDEZ);

function mean(range: [number, number]): number {
  return (range[0] + range[1]) / 2;
}

function fmtRange(range: [number, number]): string {
  return `${range[0]}–${range[1]} bps`;
}

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  colorClass?: string;
}

function MetricCard({ label, value, sub, colorClass }: MetricCardProps) {
  return (
    <div className="glass-card rounded-lg p-4 flex flex-col gap-1">
      <span className="text-xs font-label text-on-surface-variant">{label}</span>
      <span className={`text-xl font-headline font-bold ${colorClass ?? ""}`}>{value}</span>
      {sub && <span className="text-xs text-on-surface-variant">{sub}</span>}
    </div>
  );
}

export function TabDecomposicao() {
  const [opRate, setOpRate] = useState(15.5);
  const [riskFreeRate, setRiskFreeRate] = useState(14.25);
  const [rating, setRating] = useState("BBB");
  const [liquidity, setLiquidity] = useState("Média (debêntures investment grade)");
  const [maturity, setMaturity] = useState(3.0);

  // Load latest SELIC meta on mount
  useEffect(() => {
    loadSelicMeta()
      .then((data) => {
        if (data.length > 0) {
          const latest = data[data.length - 1].valor;
          setRiskFreeRate(latest);
        }
      })
      .catch(() => {
        // keep default
      });
  }, []);

  const {
    riskFree,
    creditSpread,
    liqPremium,
    termPremium,
    totalRate,
    isNegativeTermPremium,
  } = useMemo(() => {
    const opRateDec = opRate / 100;
    const riskFreeDec = riskFreeRate / 100;
    const creditSpreadDec = mean(SPREADS_CREDITO[rating]) / 10000; // bps → decimal
    const liqPremiumDec = mean(PREMIO_LIQUIDEZ[liquidity]) / 10000; // bps → decimal
    const termPremiumDec = (opRateDec - riskFreeDec) - creditSpreadDec - liqPremiumDec;
    return {
      riskFree: riskFreeDec * 100,
      creditSpread: creditSpreadDec * 100,
      liqPremium: liqPremiumDec * 100,
      termPremium: termPremiumDec * 100,
      totalRate: opRateDec * 100,
      isNegativeTermPremium: termPremiumDec < 0,
    };
  }, [opRate, riskFreeRate, rating, liquidity]);

  const waterfallData = useMemo(() => {
    const components = [riskFree, creditSpread, liqPremium, termPremium];
    const textValues = [
      ...components.map((v) => `${v >= 0 ? "+" : ""}${fmtPct(v, 2)}`),
      fmtPct(totalRate, 2),
    ];
    return {
      x: ["Taxa Livre de Risco", "Spread de Crédito", "Prêmio de Liquidez", "Prêmio de Prazo", "Total"],
      y: [riskFree, creditSpread, liqPremium, termPremium, 0],
      measure: ["relative", "relative", "relative", "relative", "total"],
      text: textValues,
    };
  }, [riskFree, creditSpread, liqPremium, termPremium, totalRate]);

  const tableRows = [
    {
      componente: "Taxa Livre de Risco (SELIC)",
      valor: fmtPct(riskFree, 2),
      faixa: "SELIC Meta vigente",
    },
    {
      componente: "Spread de Crédito",
      valor: fmtPct(creditSpread, 2),
      faixa: fmtRange(SPREADS_CREDITO[rating]),
    },
    {
      componente: "Prêmio de Liquidez",
      valor: fmtPct(liqPremium, 2),
      faixa: fmtRange(PREMIO_LIQUIDEZ[liquidity]),
    },
    {
      componente: "Prêmio de Prazo",
      valor: fmtPct(termPremium, 2),
      faixa: "Residual (calculado)",
    },
    {
      componente: "Total (Taxa da Operação)",
      valor: fmtPct(totalRate, 2),
      faixa: "—",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-xl">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">school</span>
          Conceitos: Decomposição da Taxa de Juros
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            Uma taxa de juros de mercado embute múltiplos prêmios de risco. Identificar e quantificar
            cada componente é essencial para avaliar se uma operação oferece retorno adequado ao risco
            assumido.
          </p>
          <div>
            <p className="font-label text-on-surface mb-2">Equação de decomposição:</p>
            <KMath tex="i_{\text{operação}} = i_{\text{livre de risco}} + \text{spread}_{\text{crédito}} + \text{prêmio}_{\text{liquidez}} + \text{prêmio}_{\text{prazo}}" />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <div className="glass-card rounded-lg p-4 border-l-4 border-[#2E75B6]">
              <p className="font-label text-on-surface mb-1">Taxa Livre de Risco</p>
              <p>
                Custo de oportunidade sem risco — tipicamente a SELIC Meta no Brasil. Reflete a
                política monetária do BCB e o patamar básico de remuneração do capital.
              </p>
            </div>
            <div className="glass-card rounded-lg p-4 border-l-4 border-[#C55A11]">
              <p className="font-label text-on-surface mb-1">Spread de Crédito</p>
              <p>
                Compensação pelo risco de inadimplência do emissor, medido pelo rating. Varia de
                30 bps (AAA) até &gt;700 bps (CCC).
              </p>
            </div>
            <div className="glass-card rounded-lg p-4 border-l-4 border-[#8B5CF6]">
              <p className="font-label text-on-surface mb-1">Prêmio de Liquidez</p>
              <p>
                Compensação pela dificuldade de vender o título antes do vencimento sem desconto
                de preço. Títulos públicos têm liquidez alta (0–10 bps); crédito privado ilíquido
                pode exigir 50–120 bps adicionais.
              </p>
            </div>
            <div className="glass-card rounded-lg p-4 border-l-4 border-[#2E8B57]">
              <p className="font-label text-on-surface mb-1">Prêmio de Prazo</p>
              <p>
                Compensação pelo risco de duration — quanto mais longo o prazo, maior a
                sensibilidade a variações de taxa. Calculado como o resíduo após os demais
                componentes.
              </p>
            </div>
          </div>
        </div>
      </details>

      {/* Inputs */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">tune</span>
          Parâmetros da Operação
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Taxa da operação (% a.a.)
            </label>
            <input
              type="number"
              value={opRate}
              step={0.1}
              onChange={(e) => setOpRate(Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Taxa livre de risco / SELIC (% a.a.)
            </label>
            <input
              type="number"
              value={riskFreeRate}
              step={0.25}
              onChange={(e) => setRiskFreeRate(Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Rating do emissor
            </label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className={INPUT_CLASS}
            >
              {RATING_KEYS.map((r) => (
                <option key={r} value={r}>
                  {r} ({fmtRange(SPREADS_CREDITO[r])})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Liquidez do instrumento
            </label>
            <select
              value={liquidity}
              onChange={(e) => setLiquidity(e.target.value)}
              className={INPUT_CLASS}
            >
              {LIQUIDITY_KEYS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Prazo: <strong>{maturity} anos</strong>
            </label>
            <input
              type="range"
              min={0.5}
              max={10}
              step={0.5}
              value={maturity}
              onChange={(e) => setMaturity(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-on-surface-variant mt-1">
              <span>0,5 anos</span>
              <span>10 anos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning if term premium is negative */}
      {isNegativeTermPremium && (
        <div className="glass-card rounded-lg p-4 border-l-4 border-[#CC3333]">
          <p className="text-sm text-on-surface-variant">
            <strong className="text-[#CC3333]">Atenção:</strong> O prêmio de prazo calculado é{" "}
            <strong>{fmtPct(termPremium, 2)}</strong>, indicando que a taxa da operação não cobre
            adequadamente todos os riscos identificados (crédito + liquidez + livre de risco). Revise
            os parâmetros ou considere que a operação pode estar subprecificada.
          </p>
        </div>
      )}

      {/* Waterfall chart */}
      <div className="glass-card rounded-xl p-4">
        <PlotlyChart
          className="h-[450px]"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data={[
            {
              type: "waterfall",
              x: waterfallData.x,
              y: waterfallData.y,
              measure: waterfallData.measure,
              connector: { line: { color: "gray", width: 1, dash: "dot" } },
              increasing: { marker: { color: "#2E8B57" } },
              decreasing: { marker: { color: "#CC3333" } },
              totals: { marker: { color: "#2E75B6" } },
              text: waterfallData.text,
              textposition: "outside",
              textfont: { color: "#aaabb0" },
            } as any,
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            title: { text: "Decomposição da Taxa de Juros", font: { color: "#aaabb0", size: 14 } },
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
            },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "% a.a." },
              ticksuffix: "%",
            },
            showlegend: false,
            margin: { l: 60, r: 30, t: 60, b: 50 },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Detail table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container">
              <th className="text-left px-4 py-3 font-label text-on-surface-variant">Componente</th>
              <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                Valor (% a.a.)
              </th>
              <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                Faixa indicativa
              </th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, i) => (
              <tr
                key={row.componente}
                className={`border-b border-outline-variant/20 ${
                  i === tableRows.length - 1
                    ? "bg-primary/5 font-bold"
                    : i % 2 === 0
                    ? "bg-surface-container/40"
                    : ""
                }`}
              >
                <td className="px-4 py-3 font-label">{row.componente}</td>
                <td
                  className={`px-4 py-3 text-right font-headline font-bold ${
                    i < tableRows.length - 1 && Number(row.valor.replace(",", ".").replace("%", "")) < 0
                      ? "text-[#CC3333]"
                      : ""
                  }`}
                >
                  {row.valor}
                </td>
                <td className="px-4 py-3 text-right text-on-surface-variant">{row.faixa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Metric cards */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Taxa Livre de Risco"
          value={fmtPct(riskFree, 2)}
          sub="SELIC Meta"
        />
        <MetricCard
          label="Spread de Crédito"
          value={fmtPct(creditSpread, 2)}
          sub={`Rating ${rating}`}
        />
        <MetricCard
          label="Prêmio de Liquidez"
          value={fmtPct(liqPremium, 2)}
          sub={LIQUIDITY_KEYS.indexOf(liquidity) === 0 ? "Alta liquidez" : LIQUIDITY_KEYS.indexOf(liquidity) === 1 ? "Liquidez média" : "Baixa liquidez"}
        />
        <MetricCard
          label="Prêmio de Prazo"
          value={fmtPct(termPremium, 2)}
          sub={`${maturity} anos`}
          colorClass={isNegativeTermPremium ? "text-[#CC3333]" : ""}
        />
      </div>

      {/* Info box */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Decisão gerencial:</strong> Quando um gestor avalia uma
          operação, precisa entender se o spread compensa cada fonte de risco. Uma taxa atrativa pode
          esconder risco de crédito ou liquidez subestimado.
        </p>
      </div>
    </div>
  );
}
