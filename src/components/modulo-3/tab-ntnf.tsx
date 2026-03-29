"use client";

import { useState, useMemo } from "react";
import {
  precificarLtn,
  precificarNtnf,
  type LtnResult,
  type NtnfResult,
  type FluxoRow,
} from "@/lib/finance";
import { diasUteis } from "@/lib/holidays";
import { fmtBrl, fmtPct, fmtNum } from "@/lib/format";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG, CHART_COLORS } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const PRAZO_OPTIONS = [1, 2, 3, 5, 7, 10] as const;

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

/**
 * Snap a date forward to the next Jan 1 or Jul 1 coupon date.
 * Used to compute NTN-F maturity from settlement + prazo.
 */
function computeVencimento(dtLiq: string, prazoAnos: number): string {
  const liq = new Date(dtLiq + "T12:00:00");
  const target = new Date(liq);
  target.setFullYear(target.getFullYear() + prazoAnos);

  // Snap to next Jan 1 or Jul 1
  const month = target.getMonth(); // 0-based
  let snapYear = target.getFullYear();
  let snapMonth: number;

  if (month < 0) {
    // Should not happen, but safety
    snapMonth = 0;
  } else if (month < 6) {
    // Before July: snap to Jul 1
    snapMonth = 6;
  } else {
    // July or later: snap to next Jan 1
    snapMonth = 0;
    snapYear += 1;
  }

  const venc = new Date(snapYear, snapMonth, 1);
  return venc.toISOString().split("T")[0];
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TabNtnf() {
  const [taxa, setTaxa] = useState(12.80);
  const [dtLiq, setDtLiq] = useState(todayIso);
  const [prazo, setPrazo] = useState(2);

  const dtVenc = useMemo(() => computeVencimento(dtLiq, prazo), [dtLiq, prazo]);

  const result: NtnfResult = useMemo(
    () => precificarNtnf(taxa / 100, dtLiq, dtVenc, diasUteis),
    [taxa, dtLiq, dtVenc],
  );

  // LTN comparison: same total DU as last NTN-F flow
  const ltnComparison: LtnResult | null = useMemo(() => {
    if (result.fluxos.length === 0) return null;
    const totalDu = result.fluxos[result.fluxos.length - 1].du;
    return precificarLtn(taxa / 100, totalDu);
  }, [taxa, result.fluxos]);

  // Cash flow bar chart data
  const chartFluxos = useMemo(() => {
    return {
      datas: result.fluxos.map((f) => f.data),
      nominais: result.fluxos.map((f) => f.fluxo),
      vps: result.fluxos.map((f) => f.vp),
    };
  }, [result.fluxos]);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: NTN-F (Nota do Tesouro Nacional serie F)
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            A <strong className="text-on-surface">NTN-F</strong> e um titulo
            prefixado com cupons semestrais de 10% a.a. (equivalentes a 4,8809%
            ao semestre, ou R$ 48,81 por titulo). Os cupons sao pagos no 1o dia
            util de janeiro e julho. No vencimento, paga-se o ultimo cupom mais
            o principal de R$ 1.000.
          </p>
          <div className="mt-2">
            <p className="font-label text-on-surface mb-1">Formula de precificacao:</p>
            <KMath tex="PU = \sum_{k=1}^{n} \frac{cupom_k}{(1+taxa)^{DU_k/252}} + \frac{1000}{(1+taxa)^{DU_n/252}}" />
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Cupom semestral: <KMath tex="(1{,}10)^{0{,}5} - 1 = 4{,}8809\%" display={false} /> ao semestre = R$ 48,81
            </li>
            <li>Datas de cupom: 1o dia util de janeiro e julho</li>
            <li>Truncamento ANBIMA: 6 casas decimais no fator de desconto</li>
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
        <div className="grid md:grid-cols-3 gap-6">
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
              Data de liquidacao
            </label>
            <input
              type="date"
              value={dtLiq}
              onChange={(e) => setDtLiq(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Prazo (anos)
            </label>
            <select
              value={prazo}
              onChange={(e) => setPrazo(Number(e.target.value))}
              className={INPUT_CLASS}
            >
              {PRAZO_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p} {p === 1 ? "ano" : "anos"}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-on-surface-variant">
          Vencimento calculado: <strong className="text-on-surface">{dtVenc}</strong>{" "}
          (proximo 1o jan ou 1o jul apos {prazo} {prazo === 1 ? "ano" : "anos"})
        </p>
      </div>

      {/* 5 Metric cards */}
      <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          label="PU (R$)"
          value={`R$ ${fmtNum(result.pu)}`}
          sub="Preco unitario"
        />
        <MetricCard
          label="Duration Macaulay (anos)"
          value={fmtNum(result.duration)}
          sub="Prazo medio ponderado"
        />
        <MetricCard
          label="Duration modificada"
          value={fmtNum(result.durMod)}
          sub="Sensibilidade % por 1pp"
        />
        <MetricCard
          label="Juros acumulados (R$)"
          value={`R$ ${fmtNum(result.accrued)}`}
          sub="Cupom pro-rata"
        />
        <MetricCard
          label="PU limpo (R$)"
          value={`R$ ${fmtNum(result.puLimpo)}`}
          sub="PU - juros acumulados"
        />
      </div>

      {/* Cash flow table */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="font-headline font-bold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">
            table_chart
          </span>
          Fluxo de Caixa
        </h3>
        {result.fluxos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2 text-right">DU</th>
                  <th className="px-3 py-2 text-right">Fluxo (R$)</th>
                  <th className="px-3 py-2 text-right">Fator desc.</th>
                  <th className="px-3 py-2 text-right">VP (R$)</th>
                </tr>
              </thead>
              <tbody>
                {result.fluxos.map((f: FluxoRow, idx: number) => {
                  const isLast = idx === result.fluxos.length - 1;
                  return (
                    <tr
                      key={f.num}
                      className={`border-b border-outline-variant/10 ${
                        isLast ? "font-bold text-on-surface" : "text-on-surface-variant"
                      }`}
                    >
                      <td className="px-3 py-2">{f.num}</td>
                      <td className="px-3 py-2">{f.data}</td>
                      <td className="px-3 py-2 text-right">{f.du}</td>
                      <td className="px-3 py-2 text-right">R$ {fmtNum(f.fluxo)}</td>
                      <td className="px-3 py-2 text-right">{f.fator.toFixed(6)}</td>
                      <td className="px-3 py-2 text-right">R$ {fmtNum(f.vp)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-outline-variant/30 font-bold text-on-surface">
                  <td className="px-3 py-2" colSpan={3}>Total</td>
                  <td className="px-3 py-2 text-right">
                    R$ {fmtNum(result.fluxos.reduce((s, f) => s + f.fluxo, 0))}
                  </td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2 text-right">R$ {fmtNum(result.pu)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">
            Nenhum fluxo gerado. Verifique as datas.
          </p>
        )}
      </div>

      {/* Cash flow bar chart */}
      {result.fluxos.length > 0 && (
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
            Fluxos Nominais vs. Valor Presente
          </h3>
          <PlotlyChart
            className="h-[350px]"
            data={[
              {
                x: chartFluxos.datas,
                y: chartFluxos.nominais,
                type: "bar" as const,
                name: "Fluxo nominal",
                marker: { color: CHART_COLORS.primary },
              },
              {
                x: chartFluxos.datas,
                y: chartFluxos.vps,
                type: "scatter" as const,
                mode: "markers" as const,
                name: "Valor presente",
                marker: {
                  color: CHART_COLORS.primary + "88",
                  size: 10,
                  symbol: "circle",
                  line: { color: CHART_COLORS.primary, width: 1.5 },
                },
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              xaxis: {
                ...PLOTLY_LAYOUT.xaxis,
                title: { text: "Data do fluxo" },
              },
              yaxis: {
                ...PLOTLY_LAYOUT.yaxis,
                title: { text: "R$" },
              },
              legend: { orientation: "h", y: -0.2 },
              margin: { ...PLOTLY_LAYOUT.margin, t: 20, b: 70 },
              barmode: "group",
            }}
            config={PLOTLY_CONFIG}
          />
          <p className="text-xs text-on-surface-variant mt-2">
            A diferenca entre as barras (nominal) e os marcadores (VP) mostra o
            efeito do desconto: fluxos mais distantes encolhem mais, evidenciando
            o valor do dinheiro no tempo.
          </p>
        </div>
      )}

      {/* Comparison with LTN */}
      {ltnComparison && result.fluxos.length > 0 && (
        <div className="glass-card rounded-lg p-5 border-l-4 border-primary space-y-3">
          <h3 className="font-headline font-bold text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">
              compare_arrows
            </span>
            Comparativo NTN-F vs. LTN (mesmo vencimento)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant">
                  <th className="px-3 py-2 text-left">Metrica</th>
                  <th className="px-3 py-2 text-right">NTN-F</th>
                  <th className="px-3 py-2 text-right">LTN</th>
                </tr>
              </thead>
              <tbody className="text-on-surface-variant">
                <tr className="border-b border-outline-variant/10">
                  <td className="px-3 py-2">PU (R$)</td>
                  <td className="px-3 py-2 text-right font-bold text-on-surface">
                    R$ {fmtNum(result.pu)}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-on-surface">
                    R$ {fmtNum(ltnComparison.pu)}
                  </td>
                </tr>
                <tr className="border-b border-outline-variant/10">
                  <td className="px-3 py-2">Duration (anos)</td>
                  <td className="px-3 py-2 text-right">{fmtNum(result.duration)}</td>
                  <td className="px-3 py-2 text-right">{fmtNum(ltnComparison.duration)}</td>
                </tr>
                <tr className="border-b border-outline-variant/10">
                  <td className="px-3 py-2">Duration modificada</td>
                  <td className="px-3 py-2 text-right">{fmtNum(result.durMod)}</td>
                  <td className="px-3 py-2 text-right">{fmtNum(ltnComparison.durMod)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Sensib. +100bps (R$)</td>
                  <td className="px-3 py-2 text-right">{fmtNum(result.sensib100bps)}</td>
                  <td className="px-3 py-2 text-right">{fmtNum(ltnComparison.sensib100bps)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-on-surface-variant">
            A NTN-F tem duration menor que a LTN porque os cupons semestrais
            antecipam fluxos de caixa, reduzindo o prazo medio ponderado.
            Consequentemente, a NTN-F e <strong className="text-on-surface">menos
            sensivel</strong> a variacoes de taxa do que uma LTN de mesmo
            vencimento.
          </p>
        </div>
      )}

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Nota pedagogica:</strong> Os cupons
          semestrais da NTN-F reduzem a duration em relacao a uma LTN de mesmo
          vencimento. Isso ocorre porque parte do valor do titulo e recebida
          antecipadamente via cupons, diminuindo a exposicao a variacoes de taxa
          de juros. Para o gestor de tesouraria, isso significa que a NTN-F
          oferece <strong className="text-on-surface">menor risco de mercado</strong>{" "}
          (menor volatilidade de preco) mas tambem{" "}
          <strong className="text-on-surface">menor potencial de ganho</strong> em
          cenarios de queda de taxa.
        </p>
      </div>
    </div>
  );
}
