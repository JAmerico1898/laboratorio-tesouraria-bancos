"use client";

import { useState, useMemo } from "react";
import { precificarCdbPre, precificarLtn, type CdbPreResult } from "@/lib/finance";
import { fmtBrl, fmtNum, fmtPct } from "@/lib/format";
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

export function TabCdbPre() {
  const [taxaLtn, setTaxaLtn] = useState(12.50);
  const [spreadBps, setSpreadBps] = useState(50);
  const [du, setDu] = useState(252);
  const [face, setFace] = useState(1000000);

  const result: CdbPreResult = useMemo(
    () => precificarCdbPre(face, taxaLtn / 100, spreadBps, du),
    [face, taxaLtn, spreadBps, du],
  );

  // Bar chart data
  const barData = useMemo(() => ({
    puLtn: result.puLtn,
    puCdb: result.puCdb,
    diff: result.diferencaPu,
  }), [result]);

  // Sensitivity: PU vs Spread (0-300 bps)
  const sensData = useMemo(() => {
    const spreads: number[] = [];
    const pus: number[] = [];
    for (let s = 0; s <= 300; s += 5) {
      spreads.push(s);
      const r = precificarCdbPre(face, taxaLtn / 100, s, du);
      pus.push(r.puCdb);
    }
    const ltnRef = precificarCdbPre(face, taxaLtn / 100, 0, du).puLtn;
    return { spreads, pus, ltnRef };
  }, [face, taxaLtn, du]);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: CDB Prefixado
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            O <strong className="text-on-surface">CDB prefixado</strong> e
            precificado como uma LTN acrescida de um spread de credito. O
            spread reflete o risco de credito do emissor em relacao ao
            soberano.
          </p>
          <div className="mt-2">
            <p className="font-label text-on-surface mb-1">Formula de precificacao:</p>
            <KMath tex="PU = \frac{Face}{(1 + taxa_{soberana} + spread)^{DU/252}}" />
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              O <strong className="text-on-surface">preco do credito</strong> e
              a diferenca entre PU LTN e PU CDB
            </li>
            <li>
              Quanto maior o spread, menor o PU — o investidor paga menos
              pelo risco adicional
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
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Taxa LTN referencia (% a.a.)
              </label>
              <input
                type="number"
                value={taxaLtn}
                onChange={(e) => setTaxaLtn(Number(e.target.value))}
                step={0.05}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Spread de credito (bps)
              </label>
              <input
                type="number"
                value={spreadBps}
                onChange={(e) => setSpreadBps(Number(e.target.value))}
                step={5}
                min={0}
                className={INPUT_CLASS}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Dias uteis (DU)
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
          </div>
        </div>
      </div>

      {/* 4 Metric cards */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Taxa CDB"
          value={fmtPct(result.taxaCdb / 100, 2)}
          sub="Soberana + spread"
        />
        <MetricCard
          label="PU CDB"
          value={`R$ ${fmtNum(result.puCdb)}`}
          sub="Preco unitario"
        />
        <MetricCard
          label="PU LTN equiv"
          value={`R$ ${fmtNum(result.puLtn)}`}
          sub="Sem risco de credito"
        />
        <MetricCard
          label="Preco do credito (R$)"
          value={`R$ ${fmtNum(result.diferencaPu)}`}
          sub="PU LTN - PU CDB"
          colorClass="text-[#C55A11]"
        />
      </div>

      {/* Bar chart: PU LTN vs PU CDB */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
          Comparativo: PU LTN vs PU CDB
        </h3>
        <PlotlyChart
          className="h-[350px]"
          data={[
            {
              x: ["PU LTN", "PU CDB"],
              y: [barData.puLtn, barData.puCdb],
              type: "bar" as const,
              marker: {
                color: [CHART_COLORS.primary, "#0E7C7B"],
              },
              text: [
                `R$ ${fmtNum(barData.puLtn)}`,
                `R$ ${fmtNum(barData.puCdb)}`,
              ],
              textposition: "outside" as const,
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "PU (R$)" },
            },
            annotations: [
              {
                x: 1,
                y: barData.puCdb,
                xref: "x",
                yref: "y",
                text: `Diff: R$ ${fmtNum(barData.diff)}`,
                showarrow: true,
                arrowhead: 2,
                ax: 60,
                ay: -30,
                font: { color: CHART_COLORS.accent, size: 12 },
              },
            ],
            showlegend: false,
            margin: { ...PLOTLY_LAYOUT.margin, t: 20 },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Sensitivity chart: PU vs Spread */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
          Sensibilidade: PU vs Spread de credito
        </h3>
        <PlotlyChart
          className="h-[400px]"
          data={[
            {
              x: sensData.spreads,
              y: sensData.pus,
              type: "scatter" as const,
              mode: "lines" as const,
              name: "PU CDB",
              line: { color: "#0E7C7B", width: 2.5 },
            },
            {
              x: [spreadBps],
              y: [result.puCdb],
              type: "scatter" as const,
              mode: "markers" as const,
              name: "Spread atual",
              marker: {
                color: CHART_COLORS.accent,
                symbol: "diamond",
                size: 12,
              },
            },
            {
              x: [0, 300],
              y: [sensData.ltnRef, sensData.ltnRef],
              type: "scatter" as const,
              mode: "lines" as const,
              name: "PU LTN (ref)",
              line: { color: CHART_COLORS.primary, width: 1.5, dash: "dash" },
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "Spread (bps)" },
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
          prefixado e essencialmente uma LTN com spread de credito. A diferenca
          entre os PUs e o &ldquo;preco do credito&rdquo; — quanto o investidor
          recebe a mais por assumir o risco do emissor. Com spread de{" "}
          {spreadBps} bps, a diferenca e de R$ {fmtNum(result.diferencaPu)}.
          Observe como a curva de sensibilidade mostra que o PU cai
          rapidamente com o aumento do spread.
        </p>
      </div>
    </div>
  );
}
