"use client";

import { useState, useEffect, useMemo } from "react";
import {
  loadSelicMeta,
  loadIpca,
  loadCambio,
  loadCds,
  loadFocus,
  calcIpca12m,
  META_INFLACAO,
} from "@/lib/data";
import type { RateDataPoint, FocusDataPoint } from "@/lib/data";
import { fmtPct, fmtNum } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const PERIOD_OPTIONS = [
  { label: "1A", days: 365 },
  { label: "3A", days: 1095 },
  { label: "5A", days: 1825 },
  { label: "9A", days: 3285 },
];

const FOCUS_VARS: { label: string; key: string }[] = [
  { label: "IPCA (ano corrente)", key: "IPCA_corrente" },
  { label: "IPCA (ano seguinte)", key: "IPCA_seguinte" },
  { label: "SELIC (ano corrente)", key: "SELIC_corrente" },
  { label: "SELIC (ano seguinte)", key: "SELIC_seguinte" },
  { label: "PIB (ano corrente)", key: "PIB_corrente" },
  { label: "Câmbio (ano corrente)", key: "Cambio_corrente" },
];

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
}

function MetricCard({ label, value, delta, deltaPositive }: MetricCardProps) {
  return (
    <div className="glass-card rounded-lg p-4 flex flex-col gap-1">
      <span className="text-xs font-label text-on-surface-variant">{label}</span>
      <span className="text-xl font-headline font-bold text-primary">{value}</span>
      {delta !== undefined && (
        <span
          className={`text-xs font-label ${
            deltaPositive ? "text-[#2E8B57]" : "text-[#CC3333]"
          }`}
        >
          {delta}
        </span>
      )}
    </div>
  );
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function subtractMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export function TabPainelMacro() {
  const [selicMeta, setSelicMeta] = useState<RateDataPoint[]>([]);
  const [ipca12m, setIpca12m] = useState<RateDataPoint[]>([]);
  const [cambio, setCambio] = useState<RateDataPoint[]>([]);
  const [cds, setCds] = useState<RateDataPoint[]>([]);
  const [focus, setFocus] = useState<FocusDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [periodDays, setPeriodDays] = useState(3285); // default 9A
  const [focusVar, setFocusVar] = useState("IPCA_corrente");
  const [focusMonths, setFocusMonths] = useState(12);

  useEffect(() => {
    Promise.all([loadSelicMeta(), loadIpca(), loadCambio(), loadCds(), loadFocus()])
      .then(([selic, ipca, cam, c, foc]) => {
        setSelicMeta(selic);
        setIpca12m(calcIpca12m(ipca));
        setCambio(cam);
        setCds(c);
        setFocus(foc);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // --- latest values for indicator cards ---
  const latestSelic = useMemo(() => {
    if (selicMeta.length < 2) return null;
    const last = selicMeta[selicMeta.length - 1];
    const prev = selicMeta[selicMeta.length - 2];
    return { value: last.valor, delta: last.valor - prev.valor };
  }, [selicMeta]);

  const latestIpca = useMemo(() => {
    if (ipca12m.length < 2) return null;
    const last = ipca12m[ipca12m.length - 1];
    const prev = ipca12m[ipca12m.length - 2];
    return { value: last.valor, delta: last.valor - prev.valor };
  }, [ipca12m]);

  const latestCambio = useMemo(() => {
    if (cambio.length < 2) return null;
    const last = cambio[cambio.length - 1];
    const prev = cambio[cambio.length - 2];
    return { value: last.valor, delta: last.valor - prev.valor };
  }, [cambio]);

  const latestCds = useMemo(() => {
    if (cds.length < 2) return null;
    const last = cds[cds.length - 1];
    const prev = cds[cds.length - 2];
    return { value: last.valor, delta: last.valor - prev.valor };
  }, [cds]);

  // --- period filter cutoff ---
  const maxDate = useMemo(() => {
    const dates = [
      ...selicMeta.map((r) => r.data),
      ...ipca12m.map((r) => r.data),
      ...cambio.map((r) => r.data),
      ...cds.map((r) => r.data),
    ].sort();
    return dates[dates.length - 1] ?? "";
  }, [selicMeta, ipca12m, cambio, cds]);

  const cutoffDate = useMemo(
    () => (maxDate ? subtractDays(maxDate, periodDays) : ""),
    [maxDate, periodDays]
  );

  const filteredSelic = useMemo(
    () => selicMeta.filter((r) => r.data >= cutoffDate),
    [selicMeta, cutoffDate]
  );
  const filteredIpca = useMemo(
    () => ipca12m.filter((r) => r.data >= cutoffDate),
    [ipca12m, cutoffDate]
  );
  const filteredCambio = useMemo(
    () => cambio.filter((r) => r.data >= cutoffDate),
    [cambio, cutoffDate]
  );
  const filteredCds = useMemo(
    () => cds.filter((r) => r.data >= cutoffDate),
    [cds, cutoffDate]
  );

  // --- Focus filter ---
  const focusMaxDate = useMemo(() => {
    const dates = focus.map((r) => r.dataColeta).sort();
    return dates[dates.length - 1] ?? "";
  }, [focus]);

  const focusCutoff = useMemo(
    () => (focusMaxDate ? subtractMonths(focusMaxDate, focusMonths) : ""),
    [focusMaxDate, focusMonths]
  );

  const filteredFocus = useMemo(
    () =>
      focus.filter(
        (r) => r.variavel === focusVar && r.dataColeta >= focusCutoff
      ),
    [focus, focusVar, focusCutoff]
  );

  // --- mini chart helpers ---
  function miniLayout(title: string, yTitle: string, extraShapes?: object[]) {
    return {
      ...PLOTLY_LAYOUT,
      title: { text: title, font: { size: 13, color: "#aaabb0" } },
      margin: { l: 50, r: 20, t: 40, b: 40 },
      height: 300,
      xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: "" } },
      yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: yTitle } },
      showlegend: false,
      shapes: extraShapes ?? [],
    };
  }

  const ipcaShapes = [
    {
      type: "line",
      x0: filteredIpca[0]?.data ?? "",
      x1: filteredIpca[filteredIpca.length - 1]?.data ?? "",
      y0: META_INFLACAO,
      y1: META_INFLACAO,
      line: { color: "rgba(170,170,170,0.5)", width: 1.5, dash: "dash" },
    },
  ];

  if (loading) {
    return (
      <div className="text-on-surface-variant text-sm py-8">Carregando dados...</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section 1 — Key Indicators */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">monitoring</span>
          Indicadores-Chave
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          {latestSelic ? (
            <MetricCard
              label="SELIC Meta (% a.a.)"
              value={`${fmtPct(latestSelic.value, 2)}`}
              delta={`${latestSelic.delta >= 0 ? "+" : ""}${fmtNum(latestSelic.delta)} p.p.`}
              deltaPositive={latestSelic.delta <= 0}
            />
          ) : (
            <MetricCard label="SELIC Meta (% a.a.)" value="—" />
          )}
          {latestIpca ? (
            <MetricCard
              label="IPCA 12M (% a.a.)"
              value={`${fmtPct(latestIpca.value, 2)}`}
              delta={`${latestIpca.delta >= 0 ? "+" : ""}${fmtNum(latestIpca.delta)} p.p.`}
              deltaPositive={latestIpca.delta <= 0}
            />
          ) : (
            <MetricCard label="IPCA 12M (% a.a.)" value="—" />
          )}
          {latestCambio ? (
            <MetricCard
              label="Câmbio R$/USD"
              value={`R$ ${latestCambio.value.toFixed(2).replace(".", ",")}`}
              delta={`${latestCambio.delta >= 0 ? "+" : ""}${latestCambio.delta.toFixed(2).replace(".", ",")}`}
              deltaPositive={latestCambio.delta <= 0}
            />
          ) : (
            <MetricCard label="Câmbio R$/USD" value="—" />
          )}
          {latestCds ? (
            <MetricCard
              label="CDS Brasil (bps)"
              value={`${fmtNum(latestCds.value)} bps`}
              delta={`${latestCds.delta >= 0 ? "+" : ""}${fmtNum(latestCds.delta)} bps`}
              deltaPositive={latestCds.delta <= 0}
            />
          ) : (
            <MetricCard label="CDS Brasil (bps)" value="—" />
          )}
        </div>
      </section>

      {/* Section 2 — Period Selector */}
      <section className="space-y-3">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">calendar_month</span>
          Período de Análise
        </h2>
        <div className="flex gap-2 flex-wrap">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setPeriodDays(opt.days)}
              className={`px-4 py-2 rounded-lg text-sm font-headline font-bold transition-colors cursor-pointer ${
                periodDays === opt.days
                  ? "bg-primary text-on-primary-container"
                  : "glass-card hover:border-primary/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Section 3 — Mini Charts 2x2 */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">grid_view</span>
          Evolução Histórica
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* IPCA 12M */}
          <div className="glass-card rounded-lg overflow-hidden">
            {filteredIpca.length > 0 ? (
              <PlotlyChart
                data={[
                  {
                    x: filteredIpca.map((r) => r.data),
                    y: filteredIpca.map((r) => r.valor),
                    type: "scatter",
                    mode: "lines",
                    line: { color: "#C55A11", width: 2 },
                    hovertemplate: "%{x|%d/%m/%Y}: <b>%{y:.2f}%</b><extra>IPCA 12M</extra>",
                  },
                ]}
                layout={{
                  ...miniLayout("IPCA 12M (% a.a.)", "% a.a.", ipcaShapes),
                  yaxis: {
                    ...PLOTLY_LAYOUT.yaxis,
                    title: { text: "% a.a." },
                    ticksuffix: "%",
                  },
                }}
                config={PLOTLY_CONFIG}
                className="h-[300px]"
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-on-surface-variant text-sm">
                Sem dados para o período
              </div>
            )}
          </div>

          {/* Câmbio */}
          <div className="glass-card rounded-lg overflow-hidden">
            {filteredCambio.length > 0 ? (
              <PlotlyChart
                data={[
                  {
                    x: filteredCambio.map((r) => r.data),
                    y: filteredCambio.map((r) => r.valor),
                    type: "scatter",
                    mode: "lines",
                    line: { color: "#2E75B6", width: 2 },
                    hovertemplate: "%{x|%d/%m/%Y}: <b>R$ %{y:.2f}</b><extra>Câmbio</extra>",
                  },
                ]}
                layout={{
                  ...miniLayout("Câmbio R$/USD", "R$/USD"),
                  yaxis: {
                    ...PLOTLY_LAYOUT.yaxis,
                    title: { text: "R$/USD" },
                    tickprefix: "R$ ",
                  },
                }}
                config={PLOTLY_CONFIG}
                className="h-[300px]"
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-on-surface-variant text-sm">
                Sem dados para o período
              </div>
            )}
          </div>

          {/* CDS */}
          <div className="glass-card rounded-lg overflow-hidden">
            {filteredCds.length > 0 ? (
              <PlotlyChart
                data={[
                  {
                    x: filteredCds.map((r) => r.data),
                    y: filteredCds.map((r) => r.valor),
                    type: "scatter",
                    mode: "lines",
                    line: { color: "#CC3333", width: 2 },
                    hovertemplate: "%{x|%d/%m/%Y}: <b>%{y:.0f} bps</b><extra>CDS</extra>",
                  },
                ]}
                layout={{
                  ...miniLayout("CDS Brasil (bps)", "bps"),
                  yaxis: {
                    ...PLOTLY_LAYOUT.yaxis,
                    title: { text: "bps" },
                  },
                }}
                config={PLOTLY_CONFIG}
                className="h-[300px]"
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-on-surface-variant text-sm">
                Sem dados para o período
              </div>
            )}
          </div>

          {/* SELIC Meta */}
          <div className="glass-card rounded-lg overflow-hidden">
            {filteredSelic.length > 0 ? (
              <PlotlyChart
                data={[
                  {
                    x: filteredSelic.map((r) => r.data),
                    y: filteredSelic.map((r) => r.valor),
                    type: "scatter",
                    mode: "lines",
                    line: { color: "#5B8AB5", width: 2 },
                    hovertemplate: "%{x|%d/%m/%Y}: <b>%{y:.2f}%</b><extra>SELIC Meta</extra>",
                  },
                ]}
                layout={{
                  ...miniLayout("SELIC Meta (% a.a.)", "% a.a."),
                  yaxis: {
                    ...PLOTLY_LAYOUT.yaxis,
                    title: { text: "% a.a." },
                    ticksuffix: "%",
                  },
                }}
                config={PLOTLY_CONFIG}
                className="h-[300px]"
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-on-surface-variant text-sm">
                Sem dados para o período
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 4 — Focus Expectations */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">query_stats</span>
          Expectativas Focus (BCB)
        </h2>

        <div className="glass-card rounded-lg p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Variável
              </label>
              <select
                value={focusVar}
                onChange={(e) => setFocusVar(e.target.value)}
                className={INPUT_CLASS}
              >
                {FOCUS_VARS.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Período de observação: {focusMonths}{" "}
                {focusMonths === 1 ? "mês" : "meses"}
              </label>
              <input
                type="range"
                min={3}
                max={24}
                step={1}
                value={focusMonths}
                onChange={(e) => setFocusMonths(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                <span>3 meses</span>
                <span>24 meses</span>
              </div>
            </div>
          </div>
        </div>

        {filteredFocus.length > 0 ? (
          <PlotlyChart
            data={[
              {
                x: filteredFocus.map((r) => r.dataColeta),
                y: filteredFocus.map((r) => r.mediana),
                type: "scatter",
                mode: "lines+markers",
                line: { color: "#2E75B6", width: 2 },
                marker: { size: 4, color: "#2E75B6" },
                hovertemplate:
                  "%{x|%d/%m/%Y}: <b>%{y:.2f}</b><extra>Mediana Focus</extra>",
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              title: {
                text: `Mediana Focus — ${
                  FOCUS_VARS.find((v) => v.key === focusVar)?.label ?? focusVar
                }`,
                font: { size: 13, color: "#aaabb0" },
              },
              margin: { l: 60, r: 30, t: 50, b: 50 },
              height: 340,
              xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: "" } },
              yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: "Mediana" } },
              showlegend: false,
            }}
            config={PLOTLY_CONFIG}
            className="h-[340px]"
          />
        ) : (
          <div className="glass-card rounded-lg p-4 border-l-4 border-outline-variant/30">
            <p className="text-sm text-on-surface-variant">
              {focus.length === 0
                ? "Dados Focus não disponíveis. Verifique o arquivo focus_expectativas.csv em public/data/."
                : "Sem dados disponíveis para esta variável e período."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
