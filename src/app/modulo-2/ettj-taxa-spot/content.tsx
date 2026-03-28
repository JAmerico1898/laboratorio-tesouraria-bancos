"use client";

import { useState, useMemo } from "react";
import ControlBar from "@/components/modulo-2/ettj/control-bar";
import YieldCurveChart from "@/components/modulo-2/ettj/yield-curve-chart";
import RateQuery from "@/components/modulo-2/ettj/rate-query";
import QualityMetricsPanel from "@/components/modulo-2/ettj/quality-metrics";
import FittedParams from "@/components/modulo-2/ettj/fitted-params";
import DataTable from "@/components/modulo-2/ettj/data-table";
import ResidualsTab from "@/components/modulo-2/ettj/residuals-tab";
import MethodEquation from "@/components/modulo-2/ettj/method-equation";
import DownloadTab from "@/components/modulo-2/ettj/download-tab";
import ComparisonChart from "@/components/modulo-2/ettj/comparison-chart";
import ComparisonStats from "@/components/modulo-2/ettj/comparison-stats";
import KeyMaturitiesTable from "@/components/modulo-2/ettj/key-maturities-table";
import { applyMethod } from "@/lib/ettj/interpolation";
import { computeMetrics } from "@/lib/ettj/metrics";
import {
  DI1Contract,
  InterpolationMethod,
  METHOD_LABELS,
} from "@/lib/ettj/types";
import { FIVE_YEAR_HORIZON, KEY_MATURITIES, SMOOTH_POINTS } from "@/lib/ettj/constants";

/** Linearly interpolate ys at target x, given sorted xs/ys arrays. */
function lerpAt(xs: number[], ys: number[], target: number): number {
  if (target <= xs[0]) return ys[0];
  if (target >= xs[xs.length - 1]) return ys[ys.length - 1];
  let lo = 0;
  let hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= target) lo = mid;
    else hi = mid;
  }
  const t = (target - xs[lo]) / (xs[hi] - xs[lo]);
  return ys[lo] + t * (ys[hi] - ys[lo]);
}

