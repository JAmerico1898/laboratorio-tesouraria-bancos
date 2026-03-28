"use client";

import { useState, useEffect, useMemo } from "react";
import { loadSelicMeta, loadSelicOver, loadCdiDiario, fatorCdiAcumulado } from "@/lib/data";
import type { RateDataPoint } from "@/lib/data";
import { fmtPct, fmtBrl, fmtNum } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

interface MetricCardProps {
  label: string;
  value: string;
  highlight?: boolean;
  sub?: string;
}

function MetricCard({ label, value, highlight, sub }: MetricCardProps) {
  return (
    <div
      className={`glass-card rounded-lg p-4 flex flex-col gap-1 ${
        highlight ? "border border-primary/40" : ""
      }`}
    >
      <span className="text-xs font-label text-on-surface-variant">{label}</span>
      <span
        className={`text-lg font-headline font-bold ${highlight ? "text-primary" : ""}`}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-on-surface-variant">{sub}</span>}
    </div>
  );
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function subtractDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days);
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / arr.length);
}

export function MercadoMonetarioContent() {
  // ----- data state -----
  const [selicMeta, setSelicMeta] = useState<RateDataPoint[]>([]);
  const [selicOver, setSelicOver] = useState<RateDataPoint[]>([]);
  const [cdiDiario, setCdiDiario] = useState<RateDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // ----- filter state -----
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [showSelicMeta, setShowSelicMeta] = useState(true);
  const [showSelicOver, setShowSelicOver] = useState(true);
  const [showCdi, setShowCdi] = useState(true);

  // ----- CDI calculator state -----
  const [cdiStart, setCdiStart] = useState("");
  const [cdiEnd, setCdiEnd] = useState("");
  const [cdiAmount, setCdiAmount] = useState(1000000);
  const [cdiPct, setCdiPct] = useState(100);

  // ----- load data -----
  useEffect(() => {
    Promise.all([loadSelicMeta(), loadSelicOver(), loadCdiDiario()])
      .then(([meta, over, cdi]) => {
        setSelicMeta(meta);
        setSelicOver(over);
        setCdiDiario(cdi);

        // derive max date from CDI (usually has most data points)
        const allDates = [
          ...meta.map((r) => r.data),
          ...over.map((r) => r.data),
          ...cdi.map((r) => r.data),
        ].sort();
        const maxDate = allDates[allDates.length - 1] ?? "";

        if (maxDate) {
          setDateEnd(maxDate);
          setDateStart(subtractDays(maxDate, 3285)); // ~9 years
          setCdiEnd(maxDate);
          setCdiStart(subtractDays(maxDate, 180));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ----- filtered historical data -----
  const filteredSelicMeta = useMemo(
    () => selicMeta.filter((r) => r.data >= dateStart && r.data <= dateEnd),
    [selicMeta, dateStart, dateEnd]
  );
  const filteredSelicOver = useMemo(
    () => selicOver.filter((r) => r.data >= dateStart && r.data <= dateEnd),
    [selicOver, dateStart, dateEnd]
  );
  const filteredCdi = useMemo(
    () => cdiDiario.filter((r) => r.data >= dateStart && r.data <= dateEnd),
    [cdiDiario, dateStart, dateEnd]
  );

  // ----- chart traces -----
  const historicalTraces = useMemo(() => {
    const traces: object[] = [];
    if (showSelicMeta && filteredSelicMeta.length > 0) {
      traces.push({
        x: filteredSelicMeta.map((r) => r.data),
        y: filteredSelicMeta.map((r) => r.valor),
        type: "scatter",
        mode: "lines",
        name: "SELIC Meta",
        line: { color: "#1B3A5C", width: 2, dash: "solid" },
        hovertemplate: "%{x|%d/%m/%Y}: <b>%{y:.2f}%</b><extra>SELIC Meta</extra>",
      });
    }
    if (showSelicOver && filteredSelicOver.length > 0) {
      traces.push({
        x: filteredSelicOver.map((r) => r.data),
        y: filteredSelicOver.map((r) => r.valor),
        type: "scatter",
        mode: "lines",
        name: "SELIC Over",
        line: { color: "#2E75B6", width: 2, dash: "solid" },
        hovertemplate: "%{x|%d/%m/%Y}: <b>%{y:.2f}%</b><extra>SELIC Over</extra>",
      });
    }
    if (showCdi && filteredCdi.length > 0) {
      traces.push({
        x: filteredCdi.map((r) => r.data),
        y: filteredCdi.map((r) => r.valor),
        type: "scatter",
        mode: "lines",
        name: "CDI",
        line: { color: "#C55A11", width: 2, dash: "dash" },
        hovertemplate: "%{x|%d/%m/%Y}: <b>%{y:.2f}%</b><extra>CDI</extra>",
      });
    }
    return traces;
  }, [showSelicMeta, showSelicOver, showCdi, filteredSelicMeta, filteredSelicOver, filteredCdi]);

  // ----- spread chart (SELIC Over - CDI) -----
  const spreadData = useMemo(() => {
    if (filteredSelicOver.length === 0 || filteredCdi.length === 0) return { x: [], y: [] };
    const cdiMap = new Map<string, number>(filteredCdi.map((r) => [r.data, r.valor]));
    const xs: string[] = [];
    const ys: number[] = [];
    for (const pt of filteredSelicOver) {
      const cdiVal = cdiMap.get(pt.data);
      if (cdiVal !== undefined) {
        xs.push(pt.data);
        ys.push(pt.valor - cdiVal);
      }
    }
    return { x: xs, y: ys };
  }, [filteredSelicOver, filteredCdi]);

  const spreadTraces = useMemo(() => {
    if (spreadData.x.length === 0) return [];
    return [
      {
        x: spreadData.x,
        y: spreadData.y,
        type: "scatter",
        mode: "lines",
        name: "Spread",
        fill: "tozeroy",
        fillcolor: "rgba(46,117,182,0.15)",
        line: { color: "#888888", width: 1.5, dash: "solid" },
        hovertemplate: "%{x|%d/%m/%Y}: <b>%{y:.4f}%</b><extra>SELIC Over − CDI</extra>",
      },
    ];
  }, [spreadData]);

  // ----- statistics -----
  const statistics = useMemo(() => {
    const rows: { serie: string; values: number[] }[] = [];
    if (showSelicMeta && filteredSelicMeta.length > 0)
      rows.push({ serie: "SELIC Meta", values: filteredSelicMeta.map((r) => r.valor) });
    if (showSelicOver && filteredSelicOver.length > 0)
      rows.push({ serie: "SELIC Over", values: filteredSelicOver.map((r) => r.valor) });
    if (showCdi && filteredCdi.length > 0)
      rows.push({ serie: "CDI", values: filteredCdi.map((r) => r.valor) });
    return rows.map((r) => ({
      serie: r.serie,
      media: mean(r.values),
      min: Math.min(...r.values),
      max: Math.max(...r.values),
      desvio: stddev(r.values),
      n: r.values.length,
    }));
  }, [showSelicMeta, showSelicOver, showCdi, filteredSelicMeta, filteredSelicOver, filteredCdi]);

  // ----- CDI calculator -----
  const cdiCalcResults = useMemo(() => {
    if (cdiDiario.length === 0 || !cdiStart || !cdiEnd || cdiStart >= cdiEnd) return null;
    const slice = cdiDiario.filter((r) => r.data >= cdiStart && r.data <= cdiEnd);
    if (slice.length === 0) return null;

    const fator100 = fatorCdiAcumulado(slice, 100);
    const fatorPct = fatorCdiAcumulado(slice, cdiPct);

    const f100 = fator100.length > 0 ? fator100[fator100.length - 1].fator : 1;
    const fpct = fatorPct.length > 0 ? fatorPct[fatorPct.length - 1].fator : 1;

    const du = slice.length;
    const retorno = (fpct - 1) * cdiAmount;
    const taxaPeriodo = (fpct - 1) * 100;
    const taxaAnual = (Math.pow(fpct, 252 / du) - 1) * 100;

    // Evolution data
    const evo100x = fator100.map((p) => p.data);
    const evo100y = fator100.map((p) => p.fator);
    const evoPctx = fatorPct.map((p) => p.data);
    const evoPcty = fatorPct.map((p) => p.fator);

    return {
      f100,
      fpct,
      retorno,
      taxaPeriodo,
      taxaAnual,
      du,
      evo100x,
      evo100y,
      evoPctx,
      evoPcty,
    };
  }, [cdiDiario, cdiStart, cdiEnd, cdiPct, cdiAmount]);

  const cdiEvoTraces = useMemo(() => {
    if (!cdiCalcResults) return [];
    const traces: object[] = [
      {
        x: cdiCalcResults.evo100x,
        y: cdiCalcResults.evo100y,
        type: "scatter",
        mode: "lines",
        name: "100% CDI",
        line: { color: "#2E75B6", width: 2, dash: "solid" },
        hovertemplate: "%{x|%d/%m/%Y}: <b>%{y:.6f}</b><extra>100% CDI</extra>",
      },
    ];
    if (cdiPct !== 100) {
      traces.push({
        x: cdiCalcResults.evoPctx,
        y: cdiCalcResults.evoPcty,
        type: "scatter",
        mode: "lines",
        name: `${cdiPct}% CDI`,
        line: { color: "#C55A11", width: 2, dash: "dash" },
        hovertemplate: `%{x|%d/%m/%Y}: <b>%{y:.6f}</b><extra>${cdiPct}% CDI</extra>`,
      });
    }
    return traces;
  }, [cdiCalcResults, cdiPct]);

  // ----- render -----
  if (loading) {
    return (
      <main className="mesh-bg pt-8 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-on-surface-variant text-sm">Carregando dados...</p>
        </div>
      </main>
    );
  }

  const noData = selicMeta.length === 0 && selicOver.length === 0 && cdiDiario.length === 0;

  return (
    <main className="mesh-bg pt-8 pb-20">
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
            💰 Mercado Monetário e Principais Taxas de Juros
          </h1>
          <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
            <p className="text-on-surface-variant text-sm">
              <strong>Pergunta gerencial:</strong> &ldquo;Qual a diferença entre SELIC Meta, SELIC
              Over e CDI? Como essas taxas se comportaram historicamente e qual seu impacto no custo
              de captação e na rentabilidade de operações pós-fixadas?&rdquo;
            </p>
          </div>
        </div>

        {/* Concept expander */}
        <details className="glass-card rounded-xl">
          <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
            <span className="material-symbols-outlined text-primary text-base">school</span>
            Conceitos: SELIC Meta, SELIC Over e CDI
          </summary>
          <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
            <div className="grid md:grid-cols-3 gap-4 mt-2">
              <div className="glass-card rounded-lg p-4 border-t-2 border-[#1B3A5C]">
                <h3 className="font-headline font-bold text-on-surface mb-2 text-[#1B3A5C]">
                  SELIC Meta
                </h3>
                <p>
                  Taxa definida pelo <strong className="text-on-surface">COPOM</strong> (Comitê de
                  Política Monetária do BCB) em reuniões a cada 45 dias. É o principal instrumento
                  de política monetária — sinaliza o custo do dinheiro para toda a economia. Vigora
                  por período determinado até a próxima decisão.
                </p>
              </div>
              <div className="glass-card rounded-lg p-4 border-t-2 border-[#2E75B6]">
                <h3 className="font-headline font-bold text-on-surface mb-2 text-[#2E75B6]">
                  SELIC Over
                </h3>
                <p>
                  Taxa efetiva das operações de overnight com lastro em títulos públicos federais,
                  registradas no SELIC (Sistema Especial de Liquidação e Custódia). É calculada e
                  divulgada pelo BCB diariamente. Flutua próxima à SELIC Meta — pequenos desvios
                  indicam condições de liquidez no sistema.
                </p>
              </div>
              <div className="glass-card rounded-lg p-4 border-t-2 border-[#C55A11]">
                <h3 className="font-headline font-bold text-on-surface mb-2 text-[#C55A11]">
                  CDI
                </h3>
                <p>
                  Certificado de Depósito Interbancário — taxa das operações de empréstimo de
                  curtíssimo prazo entre bancos, registradas na <strong className="text-on-surface">B3</strong>.
                  Benchmarks de praticamente todos os produtos de renda fixa privada no Brasil (CDB,
                  LCI, LCA, fundos DI). Historicamente &asymp; 0,01 p.p. abaixo da SELIC Over.
                </p>
              </div>
            </div>
            <div className="glass-card rounded-lg p-4 border-l-4 border-primary mt-2">
              <p>
                <strong className="text-on-surface">Hierarquia das taxas:</strong> SELIC Meta (política) &ge;
                SELIC Over (mercado interbancário garantido) &asymp; CDI (mercado interbancário
                privado). O spread SELIC Over − CDI costuma ser de 1–5 bps, refletindo o prêmio de
                risco soberano sobre o risco bancário.
              </p>
            </div>
          </div>
        </details>

        {noData && (
          <div className="glass-card rounded-lg p-4 border-l-4 border-[#CC3333]">
            <p className="text-sm text-on-surface-variant">
              Dados históricos não disponíveis. Verifique se os arquivos CSV estão presentes em{" "}
              <code>public/data/</code>.
            </p>
          </div>
        )}

        {/* Historical panel */}
        {!noData && (
          <section className="space-y-4">
            <h2 className="font-headline font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">timeline</span>
              Evolução Histórica das Taxas
            </h2>

            {/* Controls */}
            <div className="glass-card rounded-lg p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label text-on-surface-variant mb-1">
                    Data inicial
                  </label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-label text-on-surface-variant mb-1">
                    Data final
                  </label>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showSelicMeta}
                    onChange={(e) => setShowSelicMeta(e.target.checked)}
                    className="accent-[#1B3A5C]"
                  />
                  <span className="text-sm font-label" style={{ color: "#1B3A5C" }}>
                    SELIC Meta
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showSelicOver}
                    onChange={(e) => setShowSelicOver(e.target.checked)}
                    className="accent-[#2E75B6]"
                  />
                  <span className="text-sm font-label" style={{ color: "#2E75B6" }}>
                    SELIC Over
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCdi}
                    onChange={(e) => setShowCdi(e.target.checked)}
                    className="accent-[#C55A11]"
                  />
                  <span className="text-sm font-label" style={{ color: "#C55A11" }}>
                    CDI
                  </span>
                </label>
              </div>
            </div>

            {historicalTraces.length > 0 ? (
              <PlotlyChart
                data={historicalTraces as Parameters<typeof PlotlyChart>[0]["data"]}
                layout={{
                  ...PLOTLY_LAYOUT,
                  xaxis: {
                    ...PLOTLY_LAYOUT.xaxis,
                    title: { text: "" },
                  },
                  yaxis: {
                    ...PLOTLY_LAYOUT.yaxis,
                    title: { text: "% a.a." },
                    ticksuffix: "%",
                  },
                  hovermode: "x unified",
                  legend: {
                    ...PLOTLY_LAYOUT.legend,
                    orientation: "h",
                    y: -0.15,
                  },
                  height: 420,
                }}
                config={PLOTLY_CONFIG}
                className="h-[420px]"
              />
            ) : (
              <div className="glass-card rounded-lg p-6 text-center text-on-surface-variant text-sm">
                Selecione ao menos uma série para exibir o gráfico.
              </div>
            )}
          </section>
        )}

        {/* Spread chart */}
        {!noData && spreadTraces.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-headline font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">show_chart</span>
              Spread SELIC Over − CDI
            </h2>
            <p className="text-sm text-on-surface-variant">
              Diferença diária entre a SELIC Over e o CDI (em pontos percentuais). Valores acima de
              zero indicam que a taxa do mercado interbancário garantido (público) supera a taxa do
              mercado interbancário privado.
            </p>
            <PlotlyChart
              data={spreadTraces as Parameters<typeof PlotlyChart>[0]["data"]}
              layout={{
                ...PLOTLY_LAYOUT,
                xaxis: {
                  ...PLOTLY_LAYOUT.xaxis,
                  title: { text: "" },
                },
                yaxis: {
                  ...PLOTLY_LAYOUT.yaxis,
                  title: { text: "Spread (p.p.)" },
                  ticksuffix: "%",
                  zeroline: true,
                  zerolinecolor: "rgba(255,255,255,0.3)",
                },
                hovermode: "x unified",
                showlegend: false,
                height: 300,
              }}
              config={PLOTLY_CONFIG}
              className="h-[300px]"
            />
          </section>
        )}

        {/* Statistics table */}
        {!noData && statistics.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-headline font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">table_chart</span>
              Estatísticas do Período
            </h2>
            <div className="glass-card rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container">
                    <th className="text-left px-4 py-3 font-label text-on-surface-variant">
                      Série
                    </th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                      Média
                    </th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                      Mín.
                    </th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                      Máx.
                    </th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                      Desvio
                    </th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                      Obs.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.map((row, i) => (
                    <tr
                      key={row.serie}
                      className={`border-b border-outline-variant/20 ${
                        i % 2 === 0 ? "bg-surface-container/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-label font-bold">{row.serie}</td>
                      <td className="px-4 py-3 text-right">{fmtPct(row.media, 2)}</td>
                      <td className="px-4 py-3 text-right text-[#2E8B57]">
                        {fmtPct(row.min, 2)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#CC3333]">
                        {fmtPct(row.max, 2)}
                      </td>
                      <td className="px-4 py-3 text-right text-on-surface-variant">
                        {fmtPct(row.desvio, 2)}
                      </td>
                      <td className="px-4 py-3 text-right text-on-surface-variant font-label">
                        {fmtNum(row.n)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* CDI Calculator */}
        <section className="space-y-4">
          <h2 className="font-headline font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calculate</span>
            Calculadora CDI
          </h2>
          <p className="text-sm text-on-surface-variant">
            Simule o rendimento de uma aplicação pós-fixada em CDI para qualquer período e
            percentual.
          </p>

          <div className="glass-card rounded-lg p-5 space-y-4">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Data inicial
                </label>
                <input
                  type="date"
                  value={cdiStart}
                  onChange={(e) => setCdiStart(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Data final
                </label>
                <input
                  type="date"
                  value={cdiEnd}
                  onChange={(e) => setCdiEnd(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  Principal (R$)
                </label>
                <input
                  type="number"
                  value={cdiAmount}
                  onChange={(e) => setCdiAmount(Number(e.target.value))}
                  step={10000}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-label text-on-surface-variant mb-1">
                  % do CDI
                </label>
                <input
                  type="number"
                  value={cdiPct}
                  onChange={(e) => setCdiPct(Number(e.target.value))}
                  step={5}
                  min={0}
                  max={200}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>

          {cdiCalcResults ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <MetricCard
                  label="Fator 100% CDI"
                  value={cdiCalcResults.f100.toFixed(8).replace(".", ",")}
                  sub={`${cdiCalcResults.du} dias úteis`}
                />
                <MetricCard
                  label={`Fator ${cdiPct}% CDI`}
                  value={cdiCalcResults.fpct.toFixed(8).replace(".", ",")}
                  highlight
                />
                <MetricCard
                  label="Retorno (R$)"
                  value={fmtBrl(cdiCalcResults.retorno)}
                  highlight
                  sub={`sobre ${fmtBrl(cdiAmount)}`}
                />
                <MetricCard
                  label="Taxa do período"
                  value={fmtPct(cdiCalcResults.taxaPeriodo, 4)}
                />
                <MetricCard
                  label="Taxa anualizada"
                  value={fmtPct(cdiCalcResults.taxaAnual, 2)}
                  sub="DU/252"
                />
              </div>

              {cdiEvoTraces.length > 0 && (
                <PlotlyChart
                  data={cdiEvoTraces as Parameters<typeof PlotlyChart>[0]["data"]}
                  layout={{
                    ...PLOTLY_LAYOUT,
                    xaxis: {
                      ...PLOTLY_LAYOUT.xaxis,
                      title: { text: "" },
                    },
                    yaxis: {
                      ...PLOTLY_LAYOUT.yaxis,
                      title: { text: "Fator acumulado" },
                    },
                    hovermode: "x unified",
                    legend: {
                      ...PLOTLY_LAYOUT.legend,
                      orientation: "h",
                      y: -0.15,
                    },
                    height: 360,
                  }}
                  config={PLOTLY_CONFIG}
                  className="h-[360px]"
                />
              )}
            </div>
          ) : (
            <div className="glass-card rounded-lg p-4 border-l-4 border-outline-variant/30">
              <p className="text-sm text-on-surface-variant">
                {cdiDiario.length === 0
                  ? "Dados do CDI não disponíveis para o cálculo."
                  : "Selecione um período válido (data inicial anterior à data final) para calcular."}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
