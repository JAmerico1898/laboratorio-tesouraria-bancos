"use client";

import { useState, useMemo } from "react";
import { calcPressao, CENARIO_DELTAS } from "@/lib/data";
import { fmtPct } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";
import type { Data } from "plotly.js";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const CAMBIO_KEYS = Object.keys(CENARIO_DELTAS.cambio);
const FISCAL_KEYS = Object.keys(CENARIO_DELTAS.fiscal);
const FED_KEYS = Object.keys(CENARIO_DELTAS.fed);

function bpsLabel(bps: number): string {
  if (bps > 100) return "Forte pressão de alta";
  if (bps > 25) return "Pressão de alta";
  if (bps > -25) return "Neutro";
  if (bps > -100) return "Pressão de queda";
  return "Forte pressão de queda";
}

function bpsColor(bps: number): string {
  if (bps > 100) return "#CC3333";
  if (bps > 25) return "#C55A11";
  if (bps > -25) return "#888888";
  if (bps > -100) return "#2E75B6";
  return "#2E8B57";
}

function curveImplication(bps: number): string {
  if (bps > 75) return "Normal (positivamente inclinada) — mercado espera mais altas";
  if (bps < -75) return "Invertida — mercado espera cortes significativos";
  return "Relativamente flat — expectativa de estabilidade";
}

function formatBps(v: number): string {
  return `${v >= 0 ? "+" : ""}${Math.round(v)}`;
}

interface ScenarioInputsProps {
  title: string;
  ipca: number;
  pib: number;
  cambio: string;
  fiscal: string;
  fed: string;
  onIpca: (v: number) => void;
  onPib: (v: number) => void;
  onCambio: (v: string) => void;
  onFiscal: (v: string) => void;
  onFed: (v: string) => void;
}

