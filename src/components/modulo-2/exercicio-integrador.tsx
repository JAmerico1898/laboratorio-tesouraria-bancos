"use client";

import { useState, useEffect, useMemo } from "react";
import { PlotlyChart } from "@/components/plotly-chart";
import {
  calcularBreakeven,
  calcularForwards,
  calcularCupomCambial,
  gerarDiagnostico,
  type ForwardPoint,
  type CurvasInput,
  type DiagnosticoResult,
} from "@/lib/finance";
import {
  loadCurvasDi,
  loadNtnbTaxas,
  loadDolarFuturo,
  loadDolarSpot,
  loadSelicMeta,
  loadFocusIpca,
  loadCds,
  loadIpca,
  calcIpca12m,
  META_INFLACAO,
  type CurvaDiPoint,
  type NtnbTaxaPoint,
  type DolarFuturoPoint,
  type DolarSpotPoint,
  type RateDataPoint,
  type FocusIpcaPoint,
} from "@/lib/data";
import { fmtPct, fmtNum } from "@/lib/format";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG, CHART_COLORS } from "@/lib/chart-config";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const SOFR_REF = 5.0;

const COLOR_NOMINAL = "#2E75B6";
const COLOR_REAL = "#C55A11";
const COLOR_BREAKEVEN = "#8B5CF6";
const COLOR_FORWARD = "#555555";
const COLOR_CUPOM = "#059669";
const COLOR_POSITIVE = "#2E8B57";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render diagnostic text, converting **bold** markdown to <strong> tags. */
function renderDiagText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="text-on-surface">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

/** Find latest value in sorted array where item.data <= targetDate. */
function latestOnOrBefore<T extends { data: string }>(
  arr: T[],
  targetDate: string,
): T | null {
  const filtered = arr.filter((item) => item.data <= targetDate);
  if (filtered.length === 0) return arr.length > 0 ? arr[arr.length - 1] : null;
  return filtered[filtered.length - 1];
}

/** Find latest FocusIpca value where dataColeta <= targetDate, variavel === "IPCA_12m". */
function latestFocusIpca(
  arr: FocusIpcaPoint[],
  targetDate: string,
): number | null {
  const ipca12m = arr
    .filter((f) => f.variavel === "IPCA_12m")
    .sort((a, b) => a.dataColeta.localeCompare(b.dataColeta));
  if (ipca12m.length === 0) return null;
  const before = ipca12m.filter((f) => f.dataColeta <= targetDate);
  if (before.length > 0) return before[before.length - 1].mediana;
  return ipca12m[ipca12m.length - 1].mediana;
}

// ---------------------------------------------------------------------------
// Consolidated row type
// ---------------------------------------------------------------------------

interface ConsolidatedRow {
  prazoDu: number;
  prazoAnos: number;
  diSpot: number | null;
  ntnb: number | null;
  breakeven: number | null;
  forward: number | null;
  cupom: number | null;
}

// ---------------------------------------------------------------------------
// Reflection questions
// ---------------------------------------------------------------------------

