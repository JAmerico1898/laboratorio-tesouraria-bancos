"use client";

import { useState, useMemo } from "react";
import {
  precificarLtn,
  precificarNtnf,
  precificarLft,
  precificarNtnb,
} from "@/lib/finance";
import { diasUteis } from "@/lib/holidays";
import { fmtPct, fmtBrl } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const SELECT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const CENARIOS = [
  { label: "Estável (SELIC mantida)", varSelic: 0 },
  { label: "Corte moderado (\u2212200 bps)", varSelic: -200 },
  { label: "Corte agressivo (\u2212400 bps)", varSelic: -400 },
  { label: "Alta moderada (+200 bps)", varSelic: 200 },
  { label: "Personalizado", varSelic: null },
] as const;

const TITLE_COLORS = {
  LTN: "#2E75B6",
  "NTN-F": "#1B3A5C",
  LFT: "#2E8B57",
  "NTN-B": "#8B5CF6",
} as const;

const VNA_LFT = 15234.56;
const VNA_NTNB = 4352.78;

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addYears(iso: string, years: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setFullYear(d.getFullYear() + years);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface TitleResult {
  nome: string;
  indexador: string;
  taxa: number;
  pu: number;
  duration: number;
  carry12m: number;
  mtmCenario: number;
  retornoTotal: number;
}

function computeAll(
  taxaLtn: number,
  taxaNtnf: number,
  spreadLft: number,
  taxaNtnb: number,
  selicMeta: number,
  ipcaEsperado: number,
  varSelicBps: number,
  ipcaRealizado: number,
): TitleResult[] {
  const dtLiq = todayIso();
  const dtVencLtn = addYears(dtLiq, 1);
  const dtVencNtnf = addYears(dtLiq, 2);
  const dtVencNtnb = addYears(dtLiq, 3);

  const liqDate = new Date(dtLiq + "T12:00:00");
  const vencLtnDate = new Date(dtVencLtn + "T12:00:00");
  const vencNtnfDate = new Date(dtVencNtnf + "T12:00:00");
  const vencNtnbDate = new Date(dtVencNtnb + "T12:00:00");

  const duLtn = diasUteis(liqDate, vencLtnDate);
  const duNtnf = diasUteis(liqDate, vencNtnfDate);
  const duLft = diasUteis(liqDate, vencLtnDate); // 1 year as reference
  const duNtnb = diasUteis(liqDate, vencNtnbDate);

  // --- Price today ---
  const ltnRes = precificarLtn(taxaLtn / 100, duLtn);
  const ntnfRes = precificarNtnf(taxaNtnf / 100, dtLiq, dtVencNtnf, diasUteis);
  const lftRes = precificarLft(VNA_LFT, spreadLft, duLft);
  const ntnbRes = precificarNtnb(taxaNtnb / 100, VNA_NTNB, dtLiq, dtVencNtnb, diasUteis);

  // --- Carry 12M (simplified) ---
  const carryLtn = (taxaLtn / 100) * ltnRes.pu * (Math.min(duLtn, 252) / 252);
  const carryNtnf =
    ntnfRes.fluxos
      .filter((f) => f.du <= 252)
      .reduce((s, f) => s + f.fluxo, 0) +
    (taxaNtnf / 100) * ntnfRes.pu * 0.05; // small reinvestment approx
  const carryLft = (selicMeta / 100) * VNA_LFT;
  const carryNtnb = (ipcaRealizado / 100 + taxaNtnb / 100) * VNA_NTNB;

  // --- MtM under scenario ---
  const varDecimal = varSelicBps / 10000;

  // LTN: reprice with shocked rate
  const newTaxaLtn = taxaLtn / 100 + varDecimal;
  const du12m = Math.max(duLtn - 252, 1);
  const ltnMtm = precificarLtn(Math.max(newTaxaLtn, 0.001), du12m).pu - precificarLtn(taxaLtn / 100, du12m).pu;

  // NTN-F: reprice with shocked rate, 1 year less
  const newTaxaNtnf = taxaNtnf / 100 + varDecimal;
  const dtLiq1y = addYears(dtLiq, 1);
  const ntnfBase1y = precificarNtnf(taxaNtnf / 100, dtLiq1y, dtVencNtnf, diasUteis);
  const ntnfShocked1y = precificarNtnf(Math.max(newTaxaNtnf, 0.001), dtLiq1y, dtVencNtnf, diasUteis);
  const ntnfMtm = ntnfShocked1y.pu - ntnfBase1y.pu;

  // LFT: minimal MtM (duration ~0)
  const lftMtm = -VNA_LFT * 0.0001 * (varSelicBps * 0.001); // near-zero impact

  // NTN-B: reprice with shocked real rate
  const newTaxaNtnb = taxaNtnb / 100 + varDecimal;
  const dtLiqNtnb1y = addYears(dtLiq, 1);
  const ntnbBase1y = precificarNtnb(taxaNtnb / 100, VNA_NTNB, dtLiqNtnb1y, dtVencNtnb, diasUteis);
  const ntnbShocked1y = precificarNtnb(Math.max(newTaxaNtnb, 0.001), VNA_NTNB, dtLiqNtnb1y, dtVencNtnb, diasUteis);
  const ntnbMtm = ntnbShocked1y.pu - ntnbBase1y.pu;

  // --- Return total (% of initial PU) ---
  const retLtn = ((carryLtn + ltnMtm) / ltnRes.pu) * 100;
  const retNtnf = ((carryNtnf + ntnfMtm) / ntnfRes.pu) * 100;
  const retLft = ((carryLft + lftMtm) / lftRes.pu) * 100;
  const retNtnb = ((carryNtnb + ntnbMtm) / ntnbRes.pu) * 100;

  return [
    {
      nome: "LTN",
      indexador: "Prefixado",
      taxa: taxaLtn,
      pu: ltnRes.pu,
      duration: ltnRes.duration,
      carry12m: carryLtn,
      mtmCenario: ltnMtm,
      retornoTotal: retLtn,
    },
    {
      nome: "NTN-F",
      indexador: "Prefixado + Cupom",
      taxa: taxaNtnf,
      pu: ntnfRes.pu,
      duration: ntnfRes.duration,
      carry12m: carryNtnf,
      mtmCenario: ntnfMtm,
      retornoTotal: retNtnf,
    },
    {
      nome: "LFT",
      indexador: "SELIC",
      taxa: selicMeta + spreadLft / 100,
      pu: lftRes.pu,
      duration: lftRes.durationEfetiva,
      carry12m: carryLft,
      mtmCenario: lftMtm,
      retornoTotal: retLft,
    },
    {
      nome: "NTN-B",
      indexador: "IPCA + Taxa Real",
      taxa: ipcaRealizado + taxaNtnb,
      pu: ntnbRes.pu,
      duration: ntnbRes.duration,
      carry12m: carryNtnb,
      mtmCenario: ntnbMtm,
      retornoTotal: retNtnb,
    },
  ];
}

export function TabComparativoPublicos() {
  // Market data inputs
  const [taxaLtn, setTaxaLtn] = useState(12.5);
  const [taxaNtnf, setTaxaNtnf] = useState(12.8);
  const [spreadLft, setSpreadLft] = useState(2);
  const [taxaNtnb, setTaxaNtnb] = useState(6.2);
  const [selicMeta, setSelicMeta] = useState(13.75);
  const [ipcaEsperado, setIpcaEsperado] = useState(4.5);

  // Scenario
  const [cenarioIdx, setCenarioIdx] = useState(0);
  const [customVarSelic, setCustomVarSelic] = useState(0);
  const [customIpca, setCustomIpca] = useState(4.5);

  const isCustom = cenarioIdx === 4;
  const varSelicBps = isCustom
    ? customVarSelic
    : (CENARIOS[cenarioIdx].varSelic ?? 0);
  const ipcaRealizado = isCustom ? customIpca : ipcaEsperado;

  const results = useMemo(
    () =>
      computeAll(
        taxaLtn,
        taxaNtnf,
        spreadLft,
        taxaNtnb,
        selicMeta,
        ipcaEsperado,
        varSelicBps,
        ipcaRealizado,
      ),
    [taxaLtn, taxaNtnf, spreadLft, taxaNtnb, selicMeta, ipcaEsperado, varSelicBps, ipcaRealizado],
  );

  const sorted = useMemo(
    () => [...results].sort((a, b) => b.retornoTotal - a.retornoTotal),
    [results],
  );

  const bestTitle = sorted[0];
  const lftResult = results.find((r) => r.nome === "LFT")!;

  // --- Sensitivity data: sweep -500 to +500 bps ---
  const sensitivityData = useMemo(() => {
    const bpsRange: number[] = [];
    for (let b = -500; b <= 500; b += 25) bpsRange.push(b);

    const series: Record<string, number[]> = {
      LTN: [],
      "NTN-F": [],
      LFT: [],
      "NTN-B": [],
    };

    for (const b of bpsRange) {
      const r = computeAll(
        taxaLtn,
        taxaNtnf,
        spreadLft,
        taxaNtnb,
        selicMeta,
        ipcaEsperado,
        b,
        isCustom ? customIpca : ipcaEsperado,
      );
      for (const t of r) {
        series[t.nome].push(t.retornoTotal);
      }
    }

    return { bpsRange, series };
  }, [taxaLtn, taxaNtnf, spreadLft, taxaNtnb, selicMeta, ipcaEsperado, isCustom, customIpca]);

  const cenarioLabel = isCustom
    ? `Personalizado (${varSelicBps >= 0 ? "+" : ""}${varSelicBps} bps)`
    : CENARIOS[cenarioIdx].label;

  return (
    <div className="space-y-8">
      {/* Market Data Inputs */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">tune</span>
          Dados de Mercado
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Taxa LTN 1A (% a.a.)
            </label>
            <input
              type="number"
              value={taxaLtn}
              onChange={(e) => setTaxaLtn(Number(e.target.value))}
              step={0.05}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Taxa NTN-F 2A (% a.a.)
            </label>
            <input
              type="number"
              value={taxaNtnf}
              onChange={(e) => setTaxaNtnf(Number(e.target.value))}
              step={0.05}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Spread LFT (bps)
            </label>
            <input
              type="number"
              value={spreadLft}
              onChange={(e) => setSpreadLft(Number(e.target.value))}
              step={1}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Taxa NTN-B 3A IPCA+ (% a.a.)
            </label>
            <input
              type="number"
              value={taxaNtnb}
              onChange={(e) => setTaxaNtnb(Number(e.target.value))}
              step={0.05}
              className={INPUT_CLASS}
            />
          </div>
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
              IPCA esperado 12M (% a.a.)
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
      </div>

      {/* Scenario Selector */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            trending_up
          </span>
          Cenario de Estresse
        </h2>
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

        {isCustom && (
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Variacao SELIC (bps): {customVarSelic >= 0 ? "+" : ""}{customVarSelic}
              </label>
              <input
                type="range"
                min={-500}
                max={500}
                step={25}
                value={customVarSelic}
                onChange={(e) => setCustomVarSelic(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                <span>-500</span>
                <span>0</span>
                <span>+500</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                IPCA realizado (% a.a.): {customIpca.toFixed(1)}%
              </label>
              <input
                type="range"
                min={2}
                max={12}
                step={0.25}
                value={customIpca}
                onChange={(e) => setCustomIpca(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                <span>2%</span>
                <span>7%</span>
                <span>12%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            table_chart
          </span>
          Comparativo de Titulos
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 text-xs text-on-surface-variant">
                <th className="text-left py-2 px-2">Titulo</th>
                <th className="text-left py-2 px-2">Indexador</th>
                <th className="text-right py-2 px-2">Taxa</th>
                <th className="text-right py-2 px-2">PU (R$)</th>
                <th className="text-right py-2 px-2">Duration</th>
                <th className="text-right py-2 px-2">Carry 12M (R$)</th>
                <th className="text-right py-2 px-2">MtM Cenario (R$)</th>
                <th className="text-right py-2 px-2">Retorno Total (%)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr
                  key={r.nome}
                  className={`border-b border-outline-variant/20 ${
                    i % 2 === 0 ? "bg-surface-container/40" : ""
                  }`}
                >
                  <td className="py-2 px-2 font-bold" style={{ color: TITLE_COLORS[r.nome as keyof typeof TITLE_COLORS] }}>
                    {r.nome}
                  </td>
                  <td className="py-2 px-2 text-on-surface-variant">{r.indexador}</td>
                  <td className="py-2 px-2 text-right">{fmtPct(r.taxa / 100)}</td>
                  <td className="py-2 px-2 text-right">{fmtBrl(r.pu)}</td>
                  <td className="py-2 px-2 text-right">{r.duration.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right">{fmtBrl(r.carry12m)}</td>
                  <td className={`py-2 px-2 text-right ${r.mtmCenario >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}`}>
                    {fmtBrl(r.mtmCenario)}
                  </td>
                  <td className={`py-2 px-2 text-right font-bold ${r.retornoTotal >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}`}>
                    {fmtPct(r.retornoTotal / 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar Chart: Retorno Total */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
          Retorno Total por Titulo ({cenarioLabel})
        </h3>
        <PlotlyChart
          className="h-[350px]"
          data={[
            {
              y: sorted.map((r) => r.nome),
              x: sorted.map((r) => r.retornoTotal),
              type: "bar" as const,
              orientation: "h" as const,
              marker: {
                color: sorted.map((r) =>
                  r.retornoTotal >= 0 ? "#2E8B57" : "#CC3333",
                ),
              },
              text: sorted.map((r) => fmtPct(r.retornoTotal / 100)),
              textposition: "outside" as const,
              hovertemplate: "%{y}: %{x:.2f}%<extra></extra>",
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
            margin: { ...PLOTLY_LAYOUT.margin, l: 80, t: 20 },
            showlegend: false,
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Sensitivity Chart */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
          Sensibilidade: Retorno Total vs Variacao SELIC
        </h3>
        <PlotlyChart
          className="h-[400px]"
          data={Object.entries(sensitivityData.series).map(([nome, vals]) => ({
            x: sensitivityData.bpsRange,
            y: vals,
            type: "scatter" as const,
            mode: "lines" as const,
            name: nome,
            line: {
              color: TITLE_COLORS[nome as keyof typeof TITLE_COLORS],
              width: 2.5,
            },
          }))}
          layout={{
            ...PLOTLY_LAYOUT,
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "Variacao SELIC (bps)" },
              zeroline: true,
              zerolinewidth: 1,
              zerolinecolor: "rgba(255,255,255,0.3)",
            },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "Retorno Total (%)" },
            },
            legend: {
              orientation: "h" as const,
              y: -0.18,
              font: { color: "#aaabb0" },
            },
            margin: { ...PLOTLY_LAYOUT.margin, t: 20 },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Interpretation Box */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Interpretacao:</strong> No cenario{" "}
          <strong className="text-on-surface">{cenarioLabel}</strong>, o titulo
          com melhor retorno e{" "}
          <strong
            className="text-on-surface"
            style={{ color: TITLE_COLORS[bestTitle.nome as keyof typeof TITLE_COLORS] }}
          >
            {bestTitle.nome}
          </strong>{" "}
          com{" "}
          <strong className={bestTitle.retornoTotal >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}>
            {fmtPct(bestTitle.retornoTotal / 100)}
          </strong>
          . A LFT oferece{" "}
          <strong className={lftResult.retornoTotal >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}>
            {fmtPct(lftResult.retornoTotal / 100)}
          </strong>{" "}
          com risco minimo de marcacao a mercado (duration efetiva ~0). A
          analise de sensibilidade acima mostra como cada titulo responde a
          diferentes cenarios de politica monetaria — prefixados (LTN, NTN-F)
          ganham com cortes e perdem com altas; pos-fixados (LFT) sao
          praticamente imunes a variacoes de taxa; indexados a inflacao (NTN-B)
          tem comportamento intermediario, dependendo do juro real.
        </p>
      </div>
    </div>
  );
}
