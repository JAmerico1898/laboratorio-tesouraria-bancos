"use client";

import { useState, useMemo } from "react";
import { equivalenciaFiscal, aliquotaIr, type EquivalenciaFiscalResult } from "@/lib/finance";
import { fmtPct, fmtNum } from "@/lib/format";
import { Math as KMath } from "@/components/math";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  colorClass?: string;
}

function MetricCard({ label, value, sub, colorClass }: MetricCardProps) {
  return (
    <div className="glass-card rounded-lg p-4 text-center">
      <span className="text-xs font-label text-on-surface-variant">{label}</span>
      <div className={`text-xl font-headline font-bold mt-1 ${colorClass ?? ""}`}>
        {value}
      </div>
      {sub && (
        <span className="text-xs text-on-surface-variant">{sub}</span>
      )}
    </div>
  );
}

const IR_BRACKETS = [
  { prazo: 180, label: "ate 180 DC" },
  { prazo: 360, label: "181-360 DC" },
  { prazo: 720, label: "361-720 DC" },
  { prazo: 1080, label: "> 720 DC" },
];

export function TabLciLca() {
  const [taxaLci, setTaxaLci] = useState(93);
  const [prazoDc, setPrazoDc] = useState(365);
  const [tipoInvestidor, setTipoInvestidor] = useState<"PF" | "PJ">("PF");

  const result: EquivalenciaFiscalResult = useMemo(
    () => equivalenciaFiscal(taxaLci, prazoDc, tipoInvestidor),
    [taxaLci, prazoDc, tipoInvestidor],
  );

  // Comparison table data across all IR brackets
  const tabelaComparativa = useMemo(() => {
    return IR_BRACKETS.map(({ prazo, label }) => {
      const aliq = aliquotaIr(prazo);
      const equiv = equivalenciaFiscal(taxaLci, prazo, tipoInvestidor);
      // CDB 100% CDI liquido = 100 * (1 - aliquota) for PF, 100 for PJ
      const cdbLiq = tipoInvestidor === "PF" ? 100 * (1 - aliq) : 100;
      const diff = taxaLci - cdbLiq;
      return {
        label,
        prazo,
        irPct: aliq * 100,
        taxaLci,
        taxaBrutaEquiv: equiv.taxaBrutaEquiv,
        cdbLiq,
        diff,
      };
    });
  }, [taxaLci, tipoInvestidor]);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: LCI/LCA — Equivalencia Fiscal
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            <strong className="text-on-surface">LCI</strong> (Letra de Credito
            Imobiliario) e <strong className="text-on-surface">LCA</strong>{" "}
            (Letra de Credito do Agronegocio) sao isentas de IR para pessoa
            fisica. Para comparar com CDB, e necessario calcular a taxa bruta
            equivalente.
          </p>
          <div className="mt-2">
            <p className="font-label text-on-surface mb-1">Formula de equivalencia:</p>
            <KMath tex="taxa_{bruta} = \frac{taxa_{LCI}}{1 - alíquota_{IR}}" />
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              A isencao de IR vale apenas para <strong className="text-on-surface">pessoa fisica</strong>
            </li>
            <li>
              Quanto maior a aliquota de IR (prazos curtos), maior a vantagem
              da LCI/LCA
            </li>
          </ul>
        </div>
      </details>

      {/* Inputs */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        <h2 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            calculate
          </span>
          Parametros
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Taxa LCI/LCA (% CDI)
            </label>
            <input
              type="number"
              value={taxaLci}
              onChange={(e) => setTaxaLci(Number(e.target.value))}
              step={1}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Prazo (dias corridos): {prazoDc}
            </label>
            <input
              type="range"
              value={prazoDc}
              onChange={(e) => setPrazoDc(Number(e.target.value))}
              min={30}
              max={1080}
              step={30}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-on-surface-variant mt-1">
              <span>30 DC</span>
              <span>1080 DC</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Tipo de investidor
            </label>
            <select
              value={tipoInvestidor}
              onChange={(e) => setTipoInvestidor(e.target.value as "PF" | "PJ")}
              className={INPUT_CLASS}
            >
              <option value="PF">Pessoa Fisica (PF)</option>
              <option value="PJ">Pessoa Juridica (PJ)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Metric cards */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Aliquota IR"
          value={fmtPct(result.aliquota / 100, 1)}
          sub={tipoInvestidor === "PJ" ? "PJ paga IR" : `Prazo ${prazoDc} DC`}
        />
        <MetricCard
          label="Taxa bruta equiv"
          value={`${fmtNum(result.taxaBrutaEquiv)}% CDI`}
          sub="CDB equivalente"
        />
        <MetricCard
          label="Taxa LCI/LCA"
          value={`${fmtNum(result.taxaIsenta)}% CDI`}
          sub="Isenta para PF"
        />
        <MetricCard
          label="Vantagem"
          value={tipoInvestidor === "PF" ? `${fmtNum(result.vantagemBps)} bps` : "0 bps"}
          sub={tipoInvestidor === "PF" ? "Beneficio fiscal" : "Sem isencao PJ"}
          colorClass={tipoInvestidor === "PF" && result.vantagemBps > 0 ? "text-[#2E8B57]" : ""}
        />
      </div>

      {/* Comparison table */}
      <div className="glass-card rounded-lg p-4 overflow-x-auto">
        <h3 className="font-label font-bold text-sm mb-3 text-on-surface-variant">
          Tabela comparativa por faixa de IR
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/30 text-on-surface-variant">
              <th className="text-left py-2 px-3 font-label">Prazo</th>
              <th className="text-right py-2 px-3 font-label">IR %</th>
              <th className="text-right py-2 px-3 font-label">Taxa LCI</th>
              <th className="text-right py-2 px-3 font-label">Bruta equiv</th>
              <th className="text-right py-2 px-3 font-label">CDB 100% liq</th>
              <th className="text-right py-2 px-3 font-label">Diferenca</th>
            </tr>
          </thead>
          <tbody>
            {tabelaComparativa.map((row) => (
              <tr
                key={row.prazo}
                className="border-b border-outline-variant/10 hover:bg-surface-container/50"
              >
                <td className="py-2 px-3 text-on-surface">{row.label}</td>
                <td className="py-2 px-3 text-right">{fmtPct(row.irPct / 100, 1)}</td>
                <td className="py-2 px-3 text-right">{fmtNum(row.taxaLci)}%</td>
                <td className="py-2 px-3 text-right font-bold">
                  {fmtNum(row.taxaBrutaEquiv)}%
                </td>
                <td className="py-2 px-3 text-right">{fmtNum(row.cdbLiq)}%</td>
                <td
                  className={`py-2 px-3 text-right font-bold ${
                    row.diff > 0 ? "text-[#2E8B57]" : row.diff < 0 ? "text-[#CC3333]" : ""
                  }`}
                >
                  {row.diff >= 0 ? "+" : ""}{fmtNum(row.diff)} pp
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Nota pedagogica:</strong>{" "}
          {tipoInvestidor === "PF" ? (
            <>
              Para pessoa fisica, uma LCI/LCA a {fmtNum(taxaLci)}% do CDI
              equivale a um CDB a {fmtNum(result.taxaBrutaEquiv)}% do CDI bruto.
              Quanto menor o prazo (maior a aliquota de IR), maior o beneficio
              da isencao fiscal. A tabela acima permite comparar a vantagem em
              cada faixa.
            </>
          ) : (
            <>
              Para a tesouraria (PJ), a LCI/LCA nao tem beneficio fiscal — o
              rendimento e tributado normalmente pelo IR. A decisao de alocacao
              deve considerar apenas o spread e o risco de credito do emissor,
              sem vantagem de equivalencia fiscal.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