const REFLECTION_QUESTIONS = [
  "Observando a curva nominal e as forwards: o mercado espera que a SELIC esteja mais alta ou mais baixa daqui a 12 meses? Em que prazo está a maior forward — e o que isso pode significar?",
  "A inflação implícita (breakeven) está acima ou abaixo da meta de inflação para os prazos mais longos? Se estiver acima, isso necessariamente significa que o mercado espera inflação alta, ou pode haver outra explicação (prêmio de risco)?",
  "Se você acredita que o COPOM vai cortar a SELIC mais do que o mercado precifica, em qual FRA você se posicionaria? Qual o risco dessa posição?",
  "Comparando as duas datas selecionadas: o que mudou na leitura da curva? Que evento macroeconômico poderia explicar a mudança?",
  "O cupom cambial está em nível que favorece ou desfavorece a captação em dólar com conversão para reais? Como essa análise muda se o prazo da captação for de 3 meses vs. 2 anos?",
  "Se você tivesse que montar uma carteira diversificada usando apenas as informações das curvas construídas, qual seria sua alocação entre prefixado, IPCA+, pós-fixado e dólar hedgeado?",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExercicioIntegrador() {
  // -------------------------------------------------------------------------
  // State: raw data
  // -------------------------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [diData, setDiData] = useState<CurvaDiPoint[]>([]);
  const [ntnbData, setNtnbData] = useState<NtnbTaxaPoint[]>([]);
  const [dolFutData, setDolFutData] = useState<DolarFuturoPoint[]>([]);
  const [dolSpotData, setDolSpotData] = useState<DolarSpotPoint[]>([]);
  const [selicData, setSelicData] = useState<RateDataPoint[]>([]);
  const [focusData, setFocusData] = useState<FocusIpcaPoint[]>([]);
  const [cdsData, setCdsData] = useState<RateDataPoint[]>([]);
  const [ipcaData, setIpcaData] = useState<RateDataPoint[]>([]);

  const [selectedDate, setSelectedDate] = useState("");

  // -------------------------------------------------------------------------
  // Load ALL data on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadCurvasDi(),
      loadNtnbTaxas(),
      loadDolarFuturo(),
      loadDolarSpot(),
      loadSelicMeta(),
      loadFocusIpca(),
      loadCds(),
      loadIpca(),
    ])
      .then(([di, ntnb, dolFut, dolSpot, selic, focus, cds, ipca]) => {
        setDiData(di);
        setNtnbData(ntnb);
        setDolFutData(dolFut);
        setDolSpotData(dolSpot);
        setSelicData(selic);
        setFocusData(focus);
        setCdsData(cds);
        setIpcaData(ipca);
        // Set selectedDate to latest available from DI dates
        const dates = [...new Set(di.map((d) => d.data))].sort();
        if (dates.length > 0) setSelectedDate(dates[dates.length - 1]);
      })
      .finally(() => setLoading(false));
  }, []);

  // -------------------------------------------------------------------------
  // Available dates from DI data
  // -------------------------------------------------------------------------
  const availableDates = useMemo(() => {
    return [...new Set(diData.map((d) => d.data))].sort();
  }, [diData]);

  // -------------------------------------------------------------------------
  // Section 6.1 — Metric card values
  // -------------------------------------------------------------------------

  const selicMetaValue = useMemo((): number | null => {
    if (!selectedDate || selicData.length === 0) return null;
    const point = latestOnOrBefore(selicData, selectedDate);
    return point ? point.valor : null;
  }, [selectedDate, selicData]);

  const ipca12mValue = useMemo((): number | null => {
    if (ipcaData.length < 12) return null;
    const series = calcIpca12m(ipcaData);
    if (series.length === 0) return null;
    const point = latestOnOrBefore(series, selectedDate);
    return point ? point.valor : null;
  }, [selectedDate, ipcaData]);

  const focusIpcaValue = useMemo((): number | null => {
    if (!selectedDate || focusData.length === 0) return null;
    return latestFocusIpca(focusData, selectedDate);
  }, [selectedDate, focusData]);

  const ptaxValue = useMemo((): number | null => {
    if (!selectedDate || dolSpotData.length === 0) return null;
    const point = latestOnOrBefore(dolSpotData, selectedDate);
    return point ? point.valor : null;
  }, [selectedDate, dolSpotData]);

  const cdsValue = useMemo((): number | null => {
    if (!selectedDate || cdsData.length === 0) return null;
    const point = latestOnOrBefore(cdsData, selectedDate);
    return point ? point.valor : null;
  }, [selectedDate, cdsData]);

  // -------------------------------------------------------------------------
  // Section 6.1 — Raw data for selected date
  // -------------------------------------------------------------------------

  const diForDate = useMemo(
    () => diData.filter((d) => d.data === selectedDate).sort((a, b) => a.prazoDu - b.prazoDu),
    [diData, selectedDate],
  );

  const ntnbForDate = useMemo(
    () => ntnbData.filter((d) => d.data === selectedDate).sort((a, b) => a.prazoDu - b.prazoDu),
    [ntnbData, selectedDate],
  );

  const dolFutForDate = useMemo(
    () => dolFutData.filter((d) => d.data === selectedDate).sort((a, b) => a.prazoDu - b.prazoDu),
    [dolFutData, selectedDate],
  );

  // -------------------------------------------------------------------------
  // Section 6.2 — Curve construction
  // -------------------------------------------------------------------------

  const curvaNominal = useMemo((): Record<number, number> => {
    const map: Record<number, number> = {};
    for (const p of diForDate) map[p.prazoDu] = p.taxa;
    return map;
  }, [diForDate]);

  const curvaReal = useMemo((): Record<number, number> => {
    const map: Record<number, number> = {};
    for (const p of ntnbForDate) map[p.prazoDu] = p.taxa;
    return map;
  }, [ntnbForDate]);

  const breakevenMap = useMemo((): Record<number, number> => {
    const map: Record<number, number> = {};
    for (const nb of ntnbForDate) {
      const di = diForDate.find((d) => d.prazoDu === nb.prazoDu);
      if (di) {
        map[nb.prazoDu] = calcularBreakeven(di.taxa, nb.taxa);
      }
    }
    return map;
  }, [diForDate, ntnbForDate]);

  const forwards = useMemo((): ForwardPoint[] => {
    if (Object.keys(curvaNominal).length === 0) return [];
    return calcularForwards(curvaNominal);
  }, [curvaNominal]);

  const cupomCambialMap = useMemo((): Record<number, number> => {
    if (!ptaxValue || ptaxValue === 0) return {};
    const map: Record<number, number> = {};
    for (const fut of dolFutForDate) {
      const di = diForDate.find((d) => d.prazoDu === fut.prazoDu);
      if (di) {
        map[fut.prazoDu] = calcularCupomCambial(
          di.taxa,
          fut.prazoDu,
          fut.dc,
          ptaxValue,
          fut.cotacao,
        );
      }
    }
    return map;
  }, [dolFutForDate, diForDate, ptaxValue]);

  // -------------------------------------------------------------------------
  // Section 6.2 — Chart data
  // -------------------------------------------------------------------------

  const nominalChartData = useMemo(() => {
    const sorted = Object.entries(curvaNominal)
      .map(([du, taxa]) => ({ du: Number(du), taxa: taxa * 100, anos: Number(du) / 252 }))
      .sort((a, b) => a.du - b.du);
    return sorted;
  }, [curvaNominal]);

  const realChartData = useMemo(() => {
    return Object.entries(curvaReal)
      .map(([du, taxa]) => ({ du: Number(du), taxa: taxa * 100, anos: Number(du) / 252 }))
      .sort((a, b) => a.du - b.du);
  }, [curvaReal]);

  const breakevenChartData = useMemo(() => {
    return Object.entries(breakevenMap)
      .map(([du, taxa]) => ({ du: Number(du), taxa: taxa * 100, anos: Number(du) / 252 }))
      .sort((a, b) => a.du - b.du);
  }, [breakevenMap]);

  const cupomChartData = useMemo(() => {
    return Object.entries(cupomCambialMap)
      .map(([du, taxa]) => ({ du: Number(du), taxa: taxa * 100, meses: Number(du) / 21 }))
      .sort((a, b) => a.du - b.du);
  }, [cupomCambialMap]);

  // -------------------------------------------------------------------------
  // Section 6.2 — Consolidated table
  // -------------------------------------------------------------------------

  const consolidatedRows = useMemo((): ConsolidatedRow[] => {
    const allDus = new Set<number>();
    for (const du of Object.keys(curvaNominal).map(Number)) allDus.add(du);
    for (const du of Object.keys(curvaReal).map(Number)) allDus.add(du);
    for (const du of Object.keys(cupomCambialMap).map(Number)) allDus.add(du);

    // Build forward lookup: ateDu → forwardAa
    const fwdLookup: Record<number, number> = {};
    for (const f of forwards) fwdLookup[f.ateDu] = f.forwardAa;

    const sorted = [...allDus].sort((a, b) => a - b);
    return sorted.map((du) => ({
      prazoDu: du,
      prazoAnos: Math.round((du / 252) * 10) / 10,
      diSpot: curvaNominal[du] != null ? curvaNominal[du] * 100 : null,
      ntnb: curvaReal[du] != null ? curvaReal[du] * 100 : null,
      breakeven: breakevenMap[du] != null ? breakevenMap[du] * 100 : null,
      forward: fwdLookup[du] != null ? fwdLookup[du] * 100 : null,
      cupom: cupomCambialMap[du] != null ? cupomCambialMap[du] * 100 : null,
    }));
  }, [curvaNominal, curvaReal, breakevenMap, forwards, cupomCambialMap]);

  // -------------------------------------------------------------------------
  // Section 6.3 — Diagnostic
  // -------------------------------------------------------------------------

  const diagnostico = useMemo((): DiagnosticoResult | null => {
    if (Object.keys(curvaNominal).length === 0) return null;
    const curvasInput: CurvasInput = {
      spotNominal: curvaNominal,
      spotReal: curvaReal,
      breakeven: breakevenMap,
      forwards,
      cupomCambial: cupomCambialMap,
      selicAtual: selicMetaValue ?? 0,
      focusIpca: focusIpcaValue ?? META_INFLACAO,
      sofr: SOFR_REF,
    };
    return gerarDiagnostico(curvasInput);
  }, [curvaNominal, curvaReal, breakevenMap, forwards, cupomCambialMap, selicMetaValue, focusIpcaValue]);

  // -------------------------------------------------------------------------
  // Section 6.4 — Temporal comparison
  // -------------------------------------------------------------------------

  const hasMultipleDates = availableDates.length > 1;

  // =========================================================================
  // RENDER
  // =========================================================================

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <span className="material-symbols-outlined text-primary text-3xl mb-2 block animate-spin">
          progress_activity
        </span>
        <p className="text-sm text-on-surface-variant">Carregando dados de mercado...</p>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <span className="material-symbols-outlined text-primary text-3xl mb-2 block">info</span>
        <p className="text-sm text-on-surface-variant">Selecione uma data para iniciar a análise.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* =================================================================
          SECTION 6.1 — Market Data Panel
          ================================================================= */}
      <section>
        <h2 className="font-headline text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">monitoring</span>
          6.1 — Painel de Dados de Mercado
        </h2>

        {/* Date selector */}
        <div className="glass-card rounded-xl p-5 mb-4">
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            Data de referência
          </label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={INPUT_CLASS + " max-w-xs"}
          >
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* 5 metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          <div className="glass-card rounded-lg p-4 text-center">
            <span className="text-xs font-label text-on-surface-variant">SELIC Meta</span>
            <p className="text-2xl font-headline font-bold mt-1" style={{ color: COLOR_NOMINAL }}>
              {selicMetaValue != null ? fmtPct(selicMetaValue) : "—"}
            </p>
          </div>
          <div className="glass-card rounded-lg p-4 text-center">
            <span className="text-xs font-label text-on-surface-variant">IPCA 12M</span>
            <p className="text-2xl font-headline font-bold mt-1" style={{ color: COLOR_BREAKEVEN }}>
              {ipca12mValue != null ? fmtPct(ipca12mValue) : "—"}
            </p>
          </div>
          <div className="glass-card rounded-lg p-4 text-center">
            <span className="text-xs font-label text-on-surface-variant">Focus IPCA</span>
            <p className="text-2xl font-headline font-bold mt-1" style={{ color: COLOR_BREAKEVEN }}>
              {focusIpcaValue != null ? fmtPct(focusIpcaValue) : "—"}
            </p>
          </div>
          <div className="glass-card rounded-lg p-4 text-center">
            <span className="text-xs font-label text-on-surface-variant">Dólar PTAX</span>
            <p className="text-2xl font-headline font-bold mt-1" style={{ color: COLOR_CUPOM }}>
              {ptaxValue != null ? `R$ ${fmtNum(ptaxValue)}` : "—"}
            </p>
          </div>
          <div className="glass-card rounded-lg p-4 text-center">
            <span className="text-xs font-label text-on-surface-variant">CDS Brasil</span>
            <p className="text-2xl font-headline font-bold mt-1" style={{ color: COLOR_REAL }}>
              {cdsValue != null ? `${fmtNum(cdsValue)} bps` : "—"}
            </p>
          </div>
        </div>

        {/* Raw data table (collapsible) */}
        <details className="glass-card rounded-xl">
          <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
            <span className="material-symbols-outlined text-primary text-base">table_chart</span>
            Dados brutos para {selectedDate}
          </summary>
          <div className="px-5 pb-5 space-y-4">
            {/* DI Vertices */}
            {diForDate.length > 0 && (
              <div>
                <h4 className="text-xs font-label text-on-surface-variant mb-2">Vértices DI</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/30 bg-surface-container">
                        <th className="text-left px-3 py-2 font-label text-on-surface-variant">
                          Prazo (DU)
                        </th>
                        <th className="text-right px-3 py-2 font-label text-on-surface-variant">
                          Taxa (%)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {diForDate.map((d, i) => (
                        <tr
                          key={d.prazoDu}
                          className={`border-b border-outline-variant/20 ${i % 2 === 0 ? "bg-surface-container/40" : ""}`}
                        >
                          <td className="px-3 py-1.5 font-label">{d.prazoDu}</td>
                          <td className="px-3 py-1.5 text-right">{fmtPct(d.taxa * 100)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* NTN-B Vertices */}
            {ntnbForDate.length > 0 && (
              <div>
                <h4 className="text-xs font-label text-on-surface-variant mb-2">
                  Vértices NTN-B
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/30 bg-surface-container">
                        <th className="text-left px-3 py-2 font-label text-on-surface-variant">
                          Prazo (DU)
                        </th>
                        <th className="text-right px-3 py-2 font-label text-on-surface-variant">
                          Taxa (%)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ntnbForDate.map((d, i) => (
                        <tr
                          key={d.prazoDu}
                          className={`border-b border-outline-variant/20 ${i % 2 === 0 ? "bg-surface-container/40" : ""}`}
                        >
                          <td className="px-3 py-1.5 font-label">{d.prazoDu}</td>
                          <td className="px-3 py-1.5 text-right">{fmtPct(d.taxa * 100)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Dólar Futuro */}
            {dolFutForDate.length > 0 && (
              <div>
                <h4 className="text-xs font-label text-on-surface-variant mb-2">
                  Dólar Futuro
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/30 bg-surface-container">
                        <th className="text-left px-3 py-2 font-label text-on-surface-variant">
                          Prazo (DU)
                        </th>
                        <th className="text-right px-3 py-2 font-label text-on-surface-variant">
                          DC
                        </th>
                        <th className="text-right px-3 py-2 font-label text-on-surface-variant">
                          Cotação (R$/US$)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dolFutForDate.map((d, i) => (
                        <tr
                          key={d.prazoDu}
                          className={`border-b border-outline-variant/20 ${i % 2 === 0 ? "bg-surface-container/40" : ""}`}
                        >
                          <td className="px-3 py-1.5 font-label">{d.prazoDu}</td>
                          <td className="px-3 py-1.5 text-right">{d.dc}</td>
                          <td className="px-3 py-1.5 text-right">{fmtNum(d.cotacao)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </details>
      </section>

      {/* =================================================================
          SECTION 6.2 — Automatic Curve Construction
          ================================================================= */}
      <section>
        <h2 className="font-headline text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">show_chart</span>
          6.2 — Construção Automática das Curvas
        </h2>

        {/* 2x2 chart grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Chart 1 — Curva Nominal DI */}
          <div className="glass-card rounded-xl p-4">
            {nominalChartData.length > 0 ? (
              <PlotlyChart
                className="h-[300px]"
                data={[
                  {
                    type: "scatter" as const,
                    mode: "lines+markers" as const,
                    x: nominalChartData.map((d) => d.anos),
                    y: nominalChartData.map((d) => d.taxa),
                    name: "DI Spot",
                    line: { color: COLOR_NOMINAL, width: 2 },
                    marker: { color: COLOR_NOMINAL, size: 6 },
                    hovertemplate: "Prazo: %{x:.1f}A<br>Taxa: %{y:.2f}%<extra></extra>",
                  },
                ]}
                layout={{
                  ...PLOTLY_LAYOUT,
                  title: { text: "Curva Nominal DI", font: { color: "#aaabb0", size: 14 } },
                  xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: "Prazo (anos)" } },
                  yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "Taxa (% a.a.)" }, ticksuffix: "%" },
                  shapes: selicMetaValue != null
                    ? [
                        {
                          type: "line",
                          x0: 0,
                          x1: nominalChartData[nominalChartData.length - 1]?.anos ?? 10,
                          y0: selicMetaValue,
                          y1: selicMetaValue,
                          line: { color: "#888", width: 1.5, dash: "dash" },
                        },
                      ]
                    : [],
                  annotations: selicMetaValue != null
                    ? [
                        {
                          x: nominalChartData[nominalChartData.length - 1]?.anos ?? 10,
                          y: selicMetaValue,
                          text: `SELIC: ${selicMetaValue.toFixed(1)}%`,
                          showarrow: false,
                          font: { size: 10, color: "#888" },
                          yshift: 12,
                        },
                      ]
                    : [],
                  showlegend: false,
                  margin: { l: 55, r: 20, t: 45, b: 45 },
                }}
                config={PLOTLY_CONFIG}
              />
            ) : (
              <p className="text-sm text-on-surface-variant text-center py-8">
                Sem dados DI para esta data.
              </p>
            )}
          </div>

          {/* Chart 2 — Curva Real NTN-B */}
          <div className="glass-card rounded-xl p-4">
            {realChartData.length > 0 ? (
              <PlotlyChart
                className="h-[300px]"
                data={[
                  {
                    type: "scatter" as const,
                    mode: "lines+markers" as const,
                    x: realChartData.map((d) => d.anos),
                    y: realChartData.map((d) => d.taxa),
                    name: "NTN-B",
                    line: { color: COLOR_REAL, width: 2 },
                    marker: { color: COLOR_REAL, size: 6 },
                    hovertemplate: "Prazo: %{x:.1f}A<br>Taxa: %{y:.2f}%<extra></extra>",
                  },
                ]}
                layout={{
                  ...PLOTLY_LAYOUT,
                  title: { text: "Curva Real NTN-B", font: { color: "#aaabb0", size: 14 } },
                  xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: "Prazo (anos)" } },
                  yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "Taxa (% a.a.)" }, ticksuffix: "%" },
                  showlegend: false,
                  margin: { l: 55, r: 20, t: 45, b: 45 },
                }}
                config={PLOTLY_CONFIG}
              />
            ) : (
              <p className="text-sm text-on-surface-variant text-center py-8">
                Sem dados NTN-B para esta data.
              </p>
            )}
          </div>

          {/* Chart 3 — Inflação Implícita */}
          <div className="glass-card rounded-xl p-4">
            {breakevenChartData.length > 0 ? (
              <PlotlyChart
                className="h-[300px]"
                data={[
                  {
                    type: "scatter" as const,
                    mode: "lines+markers" as const,
                    x: breakevenChartData.map((d) => d.anos),
                    y: breakevenChartData.map((d) => d.taxa),
                    name: "Breakeven",
                    line: { color: COLOR_BREAKEVEN, width: 2 },
                    marker: { color: COLOR_BREAKEVEN, size: 6 },
                    hovertemplate: "Prazo: %{x:.1f}A<br>Breakeven: %{y:.2f}%<extra></extra>",
                  },
                ]}
                layout={{
                  ...PLOTLY_LAYOUT,
                  title: { text: "Inflação Implícita (Breakeven)", font: { color: "#aaabb0", size: 14 } },
                  xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: "Prazo (anos)" } },
                  yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "Breakeven (% a.a.)" }, ticksuffix: "%" },
                  shapes: [
                    {
                      type: "line",
                      x0: 0,
                      x1: breakevenChartData[breakevenChartData.length - 1]?.anos ?? 10,
                      y0: META_INFLACAO,
                      y1: META_INFLACAO,
                      line: { color: "#888", width: 1.5, dash: "dash" },
                    },
                  ],
                  annotations: [
                    {
                      x: breakevenChartData[breakevenChartData.length - 1]?.anos ?? 10,
                      y: META_INFLACAO,
                      text: `Meta: ${META_INFLACAO}%`,
                      showarrow: false,
                      font: { size: 10, color: "#888" },
                      yshift: 12,
                    },
                  ],
                  showlegend: false,
                  margin: { l: 55, r: 20, t: 45, b: 45 },
                }}
                config={PLOTLY_CONFIG}
              />
            ) : (
              <p className="text-sm text-on-surface-variant text-center py-8">
                Sem dados de breakeven para esta data (requer vértices DI e NTN-B coincidentes).
              </p>
            )}
          </div>

          {/* Chart 4 — Forwards Nominais */}
          <div className="glass-card rounded-xl p-4">
            {forwards.length > 0 ? (
              <PlotlyChart
                className="h-[300px]"
                data={[
                  // Forward step segments
                  ...forwards.map((f, idx) => ({
                    type: "scatter" as const,
                    mode: "lines" as const,
                    x: [f.deDu / 252, f.ateDu / 252, null] as (number | null)[],
                    y: [f.forwardAa * 100, f.forwardAa * 100, null] as (number | null)[],
                    line: { color: COLOR_FORWARD, width: 3 },
                    fill: "tozeroy" as const,
                    fillcolor: "rgba(85,85,85,0.1)",
                    showlegend: idx === 0,
                    name: "Forward",
                    hovertemplate: `${(f.deDu / 252).toFixed(1)}A→${(f.ateDu / 252).toFixed(1)}A<br>Forward: %{y:.2f}%<extra></extra>`,
                  })),
                  // Spot curve reference
                  {
                    type: "scatter" as const,
                    mode: "lines" as const,
                    x: nominalChartData.map((d) => d.anos),
                    y: nominalChartData.map((d) => d.taxa),
                    name: "Spot",
                    line: { color: COLOR_NOMINAL, width: 1.5, dash: "dot" },
                    hovertemplate: "Prazo: %{x:.1f}A<br>Spot: %{y:.2f}%<extra></extra>",
                  },
                ]}
                layout={{
                  ...PLOTLY_LAYOUT,
                  title: { text: "Forwards Nominais", font: { color: "#aaabb0", size: 14 } },
                  xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: "Prazo (anos)" } },
                  yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "Taxa (% a.a.)" }, ticksuffix: "%" },
                  showlegend: true,
                  legend: { ...PLOTLY_LAYOUT.legend, x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
                  margin: { l: 55, r: 20, t: 45, b: 45 },
                }}
                config={PLOTLY_CONFIG}
              />
            ) : (
              <p className="text-sm text-on-surface-variant text-center py-8">
                Sem dados para calcular forwards.
              </p>
            )}
          </div>
        </div>

        {/* Separate Cupom Cambial chart */}
        <div className="glass-card rounded-xl p-4 mb-4">
          {cupomChartData.length > 0 ? (
            <PlotlyChart
              className="h-[300px]"
              data={[
                {
                  type: "scatter" as const,
                  mode: "lines+markers" as const,
                  x: cupomChartData.map((d) => d.meses),
                  y: cupomChartData.map((d) => d.taxa),
                  name: "Cupom Cambial",
                  line: { color: COLOR_CUPOM, width: 2 },
                  marker: { color: COLOR_CUPOM, size: 6 },
                  hovertemplate: "Prazo: %{x:.0f}M<br>Cupom: %{y:.2f}%<extra></extra>",
                },
              ]}
              layout={{
                ...PLOTLY_LAYOUT,
                title: { text: "Cupom Cambial Implícito", font: { color: "#aaabb0", size: 14 } },
                xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: "Prazo (meses)" } },
                yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "Cupom (% a.a.)" }, ticksuffix: "%" },
                shapes: [
                  {
                    type: "line",
                    x0: 0,
                    x1: cupomChartData[cupomChartData.length - 1]?.meses ?? 24,
                    y0: SOFR_REF,
                    y1: SOFR_REF,
                    line: { color: "#888", width: 1.5, dash: "dash" },
                  },
                ],
                annotations: [
                  {
                    x: cupomChartData[cupomChartData.length - 1]?.meses ?? 24,
                    y: SOFR_REF,
                    text: `SOFR: ${SOFR_REF.toFixed(1)}%`,
                    showarrow: false,
                    font: { size: 10, color: "#888" },
                    yshift: 12,
                  },
                ],
                showlegend: false,
                margin: { l: 55, r: 20, t: 45, b: 45 },
              }}
              config={PLOTLY_CONFIG}
            />
          ) : (
            <p className="text-sm text-on-surface-variant text-center py-8">
              Sem dados para calcular cupom cambial (requer DI, dólar futuro e PTAX coincidentes).
            </p>
          )}
        </div>

        {/* Consolidated table */}
        {consolidatedRows.length > 0 && (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-outline-variant/30">
              <h3 className="font-headline font-bold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">grid_on</span>
                Tabela Consolidada
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container">
                    <th className="text-left px-4 py-3 font-label text-on-surface-variant">
                      Prazo (anos)
                    </th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                      DI Spot (%)
                    </th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                      NTN-B (%)
                    </th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                      Breakeven (%)
                    </th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                      Forward (%)
                    </th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                      Cupom (%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedRows.map((row, i) => (
                    <tr
                      key={row.prazoDu}
                      className={`border-b border-outline-variant/20 ${i % 2 === 0 ? "bg-surface-container/40" : ""}`}
                    >
                      <td className="px-4 py-2 font-label">{row.prazoAnos}</td>
                      <td
                        className="px-4 py-2 text-right"
                        style={{ color: row.diSpot != null ? COLOR_NOMINAL : undefined }}
                      >
                        {row.diSpot != null ? fmtPct(row.diSpot) : "—"}
                      </td>
                      <td
                        className="px-4 py-2 text-right"
                        style={{ color: row.ntnb != null ? COLOR_REAL : undefined }}
                      >
                        {row.ntnb != null ? fmtPct(row.ntnb) : "—"}
                      </td>
                      <td
                        className="px-4 py-2 text-right"
                        style={{ color: row.breakeven != null ? COLOR_BREAKEVEN : undefined }}
                      >
                        {row.breakeven != null ? fmtPct(row.breakeven) : "—"}
                      </td>
                      <td
                        className="px-4 py-2 text-right"
                        style={{ color: row.forward != null ? COLOR_FORWARD : undefined }}
                      >
                        {row.forward != null ? fmtPct(row.forward) : "—"}
                      </td>
                      <td
                        className="px-4 py-2 text-right"
                        style={{ color: row.cupom != null ? COLOR_CUPOM : undefined }}
                      >
                        {row.cupom != null ? fmtPct(row.cupom) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* =================================================================
          SECTION 6.3 — Diagnostic
          ================================================================= */}
      <section>
        <h2 className="font-headline text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">psychology</span>
          6.3 — Diagnóstico Automático
        </h2>

        {diagnostico ? (
          <div className="space-y-3">
            {diagnostico.curva && (
              <div className="glass-card rounded-xl p-4 border-l-4 border-[#2E75B6]">
                <p className="text-sm text-on-surface-variant">{renderDiagText(diagnostico.curva)}</p>
              </div>
            )}
            {diagnostico.juros && (
              <div className="glass-card rounded-xl p-4 border-l-4 border-[#C55A11]">
                <p className="text-sm text-on-surface-variant">{renderDiagText(diagnostico.juros)}</p>
              </div>
            )}
            {diagnostico.inflacao && (
              <div className="glass-card rounded-xl p-4 border-l-4 border-[#8B5CF6]">
                <p className="text-sm text-on-surface-variant">
                  {renderDiagText(diagnostico.inflacao)}
                </p>
              </div>
            )}
            {diagnostico.juroReal && (
              <div className="glass-card rounded-xl p-4 border-l-4 border-[#2E8B57]">
                <p className="text-sm text-on-surface-variant">
                  {renderDiagText(diagnostico.juroReal)}
                </p>
              </div>
            )}
            {diagnostico.cupom && (
              <div className="glass-card rounded-xl p-4 border-l-4 border-[#059669]">
                <p className="text-sm text-on-surface-variant">{renderDiagText(diagnostico.cupom)}</p>
              </div>
            )}
            <div className="glass-card rounded-xl p-4 border-l-4 border-primary">
              <p className="text-sm text-on-surface-variant">
                {renderDiagText(diagnostico.sintese)}
              </p>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-sm text-on-surface-variant">
              Sem dados suficientes para gerar diagnóstico.
            </p>
          </div>
        )}
      </section>

      {/* =================================================================
          SECTION 6.4 — Temporal Comparison
          ================================================================= */}
      <section>
        <h2 className="font-headline text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">compare_arrows</span>
          6.4 — Comparação Temporal
        </h2>

        {hasMultipleDates ? (
          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-on-surface-variant">
              Selecione duas datas para comparar a evolução das curvas. Funcionalidade disponível com
              as {availableDates.length} datas no dataset.
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-5 border-l-4 border-primary/50">
            <p className="text-sm text-on-surface-variant">
              Comparação temporal ficará disponível quando houver múltiplas datas nos datasets de
              curvas DI e NTN-B.
            </p>
          </div>
        )}
      </section>

      {/* =================================================================
          SECTION 6.5 — Reflection Questions
          ================================================================= */}
      <section>
        <h2 className="font-headline text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">quiz</span>
          6.5 — Questões para Reflexão
        </h2>

        <div className="space-y-3">
          {REFLECTION_QUESTIONS.map((question, idx) => (
            <details key={idx} className="glass-card rounded-xl">
              <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
                <span className="material-symbols-outlined text-primary text-base">
                  help_outline
                </span>
                Questão {idx + 1}
              </summary>
              <div className="px-5 pb-5">
                <p className="text-sm text-on-surface-variant leading-relaxed">{question}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
