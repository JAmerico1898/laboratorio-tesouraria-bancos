"use client";

import { useState, useMemo } from "react";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { premioPrazo, SPREADS_CREDITO_MOD2, PREMIO_LIQUIDEZ_MOD2 } from "@/lib/finance";
import { fmtPct } from "@/lib/format";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const CREDITO_KEYS = Object.keys(SPREADS_CREDITO_MOD2);
const LIQUIDEZ_KEYS = Object.keys(PREMIO_LIQUIDEZ_MOD2);

const DECOMP_COLORS = {
  real: "#1B3A5C",
  inflacao: "#8B5CF6",
  credito: "#C55A11",
  liquidez: "#D4A012",
  prazo: "#888888",
  total: "#2E75B6",
};

export function TabAnatomiaTaxa() {
  const [txReal, setTxReal] = useState(5.0);
  const [expInflacao, setExpInflacao] = useState(4.5);
  const [credito, setCredito] = useState(CREDITO_KEYS[0]);
  const [liquidez, setLiquidez] = useState(LIQUIDEZ_KEYS[0]);
  const [prazoAnos, setPrazoAnos] = useState(3.0);

  const { spCred, spLiq, spPrazo, taxaTotal, spreadRf } = useMemo(() => {
    const spCredPp = SPREADS_CREDITO_MOD2[credito] / 100;
    const spLiqPp = PREMIO_LIQUIDEZ_MOD2[liquidez] / 100;
    const spPrazoPp = premioPrazo(prazoAnos);
    const total = txReal + expInflacao + spCredPp + spLiqPp + spPrazoPp;
    const spread = (total - txReal) * 100;
    return { spCred: spCredPp, spLiq: spLiqPp, spPrazo: spPrazoPp, taxaTotal: total, spreadRf: spread };
  }, [txReal, expInflacao, credito, liquidez, prazoAnos]);

  const waterfallData = useMemo(() => {
    const labels = ["Taxa Real", "Inflação Esperada", "Prêmio Crédito", "Prêmio Liquidez", "Prêmio Prazo", "Total"];
    const vals = [txReal, expInflacao, spCred, spLiq, spPrazo, 0];
    const measures: string[] = ["relative", "relative", "relative", "relative", "relative", "total"];
    const texts = [...vals.slice(0, 5).map((v) => fmtPct(v)), fmtPct(taxaTotal)];
    return { labels, vals, measures, texts };
  }, [txReal, expInflacao, spCred, spLiq, spPrazo, taxaTotal]);

  const areaData = useMemo(() => {
    const prazos: number[] = [];
    for (let p = 0.25; p <= 10.0; p += 0.25) prazos.push(Math.round(p * 100) / 100);
    return {
      prazos,
      real: prazos.map(() => txReal),
      inflacao: prazos.map(() => expInflacao),
      credito: prazos.map(() => spCred),
      liquidez: prazos.map(() => spLiq),
      prazo: prazos.map((p) => premioPrazo(p)),
    };
  }, [txReal, expInflacao, spCred, spLiq]);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-xl">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">school</span>
          Conceito — Componentes da Taxa de Juros
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>A taxa de juros de qualquer instrumento pode ser decomposta em cinco componentes:</p>
          <div className="text-center">
            <KMath tex={"i_{nominal} = i_{real} + \\pi^e + \\phi_{\\text{crédito}} + \\phi_{\\text{liquidez}} + \\phi_{\\text{prazo}}"} display />
          </div>
          <ul className="space-y-1 list-disc pl-5">
            <li><strong className="text-on-surface">Taxa real livre de risco:</strong> remuneração pelo uso do capital no tempo, sem risco. Proxy: NTN-B curta.</li>
            <li><strong className="text-on-surface">Expectativa de inflação (πᵉ):</strong> compensação pela perda de poder de compra.</li>
            <li><strong className="text-on-surface">Prêmio de crédito:</strong> compensação pelo risco de default do emissor.</li>
            <li><strong className="text-on-surface">Prêmio de liquidez:</strong> compensação pela dificuldade de vender o ativo.</li>
            <li><strong className="text-on-surface">Prêmio de prazo (term premium):</strong> compensação adicional por imobilizar capital por mais tempo.</li>
          </ul>
        </div>
      </details>

      {/* Inputs — 2-column */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">tune</span>
          Decompositor Interativo por Prazo
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <p className="font-label text-primary text-xs tracking-widest uppercase font-semibold">Componentes Base</p>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">Taxa real livre de risco (% a.a.)</label>
              <input type="number" value={txReal} step={0.25} onChange={(e) => setTxReal(Number(e.target.value))} className={INPUT_CLASS} />
              <p className="text-[10px] text-on-surface-variant mt-1">Proxy: juro real da NTN-B curta ou SELIC real ex-ante</p>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">Expectativa de inflação — IPCA (% a.a.)</label>
              <input type="number" value={expInflacao} step={0.25} onChange={(e) => setExpInflacao(Number(e.target.value))} className={INPUT_CLASS} />
              <p className="text-[10px] text-on-surface-variant mt-1">Mediana Focus ou inflação implícita</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="font-label text-primary text-xs tracking-widest uppercase font-semibold">Prêmios</p>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">Risco de crédito</label>
              <select value={credito} onChange={(e) => setCredito(e.target.value)} className={INPUT_CLASS}>
                {CREDITO_KEYS.map((k) => (<option key={k} value={k}>{k}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">Liquidez do instrumento</label>
              <select value={liquidez} onChange={(e) => setLiquidez(e.target.value)} className={INPUT_CLASS}>
                {LIQUIDEZ_KEYS.map((k) => (<option key={k} value={k}>{k}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Prazo do instrumento: <strong>{prazoAnos.toFixed(2).replace(".", ",")} anos</strong>
              </label>
              <input type="range" min={0.25} max={10} step={0.25} value={prazoAnos} onChange={(e) => setPrazoAnos(Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-on-surface-variant mt-1"><span>0,25</span><span>10,0</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="glass-card rounded-lg p-4 text-center">
          <span className="text-xs font-label text-on-surface-variant">Taxa nominal total</span>
          <p className="text-2xl font-headline font-bold mt-1">{fmtPct(taxaTotal)}</p>
        </div>
        <div className="glass-card rounded-lg p-4 text-center">
          <span className="text-xs font-label text-on-surface-variant">Spread sobre taxa real</span>
          <p className="text-2xl font-headline font-bold mt-1">{spreadRf.toFixed(0)} bps</p>
        </div>
        <div className="glass-card rounded-lg p-4 text-center">
          <span className="text-xs font-label text-on-surface-variant">Prêmio de prazo</span>
          <p className="text-2xl font-headline font-bold mt-1">{fmtPct(spPrazo)}</p>
        </div>
      </div>

      {/* Waterfall chart */}
      <div className="glass-card rounded-xl p-4">
        <PlotlyChart
          className="h-[420px]"
          data={[{
            type: "waterfall" as const,
            x: waterfallData.labels,
            y: waterfallData.vals,
            measure: waterfallData.measures,
            connector: { line: { color: "gray", width: 1, dash: "dot" } },
            increasing: { marker: { color: DECOMP_COLORS.real } },
            decreasing: { marker: { color: "#CC3333" } },
            totals: { marker: { color: DECOMP_COLORS.total } },
            text: waterfallData.texts,
            textposition: "outside",
            textfont: { color: "#aaabb0" },
          } as any]}
          layout={{
            ...PLOTLY_LAYOUT,
            title: { text: "Decomposição da Taxa (Waterfall)", font: { color: "#aaabb0", size: 14 } },
            yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "% a.a." }, ticksuffix: "%" },
            showlegend: false,
            margin: { l: 60, r: 30, t: 60, b: 50 },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Stacked area chart */}
      <div className="glass-card rounded-xl p-4">
        <PlotlyChart
          className="h-[420px]"
          data={[
            { x: areaData.prazos, y: areaData.real, name: "Taxa Real", stackgroup: "one", fillcolor: DECOMP_COLORS.real, line: { width: 0.5, color: DECOMP_COLORS.real }, mode: "lines" as const },
            { x: areaData.prazos, y: areaData.inflacao, name: "Inflação Esperada", stackgroup: "one", fillcolor: DECOMP_COLORS.inflacao, line: { width: 0.5, color: DECOMP_COLORS.inflacao }, mode: "lines" as const },
            { x: areaData.prazos, y: areaData.credito, name: "Prêmio Crédito", stackgroup: "one", fillcolor: DECOMP_COLORS.credito, line: { width: 0.5, color: DECOMP_COLORS.credito }, mode: "lines" as const },
            { x: areaData.prazos, y: areaData.liquidez, name: "Prêmio Liquidez", stackgroup: "one", fillcolor: DECOMP_COLORS.liquidez, line: { width: 0.5, color: DECOMP_COLORS.liquidez }, mode: "lines" as const },
            { x: areaData.prazos, y: areaData.prazo, name: "Prêmio Prazo", stackgroup: "one", fillcolor: DECOMP_COLORS.prazo, line: { width: 0.5, color: DECOMP_COLORS.prazo }, mode: "lines" as const },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            title: { text: "Composição da Taxa por Prazo", font: { color: "#aaabb0", size: 14 } },
            xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: "Prazo (anos)" } },
            yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "Taxa (% a.a.)" }, ticksuffix: "%" },
            hovermode: "x unified" as const,
            margin: { l: 60, r: 30, t: 60, b: 50 },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          💡 Na prática, os componentes não são diretamente observáveis — o mercado negocia a taxa
          total. Decompor é um exercício analítico que ajuda o gestor a avaliar se a taxa oferecida
          compensa adequadamente cada fonte de risco.
        </p>
      </div>
    </div>
  );
}