function ScenarioInputs({
  title,
  ipca,
  pib,
  cambio,
  fiscal,
  fed,
  onIpca,
  onPib,
  onCambio,
  onFiscal,
  onFed,
}: ScenarioInputsProps) {
  return (
    <div className="glass-card rounded-lg p-5 space-y-4">
      <h3 className="font-headline font-bold text-base border-b border-outline-variant/30 pb-2">
        {title}
      </h3>
      <div>
        <label className="block text-xs font-label text-on-surface-variant mb-1">
          IPCA esperado 12M (%)
        </label>
        <input
          type="number"
          value={ipca}
          onChange={(e) => onIpca(Number(e.target.value))}
          step={0.5}
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label className="block text-xs font-label text-on-surface-variant mb-1">
          Crescimento PIB (%)
        </label>
        <input
          type="number"
          value={pib}
          onChange={(e) => onPib(Number(e.target.value))}
          step={0.5}
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label className="block text-xs font-label text-on-surface-variant mb-1">
          Câmbio
        </label>
        <select
          value={cambio}
          onChange={(e) => onCambio(e.target.value)}
          className={INPUT_CLASS}
        >
          {CAMBIO_KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-label text-on-surface-variant mb-1">
          Fiscal
        </label>
        <select
          value={fiscal}
          onChange={(e) => onFiscal(e.target.value)}
          className={INPUT_CLASS}
        >
          {FISCAL_KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-label text-on-surface-variant mb-1">
          Externo / FED
        </label>
        <select
          value={fed}
          onChange={(e) => onFed(e.target.value)}
          className={INPUT_CLASS}
        >
          {FED_KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function TabCenarios() {
  const [selicAtual, setSelicAtual] = useState(14.25);

  // Base scenario
  const [baseIpca, setBaseIpca] = useState(4.5);
  const [basePib, setBasePib] = useState(2.0);
  const [baseCambio, setBaseCambio] = useState(CAMBIO_KEYS[0]);
  const [baseFiscal, setBaseFiscal] = useState(FISCAL_KEYS[0]);
  const [baseFed, setBaseFed] = useState(FED_KEYS[0]);

  // Alt scenario
  const [altIpca, setAltIpca] = useState(4.5);
  const [altPib, setAltPib] = useState(2.0);
  const [altCambio, setAltCambio] = useState(CAMBIO_KEYS[1] ?? CAMBIO_KEYS[0]);
  const [altFiscal, setAltFiscal] = useState(FISCAL_KEYS[1] ?? FISCAL_KEYS[0]);
  const [altFed, setAltFed] = useState(FED_KEYS[1] ?? FED_KEYS[0]);

  const baseResult = useMemo(
    () => calcPressao(baseIpca, basePib, baseCambio, baseFiscal, baseFed),
    [baseIpca, basePib, baseCambio, baseFiscal, baseFed]
  );

  const altResult = useMemo(
    () => calcPressao(altIpca, altPib, altCambio, altFiscal, altFed),
    [altIpca, altPib, altCambio, altFiscal, altFed]
  );

  const TABLE_ROWS: { label: string; key: string }[] = [
    { label: "Inflação (IPCA)", key: "Inflação (IPCA)" },
    { label: "Atividade (PIB)", key: "Atividade (PIB)" },
    { label: "Câmbio", key: "Câmbio" },
    { label: "Fiscal", key: "Fiscal" },
    { label: "Externo (FED)", key: "Externo (FED)" },
  ];

  function gaugeTrace(bps: number, title: string): Data {
    const label = bpsLabel(bps);
    const color = bpsColor(bps);
    // "indicator" is a valid Plotly trace type but not in react-plotly.js union types — cast required
    return {
      type: "indicator",
      mode: "gauge+number",
      value: bps,
      number: { suffix: " bps" },
      title: {
        text: `${title}<br><span style='font-size:0.8em;color:#aaabb0'>${label}</span>`,
      },
      gauge: {
        axis: { range: [-400, 400] },
        bar: { color },
        steps: [
          { range: [-400, -100], color: "rgba(46,139,87,0.2)" },
          { range: [-100, 100], color: "rgba(200,200,200,0.2)" },
          { range: [100, 400], color: "rgba(204,51,51,0.2)" },
        ],
        threshold: {
          line: { color: "black", width: 2 },
          thickness: 0.75,
          value: bps,
        },
      },
    } as unknown as Data;
  }

  return (
    <div className="space-y-8">
      {/* Section 1 — Current SELIC */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">percent</span>
          SELIC Atual
        </h2>
        <div className="glass-card rounded-lg p-5">
          <label className="block text-xs font-label text-on-surface-variant mb-1">
            SELIC Meta atual (% a.a.)
          </label>
          <div className="max-w-xs">
            <input
              type="number"
              value={selicAtual}
              onChange={(e) => setSelicAtual(Number(e.target.value))}
              step={0.25}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </section>

      {/* Section 2 — Side-by-side scenario inputs */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">tune</span>
          Parâmetros dos Cenários
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <ScenarioInputs
            title="Cenário Base"
            ipca={baseIpca}
            pib={basePib}
            cambio={baseCambio}
            fiscal={baseFiscal}
            fed={baseFed}
            onIpca={setBaseIpca}
            onPib={setBasePib}
            onCambio={setBaseCambio}
            onFiscal={setBaseFiscal}
            onFed={setBaseFed}
          />
          <ScenarioInputs
            title="Cenário Alternativo"
            ipca={altIpca}
            pib={altPib}
            cambio={altCambio}
            fiscal={altFiscal}
            fed={altFed}
            onIpca={setAltIpca}
            onPib={setAltPib}
            onCambio={setAltCambio}
            onFiscal={setAltFiscal}
            onFed={setAltFed}
          />
        </div>
      </section>

      {/* Section 3 — Comparison table */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">compare</span>
          Decomposição da Pressão sobre os Juros
        </h2>
        <div className="glass-card rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container">
                <th className="text-left px-4 py-3 font-label text-on-surface-variant">
                  Fator
                </th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                  Base (bps)
                </th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                  Alternativo (bps)
                </th>
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row, i) => {
                const bVal = baseResult.detail[row.key] ?? 0;
                const aVal = altResult.detail[row.key] ?? 0;
                return (
                  <tr
                    key={row.key}
                    className={`border-b border-outline-variant/20 ${
                      i % 2 === 0 ? "bg-surface-container/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-label">{row.label}</td>
                    <td
                      className={`px-4 py-3 text-right font-label ${
                        bVal > 0
                          ? "text-[#CC3333]"
                          : bVal < 0
                          ? "text-[#2E8B57]"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {formatBps(bVal)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-label ${
                        aVal > 0
                          ? "text-[#CC3333]"
                          : aVal < 0
                          ? "text-[#2E8B57]"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {formatBps(aVal)}
                    </td>
                  </tr>
                );
              })}
              {/* TOTAL row */}
              <tr className="bg-surface-container border-t-2 border-outline-variant/40">
                <td className="px-4 py-3 font-headline font-bold">TOTAL</td>
                <td
                  className={`px-4 py-3 text-right font-headline font-bold ${
                    baseResult.total > 0
                      ? "text-[#CC3333]"
                      : baseResult.total < 0
                      ? "text-[#2E8B57]"
                      : ""
                  }`}
                >
                  {formatBps(baseResult.total)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-headline font-bold ${
                    altResult.total > 0
                      ? "text-[#CC3333]"
                      : altResult.total < 0
                      ? "text-[#2E8B57]"
                      : ""
                  }`}
                >
                  {formatBps(altResult.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4 — SELIC projection cards */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">trending_up</span>
          Projeção de SELIC
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="glass-card rounded-lg p-5 border-t-2 border-[#2E75B6]">
            <p className="text-xs font-label text-on-surface-variant mb-1">
              Cenário Base — SELIC projetada
            </p>
            <p className="text-2xl font-headline font-bold text-primary">
              {fmtPct(selicAtual + baseResult.total / 100, 2)}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              SELIC atual {fmtPct(selicAtual, 2)} {baseResult.total >= 0 ? "+" : ""}{formatBps(baseResult.total)} bps
            </p>
          </div>
          <div className="glass-card rounded-lg p-5 border-t-2 border-[#C55A11]">
            <p className="text-xs font-label text-on-surface-variant mb-1">
              Cenário Alternativo — SELIC projetada
            </p>
            <p className="text-2xl font-headline font-bold text-primary">
              {fmtPct(selicAtual + altResult.total / 100, 2)}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              SELIC atual {fmtPct(selicAtual, 2)} {altResult.total >= 0 ? "+" : ""}{formatBps(altResult.total)} bps
            </p>
          </div>
        </div>
      </section>

      {/* Section 5 — Gauge charts */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">speed</span>
          Pressão sobre os Juros
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-card rounded-lg overflow-hidden">
            <PlotlyChart
              data={[gaugeTrace(Math.round(baseResult.total), "Cenário Base")]}
              layout={{
                ...PLOTLY_LAYOUT,
                height: 280,
                margin: { l: 30, r: 30, t: 60, b: 20 },
                paper_bgcolor: "rgba(0,0,0,0)",
                font: { color: "#aaabb0" },
              }}
              config={PLOTLY_CONFIG}
              className="h-[280px]"
            />
          </div>
          <div className="glass-card rounded-lg overflow-hidden">
            <PlotlyChart
              data={[gaugeTrace(Math.round(altResult.total), "Cenário Alternativo")]}
              layout={{
                ...PLOTLY_LAYOUT,
                height: 280,
                margin: { l: 30, r: 30, t: 60, b: 20 },
                paper_bgcolor: "rgba(0,0,0,0)",
                font: { color: "#aaabb0" },
              }}
              config={PLOTLY_CONFIG}
              className="h-[280px]"
            />
          </div>
        </div>
      </section>

      {/* Section 6 — Curve implication */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">ssid_chart</span>
          Implicação para a Curva de Juros
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="glass-card rounded-lg p-4 border-l-4 border-[#2E75B6]">
            <p className="text-xs font-label text-on-surface-variant mb-1">Cenário Base</p>
            <p className="text-sm font-label font-bold">{curveImplication(baseResult.total)}</p>
          </div>
          <div className="glass-card rounded-lg p-4 border-l-4 border-[#C55A11]">
            <p className="text-xs font-label text-on-surface-variant mb-1">
              Cenário Alternativo
            </p>
            <p className="text-sm font-label font-bold">
              {curveImplication(altResult.total)}
            </p>
          </div>
        </div>
      </section>

      {/* Section 7 — Disclaimer */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Nota metodológica:</strong> Este modelo é uma
          simplificação didática. A tesouraria utiliza modelos econométricos sofisticados. O
          objetivo aqui é desenvolver a intuição sobre como variáveis macro se traduzem em
          movimentos de juros.
        </p>
      </div>
    </div>
  );
}
