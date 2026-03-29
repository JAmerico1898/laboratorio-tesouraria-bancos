"use client";

import { useState, useMemo } from "react";
import { precificarLf, type LfResult } from "@/lib/finance";
import { fmtBrl, fmtNum, fmtPct } from "@/lib/format";
import { Math as KMath } from "@/components/math";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const BANKING_TEAL = "#0E7C7B";

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

export function TabLfDpge() {
  const [tipo, setTipo] = useState<"Sênior" | "Subordinada">("Sênior");
  const [spreadBps, setSpreadBps] = useState(80);
  const [prazoAnos, setPrazoAnos] = useState(3);
  const [volume, setVolume] = useState(5000000);

  const result: LfResult = useMemo(
    () => precificarLf(spreadBps, prazoAnos, volume, tipo),
    [spreadBps, prazoAnos, volume, tipo],
  );

  // Subordination comparison
  const seniorSpread = useMemo(
    () => Math.max(0, spreadBps - 60),
    [spreadBps],
  );
  const seniorResult: LfResult = useMemo(
    () => precificarLf(seniorSpread, prazoAnos, volume, "Sênior"),
    [seniorSpread, prazoAnos, volume],
  );
  const premiumBps = spreadBps - seniorSpread;

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: Letra Financeira e DPGE
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            A <strong className="text-on-surface">Letra Financeira (LF)</strong>{" "}
            e um titulo de divida emitido por IFs com prazo minimo de 2 anos.
            Existe em duas modalidades:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong className="text-on-surface">Senior:</strong> prioridade
              no pagamento em caso de liquidacao
            </li>
            <li>
              <strong className="text-on-surface">Subordinada (Tier 2):</strong>{" "}
              absorve perdas antes da senior — paga premio adicional
            </li>
          </ul>
          <div className="mt-2">
            <p className="font-label text-on-surface mb-1">Precificacao:</p>
            <KMath tex="PU = \frac{Volume}{(1 + spread)^{DU/252}}" />
          </div>
          <p>
            O <strong className="text-on-surface">DPGE</strong> (Deposito a
            Prazo com Garantia Especial) e similar, mas com garantia do FGC
            ate R$ 40 milhoes por IF.
          </p>
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
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Tipo de LF
              </label>
              <select
                value={tipo}
                onChange={(e) =>
                  setTipo(e.target.value as "Sênior" | "Subordinada")
                }
                className={INPUT_CLASS}
              >
                <option value="Sênior">Senior</option>
                <option value="Subordinada">Subordinada (Tier 2)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Spread sobre CDI (bps)
              </label>
              <input
                type="number"
                value={spreadBps}
                onChange={(e) => setSpreadBps(Number(e.target.value))}
                step={5}
                min={0}
                className={INPUT_CLASS}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Prazo (anos, min. 2)
              </label>
              <input
                type="number"
                value={prazoAnos}
                onChange={(e) =>
                  setPrazoAnos(Math.max(2, Number(e.target.value)))
                }
                step={0.5}
                min={2}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Volume (R$)
              </label>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                step={1000000}
                min={0}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        <MetricCard
          label="PU"
          value={fmtBrl(result.pu)}
          sub={`Volume: ${fmtBrl(volume)}`}
        />
        <MetricCard
          label="Taxa efetiva (CDI+)"
          value={`CDI + ${fmtNum(result.taxaEfetiva * 100)} bps`}
          sub={tipo}
          colorClass={`text-[${BANKING_TEAL}]`}
        />
        <MetricCard
          label="Duration"
          value={`${fmtNum(result.duration)} anos`}
          sub={`${Math.round(result.duration * 252)} DU`}
        />
      </div>

      {/* Subordination comparison box */}
      {tipo === "Subordinada" && (
        <div className="glass-card rounded-lg p-5 border-l-4 border-[#C55A11]">
          <h3 className="font-headline font-bold text-sm flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#C55A11] text-base">
              warning
            </span>
            Comparativo: Subordinada vs Senior
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <span className="text-xs font-label text-on-surface-variant">
                Spread Subordinada
              </span>
              <div className="text-lg font-headline font-bold text-[#C55A11]">
                {spreadBps} bps
              </div>
            </div>
            <div className="text-center">
              <span className="text-xs font-label text-on-surface-variant">
                Spread Senior (est.)
              </span>
              <div className="text-lg font-headline font-bold text-[#2E75B6]">
                {seniorSpread} bps
              </div>
            </div>
            <div className="text-center">
              <span className="text-xs font-label text-on-surface-variant">
                Premio subordinacao
              </span>
              <div className="text-lg font-headline font-bold text-[#2E8B57]">
                {premiumBps} bps
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <span className="text-xs font-label text-on-surface-variant">
                PU Subordinada
              </span>
              <div className="text-base font-bold">
                {fmtBrl(result.pu)}
              </div>
            </div>
            <div className="text-center">
              <span className="text-xs font-label text-on-surface-variant">
                PU Senior (est.)
              </span>
              <div className="text-base font-bold">
                {fmtBrl(seniorResult.pu)}
              </div>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant">
            <strong className="text-on-surface">Risco de absorcao de perdas:</strong>{" "}
            Em caso de RAET (Regime de Administracao Especial Temporaria) ou
            liquidacao extrajudicial, a LF subordinada absorve perdas antes da
            senior. O premio de {premiumBps} bps compensa esse risco
            adicional. O investidor deve avaliar se o premio e adequado ao
            perfil de risco da IF emissora.
          </p>
        </div>
      )}

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Nota pedagogica:</strong> A Letra
          Financeira e um instrumento de captacao de medio/longo prazo para IFs,
          com prazo minimo de 2 anos. A modalidade subordinada (Tier 2) paga
          premio adicional porque absorve perdas em caso de dificuldades
          financeiras da instituicao. Para a tesouraria, a analise deve ponderar
          o premio de subordinacao contra o risco de credito do emissor e a
          liquidez do instrumento. O DPGE, com garantia do FGC, costuma pagar
          spreads menores.
        </p>
      </div>
    </div>
  );
}
