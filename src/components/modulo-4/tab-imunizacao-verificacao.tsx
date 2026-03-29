"use client";

import { useMemo, useState } from "react";
import { simularImunizacao } from "@/lib/finance";
import { fmtBrl, fmtPct } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";
import type { ImunData } from "@/components/modulo-4/tab-imunizacao-construtor";

export function TabImunizacaoVerificacao({
  imun,
}: {
  imun: ImunData | null;
}) {
  const [choque, setChoque] = useState(0);

  const choques = useMemo(() => {
    const arr: number[] = [];
    for (let c = -300; c <= 300; c += 25) arr.push(c);
    return arr;
  }, []);

  const series = useMemo(() => {
    if (!imun) return null;

    const { dC, dL, txC, txL, wC, vp, horizonte, vf } = imun;

    const imunizada = choques.map((c) =>
      simularImunizacao(dC, dL, txC, txL, wC, vp, horizonte, c),
    );
    const soCurto = choques.map((c) =>
      simularImunizacao(dC, dC, txC, txC, 1.0, vp, horizonte, c),
    );
    const soLongo = choques.map((c) =>
      simularImunizacao(dL, dL, txL, txL, 1.0, vp, horizonte, c),
    );

    return { imunizada, soCurto, soLongo, vf };
  }, [imun, choques]);

  const comparison = useMemo(() => {
    if (!imun || !series) return null;

    const { vf } = imun;
    const idx = choques.indexOf(choque);
    if (idx < 0) return null;

    const valImun = series.imunizada[idx].valorFinal;
    const valCurto = series.soCurto[idx].valorFinal;
    const valLongo = series.soLongo[idx].valorFinal;

    return [
      {
        nome: "Imunizada",
        valor: valImun,
        diff: valImun - vf,
        desvio: ((valImun - vf) / vf) * 100,
      },
      {
        nome: "So curto",
        valor: valCurto,
        diff: valCurto - vf,
        desvio: ((valCurto - vf) / vf) * 100,
      },
      {
        nome: "So longo",
        valor: valLongo,
        diff: valLongo - vf,
        desvio: ((valLongo - vf) / vf) * 100,
      },
    ];
  }, [imun, series, choque, choques]);

  if (!imun) {
    return (
      <div className="glass-card rounded-lg p-8 text-center">
        <p className="text-on-surface-variant text-sm">
          Configure a carteira imunizada na aba anterior.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Shock slider */}
      <div className="glass-card rounded-lg p-4">
        <label className="block text-xs font-label text-on-surface-variant mb-2">
          Choque paralelo (bps): {choque >= 0 ? "+" : ""}
          {choque} bps
        </label>
        <input
          type="range"
          min={-300}
          max={300}
          step={25}
          value={choque}
          onChange={(e) => setChoque(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-on-surface-variant mt-1">
          <span>-300 bps</span>
          <span>0</span>
          <span>+300 bps</span>
        </div>
      </div>

      {/* Chart */}
      {series && (
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-4">
            Valor Acumulado vs. Choque de Taxas
          </h3>
          <PlotlyChart
            className="h-[450px]"
            data={[
              {
                x: choques,
                y: series.imunizada.map((s) => s.valorFinal),
                type: "scatter" as const,
                mode: "lines" as const,
                name: "Imunizada",
                line: { color: "#2E8B57", width: 3 },
                hovertemplate:
                  "Choque: %{x} bps<br>Valor: R$ %{y:,.0f}<extra>Imunizada</extra>",
              },
              {
                x: choques,
                y: series.soCurto.map((s) => s.valorFinal),
                type: "scatter" as const,
                mode: "lines" as const,
                name: "So curto",
                line: { color: "#2E75B6", width: 2, dash: "dash" as const },
                hovertemplate:
                  "Choque: %{x} bps<br>Valor: R$ %{y:,.0f}<extra>So curto</extra>",
              },
              {
                x: choques,
                y: series.soLongo.map((s) => s.valorFinal),
                type: "scatter" as const,
                mode: "lines" as const,
                name: "So longo",
                line: { color: "#C55A11", width: 2, dash: "dash" as const },
                hovertemplate:
                  "Choque: %{x} bps<br>Valor: R$ %{y:,.0f}<extra>So longo</extra>",
              },
              {
                x: [choques[0], choques[choques.length - 1]],
                y: [series.vf, series.vf],
                type: "scatter" as const,
                mode: "lines" as const,
                name: "Valor-alvo",
                line: { color: "#888", width: 1, dash: "dot" as const },
                hoverinfo: "skip" as const,
              },
              {
                x: [choque, choque],
                y: [
                  Math.min(
                    ...series.imunizada.map((s) => s.valorFinal),
                    ...series.soCurto.map((s) => s.valorFinal),
                    ...series.soLongo.map((s) => s.valorFinal),
                  ) * 0.98,
                  Math.max(
                    ...series.imunizada.map((s) => s.valorFinal),
                    ...series.soCurto.map((s) => s.valorFinal),
                    ...series.soLongo.map((s) => s.valorFinal),
                  ) * 1.02,
                ],
                type: "scatter" as const,
                mode: "lines" as const,
                name: "Choque selecionado",
                line: { color: "#888", width: 1, dash: "dot" as const },
                showlegend: false,
                hoverinfo: "skip" as const,
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT,
              xaxis: {
                ...PLOTLY_LAYOUT.xaxis,
                title: {
                  text: "Choque (bps)",
                  font: { size: 12, color: "#aaabb0" },
                },
              },
              yaxis: {
                ...PLOTLY_LAYOUT.yaxis,
                title: {
                  text: "Valor acumulado (R$)",
                  font: { size: 12, color: "#aaabb0" },
                },
              },
              showlegend: true,
              legend: {
                font: { color: "#aaabb0", size: 11 },
                orientation: "h" as const,
                x: 0.5,
                xanchor: "center" as const,
                y: -0.15,
              },
            }}
            config={PLOTLY_CONFIG}
          />
        </div>
      )}

      {/* Comparison table */}
      {comparison && (
        <div className="glass-card rounded-lg p-4">
          <h3 className="font-headline font-bold text-sm mb-3">
            Comparação para choque de {choque >= 0 ? "+" : ""}
            {choque} bps
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs">
                  <th className="text-left py-2 px-3">Estratégia</th>
                  <th className="text-right py-2 px-3">Valor acum.</th>
                  <th className="text-right py-2 px-3">Diff vs alvo</th>
                  <th className="text-right py-2 px-3">Desvio %</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr
                    key={row.nome}
                    className="border-b border-outline-variant/10"
                  >
                    <td className="py-2 px-3 font-bold">{row.nome}</td>
                    <td className="text-right py-2 px-3">{fmtBrl(row.valor)}</td>
                    <td
                      className={`text-right py-2 px-3 font-bold ${
                        row.diff >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {fmtBrl(row.diff)}
                    </td>
                    <td
                      className={`text-right py-2 px-3 ${
                        Math.abs(row.desvio) < 1
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {fmtPct(row.desvio)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Por que funciona expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            lightbulb
          </span>
          Por que funciona?
        </summary>
        <div className="px-5 pb-5 space-y-3 text-sm text-on-surface-variant">
          <div>
            <p className="font-bold text-on-surface mb-1">
              Efeito MtM (Mark-to-Market)
            </p>
            <p>
              Quando as taxas sobem, o preço dos títulos cai. A perda é
              proporcional à duration: quanto maior a duration, maior a perda.
              Quando as taxas caem, o efeito é inverso &mdash; ganho de MtM.
            </p>
          </div>
          <div>
            <p className="font-bold text-on-surface mb-1">
              Efeito de Reinvestimento
            </p>
            <p>
              Quando as taxas sobem, os fluxos intermediários são reinvestidos a
              taxas maiores, gerando ganho adicional ao longo do horizonte. Na
              queda, o reinvestimento rende menos.
            </p>
          </div>
          <div>
            <p className="font-bold text-on-surface mb-1">
              Resultado Líquido &asymp; 0
            </p>
            <p>
              Quando a duration da carteira é igual ao horizonte da obrigação, os
              dois efeitos se anulam aproximadamente. O valor acumulado fica
              próximo do alvo independentemente do choque &mdash; por isso a linha
              verde é quase plana no gráfico.
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}
