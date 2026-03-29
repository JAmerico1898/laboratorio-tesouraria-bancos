"use client";

import { useState, useMemo } from "react";
import { aliquotaIr } from "@/lib/finance";
import { fmtPct, fmtBrl } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const SELECT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const CAT_COLORS: Record<string, string> = {
  "Público": "#2E75B6",
  "Bancário": "#0E7C7B",
  "Corporativo": "#C55A11",
};

interface Instrument {
  nome: string;
  categoria: string;
  indexador: string;
  taxa: number;
  du: number;
  rating: string;
  liquidez: string;
}

const DEFAULT_INSTRUMENTS: Instrument[] = [
  { nome: "LTN 1A", categoria: "Público", indexador: "Pré", taxa: 12.50, du: 252, rating: "Soberano", liquidez: "Alta" },
  { nome: "NTN-B 3A", categoria: "Público", indexador: "IPCA+", taxa: 6.20, du: 756, rating: "Soberano", liquidez: "Alta" },
  { nome: "LFT", categoria: "Público", indexador: "SELIC", taxa: 0.02, du: 504, rating: "Soberano", liquidez: "Alta" },
  { nome: "CDB Banco Grande", categoria: "Bancário", indexador: "% CDI", taxa: 105, du: 252, rating: "AAA", liquidez: "Média" },
  { nome: "CDB Pré Banco Médio", categoria: "Bancário", indexador: "Pré", taxa: 13.30, du: 504, rating: "AA", liquidez: "Média" },
  { nome: "Debênture AAA", categoria: "Corporativo", indexador: "CDI+", taxa: 1.50, du: 756, rating: "AAA", liquidez: "Baixa" },
];

const CENARIOS = [
  { label: "Estável", varSelic: 0, spreadCredito: 0 },
  { label: "Corte \u2212200 bps", varSelic: -200, spreadCredito: 0 },
  { label: "Alta +200 bps", varSelic: 200, spreadCredito: 0 },
  { label: "Estresse crédito +100 bps spread", varSelic: 0, spreadCredito: 100 },
] as const;

// ---------------------------------------------------------------------------
// Computation helpers
// ---------------------------------------------------------------------------

function calcTaxaBruta(inst: Instrument, selicMeta: number, ipcaEsperado: number): number {
  switch (inst.indexador) {
    case "Pré":
      return inst.taxa;
    case "IPCA+":
      return inst.taxa + ipcaEsperado;
    case "SELIC":
      return selicMeta + inst.taxa / 100;
    case "% CDI":
      return selicMeta * inst.taxa / 100;
    case "CDI+":
      return selicMeta + inst.taxa;
    default:
      return inst.taxa;
  }
}

function calcDc(du: number): number {
  return Math.round(du * 365 / 252);
}

interface ComputedRow {
  nome: string;
  categoria: string;
  indexador: string;
  taxaOriginal: number;
  du: number;
  rating: string;
  liquidez: string;
  taxaBruta: number;
  taxaLiquida: number;
  spreadBps: number;
  duration: number;
  pu: number;
}

function computeMasterTable(
  instruments: Instrument[],
  selicMeta: number,
  ipcaEsperado: number,
): ComputedRow[] {
  // Find sovereign reference rate (LTN or first Público Pré)
  const soberanoRef = instruments.find(
    (i) => i.categoria === "Público" && i.indexador === "Pré",
  );
  const taxaSoberana = soberanoRef
    ? calcTaxaBruta(soberanoRef, selicMeta, ipcaEsperado)
    : selicMeta;

  return instruments.map((inst) => {
    const taxaBruta = calcTaxaBruta(inst, selicMeta, ipcaEsperado);
    const dc = calcDc(inst.du);
    const aliq = aliquotaIr(dc);
    const taxaLiquida = taxaBruta * (1 - aliq);
    const spreadBps = (taxaBruta - taxaSoberana) * 100;
    const duration = inst.du / 252;
    const pu = 1000 / Math.pow(1 + taxaBruta / 100, inst.du / 252);

    return {
      nome: inst.nome,
      categoria: inst.categoria,
      indexador: inst.indexador,
      taxaOriginal: inst.taxa,
      du: inst.du,
      rating: inst.rating,
      liquidez: inst.liquidez,
      taxaBruta,
      taxaLiquida,
      spreadBps,
      duration,
      pu,
    };
  });
}