export function EttjTaxaSpotContent() {
  const [mode, setMode] = useState<"single" | "comparison">("single");
  const [method, setMethod] = useState<InterpolationMethod>("flat-forward");
  const [smoothingFactor, setSmoothingFactor] = useState(50);
  const [dateA, setDateA] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dateB, setDateB] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [activeTab, setActiveTab] = useState<"data" | "residuals" | "download">("data");
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<DI1Contract[] | null>(null);
  const [actualDate, setActualDate] = useState<string | null>(null);
  const [contractsB, setContractsB] = useState<DI1Contract[] | null>(null);
  const [actualDateB, setActualDateB] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Filter contracts to 5-year horizon
  const filtered = useMemo(
    () => contracts?.filter((c) => c.bdays <= FIVE_YEAR_HORIZON) ?? [],
    [contracts]
  );
  const filteredB = useMemo(
    () => contractsB?.filter((c) => c.bdays <= FIVE_YEAR_HORIZON) ?? [],
    [contractsB]
  );

  const xData = useMemo(() => filtered.map((c) => c.bdays), [filtered]);
  const yData = useMemo(() => filtered.map((c) => c.rate), [filtered]);
  const xDataB = useMemo(() => filteredB.map((c) => c.bdays), [filteredB]);
  const yDataB = useMemo(() => filteredB.map((c) => c.rate), [filteredB]);

  // Stats for ControlBar
  const stats = useMemo(() => {
    if (!contracts) return undefined;
    return {
      total: contracts.length,
      filtered: filtered.length,
      maxBdays: contracts.length > 0 ? Math.max(...contracts.map((c) => c.bdays)) : 0,
    };
  }, [contracts, filtered]);

  // Compute interpolation (single mode / data A)
  const result = useMemo(() => {
    if (xData.length < 2) return null;
    try {
      return applyMethod(method, xData, yData, smoothingFactor);
    } catch {
      return null;
    }
  }, [method, xData, yData, smoothingFactor]);

  // Compute interpolation for data B
  const resultB = useMemo(() => {
    if (xDataB.length < 2) return null;
    try {
      return applyMethod(method, xDataB, yDataB, smoothingFactor);
    } catch {
      return null;
    }
  }, [method, xDataB, yDataB, smoothingFactor]);

  // Comparison: common domain smooth curves and difference stats
  const comparisonData = useMemo(() => {
    if (!result || !resultB) return null;

    const xMinA = Math.min(...xData);
    const xMaxA = Math.max(...xData);
    const xMinB = Math.min(...xDataB);
    const xMaxB = Math.max(...xDataB);
    const xMin = Math.max(xMinA, xMinB);
    const xMax = Math.min(xMaxA, xMaxB);

    if (xMin >= xMax) return null;

    const commonX = Array.from(
      { length: SMOOTH_POINTS },
      (_, i) => xMin + (i * (xMax - xMin)) / (SMOOTH_POINTS - 1)
    );

    const commonYA = commonX.map((x) => lerpAt(result.xSmooth, result.ySmooth, x));
    const commonYB = commonX.map((x) => lerpAt(resultB.xSmooth, resultB.ySmooth, x));

    const diffPct = commonYB.map((v, i) => (v - commonYA[i]) * 100);

    const diffMean = diffPct.reduce((a, b) => a + b, 0) / diffPct.length;
    const diffMax = Math.max(...diffPct);
    const diffMin = Math.min(...diffPct);

    let maxAbsIdx = 0;
    let maxAbs = 0;
    for (let i = 0; i < diffPct.length; i++) {
      const abs = Math.abs(diffPct[i]);
      if (abs > maxAbs) {
        maxAbs = abs;
        maxAbsIdx = i;
      }
    }
    const duMaxDiv = Math.round(commonX[maxAbsIdx]);

    const keyDUs = Object.keys(KEY_MATURITIES).map(Number);
    const ratesA = new Map<number, number>();
    const ratesB = new Map<number, number>();
    for (const du of keyDUs) {
      if (du >= xMinA && du <= xMaxA) {
        ratesA.set(du, lerpAt(result.xSmooth, result.ySmooth, du));
      }
      if (du >= xMinB && du <= xMaxB) {
        ratesB.set(du, lerpAt(resultB.xSmooth, resultB.ySmooth, du));
      }
    }

    return { commonX, commonYA, commonYB, diffMean, diffMax, diffMin, duMaxDiv, ratesA, ratesB };
  }, [result, resultB, xData, xDataB]);

  // Compute quality metrics
  const metrics = useMemo(() => {
    if (!result || yData.length === 0) return null;
    return computeMetrics(yData, result.yFitted);
  }, [result, yData]);

  // Compute residuals
  const residuals = useMemo(() => {
    if (!result || yData.length === 0) return [];
    return yData.map((v, i) => v - result.yFitted[i]);
  }, [result, yData]);

  // Curve data for download
  const curveData = useMemo(() => {
    if (!result) return [];
    return result.xSmooth.map((x, i) => ({
      bdays: Math.round(x),
      rate: result.ySmooth[i],
    }));
  }, [result]);

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    setWarning(null);

    if (mode === "comparison") {
      if (dateA === dateB) {
        setWarning("Selecione duas datas diferentes para comparacao.");
        setLoading(false);
        return;
      }

      try {
        const [resA, resB] = await Promise.all([
          fetch(`/api/di1?date=${dateA}`),
          fetch(`/api/di1?date=${dateB}`),
        ]);

        if (!resA.ok) {
          const body = await resA.json().catch(() => ({ error: "Erro ao buscar dados" }));
          setError(`Data A: ${body.error || `Erro ${resA.status}`}`);
          setContracts(null);
          setContractsB(null);
          return;
        }
        if (!resB.ok) {
          const body = await resB.json().catch(() => ({ error: "Erro ao buscar dados" }));
          setError(`Data B: ${body.error || `Erro ${resB.status}`}`);
          setContracts(null);
          setContractsB(null);
          return;
        }

        const dataA = await resA.json();
        const dataB = await resB.json();

        if (!dataA.contracts || dataA.contracts.length === 0) {
          setError("Nenhum contrato DI1 encontrado para a Data A.");
          setContracts(null);
          setContractsB(null);
          return;
        }
        if (!dataB.contracts || dataB.contracts.length === 0) {
          setError("Nenhum contrato DI1 encontrado para a Data B.");
          setContracts(null);
          setContractsB(null);
          return;
        }

        const contractsAArr = dataA.contracts as DI1Contract[];
        const contractsBArr = dataB.contracts as DI1Contract[];

        const filtA = contractsAArr.filter((c) => c.bdays <= FIVE_YEAR_HORIZON);
        const filtB = contractsBArr.filter((c) => c.bdays <= FIVE_YEAR_HORIZON);

        if (filtA.length < 2 || filtB.length < 2) {
          setError("Contratos insuficientes para interpolacao em uma das datas.");
          setContracts(null);
          setContractsB(null);
          return;
        }

        const xMinCommon = Math.max(
          Math.min(...filtA.map((c) => c.bdays)),
          Math.min(...filtB.map((c) => c.bdays))
        );
        const xMaxCommon = Math.min(
          Math.max(...filtA.map((c) => c.bdays)),
          Math.max(...filtB.map((c) => c.bdays))
        );

        if (xMinCommon >= xMaxCommon) {
          setError("Sem sobreposicao de prazos entre as duas datas.");
          setContracts(null);
          setContractsB(null);
          return;
        }

        setContracts(contractsAArr);
        setActualDate(dataA.actual_date || dateA);
        setContractsB(contractsBArr);
        setActualDateB(dataB.actual_date || dateB);

        const warnings: string[] = [];
        if (dataA.actual_date && dataA.actual_date !== dateA) {
          warnings.push(`Data A solicitada: ${dateA}. Dados disponiveis para: ${dataA.actual_date}.`);
        }
        if (dataB.actual_date && dataB.actual_date !== dateB) {
          warnings.push(`Data B solicitada: ${dateB}. Dados disponiveis para: ${dataB.actual_date}.`);
        }
        if (warnings.length > 0) setWarning(warnings.join(" "));
      } catch {
        setError("Nao foi possivel conectar ao servico de dados. Tente novamente em alguns instantes.");
        setContracts(null);
        setContractsB(null);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const res = await fetch(`/api/di1?date=${dateA}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Erro ao buscar dados" }));
          setError(body.error || `Erro ${res.status}`);
          setContracts(null);
          return;
        }

        const data = await res.json();

        if (!data.contracts || data.contracts.length === 0) {
          setError("Nenhum contrato DI1 encontrado para esta data.");
          setContracts(null);
          return;
        }

        setContracts(data.contracts as DI1Contract[]);
        setActualDate(data.actual_date || dateA);
        setContractsB(null);
        setActualDateB(null);

        if (data.actual_date && data.actual_date !== dateA) {
          setWarning(`Data solicitada: ${dateA}. Dados disponiveis para: ${data.actual_date}.`);
        }
      } catch {
        setError("Nao foi possivel conectar ao servico de dados. Tente novamente em alguns instantes.");
        setContracts(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const isComparison = mode === "comparison" && contracts && contractsB && result && resultB && comparisonData;

  return (
    <main className="mesh-bg pt-8 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <div id="modelagem" className="scroll-mt-16">
          <ControlBar
            mode={mode}
            method={method}
            smoothingFactor={smoothingFactor}
            dateA={dateA}
            dateB={dateB}
            loading={loading}
            stats={stats}
            onModeChange={setMode}
            onMethodChange={setMethod}
            onSmoothingChange={setSmoothingFactor}
            onDateAChange={setDateA}
            onDateBChange={setDateB}
            onLoad={handleLoad}
          />

          {error && (
            <div className="mx-4 mt-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {warning && (
            <div className="mx-4 mt-2 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
              {warning}
            </div>
          )}

          {!contracts && !loading && (
            <div className="flex items-center justify-center h-96 text-on-surface-variant">
              Selecione uma data e clique em Carregar
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-96">
              <span className="text-primary animate-pulse">
                Carregando dados DI1...
              </span>
            </div>
          )}

          {/* Comparison mode */}
          {isComparison && (
            <div className="px-4 py-4 space-y-6">
              <ComparisonChart
                dataA={{
                  xObs: xData,
                  yObs: yData.map((v) => v * 100),
                  xSmooth: result.xSmooth,
                  ySmooth: result.ySmooth.map((v) => v * 100),
                  date: actualDate!,
                }}
                dataB={{
                  xObs: xDataB,
                  yObs: yDataB.map((v) => v * 100),
                  xSmooth: resultB.xSmooth,
                  ySmooth: resultB.ySmooth.map((v) => v * 100),
                  date: actualDateB!,
                }}
                methodLabel={METHOD_LABELS[method]}
              />
              <ComparisonStats
                diffMean={comparisonData.diffMean}
                diffMax={comparisonData.diffMax}
                diffMin={comparisonData.diffMin}
                duMaxDiv={comparisonData.duMaxDiv}
              />
              <KeyMaturitiesTable
                ratesA={comparisonData.ratesA}
                ratesB={comparisonData.ratesB}
              />

              <details className="glass-card rounded-lg border border-outline-variant/10 p-4">
                <summary className="cursor-pointer text-on-surface font-semibold text-sm">Download dos Resultados</summary>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      const header = "DiasUteis;Taxa_A_pct;Taxa_B_pct;Diferenca_pp";
                      const rows = comparisonData.commonX.map((x, i) => {
                        const du = Math.round(x).toString();
                        const taxaA = (comparisonData.commonYA[i] * 100).toFixed(4).replace(".", ",");
                        const taxaB = (comparisonData.commonYB[i] * 100).toFixed(4).replace(".", ",");
                        const diff = ((comparisonData.commonYB[i] - comparisonData.commonYA[i]) * 100).toFixed(4).replace(".", ",");
                        return `${du};${taxaA};${taxaB};${diff}`;
                      });
                      const csv = [header, ...rows].join("\n");
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `comparacao_di1_${actualDate}_vs_${actualDateB}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg text-primary text-sm font-medium hover:bg-primary/30 transition-colors"
                  >
                    Baixar CSV de Comparacao
                  </button>
                </div>
              </details>
            </div>
          )}

          {/* Single mode */}
          {!isComparison && contracts && result && (
            <div className="px-4 py-4 space-y-6">
              <YieldCurveChart
                xObserved={xData}
                yObserved={yData.map((v) => v * 100)}
                xSmooth={result.xSmooth}
                ySmooth={result.ySmooth.map((v) => v * 100)}
                date={actualDate!}
                methodLabel={METHOD_LABELS[method]}
              />
              <RateQuery
                method={method}
                xData={xData}
                yData={yData}
                smoothingFactor={smoothingFactor}
              />
              <QualityMetricsPanel metrics={metrics!} />
              {result.params && (
                <FittedParams params={result.params} method={method} />
              )}

              <MethodEquation method={method} smoothingFactor={smoothingFactor} />

              <div>
                <div className="flex border-b border-outline-variant/30 mb-4">
                  {([
                    { key: "data" as const, label: "Dados" },
                    { key: "residuals" as const, label: "Residuos" },
                    { key: "download" as const, label: "Download" },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                        activeTab === tab.key
                          ? "text-primary border-b-2 border-primary"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                {activeTab === "data" && <DataTable contracts={filtered} />}
                {activeTab === "residuals" && (
                  <ResidualsTab xData={xData} residuals={residuals} />
                )}
                {activeTab === "download" && (
                  <DownloadTab
                    curveData={curveData}
                    contracts={filtered}
                    date={actualDate!}
                    method={method}
                  />
                )}
              </div>
            </div>
          )}

          <footer className="mt-12 py-6 text-center text-on-surface-variant text-sm border-t border-outline-variant/20">
            <p>Fonte de Dados: B3 (Brasil, Bolsa, Balcao) via pyield</p>
            <p className="mt-1">Nota: Os contratos DI1 sao essencialmente taxas zero-cupom com capitalizacao de 252 dias uteis</p>
          </footer>
        </div>
      </div>
    </main>
  );
}
