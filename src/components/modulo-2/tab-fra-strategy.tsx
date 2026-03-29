"use client";

import { useState, useMemo } from "react";
import { PlotlyChart } from "@/components/plotly-chart";
import { Math as KMath } from "@/components/math";
import { type ForwardPoint } from "@/lib/finance";
import { fmtPct, fmtBrl } from "@/lib/format";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

interface TabFraStrategyProps {
  forwards: ForwardPoint[];
  selicAtual: number; // in % (e.g., 14.25)
}

/* ---------- helpers ---------- */

function periodLabel(f: ForwardPoint): string {
  const de = f.deDu === 0 ? "0,0A" : `${(f.deDu / 252).toFixed(1).replace(".", ",")}A`;
  const ate = `${(f.ateDu / 252).toFixed(1).replace(".", ",")}A`;
  return `${de} \u2192 ${ate}`;
}

interface VisionRow {
  periodo: string;
  forwardMercado: number; // decimal (e.g. 0.1425)
  visaoCdi: number; // % (e.g. 14.25)
  deDu: number;
  ateDu: number;
}

interface OpportunityRow extends VisionRow {
  divergenciaBps: number;
  estrategia: "Tomar FRA" | "Dar FRA" | "Neutro";
}

/* ---------- component ---------- */

export function TabFraStrategy({ forwards, selicAtual }: TabFraStrategyProps) {
  /* --- empty guard --- */
  if (forwards.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <span className="material-symbols-outlined text-primary text-3xl mb-2 block">info</span>
        <p className="text-sm text-on-surface-variant">
          Calcule as forwards na aba anterior primeiro.
        </p>
      </div>
    );
  }

  return <TabFraStrategyInner forwards={forwards} selicAtual={selicAtual} />;
}