interface ScenarioRow extends ComputedRow {
  carry: number;
  mtm: number;
  retornoTotal: number;
  eficiencia: number;
}

function computeScenario(
  rows: ComputedRow[],
  varSelicBps: number,
  spreadCreditoBps: number,
  horizonteMeses: number,
): ScenarioRow[] {
  return rows.map((r) => {
    const carry = (r.taxaBruta / 100) * (horizonteMeses / 12) * 100;

    let mtm: number;
    if (r.indexador === "SELIC") {
      mtm = 0;
    } else {
      mtm = -r.duration * (varSelicBps / 10000) * 100;
    }

    // Credit stress: additional impact on corporates and bancários
    if (spreadCreditoBps > 0 && r.categoria !== "Público") {
      mtm += -r.duration * (spreadCreditoBps / 10000) * 100;
    }

    const retornoTotal = carry + mtm;
    const eficiencia = r.duration > 0 ? retornoTotal / r.duration : 0;

    return { ...r, carry, mtm, retornoTotal, eficiencia };
  });
}

function spreadColorClass(bps: number): string {
  if (bps <= 50) return "text-[#2E8B57]";
  if (bps <= 150) return "text-[#C55A11]";
  return "text-[#CC3333]";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExercicioRelativeValue() {
  // Section 1: Instrument state
  const [instruments, setInstruments] = useState<Instrument[]>(
    () => DEFAULT_INSTRUMENTS.map((i) => ({ ...i })),
  );
  const [selicMeta, setSelicMeta] = useState(14.25);
  const [ipcaEsperado, setIpcaEsperado] = useState(4.50);

  // Section 3: Scenario state
  const [cenarioIdx, setCenarioIdx] = useState(0);
  const [horizonteMeses, setHorizonteMeses] = useState(12);

  // Section 4: Portfolio state
  const [volumeTotal, setVolumeTotal] = useState(50_000_000);
  const [allocations, setAllocations] = useState<number[]>(
    () => DEFAULT_INSTRUMENTS.map(() => 0),
  );

  // Derived data
  const masterRows = useMemo(
    () => computeMasterTable(instruments, selicMeta, ipcaEsperado),
    [instruments, selicMeta, ipcaEsperado],
  );

  const cenario = CENARIOS[cenarioIdx];
  const scenarioRows = useMemo(
    () =>
      computeScenario(
        masterRows,
        cenario.varSelic,
        cenario.spreadCredito,
        horizonteMeses,
      ),
    [masterRows, cenario.varSelic, cenario.spreadCredito, horizonteMeses],
  );

  const sortedByRetorno = useMemo(
    () => [...scenarioRows].sort((a, b) => b.retornoTotal - a.retornoTotal),
    [scenarioRows],
  );

  // Portfolio computations
  const allocSum = allocations.reduce((s, a) => s + a, 0);

  const portfolioMetrics = useMemo(() => {
    if (allocSum === 0)
      return { durationMedia: 0, spreadMedio: 0, retornoProj: 0, concentracao: 0 };
    const durationMedia =
      scenarioRows.reduce((s, r, i) => s + (allocations[i] / 100) * r.duration, 0);
    const spreadMedio =
      scenarioRows.reduce((s, r, i) => s + (allocations[i] / 100) * r.spreadBps, 0);
    const retornoProj =
      scenarioRows.reduce((s, r, i) => s + (allocations[i] / 100) * r.retornoTotal, 0);
    const concentracao = Math.max(...allocations);
    return { durationMedia, spreadMedio, retornoProj, concentracao };
  }, [scenarioRows, allocations, allocSum]);

  // Most efficient instrument
  const mostEfficient = useMemo(
    () =>
      scenarioRows.reduce((best, r) =>
        r.eficiencia > best.eficiencia ? r : best,
      ),
    [scenarioRows],
  );

  // Handlers
  function updateInstrument(index: number, field: keyof Instrument, value: number) {
    setInstruments((prev) => {
      const next = prev.map((inst) => ({ ...inst }));
      (next[index] as Record<string, unknown>)[field] = value;
      return next;
    });
  }

  function updateAllocation(index: number, value: number) {
    setAllocations((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  // Portfolio narrative
  const narrative = useMemo(() => {
    if (allocSum === 0 || allocSum !== 100) return null;
    const parts: string[] = [];
    const pm = portfolioMetrics;

    parts.push(
      `A carteira projetada possui duration media de ${pm.durationMedia.toFixed(2)} anos ` +
      `e spread medio de ${pm.spreadMedio.toFixed(0)} bps sobre o soberano.`,
    );

    if (pm.concentracao >= 50) {
      const maxIdx = allocations.indexOf(Math.max(...allocations));
      parts.push(
        `Atencao: concentracao elevada de ${pm.concentracao}% em ${instruments[maxIdx].nome}.`,
      );
    }

    parts.push(
      `Retorno projetado de ${pm.retornoProj.toFixed(2)}% no horizonte de ${horizonteMeses} meses ` +
      `(cenario: ${CENARIOS[cenarioIdx].label}).`,
    );

    parts.push(
      `Instrumento mais eficiente (retorno/duration): ${mostEfficient.nome} ` +
      `com ${mostEfficient.eficiencia.toFixed(2)}%/ano.`,
    );

    return parts.join(" ");
  }, [allocSum, portfolioMetrics, allocations, instruments, horizonteMeses, cenarioIdx, mostEfficient]);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="space-y-10">
      {/* ----------------------------------------------------------------- */}
      {/* SECTION 1: Instrument Selection                                   */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="font-headline font-bold text-lg flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">list_alt</span>
          1. Instrumentos
        </h2>

        <div className="glass-card rounded-lg p-5 space-y-4">
          {/* Macro inputs */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                SELIC Meta (% a.a.)
              </label>
              <input
                type="number"
                value={selicMeta}
                onChange={(e) => setSelicMeta(Number(e.target.value))}
                step={0.25}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                IPCA Esperado 12M (% a.a.)
              </label>
              <input
                type="number"
                value={ipcaEsperado}
                onChange={(e) => setIpcaEsperado(Number(e.target.value))}
                step={0.25}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Instruments table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-xs text-on-surface-variant">
                  <th className="text-left py-2 px-2">Instrumento</th>
                  <th className="text-left py-2 px-2">Categoria</th>
                  <th className="text-left py-2 px-2">Indexador</th>
                  <th className="text-right py-2 px-2">Taxa / Spread</th>
                  <th className="text-right py-2 px-2">DU</th>
                  <th className="text-left py-2 px-2">Rating</th>
                  <th className="text-left py-2 px-2">Liquidez</th>
                </tr>
              </thead>
              <tbody>
                {instruments.map((inst, i) => (
                  <tr
                    key={inst.nome}
                    className={`border-b border-outline-variant/20 ${
                      i % 2 === 0 ? "bg-surface-container/40" : ""
                    }`}
                  >
                    <td
                      className="py-2 px-2 font-bold"
                      style={{ color: CAT_COLORS[inst.categoria] }}
                    >
                      {inst.nome}
                    </td>
                    <td className="py-2 px-2 text-on-surface-variant">
                      {inst.categoria}
                    </td>
                    <td className="py-2 px-2 text-on-surface-variant">
                      {inst.indexador}
                    </td>
                    <td className="py-1 px-2 text-right">
                      <input
                        type="number"
                        value={inst.taxa}
                        onChange={(e) =>
                          updateInstrument(i, "taxa", Number(e.target.value))
                        }
                        step={inst.indexador === "% CDI" ? 1 : 0.05}
                        className="w-24 bg-surface-container border border-outline-variant/30 rounded px-2 py-1 text-sm text-right focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="py-1 px-2 text-right">
                      <input
                        type="number"
                        value={inst.du}
                        onChange={(e) =>
                          updateInstrument(i, "du", Number(e.target.value))
                        }
                        step={21}
                        className="w-20 bg-surface-container border border-outline-variant/30 rounded px-2 py-1 text-sm text-right focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-2 text-on-surface-variant">
                      {inst.rating}
                    </td>
                    <td className="py-2 px-2 text-on-surface-variant">
                      {inst.liquidez}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* SECTION 2: Master Comparison Table                                */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="font-headline font-bold text-lg flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">table_chart</span>
          2. Tabela Comparativa
        </h2>

        <div className="glass-card rounded-lg p-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-xs text-on-surface-variant">
                  <th className="text-left py-2 px-2">Instrumento</th>
                  <th className="text-right py-2 px-2">Taxa Bruta (% a.a.)</th>
                  <th className="text-right py-2 px-2">Taxa Liquida (% a.a.)</th>
                  <th className="text-right py-2 px-2">Spread s/ Soberano (bps)</th>
                  <th className="text-right py-2 px-2">Duration (anos)</th>
                  <th className="text-right py-2 px-2">PU Simplificado</th>
                </tr>
              </thead>
              <tbody>
                {masterRows.map((r, i) => (
                  <tr
                    key={r.nome}
                    className={`border-b border-outline-variant/20 ${
                      i % 2 === 0 ? "bg-surface-container/40" : ""
                    }`}
                  >
                    <td
                      className="py-2 px-2 font-bold"
                      style={{ color: CAT_COLORS[r.categoria] }}
                    >
                      {r.nome}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {fmtPct(r.taxaBruta)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {fmtPct(r.taxaLiquida)}
                    </td>
                    <td
                      className={`py-2 px-2 text-right font-bold ${spreadColorClass(
                        Math.abs(r.spreadBps),
                      )}`}
                    >
                      {r.spreadBps >= 0 ? "+" : ""}
                      {r.spreadBps.toFixed(0)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {r.duration.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {fmtBrl(r.pu)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Scatter chart: Duration vs Spread */}
          <h3 className="font-label font-bold text-sm text-on-surface-variant mt-4">
            Duration vs Spread sobre Soberano
          </h3>
          <PlotlyChart
            className="h-[400px]"
            data={Object.keys(CAT_COLORS).map((cat) => {
              const catRows = masterRows.filter((r) => r.categoria === cat);
              return {
                x: catRows.map((r) => r.duration),
                y: catRows.map((r) => r.spreadBps),
                text: catRows.map((r) => r.nome),
                type: "scatter" as const,
                mode: "text+markers" as const,
                name: cat,
                textposition: "top center" as const,
                marker: {
                  color: CAT_COLORS[cat],
                  size: 12,
                },
                hovertemplate:
                  "%{text}<br>Duration: %{x:.2f} anos<br>Spread: %{y:.0f} bps<extra></extra>",
              };
            })}
            layout={{
              ...PLOTLY_LAYOUT,
              xaxis: {
                ...PLOTLY_LAYOUT.xaxis,
                title: { text: "Duration (anos)" },
              },
              yaxis: {
                ...PLOTLY_LAYOUT.yaxis,
                title: { text: "Spread s/ Soberano (bps)" },
              },
              margin: { ...PLOTLY_LAYOUT.margin, t: 20 },
            }}
            config={PLOTLY_CONFIG}
          />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* SECTION 3: Scenario Simulation                                    */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="font-headline font-bold text-lg flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">
            trending_up
          </span>
          3. Simulacao de Cenario
        </h2>

        <div className="glass-card rounded-lg p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Cenario
              </label>
              <select
                value={cenarioIdx}
                onChange={(e) => setCenarioIdx(Number(e.target.value))}
                className={SELECT_CLASS}
              >
                {CENARIOS.map((c, i) => (
                  <option key={i} value={i}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Horizonte (meses): {horizonteMeses}
              </label>
              <input
                type="range"
                min={3}
                max={24}
                step={1}
                value={horizonteMeses}
                onChange={(e) => setHorizonteMeses(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                <span>3</span>
                <span>12</span>
                <span>24</span>
              </div>
            </div>
          </div>

          {/* Extended table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-xs text-on-surface-variant">
                  <th className="text-left py-2 px-2">Instrumento</th>
                  <th className="text-right py-2 px-2">Taxa Bruta</th>
                  <th className="text-right py-2 px-2">Carry (%)</th>
                  <th className="text-right py-2 px-2">MtM (%)</th>
                  <th className="text-right py-2 px-2">Retorno Total (%)</th>
                  <th className="text-right py-2 px-2">Eficiencia (%/ano)</th>
                </tr>
              </thead>
              <tbody>
                {scenarioRows.map((r, i) => (
                  <tr
                    key={r.nome}
                    className={`border-b border-outline-variant/20 ${
                      i % 2 === 0 ? "bg-surface-container/40" : ""
                    }`}
                  >
                    <td
                      className="py-2 px-2 font-bold"
                      style={{ color: CAT_COLORS[r.categoria] }}
                    >
                      {r.nome}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {fmtPct(r.taxaBruta)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {r.carry.toFixed(2)}
                    </td>
                    <td
                      className={`py-2 px-2 text-right ${
                        r.mtm >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"
                      }`}
                    >
                      {r.mtm >= 0 ? "+" : ""}
                      {r.mtm.toFixed(2)}
                    </td>
                    <td
                      className={`py-2 px-2 text-right font-bold ${
                        r.retornoTotal >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"
                      }`}
                    >
                      {r.retornoTotal.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {r.eficiencia.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Horizontal bar chart: retorno total sorted */}
          <h3 className="font-label font-bold text-sm text-on-surface-variant mt-4">
            Retorno Total por Instrumento ({CENARIOS[cenarioIdx].label}, {horizonteMeses}M)
          </h3>
          <PlotlyChart
            className="h-[350px]"
            data={[
              {
                y: sortedByRetorno.map((r) => r.nome),
                x: sortedByRetorno.map((r) => r.retornoTotal),
                type: "bar" as const,
                orientation: "h" as const,
                marker: {
                  color: sortedByRetorno.map((r) =>
                    r.retornoTotal >= 0 ? "#2E8B57" : "#CC3333",
                  ),
                },
                text: sortedByRetorno.map(
                  (r) => `${r.retornoTotal >= 0 ? "+" : ""}${r.retornoTotal.toFixed(2)}%`,
                ),
                textposition: "outside" as const,
                hovertemplate:
                  "%{y}: %{x:.2f}%<extra></extra>",
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              xaxis: {
                ...PLOTLY_LAYOUT.xaxis,
                title: { text: "Retorno Total (%)" },
              },
              yaxis: {
                ...PLOTLY_LAYOUT.yaxis,
                autorange: "reversed" as const,
              },
              margin: { ...PLOTLY_LAYOUT.margin, l: 140, t: 20 },
              showlegend: false,
            }}
            config={PLOTLY_CONFIG}
          />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* SECTION 4: Build Your Portfolio                                    */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="font-headline font-bold text-lg flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">
            account_balance_wallet
          </span>
          4. Monte sua Carteira
        </h2>

        <div className="glass-card rounded-lg p-5 space-y-5">
          {/* Volume */}
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Volume Total (R$)
            </label>
            <input
              type="number"
              value={volumeTotal}
              onChange={(e) => setVolumeTotal(Number(e.target.value))}
              step={5_000_000}
              min={0}
              className={INPUT_CLASS}
            />
            <span className="text-xs text-on-surface-variant ml-2">
              {fmtBrl(volumeTotal)}
            </span>
          </div>

          {/* Allocation sliders */}
          <div className="space-y-3">
            {instruments.map((inst, i) => (
              <div key={inst.nome} className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                <div>
                  <label className="block text-xs font-label mb-1" style={{ color: CAT_COLORS[inst.categoria] }}>
                    {inst.nome}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={allocations[i]}
                    onChange={(e) => updateAllocation(i, Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                <span className="text-sm font-bold w-12 text-right">
                  {allocations[i]}%
                </span>
                <span className="text-xs text-on-surface-variant w-28 text-right">
                  {fmtBrl(volumeTotal * allocations[i] / 100)}
                </span>
              </div>
            ))}
          </div>

          {/* Sum warning */}
          {allocSum !== 100 && (
            <div
              className={`rounded-lg px-4 py-2 text-sm font-bold ${
                allocSum > 100
                  ? "bg-[#CC3333]/20 text-[#CC3333]"
                  : "bg-[#C55A11]/20 text-[#C55A11]"
              }`}
            >
              {allocSum > 100
                ? `Alocacao total: ${allocSum}% (excede 100%)`
                : `Alocacao total: ${allocSum}% (faltam ${100 - allocSum}%)`}
            </div>
          )}

          {allocSum === 100 && (
            <div className="rounded-lg px-4 py-2 text-sm font-bold bg-[#2E8B57]/20 text-[#2E8B57]">
              Alocacao total: 100%
            </div>
          )}

          {/* Portfolio metrics */}
          {allocSum > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="glass-card rounded-lg p-4 text-center">
                <span className="text-xs font-label text-on-surface-variant">
                  Duration Media
                </span>
                <div className="text-xl font-headline font-bold mt-1">
                  {portfolioMetrics.durationMedia.toFixed(2)}
                </div>
                <span className="text-xs text-on-surface-variant">anos</span>
              </div>
              <div className="glass-card rounded-lg p-4 text-center">
                <span className="text-xs font-label text-on-surface-variant">
                  Spread Medio
                </span>
                <div className="text-xl font-headline font-bold mt-1">
                  {portfolioMetrics.spreadMedio.toFixed(0)}
                </div>
                <span className="text-xs text-on-surface-variant">bps</span>
              </div>
              <div className="glass-card rounded-lg p-4 text-center">
                <span className="text-xs font-label text-on-surface-variant">
                  Retorno Projetado
                </span>
                <div
                  className={`text-xl font-headline font-bold mt-1 ${
                    portfolioMetrics.retornoProj >= 0
                      ? "text-[#2E8B57]"
                      : "text-[#CC3333]"
                  }`}
                >
                  {portfolioMetrics.retornoProj.toFixed(2)}%
                </div>
                <span className="text-xs text-on-surface-variant">
                  {horizonteMeses}M
                </span>
              </div>
              <div className="glass-card rounded-lg p-4 text-center">
                <span className="text-xs font-label text-on-surface-variant">
                  Concentracao Max
                </span>
                <div
                  className={`text-xl font-headline font-bold mt-1 ${
                    portfolioMetrics.concentracao >= 50
                      ? "text-[#C55A11]"
                      : ""
                  }`}
                >
                  {portfolioMetrics.concentracao}%
                </div>
                <span className="text-xs text-on-surface-variant">
                  em um instrumento
                </span>
              </div>
            </div>
          )}

          {/* Donut chart */}
          {allocSum > 0 && (
            <>
              <h3 className="font-label font-bold text-sm text-on-surface-variant mt-4">
                Composicao da Carteira
              </h3>
              <PlotlyChart
                className="h-[350px]"
                data={[
                  {
                    labels: instruments
                      .filter((_, i) => allocations[i] > 0)
                      .map((inst) => inst.nome),
                    values: allocations.filter((a) => a > 0),
                    type: "pie" as const,
                    hole: 0.45,
                    marker: {
                      colors: instruments
                        .filter((_, i) => allocations[i] > 0)
                        .map((inst) => CAT_COLORS[inst.categoria]),
                    },
                    textinfo: "label+percent" as const,
                    hovertemplate:
                      "%{label}<br>%{percent}<br>" +
                      fmtBrl(volumeTotal) +
                      " x %{percent}<extra></extra>",
                  },
                ]}
                layout={{
                  ...PLOTLY_LAYOUT,
                  margin: { ...PLOTLY_LAYOUT.margin, t: 20, b: 20 },
                  showlegend: true,
                  legend: {
                    ...PLOTLY_LAYOUT.legend,
                    orientation: "h" as const,
                    y: -0.1,
                  },
                }}
                config={PLOTLY_CONFIG}
              />
            </>
          )}

          {/* Auto-generated narrative */}
          {narrative && (
            <div className="glass-card rounded-lg p-4 border-l-4 border-primary mt-4">
              <h4 className="font-label font-bold text-sm mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">
                  auto_awesome
                </span>
                Diagnostico da Carteira
              </h4>
              <p className="text-sm text-on-surface-variant">{narrative}</p>
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* SECTION 5: Reflection Questions                                   */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="font-headline font-bold text-lg flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">quiz</span>
          5. Questoes para Reflexao
        </h2>

        <div className="space-y-3">
          <details className="glass-card rounded-lg">
            <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-primary text-base">
                help_outline
              </span>
              1. Sua alocacao muda se o cenario for de alta em vez de corte?
            </summary>
            <div className="px-5 pb-5 text-sm text-on-surface-variant">
              <p>
                Compare os retornos totais nos cenarios de corte e alta. Instrumentos prefixados e
                de duration longa sofrem mais em cenarios de alta. Avalie se faz sentido migrar para
                pos-fixados (LFT, CDB % CDI) quando a expectativa e de juros mais altos.
              </p>
            </div>
          </details>

          <details className="glass-card rounded-lg">
            <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-primary text-base">
                help_outline
              </span>
              2. O spread da debenture AAA compensa o risco de iliquidez?
            </summary>
            <div className="px-5 pb-5 text-sm text-on-surface-variant">
              <p>
                O premio de liquidez e a compensacao por nao conseguir vender o ativo rapidamente
                sem desconto. Compare o spread incremental da debenture vs. titulos publicos de
                mesma duration e avalie se ele cobre o risco de ficar &ldquo;preso&rdquo; na posicao.
              </p>
            </div>
          </details>

          <details className="glass-card rounded-lg">
            <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-primary text-base">
                help_outline
              </span>
              3. O CDB do banco medio paga mais que o do banco grande. Esse spread e proporcional ao risco?
            </summary>
            <div className="px-5 pb-5 text-sm text-on-surface-variant">
              <p>
                Bancos medios tipicamente oferecem taxas maiores para compensar risco de credito
                mais elevado. Verifique se a diferenca de taxa justifica a diferenca de rating e se o
                FGC (Fundo Garantidor de Creditos) cobre o volume aplicado (limite de R$ 250 mil por CPF/instituicao).
              </p>
            </div>
          </details>

          <details className="glass-card rounded-lg">
            <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-primary text-base">
                help_outline
              </span>
              4. Se a inflacao surpreender para cima, quais instrumentos se beneficiam?
            </summary>
            <div className="px-5 pb-5 text-sm text-on-surface-variant">
              <p>
                Instrumentos indexados ao IPCA (NTN-B) se beneficiam diretamente de inflacao mais
                alta. Pos-fixados (LFT, CDB % CDI) tambem se beneficiam indiretamente, pois o BCB
                tende a subir juros em resposta a inflacao. Prefixados perdem valor real.
              </p>
            </div>
          </details>

          <details className="glass-card rounded-lg">
            <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-primary text-base">
                help_outline
              </span>
              5. Como essa alocacao se compara com limites de risco tipicos de uma tesouraria?
            </summary>
            <div className="px-5 pb-5 text-sm text-on-surface-variant">
              <p>
                Tesourarias bancarias tipicamente possuem limites de VaR, duration maxima da
                carteira, concentracao por emissor/setor e limites de credito por rating.
                Verifique se sua alocacao respeita uma duration media compativel com a politica
                de risco e se a concentracao em qualquer instrumento nao excede 30-40% do portfolio.
              </p>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
