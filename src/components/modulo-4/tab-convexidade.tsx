"use client";

import { useState, useMemo } from "react";
import {
  durationZeroCupom,
  montarBullet,
  montarBarbell,
  calcularMetricasCarteira,
  simularRetornoEstrategia,
  truncar6,
  CURVA_DEFAULT,
  COR_ESTRATEGIA,
} from "@/lib/finance";
import { fmtPct, fmtBrl } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { Math as KMath } from "@/components/math";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const TITULO_PARAMS: Record<string, { taxa: number; du: number; cupom: number }> = {
  "LTN 1A": { taxa: 12.50, du: 252, cupom: 0 },
  "LTN 3A": { taxa: 12.70, du: 756, cupom: 0 },
  "LTN 5A": { taxa: 12.50, du: 1260, cupom: 0 },
  "NTN-F 3A": { taxa: 12.80, du: 756, cupom: 10 },
  "NTN-F 5A": { taxa: 12.50, du: 1260, cupom: 10 },
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

export function TabConvexidade() {
  // --- Section 1 state ---
  const [tituloKey, setTituloKey] = useState("LTN 3A");
  const [choque, setChoque] = useState(0);

  // --- Section 2 state ---
  const [durAlvo, setDurAlvo] = useState(3);

  const params = TITULO_PARAMS[tituloKey];
  const taxa0 = params.taxa;
  const du = params.du;

  // --- Section 1: Convexity visualizer ---
  const r0 = useMemo(() => durationZeroCupom(taxa0 / 100, du), [taxa0, du]);

  const curveData = useMemo(() => {
    const nPoints = 200;
    const taxaMin = taxa0 - 3;
    const taxaMax = taxa0 + 3;
    const step = (taxaMax - taxaMin) / (nPoints - 1);

    const taxas: number[] = [];
    const puReal: number[] = [];
    const puDuration: number[] = [];
    const puDurConv: number[] = [];

    for (let i = 0; i < nPoints; i++) {
      const t = taxaMin + step * i;
      taxas.push(t);

      // Real PU
      const fator = truncar6(Math.pow(1 + t / 100, du / 252));
      const pu = 1000 / fator;
      puReal.push(pu);

      // Duration approximation: PU0 * (1 - durMod * delta_y)
      const dy = (t - taxa0) / 100;
      const puD = r0.pu * (1 - r0.durMod * dy);
      puDuration.push(puD);

      // Duration + Convexity approximation
      const puDC = r0.pu * (1 - r0.durMod * dy + 0.5 * r0.convexidade * dy * dy);
      puDurConv.push(puDC);
    }

    return { taxas, puReal, puDuration, puDurConv };
  }, [taxa0, du, r0]);

  // Shock calculations
  const shockMetrics = useMemo(() => {
    if (choque === 0) {
      return {
        puReal: r0.pu,
        puDur: r0.pu,
        puDurConv: r0.pu,
        erroDur: 0,
        erroDurConv: 0,
      };
    }
    const taxaShock = taxa0 + choque / 100;
    const fator = truncar6(Math.pow(1 + taxaShock / 100, du / 252));
    const puReal = 1000 / fator;
    const dy = choque / 10000;
    const puDur = r0.pu * (1 - r0.durMod * dy);
    const puDurConv = r0.pu * (1 - r0.durMod * dy + 0.5 * r0.convexidade * dy * dy);
    return {
      puReal,
      puDur,
      puDurConv,
      erroDur: puDur - puReal,
      erroDurConv: puDurConv - puReal,
    };
  }, [taxa0, du, r0, choque]);

  // Shock comparison table data
  const shockTable = useMemo(() => {
    const shocks: number[] = [];
    for (let s = -250; s <= 250; s += 50) {
      shocks.push(s);
    }
    return shocks.map((s) => {
      const taxaShock = taxa0 + s / 100;
      const fator = truncar6(Math.pow(1 + taxaShock / 100, du / 252));
      const puReal = 1000 / fator;
      const dy = s / 10000;
      const puDur = r0.pu * (1 - r0.durMod * dy);
      const puDurConv = r0.pu * (1 - r0.durMod * dy + 0.5 * r0.convexidade * dy * dy);
      return {
        choque: s,
        puReal,
        puDur,
        erroDur: puDur - puReal,
        puDurConv,
        erroDurConv: puDurConv - puReal,
      };
    });
  }, [taxa0, du, r0]);

  // Chart annotations for shock point
  const shockAnnotations = useMemo(() => {
    if (choque === 0) return [];
    const taxaShock = taxa0 + choque / 100;
    return [{
      x: taxaShock,
      y: shockMetrics.puReal,
      xref: "x" as const,
      yref: "y" as const,
      text: `Choque ${choque > 0 ? "+" : ""}${choque} bps`,
      showarrow: true,
      arrowhead: 2,
      font: { color: "#aaabb0", size: 11 },
    }];
  }, [choque, taxa0, shockMetrics]);

  // --- Section 2: Bullet vs Barbell ---
  const strategyComparison = useMemo(() => {
    const bulletCart = montarBullet(CURVA_DEFAULT, durAlvo);
    const barbellCart = montarBarbell(CURVA_DEFAULT, durAlvo);
    const bulletM = calcularMetricasCarteira(bulletCart);
    const barbellM = calcularMetricasCarteira(barbellCart);

    const shocks = [-200, -100, 100, 200];
    const bulletResults: Record<number, number> = {};
    const barbellResults: Record<number, number> = {};
    for (const s of shocks) {
      const br = simularRetornoEstrategia(bulletCart, s, s, 12);
      const bar = simularRetornoEstrategia(barbellCart, s, s, 12);
      bulletResults[s] = br.total;
      barbellResults[s] = bar.total;
    }

    return { bulletCart, barbellCart, bulletM, barbellM, shocks, bulletResults, barbellResults };
  }, [durAlvo]);

  // Overlay chart: shock range
  const overlayChartData = useMemo(() => {
    const bulletCart = montarBullet(CURVA_DEFAULT, durAlvo);
    const barbellCart = montarBarbell(CURVA_DEFAULT, durAlvo);
    const xShocks: number[] = [];
    const yBullet: number[] = [];
    const yBarbell: number[] = [];

    for (let s = -300; s <= 300; s += 25) {
      xShocks.push(s);
      const br = simularRetornoEstrategia(bulletCart, s, s, 12);
      const bar = simularRetornoEstrategia(barbellCart, s, s, 12);
      // Normalize: return as % of initial value
      const bulletPu0 = bulletCart.reduce((sum, v) => {
        if (v.peso < 0.01) return sum;
        const r = durationZeroCupom(v.taxa / 100, v.prazoDu);
        return sum + (v.peso / 100) * r.pu;
      }, 0);
      const barbellPu0 = barbellCart.reduce((sum, v) => {
        if (v.peso < 0.01) return sum;
        const r = durationZeroCupom(v.taxa / 100, v.prazoDu);
        return sum + (v.peso / 100) * r.pu;
      }, 0);
      yBullet.push(bulletPu0 > 0 ? (br.total / bulletPu0) * 100 : 0);
      yBarbell.push(barbellPu0 > 0 ? (bar.total / barbellPu0) * 100 : 0);
    }

    return { xShocks, yBullet, yBarbell };
  }, [durAlvo]);

  return (
    <div className="space-y-10">
      {/* ============ Section 1: Convexity Visualizer ============ */}
      <section className="space-y-6">
        <h2 className="font-headline text-lg font-bold border-b border-outline-variant/30 pb-2">
          Visualizador de Convexidade
        </h2>

        {/* Concept expander */}
        <details className="glass-card rounded-lg">
          <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
            <span className="material-symbols-outlined text-primary text-base">school</span>
            Conceitos: Convexidade — O Efeito de 2a Ordem
          </summary>
          <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
            <div>
              <p className="font-bold text-on-surface mb-1">Fórmula de Taylor (2a ordem)</p>
              <KMath tex="\frac{\Delta P}{P} \approx -D_{mod} \times \Delta y + \frac{1}{2} \times C \times (\Delta y)^2" />
              <p>O primeiro termo (duration) é linear; o segundo (convexidade) é quadrático e sempre positivo.</p>
            </div>
            <div>
              <p className="font-bold text-on-surface mb-1">Por que a convexidade é sempre positiva?</p>
              <p>
                Para títulos prefixados sem opções embutidas, a relação preço-taxa é uma curva convexa (curvatura para cima).
                Matematicamente, a segunda derivada do preço em relação à taxa é positiva.
              </p>
              <KMath tex="C = \frac{1}{P} \frac{\partial^2 P}{\partial y^2} = \frac{t(t+1)}{(1+y)^2} \quad \text{(zero-cupom)}" />
            </div>
            <div>
              <p className="font-bold text-on-surface mb-1">O &ldquo;bonus gratuito&rdquo;</p>
              <p>
                A convexidade beneficia o detentor do título em ambas as direções: quando a taxa cai,
                o preço sobe MAIS do que a duration prevê; quando a taxa sobe, o preço cai MENOS.
                Entre dois títulos com mesma duration, o de maior convexidade é preferível.
              </p>
            </div>
          </div>
        </details>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Título
            </label>
            <select
              value={tituloKey}
              onChange={(e) => { setTituloKey(e.target.value); setChoque(0); }}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {Object.keys(TITULO_PARAMS).map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Choque paralelo: {choque > 0 ? "+" : ""}{choque} bps
            </label>
            <input
              type="range"
              min={-300}
              max={300}
              step={10}
              value={choque}
              onChange={(e) => setChoque(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-on-surface-variant mt-1">
              <span>-300 bps</span>
              <span>0</span>
              <span>+300 bps</span>
            </div>
          </div>
        </div>

        {/* Main chart */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-4">
            Preço vs. Taxa — {tituloKey} (taxa base: {taxa0.toFixed(2)}%)
          </h3>
          <PlotlyChart
            className="h-[500px]"
            data={[
              {
                x: curveData.taxas,
                y: curveData.puReal,
                type: "scatter" as const,
                mode: "lines" as const,
                name: "PU real",
                line: { color: "#2E75B6", width: 3 },
              },
              {
                x: curveData.taxas,
                y: curveData.puDuration,
                type: "scatter" as const,
                mode: "lines" as const,
                name: "Aprox. Duration",
                line: { color: "#C55A11", width: 2, dash: "dash" as const },
              },
              {
                x: curveData.taxas,
                y: curveData.puDurConv,
                type: "scatter" as const,
                mode: "lines" as const,
                name: "Aprox. D + Convexidade",
                line: { color: "#2E8B57", width: 2, dash: "dot" as const },
              },
              // Current point
              {
                x: [taxa0],
                y: [r0.pu],
                type: "scatter" as const,
                mode: "markers" as const,
                name: "Ponto atual",
                marker: { color: "#2E75B6", size: 14, symbol: "circle" },
                showlegend: false,
              },
              // Shock point (only if choque != 0)
              ...(choque !== 0
                ? [{
                    x: [taxa0 + choque / 100],
                    y: [shockMetrics.puReal],
                    type: "scatter" as const,
                    mode: "markers" as const,
                    name: `Choque ${choque > 0 ? "+" : ""}${choque} bps`,
                    marker: { color: "#CC3333", size: 12, symbol: "diamond" as const },
                    showlegend: false,
                  }]
                : []),
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              xaxis: {
                ...PLOTLY_LAYOUT.xaxis,
                title: { text: "Taxa (% a.a.)", font: { size: 12, color: "#aaabb0" } },
              },
              yaxis: {
                ...PLOTLY_LAYOUT.yaxis,
                title: { text: "PU (R$)", font: { size: 12, color: "#aaabb0" } },
              },
              legend: { ...PLOTLY_LAYOUT.legend, x: 0, y: 1.12, orientation: "h" as const },
              annotations: shockAnnotations,
            }}
            config={PLOTLY_CONFIG}
          />
        </div>

        {/* 5 metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            label="PU real"
            value={`R$ ${shockMetrics.puReal.toFixed(2)}`}
            colorClass="text-[#2E75B6]"
          />
          <MetricCard
            label="PU (Duration)"
            value={`R$ ${shockMetrics.puDur.toFixed(2)}`}
            colorClass="text-[#C55A11]"
          />
          <MetricCard
            label="PU (D+C)"
            value={`R$ ${shockMetrics.puDurConv.toFixed(2)}`}
            colorClass="text-[#2E8B57]"
          />
          <MetricCard
            label="Erro Duration"
            value={`R$ ${shockMetrics.erroDur.toFixed(2)}`}
            sub={choque === 0 ? "sem choque" : `${choque > 0 ? "+" : ""}${choque} bps`}
          />
          <MetricCard
            label="Erro D+C"
            value={`R$ ${shockMetrics.erroDurConv.toFixed(2)}`}
            sub={choque === 0 ? "sem choque" : `${choque > 0 ? "+" : ""}${choque} bps`}
          />
        </div>

        {/* Shock comparison table */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-3">Tabela de Choques</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs">
                  <th className="text-right py-2 px-2">Choque (bps)</th>
                  <th className="text-right py-2 px-2">PU real</th>
                  <th className="text-right py-2 px-2">PU (D)</th>
                  <th className="text-right py-2 px-2">Erro D</th>
                  <th className="text-right py-2 px-2">PU (D+C)</th>
                  <th className="text-right py-2 px-2">Erro D+C</th>
                </tr>
              </thead>
              <tbody>
                {shockTable.map((row) => (
                  <tr
                    key={row.choque}
                    className={`border-b border-outline-variant/10 ${
                      row.choque === 0 ? "bg-primary/10 font-bold" : ""
                    }`}
                  >
                    <td className="text-right py-2 px-2">
                      {row.choque > 0 ? "+" : ""}{row.choque}
                    </td>
                    <td className="text-right py-2 px-2">{row.puReal.toFixed(2)}</td>
                    <td className="text-right py-2 px-2">{row.puDur.toFixed(2)}</td>
                    <td className={`text-right py-2 px-2 ${Math.abs(row.erroDur) > 1 ? "text-error" : ""}`}>
                      {row.erroDur.toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-2">{row.puDurConv.toFixed(2)}</td>
                    <td className={`text-right py-2 px-2 ${Math.abs(row.erroDurConv) > 1 ? "text-tertiary" : ""}`}>
                      {row.erroDurConv.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ============ Section 2: Bullet vs Barbell Convexity ============ */}
      <section className="space-y-6">
        <h2 className="font-headline text-lg font-bold border-b border-outline-variant/30 pb-2">
          Bullet vs Barbell — Efeito da Convexidade
        </h2>

        {/* Duration target slider */}
        <div>
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Duration alvo: {durAlvo.toFixed(1)} anos
          </label>
          <input
            type="range"
            min={2}
            max={6}
            step={0.5}
            value={durAlvo}
            onChange={(e) => setDurAlvo(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-on-surface-variant mt-1">
            <span>2 anos</span>
            <span>6 anos</span>
          </div>
        </div>

        {/* Comparison table */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-3">Comparação de Estratégias</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs">
                  <th className="text-left py-2 px-3">Métrica</th>
                  <th className="text-right py-2 px-3" style={{ color: COR_ESTRATEGIA.Bullet }}>
                    Bullet
                  </th>
                  <th className="text-right py-2 px-3" style={{ color: COR_ESTRATEGIA.Barbell }}>
                    Barbell
                  </th>
                  <th className="text-right py-2 px-3">Diferença</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/10">
                  <td className="py-2 px-3 font-bold">Duration (mod.)</td>
                  <td className="text-right py-2 px-3">{strategyComparison.bulletM.duration.toFixed(4)}</td>
                  <td className="text-right py-2 px-3">{strategyComparison.barbellM.duration.toFixed(4)}</td>
                  <td className="text-right py-2 px-3">
                    {(strategyComparison.barbellM.duration - strategyComparison.bulletM.duration).toFixed(4)}
                  </td>
                </tr>
                <tr className="border-b border-outline-variant/10">
                  <td className="py-2 px-3 font-bold">Convexidade</td>
                  <td className="text-right py-2 px-3">{strategyComparison.bulletM.convexidade.toFixed(4)}</td>
                  <td className="text-right py-2 px-3">{strategyComparison.barbellM.convexidade.toFixed(4)}</td>
                  <td className="text-right py-2 px-3 text-[#2E8B57] font-bold">
                    {(strategyComparison.barbellM.convexidade - strategyComparison.bulletM.convexidade).toFixed(4)}
                  </td>
                </tr>
                {strategyComparison.shocks.map((s) => (
                  <tr key={s} className="border-b border-outline-variant/10">
                    <td className="py-2 px-3 font-bold">
                      Retorno {s > 0 ? "+" : ""}{s} bps
                    </td>
                    <td className="text-right py-2 px-3">
                      {fmtBrl(strategyComparison.bulletResults[s])}
                    </td>
                    <td className="text-right py-2 px-3">
                      {fmtBrl(strategyComparison.barbellResults[s])}
                    </td>
                    <td className={`text-right py-2 px-3 font-bold ${
                      strategyComparison.barbellResults[s] - strategyComparison.bulletResults[s] > 0
                        ? "text-[#2E8B57]"
                        : "text-error"
                    }`}>
                      {fmtBrl(strategyComparison.barbellResults[s] - strategyComparison.bulletResults[s])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overlay chart */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-4">Retorno Total vs. Choque Paralelo</h3>
          <PlotlyChart
            className="h-[450px]"
            data={[
              {
                x: overlayChartData.xShocks,
                y: overlayChartData.yBullet,
                type: "scatter" as const,
                mode: "lines" as const,
                name: "Bullet",
                line: { color: COR_ESTRATEGIA.Bullet, width: 2.5 },
              },
              {
                x: overlayChartData.xShocks,
                y: overlayChartData.yBarbell,
                type: "scatter" as const,
                mode: "lines" as const,
                name: "Barbell",
                line: { color: COR_ESTRATEGIA.Barbell, width: 2.5 },
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              title: {
                text: `Duration alvo ${durAlvo.toFixed(1)}A — Bullet vs Barbell`,
                font: { size: 14, color: "#aaabb0" },
              },
              xaxis: {
                ...PLOTLY_LAYOUT.xaxis,
                title: { text: "Choque paralelo (bps)", font: { size: 12, color: "#aaabb0" } },
              },
              yaxis: {
                ...PLOTLY_LAYOUT.yaxis,
                title: { text: "Retorno total (%)", font: { size: 12, color: "#aaabb0" } },
              },
              legend: { ...PLOTLY_LAYOUT.legend, x: 0, y: 1.12, orientation: "h" as const },
              shapes: [{
                type: "line" as const,
                x0: 0, x1: 0,
                y0: 0, y1: 1,
                xref: "x" as const,
                yref: "paper" as const,
                line: { color: "rgba(255,255,255,0.3)", width: 1, dash: "dot" as const },
              }],
            }}
            config={PLOTLY_CONFIG}
          />
        </div>

        {/* Pedagogical note */}
        <div className="glass-card rounded-lg p-4 border-l-4 border-[#2E8B57]">
          <p className="text-sm text-on-surface-variant">
            <strong className="text-on-surface">Insight pedagógico:</strong>{" "}
            A convexidade é um &ldquo;bônus gratuito&rdquo;: entre duas carteiras com mesma duration,
            a de maior convexidade terá melhor resultado em choques grandes, tanto para cima quanto para
            baixo. O barbell, por distribuir alocação nos extremos da curva, gera naturalmente mais
            convexidade que o bullet. Observe no gráfico que a curva do barbell é mais &ldquo;larga&rdquo;
            — seu retorno supera o bullet nos extremos. Essa diferença é o prêmio de convexidade.
          </p>
        </div>
      </section>
    </div>
  );
}
