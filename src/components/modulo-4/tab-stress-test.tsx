"use client";

import { useState, useMemo } from "react";
import { fmtBrl, fmtPct } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

interface PortfolioItem {
  titulo: string;
  pu: number;
  qtd: number;
  durMod: number;
  conv: number;
}

const DEFAULT_PORTFOLIO: PortfolioItem[] = [
  { titulo: "LTN 1A", pu: 888.49, qtd: 50000, durMod: 0.88, conv: 1.65 },
  { titulo: "NTN-F 3A", pu: 950.0, qtd: 30000, durMod: 2.5, conv: 8.5 },
  { titulo: "LTN 5A", pu: 730.0, qtd: 20000, durMod: 4.42, conv: 24.0 },
  { titulo: "NTN-B 5A", pu: 4200.0, qtd: 5000, durMod: 4.1, conv: 21.0 },
];

interface Cenario {
  nome: string;
  curto: number; // bps
  longo: number; // bps
}

const CENARIOS: Cenario[] = [
  { nome: "Paralelo +100 bps", curto: 100, longo: 100 },
  { nome: "Paralelo +200 bps", curto: 200, longo: 200 },
  { nome: "Paralelo -100 bps", curto: -100, longo: -100 },
  { nome: "Empinamento (curto +50, longo +150)", curto: 50, longo: 150 },
  { nome: "Achatamento (curto +150, longo +50)", curto: 150, longo: 50 },
  { nome: "Estresse severo (+300 bps)", curto: 300, longo: 300 },
];

function calcularPL(
  portfolio: PortfolioItem[],
  cenario: Cenario,
): { plTotal: number; plPct: number; detalhes: { titulo: string; pl: number }[] } {
  const choqueMedio = (cenario.curto + cenario.longo) / 2;
  const di = choqueMedio / 10000;

  const detalhes = portfolio.map((p) => {
    const valor = p.pu * p.qtd;
    const pl = -p.durMod * valor * di + 0.5 * p.conv * valor * di * di;
    return { titulo: p.titulo, pl };
  });

  const plTotal = detalhes.reduce((s, d) => s + d.pl, 0);
  const valorTotal = portfolio.reduce((s, p) => s + p.pu * p.qtd, 0);
  const plPct = valorTotal > 0 ? (plTotal / valorTotal) * 100 : 0;

  return { plTotal, plPct, detalhes };
}

export function TabStressTest() {
  const [selecionados, setSelecionados] = useState<Set<number>>(
    new Set([0, 1, 2, 3, 4, 5]),
  );

  const toggleCenario = (idx: number) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const resultados = useMemo(() => {
    return CENARIOS.filter((_, i) => selecionados.has(i)).map((cenario) => {
      const { plTotal, plPct, detalhes } = calcularPL(DEFAULT_PORTFOLIO, cenario);
      const sorted = [...detalhes].sort((a, b) => a.pl - b.pl);
      const pior = sorted[0]?.titulo ?? "-";
      const melhor = sorted[sorted.length - 1]?.titulo ?? "-";
      return { cenario: cenario.nome, plTotal, plPct, pior, melhor };
    });
  }, [selecionados]);

  return (
    <div className="space-y-8">
      {/* Scenario selection */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-headline font-bold text-sm mb-3">Seleção de Cenários</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {CENARIOS.map((c, i) => (
            <label
              key={c.nome}
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                selecionados.has(i)
                  ? "border-primary bg-primary/10"
                  : "border-outline-variant/30 bg-surface-container"
              }`}
            >
              <input
                type="checkbox"
                checked={selecionados.has(i)}
                onChange={() => toggleCenario(i)}
                className="accent-primary"
              />
              <span className="text-sm">{c.nome}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Stress table */}
      {resultados.length > 0 && (
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-3">Resultado do Stress Test</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs">
                  <th className="text-left py-2 px-3">Cenário</th>
                  <th className="text-right py-2 px-3">P&amp;L Total (R$)</th>
                  <th className="text-right py-2 px-3">P&amp;L (%)</th>
                  <th className="text-left py-2 px-3">Pior título</th>
                  <th className="text-left py-2 px-3">Melhor título</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r) => (
                  <tr key={r.cenario} className="border-b border-outline-variant/10">
                    <td className="py-2 px-3 font-bold">{r.cenario}</td>
                    <td
                      className={`text-right py-2 px-3 font-bold ${
                        r.plTotal >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {fmtBrl(r.plTotal)}
                    </td>
                    <td
                      className={`text-right py-2 px-3 ${
                        r.plPct >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {fmtPct(r.plPct)}
                    </td>
                    <td className="py-2 px-3 text-red-400">{r.pior}</td>
                    <td className="py-2 px-3 text-green-400">{r.melhor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Horizontal bar chart */}
      {resultados.length > 0 && (
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-4">P&amp;L por Cenário</h3>
          <PlotlyChart
            className="h-[400px]"
            data={[
              {
                y: resultados.map((r) => r.cenario),
                x: resultados.map((r) => r.plTotal),
                type: "bar" as const,
                orientation: "h" as const,
                marker: {
                  color: resultados.map((r) =>
                    r.plTotal >= 0 ? "#2E8B57" : "#CC3333",
                  ),
                },
                hovertemplate: "%{y}: R$ %{x:,.0f}<extra></extra>",
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              xaxis: {
                ...PLOTLY_LAYOUT.xaxis,
                title: { text: "P&L (R$)", font: { size: 12, color: "#aaabb0" } },
              },
              yaxis: {
                ...PLOTLY_LAYOUT.yaxis,
                automargin: true,
              },
              margin: { ...PLOTLY_LAYOUT.margin, l: 250 },
            }}
            config={PLOTLY_CONFIG}
          />
        </div>
      )}

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-tertiary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Nota regulatória:</strong> O stress test
          é ferramenta regulatória obrigatória (ICAAP/IRRBB). Bancos devem manter
          capital suficiente para absorver perdas em cenários adversos definidos pelo
          regulador (BCB). Os cenários padronizados incluem choques paralelos de
          +/-200 bps, além de cenários de empinamento, achatamento e estresse severo,
          conforme Resolução CMN 4.557 e Circular BCB 3.876.
        </p>
      </div>
    </div>
  );
}
