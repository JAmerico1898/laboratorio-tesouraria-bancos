"use client";

import { useState, useMemo } from "react";
import {
  precificarNtnb,
  type NtnbResult,
  type FluxoRow,
  CUPOM_NTNB_SEMESTRAL,
} from "@/lib/finance";
import { diasUteis } from "@/lib/holidays";
import { fmtBrl, fmtPct, fmtNum } from "@/lib/format";
import { Math as KMath } from "@/components/math";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG, CHART_COLORS } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const PRAZO_OPTIONS = [2, 3, 5, 7, 10, 15, 20] as const;

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
 * NTN-B maturities fall on Aug 15 / May 15, but for simplicity
 * we snap to Jan 1 or Jul 1 as specified.
 */
function computeVencimento(dtLiq: string, prazoAnos: number): string {
  const liq = new Date(dtLiq + "T12:00:00");
  const target = new Date(liq);
  target.setFullYear(target.getFullYear() + prazoAnos);

  const month = target.getMonth(); // 0-based
  let snapYear = target.getFullYear();
  let snapMonth: number;

  if (month < 6) {
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

export function TabNtnb() {
  const [taxaReal, setTaxaReal] = useState(6.20);
  const [vnaProj, setVnaProj] = useState(4352.78);
  const [dtLiq, setDtLiq] = useState(todayIso);
  const [prazo, setPrazo] = useState(5);

  // Paradox simulator state
  const [varBps, setVarBps] = useState(0);
  const [ipcaRealizado, setIpcaRealizado] = useState(4.5);

  const dtVenc = useMemo(() => computeVencimento(dtLiq, prazo), [dtLiq, prazo]);

  const result: NtnbResult = useMemo(
    () => precificarNtnb(taxaReal / 100, vnaProj, dtLiq, dtVenc, diasUteis),
    [taxaReal, vnaProj, dtLiq, dtVenc],
  );

  // Sensitivity +100bps
  const sensib100bps = useMemo(() => {
    const puUp = precificarNtnb((taxaReal + 1) / 100, vnaProj, dtLiq, dtVenc, diasUteis).pu;
    return puUp - result.pu;
  }, [taxaReal, vnaProj, dtLiq, dtVenc, result.pu]);

  // Cash flow chart data
  const chartFluxos = useMemo(() => {
    return {
      datas: result.fluxos.map((f) => f.data),
      nominais: result.fluxos.map((f) => f.fluxo),
      vps: result.fluxos.map((f) => f.vp),
    };
  }, [result.fluxos]);

  // Paradox simulator calculations
  const paradoxo = useMemo(() => {
    const puNovo = precificarNtnb(
      (taxaReal + varBps / 100) / 100,
      vnaProj,
      dtLiq,
      dtVenc,
      diasUteis,
    ).pu;
    const mtm = puNovo - result.pu;

    // Simplified 1-year carry: VNA * (IPCA + taxa_real)
    const carry = vnaProj * (ipcaRealizado / 100 + taxaReal / 100) * 1;

    const total = mtm + carry;
    return { mtm, carry, total };
  }, [taxaReal, varBps, ipcaRealizado, vnaProj, dtLiq, dtVenc, result.pu]);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: NTN-B (Nota do Tesouro Nacional serie B)
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            A <strong className="text-on-surface">NTN-B</strong> e um titulo
            indexado ao IPCA com cupons semestrais de 6% a.a. (equivalentes
            a {fmtPct(CUPOM_NTNB_SEMESTRAL, 4)} ao semestre). O VNA base e
            R$ 1.000 em 15/07/2000, corrigido pelo IPCA acumulado.
          </p>
          <div className="mt-2">
            <p className="font-label text-on-surface mb-1">Formula de precificacao:</p>
            <KMath tex="PU = VNA_{proj} \times \left[\sum_{k=1}^{n} \frac{cupom_k}{(1+taxa\_real)^{DU_k/252}} + \frac{1}{(1+taxa\_real)^{DU_n/252}}\right]" />
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong className="text-on-surface">Indexador:</strong> IPCA + taxa real fixa
            </li>
            <li>
              Cupom semestral: <KMath tex="(1{,}06)^{0{,}5} - 1 = 2{,}9563\%" display={false} /> ao semestre
            </li>
            <li>
              <strong className="text-on-surface">Paradoxo:</strong> se a taxa real sobe, o PU cai mesmo com inflacao alta
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              value={vnaProj}
              onChange={(e) => setVnaProj(Number(e.target.value))}
              step={0.01}
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
                  {p} anos
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-on-surface-variant">
          Vencimento calculado: <strong className="text-on-surface">{dtVenc}</strong>{" "}
          (proximo 1o jan ou 1o jul apos {prazo} anos)
        </p>
      </div>

      {/* 4 Metric cards */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
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
          label="Sensibilidade +100bps (R$)"
          value={`R$ ${fmtNum(sensib100bps)}`}
          sub="Variacao no PU por +1pp"
          colorClass="text-[#CC3333]"
        />
      </div>

      {/* Cash flow table */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h3 className="font-headline font-bold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[#8B5CF6] text-base">
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
                marker: { color: "#8B5CF6" },
              },
              {
                x: chartFluxos.datas,
                y: chartFluxos.vps,
                type: "scatter" as const,
                mode: "markers" as const,
                name: "Valor presente",
                marker: {
                  color: "#8B5CF688",
                  size: 10,
                  symbol: "circle",
                  line: { color: "#8B5CF6", width: 1.5 },
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
            Barras roxas: fluxos nominais (cupons + principal). Marcadores: valor
            presente descontado pela taxa real. A diferenca evidencia o efeito do
            desconto sobre fluxos mais distantes.
          </p>
        </div>
      )}

      {/* NTN-B Paradox Simulator */}
      <div className="glass-card rounded-lg p-5 space-y-5">
        <h3 className="font-headline font-bold text-sm flex items-center gap-2">
          <span className="text-base">&#9888;&#65039;</span>
          O Paradoxo da NTN-B
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Variacao da taxa real (bps): {varBps > 0 ? "+" : ""}{varBps}
            </label>
            <input
              type="range"
              min={-200}
              max={200}
              step={10}
              value={varBps}
              onChange={(e) => setVarBps(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-on-surface-variant mt-1">
              <span>-200 bps</span>
              <span>0</span>
              <span>+200 bps</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              IPCA realizado no periodo (% a.a.): {fmtNum(ipcaRealizado)}%
            </label>
            <input
              type="range"
              min={2}
              max={10}
              step={0.5}
              value={ipcaRealizado}
              onChange={(e) => setIpcaRealizado(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-on-surface-variant mt-1">
              <span>2%</span>
              <span>6%</span>
              <span>10%</span>
            </div>
          </div>
        </div>

        {/* Paradox metric cards */}
        <div className="grid sm:grid-cols-3 gap-3">
          <MetricCard
            label="Resultado MtM (R$)"
            value={`R$ ${fmtNum(paradoxo.mtm)}`}
            sub="Variacao por marcacao a mercado"
            colorClass={paradoxo.mtm >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}
          />
          <MetricCard
            label="Carry acumulado (R$)"
            value={`R$ ${fmtNum(paradoxo.carry)}`}
            sub="IPCA + taxa real (1 ano)"
            colorClass="text-[#2E8B57]"
          />
          <MetricCard
            label="Resultado Total (R$)"
            value={`R$ ${fmtNum(paradoxo.total)}`}
            sub="MtM + Carry"
            colorClass={paradoxo.total >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}
          />
        </div>

        <p className="text-sm text-on-surface-variant">
          Mesmo com IPCA alto, se a taxa real subir, o resultado total pode ser
          negativo no curto prazo. O carry positivo (remuneracao por IPCA + taxa real)
          pode nao ser suficiente para compensar a perda de marcacao a mercado quando
          as taxas reais sobem.
        </p>
      </div>

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Nota pedagogica:</strong> A NTN-B
          protege contra inflacao no <strong className="text-on-surface">carregamento
          ate o vencimento</strong>, pois o VNA acompanha o IPCA. Porem, no curto
          prazo, o PU e marcado a mercado pela taxa real: se a taxa real sobe
          (ex: de 6% para 7%), o PU cai significativamente, mesmo que a inflacao
          esteja alta. Este e o &quot;paradoxo&quot; da NTN-B — o titulo que protege contra
          inflacao pode gerar prejuizo justamente quando a inflacao sobe, se o
          mercado exigir taxas reais maiores. Para o gestor de tesouraria, a
          NTN-B e um instrumento de <strong className="text-on-surface">hedge de
          inflacao de longo prazo</strong>, nao de curto prazo.
        </p>
      </div>
    </div>
  );
}
