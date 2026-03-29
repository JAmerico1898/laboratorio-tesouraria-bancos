"use client";

import { useState, useMemo } from "react";
import {
  precificarDebentureIpca,
  type DebentureIpcaResult,
} from "@/lib/finance";
import { fmtNum } from "@/lib/format";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const NTNB_PURPLE = "#8B5CF6";
const CORPORATE_ORANGE = "#C55A11";

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

export function TabDebentureIpca() {
  const [taxaReal, setTaxaReal] = useState(7.0);
  const [vna, setVna] = useState(4352.78);
  const [prazo, setPrazo] = useState(5);
  const [periodicidade, setPeriodicidade] = useState<"Semestral" | "Anual">("Semestral");
  const [taxaNtnb, setTaxaNtnb] = useState(6.20);

  const resultDeb: DebentureIpcaResult = useMemo(
    () => precificarDebentureIpca(taxaReal / 100, vna, prazo, periodicidade),
    [taxaReal, vna, prazo, periodicidade],
  );

  const resultNtnb: DebentureIpcaResult = useMemo(
    () => precificarDebentureIpca(taxaNtnb / 100, vna, prazo, periodicidade),
    [taxaNtnb, vna, prazo, periodicidade],
  );

  const spreadBps = Math.round((taxaReal - taxaNtnb) * 100);

  // Decomposition chart data (stacked bar simulating waterfall)
  const spreadCredito = taxaReal - taxaNtnb;

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: Debenture IPCA + Spread
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            A <strong className="text-on-surface">debenture IPCA+</strong> segue
            a mesma logica da NTN-B, mas incorpora um spread de credito. A
            comparacao com a NTN-B permite isolar o premio de credito.
          </p>
          <div className="mt-2">
            <p className="font-label text-on-surface mb-1">Decomposicao da taxa:</p>
            <KMath tex="taxa_{deb} = taxa_{NTN\text{-}B} + spread_{credito + liquidez}" />
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              O spread remunera <strong className="text-on-surface">risco de credito</strong>,{" "}
              <strong className="text-on-surface">iliquidez</strong> e{" "}
              <strong className="text-on-surface">riscos estruturais</strong>
            </li>
            <li>
              O VNA projetado reflete a correcao pelo IPCA acumulado
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
                Taxa real IPCA+ (% a.a.)
              </label>
              <input
                type="number"
                value={taxaReal}
                onChange={(e) => setTaxaReal(Number(e.target.value))}
                step={0.05}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                VNA projetado (R$)
              </label>
              <input
                type="number"
                value={vna}
                onChange={(e) => setVna(Number(e.target.value))}
                step={0.01}
                min={0}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Prazo (anos)
              </label>
              <input
                type="number"
                value={prazo}
                onChange={(e) => setPrazo(Number(e.target.value))}
                step={0.5}
                min={0.5}
                className={INPUT_CLASS}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Periodicidade
              </label>
              <select
                value={periodicidade}
                onChange={(e) => setPeriodicidade(e.target.value as "Semestral" | "Anual")}
                className={INPUT_CLASS}
              >
                <option value="Semestral">Semestral</option>
                <option value="Anual">Anual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Taxa NTN-B referencia (% a.a.)
              </label>
              <input
                type="number"
                value={taxaNtnb}
                onChange={(e) => setTaxaNtnb(Number(e.target.value))}
                step={0.05}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric cards */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="PU Debenture"
          value={`R$ ${fmtNum(resultDeb.pu)}`}
          sub={`IPCA+ ${fmtNum(taxaReal)}%`}
        />
        <MetricCard
          label="PU NTN-B equiv"
          value={`R$ ${fmtNum(resultNtnb.pu)}`}
          sub={`IPCA+ ${fmtNum(taxaNtnb)}%`}
          colorClass="text-[#8B5CF6]"
        />
        <MetricCard
          label="Spread sobre NTN-B"
          value={`${spreadBps} bps`}
          sub="Credito + liquidez"
          colorClass="text-[#C55A11]"
        />
        <MetricCard
          label="Duration"
          value={`${fmtNum(resultDeb.duration)} anos`}
          sub="Duracao modificada"
        />
      </div>

      {/* Waterfall-style decomposition chart */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
          Decomposicao da taxa: NTN-B + spread de credito
        </h3>
        <PlotlyChart
          className="h-[300px]"
          data={[
            {
              type: "bar" as const,
              orientation: "h" as const,
              y: ["Taxa debenture"],
              x: [taxaNtnb],
              name: "Taxa real (NTN-B)",
              marker: { color: NTNB_PURPLE },
              text: [`${fmtNum(taxaNtnb)}%`],
              textposition: "inside" as const,
              textfont: { color: "#ffffff", size: 13 },
              hovertemplate: "NTN-B: %{x:.2f}% a.a.<extra></extra>",
            },
            {
              type: "bar" as const,
              orientation: "h" as const,
              y: ["Taxa debenture"],
              x: [spreadCredito],
              name: "Spread credito+liquidez",
              marker: { color: CORPORATE_ORANGE },
              text: [`+${fmtNum(spreadCredito)}%`],
              textposition: "inside" as const,
              textfont: { color: "#ffffff", size: 13 },
              hovertemplate: "Spread: %{x:.2f}% a.a.<extra></extra>",
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            barmode: "stack",
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "Taxa (% a.a.)" },
            },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
            },
            showlegend: true,
            legend: { orientation: "h", y: -0.25 },
            margin: { ...PLOTLY_LAYOUT.margin, t: 20, l: 120 },
            annotations: [
              {
                x: taxaReal,
                y: "Taxa debenture",
                xref: "x",
                yref: "y",
                text: `Total: ${fmtNum(taxaReal)}%`,
                showarrow: true,
                arrowhead: 2,
                ax: 50,
                ay: -25,
                font: { color: "#2E75B6", size: 12, family: "Segoe UI, Arial, sans-serif" },
              },
            ],
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Nota pedagogica:</strong> A
          debenture IPCA+ {fmtNum(taxaReal)}% vs. NTN-B {fmtNum(taxaNtnb)}%
          oferece {spreadBps} bps de spread. Esse spread deve remunerar: (1)
          risco de credito do emissor, (2) menor liquidez no mercado secundario,
          e (3) eventuais riscos estruturais da emissao.
        </p>
      </div>
    </div>
  );
}
