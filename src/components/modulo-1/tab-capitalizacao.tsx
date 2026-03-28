"use client";

import { useState } from "react";
import { Math as KMath } from "@/components/math";
import { taxaEquivalente } from "@/lib/finance";
import { diasUteis, diasCorridos } from "@/lib/holidays";
import { fmtPct, fmtBrl, fmtNum } from "@/lib/format";
import type { Base } from "@/lib/finance";

const BASES: { label: string; key: Base }[] = [
  { label: "% ao ano (252 DU)", key: "anual_252" },
  { label: "% ao ano (360 DC)", key: "anual_360" },
  { label: "% ao mês", key: "mensal" },
  { label: "% ao dia (over)", key: "diaria" },
];

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

interface MetricCardProps {
  label: string;
  value: string;
  highlight?: boolean;
  badge?: string;
}

function MetricCard({ label, value, highlight, badge }: MetricCardProps) {
  return (
    <div
      className={`glass-card rounded-lg p-4 flex flex-col gap-1 ${
        highlight ? "border border-primary/40" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-label text-on-surface-variant">{label}</span>
        {badge && (
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-label">
            {badge}
          </span>
        )}
      </div>
      <span
        className={`text-xl font-headline font-bold ${
          highlight ? "text-primary" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function TabCapitalizacao() {
  const [txIn, setTxIn] = useState(13.75);
  const [baseDe, setBaseDe] = useState<number>(0);
  const [basePara, setBasePara] = useState<string>("todas");

  const [principal, setPrincipal] = useState(1_000_000);
  const [txAnual, setTxAnual] = useState(13.75);
  const [dataIni, setDataIni] = useState("2024-07-01");
  const [dataFim, setDataFim] = useState("2025-01-02");

  const taxaDecimal = txIn / 100;
  const sourceBase = BASES[baseDe].key;

  // Compute all conversions
  const conversions = BASES.map((b) => ({
    ...b,
    value:
      b.key === sourceBase
        ? taxaDecimal
        : taxaEquivalente(taxaDecimal, sourceBase, b.key),
    isSource: b.key === sourceBase,
  }));

  const singleTarget =
    basePara !== "todas"
      ? conversions.find((c) => c.key === basePara)
      : null;

  // Step-by-step for single conversion
  function buildSteps(from: Base, to: Base, taxa: number): string[] {
    const steps: string[] = [];
    const daily = Math.pow(1 + taxa, 1 / 252) - 1;
    steps.push(
      `Taxa diária: (1 + ${fmtPct(taxa, 4)})^(1/252) − 1 = ${fmtPct(daily, 6)}`
    );
    const result = taxaEquivalente(taxa, from, to);
    steps.push(
      `Taxa ${to}: (1 + ${fmtPct(daily, 6)})^(dias_${to}) − 1 = ${fmtPct(result, 4)}`
    );
    return steps;
  }

  // Convention comparison
  const d1 = new Date(dataIni + "T12:00:00");
  const d2 = new Date(dataFim + "T12:00:00");
  const du = d1 < d2 ? diasUteis(d1, d2) : 0;
  const dc = d1 < d2 ? diasCorridos(d1, d2) : 0;

  const txAnualDec = txAnual / 100;
  const fatorDU = Math.pow(1 + txAnualDec, du / 252);
  const fatorDC = 1 + txAnualDec * (dc / 360);
  const vfDU = principal * fatorDU;
  const vfDC = principal * fatorDC;
  const diffRs = vfDU - vfDC;
  const diffBps = ((fatorDU - fatorDC) / fatorDC) * 10000;
  const diff10bi = diffRs * (10_000_000_000 / principal);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: Capitalização Composta e Convenções de Prazo
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            Na capitalização composta, os juros de cada período se incorporam ao
            principal e passam a render juros nos períodos seguintes. É a
            convenção padrão do mercado financeiro brasileiro para instrumentos
            prefixados (DU/252) e pós-fixados.
          </p>
          <p>
            O mercado brasileiro utiliza duas convenções de prazo distintas:
            <strong className="text-on-surface"> DU/252</strong> (dias úteis sobre
            252) para instrumentos de renda fixa prefixada, e{" "}
            <strong className="text-on-surface">DC/360</strong> (dias corridos sobre
            360) para instrumentos cambiais e de renda variável.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <div>
              <p className="font-label text-on-surface mb-1">Valor Futuro (geral):</p>
              <KMath tex="VF = VP \times (1 + i)^n" />
            </div>
            <div>
              <p className="font-label text-on-surface mb-1">Taxa equivalente:</p>
              <KMath tex="i_{eq} = (1 + i_{orig})^{\,n_{eq}/n_{orig}} - 1" />
            </div>
            <div>
              <p className="font-label text-on-surface mb-1">Fator DU/252 (composto):</p>
              <KMath tex="\text{Fator}_{DU} = (1 + i_{aa})^{DU/252}" />
            </div>
            <div>
              <p className="font-label text-on-surface mb-1">Fator DC/360 (linear):</p>
              <KMath tex="\text{Fator}_{DC} = 1 + i_{aa} \times DC/360" />
            </div>
          </div>
        </div>
      </details>

      {/* Rate Converter */}
      <section className="space-y-5">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            currency_exchange
          </span>
          Conversor de Taxas Equivalentes
        </h2>

        <div className="glass-card rounded-lg p-5 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Taxa de entrada (%)
              </label>
              <input
                type="number"
                value={txIn}
                onChange={(e) => setTxIn(Number(e.target.value))}
                step={0.25}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Base de origem
              </label>
              <select
                value={baseDe}
                onChange={(e) => setBaseDe(Number(e.target.value))}
                className={INPUT_CLASS}
              >
                {BASES.map((b, i) => (
                  <option key={b.key} value={i}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Base de destino
              </label>
              <select
                value={basePara}
                onChange={(e) => setBasePara(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="todas">Todas</option>
                {BASES.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* "Todas" mode: 4 cards + table */}
        {basePara === "todas" ? (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {conversions.map((c) => (
                <MetricCard
                  key={c.key}
                  label={c.label}
                  value={fmtPct(c.value, 4)}
                  highlight={!c.isSource}
                  badge={c.isSource ? "✅ origem" : undefined}
                />
              ))}
            </div>
            <div className="glass-card rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container">
                    <th className="text-left px-4 py-3 font-label text-on-surface-variant">
                      Base
                    </th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                      Taxa Equivalente
                    </th>
                    <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                      Fator diário
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {conversions.map((c, i) => {
                    const dailyFactor = Math.pow(1 + c.value, 1 / (c.key === "anual_252" ? 252 : c.key === "anual_360" ? 360 : c.key === "mensal" ? 21 : 1));
                    return (
                      <tr
                        key={c.key}
                        className={`border-b border-outline-variant/20 ${
                          c.isSource ? "bg-primary/5" : ""
                        } ${i % 2 === 0 && !c.isSource ? "bg-surface-container/40" : ""}`}
                      >
                        <td className="px-4 py-3 font-label">
                          {c.label}
                          {c.isSource && (
                            <span className="ml-2 text-xs text-primary">✅</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-headline font-bold">
                          {fmtPct(c.value, 4)}
                        </td>
                        <td className="px-4 py-3 text-right text-on-surface-variant">
                          {fmtNum(dailyFactor)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : singleTarget ? (
          /* Single conversion mode: 2 cards + step-by-step */
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <MetricCard
                label={`${BASES[baseDe].label} (origem)`}
                value={fmtPct(taxaDecimal, 4)}
                badge="✅ origem"
              />
              <MetricCard
                label={`${singleTarget.label} (convertida)`}
                value={fmtPct(singleTarget.value, 4)}
                highlight
              />
            </div>
            <details className="glass-card rounded-lg">
              <summary className="px-4 py-3 cursor-pointer text-sm font-label text-on-surface-variant select-none hover:text-on-surface">
                Ver passo a passo da conversão
              </summary>
              <div className="px-4 pb-4 space-y-2">
                {buildSteps(sourceBase, singleTarget.key, taxaDecimal).map(
                  (step, i) => (
                    <div
                      key={i}
                      className="flex gap-3 text-sm text-on-surface-variant"
                    >
                      <span className="text-primary font-bold font-label w-5 shrink-0">
                        {i + 1}.
                      </span>
                      <span>{step}</span>
                    </div>
                  )
                )}
              </div>
            </details>
          </div>
        ) : null}
      </section>

      {/* Convention Comparison */}
      <section className="space-y-5">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            compare_arrows
          </span>
          Comparação de Convenções: DU/252 vs DC/360
        </h2>

        <div className="glass-card rounded-lg p-5 space-y-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Principal (R$)
              </label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                step={100000}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Taxa anual (%)
              </label>
              <input
                type="number"
                value={txAnual}
                onChange={(e) => setTxAnual(Number(e.target.value))}
                step={0.25}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Data inicial
              </label>
              <input
                type="date"
                value={dataIni}
                onChange={(e) => setDataIni(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Data final
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* DU/252 card */}
          <div className="glass-card rounded-lg p-5 border-t-2 border-[#2E75B6]">
            <h3 className="font-headline font-bold mb-3 text-[#2E75B6]">
              DU/252 — Composto (padrão renda fixa)
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Dias úteis:</span>
                <span className="font-label font-bold">{du} DU</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Fator:</span>
                <span className="font-label font-bold">
                  {fatorDU.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/20 pt-2">
                <span className="text-on-surface-variant">Valor Futuro:</span>
                <span className="font-headline font-bold text-base">
                  {fmtBrl(vfDU)}
                </span>
              </div>
            </div>
          </div>

          {/* DC/360 card */}
          <div className="glass-card rounded-lg p-5 border-t-2 border-[#C55A11]">
            <h3 className="font-headline font-bold mb-3 text-[#C55A11]">
              DC/360 — Linear (câmbio e derivativos)
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Dias corridos:</span>
                <span className="font-label font-bold">{dc} DC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Fator:</span>
                <span className="font-label font-bold">
                  {fatorDC.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/20 pt-2">
                <span className="text-on-surface-variant">Valor Futuro:</span>
                <span className="font-headline font-bold text-base">
                  {fmtBrl(vfDC)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Difference info box */}
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
          <p className="font-label font-bold text-sm mb-1">
            Impacto da convenção
          </p>
          <p className="text-sm text-on-surface-variant">
            Diferença DU/252 − DC/360:{" "}
            <strong
              className={
                diffRs >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"
              }
            >
              {fmtBrl(diffRs)}
            </strong>{" "}
            ({diffBps >= 0 ? "+" : ""}{fmtNum(diffBps)} bps) — para um principal de{" "}
            <strong>R$ 10 bi</strong>, a diferença seria de{" "}
            <strong
              className={
                diff10bi >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"
              }
            >
              {fmtBrl(diff10bi)}
            </strong>
            . A escolha da convenção é crítica em operações de grande porte.
          </p>
        </div>
      </section>
    </div>
  );
}