/* Inner component — only rendered when forwards is non-empty */
function TabFraStrategyInner({ forwards, selicAtual }: TabFraStrategyProps) {
  /* =========================================================
   * Section 2: FRA Strategy Simulator state
   * ========================================================= */
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [position, setPosition] = useState<"tomador" | "doador">("tomador");
  const [notional, setNotional] = useState(10_000_000);

  const selectedFwd = forwards[selectedIdx] ?? forwards[0];
  const defaultCdi = selectedFwd.forwardAa * 100;
  const [cdi, setCdi] = useState(defaultCdi);

  // Sync CDI slider default when period changes
  const periodOptions = useMemo(
    () => forwards.map((f, i) => ({ label: periodLabel(f), idx: i })),
    [forwards],
  );

  /* --- FRA payoff calculation --- */
  const fraResult = useMemo(() => {
    const duPeriodo = selectedFwd.ateDu - selectedFwd.deDu;
    const fatorFwd = Math.pow(1 + selectedFwd.forwardAa, duPeriodo / 252);
    const fatorCdi = Math.pow(1 + cdi / 100, duPeriodo / 252);
    const resultadoTomador = notional * (fatorCdi / fatorFwd - 1);
    const resultadoDoador = notional * (fatorFwd / fatorCdi - 1);
    const resultado = position === "tomador" ? resultadoTomador : resultadoDoador;
    const diffBps = (cdi - selectedFwd.forwardAa * 100) * 100;

    return {
      forwardPct: selectedFwd.forwardAa * 100,
      cdiPct: cdi,
      diffBps,
      resultado,
      duPeriodo,
    };
  }, [selectedFwd, cdi, notional, position]);

  /* --- Payoff chart data --- */
  const payoffChart = useMemo(() => {
    const duPeriodo = selectedFwd.ateDu - selectedFwd.deDu;
    const fatorFwd = Math.pow(1 + selectedFwd.forwardAa, duPeriodo / 252);
    const fwdPct = selectedFwd.forwardAa * 100;

    const cdiPoints: number[] = [];
    const pnlPoints: number[] = [];
    for (let c = 5; c <= 25; c += 0.2) {
      const rounded = Math.round(c * 100) / 100;
      cdiPoints.push(rounded);
      const fatorC = Math.pow(1 + rounded / 100, duPeriodo / 252);
      if (position === "tomador") {
        pnlPoints.push(notional * (fatorC / fatorFwd - 1));
      } else {
        pnlPoints.push(notional * (fatorFwd / fatorC - 1));
      }
    }

    const traces = [
      {
        x: cdiPoints,
        y: pnlPoints,
        mode: "lines" as const,
        name: `P&L ${position === "tomador" ? "Tomador" : "Doador"}`,
        line: { color: "#2E75B6", width: 2.5 },
        fill: "tozeroy" as const,
        fillcolor: "rgba(46,139,87,0.1)",
        hovertemplate: "CDI: %{x:.2f}%<br>P&L: R$ %{y:,.2f}<extra></extra>",
      },
      {
        x: [cdi],
        y: [fraResult.resultado],
        mode: "markers" as const,
        name: "CDI simulado",
        marker: { color: "#C55A11", size: 12, symbol: "diamond" },
        hovertemplate: "CDI simulado: %{x:.2f}%<br>P&L: R$ %{y:,.2f}<extra></extra>",
      },
    ];

    const shapes = [
      // Vertical line at forward (breakeven)
      {
        type: "line" as const,
        x0: fwdPct,
        x1: fwdPct,
        y0: 0,
        y1: 1,
        yref: "paper" as const,
        line: { color: "#CC3333", width: 1.5, dash: "dash" as const },
      },
      // Horizontal line at y=0
      {
        type: "line" as const,
        x0: 5,
        x1: 25,
        y0: 0,
        y1: 0,
        line: { color: "#888888", width: 1, dash: "solid" as const },
      },
    ];

    const annotations = [
      {
        x: fwdPct,
        y: 1,
        yref: "paper" as const,
        text: `Forward: ${fwdPct.toFixed(2).replace(".", ",")}%`,
        showarrow: false,
        font: { size: 10, color: "#CC3333" },
        yshift: 10,
      },
    ];

    return { traces, shapes, annotations };
  }, [selectedFwd, cdi, notional, position, fraResult.resultado]);

  /* =========================================================
   * Section 3: Vision Comparison Tool state
   * ========================================================= */
  const [visionRows, setVisionRows] = useState<VisionRow[]>(() =>
    forwards.map((f) => ({
      periodo: periodLabel(f),
      forwardMercado: f.forwardAa,
      visaoCdi: f.forwardAa * 100,
      deDu: f.deDu,
      ateDu: f.ateDu,
    })),
  );

  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [showOpportunities, setShowOpportunities] = useState(false);

  const updateVision = (idx: number, value: number) => {
    setVisionRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, visaoCdi: value } : r)),
    );
  };

  const recalculate = () => {
    const results: OpportunityRow[] = visionRows.map((row) => {
      const divBps = (row.visaoCdi - row.forwardMercado * 100) * 100;
      let estrategia: "Tomar FRA" | "Dar FRA" | "Neutro";
      if (divBps > 25) estrategia = "Tomar FRA";
      else if (divBps < -25) estrategia = "Dar FRA";
      else estrategia = "Neutro";
      return { ...row, divergenciaBps: divBps, estrategia };
    });
    setOpportunities(results);
    setShowOpportunities(true);
  };

  /* --- Vision overlay chart --- */
  const overlayChart = useMemo(() => {
    // Market forwards step line
    const mktX: (number | null)[] = [];
    const mktY: (number | null)[] = [];
    for (const row of visionRows) {
      mktX.push(row.deDu / 252, row.ateDu / 252, null);
      mktY.push(row.forwardMercado * 100, row.forwardMercado * 100, null);
    }

    // Student vision step line
    const visX: (number | null)[] = [];
    const visY: (number | null)[] = [];
    for (const row of visionRows) {
      visX.push(row.deDu / 252, row.ateDu / 252, null);
      visY.push(row.visaoCdi, row.visaoCdi, null);
    }

    return [
      {
        x: mktX,
        y: mktY,
        mode: "lines" as const,
        name: "Forward mercado",
        line: { color: "#2E75B6", width: 3 },
        connectgaps: false,
        hovertemplate: "Prazo: %{x:.2f} anos<br>Forward: %{y:.2f}%<extra></extra>",
      },
      {
        x: visX,
        y: visY,
        mode: "lines" as const,
        name: "Sua vis\u00e3o CDI",
        line: { color: "#C55A11", width: 3, dash: "dash" as const },
        connectgaps: false,
        hovertemplate: "Prazo: %{x:.2f} anos<br>Vis\u00e3o: %{y:.2f}%<extra></extra>",
      },
    ];
  }, [visionRows]);

  const estrategiaColor = (e: string) => {
    if (e === "Tomar FRA") return "text-[#CC3333]";
    if (e === "Dar FRA") return "text-[#2E8B57]";
    return "text-on-surface-variant";
  };

  /* =========================================================
   * Render
   * ========================================================= */
  return (
    <div className="space-y-8">
      {/* ---- Section 1: Concept Expander ---- */}
      <details className="glass-card rounded-xl">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">school</span>
          Conceito — FRA de DI na B3
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            O <strong className="text-on-surface">FRA de DI (Forward Rate Agreement)</strong> na B3
            n&atilde;o &eacute; um contrato listado isolado &mdash; &eacute; constru&iacute;do pela
            combina&ccedil;&atilde;o de <strong className="text-on-surface">duas pernas</strong> de
            contratos futuros de DI com vencimentos diferentes.
          </p>
          <div className="text-center">
            <KMath
              tex="FRA_{t_1, t_2} = \left[\frac{(1 + s_{t_2})^{DU_{t_2}/252}}{(1 + s_{t_1})^{DU_{t_1}/252}}\right]^{252/(DU_{t_2} - DU_{t_1})} - 1"
              display
            />
          </div>
          <ul className="space-y-1 list-disc pl-5">
            <li>
              <strong className="text-on-surface">&ldquo;Tomar&rdquo; FRA:</strong> apostar que o CDI
              realizado ser&aacute; <em>maior</em> que a forward &mdash; lucra se juros subirem.
            </li>
            <li>
              <strong className="text-on-surface">&ldquo;Dar&rdquo; FRA:</strong> apostar que o CDI
              realizado ser&aacute; <em>menor</em> que a forward &mdash; lucra se juros ca&iacute;rem.
            </li>
            <li>
              <strong className="text-on-surface">Usos pr&aacute;ticos:</strong> travar custo de
              capta&ccedil;&atilde;o futura, hedge de rolagem de passivo, posi&ccedil;&atilde;o
              direcional em trecho espec&iacute;fico da curva.
            </li>
          </ul>
        </div>
      </details>

      {/* ---- Section 2: FRA Strategy Simulator ---- */}
      <div className="glass-card rounded-xl p-5 space-y-5">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">swap_vert</span>
          Simulador de Estrat&eacute;gia FRA
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Period selector */}
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Per&iacute;odo
            </label>
            <select
              value={selectedIdx}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setSelectedIdx(idx);
                setCdi(forwards[idx].forwardAa * 100);
              }}
              className={INPUT_CLASS}
            >
              {periodOptions.map((opt) => (
                <option key={opt.idx} value={opt.idx}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Posi&ccedil;&atilde;o
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as "tomador" | "doador")}
              className={INPUT_CLASS}
            >
              <option value="tomador">Tomador (CDI &gt; forward)</option>
              <option value="doador">Doador (CDI &lt; forward)</option>
            </select>
          </div>

          {/* Notional */}
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Nocional (R$)
            </label>
            <input
              type="number"
              value={notional}
              step={1_000_000}
              onChange={(e) => setNotional(Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>

          {/* CDI slider */}
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              CDI realizado (% a.a.):{" "}
              <strong>{cdi.toFixed(2).replace(".", ",")}%</strong>
            </label>
            <input
              type="range"
              min={5}
              max={25}
              step={0.25}
              value={cdi}
              onChange={(e) => setCdi(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
              <span>5,00%</span>
              <span>25,00%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-lg p-4 text-center">
          <span className="text-xs font-label text-on-surface-variant">Forward contratada</span>
          <p className="text-2xl font-headline font-bold mt-1">
            {fmtPct(fraResult.forwardPct)}
          </p>
        </div>
        <div className="glass-card rounded-lg p-4 text-center">
          <span className="text-xs font-label text-on-surface-variant">CDI realizado</span>
          <p className="text-2xl font-headline font-bold mt-1">
            {fmtPct(fraResult.cdiPct)}
          </p>
        </div>
        <div className="glass-card rounded-lg p-4 text-center">
          <span className="text-xs font-label text-on-surface-variant">Diferen&ccedil;a</span>
          <p
            className={`text-2xl font-headline font-bold mt-1 ${
              (position === "tomador" && fraResult.diffBps >= 0) ||
              (position === "doador" && fraResult.diffBps <= 0)
                ? "text-[#2E8B57]"
                : "text-[#CC3333]"
            }`}
          >
            {fraResult.diffBps >= 0 ? "+" : ""}
            {fraResult.diffBps.toFixed(0)} bps
          </p>
        </div>
        <div className="glass-card rounded-lg p-4 text-center">
          <span className="text-xs font-label text-on-surface-variant">Resultado</span>
          <p
            className={`text-2xl font-headline font-bold mt-1 ${
              fraResult.resultado >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"
            }`}
          >
            {fmtBrl(fraResult.resultado)}
          </p>
        </div>
      </div>

      {/* Payoff chart */}
      <div className="glass-card rounded-xl p-4">
        <PlotlyChart
          className="h-[420px]"
          data={payoffChart.traces}
          layout={{
            ...PLOTLY_LAYOUT,
            title: {
              text: `Payoff FRA — ${position === "tomador" ? "Tomador" : "Doador"} (${periodLabel(selectedFwd)})`,
              font: { color: "#aaabb0", size: 14 },
            },
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "CDI realizado (% a.a.)" },
              ticksuffix: "%",
            },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "P&L (R$)" },
            },
            shapes: payoffChart.shapes,
            annotations: payoffChart.annotations,
            showlegend: true,
            hovermode: "closest" as const,
            margin: { l: 80, r: 30, t: 60, b: 50 },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* ---- Section 3: Vision Comparison Tool ---- */}
      <div className="glass-card rounded-xl p-5 space-y-5">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">compare_arrows</span>
          Ferramenta de Compara&ccedil;&atilde;o de Vis&atilde;o
        </h2>
        <p className="text-sm text-on-surface-variant">
          Insira sua vis&atilde;o de CDI para cada per&iacute;odo e compare com as forwards do mercado.
          O sistema identificar&aacute; oportunidades de FRA quando a diverg&ecirc;ncia for
          significativa.
        </p>

        {/* Editable table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container">
                <th className="text-left px-4 py-3 font-label text-on-surface-variant">
                  Per&iacute;odo
                </th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                  Forward mercado (%)
                </th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                  Sua vis&atilde;o CDI (%)
                </th>
              </tr>
            </thead>
            <tbody>
              {visionRows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-outline-variant/20 ${
                    i % 2 === 0 ? "bg-surface-container/40" : ""
                  }`}
                >
                  <td className="px-4 py-2 font-label">{row.periodo}</td>
                  <td className="px-4 py-2 text-right">
                    {fmtPct(row.forwardMercado * 100)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      value={row.visaoCdi}
                      step={0.1}
                      onChange={(e) => updateVision(i, Number(e.target.value))}
                      className="bg-transparent border-b border-outline-variant/30 px-1 py-0.5 text-sm w-24 text-right focus:border-primary focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={recalculate}
          className="px-4 py-2 text-sm font-headline font-bold rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors cursor-pointer flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Recalcular diverg&ecirc;ncias
        </button>
      </div>

      {/* Vision overlay chart */}
      <div className="glass-card rounded-xl p-4">
        <PlotlyChart
          className="h-[420px]"
          data={overlayChart}
          layout={{
            ...PLOTLY_LAYOUT,
            title: {
              text: "Forward Mercado vs. Sua Vis\u00e3o",
              font: { color: "#aaabb0", size: 14 },
            },
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "Prazo (anos)" },
            },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "Taxa (% a.a.)" },
              ticksuffix: "%",
            },
            hovermode: "closest" as const,
            margin: { l: 60, r: 30, t: 60, b: 50 },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Opportunities table */}
      {showOpportunities && opportunities.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container">
                <th className="text-left px-4 py-3 font-label text-on-surface-variant">
                  Per&iacute;odo
                </th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                  Forward (%)
                </th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                  Sua vis&atilde;o (%)
                </th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                  Diverg&ecirc;ncia (bps)
                </th>
                <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                  Estrat&eacute;gia sugerida
                </th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-outline-variant/20 ${
                    i % 2 === 0 ? "bg-surface-container/40" : ""
                  }`}
                >
                  <td className="px-4 py-2 font-label">{row.periodo}</td>
                  <td className="px-4 py-2 text-right">{fmtPct(row.forwardMercado * 100)}</td>
                  <td className="px-4 py-2 text-right">{fmtPct(row.visaoCdi)}</td>
                  <td className="px-4 py-2 text-right font-headline font-bold">
                    {row.divergenciaBps >= 0 ? "+" : ""}
                    {row.divergenciaBps.toFixed(0)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-headline font-bold ${estrategiaColor(
                      row.estrategia,
                    )}`}
                  >
                    {row.estrategia}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          Na pr&aacute;tica, divergir do mercado tem custo: a forward j&aacute; embute o consenso dos
          participantes. Para que uma posi&ccedil;&atilde;o de FRA gere lucro, n&atilde;o basta que
          sua vis&atilde;o esteja &ldquo;certa&rdquo; &mdash; ela precisa ser{" "}
          <strong className="text-on-surface">mais precisa que o mercado</strong>. Al&eacute;m disso,
          h&aacute; custos de margem (B3), bid-ask spread e risco de marca&ccedil;&atilde;o a mercado
          durante o carregamento.
        </p>
      </div>
    </div>
  );
}
