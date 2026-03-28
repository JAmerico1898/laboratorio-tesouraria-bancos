"use client";

import { useState, useMemo } from "react";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { puLtn, durationModificada } from "@/lib/finance";
import { fmtBrl, fmtPct, fmtNum } from "@/lib/format";
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
    <div className="glass-card rounded-lg p-4 flex flex-col gap-1">
      <span className="text-xs font-label text-on-surface-variant">{label}</span>
      <span className={`text-xl font-headline font-bold ${colorClass ?? ""}`}>
        {value}
      </span>
      {sub && (
        <span className="text-xs text-on-surface-variant">{sub}</span>
      )}
    </div>
  );
}

export function TabPrecificacao() {
  // LTN Pricer state
  const [txPricer, setTxPricer] = useState(13.75);
  const [duPricer, setDuPricer] = useState(252);

  // Sensitivity state
  const [posicao, setPosicao] = useState(10_000_000);
  const [txSens, setTxSens] = useState(13.75);
  const [duSens, setDuSens] = useState(252);
  const [shockBps, setShockBps] = useState(50);

  // --- LTN Pricer derived values ---
  const txPricerDec = txPricer / 100;
  const pu = puLtn(txPricerDec, duPricer);
  const dur = durationModificada(txPricerDec, duPricer);
  const maturidadeAnos = duPricer / 252;

  // Chart 1: PU vs Rate (5%-25%)
  const chartPuRate = useMemo(() => {
    const rates: number[] = [];
    const pus: number[] = [];
    for (let r = 5; r <= 25; r += 0.25) {
      rates.push(r);
      pus.push(puLtn(r / 100, duPricer));
    }
    return { rates, pus };
  }, [duPricer]);

  // Chart 2: PU vs Maturity (two lines: current rate and current+2pp)
  const chartPuMaturity = useMemo(() => {
    const dus: number[] = [];
    const pusCurrent: number[] = [];
    const pusShifted: number[] = [];
    for (let d = 21; d <= 504; d += 21) {
      dus.push(d);
      pusCurrent.push(puLtn(txPricerDec, d));
      pusShifted.push(puLtn(txPricerDec + 0.02, d));
    }
    return { dus, pusCurrent, pusShifted };
  }, [txPricerDec]);

  // --- Sensitivity derived values ---
  const txSensDec = txSens / 100;
  const puBefore = puLtn(txSensDec, duSens);
  const txAfterDec = txSensDec + shockBps / 10000;
  const puAfter = puLtn(txAfterDec, duSens);
  const qtd = posicao / puBefore;
  const vlBefore = qtd * puBefore;
  const vlAfter = qtd * puAfter;
  const varRs = vlAfter - vlBefore;
  const durSens = durationModificada(txSensDec, duSens);
  const durApproxPct = -durSens * (shockBps / 10000);
  const durApproxRs = vlBefore * durApproxPct;

  // Chart 3: P&L bar chart — horizontal bars from -200 to +200 bps in 25 bps steps
  const chartPnl = useMemo(() => {
    const shocks: number[] = [];
    const pnls: number[] = [];
    for (let s = -200; s <= 200; s += 25) {
      shocks.push(s);
      const txS = txSensDec + s / 10000;
      const puS = puLtn(txS, duSens);
      const qtdS = posicao / puBefore;
      pnls.push(qtdS * (puS - puBefore));
    }
    return { shocks, pnls };
  }, [txSensDec, duSens, posicao, puBefore]);

  const pnlColors = chartPnl.pnls.map((v, i) => {
    const isCurrentShock = chartPnl.shocks[i] === shockBps;
    if (isCurrentShock) return v >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative;
    return v >= 0 ? CHART_COLORS.positive + "aa" : CHART_COLORS.negative + "aa";
  });

  const pnlLineColors = chartPnl.shocks.map((s) => s === shockBps ? "#000000" : "rgba(0,0,0,0)");

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: Precificação de LTN e Duração
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            A <strong className="text-on-surface">LTN (Letra do Tesouro Nacional)</strong> é
            um título zero-cupom prefixado — paga apenas o valor de face R$ 1.000
            no vencimento. Seu preço (PU) é o valor presente desse fluxo único,
            descontado pela taxa de mercado na convenção DU/252.
          </p>
          <p>
            A relação taxa × preço é <strong className="text-on-surface">inversa e não-linear</strong>:
            quando a taxa sobe, o PU cai — e vice-versa. A{" "}
            <strong className="text-on-surface">Duration Modificada</strong> mede a sensibilidade
            percentual do preço a variações de taxa.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <div>
              <p className="font-label text-on-surface mb-1">PU da LTN:</p>
              <KMath tex="PU_{LTN} = \frac{1.000}{(1 + i)^{DU/252}}" />
            </div>
            <div>
              <p className="font-label text-on-surface mb-1">Duration Modificada:</p>
              <KMath tex="D^* = \frac{DU/252}{1+i}" />
            </div>
          </div>
        </div>
      </details>

      {/* LTN Pricer */}
      <section className="space-y-5">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            calculate
          </span>
          Precificador de LTN
        </h2>

        <div className="glass-card rounded-lg p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Taxa de mercado (% a.a.)
              </label>
              <input
                type="number"
                value={txPricer}
                onChange={(e) => setTxPricer(Number(e.target.value))}
                step={0.25}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Prazo até o vencimento: <strong>{duPricer} DU</strong>
              </label>
              <input
                type="range"
                min={1}
                max={504}
                value={duPricer}
                onChange={(e) => setDuPricer(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                <span>1 DU</span>
                <span>504 DU (≈ 2 anos)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <MetricCard
            label="PU (Preço Unitário)"
            value={`R$ ${fmtNum(pu)}`}
            sub="Base R$ 1.000"
          />
          <MetricCard
            label="Duration Modificada"
            value={`${fmtNum(dur)} anos`}
            sub={`ΔPU ≈ ${fmtPct(-dur * 0.01, 2)} por +1pp`}
          />
          <MetricCard
            label="Maturidade"
            value={`${fmtNum(maturidadeAnos)} anos`}
            sub={`${duPricer} dias úteis`}
          />
        </div>

        {/* Chart 1: PU vs Rate */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
            Curva PU × Taxa (prazo fixo: {duPricer} DU)
          </h3>
          <PlotlyChart
            className="h-[320px]"
            data={[
              {
                x: chartPuRate.rates,
                y: chartPuRate.pus,
                type: "scatter",
                mode: "lines",
                name: "PU",
                line: { color: CHART_COLORS.primary, width: 2 },
              },
              {
                x: [txPricer],
                y: [pu],
                type: "scatter",
                mode: "markers",
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
              xaxis: { title: { text: "Taxa (% a.a.)" } },
              yaxis: { title: { text: "PU (R$)" } },
              legend: { orientation: "h", y: -0.15 },
              margin: { ...PLOTLY_LAYOUT.margin, t: 20 },
            }}
            config={PLOTLY_CONFIG}
          />
        </div>

        {/* Chart 2: PU vs Maturity */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
            Curva PU × Prazo (taxa atual vs +2pp)
          </h3>
          <PlotlyChart
            className="h-[320px]"
            data={[
              {
                x: chartPuMaturity.dus,
                y: chartPuMaturity.pusCurrent,
                type: "scatter",
                mode: "lines",
                name: `${fmtPct(txPricerDec, 2)} a.a. (atual)`,
                line: { color: CHART_COLORS.primary, width: 2 },
              },
              {
                x: chartPuMaturity.dus,
                y: chartPuMaturity.pusShifted,
                type: "scatter",
                mode: "lines",
                name: `${fmtPct(txPricerDec + 0.02, 2)} a.a. (+2pp)`,
                line: {
                  color: CHART_COLORS.accent,
                  width: 2,
                  dash: "dash",
                },
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              xaxis: { title: { text: "Prazo (DU)" } },
              yaxis: { title: { text: "PU (R$)" } },
              legend: { orientation: "h", y: -0.15 },
              margin: { ...PLOTLY_LAYOUT.margin, t: 20 },
            }}
            config={PLOTLY_CONFIG}
          />
        </div>

        <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
          <p className="text-sm text-on-surface-variant">
            <strong className="text-on-surface">Efeito duration:</strong> quanto maior o prazo,
            maior a duration e maior a sensibilidade do PU a variações de taxa. Uma LTN de{" "}
            {duPricer} DU tem duration de {fmtNum(dur)} anos — uma alta de 1pp na taxa reduz
            o PU em aproximadamente {fmtPct(dur / 100, 2)}.
          </p>
        </div>
      </section>

      {/* Sensitivity Analysis */}
      <section className="space-y-5">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            analytics
          </span>
          Análise de Sensibilidade (P&L)
        </h2>

        <div className="glass-card rounded-lg p-5 space-y-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Posição (R$)
              </label>
              <input
                type="number"
                value={posicao}
                onChange={(e) => setPosicao(Number(e.target.value))}
                step={1000000}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Taxa inicial (% a.a.)
              </label>
              <input
                type="number"
                value={txSens}
                onChange={(e) => setTxSens(Number(e.target.value))}
                step={0.25}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Prazo: <strong>{duSens} DU</strong>
              </label>
              <input
                type="range"
                min={21}
                max={504}
                value={duSens}
                onChange={(e) => setDuSens(Number(e.target.value))}
                className="w-full accent-primary mt-2"
              />
              <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                <span>21 DU</span>
                <span>504 DU</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Choque: <strong>{shockBps >= 0 ? "+" : ""}{shockBps} bps</strong>
              </label>
              <input
                type="range"
                min={-200}
                max={200}
                step={10}
                value={shockBps}
                onChange={(e) => setShockBps(Number(e.target.value))}
                className="w-full accent-primary mt-2"
              />
              <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                <span>-200 bps</span>
                <span>+200 bps</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="PU antes do choque"
            value={`R$ ${fmtNum(puBefore)}`}
            sub={`Taxa: ${fmtPct(txSensDec, 2)} a.a.`}
          />
          <MetricCard
            label="PU após o choque"
            value={`R$ ${fmtNum(puAfter)}`}
            sub={`Taxa: ${fmtPct(txAfterDec, 2)} a.a.`}
          />
          <MetricCard
            label="P&L da posição"
            value={fmtBrl(varRs)}
            sub={`Posição: ${fmtBrl(vlBefore)}`}
            colorClass={varRs >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}
          />
          <MetricCard
            label="Duration Modificada"
            value={`${fmtNum(durSens)} anos`}
            sub={`DV01: ${fmtBrl(-vlBefore * durSens * 0.0001)}`}
          />
        </div>

        {/* Chart 3: P&L bar chart */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
            P&L por Cenário de Choque (−200 a +200 bps)
          </h3>
          <PlotlyChart
            className="h-[600px]"
            data={[
              {
                y: chartPnl.shocks.map((s) => `${s >= 0 ? "+" : ""}${s} bps`),
                x: chartPnl.pnls,
                type: "bar",
                orientation: "h",
                name: "P&L",
                marker: {
                  color: pnlColors,
                  line: {
                    color: pnlLineColors,
                    width: chartPnl.shocks.map((s) => (s === shockBps ? 2 : 0)),
                  },
                },
                hovertemplate: "%{y}: R$ %{x:,.2f}<extra></extra>",
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              xaxis: {
                title: { text: "P&L (R$)" },
                tickformat: ",.0f",
                zeroline: true,
                zerolinecolor: "#333",
                zerolinewidth: 2,
              },
              yaxis: { title: { text: "Choque de taxa" }, automargin: true },
              margin: { l: 90, r: 30, t: 20, b: 50 },
              bargap: 0.15,
            }}
            config={PLOTLY_CONFIG}
          />
        </div>

        <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
          <p className="text-sm text-on-surface-variant">
            <strong className="text-on-surface">Resultado do choque:</strong> com choque de{" "}
            {shockBps >= 0 ? "+" : ""}
            {shockBps} bps, a posição de {fmtBrl(posicao)} varia{" "}
            <strong className={varRs >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}>
              {fmtBrl(varRs)}
            </strong>
            . A aproximação pela Duration sugere{" "}
            <strong>{fmtBrl(durApproxRs)}</strong> (erro de duration de{" "}
            {fmtBrl(Math.abs(varRs - durApproxRs))} — a convexidade explica a
            diferença para choques maiores).
          </p>
        </div>
      </section>
    </div>
  );
}
