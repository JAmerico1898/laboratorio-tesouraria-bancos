"use client";

import { useState, useMemo } from "react";
import {
  precificarDebentureCdi,
  type DebentureCdiResult,
} from "@/lib/finance";
import { fmtBrl, fmtNum, fmtPct } from "@/lib/format";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

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

export function TabDebentureCdi() {
  const [face, setFace] = useState(1000);
  const [spreadEmissao, setSpreadEmissao] = useState(1.80);
  const [periodicidade, setPeriodicidade] = useState<"Semestral" | "Anual">("Semestral");
  const [prazo, setPrazo] = useState(3);
  const [spreadMercado, setSpreadMercado] = useState(2.10);
  const [rating, setRating] = useState("AA");

  const result: DebentureCdiResult = useMemo(
    () =>
      precificarDebentureCdi(
        face,
        spreadEmissao / 100,
        spreadMercado / 100,
        prazo,
        periodicidade,
      ),
    [face, spreadEmissao, spreadMercado, prazo, periodicidade],
  );

  const puPctParColor =
    result.puPctPar >= 100 ? "text-[#2E8B57]" : "text-[#CC3333]";
  const spreadDiffColor =
    result.spreadDiffBps <= 0 ? "text-[#2E8B57]" : "text-[#CC3333]";

  // Spread impact chart: PU %par vs market spread (emission +/- 3%)
  const chartData = useMemo(() => {
    const spreadsRange: number[] = [];
    const puPcts: number[] = [];
    const low = Math.max(0, spreadEmissao - 3);
    const high = spreadEmissao + 3;
    for (let s = low; s <= high; s += 0.05) {
      const sRound = Math.round(s * 100) / 100;
      spreadsRange.push(sRound);
      const r = precificarDebentureCdi(
        face,
        spreadEmissao / 100,
        sRound / 100,
        prazo,
        periodicidade,
      );
      puPcts.push(r.puPctPar);
    }
    return { spreadsRange, puPcts };
  }, [face, spreadEmissao, prazo, periodicidade]);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: Debenture CDI + Spread
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            A <strong className="text-on-surface">debenture CDI + spread</strong>{" "}
            paga CDI acrescido de um spread fixo. Quando o spread de mercado
            difere do spread de emissao, o titulo negocia acima ou abaixo do par.
          </p>
          <div className="mt-2">
            <p className="font-label text-on-surface mb-1">Logica de precificacao:</p>
            <KMath tex="PU = \sum_{i=1}^{n} \frac{C_i}{(1 + spread_{mkt})^{DU_i/252}} + \frac{Face}{(1 + spread_{mkt})^{DU_n/252}}" />
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Se <strong className="text-on-surface">spread mercado &gt; spread emissao</strong>,
              PU &lt; par (desconto)
            </li>
            <li>
              Se <strong className="text-on-surface">spread mercado &lt; spread emissao</strong>,
              PU &gt; par (premio)
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
          {/* Left: Caracteristicas */}
          <div className="space-y-3">
            <h3 className="text-sm font-label text-on-surface font-bold">Caracteristicas</h3>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Face (R$)
              </label>
              <input
                type="number"
                value={face}
                onChange={(e) => setFace(Number(e.target.value))}
                step={100}
                min={0}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Spread emissao (% a.a.)
              </label>
              <input
                type="number"
                value={spreadEmissao}
                onChange={(e) => setSpreadEmissao(Number(e.target.value))}
                step={0.05}
                className={INPUT_CLASS}
              />
            </div>
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

          {/* Right: Mercado */}
          <div className="space-y-3">
            <h3 className="text-sm font-label text-on-surface font-bold">Mercado</h3>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Spread mercado (% a.a.)
              </label>
              <input
                type="number"
                value={spreadMercado}
                onChange={(e) => setSpreadMercado(Number(e.target.value))}
                step={0.05}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Rating (referencia)
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="AAA">AAA</option>
                <option value="AA">AA</option>
                <option value="A">A</option>
                <option value="BBB">BBB</option>
                <option value="BB">BB</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric cards */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="PU"
          value={`R$ ${fmtNum(result.pu)}`}
          sub="Preco unitario"
        />
        <MetricCard
          label="PU % par"
          value={`${fmtNum(result.puPctPar)}%`}
          sub={result.puPctPar >= 100 ? "Acima do par" : "Abaixo do par"}
          colorClass={puPctParColor}
        />
        <MetricCard
          label="Spread diff"
          value={`${result.spreadDiffBps >= 0 ? "+" : ""}${fmtNum(result.spreadDiffBps)} bps`}
          sub="Mercado - Emissao"
          colorClass={spreadDiffColor}
        />
        <MetricCard
          label="Duration"
          value={`${fmtNum(result.duration)} anos`}
          sub="Duracao modificada"
        />
      </div>

      {/* Cash flow table */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
          Fluxo de caixa
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="text-left py-2 px-3 text-xs font-label text-on-surface-variant">#</th>
                <th className="text-right py-2 px-3 text-xs font-label text-on-surface-variant">DU</th>
                <th className="text-right py-2 px-3 text-xs font-label text-on-surface-variant">Fluxo (R$)</th>
                <th className="text-right py-2 px-3 text-xs font-label text-on-surface-variant">Fator</th>
                <th className="text-right py-2 px-3 text-xs font-label text-on-surface-variant">VP (R$)</th>
              </tr>
            </thead>
            <tbody>
              {result.fluxos.map((f, idx) => {
                const isLast = idx === result.fluxos.length - 1;
                return (
                  <tr
                    key={f.num}
                    className={`border-b border-outline-variant/10 ${isLast ? "font-bold" : ""}`}
                    style={isLast ? { color: CORPORATE_ORANGE } : undefined}
                  >
                    <td className="py-2 px-3">{f.num}</td>
                    <td className="py-2 px-3 text-right">{f.du}</td>
                    <td className="py-2 px-3 text-right">R$ {fmtNum(f.fluxo)}</td>
                    <td className="py-2 px-3 text-right">{f.fator.toFixed(6)}</td>
                    <td className="py-2 px-3 text-right">R$ {fmtNum(f.vp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spread impact chart */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
          PU % par vs Spread de mercado
        </h3>
        <PlotlyChart
          className="h-[400px]"
          data={[
            {
              x: chartData.spreadsRange,
              y: chartData.puPcts,
              type: "scatter" as const,
              mode: "lines" as const,
              name: "PU % par",
              line: { color: CORPORATE_ORANGE, width: 2.5 },
            },
            {
              x: [chartData.spreadsRange[0], chartData.spreadsRange[chartData.spreadsRange.length - 1]],
              y: [100, 100],
              type: "scatter" as const,
              mode: "lines" as const,
              name: "Par (100%)",
              line: { color: "#888888", width: 1.5, dash: "dash" },
            },
            {
              x: [spreadMercado],
              y: [result.puPctPar],
              type: "scatter" as const,
              mode: "markers" as const,
              name: "Spread atual",
              marker: {
                color: CORPORATE_ORANGE,
                symbol: "diamond",
                size: 12,
              },
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "Spread mercado (% a.a.)" },
            },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "PU % par" },
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
          <strong className="text-on-surface">Nota pedagogica:</strong> A
          debenture CDI + spread funciona como um titulo flutuante com risco de
          credito embutido. Se o mercado passar a exigir spread de{" "}
          {fmtNum(spreadMercado)}% vs. os {fmtNum(spreadEmissao)}% da emissao,
          o titulo negocia a {fmtNum(result.puPctPar)}% do par — uma diferenca
          de {fmtNum(Math.abs(result.spreadDiffBps))} bps. Quanto maior o prazo
          e a duration ({fmtNum(result.duration)} anos), maior a sensibilidade
          a mudancas no spread de credito.
        </p>
      </div>
    </div>
  );
}
