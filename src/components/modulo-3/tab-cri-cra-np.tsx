"use client";

import { useState, useMemo } from "react";
import {
  precificarCreditoGenerico,
  type CreditoGenericoResult,
} from "@/lib/finance";
import { fmtNum } from "@/lib/format";
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

const INSTRUMENT_NOTES: Record<string, { icon: string; text: string }> = {
  CRI: {
    icon: "apartment",
    text: "Mesma logica de precificacao de debentures, com analise adicional de lastro, subordinacao e risco de pre-pagamento.",
  },
  CRA: {
    icon: "agriculture",
    text: "Mesma logica de precificacao de debentures, com analise adicional de lastro, subordinacao e risco de pre-pagamento.",
  },
  "Nota Promissoria": {
    icon: "receipt_long",
    text: "Instrumento de curto prazo (ate 360 dias), zero cupom. Foco na qualidade de credito e maturidade curta.",
  },
};

export function TabCriCraNp() {
  const [instrumento, setInstrumento] = useState("CRI");
  const [indexador, setIndexador] = useState("CDI+spread");
  const [spreadTaxa, setSpreadTaxa] = useState(2.5);
  const [prazo, setPrazo] = useState(2);
  const [estrutura, setEstrutura] = useState("Bullet");
  const [volume, setVolume] = useState(1000000);

  const result: CreditoGenericoResult = useMemo(
    () => precificarCreditoGenerico(indexador, spreadTaxa, prazo, volume, estrutura),
    [indexador, spreadTaxa, prazo, volume, estrutura],
  );

  const note = INSTRUMENT_NOTES[instrumento];

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: CRI, CRA e Notas Promissorias
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            <strong className="text-on-surface">CRI/CRA</strong> sao titulos de
            securitizacao — lastreados em recebiveis imobiliarios (CRI) ou do
            agronegocio (CRA). A <strong className="text-on-surface">Nota
            Promissoria</strong> e um instrumento de divida de curto prazo,
            tipicamente zero cupom.
          </p>
          <div className="mt-2">
            <p className="font-label text-on-surface mb-1">Precificacao generica:</p>
            <KMath tex="PU = \frac{Volume}{(1 + taxa)^{DU/252}}" />
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              CRI/CRA: isentos de IR para pessoa fisica — atratividade adicional
            </li>
            <li>
              NP: prazo maximo de 360 dias, foco na qualidade de credito
            </li>
            <li>
              Todos exigem analise de lastro, garantias e rating
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
          Parametros de Precificacao
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Instrumento
              </label>
              <select
                value={instrumento}
                onChange={(e) => setInstrumento(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="CRI">CRI</option>
                <option value="CRA">CRA</option>
                <option value="Nota Promissoria">Nota Promissoria</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Indexador
              </label>
              <select
                value={indexador}
                onChange={(e) => setIndexador(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="CDI+spread">CDI + spread</option>
                <option value="IPCA+spread">IPCA + spread</option>
                <option value="Prefixado">Prefixado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Spread / taxa (% a.a.)
              </label>
              <input
                type="number"
                value={spreadTaxa}
                onChange={(e) => setSpreadTaxa(Number(e.target.value))}
                step={0.1}
                className={INPUT_CLASS}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Prazo (anos)
              </label>
              <input
                type="number"
                value={prazo}
                onChange={(e) => setPrazo(Number(e.target.value))}
                step={0.5}
                min={0.5}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Estrutura
              </label>
              <select
                value={estrutura}
                onChange={(e) => setEstrutura(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="Bullet">Bullet</option>
                <option value="Cupom semestral">Cupom semestral</option>
                <option value="Amortizacao semestral">Amortizacao semestral</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Volume (R$)
              </label>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                step={100000}
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
          value={`R$ ${fmtNum(result.pu)}`}
          sub="Preco unitario"
        />
        <MetricCard
          label="Taxa efetiva"
          value={`${fmtNum(result.taxa)}% a.a.`}
          sub="Taxa total"
        />
        <MetricCard
          label="Duration"
          value={`${fmtNum(result.duration)} anos`}
          sub="Duracao"
        />
      </div>

      {/* Instrument-specific note */}
      {note && (
        <div className="glass-card rounded-lg p-4 border-l-4 border-[#C55A11]">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#C55A11] mt-0.5">
              {note.icon}
            </span>
            <p className="text-sm text-on-surface-variant">
              <strong className="text-on-surface">{instrumento}:</strong>{" "}
              {note.text}
            </p>
          </div>
        </div>
      )}

      {/* Pedagogical note */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Nota pedagogica:</strong> O
          mercado de credito privado corporativo (debentures, CRI, CRA, NP) segue
          a mesma logica de precificacao dos titulos publicos, acrescida de um
          spread que reflete risco de credito, liquidez e complexidade
          estrutural. A analise deve sempre comparar o retorno oferecido com o
          benchmark soberano equivalente.
        </p>
      </div>
    </div>
  );
}
