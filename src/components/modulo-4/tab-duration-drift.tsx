"use client";

import { useMemo, useState } from "react";
import { durationDrift } from "@/lib/finance";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";
import type { ImunData } from "@/components/modulo-4/tab-imunizacao-construtor";

function StatusBadge({ status }: { status: "ok" | "atencao" | "fora" }) {
  if (status === "ok")
    return <span className="text-green-400 font-bold">&#10003; OK</span>;
  if (status === "atencao")
    return (
      <span className="text-yellow-400 font-bold">&#9888; Rebalancear</span>
    );
  return (
    <span className="text-red-400 font-bold">&#10007; Fora do limite</span>
  );
}

export function TabDurationDrift({ imun }: { imun: ImunData | null }) {
  const [meses, setMeses] = useState(0);

  const mesesArr = useMemo(() => {
    const arr: number[] = [];
    for (let m = 0; m <= 36; m += 3) arr.push(m);
    return arr;
  }, []);

  const driftData = useMemo(() => {
    if (!imun) return null;

    const durCart = imun.wC * imun.dC + imun.wL * imun.dL;
    const allPoints = mesesArr.map((m) =>
      durationDrift(durCart, imun.horizonte, m),
    );
    return { durCart, allPoints };
  }, [imun, mesesArr]);

  const current = useMemo(() => {
    if (!imun || !driftData) return null;
    return durationDrift(driftData.durCart, imun.horizonte, meses);
  }, [imun, driftData, meses]);

  if (!imun) {
    return (
      <div className="glass-card rounded-lg p-8 text-center">
        <p className="text-on-surface-variant text-sm">
          Configure a carteira imunizada na aba &ldquo;Construtor&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: Duration Drift e Rebalanceamento
        </summary>
        <div className="px-5 pb-5 space-y-3 text-sm text-on-surface-variant">
          <p>
            A duration de uma carteira não se mantém constante ao longo do tempo.
            Conforme os dias passam, a duration cai &mdash; mas não na mesma
            velocidade que o horizonte remanescente da obrigação. Esse
            descasamento progressivo é chamado de <strong>duration drift</strong>.
          </p>
          <p>
            <strong>Regra prática de rebalanceamento:</strong> Quando o
            descasamento (duration &minus; horizonte) ultrapassa &plusmn;0,25 anos,
            é necessário rebalancear a carteira &mdash; vendendo parte do título
            curto e comprando mais do longo (ou vice-versa) para realinhar a
            duration com o horizonte.
          </p>
          <p>
            A frequência típica de rebalanceamento é trimestral, mas em períodos
            de alta volatilidade pode ser necessário rebalancear com mais
            frequência.
          </p>
        </div>
      </details>

      {/* Slider */}
      <div className="glass-card rounded-lg p-4">
        <label className="block text-xs font-label text-on-surface-variant mb-2">
          Meses decorridos: {meses}
        </label>
        <input
          type="range"
          min={0}
          max={36}
          step={3}
          value={meses}
          onChange={(e) => setMeses(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-on-surface-variant mt-1">
          <span>0</span>
          <span>12</span>
          <span>24</span>
          <span>36</span>
        </div>
      </div>

      {/* Chart */}
      {driftData && (
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-4">
            Duration vs. Horizonte ao Longo do Tempo
          </h3>
          <PlotlyChart
            className="h-[400px]"
            data={[
              {
                x: mesesArr,
                y: driftData.allPoints.map((p) => p.durAtual),
                type: "scatter" as const,
                mode: "lines+markers" as const,
                name: "Duration carteira",
                line: { color: "#2E75B6", width: 2 },
                marker: { size: 6 },
                hovertemplate:
                  "Mes %{x}<br>Duration: %{y:.3f}<extra>Carteira</extra>",
              },
              {
                x: mesesArr,
                y: driftData.allPoints.map((p) => p.horizRem),
                type: "scatter" as const,
                mode: "lines+markers" as const,
                name: "Horizonte remanescente",
                line: { color: "#C55A11", width: 2, dash: "dash" as const },
                marker: { size: 6 },
                hovertemplate:
                  "Mes %{x}<br>Horizonte: %{y:.3f}<extra>Horizonte</extra>",
              },
              // Shaded area between
              {
                x: [...mesesArr, ...mesesArr.slice().reverse()],
                y: [
                  ...driftData.allPoints.map((p) => p.durAtual),
                  ...driftData.allPoints
                    .slice()
                    .reverse()
                    .map((p) => p.horizRem),
                ],
                type: "scatter" as const,
                mode: "lines" as const,
                fill: "toself" as const,
                fillcolor: "rgba(46, 139, 87, 0.15)",
                line: { color: "transparent" },
                name: "Descasamento",
                showlegend: false,
                hoverinfo: "skip" as const,
              },
              // Vertical line at selected month
              {
                x: [meses, meses],
                y: [
                  0,
                  Math.max(
                    ...driftData.allPoints.map((p) =>
                      Math.max(p.durAtual, p.horizRem),
                    ),
                  ) * 1.1,
                ],
                type: "scatter" as const,
                mode: "lines" as const,
                line: { color: "#888", width: 1, dash: "dot" as const },
                showlegend: false,
                hoverinfo: "skip" as const,
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              xaxis: {
                ...PLOTLY_LAYOUT.xaxis,
                title: {
                  text: "Meses decorridos",
                  font: { size: 12, color: "#aaabb0" },
                },
              },
              yaxis: {
                ...PLOTLY_LAYOUT.yaxis,
                title: {
                  text: "Anos",
                  font: { size: 12, color: "#aaabb0" },
                },
              },
              showlegend: true,
              legend: {
                font: { color: "#aaabb0", size: 11 },
                orientation: "h" as const,
                x: 0.5,
                xanchor: "center" as const,
                y: -0.15,
              },
            }}
            config={PLOTLY_CONFIG}
          />
        </div>
      )}

      {/* 4 metric cards */}
      {current && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-lg p-4 text-center">
            <span className="text-xs font-label text-on-surface-variant">
              Duration atual
            </span>
            <div className="text-xl font-headline font-bold mt-1">
              {current.durAtual.toFixed(3)}
            </div>
            <span className="text-xs text-on-surface-variant">anos</span>
          </div>
          <div className="glass-card rounded-lg p-4 text-center">
            <span className="text-xs font-label text-on-surface-variant">
              Horizonte rem.
            </span>
            <div className="text-xl font-headline font-bold mt-1">
              {current.horizRem.toFixed(3)}
            </div>
            <span className="text-xs text-on-surface-variant">anos</span>
          </div>
          <div className="glass-card rounded-lg p-4 text-center">
            <span className="text-xs font-label text-on-surface-variant">
              Descasamento
            </span>
            <div
              className={`text-xl font-headline font-bold mt-1 ${
                Math.abs(current.descasamento) < 0.25
                  ? "text-green-400"
                  : Math.abs(current.descasamento) < 0.5
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {current.descasamento >= 0 ? "+" : ""}
              {current.descasamento.toFixed(3)}
            </div>
            <span className="text-xs text-on-surface-variant">anos</span>
          </div>
          <div className="glass-card rounded-lg p-4 text-center">
            <span className="text-xs font-label text-on-surface-variant">
              Status
            </span>
            <div className="text-xl font-headline font-bold mt-1">
              <StatusBadge status={current.status} />
            </div>
          </div>
        </div>
      )}

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-tertiary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">
            Nota sobre frequência de rebalanceamento:
          </strong>{" "}
          Na prática, gestores rebalanceiam a carteira imunizada trimestralmente ou
          quando o descasamento excede a tolerância definida (tipicamente
          &plusmn;0,25 anos). Rebalancear com muita frequência gera custos de
          transação; rebalancear muito raramente expõe a carteira a risco de
          descasamento. O equilíbrio depende da volatilidade do mercado e do
          custo de execução.
        </p>
      </div>
    </div>
  );
}
