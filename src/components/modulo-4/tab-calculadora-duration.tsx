"use client";

import { useState, useMemo } from "react";
import { durationZeroCupom } from "@/lib/finance";
import { fmtBrl } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { Math as KMath } from "@/components/math";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const SELECT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

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

interface PortfolioItem {
  titulo: string;
  pu: number;
  qtd: number;
  durMod: number;
}

const DEFAULT_PORTFOLIO: PortfolioItem[] = [
  { titulo: "LTN 1A", pu: 888.49, qtd: 50000, durMod: 0.88 },
  { titulo: "NTN-F 3A", pu: 950.0, qtd: 30000, durMod: 2.50 },
  { titulo: "LTN 5A", pu: 730.0, qtd: 20000, durMod: 4.42 },
];

export function TabCalculadoraDuration() {
  // --- Section 1 state ---
  const [tituloKey, setTituloKey] = useState("LTN 3A");
  const [taxa, setTaxa] = useState(TITULO_PARAMS["LTN 3A"].taxa);
  const [prazoAnos, setPrazoAnos] = useState(3);

  // --- Section 2 state ---
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(
    DEFAULT_PORTFOLIO.map((p) => ({ ...p })),
  );

  // Auto-fill on title change
  const handleTituloChange = (key: string) => {
    setTituloKey(key);
    const params = TITULO_PARAMS[key];
    if (params) {
      setTaxa(params.taxa);
      setPrazoAnos(params.du / 252);
    }
  };

  // --- Section 1 computations ---
  const du = Math.round(prazoAnos * 252);
  const params = TITULO_PARAMS[tituloKey];
  const isCupom = params?.cupom > 0;

  const metrics = useMemo(() => {
    const r = durationZeroCupom(taxa / 100, du);
    if (isCupom) {
      // Simplified: coupon bonds have ~80% of zero-coupon duration
      const factor = 0.80;
      return {
        pu: r.pu * 0.95, // PU slightly different for coupon bonds
        duration: r.duration * factor,
        durMod: r.durMod * factor,
        convexidade: r.convexidade * factor * factor,
        isCupom: true,
      };
    }
    return { ...r, isCupom: false };
  }, [taxa, du, isCupom]);

  const dv01 = metrics.durMod * metrics.pu * 0.0001;

  // Zero-coupon equivalent for comparator
  const zeroEquiv = useMemo(() => {
    return durationZeroCupom(taxa / 100, du);
  }, [taxa, du]);

  // --- Section 2 computations ---
  const portfolioMetrics = useMemo(() => {
    const rows = portfolio.map((p) => {
      const valor = p.pu * p.qtd;
      const dv01Item = p.durMod * p.pu * p.qtd * 0.0001;
      return { ...p, valor, dv01: dv01Item };
    });

    const valorTotal = rows.reduce((s, r) => s + r.valor, 0);
    const dv01Total = rows.reduce((s, r) => s + r.dv01, 0);
    const durCart = valorTotal > 0
      ? rows.reduce((s, r) => s + (r.valor / valorTotal) * r.durMod, 0)
      : 0;

    const contrib = rows.map((r) => ({
      titulo: r.titulo,
      peso: valorTotal > 0 ? (r.valor / valorTotal) : 0,
      contribuicao: valorTotal > 0 ? (r.valor / valorTotal) * r.durMod : 0,
    }));

    return { rows, valorTotal, dv01Total, durCart, contrib };
  }, [portfolio]);

  const updateField = (idx: number, field: "pu" | "qtd", val: number) => {
    setPortfolio((prev) => {
      const next = prev.map((p) => ({ ...p }));
      next[idx][field] = val;
      return next;
    });
  };

  return (
    <div className="space-y-10">
      {/* ============ Section 1: Duration of Individual Title ============ */}
      <section className="space-y-6">
        <h2 className="font-headline text-lg font-bold border-b border-outline-variant/30 pb-2">
          Duration de Título Individual
        </h2>

        {/* Concept expander */}
        <details className="glass-card rounded-lg">
          <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
            <span className="material-symbols-outlined text-primary text-base">school</span>
            Conceitos: Três Níveis de Duration
          </summary>
          <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
            <div>
              <p className="font-bold text-on-surface mb-1">Nível 1 — Intuição</p>
              <p>
                Duration é o &ldquo;tempo médio ponderado&rdquo; dos fluxos de caixa de um título.
                Quanto maior a duration, mais o preço reage a mudanças na taxa de juros.
                Um título zero-cupom tem duration igual ao prazo; um título com cupom tem duration menor.
              </p>
            </div>
            <div>
              <p className="font-bold text-on-surface mb-1">Nível 2 — Sensibilidade</p>
              <p>A duration modificada mede a variação percentual no preço para 1% de variação na taxa:</p>
              <KMath tex="\frac{\Delta P}{P} \approx -D_{mod} \times \Delta y" />
              <p>O DV01 traduz isso em reais para 1 bp:</p>
              <KMath tex="DV01 = D_{mod} \times PU \times 0{,}0001" />
            </div>
            <div>
              <p className="font-bold text-on-surface mb-1">Nível 3 — Fórmula</p>
              <p>Para um zero-cupom prefixado (LTN):</p>
              <KMath tex="D_{Mac} = \frac{DU}{252}" />
              <KMath tex="D_{mod} = \frac{D_{Mac}}{1 + y} = \frac{DU/252}{1 + y}" />
              <KMath tex="\text{Convexidade} = \frac{D_{Mac} \times (D_{Mac} + 1)}{(1 + y)^2}" />
            </div>
          </div>
        </details>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Título
            </label>
            <select
              value={tituloKey}
              onChange={(e) => handleTituloChange(e.target.value)}
              className={SELECT_CLASS}
            >
              {Object.keys(TITULO_PARAMS).map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Taxa (% a.a.): {taxa.toFixed(2)}%
            </label>
            <input
              type="number"
              value={taxa}
              step={0.25}
              onChange={(e) => setTaxa(Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Prazo: {prazoAnos.toFixed(1)} anos ({du} DU)
            </label>
            <input
              type="number"
              value={prazoAnos}
              step={0.5}
              min={0.5}
              max={10}
              onChange={(e) => setPrazoAnos(Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {isCupom && (
          <div className="glass-card rounded-lg p-3 border-l-4 border-tertiary">
            <p className="text-xs text-on-surface-variant">
              <strong>Nota:</strong> Para NTN-F (cupom {params.cupom}% a.a.), a duration é estimada como ~80% da duration zero-cupom equivalente. Modelo simplificado para fins didáticos.
            </p>
          </div>
        )}

        {/* 4 metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Duration Macaulay"
            value={metrics.duration.toFixed(4)}
            sub="anos"
          />
          <MetricCard
            label="Duration Modificada"
            value={metrics.durMod.toFixed(4)}
          />
          <MetricCard
            label="DV01 por R$ 1.000"
            value={`R$ ${dv01.toFixed(4)}`}
            sub="por 1 bp"
          />
          <MetricCard
            label="Convexidade"
            value={metrics.convexidade.toFixed(4)}
          />
        </div>

        {/* Quick comparator box */}
        {isCupom && (
          <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
            <h3 className="font-headline font-bold text-sm mb-3">
              Comparador: {tituloKey} vs. LTN Zero-Cupom (mesmo prazo)
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-xs text-on-surface-variant">Duration Mod. ({tituloKey})</p>
                <p className="font-bold text-lg">{metrics.durMod.toFixed(4)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-on-surface-variant">Duration Mod. (LTN equiv.)</p>
                <p className="font-bold text-lg">{zeroEquiv.durMod.toFixed(4)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-on-surface-variant">Diferença</p>
                <p className="font-bold text-lg text-accent">
                  {(metrics.durMod - zeroEquiv.durMod).toFixed(4)}
                </p>
                <p className="text-xs text-on-surface-variant">
                  ({((metrics.durMod / zeroEquiv.durMod - 1) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-3">
              O cupom reduz a duration pois antecipa parte dos fluxos. Menos sensibilidade a taxa, mas menos &ldquo;aposta direcional&rdquo;.
            </p>
          </div>
        )}
      </section>

      {/* ============ Section 2: Portfolio Duration ============ */}
      <section className="space-y-6">
        <h2 className="font-headline text-lg font-bold border-b border-outline-variant/30 pb-2">
          Duration da Carteira
        </h2>

        {/* Editable portfolio table */}
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
                  <th className="text-right py-2 px-3">Valor (R$)</th>
                  <th className="text-right py-2 px-3">Peso (%)</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((p, i) => {
                  const valor = p.pu * p.qtd;
                  const peso = portfolioMetrics.valorTotal > 0
                    ? (valor / portfolioMetrics.valorTotal) * 100
                    : 0;
                  return (
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
                      <td className="text-right py-2 px-3">{fmtBrl(valor)}</td>
                      <td className="text-right py-2 px-3">{peso.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2 metric cards */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Duration média ponderada"
            value={portfolioMetrics.durCart.toFixed(4)}
            sub="anos (mod.)"
          />
          <MetricCard
            label="DV01 Total"
            value={fmtBrl(portfolioMetrics.dv01Total)}
            sub="por 1 bp"
          />
        </div>

        {/* Contribution bar chart */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-4">Contribuição à Duration</h3>
          <PlotlyChart
            className="h-[350px]"
            data={[
              {
                x: portfolioMetrics.contrib.map((c) => c.titulo),
                y: portfolioMetrics.contrib.map((c) => c.contribuicao),
                type: "bar" as const,
                marker: { color: "#2E75B6" },
                hovertemplate: "%{x}: %{y:.4f}<extra>Contribuição</extra>",
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              title: { text: "Contribuição = Peso x Duration Mod.", font: { size: 14, color: "#aaabb0" } },
              xaxis: {
                ...PLOTLY_LAYOUT.xaxis,
                title: { text: "Título", font: { size: 12, color: "#aaabb0" } },
              },
              yaxis: {
                ...PLOTLY_LAYOUT.yaxis,
                title: { text: "Contribuição (anos)", font: { size: 12, color: "#aaabb0" } },
              },
            }}
            config={PLOTLY_CONFIG}
          />
        </div>
      </section>
    </div>
  );
}
